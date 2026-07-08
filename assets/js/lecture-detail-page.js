const LECTURE_DATA_PATH =
  window.LECTURE_DATA_PATH || "/data/lectures.json";

const LECTURE_SITE_BASE_URL =
  window.LECTURE_SITE_BASE_URL || "/";

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
  const base = LECTURE_SITE_BASE_URL.endsWith("/")
    ? LECTURE_SITE_BASE_URL
    : `${LECTURE_SITE_BASE_URL}/`;

  return `${base}${String(path).replace(/^\/+/, "")}`;
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

function createMaterials(materials = []) {
  return materials
    .map(material => {
      const href = material.url ? resolveSiteUrl(material.url) : "#";
      return `
        <li class="publication-item">
          <div>
            <p class="item-title">
              <a class="text-link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">
                ${escapeHtml(material.title || "Lecture material")}
              </a>
            </p>
            ${material.description ? `<p class="item-description">${escapeHtml(material.description)}</p>` : ""}
          </div>
        </li>
      `;
    })
    .join("");
}

function renderLecture(lecture) {
  document.title = `${lecture.name} · ${document.title.split(" · ").pop()}`;

  document.getElementById("lecture-detail-title").textContent = lecture.name;
  document.getElementById("lecture-detail-description").textContent =
    lecture.description || "";
  document.getElementById("lecture-detail-content").innerHTML =
    createParagraphs(lecture.content);

  const materials = Array.isArray(lecture.materials) ? lecture.materials : [];
  const materialsSection = document.getElementById("lecture-materials-section");
  const materialsList = document.getElementById("lecture-materials-list");

  materialsSection.hidden = materials.length === 0;
  materialsList.innerHTML = createMaterials(materials);
}

document.addEventListener("DOMContentLoaded", async () => {
  const lectureId = window.LECTURE_ID;

  if (!lectureId) {
    return;
  }

  try {
    const lectures = await loadJson(LECTURE_DATA_PATH);
    const lecture = lectures.find(item => item.id === lectureId);

    if (!lecture) {
      throw new Error(`Lecture not found: ${lectureId}`);
    }

    renderLecture(lecture);
  } catch (error) {
    console.error(error);
  }
});
