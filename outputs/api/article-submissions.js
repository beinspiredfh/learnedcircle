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

function fieldValue(fields, label) {
  return fields.find((field) => field.label.toLowerCase() === label.toLowerCase())?.value || "";
}

async function saveArticleSubmission(payload) {
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
      item_type: "Article submission",
      payload: {
        source: "LearnedCircle public article submission",
        article: payload.article,
        fields: payload.fields,
        article_file: payload.articleFile
          ? {
              name: payload.articleFile.name,
              type: payload.articleFile.type,
              size: payload.articleFile.size,
              attached_to_email: Boolean(payload.articleFile.contentBase64)
            }
          : null,
        received_at: new Date().toISOString()
      },
      status: "pending_review"
    })
  });

  if (!databaseResponse.ok) {
    const errorText = await databaseResponse.text();
    return { saved: false, reason: errorText || "Supabase rejected the article submission." };
  }

  return { saved: true };
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const payload = typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};
  const fields = Array.isArray(payload.fields) ? payload.fields.map((field) => ({
    label: cleanText(field.label, 100),
    value: cleanText(field.value, 4000)
  })) : [];
  const articleFile = payload.articleFile || null;

  const article = {
    title: cleanText(fieldValue(fields, "Article title"), 240),
    practiceArea: cleanText(fieldValue(fields, "Practice area"), 160),
    authorName: cleanText(fieldValue(fields, "Author name"), 160),
    email: cleanText(fieldValue(fields, "Email address"), 160),
    byline: cleanText(fieldValue(fields, "Preferred byline"), 220),
    writerPictureUrl: cleanText(fieldValue(fields, "Preferred picture URL"), 500),
    summary: cleanText(fieldValue(fields, "Summary"), 800),
    body: cleanText(fieldValue(fields, "Article body"), 12000)
  };

  const filePayload = articleFile ? {
    name: cleanText(articleFile.name, 240),
    type: cleanText(articleFile.type, 120),
    size: Number(articleFile.size || 0),
    contentBase64: cleanText(articleFile.contentBase64, 3500000)
  } : null;

  if (!article.title || !article.authorName || !article.byline || !article.summary || (!article.body && !filePayload?.name)) {
    response.status(400).json({ ok: false, message: "Article title, author, byline, summary and article body or Word file are required." });
    return;
  }

  const databaseResult = await saveArticleSubmission({ article, fields, articleFile: filePayload });
  const moderationEmail = process.env.MODERATION_EMAIL;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!moderationEmail || !resendApiKey) {
    response.status(202).json({
      ok: true,
      message: databaseResult.saved
        ? "Article submitted for editorial review. Email delivery will activate after email settings are connected."
        : "Article received. Storage will activate after deployment settings are connected."
    });
    return;
  }

  const subject = `New LearnedCircle article: ${article.title}`;
  const html = `
    <h2>${escapeHtml(subject)}</h2>
    ${renderFields(fields)}
    ${filePayload?.name ? `<p><strong>Word file</strong><br>${escapeHtml(filePayload.name)} (${Math.ceil(filePayload.size / 1024)} KB)</p>` : ""}
    <p><a href="https://learnedcircle.com/admin">Open admin moderation</a></p>
  `;

  const attachments = filePayload?.contentBase64
    ? [{ filename: filePayload.name, content: filePayload.contentBase64 }]
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
        ? "Article stored for editorial review. Email delivery needs provider verification."
        : "Article received. Email delivery needs provider verification."
    });
    return;
  }

  response.status(200).json({ ok: true, message: "Article submitted for editorial review. Word file attached." });
};
