const SUPABASE_URL = process.env.SUPABASE_URL || "https://tnxdulqdfanzlawuonmf.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

function cleanText(value, maxLength = 1200) {
  return String(value || "").trim().slice(0, maxLength);
}

function jsonResponse(response, status, payload) {
  response.status(status).json(payload);
}

async function supabaseFetch(path, options = {}) {
  if (!SUPABASE_SERVICE_KEY) {
    throw new Error("Supabase service key is not configured.");
  }

  return fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    jsonResponse(response, 405, { ok: false, message: "Method not allowed" });
    return;
  }

  try {
    const payload = typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};
    const debateId = cleanText(payload.debateId, 100);
    const debateTitle = cleanText(payload.debateTitle, 240);
    const position = cleanText(payload.position, 40);
    const reason = cleanText(payload.reason, 1000);

    if (!debateId || !debateTitle || !position || !reason) {
      jsonResponse(response, 400, { ok: false, message: "Debate, position and reason are required." });
      return;
    }

    const dbResponse = await supabaseFetch("/rest/v1/forum_posts?select=id,created_at", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        title: debateId,
        practice_area: "Debate opinion",
        body: JSON.stringify({
          debateId,
          debateTitle,
          position,
          reason
        }),
        status: "approved"
      })
    });

    const result = await dbResponse.json();
    if (!dbResponse.ok) {
      jsonResponse(response, dbResponse.status, { ok: false, message: result.message || "Could not publish debate opinion." });
      return;
    }

    jsonResponse(response, 200, {
      ok: true,
      message: "Opinion published.",
      opinion: {
        id: result[0]?.id || "",
        created_at: result[0]?.created_at || new Date().toISOString(),
        debateId,
        debateTitle,
        position,
        reason
      }
    });
  } catch (error) {
    jsonResponse(response, 500, { ok: false, message: error.message || "Could not publish debate opinion." });
  }
};
