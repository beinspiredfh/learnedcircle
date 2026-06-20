const SESSION_KEY = "learnedcircle_session";

const authPanel = document.querySelector("[data-auth-panel]");
const dashboard = document.querySelector("[data-dashboard]");
const dashboardTitle = document.querySelector("[data-dashboard-title]");
const membershipBanner = document.querySelector("[data-membership-banner]");
const accountFacts = document.querySelector("[data-account-facts]");
const loginForm = document.querySelector("[data-login-form]");
const signupForm = document.querySelector("[data-signup-form]");
const profileForm = document.querySelector("[data-profile-form]");
const loginStatus = document.querySelector("[data-login-status]");
const signupStatus = document.querySelector("[data-signup-status]");
const profileStatus = document.querySelector("[data-profile-status]");
const premiumStatus = document.querySelector("[data-premium-status]");
const lawyerProfileForm = document.querySelector("[data-lawyer-profile-form]");
const lawyerProfileStatus = document.querySelector("[data-lawyer-profile-status]");
const jobPostForm = document.querySelector("[data-job-post-form]");
const jobPostStatus = document.querySelector("[data-job-post-status]");
const articleForm = document.querySelector("[data-article-form]");
const articleStatus = document.querySelector("[data-article-status]");
const messageForm = document.querySelector("[data-message-form]");
const messageStatus = document.querySelector("[data-message-status]");
const messageRecipient = document.querySelector("[data-message-recipient]");
const messageList = document.querySelector("[data-message-list]");
const peerSuggestions = document.querySelector("[data-peer-suggestions]");
const dashboardSummary = document.querySelector("[data-dashboard-summary]");
const invoiceForm = document.querySelector("[data-invoice-form]");
const invoiceStatus = document.querySelector("[data-invoice-status]");
const invoicePreview = document.querySelector("[data-invoice-preview]");
const invoiceAllowance = document.querySelector("[data-invoice-allowance]");
const generateInvoiceButton = invoiceForm?.querySelector('button[type="submit"]');
const downloadInvoiceButton = document.querySelector("[data-download-invoice]");
const whatsappInvoiceButton = document.querySelector("[data-whatsapp-invoice]");
const nigeriaLocationSelects = document.querySelectorAll("[data-nigeria-location-select]");

const nigeriaLocations = [
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
];

let session = readSession();
let currentProfile = null;
let currentInvoice = null;
let lastDashboardSummary = {};

nigeriaLocationSelects.forEach((select) => {
  nigeriaLocations.forEach((location) => {
    const option = document.createElement("option");
    option.value = location;
    option.textContent = location;
    select.append(option);
  });
});

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function saveSession(nextSession) {
  session = nextSession;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
}

function clearSession() {
  session = null;
  currentProfile = null;
  sessionStorage.removeItem(SESSION_KEY);
}

function setStatus(element, message) {
  element.hidden = false;
  element.textContent = message;
}

async function accountRequest(body) {
  const response = await fetch("/api/account-auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.message || "Account request failed.");
  }

  return data;
}

function roleLabel(role) {
  return {
    client: "Client",
    lawyer: "Lawyer",
    law_firm: "Law firm",
    employer: "Employer",
    advertiser: "Advertiser",
    admin: "Admin"
  }[role] || role;
}

function membershipLabel(value) {
  return {
    free: "Free account",
    premium_pending: "Premium pending review",
    premium_active: "Premium active",
    premium_expired: "Premium expired"
  }[value] || value;
}

function membershipTone(value) {
  if (value === "premium_active") return "premium";
  if (value === "premium_pending") return "pending";
  return "free";
}

function membershipBenefitText(value) {
  if (value === "premium_active") {
    return "Premium benefits active: direct client contact, online visibility, direct publishing, priority matching and unlimited branded invoices.";
  }
  if (value === "premium_pending") {
    return "Premium request pending review. Benefits activate after payment and admin approval.";
  }
  return "Free account: public access, reviewed posts and five invoices per month. Premium unlocks direct contact, visibility and unlimited branded invoices.";
}

