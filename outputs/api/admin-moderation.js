const SUPABASE_URL = process.env.SUPABASE_URL || "https://tnxdulqdfanzlawuonmf.supabase.co";
const ADMIN_ACCESS_CODE = process.env.ADMIN_ACCESS_CODE;
const adminPublishingHandler = require("../admin-publishing-api.js");
const ADMIN_PUBLISHING_ACTIONS = new Set(["publishing-list", "create-advert", "create-library-resource"]);

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

async function recordAuditLog(entry = {}) {
  const auditResponse = await supabaseFetch("/rest/v1/admin_audit_log", {
    method: "POST",
    body: JSON.stringify({
      action_type: entry.actionType || "admin_action",
      target_table: entry.targetTable || null,
      target_id: entry.targetId || null,
      previous_state: entry.previousState || {},
      new_state: entry.newState || {},
      admin_note: entry.adminNote || null,
      metadata: {
        source: "admin_moderation_api",
        ...(entry.metadata || {})
      }
    })
  });

  // Keep moderation usable if the audit migration has not been run yet.
  return auditResponse.ok;
}

async function publishLawyerProfile(moderationRow) {
  const profile = moderationRow?.payload?.profile;

  if (!profile || !profile.user_id || !profile.display_name) {
    return { published: false, reason: "No structured lawyer profile was found on this draft." };
  }

  if (!profile.supreme_court_number || !profile.location || !Array.isArray(profile.practice_areas) || !profile.practice_areas.length || !profile.summary) {
    return { published: false, reason: "SCN, location, practice areas and profile summary must be supplied before lawyer verification." };
  }

  const callDetails = [
    profile.year_of_call ? `Year of call: ${profile.year_of_call}` : null,
    profile.supreme_court_number ? `Supreme Court number: ${profile.supreme_court_number}` : null
  ].filter(Boolean).join("; ");
  const verificationNote = [
    profile.verification_note || null,
    profile.profile_picture_url ? `Profile picture URL: ${profile.profile_picture_url}` : null,
    profile.pro_bono_open ? "Pro bono availability: Open to reviewed pro bono matters." : "Pro bono availability: Not currently open to pro bono matters.",
    profile.show_call_details_public && callDetails ? callDetails : null,
    !profile.show_call_details_public && callDetails ? "Call details reviewed privately by LearnedCircle." : null
  ].filter(Boolean).join("\n");

  const publishPayload = {
    user_id: profile.user_id,
    display_name: profile.display_name,
    profile_picture_url: profile.profile_picture_url || null,
    credentials: profile.credentials || null,
    year_of_call: profile.year_of_call || null,
    supreme_court_number: profile.supreme_court_number || null,
    show_call_details_public: profile.show_call_details_public === true,
    location: profile.location || null,
    firm: profile.firm || null,
    practice_areas: Array.isArray(profile.practice_areas) ? profile.practice_areas : [],
    languages: profile.languages || null,
    fees: profile.fees || null,
    availability: profile.availability || null,
    pro_bono_open: profile.pro_bono_open === true,
    verification_note: verificationNote || null,
    summary: profile.summary || null,
    verified: true,
    direct_client_contact: false
  };

  const existingResponse = await supabaseFetch(
    `/rest/v1/lawyer_profiles?user_id=eq.${encodeURIComponent(profile.user_id)}&select=id&limit=1`
  );
  const existingRows = await existingResponse.json();

  if (!existingResponse.ok) {
    return { published: false, reason: existingRows.message || "Could not check existing lawyer profile." };
  }

  const existingId = existingRows[0]?.id;
  const publishResponse = await supabaseFetch(
    existingId
      ? `/rest/v1/lawyer_profiles?id=eq.${encodeURIComponent(existingId)}`
      : "/rest/v1/lawyer_profiles",
    {
      method: existingId ? "PATCH" : "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(publishPayload)
    }
  );
  const publishData = await publishResponse.json();

  if (!publishResponse.ok) {
    return { published: false, reason: publishData.message || "Could not publish lawyer profile." };
  }

  return { published: true, lawyerProfile: publishData[0] };
}

