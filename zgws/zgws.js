/* Zentraler Grenzwertsatz, Standardfehler, Konfidenzintervall · Stats Lab
   Alle drei Abschnitte nutzen dieselben Stichproben: je Stichprobe werden Mittelwert und SD gespeichert. */
(() => {
const tz = x => String(x).replace(/\./g, "{.}").replace(/,/g, "{,}").replace(/−/g, "-");
const TB = (t, fb) => window.katex ? texBlock(t) : fb;
"use strict";

/* ---------- Mathematik (t-Quantil über die unvollständige Betafunktion) ---------- */
const LG = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
function lgamma(x) { if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x); x -= 1; let a = 0.99999999999980993; const t = x + 7.5; for (let i = 0; i < 8; i++) a += LG[i] / (x + i + 1); return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a); }
function betacf(a, b, x) { const FP = 1e-300; let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < FP) d = FP; d = 1 / d; let h = d; for (let m = 1; m <= 300; m++) { const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2)); d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; h *= d * c; aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2)); d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-14) break; } return h; }
function ibeta(x, a, b) { if (x <= 0) return 0; if (x >= 1) return 1; const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)); return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b; }
const tcdf = (t, df) => { const ib = ibeta(df / (df + t * t), df / 2, 0.5); return t >= 0 ? 1 - 0.5 * ib : 0.5 * ib; };
function tinv(p, df) { let lo = -200, hi = 200; for (let i = 0; i < 120; i++) { const m = (lo + hi) / 2; if (tcdf(m, df) < p) lo = m; else hi = m; } return (lo + hi) / 2; }
const phi = (x, m, s) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
const randn = () => { let u = 0, v = 0; while (u === 0) u = Math.random(); while (v === 0) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

/* ---------- Populationen ---------- */
const POPS = {
  schief: { short: "schief", name: "Arbeitsunfähigkeit", unit: "Tage", mu: 10, sigma: 10, lo: -2, hi: 60,
    pdf: x => x < 0 ? 0 : 0.1 * Math.exp(-x / 10), draw: () => -10 * Math.log(1 - Math.random()) },
  gleich: { short: "gleichverteilt", name: "Wartezeit", unit: "Minuten", mu: 15, sigma: 30 / Math.sqrt(12), lo: -4, hi: 34,
    pdf: x => (x >= 0 && x <= 30) ? 1 / 30 : 0, draw: () => 30 * Math.random() },
  zweigipflig: { short: "zweigipflig", name: "Schmerz, zwei Untergruppen", unit: "mm VAS", mu: 47.5, sigma: Math.sqrt(64 + 22.5 ** 2), lo: -2, hi: 102,
    pdf: x => 0.5 * phi(x, 25, 8) + 0.5 * phi(x, 70, 8), draw: () => (Math.random() < 0.5 ? 25 : 70) + 8 * randn() },
  normal: { short: "normal", name: "Körpergröße", unit: "cm", mu: 170, sigma: 10, lo: 130, hi: 210,
    pdf: x => phi(x, 170, 10), draw: () => 170 + 10 * randn() }
};

const S = { pop: "schief", n: 10, conf: 0.95 };
let means = [], sds = [], last = [];

const $ = id => document.getElementById(id);
const fmt = (x, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (x, d = 1) => (x * 100).toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }) + " %";
const intf = x => Math.round(x).toLocaleString("de-DE");
const readout = (l, v) => `<div class="readout"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;
const path = pts => pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join("");
const area = (pts, y0) => pts.length ? path(pts) + `L${pts[pts.length - 1][0].toFixed(1)},${y0}L${pts[0][0].toFixed(1)},${y0}Z` : "";
function ticks(lo, hi, target = 8) { const span = hi - lo, raw = span / target, mag = Math.pow(10, Math.floor(Math.log10(raw))); const step = [1, 2, 5, 10].map(m => m * mag).find(s => span / s <= target) || 10 * mag; const out = []; for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10)); return out; }

/* ---------- Simulation ---------- */
function sample(k) {
  const P = POPS[S.pop], n = S.n;
  for (let j = 0; j < k; j++) {
    const xs = Array.from({ length: n }, P.draw);
    const m = xs.reduce((a, b) => a + b, 0) / n;
    const s = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1));
    means.push(m); sds.push(s); last = xs;
  }
  render();
}
function reset() { means = []; sds = []; last = []; }

/* ---------- 1 ZGWS ---------- */
const L = 70, R = 900;
function drawCLT() {
  const P = POPS[S.pop], se = P.sigma / Math.sqrt(S.n);
  const sx = v => L + (v - P.lo) / (P.hi - P.lo) * (R - L);
  let s = "";
  const axisY = 440;
  for (const v of ticks(P.lo, P.hi, 10)) s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="14" y2="${axisY}" stroke="var(--grid)"/><text x="${sx(v)}" y="${axisY + 18}" text-anchor="middle">${v}</text>`;
  s += `<text x="${R}" y="${axisY + 34}" text-anchor="end">${P.name} in ${P.unit}</text>`;
  // Zeile 1: Population
  const r1 = [24, 140], N = 400;
  const pts = []; let pmax = 0;
  for (let i = 0; i <= N; i++) { const v = P.lo + (P.hi - P.lo) * i / N; const d = P.pdf(v); pmax = Math.max(pmax, d); pts.push([v, d]); }
  const sy1 = d => r1[1] - d / pmax * (r1[1] - r1[0]);
  const pp = pts.map(([v, d]) => [sx(v), sy1(d)]);
  s += `<path d="${area(pp, r1[1])}" fill="var(--area-a)" fill-opacity=".8"/><path d="${path(pp)}" fill="none" stroke="var(--fg)" stroke-width="1.5"/>`;
  s += `<text class="row-label" x="${L - 60}" y="${r1[0] + 4}">Population</text><text x="${L - 60}" y="${r1[0] + 22}">μ = ${fmt(P.mu)}</text><text x="${L - 60}" y="${r1[0] + 38}">σ = ${fmt(P.sigma)}</text>`;
  // Zeile 2: letzte Stichprobe
  const r2 = [170, 222];
  s += `<text class="row-label" x="${L - 60}" y="${r2[0] + 4}">Stichprobe</text><text x="${L - 60}" y="${r2[0] + 22}">n = ${S.n}</text>`;
  if (last.length) {
    const m = means[means.length - 1];
    last.forEach((v, i) => { const y = r2[0] + 6 + ((i * 37) % 41) / 41 * (r2[1] - r2[0] - 12); s += `<circle cx="${sx(Math.max(P.lo, Math.min(P.hi, v))).toFixed(1)}" cy="${y.toFixed(1)}" r="${S.n > 50 ? 3 : 4}" fill="var(--kontrolle)" fill-opacity=".8"/>`; });
    s += `<line x1="${sx(m)}" x2="${sx(m)}" y1="${r2[0] - 4}" y2="${r2[1] + 4}" stroke="var(--therapie)" stroke-width="3"/>`;
    s += `<text x="${sx(m) + 6}" y="${r2[0] - 6}" class="strong">x̄ = ${fmt(m)}</text>`;
  }
  // Zeile 3: Mittelwerte
  const r3 = [258, 430];
  s += `<text class="row-label" x="${L - 60}" y="${r3[0] + 4}">Mittel-</text><text class="row-label" x="${L - 60}" y="${r3[0] + 22}">werte</text><text x="${L - 60}" y="${r3[0] + 40}">${intf(means.length)}×</text>`;
  const bw = Math.max(se / 3, (P.hi - P.lo) / 260);
  const nb = Math.ceil((P.hi - P.lo) / bw), counts = new Array(nb).fill(0);
  means.forEach(m => { const b = Math.floor((m - P.lo) / bw); if (b >= 0 && b < nb) counts[b]++; });
  const peakExp = means.length * bw * phi(P.mu, P.mu, se);
  const ymax = Math.max(1, ...counts, peakExp) * 1.08;
  const sy3 = c => r3[1] - c / ymax * (r3[1] - r3[0]);
  counts.forEach((c, b) => { if (c) { const x0 = sx(P.lo + b * bw), x1 = sx(P.lo + (b + 1) * bw); s += `<rect x="${x0.toFixed(1)}" y="${sy3(c).toFixed(1)}" width="${Math.max(1, x1 - x0 - 0.5).toFixed(1)}" height="${(r3[1] - sy3(c)).toFixed(1)}" fill="var(--area-b)"/>`; } });
  if (means.length) {
    const np = []; for (let i = 0; i <= 400; i++) { const v = P.lo + (P.hi - P.lo) * i / 400; np.push([sx(v), sy3(means.length * bw * phi(v, P.mu, se))]); }
    s += `<path d="${path(np)}" fill="none" stroke="var(--therapie)" stroke-width="2.5"/>`;
  }
  s += `<line x1="${L}" x2="${R}" y1="${r3[1]}" y2="${r3[1]}" stroke="var(--line)"/>`;
  s += `<line x1="${sx(P.mu)}" x2="${sx(P.mu)}" y1="14" y2="${axisY}" stroke="var(--fg)" stroke-width="1.5" stroke-dasharray="6 5"/>`;
  s += `<text x="${sx(P.mu) + 6}" y="20" class="strong">μ</text>`;
  $("clt").innerHTML = s;
  $("clt").setAttribute("aria-label", `Population ${P.short}, ${means.length} Stichprobenmittelwerte mit n = ${S.n}`);
  const mm = means.length ? means.reduce((a, b) => a + b, 0) / means.length : null;
  const sdm = means.length > 1 ? Math.sqrt(means.reduce((a, b) => a + (b - mm) ** 2, 0) / (means.length - 1)) : null;
  $("clt-stats").innerHTML = readout("Mittelwert der Mittelwerte", mm == null ? "–" : fmt(mm, 2)) + readout("wahrer Mittelwert μ", fmt(P.mu, 2)) +
    readout("SD der Mittelwerte (simuliert)", sdm == null ? "–" : fmt(sdm, 2)) + readout("σ / √n (vorhergesagt)", fmt(se, 2));
}

