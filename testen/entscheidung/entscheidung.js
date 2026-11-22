/* Entscheidungstheorie · Stats Lab
   Zwei-Gruppen-t-Test: Power über die nichtzentrale t-Verteilung (numerische Integration über Chi-Quadrat).
   Gedankenexperiment: erwarteter jährlicher Schaden durch α- und β-Fehler in Abhängigkeit von α. */
(() => {
"use strict";

/* ---------- Mathematik ---------- */
const LG = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
function lgamma(x) { if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x); x -= 1; let a = 0.99999999999980993; const t = x + 7.5; for (let i = 0; i < 8; i++) a += LG[i] / (x + i + 1); return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a); }
function betacf(a, b, x) { const FP = 1e-300; let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < FP) d = FP; d = 1 / d; let h = d; for (let m = 1; m <= 300; m++) { const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2)); d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; h *= d * c; aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2)); d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-14) break; } return h; }
function ibeta(x, a, b) { if (x <= 0) return 0; if (x >= 1) return 1; const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)); return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b; }
const tcdf = (t, df) => { const ib = ibeta(df / (df + t * t), df / 2, 0.5); return t >= 0 ? 1 - 0.5 * ib : 0.5 * ib; };
const tpdf = (t, df) => Math.exp(lgamma((df + 1) / 2) - lgamma(df / 2) - 0.5 * Math.log(df * Math.PI) - ((df + 1) / 2) * Math.log(1 + t * t / df));
function tinv(p, df) { let lo = -60, hi = 60; for (let i = 0; i < 90; i++) { const m = (lo + hi) / 2; if (tcdf(m, df) < p) lo = m; else hi = m; } return (lo + hi) / 2; }
function erf(x) { const s = x < 0 ? -1 : 1; x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)); }
const Phi = x => 0.5 * (1 + erf(x / Math.SQRT2));
const phi = x => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
const quadCache = new Map();
function quad(df) {
  if (quadCache.has(df)) return quadCache.get(df);
  const N = 300, vmax = df + 14 * Math.sqrt(2 * df) + 20, h = vmax / N, V = [], W = [], lc = -(df / 2) * Math.log(2) - lgamma(df / 2);
  let tot = 0;
  for (let i = 0; i <= N; i++) { const v = Math.max(i * h, 1e-9), dens = Math.exp(lc + (df / 2 - 1) * Math.log(v) - v / 2), sw = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2); V.push(Math.sqrt(v / df)); W.push(dens * sw * h / 3); tot += dens * sw * h / 3; }
  for (let i = 0; i < W.length; i++) W[i] /= tot;
  const q = { V, W }; quadCache.set(df, q); return q;
}
const ncPdf = (t, df, d) => { const { V, W } = quad(df); let s = 0; for (let i = 0; i < V.length; i++) s += W[i] * phi(t * V[i] - d) * V[i]; return s; };
const ncUpper = (c, df, d) => { const { V, W } = quad(df); let s = 0; for (let i = 0; i < V.length; i++) s += W[i] * (1 - Phi(c * V[i] - d)); return s; };
const ncLower = (c, df, d) => { const { V, W } = quad(df); let s = 0; for (let i = 0; i < V.length; i++) s += W[i] * Phi(c * V[i] - d); return s; };

function design(alpha, d, n, sides) {
  const df = 2 * n - 2, delta = d * Math.sqrt(n / 2);
  const tc = tinv(sides === "two" ? 1 - alpha / 2 : 1 - alpha, df);
  const power = sides === "two" ? ncUpper(tc, df, delta) + ncLower(-tc, df, delta) : ncUpper(tc, df, delta);
  return { df, delta, tc, power: Math.min(1, Math.max(0, power)), beta: 1 - Math.min(1, Math.max(0, power)) };
}

