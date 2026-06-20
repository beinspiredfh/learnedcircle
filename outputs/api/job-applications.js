function cleanText(value, maxLength = 1200) {
  return String(value || "").trim().slice(0, maxLength);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderFields(fields = []) {
  return fields
    .map((field) => `<p><strong>${escapeHtml(field.label)}</strong><br>${escapeHtml(field.value || "Not provided")}</p>`)
    .join("");
}

async function saveApplication(payload) {
  const supabaseUrl = process.env.SUPABASE_URL || "https://tnxdulqdfanzlawuonmf.supabase.co";
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_UxaC8agmrd3bAkxhxQRzXA_uOCvnyKd";

  if (!supabaseUrl || !supabaseKey) {
    return { saved: false, reason: "Supabase connection is not configured." };
  }

  const databaseResponse = await fetch(`${supabaseUrl}/rest/v1/moderation_queue`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      item_type: "Opportunity application",
      payload: {
        source: "LearnedCircle opportunity application",
        job: {
          title: payload.jobTitle,
          company: payload.jobCompany,
          location: payload.jobLocation,
          type: payload.jobType
        },
        fields: payload.fields,
        cv: {
          name: payload.cv?.name,
          type: payload.cv?.type,
          size: payload.cv?.size,
          attached_to_email: Boolean(payload.cv?.contentBase64)
        },
        received_at: new Date().toISOString()
      },
      status: "pending_review"
    })
  });

  if (!databaseResponse.ok) {
    const errorText = await databaseResponse.text();
    return { saved: false, reason: errorText || "Supabase rejected the application." };
  }

  return { saved: true };
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const payload = typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};
  const fields = Array.isArray(payload.fields) ? payload.fields : [];
  const cv = payload.cv || {};

  const application = {
    jobTitle: cleanText(payload.jobTitle, 240),
    jobCompany: cleanText(payload.jobCompany, 240),
    jobLocation: cleanText(payload.jobLocation, 120),
    jobType: cleanText(payload.jobType, 120),
    fields: fields.map((field) => ({
      label: cleanText(field.label, 100),
      value: cleanText(field.value, 1200)
    })),
    cv: {
      name: cleanText(cv.name, 240),
      type: cleanText(cv.type, 120),
      size: Number(cv.size || 0),
      contentBase64: cleanText(cv.contentBase64, 3500000)
    }
  };

  if (!application.jobTitle || !application.fields.length || !application.cv.name) {
    response.status(400).json({ ok: false, message: "Applicant details and CV are required." });
    return;
  }

  const databaseResult = await saveApplication(application);
  const moderationEmail = process.env.MODERATION_EMAIL;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!moderationEmail || !resendApiKey) {
    response.status(202).json({
      ok: true,
      message: databaseResult.saved
        ? "Application received and stored. Email delivery will activate after email settings are connected."
        : "Application received. Storage will activate after deployment settings are connected."
    });
    return;
  }

  const subject = `New LearnedCircle application: ${application.jobTitle}`;
  const html = `
    <h2>${escapeHtml(subject)}</h2>
    <p><strong>Opportunity</strong><br>${escapeHtml(application.jobCompany)} | ${escapeHtml(application.jobLocation)} | ${escapeHtml(application.jobType)}</p>
    ${renderFields(application.fields)}
    <p><strong>CV</strong><br>${escapeHtml(application.cv.name)} (${Math.ceil(application.cv.size / 1024)} KB)</p>
  `;

  const attachments = application.cv.contentBase64
    ? [{
        filename: application.cv.name,
        content: application.cv.contentBase64
      }]
    : [];

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.MODERATION_FROM_EMAIL || "LearnedCircle <onboarding@resend.dev>",
      to: [moderationEmail],
      subject,
      html,
      attachments
    })
  });

  if (!emailResponse.ok) {
    response.status(202).json({
      ok: true,
      message: databaseResult.saved
        ? "Application stored. Email delivery needs provider verification."
        : "Application received. Email delivery needs provider verification."
    });
    return;
  }

  response.status(200).json({ ok: true, message: "Application submitted directly. CV attached." });
};
