const specializations = [
  "Family Law",
  "Property Law",
  "Corporate Law",
  "Criminal Law",
  "Tax Law",
  "Employment Law",
  "Intellectual Property Law",
  "Data Protection / Privacy Law",
  "Oil and Gas Law",
  "Election Petition",
  "Alternative Dispute Resolution",
  "Banking Law",
  "Real Estate Law",
  "Human Rights Law",
  "Wills and Probate Law"
];

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

const lawyers = [
  {
    name: "Adaeze Okonkwo",
    initials: "AO",
    title: "LLB, BL, LLM",
    location: "Lagos",
    areas: ["Corporate Law", "Data Protection / Privacy Law", "Tax Law"],
    budget: "Premium",
    verified: true,
    proBono: false,
    tax: true,
    online: true,
    rating: "4.9",
    summary: "Advises founders, regulated companies and finance teams on compliance, contracts and tax exposure.",
    profile: {
      firm: "Okonkwo Legal Advisory",
      experience: "12 years post-call",
      languages: "English, Igbo",
      availability: "Premium consultations, retainers and lawyer referrals",
      fees: "Consultation from N50,000",
      verification: "Call-to-bar and identity reviewed",
      openToMentorship: true,
      menteeCount: 18,
      publications: ["NDPR basics for growing businesses", "Tax exposure in early-stage company contracts"]
    }
  },
  {
    name: "Musa Bello",
    initials: "MB",
    title: "LLB, BL",
    location: "FCT",
    areas: ["Election Petition", "Constitutional Law", "Human Rights Law"],
    budget: "Standard",
    verified: true,
    proBono: true,
    tax: false,
    online: true,
    rating: "4.8",
    summary: "Litigation counsel for public law matters, civic rights cases and election-related disputes.",
    profile: {
      firm: "Bello & Civic Rights Counsel",
      experience: "10 years post-call",
      languages: "English, Hausa",
      availability: "Election petitions, civic rights reviews and pro bono screening",
      fees: "Consultation from N35,000",
      verification: "Verified lawyer profile",
      openToMentorship: true,
      menteeCount: 7,
      publications: ["Election petition timelines for campaign teams", "Public-interest litigation intake checklist"]
    }
  },
  {
    name: "Nkem Afolabi",
    initials: "NA",
    title: "LLB, BL",
    location: "Oyo",
    areas: ["Family Law", "Wills and Probate Law", "Property Law"],
    budget: "Starter",
    verified: false,
    proBono: true,
    tax: false,
    online: false,
    rating: "4.7",
    summary: "Practical family, succession and property guidance with online consultation availability.",
    profile: {
      firm: "Afolabi Family & Probate Desk",
      experience: "7 years post-call",
      languages: "English, Yoruba",
      availability: "Remote consultations, family mediation and pro bono screening",
      fees: "Starter consultations available",
      verification: "Verification pending editorial review",
      openToMentorship: false,
      publications: ["Preparing succession documents before dispute", "Mediation-first options in family matters"]
    }
  },
  {
    name: "Chinedu Eze",
    initials: "CE",
    title: "LLB, BL, ACArb",
    location: "Rivers",
    areas: ["Oil and Gas Law", "Alternative Dispute Resolution", "Employment Law"],
    budget: "Premium",
    verified: true,
    proBono: false,
    tax: false,
    online: false,
    rating: "4.9",
    summary: "Handles energy sector contracts, workplace investigations and arbitration support.",
    profile: {
      firm: "Eze Energy & Arbitration Practice",
      experience: "14 years post-call",
      languages: "English, Igbo",
      availability: "Premium retainers, arbitration support and workplace investigations",
      fees: "Consultation from N75,000",
      verification: "Call-to-bar and credentials reviewed",
      openToMentorship: true,
      menteeCount: 12,
      publications: ["Arbitration clauses in energy service contracts", "Workplace investigation protocols for employers"]
    }
  },
  {
    name: "Ifeoma Nwosu",
    initials: "IN",
    title: "LLB, BL, MCIArb",
    location: "Enugu",
    areas: ["Intellectual Property Law", "Corporate Law", "Alternative Dispute Resolution"],
    budget: "Standard",
    verified: true,
    proBono: false,
    tax: false,
    online: true,
    rating: "4.8",
    summary: "Supports creative businesses, software teams and founders with IP protection, contracts and dispute strategy.",
    profile: {
      firm: "Nwosu IP & Commercial Counsel",
      experience: "9 years post-call",
      languages: "English, Igbo",
      availability: "IP audits, brand protection reviews and commercial dispute consultations",
      fees: "Consultation from N40,000",
      verification: "Verified lawyer profile",
      openToMentorship: true,
      menteeCount: 9,
      publications: ["Protecting software products before launch", "Brand licensing clauses founders should understand"]
    }
  },
  {
    name: "Tunde Salami",
    initials: "TS",
    title: "LLB, BL",
    location: "Ogun",
    areas: ["Criminal Law", "Human Rights Law", "Alternative Dispute Resolution"],
    budget: "Standard",
    verified: true,
    proBono: true,
    tax: false,
    online: false,
    rating: "4.7",
    summary: "Handles defence preparation, bail applications, rights enforcement and practical dispute resolution.",
    profile: {
      firm: "Salami Defence & Rights Practice",
      experience: "11 years post-call",
      languages: "English, Yoruba",
      availability: "Paid consultations, urgent rights reviews and selected pro bono screening",
      fees: "Consultation from N30,000",
      verification: "Verified lawyer profile",
      openToMentorship: true,
      menteeCount: 5,
      publications: ["What to prepare before a bail application", "Rights enforcement intake notes for families"]
    }
  },
  {
    name: "Hauwa Ibrahim",
    initials: "HI",
    title: "LLB, BL, LLM",
    location: "Kano",
    areas: ["Banking Law", "Tax Law", "Real Estate Law"],
    budget: "Premium",
    verified: true,
    proBono: false,
    tax: true,
    online: true,
    rating: "4.9",
    summary: "Advises SMEs, lenders and property investors on tax, finance documentation and secured transactions.",
    profile: {
      firm: "Ibrahim Finance & Tax Advisory",
      experience: "13 years post-call",
      languages: "English, Hausa",
      availability: "Premium consultations, tax planning reviews and finance document checks",
      fees: "Consultation from N60,000",
      verification: "Call-to-bar and identity reviewed",
      openToMentorship: true,
      menteeCount: 16,
      publications: ["SME tax records lenders expect to see", "Security documentation issues in property-backed lending"]
    }
  },
  {
    name: "Ebiere Dokubo",
    initials: "ED",
    title: "LLB, BL",
    location: "Bayelsa",
    areas: ["Oil and Gas Law", "Employment Law", "Environmental Law"],
    budget: "Starter",
    verified: true,
    proBono: false,
    tax: false,
    online: false,
    rating: "4.6",
    summary: "Provides oil service contract support, workplace compliance reviews and environmental incident guidance.",
    profile: {
      firm: "Dokubo Energy Support Desk",
      experience: "8 years post-call",
      languages: "English, Ijaw",
      availability: "Contract review, employment compliance and operational risk support",
      fees: "Starter consultations available",
      verification: "Verified lawyer profile",
      openToMentorship: false,
      publications: ["Basic compliance files for oil service contractors", "Employment documentation for field teams"]
    }
  },
  {
    name: "Binta Lawal",
    initials: "BL",
    title: "LLB, BL",
    location: "Kaduna",
    areas: ["Family Law", "Property Law", "Wills and Probate Law"],
    budget: "Standard",
    verified: true,
    proBono: true,
    tax: false,
    online: true,
    rating: "4.8",
    summary: "Guides families and property owners through succession planning, title checks and settlement options.",
    profile: {
      firm: "Lawal Family & Property Practice",
      experience: "10 years post-call",
      languages: "English, Hausa",
      availability: "Family consultations, title document review and selected pro bono intake",
      fees: "Consultation from N35,000",
      verification: "Verified lawyer profile",
      openToMentorship: true,
      menteeCount: 11,
      publications: ["Why families should document settlement terms", "Title documents to request before land purchase"]
    }
  },
  {
    name: "Oluwatobi Adeyemi",
    initials: "OA",
    title: "LLB, BL, ACIS",
    location: "Lagos",
    areas: ["Corporate Law", "Banking Law", "Employment Law"],
    budget: "Premium",
    verified: true,
    proBono: false,
    tax: false,
    online: true,
    rating: "4.9",
    summary: "Supports companies with governance, employment documentation, financing support and board advisory work.",
    profile: {
      firm: "Adeyemi Corporate Counsel",
      experience: "15 years post-call",
      languages: "English, Yoruba",
      availability: "Premium retainers, governance clinics and board documentation reviews",
      fees: "Consultation from N80,000",
      verification: "Call-to-bar and credentials reviewed",
      openToMentorship: true,
      menteeCount: 22,
      publications: ["Board minutes that survive investor diligence", "Employment policy updates for growing teams"]
    }
  }
];