/* ---------- Zustand ---------- */
const PAT = [100, 500, 1000, 2000, 5000, 10000, 50000, 100000];
const S = { alpha: 0.05, d: 0.5, n: 64, sides: "two", studies: 100, prior: 0.2, pat: 5, harm: 0.02, cost: 3000, gain: 0.05, qv: 50000 };
const PRESETS = {
  medi: { prior: 0.1, pat: 5, harm: 0.06, cost: 8000, gain: 0.05 },
  physio: { prior: 0.3, pat: 5, harm: 0, cost: 300, gain: 0.03 },
  rare: { prior: 0.2, pat: 1, harm: 0.02, cost: 20000, gain: 0.5 }
};

const $ = id => document.getElementById(id);
const fmt = (x, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (x, d = 1) => (x * 100).toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }) + " %";
const apct = a => (a * 100).toLocaleString("de-DE", { maximumFractionDigits: a < 0.01 ? 2 : 1 }) + " %";
const mio = x => (x / 1e6).toLocaleString("de-DE", { maximumFractionDigits: x >= 1e8 ? 0 : 1 }) + " Mio. €";
const intf = x => Math.round(x).toLocaleString("de-DE");
const path = pts => pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join("");
const area = (pts, y0) => pts.length ? path(pts) + `L${pts[pts.length - 1][0].toFixed(1)},${y0}L${pts[0][0].toFixed(1)},${y0}Z` : "";
const readout = (l, v) => `<div class="readout"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;
function ticks(lo, hi, target = 8) { const span = hi - lo, raw = span / target, mag = Math.pow(10, Math.floor(Math.log10(raw))); const step = [1, 2, 5, 10].map(m => m * mag).find(s => span / s <= target) || 10 * mag; const out = []; for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10)); return out; }

// α-Regler logarithmisch: 0,1 % bis 20 %
const A_LO = Math.log10(0.001), A_HI = Math.log10(0.2);
const toAlpha = v => +Math.pow(10, A_LO + v * (A_HI - A_LO)).toPrecision(2);
const toSlider = a => (Math.log10(a) - A_LO) / (A_HI - A_LO);

/* ---------- 1 Verteilungen und Matrix ---------- */
function drawDist(r) {
  const L = 30, R = 900, T = 64, B = 250;
  const a = -5, b = Math.min(18, Math.max(6, r.delta + 4.5));
  const sx = v => L + (v - a) / (b - a) * (R - L);
  const N = 360, xs = Array.from({ length: N + 1 }, (_, i) => a + (b - a) * i / N);
  const y0 = xs.map(v => tpdf(v, r.df)), y1 = xs.map(v => ncPdf(v, r.df, r.delta));
  const ymax = Math.max(...y0, ...y1) * 1.1, sy = v => B - v / ymax * (B - T);
  const seg = (ys, lo, hi) => { const o = []; xs.forEach((v, i) => { if (v >= lo && v <= hi) o.push([sx(v), sy(ys[i])]); }); return o; };
  const lowC = S.sides === "two" ? -r.tc : -Infinity;
  let s = "";
  for (const v of ticks(a, b, 14)) s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${T}" y2="${B}" stroke="var(--grid)"/><text x="${sx(v)}" y="${B + 18}" text-anchor="middle">${v}</text>`;
  s += `<path d="${area(seg(y1, Math.max(a, lowC), r.tc), B)}" fill="var(--beta-fill)" fill-opacity=".85"/>`;
  s += `<path d="${area(seg(y1, r.tc, b), B)}" fill="var(--power-fill)" fill-opacity=".5"/>`;
  s += `<path d="${area(seg(y0, r.tc, b), B)}" fill="var(--alpha-fill)" fill-opacity=".95"/>`;
  if (S.sides === "two") s += `<path d="${area(seg(y0, a, -r.tc), B)}" fill="var(--alpha-fill)" fill-opacity=".95"/>`;
  s += `<path d="${path(xs.map((v, i) => [sx(v), sy(y0[i])]))}" fill="none" stroke="var(--kontrolle)" stroke-width="2.5"/>`;
  s += `<path d="${path(xs.map((v, i) => [sx(v), sy(y1[i])]))}" fill="none" stroke="var(--therapie)" stroke-width="2.5"/>`;
  [r.tc, S.sides === "two" ? -r.tc : null].forEach(c => { if (c != null) s += `<line x1="${sx(c)}" x2="${sx(c)}" y1="${T - 40}" y2="${B}" stroke="var(--fg)" stroke-width="1.5" stroke-dasharray="5 4"/>`; });
  s += `<text x="${sx(r.tc) + 6}" y="${T - 30}" class="strong">Schwelle t = ${fmt(r.tc, 2)}</text>`;
  s += `<text x="${sx(0)}" y="${T - 50}" text-anchor="middle" style="fill:var(--kontrolle-ink)">H0: wirkt nicht</text>`;
  if (r.delta < b - 1) s += `<text x="${sx(r.delta)}" y="${T - 50}" text-anchor="middle" style="fill:var(--therapie-ink)">H1: wirkt (d = ${fmt(S.d, 2)})</text>`;
  s += `<text x="${sx(r.tc) + 6}" y="${T - 12}" style="fill:var(--fg)">→ Entscheidung „wirkt“</text><text x="${sx(r.tc) - 6}" y="${T - 12}" text-anchor="end" style="fill:var(--fg)">„wirkt nicht“ ←</text>`;
  s += `<line x1="${L}" x2="${R}" y1="${B}" y2="${B}" stroke="var(--line)"/><text x="${R}" y="${B + 38}" text-anchor="end">Teststatistik t · df = ${r.df} · δ = ${fmt(r.delta, 2)}</text>`;
  $("dist").innerHTML = s;
  $("dist").setAttribute("aria-label", `α ${apct(S.alpha)}, β ${pct(r.beta)}, Power ${pct(r.power)}`);
  $("matrix").innerHTML = `
    <span></span><span class="mx-h">ENTSCHEIDUNG: „WIRKT NICHT“</span><span class="mx-h">ENTSCHEIDUNG: „WIRKT“</span>
    <span class="mx-r">Therapie wirkt nicht (H0)</span>
    <div class="mx-c mx-ok"><span class="v">${pct(1 - S.alpha)}</span><span class="t">richtig: unwirksame Therapie abgelehnt</span></div>
    <div class="mx-c mx-alpha"><span class="v">${apct(S.alpha)}</span><span class="t">α-Fehler: unwirksame Therapie eingeführt</span></div>
    <span class="mx-r">Therapie wirkt (H1)</span>
    <div class="mx-c mx-beta"><span class="v">${pct(r.beta)}</span><span class="t">β-Fehler: wirksame Therapie übersehen</span></div>
    <div class="mx-c mx-power"><span class="v">${pct(r.power)}</span><span class="t">Power: Wirkung erkannt</span></div>`;
}