function invoiceStorageKey() {
  const date = new Date();
  const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  return `learnedcircle_invoice_count_${currentProfile?.id || currentProfile?.email || "guest"}_${month}`;
}

function getInvoiceCount() {
  return Number(localStorage.getItem(invoiceStorageKey()) || 0);
}

function setInvoiceCount(count) {
  localStorage.setItem(invoiceStorageKey(), String(count));
}

function hasBusinessInvoiceAccess() {
  return currentProfile?.membership === "premium_active" || currentProfile?.invoice_plan === "business";
}

function invoiceAllowanceLabel() {
  return hasBusinessInvoiceAccess() ? "Unlimited" : `${getInvoiceCount()}/5`;
}

function freeInvoiceRemaining() {
  return Math.max(0, 5 - getInvoiceCount());
}

function updateInvoiceAccessUi() {
  if (!invoiceForm) return;

  const businessAccess = hasBusinessInvoiceAccess();
  const remaining = freeInvoiceRemaining();

  if (invoiceAllowance) {
    invoiceAllowance.hidden = false;
    invoiceAllowance.textContent = businessAccess
      ? "Premium plan: unlimited branded invoices are available."
      : `Free plan: ${remaining} of 5 invoice${remaining === 1 ? "" : "s"} remaining this month.`;
  }

  if (generateInvoiceButton) {
    generateInvoiceButton.disabled = !businessAccess && remaining === 0;
    generateInvoiceButton.textContent = businessAccess
      ? "Generate invoice"
      : remaining === 0
        ? "Free limit reached"
        : `Generate invoice (${remaining} free left)`;
  }
}

function renderDashboard(profile, user) {
  currentProfile = profile;
  const membership = profile.membership || "free";
  dashboardTitle.textContent = `Welcome, ${profile.full_name}`;
  if (membershipBanner) {
    membershipBanner.className = `membership-banner ${membershipTone(membership)}`;
    membershipBanner.textContent = `${membershipLabel(membership)} - ${membershipBenefitText(membership)}`;
  }
  accountFacts.innerHTML = `
    <dt>Email</dt>
    <dd>${user.email}</dd>
    <dt>Role</dt>
    <dd>${roleLabel(profile.role)}</dd>
    <dt>Membership</dt>
    <dd><span class="membership-pill ${membershipTone(membership)}">${membershipLabel(membership)}</span></dd>
  `;
  document.querySelectorAll("[data-premium-request]").forEach((button) => {
    if (membership === "premium_active") {
      button.disabled = true;
      button.textContent = "Premium active";
    } else if (membership === "premium_pending") {
      button.disabled = true;
      button.textContent = "Premium pending review";
    } else {
      button.disabled = false;
      button.textContent = "Request premium review";
    }
  });
  profileForm.elements.fullName.value = profile.full_name || "";
  profileForm.elements.role.value = profile.role || "client";
  authPanel.hidden = true;
  dashboard.hidden = false;
  updateInvoiceAccessUi();
  loadDashboardSummary();
  loadMessageCenter();
}

