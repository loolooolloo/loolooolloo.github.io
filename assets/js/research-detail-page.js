const RESEARCH_DETAIL_DATA_PATH =
  window.RESEARCH_DETAIL_DATA_PATH || "/data/research.json";

const RESEARCH_PUBLICATIONS_DATA_PATH =
  window.RESEARCH_PUBLICATIONS_DATA_PATH || "/data/publications.json";

const RESEARCH_DETAIL_SITE_BASE_URL =
  window.RESEARCH_DETAIL_SITE_BASE_URL || "/";

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
  const base = RESEARCH_DETAIL_SITE_BASE_URL.endsWith("/")
    ? RESEARCH_DETAIL_SITE_BASE_URL
    : `${RESEARCH_DETAIL_SITE_BASE_URL}/`;

  return `${base}${String(path).replace(/^\/+/, "")}`;
}

function parseOptionalInteger(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function getPublicationTimestamp(publication) {
  const year = parseOptionalInteger(publication.year);
  const month = parseOptionalInteger(publication.month);
  const day = parseOptionalInteger(publication.day);

  if (year === null) {
    return 0;
  }

  return new Date(
    year,
    month === null ? 0 : month - 1,
    day === null ? 1 : day
  ).getTime();
}

function comparePublicationsByDate(a, b) {
  return getPublicationTimestamp(b) - getPublicationTimestamp(a);
}

function createContentMarkup(content) {
  if (Array.isArray(content)) {
    return content
      .filter(paragraph => String(paragraph).trim() !== "")
      .map(paragraph => `<p>${escapeHtml(paragraph)}</p>`)
      .join("");
  }

  return String(content || "")
    .split(/\r?\n+/)
    .filter(paragraph => paragraph.trim() !== "")
    .map(paragraph => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
}

function createPublicationMarkup(publication) {
  const venue = publication.venue
    ? `, ${escapeHtml(publication.venue)}`
    : "";

  const links = [
    publication.doi
      ? `<a href="${escapeHtml(publication.doi)}" target="_blank" rel="noopener noreferrer">DOI</a>`
      : "",
    publication.pdf
      ? `<a href="${escapeHtml(publication.pdf)}" target="_blank" rel="noopener noreferrer">PDF</a>`
      : "",
    publication.code
      ? `<a href="${escapeHtml(publication.code)}" target="_blank" rel="noopener noreferrer">Code</a>`
      : ""
  ].filter(Boolean).join("");

  return `
    <li class="publication-item">
      <div class="publication-type">${escapeHtml(publication.year || "")}</div>
      <div>
        <p class="item-title">
          "${escapeHtml(publication.title)}"${venue}.
        </p>
        <p class="item-description">${escapeHtml(publication.authors || "")}</p>
        ${publication.status ? `<p class="item-description">${escapeHtml(publication.status)}</p>` : ""}
        ${links ? `<div class="publication-links">${links}</div>` : ""}
      </div>
    </li>
  `;
}

function renderResearchDetail(topic, publications) {
  document.title = `${topic.name} · ${document.title.split(" · ").pop()}`;

  document.getElementById("research-detail-title").textContent = topic.name;
  document.getElementById("research-detail-description").textContent =
    topic.description || "";

  const imageWrap = document.getElementById("research-detail-image-wrap");
  const image = document.getElementById("research-detail-image");

  if (topic.detailImage || topic.image) {
    image.src = resolveSiteUrl(topic.detailImage || topic.image);
    image.alt = topic.imageAlt || topic.name;
    imageWrap.hidden = false;
  } else {
    imageWrap.hidden = true;
  }

  const content = document.getElementById("research-detail-content");
  content.innerHTML = createContentMarkup(topic.content);

  const relatedPublicationIds = Array.isArray(topic.relatedPublicationIds)
    ? topic.relatedPublicationIds
    : [];

  const relatedPublications = relatedPublicationIds
    .map(id => publications.find(publication => publication.id === id))
    .filter(Boolean)
    .sort(comparePublicationsByDate);

  const relatedSection = document.getElementById("related-publications-section");
  const relatedList = document.getElementById("related-publications-list");

  if (!relatedPublications.length) {
    relatedSection.hidden = true;
    relatedList.innerHTML = "";
    return;
  }

  relatedSection.hidden = false;
  relatedList.innerHTML = relatedPublications
    .map(createPublicationMarkup)
    .join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  const topicId = window.RESEARCH_TOPIC_ID;

  if (!topicId) {
    return;
  }

  try {
    const [topics, publications] = await Promise.all([
      loadJson(RESEARCH_DETAIL_DATA_PATH),
      loadJson(RESEARCH_PUBLICATIONS_DATA_PATH)
    ]);

    const topic = topics.find(item => item.id === topicId);

    if (!topic) {
      throw new Error(`Research topic not found: ${topicId}`);
    }

    renderResearchDetail(topic, publications);
  } catch (error) {
    console.error(error);
  }
});
