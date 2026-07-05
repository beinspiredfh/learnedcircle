let libraryItems = [
  {
    title: "How to prepare a clean first brief before speaking with a lawyer",
    area: "Client Guide",
    type: "Article",
    group: "articles",
    source: "LearnedCircle editorial",
    summary: "A simple client-facing guide for organising facts, documents, questions and preferred outcomes before contacting counsel.",
    action: "Read article",
    url: "index.html#articles"
  },
  {
    title: "NDPR basics every small business should review this quarter",
    area: "Data Protection / Privacy Law",
    type: "Article",
    group: "articles",
    source: "Adaeze Okonkwo",
    summary: "Practical reminders on privacy notices, consent, vendor handling and data-governance hygiene.",
    action: "Read article",
    url: "index.html#articles"
  },
  {
    title: "Corporate Law Starter Library",
    area: "Corporate Law",
    type: "Online book",
    group: "books",
    source: "LearnedCircle editorial desk",
    summary: "Company formation, board governance, shareholder records, CAC filings and founder documentation.",
    action: "Open book",
    url: "index.html#ai-assistant"
  },
  {
    title: "Civil Litigation and Evidence Deskbook",
    area: "Litigation",
    type: "Online book",
    group: "books",
    source: "Senior bar contributors",
    summary: "Pleadings, motions, affidavits, admissibility issues, evidence preparation and hearing checklists.",
    action: "Open deskbook",
    url: "index.html#ai-assistant"
  },
  {
    title: "Tax Practice Notes for Business Clients",
    area: "Tax Law",
    type: "Practice guide",
    group: "books",
    source: "Tax specialist contributors",
    summary: "VAT, withholding tax, company income tax, transfer-pricing basics and tax-risk checklists.",
    action: "Read guide",
    url: "index.html#ai-assistant"
  },
  {
    title: "Property and Real Estate Transaction Handbook",
    area: "Property Law",
    type: "Online book",
    group: "books",
    source: "Real estate practice desk",
    summary: "Title investigation, perfection, leases, land registry steps and buyer protection notes.",
    action: "Browse handbook",
    url: "index.html#ai-assistant"
  },
  {
    title: "LearnedCircle Law Report (LCLR)",
    area: "Law Reports",
    type: "Coming journal",
    group: "journals",
    source: "LearnedCircle",
    summary: "Future curated law-report and case-note product for important decisions, commentary and practitioner research.",
    action: "View plan",
    url: "index.html#guest-blog"
  },
  {
    title: "Senior advocacy and judicial commentary journal",
    area: "Legal Commentary",
    type: "Coming journal",
    group: "journals",
    source: "Guest blog desk",
    summary: "A planned editorial space for SANs, retired judges and senior lawyers to publish professional commentary.",
    action: "View guest blog",
    url: "index.html#guest-blog"
  },
  {
    title: "AfricanLII",
    area: "African Legal Research",
    type: "External library",
    group: "external",
    source: "African Legal Information Institute",
    summary: "Free access to African case law, legislation and legal materials across several jurisdictions.",
    action: "Open external library",
    url: "https://africanlii.org/"
  },
  {
    title: "CommonLII",
    area: "Commonwealth Legal Research",
    type: "External library",
    group: "external",
    source: "Commonwealth Legal Information Institute",
    summary: "Research portal for Commonwealth case law, legislation and legal materials.",
    action: "Open external library",
    url: "http://www.commonlii.org/"
  },
  {
    title: "WorldLII",
    area: "Global Legal Research",
    type: "External library",
    group: "external",
    source: "World Legal Information Institute",
    summary: "A global legal research gateway linking legal information institutes and open legal databases.",
    action: "Open external library",
    url: "http://www.worldlii.org/"
  },
  {
    title: "Google Scholar Case Law",
    area: "Case Law Search",
    type: "External library",
    group: "external",
    source: "Google Scholar",
    summary: "Useful for broad case-law and academic search, especially when checking wider comparative materials.",
    action: "Open external library",
    url: "https://scholar.google.com/"
  }
];