const jobs = [
  {
    role: "Remote Contract Review Counsel",
    company: "Fintech operator",
    location: "Remote",
    type: "Contract",
    tags: ["Banking Law", "Data Protection"],
    copy: "Review vendor, payment and customer terms for a fast-moving financial services team."
  },
  {
    role: "In-house Legal Associate",
    company: "Lagos real estate group",
    location: "Lagos",
    type: "Full time",
    tags: ["Real Estate Law", "Company Law"],
    copy: "Support title checks, lease negotiations, company secretarial work and transaction files."
  },
  {
    role: "Pro Bono Clinic Volunteers",
    company: "Public interest registry",
    location: "Abuja",
    type: "Volunteer",
    tags: ["Human Rights", "Family Law"],
    copy: "Monthly advice clinic for eligible clients with triage support from LearnedCircle admins."
  },
  {
    role: "Tax Compliance Review Retainer",
    company: "SME advisory network",
    location: "Hybrid",
    type: "Retainer",
    tags: ["Tax Law", "Corporate Law"],
    copy: "Support recurring tax documentation checks and compliance reminders for growing Nigerian businesses."
  },
  {
    role: "Article Contributors for Practice Notes",
    company: "LearnedCircle editorial",
    location: "Remote",
    type: "Contributor",
    tags: ["Legal writing", "Professional development"],
    copy: "Verified lawyers may submit short practical articles with profile byline and editorial review."
  }
];

let approvedJobs = [];
let approvedArticles = [];
let approvedGuestArticles = [];
let approvedAdverts = [];
let approvedLawyers = [];
let onlineLawyers = [];
let debateOpinions = [];
let forumReplies = [];
let forumTopics = [];

const articles = [
  {
    title: "How to prepare a clean first brief before speaking with a lawyer",
    area: "Client guide",
    author: "LearnedCircle editorial",
    icon: "01"
  },
  {
    title: "NDPR basics every small business should review this quarter",
    area: "Data protection",
    author: "Adaeze Okonkwo",
    icon: "02"
  },
  {
    title: "When a family dispute needs mediation before litigation",
    area: "Family Law",
    author: "Nkem Afolabi",
    icon: "03"
  },
  {
    title: "A practical checklist for instructing corporate counsel",
    area: "Corporate Law",
    author: "LearnedCircle editorial",
    icon: "04"
  },
  {
    title: "What clients should know before requesting pro bono support",
    area: "Access to justice",
    author: "LearnedCircle editorial",
    icon: "05"
  }
];

const guestArticles = [
  {
    title: "Professional courtesy and the future of courtroom advocacy",
    area: "Senior commentary",
    byline: "By Hon. Justice A. M. Danjuma (Rtd.)",
    note: "Published by LearnedCircle editor"
  },
  {
    title: "Mentorship, ethics and the making of a modern Nigerian lawyer",
    area: "Guest essay",
    byline: "By Chief Kemi Rhodes, SAN",
    note: "Contributor byline approved before publication"
  },
  {
    title: "Why specialist bars matter for complex commercial disputes",
    area: "Practice reflection",
    byline: "By Prof. Tunde Akinwale, SAN",
    note: "Editorially reviewed guest article"
  },
  {
    title: "Reserved senior guest column on judicial independence",
    area: "Guest placeholder",
    byline: "By retired appellate judge to be confirmed",
    note: "Placeholder for admin-only publication with approved picture and byline"
  },
  {
    title: "Reserved SAN practice note on advocacy preparation",
    area: "Guest placeholder",
    byline: "By Senior Advocate of Nigeria to be confirmed",
    note: "Placeholder for commissioned guest blog content"
  }
];

const seniorMentors = [
  {
    name: "Chief Kemi Rhodes, SAN",
    focus: "Advocacy, ethics and commercial litigation",
    availability: "Monthly mentorship circle",
    status: "Accepting reviewed requests"
  },
  {
    name: "Hon. Justice A. M. Danjuma (Rtd.)",
    focus: "Courtroom discipline, judgment writing and professional conduct",
    availability: "Quarterly senior clinic",
    status: "Limited seats"
  },
  {
    name: "Prof. Tunde Akinwale, SAN",
    focus: "Arbitration, specialist bars and complex disputes",
    availability: "Guest mentor sessions",
    status: "Accepting reviewed requests"
  },
  {
    name: "Mrs. Folake Adeniran",
    focus: "Corporate practice, client management and law firm leadership",
    availability: "Practice-building office hours",
    status: "Accepting reviewed requests"
  }
];

const areaFilter = document.querySelector("[data-area-filter]");
const locationFilter = document.querySelector("[data-location-filter]");
const budgetFilter = document.querySelector("[data-budget-filter]");
const queryFilter = document.querySelector("[data-query-filter]");
const lawyerGrid = document.querySelector("[data-lawyer-grid]");
const jobGrid = document.querySelector("[data-job-grid]");
const articleGrid = document.querySelector("[data-article-grid]");
const guestGrid = document.querySelector("[data-guest-grid]");
const mentorRoster = document.querySelector("[data-mentor-roster]");
const advertGrid = document.querySelector("[data-advert-grid]");
const resultCount = document.querySelector("[data-result-count]");
const tabButtons = document.querySelectorAll("[data-tab]");
const modal = document.querySelector("[data-modal]");
const modalContent = document.querySelector("[data-modal-content]");