function renderDashboardSummary(summary = {}) {
  if (!dashboardSummary) return;
  lastDashboardSummary = summary;

  const verification = summary.lawyerProfile?.verified
    ? "Verified"
    : summary.lawyerProfile?.submitted
      ? "Pending review"
      : "Not submitted";
  const membership = membershipLabel(currentProfile?.membership || "free");
  const unreadMessages = Number(summary.unreadMessages || 0);
  const articleCount = Number(summary.articles || 0);
  const draftCount = Number(summary.pendingDrafts || 0);
  const followers = Number(summary.followers || 0);
  const following = Number(summary.following || 0);

  dashboardSummary.innerHTML = `
    <article class="summary-card">
      <span class="status">Verification</span>
      <strong>${verification}</strong>
      <p>${summary.lawyerProfile?.displayName || "Submit or update your lawyer profile for admin review."}</p>
    </article>
    <article class="summary-card">
      <span class="status ${membershipTone(currentProfile?.membership || "free")}">Membership</span>
      <strong>${membership}</strong>
      <p>${membershipBenefitText(currentProfile?.membership || "free")}</p>
    </article>
    <article class="summary-card">
      <span class="status">Messages</span>
      <strong>${unreadMessages}</strong>
      <p>Unread messages and client or lawyer enquiries in your inbox.</p>
    </article>
    <article class="summary-card">
      <span class="status">Publishing</span>
      <strong>${articleCount}</strong>
      <p>${draftCount} draft${draftCount === 1 ? "" : "s"} still waiting for review.</p>
    </article>
    <article class="summary-card">
      <span class="status">Invoices</span>
      <strong>${invoiceAllowanceLabel()}</strong>
      <p>${hasBusinessInvoiceAccess() ? "Premium includes unlimited branded invoices." : "Free registration allows five generated invoices each month."}</p>
    </article>
    <article class="summary-card">
      <span class="status">Networking</span>
      <strong>${followers + following}</strong>
      <p>${followers} follower${followers === 1 ? "" : "s"} and ${following} lawyer${following === 1 ? "" : "s"} followed.</p>
    </article>
  `;
}

function money(value) {
  return Number(value || 0).toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseInvoiceItems(rawItems) {
  return rawItems
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [description, amount] = line.split("|").map((part) => part?.trim());
      const value = Number(String(amount || "0").replace(/[^0-9.]/g, ""));
      return {
        description: description || "Legal service",
        amount: Number.isFinite(value) ? value : 0
      };
    });
}

function invoiceHtml(invoice) {
  const rows = invoice.items.map((item) => `
    <tr>
      <td>${escapeHtml(item.description)}</td>
      <td>${money(item.amount)}</td>
    </tr>
  `).join("");

  return `
    <article class="invoice-document">
      <header>
        <div>
          ${invoice.firmLogoUrl ? `<img src="${escapeHtml(invoice.firmLogoUrl)}" alt="${escapeHtml(invoice.firmName)} logo" />` : ""}
          <h2>${escapeHtml(invoice.firmName)}</h2>
          <p>${escapeHtml(invoice.firmDetails || "Legal services invoice")}</p>
        </div>
        <div>
          <strong>Invoice</strong>
          <span>${escapeHtml(invoice.invoiceNumber)}</span>
          <small>${escapeHtml(invoice.invoiceDate)}</small>
        </div>
      </header>
      <section>
        <h3>Bill to</h3>
        <p>${escapeHtml(invoice.clientName)}</p>
        <p>${escapeHtml(invoice.matter)}</p>
      </section>
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <th>Total</th>
            <th>${money(invoice.total)}</th>
          </tr>
        </tfoot>
      </table>
      ${invoice.notes ? `<footer>${escapeHtml(invoice.notes)}</footer>` : ""}
    </article>
  `;
}

function renderInvoice(invoice) {
  invoicePreview.innerHTML = invoiceHtml(invoice);
  downloadInvoiceButton.disabled = false;
  whatsappInvoiceButton.disabled = false;
}

async function loadDashboardSummary() {
  if (!session?.access_token) return;

  try {
    const result = await accountRequest({
      action: "dashboard-summary",
      accessToken: session.access_token
    });
    renderDashboardSummary(result.summary || {});
  } catch (error) {
    renderDashboardSummary({});
  }
}

function renderRecipients(recipients) {
  if (!recipients.length) {
    messageRecipient.innerHTML = `<option value="">No verified lawyer profiles yet</option>`;
    renderPeerSuggestions([]);
    return;
  }

  const sortedRecipients = [...recipients].sort((a, b) => Number(b.is_online) - Number(a.is_online) || a.display_name.localeCompare(b.display_name));
  messageRecipient.innerHTML = `
    <option value="">Choose an online or verified lawyer</option>
    ${sortedRecipients.map((recipient) => `
      <option value="${recipient.id}" ${recipient.can_message ? "" : "disabled"}>
        ${recipient.display_name} - ${recipient.is_online ? "Online now" : "Recently offline"} - ${recipient.location || "Flexible"}
      </option>
    `).join("")}
  `;
  renderPeerSuggestions(sortedRecipients);
}

