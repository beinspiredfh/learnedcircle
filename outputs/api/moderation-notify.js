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
    .map((field) => {
      const label = escapeHtml(field.label);
      const value = escapeHtml(field.value || "Not provided");
      return `<p><strong>${label}</strong><br>${value}</p>`;
    })
    .join("");
}

async function saveModerationDraft(payload) {
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
      item_type: payload.type || "Website draft",
      payload: {
        source: payload.source || "LearnedCircle website",
        fields: Array.isArray(payload.fields) ? payload.fields : [],
        received_at: new Date().toISOString()
      },
      status: "pending_review"
    })
  });

  if (!databaseResponse.ok) {
    const errorText = await databaseResponse.text();
    return { saved: false, reason: errorText || "Supabase rejected the draft." };
  }

  return { saved: true };
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const payload = typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};
  const databaseResult = await saveModerationDraft(payload);

  if (!databaseResult.saved) {
    response.status(202).json({
      ok: false,
      message: "Draft received, but the moderation database needs attention before it can be stored.",
      detail: databaseResult.reason
    });
    return;
  }

  const moderationEmail = process.env.MODERATION_EMAIL;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!moderationEmail || !resendApiKey) {
    response.status(202).json({
      ok: true,
      message: "Draft saved for moderation. Email notifications will activate after MODERATION_EMAIL and RESEND_API_KEY are added in Vercel."
    });
    return;
  }

  const subject = `New LearnedCircle moderation draft: ${payload.type || "Website draft"}`;
  const html = `
    <h2>${escapeHtml(subject)}</h2>
    <p><strong>Source</strong><br>${escapeHtml(payload.source || "LearnedCircle website")}</p>
    ${renderFields(payload.fields)}
  `;

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
      html
    })
  });

  if (!emailResponse.ok) {
    response.status(202).json({
      ok: true,
      message: "Draft saved for moderation. Email delivery needs provider verification."
    });
    return;
  }

  response.status(200).json({ ok: true, message: "Draft saved for moderation. Notification sent." });
};
