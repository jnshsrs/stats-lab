/* Große und kleine Zahlen · Stats Lab
   1: laufender Erfolgsanteil von fünf Praxen (Bernoulli), log-skalierte n-Achse, 95-%-Trichter.
   2: 800 fiktive Countys, Einwohner lognormal, überall dieselbe wahre Rate (20 pro 100.000), Fälle Poisson-verteilt. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const dec = (x, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const intf = x => Math.round(x).toLocaleString("de-DE");
const pct = (x, d = 1) => dec(x * 100, d) + " %";
const sgn = x => (x > 0 ? "+" : x < 0 ? "−" : "±") + intf(Math.abs(x));
const readout = (l, v) => `<div class="readout"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;
const path = pts => pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join("");
function randn() { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); }
function poisson(l) { if (l > 30) return Math.max(0, Math.round(l + Math.sqrt(l) * randn())); const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; }

/* ================= 1 Gesetz der großen Zahlen ================= */
const NMAX = 1000, PATHS = 5;
const A = { p: 0.6, runs: [] };
function runs() { A.runs = Array.from({ length: PATHS }, () => { let s = 0; const r = []; for (let i = 1; i <= NMAX; i++) { s += Math.random() < A.p ? 1 : 0; r.push(s); } return r; }); }
function draw1() {
  $("p-v").textContent = dec(A.p, 2);
  const W = 900, H = 360, L = 56, R = 20, T = 14, B = 46, lx = n => L + Math.log10(n) / 3 * (W - L - R), y = v => T + (1 - v) * (H - T - B);
  let s = "";
  for (let v = 0; v <= 1.001; v += 0.2) s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${pct(v, 0)}</text>`;
  [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].forEach(n => s += `<line x1="${lx(n)}" x2="${lx(n)}" y1="${T}" y2="${H - B}" stroke="var(--grid)"/><text x="${lx(n)}" y="${H - B + 20}" text-anchor="middle">${intf(n)}</text>`);
  s += `<text x="${(L + W - R) / 2}" y="${H - 4}" text-anchor="middle">behandelte Personen n (logarithmische Achse)</text>`;
  const up = [], lo = [];
  for (let i = 0; i <= 120; i++) { const n = Math.pow(10, i / 40), se = 1.96 * Math.sqrt(A.p * (1 - A.p) / n); up.push([lx(n), y(Math.min(1, A.p + se))]); lo.push([lx(n), y(Math.max(0, A.p - se))]); }
  s += `<path d="${path(up.concat(lo.reverse()))}Z" fill="var(--area-b)" opacity=".7"/>`;
  s += `<line x1="${L}" x2="${W - R}" y1="${y(A.p)}" y2="${y(A.p)}" stroke="var(--fg)" stroke-width="2" stroke-dasharray="8 5"/><text class="strong" x="${W - R}" y="${y(A.p) - 8}" text-anchor="end">p = ${pct(A.p, 0)}</text>`;
  const cols = ["var(--pal-3)", "var(--pal-4)", "var(--pal-5)", "var(--pal-6)", "var(--kontrolle)"];
  A.runs.forEach((r, k) => s += `<path d="${path(r.map((c, i) => [lx(i + 1), y(c / (i + 1))]))}" fill="none" stroke="${cols[k]}" stroke-width="2" stroke-opacity=".9"/>`);
  $("lln").innerHTML = s;
  const at = [10, 100, 1000];
  let t = `<thead><tr><th>Praxis</th>${at.map(n => `<th>Anteil n = ${intf(n)}</th>`).join("")}${at.map(n => `<th>Erfolge − erwartet, n = ${intf(n)}</th>`).join("")}</tr></thead><tbody>`;
  A.runs.forEach((r, k) => t += `<tr><td>Praxis ${k + 1}</td>${at.map(n => `<td>${pct(r[n - 1] / n)}</td>`).join("")}${at.map(n => `<td>${sgn(r[n - 1] - A.p * n)}</td>`).join("")}</tr>`);
  $("lln-tab").innerHTML = t + "</tbody>";
}
$("p").addEventListener("input", e => { A.p = +e.target.value; runs(); draw1(); });
$("run").onclick = () => { runs(); draw1(); };

/* ================= 2 Countys ================= */
const COLS = 40, ROWS = 20, NC = COLS * ROWS, RATE = 20 / 1e5, DEC = Math.round(NC / 10);
const C = { pop: [], cases: [], rate: [], step: 0, prevTop: null, top: [], bottom: [], overlap: null };
for (let i = 0; i < NC; i++) C.pop.push(Math.round(Math.min(3e6, Math.max(500, Math.exp(Math.log(20000) + 1.4 * randn())))));
function year() {
  C.cases = C.pop.map(p => poisson(p * RATE));
  C.rate = C.cases.map((c, i) => c / C.pop[i] * 1e5);
  const tieBreak = C.pop.map(() => Math.random());
  const idx = C.rate.map((r, i) => i);
  const desc = idx.slice().sort((a, b) => C.rate[b] - C.rate[a] || tieBreak[a] - tieBreak[b]);
  const asc = idx.slice().sort((a, b) => C.rate[a] - C.rate[b] || tieBreak[a] - tieBreak[b]);
  const newTop = desc.slice(0, DEC);
  C.overlap = C.prevTop ? newTop.filter(i => C.prevTop.includes(i)).length : null;
  C.prevTop = newTop; C.top = newTop; C.bottom = asc.slice(0, DEC);
}
const median = a => { const s = a.slice().sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const lpMin = Math.log(500), lpMax = Math.log(3e6);
function drawMap() {
  const tile = 21, gap = 1, x0 = 10, y0 = 10, step = C.step, topS = new Set(C.top), botS = new Set(C.bottom);
  let s = "";
  for (let i = 0; i < NC; i++) {
    const c = i % COLS, r = Math.floor(i / COLS), x = x0 + c * (tile + gap), y = y0 + r * (tile + gap);
    const shade = 0.06 + 0.6 * (Math.log(C.pop[i]) - lpMin) / (lpMax - lpMin);
    s += `<rect x="${x}" y="${y}" width="${tile}" height="${tile}" rx="2" fill="var(--muted)" fill-opacity="${shade.toFixed(3)}"/>`;
    if ((step === 0 || step === 2) && topS.has(i)) s += `<rect x="${x + 2}" y="${y + 2}" width="${tile - 4}" height="${tile - 4}" rx="2" fill="var(--therapie)"/>`;
    if ((step === 1 || step === 2) && botS.has(i)) s += `<rect x="${x + 2.5}" y="${y + 2.5}" width="${tile - 5}" height="${tile - 5}" rx="2" fill="var(--surface)" stroke="var(--therapie)" stroke-width="2.5"/>`;
  }
  $("map").innerHTML = s;
  $("map-lg").innerHTML = `<span><i class="sw" style="background:var(--muted);opacity:.15"></i>ländlich, wenige Einwohner</span><span><i class="sw" style="background:var(--muted);opacity:.65"></i>Stadt, viele Einwohner</span>` +
    (step !== 1 ? `<span><i class="sw" style="background:var(--therapie)"></i>höchste 10 % der Raten</span>` : "") + (step !== 0 ? `<span><i class="sw" style="background:var(--surface);border:2px solid var(--therapie)"></i>niedrigste 10 % der Raten</span>` : "");
}
function drawFunnel() {
  const W = 900, H = 400, L = 64, R = 20, T = 14, B = 48, YM = 150;
  const x = p => L + (Math.log(p) - lpMin) / (lpMax - lpMin) * (W - L - R), y = v => T + (1 - Math.min(v, YM) / YM) * (H - T - B);
  let s = "";
  for (let v = 0; v <= YM; v += 25) s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}${v === YM ? "+" : ""}</text>`;
  [1000, 10000, 100000, 1000000].forEach(p => s += `<line x1="${x(p)}" x2="${x(p)}" y1="${T}" y2="${H - B}" stroke="var(--grid)"/><text x="${x(p)}" y="${H - B + 20}" text-anchor="middle">${intf(p)}</text>`);
  s += `<text x="${(L + W - R) / 2}" y="${H - 6}" text-anchor="middle">Einwohner (logarithmische Achse)</text><text x="16" y="${(T + H - B) / 2}" transform="rotate(-90 16 ${(T + H - B) / 2})" text-anchor="middle">Fälle pro 100.000</text>`;
  const up = [], lo = [];
  for (let i = 0; i <= 100; i++) { const p = Math.exp(lpMin + i / 100 * (lpMax - lpMin)), se = Math.sqrt(p * RATE) / p * 1e5 * 1.96; up.push([x(p), y(RATE * 1e5 + se)]); lo.push([x(p), y(Math.max(0, RATE * 1e5 - se))]); }
  s += `<path d="${path(up.concat(lo.reverse()))}Z" fill="var(--area-b)" opacity=".7"/>`;
  s += `<line x1="${L}" x2="${W - R}" y1="${y(RATE * 1e5)}" y2="${y(RATE * 1e5)}" stroke="var(--fg)" stroke-width="2" stroke-dasharray="8 5"/><text class="strong" x="${W - R}" y="${y(RATE * 1e5) - 8}" text-anchor="end">wahre Rate 20</text>`;
  const topS = new Set(C.top), botS = new Set(C.bottom);
  for (let i = 0; i < NC; i++) { if (topS.has(i) || botS.has(i)) continue; s += `<circle cx="${x(C.pop[i])}" cy="${y(C.rate[i])}" r="3" fill="var(--pal-3)" fill-opacity=".6"/>`; }
  C.top.forEach(i => s += `<circle cx="${x(C.pop[i])}" cy="${y(C.rate[i])}" r="4.5" fill="var(--therapie)"/>`);
  C.bottom.forEach(i => s += `<circle cx="${x(C.pop[i])}" cy="${y(C.rate[i])}" r="4.5" fill="var(--surface)" stroke="var(--therapie)" stroke-width="2"/>`);
  $("funnel").innerHTML = s;
}
function draw2() {
  document.querySelectorAll("#steps [data-s]").forEach(b => b.className = "btn" + (+b.dataset.s === C.step ? "" : " ghost"));
  drawMap();
  $("funnel-wrap").hidden = C.step !== 2;
  if (C.step === 2) drawFunnel();
  const mAll = median(C.pop), mTop = median(C.top.map(i => C.pop[i])), mBot = median(C.bottom.map(i => C.pop[i]));
  const small = C.pop.filter(p => p < 5000).length, topSmall = C.top.filter(i => C.pop[i] < 5000).length;
  const story = [
    `Die ${DEC} Countys mit den <b>höchsten</b> Raten sind fast alle ländlich: Im Median haben sie <b>${intf(mTop)}</b> Einwohner, alle Countys zusammen ${intf(mAll)}.<br><span class="hyp">Naheliegende Erklärung: weite Wege zur Versorgung, weniger Vorsorge, mehr Rauchen, Armut.</span>`,
    `Und die ${DEC} Countys mit den <b>niedrigsten</b> Raten? Ebenfalls ländlich, im Median <b>${intf(mBot)}</b> Einwohner.<br><span class="hyp">Naheliegende Erklärung: saubere Luft, viel Bewegung, frisches Essen.</span><br>Beide Geschichten klingen plausibel. Beide können nicht gleichzeitig stimmen.`,
    `In dieser Simulation hat <b>jedes County dieselbe wahre Rate von 20 pro 100.000</b>. Kleine Countys landen allein durch Zufall oben und unten. Ein County mit 5.000 Einwohnern erwartet genau einen Fall: Bei null Fällen hat es die Rate 0, bei drei Fällen 60. Große Countys bleiben im schmalen Trichter um 20. Genau dieses Muster fand Howard Wainer bei den Nierenkrebsraten der US-Countys.`
  ];
  $("story").innerHTML = story[C.step];
  $("r2").innerHTML = readout("Median Einwohner, höchste 10 %", intf(mTop)) + readout("Median Einwohner, niedrigste 10 %", intf(mBot)) + readout("Median Einwohner, alle Countys", intf(mAll)) +
    readout("Spitzengruppe unter 5.000 Einwohnern", `${topSmall} von ${DEC}`) + readout(C.overlap === null ? "Spitzengruppe im Vorjahr" : "davon schon im Vorjahr Spitze", C.overlap === null ? "„Neues Jahr“ klicken" : `${C.overlap} von ${DEC}`);
}
$("steps").addEventListener("click", e => { const b = e.target.closest("[data-s]"); if (!b) return; C.step = +b.dataset.s; draw2(); });
$("year").onclick = () => { year(); draw2(); };

runs(); draw1(); year(); draw2();
})();
