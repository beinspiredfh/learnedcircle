const siteUrl = process.env.SITE_URL || "https://learnedcircle.com";
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const password = `TempChat-${stamp}!`;
const users = [];

async function account(action, payload) {
  const response = await fetch(`${siteUrl}/api/account-auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new Error(`${action} failed: ${data.message || response.statusText}`);
  }
  return data;
}

async function publicData() {
  const response = await fetch(`${siteUrl}/api/public-data?v=${encodeURIComponent(stamp)}`, {
    headers: { "Cache-Control": "no-cache" }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new Error(`public-data failed: ${data.message || response.statusText}`);
  }
  return data;
}

async function supabase(path, options = {}) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed: ${data?.message || response.statusText}`);
  }
  return data;
}

async function createLawyer(label) {
  const email = `codex-chat-${label}-${stamp}@learnedcircle.test`;
  const signup = await account("signup", {
    fullName: `Codex Chat Lawyer ${label.toUpperCase()}`,
    email,
    password,
    role: "lawyer",
    termsAccepted: true
  });
  users.push(signup.user.id);
  const login = await account("login", { email, password });
  return { id: signup.user.id, email, token: login.session.access_token };
}

async function cleanup() {
  for (const id of users) {
    await supabase(`/rest/v1/messages?or=(sender_id.eq.${id},recipient_id.eq.${id})`, { method: "DELETE" }).catch(() => {});
    await supabase(`/rest/v1/lawyer_profiles?user_id=eq.${id}`, { method: "DELETE" }).catch(() => {});
    await supabase(`/rest/v1/profiles?id=eq.${id}`, { method: "DELETE" }).catch(() => {});
    await supabase(`/auth/v1/admin/users/${id}`, { method: "DELETE" }).catch(() => {});
  }
}

try {
  const a = await createLawyer("a");
  const b = await createLawyer("b");

  const profileRows = await supabase("/rest/v1/lawyer_profiles", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify([
      {
        user_id: a.id,
        display_name: "Codex Chat Lawyer A",
        credentials: "LLB, BL",
        location: "Lagos",
        practice_areas: ["Corporate Law"],
        summary: "Temporary verified lawyer profile for chat verification.",
        verified: true,
        direct_client_contact: false
      },
      {
        user_id: b.id,
        display_name: "Codex Chat Lawyer B",
        credentials: "LLB, BL",
        location: "FCT",
        practice_areas: ["Tax Law"],
        summary: "Temporary verified lawyer profile for chat verification.",
        verified: true,
        direct_client_contact: false
      }
    ])
  });

  const options = await account("message-options", { accessToken: a.token });
  const hasSelf = options.recipients.some((recipient) => recipient.user_id === a.id);
  const peer = options.recipients.find((recipient) => recipient.user_id === b.id);

  if (hasSelf) throw new Error("Sender can see their own profile as a chat recipient.");
  if (!peer?.can_message) throw new Error("Verified lawyer is not available for lawyer chat.");

  const subject = `Lawyer-to-lawyer chat test ${stamp}`;
  await account("send-message", {
    accessToken: a.token,
    lawyerProfileId: peer.id,
    subject,
    body: "Temporary verification message."
  });

  const inbox = await account("messages", { accessToken: b.token });
  const received = inbox.messages.some((message) => message.subject === subject && message.direction === "received");
  if (!received) throw new Error("Recipient inbox did not receive the lawyer-to-lawyer message.");

  const directory = await publicData();
  const onlineNames = (directory.onlineLawyers || []).map((lawyer) => lawyer.display_name);
  const onlineListPopulated = onlineNames.includes("Codex Chat Lawyer A") || onlineNames.includes("Codex Chat Lawyer B");
  if (!onlineListPopulated) throw new Error("Public online lawyer list did not include the temporary active lawyers.");

  console.log(JSON.stringify({
    ok: true,
    createdProfiles: profileRows.length,
    senderExcludedSelf: !hasSelf,
    peerAvailable: true,
    messageReceived: true,
    onlineListPopulated: true
  }, null, 2));
} finally {
  await cleanup();
}