/* ---------- 2 Power-Kurve ---------- */
function n80(alpha) { for (let n = 5; n <= 1000; n++) if (design(alpha, S.d, n, S.sides).power >= 0.8) return n; return null; }
function drawCurve(r) {
  const L = 54, R = 900, T = 16, B = 250, nmax = 300;
  const sx = n => L + (n - 5) / (nmax - 5) * (R - L), sy = p => B - p * (B - T);
  let s = "";
  [0, 0.2, 0.4, 0.6, 0.8, 1].forEach(p => { s += `<line x1="${L}" x2="${R}" y1="${sy(p)}" y2="${sy(p)}" stroke="${p === 0.8 ? "var(--fg)" : "var(--grid)"}" ${p === 0.8 ? 'stroke-dasharray="6 5"' : ""}/><text x="${L - 8}" y="${sy(p) + 4}" text-anchor="end">${p * 100} %</text>`; });
  [5, 50, 100, 150, 200, 250, 300].forEach(n => { s += `<text x="${sx(n)}" y="${B + 18}" text-anchor="middle">${n}</text>`; });
  const ns = []; for (let n = 5; n <= nmax; n += 5) ns.push(n);
  const curve = a => path(ns.map(n => [sx(n), sy(design(a, S.d, n, S.sides).power)]));
  if (Math.abs(S.alpha - 0.05) > 1e-9) s += `<path d="${curve(0.05)}" fill="none" stroke="var(--accent-soft)" stroke-width="2.5"/>`;
  s += `<path d="${curve(S.alpha)}" fill="none" stroke="var(--therapie)" stroke-width="3"/>`;
  s += `<circle cx="${sx(Math.min(S.n, nmax))}" cy="${sy(r.power)}" r="7" fill="var(--therapie)" stroke="var(--surface)" stroke-width="2"/>`;
  s += `<text x="${sx(Math.min(S.n, nmax)) + 10}" y="${sy(r.power) + 18}" class="strong">n = ${S.n}: ${pct(r.power, 0)}</text>`;
  s += `<text x="${R}" y="${sy(0.8) - 6}" text-anchor="end">80 % Power</text>`;
  s += `<line x1="${L}" x2="${R}" y1="${B}" y2="${B}" stroke="var(--line)"/><text x="${R}" y="${B + 38}" text-anchor="end">n pro Gruppe</text>`;
  $("curve").innerHTML = s;
  const nA = n80(S.alpha), n5 = n80(0.05);
  $("curve-stats").innerHTML = readout(`n für 80 % Power bei α = ${apct(S.alpha)}`, nA ? `${nA} pro Gruppe` : "> 1.000") +
    readout("n für 80 % Power bei α = 5 %", n5 ? `${n5} pro Gruppe` : "> 1.000") +
    readout("Mehraufwand gegenüber 5 %", nA && n5 ? (nA >= n5 ? "+" : "") + pct(nA / n5 - 1, 0) : "–");
}