const queryInput = document.querySelector("[data-library-page-query]");
const areaSelect = document.querySelector("[data-library-page-area]");
const countNode = document.querySelector("[data-library-page-count]");
const containers = {
  articles: document.querySelector("[data-library-articles]"),
  books: document.querySelector("[data-library-books]"),
  journals: document.querySelector("[data-library-journals]"),
  external: document.querySelector("[data-library-external]")
};

function populateAreas() {
  if (!areaSelect) return;
  const selected = areaSelect.value;
  areaSelect.innerHTML = '<option value="">All law areas</option>';
  Array.from(new Set(libraryItems.map((item) => item.area).filter(Boolean))).sort().forEach((area) => {
    const option = document.createElement("option");
    option.value = area;
    option.textContent = area;
    areaSelect.append(option);
  });
  areaSelect.value = Array.from(areaSelect.options).some((option) => option.value === selected) ? selected : "";
}

populateAreas();

function normalizePublicLibraryResource(resource) {
  return {
    title: resource.title || "Library material",
    area: resource.area || "General legal research",
    type: resource.resource_type || (resource.group_key === "external" ? "External library" : "Library material"),
    group: resource.group_key || "books",
    source: resource.source || "LearnedCircle Library",
    summary: resource.summary || "Admin-approved LearnedCircle Library resource.",
    action: resource.action_label || (resource.file_url ? "Open document" : "Open material"),
    url: resource.file_url || resource.resource_url || "#"
  };
}

function itemMatches(item, query, area) {
  const haystack = `${item.title} ${item.area} ${item.type} ${item.source} ${item.summary}`.toLowerCase();
  return (!area || item.area === area) && (!query || haystack.includes(query));
}

function cardTemplate(item) {
  const external = item.url.startsWith("http");
  return `
    <article class="library-result-card">
      <div>
        <span class="status">${item.type}</span>
        <h3>${item.title}</h3>
        <p>${item.summary}</p>
      </div>
      <div class="library-meta">
        <span>${item.area}</span>
        <span>${item.source}</span>
      </div>
      <a href="${item.url}" ${external ? 'target="_blank" rel="noopener noreferrer"' : ""}>${item.action}</a>
    </article>
  `;
}

function renderLibrary() {
  const query = queryInput.value.trim().toLowerCase();
  const area = areaSelect.value;
  const filtered = libraryItems.filter((item) => itemMatches(item, query, area));

  Object.entries(containers).forEach(([group, container]) => {
    const groupItems = filtered.filter((item) => item.group === group);
    container.innerHTML = groupItems.length
      ? groupItems.map(cardTemplate).join("")
      : `<article class="library-empty">No ${group === "books" ? "online books or guides" : group} matched this search yet.</article>`;
  });

  countNode.textContent = `Showing ${filtered.length} ${filtered.length === 1 ? "material" : "materials"}`;
}

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-library-page-query]")) renderLibrary();
});

document.addEventListener("change", (event) => {
  if (event.target.matches("[data-library-page-area]")) renderLibrary();
});

renderLibrary();

async function loadLiveLibraryResources() {
  try {
    const response = await fetch("/api/public-data");
    const result = await response.json();
    if (!result.ok || !Array.isArray(result.libraryResources)) return;

    const existingKeys = new Set(libraryItems.map((item) => `${item.title}|${item.url}`.toLowerCase()));
    result.libraryResources.map(normalizePublicLibraryResource).forEach((item) => {
      const key = `${item.title}|${item.url}`.toLowerCase();
      if (!existingKeys.has(key)) {
        libraryItems.unshift(item);
        existingKeys.add(key);
      }
    });
    populateAreas();
    renderLibrary();
  } catch (error) {
    // Keep the static Library usable while backend publishing is being connected.
  }
}

loadLiveLibraryResources();
