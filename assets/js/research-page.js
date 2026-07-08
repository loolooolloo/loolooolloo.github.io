const RESEARCH_DATA_PATH =
  window.RESEARCH_DATA_PATH || "/data/research.json";

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

function createResearchCard(item) {
  const image = item.image
    ? `
      <img
        class="research-card-image"
        src="${escapeHtml(resolveSiteUrl(item.image))}"
        alt="${escapeHtml(item.name)}"
      />
    `
    : `
      <div
        class="research-card-image research-card-placeholder"
        aria-hidden="true"
      ></div>
    `;

  return `
    <a
      class="research-topic-card clickable-card"
      href="${escapeHtml(resolveSiteUrl(item.detailPage))}"
    >
      ${image}

      <div class="research-topic-content">
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.description || "")}</p>
        <span class="research-topic-link">View details →</span>
      </div>
    </a>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("all-research-grid");

  try {
    const items = await loadJson(RESEARCH_DATA_PATH);
    const visible = items.filter(
      item => item.showOnResearchPage !== false
    );

    container.innerHTML = visible.length
      ? visible.map(createResearchCard).join("")
      : `<p class="empty-message">No research areas are currently available.</p>`;
  } catch (error) {
    console.error(error);
    container.innerHTML =
      `<p class="empty-message">Research information could not be loaded.</p>`;
  }
});