/* ---------- 3 Gedankenexperiment ---------- */
function losses(alpha) {
  const r = design(alpha, S.d, S.n, S.sides), pat = PAT[S.pat];
  const fp = S.studies * (1 - S.prior) * alpha, fn = S.studies * S.prior * r.beta, tp = S.studies * S.prior * r.power;
  const lossA = fp * pat * (S.harm * S.qv + S.cost), lossB = fn * pat * S.gain * S.qv;
  return { fp, fn, tp, lossA, lossB, total: lossA + lossB, qalyA: fp * pat * S.harm, qalyB: fn * pat * S.gain, ppv: tp + fp > 0 ? tp / (tp + fp) : 0 };
}
function drawEcon() {
  $("studies-v").textContent = S.studies; $("prior-v").textContent = pct(S.prior, 0); $("pat-v").textContent = intf(PAT[S.pat]);
  $("harm-v").textContent = fmt(S.harm, 3) + " QALY"; $("cost-v").textContent = intf(S.cost) + " €"; $("gain-v").textContent = fmt(S.gain, 2) + " QALY"; $("qv-v").textContent = intf(S.qv) + " €";
  const cur = losses(S.alpha);
  // Kurve über α
  const grid = []; for (let i = 0; i <= 50; i++) { const a = Math.pow(10, A_LO + i / 50 * (A_HI - A_LO)); grid.push({ a, ...losses(a) }); }
  const best = grid.reduce((m, g) => g.total < m.total ? g : m, grid[0]);
  const L = 70, R = 600, T = 16, B = 270;
  const sx = a => L + (Math.log10(a) - A_LO) / (A_HI - A_LO) * (R - L);
  const ymax = Math.max(...grid.map(g => g.total), cur.total) * 1.1 || 1, sy = v => B - v / ymax * (B - T);
  let s = "";
  for (const v of ticks(0, ymax / 1e6, 5)) s += `<line x1="${L}" x2="${R}" y1="${sy(v * 1e6)}" y2="${sy(v * 1e6)}" stroke="var(--grid)"/><text x="${L - 8}" y="${sy(v * 1e6) + 4}" text-anchor="end">${fmt(v, v % 1 ? 1 : 0)}</text>`;
  [0.001, 0.005, 0.01, 0.05, 0.1, 0.2].forEach(a => { s += `<line x1="${sx(a)}" x2="${sx(a)}" y1="${T}" y2="${B}" stroke="var(--grid)"/><text x="${sx(a)}" y="${B + 18}" text-anchor="middle">${apct(a)}</text>`; });
  s += `<path d="${area(grid.map(g => [sx(g.a), sy(g.lossA)]), B)}" fill="var(--alpha-fill)" fill-opacity=".7"/>`;
  s += `<path d="${area(grid.map(g => [sx(g.a), sy(g.lossB)]), B)}" fill="var(--beta-fill)" fill-opacity=".7"/>`;
  s += `<path d="${path(grid.map(g => [sx(g.a), sy(g.total)]))}" fill="none" stroke="var(--fg)" stroke-width="2.5"/>`;
  s += `<line x1="${sx(S.alpha)}" x2="${sx(S.alpha)}" y1="${T}" y2="${B}" stroke="var(--therapie)" stroke-width="2.5"/>`;
  s += `<circle cx="${sx(S.alpha)}" cy="${sy(cur.total)}" r="6" fill="var(--therapie)" stroke="var(--surface)" stroke-width="2"/>`;
  s += `<text x="${sx(S.alpha) + (sx(S.alpha) > 480 ? -8 : 8)}" y="${T + 12}" text-anchor="${sx(S.alpha) > 480 ? "end" : "start"}" class="strong">Ihr α</text>`;
  s += `<path d="M${sx(best.a)},${sy(best.total) - 9}L${sx(best.a) + 8},${sy(best.total)}L${sx(best.a)},${sy(best.total) + 9}L${sx(best.a) - 8},${sy(best.total)}Z" fill="var(--surface)" stroke="var(--fg)" stroke-width="2"/>`;
  s += `<text x="${sx(best.a)}" y="${sy(best.total) - 16}" text-anchor="middle" class="strong">günstigstes α ≈ ${apct(best.a)}</text>`;
  s += `<line x1="${L}" x2="${R}" y1="${B}" y2="${B}" stroke="var(--line)"/>`;
  s += `<text x="${R}" y="${B + 38}" text-anchor="end">Signifikanzniveau α (logarithmisch)</text><text x="${L - 60}" y="${T - 2}">Mio. € pro Jahr</text>`;
  $("loss").innerHTML = s;
  $("loss").setAttribute("aria-label", `Erwarteter Schaden je Jahr über α, Minimum bei etwa ${apct(best.a)}`);

  $("bill").innerHTML = `
    <div class="item a"><div class="k">α-Fehler pro Jahr</div><div class="v">${fmt(cur.fp, 1)} Therapien</div><div class="s">${intf(cur.qalyA)} QALY · ${mio(cur.lossA)}</div></div>
    <div class="item b"><div class="k">β-Fehler pro Jahr</div><div class="v">${fmt(cur.fn, 1)} Therapien</div><div class="s">${intf(cur.qalyB)} QALY · ${mio(cur.lossB)}</div></div>
    <div class="item t"><div class="k">Gesamtschaden bei α = ${apct(S.alpha)}</div><div class="v">${mio(cur.total)}</div><div class="s">${intf(cur.qalyA + cur.qalyB)} verlorene QALY</div></div>
    <div class="item p"><div class="k">Eingeführte Therapien, die wirklich wirken</div><div class="v">${pct(cur.ppv, 0)}</div><div class="s">${fmt(cur.tp + cur.fp, 1)} pro Jahr eingeführt</div></div>`;
  const perA = PAT[S.pat] * (S.harm * S.qv + S.cost), perB = PAT[S.pat] * S.gain * S.qv;
  const ratio = perB > 0 ? perA / perB : Infinity;
  const diff = cur.total - best.total;
  $("econ-takeaway").innerHTML = `Ein einzelner α-Fehler kostet hier ${isFinite(ratio) ? `<b>${fmt(ratio, 1)}-mal</b> so viel` : "unendlich viel mehr"} wie ein einzelner β-Fehler. ` +
    (Math.abs(Math.log10(best.a / S.alpha)) < 0.12
      ? `Ihr α liegt nahe am günstigsten Wert (≈ ${apct(best.a)}).`
      : `Am günstigsten wäre bei diesen Annahmen <b>α ≈ ${apct(best.a)}</b>: ${mio(best.total)} statt ${mio(cur.total)} pro Jahr, also ${mio(diff)} weniger Schaden. `) +
    ` Je teurer der α-Fehler im Verhältnis zum β-Fehler und je seltener wirksame Therapien sind, desto kleiner sollte α sein.`;
}

