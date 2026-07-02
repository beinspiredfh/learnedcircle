const SUPABASE_URL = process.env.SUPABASE_URL || "https://tnxdulqdfanzlawuonmf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_UxaC8agmrd3bAkxhxQRzXA_uOCvnyKd";
const crypto = require("crypto");

const NIGERIA_LOCATIONS = new Set([
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara"
]);

function getSupabaseServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
}

async function readJson(request) {
  return typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};
}

async function supabaseServiceFetch(path, options = {}) {
  const serviceKey = getSupabaseServiceKey();

  if (!serviceKey) {
    return {
      ok: false,
      status: 500,
      json: async () => ({ message: "Supabase service key is not configured." }),
      text: async () => "Supabase service key is not configured."
    };
  }

  return fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
}

async function supabasePublicFetch(path, options = {}) {
  return fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
}

async function verifyUser(accessToken) {
  if (!accessToken) return null;

  const userResponse = await supabasePublicFetch("/auth/v1/user", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!userResponse.ok) return null;
  return userResponse.json();
}

function profilePayload({ id, fullName, email, role }) {
  return {
    id,
    full_name: fullName,
    email,
    role,
    membership: "free"
  };
}

function cleanText(value) {
  return String(value || "").trim();
}

function splitList(value) {
  return cleanText(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function originFromRequest(request) {
  const host = request.headers.host || "learnedcircle.com";
  const protocol = request.headers["x-forwarded-proto"] || "https";
  return `${protocol}://${host}`;
}

function getPaystackSecretKey() {
  return process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_TEST_SECRET_KEY;
}

function paystackReady() {
  return Boolean(getPaystackSecretKey());
}

function moneyKobo(value) {
  return Number(value || 0);
}

function commissionKobo(amountKobo, rate = 5) {
  return Math.ceil(moneyKobo(amountKobo) * (rate / 100));
}

function premiumPlan(planCode) {
  const plans = {
    monthly: {
      planCode: "monthly",
      label: "Premium Monthly",
      amountKobo: 1000000
    },
    yearly: {
      planCode: "yearly",
      label: "Premium Yearly",
      amountKobo: 10000000
    }
  };

  return plans[planCode] || plans.monthly;
}

function advertPlan(duration) {
  const plans = {
    daily: { duration: "daily", label: "Daily advert", amountKobo: 1000000 },
    weekly: { duration: "weekly", label: "Weekly advert", amountKobo: 2000000 },
    monthly: { duration: "monthly", label: "Monthly advert", amountKobo: 10000000 }
  };

  return plans[duration] || plans.daily;
}

async function paystackRequest(path, options = {}) {
  const secretKey = getPaystackSecretKey();

  if (!secretKey) {
    return {
      ok: false,
      status: 503,
      json: async () => ({ message: "Paystack secret key is not configured yet." })
    };
  }

  return fetch(`https://api.paystack.co${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
}

async function initializePaystackTransaction({ email, amountKobo, reference, callbackUrl, metadata }) {
  const paystackResponse = await paystackRequest("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email,
      amount: amountKobo,
      reference,
      callback_url: callbackUrl,
      metadata
    })
  });
  const paystackData = await paystackResponse.json();

  if (!paystackResponse.ok || paystackData.status !== true) {
    return {
      ok: false,
      status: paystackResponse.status || 502,
      message: paystackData.message || "Paystack could not initialize payment."
    };
  }

  return {
    ok: true,
    authorizationUrl: paystackData.data.authorization_url,
    accessCode: paystackData.data.access_code,
    reference: paystackData.data.reference
  };
}

async function verifyPaystackTransaction(reference) {
  const verifyResponse = await paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`);
  const verifyData = await verifyResponse.json();

  if (!verifyResponse.ok || verifyData.status !== true) {
    return {
      ok: false,
      status: verifyResponse.status || 502,
      message: verifyData.message || "Paystack payment verification failed."
    };
  }

  return {
    ok: true,
    data: verifyData.data,
    paid: verifyData.data.status === "success"
  };
}

async function insertPlatformPayment(payment = {}) {
  const paymentResponse = await supabaseServiceFetch("/rest/v1/platform_payments", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payment)
  });
  const paymentRows = await paymentResponse.json();

  if (!paymentResponse.ok) {
    return { ok: false, status: paymentResponse.status, message: paymentRows.message || "Could not create payment record." };
  }

  return { ok: true, payment: paymentRows[0] };
}