let activeTab = "lawyers";
let activeBriefMatch = null;

specializations.forEach((area) => {
  const option = document.createElement("option");
  option.value = area;
  option.textContent = area;
  areaFilter.append(option);
});

nigeriaLocations.forEach((location) => {
  const option = document.createElement("option");
  option.value = location;
  option.textContent = location;
  locationFilter.append(option);
});

function lawyerCard(lawyer) {
  const badges = [
    lawyer.proBono ? "Open to pro bono" : "Paid matters",
    lawyer.tax ? "Tax specialist" : null,
    lawyer.profile?.openToMentorship ? "Open to mentorship" : null,
    lawyer.online ? "Online now" : "Responds after review"
  ].filter(Boolean);
  const verificationLabel = lawyer.verified ? "Verified" : "Pending";
  const menteeCount = Number(lawyer.profile?.menteeCount || 0);
  const mentorshipLabel = lawyer.profile?.openToMentorship && menteeCount > 0
    ? `${menteeCount} mentee${menteeCount === 1 ? "" : "s"} following this mentor`
    : "";

  return `
    <article class="lawyer-card">
      <div class="lawyer-top">
        <span class="avatar">${lawyer.initials}</span>
        <div>
          <div class="name-line">
            <h3>${lawyer.name}</h3>
            <span class="verification-badge${lawyer.verified ? "" : " pending"}">${verificationLabel}</span>
          </div>
          <div class="meta-row">
            <span class="status">${lawyer.title}</span>
            <span class="status">${lawyer.location}</span>
            <span class="status">${lawyer.rating} rating</span>
            ${mentorshipLabel ? `<span class="status mentorship-count">${mentorshipLabel}</span>` : ""}
          </div>
        </div>
      </div>
      <p>${lawyer.summary}</p>
      <div class="tag-row">
        ${lawyer.areas.map((area) => `<span class="pill">${area}</span>`).join("")}
      </div>
      <div class="tag-row">
        ${badges.map((badge) => `<span class="status">${badge}</span>`).join("")}
      </div>
      <div class="card-actions">
        <button class="primary-action" type="button" data-open-modal="message" data-lawyer-name="${lawyer.name}">Message</button>
        <button class="secondary-action" type="button" data-lawyer-profile="${encodeURIComponent(lawyer.name)}">View profile</button>
      </div>
    </article>
  `;
}

function lawyerProfileTemplate(lawyer) {
  const verificationLabel = lawyer.verified ? "Verified" : "Pending";
  const profile = lawyer.profile;
  const menteeCount = Number(profile.menteeCount || 0);

  return `
    <div class="modal-body profile-modal">
      <div class="profile-heading">
        <span class="avatar">${lawyer.initials}</span>
        <div>
          <div class="name-line">
            <h2>${lawyer.name}</h2>
            <span class="verification-badge${lawyer.verified ? "" : " pending"}">${verificationLabel}</span>
          </div>
          <p>${lawyer.title} | ${profile.experience} | ${lawyer.location}</p>
        </div>
      </div>
      <p class="profile-summary">${lawyer.summary}</p>
      <div class="profile-section">
        <h3>Practice areas</h3>
        <div class="tag-row">${lawyer.areas.map((area) => `<span class="pill">${area}</span>`).join("")}</div>
      </div>
      <div class="profile-grid">
        <section>
          <h3>Firm or desk</h3>
          <p>${profile.firm}</p>
        </section>
        <section>
          <h3>Availability</h3>
          <p>${profile.availability}</p>
        </section>
        <section>
          <h3>Fees</h3>
          <p>${profile.fees}</p>
        </section>
        <section>
          <h3>Languages</h3>
          <p>${profile.languages}</p>
        </section>
        <section>
          <h3>Verification</h3>
          <p>${profile.verification}</p>
        </section>
        <section>
          <h3>Client access</h3>
          <p>${lawyer.budget === "Premium" ? "Direct client contact enabled for premium account." : "Contact requests route through LearnedCircle review."}</p>
        </section>
        ${profile.openToMentorship ? `
        <section>
          <h3>Mentorship</h3>
          <p>${menteeCount > 0 ? `${menteeCount} mentee${menteeCount === 1 ? "" : "s"} following this mentor.` : "Open to mentoring young lawyers."}</p>
        </section>
        ` : ""}
      </div>
      <div class="profile-section">
        <h3>Publications</h3>
        <ul>${profile.publications.map((item) => `<li>${item}</li>`).join("")}</ul>
      </div>
      <div class="card-actions">
        <button class="primary-action" type="button" data-open-modal="message" data-lawyer-name="${lawyer.name}">Message</button>
        <button class="secondary-action" type="button" data-open-modal="report" data-lawyer-name="${lawyer.name}">Report profile</button>
        <button class="secondary-action" type="button" data-close-modal>Close profile</button>
      </div>
    </div>
  `;
}

function filterLawyers() {
  if (activeBriefMatch) {
    return activeBriefMatch.matches;
  }

  const area = areaFilter.value;
  const location = locationFilter.value;
  const budget = budgetFilter.value;
  const query = queryFilter.value.trim().toLowerCase();

  return directoryLawyers().filter((lawyer) => {
    const tabMatch =
      activeTab === "lawyers" ||
      (activeTab === "online" && lawyer.online) ||
      (activeTab === "probono" && lawyer.proBono);
    const areaMatch = area === "All" || lawyer.areas.includes(area);
    const locationMatch = location === "All" || lawyer.location === location;
    const budgetMatch = budget === "All" || lawyer.budget === budget || (budget === "Pro bono" && lawyer.proBono);
    const queryTarget = `${lawyer.name} ${lawyer.title} ${lawyer.location} ${lawyer.areas.join(" ")} ${lawyer.summary}`.toLowerCase();
    return tabMatch && areaMatch && locationMatch && budgetMatch && queryTarget.includes(query);
  }).sort(sortPremiumFirst);
}

function renderLawyers() {
  const matches = filterLawyers();
  lawyerGrid.innerHTML = matches.length
    ? matches.map(lawyerCard).join("")
    : `<div class="empty-state">No exact match yet. Submit a brief and LearnedCircle can route it to suitable verified lawyers.</div>`;
  const tabLabel =
    activeTab === "online"
      ? "verified lawyers online"
      : activeTab === "probono"
        ? "pro bono lawyers"
        : "lawyers";
  resultCount.textContent = activeBriefMatch
    ? `Showing ${matches.length} matched ${tabLabel}: premium profiles first, then ordinary listings`
    : `Showing ${matches.length} ${tabLabel}`;
}

