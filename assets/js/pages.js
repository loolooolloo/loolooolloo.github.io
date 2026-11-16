// Renders the sub-pages (news, research, publications, lectures, people, research topics) from
// data/*.json in the browser. Each page's frame (menu, title, footer) comes from Jekyll
// (_layouts/wio.html); this script fills #page-body and the other slots the page has.
// The rules follow the previous page scripts: news-page.js, research-page.js,
// publications-page.js, person-detail-page.js, research-detail-page.js and the lectures page.

import {
  esc, byPublicationDate, researchItems, dateLabel, sortedNews, newsParagraphs,
  publicationItem, siteFile, loadData
} from "./render.js";

const peopleNames = people => (people || []).map(person => person.name).filter(Boolean);
export const studentsShown = people => (people || []).some(person => person.category === "student" && person.showOnHome !== false);

/* ---------- news ---------- */

export function newsPage(news) {
  const items = sortedNews(news);
  if (!items.length) return `
      <section class="block block--page"><div class="wrap"><p class="empty">No news yet.</p></div></section>`;
  const years = [];
  for (const item of items) {
    const year = String(item.date || "").slice(0, 4) || "—";
    if (!years.length || years.at(-1).year !== year) years.push({ year, items: [] });
    years.at(-1).items.push(item);
  }
  let index = 0;
  return years.map(({ year, items: list }) => `
      <section class="block block--page" aria-labelledby="year-${esc(year)}">
        <div class="wrap block__grid">
          <div class="block__head"><h2 id="year-${esc(year)}">${esc(year)}</h2></div>
          <ol class="accordion">${list.map(item => {
            const i = index++;
            // The newest item opens by default so the page never starts as a bare list of titles.
            const open = i === 0;
            return `
            <li class="accordion__item" id="${esc(item.id || `news-${i}`)}">
              <h3 class="accordion__heading">
                <button class="accordion__button" type="button" aria-expanded="${open}" aria-controls="news-panel-${i}" id="news-button-${i}">
                  <time datetime="${esc(item.date)}">${esc(dateLabel(item))}</time>
                  <span class="accordion__title">${esc(item.title)}</span>
                  <span class="accordion__icon" aria-hidden="true"></span>
                </button>
              </h3>
              <div class="accordion__panel" id="news-panel-${i}" role="region" aria-labelledby="news-button-${i}"${open ? "" : " hidden"}>
                ${item.image ? `<img class="accordion__image" src="${esc(siteFile(item.image))}" alt="${esc(item.imageAlt || item.title)}" loading="lazy">` : ""}
                <div class="prose">${newsParagraphs(item.content)}</div>
              </div>
            </li>`;
          }).join("")}
          </ol>
        </div>
      </section>`).join("");
}

/* ---------- research ---------- */

const relatedPublications = (area, publications) => {
  const ids = Array.isArray(area.relatedPublicationIds) ? area.relatedPublicationIds : [];
  return ids.length
    ? ids.map(id => publications.find(item => item.id === id)).filter(Boolean)
    : publications.filter(item => Array.isArray(item.researchAreas) && item.researchAreas.includes(area.id));
};

// "Label: description" topics keep their text; the label is set in bold.
function topic(text) {
  const value = String(text);
  const cut = value.indexOf(": ");
  return cut > 0
    ? `<li><strong>${esc(value.slice(0, cut))}</strong><span>${esc(value.slice(cut + 2))}</span></li>`
    : `<li><span>${esc(value)}</span></li>`;
}

const paragraphsOf = content => (Array.isArray(content) ? content : String(content || "").split(/\r?\n+/))
  .map(p => String(p).trim()).filter(Boolean);

export function researchJump(areas) {
  return areas.filter(area => area.showOnResearchPage !== false)
    .map(area => `<li><a class="jump" href="#${esc(area.id)}">${esc(area.titleEn || area.name)}</a></li>`).join("");
}

