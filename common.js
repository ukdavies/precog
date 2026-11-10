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
function fromRow(r) {
  return { name: r.name, at: r.created_at, n: r.n, hits: r.hits, pct: Number(r.pct),
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
