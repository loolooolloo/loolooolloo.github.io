const NEWS_DATA_PATH =
  window.NEWS_DATA_PATH || "/data/news.json";

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

function getNewsTimestamp(item) {
  const parsed = Date.parse(`${item.date || ""}T00:00:00`);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
}

function compareNewsByDateDescending(a, b) {
  return getNewsTimestamp(b) - getNewsTimestamp(a);
}

function getDateLabel(item) {
  if (!item.date) {
    return "";
  }

  return String(item.date).replaceAll("-", ".");
}

function resolveSiteUrl(path = "") {
  const base = SITE_BASE_URL.endsWith("/")
    ? SITE_BASE_URL
    : `${SITE_BASE_URL}/`;

  return `${base}${String(path).replace(/^\/+/, "")}`;
}

function getContentParagraphs(content) {
  if (Array.isArray(content)) {
    return content
      .filter(paragraph => String(paragraph).trim() !== "")
      .map(paragraph => `
        <p>${escapeHtml(paragraph)}</p>
      `)
      .join("");
  }

  return String(content || "")
    .split(/\r?\n+/)
    .filter(paragraph => paragraph.trim() !== "")
    .map(paragraph => `
      <p>${escapeHtml(paragraph)}</p>
    `)
    .join("");
}

function createNewsAccordion(item, index) {
  const panelId = `news-panel-${index}`;
  const buttonId = `news-button-${index}`;

  const imageMarkup = item.image
    ? `
      <div class="news-detail-image-wrap">
        <img
          class="news-detail-image"
          src="${escapeHtml(resolveSiteUrl(item.image))}"
          alt="${escapeHtml(item.imageAlt || item.title)}"
        />
      </div>
    `
    : "";

  return `
    <article class="news-accordion-item">
      <button
        id="${buttonId}"
        class="news-accordion-button"
        type="button"
        aria-expanded="false"
        aria-controls="${panelId}"
      >
        <span class="news-accordion-date">
          ${escapeHtml(getDateLabel(item))}
        </span>

        <span class="news-accordion-title">
          ${escapeHtml(item.title)}
        </span>

        <span
          class="news-accordion-icon"
          aria-hidden="true"
        >
          ＋
        </span>
      </button>

      <div
        id="${panelId}"
        class="news-accordion-panel"
        role="region"
        aria-labelledby="${buttonId}"
        hidden
      >
        ${imageMarkup}

        <div class="news-accordion-content">
          ${getContentParagraphs(item.content)}
        </div>
      </div>
    </article>
  `;
}

function toggleNewsItem(button) {
  const panelId = button.getAttribute("aria-controls");
  const panel = document.getElementById(panelId);

  if (!panel) {
    return;
  }

  const isOpen = button.getAttribute("aria-expanded") === "true";

  button.setAttribute("aria-expanded", String(!isOpen));
  panel.hidden = isOpen;

  const icon = button.querySelector(".news-accordion-icon");

  if (icon) {
    icon.textContent = isOpen ? "＋" : "−";
  }
}

function initializeAccordionEvents() {
  document
    .querySelectorAll(".news-accordion-button")
    .forEach(button => {
      button.addEventListener("click", () => {
        toggleNewsItem(button);
      });
    });

  document
    .querySelectorAll(".news-accordion-panel")
    .forEach(panel => {
      panel.addEventListener("click", () => {
        const buttonId = panel.getAttribute("aria-labelledby");
        const button = document.getElementById(buttonId);

        if (button) {
          toggleNewsItem(button);
        }
      });
    });
}

document.addEventListener("DOMContentLoaded", async () => {
  const container =
    document.getElementById("news-list-page");

  try {
    const news = await loadJson(NEWS_DATA_PATH);

    const sorted = [...news]
      .sort(compareNewsByDateDescending);

    container.innerHTML = sorted
      .map((item, index) => createNewsAccordion(item, index))
      .join("");

    initializeAccordionEvents();
  } catch (error) {
    console.error(error);

    container.innerHTML = `
      <p class="empty-message">
        News information could not be loaded.
      </p>
    `;
  }
});
