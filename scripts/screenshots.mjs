/**
 * Browser check + screenshots against a production build.
 *
 *   npm run build && node scripts/screenshots.mjs [outDir]
 *
 * Starts `next start` on port 3123 (default admin password "admin"), visits
 * every public route (status, console errors, page errors), exercises the key
 * interactions, and saves screenshots to screenshots/<outDir>/.
 * Data files touched by the interaction tests are restored at the end.
 */
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const PORT = 3123;
const BASE = `http://localhost:${PORT}`;
const OUT = path.join(ROOT, "screenshots", process.argv[2] ?? "latest");
fs.mkdirSync(OUT, { recursive: true });

const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, "data", f), "utf8"));
const products = read("products.json").filter((p) => p.status === "published");
const news = read("news.json").filter((a) => a.status === "published");
const guides = read("guides.json").filter((g) => g.status === "published");
const phones = products.filter((p) => p.category === "phones");
const phone = phones[0];
const headphone = products.find((p) => p.category === "headphones");
const compareIds = phones.slice(0, 3).map((p) => p.slug).join(",");

// Back up data files that interaction tests may write to.
const BACKUP = ["subscribers.json", "messages.json"].map((f) => [f, fs.readFileSync(path.join(ROOT, "data", f))]);

const routes = [
  "/", "/category", ...["phones", "laptops", "tvs", "headphones", "tablets", "monitors"].map((c) => `/category/${c}`),
  ...products.map((p) => `/product/${p.slug}`),
  "/compare", `/compare?ids=${compareIds}`, "/deals", "/news", ...news.map((a) => `/news/${a.slug}`),
  "/guides", ...guides.map((g) => `/guides/${g.slug}`), "/search?q=pro", "/methodology", "/about", "/disclosure",
  "/privacy", "/terms", "/contact", "/admin/login",
];

const report = { routes: 0, failures: [], consoleErrors: [], interactions: [] };

function startServer() {
  const child = spawn("npx", ["next", "start", "-p", String(PORT)], {
    cwd: ROOT,
    shell: true,
    env: { ...process.env, PORT: String(PORT) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stderr.on("data", (d) => process.stderr.write(`[server] ${d}`));
  return child;
}

function killServer(child) {
  try {
    if (process.platform === "win32") execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: "ignore" });
    else child.kill("SIGTERM");
  } catch {
    /* already gone */
  }
}

async function waitForServer() {
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch(BASE);
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("server did not start");
}


/** Scroll through the page so scroll-reveal sections play before a full-page capture. */
async function scrollThrough(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
}

async function shot(page, route, name, { full = true } = {}) {
  await page.goto(BASE + route, { waitUntil: "load" });
  await page.waitForTimeout(1000);
  await scrollThrough(page);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: full });
}