async function publishJobPost(moderationRow) {
  const job = moderationRow?.payload?.job;

  if (!job || !job.title || !job.description) {
    return { published: false, reason: "No structured job post was found on this draft." };
  }

  const publishPayload = {
    owner_id: job.owner_id || null,
    title: job.title,
    organization: job.organization || null,
    location: job.location || null,
    engagement_type: job.engagement_type || null,
    practice_areas: Array.isArray(job.practice_areas) ? job.practice_areas : [],
    budget: job.budget || null,
    description: job.description,
    status: "approved"
  };

  const publishResponse = await supabaseFetch("/rest/v1/job_posts", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(publishPayload)
  });
  const publishData = await publishResponse.json();

  if (!publishResponse.ok) {
    return { published: false, reason: publishData.message || "Could not publish job post." };
  }

  return { published: true, jobPost: publishData[0] };
}

async function publishArticle(moderationRow) {
  const article = moderationRow?.payload?.article;

  if (!article || !article.title || !article.body) {
    return { published: false, reason: "No structured article was found on this draft." };
  }

  const publishPayload = {
    author_id: article.author_id || null,
    title: article.title,
    practice_area: article.practice_area || null,
    summary: article.summary || null,
    body: article.body,
    byline: article.byline || null,
    status: "approved"
  };

  const publishResponse = await supabaseFetch("/rest/v1/articles", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(publishPayload)
  });
  const publishData = await publishResponse.json();

  if (!publishResponse.ok) {
    return { published: false, reason: publishData.message || "Could not publish article." };
  }

  return { published: true, article: publishData[0] };
}

function stripWriterPictureFromBody(body) {
  return String(body || "").replace(/^Writer picture URL:\s*https?:\/\/[^\n]+\n\n/i, "").trim();
}

function writerPictureFromBody(body) {
  const match = String(body || "").match(/^Writer picture URL:\s*(https?:\/\/[^\n]+)\n\n/i);
  return match ? match[1] : "";
}

async function createGuestArticle(article = {}) {
  const writerPictureUrl = String(article.writerPictureUrl || "").trim();
  const articleBody = String(article.body || "").trim();
  const publishPayload = {
    contributor_name: String(article.contributorName || "").trim(),
    contributor_title: String(article.contributorTitle || "").trim() || null,
    approved_byline: String(article.approvedByline || "").trim(),
    title: String(article.title || "").trim(),
    summary: String(article.summary || "").trim(),
    body: articleBody,
    contributor_image_url: writerPictureUrl || null,
    status: "approved"
  };

  if (!publishPayload.contributor_name || !publishPayload.approved_byline || !publishPayload.title || !publishPayload.summary || !publishPayload.body) {
    return { published: false, reason: "Title, writer name, approved byline, summary and article body are required." };
  }

  const publishResponse = await supabaseFetch("/rest/v1/guest_articles", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(publishPayload)
  });
  const publishData = await publishResponse.json();

  if (publishResponse.ok) {
    return { published: true, article: publishData[0], usedImageColumn: true };
  }

  const retryPayload = { ...publishPayload };
  delete retryPayload.contributor_image_url;
  retryPayload.body = writerPictureUrl ? `Writer picture URL: ${writerPictureUrl}\n\n${articleBody}` : articleBody;

  const retryResponse = await supabaseFetch("/rest/v1/guest_articles", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(retryPayload)
  });
  const retryData = await retryResponse.json();

  if (!retryResponse.ok) {
    return { published: false, reason: retryData.message || publishData.message || "Could not publish guest article." };
  }

  return { published: true, article: retryData[0], usedImageColumn: false };
}

async function loadExportRows(path) {
  const rowsResponse = await supabaseFetch(path);
  const rows = await rowsResponse.json();

  if (!rowsResponse.ok) {
    return { ok: false, message: rows.message || "Export query failed.", rows: [] };
  }

  return { ok: true, rows };
}

function fieldValue(fields, label) {
  const target = label.toLowerCase();
  const field = fields.find((item) => String(item.label || "").toLowerCase() === target);
  return String(field?.value || "").trim();
}