function renderPeerSuggestions(recipients) {
  if (!peerSuggestions) return;

  const peers = recipients.filter((recipient) => recipient.can_message && recipient.is_online).slice(0, 4);
  if (!peers.length) {
    peerSuggestions.innerHTML = `<p>No verified lawyers are online right now. Recently active verified lawyers remain available in the message dropdown.</p>`;
    return;
  }

  peerSuggestions.innerHTML = peers.map((peer) => `
    <button class="peer-chip" type="button" data-peer-chat="${peer.id}">
      <strong>${peer.display_name}</strong>
      <span>Online now | ${peer.location || "Flexible"} | ${(peer.practice_areas || []).slice(0, 2).join(", ") || "Verified lawyer"}</span>
    </button>
  `).join("");
}

function renderMessages(messages) {
  if (!messages.length) {
    messageList.innerHTML = `
      <article class="admin-empty">
        <h3>No messages yet.</h3>
        <p>Sent and received messages will appear here.</p>
      </article>
    `;
    return;
  }

  messageList.innerHTML = messages.map((message) => {
    const other = message.direction === "sent" ? message.recipient : message.sender;
    return `
      <article class="message-card">
        <span class="status">${message.direction}</span>
        <h3>${message.subject}</h3>
        <p><strong>${message.direction === "sent" ? "To" : "From"}:</strong> ${other?.full_name || other?.email || "Account user"}</p>
        <p>${message.body}</p>
        <small>${new Date(message.created_at).toLocaleString()}</small>
      </article>
    `;
  }).join("");
}

async function loadMessageCenter() {
  if (!session?.access_token) return;

  try {
    const [options, inbox] = await Promise.all([
      accountRequest({ action: "message-options", accessToken: session.access_token }),
      accountRequest({ action: "messages", accessToken: session.access_token })
    ]);
    renderRecipients(options.recipients || []);
    renderMessages(inbox.messages || []);
  } catch (error) {
    messageRecipient.innerHTML = `<option value="">Messages unavailable</option>`;
  }
}

async function loadAccount() {
  if (!session?.access_token) return;

  try {
    const result = await accountRequest({
      action: "me",
      accessToken: session.access_token
    });
    if (result.profile) {
      renderDashboard(result.profile, result.user);
    } else {
      clearSession();
    }
  } catch (error) {
    clearSession();
  }
}

document.querySelectorAll("[data-auth-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-auth-tab]").forEach((tab) => tab.classList.remove("active"));
    button.classList.add("active");
    const mode = button.dataset.authTab;
    loginForm.hidden = mode !== "login";
    signupForm.hidden = mode !== "signup";
  });
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  setStatus(loginStatus, "Logging in...");

  try {
    const result = await accountRequest({
      action: "login",
      email: formData.get("email"),
      password: formData.get("password")
    });
    saveSession(result.session);
    setStatus(loginStatus, "Login successful.");
    await loadAccount();
  } catch (error) {
    setStatus(loginStatus, error.message);
  }
});

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(signupForm);
  setStatus(signupStatus, "Creating account...");

  try {
    const result = await accountRequest({
      action: "signup",
      fullName: formData.get("fullName"),
      role: formData.get("role"),
      email: formData.get("email"),
      password: formData.get("password"),
      termsAccepted: formData.get("termsAccepted") === "on"
    });
    setStatus(signupStatus, result.message);
    loginForm.elements.email.value = formData.get("email");
    signupForm.reset();
    document.querySelector('[data-auth-tab="login"]').click();
  } catch (error) {
    setStatus(signupStatus, error.message);
  }
});

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(profileForm);
  setStatus(profileStatus, "Saving profile...");

  try {
    const result = await accountRequest({
      action: "update-profile",
      accessToken: session.access_token,
      fullName: formData.get("fullName"),
      role: formData.get("role")
    });
    renderDashboard(result.profile, { email: currentProfile.email });
    setStatus(profileStatus, "Profile saved.");
  } catch (error) {
    setStatus(profileStatus, error.message);
  }
});