const server = startServer();
let browser;
try {
  await waitForServer();
  browser = await chromium.launch();

  /* ---------- 1. every route: status + errors ---------- */
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  let current = "";
  page.on("console", (m) => m.type() === "error" && report.consoleErrors.push(`${current}: ${m.text()}`));
  page.on("pageerror", (e) => report.consoleErrors.push(`${current}: PAGEERROR ${e.message}`));
  for (const route of routes) {
    current = route;
    const res = await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
    report.routes++;
    if (!res || res.status() >= 400) report.failures.push(`${route} → ${res?.status()}`);
  }
  current = "/admin";
  const adminRes = await page.goto(BASE + "/admin");
  if (!page.url().includes("/admin/login")) report.failures.push(`/admin did not redirect to login (${page.url()})`);
  void adminRes;
  current = "/does-not-exist";
  const nf = await page.goto(BASE + "/this-does-not-exist");
  if (nf?.status() !== 404) report.failures.push(`404 route returned ${nf?.status()}`);

  /* ---------- 2. interactions ---------- */
  const check = (name, ok, detail = "") => report.interactions.push(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);

  // Filter changes the result count.
  current = "interaction:filter";
  await page.goto(`${BASE}/category/phones`, { waitUntil: "load" });
  const countText = async () => (await page.locator('p[aria-live="polite"]', { hasText: " of " }).first().innerText()).trim();
  const before = await countText();
  await page.locator("aside").getByRole("button", { name: /budget|flagship|mid/i }).first().click().catch(() => {});
  const tierChip = page.getByRole("group", { name: "Tier" }).getByRole("button").nth(1);
  await tierChip.click();
  await page.waitForTimeout(600);
  const after = await countText();
  check("category tier filter changes count", before !== after, `${before} → ${after}`);
  check("filter state in URL", page.url().includes("tier="), page.url());

  // Compare tray via card toggles.
  current = "interaction:compare";
  await page.goto(`${BASE}/category/phones`, { waitUntil: "load" });
  await page.evaluate(() => localStorage.removeItem("ti-compare"));
  await page.reload({ waitUntil: "load" });
  await page.locator("[data-testid=\"product-card\"]").first().waitFor({ timeout: 10000 });
  await page.waitForTimeout(1500);
  const toggles = page.locator('[data-testid="product-card"]').locator("button, label").filter({ hasText: /compare/i });
  const n = await toggles.count();
  if (n >= 2) {
    await toggles.nth(0).click();
    await toggles.nth(1).click();
    await page.waitForTimeout(500);
    const trayLink = page.getByRole("link", { name: /^compare/i }).last();
    check("compare tray appears after selecting 2", await trayLink.isVisible().catch(() => false));
    await page.screenshot({ path: path.join(OUT, "category-phones--tray.png") });
  } else check("compare toggles found on cards", false, `found ${n}`);

  // Compare page remove.
  current = "interaction:compare-remove";
  await page.goto(`${BASE}/compare?ids=${compareIds}`, { waitUntil: "load" });
  await page.waitForTimeout(2000);
  const removeBtn = page.getByRole("button", { name: /remove/i }).first();
  if (await removeBtn.count()) {
    await removeBtn.click();
    await page.waitForTimeout(1500);
    const ids = new URL(page.url()).searchParams.get("ids") ?? "";
    check("compare remove updates URL", ids.split(",").filter(Boolean).length === 2, ids);
  } else check("compare remove button exists", false);

  // Command palette.
  current = "interaction:palette";
  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.waitForTimeout(2000);
  await page.keyboard.press("Control+k");
  await page.waitForTimeout(400);
  await page.keyboard.type(phone.brand);
  await page.waitForTimeout(400);
  const dialog = page.getByRole("dialog");
  check("command palette opens with Ctrl+K", await dialog.isVisible().catch(() => false));
  await page.screenshot({ path: path.join(OUT, "palette.png") });
  await page.keyboard.press("Escape");

  // Newsletter + contact forms persist.
  current = "interaction:newsletter";
  await page.goto(BASE + "/", { waitUntil: "load" });
  const email = page.locator('footer input[type="email"]').first();
  await email.fill("screenshot-test@example.com");
  await email.press("Enter");
  await page.waitForTimeout(1200);
  check("newsletter saves subscriber", read("subscribers.json").some((s) => s.email === "screenshot-test@example.com"));

  current = "interaction:contact";
  await page.goto(BASE + "/contact", { waitUntil: "load" });
  await page.fill("#name", "Test Person");
  await page.fill("#email", "test@example.com");
  await page.selectOption("#topic", { index: 1 });
  await page.fill("#message", "This is an automated test message.");
  await page.getByRole("button", { name: /send message/i }).click();
  await page.waitForTimeout(1200);
  check("contact form saves message", read("messages.json").some((m) => m.email === "test@example.com"));
  await ctx.close();

  /* ---------- 3. screenshots ---------- */
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const dp = await desktop.newPage();
  const keyPages = [
    ["/", "home"],
    ["/category/phones", "category-phones"],
    [`/product/${phone.slug}`, "product-phone"],
    [`/product/${headphone.slug}`, "product-headphones"],
    [`/compare?ids=${compareIds}`, "compare"],
    ["/compare", "compare-empty"],
    ["/deals", "deals"],
    ["/news", "news"],
    [`/news/${news[0].slug}`, "news-article"],
    [`/guides/${guides[0].slug}`, "guide"],
    ["/methodology", "methodology"],
    ["/search?q=oled", "search"],
    ["/admin/login", "admin-login"],
  ];
  for (const [route, name] of keyPages) await shot(dp, route, `${name}--desktop`);
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  const mp = await mobile.newPage();
  for (const [route, name] of [keyPages[0], keyPages[1], ["/category/laptops", "category-laptops"], keyPages[2], keyPages[4], keyPages[6], keyPages[8]]) {
    await shot(mp, route, `${name}--mobile`);
  }
  await mobile.close();

  const dark = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await dark.addInitScript(() => localStorage.setItem("ti-theme", "dark"));
  const kp = await dark.newPage();
  for (const [route, name] of [keyPages[0], keyPages[2], keyPages[4]]) await shot(kp, route, `${name}--desktop--dark`);
  await dark.close();

  // Admin (signed in).
  const admin = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const ap = await admin.newPage();
  await ap.goto(BASE + "/admin/login", { waitUntil: "load" });
  await ap.fill("#password", "admin");
  await ap.getByRole("button", { name: /sign in/i }).click();
  await ap.waitForURL(/\/admin$/, { timeout: 15000 }).catch(() => {});
  report.interactions.push(`${ap.url().endsWith("/admin") ? "PASS" : "FAIL"} admin login — ${ap.url()}`);
  for (const [route, name] of [
    ["/admin", "admin-dashboard"],
    ["/admin/products", "admin-products"],
    [`/admin/products/${phone.id}`, "admin-product-editor"],
    ["/admin/prices", "admin-prices"],
    ["/admin/ads", "admin-ads"],
    ["/admin/settings", "admin-settings"],
    ["/admin/inbox", "admin-inbox"],
  ]) {
    const res = await ap.goto(BASE + route, { waitUntil: "load" });
    if (!res || res.status() >= 400) report.failures.push(`${route} → ${res?.status()}`);
    await ap.waitForTimeout(1000);
    await scrollThrough(ap);
    await ap.waitForTimeout(500);
    await ap.screenshot({ path: path.join(OUT, `${name}--desktop.png`), fullPage: true });
  }
  await admin.close();
} catch (e) {
  report.failures.push(`SCRIPT ERROR: ${e.stack || e}`);
} finally {
  await browser?.close();
  killServer(server);
  for (const [f, buf] of BACKUP) fs.writeFileSync(path.join(ROOT, "data", f), buf);
}

fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
