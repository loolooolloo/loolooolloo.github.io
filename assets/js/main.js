const HOME_NEWS_LIMIT = 3;
const HOME_RECENT_PUBLICATION_LIMIT = 5;

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
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isNaN(parsed)
    ? null
    : parsed;
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

function comparePublicationsByDate(a, b) {
  return getPublicationTimestamp(b) - getPublicationTimestamp(a);
}

function getNewsSummary(item) {
  if (Array.isArray(item.content) && item.content.length > 0) {
    return item.content[0];
  }

  if (typeof item.content === "string") {
    return item.content;
  }

  return item.description || "";
}

function getNewsTimestamp(item) {
  const parsed = Date.parse(`${item.date || ""}T00:00:00`);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
}

function getNewsDateLabel(item) {
  if (!item.date) {
    return "";
  }

  return String(item.date).replaceAll("-", ".");
}


function renderNews(news) {
  const container = document.getElementById("news-list");

  const recentNews = [...news]
    .sort((a, b) => {
      return getNewsTimestamp(b) - getNewsTimestamp(a);
    })
    .slice(0, HOME_NEWS_LIMIT);

  container.innerHTML = recentNews
    .map(item => `
      <li class="news-item">
        <div class="item-date">
          ${escapeHtml(getNewsDateLabel(item))}
        </div>

        <div>
          <p class="item-title">
            ${escapeHtml(item.title)}
          </p>
        </div>
      </li>
    `)
    .join("");
}

