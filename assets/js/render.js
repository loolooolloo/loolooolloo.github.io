// Renders the home page's lists from data/*.json in the browser, and holds the helpers the
// sub-pages share (assets/js/pages.js). Edit the JSON files and the pages follow; no build step.
// Data rules: showOnHome, at most 3 news items, accepted papers first, Students hidden when empty.
// The functions are plain ES module exports so scripts/*.js can test them in Node.

export const HOME_NEWS_LIMIT = 3;
export const HOME_RECENT_PUBLICATION_LIMIT = 5;

// Site root for links and files. The site is served from the domain root (_config.yml baseurl: "").
export const SITE = "/";

// Data files get the build's version number (window.withSiteVersion, from _includes/head-meta.html)
// so an edited JSON file is not served from a stale cache.
export const dataUrl = name => {
  const path = `${SITE}data/${name}.json`;
  return typeof window !== "undefined" && window.withSiteVersion ? window.withSiteVersion(path) : path;
};
export const siteFile = path => SITE + String(path || "").replace(/^\/+/, "");

export const esc = (value = "") => String(value)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

const int = value => {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export const isAccepted = item => /^accepted\b/i.test(String(item.status || "").trim());

function publicationTime(item) {
  const year = int(item.year);
  if (year === null) return 0;
  const month = int(item.month);
  const day = int(item.day);
  return new Date(year, month === null ? 0 : month - 1, day === null ? 1 : day).getTime();
}

export function byPublicationDate(a, b) {
  const acceptedFirst = Number(isAccepted(b)) - Number(isAccepted(a));
  if (acceptedFirst) return acceptedFirst;
  if (isAccepted(a) && isAccepted(b)) {
    const order = (Date.parse(b.acceptedAt || "") || 0) - (Date.parse(a.acceptedAt || "") || 0);
    if (order) return order;
  }
  return publicationTime(b) - publicationTime(a);
}

export function researchItems(research) {
  if (Array.isArray(research)) return research.map(item => String(item).trim()).filter(Boolean);
  return String(research || "")
    .replace(/^research interests?:\s*/i, "").replace(/\.$/, "")
    .split(/\s*,\s*|\s+and\s+/i).map(item => item.trim()).filter(Boolean);
}

const newsTime = item => Date.parse(`${item.date || ""}T00:00:00`) || 0;
export const dateLabel = item => String(item.date || "").replaceAll("-", ".");
export const sortedNews = items => [...items].sort((a, b) => newsTime(b) - newsTime(a));

// News text may carry *italic*, **bold** and ***both***, as on the live site (news-page.js).
// Everything else, HTML included, stays escaped.
export function formatInline(value) {
  const source = String(value);
  const emphasis = /\*\*\*([^\n]+?)\*\*\*|\*\*([^\n]+?)\*\*|\*([^*\n]+)\*/g;
  let result = "";
  let cursor = 0;
  for (const match of source.matchAll(emphasis)) {
    result += esc(source.slice(cursor, match.index));
    if (match[1] !== undefined) result += `<strong><em>${esc(match[1])}</em></strong>`;
    else if (match[2] !== undefined) result += `<strong>${formatInline(match[2])}</strong>`;
    else result += `<em>${esc(match[3])}</em>`;
    cursor = match.index + match[0].length;
  }
  return result + esc(source.slice(cursor));
}

// News body as the README describes: each content item starts a new line, "\n" also breaks a line,
// and an empty item leaves a blank line. One paragraph, lines joined with <br>.
export function newsParagraphs(content) {
  const source = Array.isArray(content)
    ? content.map(line => String(line ?? "")).join("\n")
    : String(content ?? "");
  if (!source) return "";
  return `<p>${source.split(/\r\n|\r|\n/).map(formatInline).join("<br>")}</p>`;
}

// The home page shows the first line of each news item.
const newsLead = item => {
  const source = Array.isArray(item.content) ? item.content.map(line => String(line ?? "")).join("\n") : String(item.content || item.description || "");
  return source.split(/\r\n|\r|\n/).find(line => line.trim() !== "") || "";
};

const photo = path => siteFile(path);
const link = path => esc(siteFile(path));

export function latestNews(items) {
  const item = sortedNews(items)[0];
  return item
    ? `<time datetime="${esc(item.date)}">${esc(dateLabel(item))}</time><span>${esc(item.title)}</span>`
    : "";
}

export function news(items) {
  return sortedNews(items).slice(0, HOME_NEWS_LIMIT).map(item => `
          <li class="news-item">
            <time class="news-item__date" datetime="${esc(item.date)}">${esc(dateLabel(item))}</time>
            <div class="news-item__body">
              <h3>${esc(item.title)}</h3>
              <p>${formatInline(newsLead(item))}</p>
            </div>
          </li>`).join("");
}

// The profile lines above the "_blank" separator: title, department, university.
const profileHead = person => {
  const lines = Array.isArray(person.profileLines) ? person.profileLines : [];
  const cut = lines.indexOf("_blank");
  return (cut === -1 ? lines : lines.slice(0, cut)).filter(Boolean);
};

function leadCard(person) {
  const interests = researchItems(person.research);
  return `
          <article class="lead">
            <img class="lead__photo" src="${esc(photo(person.photo))}" alt="${esc(person.name)}" width="360" height="480" loading="lazy">
            <div class="lead__body">
              <h3 class="lead__name">${esc(person.name)}</h3>
              <p class="lead__role">${esc(person.role)}</p>
              ${profileHead(person).length ? `<p class="lead__lines">${profileHead(person).map(esc).join("<br>")}</p>` : ""}
              ${interests.length ? `<ul class="interests">${interests.map(item => `<li>${esc(item)}</li>`).join("")}</ul>` : ""}
              <a class="text-link" href="${link(person.detailPage)}">View profile<span class="visually-hidden"> of ${esc(person.name)}</span></a>
            </div>
          </article>`;
}

function memberCard(person) {
  const interests = researchItems(person.research);
  return `
          <a class="member" href="${link(person.detailPage)}">
            <img class="member__photo" src="${esc(photo(person.photo))}" alt="" width="96" height="128" loading="lazy">
            <span class="member__body">
              <span class="member__name">${esc(person.name)}</span>
              <span class="member__role">${esc(person.role)}</span>
              ${interests.length ? `<span class="member__interests">${interests.map(esc).join(", ")}</span>` : ""}
            </span>
          </a>`;
}

export function people(list) {
  const shown = list.filter(person => person.showOnHome !== false);
  const professors = shown.filter(person => person.category === "professor");
  const students = shown.filter(person => person.category === "student");
  return {
    professors: professors.map(leadCard).join(""),
    students: students.map(memberCard).join(""),
    hasProfessors: professors.length > 0,
    hasStudents: students.length > 0,
    names: list.map(person => person.name).filter(Boolean)
  };
}

export function research(areas) {
  return areas.filter(area => area.showOnHome !== false).map(area => `
          <li>
            <a class="area" href="${esc(SITE)}research/#${esc(area.id)}">
              <span class="area__head">
                <span class="area__ko">${esc(area.titleKo || "")}</span>
                <span class="area__en">${esc(area.titleEn || area.name)}</span>
              </span>
              <span class="area__text">${esc(area.description)}</span>
              <span class="area__keywords">${(Array.isArray(area.keywords) ? area.keywords : []).map(keyword => `<span>${esc(keyword)}</span>`).join("")}</span>
              <span class="area__more">View details</span>
            </a>
          </li>`).join("");
}

// Lab members stand out in an author list, as the reference lab sites do.
export function authors(text, names, corresponding = []) {
  let html = esc(text || "");
  for (const name of corresponding) html = html.replaceAll(esc(name), `${esc(name)}<sup aria-label="Corresponding author">*</sup>`);
  for (const name of names) html = html.replaceAll(esc(name), `<b>${esc(name)}</b>`);
  return html;
}

const patentLabel = url => {
  try { return new URL(url).hostname === "patents.google.com" ? "Google Patents" : "Patent"; } catch { return "Patent"; }
};

// One entry in every publication list on the site (home, Publications, Research, people).
// An accepted paper shows "Accepted" in the year column and no status line; any other status
// (Granted, 출원, ...) stays under the authors. `full` adds volume, number and pages.
export function publicationItem(item, names = [], { full = false } = {}) {
  const accepted = isAccepted(item);
  const details = full
    ? [item.volume && `vol. ${item.volume}`, item.number && `no. ${item.number}`, item.pages && `pp. ${item.pages}`].filter(Boolean)
    : [];
  const venue = [item.venue, ...details].filter(Boolean).map(esc).join(", ");
  const links = [
    item.url ? [item.url, patentLabel(item.url)] : null,
    item.doi ? [item.doi, "DOI"] : null,
    item.pdf ? [item.pdf, "PDF"] : null,
    item.code ? [item.code, "Code"] : null
  ].filter(Boolean)
    .map(([href, label]) => `<a class="chip" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${label}<span class="visually-hidden">: ${esc(item.title)} (opens in a new tab)</span></a>`)
    .join("");
  return `
              <li class="pub">
                <span class="pub__year${accepted ? " pub__year--accepted" : ""}">${esc(accepted ? "Accepted" : item.year || "")}</span>
                <div class="pub__body">
                  <p class="pub__title">${esc(item.title)}</p>
                  ${venue ? `<p class="pub__venue">${venue}</p>` : ""}
                  <p class="pub__authors">${authors(item.authors, names, item.correspondingAuthors || [])}</p>
                  ${item.status && !accepted ? `<p class="pub__status">${esc(item.status)}</p>` : ""}
                  ${links ? `<p class="pub__links">${links}</p>` : ""}
                </div>
              </li>`;
}

export function publicationLegend(items) {
  return items.some(item => item.correspondingAuthors?.length)
    ? '<p class="block__note">* Corresponding author</p>' : '';
}

export function publications(items, names = []) {
  const selected = items.filter(item => item.showOnHome === true);
  const home = (selected.length ? [...selected] : [...items])
    .sort(byPublicationDate)
    .slice(0, selected.length ? selected.length : HOME_RECENT_PUBLICATION_LIMIT);

  const groups = [["journal", "Journal Papers"], ["conference", "Conference Papers"], ["patent", "Patents"]];
  const html = groups.map(([type, title]) => {
    const group = home.filter(item => item.type === type);
    if (!group.length) return "";
    return `
          <div class="pub-group">
            <h3>${title}</h3>
            <ol class="pubs">${group.map(item => publicationItem(item, names)).join("")}
            </ol>
          </div>`;
  }).join("");

  const description = selected.length
    ? "Selected journal papers, conference papers, and patents."
    : `The ${Math.min(HOME_RECENT_PUBLICATION_LIMIT, items.length)} most recent publications.`;
  return { html: publicationLegend(home) + html, description };
}

// Lectures are grouped under their semester, in the order the JSON lists them.
export function lectures(items) {
  const groups = new Map();
  for (const item of items.filter(item => item.showOnHome !== false)) {
    const key = item.period || "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups].map(([period, list]) => `
          <div class="term">
            <h3 class="term__name">${esc(period)}</h3>
            <ul>${list.map(item => `
              <li class="lecture">
                <span class="lecture__name">${esc(item.name || "")}</span>
                ${item.level ? `<span class="lecture__level">${esc(item.level.charAt(0).toUpperCase() + item.level.slice(1))}</span>` : ""}
              </li>`).join("")}
            </ul>
          </div>`).join("");
}

export function contact(site) {
  const c = site.contact || {};
  const tel = c.telephone ? String(c.telephone).replace(/[^\d+]/g, "") : "";
  return {
    officeTitle: c.officeTitle || "Office",
    contactTitle: c.contactTitle || "Contact Information",
    office: (Array.isArray(c.officeLines) ? c.officeLines : []).map(esc).join("<br>"),
    details: [
      c.email ? `<dt>Email</dt><dd><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></dd>` : "",
      tel ? `<dt>Tel</dt><dd><a href="tel:${esc(tel)}">${esc(c.telephone)}</a></dd>` : ""
    ].filter(Boolean).join("")
  };
}

// Every slot the lists go into.
export function slots(data) {
  const p = people(data.people);
  const pub = publications(data.publications, p.names);
  const c = contact(data.site);
  return {
    html: {
      "#hero-news": latestNews(data.news),
      "#news-list": news(data.news),
      "#professor-grid": p.professors,
      "#student-grid": p.students,
      "#research-list": research(data.research),
      "#publication-groups": pub.html,
      "#lecture-terms": lectures(data.lectures),
      "#contact-office-lines": c.office,
      "#contact-info-details": c.details
    },
    text: {
      "#publications-description": pub.description,
      "#contact-office-title": c.officeTitle,
      "#contact-info-title": c.contactTitle,
      "#site-university": data.site.universityName || "",
      "#site-department": data.site.departmentName || ""
    },
    show: {
      professor: p.hasProfessors,
      students: p.hasStudents,
      research: data.research.some(area => area.showOnHome !== false)
    }
  };
}

export async function loadData(names) {
  const loaded = await Promise.all(names.map(name => fetch(dataUrl(name)).then(response => {
    if (!response.ok) throw new Error(`Failed to load data/${name}.json: ${response.status}`);
    return response.json();
  })));
  return Object.fromEntries(names.map((name, index) => [name, loaded[index]]));
}

// The home page fills its lists here; sub-pages use pages.js.
if (typeof document !== "undefined" && document.body?.dataset.page === "home") {
  loadData(["site", "news", "people", "research", "publications", "lectures"]).then(data => {
    const out = slots(data);
    for (const [selector, html] of Object.entries(out.html)) {
      const element = document.querySelector(selector);
      if (element) element.innerHTML = html;
    }
    for (const [selector, text] of Object.entries(out.text)) {
      const element = document.querySelector(selector);
      if (element && element.textContent !== text) element.textContent = text;
    }
    for (const [key, visible] of Object.entries(out.show)) {
      document.querySelectorAll(`[data-show="${key}"]`).forEach(element => { element.hidden = !visible; });
    }
  }).catch(error => console.error(error));
}
