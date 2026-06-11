const HOME_NEWS_LIMIT = 5;

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

function renderNews(news) {
  const container = document.getElementById("news-list");
  const sorted = [...news]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, HOME_NEWS_LIMIT);

  container.innerHTML = sorted.map(item => `
    <li class="news-item">
      <div class="item-date">${escapeHtml(item.dateLabel || item.date)}</div>
      <div>
        <p class="item-title">${escapeHtml(item.title)}</p>
        <p class="item-description">${escapeHtml(item.description || "")}</p>
      </div>
    </li>
  `).join("");
}

function renderPeople(people) {
  const professorGrid = document.getElementById("professor-grid");
  const studentGrid = document.getElementById("student-grid");

  const makeCard = person => `
    <a class="person-card clickable-card" href="${escapeHtml(person.detailPage)}">
      <img
        class="person-photo"
        src="${escapeHtml(person.photo)}"
        alt="${escapeHtml(person.name)} portrait"
      />
      <div class="person-info">
        <h3>${escapeHtml(person.name)}</h3>
        <p class="person-role">${escapeHtml(person.role)}</p>
        <p>${escapeHtml(person.research || "")}</p>
      </div>
    </a>
  `;

  professorGrid.innerHTML = people
    .filter(person => person.category === "professor" && person.showOnHome !== false)
    .map(makeCard)
    .join("");

  studentGrid.innerHTML = people
    .filter(person => person.category === "student" && person.showOnHome !== false)
    .map(makeCard)
    .join("");
}

function renderResearch(areas) {
  const container = document.getElementById("research-grid");

  container.innerHTML = areas
    .filter(area => area.showOnHome !== false)
    .map(area => `
      <a class="card clickable-card" href="${escapeHtml(area.detailPage)}">
        <h3>${escapeHtml(area.name)}</h3>
        <p>${escapeHtml(area.description)}</p>
      </a>
    `)
    .join("");
}

function publicationItem(item) {
  const links = [
    item.doi ? `<a href="${escapeHtml(item.doi)}" target="_blank" rel="noopener noreferrer">DOI</a>` : "",
    item.pdf ? `<a href="${escapeHtml(item.pdf)}" target="_blank" rel="noopener noreferrer">PDF</a>` : "",
    item.code ? `<a href="${escapeHtml(item.code)}" target="_blank" rel="noopener noreferrer">Code</a>` : ""
  ].filter(Boolean).join("");

  return `
    <li class="publication-item">
      <div class="publication-type">${escapeHtml(item.year)}</div>
      <div>
        <p class="item-title">“${escapeHtml(item.title)},” ${escapeHtml(item.venue || "")}</p>
        <p class="item-description">${escapeHtml(item.authors)}</p>
        ${links ? `<div class="publication-links">${links}</div>` : ""}
      </div>
    </li>
  `;
}

function renderPublications(publications) {
  const selected = publications
    .filter(item => item.showOnHome === true)
    .sort((a, b) => b.year - a.year);

  const targets = {
    journal: document.getElementById("journal-list"),
    conference: document.getElementById("conference-list"),
    patent: document.getElementById("patent-list")
  };

  Object.entries(targets).forEach(([type, element]) => {
    const items = selected.filter(item => item.type === type);
    element.innerHTML = items.length
      ? items.map(publicationItem).join("")
      : `<li class="publication-item"><div></div><div class="item-description">No selected items.</div></li>`;
  });
}

function renderLectures(lectures) {
  const container = document.getElementById("lecture-grid");

  container.innerHTML = lectures
    .filter(lecture => lecture.showOnHome !== false)
    .map(lecture => `
      <a class="lecture-card clickable-card" href="${escapeHtml(lecture.detailPage)}">
        <h3>${escapeHtml(lecture.name)}</h3>
        <p>${escapeHtml(lecture.description)}</p>
      </a>
    `)
    .join("");
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

const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".navigation");

if (menuToggle && navigation) {
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

document.addEventListener("DOMContentLoaded", initializeHome);
