// Capture presentation-only screenshots via Playwright against the running
// local app. Output: thesis/figures/presentation/{demo-auth,demo-browse,
// demo-create,demo-candidates,demo-match}.png — used by build_pptx.py.
//
// These are PRESENTATION assets only; the thesis figures (figures/7-*.png) and
// the PDF stay untouched. Self-seeds the state each shot needs (a *proposed*
// match for the revealed-contacts panel, which only renders after confirming
// in-session — see MatchDetailPage).
//
//   API=http://localhost:3100 APP=http://localhost:5173 node thesis/capture_presentation.mjs
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const require = createRequire('/home/llia/.npm/_npx/9833c18b2d85bc59/');
const { chromium } = require('playwright');

const API = process.env.API ?? 'http://localhost:3100';
const APP = process.env.APP ?? 'http://localhost:5173';
const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'figures',
  'presentation',
);
mkdirSync(OUT, { recursive: true });

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

// Seed a candidates pair (lost dog + nearby found dogs) and a *proposed* cat
// match the finder will confirm through the UI to reveal contacts.
async function seed() {
  const ownerToken = await auth(OWNER);
  const finderToken = await auth(FINDER);

  const lostA = await api('/reports', {
    method: 'POST', token: ownerToken,
    body: {
      kind: 'lost', species: 'dog', name: 'Рекс', breed: 'Лабрадор',
      color: 'рудий',
      description: 'Загублений біля парку Шевченка, у синьому нашийнику.',
      contactEmail: OWNER.email, contactPhone: '+380501234567',
      lat: 46.4825, lng: 30.7233, eventDate: daysAgo(3),
    },
  });
  const nearbyFound = [
    { lat: 46.479, lng: 30.73, days: 2, color: 'рудий',
      description: 'Знайдено рудого собаку біля набережної, дружній, у нашийнику.',
      phone: '+380679876543' },
    { lat: 46.481, lng: 30.726, days: 2, color: 'рудий з білою плямою',
      description: 'Знайдено рудого собаку поблизу зупинки, без нашийника, лагідний.',
      phone: '+380631112233' },
    { lat: 46.4905, lng: 30.7185, days: 4, color: 'світло-рудий',
      description: 'Прибилася доросла собака біля майданчика, відгукується на голос.',
      phone: '+380934445566' },
  ];
  for (const f of nearbyFound) {
    await api('/reports', {
      method: 'POST', token: finderToken,
      body: {
        kind: 'found', species: 'dog', breed: 'Лабрадор', color: f.color,
        description: f.description, contactPhone: f.phone,
        lat: f.lat, lng: f.lng, eventDate: daysAgo(f.days),
      },
    });
  }

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
      kind: 'found', species: 'cat', breed: 'Британська', color: 'сірий',
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
    lostA: lostA.data.id,
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

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
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
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    locale: 'uk-UA',
  });
  await ctx.addInitScript(() => {
    try {
      window.localStorage.setItem('petfinder.locale', 'uk');
    } catch {
      /* private mode — ignored */
    }
  });
  const page = await ctx.newPage();

  // Auth — login screen (anonymous)
  await record('demo-auth', async () => {
    await page.goto(`${APP}/login`, { waitUntil: 'networkidle' });
    await settle(page);
    await shot(page, 'demo-auth');
  });

  // Public feed — anonymous, contacts hidden
  await record('demo-browse', async () => {
    await page.goto(`${APP}/browse`, { waitUntil: 'networkidle' });
    await settle(page);
    await shot(page, 'demo-browse');
  });

  // Owner session: create form + candidates
  await uiLogin(page, OWNER);
  await record('demo-create', async () => {
    await page.goto(`${APP}/report/new`, { waitUntil: 'networkidle' });
    await settle(page);
    await shot(page, 'demo-create');
  });
  await record('demo-candidates', async () => {
    await page.goto(`${APP}/reports/${ids.lostA}/candidates`, {
      waitUntil: 'networkidle',
    });
    await settle(page);
    await shot(page, 'demo-candidates');
  });

  // Finder session: open the proposed match, confirm, capture revealed contacts
  await record('demo-match', async () => {
    await uiLogin(page, FINDER);
    await page.goto(
      `${APP}/matches/${ids.proposedMatchId}?reportId=${ids.finderFoundB}`,
      { waitUntil: 'networkidle' },
    );
    await settle(page);
    const confirmBtn = page.getByRole('button', {
      name: /confirm match|підтвердити/i,
    });
    await confirmBtn.waitFor({ state: 'visible', timeout: 10000 });
    await confirmBtn.click();
    await page.waitForFunction(
      () => /revealed|розкрит|контакт/i.test(document.body.innerText),
      { timeout: 10000 },
    );
    await page.waitForTimeout(1000);
    await shot(page, 'demo-match');
  });

  await ctx.close();
  await browser.close();

  console.log('\nSummary:');
  for (const [n, r] of results) console.log(`  ${n}: ${r}`);
  const failed = results.filter(([, r]) => r !== 'ok');
  if (failed.length) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
