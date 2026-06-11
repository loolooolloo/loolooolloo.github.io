const PUBLICATIONS_DATA_PATH = "data/publications.json";

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

function getPublicationTimestamp(publication) {
  const year = parseOptionalInteger(publication.year);
  const month = parseOptionalInteger(publication.month);
  const day = parseOptionalInteger(publication.day);

  /*
   * year가 없으면 날짜 정보를 알 수 없는 항목으로 처리합니다.
   * 최신순 정렬에서 뒤로 배치됩니다.
   */
  if (year === null) {
    return 0;
  }

  /*
   * month 또는 day가 없을 때의 기본값:
   * - month 없음: 1월
   * - day 없음: 1일
   *
   * JavaScript Date의 month는 0부터 시작하므로 1을 뺍니다.
   */
  const normalizedMonth = month === null ? 1 : month;
  const normalizedDay = day === null ? 1 : day;

  return new Date(
    year,
    normalizedMonth - 1,
    normalizedDay
  ).getTime();
}

function parseOptionalInteger(value) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const parsedValue = Number.parseInt(value, 10);

  return Number.isNaN(parsedValue)
    ? null
    : parsedValue;
}

function compareByDateDescending(a, b) {
  return getPublicationTimestamp(b) - getPublicationTimestamp(a);
}


function compareByDateDescending(a, b) {
  return getPublicationTimestamp(b) - getPublicationTimestamp(a);
}

function createPublicationMarkup(publication) {
  const links = [
    publication.doi
      ? `<a href="${escapeHtml(publication.doi)}"
            target="_blank"
            rel="noopener noreferrer">DOI</a>`
      : "",
    publication.pdf
      ? `<a href="${escapeHtml(publication.pdf)}"
            target="_blank"
            rel="noopener noreferrer">PDF</a>`
      : "",
    publication.code
      ? `<a href="${escapeHtml(publication.code)}"
            target="_blank"
            rel="noopener noreferrer">Code</a>`
      : ""
  ].filter(Boolean).join("");

  const yearLabel = publication.year
    ? escapeHtml(publication.year)
    : "";

  const venue = publication.venue
    ? `, ${escapeHtml(publication.venue)}`
    : "";

  const volume = publication.volume
    ? `, vol. ${escapeHtml(publication.volume)}`
    : "";

  const number = publication.number
    ? `, no. ${escapeHtml(publication.number)}`
    : "";

  const pages = publication.pages
    ? `, pp. ${escapeHtml(publication.pages)}`
    : "";

  const status = publication.status
    ? `<p class="item-description">${escapeHtml(publication.status)}</p>`
    : "";

  return `
    <li class="publication-item">
      <div class="publication-type">${yearLabel}</div>

      <div>
        <p class="item-title">
          “${escapeHtml(publication.title)}”${venue}${volume}${number}${pages}.
        </p>

        <p class="item-description">
          ${escapeHtml(publication.authors || "")}
        </p>

        ${status}

        ${links
          ? `<div class="publication-links">${links}</div>`
          : ""}
      </div>
    </li>
  `;
}

function renderPublicationList(containerId, publications, emptyMessage) {
  const container = document.getElementById(containerId);

  if (!container) {
    return;
  }

  if (publications.length === 0) {
    container.innerHTML = `
      <li class="empty-message">${escapeHtml(emptyMessage)}</li>
    `;
    return;
  }

  container.innerHTML = publications
    .sort(compareByDateDescending)
    .map(createPublicationMarkup)
    .join("");
}

function renderPublications(publications) {
  const journals = publications.filter(
    publication => publication.type === "journal"
  );

  const internationalJournals = journals.filter(
    publication => publication.scope === "international"
  );

  const domesticJournals = journals.filter(
    publication => publication.scope === "domestic"
  );

  const conferences = publications.filter(
    publication => publication.type === "conference"
  );

  const internationalConferences = conferences.filter(
    publication => publication.scope === "international"
  );

  const domesticConferences = conferences.filter(
    publication => publication.scope === "domestic"
  );

  const patents = publications.filter(
    publication => publication.type === "patent"
  );

  renderPublicationList(
    "international-journal-list",
    internationalJournals,
    "No international journal papers."
  );

  renderPublicationList(
    "domestic-journal-list",
    domesticJournals,
    "No domestic journal papers."
  );

  renderPublicationList(
    "international-conference-list",
    internationalConferences,
    "No international conference papers."
  );

  renderPublicationList(
    "domestic-conference-list",
    domesticConferences,
    "No domestic conference papers."
  );

  renderPublicationList(
    "patent-list",
    patents,
    "No patents."
  );
}

function initializeMobileNavigation() {
  const menuToggle = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".navigation");

  if (!menuToggle || !navigation) {
    return;
  }

  menuToggle.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 920) {
        navigation.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  });
}

async function initializePublicationsPage() {
  try {
    const publications = await loadJson(PUBLICATIONS_DATA_PATH);
    renderPublications(publications);
  } catch (error) {
    console.error(error);

    [
      "international-journal-list",
      "domestic-journal-list",
      "international-conference-list",
      "domestic-conference-list",
      "patent-list"
    ].forEach(containerId => {
      const container = document.getElementById(containerId);

      if (container) {
        container.innerHTML = `
          <li class="empty-message">
            Publication data could not be loaded.
          </li>
        `;
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initializeMobileNavigation();
  initializePublicationsPage();
});
