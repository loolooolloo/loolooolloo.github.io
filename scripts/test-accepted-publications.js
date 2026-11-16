#!/usr/bin/env node
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { pathToFileURL } = require("node:url");
const root = path.resolve(__dirname, "..");
const publications = JSON.parse(fs.readFileSync(path.join(root, "data/publications.json"), "utf8"));
const people = JSON.parse(fs.readFileSync(path.join(root, "data/people.json"), "utf8"));
const research = JSON.parse(fs.readFileSync(path.join(root, "data/research.json"), "utf8"));
const accepted = publications.find(p => p.id === "journal-int-2026-01");
assert.ok(accepted);
assert.equal(accepted.year, "");
assert.equal(accepted.status, "Accepted");
assert.equal(accepted.acceptedAt, "2026-11-10");

// All publication lists share one sort (byPublicationDate) and one entry markup (publicationItem)
// in assets/js/render.js; the home, Publications, Research and people pages use them.
const load = file => import(pathToFileURL(path.join(root, file)).href);

(async () => {
const render = await load("assets/js/render.js");
const pages = await load("assets/js/pages.js");
const { byPublicationDate, publicationItem } = render;

assert.equal([...publications].sort(byPublicationDate)[0].id, accepted.id);
const samples = [
  { id: "old", year: "2024" },
  { id: "new", year: "2025", month: "4" },
  { id: "early", status: "Accepted for publication", acceptedAt: "2026-10-01" },
  { id: "late", status: "Accepted", acceptedAt: "2026-11-10", year: null },
  { id: "undated", status: "Accepted", year: "" }
];
assert.equal([...samples].sort(byPublicationDate).map(p => p.id).join(","), "late,early,undated,new,old");

const yearCell = label => new RegExp(`class="pub__year[^"]*">${label}</span>`);
for (const full of [false, true]) {
  const html = publicationItem(accepted, [], { full });
  assert.match(html, yearCell("Accepted"));
  assert.ok(!html.includes(">Accepted</p>"));
  assert.ok(html.includes(accepted.title));
  assert.ok(!html.includes("undefined") && !html.includes("null"));
  const forPublication = publicationItem({ ...accepted, status: "Accepted for publication" }, [], { full });
  assert.match(forPublication, yearCell("Accepted"));
  assert.ok(!forPublication.includes(">Accepted for publication</p>"));
  const granted = publicationItem({ ...accepted, year: "2025", status: "Granted" }, [], { full });
  assert.match(granted, yearCell("2025"));
  assert.ok(granted.includes(">Granted</p>"));
  assert.ok(!publicationItem({ ...accepted, status: 'Accepted <script>alert("x")</script>' }, [], { full }).includes("<script>"));
}

// Home: the accepted paper comes before the newest published one.
const homeHtml = render.publications(publications).html;
assert.ok(homeHtml.indexOf(accepted.title) < homeHtml.indexOf("Performance analysis for optimal pilot spacing"));
assert.match(homeHtml, yearCell("Accepted"));
assert.ok(!homeHtml.includes(">Accepted</p>"));

// Publications page.
const listHtml = pages.publicationGroups(publications, []);
assert.ok(listHtml.indexOf(accepted.title) < listHtml.indexOf("Performance analysis for optimal pilot spacing"));
assert.match(listHtml, yearCell("Accepted"));
assert.ok(!listHtml.includes(">Accepted</p>"));

// Research page lists the accepted paper where research.json relates it.
const related = research.find(area => (area.relatedPublicationIds || []).includes(accepted.id));
if (related) assert.match(pages.researchAreas([related], publications, []), yearCell("Accepted"));

// Person pages sort their selected publications the same way.
const lead = people.find(person => person.category === "professor");
const personHtml = pages.personPage({ ...lead, selectedPublicationIds: ["journal-int-2025-02", accepted.id] }, publications, []);
assert.ok(personHtml.indexOf(accepted.title) < personHtml.indexOf("Performance analysis for optimal pilot spacing"));

function validationErrors(papers) {
  const errors = [];
  const context = vm.createContext({
    __dirname: path.join(root, "scripts"),
    console: { error(message) { errors.push(message); }, warn() {}, log() {} },
    process: { exit() {} },
    require(name) {
      if (name !== "fs") return require(name);
      return {
        ...fs,
        readFileSync(file, encoding) {
          if (path.basename(file) === "publications.json") return JSON.stringify(papers);
          return fs.readFileSync(file, encoding);
        }
      };
    }
  });
  vm.runInContext(fs.readFileSync(path.join(root, "scripts/validate-data.js"), "utf8"), context);
  return errors.join("\n");
}
assert.equal(validationErrors(publications), "");
for (const year of ["", undefined, null]) {
  assert.equal(validationErrors(publications.map(p => p.id === accepted.id ? { ...p, year } : p)), "");
}
assert.match(validationErrors(publications.map(p => p.id === accepted.id ? { ...p, status: "" } : p)), /year/);
assert.match(validationErrors(publications.map(p => p.id === accepted.id ? { ...p, month: "11" } : p)), /month\/day/);
assert.match(validationErrors(publications.map(p => p.id === accepted.id ? { ...p, acceptedAt: "Nov 10" } : p)), /acceptedAt/);
console.log("Accepted publication rendering, ordering, and validation checks passed.");
})().catch(error => { console.error(error); process.exit(1); });