export function researchAreas(areas, publications, names) {
  const visible = areas.filter(area => area.showOnResearchPage !== false);
  if (!visible.length) return `<section class="block block--page"><div class="wrap"><p class="empty">No research areas are currently available.</p></div></section>`;
  return visible.map(area => {
    const content = Array.isArray(area.content) && area.content.length ? area.content : [area.summary || area.description || ""];
    const topics = Array.isArray(area.topics) ? area.topics : [];
    const related = relatedPublications(area, publications);
    return `
      <article class="block block--page area-detail" id="${esc(area.id)}" aria-labelledby="${esc(area.id)}-title">
        <div class="wrap block__grid">
          <header class="block__head area-detail__head">
            <h2 id="${esc(area.id)}-title">${esc(area.titleEn || area.name)}</h2>
            <p class="area-detail__ko">${esc(area.titleKo || "")}</p>
          </header>
          <div class="area-detail__body">
            <div class="prose prose--lead">${content.map(p => `<p>${esc(p)}</p>`).join("")}</div>
            ${topics.length ? `
            <h3 class="sub-heading">Detailed Topics</h3>
            <ul class="topics">${topics.map(topic).join("")}</ul>` : ""}
            <details class="related">
              <summary>Selected Publications (${related.length})</summary>
              ${related.length
                ? `<ol class="pubs">${related.map(item => publicationItem(item, names)).join("")}</ol>`
                : `<p class="empty">Selected publications will be added here.</p>`}
            </details>
          </div>
        </div>
      </article>`;
  }).join("");
}

// A research topic's own page (research/ai-communications.html and the like).
export function researchTopicPage(topic, publications, names) {
  const related = (Array.isArray(topic.relatedPublicationIds) ? topic.relatedPublicationIds : [])
    .map(id => publications.find(item => item.id === id)).filter(Boolean).sort(byPublicationDate);
  const image = topic.detailImage || topic.image;
  return `
      <section class="block block--page">
        <div class="wrap block__grid">
          <div class="block__head"><h2>Overview</h2></div>
          <div>
            ${image ? `<img class="topic-image" src="${esc(siteFile(image))}" alt="${esc(topic.imageAlt || topic.name)}">` : ""}
            <div class="prose prose--lead">${paragraphsOf(topic.content).map(p => `<p>${esc(p)}</p>`).join("")}</div>
          </div>
        </div>
      </section>
      ${related.length ? `
      <section class="block block--page" aria-labelledby="related-title">
        <div class="wrap block__grid">
          <div class="block__head"><h2 id="related-title">Related Publications</h2></div>
          <ol class="pubs">${related.map(item => publicationItem(item, names)).join("")}</ol>
        </div>
      </section>` : ""}`;
}

/* ---------- publications ---------- */

const PUBLICATION_GROUPS = [
  { id: "journals", title: "Journal Papers", parts: [
    ["international-journals", "International Journals", p => p.type === "journal" && p.scope === "international", "No international journal papers."],
    ["domestic-journals", "Domestic Journals", p => p.type === "journal" && p.scope === "domestic", "No domestic journal papers."]
  ] },
  { id: "conference-papers", title: "Conference Papers", parts: [
    ["international-conferences", "International Conferences", p => p.type === "conference" && p.scope === "international", "No international conference papers."],
    ["domestic-conferences", "Domestic Conferences", p => p.type === "conference" && p.scope === "domestic", "No domestic conference papers."]
  ] },
  { id: "patents", title: "Patents", parts: [
    ["patent-list", "", p => p.type === "patent", "No patents."]
  ] }
];

export function publicationJump(publications) {
  return PUBLICATION_GROUPS.map(group => {
    const count = group.parts.reduce((n, [, , test]) => n + publications.filter(test).length, 0);
    return `<li><a class="jump" href="#${group.id}">${group.title}<span class="jump__count">${count}</span></a></li>`;
  }).join("");
}