async function markPaymentStatus(reference, status, metadata = {}) {
  const paymentResponse = await supabaseServiceFetch(
    `/rest/v1/platform_payments?provider_reference=eq.${encodeURIComponent(reference)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ status, metadata })
    }
  );
  const paymentRows = await paymentResponse.json();

  if (!paymentResponse.ok) {
    return { ok: false, status: paymentResponse.status, message: paymentRows.message || "Could not update payment record." };
  }

  return { ok: true, payment: paymentRows[0] };
}

function paystackSignatureValid(rawBody, signature) {
  const secretKey = getPaystackSecretKey();

  if (!secretKey || !signature) return false;

  const digest = crypto
    .createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");

  return digest === signature;
}

async function applySuccessfulPayment(reference, paystackData = {}) {
  const paymentUpdate = await markPaymentStatus(reference, "paid", {
    paystack: paystackData,
    verified_at: new Date().toISOString()
  });

  if (!paymentUpdate.ok) return paymentUpdate;

  const payment = paymentUpdate.payment;

  if (payment?.payment_type === "premium_subscription" && payment.metadata?.user_id) {
    await supabaseServiceFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(payment.metadata.user_id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ membership: "premium_pending" })
    });

    await supabaseServiceFetch("/rest/v1/premium_subscriptions", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        account_email: payment.payer_email,
        plan_code: payment.metadata.plan_code || "monthly",
        payment_id: payment.id,
        starts_at: new Date().toISOString(),
        status: "active",
        metadata: payment.metadata || {}
      })
    });
  }

  if (payment?.payment_type === "client_legal_work") {
    await supabaseServiceFetch("/rest/v1/platform_commissions", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        payment_id: payment.id,
        commission_rate: 5,
        commission_amount_kobo: commissionKobo(payment.amount_kobo, 5),
        status: "earned",
        metadata: payment.metadata || {}
      })
    });
  }

  return { ok: true, payment };
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderModerationFields(fields = []) {
  return fields
    .map((field) => `<p><strong>${escapeHtml(field.label)}</strong><br>${escapeHtml(field.value || "Not provided")}</p>`)
    .join("");
}

async function notifyModeration(payload = {}) {
  const moderationEmail = process.env.MODERATION_EMAIL;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!moderationEmail || !resendApiKey) return;

  const subject = `New LearnedCircle review item: ${payload.type || "Account draft"}`;
  const html = `
    <h2>${escapeHtml(subject)}</h2>
    <p><strong>Source</strong><br>${escapeHtml(payload.source || "LearnedCircle account dashboard")}</p>
    ${renderModerationFields(payload.fields)}
    <p><a href="https://learnedcircle.com/admin">Open admin moderation</a></p>
  `;

  await fetch("https://api.resend.com/emails", {
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
      attachments: payload.attachments || []
    })
  }).catch(() => null);
}

async function loadProfile(userId) {
  const profileResponse = await supabaseServiceFetch(
    `/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,full_name,email,role,membership,created_at,updated_at`
  );
  const profileData = await profileResponse.json();

  if (!profileResponse.ok) return null;
  return profileData[0] || null;
}

async function touchLawyerPresence(userId) {
  if (!userId) return;

  await supabaseServiceFetch(`/rest/v1/lawyer_profiles?user_id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ updated_at: new Date().toISOString() })
  });
}

async function loadMessageNames(userIds) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (!uniqueIds.length) return {};

  const profilesResponse = await supabaseServiceFetch(
    `/rest/v1/profiles?id=in.(${uniqueIds.map(encodeURIComponent).join(",")})&select=id,full_name,email,role`
  );
  const profiles = await profilesResponse.json();

  if (!profilesResponse.ok) return {};
  return Object.fromEntries(profiles.map((profile) => [profile.id, profile]));
}