document.querySelectorAll("[data-premium-request]").forEach((button) => {
  button.addEventListener("click", async () => {
    setStatus(premiumStatus, "Sending premium request...");

    try {
      const result = await accountRequest({
        action: "premium-request",
        accessToken: session.access_token
      });
      setStatus(premiumStatus, result.message);
      await loadAccount();
    } catch (error) {
      setStatus(premiumStatus, error.message);
    }
  });
});

lawyerProfileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(lawyerProfileForm);
  setStatus(lawyerProfileStatus, "Submitting lawyer profile for verification...");

  try {
    const result = await accountRequest({
      action: "lawyer-profile-submit",
      accessToken: session.access_token,
      profile: {
        displayName: formData.get("displayName"),
        profilePictureUrl: formData.get("profilePictureUrl"),
        credentials: formData.get("credentials"),
        yearOfCall: formData.get("yearOfCall"),
        supremeCourtNumber: formData.get("supremeCourtNumber"),
        showCallDetailsPublic: formData.get("showCallDetailsPublic") === "yes",
        location: formData.get("location"),
        firm: formData.get("firm"),
        practiceAreas: formData.get("practiceAreas"),
        languages: formData.get("languages"),
        fees: formData.get("fees"),
        availability: formData.get("availability"),
        proBonoOpen: formData.get("proBonoOpen") === "yes",
        summary: formData.get("summary"),
        verificationNote: formData.get("verificationNote")
      }
    });
    setStatus(lawyerProfileStatus, result.message);
    lawyerProfileForm.reset();
  } catch (error) {
    setStatus(lawyerProfileStatus, error.message);
  }
});

jobPostForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(jobPostForm);
  setStatus(jobPostStatus, "Submitting opportunity for review...");

  try {
    const result = await accountRequest({
      action: "job-post-submit",
      accessToken: session.access_token,
      job: {
        title: formData.get("title"),
        organization: formData.get("organization"),
        location: formData.get("location"),
        engagementType: formData.get("engagementType"),
        practiceAreas: formData.get("practiceAreas"),
        budget: formData.get("budget"),
        description: formData.get("description")
      }
    });
    setStatus(jobPostStatus, result.message);
    jobPostForm.reset();
  } catch (error) {
    setStatus(jobPostStatus, error.message);
  }
});

articleForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(articleForm);
  setStatus(articleStatus, "Publishing or submitting article...");

  try {
    const result = await accountRequest({
      action: "article-submit",
      accessToken: session.access_token,
      article: {
        title: formData.get("title"),
        practiceArea: formData.get("practiceArea"),
        byline: formData.get("byline"),
        summary: formData.get("summary"),
        body: formData.get("body")
      }
    });
    setStatus(articleStatus, result.message);
    articleForm.reset();
  } catch (error) {
    setStatus(articleStatus, error.message);
  }
});

invoiceForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(invoiceForm);
  const businessAccess = hasBusinessInvoiceAccess();
  const currentCount = getInvoiceCount();

  if (!businessAccess && currentCount >= 5) {
    setStatus(invoiceStatus, "Free registration invoice limit reached. Upgrade to premium for unlimited branded invoices.");
    updateInvoiceAccessUi();
    return;
  }

  const items = parseInvoiceItems(formData.get("lineItems") || "");
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  currentInvoice = {
    firmName: formData.get("firmName"),
    firmLogoUrl: formData.get("firmLogoUrl"),
    firmDetails: formData.get("firmDetails"),
    invoiceNumber: formData.get("invoiceNumber"),
    invoiceDate: formData.get("invoiceDate"),
    clientName: formData.get("clientName"),
    clientWhatsapp: formData.get("clientWhatsapp"),
    matter: formData.get("matter"),
    items,
    total,
    notes: formData.get("notes")
  };

  if (!businessAccess) {
    setInvoiceCount(currentCount + 1);
  }

  renderInvoice(currentInvoice);
  renderDashboardSummary(lastDashboardSummary);
  updateInvoiceAccessUi();
  setStatus(invoiceStatus, businessAccess
    ? "Invoice generated. Premium membership includes unlimited monthly invoices."
    : `Invoice generated. ${5 - getInvoiceCount()} free invoice${5 - getInvoiceCount() === 1 ? "" : "s"} remaining this month.`
  );
});

