// One-off: capture thesis figures via Playwright. Self-seeding — no external
// seed step needed. Brings up exactly the state each figure needs.
//   App figures 7.1–7.4 (our app, http://localhost:5173 + API :3000)
//   Competitor figures 1.1–1.3 (live external sites, best-effort)
// Output: thesis/figures/{7-1,7-2,7-3,7-4,1-1,1-2,1-3}.png
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire('/home/llia/.npm/_npx/9833c18b2d85bc59/');
const { chromium } = require('playwright');

const API = process.env.API ?? 'http://localhost:3000';
const APP = process.env.APP ?? 'http://localhost:5173';
const FIG = path.join(path.dirname(fileURLToPath(import.meta.url)), 'figures');

const OWNER = { email: 'olena.owner@petfinder.example', password: 'Passw0rd!owner' };
const FINDER = { email: 'petro.finder@petfinder.example', password: 'Passw0rd!finder' };

async function api(pathname, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API}${pathname}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : null };
}

async function auth(creds) {
  const reg = await api('/auth/register', { method: 'POST', body: creds });
  if (reg.status === 201 || reg.status === 200) return reg.data.token;
  const login = await api('/auth/login', { method: 'POST', body: creds });
  return login.data.token;
}

const daysAgo = (d) => new Date(Date.now() - d * 86400_000).toISOString();

// Seed exactly what figures 7.3 / 7.4 need and return the ids.
async function seed() {
  const ownerToken = await auth(OWNER);
  const finderToken = await auth(FINDER);

  // Pair A — owner's lost report with a nearby found candidate (no match yet);
  // drives the candidates page (fig. 7.3).
  const lostA = await api('/reports', {
    method: 'POST',
    token: ownerToken,
    body: {
      kind: 'lost', species: 'dog', name: 'Рекс', breed: 'Лабрадор',
      color: 'рудий',
      description: 'Загублений біля парку Шевченка, у синьому нашийнику.',
      contactEmail: OWNER.email, contactPhone: '+380501234567',
      lat: 46.4825, lng: 30.7233, eventDate: daysAgo(3),
    },
  });
  await api('/reports', {
    method: 'POST', token: finderToken,
    body: {
      kind: 'found', species: 'dog', name: 'Знайдений собака',
      breed: 'Лабрадор', color: 'рудий',
      description: 'Знайдено рудого собаку біля набережної, дружній, у нашийнику.',
      contactPhone: '+380679876543',
      lat: 46.479, lng: 30.73, eventDate: daysAgo(2),
    },
  });

  // Pair B — a *proposed* match the finder will confirm through the UI
  // (fig. 7.4: confirmed link with revealed contacts).
  const lostB = await api('/reports', {
    method: 'POST', token: ownerToken,
    body: {
      kind: 'lost', species: 'cat', name: 'Мурка', breed: 'Британська',
      color: 'сірий',
      description: 'Загублена сіра кішка біля вул. Дерибасівської.',
      contactEmail: OWNER.email, contactPhone: '+380501119988',
      lat: 46.4846, lng: 30.7407, eventDate: daysAgo(4),
    },
  });
  const foundB = await api('/reports', {
    method: 'POST', token: finderToken,
    body: {
      kind: 'found', species: 'cat', name: 'Знайдена кішка',
      breed: 'Британська', color: 'сірий',
      description: 'Знайдено сіру кішку у дворі, лагідна, без нашийника.',
      contactPhone: '+380677654321',
      lat: 46.485, lng: 30.741, eventDate: daysAgo(3),
    },
  });
  const match = await api('/matches', {
    method: 'POST', token: ownerToken,
    body: { lostReportId: lostB.data.id, foundReportId: foundB.data.id },
  });

  return {
    ownerLostA: lostA.data.id,
    finderFoundB: foundB.data.id,
    proposedMatchId: match.data.id,
  };
}

async function uiLogin(page, creds) {
  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' });
  await page.getByLabel(/email|пошта/i).fill(creds.email);
  await page.getByLabel(/password|пароль/i).fill(creds.password);
  await page.getByRole('button', { name: /log in|увійти|вхід/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 });
  await page.waitForTimeout(800);
}

async function settle(page) {
  await page
    .waitForFunction(() => !/Loading|Завантаж/i.test(document.body.innerText), {
      timeout: 15000,
    })
    .catch(() => {});
  await page.waitForTimeout(1000);
}

async function dismissConsent(page) {
  const labels = [
    /прийняти/i, /погоджуюсь/i, /accept all/i, /accept/i, /i agree/i,
    /дозволити всі/i, /allow all/i, /закрити/i, /зрозуміло/i,
  ];
  for (const re of labels) {
    const btn = page.getByRole('button', { name: re }).first();
    const visible = await btn.isVisible().catch(() => false);
    if (visible) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(400);
      return;
    }
  }
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(FIG, `${name}.png`) });
  console.log(`  ✓ ${name}.png`);
}