function sortPremiumFirst(a, b) {
  const tier = { Premium: 0, Standard: 1, Starter: 2 };
  return (tier[a.budget] ?? 3) - (tier[b.budget] ?? 3) || Number(b.rating) - Number(a.rating);
}

function fieldValue(fields, label) {
  const target = label.toLowerCase();
  return fields.find((field) => String(field.label || "").toLowerCase() === target)?.value || "";
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeLocation(value) {
  const location = normalizeText(value);
  return location === "abuja" ? "fct" : location;
}

function applyCaseBriefMatch(fields) {
  const requestedArea = normalizeText(fieldValue(fields, "Area of law"));
  const requestedLocation = normalizeLocation(fieldValue(fields, "Location"));
  const requestedBudget = normalizeText(fieldValue(fields, "Budget range"));
  const facts = normalizeText(fieldValue(fields, "Facts of the case"));

  const scored = lawyers.map((lawyer) => {
    const areaText = lawyer.areas.join(" ").toLowerCase();
    const lawyerText = `${lawyer.name} ${lawyer.title} ${lawyer.location} ${areaText} ${lawyer.summary}`.toLowerCase();
    let score = 0;

    if (requestedArea && areaText.includes(requestedArea)) score += 8;
    if (requestedArea && lawyerText.includes(requestedArea)) score += 4;
    if (requestedLocation && normalizeLocation(lawyer.location).includes(requestedLocation)) score += 3;
    if (requestedBudget && normalizeText(lawyer.budget).includes(requestedBudget)) score += 2;
    if (facts && facts.split(/\s+/).some((word) => word.length > 4 && lawyerText.includes(word))) score += 2;
    if (lawyer.budget === "Premium") score += 1;

    return { lawyer, score };
  });

  const positiveMatches = scored.filter((item) => item.score > 0);
  const ranked = (positiveMatches.length ? positiveMatches : scored)
    .sort((a, b) => {
      const premiumOrder = sortPremiumFirst(a.lawyer, b.lawyer);
      return premiumOrder || b.score - a.score;
    })
    .map((item) => item.lawyer);

  activeBriefMatch = { matches: ranked };
  activeTab = "lawyers";
  tabButtons.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === "lawyers"));
  renderLawyers();
  document.querySelector("#lawyers").scrollIntoView({ behavior: "smooth", block: "start" });
}

function setDirectoryTab(tabName) {
  const target = document.querySelector(`[data-tab="${tabName}"]`);
  if (!target) return;
  activeBriefMatch = null;
  tabButtons.forEach((tab) => tab.classList.remove("active"));
  target.classList.add("active");
  activeTab = tabName;
  renderLawyers();
  document.querySelector("#lawyers").scrollIntoView({ behavior: "smooth", block: "start" });
}

