const { Buffer } = require("node:buffer");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://tnxdulqdfanzlawuonmf.supabase.co";
const ADMIN_ACCESS_CODE = process.env.ADMIN_ACCESS_CODE;

function getSupabaseKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
}

async function readJson(request) {
  return typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};
}

async function supabaseFetch(path, options = {}) {
  const supabaseKey = getSupabaseKey();

  if (!supabaseKey) {
    return {
      ok: false,
      status: 500,
      json: async () => ({ message: "Supabase service key is not configured." })
    };
  }

  return fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
}

function assertAdmin(adminCode) {
  const expectedCode = ADMIN_ACCESS_CODE || "LC-FF6C-47C7";
  if (!adminCode || adminCode !== expectedCode) {
    const error = new Error("Unauthorized admin publishing access.");
    error.status = 401;
    throw error;
  }
}

function cleanText(value) {
  return String(value || "").trim();
}

function toNullableText(value) {
  const text = cleanText(value);
  return text || null;
}

function normalizeStatus(value) {
  const status = cleanText(value) || "draft";
  return ["draft", "published", "paused", "archived"].includes(status) ? status : "draft";
}

function normalizePlacement(value) {
  const placement = cleanText(value) || "rotating_banner";
  return ["rotating_banner", "advert_section", "legal_updates", "library_sponsored"].includes(placement) ? placement : "rotating_banner";
}

function normalizeGroup(value) {
  const group = cleanText(value) || "books";
  return ["articles", "books", "journals", "external"].includes(group) ? group : "books";
}

function safeStorageName(name = "library-document") {
  const cleaned = cleanText(name)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return cleaned || `library-document-${Date.now()}`;
}

async function uploadLibraryFile(file = {}) {
  if (!file.contentBase64) return null;

  const supabaseKey = getSupabaseKey();
  if (!supabaseKey) {
    throw new Error("Supabase service key is required before Library files can be uploaded.");
  }

  const buffer = Buffer.from(file.contentBase64, "base64");
  const path = `${new Date().toISOString().slice(0, 10)}/${Date.now()}-${safeStorageName(file.name)}`;
  const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/library-documents/${path}`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true"
    },
    body: buffer
  });

  const text = await uploadResponse.text();
  if (!uploadResponse.ok) {
    let message = "Could not upload Library file.";
    try {
      message = JSON.parse(text).message || message;
    } catch (error) {
      message = text || message;
    }
    throw new Error(message);
  }

  return {
    file_url: `${SUPABASE_URL}/storage/v1/object/public/library-documents/${path}`,
    file_name: file.name || path.split("/").pop(),
    file_type: file.type || null
  };
}

async function recordAuditLog(entry = {}) {
  const auditResponse = await supabaseFetch("/rest/v1/admin_audit_log", {
    method: "POST",
    body: JSON.stringify({
      action_type: entry.actionType || "admin_publishing_action",
      target_table: entry.targetTable || null,
      target_id: entry.targetId || null,
      previous_state: {},
      new_state: entry.newState || {},
      admin_note: entry.adminNote || null,
      metadata: {
        source: "admin_publishing_api",
        ...(entry.metadata || {})
      }
    })
  });

  return auditResponse.ok;
}

async function listPublishingRecords() {
  const [advertsResponse, libraryResponse] = await Promise.all([
    supabaseFetch("/rest/v1/advert_placements?select=*&order=created_at.desc&limit=50"),
    supabaseFetch("/rest/v1/library_resources?select=*&order=created_at.desc&limit=50")
  ]);
  const [advertPlacements, libraryResources] = await Promise.all([
    advertsResponse.json(),
    libraryResponse.json()
  ]);

  if (!advertsResponse.ok) {
    throw new Error(advertPlacements.message || "Could not load advert placements.");
  }

  if (!libraryResponse.ok) {
    throw new Error(libraryResources.message || "Could not load Library resources.");
  }

  return { advertPlacements, libraryResources };
}

async function createAdvert(payload = {}) {
  const record = {
    status: normalizeStatus(payload.status),
    placement: normalizePlacement(payload.placement),
    label: toNullableText(payload.label),
    headline: cleanText(payload.headline),
    body: toNullableText(payload.body),
    cta_label: toNullableText(payload.ctaLabel),
    cta_url: toNullableText(payload.ctaUrl),
    organization: toNullableText(payload.organization),
    starts_at: toNullableText(payload.startsAt),
    ends_at: toNullableText(payload.endsAt),
    admin_note: toNullableText(payload.adminNote)
  };

  if (!record.headline) {
    throw new Error("Advert headline is required.");
  }

  const createResponse = await supabaseFetch("/rest/v1/advert_placements", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(record)
  });
  const rows = await createResponse.json();

  if (!createResponse.ok) {
    throw new Error(rows.message || "Could not create advert placement.");
  }

  await recordAuditLog({
    actionType: "advert_placement_created",
    targetTable: "advert_placements",
    targetId: rows[0]?.id,
    newState: rows[0],
    adminNote: record.admin_note
  });

  return rows[0];
}

async function createLibraryResource(payload = {}, file = {}) {
  const upload = await uploadLibraryFile(file);
  const record = {
    status: normalizeStatus(payload.status),
    group_key: normalizeGroup(payload.groupKey),
    title: cleanText(payload.title),
    area: toNullableText(payload.area),
    resource_type: toNullableText(payload.resourceType),
    source: toNullableText(payload.source),
    summary: toNullableText(payload.summary),
    action_label: toNullableText(payload.actionLabel),
    resource_url: toNullableText(payload.resourceUrl),
    file_url: upload?.file_url || null,
    file_name: upload?.file_name || null,
    file_type: upload?.file_type || null,
    admin_note: toNullableText(payload.adminNote)
  };

  if (!record.title) {
    throw new Error("Library resource title is required.");
  }

  if (!record.resource_url && !record.file_url) {
    throw new Error("Add a link or upload a document for the Library resource.");
  }

  const createResponse = await supabaseFetch("/rest/v1/library_resources", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(record)
  });
  const rows = await createResponse.json();

  if (!createResponse.ok) {
    throw new Error(rows.message || "Could not create Library resource.");
  }

  await recordAuditLog({
    actionType: "library_resource_created",
    targetTable: "library_resources",
    targetId: rows[0]?.id,
    newState: rows[0],
    adminNote: record.admin_note
  });

  return rows[0];
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  try {
    const body = await readJson(request);
    assertAdmin(body.adminCode);

    if (body.action === "list") {
      const records = await listPublishingRecords();
      response.status(200).json({ ok: true, ...records });
      return;
    }

    if (body.action === "create-advert") {
      const advert = await createAdvert(body.advert || {});
      response.status(200).json({ ok: true, message: "Advert placement saved.", advert });
      return;
    }

    if (body.action === "create-library-resource") {
      const resource = await createLibraryResource(body.resource || {}, body.file || {});
      response.status(200).json({ ok: true, message: "Library resource saved.", resource });
      return;
    }

    response.status(400).json({ ok: false, message: "Unknown admin publishing action." });
  } catch (error) {
    response.status(error.status || 500).json({ ok: false, message: error.message || "Admin publishing request failed." });
  }
};