async function publishAdvert(moderationRow) {
  const fields = Array.isArray(moderationRow?.payload?.fields) ? moderationRow.payload.fields : [];
  const organization = fieldValue(fields, "Organization");
  const advertOption = fieldValue(fields, "Advert option").toLowerCase();

  if (!organization) {
    return { published: false, reason: "No organization name was found on this advert request." };
  }

  const advertPlan = advertOption.includes("paid") ? "paid" : "free";
  const advertType = fieldValue(fields, "Advert type") || "General advert";
  const campaignNote = fieldValue(fields, "Campaign note") || null;
  const publishPayload = {
    owner_id: moderationRow?.submitter_id || null,
    organization,
    advert_type: `${advertPlan === "paid" ? "Paid priority" : "Free reviewed"} - ${advertType}`,
    target_audience: fieldValue(fields, "Target audience") || null,
    campaign_note: advertPlan === "paid"
      ? `${campaignNote || "Paid advert request."} Payment pending: priority placement activates after payment confirmation.`
      : `${campaignNote || "Free advert request."} Free reviewed placement is published when space is available.`,
    status: "approved"
  };

  const publishResponse = await supabaseFetch("/rest/v1/advert_requests", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(publishPayload)
  });
  const publishData = await publishResponse.json();

  if (!publishResponse.ok) {
    return { published: false, reason: publishData.message || "Could not publish advert request." };
  }

  return { published: true, advert: publishData[0] };
}