function escapeAttribute(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeApprovedJob(job) {
  return {
    role: job.title,
    company: job.organization || "LearnedCircle opportunity",
    location: job.location || "Flexible",
    type: job.engagement_type || "Opportunity",
    tags: Array.isArray(job.practice_areas) && job.practice_areas.length ? job.practice_areas : ["Legal work"],
    copy: job.description,
    budget: job.budget
  };
}

function initialsFromName(name) {
  return String(name || "LC")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "LC";
}

function normalizeApprovedLawyer(lawyer, options = {}) {
  const areas = Array.isArray(lawyer.practice_areas) && lawyer.practice_areas.length ? lawyer.practice_areas : ["Legal practice"];
  const callDetails = [
    lawyer.year_of_call ? `${lawyer.year_of_call} call` : null,
    lawyer.show_call_details_public && lawyer.supreme_court_number ? `SCN ${lawyer.supreme_court_number}` : null
  ].filter(Boolean).join(" | ");

  return {
    name: lawyer.display_name,
    initials: initialsFromName(lawyer.display_name),
    title: lawyer.credentials || "Verified lawyer",
    location: lawyer.location || "Flexible",
    areas,
    budget: lawyer.direct_client_contact ? "Premium" : "Standard",
    verified: lawyer.verified === true,
    proBono: lawyer.pro_bono_open === true,
    tax: areas.some((area) => String(area).toLowerCase().includes("tax")),
    online: options.online === true,
    rating: options.online ? "Online" : "Verified",
    summary: lawyer.summary || "Available for suitable legal enquiries on LearnedCircle.",
    profile: {
      firm: lawyer.firm || "LearnedCircle verified profile",
      experience: callDetails || "Verified profile",
      languages: lawyer.languages || "Available on request",
      availability: options.online ? "Online now" : (lawyer.availability || "Available by request"),
      fees: lawyer.fees || "Discuss directly",
      verification: lawyer.show_call_details_public && callDetails
        ? `Verified lawyer profile | ${callDetails}`
        : "Verified lawyer profile. Call details reviewed privately by LearnedCircle.",
      openToMentorship: false,
      publications: ["Public profile updates coming soon"]
    }
  };
}

function normalizeOnlineLawyer(lawyer) {
  return normalizeApprovedLawyer(lawyer, { online: true });
}

function directoryLawyers() {
  if (activeTab === "online" && onlineLawyers.length) return onlineLawyers;
  const liveNames = new Set(approvedLawyers.map((lawyer) => lawyer.name));
  return [...approvedLawyers, ...lawyers.filter((lawyer) => !liveNames.has(lawyer.name))];
}

function renderJobs() {
  const visibleJobs = [...approvedJobs.map(normalizeApprovedJob), ...jobs];
  jobGrid.innerHTML = visibleJobs.map((job) => `
    <article class="job-card">
      <div>
        <h3>${job.role}</h3>
        <p>${job.company}</p>
      </div>
      <div class="job-meta">
        <span class="status">${job.location}</span>
        <span class="status">${job.type}</span>
      </div>
      <p>${job.copy}</p>
      ${job.budget ? `<p><strong>Budget:</strong> ${job.budget}</p>` : ""}
      <div class="tag-row">${job.tags.map((tag) => `<span class="pill">${tag}</span>`).join("")}</div>
      <button
        class="secondary-action"
        type="button"
        data-open-modal="apply"
        data-job-title="${escapeAttribute(job.role)}"
        data-job-company="${escapeAttribute(job.company)}"
        data-job-location="${escapeAttribute(job.location)}"
        data-job-type="${escapeAttribute(job.type)}"
      >
        Apply directly
      </button>
    </article>
  `).join("");
}

async function loadPublicData() {
  try {
    const response = await fetch("/api/public-data");
    const result = await response.json();
    if (result.ok && Array.isArray(result.jobs)) {
      approvedJobs = result.jobs;
      renderJobs();
    }
    if (result.ok && Array.isArray(result.articles)) {
      approvedArticles = result.articles;
      renderArticles();
    }
    if (result.ok && Array.isArray(result.adverts)) {
      approvedAdverts = result.adverts;
      renderAdverts();
    }
    if (result.ok && Array.isArray(result.guestArticles)) {
      approvedGuestArticles = result.guestArticles;
      renderGuestArticles();
    }
    if (result.ok && Array.isArray(result.approvedLawyers)) {
      approvedLawyers = result.approvedLawyers.map((lawyer) => normalizeApprovedLawyer(lawyer, {
        online: lawyer.updated_at ? (Date.now() - new Date(lawyer.updated_at).getTime()) < 15 * 60 * 1000 : false
      }));
      renderLawyers();
    }
    if (result.ok && Array.isArray(result.onlineLawyers)) {
      onlineLawyers = result.onlineLawyers.map(normalizeOnlineLawyer);
      renderLawyers();
    }
    if (result.ok && Array.isArray(result.debateOpinions)) {
      debateOpinions = result.debateOpinions;
      renderDebateOpinions();
    }
    if (result.ok && Array.isArray(result.forumReplies)) {
      forumReplies = result.forumReplies;
      renderForumReplies();
    }
    if (result.ok && Array.isArray(result.forumTopics)) {
      forumTopics = result.forumTopics;
      renderForumTopics();
    }
  } catch (error) {
    approvedJobs = [];
    approvedArticles = [];
    approvedGuestArticles = [];
    approvedAdverts = [];
    approvedLawyers = [];
    onlineLawyers = [];
    debateOpinions = [];
    forumReplies = [];
    forumTopics = [];
  }
}

function renderArticles() {
  const liveArticles = approvedArticles.map((article, index) => ({
    title: article.title,
    area: article.practice_area || "Legal insight",
    author: article.byline || "LearnedCircle contributor",
    icon: String(index + 1).padStart(2, "0")
  }));
  const visibleArticles = [...liveArticles, ...articles];
  articleGrid.innerHTML = visibleArticles.map((article) => `
    <article class="article-card">
      <span class="article-icon">${article.icon}</span>
      <div>
        <p class="eyebrow">${article.area}</p>
        <h3>${article.title}</h3>
        <p>By ${article.author}</p>
      </div>
    </article>
  `).join("");
}

function renderGuestArticles() {
  const liveGuestArticles = approvedGuestArticles.map((article) => ({
    title: article.title,
    area: article.contributor_title || "Guest commentary",
    byline: article.approved_byline || `By ${article.contributor_name}`,
    note: article.summary || "Published by LearnedCircle editor",
    writerPictureUrl: article.writer_picture_url || ""
  }));
  const visibleGuestArticles = [...liveGuestArticles, ...guestArticles];

  guestGrid.innerHTML = visibleGuestArticles.map((article) => `
    <article class="guest-card">
      ${article.writerPictureUrl ? `<img class="guest-avatar" src="${escapeAttribute(article.writerPictureUrl)}" alt="${escapeAttribute(article.byline.replace(/^By\s+/i, ""))}" />` : ""}
      <span class="status">${article.area}</span>
      <h3>${article.title}</h3>
      <p class="guest-byline">${article.byline}</p>
      <p>${article.note}</p>
    </article>
  `).join("");
}

function renderMentorRoster() {
  if (!mentorRoster) return;

  mentorRoster.innerHTML = `
    <div class="mini-heading">
      <p class="eyebrow">Available mentors</p>
      <h3>Senior lawyers ready to mentor young lawyers</h3>
    </div>
    <div class="mentor-list">
      ${seniorMentors.map((mentor) => `
        <article class="mentor-list-card">
          <span class="status">${mentor.status}</span>
          <h4>${mentor.name}</h4>
          <p>${mentor.focus}</p>
          <small>${mentor.availability}</small>
        </article>
      `).join("")}
    </div>
  `;
}

function renderAdverts() {
  if (!advertGrid) return;

  const visibleAdverts = approvedAdverts.slice(0, 4);
  if (!visibleAdverts.length) {
    advertGrid.innerHTML = "";
    return;
  }

  advertGrid.innerHTML = visibleAdverts.map((advert) => {
    const isPaid = String(advert.advert_type || "").toLowerCase().startsWith("paid");
    return `
    <article class="advert-card ${isPaid ? "paid-advert" : ""}">
      <span class="status">${isPaid ? "Paid priority advert" : "Free reviewed advert"}</span>
      <h3>${advert.organization}</h3>
      <p>${advert.campaign_note || "Approved LearnedCircle advert placement."}</p>
      <small>${advert.advert_type || "General advert"} | ${advert.target_audience || "Legal audience"}</small>
    </article>
  `;
  }).join("");
}

function opinionTemplate(opinion, isLive = false) {
  return `
    <article ${isLive ? "data-live-opinion" : ""}>
      <strong>${escapeAttribute(opinion.position || "Opinion")}</strong>
      <p>${escapeAttribute(opinion.reason || "")}</p>
    </article>
  `;
}

function renderDebateOpinions() {
  document.querySelectorAll("[data-debate-id]").forEach((panel) => {
    const list = panel.querySelector("[data-opinion-list]");
    if (!list) return;

    list.querySelectorAll("[data-live-opinion]").forEach((item) => item.remove());
    debateOpinions
      .filter((opinion) => opinion.debateId === panel.dataset.debateId)
      .forEach((opinion) => {
        list.insertAdjacentHTML("afterbegin", opinionTemplate(opinion, true));
      });
  });
}

function replyTemplate(reply, isLive = false) {
  return `
    <article ${isLive ? "data-live-reply" : ""}>
      <strong>Public reply</strong>
      <p>${escapeAttribute(reply.reply || "")}</p>
    </article>
  `;
}

function renderForumReplies() {
  document.querySelectorAll("[data-forum-id]").forEach((panel) => {
    const list = panel.querySelector("[data-reply-list]");
    if (!list) return;

    list.querySelectorAll("[data-live-reply]").forEach((item) => item.remove());
    forumReplies
      .filter((reply) => reply.forumId === panel.dataset.forumId)
      .forEach((reply) => {
        list.insertAdjacentHTML("afterbegin", replyTemplate(reply, true));
      });
  });
}

function forumTopicTemplate(topic, isLive = false) {
  const forumId = escapeAttribute(topic.forumId || topic.id || "");
  const title = escapeAttribute(topic.title || "Forum discussion");
  const practiceArea = escapeAttribute(topic.practiceArea || "Forum");
  const details = escapeAttribute(topic.details || "Public discussion on LearnedCircle.");

  return `
    <article class="feed-item forum-item" ${isLive ? "data-live-topic" : ""} data-forum-id="${forumId}" data-forum-title="${title}">
      <span class="status">${practiceArea}</span>
      <h4>${title}</h4>
      <p>${details}</p>
      <details class="forum-drop">
        <summary>Reply and read comments</summary>
        <form class="forum-reply-form" data-forum-reply-form>
          <label>
            Your reply
            <textarea name="reply" placeholder="Write a helpful public reply" required></textarea>
          </label>
          <button class="secondary-action" type="submit">Post reply</button>
        </form>
        <div class="reply-list" data-reply-list></div>
      </details>
    </article>
  `;
}

function renderForumTopics() {
  const forumColumn = document.querySelector("[aria-labelledby='forum-feed-title']");
  const heading = forumColumn?.querySelector(".mini-heading");
  if (!forumColumn || !heading) return;

  forumColumn.querySelectorAll("[data-live-topic]").forEach((item) => item.remove());
  forumTopics.forEach((topic) => {
    heading.insertAdjacentHTML("afterend", forumTopicTemplate(topic, true));
  });
  renderForumReplies();
}

function modalTemplate(type, context = {}) {
  const templates = {
    brief: {
      title: "Submit a case brief",
      copy: "Premium matching will notify 3-5 suitable lawyers based on practice area, location, urgency and budget.",
      fields: ["Full name", "Area of law", "Location", "Budget range", "Facts of the case"],
      moderationType: "Case brief request"
    },
    job: {
      title: "Post an opportunity",
      copy: "Create an account to submit legal jobs, retainers, referral briefs or outsourced legal work. Free listings go to admin review before publication. Verified lawyers with active premium access can publish faster, feature listings and receive direct replies.",
      fields: ["Account email", "Organization", "Role or opportunity", "Practice area", "Location", "Budget or fee range", "Brief description"],
      moderationType: "Opportunity draft"
    },
    article: {
      title: "Start an article",
      copy: "Submit the article details, preferred byline, picture and Word draft. Verified premium lawyers can publish directly from their account; public submissions go for editorial review.",
      fields: ["Article title", "Practice area", "Author name", "Email address", "Summary"],
      directType: "article-submission",
      customFieldsPlacement: "after",
      customFields: `
        <label>
          Preferred byline
          <input name="Preferred byline" type="text" placeholder="e.g. By Adaeze Okonkwo, Esq." required />
        </label>
        <label>
          Preferred picture URL
          <input name="Preferred picture URL" type="url" placeholder="https://..." />
        </label>
        <label>
          Upload article in Word
          <input name="Article Word file" type="file" accept=".doc,.docx" />
          <small>Accepted formats: DOC or DOCX.</small>
        </label>
        <label>
          Article body
          <textarea name="Article body" placeholder="Paste the article text here, or upload the Word draft above."></textarea>
        </label>
      `
    },
    mentor: {
      title: "Request mentorship access",
      copy: "Mentorship requests are reviewed so senior lawyers, SANs, retired judges and respected practitioners can support young lawyers in a professional setting.",
      fields: ["Full name", "Email address", "Current role", "Practice area of interest"],
      moderationType: "Mentorship request",
      customFieldsPlacement: "after",
      customFields: `
        <label>
          Preferred mentor or senior lawyer
          <select name="Preferred mentor or senior lawyer" required>
            <option value="">Select an available mentor</option>
            ${seniorMentors.map((mentor) => `
              <option value="${escapeAttribute(mentor.name)}">${mentor.name} - ${mentor.focus}</option>
            `).join("")}
          </select>
        </label>
        <label>
          Mentorship goal
          <textarea name="Mentorship goal" placeholder="Mentorship goal"></textarea>
        </label>
      `
    },
    account: {
      title: "Account login or signup",
      copy: "Create a client, lawyer, employer or admin account. Lawyer verification can include call-to-bar and ID review.",
      fields: ["Email address", "Account type", "Password"]
    },
    login: {
      title: "Account login",
      copy: "Access messaging, saved briefs, lawyer verification, publishing tools and premium account features.",
      fields: ["Email address", "Password"]
    },
    signup: {
      title: "Create an account",
      copy: "Sign up as a client, lawyer, law firm, employer or advertiser. Verified lawyers can unlock premium tools after review.",
      fields: ["Full name", "Email address", "Account type", "Password"]
    },
    upgrade: {
      title: "Upgrade lawyer account",
      copy: "Request premium access for direct posting, direct client contact, featured profile placement, online lawyer chat and secure file intake. Verification remains separate and requires admin review of SCN and lawyer profile details.",
      fields: ["Full name", "Email address", "SCN", "NBA branch or professional body", "Primary practice areas", "Verification note"],
      moderationType: "Premium lawyer upgrade request"
    },
    advertise: {
      title: "Advertise on LearnedCircle",
      copy: "Choose a free reviewed advert or a paid priority advert. Paid adverts receive stronger visibility, clearer placement and more reliable promotion after payment confirmation.",
      fields: ["Organization", "Advert type", "Target audience", "Campaign note"],
      moderationType: "Advert request",
      customFields: `
        <fieldset class="option-fieldset">
          <legend>Advert option</legend>
          <label class="option-choice">
            <input type="radio" name="Advert option" value="Free advert" checked />
            <span>
              <strong>Free advert</strong>
              Reviewed by admin, lower visibility, published when space is available.
            </span>
          </label>
          <label class="option-choice">
            <input type="radio" name="Advert option" value="Paid advert" />
            <span>
              <strong>Paid advert</strong>
              Higher visibility, priority placement and more reliable campaign support after payment.
            </span>
          </label>
        </fieldset>
      `
    },
    forum: {
      title: "Start a forum discussion",
      copy: "Open a public legal question or practice-area discussion. It publishes immediately and can receive public replies.",
      fields: ["Topic title", "Practice area", "Discussion details"],
      directType: "forum-topic"
    },
    debate: {
      title: "Join a legal debate",
      copy: "Debates are moderated spaces for lawyers and informed users to discuss legal policy, procedure and public-interest issues.",
      fields: ["Debate topic", "Your position", "Supporting note"]
    },
    news: {
      title: "Legal news updates",
      copy: "Follow court updates, regulatory notices, tax deadlines, legal appointments and professional opportunities.",
      fields: ["Email address", "Preferred news area"]
    },
    message: {
      title: "Contact a lawyer",
      copy: "No account is required. Search for a lawyer and send a short direct contact request. Online lawyer chat is shown separately for lawyers who are currently active.",
      fields: ["Full name", "Email address", "Phone number", "Preferred lawyer", "Area of law", "Message"],
      moderationType: "Client lawyer contact request"
    },
    report: {
      title: "Report a profile or listing",
      copy: "Reports go to LearnedCircle moderation for admin review. Include enough detail for admin to assess the issue.",
      fields: ["Your name", "Email address", "Reported profile or listing", "Reason for report"],
      moderationType: "Abuse or profile report"
    },
    profile: {
      title: "Lawyer profile preview",
      copy: "Full profiles include qualifications, NBA verification, languages, fee structure, reviews, publications and booking availability.",
      fields: ["Your email"]
    },
    apply: {
      title: "Apply for this opportunity",
      copy: "Submit your application directly with a short note and CV upload. The opportunity owner or platform admin can review the applicant details.",
      fields: ["Full name", "Email address", "Phone number"],
      directType: "job-application",
      customFieldsPlacement: "after",
      customFields: `
        <div class="application-summary">
          <span class="status">Selected opportunity</span>
          <strong>${escapeAttribute(context.jobTitle || "Legal opportunity")}</strong>
          <p>${escapeAttribute(context.jobCompany || "LearnedCircle opportunity")} | ${escapeAttribute(context.jobLocation || "Flexible")} | ${escapeAttribute(context.jobType || "Opportunity")}</p>
        </div>
        <label>
          Cover note
          <textarea name="Cover note" placeholder="Briefly explain your experience and availability" required></textarea>
        </label>
        <label>
          Upload CV
          <input name="CV" type="file" accept=".pdf,.doc,.docx" required />
          <small>Accepted formats: PDF, DOC or DOCX.</small>
        </label>
      `
    }
  };
  const item = templates[type] || templates.brief;
  return `
    <div class="modal-body">
      <h2>${item.title}</h2>
      <p>${item.copy}</p>
      <form
        class="modal-form"
        data-moderation-type="${item.moderationType || ""}"
        data-direct-type="${item.directType || ""}"
        data-job-title="${escapeAttribute(context.jobTitle || "")}"
        data-job-company="${escapeAttribute(context.jobCompany || "")}"
        data-job-location="${escapeAttribute(context.jobLocation || "")}"
        data-job-type="${escapeAttribute(context.jobType || "")}"
      >
        ${item.customFieldsPlacement === "after" ? "" : item.customFields || ""}
        ${item.fields.map((field, index) => {
          const prefill = field === "Preferred lawyer" && context.lawyerName ? context.lawyerName : "";
          const isLongField =
            (index === item.fields.length - 1 && field.toLowerCase().includes("description")) ||
            field.toLowerCase().includes("case") ||
            field.toLowerCase().includes("message") ||
            field.toLowerCase().includes("summary") ||
            field.toLowerCase().includes("note");
          return `
          <label>
            ${field}
            ${isLongField
              ? `<textarea placeholder="${field}"></textarea>`
              : `<input type="${field.toLowerCase().includes("email") ? "email" : field.toLowerCase().includes("password") ? "password" : "text"}" placeholder="${field}" value="${escapeAttribute(prefill)}" />`}
          </label>
        `;
        }).join("")}
        ${item.customFieldsPlacement === "after" ? item.customFields || "" : ""}
        <p class="form-status" data-form-status hidden></p>
        <button class="primary-action" type="submit">${item.directType === "forum-topic" ? "Publish discussion" : item.directType === "job-application" ? "Submit application" : item.directType === "article-submission" ? "Submit article" : item.moderationType ? "Submit for review" : "Continue"}</button>
      </form>
    </div>
  `;
}

async function submitModerationDraft(form) {
  const moderationType = form.dataset.moderationType;
  if (!moderationType) {
    modal.close();
    return;
  }

  const status = form.querySelector("[data-form-status]");
  const fields = Array.from(form.querySelectorAll("input, textarea, select"))
    .filter((field) => field.type !== "radio" || field.checked)
    .map((field) => ({
      label: field.name || field.placeholder || field.closest("label")?.innerText.trim() || "Field",
      value: field.value.trim()
    }));

  status.hidden = false;
  status.textContent = "Sending draft to moderation...";

  try {
    const response = await fetch("/api/moderation-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: moderationType,
        source: "LearnedCircle website",
        fields
      })
    });
    const result = await response.json();
    status.textContent = result.message || "Draft submitted for moderation.";
    if (moderationType === "Case brief request") {
      applyCaseBriefMatch(fields);
      modal.close();
    }
    form.reset();
  } catch (error) {
    status.textContent = "Draft saved for review. Email notifications will activate after deployment settings are connected.";
  }
}