/* ---------- 4 Quiz ---------- */
const QUIZ = [
  { q: "Sie senken α von 5 % auf 1 %, alles andere bleibt gleich. Was passiert?", a: ["β sinkt, die Power steigt.", "β steigt, die Power sinkt.", "β und Power bleiben gleich."], c: 1, why: "Eine strengere Schwelle verhindert Fehlalarme, lässt aber auch mehr echte Effekte unter der Schwelle." },
  { q: "Wie lässt sich die Power erhöhen, ohne α anzuheben?", a: ["Mehr Personen einschließen.", "Weniger Personen einschließen.", "Den Test zweiseitig statt einseitig rechnen."], c: 0, why: "Mit größerem n wird der Standardfehler kleiner, H0- und H1-Verteilung rücken auseinander." },
  { q: "Eine Studie hat 80 % Power für d = 0,5. Was heißt das?", a: ["Die Therapie wirkt mit 80 % Wahrscheinlichkeit.", "80 % aller signifikanten Ergebnisse sind richtig.", "Wenn der Effekt d = 0,5 wirklich existiert, wird H0 in 80 % solcher Studien verworfen."], c: 2, why: "Power ist bedingt auf einen angenommenen wahren Effekt. Wie viele signifikante Ergebnisse stimmen, hängt zusätzlich von der Vorab-Wahrscheinlichkeit ab (siehe Gedankenexperiment)." },
  { q: "Wann ist ein α deutlich unter 5 % besonders sinnvoll?", a: ["Wenn eine fälschlich eingeführte Therapie schwere Nebenwirkungen hat.", "Wenn die Studie sehr klein ist.", "Wenn eine übersehene Therapie Leben retten würde."], c: 0, why: "Ein kleines α schützt vor teuren Fehlalarmen. Ist dagegen der β-Fehler teuer, etwa bei einer lebensrettenden Therapie, spricht viel für ein größeres α oder eine größere Studie." }
];
function buildQuiz() {
  $("quiz").innerHTML = QUIZ.map((q, i) => `<div class="q"><p class="question">${i + 1}. ${q.q}</p><div class="answers">${q.a.map((a, j) => `<button type="button" data-q="${i}" data-j="${j}">${a}</button>`).join("")}</div><p class="feedback" id="fb${i}" aria-live="polite"></p></div>`).join("");
  $("quiz").addEventListener("click", e => {
    const b = e.target.closest("[data-q]"); if (!b) return;
    const i = +b.dataset.q, j = +b.dataset.j, q = QUIZ[i];
    document.querySelectorAll(`[data-q="${i}"]`).forEach(x => { x.classList.remove("right", "wrong"); });
    b.classList.add(j === q.c ? "right" : "wrong");
    if (j !== q.c) document.querySelector(`[data-q="${i}"][data-j="${q.c}"]`).classList.add("right");
    $("fb" + i).innerHTML = `<b>${j === q.c ? "Richtig." : "Nicht ganz."}</b> ${q.why}`;
  });
}


