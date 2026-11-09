import { splitFee, CREATOR_RUNGS } from "./calc.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const usd = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ---- mobile menu ---- */
const menuBtn = $(".menu-btn");
const nav = $("#nav");
menuBtn.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(open));
});
nav.addEventListener("click", (e) => {
  if (e.target.closest("a")) { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); }
});

/* ---- scrollspy ---- */
const links = $$("nav.main a[href^='#']");
const spy = new IntersectionObserver((entries) => {
  for (const en of entries) {
    if (!en.isIntersecting) continue;
    for (const a of links) a.toggleAttribute("aria-current", a.getAttribute("href") === `#${en.target.id}`);
  }
}, { rootMargin: "-45% 0px -50% 0px" });
for (const a of links) { const t = $(a.getAttribute("href")); if (t) spy.observe(t); }

/* ---- reveal on scroll ---- */
const rv = $$(".rv");
if (reduced || !("IntersectionObserver" in window)) rv.forEach((e) => e.classList.add("in"));
else {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.08 });
  rv.forEach((e) => io.observe(e));
}

/* ---- accessible tabs (arrow keys, home/end) ---- */
$$("[data-tabs]").forEach((list) => {
  const tabs = $$("[role=tab]", list);
  const show = (tab, focus) => {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      const p = document.getElementById(t.getAttribute("aria-controls"));
      if (p) p.hidden = !on;
    }
    if (focus) tab.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => show(t));
    t.addEventListener("keydown", (e) => {
      const k = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (k === undefined) return;
      e.preventDefault();
      show(tabs[(k + tabs.length) % tabs.length], true);
    });
  });
});

/* ---- fee calculator (same waterfall as the engine; see verify/lib/site-fee-calc.test.ts) ---- */
const vol = $("#vol");
const rung = $("#rung");
for (const r of CREATOR_RUNGS) {
  const o = document.createElement("option");
  o.value = String(r.bps);
  o.textContent = r.bps ? `${r.label} (${(r.bps / 100).toFixed(1)}%)` : r.label;
  rung.append(o);
}
rung.value = "4000";
function renderCalc() {
  const v = Math.max(0, Number(vol.value) || 0);
  const s = splitFee(v, Number(rung.value));
  $("#out-gross").textContent = usd(s.grossFee);
  $("#out-vol").textContent = usd(v).replace(/\.00$/, "");
  $("#out-creator").textContent = usd(s.creatorCut);
  $("#out-community").textContent = usd(s.communityCut);
  $("#out-protocol").textContent = usd(s.protocolCut);
  const g = s.grossFee || 1;
  const parts = $$("#bar i");
  [s.creatorCut, s.communityCut, s.protocolCut].forEach((x, i) => { parts[i].style.width = `${(x / g) * 100}%`; });
}
vol.addEventListener("input", renderCalc);
rung.addEventListener("change", renderCalc);
renderCalc();

/* ---- $MADx allocation donut ---- */
const ALLOC = [
  { n: "Community & Gameplay", p: 45, note: "60-month release", c: "var(--gold)" },
  { n: "DAO Treasury", p: 15, note: "6-month cliff, 36 months", c: "var(--cyan)" },
  { n: "Liquidity", p: 15, note: "48 months", c: "var(--pink)" },
  { n: "Team & Advisors", p: 15, note: "12-month cliff, 36 months", c: "var(--green)" },
  { n: "Seed & Private", p: 10, note: "6-month cliff, 24 months", c: "var(--amber)" },
];
{
  const svg = $("#donut");
  const R = 80, C = 2 * Math.PI * R;
  let off = 0;
  for (const a of ALLOC) {
    const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    ring.setAttribute("class", "ring");
    ring.setAttribute("cx", "100"); ring.setAttribute("cy", "100"); ring.setAttribute("r", String(R));
    ring.setAttribute("stroke", a.c);
    const len = (a.p / 100) * C;
    ring.setAttribute("stroke-dasharray", `${len - 1.5} ${C - len + 1.5}`);
    ring.setAttribute("stroke-dashoffset", String(-off));
    svg.insertBefore(ring, svg.firstChild);
    off += len;
  }
  $("#alloc").innerHTML = ALLOC.map((a) => `<li><span><i class="sw" style="background:${a.c}"></i>${a.n} <span class="muted">· ${a.note}</span></span><b>${a.p}%</b></li>`).join("");
}