downloadInvoiceButton?.addEventListener("click", () => {
  if (!currentInvoice) return;

  const documentHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(currentInvoice.invoiceNumber)} | ${escapeHtml(currentInvoice.firmName)}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; color: #132620; }
      .invoice-document { max-width: 760px; margin: 0 auto; }
      header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #b48a45; padding-bottom: 18px; }
      img { max-width: 84px; max-height: 84px; object-fit: contain; }
      h2, h3, p { margin: 0 0 8px; }
      section { margin: 24px 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 18px; }
      th, td { border-bottom: 1px solid #d8cebc; padding: 12px; text-align: left; }
      th:last-child, td:last-child { text-align: right; }
      tfoot th { font-size: 1.1rem; }
      footer { margin-top: 22px; color: #5f6b66; }
      @media print { body { margin: 18mm; } }
    </style>
  </head>
  <body>${invoiceHtml(currentInvoice)}</body>
</html>`;
  const blob = new Blob([documentHtml], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${currentInvoice.invoiceNumber || "learnedcircle-invoice"}.html`;
  link.click();
  URL.revokeObjectURL(url);
});

whatsappInvoiceButton?.addEventListener("click", () => {
  if (!currentInvoice) return;

  const phone = String(currentInvoice.clientWhatsapp || "").replace(/[^0-9]/g, "");
  const message = [
    `${currentInvoice.firmName} invoice ${currentInvoice.invoiceNumber}`,
    `Client: ${currentInvoice.clientName}`,
    `Matter: ${currentInvoice.matter}`,
    `Total: ${money(currentInvoice.total)}`,
    "Please confirm receipt. A downloadable copy can also be sent separately."
  ].join("\n");
  const url = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener");
});

messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(messageForm);
  setStatus(messageStatus, "Sending message...");

  try {
    const result = await accountRequest({
      action: "send-message",
      accessToken: session.access_token,
      lawyerProfileId: formData.get("lawyerProfileId"),
      subject: formData.get("subject"),
      body: formData.get("body")
    });
    setStatus(messageStatus, result.message);
    messageForm.reset();
    await loadMessageCenter();
  } catch (error) {
    setStatus(messageStatus, error.message);
  }
});

peerSuggestions?.addEventListener("click", (event) => {
  const peerButton = event.target.closest("[data-peer-chat]");
  if (!peerButton) return;

  messageRecipient.value = peerButton.dataset.peerChat;
  messageForm.elements.subject.value = "Online lawyer chat";
  document.querySelector("#message-center").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelectorAll("[data-account-draft]").forEach((button) => {
  button.addEventListener("click", async () => {
    await fetch("/api/moderation-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: button.dataset.accountDraft,
        source: "LearnedCircle account dashboard",
        fields: [
          { label: "Account", value: currentProfile?.email || "Signed-in user" },
          { label: "Request", value: button.textContent.trim() }
        ]
      })
    });
    window.location.href = "index.html";
  });
});

document.querySelector("[data-logout]").addEventListener("click", () => {
  clearSession();
  dashboard.hidden = true;
  authPanel.hidden = false;
});

const initialMode = new URLSearchParams(window.location.search).get("mode");
if (initialMode === "signup") {
  document.querySelector('[data-auth-tab="signup"]').click();
}

if (invoiceForm?.elements.invoiceDate) {
  invoiceForm.elements.invoiceDate.value = new Date().toISOString().slice(0, 10);
}

updateInvoiceAccessUi();
loadAccount();