/* ---------- 2 Standardfehler ---------- */
function drawSE() {
  const P = POPS[S.pop], se = P.sigma / Math.sqrt(S.n);
  const T = 20, B = 250, nmax = 100, ymax = P.sigma / Math.sqrt(2) * 1.08;
  const sx = n => L + (n - 2) / (nmax - 2) * (R - L), sy = v => B - v / ymax * (B - T);
  let s = "";
  for (const n of [2, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) s += `<line x1="${sx(n)}" x2="${sx(n)}" y1="${T}" y2="${B}" stroke="var(--grid)"/><text x="${sx(n)}" y="${B + 18}" text-anchor="middle">${n}</text>`;
  for (const v of ticks(0, ymax, 5)) s += `<line x1="${L}" x2="${R}" y1="${sy(v)}" y2="${sy(v)}" stroke="var(--grid)"/><text x="${L - 8}" y="${sy(v) + 4}" text-anchor="end">${fmt(v, v % 1 ? 1 : 0)}</text>`;
  const pts = []; for (let n = 2; n <= nmax; n += 0.5) pts.push([sx(n), sy(P.sigma / Math.sqrt(n))]);
  s += `<path d="${path(pts)}" fill="none" stroke="var(--therapie)" stroke-width="2.5"/>`;
  // Vervierfachung zeigen
  if (S.n * 4 <= nmax) {
    const se4 = P.sigma / Math.sqrt(4 * S.n);
    s += `<line x1="${sx(S.n)}" x2="${sx(4 * S.n)}" y1="${sy(se)}" y2="${sy(se)}" stroke="var(--muted)" stroke-dasharray="4 4"/>`;
    s += `<line x1="${sx(4 * S.n)}" x2="${sx(4 * S.n)}" y1="${sy(se)}" y2="${sy(se4)}" stroke="var(--muted)" stroke-dasharray="4 4"/>`;
    s += `<circle cx="${sx(4 * S.n)}" cy="${sy(se4)}" r="5" fill="var(--surface)" stroke="var(--therapie)" stroke-width="2"/>`;
    s += `<text x="${sx(4 * S.n) + 8}" y="${sy(se4) - 8}">4 · n = ${4 * S.n}: halber SE</text>`;
  }
  s += `<circle cx="${sx(S.n)}" cy="${sy(se)}" r="7" fill="var(--therapie)"/>`;
  s += `<text x="${sx(S.n) + 10}" y="${sy(se) - 10}" class="strong">n = ${S.n}: SE = ${fmt(se, 2)}</text>`;
  if (means.length >= 20) {
    const mm = means.reduce((a, b) => a + b, 0) / means.length, sdm = Math.sqrt(means.reduce((a, b) => a + (b - mm) ** 2, 0) / (means.length - 1));
    const x = sx(S.n), y = sy(Math.min(sdm, ymax));
    s += `<path d="M${x},${y - 8}L${x + 8},${y}L${x},${y + 8}L${x - 8},${y}Z" fill="var(--kontrolle)" stroke="var(--surface)" stroke-width="1.5"/>`;
  }
  s += `<line x1="${L}" x2="${R}" y1="${B}" y2="${B}" stroke="var(--line)"/>`;
  s += `<text x="${R}" y="${B + 36}" text-anchor="end">n je Stichprobe</text>`;
  s += `<text x="${L}" y="${T - 6}">Standardfehler in ${P.unit}</text>`;
  $("se").innerHTML = s;
  $("se").setAttribute("aria-label", `Standardfehler ${fmt(se, 2)} bei n = ${S.n}`);
  const lastS = sds.length ? sds[sds.length - 1] : null;
  $("se-formula").innerHTML = TB(String.raw`SE = \dfrac{\sigma}{\sqrt{n}} = \dfrac{${tz(fmt(P.sigma, 2))}}{\sqrt{${S.n}}} = ${tz(fmt(se, 2))}\ \text{${P.unit}}`, `<span>theoretisch: SE = σ / √n = ${fmt(P.sigma, 2)} / √${S.n}</span><span class="big">= ${fmt(se, 2)} ${P.unit}</span>`) +
    (lastS != null ? `<span class="dim">geschätzt aus der letzten Stichprobe: ${window.katex ? tex(String.raw`\widehat{SE} = s / \sqrt{n} = ${tz(fmt(lastS, 2))} / \sqrt{${S.n}} = ${tz(fmt(lastS / Math.sqrt(S.n), 2))}`) : `s / √n = ${fmt(lastS / Math.sqrt(S.n), 2)}`}</span>` : "");
  const mm = means.length ? means.reduce((a, b) => a + b, 0) / means.length : 0;
  const sdm = means.length > 1 ? Math.sqrt(means.reduce((a, b) => a + (b - mm) ** 2, 0) / (means.length - 1)) : null;
  $("se-stats").innerHTML = readout("SD einer Person (σ)", fmt(P.sigma, 2)) + readout("SE = σ / √n", fmt(se, 2)) +
    readout("SD der simulierten Mittelwerte", sdm == null ? "–" : fmt(sdm, 2)) + readout("SE bei 4 · n", fmt(P.sigma / Math.sqrt(4 * S.n), 2));
}

/* ---------- 3 Konfidenzintervall ---------- */
function drawCI() {
  const P = POPS[S.pop], n = S.n, tq = tinv(1 - (1 - S.conf) / 2, n - 1);
  const show = Math.min(60, means.length), start = means.length - show;
  const half = i => tq * sds[i] / Math.sqrt(n);
  let maxDev = 3 * P.sigma / Math.sqrt(n);
  for (let i = start; i < means.length; i++) maxDev = Math.max(maxDev, Math.abs(means[i] - P.mu) + half(i));
  maxDev *= 1.05;
  const lo = P.mu - maxDev, hi = P.mu + maxDev, T = 16, rowH = 6.2, B = T + 60 * rowH + 8;
  const sx = v => L + (v - lo) / (hi - lo) * (R - L);
  let s = "";
  for (const v of ticks(lo, hi, 10)) s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${T}" y2="${B}" stroke="var(--grid)"/><text x="${sx(v)}" y="${B + 18}" text-anchor="middle">${fmt(v, Math.abs(v) < 10 && v % 1 ? 1 : 0)}</text>`;
  for (let j = 0; j < show; j++) {
    const i = start + j, y = T + j * rowH + 3, h = half(i), hit = Math.abs(means[i] - P.mu) <= h;
    const col = hit ? "var(--area-a)" : "var(--therapie)";
    s += `<line x1="${sx(means[i] - h).toFixed(1)}" x2="${sx(means[i] + h).toFixed(1)}" y1="${y}" y2="${y}" stroke="${col}" stroke-width="${hit ? 2.5 : 4.5}" stroke-linecap="round"/>`;
    s += `<circle cx="${sx(means[i]).toFixed(1)}" cy="${y}" r="${hit ? 2.4 : 3.2}" fill="${hit ? "var(--surface)" : "var(--therapie)"}" stroke="${col}" stroke-width="1.5"/>`;
  }
  if (!show) s += `<text x="${(L + R) / 2}" y="${(T + B) / 2}" text-anchor="middle">Noch keine Stichproben. Oben „1 Stichprobe“ drücken.</text>`;
  s += `<line x1="${sx(P.mu)}" x2="${sx(P.mu)}" y1="${T - 6}" y2="${B}" stroke="var(--fg)" stroke-width="2" stroke-dasharray="6 5"/>`;
  s += `<text x="${sx(P.mu) + 6}" y="${T - 2}" class="strong">μ = ${fmt(P.mu)}</text>`;
  s += `<text x="${L - 8}" y="${T + 10}" text-anchor="end">älter</text><text x="${L - 8}" y="${B - 4}" text-anchor="end">neueste</text>`;
  s += `<text x="${R}" y="${B + 36}" text-anchor="end">${P.name} in ${P.unit}</text>`;
  $("ci").innerHTML = s;
  let hits = 0; for (let i = 0; i < means.length; i++) if (Math.abs(means[i] - P.mu) <= half(i)) hits++;
  const cov = means.length ? hits / means.length : null;
  $("ci").setAttribute("aria-label", `Konfidenzintervalle: ${hits} von ${means.length} enthalten μ`);
  const k = means.length - 1;
  $("ci-formula").innerHTML = k >= 0
    ? TB(String.raw`\bar{x} \pm t_{${n - 1};\,${tz(fmt(1 - (1 - S.conf) / 2, 3))}} \cdot \dfrac{s}{\sqrt{n}} = ${tz(fmt(means[k], 2))} \pm ${tz(fmt(tq, 3))} \cdot \dfrac{${tz(fmt(sds[k], 2))}}{\sqrt{${n}}} = \bigl[\,${tz(fmt(means[k] - half(k), 2))}\,;\ ${tz(fmt(means[k] + half(k), 2))}\,\bigr]\ \text{${P.unit}}`, `<span>letzte Stichprobe: x̄ ± t · s / √n</span><span class="big">= [${fmt(means[k] - half(k), 2)} ; ${fmt(means[k] + half(k), 2)}] ${P.unit}</span>`)
    : TB(String.raw`\bar{x} \pm t \cdot \dfrac{s}{\sqrt{n}}`, `<span>x̄ ± t · s / √n</span>`);
  $("ci-stats").innerHTML = readout("Intervalle insgesamt", intf(means.length)) + readout("enthalten μ", cov == null ? "–" : pct(cov)) +
    readout("Soll (Konfidenzniveau)", pct(S.conf, 0)) + readout(`t-Wert bei df = ${n - 1}`, fmt(tq, 3));
  $("ci-level-text").textContent = pct(S.conf, 0);
}

/* ---------- Gesamt ---------- */
function render() {
  $("n-v").textContent = S.n;
  $("count").textContent = `${intf(means.length)} Stichproben à n = ${S.n}`;
  drawCLT(); drawSE(); drawCI();
}

$("pop-seg").innerHTML = Object.entries(POPS).map(([k, P]) => `<button type="button" data-pop="${k}" aria-pressed="${k === S.pop}">${P.short}<br><small>${P.name}</small></button>`).join("");
document.querySelectorAll("[data-pop]").forEach(b => b.addEventListener("click", () => {
  S.pop = b.dataset.pop; document.querySelectorAll("[data-pop]").forEach(x => x.setAttribute("aria-pressed", x === b));
  reset(); sample(200);
}));
document.querySelectorAll("[data-conf]").forEach(b => b.addEventListener("click", () => {
  S.conf = +b.dataset.conf; document.querySelectorAll("[data-conf]").forEach(x => x.setAttribute("aria-pressed", x === b)); render();
}));
let nTimer = null;
$("n").addEventListener("input", e => {
  S.n = +e.target.value; $("n-v").textContent = S.n;
  clearTimeout(nTimer); nTimer = setTimeout(() => { reset(); sample(200); }, 60);
});
$("s1").addEventListener("click", () => sample(1));
$("s100").addEventListener("click", () => sample(100));
$("s1000").addEventListener("click", () => sample(1000));
$("reset").addEventListener("click", () => { reset(); render(); });

sample(200);
})();
