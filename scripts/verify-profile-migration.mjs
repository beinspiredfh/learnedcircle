const siteUrl = process.env.SITE_URL || "https://learnedcircle.vercel.app";
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminCode = process.env.ADMIN_ACCESS_CODE;

if (!supabaseUrl || !serviceKey || !adminCode) {
  throw new Error("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and ADMIN_ACCESS_CODE are required.");
}

const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const password = `TempProfile-${stamp}!`;
let userId = null;
let draftId = null;

async function post(path, payload) {
  const response = await fetch(`${siteUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new Error(`${path} failed: ${data.message || response.statusText}`);
  }
  return data;
}

async function account(action, payload) {
  return post("/api/account-auth", { action, ...payload });
}

async function admin(action, payload) {
  return post("/api/admin-moderation", { adminCode, action, ...payload });
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

async function cleanup() {
  if (!userId) return;
  await supabase(`/rest/v1/moderation_queue?submitter_id=eq.${userId}`, { method: "DELETE" }).catch(() => {});
  await supabase(`/rest/v1/lawyer_profiles?user_id=eq.${userId}`, { method: "DELETE" }).catch(() => {});
  await supabase(`/rest/v1/messages?or=(sender_id.eq.${userId},recipient_id.eq.${userId})`, { method: "DELETE" }).catch(() => {});
  await supabase(`/rest/v1/profiles?id=eq.${userId}`, { method: "DELETE" }).catch(() => {});
  await supabase(`/auth/v1/admin/users/${userId}`, { method: "DELETE" }).catch(() => {});
}

try {
  const email = `codex-profile-${stamp}@learnedcircle.test`;
  const signup = await account("signup", {
    fullName: "Codex Profile Migration Lawyer",
    email,
    password,
    role: "lawyer",
    termsAccepted: true
  });
  userId = signup.user.id;

  const login = await account("login", { email, password });
  const submit = await account("lawyer-profile-submit", {
    accessToken: login.session.access_token,
    profile: {
      displayName: "Codex Profile Migration Lawyer",
      profilePictureUrl: "https://example.com/profile.jpg",
      credentials: "LLB, BL",
      yearOfCall: "2012",
      supremeCourtNumber: `SCN-${stamp.slice(0, 10)}`,
      showCallDetailsPublic: true,
      location: "Lagos",
      firm: "Temporary Verification Chambers",
      practiceAreas: "Corporate Law, Tax Law",
      languages: "English",
      fees: "Paid matters",
      availability: "Weekdays",
      proBonoOpen: true,
      summary: "Temporary profile used to verify LearnedCircle live migration.",
      verificationNote: "Temporary migration verification."
    }
  });
  draftId = submit.draft.id;

  await admin("update", {
    id: draftId,
    status: "approved",
    reviewerNote: "Temporary migration verification approval."
  });

  const rows = await supabase(
    `/rest/v1/lawyer_profiles?user_id=eq.${userId}&select=display_name,profile_picture_url,year_of_call,supreme_court_number,show_call_details_public,pro_bono_open,verified&limit=1`
  );
  const profile = rows[0];

  if (!profile) throw new Error("Approved lawyer profile was not created.");
  if (profile.year_of_call !== "2012") throw new Error("year_of_call was not stored.");
  if (!profile.supreme_court_number?.startsWith("SCN-")) throw new Error("supreme_court_number was not stored.");
  if (profile.profile_picture_url !== "https://example.com/profile.jpg") throw new Error("profile_picture_url was not stored.");
  if (profile.show_call_details_public !== true) throw new Error("show_call_details_public was not stored.");
  if (profile.pro_bono_open !== true) throw new Error("pro_bono_open was not stored.");
  if (profile.verified !== true) throw new Error("verified flag was not set.");

  console.log(JSON.stringify({
    ok: true,
    draftApproved: true,
    profileStoredNewFields: true,
    checked: {
      year_of_call: profile.year_of_call,
      has_scn: Boolean(profile.supreme_court_number),
      show_call_details_public: profile.show_call_details_public,
      pro_bono_open: profile.pro_bono_open,
      verified: profile.verified
    }
  }, null, 2));
} finally {
  await cleanup();
}