function modalFieldValue(fields, label) {
  return fields.find((field) => field.label.toLowerCase() === label.toLowerCase())?.value || "";
}

async function submitDirectForumTopic(form) {
  const status = form.querySelector("[data-form-status]");
  const submitButton = form.querySelector("button[type='submit']");
  const fields = Array.from(form.querySelectorAll("input, textarea, select")).map((field) => ({
    label: field.name || field.placeholder || field.closest("label")?.innerText.trim() || "Field",
    value: field.value.trim()
  }));

  const topic = {
    title: modalFieldValue(fields, "Topic title"),
    practiceArea: modalFieldValue(fields, "Practice area"),
    details: modalFieldValue(fields, "Discussion details")
  };

  if (!topic.title || !topic.details) {
    status.hidden = false;
    status.textContent = "Topic title and discussion details are required.";
    return;
  }

  status.hidden = false;
  status.textContent = "Publishing discussion...";
  submitButton.disabled = true;

  try {
    const response = await fetch("/api/community-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(topic)
    });
    const result = await response.json();
    const savedTopic = result.topic || {
      ...topic,
      forumId: `local-${Date.now()}`
    };
    forumTopics = [savedTopic, ...forumTopics];
    renderForumTopics();
    form.reset();
    modal.close();
    document.querySelector("#forum")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    status.textContent = "Could not publish now. Please try again.";
  } finally {
    submitButton.disabled = false;
  }
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.onerror = () => reject(new Error("Could not read CV file."));
    reader.readAsDataURL(file);
  });
}