/* ---------- 2 Simulation: 100 Studien ---------- */
const randn = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
let simRan = false;
function legend(eff) {
  const L = (cls, txt) => `<span><i class="sw ${cls}"></i>${txt}</span>`;
  $("sim-legend").innerHTML = `<span class="lg-h">${eff ? "Die Therapie wirkt:" : "Die Therapie wirkt nicht (d = 0):"}</span>` + (eff
    ? L("sw-pow", "signifikant: Effekt gefunden (richtig, Power)") + L("sw-beta", "nicht signifikant: Effekt übersehen (β-Fehler)")
    : L("sw-alpha", "signifikant: Fehlalarm (α-Fehler)") + L("sw-empty", "nicht signifikant: richtig, kein Effekt"));
}
function clearSim(msg) { $("sim-legend") && ($("sim-legend").innerHTML = ""); simRan = false; $("tiles").innerHTML = Array.from({ length: 100 }, () => '<div class="tile"></div>').join(""); $("sim-text").textContent = msg; }
function simulate(eff) {
  const n = S.n, r = design(S.alpha, S.d, n, S.sides), d = eff ? S.d : 0, res = [];
  for (let k = 0; k < 100; k++) {
    let s1 = 0, q1 = 0, s2 = 0, q2 = 0;
    for (let i = 0; i < n; i++) { const a = randn(), b = d + randn(); s1 += a; q1 += a * a; s2 += b; q2 += b * b; }
    const m1 = s1 / n, m2 = s2 / n, v1 = (q1 - n * m1 * m1) / (n - 1), v2 = (q2 - n * m2 * m2) / (n - 1);
    const t = (m2 - m1) / Math.sqrt((v1 + v2) / n);
    res.push(S.sides === "two" ? Math.abs(t) > r.tc : t > r.tc);
  }
  const sig = res.filter(Boolean).length;
  $("tiles").innerHTML = res.map(s => `<div class="tile ${eff ? (s ? "sig" : "beta") : (s ? "sig h0" : "")}"></div>`).join("");
  legend(eff);
  $("sim-text").innerHTML = eff
    ? `<b>${sig} von 100</b> Studien finden den Effekt. Theoretische Power: <b>${pct(r.power, 0)}</b>. Die übrigen ${100 - sig} sind β-Fehler: Die Therapie wirkt, die Studie hat es übersehen.`
    : `<b>${sig} von 100</b> Studien sind signifikant, obwohl die Therapie nichts bewirkt. Jede davon ist ein α-Fehler. Erwartet: etwa ${apct(S.alpha)}. Die übrigen ${100 - sig} liegen richtig: kein Effekt, nicht signifikant.`;
  simRan = true;
}

