const SUPABASE_URL = process.env.SUPABASE_URL || "https://tnxdulqdfanzlawuonmf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_UxaC8agmrd3bAkxhxQRzXA_uOCvnyKd";

function cleanText(value, maxLength = 2000) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizeList(value, fallback = []) {
  if (!Array.isArray(value)) return fallback;
  return value
    .map((item) => cleanText(item, 240))
    .filter(Boolean)
    .slice(0, 8);
}

function safeAssistantPayload(value) {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  return {
    reply: cleanText(
      parsed.reply ||
        "This assistant can provide general legal information and help you prepare before contacting a qualified lawyer.",
      1200
    ),
    areas: normalizeList(parsed.areas, ["General practice"]),
    documents: normalizeList(parsed.documents, [
      "Write a short timeline of what happened and the dates involved.",
      "Gather relevant documents, messages, contracts, receipts, notices or court papers.",
      "Write the outcome you want before contacting a lawyer."
    ]),
    questions: normalizeList(parsed.questions, [
      "What is the main problem you want solved?",
      "Is there any deadline, court date, notice or threat of enforcement?",
      "What state or location is the matter connected to?"
    ]),
    urgency: cleanText(parsed.urgency || "Not assessed", 120),
    disclaimer:
      "This is general legal information from LearnedCircle AI. It is not legal advice, does not create a lawyer-client relationship and should not be relied on as a substitute for advice from a qualified lawyer."
  };
}

async function logAssistantConsent(payload, result) {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return;

  await fetch(`${SUPABASE_URL}/rest/v1/moderation_queue`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      item_type: "AI assistant disclaimer",
      status: "archived",
      payload: {
        source: "LearnedCircle AI legal assistant",
        disclaimer_accepted: true,
        accepted_at: new Date().toISOString(),
        location: payload.location,
        likely_areas: result.areas,
        urgency: result.urgency
      }
    })
  });
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};
  const payload = {
    location: cleanText(body.location, 160),
    facts: cleanText(body.facts, 2800),
    outcome: cleanText(body.outcome, 1200),
    disclaimerAccepted: body.disclaimerAccepted === true
  };

  if (!payload.disclaimerAccepted) {
    response.status(400).json({ ok: false, message: "The AI disclaimer must be accepted before using the assistant." });
    return;
  }

  if (!payload.facts) {
    response.status(400).json({ ok: false, message: "Please provide your general legal question." });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    response.status(202).json({
      ok: false,
      configured: false,
      message: "AI backend is ready, but OPENAI_API_KEY has not been added to Vercel yet."
    });
    return;
  }

  const systemPrompt = [
    "You are LearnedCircle AI, a legal information assistant for a lawyer marketplace.",
    "You do not give legal advice, legal strategy, predictions, instructions to evade the law, or definitive answers.",
    "You give a simple, straight, plain-language general legal information reply in 2 to 4 short sentences, then help users organise a first brief, identify likely lawyer categories, list useful documents and prepare questions for a qualified lawyer.",
    "If the facts mention arrest, detention, violence, eviction, limitation deadlines, served court papers, police, injunctions or urgent enforcement, mark urgency as urgent and tell the user to contact a qualified lawyer immediately.",
    "Do not ask for highly confidential facts. Do not claim a lawyer-client relationship exists.",
    "Return only valid JSON with keys: reply, areas, documents, questions, urgency."
  ].join(" ");

  const userPrompt = [
    `Location: ${payload.location || "Not provided"}`,
    `General legal question: ${payload.facts}`,
    `Outcome wanted: ${payload.outcome || "Not provided"}`,
    "Return concise, plain-language JSON. Keep the reply direct and easy for a non-lawyer. Use Nigerian legal context where helpful, but keep wording general and safe."
  ].join("\n");

  const aiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || process.env.AI_ASSISTANT_MODEL || "gpt-4.1-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "learnedcircle_legal_assistant_response",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              reply: { type: "string" },
              areas: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4 },
              documents: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
              questions: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
              urgency: { type: "string" }
            },
            required: ["reply", "areas", "documents", "questions", "urgency"]
          }
        }
      }
    })
  });

  const aiPayload = await aiResponse.json();

  if (!aiResponse.ok) {
    response.status(502).json({
      ok: false,
      configured: true,
      message: aiPayload.error?.message || "The AI assistant could not prepare guidance right now."
    });
    return;
  }

  const outputText = aiPayload.output_text || aiPayload.output?.[0]?.content?.[0]?.text || "{}";
  const result = safeAssistantPayload(outputText);

  try {
    await logAssistantConsent(payload, result);
  } catch (error) {
    // The assistant should still work even if the consent log is temporarily unavailable.
  }

  response.status(200).json({ ok: true, configured: true, result });
};