async function submitDirectJobApplication(form) {
  const status = form.querySelector("[data-form-status]");
  const submitButton = form.querySelector("button[type='submit']");
  const fileInput = form.querySelector('input[type="file"]');
  const cvFile = fileInput?.files?.[0];
  const fields = Array.from(form.querySelectorAll("input, textarea, select"))
    .filter((field) => field.type !== "file")
    .map((field) => ({
      label: field.name || field.placeholder || field.closest("label")?.innerText.trim() || "Field",
      value: field.value.trim()
    }));

  if (!cvFile) {
    status.hidden = false;
    status.textContent = "Please upload your CV before submitting.";
    return;
  }

  const applicantName = modalFieldValue(fields, "Full name");
  const applicantEmail = modalFieldValue(fields, "Email address");
  const coverNote = modalFieldValue(fields, "Cover note");

  if (!applicantName || !applicantEmail || !coverNote) {
    status.hidden = false;
    status.textContent = "Full name, email address, cover note and CV are required.";
    return;
  }

  let cvContentBase64 = "";
  if (cvFile.size <= 2500000) {
    cvContentBase64 = await readFileAsBase64(cvFile);
  }

  const application = {
    jobTitle: form.dataset.jobTitle || "Legal opportunity",
    jobCompany: form.dataset.jobCompany || "LearnedCircle opportunity",
    jobLocation: form.dataset.jobLocation || "Flexible",
    jobType: form.dataset.jobType || "Opportunity",
    fields,
    cv: {
      name: cvFile.name,
      type: cvFile.type || "application/octet-stream",
      size: cvFile.size,
      contentBase64: cvContentBase64
    }
  };

  status.hidden = false;
  status.textContent = "Submitting application...";
  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  try {
    const response = await fetch("/api/job-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(application)
    });
    const result = await response.json();
    status.textContent = result.message || `Application submitted. CV attached: ${cvFile.name}.`;
    form.reset();
  } catch (error) {
    status.textContent = `Application captured for the prototype. CV attached: ${cvFile.name}. Live delivery will complete when the application endpoint is deployed.`;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit application";
  }
}

