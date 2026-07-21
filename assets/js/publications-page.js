const PUBLICATIONS_DATA_PATH = "/data/publications.json";

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
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

function parseOptionalInteger(value) {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function getPublicationTimestamp(publication) {
  const year = parseOptionalInteger(publication.year);
  const month = parseOptionalInteger(publication.month);
  const day = parseOptionalInteger(publication.day);

  if (year === null) return 0;

  return new Date(
    year,
    month === null ? 0 : month - 1,
    day === null ? 1 : day
  ).getTime();
}

function compareByDateDescending(a, b) {
  return getPublicationTimestamp(b) - getPublicationTimestamp(a);
}

function createPublicationMarkup(publication) {
  const venue = publication.venue ? `, ${escapeHtml(publication.venue)}` : "";
  const volume = publication.volume ? `, vol. ${escapeHtml(publication.volume)}` : "";
  const number = publication.number ? `, no. ${escapeHtml(publication.number)}` : "";
  const pages = publication.pages ? `, pp. ${escapeHtml(publication.pages)}` : "";

  const links = [
    publication.doi ? `<a href="${escapeHtml(publication.doi)}" target="_blank" rel="noopener noreferrer">DOI</a>` : "",
    publication.pdf ? `<a href="${escapeHtml(publication.pdf)}" target="_blank" rel="noopener noreferrer">PDF</a>` : "",
    publication.code ? `<a href="${escapeHtml(publication.code)}" target="_blank" rel="noopener noreferrer">Code</a>` : ""
  ].filter(Boolean).join("");

  return `
    <li class="publication-item">
      <div class="publication-type">${escapeHtml(publication.year || "")}</div>
      <div>
        <p class="item-title">
          “${escapeHtml(publication.title)}”${venue}${volume}${number}${pages}.
        </p>
        <p class="item-description">${escapeHtml(publication.authors || "")}</p>
        ${publication.status ? `<p class="item-description">${escapeHtml(publication.status)}</p>` : ""}
        ${links ? `<div class="publication-links">${links}</div>` : ""}
      </div>
    </li>
  `;
}

function renderList(containerId, items, emptyText) {
  const container = document.getElementById(containerId);
  const sorted = [...items].sort(compareByDateDescending);

  container.innerHTML = sorted.length
    ? sorted.map(createPublicationMarkup).join("")
    : `<li class="empty-message">${escapeHtml(emptyText)}</li>`;
}

function renderPublications(publications) {
  renderList(
    "international-journal-list",
    publications.filter(p => p.type === "journal" && p.scope === "international"),
    "No international journal papers."
  );

  renderList(
    "domestic-journal-list",
    publications.filter(p => p.type === "journal" && p.scope === "domestic"),
    "No domestic journal papers."
  );

  renderList(
    "international-conference-list",
    publications.filter(p => p.type === "conference" && p.scope === "international"),
    "No international conference papers."
  );

  renderList(
    "domestic-conference-list",
    publications.filter(p => p.type === "conference" && p.scope === "domestic"),
    "No domestic conference papers."
  );

  renderList(
    "patent-list",
    publications.filter(p => p.type === "patent"),
    "No patents."
  );
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    renderPublications(await loadJson(PUBLICATIONS_DATA_PATH));
  } catch (error) {
    console.error(error);
  }
});
