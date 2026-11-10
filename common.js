// Shared by the test page and the results page.
const SHAPES = ["square", "circle", "triangle", "diamond"];
const LABEL = { square: "Square", circle: "Circle", triangle: "Triangle", diamond: "Diamond" };
const CODE = { square: "S", circle: "C", triangle: "T", diamond: "D" };
const FROM_CODE = { S: "square", C: "circle", T: "triangle", D: "diamond" };

function shapeSvg(s, colour = "currentColor") {
  const p = {
    square:   `<rect x="14" y="14" width="72" height="72" rx="4"/>`,
    circle:   `<circle cx="50" cy="50" r="38"/>`,
    triangle: `<polygon points="50,12 90,84 10,84"/>`,
    diamond:  `<polygon points="50,6 92,50 50,94 8,50"/>`
  }[s];
  return `<svg viewBox="0 0 100 100" fill="none" stroke="${colour}" stroke-width="7" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

// P(X >= k) for X ~ Binomial(n, 0.25)
function pAtLeast(k, n, p = 0.25) {
  let total = 0, c = 1;
  for (let i = 0; i <= n; i++) {
    if (i > 0) c = c * (n - i + 1) / i;
    if (i >= k) total += c * Math.pow(p, i) * Math.pow(1 - p, n - i);
  }
  return Math.min(1, total);
}
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const SB_URL = "https://eefgmxcoginhfmvutirw.supabase.co/rest/v1/rounds";
const SB_KEY = "sb_publishable_eKp08GhumMmShUMjgszw7A_B-ocGdRr";

function localRounds() {
  try { return JSON.parse(localStorage.getItem("precog.log") || "[]"); } catch (e) { return []; }
}
function saveLocal(entry) {
  try {
    const r = localRounds(); r.push(entry);
    localStorage.setItem("precog.log", JSON.stringify(r));
    return true;
  } catch (e) { return false; }
}
// ---------- players & pseudonyms ----------
// Real names are never readable from the database. Each browser keeps its own
// map of player id -> name, so people see their own name and a pseudonym for everyone else.
function myPlayers() {
  try { return JSON.parse(localStorage.getItem("precog.players") || "{}"); } catch (e) { return {}; }
}
function playerIdFor(name) {
  const map = myPlayers();
  const key = name.trim().toLowerCase();
  let id = Object.keys(map).find(k => map[k].trim().toLowerCase() === key);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID()
      : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
    map[id] = name;
    try { localStorage.setItem("precog.players", JSON.stringify(map)); } catch (e) {}
  }
  return id;
}
const ADJ = ["Amber","Azure","Bold","Bright","Calm","Cobalt","Copper","Crimson","Dapper","Dusky","Ember","Fabled","Gentle","Gilded","Hidden","Hushed","Indigo","Ivory","Jade","Keen","Lucky","Lunar","Misty","Mystic","Nimble","Noble","Opal","Quiet","Russet","Sage","Silver","Smoky","Solar","Swift","Tawny","Velvet","Violet","Wandering","Wise","Zesty"];
const NOUN = ["Badger","Comet","Crane","Falcon","Fox","Hare","Hawk","Heron","Ibis","Jackal","Kestrel","Lark","Lynx","Magpie","Marten","Moth","Newt","Oracle","Otter","Owl","Panther","Pike","Quail","Raven","Robin","Seer","Sparrow","Stag","Stoat","Swift","Tern","Tiger","Vole","Wolf","Wren","Yak","Zebra","Sphinx","Phoenix","Mantis"];
function pseudonym(seed) {
  let h = 2166136261;
  for (const ch of String(seed)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return ADJ[h % ADJ.length] + " " + NOUN[(h >>> 12) % NOUN.length];
}

function fromRow(r) {
  const mine = myPlayers();
  const own = r.player && mine[r.player];
  return { name: own ? mine[r.player] : pseudonym(r.player || r.id), mine: !!own, player: r.player,
           at: r.created_at, n: r.n, hits: r.hits, pct: Number(r.pct),
           targets: r.targets, guesses: r.guesses, salt: r.salt, seal: r.seal, id: r.id };
}
async function sbFetch(url, opts = {}, ms = 10000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(url, Object.assign({ signal: ctl.signal }, opts,
      { headers: Object.assign({ apikey: SB_KEY, Authorization: "Bearer " + SB_KEY }, opts.headers || {}) }));
    if (!res.ok) throw new Error(res.status + " " + await res.text());
    const body = await res.text();
    return body ? JSON.parse(body) : null;
  } finally { clearTimeout(t); }
}
