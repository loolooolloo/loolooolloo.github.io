const PERSON_DATA_PATH =
  window.PERSON_DATA_PATH || "/data/people.json";

const PERSON_PUBLICATIONS_DATA_PATH =
  window.PERSON_PUBLICATIONS_DATA_PATH || "/data/publications.json";

const PERSON_SITE_BASE_URL =
  window.PERSON_SITE_BASE_URL || "/";

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
  const base = PERSON_SITE_BASE_URL.endsWith("/")
    ? PERSON_SITE_BASE_URL
    : `${PERSON_SITE_BASE_URL}/`;

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

function createParagraphs(content) {
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

function createTimeline(items = []) {
  return items
    .map(item => `
      <li class="timeline-item">
        <div class="timeline-period">${escapeHtml(item.period || "")}</div>
        <div>
          <p class="item-title">${escapeHtml(item.title || "")}</p>
          <p class="item-description">${escapeHtml(item.institution || "")}</p>
        </div>
      </li>
    `)
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
        <p class="item-title">"${escapeHtml(publication.title || "")}"${venue}.</p>
        <p class="item-description">${escapeHtml(publication.authors || "")}</p>
        ${links ? `<div class="publication-links">${links}</div>` : ""}
      </div>
    </li>
  `;
}

function renderPerson(person, publications) {
  document.title = `${person.name} · ${document.title.split(" · ").pop()}`;

  document.getElementById("person-detail-name").textContent = person.name;
  document.getElementById("person-detail-role").textContent = person.role || "";
  document.getElementById("person-detail-research").textContent = person.research || "";

  const photo = document.getElementById("person-detail-photo");
  const photoFrame = document.getElementById("person-detail-photo-frame");
  if (person.photo) {
    photo.src = resolveSiteUrl(person.photo);
    photo.alt = `${person.name} portrait`;
    photoFrame.hidden = false;
  } else {
    photoFrame.hidden = true;
  }

  const links = document.getElementById("person-detail-links");
  const linkItems = [
    person.email
      ? `<a class="text-link" href="mailto:${escapeHtml(person.email)}">${escapeHtml(person.email)}</a>`
      : "",
    person.homepage
      ? `<a class="text-link" href="${escapeHtml(person.homepage)}" target="_blank" rel="noopener noreferrer">Homepage</a>`
      : ""
  ].filter(Boolean);

  links.innerHTML = linkItems.join("");
  links.hidden = linkItems.length === 0;

  document.getElementById("person-detail-content").innerHTML =
    createParagraphs(person.content);

  const educationSection = document.getElementById("person-education-section");
  const educationList = document.getElementById("person-education-list");
  const education = Array.isArray(person.education) ? person.education : [];
  educationSection.hidden = education.length === 0;
  educationList.innerHTML = createTimeline(education);

  const experienceSection = document.getElementById("person-experience-section");
  const experienceList = document.getElementById("person-experience-list");
  const experience = Array.isArray(person.experience) ? person.experience : [];
  experienceSection.hidden = experience.length === 0;
  experienceList.innerHTML = createTimeline(experience);

  const selectedPublicationIds = Array.isArray(person.selectedPublicationIds)
    ? person.selectedPublicationIds
    : [];

  const selectedPublications = selectedPublicationIds
    .map(id => publications.find(publication => publication.id === id))
    .filter(Boolean)
    .sort(comparePublicationsByDate);

  const publicationsSection = document.getElementById("person-publications-section");
  const publicationsList = document.getElementById("person-publications-list");

  publicationsSection.hidden = selectedPublications.length === 0;
  publicationsList.innerHTML = selectedPublications
    .map(createPublicationMarkup)
    .join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  const personId = window.PERSON_ID;

  if (!personId) {
    return;
  }

  try {
    const [people, publications] = await Promise.all([
      loadJson(PERSON_DATA_PATH),
      loadJson(PERSON_PUBLICATIONS_DATA_PATH)
    ]);

    const person = people.find(item => item.id === personId);

    if (!person) {
      throw new Error(`Person not found: ${personId}`);
    }

    renderPerson(person, publications);
  } catch (error) {
    console.error(error);
  }
});
