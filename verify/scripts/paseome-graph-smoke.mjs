/**
 * MAD Gambit — the Paseome 3D graph, browser smoke test.
 *
 * vitest covers the maths and the model (lib/paseome-graph.test.ts) but cannot draw
 * WebGL. This drives a real headless Chrome/Edge at phone width against a RUNNING
 * server and checks what only a browser can: that the graph mounts, is not wider
 * than the screen, answers a tap, orbits only when armed, resets, stays still under
 * prefers-reduced-motion, and degrades honestly when the route fails or WebGL is
 * missing.
 *
 *   node scripts/paseome-graph-smoke.mjs --url http://localhost:3000 --user me --pass secret
 *
 * Needs nothing from npm: Node 24's global WebSocket + fetch, and any installed
 * Chrome / Edge / Chromium (set CHROME_PATH to choose one). It is not wired into CI —
 * CI has no browser, no running server and no guest login. Run it locally against a
 * production build (`next build && next start`) or a deployed preview.
 *
 * Sign-in: --user/--pass, or SMOKE_USER/SMOKE_PASS, or the first pair of GUEST_LOGINS.
 * The app is behind the beta gate, which also refuses automated user agents, so the
 * driver presents an ordinary mobile Chrome UA. This is the same private-beta sign-in
 * a person uses (POST /api/v1/beta/signin); it creates nothing.
 *
 * Flags:  --url <base>  --user <u> --pass <p>  --browser <path>
 *         --only desk|hub   (default: both)   --timeout <seconds per wait, default 180>
 * Exit:   0 all checks passed · 1 a check failed · 2 could not run (no browser / no sign-in)
 *
 * Slow on software GL, and webpack `next dev` can take minutes per page compile and
 * will time a chunk out mid-rebuild — use a production build for a trustworthy result.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/* ── args ─────────────────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const BASE = (flag("url", process.env.SMOKE_URL ?? "http://localhost:3000")).replace(/\/$/, "");
const ONLY = flag("only", "");
const WAIT_MS = Number(flag("timeout", "180")) * 1000;

function credentials() {
  const user = flag("user", process.env.SMOKE_USER);
  const pass = flag("pass", process.env.SMOKE_PASS);
  if (user && pass) return { user, pass };
  const first = (process.env.GUEST_LOGINS ?? "").split(",")[0] ?? "";
  const i = first.indexOf(":");
  return i > 0 ? { user: first.slice(0, i).trim(), pass: first.slice(i + 1) } : null;
}

function findBrowser() {
  const given = flag("browser", process.env.CHROME_PATH);
  if (given) return existsSync(given) ? given : null;
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/microsoft-edge",
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── a tiny DevTools client ───────────────────────────────────────────── */

/** Headless Chrome/Edge leave helper processes behind if only the launcher is killed. */
function killTree(proc) {
  try {
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(proc.pid), "/T", "/F"], { stdio: "ignore" });
    else proc.kill("SIGKILL");
  } catch { /* already gone */ }
}

