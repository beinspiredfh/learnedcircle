const SESSION_KEY = "learnedcircle_session";

const authPanel = document.querySelector("[data-auth-panel]");
const dashboard = document.querySelector("[data-dashboard]");
const dashboardTitle = document.querySelector("[data-dashboard-title]");
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

function renderDashboard(profile, user) {
  currentProfile = profile;
  dashboardTitle.textContent = `Welcome, ${profile.full_name}`;
  accountFacts.innerHTML = `
    <dt>Email</dt>
    <dd>${user.email}</dd>
    <dt>Role</dt>
    <dd>${roleLabel(profile.role)}</dd>
    <dt>Membership</dt>
    <dd>${membershipLabel(profile.membership)}</dd>
  `;
  profileForm.elements.fullName.value = profile.full_name || "";
  profileForm.elements.role.value = profile.role || "client";
  authPanel.hidden = true;
  dashboard.hidden = false;
  loadDashboardSummary();
  loadMessageCenter();
}

function renderDashboardSummary(summary = {}) {
  if (!dashboardSummary) return;

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
      <span class="status">Membership</span>
      <strong>${membership}</strong>
      <p>Premium unlocks direct posting, client contact and stronger profile visibility.</p>
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
      <span class="status">Networking</span>
      <strong>${followers + following}</strong>
      <p>${followers} follower${followers === 1 ? "" : "s"} and ${following} lawyer${following === 1 ? "" : "s"} followed.</p>
    </article>
  `;
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

loadAccount();