function personCard(person) {
  const researchItems = getResearchItems(
    person.research
  );

  return `
    <a class="person-card clickable-card" href="${escapeHtml(person.detailPage)}">
      <div class="person-photo-frame">
        <img class="person-photo" src="${escapeHtml(person.photo)}"
             alt="${escapeHtml(person.name)} portrait" />
      </div>
      <div class="person-info">
        <h3>${escapeHtml(person.name)}</h3>
        <p class="person-role">${escapeHtml(person.role)}</p>
        ${researchItems.length ? `
          <div class="research-interest">
            <p class="research-interest-title">Research Interests</p>
            <ul>
              ${researchItems.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </div>
        ` : ""}
      </div>
    </a>
  `;
}

function getResearchItems(research) {
  if (Array.isArray(research)) {
    return research
      .map(item => String(item).trim())
      .filter(Boolean);
  }

  return String(research || "")
    .replace(/^research interests?:\s*/i, "")
    .replace(/\.$/, "")
    .split(/\s*,\s*|\s+and\s+/i)
    .map(item => item.trim())
    .filter(Boolean);
}

function renderPeople(people) {
  const visibleProfessors = people
    .filter(p => p.category === "professor" && p.showOnHome !== false);

  const visibleStudents = people
    .filter(p => p.category === "student" && p.showOnHome !== false);

  const professorSection = document.getElementById("professor");
  const studentSection = document.getElementById("students");
  const professorGrid = document.getElementById("professor-grid");
  const studentGrid = document.getElementById("student-grid");
  const studentsNavItem = document.getElementById("students-nav-item");

  professorSection.hidden = visibleProfessors.length === 0;
  studentSection.hidden = visibleStudents.length === 0;

  if (studentsNavItem) {
    studentsNavItem.hidden = visibleStudents.length === 0;
  }

  professorGrid.innerHTML = visibleProfessors
    .map(personCard).join("");

  studentGrid.innerHTML = visibleStudents
    .map(personCard).join("");
}

function renderResearch(areas) {
  const visibleResearch = areas
    .filter(a => a.showOnHome !== false);

  const researchSection = document.getElementById("research");
  const researchGrid = document.getElementById("research-grid");
  const researchNavItem = document.getElementById("research-nav-item");

  researchSection.hidden = visibleResearch.length === 0;

  if (researchNavItem) {
    researchNavItem.hidden = visibleResearch.length === 0;
  }

  researchGrid.innerHTML = visibleResearch
    .map(a => {
      const keywords = Array.isArray(a.keywords)
        ? a.keywords.slice(0, 4)
        : [];

      return `
        <a class="card research-home-card clickable-card" href="research/#${escapeHtml(a.id)}">
          <p class="research-card-kicker">${escapeHtml(a.titleKo || "Research Area")}</p>
          <h3>${escapeHtml(a.titleEn || a.name)}</h3>
          <p>${escapeHtml(a.description)}</p>
          ${keywords.length ? `
            <div class="research-keyword-list">
              ${keywords.map(keyword => `<span>${escapeHtml(keyword)}</span>`).join("")}
            </div>
          ` : ""}
          <span class="research-topic-link">View details →</span>
        </a>
      `;
    }).join("");
}

function publicationMarkup(item) {
  const links = [
    item.doi ? `<a href="${escapeHtml(item.doi)}" target="_blank" rel="noopener noreferrer">DOI</a>` : "",
    item.pdf ? `<a href="${escapeHtml(item.pdf)}" target="_blank" rel="noopener noreferrer">PDF</a>` : "",
    item.code ? `<a href="${escapeHtml(item.code)}" target="_blank" rel="noopener noreferrer">Code</a>` : ""
  ].filter(Boolean).join("");

  return `
    <li class="publication-item">
      <div class="publication-type">${escapeHtml(item.year || "")}</div>
      <div>
        <p class="item-title">“${escapeHtml(item.title)},” ${escapeHtml(item.venue || "")}</p>
        <p class="item-description">${escapeHtml(item.authors || "")}</p>
        ${links ? `<div class="publication-links">${links}</div>` : ""}
      </div>
    </li>
  `;
}

function renderPublications(publications) {
  const selected = publications.filter(item => item.showOnHome === true);
  const hasSelected = selected.length > 0;

  const homeItems = (hasSelected ? [...selected] : [...publications])
    .sort(comparePublicationsByDate)
    .slice(0, hasSelected ? selected.length : HOME_RECENT_PUBLICATION_LIMIT);

  const groups = {
    journal: {
      group: document.getElementById("journal-group"),
      list: document.getElementById("journal-list")
    },
    conference: {
      group: document.getElementById("conference-group"),
      list: document.getElementById("conference-list")
    },
    patent: {
      group: document.getElementById("patent-group"),
      list: document.getElementById("patent-list")
    }
  };

  Object.entries(groups).forEach(([type, elements]) => {
    const items = homeItems.filter(item => item.type === type);

    if (!items.length) {
      elements.group.hidden = true;
      elements.list.innerHTML = "";
      return;
    }

    elements.group.hidden = false;
    elements.list.innerHTML = items.map(publicationMarkup).join("");
  });

  document.getElementById("publications-heading").textContent =
    "Publications";

  document.getElementById("publications-description").textContent =
    hasSelected
      ? "Selected journal papers, conference papers, and patents."
      : `The ${Math.min(HOME_RECENT_PUBLICATION_LIMIT, publications.length)} most recent publications.`;
}

function renderLectures(lectures) {
  document.getElementById("lecture-list").innerHTML = lectures
    .filter(l => l.showOnHome !== false)
    .map(l => `
      <li class="lecture-list-item">
        <div class="lecture-period">${escapeHtml(l.period || "")}</div>
        <div class="lecture-name">${escapeHtml(l.name || "")}</div>
      </li>
    `).join("");
}

async function initializeHome() {
  try {
    const [news, people, research, publications, lectures] = await Promise.all([
      loadJson("data/news.json"),
      loadJson("data/people.json"),
      loadJson("data/research.json"),
      loadJson("data/publications.json"),
      loadJson("data/lectures.json")
    ]);

    renderNews(news);
    renderPeople(people);
    renderResearch(research);
    renderPublications(publications);
    renderLectures(lectures);
  } catch (error) {
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", initializeHome);