/* ---- IP register bar ---- */
const IP = [
  { n: 14, label: "Implemented in code", c: "var(--green)" },
  { n: 2, label: "Verified / canon", c: "var(--cyan)" },
  { n: 1, label: "New — in design", c: "var(--amber)" },
  { n: 5, label: "Conceptual / planned", c: "var(--grey)" },
  { n: 1, label: "Retired at surface", c: "var(--pink)" },
];
{
  const total = IP.reduce((s, x) => s + x.n, 0);
  $("#ip").innerHTML = IP.map((x) => `<i style="width:${(x.n / total) * 100}%;background:${x.c}">${x.n}</i>`).join("");
  $("#ip-legend").innerHTML = IP.map((x) => `<li><span><i class="sw" style="background:${x.c}"></i>${x.label}</span><b>${x.n} of ${total}</b></li>`).join("");
}

/* ---- binary vs continuous (illustrative; seeded so it never changes between visits) ---- */
const chart = $("#chart");
const W = 560, H = 220, P = 28;
function rng(seed) { let s = seed; return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296); }
function series() {
  const r = rng(188); const pts = []; let p = 0.5;
  for (let i = 0; i <= 60; i++) { p = Math.min(0.94, Math.max(0.06, p + (r() - 0.5) * 0.16 + (0.5 - p) * 0.04)); pts.push(p); }
  return pts;
}
const SER = series();
const X = (i, n) => P + (i / n) * (W - 2 * P);
const Y = (p) => H - P - p * (H - 2 * P);
function drawChart(mode, animate) {
  const n = SER.length - 1;
  let path;
  if (mode === "binary") {
    const flat = Y(0.5), end = Y(1);
    path = `M${X(0, n)},${flat} L${X(n - 1, n)},${flat} L${X(n - 1, n)},${end} L${X(n, n)},${end}`;
  } else {
    path = SER.map((p, i) => `${i ? "L" : "M"}${X(i, n).toFixed(1)},${Y(p).toFixed(1)}`).join(" ");
  }
  const colour = mode === "binary" ? "var(--grey)" : "var(--gold-hi)";
  const caption = mode === "binary" ? "One question. No price discovery until it closes." : "Priced every moment. Conviction moves as the story does.";
  chart.innerHTML = `
    <line class="ax" x1="${P}" y1="${Y(0)}" x2="${W - P}" y2="${Y(0)}"/><line class="ax" x1="${P}" y1="${Y(0.5)}" x2="${W - P}" y2="${Y(0.5)}" stroke-dasharray="4 5"/><line class="ax" x1="${P}" y1="${Y(1)}" x2="${W - P}" y2="${Y(1)}"/>
    <text class="lbl" x="${P}" y="${Y(1) - 6}">100%</text><text class="lbl" x="${P}" y="${Y(0) + 16}">time →</text><text class="lbl" x="${W - P}" y="${Y(1) - 6}" text-anchor="end">${mode === "binary" ? "resolves" : "never has to"}</text>
    <path id="line" d="${path}" fill="none" stroke="${colour}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    <text class="lbl" x="${W / 2}" y="${H - 6}" text-anchor="middle">${caption}</text>`;
  const line = $("#line", chart);
  if (animate && !reduced && line.getTotalLength) {
    const len = line.getTotalLength();
    line.style.strokeDasharray = String(len);
    line.style.strokeDashoffset = String(len);
    line.getBoundingClientRect();
    line.style.transition = "stroke-dashoffset 1.2s ease";
    line.style.strokeDashoffset = "0";
  }
}
$$("[data-mode]").forEach((b) => b.addEventListener("click", () => {
  $$("[data-mode]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  drawChart(b.dataset.mode, true);
}));
drawChart("continuous", false);

/* ---- creator hub: ladder rung and illustrative earnings (thresholds from CREATOR_LADDER in the engine) ---- */
const NEXT_RUNG_AT = 12; // tractioned markets for the 40% rung
{
  const tm = $("#tm"), cv = $("#cv");
  const render = () => {
    const n = Number(tm.value);
    const top = n >= NEXT_RUNG_AT;
    const bps = top ? 4000 : 2880;
    $("#tm-out").textContent = String(n);
    $("#rung-name").textContent = top ? "Top public rung" : "Starting rung";
    $("#rung-share").textContent = `${(bps / 100).toFixed(1)}%`;
    const pct = Math.min(1, n / NEXT_RUNG_AT) * 100;
    $("#rung-bar").style.width = `${pct}%`;
    const bar = $("#rung-bar").parentElement;
    bar.setAttribute("aria-valuenow", String(Math.min(n, NEXT_RUNG_AT)));
    $("#rung-next").textContent = top
      ? "You're on the 40% rung. Higher shares are invitation-only and limited."
      : `${NEXT_RUNG_AT - n} more tractioned market${NEXT_RUNG_AT - n === 1 ? "" : "s"} to the 40% rung`;
    const s = splitFee(Math.max(0, Number(cv.value) || 0), bps);
    $("#c-gross").textContent = usd(s.grossFee);
    $("#c-you").textContent = usd(s.creatorCut);
  };
  tm.addEventListener("input", render);
  cv.addEventListener("input", render);
  render();
}
