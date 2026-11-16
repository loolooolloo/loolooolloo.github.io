// Phone menu, the nav's current-section mark, and the hero's beam pattern.

/* ---------- menu ---------- */
const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");

if (toggle && nav) {
  const close = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", event => { if (event.target.closest(".nav-link")) close(); });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) { close(); toggle.focus(); }
  });
  matchMedia("(min-width: 960px)").addEventListener("change", close);
}

/* ---------- current section ---------- */
const links = new Map();
document.querySelectorAll('.nav-link[href^="#"]').forEach(link => links.set(link.hash.slice(1), link));

function mark() {
  const line = 140;
  let current = null;
  for (const id of links.keys()) {
    const target = document.getElementById(id);
    if (!target || target.hidden) continue;
    if (target.getBoundingClientRect().top <= line) current = id;
  }
  // At the bottom of the page the last section is current even if it is short.
  if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) current = "contact";
  links.forEach((link, id) => {
    if (id === current) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  });
}
let queued = false;
addEventListener("scroll", () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; mark(); });
}, { passive: true });
mark();

/* ---------- beam pattern ----------
   Beam pattern of an N-element uniform linear array (half-wavelength spacing, equal weights) steered
   to theta0. Total transmit power is held fixed, so the plotted value is the beamforming gain
     G(theta) = |sum_n e^(j n psi)|^2 / N,   psi = pi (sin theta - sin theta0),
   whose peak equals N. Every N is drawn on one dB scale fixed to the 64-element peak, so adding
   antennas both narrows the beam and lengthens it. The plot spans 40 dB below that peak, deep enough
   that every side lobe of every N up to 64 is drawn (the lowest, for N = 64, sits about 36 dB down). */
const svg = document.querySelector(".beam__svg");
if (svg) {
  const N_LO = 1, N_HI = 64, N_START = 32, PITCH = 7.5, R = 290, RANGE = 40, REST = 20, LIMIT = 45;
  const ns = "http://www.w3.org/2000/svg";
  const lobe = svg.querySelector(".beam__lobe");
  const array = svg.querySelector(".beam__array");
  const grid = svg.querySelector(".beam__grid");
  const slider = document.getElementById("antenna-count");
  const count = document.querySelector(".beam__count");
  const deg = Math.PI / 180;

  const add = (parent, name, attrs) => {
    const el = document.createElementNS(ns, name);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    parent.appendChild(el);
    return el;
  };
  for (const f of [1 / 3, 2 / 3, 1]) {
    const r = R * f;
    add(grid, "path", { d: `M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0` });
  }
  for (const a of [-60, -30, 0, 30, 60]) {
    add(grid, "line", { x1: 0, y1: 0, x2: (R * Math.sin(a * deg)).toFixed(1), y2: (-R * Math.cos(a * deg)).toFixed(1) });
  }
  add(grid, "line", { x1: -R - 20, y1: 0, x2: R + 20, y2: 0 });
  const steer = add(grid, "line", { class: "beam__steer", x1: 0, y1: 0, x2: 0, y2: -R });

  const TOP_DB = 10 * Math.log10(N_HI);

  let shownN = 0;
  function placeElements(n) {
    if (n === shownN) return;
    shownN = n;
    array.replaceChildren();
    for (let i = 0; i < n; i++) add(array, "circle", { cx: ((i - (n - 1) / 2) * PITCH).toFixed(2), cy: 0, r: 2.6 });
  }

  function draw(theta0, n) {
    placeElements(n);
    const s0 = Math.sin(theta0 * deg);
    let d = "M 0 0";
    // Fine enough steps that the narrow lobes of a large array keep their shape.
    const step = n > 24 ? 0.1 : 0.25;
    for (let t = -90; t <= 90 + 1e-9; t += step) {
      const psi = Math.PI * (Math.sin(t * deg) - s0);
      let re = 0, im = 0;
      for (let i = 0; i < n; i++) { re += Math.cos(i * psi); im += Math.sin(i * psi); }
      const db = 10 * Math.log10(Math.max((re * re + im * im) / n, 1e-9)) - TOP_DB;
      const r = R * Math.max(0, db + RANGE) / RANGE;
      d += ` L ${(r * Math.sin(t * deg)).toFixed(1)} ${(-r * Math.cos(t * deg)).toFixed(1)}`;
    }
    lobe.setAttribute("d", d + " Z");
    steer.setAttribute("x2", (R * Math.sin(theta0 * deg)).toFixed(1));
    steer.setAttribute("y2", (-R * Math.cos(theta0 * deg)).toFixed(1));
  }

  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let angle = REST, target = REST, N = still ? N_START : N_LO, running = false, intro = !still;
  const start = performance.now(), duration = 2400, hold = 400;
  const ease = x => x * x * (3 - 2 * x);

  function show(n) {
    N = n;
    if (slider && Number(slider.value) !== n) slider.value = String(n);
    if (count) count.textContent = String(n);
  }

  function frame(now) {
    if (intro) {
      const p = Math.min(1, Math.max(0, (now - start - hold) / duration));
      show(Math.round(N_LO + (N_START - N_LO) * ease(p)));
      if (p >= 1) intro = false;
    } else if (!still) {
      angle += (target - angle) * 0.12;
    }
    draw(angle, N);
    if (intro || (!still && Math.abs(target - angle) > 0.05)) requestAnimationFrame(frame);
    else running = false;
  }
  // With reduced motion the beam still answers the visitor, but jumps to the new angle
  // instead of easing there.
  const wake = () => {
    if (still) { angle = target; draw(angle, N); return; }
    if (!running) { running = true; requestAnimationFrame(frame); }
  };
  // Any visitor input ends the opening sequence and takes over.
  const setN = n => { intro = false; show(Math.max(N_LO, Math.min(N_HI, n))); wake(); };

  show(N);
  if (still) draw(angle, N); else wake();

  slider?.addEventListener("input", () => setN(Number(slider.value)));

  // The beam follows a mouse or pen over the hero. The check is per event, not a media query:
  // laptops with a touch screen can report a coarse primary pointer while a mouse is in use.
  const hero = document.querySelector(".hero");
  if (hero) {
    hero.addEventListener("pointermove", event => {
      if (event.pointerType === "touch") return;
      if (event.target.closest(".beam__control")) return;
      const box = svg.getBoundingClientRect();
      // The array sits at the bottom-centre of the plot (y = 0 in a viewBox running from -310 to 20).
      const ox = box.left + box.width / 2, oy = box.bottom - box.height * (20 / 330);
      const a = Math.atan2(event.clientX - ox, oy - event.clientY) / deg;
      target = Math.max(-LIMIT, Math.min(LIMIT, a));
      wake();
    });
    hero.addEventListener("pointerleave", () => { target = REST; wake(); });
  }
}
