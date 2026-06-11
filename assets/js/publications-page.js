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
  if (publication.date) {
    const timestamp = new Date(publication.date).getTime();

    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }

  if (publication.year) {
    return new Date(`${publication.year}-01-01`).getTime();
  }

  return 0;
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
    publication => publication.journalScope === "international"
  );

  const domesticJournals = journals.filter(
    publication => publication.journalScope === "domestic"
  );

  const conferencePapers = publications.filter(
    publication => publication.type === "conference"
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
    "conference-list",
    conferencePapers,
    "No conference papers."
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
      "conference-list",
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
