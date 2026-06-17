const loginPanel = document.querySelector("[data-login-panel]");
const adminBoard = document.querySelector("[data-admin-board]");
const adminList = document.querySelector("[data-admin-list]");
const adminCount = document.querySelector("[data-admin-count]");
const loginForm = document.querySelector("[data-admin-login]");
const loginStatus = document.querySelector("[data-login-status]");
const refreshButton = document.querySelector("[data-refresh]");
const lockButton = document.querySelector("[data-lock]");
const exportButton = document.querySelector("[data-export]");
const adminSummary = document.querySelector("[data-admin-summary]");
const adminFilterButtons = document.querySelectorAll("[data-admin-filter]");
const guestPublishForm = document.querySelector("[data-guest-publish-form]");
const guestPublishStatus = document.querySelector("[data-guest-publish-status]");

let adminCode = sessionStorage.getItem("learnedcircle_admin_code") || "";
let allDraftRows = [];
let activeFilter = "all";

const reviewerNoteTemplates = {
  incompleteVerification: "Rejected: lawyer verification details are incomplete. Please resubmit with SCN, location, practice areas and a clear profile summary.",
  publicDetails: "Approved: SCN and call details reviewed for verification. Public display follows the lawyer's selected privacy choice.",
  unclearSummary: "Rejected: profile summary is too vague or promotional. Please describe actual practice areas, experience and client service focus.",
  premiumPending: "Approved subject to payment/admin confirmation for premium direct-contact features."
};

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

async function callRpc(functionName, body) {
  const response = await fetch("/api/admin-moderation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || "The moderation request could not be completed.");
  }

  return data;
}

function renderPayload(payload = {}) {
  const fields = Array.isArray(payload.fields) ? payload.fields : [];

  if (!fields.length) {
    return `<p>${escapeHtml(JSON.stringify(payload))}</p>`;
  }

  return fields
    .map((field) => `
      <div class="admin-field">
        <strong>${escapeHtml(field.label)}</strong>
        <p>${escapeHtml(field.value || "Not provided")}</p>
      </div>
    `)
    .join("");
}

function renderVerificationChecklist(row) {
  if (row.item_type !== "Lawyer profile submission") return "";

  const profile = row.payload?.profile || {};
  const checks = [
    ["SCN supplied", Boolean(profile.supreme_court_number)],
    ["Year of call supplied", Boolean(profile.year_of_call)],
    ["Location selected", Boolean(profile.location)],
    ["Practice areas supplied", Array.isArray(profile.practice_areas) && profile.practice_areas.length > 0],
    ["Summary supplied", Boolean(profile.summary)],
    ["Call details public choice recorded", typeof profile.show_call_details_public === "boolean"],
    ["Pro bono preference recorded", typeof profile.pro_bono_open === "boolean"]
  ];
  const canApprove = checks.every(([, passed]) => passed);

  return `
    <div class="verification-checklist" aria-label="Lawyer verification checklist" data-verification-ready="${canApprove ? "true" : "false"}">
      <strong>Verification checklist</strong>
      ${checks.map(([label, passed]) => `
        <span class="${passed ? "passed" : "failed"}">${passed ? "Ready" : "Check"}: ${escapeHtml(label)}</span>
      `).join("")}
      <p>Approving this draft publishes or updates the lawyer profile as verified. Premium direct client contact remains separate until premium approval.</p>
      <div class="review-note-actions" aria-label="Reviewer note templates">
        <button type="button" data-note-template="publicDetails">Use approval note</button>
        <button type="button" data-note-template="incompleteVerification">Missing details note</button>
        <button type="button" data-note-template="unclearSummary">Unclear summary note</button>
      </div>
    </div>
  `;
}

function renderAdminSummary(rows) {
  if (!adminSummary) return;

  const pending = rows.filter((row) => row.status === "pending_review").length;
  const lawyerProfiles = rows.filter((row) => row.item_type === "Lawyer profile submission").length;
  const premium = rows.filter((row) => row.item_type === "Premium account request").length;
  const jobs = rows.filter((row) => row.item_type === "Job post submission").length;
  const articles = rows.filter((row) => row.item_type === "Article submission").length;
  const adverts = rows.filter((row) => row.item_type === "Advert request").length;

  adminSummary.innerHTML = `
    <article class="summary-card">
      <span class="status">Pending</span>
      <strong>${pending}</strong>
      <p>Items waiting for admin action.</p>
    </article>
    <article class="summary-card">
      <span class="status">Lawyer verification</span>
      <strong>${lawyerProfiles}</strong>
      <p>Profile and SCN checks.</p>
    </article>
    <article class="summary-card">
      <span class="status">Premium</span>
      <strong>${premium}</strong>
      <p>Upgrade and direct-contact requests.</p>
    </article>
    <article class="summary-card">
      <span class="status">Publishing</span>
      <strong>${articles}</strong>
      <p>Article drafts for editorial review.</p>
    </article>
    <article class="summary-card">
      <span class="status">Jobs and adverts</span>
      <strong>${jobs + adverts}</strong>
      <p>Opportunities and advertising requests.</p>
    </article>
  `;
}

function filteredRows() {
  if (activeFilter === "all") return allDraftRows;
  return allDraftRows.filter((row) => row.item_type === activeFilter);
}