async function activatePremium(moderationRow) {
  const userId = moderationRow?.submitter_id;

  if (!userId) {
    return { published: false, reason: "Premium request has no submitter account." };
  }

  const profileResponse = await supabaseFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ membership: "premium_active" })
  });
  const profileData = await profileResponse.json();

  if (!profileResponse.ok) {
    return { published: false, reason: profileData.message || "Could not activate premium membership." };
  }

  const lawyerResponse = await supabaseFetch(`/rest/v1/lawyer_profiles?user_id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ direct_client_contact: true, verified: true })
  });
  const lawyerData = await lawyerResponse.json();

  if (!lawyerResponse.ok) {
    return { published: false, reason: lawyerData.message || "Premium activated, but lawyer contact settings could not be updated." };
  }

  return { published: true, profile: profileData[0], lawyerProfiles: lawyerData };
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const body = await readJson(request);

  if (!ADMIN_ACCESS_CODE || body.adminCode !== ADMIN_ACCESS_CODE) {
    response.status(401).json({ ok: false, message: "Invalid admin access code." });
    return;
  }

  if (ADMIN_PUBLISHING_ACTIONS.has(body.action)) {
    await adminPublishingHandler({
      method: "POST",
      body: {
        ...body,
        action: body.action === "publishing-list" ? "list" : body.action
      }
    }, response);
    return;
  }

  if (body.action === "list") {
    const dbResponse = await supabaseFetch(
      "/rest/v1/moderation_queue?select=id,created_at,item_type,status,payload,reviewer_note,reviewed_at&order=created_at.desc&limit=100"
    );
    const data = await dbResponse.json();

    if (!dbResponse.ok) {
      response.status(dbResponse.status).json({ ok: false, message: data.message || "Could not load moderation queue." });
      return;
    }

    const rows = data.sort((a, b) => {
      if (a.status === "pending_review" && b.status !== "pending_review") return -1;
      if (a.status !== "pending_review" && b.status === "pending_review") return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    response.status(200).json({ ok: true, rows });
    return;
  }

  if (body.action === "payment-list") {
    const paymentResponse = await supabaseFetch(
      "/rest/v1/platform_payments?select=id,created_at,updated_at,payment_type,payer_name,payer_email,lawyer_profile_id,related_item_id,provider,provider_reference,amount_kobo,currency,status,metadata&order=created_at.desc&limit=50"
    );
    const paymentRows = await paymentResponse.json();

    if (!paymentResponse.ok) {
      response.status(paymentResponse.status).json({ ok: false, message: paymentRows.message || "Could not load payment records." });
      return;
    }

    response.status(200).json({ ok: true, rows: paymentRows });
    return;
  }

  if (body.action === "payment-update") {
    const allowedStatuses = new Set(["pending", "awaiting_payment", "paid", "failed", "refunded", "disputed", "cancelled"]);

    if (!body.id || !allowedStatuses.has(body.status)) {
      response.status(400).json({ ok: false, message: "A valid payment id and payment status are required." });
      return;
    }

    if (!body.adminNote) {
      response.status(400).json({ ok: false, message: "Admin note is required for payment review changes." });
      return;
    }

    const beforeResponse = await supabaseFetch(
      `/rest/v1/platform_payments?id=eq.${encodeURIComponent(body.id)}&select=id,status,metadata&limit=1`
    );
    const beforeRows = await beforeResponse.json();

    if (!beforeResponse.ok || !beforeRows[0]) {
      response.status(beforeResponse.status || 404).json({ ok: false, message: beforeRows.message || "Could not load payment record." });
      return;
    }

    const previous = beforeRows[0];
    const metadata = {
      ...(previous.metadata || {}),
      last_admin_note: body.adminNote,
      last_admin_reviewed_at: new Date().toISOString()
    };

    const paymentResponse = await supabaseFetch(`/rest/v1/platform_payments?id=eq.${encodeURIComponent(body.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        status: body.status,
        metadata
      })
    });
    const paymentRows = await paymentResponse.json();

    if (!paymentResponse.ok) {
      response.status(paymentResponse.status).json({ ok: false, message: paymentRows.message || "Could not update payment record." });
      return;
    }

    await recordAuditLog({
      actionType: "payment_status_update",
      targetTable: "platform_payments",
      targetId: body.id,
      previousState: previous,
      newState: paymentRows[0],
      adminNote: body.adminNote
    });

    response.status(200).json({ ok: true, row: paymentRows[0] });
    return;
  }

  if (body.action === "create-guest-article") {
    const publishResult = await createGuestArticle(body.article || {});

    if (!publishResult.published) {
      response.status(422).json({ ok: false, message: publishResult.reason });
      return;
    }

    response.status(200).json({
      ok: true,
      message: publishResult.usedImageColumn
        ? "Guest article published with writer picture and approved byline."
        : "Guest article published. Writer picture was stored with the article body until the guest article image column is added.",
      article: publishResult.article
    });
    return;
  }

  if (body.action === "export") {
    const [moderation, lawyers, jobs, articles, guestArticles, adverts, payments, auditLog] = await Promise.all([
      loadExportRows("/rest/v1/moderation_queue?select=id,created_at,item_type,status,payload,reviewer_note,reviewed_at&order=created_at.desc&limit=500"),
      loadExportRows("/rest/v1/lawyer_profiles?select=id,display_name,location,practice_areas,verified,direct_client_contact,pro_bono_open,created_at,updated_at&order=updated_at.desc&limit=500"),
      loadExportRows("/rest/v1/job_posts?select=id,title,organization,status,created_at,updated_at&order=created_at.desc&limit=500"),
      loadExportRows("/rest/v1/articles?select=id,title,byline,status,created_at,updated_at&order=created_at.desc&limit=500"),
      loadExportRows("/rest/v1/guest_articles?select=id,title,approved_byline,status,created_at,updated_at&order=created_at.desc&limit=500"),
      loadExportRows("/rest/v1/advert_requests?select=id,organization,advert_type,status,created_at&order=created_at.desc&limit=500"),
      loadExportRows("/rest/v1/platform_payments?select=id,created_at,payment_type,payer_email,provider_reference,amount_kobo,currency,status,metadata&order=created_at.desc&limit=500"),
      loadExportRows("/rest/v1/admin_audit_log?select=id,created_at,action_type,target_table,target_id,admin_note,metadata&order=created_at.desc&limit=500")
    ]);
    const failed = [moderation, lawyers, jobs, articles, guestArticles, adverts, payments].find((item) => !item.ok);

    if (failed) {
      response.status(500).json({ ok: false, message: failed.message });
      return;
    }

    response.status(200).json({
      ok: true,
      export: {
        exported_at: new Date().toISOString(),
        moderation_queue: moderation.rows,
        lawyer_profiles: lawyers.rows,
        job_posts: jobs.rows,
        articles: articles.rows,
        guest_articles: guestArticles.rows,
        advert_requests: adverts.rows,
        platform_payments: payments.rows,
        admin_audit_log: auditLog.ok ? auditLog.rows : []
      }
    });
    return;
  }

  if (body.action === "delete-lawyer-profile") {
    if (!body.id) {
      response.status(400).json({ ok: false, message: "A lawyer profile id is required." });
      return;
    }

    const previousResponse = await supabaseFetch(
      `/rest/v1/lawyer_profiles?id=eq.${encodeURIComponent(body.id)}&select=*&limit=1`
    );
    const previousRows = await previousResponse.json();

    if (!previousResponse.ok || !previousRows[0]) {
      response.status(previousResponse.status || 404).json({ ok: false, message: previousRows.message || "Lawyer profile was not found." });
      return;
    }

    const deleteResponse = await supabaseFetch(`/rest/v1/lawyer_profiles?id=eq.${encodeURIComponent(body.id)}`, {
      method: "DELETE",
      headers: { Prefer: "return=representation" }
    });
    const deletedRows = await deleteResponse.json();

    if (!deleteResponse.ok) {
      response.status(deleteResponse.status).json({ ok: false, message: deletedRows.message || "Could not delete lawyer profile." });
      return;
    }

    await recordAuditLog({
      actionType: "lawyer_profile_delete",
      targetTable: "lawyer_profiles",
      targetId: body.id,
      previousState: previousRows[0],
      newState: { deleted: true, deleted_at: new Date().toISOString() },
      adminNote: body.adminNote || null
    });

    response.status(200).json({ ok: true, deleted: deletedRows[0] || previousRows[0] });
    return;
  }

  if (body.action === "update") {
    const allowedStatuses = new Set(["pending_review", "approved", "rejected", "archived"]);

    if (!body.id || !allowedStatuses.has(body.status)) {
      response.status(400).json({ ok: false, message: "A valid draft id and status are required." });
      return;
    }

    let publishResult = null;
    if (body.status === "approved") {
      const draftResponse = await supabaseFetch(
        `/rest/v1/moderation_queue?id=eq.${encodeURIComponent(body.id)}&select=id,submitter_id,item_type,payload`
      );
      const draftData = await draftResponse.json();

      if (!draftResponse.ok || !draftData[0]) {
        response.status(draftResponse.status || 404).json({ ok: false, message: draftData.message || "Could not load moderation draft." });
        return;
      }

      if (draftData[0].item_type === "Lawyer profile submission") {
        publishResult = await publishLawyerProfile(draftData[0]);
        if (!publishResult.published) {
          response.status(422).json({ ok: false, message: publishResult.reason });
          return;
        }
      }

      if (draftData[0].item_type === "Job post submission") {
        publishResult = await publishJobPost(draftData[0]);
        if (!publishResult.published) {
          response.status(422).json({ ok: false, message: publishResult.reason });
          return;
        }
      }

      if (draftData[0].item_type === "Article submission") {
        publishResult = await publishArticle(draftData[0]);
        if (!publishResult.published) {
          response.status(422).json({ ok: false, message: publishResult.reason });
          return;
        }
      }

      if (draftData[0].item_type === "Premium account request") {
        publishResult = await activatePremium(draftData[0]);
        if (!publishResult.published) {
          response.status(422).json({ ok: false, message: publishResult.reason });
          return;
        }
      }

      if (draftData[0].item_type === "Advert request") {
        publishResult = await publishAdvert(draftData[0]);
        if (!publishResult.published) {
          response.status(422).json({ ok: false, message: publishResult.reason });
          return;
        }
      }
    }

    const dbResponse = await supabaseFetch(`/rest/v1/moderation_queue?id=eq.${encodeURIComponent(body.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        status: body.status,
        reviewer_note: body.reviewerNote || null,
        reviewed_at: body.status === "pending_review" ? null : new Date().toISOString()
      })
    });
    const data = await dbResponse.json();

    if (!dbResponse.ok) {
      response.status(dbResponse.status).json({ ok: false, message: data.message || "Could not update moderation draft." });
      return;
    }

    await recordAuditLog({
      actionType: "moderation_status_update",
      targetTable: "moderation_queue",
      targetId: body.id,
      previousState: { id: body.id },
      newState: data[0],
      adminNote: body.reviewerNote || null,
      metadata: { published: publishResult || null }
    });

    response.status(200).json({ ok: true, row: data[0], published: publishResult });
    return;
  }

  response.status(400).json({ ok: false, message: "Unknown admin action." });
};