async function loadRows(path) {
  const rowsResponse = await supabaseServiceFetch(path);
  const rows = await rowsResponse.json();

  if (!rowsResponse.ok) return [];
  return Array.isArray(rows) ? rows : [];
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const body = await readJson(request);
  const paystackSignature = request.headers["x-paystack-signature"];

  if (paystackSignature && body?.event) {
    const rawBody = typeof request.body === "string" ? request.body : JSON.stringify(body || {});

    if (!paystackSignatureValid(rawBody, paystackSignature)) {
      response.status(401).json({ ok: false, message: "Invalid Paystack signature." });
      return;
    }

    if (body.event === "charge.success" && body.data?.reference) {
      const applied = await applySuccessfulPayment(body.data.reference, body.data);

      if (!applied.ok) {
        response.status(applied.status || 500).json({ ok: false, message: applied.message || "Payment webhook could not be applied." });
        return;
      }
    }

    response.status(200).json({ ok: true, message: "Paystack webhook received." });
    return;
  }

  if (body.action === "signup") {
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = String(body.role || "client");
    const termsAccepted = body.termsAccepted === true;
    const allowedRoles = new Set(["client", "lawyer", "law_firm", "employer", "advertiser"]);

    if (!fullName || !email || password.length < 8 || !allowedRoles.has(role)) {
      response.status(400).json({ ok: false, message: "Enter a name, valid role, email and password of at least 8 characters." });
      return;
    }

    if (!termsAccepted) {
      response.status(400).json({ ok: false, message: "You must accept the Terms of Use, Privacy Notice and Legal Disclaimer before creating an account." });
      return;
    }

    const userResponse = await supabaseServiceFetch("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role,
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
          terms_version: "2026-06-15"
        }
      })
    });
    const userData = await userResponse.json();

    if (!userResponse.ok) {
      response.status(userResponse.status).json({ ok: false, message: userData.msg || userData.message || "Could not create account." });
      return;
    }

    const profileResponse = await supabaseServiceFetch("/rest/v1/profiles?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(profilePayload({ id: userData.id, fullName, email, role }))
    });
    const profileData = await profileResponse.json();

    if (!profileResponse.ok) {
      response.status(profileResponse.status).json({ ok: false, message: profileData.message || "Account was created, but profile setup failed." });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Account created. You can now log in.",
      user: { id: userData.id, email: userData.email },
      profile: profileData[0]
    });
    return;
  }

  if (body.action === "login") {
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    const loginResponse = await supabasePublicFetch("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      response.status(loginResponse.status).json({ ok: false, message: loginData.error_description || loginData.msg || loginData.message || "Login failed." });
      return;
    }

    await touchLawyerPresence(loginData.user?.id);

    response.status(200).json({ ok: true, session: loginData });
    return;
  }

  if (body.action === "me") {
    const user = await verifyUser(body.accessToken);

    if (!user) {
      response.status(401).json({ ok: false, message: "Session expired. Please log in again." });
      return;
    }

    const profile = await loadProfile(user.id);
    await touchLawyerPresence(user.id);

    response.status(200).json({ ok: true, user, profile });
    return;
  }

  if (body.action === "update-profile") {
    const user = await verifyUser(body.accessToken);

    if (!user) {
      response.status(401).json({ ok: false, message: "Session expired. Please log in again." });
      return;
    }

    const fullName = String(body.fullName || "").trim();
    const role = String(body.role || "client");
    const allowedRoles = new Set(["client", "lawyer", "law_firm", "employer", "advertiser"]);

    if (!fullName || !allowedRoles.has(role)) {
      response.status(400).json({ ok: false, message: "Enter a name and valid account role." });
      return;
    }

    const profileResponse = await supabaseServiceFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ full_name: fullName, role })
    });
    const profileData = await profileResponse.json();

    if (!profileResponse.ok) {
      response.status(profileResponse.status).json({ ok: false, message: profileData.message || "Could not update profile." });
      return;
    }

    response.status(200).json({ ok: true, message: "Profile updated.", profile: profileData[0] });
    return;
  }

  if (body.action === "dashboard-summary") {
    const user = await verifyUser(body.accessToken);

    if (!user) {
      response.status(401).json({ ok: false, message: "Session expired. Please log in again." });
      return;
    }

    const [lawyerProfiles, unreadMessages, articles, pendingDrafts, followers, following] = await Promise.all([
      loadRows(`/rest/v1/lawyer_profiles?user_id=eq.${encodeURIComponent(user.id)}&select=id,display_name,verified,direct_client_contact,updated_at&limit=1`),
      loadRows(`/rest/v1/messages?recipient_id=eq.${encodeURIComponent(user.id)}&read_at=is.null&select=id`),
      loadRows(`/rest/v1/articles?author_id=eq.${encodeURIComponent(user.id)}&select=id,status`),
      loadRows(`/rest/v1/moderation_queue?submitter_id=eq.${encodeURIComponent(user.id)}&status=eq.pending_review&select=id,item_type`),
      loadRows(`/rest/v1/lawyer_follows?followed_id=eq.${encodeURIComponent(user.id)}&select=follower_id`),
      loadRows(`/rest/v1/lawyer_follows?follower_id=eq.${encodeURIComponent(user.id)}&select=followed_id`)
    ]);
    const lawyerProfile = lawyerProfiles[0];

    response.status(200).json({
      ok: true,
      summary: {
        lawyerProfile: {
          submitted: Boolean(lawyerProfile),
          verified: lawyerProfile?.verified === true,
          directClientContact: lawyerProfile?.direct_client_contact === true,
          displayName: lawyerProfile?.display_name || ""
        },
        unreadMessages: unreadMessages.length,
        articles: articles.length,
        pendingDrafts: pendingDrafts.length,
        followers: followers.length,
        following: following.length
      }
    });
    return;
  }

  if (body.action === "initialize-premium-payment") {
    const user = await verifyUser(body.accessToken);

    if (!user) {
      response.status(401).json({ ok: false, message: "Session expired. Please log in again." });
      return;
    }

    if (!paystackReady()) {
      response.status(503).json({
        ok: false,
        message: "Paystack is not configured yet. Premium payment can be requested for admin review for now."
      });
      return;
    }

    const profile = await loadProfile(user.id);
    const plan = premiumPlan(String(body.planCode || "monthly"));
    const reference = `LC-PREMIUM-${plan.planCode}-${Date.now()}-${user.id.slice(0, 8)}`;
    const callbackUrl = `${originFromRequest(request)}/account.html?payment=paystack&reference=${encodeURIComponent(reference)}`;
    const metadata = {
      learnedcircle_type: "premium_subscription",
      user_id: user.id,
      email: user.email,
      plan_code: plan.planCode,
      profile_role: profile?.role || null
    };

    const paymentRecord = await insertPlatformPayment({
      payment_type: "premium_subscription",
      payer_name: profile?.full_name || user.email,
      payer_email: user.email,
      provider: "paystack",
      provider_reference: reference,
      amount_kobo: plan.amountKobo,
      currency: "NGN",
      status: "awaiting_payment",
      metadata
    });

    if (!paymentRecord.ok) {
      response.status(paymentRecord.status).json({ ok: false, message: paymentRecord.message });
      return;
    }

    const checkout = await initializePaystackTransaction({
      email: user.email,
      amountKobo: plan.amountKobo,
      reference,
      callbackUrl,
      metadata
    });

    if (!checkout.ok) {
      response.status(checkout.status).json({ ok: false, message: checkout.message });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Paystack checkout created.",
      authorizationUrl: checkout.authorizationUrl,
      accessCode: checkout.accessCode,
      reference: checkout.reference,
      payment: paymentRecord.payment
    });
    return;
  }

  if (body.action === "initialize-advert-payment") {
    const email = cleanText(body.email).toLowerCase();
    const organization = cleanText(body.organization);
    const plan = advertPlan(String(body.duration || "daily"));

    if (!email || !organization) {
      response.status(400).json({ ok: false, message: "Organization and contact email are required for advert payment." });
      return;
    }

    if (!paystackReady()) {
      response.status(503).json({ ok: false, message: "Paystack is not configured yet. Submit the advert request for admin review." });
      return;
    }

    const reference = `LC-ADVERT-${plan.duration}-${Date.now()}`;
    const callbackUrl = `${originFromRequest(request)}/index.html?payment=paystack&reference=${encodeURIComponent(reference)}#advertise`;
    const metadata = {
      learnedcircle_type: "advert",
      organization,
      advert_duration: plan.duration
    };

    const requestResponse = await supabaseServiceFetch("/rest/v1/advert_payment_requests", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        organization,
        contact_email: email,
        advert_duration: plan.duration,
        quoted_amount_kobo: plan.amountKobo,
        status: "awaiting_payment",
        metadata
      })
    });
    const requestRows = await requestResponse.json();

    if (!requestResponse.ok) {
      response.status(requestResponse.status).json({ ok: false, message: requestRows.message || "Could not create advert payment request." });
      return;
    }

    const paymentRecord = await insertPlatformPayment({
      payment_type: "advert",
      payer_name: organization,
      payer_email: email,
      related_item_id: requestRows[0]?.id || null,
      provider: "paystack",
      provider_reference: reference,
      amount_kobo: plan.amountKobo,
      currency: "NGN",
      status: "awaiting_payment",
      metadata
    });

    if (!paymentRecord.ok) {
      response.status(paymentRecord.status).json({ ok: false, message: paymentRecord.message });
      return;
    }

    await supabaseServiceFetch(`/rest/v1/advert_payment_requests?id=eq.${encodeURIComponent(requestRows[0].id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ payment_id: paymentRecord.payment.id })
    });

    const checkout = await initializePaystackTransaction({
      email,
      amountKobo: plan.amountKobo,
      reference,
      callbackUrl,
      metadata
    });

    if (!checkout.ok) {
      response.status(checkout.status).json({ ok: false, message: checkout.message });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Advert payment checkout created.",
      authorizationUrl: checkout.authorizationUrl,
      reference: checkout.reference
    });
    return;
  }

  if (body.action === "initialize-lawyer-work-payment") {
    const email = cleanText(body.email).toLowerCase();
    const clientName = cleanText(body.clientName);
    const lawyerName = cleanText(body.lawyerName);
    const lawyerProfileId = cleanText(body.lawyerProfileId);
    const workType = cleanText(body.workType || "Legal work");
    const workDescription = cleanText(body.workDescription);
    const quoteAmountKobo = moneyKobo(body.quoteAmountKobo);

    if (!email || !clientName || !lawyerName || !lawyerProfileId || !workDescription || quoteAmountKobo <= 0) {
      response.status(400).json({ ok: false, message: "Client details, lawyer, work description and quote amount are required." });
      return;
    }

    if (!paystackReady()) {
      response.status(503).json({ ok: false, message: "Paystack is not configured yet. Save the quote and collect payment after setup." });
      return;
    }

    const platformCommissionKobo = commissionKobo(quoteAmountKobo, 5);
    const lawyerSettlementKobo = Math.max(quoteAmountKobo - platformCommissionKobo, 0);
    const reference = `LC-WORK-${Date.now()}-${lawyerProfileId.slice(0, 8)}`;
    const callbackUrl = `${originFromRequest(request)}/index.html?payment=paystack&reference=${encodeURIComponent(reference)}#lawyers`;
    const metadata = {
      learnedcircle_type: "client_legal_work",
      lawyer_profile_id: lawyerProfileId,
      lawyer_name: lawyerName,
      work_type: workType,
      platform_commission_rate: 5,
      platform_commission_kobo: platformCommissionKobo,
      lawyer_settlement_kobo: lawyerSettlementKobo
    };

    const workResponse = await supabaseServiceFetch("/rest/v1/lawyer_work_requests", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        client_name: clientName,
        client_email: email,
        client_phone: cleanText(body.clientPhone) || null,
        lawyer_profile_id: lawyerProfileId,
        lawyer_name: lawyerName,
        work_type: workType,
        work_description: workDescription,
        status: "awaiting_payment",
        metadata
      })
    });
    const workRows = await workResponse.json();

    if (!workResponse.ok) {
      response.status(workResponse.status).json({ ok: false, message: workRows.message || "Could not create lawyer work request." });
      return;
    }

    const paymentRecord = await insertPlatformPayment({
      payment_type: "client_legal_work",
      payer_name: clientName,
      payer_email: email,
      lawyer_profile_id: lawyerProfileId,
      related_item_id: workRows[0]?.id || null,
      provider: "paystack",
      provider_reference: reference,
      amount_kobo: quoteAmountKobo,
      currency: "NGN",
      status: "awaiting_payment",
      metadata
    });

    if (!paymentRecord.ok) {
      response.status(paymentRecord.status).json({ ok: false, message: paymentRecord.message });
      return;
    }

    const quoteResponse = await supabaseServiceFetch("/rest/v1/lawyer_work_quotes", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        work_request_id: workRows[0].id,
        lawyer_profile_id: lawyerProfileId,
        lawyer_name: lawyerName,
        quote_amount_kobo: quoteAmountKobo,
        platform_commission_rate: 5,
        platform_commission_kobo: platformCommissionKobo,
        lawyer_settlement_kobo: lawyerSettlementKobo,
        status: "awaiting_payment",
        payment_id: paymentRecord.payment.id,
        settlement_status: "not_due",
        terms: cleanText(body.terms),
        metadata
      })
    });
    const quoteRows = await quoteResponse.json();

    if (!quoteResponse.ok) {
      response.status(quoteResponse.status).json({ ok: false, message: quoteRows.message || "Could not create lawyer quote." });
      return;
    }

    const checkout = await initializePaystackTransaction({
      email,
      amountKobo: quoteAmountKobo,
      reference,
      callbackUrl,
      metadata: { ...metadata, work_request_id: workRows[0].id, quote_id: quoteRows[0].id }
    });

    if (!checkout.ok) {
      response.status(checkout.status).json({ ok: false, message: checkout.message });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Client-lawyer work payment checkout created.",
      authorizationUrl: checkout.authorizationUrl,
      reference: checkout.reference,
      commission: {
        rate: 5,
        amountKobo: platformCommissionKobo,
        lawyerSettlementKobo
      }
    });
    return;
  }

  if (body.action === "verify-paystack-payment") {
    const reference = cleanText(body.reference);

    if (!reference) {
      response.status(400).json({ ok: false, message: "Payment reference is required." });
      return;
    }

    const verification = await verifyPaystackTransaction(reference);

    if (!verification.ok) {
      response.status(verification.status).json({ ok: false, message: verification.message });
      return;
    }

    const paymentUpdate = verification.paid
      ? await applySuccessfulPayment(reference, verification.data)
      : await markPaymentStatus(reference, "failed", {
          paystack: verification.data,
          verified_at: new Date().toISOString()
        });

    if (!paymentUpdate.ok) {
      response.status(paymentUpdate.status || 500).json({ ok: false, message: paymentUpdate.message || "Could not update payment record." });
      return;
    }

    response.status(200).json({
      ok: true,
      message: verification.paid ? "Payment confirmed." : "Payment was not successful.",
      status: verification.paid ? "paid" : "failed",
      payment: paymentUpdate.payment
    });
    return;
  }

  if (body.action === "premium-request") {
    const user = await verifyUser(body.accessToken);

    if (!user) {
      response.status(401).json({ ok: false, message: "Session expired. Please log in again." });
      return;
    }

    await supabaseServiceFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ membership: "premium_pending" })
    });

    const queueResponse = await supabaseServiceFetch("/rest/v1/moderation_queue", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        submitter_id: user.id,
        item_type: "Premium account request",
        payload: {
          source: "LearnedCircle account dashboard",
          fields: [
            { label: "Email", value: user.email },
            { label: "Request", value: "Upgrade account to premium" }
          ],
          received_at: new Date().toISOString()
        },
        status: "pending_review"
      })
    });

    if (!queueResponse.ok) {
      const queueError = await queueResponse.json();
      response.status(queueResponse.status).json({ ok: false, message: queueError.message || "Premium request could not be submitted." });
      return;
    }

    await notifyModeration({
      type: "Premium account request",
      source: "LearnedCircle account dashboard",
      fields: [
        { label: "Email", value: user.email },
        { label: "Request", value: "Upgrade account to premium" }
      ]
    });

    response.status(200).json({ ok: true, message: "Premium request sent for review." });
    return;
  }

  if (body.action === "lawyer-profile-submit") {
    const user = await verifyUser(body.accessToken);

    if (!user) {
      response.status(401).json({ ok: false, message: "Session expired. Please log in again." });
      return;
    }

    const profile = body.profile || {};
    const yearOfCall = cleanText(profile.yearOfCall);
    const showCallDetailsPublic = profile.showCallDetailsPublic === true;
    const lawyerProfile = {
      user_id: user.id,
      display_name: cleanText(profile.displayName),
      profile_picture_url: cleanText(profile.profilePictureUrl),
      credentials: cleanText(profile.credentials),
      year_of_call: yearOfCall,
      supreme_court_number: cleanText(profile.supremeCourtNumber),
      show_call_details_public: showCallDetailsPublic,
      location: cleanText(profile.location),
      firm: cleanText(profile.firm),
      practice_areas: splitList(profile.practiceAreas),
      languages: cleanText(profile.languages),
      fees: cleanText(profile.fees),
      availability: cleanText(profile.availability),
      pro_bono_open: profile.proBonoOpen === true,
      summary: cleanText(profile.summary),
      verification_note: cleanText(profile.verificationNote),
      verified: false,
      direct_client_contact: false
    };

    if (!lawyerProfile.display_name || !lawyerProfile.supreme_court_number || !lawyerProfile.location || !lawyerProfile.practice_areas.length || !lawyerProfile.summary) {
      response.status(400).json({ ok: false, message: "Display name, Supreme Court number / SCN, location, practice areas and summary are required." });
      return;
    }

    if (!NIGERIA_LOCATIONS.has(lawyerProfile.location)) {
      response.status(400).json({ ok: false, message: "Select a valid Nigerian state or FCT as location." });
      return;
    }

    const queueResponse = await supabaseServiceFetch("/rest/v1/moderation_queue", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        submitter_id: user.id,
        item_type: "Lawyer profile submission",
        payload: {
          source: "LearnedCircle account dashboard",
          profile: lawyerProfile,
          fields: [
            { label: "Display name", value: lawyerProfile.display_name },
            { label: "Profile picture URL", value: lawyerProfile.profile_picture_url || "Not provided" },
            { label: "Credentials", value: lawyerProfile.credentials || "Not provided" },
            { label: "Year of call", value: lawyerProfile.year_of_call || "Not provided" },
            { label: "Supreme Court number", value: lawyerProfile.supreme_court_number || "Not provided" },
            { label: "Show call details publicly", value: lawyerProfile.show_call_details_public ? "Yes" : "No" },
            { label: "Location", value: lawyerProfile.location },
            { label: "Firm", value: lawyerProfile.firm || "Not provided" },
            { label: "Practice areas", value: lawyerProfile.practice_areas.join(", ") },
            { label: "Languages", value: lawyerProfile.languages || "Not provided" },
            { label: "Fees", value: lawyerProfile.fees || "Not provided" },
            { label: "Availability", value: lawyerProfile.availability || "Not provided" },
            { label: "Open to pro bono matters", value: lawyerProfile.pro_bono_open ? "Yes" : "No" },
            { label: "Summary", value: lawyerProfile.summary },
            { label: "Verification note", value: lawyerProfile.verification_note || "Not provided" }
          ],
          received_at: new Date().toISOString()
        },
        status: "pending_review"
      })
    });
    const queueData = await queueResponse.json();

    if (!queueResponse.ok) {
      response.status(queueResponse.status).json({ ok: false, message: queueData.message || "Lawyer profile could not be submitted." });
      return;
    }

    await notifyModeration({
      type: "Lawyer profile submission",
      source: "LearnedCircle account dashboard",
      fields: [
        { label: "Display name", value: lawyerProfile.display_name },
        { label: "Supreme Court number", value: lawyerProfile.supreme_court_number },
        { label: "Year of call", value: lawyerProfile.year_of_call || "Not provided" },
        { label: "Location", value: lawyerProfile.location },
        { label: "Practice areas", value: lawyerProfile.practice_areas.join(", ") },
        { label: "Open to pro bono matters", value: lawyerProfile.pro_bono_open ? "Yes" : "No" }
      ]
    });

    response.status(200).json({
      ok: true,
      message: "Lawyer profile submitted for verification.",
      draft: queueData[0]
    });
    return;
  }

  if (body.action === "job-post-submit") {
    const user = await verifyUser(body.accessToken);

    if (!user) {
      response.status(401).json({ ok: false, message: "Session expired. Please log in again." });
      return;
    }

    const job = body.job || {};
    const jobPost = {
      owner_id: user.id,
      title: cleanText(job.title),
      organization: cleanText(job.organization),
      location: cleanText(job.location),
      engagement_type: cleanText(job.engagementType),
      practice_areas: splitList(job.practiceAreas),
      budget: cleanText(job.budget),
      description: cleanText(job.description),
      status: "pending_review"
    };

    if (!jobPost.title || !jobPost.organization || !jobPost.engagement_type || !jobPost.practice_areas.length || !jobPost.description) {
      response.status(400).json({ ok: false, message: "Title, organization, engagement type, practice areas and description are required." });
      return;
    }

    const queueResponse = await supabaseServiceFetch("/rest/v1/moderation_queue", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        submitter_id: user.id,
        item_type: "Job post submission",
        payload: {
          source: "LearnedCircle account dashboard",
          job: jobPost,
          fields: [
            { label: "Opportunity title", value: jobPost.title },
            { label: "Organization", value: jobPost.organization },
            { label: "Location", value: jobPost.location || "Not provided" },
            { label: "Engagement type", value: jobPost.engagement_type },
            { label: "Practice areas", value: jobPost.practice_areas.join(", ") },
            { label: "Budget or fee range", value: jobPost.budget || "Not provided" },
            { label: "Description", value: jobPost.description }
          ],
          received_at: new Date().toISOString()
        },
        status: "pending_review"
      })
    });
    const queueData = await queueResponse.json();

    if (!queueResponse.ok) {
      response.status(queueResponse.status).json({ ok: false, message: queueData.message || "Opportunity could not be submitted." });
      return;
    }

    await notifyModeration({
      type: "Job post submission",
      source: "LearnedCircle account dashboard",
      fields: [
        { label: "Opportunity title", value: jobPost.title },
        { label: "Organization", value: jobPost.organization },
        { label: "Engagement type", value: jobPost.engagement_type },
        { label: "Practice areas", value: jobPost.practice_areas.join(", ") },
        { label: "Budget or fee range", value: jobPost.budget || "Not provided" }
      ]
    });

    response.status(200).json({
      ok: true,
      message: "Opportunity submitted for moderation.",
      draft: queueData[0]
    });
    return;
  }

  if (body.action === "article-submit") {
    const user = await verifyUser(body.accessToken);

    if (!user) {
      response.status(401).json({ ok: false, message: "Session expired. Please log in again." });
      return;
    }

    const profile = await loadProfile(user.id);
    const article = body.article || {};
    const articleFile = article.articleFile || null;
    const articleDraft = {
      author_id: user.id,
      title: cleanText(article.title),
      practice_area: cleanText(article.practiceArea),
      summary: cleanText(article.summary),
      body: cleanText(article.body || (articleFile?.name ? `Article uploaded as ${articleFile.name} for editorial processing.` : "")),
      byline: cleanText(article.byline),
      writer_picture_url: cleanText(article.writerPictureUrl, 500),
      article_file: articleFile ? {
        name: cleanText(articleFile.name, 240),
        type: cleanText(articleFile.type, 120),
        size: Number(articleFile.size || 0),
        contentBase64: cleanText(articleFile.contentBase64, 3500000)
      } : null,
      status: "pending_review"
    };

    if (!articleDraft.title || !articleDraft.practice_area || !articleDraft.summary || !articleDraft.body || !articleDraft.byline) {
      response.status(400).json({ ok: false, message: "Title, practice area, byline, summary and article body are required." });
      return;
    }

    const lawyerResponse = await supabaseServiceFetch(
      `/rest/v1/lawyer_profiles?user_id=eq.${encodeURIComponent(user.id)}&verified=eq.true&select=id,display_name&limit=1`
    );
    const lawyerProfiles = await lawyerResponse.json();

    if (profile?.membership === "premium_active" && lawyerResponse.ok && lawyerProfiles[0]) {
      const publishResponse = await supabaseServiceFetch("/rest/v1/articles", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          author_id: articleDraft.author_id,
          title: articleDraft.title,
          practice_area: articleDraft.practice_area,
          summary: articleDraft.summary,
          body: articleDraft.body,
          byline: articleDraft.byline || `By ${lawyerProfiles[0].display_name}`,
          status: "approved"
        })
      });
      const publishData = await publishResponse.json();

      if (!publishResponse.ok) {
        response.status(publishResponse.status).json({ ok: false, message: publishData.message || "Article could not be published." });
        return;
      }

      response.status(200).json({
        ok: true,
        message: "Article published directly to your public profile.",
        article: publishData[0]
      });
      return;
    }

    const queueResponse = await supabaseServiceFetch("/rest/v1/moderation_queue", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        submitter_id: user.id,
        item_type: "Article submission",
        payload: {
          source: "LearnedCircle account dashboard",
          article: articleDraft,
          fields: [
            { label: "Article title", value: articleDraft.title },
            { label: "Practice area", value: articleDraft.practice_area },
            { label: "Byline", value: articleDraft.byline },
            { label: "Preferred picture URL", value: articleDraft.writer_picture_url || "Not provided" },
            { label: "Summary", value: articleDraft.summary },
            { label: "Article body", value: articleDraft.body },
            { label: "Word article file", value: articleDraft.article_file?.name || "Not uploaded" }
          ],
          article_file: articleDraft.article_file ? {
            name: articleDraft.article_file.name,
            type: articleDraft.article_file.type,
            size: articleDraft.article_file.size,
            attached_to_email: Boolean(articleDraft.article_file.contentBase64)
          } : null,
          received_at: new Date().toISOString()
        },
        status: "pending_review"
      })
    });
    const queueData = await queueResponse.json();

    if (!queueResponse.ok) {
      response.status(queueResponse.status).json({ ok: false, message: queueData.message || "Article could not be submitted." });
      return;
    }

    await notifyModeration({
      type: "Article submission",
      source: "LearnedCircle account dashboard",
      fields: [
        { label: "Article title", value: articleDraft.title },
        { label: "Practice area", value: articleDraft.practice_area },
        { label: "Byline", value: articleDraft.byline },
        { label: "Preferred picture URL", value: articleDraft.writer_picture_url || "Not provided" },
        { label: "Summary", value: articleDraft.summary },
        { label: "Word article file", value: articleDraft.article_file?.name || "Not uploaded" }
      ],
      attachments: articleDraft.article_file?.contentBase64
        ? [{ filename: articleDraft.article_file.name, content: articleDraft.article_file.contentBase64 }]
        : []
    });

    response.status(200).json({
      ok: true,
      message: "Article submitted for editorial review.",
      draft: queueData[0]
    });
    return;
  }

  if (body.action === "message-options") {
    const user = await verifyUser(body.accessToken);

    if (!user) {
      response.status(401).json({ ok: false, message: "Session expired. Please log in again." });
      return;
    }

    const senderProfile = await loadProfile(user.id);
    await touchLawyerPresence(user.id);
    const lawyersResponse = await supabaseServiceFetch(
      "/rest/v1/lawyer_profiles?verified=eq.true&select=id,user_id,display_name,location,practice_areas,direct_client_contact,updated_at&order=display_name.asc"
    );
    const lawyers = await lawyersResponse.json();

    if (!lawyersResponse.ok) {
      response.status(lawyersResponse.status).json({ ok: false, message: lawyers.message || "Could not load message recipients." });
      return;
    }

    const isLegalPeer = ["lawyer", "law_firm", "admin"].includes(senderProfile?.role);
    const recipients = lawyers
      .filter((lawyer) => lawyer.user_id !== user.id)
      .map((lawyer) => ({
        ...lawyer,
        is_online: lawyer.updated_at ? (Date.now() - new Date(lawyer.updated_at).getTime()) < 15 * 60 * 1000 : false,
        can_message: Boolean(lawyer.direct_client_contact || isLegalPeer),
        contact_rule: lawyer.direct_client_contact
          ? "Direct client contact enabled"
          : isLegalPeer
            ? "Lawyer chat enabled"
            : "Premium direct contact not enabled"
      }));

    response.status(200).json({ ok: true, recipients });
    return;
  }

  if (body.action === "send-message") {
    const user = await verifyUser(body.accessToken);

    if (!user) {
      response.status(401).json({ ok: false, message: "Session expired. Please log in again." });
      return;
    }

    const subject = cleanText(body.subject);
    const messageBody = cleanText(body.body);
    const lawyerProfileId = cleanText(body.lawyerProfileId);
    await touchLawyerPresence(user.id);

    if (!lawyerProfileId || !subject || !messageBody) {
      response.status(400).json({ ok: false, message: "Choose a recipient, add a subject and write a message." });
      return;
    }

    const senderProfile = await loadProfile(user.id);
    const lawyerResponse = await supabaseServiceFetch(
      `/rest/v1/lawyer_profiles?id=eq.${encodeURIComponent(lawyerProfileId)}&verified=eq.true&select=id,user_id,display_name,direct_client_contact&limit=1`
    );
    const lawyerRows = await lawyerResponse.json();

    if (!lawyerResponse.ok || !lawyerRows[0]) {
      response.status(404).json({ ok: false, message: "Recipient lawyer profile was not found." });
      return;
    }

    const lawyer = lawyerRows[0];
    const isLegalPeer = ["lawyer", "law_firm", "admin"].includes(senderProfile?.role);

    if (!lawyer.direct_client_contact && !isLegalPeer) {
      response.status(403).json({
        ok: false,
        message: "Direct client contact is available only for premium verified lawyer accounts. Submit a case brief instead."
      });
      return;
    }

    const insertResponse = await supabaseServiceFetch("/rest/v1/messages", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        sender_id: user.id,
        recipient_id: lawyer.user_id,
        subject,
        body: messageBody
      })
    });
    const insertData = await insertResponse.json();

    if (!insertResponse.ok) {
      response.status(insertResponse.status).json({ ok: false, message: insertData.message || "Message could not be sent." });
      return;
    }

    response.status(200).json({ ok: true, message: "Message sent.", item: insertData[0] });
    return;
  }

  if (body.action === "messages") {
    const user = await verifyUser(body.accessToken);

    if (!user) {
      response.status(401).json({ ok: false, message: "Session expired. Please log in again." });
      return;
    }

    const messagesResponse = await supabaseServiceFetch(
      `/rest/v1/messages?or=(sender_id.eq.${encodeURIComponent(user.id)},recipient_id.eq.${encodeURIComponent(user.id)})&select=id,sender_id,recipient_id,subject,body,created_at,read_at&order=created_at.desc&limit=50`
    );
    const messages = await messagesResponse.json();

    if (!messagesResponse.ok) {
      response.status(messagesResponse.status).json({ ok: false, message: messages.message || "Could not load messages." });
      return;
    }

    const names = await loadMessageNames(messages.flatMap((message) => [message.sender_id, message.recipient_id]));
    response.status(200).json({
      ok: true,
      messages: messages.map((message) => ({
        ...message,
        sender: names[message.sender_id] || null,
        recipient: names[message.recipient_id] || null,
        direction: message.sender_id === user.id ? "sent" : "received"
      }))
    });
    return;
  }

  response.status(400).json({ ok: false, message: "Unknown account action." });
};
