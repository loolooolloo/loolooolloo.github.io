// GA4 enhanced measurement handles page views, downloads and outbound clicks.
// These events add site-specific context without collecting form contents.
(() => {
  if (location.hostname !== "wiolab.kr" && location.hostname !== "www.wiolab.kr") return;

  function track(name, parameters = {}) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", name, {
      send_to: "G-SZ597JLC7H",
      page_type: document.body.dataset.page || "other",
      ...parameters
    });
  }

  document.addEventListener("click", event => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    const url = new URL(link.href, location.href);
    if (url.protocol === "mailto:" || url.protocol === "tel:") {
      track("contact_click", { contact_method: url.protocol === "mailto:" ? "email" : "phone" });
      return;
    }
    const publication = link.closest(".pub");
    if (publication) {
      track("publication_click", {
        content_type: "publication",
        item_name: (publication.querySelector(".pub__title")?.textContent || "").trim().slice(0, 100),
        link_type: (link.firstChild?.textContent || "link").trim().slice(0, 40),
        link_domain: url.hostname
      });
    } else if (url.origin === location.origin) {
      track("navigation_click", { link_path: url.pathname + url.hash });
    }
  });

  const seenDepths = new Set();
  let scrollQueued = false;
  window.addEventListener("scroll", () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      const height = document.documentElement.scrollHeight;
      if (height <= innerHeight) return;
      const percent = 100 * (scrollY + innerHeight) / height;
      for (const depth of [25, 50, 75, 100]) {
        if (percent >= depth - 0.1 && !seenDepths.has(depth)) {
          seenDepths.add(depth);
          track("scroll_depth", { percent_scrolled: depth });
        }
      }
    });
  }, { passive: true });

  document.addEventListener("change", event => {
    if (event.target.id === "antenna-count") {
      track("simulation_interaction", { content_type: "beam_pattern", antenna_count: Number(event.target.value) });
    }
  });
})();