async function launchOnce(browserPath) {
  const dir = mkdtempSync(join(tmpdir(), "paseome-smoke-"));
  const proc = spawn(
    browserPath,
    [
      "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${dir}`, "--no-first-run", "--no-default-browser-check",
      "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "about:blank",
    ],
    { stdio: "ignore" },
  );
  let port = 0;
  for (let i = 0; i < 100 && !port; i++) {
    await sleep(200);
    try { port = Number(readFileSync(join(dir, "DevToolsActivePort"), "utf8").split("\n")[0]); } catch { /* not yet */ }
  }
  if (!port) { proc.kill(); throw new Error("the browser did not open a DevTools port"); }
  // The port is written a moment before it accepts connections, so retry.
  let target;
  for (let i = 0; i < 40 && !target; i++) {
    try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json(); }
    catch { await sleep(300); }
  }
  if (!target) { killTree(proc); throw new Error("the browser's DevTools port never answered"); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  try {
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error("DevTools socket failed")); });
  } catch (e) {
    killTree(proc);
    throw e;
  }

  let id = 0;
  const pending = new Map();
  const errors = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) {
      const { res, rej } = pending.get(d.id);
      pending.delete(d.id);
      d.error ? rej(new Error(d.error.message)) : res(d.result);
    } else if (d.method === "Runtime.exceptionThrown") {
      errors.push((d.params.exceptionDetails.exception?.description ?? d.params.exceptionDetails.text ?? "").split("\n")[0]);
    }
  };
  ws.onclose = () => { for (const { rej } of pending.values()) rej(new Error("the browser closed the DevTools socket (crashed or was killed)")); pending.clear(); };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable");
  await send("Runtime.enable");

  const page = {
    errors,
    send,
    async phone(reducedMotion) {
      await send("Emulation.setDeviceMetricsOverride", { width: 393, height: 852, deviceScaleFactor: 2, mobile: true });
      await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
      await send("Emulation.setUserAgentOverride", { userAgent: MOBILE_UA });
      await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: reducedMotion ? "reduce" : "no-preference" }] });
    },
    async eval(expression) {
      const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, timeout: 30000 });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
      return r.result.value;
    },
    async goto(path) { await send("Page.navigate", { url: BASE + path }); await sleep(400); },
    async until(expression, what, ms = WAIT_MS) {
      const end = Date.now() + ms;
      while (Date.now() < end) {
        if (await page.eval(expression).catch(() => false)) return true;
        await sleep(700);
      }
      throw new Error(`timed out waiting for ${what}`);
    },
    touch: (type, pts) => send("Input.dispatchTouchEvent", { type, touchPoints: pts.map(([x, y], i) => ({ x, y, id: i })) }),
    async tap(x, y) { await page.touch("touchStart", [[x, y]]); await sleep(60); await page.touch("touchEnd", []); },
    async drag(x, y, dx, dy) {
      await page.touch("touchStart", [[x, y]]);
      for (let i = 1; i <= 10; i++) { await page.touch("touchMove", [[x + (dx * i) / 10, y + (dy * i) / 10]]); await sleep(30); }
      await page.touch("touchEnd", []);
    },
    async close() {
      try { await send("Browser.close"); } catch { /* already gone */ }
      try { ws.close(); } catch { /* ignore */ }
      killTree(proc);
      await sleep(3000); // let the OS release the browser's ports and profile before the next launch
      try { rmSync(dir, { recursive: true, force: true }); } catch { /* the browser may still hold it */ }
    },
  };
  return page;
}

/** The DevTools socket occasionally refuses a second launch straight after a close; try again. */
async function launch(browserPath) {
  let last;
  for (let i = 0; i < 3; i++) {
    try { return await launchOnce(browserPath); } catch (e) { last = e; await sleep(3000 * (i + 1)); }
  }
  throw last;
}

/* ── checks ───────────────────────────────────────────────────────────── */

let failures = 0;
function check(cond, msg) {
  console.log(`  ${cond ? "✓" : "✗"} ${msg}`);
  if (!cond) failures++;
}

const SEC = `section[aria-label="The Paseome in 3D"]`;
const labelsExpr = `[...document.querySelectorAll('${SEC} span[aria-hidden="true"]')].map(s => { const r = s.getBoundingClientRect(); return { t: s.textContent, x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; }).filter(l => /%$/.test(l.t))`;
const drift = (a, b) => Math.max(0, ...a.map((l, i) => (b[i] ? Math.max(Math.abs(l.x - b[i].x), Math.abs(l.y - b[i].y)) : 0)));

/**
 * Poll the figures until the camera has stopped. Three consecutive reads must agree: on a
 * heavy page under software GL the render loop can be slower than the poll, so two reads
 * can land on the same frame and look "still" while the camera is mid-flight.
 */
async function settle(page, ms = 60000) {
  let prev = await page.eval(labelsExpr);
  let still = 0;
  const end = Date.now() + ms;
  while (Date.now() < end) {
    await sleep(1200);
    const cur = await page.eval(labelsExpr);
    still = cur.length === prev.length && drift(prev, cur) <= 1 ? still + 1 : 0;
    prev = cur;
    if (still >= 3) return cur;
  }
  return prev;
}

async function signIn(page, who) {
  await page.goto("/beta");
  // about:blank is also 'complete', so wait for the real page before fetching from it.
  await page.until(`location.pathname === '/beta' && document.readyState === 'complete'`, "the sign-in page");
  const status = await page.eval(`fetch('/api/v1/beta/signin', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(${JSON.stringify(who)}) }).then(r => r.status)`);
  if (status !== 200) throw new Error(`sign-in answered ${status}`);
}

