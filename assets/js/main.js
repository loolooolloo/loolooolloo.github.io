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
  const items = [...news]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, HOME_NEWS_LIMIT);

  container.innerHTML = items.map(item => `
    <li class="news-item">
      <div class="item-date">${escapeHtml(item.dateLabel || item.date)}</div>
      <div>
        <p class="item-title">${escapeHtml(item.title)}</p>
        <p class="item-description">${escapeHtml(item.description || "")}</p>
      </div>
    </li>
  `).join("");
}

function personCard(person) {
  return `
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
}

function renderPeople(people) {
  document.getElementById("professor-grid").innerHTML = people
    .filter(person => person.category === "professor" && person.showOnHome !== false)
    .map(personCard)
    .join("");

  document.getElementById("student-grid").innerHTML = people
    .filter(person => person.category === "student" && person.showOnHome !== false)
    .map(personCard)
    .join("");
}

function renderResearch(areas) {
  document.getElementById("research-grid").innerHTML = areas
    .filter(area => area.showOnHome !== false)
    .map(area => `
      <a class="card clickable-card" href="${escapeHtml(area.detailPage)}">
        <h3>${escapeHtml(area.name)}</h3>
        <p>${escapeHtml(area.description)}</p>
      </a>
    `)
    .join("");
}

function publicationMarkup(item) {
  const links = [
    item.doi
      ? `<a href="${escapeHtml(item.doi)}" target="_blank" rel="noopener noreferrer">DOI</a>`
      : "",
    item.pdf
      ? `<a href="${escapeHtml(item.pdf)}" target="_blank" rel="noopener noreferrer">PDF</a>`
      : "",
    item.code
      ? `<a href="${escapeHtml(item.code)}" target="_blank" rel="noopener noreferrer">Code</a>`
      : ""
  ].filter(Boolean).join("");

  return `
    <li class="publication-item">
      <div class="publication-type">${escapeHtml(item.year)}</div>
      <div>
        <p class="item-title">
          “${escapeHtml(item.title)},” ${escapeHtml(item.venue || "")}
        </p>
        <p class="item-description">${escapeHtml(item.authors)}</p>
        ${links ? `<div class="publication-links">${links}</div>` : ""}
      </div>
    </li>
  `;
}

const HOME_RECENT_PUBLICATION_LIMIT = 5;

function renderPublications(publications) {
  const selectedPublications = publications.filter(
    item => item.showOnHome === true
  );

  const hasSelectedPublications = selectedPublications.length > 0;

  /*
   * showOnHome: true인 항목이 있으면 selected publication 표시
   * 하나도 없으면 전체 publication 중 최근 N개 표시
   */
  const homePublications = (
    hasSelectedPublications
      ? selectedPublications
      : [...publications]
          .sort(comparePublicationsByDate)
          .slice(0, HOME_RECENT_PUBLICATION_LIMIT)
  );

  /*
   * selected publication도 연도 및 날짜 기준으로 정렬
   */
  homePublications.sort(comparePublicationsByDate);

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
    const items = homePublications.filter(item => item.type === type);

    if (items.length === 0) {
      /*
       * 해당 category에 표시할 항목이 없으면
       * heading과 list를 포함한 group 전체를 숨김
       */
      elements.group.hidden = true;
      elements.list.innerHTML = "";
      return;
    }

    elements.group.hidden = false;
    elements.list.innerHTML = items
      .map(publicationMarkup)
      .join("");
  });

  /*
   * 현재 표시 방식에 따라 제목과 설명 변경
   */
  const heading = document.getElementById("publications-heading");
  const description = document.getElementById(
    "publications-description"
  );

  if (hasSelectedPublications) {
    heading.textContent = "Selected Publications";
    description.textContent =
      "Selected journal papers, conference papers, and patents.";
  } else {
    heading.textContent = "Recent Publications";
    description.textContent =
      `The ${HOME_RECENT_PUBLICATION_LIMIT} most recent publications.`;
  }
}

function comparePublicationsByDate(a, b) {
  /*
   * date가 있으면 date를 우선 사용
   * date가 없으면 year를 사용
   */
  const dateA = getPublicationDate(a);
  const dateB = getPublicationDate(b);

  return dateB - dateA;
}

function getPublicationDate(publication) {
  if (publication.date) {
    return new Date(publication.date).getTime();
  }

  return new Date(`${publication.year}-01-01`).getTime();
}

function renderLectures(lectures) {
  document.getElementById("lecture-grid").innerHTML = lectures
    .filter(lecture => lecture.showOnHome !== false)
    .map(lecture => `
      <a class="card clickable-card" href="${escapeHtml(lecture.detailPage)}">
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
