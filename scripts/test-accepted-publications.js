#!/usr/bin/env node
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const publications = JSON.parse(fs.readFileSync(path.join(root, "data/publications.json"), "utf8"));
const accepted = publications.find(p => p.id === "journal-int-2026-01");
assert.ok(accepted);
assert.equal(accepted.year, "");
assert.equal(accepted.status, "Accepted");
assert.equal(accepted.acceptedAt, "2026-11-10");

function contextFor(file, data = publications) {
  const elements = new Map();
  const context = vm.createContext({
    console,
    document: {
      currentScript: { dataset: {} },
      addEventListener() {},
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, { innerHTML: "", hidden: false });
        return elements.get(id);
      }
    },
    window: {},
    data,
    elements
  });
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
  return context;
}

const sortFiles = [
  ["assets/js/main.js", "comparePublicationsByDate", "publicationMarkup"],
  ["assets/js/publications-page.js", "compareByDateDescending", "createPublicationMarkup"],
  ["assets/js/person-detail-page.js", "comparePublicationsByDate", "createPublicationMarkup"],
  ["assets/js/research-detail-page.js", "comparePublicationsByDate", "createPublicationMarkup"]
];
for (const [file, compare, markup] of sortFiles) {
  const context = contextFor(file);
  const order = vm.runInContext("[...data].sort(" + compare + ").map(p => p.id)", context);
  assert.equal(order[0], accepted.id, file);
  context.samples = [
    { id: "old", year: "2024" },
    { id: "new", year: "2025", month: "4" },
    { id: "early", status: "Accepted for publication", acceptedAt: "2026-10-01" },
    { id: "late", status: "Accepted", acceptedAt: "2026-11-10", year: null },
    { id: "undated", status: "Accepted", year: "" }
  ];
  const sampleOrder = vm.runInContext("[...samples].sort(" + compare + ").map(p => p.id).join(',')", context);
  assert.equal(sampleOrder, "late,early,undated,new,old", file);
  context.paper = accepted;
  const html = vm.runInContext(markup + "(paper)", context);
  if (file === "assets/js/main.js" || file === "assets/js/publications-page.js") {
    assert.ok(html.includes('class="publication-type">Accepted</div>'), file);
    assert.ok(!html.includes(">Accepted</p>"), file);
    context.paper = { ...accepted, status: "Accepted for publication" };
    const acceptedMarkup = vm.runInContext(markup + "(paper)", context);
    assert.ok(acceptedMarkup.includes('class="publication-type">Accepted</div>'), file);
    assert.ok(!acceptedMarkup.includes(">Accepted for publication</p>"), file);
    context.paper = { ...accepted, year: "2025", status: "Granted" };
    const publishedMarkup = vm.runInContext(markup + "(paper)", context);
    assert.ok(publishedMarkup.includes('class="publication-type">2025</div>'), file);
    assert.ok(publishedMarkup.includes(">Granted</p>"), file);
  } else {
    assert.ok(html.includes(">Accepted</p>"), file);
  }
  assert.ok(html.includes(accepted.title), file);
  assert.ok(!html.includes("undefined") && !html.includes("null"), file);
  context.paper = { ...accepted, status: 'Accepted <script>alert("x")</script>' };
  assert.ok(!vm.runInContext(markup + "(paper)", context).includes("<script>"), file);
}

const home = contextFor("assets/js/main.js");
vm.runInContext("renderPublications(data)", home);
const homeHtml = home.elements.get("journal-list").innerHTML;
assert.ok(homeHtml.indexOf(accepted.title) < homeHtml.indexOf("Performance analysis for optimal pilot spacing"));
assert.ok(homeHtml.includes('class="publication-type">Accepted</div>'));
assert.ok(!homeHtml.includes(">Accepted</p>"));

const page = contextFor("assets/js/publications-page.js");
vm.runInContext("renderPublications(data)", page);
const listHtml = page.elements.get("international-journal-list").innerHTML;
assert.ok(listHtml.indexOf(accepted.title) < listHtml.indexOf("Performance analysis for optimal pilot spacing"));
assert.ok(listHtml.includes('class="publication-type">Accepted</div>'));
assert.ok(!listHtml.includes(">Accepted</p>"));

const research = contextFor("assets/js/research-page.js");
research.paper = accepted;
assert.ok(vm.runInContext("publicationMarkup(paper)", research).includes(">Accepted</p>"));

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