/** Everything that must hold once the graph is on screen. */
async function exercise(page, { reduced, badge }) {
  await page.until(`!!document.querySelector('${SEC} canvas')`, "the graph canvas");
  // The first frame (and so the node labels) can take a while on software GL; wait for it
  // rather than guessing, then put the canvas mid-screen, clear of the app's fixed bottom nav.
  await page.until(`${labelsExpr}.length >= 3`, "the nodes' figures to be drawn");
  await page.eval(`document.querySelector('${SEC} canvas').scrollIntoView({ block: 'center' })`);
  await sleep(1200);
  const m = await page.eval(`(() => {
    const s = document.querySelector('${SEC}'); const c = s.querySelector('canvas').getBoundingClientRect();
    return {
      docW: document.documentElement.scrollWidth, innerW: innerWidth, canvas: [Math.round(c.width), Math.round(c.height)],
      badge: [...s.querySelectorAll('span')].map(x => x.textContent).find(t => /^(demo|● live)/i.test(t.trim())) ?? '',
      items: s.querySelectorAll('ul[aria-label="Paseome nodes"] li').length,
    };
  })()`);
  check(m.docW <= m.innerW, `no horizontal overflow at 393px (page ${m.docW}, window ${m.innerW})`);
  check(m.canvas[0] > 200 && m.canvas[1] > 200, `canvas has a real size (${m.canvas.join("×")})`);
  check(badge.test(m.badge), `data badge reads "${m.badge}"`);
  check(m.items >= 4, `node list has ${m.items} entries (the keyboard and no-WebGL route)`);

  const home = await page.eval(labelsExpr);
  check(home.length >= 3, `${home.length} branch figures drawn on the nodes`);
  if (reduced) {
    await sleep(1800);
    check(drift(home, await page.eval(labelsExpr)) === 0, "prefers-reduced-motion: the scene is still");
  } else {
    // Wait for a frame rather than a fixed time: software GL on a heavy page can go seconds between frames.
    const moved = await page.until(`${labelsExpr}.length > 0`, "figures").then(async () => {
      for (let i = 0; i < 15; i++) {
        await sleep(800);
        if (drift(home, await page.eval(labelsExpr)) > 0) return true;
      }
      return false;
    });
    check(moved, "motion allowed: the idle spin moves the scene");
  }

  // Tap. Read the figures again first: with motion allowed the scene keeps turning, so the
  // positions read above are already stale.
  const fresh = await page.eval(labelsExpr);
  if (!fresh.length) throw new Error("no node figure to tap");
  await page.tap(fresh[0].x, fresh[0].y);
  await sleep(1500);
  const card = await page.eval(`document.querySelector('${SEC} [aria-live]').innerText`);
  const tapped = /Price/.test(card) && /[0-9]%/.test(card);
  const under = tapped ? "" : await page.eval(`(() => { const e = document.elementFromPoint(${fresh[0].x}, ${fresh[0].y}); return e ? e.tagName + '.' + String(e.className).slice(0, 50) + ' "' + (e.innerText || '').slice(0, 40).replace(/\s+/g, ' ') + '"' : 'nothing'; })()`);
  check(tapped, tapped ? "tapping a node fills the details card with its price" : `tapping a node fills the details card with its price (the tap landed on ${under})`);

  // Clear the focus, arm the canvas, and let the camera come to rest before dragging: a camera
  // still flying home would swallow the drag, and the idle spin stops once the viewer arms it.
  await page.eval(`document.querySelector('button[aria-label="Reset the view"]').click()`);
  await page.eval(`[...document.querySelectorAll('button')].find(b => /Explore in 3D/.test(b.textContent)).click()`);
  await sleep(500);
  const armed = await page.eval(`getComputedStyle(document.querySelector('${SEC} [role=img]')).touchAction`);
  check(armed === "none", `armed: the canvas takes touch (touch-action: ${armed})`);
  const settled = await settle(page);

  const mid = await page.eval(`(() => { const r = document.querySelector('${SEC} canvas').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  await page.drag(mid.x, mid.y, 120, 40);
  await sleep(1200);
  const orbited = await page.eval(labelsExpr);
  check(drift(settled, orbited) > 10, `dragging while armed orbits (${drift(settled, orbited)}px)`);

  await page.eval(`document.querySelector('button[aria-label="Reset the view"]').click()`);
  // Wait for the camera to START moving, then for it to stop. Under software GL a busy page can go
  // seconds without a frame, and 'no new frame' looks exactly like 'arrived'.
  let started = false;
  for (let i = 0; i < 40 && !started; i++) {
    await sleep(1000);
    started = drift(orbited, await page.eval(labelsExpr)) > 2;
  }
  check(started, "Reset sets the camera moving back");
  const back = await settle(page);
  // A few px of slack: a starved software-GL frame loop can stop a hair short of the exact pose.
  check(drift(settled, back) <= 8, `Reset returns to the home view (${drift(settled, back)}px off)`);
}

async function desk(who, reduced) {
  console.log(`\nDesk · /open-markets/plat-merger · ${reduced ? "reduced motion" : "motion allowed"}`);
  const browser = findBrowser();
  const page = await launch(browser);
  try {
    await page.phone(reduced);
    await signIn(page, who);
    await page.goto("/open-markets/plat-merger");
    await page.until(`[...document.querySelectorAll('button')].some(b => /Show the tree in 3D/.test(b.textContent))`, "the desk's 3D toggle");
    // The graph mounts only when its slot is near the viewport, so — like a person — scroll to the button first.
    await page.eval(`(() => { const b = [...document.querySelectorAll('button')].find(b => /Show the tree in 3D/.test(b.textContent)); b.scrollIntoView({ block: 'center' }); b.click(); })()`);
    await exercise(page, { reduced, badge: /^demo floor$/i });
    await page.eval(`(() => { const b = [...document.querySelectorAll('button')].find(b => /Hide the 3D tree/.test(b.textContent)); b.scrollIntoView({ block: 'center' }); b.click(); })()`);
    await sleep(600);
    check(await page.eval(`!document.querySelector('${SEC}')`), "Hide removes the graph again");
    check(page.errors.length === 0, `no uncaught page errors${page.errors.length ? `: ${page.errors[0]}` : ""}`);
  } finally { await page.close(); }
}

async function hub(who) {
  console.log("\nHub · /preview · the frontier route");
  const page = await launch(findBrowser());
  try {
    await page.phone(false);
    await signIn(page, who);
    await page.goto("/preview");
    await page.until(`!!document.getElementById('open-markets')`, "the hub");
    await sleep(1500);
    await page.eval(`(() => { const a = [...document.querySelectorAll('div')].find(d => d.children.length === 0 && /The Paseome · Foresight/.test(d.textContent)); a?.scrollIntoView({ block: 'start' }); window.scrollBy(0, 150); })()`);
    await exercise(page, { reduced: false, badge: /^(demo data|● live)$/i });
    const sums = await page.eval(`[...document.querySelectorAll('${SEC} div')].map(d => d.innerText).find(t => /Forward Σ/.test(t)) ?? ''`);
    check(/Forward Σ 1\.000/.test(sums) && /Counterfactual Σ 1\.000/.test(sums), "each frontier sums to 1.000");
  } finally { await page.close(); }

  console.log("\nHub · the route fails");
  const bad = await launch(findBrowser());
  try {
    await bad.phone(true);
    await signIn(bad, who);
    await bad.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `const f = window.fetch; window.fetch = (u, o) => String(u).includes('/api/v1/paseome/frontier') ? Promise.resolve(new Response('{"success":false}', { status: 503 })) : f(u, o);`,
    });
    await bad.goto("/preview");
    await bad.until(`!!document.getElementById('open-markets')`, "the hub");
    await bad.eval(`(() => { const a = [...document.querySelectorAll('div')].find(d => d.children.length === 0 && /The Paseome · Foresight/.test(d.textContent)); a?.scrollIntoView({ block: 'start' }); window.scrollBy(0, 150); })()`);
    await bad.until(`/No live Paseome data/.test(document.querySelector('${SEC}')?.innerText ?? '')`, "the empty state");
    const t = await bad.eval(`document.querySelector('${SEC}').innerText`);
    check(!(await bad.eval(`!!document.querySelector('${SEC} canvas')`)), "nothing is drawn when the route fails");
    check(/503/.test(t) && /Retry/.test(t), "the card says what failed and offers Retry");
  } finally { await bad.close(); }
}

/* ── run ──────────────────────────────────────────────────────────────── */

const who = credentials();
if (!findBrowser()) { console.error("No Chrome/Edge/Chromium found — set CHROME_PATH or pass --browser."); process.exit(2); }
if (!who) { console.error("No sign-in: pass --user/--pass, or set SMOKE_USER/SMOKE_PASS, or GUEST_LOGINS."); process.exit(2); }

console.log(`Paseome graph smoke test against ${BASE}`);
try {
  if (ONLY !== "hub") { await desk(who, false); await desk(who, true); }
  if (ONLY !== "desk") await hub(who);
} catch (e) {
  console.error(`\n✗ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
}
console.log(failures ? `\n${failures} check(s) failed.` : "\nAll checks passed.");
process.exit(failures ? 1 : 0);