async function main() {
  const results = [];
  const record = async (name, fn) => {
    try {
      await fn();
      results.push([name, 'ok']);
    } catch (e) {
      results.push([name, `FAIL: ${e.message}`]);
      console.log(`  ✗ ${name}: ${e.message}`);
    }
  };

  const ids = await seed();
  console.log('seeded', JSON.stringify(ids));

  const browser = await chromium.launch({
    executablePath:
      '/home/llia/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
  });

  // ---- App figures 7.1–7.4 ----
  const appCtx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
    locale: 'uk-UA',
  });
  // Force the Ukrainian catalog before any app script runs (RULES §4:
  // figures must show a Ukrainian UI). Mirrors how the auth token is seeded.
  await appCtx.addInitScript(() => {
    try {
      window.localStorage.setItem('petfinder.locale', 'uk');
    } catch {
      /* private mode — ignored */
    }
  });
  const app = await appCtx.newPage();

  // Clip to the page's content <main> (the inner, route-level main, not the
  // shell wrapper). Fewer CSS px mapped to ~160 mm in the PDF ⇒ larger
  // effective point size, clearing RULES §4's ≥10 pt rule. Falls back to a
  // full-page shot if the selector is absent.
  const shotMain = async (page, name) => {
    const main = page.locator('main').last();
    const visible = await main.isVisible().catch(() => false);
    if (visible) {
      await main.screenshot({ path: path.join(FIG, `${name}.png`) });
      console.log(`  ✓ ${name}.png (clipped)`);
      return;
    }
    await shot(page, name);
  };

  // 7.1 — public feed, anonymous (no contact data)
  await record('7-1', async () => {
    await app.goto(`${APP}/browse`, { waitUntil: 'networkidle' });
    await settle(app);
    await shotMain(app, '7-1');
  });

  // 7.2 / 7.3 — owner session
  await uiLogin(app, OWNER);
  await record('7-2', async () => {
    await app.goto(`${APP}/report/new`, { waitUntil: 'networkidle' });
    await settle(app);
    await shotMain(app, '7-2');
  });
  await record('7-3', async () => {
    await app.goto(`${APP}/reports/${ids.ownerLostA}/candidates`, {
      waitUntil: 'networkidle',
    });
    await settle(app);
    await shotMain(app, '7-3');
  });

  // 7.4 — finder session: open the *proposed* match and confirm it through
  // the UI so the revealed-contacts panel renders.
  await record('7-4', async () => {
    await uiLogin(app, FINDER);
    await app.goto(
      `${APP}/matches/${ids.proposedMatchId}?reportId=${ids.finderFoundB}`,
      { waitUntil: 'networkidle' },
    );
    await settle(app);
    const confirmBtn = app.getByRole('button', { name: /confirm match|підтвердити/i });
    await confirmBtn.waitFor({ state: 'visible', timeout: 10000 });
    await confirmBtn.click();
    await app.waitForFunction(
      () => /revealed|розкрит/i.test(document.body.innerText),
      { timeout: 10000 },
    );
    await app.waitForTimeout(1000);
    await shotMain(app, '7-4');
  });

  await appCtx.close();

  // ---- Competitor figures 1.1–1.3 (best-effort, live) ----
  const webCtx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
    locale: 'uk-UA',
    timezoneId: 'Europe/Kyiv',
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  });
  const web = await webCtx.newPage();
  const webShots = [
    { name: '1-1', url: 'https://www.pawboost.com/', scroll: 0 },
    { name: '1-2', url: 'https://petfbi.org/search.html', scroll: 0 },
    {
      name: '1-3',
      url: 'https://www.olx.ua/uk/list/q-%D0%B7%D0%B0%D0%B3%D1%83%D0%B1%D0%BB%D0%B5%D0%BD%D0%B0-%D1%81%D0%BE%D0%B1%D0%B0%D0%BA%D0%B0/',
      scroll: 520,
    },
  ];
  for (const s of webShots) {
    await record(s.name, async () => {
      await web.goto(s.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await web.waitForTimeout(2500);
      await dismissConsent(web);
      await web.waitForTimeout(1500);
      if (s.scroll) {
        await web.evaluate((y) => window.scrollTo(0, y), s.scroll);
        await web.waitForTimeout(1200);
      }
      await shot(web, s.name);
    });
  }
  await webCtx.close();
  await browser.close();

  console.log('\nSummary:');
  for (const [n, r] of results) console.log(`  ${n}: ${r}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
