// Deterministic seed for thesis screenshots (рис. 7.1–7.4).
// Registers owner + finder, creates a LOST + FOUND dog report near each other,
// proposes a match (owner) and confirms it (finder). Idempotent: falls back to
// login if the email is already taken. Prints ids for the screenshot step.
const API = process.env.API ?? 'http://localhost:3000';

const OWNER = { email: 'olena.owner@petfinder.example', password: 'Passw0rd!owner' };
const FINDER = { email: 'petro.finder@petfinder.example', password: 'Passw0rd!finder' };

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return { status: res.status, data };
}

async function auth(creds) {
  const reg = await api('/auth/register', { method: 'POST', body: creds });
  if (reg.status === 201 || reg.status === 200) return reg.data.token;
  const login = await api('/auth/login', { method: 'POST', body: creds });
  if (login.status === 200 || login.status === 201) return login.data.token;
  throw new Error(`auth failed for ${creds.email}: ${reg.status}/${login.status}`);
}

const nowMinusDays = (d) =>
  new Date(Date.now() - d * 86400_000).toISOString();

async function main() {
  const ownerToken = await auth(OWNER);
  const finderToken = await auth(FINDER);

  const lost = await api('/reports', {
    method: 'POST',
    token: ownerToken,
    body: {
      kind: 'lost',
      species: 'dog',
      name: 'Рекс',
      breed: 'Лабрадор',
      color: 'рудий',
      description: 'Загублений біля парку Шевченка, у синьому нашийнику.',
      contactEmail: OWNER.email,
      contactPhone: '+380501234567',
      lat: 46.4825,
      lng: 30.7233,
      eventDate: nowMinusDays(3),
    },
  });
  const found = await api('/reports', {
    method: 'POST',
    token: finderToken,
    body: {
      kind: 'found',
      species: 'dog',
      color: 'рудий',
      description: 'Знайдено рудого собаку біля набережної, дружній, у нашийнику.',
      contactPhone: '+380679876543',
      lat: 46.479,
      lng: 30.73,
      eventDate: nowMinusDays(2),
    },
  });
  const lostId = lost.data.id;
  const foundId = found.data.id;

  const match = await api('/matches', {
    method: 'POST',
    token: ownerToken,
    body: { lostReportId: lostId, foundReportId: foundId },
  });
  const matchId = match.data.id;

  const confirmed = await api(`/matches/${matchId}/confirm`, {
    method: 'POST',
    token: finderToken,
  });

  console.log(JSON.stringify({
    owner: OWNER, finder: FINDER,
    lostId, foundId, matchId,
    reportStatuses: { lost: lost.status, found: found.status },
    matchStatus: match.status, confirmStatus: confirmed.status,
  }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
