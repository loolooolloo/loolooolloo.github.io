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

function parseOptionalInteger(value) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function getNewsTimestamp(item) {
  const year = parseOptionalInteger(item.year);
  const month = parseOptionalInteger(item.month);
  const day = parseOptionalInteger(item.day);

  if (year === null) {
    return 0;
  }

  return new Date(
    year,
    month === null ? 0 : month - 1,
    day === null ? 1 : day
  ).getTime();
}

function compareNewsByDateDescending(a, b) {
  return getNewsTimestamp(b) - getNewsTimestamp(a);
}

function getMonthKey(item) {
  const year = parseOptionalInteger(item.year);
  const month = parseOptionalInteger(item.month);

  if (year === null) {
    return "undated";
  }

  return `${year}-${String(month === null ? 1 : month).padStart(2, "0")}`;
}

function getMonthLabel(item) {
  const year = parseOptionalInteger(item.year);
  const month = parseOptionalInteger(item.month);

  if (year === null) {
    return "Undated";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long"
  }).format(
    new Date(year, month === null ? 0 : month - 1, 1)
  );
}

function getDateLabel(item) {
  const year = parseOptionalInteger(item.year);
  const month = parseOptionalInteger(item.month);
  const day = parseOptionalInteger(item.day);

  if (year === null) {
    return "";
  }

  const parts = [String(year)];

  if (month !== null) {
    parts.push(String(month).padStart(2, "0"));
  }

  if (day !== null) {
    parts.push(String(day).padStart(2, "0"));
  }

  return parts.join(".");
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
    document.getElementById("news-month-groups");

  try {
    const news = await loadJson(NEWS_DATA_PATH);

    const sorted = [...news]
      .sort(compareNewsByDateDescending);

    const groups = new Map();

    sorted.forEach(item => {
      const key = getMonthKey(item);

      if (!groups.has(key)) {
        groups.set(key, {
          label: getMonthLabel(item),
          items: []
        });
      }

      groups.get(key).items.push(item);
    });

    let itemIndex = 0;

    container.innerHTML = Array
      .from(groups.values())
      .map(group => {
        const itemsMarkup = group.items
          .map(item => {
            const markup =
              createNewsAccordion(item, itemIndex);

            itemIndex += 1;
            return markup;
          })
          .join("");

        return `
          <section class="news-month-group">
            <div class="news-month-heading">
              <h2>${escapeHtml(group.label)}</h2>
            </div>

            <div class="news-month-list">
              ${itemsMarkup}
            </div>
          </section>
        `;
      })
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
