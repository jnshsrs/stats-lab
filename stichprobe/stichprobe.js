/* Stichprobe und Population · Stats Lab
   Feste Population (population.js, dieselben 2.000 Personen wie in daten/). Gezogen wird ohne Zurücklegen.
   Je Stichprobe werden Mittelwert und SD gespeichert, die letzten acht Stichproben zusätzlich mit ihren Personen. */
(() => {
"use strict";

const D = window.STICHPROBE_POP;
const X = D.bizeps.map(v => v / 10), N = X.length;
const MU = X.reduce((a, b) => a + b, 0) / N;
const SIGMA = Math.sqrt(X.reduce((a, b) => a + (b - MU) ** 2, 0) / N);
const LO = 20, HI = 46, L = 70, R = 900, UNIT = "cm";
const sx = v => L + (v - LO) / (HI - LO) * (R - L);

const S = { n: 10 };
let means = [], sds = [], hist = [], fresh = false;
const idx = Array.from({ length: N }, (_, i) => i);

const $ = id => document.getElementById(id);
const fmt = (x, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const intf = x => Math.round(x).toLocaleString("de-DE");
const readout = (l, v, key) => `<div class="readout${key ? " key" : ""}"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;
const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
const sd = a => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)); };
const path = pts => pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join("");

/* feste Lage jeder Person in der Punktwolke: Höhe folgt der Dichte, damit die Wolke die Verteilung zeigt */
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const BW = 0.6;
const dens = v => { let s = 0; for (let i = 0; i < N; i += 4) s += Math.exp(-0.5 * ((v - X[i]) / BW) ** 2); return s; };
const grid = []; for (let v = LO; v <= HI + 1e-9; v += 0.25) grid.push(dens(v));
const gmax = Math.max(...grid);
const densAt = v => grid[Math.max(0, Math.min(grid.length - 1, Math.round((v - LO) / 0.25)))] / gmax;
const JY = X.map(v => (rnd() * 2 - 1) * (0.12 + 0.88 * densAt(v)));

/* ---------- Ziehen ohne Zurücklegen ---------- */
function draw(k) {
  const n = S.n;
  for (let j = 0; j < k; j++) {
    for (let i = 0; i < n; i++) { const r = i + Math.floor(Math.random() * (N - i)); const t = idx[i]; idx[i] = idx[r]; idx[r] = t; }
    const pick = idx.slice(0, n), xs = pick.map(i => X[i]);
    means.push(mean(xs)); sds.push(sd(xs));
    hist.push(pick); if (hist.length > 8) hist.shift();
  }
  fresh = k === 1;
  render();
}
function reset() { means = []; sds = []; hist = []; }

function axis(y, label) {
  let s = "";
  for (let v = LO; v <= HI; v += 2) s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${y}" y2="${y + 5}" stroke="var(--line)"/><text x="${sx(v)}" y="${y + 20}" text-anchor="middle">${v}</text>`;
  s += `<line x1="${L}" x2="${R}" y1="${y}" y2="${y}" stroke="var(--line)"/>`;
  if (label) s += `<text x="${R}" y="${y + 38}" text-anchor="end">Bizepsumfang in ${UNIT}</text>`;
  return s;
}

/* ---------- 1 Population ---------- */
function drawPop() {
  const C = 135, H = 105, A = 262, last = hist.length ? hist[hist.length - 1] : [];
  let s = `<rect x="${sx(MU - SIGMA)}" y="20" width="${sx(MU + SIGMA) - sx(MU - SIGMA)}" height="${A - 20}" fill="var(--highlight)" stroke="var(--accent-soft)" stroke-dasharray="3 4"/>`;
  s += `<text x="${sx(MU - SIGMA) + 6}" y="34">μ − σ</text><text x="${sx(MU + SIGMA) - 6}" y="34" text-anchor="end">μ + σ</text>`;
  for (let i = 0; i < N; i++) s += `<circle cx="${sx(X[i]).toFixed(1)}" cy="${(C + JY[i] * H).toFixed(1)}" r="2.3" fill="var(--area-a)"/>`;
  s += `<line x1="${sx(MU)}" x2="${sx(MU)}" y1="20" y2="${A}" stroke="var(--fg)" stroke-width="1.5" stroke-dasharray="6 5"/>`;
  s += `<text x="${sx(MU) + 6}" y="16" class="strong">μ = ${fmt(MU, 2)}</text>`;
  for (const i of last) s += `<circle class="${fresh ? "pick" : ""}" cx="${sx(X[i]).toFixed(1)}" cy="${(C + JY[i] * H).toFixed(1)}" r="5.5" fill="var(--therapie)" stroke="var(--surface)" stroke-width="1.5"/>`;
  s += `<text class="row-label" x="${L - 60}" y="${C - 6}">N =</text><text class="row-label" x="${L - 60}" y="${C + 12}">2.000</text>`;
  s += axis(A, true);
  $("pop").innerHTML = s;
  $("pop").setAttribute("aria-label", `Population aus ${intf(N)} Personen, μ = ${fmt(MU, 2)} ${UNIT}, σ = ${fmt(SIGMA, 2)} ${UNIT}` + (last.length ? `, ${last.length} Personen gezogen` : ""));
  $("pop-stats").innerHTML = readout("Personen in der Population", intf(N)) + readout("wahrer Mittelwert μ", fmt(MU, 2) + " " + UNIT) +
    readout("wahre Standardabweichung σ", fmt(SIGMA, 2) + " " + UNIT, true) + readout("kleinster bis größter Wert", `${fmt(Math.min(...X))} bis ${fmt(Math.max(...X))}`);
}

/* ---------- 2 Stichproben als Zeilen ---------- */
function drawRows() {
  const T = 22, rowH = 32, A = T + 8 * rowH + 10;
  let s = "";
  for (let v = LO; v <= HI; v += 2) s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${T - 8}" y2="${A}" stroke="var(--grid)"/>`;
  const off = 8 - hist.length;
  hist.forEach((pick, j) => {
    const y = T + (off + j) * rowH + rowH / 2, newest = j === hist.length - 1, m = mean(pick.map(i => X[i]));
    pick.forEach((i, k) => { const dy = (((k * 37) % 11) / 10 - 0.5) * 14; s += `<circle cx="${sx(X[i]).toFixed(1)}" cy="${(y + dy).toFixed(1)}" r="${S.n > 40 ? 2.8 : 3.8}" fill="${newest ? "var(--therapie)" : "var(--kontrolle)"}" fill-opacity="${newest ? .9 : .55}"/>`; });
    s += `<line x1="${sx(m)}" x2="${sx(m)}" y1="${y - 13}" y2="${y + 13}" stroke="${newest ? "var(--therapie)" : "var(--fg)"}" stroke-width="${newest ? 4 : 2.5}"/>`;
    s += `<text x="${L - 8}" y="${y + 4}" text-anchor="end" class="${newest ? "ink" : ""}">x̄ = ${fmt(m)}</text>`;
  });
  if (!hist.length) s += `<text x="${(L + R) / 2}" y="${(T + A) / 2}" text-anchor="middle">Noch keine Stichprobe. Oben „1 Stichprobe ziehen“ drücken.</text>`;
  s += `<line x1="${sx(MU)}" x2="${sx(MU)}" y1="${T - 10}" y2="${A}" stroke="var(--fg)" stroke-width="1.5" stroke-dasharray="6 5"/>`;
  s += `<text x="${sx(MU) + 6}" y="${T - 12}" class="strong">μ = ${fmt(MU, 2)}</text>`;
  s += axis(A, true);
  $("rows").innerHTML = s;
  $("rows").setAttribute("aria-label", `Die letzten ${hist.length} Stichproben mit je ${S.n} Personen und ihren Mittelwerten`);
  const k = means.length - 1;
  $("sample-stats").innerHTML = readout("Personen in der Stichprobe", `n = ${S.n}`) +
    readout("Mittelwert x̄ (letzte)", k < 0 ? "–" : fmt(means[k], 2) + " " + UNIT, true) +
    readout("Standardabweichung s (letzte)", k < 0 ? "–" : fmt(sds[k], 2) + " " + UNIT) +
    readout("Stichprobenfehler x̄ − μ", k < 0 ? "–" : (means[k] - MU >= 0 ? "+" : "−") + fmt(Math.abs(means[k] - MU), 2) + " " + UNIT);
}

/* ---------- 3 Zwei Arten von Streuung ---------- */
function bars(vals, bw, base, top, fill) {
  const nb = Math.ceil((HI - LO) / bw), c = new Array(nb).fill(0);
  vals.forEach(v => { const b = Math.floor((v - LO) / bw); if (b >= 0 && b < nb) c[b]++; });
  const mx = Math.max(1, ...c); let s = "";
  c.forEach((k, b) => { if (k) { const x0 = sx(LO + b * bw), x1 = sx(LO + (b + 1) * bw), h = k / mx * (base - top); s += `<rect x="${x0.toFixed(1)}" y="${(base - h).toFixed(1)}" width="${Math.max(1, x1 - x0 - 0.6).toFixed(1)}" height="${h.toFixed(1)}" fill="${fill}"/>`; } });
  return s;
}
function bracket(m, d, y, label) {
  const a = sx(m - d), b = sx(m + d);
  return `<path d="M${a},${y - 6}L${a},${y}L${b},${y}L${b},${y - 6}" fill="none" stroke="var(--fg)" stroke-width="2"/><text x="${b + 8}" y="${y + 4}" class="strong">${label}</text>`;
}
function drawTwo() {
  const se = SIGMA / Math.sqrt(S.n);
  let s = "";
  for (let v = LO; v <= HI; v += 2) s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="14" y2="318" stroke="var(--grid)"/>`;
  s += `<text class="row-label" x="${L - 60}" y="40">Personen</text><text x="${L - 60}" y="58">2.000</text>`;
  s += bars(X, 0.5, 140, 20, "var(--area-a)");
  s += `<line x1="${L}" x2="${R}" y1="140" y2="140" stroke="var(--line)"/>`;
  s += bracket(MU, SIGMA, 158, `± σ = ${fmt(SIGMA, 2)}`);
  s += `<text class="row-label" x="${L - 60}" y="200">Mittel-</text><text class="row-label" x="${L - 60}" y="218">werte</text><text x="${L - 60}" y="236">${intf(means.length)}×</text>`;
  if (means.length >= 2) {
    s += bars(means, Math.max(se / 4, 0.1), 300, 186, "var(--therapie)");
    const sdm = sd(means);
    s += bracket(mean(means), sdm, 318, `± SD der Mittelwerte = ${fmt(sdm, 2)}`);
  } else {
    s += `<text x="${(L + R) / 2}" y="250" text-anchor="middle">Noch zu wenige Mittelwerte. Oben „100“ oder „1.000“ drücken.</text>`;
  }
  s += `<line x1="${L}" x2="${R}" y1="300" y2="300" stroke="var(--line)"/>`;
  s += `<line x1="${sx(MU)}" x2="${sx(MU)}" y1="14" y2="318" stroke="var(--fg)" stroke-width="1.5" stroke-dasharray="6 5"/><text x="${sx(MU) + 6}" y="12" class="strong">μ</text>`;
  for (let v = LO; v <= HI; v += 2) s += `<text x="${sx(v)}" y="342" text-anchor="middle">${v}</text>`;
  s += `<text x="${R}" y="360" text-anchor="end">Bizepsumfang in ${UNIT}</text>`;
  $("two").innerHTML = s;
  const sdm = means.length >= 2 ? sd(means) : null;
  $("two").setAttribute("aria-label", `Streuung der Personen σ = ${fmt(SIGMA, 2)}, Streuung der Mittelwerte ${sdm == null ? "noch unbekannt" : fmt(sdm, 2)}`);
  $("two-stats").innerHTML = readout("Streuung der Personen σ", fmt(SIGMA, 2) + " " + UNIT) +
    readout("SD der Mittelwerte (simuliert)", sdm == null ? "–" : fmt(sdm, 2) + " " + UNIT, true) +
    readout("σ / √n (vorhergesagt)", fmt(se, 2) + " " + UNIT) + readout("gezogene Stichproben", intf(means.length));
}

/* ---------- 3b Streuung gegen n ---------- */
function drawVsN() {
  const T = 26, B = 250, nmax = 100, ymax = SIGMA * 1.18, se = SIGMA / Math.sqrt(S.n);
  const px = n => L + (n - 2) / (nmax - 2) * (R - L), py = v => B - v / ymax * (B - T);
  let s = "";
  for (const n of [2, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) s += `<line x1="${px(n)}" x2="${px(n)}" y1="${T}" y2="${B}" stroke="var(--grid)"/><text x="${px(n)}" y="${B + 18}" text-anchor="middle">${n}</text>`;
  for (let v = 0; v <= ymax; v += 1) s += `<line x1="${L}" x2="${R}" y1="${py(v)}" y2="${py(v)}" stroke="var(--grid)"/><text x="${L - 8}" y="${py(v) + 4}" text-anchor="end">${v}</text>`;
  s += `<line x1="${px(2)}" x2="${px(nmax)}" y1="${py(SIGMA)}" y2="${py(SIGMA)}" stroke="var(--kontrolle)" stroke-width="3"/>`;
  const lab = S.n > 55 ? { x: px(14), a: "start", n: 22 } : { x: R, a: "end", n: nmax };
  s += `<text x="${lab.x}" y="${py(SIGMA) - 10}" text-anchor="${lab.a}">Personen: σ bleibt ${fmt(SIGMA, 2)}</text>`;
  const pts = []; for (let n = 2; n <= nmax; n += 0.5) pts.push([px(n), py(SIGMA / Math.sqrt(n))]);
  s += `<path d="${path(pts)}" fill="none" stroke="var(--therapie)" stroke-width="3"/>`;
  s += `<text x="${lab.a === "end" ? R : px(lab.n) + 8}" y="${py(SIGMA / Math.sqrt(lab.n)) - 10}" text-anchor="${lab.a}" class="ink">Mittelwerte: σ / √n schrumpft</text>`;
  s += `<line x1="${px(S.n)}" x2="${px(S.n)}" y1="${T}" y2="${B}" stroke="var(--fg)" stroke-dasharray="3 4"/>`;
  s += `<circle cx="${px(S.n)}" cy="${py(SIGMA)}" r="6" fill="var(--kontrolle)"/>`;
  s += `<circle cx="${px(S.n)}" cy="${py(se)}" r="7" fill="var(--therapie)"/>`;
  const right = S.n < 70;
  s += `<text x="${px(S.n) + (right ? 14 : -14)}" y="${py(se) - 14}" text-anchor="${right ? "start" : "end"}" class="strong">n = ${S.n}: SE = ${fmt(se, 2)}</text>`;
  const dia = (x, y) => `<path d="M${x},${y - 8}L${x + 8},${y}L${x},${y + 8}L${x - 8},${y}Z" fill="var(--kontrolle-ink)" stroke="var(--surface)" stroke-width="1.5"/>`;
  if (means.length >= 20) { s += dia(px(S.n), py(Math.min(sd(means), ymax))); s += dia(px(S.n), py(Math.min(mean(sds), ymax))); }
  s += `<line x1="${L}" x2="${R}" y1="${B}" y2="${B}" stroke="var(--line)"/>`;
  s += `<text x="${R}" y="${B + 38}" text-anchor="end">Stichprobengröße n</text><text x="${L}" y="${T - 10}">Streuung in ${UNIT}</text>`;
  $("vsn").innerHTML = s;
  $("vsn").setAttribute("aria-label", `Bei n = ${S.n}: σ = ${fmt(SIGMA, 2)}, Standardfehler ${fmt(se, 2)}`);
  const n4 = 4 * S.n;
  $("se-formula").innerHTML = `<span>SE = σ / √n = ${fmt(SIGMA, 2)} / √${S.n}</span><span class="big">= ${fmt(se, 2)} ${UNIT}</span>` +
    `<span>bei 4 · n = ${n4}: ${fmt(SIGMA, 2)} / √${n4} = ${fmt(SIGMA / Math.sqrt(n4), 2)} ${UNIT}, also halb so groß</span>` +
    (means.length >= 20 ? `<span>simuliert: mittleres s der Stichproben = ${fmt(mean(sds), 2)}, SD der Mittelwerte = ${fmt(sd(means), 2)}</span>` : "");
}

/* ---------- Gesamt ---------- */
function render() {
  $("n-v").textContent = S.n;
  $("count").textContent = means.length ? `${intf(means.length)} Stichproben à n = ${S.n} gezogen` : `Noch keine Stichprobe gezogen`;
  drawPop(); drawRows(); drawTwo(); drawVsN();
  fresh = false;
}

let nTimer = null;
$("n").addEventListener("input", e => {
  S.n = +e.target.value; $("n-v").textContent = S.n;
  clearTimeout(nTimer); nTimer = setTimeout(() => { reset(); draw(1); }, 80);
});
$("s1").addEventListener("click", () => draw(1));
$("s10").addEventListener("click", () => draw(10));
$("s100").addEventListener("click", () => draw(100));
$("s1000").addEventListener("click", () => draw(1000));
$("reset").addEventListener("click", () => { reset(); render(); });

draw(1);
})();