export function publicationGroups(publications, names) {
  return PUBLICATION_GROUPS.map(group => `
      <section class="block block--page" id="${group.id}" aria-labelledby="${group.id}-title">
        <div class="wrap block__grid">
          <div class="block__head"><h2 id="${group.id}-title">${group.title}</h2></div>
          <div>${group.parts.map(([id, title, test, empty]) => {
            const list = publications.filter(test).sort(byPublicationDate);
            return `
            <div class="pub-group" id="${id}">
              ${title ? `<h3>${title}</h3>` : ""}
              <ol class="pubs">${list.length ? list.map(item => publicationItem(item, names, { full: true })).join("") : `<li class="empty">${empty}</li>`}
              </ol>
            </div>`;
          }).join("")}
          </div>
        </div>
      </section>`).join("");
}

/* ---------- lectures ---------- */

export function lectureGroups(lectures) {
  return [["undergraduate", "Undergraduate Courses"], ["graduate", "Graduate Courses"]].map(([level, title]) => {
    const list = lectures.filter(item => item.level === level);
    if (!list.length) return "";
    return `
      <section class="block block--page" aria-labelledby="${level}-title">
        <div class="wrap block__grid">
          <div class="block__head"><h2 id="${level}-title">${title}</h2></div>
          <ul class="course-list">${list.map(item => `
            <li class="course"><span class="course__period">${esc(item.period || "")}</span><span class="course__name">${esc(item.name || "")}</span></li>`).join("")}
          </ul>
        </div>
      </section>`;
  }).join("");
}

/* ---------- people ---------- */

function contactLine(line) {
  const email = line.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/);
  if (email) {
    const address = email[0];
    return `${esc(line.slice(0, email.index))}<a href="mailto:${esc(address)}">${esc(address)}</a>${esc(line.slice(email.index + address.length))}`;
  }
  const phone = line.match(/^(Tel|Phone|전화)\s*:\s*(\+?[\d\s-]{7,})$/i);
  if (phone) {
    const number = phone[2].trim();
    return `${esc(phone[1])}: <a href="tel:${esc(number.replace(/[^\d+]/g, ""))}">${esc(number)}</a>`;
  }
  return esc(line);
}

// profileLines in groups; "_blank" starts a new group, as the README describes.
function profileLines(person) {
  const groups = [[]];
  for (const raw of Array.isArray(person.profileLines) ? person.profileLines : []) {
    const line = String(raw).trim();
    if (line === "_blank" || line.toLowerCase() === "blank") groups.push([]);
    else if (line) groups.at(-1).push(line);
  }
  return groups.filter(group => group.length)
    .map(group => `<p>${group.map(contactLine).join("<br>")}</p>`).join("");
}

function timeline(entries) {
  return entries.map(entry => {
    const description = entry.description !== undefined ? entry.description : entry.institution;
    const lines = (Array.isArray(description) ? description : String(description || "").split(/\r?\n+/))
      .map(line => String(line).trim()).filter(Boolean);
    return `
              <li class="timeline__item">
                <span class="timeline__period">${esc(entry.period || "")}</span>
                <div>
                  <p class="timeline__title">${esc(entry.title || "")}</p>
                  ${lines.map(line => `<p class="timeline__text">${esc(line)}</p>`).join("")}
                </div>
              </li>`;
  }).join("");
}

export function personPage(person, publications, names) {
  const interests = Array.isArray(person.researchDetail) ? person.researchDetail : researchItems(person.research);
  const paragraphs = paragraphsOf(person.content);
  const education = Array.isArray(person.education) ? person.education : [];
  const experience = Array.isArray(person.experience) ? person.experience : [];
  const selected = (Array.isArray(person.selectedPublicationIds) ? person.selectedPublicationIds : [])
    .map(id => publications.find(item => item.id === id)).filter(Boolean).sort(byPublicationDate);
  const lines = profileLines(person);
  const section = (id, title, inner) => `
      <section class="block block--page" aria-labelledby="${id}">
        <div class="wrap block__grid">
          <div class="block__head"><h2 id="${id}">${title}</h2></div>
          ${inner}
        </div>
      </section>`;
  return `
      <section class="profile">
        <div class="wrap profile__grid">
          ${person.photo ? `<img class="profile__photo${person.category === "student" ? " profile__photo--small" : ""}" src="${esc(siteFile(person.photo))}" alt="${esc(person.name)} portrait" width="300" height="400" onerror="this.hidden = true">` : ""}
          <div class="profile__body">
            ${lines ? `<div class="profile__lines">${lines}</div>` : ""}
            ${paragraphs.length ? `<div class="prose">${paragraphs.map(p => `<p>${esc(p)}</p>`).join("")}</div>` : ""}
            ${interests.length ? `
            <h2 class="sub-heading">Research Interests</h2>
            <ul class="interests">${interests.map(item => `<li>${esc(item)}</li>`).join("")}</ul>` : ""}
          </div>
        </div>
      </section>
      ${experience.length ? section("experience-title", "Experience", `<ol class="timeline">${timeline(experience)}</ol>`) : ""}
      ${education.length ? section("education-title", "Education", `<ol class="timeline">${timeline(education)}</ol>`) : ""}
      ${selected.length ? section("publications-title", "Selected Publications", `<ol class="pubs">${selected.map(item => publicationItem(item, names)).join("")}</ol>`) : ""}`;
}