/* ---------- Verdrahtung ---------- */
function render() {
  $("alpha-v").textContent = apct(S.alpha); $("d-v").textContent = fmt(S.d, 2); $("n-v").textContent = S.n;
  document.querySelectorAll("[data-a]").forEach(b => b.setAttribute("aria-pressed", Math.abs(+b.dataset.a - S.alpha) < 1e-9));
  document.querySelectorAll("[data-s]").forEach(b => b.setAttribute("aria-pressed", b.dataset.s === S.sides));
  const r = design(S.alpha, S.d, S.n, S.sides);
  drawDist(r); drawCurve(r); drawEcon();
}
let raf = 0;
const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); if (simRan) clearSim("Design geändert. Simulieren Sie erneut."); };

$("alpha").value = toSlider(S.alpha);
$("alpha").addEventListener("input", e => { S.alpha = toAlpha(+e.target.value); schedule(); });
document.querySelectorAll("[data-a]").forEach(b => b.addEventListener("click", () => { S.alpha = +b.dataset.a; $("alpha").value = toSlider(S.alpha); schedule(); }));
$("d").addEventListener("input", e => { S.d = +e.target.value; schedule(); });
$("n").addEventListener("input", e => { S.n = +e.target.value; schedule(); });
document.querySelectorAll("[data-s]").forEach(b => b.addEventListener("click", () => { S.sides = b.dataset.s; schedule(); }));
const ECON = ["studies", "prior", "pat", "harm", "cost", "gain", "qv"];
ECON.forEach(k => { $(k).value = S[k]; $(k).addEventListener("input", e => { S[k] = +e.target.value; document.querySelectorAll("[data-p]").forEach(x => x.setAttribute("aria-pressed", "false")); schedule(); }); });
document.querySelectorAll("[data-p]").forEach(b => b.addEventListener("click", () => {
  Object.assign(S, PRESETS[b.dataset.p]); ECON.forEach(k => { $(k).value = S[k]; });
  document.querySelectorAll("[data-p]").forEach(x => x.setAttribute("aria-pressed", x === b)); schedule();
}));

$("sim-h1").addEventListener("click", () => simulate(true));
$("sim-h0").addEventListener("click", () => simulate(false));
clearSim("Noch keine Simulation. Wählen Sie oben das Design und drücken Sie einen der Knöpfe.");
buildQuiz();
render();
})();
