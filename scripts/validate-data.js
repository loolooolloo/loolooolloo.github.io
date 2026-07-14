#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const errors = [];
const warnings = [];

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);
  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (error) {
    errors.push(`${relativePath}: JSON parse failed (${error.message})`);
    return null;
  }
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function ensureUniqueIds(items, label) {
  const seen = new Set();
  items.forEach((item, index) => {
    assert(isNonEmptyString(item.id), `${label}[${index}]: id is required`);
    if (!isNonEmptyString(item.id)) return;
    assert(!seen.has(item.id), `${label}: duplicate id '${item.id}'`);
    seen.add(item.id);
  });
  return seen;
}

function ensureArray(value, relativePath) {
  assert(Array.isArray(value), `${relativePath}: top-level value must be an array`);
  return Array.isArray(value) ? value : [];
}

function fileExists(relativePath) {
  if (!isNonEmptyString(relativePath)) return false;
  return fs.existsSync(path.join(root, relativePath.replace(/^\/+/, "")));
}

function validateDateParts(item, label) {
  ["year", "month", "day"].forEach(field => {
    if (item[field] === undefined || item[field] === null || String(item[field]).trim() === "") return;
    assert(/^\d+$/.test(String(item[field])), `${label}: ${field} must contain only digits`);
  });
}

function validateDetailPage(item, label) {
  if (!isNonEmptyString(item.detailPage)) return;
  assert(fileExists(item.detailPage), `${label}: detailPage does not exist (${item.detailPage})`);
}

function validateAssetPath(value, label) {
  if (!isNonEmptyString(value)) return;
  if (!fileExists(value)) {
    warnings.push(`${label}: asset path does not exist (${value})`);
  }
}

function validateRequiredStrings(item, fields, label) {
  fields.forEach(field => {
    assert(isNonEmptyString(item[field]), `${label}: ${field} is required`);
  });
}

const site = readJson("data/site.json");
const news = ensureArray(readJson("data/news.json"), "data/news.json");
const people = ensureArray(readJson("data/people.json"), "data/people.json");
const research = ensureArray(readJson("data/research.json"), "data/research.json");
const publications = ensureArray(readJson("data/publications.json"), "data/publications.json");
const lectures = ensureArray(readJson("data/lectures.json"), "data/lectures.json");

if (site) {
  validateRequiredStrings(site, ["labName", "universityName", "departmentName"], "site");
  assert(site.contact && typeof site.contact === "object", "site: contact object is required");
  if (site.contact) {
    validateRequiredStrings(site.contact, ["officeTitle", "contactTitle", "email", "telephone"], "site.contact");
    assert(Array.isArray(site.contact.officeLines), "site.contact: officeLines must be an array");
  }
}

const newsIds = ensureUniqueIds(news, "news");
const peopleIds = ensureUniqueIds(people, "people");
const researchIds = ensureUniqueIds(research, "research");
const publicationIds = ensureUniqueIds(publications, "publications");
const lectureIds = ensureUniqueIds(lectures, "lectures");

news.forEach((item, index) => {
  const label = `news[${index}] (${item.id || "missing id"})`;
  validateRequiredStrings(item, ["title"], label);
  validateDateParts(item, label);
  validateAssetPath(item.image, `${label}.image`);
});

people.forEach((person, index) => {
  const label = `people[${index}] (${person.id || "missing id"})`;
  validateRequiredStrings(person, ["name", "category", "role", "detailPage"], label);
  assert(["professor", "student"].includes(person.category), `${label}: category must be professor or student`);
  validateDetailPage(person, label);
  validateAssetPath(person.photo, `${label}.photo`);
  (person.selectedPublicationIds || []).forEach(id => {
    assert(publicationIds.has(id), `${label}: selectedPublicationIds references missing publication '${id}'`);
  });
});

research.forEach((item, index) => {
  const label = `research[${index}] (${item.id || "missing id"})`;
  validateRequiredStrings(item, ["name", "description", "detailPage"], label);
  validateDetailPage(item, label);
  validateAssetPath(item.image, `${label}.image`);
  validateAssetPath(item.detailImage, `${label}.detailImage`);
  (item.relatedPublicationIds || []).forEach(id => {
    assert(publicationIds.has(id), `${label}: relatedPublicationIds references missing publication '${id}'`);
  });
});

publications.forEach((item, index) => {
  const label = `publications[${index}] (${item.id || "missing id"})`;
  validateRequiredStrings(item, ["type", "year", "authors", "title", "venue"], label);
  assert(["journal", "conference", "patent"].includes(item.type), `${label}: type must be journal, conference, or patent`);
  if (["journal", "conference"].includes(item.type)) {
    assert(["international", "domestic"].includes(item.scope), `${label}: scope must be international or domestic`);
  }
  validateDateParts(item, label);
});

lectures.forEach((lecture, index) => {
  const label = `lectures[${index}] (${lecture.id || "missing id"})`;
  validateRequiredStrings(lecture, ["name", "description", "detailPage"], label);
  validateDetailPage(lecture, label);
});

if (errors.length) {
  console.error("Data validation failed:");
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

if (warnings.length) {
  console.log("Data validation warnings:");
  warnings.forEach(warning => console.log(`- ${warning}`));
}

console.log(`Data validation passed (${newsIds.size} news, ${peopleIds.size} people, ${researchIds.size} research areas, ${publicationIds.size} publications, ${lectureIds.size} lectures).`);