/* ---------- the slots on each page ---------- */

export const PAGE_DATA = {
  news: ["news", "people"],
  research: ["research", "publications", "people"],
  "research-detail": ["research", "publications", "people"],
  publications: ["publications", "people"],
  lectures: ["lectures", "people"],
  person: ["people", "publications"]
};

// Returns { html: {selector: markup}, text: {selector: text}, title }.
export function pageSlots(page, data, id) {
  const names = peopleNames(data.people);
  switch (page) {
    case "news": return { html: { "#page-body": newsPage(data.news) } };
    case "research": return { html: { "#page-jump": researchJump(data.research), "#page-body": researchAreas(data.research, data.publications, names) } };
    case "research-detail": {
      const topic = data.research.find(item => item.id === id);
      if (!topic) return { html: {} };
      return {
        title: topic.name,
        html: { "#page-body": researchTopicPage(topic, data.publications, names) },
        text: { "#page-title": topic.name, "#page-note": topic.description || "" }
      };
    }
    case "publications": return { html: { "#page-jump": publicationJump(data.publications), "#page-body": publicationGroups(data.publications, names) } };
    case "lectures": return { html: { "#page-body": lectureGroups(data.lectures) } };
    case "person": {
      const person = data.people.find(item => item.id === id);
      if (!person) return { html: {} };
      return {
        title: person.name,
        html: { "#page-body": personPage(person, data.publications, names) },
        text: { "#page-title": person.name, "#page-note": person.role || "" }
      };
    }
    default: return { html: {} };
  }
}

/* ---------- browser ---------- */

if (typeof document !== "undefined") {
  const page = document.body.dataset.page;
  const id = document.body.dataset.id;

  // News accordion: one handler for every button, so it keeps working after the list is drawn.
  document.addEventListener("click", event => {
    const button = event.target.closest(".accordion__button");
    if (!button) return;
    const panel = document.getElementById(button.getAttribute("aria-controls"));
    if (!panel) return;
    const open = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!open));
    panel.hidden = open;
  });

  const names = PAGE_DATA[page];
  if (names) {
    loadData(names).then(data => {
      const out = pageSlots(page, data, id);
      for (const [selector, html] of Object.entries(out.html || {})) {
        const element = document.querySelector(selector);
        if (element) element.innerHTML = html;
      }
      for (const [selector, text] of Object.entries(out.text || {})) {
        const element = document.querySelector(selector);
        if (element) element.textContent = text;
      }
      if (out.title) document.title = `${out.title} · ${document.title.split(" · ").pop()}`;
      document.querySelectorAll('[data-show="students"]').forEach(element => { element.hidden = !studentsShown(data.people); });
      // A link such as /research/#mimo-beamforming lands on its section once the content is in place.
      if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ block: "start", behavior: "instant" });
    }).catch(error => {
      console.error(error);
      const body = document.querySelector("#page-body");
      if (body) body.innerHTML = `<section class="block block--page"><div class="wrap"><p class="empty">This information could not be loaded.</p></div></section>`;
    });
  }
}