function renderDrafts(rows = filteredRows()) {
  adminCount.textContent = `${rows.length} shown | ${allDraftRows.length} total`;
  renderAdminSummary(allDraftRows);

  if (!rows.length) {
    adminList.innerHTML = `
      <article class="admin-empty">
        <h3>No submissions waiting.</h3>
        <p>New website drafts will appear here as users submit forms.</p>
      </article>
    `;
    return;
  }

  adminList.innerHTML = rows.map((row) => `
    <article class="admin-card" data-id="${escapeHtml(row.id)}">
      <div class="admin-card-head">
        <div>
          <span class="status">${escapeHtml(row.status)}</span>
          <h3>${escapeHtml(row.item_type)}</h3>
          <p>${escapeHtml(row.source || "LearnedCircle website")} | ${formatDate(row.created_at)}</p>
        </div>
      </div>
      <div class="admin-payload">
        ${renderPayload(row.payload)}
      </div>
      ${renderVerificationChecklist(row)}
      <label>
        Reviewer note
        <textarea data-reviewer-note placeholder="Add an internal note">${escapeHtml(row.reviewer_note || "")}</textarea>
      </label>
      <div class="admin-actions">
        <button class="primary-action" type="button" data-status="approved">Approve</button>
        <button class="secondary-action" type="button" data-status="rejected">Reject</button>
        <button class="secondary-action" type="button" data-status="archived">Archive</button>
      </div>
    </article>
  `).join("");
}

async function loadQueue() {
  adminCount.textContent = "Loading drafts...";
  adminList.innerHTML = "";
  const result = await callRpc("admin_moderation_list", { action: "list", adminCode });
  allDraftRows = result.rows || [];
  renderDrafts();
}

async function unlock(code) {
  adminCode = code.trim();
  loginStatus.hidden = false;
  loginStatus.textContent = "Checking access...";
  await loadQueue();
  sessionStorage.setItem("learnedcircle_admin_code", adminCode);
  loginPanel.hidden = true;
  adminBoard.hidden = false;
  loginStatus.hidden = true;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  try {
    await unlock(formData.get("adminCode"));
  } catch (error) {
    loginStatus.hidden = false;
    loginStatus.textContent = error.message;
  }
});

refreshButton.addEventListener("click", async () => {
  if (!adminCode) return;
  await loadQueue();
});

exportButton?.addEventListener("click", async () => {
  if (!adminCode) return;
  exportButton.disabled = true;
  exportButton.textContent = "Exporting...";

  try {
    const result = await callRpc("admin_export_records", { action: "export", adminCode });
    const blob = new Blob([JSON.stringify(result.export, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `learnedcircle-admin-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    window.alert(error.message);
  } finally {
    exportButton.disabled = false;
    exportButton.textContent = "Export records";
  }
});

adminFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.adminFilter || "all";
    adminFilterButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderDrafts();
  });
});

lockButton.addEventListener("click", () => {
  adminCode = "";
  sessionStorage.removeItem("learnedcircle_admin_code");
  loginPanel.hidden = false;
  adminBoard.hidden = true;
  loginForm.reset();
});

guestPublishForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(guestPublishForm);
  guestPublishStatus.hidden = false;
  guestPublishStatus.textContent = "Publishing guest article...";

  try {
    const result = await callRpc("admin_guest_article_publish", {
      action: "create-guest-article",
      adminCode,
      article: {
        title: formData.get("title"),
        contributorName: formData.get("contributorName"),
        contributorTitle: formData.get("contributorTitle"),
        approvedByline: formData.get("approvedByline"),
        writerPictureUrl: formData.get("writerPictureUrl"),
        summary: formData.get("summary"),
        body: formData.get("body")
      }
    });
    guestPublishStatus.textContent = result.message || "Guest article published.";
    guestPublishForm.reset();
    await loadQueue();
  } catch (error) {
    guestPublishStatus.textContent = error.message;
  }
});

adminList.addEventListener("click", async (event) => {
  const noteTemplate = event.target.closest("[data-note-template]");
  if (noteTemplate) {
    const card = noteTemplate.closest("[data-id]");
    const note = card?.querySelector("[data-reviewer-note]");
    if (note) {
      note.value = reviewerNoteTemplates[noteTemplate.dataset.noteTemplate] || "";
      note.focus();
    }
    return;
  }

  const action = event.target.closest("[data-status]");
  if (!action) return;

  const card = action.closest("[data-id]");
  const note = card.querySelector("[data-reviewer-note]").value.trim();
  const itemType = card.querySelector("h3")?.textContent || "";
  const verificationReady = card.querySelector("[data-verification-ready]")?.dataset.verificationReady;

  if (action.dataset.status === "rejected" && !note) {
    window.alert("Add a reviewer note before rejecting so the reason is clear in the record.");
    return;
  }

  if (action.dataset.status === "approved" && itemType === "Lawyer profile submission") {
    const message = verificationReady === "true"
      ? "Approve this lawyer profile as verified and publish it publicly?"
      : "This lawyer profile still has checklist items marked Check. Approve anyway?";
    if (!window.confirm(message)) return;
  }

  action.disabled = true;
  action.textContent = "Saving...";

  try {
    await callRpc("admin_moderation_update", {
      action: "update",
      adminCode,
      id: card.dataset.id,
      status: action.dataset.status,
      reviewerNote: note
    });
    await loadQueue();
  } catch (error) {
    action.disabled = false;
    action.textContent = action.dataset.status === "approved" ? "Approve" : action.dataset.status === "rejected" ? "Reject" : "Archive";
    window.alert(error.message);
  }
});

if (adminCode) {
  unlock(adminCode).catch(() => {
    sessionStorage.removeItem("learnedcircle_admin_code");
    adminCode = "";
  });
}
