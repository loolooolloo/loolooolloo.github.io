const RESEARCH_DATA_PATH =
  window.RESEARCH_DATA_PATH || "/data/research.json";

const PUBLICATIONS_DATA_PATH =
  window.PUBLICATIONS_DATA_PATH || "/data/publications.json";

const SITE_BASE_URL =
  window.SITE_BASE_URL || "/";

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  return response.json();
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resolveSiteUrl(path = "") {
  const base = SITE_BASE_URL.endsWith("/")
    ? SITE_BASE_URL
    : `${SITE_BASE_URL}/`;

  return `${base}${String(path).replace(/^\/+/, "")}`;
}

function publicationMarkup(item) {
  const links = [
    item.doi ? `<a href="${escapeHtml(item.doi)}" target="_blank" rel="noopener noreferrer">DOI</a>` : "",
    item.pdf ? `<a href="${escapeHtml(item.pdf)}" target="_blank" rel="noopener noreferrer">PDF</a>` : "",
    item.code ? `<a href="${escapeHtml(item.code)}" target="_blank" rel="noopener noreferrer">Code</a>` : ""
  ].filter(Boolean).join("");

  return `
    <li class="publication-item research-publication-item">
      <div class="publication-type">${escapeHtml(item.year || "")}</div>
      <div>
        <p class="item-title">“${escapeHtml(item.title)},” ${escapeHtml(item.venue || "")}</p>
        <p class="item-description">${escapeHtml(item.authors || "")}</p>
        ${links ? `<div class="publication-links">${links}</div>` : ""}
      </div>
    </li>
  `;
}

function findRelatedPublications(area, publications) {
  const explicitIds = Array.isArray(area.relatedPublicationIds)
    ? area.relatedPublicationIds
    : [];

  if (explicitIds.length > 0) {
    return explicitIds
      .map(id => publications.find(item => item.id === id))
      .filter(Boolean);
  }

  return publications.filter(item => {
    return Array.isArray(item.researchAreas) &&
      item.researchAreas.includes(area.id);
  });
}

function researchAreaMarkup(area, publications) {
  const content = Array.isArray(area.content) && area.content.length > 0
    ? area.content
    : [area.summary || area.description || ""];

  const topics = Array.isArray(area.topics) ? area.topics : [];
  const related = findRelatedPublications(area, publications);
  const shouldShowVisual = area.showVisual === true;
  const visualClass = area.id ? `research-visual-${area.id}` : "";
  const visual = shouldShowVisual && area.overviewImage
    ? `
      <div class="research-visual research-visual-image">
        <img
          src="${escapeHtml(resolveSiteUrl(area.overviewImage))}"
          alt="${escapeHtml(area.overviewImageAlt || `${area.titleEn || area.name} research overview`)}"
        />
      </div>
    `
    : shouldShowVisual ? `
      <div class="research-visual ${escapeHtml(visualClass)}" aria-hidden="true">
        <span>${escapeHtml(area.titleEn || area.name)} image placeholder</span>
      </div>
    ` : "";

  return `
    <article class="research-area-section" id="${escapeHtml(area.id)}">
      <header class="research-area-header">
        <h2>${escapeHtml(area.titleEn || area.name)}</h2>
        <h3>${escapeHtml(area.titleKo || "Research Area")}</h3>
      </header>

      ${visual}

      <div class="research-area-description">
        ${content.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join("")}
      </div>

      ${topics.length ? `
        <div class="research-topic-list-wrap">
          <h4>Detailed Topics</h4>
          <ul class="research-topic-list">
            ${topics.map(topic => `<li>${escapeHtml(topic)}</li>`).join("")}
          </ul>
        </div>
      ` : ""}

      <details class="research-publications">
        <summary>Selected Publications (${related.length})</summary>
        ${related.length
          ? `<ul class="publication-list">${related.map(publicationMarkup).join("")}</ul>`
          : `<p class="empty-message">Selected publications will be added here.</p>`}
      </details>
    </article>
  `;
}

function scrollToCurrentResearchAnchor() {
  const hash = window.location.hash;

  if (!hash) {
    return;
  }

  const target = document.getElementById(
    decodeURIComponent(hash.slice(1))
  );

  if (!target) {
    return;
  }

  requestAnimationFrame(() => {
    target.scrollIntoView({
      block: "start"
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("research-area-list");

  try {
    const [areas, publications] = await Promise.all([
      loadJson(RESEARCH_DATA_PATH),
      loadJson(PUBLICATIONS_DATA_PATH)
    ]);

    const visible = areas.filter(
      item => item.showOnResearchPage !== false
    );

    container.innerHTML = visible.length
      ? visible.map(area => researchAreaMarkup(area, publications)).join("")
      : `<p class="empty-message">No research areas are currently available.</p>`;

    scrollToCurrentResearchAnchor();
  } catch (error) {
    console.error(error);
    container.innerHTML =
      `<p class="empty-message">Research information could not be loaded.</p>`;
  }
});