async function submitDirectArticleSubmission(form) {
  const status = form.querySelector("[data-form-status]");
  const submitButton = form.querySelector("button[type='submit']");
  const fileInput = form.querySelector('input[type="file"]');
  const articleFile = fileInput?.files?.[0];
  const fields = Array.from(form.querySelectorAll("input, textarea, select"))
    .filter((field) => field.type !== "file")
    .map((field) => ({
      label: field.name || field.placeholder || field.closest("label")?.innerText.trim() || "Field",
      value: field.value.trim()
    }));

  const title = modalFieldValue(fields, "Article title");
  const authorName = modalFieldValue(fields, "Author name");
  const preferredByline = modalFieldValue(fields, "Preferred byline");
  const summary = modalFieldValue(fields, "Summary");
  const articleBody = modalFieldValue(fields, "Article body");

  if (!title || !authorName || !preferredByline || !summary || (!articleBody && !articleFile)) {
    status.hidden = false;
    status.textContent = "Article title, author name, preferred byline, summary and either article body or Word upload are required.";
    return;
  }

  let contentBase64 = "";
  if (articleFile && articleFile.size <= 2500000) {
    contentBase64 = await readFileAsBase64(articleFile);
  }

  status.hidden = false;
  status.textContent = "Submitting article...";
  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  try {
    const response = await fetch("/api/article-submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields,
        articleFile: articleFile
          ? {
              name: articleFile.name,
              type: articleFile.type || "application/octet-stream",
              size: articleFile.size,
              contentBase64
            }
          : null
      })
    });
    const result = await response.json();
    status.textContent = result.message || "Article submitted for editorial review.";
    form.reset();
  } catch (error) {
    status.textContent = "Article captured for review. Live delivery will complete when the article submission endpoint is deployed.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit article";
  }
}

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-area-filter], [data-location-filter], [data-budget-filter], [data-query-filter]")) {
    activeBriefMatch = null;
    renderLawyers();
  }
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tabButtons.forEach((tab) => tab.classList.remove("active"));
    button.classList.add("active");
    activeTab = button.dataset.tab;
    renderLawyers();
  });
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".nav-group")) {
    document.querySelectorAll(".nav-group[open]").forEach((group) => {
      group.removeAttribute("open");
    });
  }

  const profileButton = event.target.closest("[data-lawyer-profile]");
  if (profileButton) {
    const lawyer = directoryLawyers().find((item) => item.name === decodeURIComponent(profileButton.dataset.lawyerProfile));
    if (lawyer) {
      modalContent.innerHTML = lawyerProfileTemplate(lawyer);
      if (!modal.open) modal.showModal();
    }
    return;
  }

  const openButton = event.target.closest("[data-open-modal]");
  if (openButton) {
    if (["account", "login", "signup", "upgrade"].includes(openButton.dataset.openModal)) {
      const mode = openButton.dataset.openModal === "signup" ? "?mode=signup" : "?mode=login";
      window.location.href = `account.html${openButton.dataset.openModal === "upgrade" ? "" : mode}`;
      return;
    }

    document.querySelectorAll(".nav-group[open]").forEach((group) => {
      group.removeAttribute("open");
    });
    modalContent.innerHTML = modalTemplate(openButton.dataset.openModal, {
      lawyerName: openButton.dataset.lawyerName || "",
      jobTitle: openButton.dataset.jobTitle || "",
      jobCompany: openButton.dataset.jobCompany || "",
      jobLocation: openButton.dataset.jobLocation || "",
      jobType: openButton.dataset.jobType || ""
    });
    if (!modal.open) modal.showModal();
  }

  const tabJump = event.target.closest("[data-jump-tab]");
  if (tabJump) {
    setDirectoryTab(tabJump.dataset.jumpTab);
  }

  const scrollTarget = event.target.closest("[data-scroll-target]");
  if (scrollTarget) {
    document.querySelector(`#${scrollTarget.dataset.scrollTarget}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (event.target.closest("[data-close-modal]")) {
    modal.close();
  }
});

document.addEventListener("submit", async (event) => {
  if (event.target.matches("[data-forum-reply-form]")) {
    event.preventDefault();
    const form = event.target;
    const submitButton = form.querySelector("button[type='submit']");
    const forumPanel = form.closest("[data-forum-id]");
    const replyText = form.elements.reply.value.trim();
    const replyList = forumPanel?.querySelector("[data-reply-list]");
    if (!replyText || !replyList) return;

    const reply = {
      forumId: forumPanel.dataset.forumId,
      forumTitle: forumPanel.dataset.forumTitle,
      reply: replyText
    };

    submitButton.disabled = true;
    submitButton.textContent = "Posting...";

    try {
      const response = await fetch("/api/discussion-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reply)
      });
      const result = await response.json();
      replyList.insertAdjacentHTML("afterbegin", replyTemplate(result.reply || reply, true));
    } catch (error) {
      replyList.insertAdjacentHTML("afterbegin", replyTemplate(reply, true));
    } finally {
      form.reset();
      submitButton.disabled = false;
      submitButton.textContent = "Post reply";
    }
    return;
  }

  if (event.target.matches("[data-debate-reason-form]")) {
    event.preventDefault();
    const form = event.target;
    const submitButton = form.querySelector("button[type='submit']");
    const debatePanel = form.closest(".debate-drop");
    const position = form.elements.position.value;
    const reason = form.elements.reason.value.trim();
    const opinionList = debatePanel?.querySelector("[data-opinion-list]");
    if (!reason || !opinionList) return;

    const opinion = {
      debateId: debatePanel.dataset.debateId,
      debateTitle: debatePanel.dataset.debateTitle,
      position,
      reason
    };

    submitButton.disabled = true;
    submitButton.textContent = "Publishing...";

    try {
      const response = await fetch("/api/debate-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(opinion)
      });
      const result = await response.json();
      opinionList.insertAdjacentHTML("afterbegin", opinionTemplate(result.opinion || opinion, true));
    } catch (error) {
      opinionList.insertAdjacentHTML("afterbegin", opinionTemplate(opinion, true));
    } finally {
      form.reset();
      submitButton.disabled = false;
      submitButton.textContent = "Submit reason";
    }
    return;
  }

  if (event.target.matches(".modal-form")) {
    event.preventDefault();
    if (event.target.dataset.directType === "forum-topic") {
      submitDirectForumTopic(event.target);
      return;
    }
    if (event.target.dataset.directType === "job-application") {
      submitDirectJobApplication(event.target);
      return;
    }
    if (event.target.dataset.directType === "article-submission") {
      submitDirectArticleSubmission(event.target);
      return;
    }
    submitModerationDraft(event.target);
  }
});

renderLawyers();
renderJobs();
loadPublicData();
renderArticles();
renderGuestArticles();
renderMentorRoster();
renderDebateOpinions();
renderForumReplies();
renderForumTopics();
