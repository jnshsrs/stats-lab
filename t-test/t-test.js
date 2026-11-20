/* t-Test-Kaskade · Stats Lab
   Rechnet alles im Browser: t-Verteilung über die unvollständige Betafunktion,
   Power über die nichtzentrale t-Verteilung (numerische Integration über die Chi-Quadrat-Verteilung). */
(() => {
"use strict";

// ---------- Mathematik ----------
const LG = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
function lgamma(x) {
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1; let a = 0.99999999999980993; const t = x + 7.5;
  for (let i = 0; i < 8; i++) a += LG[i] / (x + i + 1);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
function betacf(a, b, x) {
  const MAXIT = 300, EPS = 3e-14, FPMIN = 1e-300;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < FPMIN) d = FPMIN; d = 1 / d; let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d;
    const del = d * c; h *= del; if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}
function ibeta(x, a, b) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
}
const tcdf = (t, df) => { const ib = ibeta(df / (df + t * t), df / 2, 0.5); return t >= 0 ? 1 - 0.5 * ib : 0.5 * ib; };
const tpdf = (t, df) => Math.exp(lgamma((df + 1) / 2) - lgamma(df / 2) - 0.5 * Math.log(df * Math.PI) - ((df + 1) / 2) * Math.log(1 + t * t / df));
function tinv(p, df) { let lo = -60, hi = 60; for (let i = 0; i < 100; i++) { const mid = (lo + hi) / 2; if (tcdf(mid, df) < p) lo = mid; else hi = mid; } return (lo + hi) / 2; }
function erf(x) { const s = x < 0 ? -1 : 1; x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)); }
const Phi = x => 0.5 * (1 + erf(x / Math.SQRT2));
const phi = x => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

const quadCache = new Map();
function quad(df) {
  if (quadCache.has(df)) return quadCache.get(df);
  const N = 400, vmax = df + 14 * Math.sqrt(2 * df) + 20, h = vmax / N, V = [], W = [];
  const lc = -(df / 2) * Math.log(2) - lgamma(df / 2);
  for (let i = 0; i <= N; i++) {
    const v = Math.max(i * h, 1e-9), dens = Math.exp(lc + (df / 2 - 1) * Math.log(v) - v / 2);
    const sw = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2);
    V.push(Math.sqrt(v / df)); W.push(dens * sw * h / 3);
  }
  const q = { V, W }; quadCache.set(df, q); return q;
}
function ncPdf(t, df, d) { const { V, W } = quad(df); let s = 0; for (let i = 0; i < V.length; i++) s += W[i] * phi(t * V[i] - d) * V[i]; return s; }
function ncPower(c, df, d) { const { V, W } = quad(df); let s = 0, tot = 0; for (let i = 0; i < V.length; i++) { s += W[i] * (1 - Phi(c * V[i] - d) + Phi(-c * V[i] - d)); tot += W[i]; } return Math.min(1, Math.max(0, s / tot)); }

// ---------- Zufall ----------
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const randn = r => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
let rand = mulberry32(20261119);
const NMAX = 100; let zK = [], zT = [], jK = [], jT = [];
function draw() {
  zK = Array.from({ length: NMAX }, () => randn(rand)); zT = Array.from({ length: NMAX }, () => randn(rand));
  jK = Array.from({ length: NMAX }, () => rand()); jT = Array.from({ length: NMAX }, () => rand());
}
draw();

// ---------- Zustand ----------
const S = { delta: 10, sigma: 20, n: 20, alpha: 0.05, view: "dots", showNormal: false };
const MU_K = 10;
const $ = id => document.getElementById(id);
const fmt = (x, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtP = p => p < 0.001 ? "< 0,001" : fmt(p, 3);
const pct = x => (x * 100).toLocaleString("de-DE", { maximumFractionDigits: x < 0.1 && x > 0 ? 1 : 0 }) + " %";
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const sd = (a, m) => Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
function quantile(sorted, q) { const pos = (sorted.length - 1) * q, b = Math.floor(pos), r = pos - b; return sorted[b + 1] !== undefined ? sorted[b] + r * (sorted[b + 1] - sorted[b]) : sorted[b]; }

function compute() {
  const n = S.n, muT = MU_K + S.delta;
  const xK = zK.slice(0, n).map(z => MU_K + S.sigma * z), xT = zT.slice(0, n).map(z => muT + S.sigma * z);
  const mK = mean(xK), mT = mean(xT), sK = sd(xK, mK), sT = sd(xT, mT);
  const df = 2 * n - 2, sp = Math.sqrt(((n - 1) * sK * sK + (n - 1) * sT * sT) / df), se = sp * Math.sqrt(2 / n);
  const diff = mT - mK, t = diff / se, p = 2 * (1 - tcdf(Math.abs(t), df));
  const tc = tinv(1 - S.alpha / 2, df), d = S.delta / (S.sigma * Math.sqrt(2 / n));
  const power = ncPower(tc, df, d);
  return { n, xK, xT, mK, mT, sK, sT, df, sp, se, diff, t, p, tc, d, power, beta: 1 - power };
}

// ---------- SVG-Helfer ----------
const W = 920, L = 24, R = 896;
const path = pts => pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join("");
const area = (pts, y0) => pts.length ? path(pts) + `L${pts[pts.length - 1][0].toFixed(1)},${y0}L${pts[0][0].toFixed(1)},${y0}Z` : "";
function ticks(lo, hi, target = 8) {
  const span = hi - lo, raw = span / target, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 5, 10].map(m => m * mag).find(s => span / s <= target) || 10 * mag;
  const out = []; for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10)); return out;
}
const readout = (lbl, val, cls = "") => `<div class="readout ${cls}"><div class="val">${val}</div><div class="lbl">${lbl}</div></div>`;

// ---------- 1 Rohdaten ----------
const RAW_LO = -110, RAW_HI = 170;
function drawRaw(c) {
  const sx = v => L + (v - RAW_LO) / (RAW_HI - RAW_LO) * (R - L);
  const top = 14, base = 168, rowK = [196, 236], rowT = [252, 292], axisY = 304;
  const peak = Math.max(phi(0) / c.sK, phi(0) / c.sT);
  const sy = dens => base - (dens / peak) * (base - top);
  let s = "";
  for (const v of ticks(RAW_LO, RAW_HI, 12)) { s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${top}" y2="${axisY}" stroke="var(--grid)"/><text x="${sx(v)}" y="${axisY + 18}" text-anchor="middle">${v}</text>`; }
  s += `<text x="${R}" y="${axisY + 36}" text-anchor="end">Schmerzreduktion in mm VAS</text>`;
  s += `<line x1="${L}" x2="${R}" y1="${base}" y2="${base}" stroke="var(--line)"/>`;
  const curve = (m, sdv) => { const pts = []; for (let i = 0; i <= 280; i++) { const v = RAW_LO + i / 280 * (RAW_HI - RAW_LO); pts.push([sx(v), sy(phi((v - m) / sdv) / sdv)]); } return pts; };
  const ck = curve(c.mK, c.sK), ct = curve(c.mT, c.sT);
  s += `<path d="${area(ck, base)}" fill="var(--kontrolle)" fill-opacity=".2"/><path d="${path(ck)}" fill="none" stroke="var(--kontrolle)" stroke-width="2.5"/>`;
  s += `<path d="${area(ct, base)}" fill="var(--therapie)" fill-opacity=".16"/><path d="${path(ct)}" fill="none" stroke="var(--therapie)" stroke-width="2.5"/>`;
  [[c.mK, c.sK, "var(--kontrolle)", base + 8], [c.mT, c.sT, "var(--therapie)", base + 15]].forEach(([m, sdv, col, y]) => {
    s += `<line x1="${sx(m - sdv)}" x2="${sx(m + sdv)}" y1="${y}" y2="${y}" stroke="${col}" stroke-width="2"/>`;
    s += `<line x1="${sx(m - sdv)}" x2="${sx(m - sdv)}" y1="${y - 3}" y2="${y + 3}" stroke="${col}" stroke-width="2"/><line x1="${sx(m + sdv)}" x2="${sx(m + sdv)}" y1="${y - 3}" y2="${y + 3}" stroke="${col}" stroke-width="2"/>`;
  });
  const rows = [[c.xK, jK, rowK, "var(--kontrolle)", "Kontrolle"], [c.xT, jT, rowT, "var(--therapie)", "Therapie"]];
  for (const [xs, js, [y0, y1], col, name] of rows) {
    s += `<text x="${L}" y="${y0 + 12}" class="strong">${name}</text>`;
    const showDots = S.view !== "box", showBox = S.view !== "dots";
    if (showBox) {
      const so = [...xs].sort((a, b) => a - b), q1 = quantile(so, .25), q2 = quantile(so, .5), q3 = quantile(so, .75), iqr = q3 - q1;
      const lo = so.find(v => v >= q1 - 1.5 * iqr), hi = [...so].reverse().find(v => v <= q3 + 1.5 * iqr), ym = (y0 + y1) / 2, bh = (y1 - y0) * 0.62;
      s += `<line x1="${sx(lo)}" x2="${sx(q1)}" y1="${ym}" y2="${ym}" stroke="${col}" stroke-width="1.5"/><line x1="${sx(q3)}" x2="${sx(hi)}" y1="${ym}" y2="${ym}" stroke="${col}" stroke-width="1.5"/>`;
      s += `<line x1="${sx(lo)}" x2="${sx(lo)}" y1="${ym - bh / 3}" y2="${ym + bh / 3}" stroke="${col}" stroke-width="1.5"/><line x1="${sx(hi)}" x2="${sx(hi)}" y1="${ym - bh / 3}" y2="${ym + bh / 3}" stroke="${col}" stroke-width="1.5"/>`;
      s += `<rect x="${sx(q1)}" y="${ym - bh / 2}" width="${Math.max(1, sx(q3) - sx(q1))}" height="${bh}" fill="${col}" fill-opacity="${showDots ? .12 : .25}" stroke="${col}" stroke-width="1.5" rx="2"/>`;
      s += `<line x1="${sx(q2)}" x2="${sx(q2)}" y1="${ym - bh / 2}" y2="${ym + bh / 2}" stroke="${col}" stroke-width="3"/>`;
      if (!showDots) so.filter(v => v < lo || v > hi).forEach(v => { s += `<circle cx="${sx(v)}" cy="${ym}" r="3.5" fill="none" stroke="${col}" stroke-width="1.5"/>`; });
    }
    if (showDots) {
      const r = c.n > 60 ? 3.5 : 4.5;
      xs.forEach((v, i) => { const y = y0 + 6 + js[i] * (y1 - y0 - 12); s += `<circle cx="${sx(Math.max(RAW_LO, Math.min(RAW_HI, v))).toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${col}" fill-opacity=".72"/>`; });
    }
  }
  s += `<line x1="${sx(c.mK)}" x2="${sx(c.mK)}" y1="${top}" y2="${rowK[1]}" stroke="var(--kontrolle)" stroke-width="2" stroke-dasharray="5 4"/>`;
  s += `<line x1="${sx(c.mT)}" x2="${sx(c.mT)}" y1="${top}" y2="${rowT[1]}" stroke="var(--therapie)" stroke-width="2" stroke-dasharray="5 4"/>`;
  $("raw").innerHTML = s;
  $("raw").setAttribute("aria-label", `Rohdaten: Kontrolle Mittelwert ${fmt(c.mK)} mm, Therapie Mittelwert ${fmt(c.mT)} mm, je ${c.n} Personen`);
  $("raw-stats").innerHTML =
    readout("Mittelwert Kontrolle", fmt(c.mK) + " mm", "r-kontrolle") + readout("Mittelwert Therapie", fmt(c.mT) + " mm", "r-therapie") +
    readout("SD Kontrolle", fmt(c.sK) + " mm", "r-kontrolle") + readout("SD Therapie", fmt(c.sT) + " mm", "r-therapie");
}

// ---------- 2 Signal / Rauschen ----------
function drawRuler(c) {
  $("formula").innerHTML =
    `t = (<span class="ink-therapie"><b>x̄<sub>T</sub> − x̄<sub>K</sub></b></span>) / (<span class="ink-kontrolle"><b>s<sub>p</sub> · √(2/n)</b></span>)` +
    ` = <span class="ink-therapie">${fmt(c.diff)}</span> / (<span class="ink-kontrolle">${fmt(c.sp)} · √(2/${c.n})</span>)` +
    ` = <span class="ink-therapie">${fmt(c.diff)}</span> / <span class="ink-kontrolle">${fmt(c.se, 2)}</span> = <b>${fmt(c.t, 2)}</b>`;
  const lo = Math.min(c.mK, c.mT), hi = Math.max(c.mK, c.mT);
  const span = Math.max(hi - lo, c.se * 2, 4), pad = span * 0.25, a = lo - pad, b = lo + span + pad;
  const sx = v => L + (v - a) / (b - a) * (R - L);
  let s = "";
  for (const v of ticks(a, b, 10)) s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="14" y2="96" stroke="var(--grid)"/><text x="${sx(v)}" y="116" text-anchor="middle">${fmt(v, v % 1 ? 1 : 0)}</text>`;
  const y = 34;
  s += `<line x1="${sx(c.mK)}" x2="${sx(c.mT)}" y1="${y}" y2="${y}" stroke="var(--therapie)" stroke-width="4"/>`;
  s += `<circle cx="${sx(c.mK)}" cy="${y}" r="7" fill="var(--kontrolle)"/><circle cx="${sx(c.mT)}" cy="${y}" r="7" fill="var(--therapie)"/>`;
  s += `<text x="${(sx(c.mK) + sx(c.mT)) / 2}" y="${y - 13}" text-anchor="middle" class="strong">Signal ${fmt(c.diff)} mm</text>`;
  const dir = c.diff >= 0 ? 1 : -1, full = Math.floor(Math.abs(c.t)), y2 = 56, h = 20;
  let x0 = c.mK;
  for (let i = 0; i < full && i < 80; i++) { const x1 = x0 + dir * c.se; s += `<rect x="${Math.min(sx(x0), sx(x1))}" y="${y2}" width="${Math.abs(sx(x1) - sx(x0))}" height="${h}" fill="var(--accent-soft)" fill-opacity="${i % 2 ? .45 : .8}"/>`; x0 = x1; }
  const rest = Math.abs(c.t) - full;
  if (rest > 0.01) { const x1 = x0 + dir * c.se * rest; s += `<rect x="${Math.min(sx(x0), sx(x1))}" y="${y2}" width="${Math.abs(sx(x1) - sx(x0))}" height="${h}" fill="none" stroke="var(--accent-soft)" stroke-dasharray="3 2"/>`; }
  s += `<text x="${L}" y="${y2 + h + 16}">Ein Block = ein Standardfehler (${fmt(c.se, 2)} mm) · ${fmt(Math.abs(c.t), 2)} Blöcke passen in das Signal</text>`;
  $("ruler").innerHTML = s;
  $("ruler").setAttribute("aria-label", `Signal ${fmt(c.diff)} mm entspricht ${fmt(Math.abs(c.t), 2)} Standardfehlern`);
}

// ---------- 3 t-Verteilung ----------
function drawT(c) {
  const top = 16, base = 236;
  const m = Math.min(20, Math.max(6, Math.abs(c.t) + 1.5, c.tc + 1.5)), a = -m, b = m;
  const sx = v => L + (v - a) / (b - a) * (R - L);
  const peak = Math.max(tpdf(0, c.df), S.showNormal ? phi(0) : 0) * 1.1, sy = d => base - d / peak * (base - top);
  const pts = (f, lo, hi) => { const o = []; const N = Math.max(2, Math.ceil((hi - lo) / (b - a) * 400)); for (let i = 0; i <= N; i++) { const v = lo + (hi - lo) * i / N; o.push([sx(v), sy(f(v))]); } return o; };
  const f = v => tpdf(v, c.df);
  let s = "";
  for (const v of ticks(a, b, 14)) s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${top}" y2="${base}" stroke="var(--grid)"/><text x="${sx(v)}" y="${base + 18}" text-anchor="middle">${v}</text>`;
  s += `<path d="${area(pts(f, c.tc, b), base)}" fill="var(--alpha-fill)" fill-opacity=".6"/><path d="${area(pts(f, a, -c.tc), base)}" fill="var(--alpha-fill)" fill-opacity=".6"/>`;
  const at = Math.abs(c.t);
  if (at < b) s += `<path d="${area(pts(f, at, b), base)}" fill="var(--pval)" fill-opacity=".9"/><path d="${area(pts(f, a, -at), base)}" fill="var(--pval)" fill-opacity=".9"/>`;
  s += `<path d="${path(pts(f, a, b))}" fill="none" stroke="var(--fg)" stroke-width="2"/>`;
  if (S.showNormal) s += `<path d="${path(pts(phi, a, b))}" fill="none" stroke="var(--muted)" stroke-width="1.6" stroke-dasharray="6 4"/>`;
  s += `<line x1="${L}" x2="${R}" y1="${base}" y2="${base}" stroke="var(--line)"/>`;
  [c.tc, -c.tc].forEach(v => { s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${top + 26}" y2="${base}" stroke="var(--kontrolle)" stroke-width="1.5" stroke-dasharray="4 3"/>`; });
  s += `<text x="${sx(-c.tc) - 8}" y="${top + 36}" text-anchor="end" style="fill:var(--alpha-ink)">kritisches t = ±${fmt(c.tc, 2)}</text>`;
  const tx = Math.max(a, Math.min(b, c.t)), off = Math.abs(c.t) > b;
  s += `<line x1="${sx(tx)}" x2="${sx(tx)}" y1="${top}" y2="${base}" stroke="var(--pval)" stroke-width="2.5"/>`;
  s += `<text x="${sx(tx) + (c.t >= 0 ? -8 : 8)}" y="${top + 12}" text-anchor="${c.t >= 0 ? "end" : "start"}" class="strong">t = ${fmt(c.t, 2)}${off ? " (außerhalb)" : ""}</text>`;
  if (S.showNormal) s += `<text x="${L}" y="${top + 12}">gestrichelt: Standardnormalverteilung</text>`;
  s += `<text x="${R}" y="${base + 38}" text-anchor="end">t-Wert · df = ${c.df}</text>`;
  $("tdist").innerHTML = s;
  $("tdist").setAttribute("aria-label", `t-Verteilung mit ${c.df} Freiheitsgraden, beobachtetes t ${fmt(c.t, 2)}, p ${fmtP(c.p)}`);
  const sig = c.p < S.alpha;
  $("t-stats").innerHTML = readout("t-Wert", fmt(c.t, 2)) + readout("Freiheitsgrade", String(c.df)) + readout("p-Wert", fmtP(c.p), "r-p") +
    readout(`Entscheidung bei α = ${fmt(S.alpha, 2)}`, sig ? "H0 verwerfen" : "H0 beibehalten", "r-decision" + (sig ? " sig" : ""));
}

// ---------- 3b Verteilungsfunktion: kritischer Wert und p-Wert ----------
function drawCdf(c) {
  const top = 18, base = 280, PL = 70, PR = R;
  const m = Math.min(20, Math.max(6, Math.abs(c.t) + 1.5, c.tc + 1.5)), a = -m, b = m;
  const sx = v => PL + (v - a) / (b - a) * (PR - PL), sy = p => base - p * (base - top);
  const F = v => tcdf(v, c.df), lo = S.alpha / 2, hi = 1 - S.alpha / 2;
  let s = "";
  s += `<rect x="${sx(-c.tc)}" y="${top}" width="${sx(c.tc) - sx(-c.tc)}" height="${base - top}" fill="var(--highlight)"/>`;
  s += `<rect x="${PL}" y="${top}" width="${sx(-c.tc) - PL}" height="${base - top}" fill="var(--alpha-fill)" fill-opacity=".25"/><rect x="${sx(c.tc)}" y="${top}" width="${PR - sx(c.tc)}" height="${base - top}" fill="var(--alpha-fill)" fill-opacity=".25"/>`;
  [0, 0.25, 0.5, 0.75, 1].forEach(p => s += `<line x1="${PL}" x2="${PR}" y1="${sy(p)}" y2="${sy(p)}" stroke="var(--grid)"/><text x="${PL - 8}" y="${sy(p) + 4}" text-anchor="end">${fmt(p, 2)}</text>`);
  for (const v of ticks(a, b, 14)) s += `<text x="${sx(v)}" y="${base + 18}" text-anchor="middle">${v}</text>`;
  const pts = []; for (let i = 0; i <= 400; i++) { const v = a + (b - a) * i / 400; pts.push([sx(v), sy(F(v))]); }
  s += `<path d="${path(pts)}" fill="none" stroke="var(--fg)" stroke-width="2.5"/>`;
  // kritische Werte: von der y-Achse zur Kurve und hinunter
  [[hi, c.tc], [lo, -c.tc]].forEach(([p, v]) => {
    s += `<path d="M${PL} ${sy(p)} H${sx(v)} V${base}" fill="none" stroke="var(--alpha-ink)" stroke-width="2" stroke-dasharray="6 4"/><circle cx="${sx(v)}" cy="${sy(p)}" r="4.5" fill="var(--alpha-ink)"/>`;
    s += `<text x="${PL + 6}" y="${sy(p) - 7}" style="fill:var(--alpha-ink)">${p > 0.5 ? "1 − α/2" : "α/2"} = ${fmt(p, 3)}</text>`;
  });
  s += `<text class="strong" x="${sx(c.tc)}" y="${base + 36}" text-anchor="middle" style="fill:var(--alpha-ink)">+${fmt(c.tc, 2)}</text><text class="strong" x="${sx(-c.tc)}" y="${base + 36}" text-anchor="middle" style="fill:var(--alpha-ink)">−${fmt(c.tc, 2)}</text>`;
  // beobachtetes t: hinauf zur Kurve und hinüber
  const at = Math.abs(c.t), tx = Math.min(b, at), Ft = F(at);
  s += `<path d="M${sx(tx)} ${base} V${sy(Ft)} H${PL}" fill="none" stroke="var(--pval)" stroke-width="2.5"/><circle cx="${sx(tx)}" cy="${sy(Ft)}" r="5" fill="var(--pval)"/>`;
  s += `<text class="strong" x="${sx(tx) + 8}" y="${sy(Ft) + 18}">|t| = ${fmt(at, 2)}, F = ${fmt(Ft, 4)}</text>`;
  s += `<text x="${PL + (PR - PL) / 2}" y="${top + 14}" text-anchor="middle">Annahmebereich</text>`;
  s += `<text x="${PR}" y="${base + 52}" text-anchor="end">t-Wert · df = ${c.df}</text><text x="18" y="${(top + base) / 2}" transform="rotate(-90 18 ${(top + base) / 2})" text-anchor="middle">F(t)</text>`;
  $("tcdf").innerHTML = s;
  $("tcdf").setAttribute("aria-label", `Verteilungsfunktion der t-Verteilung, kritische Werte ±${fmt(c.tc, 2)}, p ${fmtP(c.p)}`);
  const sig = c.p < S.alpha, inRej = at > c.tc, pe = c.p < 0.001 ? "< 0,001" : "= " + fmt(c.p, 3);
  $("calc-steps").innerHTML =
    `<li><b>Annahmebereich festlegen.</b> Er soll die mittleren ${fmt((1 - S.alpha) * 100, 0)} % der t-Verteilung enthalten, links und rechts bleiben je α/2 = ${fmt(lo, 3)} übrig.<span class="eq">F(t) zwischen ${fmt(lo, 3)} und ${fmt(hi, 3)}</span></li>` +
    `<li><b>Kritischen Wert rückwärts ablesen.</b> Gesucht ist das t, bei dem die Verteilungsfunktion ${fmt(hi, 3)} erreicht (Quantil, steht auch in jeder t-Tabelle).<span class="eq">t<sub>krit</sub> = F⁻¹(${fmt(hi, 3)}; df = ${c.df}) = ${fmt(c.tc, 3)}</span></li>` +
    `<li><b>Bereiche benennen.</b><span class="eq">Annahmebereich: −${fmt(c.tc, 2)} ≤ t ≤ ${fmt(c.tc, 2)} · Ablehnungsbereich: |t| > ${fmt(c.tc, 2)}</span></li>` +
    `<li><b>p-Wert vorwärts ablesen.</b> Vom beobachteten |t| hinauf zur Kurve: F(|t|) ist der Anteil links davon. Was rechts übrig bleibt, gibt es auf beiden Seiten.<span class="eq">p = 2 · (1 − F(${fmt(at, 2)})) = 2 · (1 − ${fmt(Ft, 4)}) ${pe}</span></li>` +
    `<li><b>Entscheiden.</b> Beide Wege führen zum selben Ergebnis.<span class="eq">|t| = ${fmt(at, 2)} ${inRej ? ">" : "≤"} ${fmt(c.tc, 2)} und p ${pe} ${sig ? "<" : "≥"} α = ${fmt(S.alpha, 2)} → ${sig ? "H0 verwerfen" : "H0 beibehalten"}</span></li>`;
}

// ---------- 4 Power ----------
function drawPower(c) {
  const top = 16, base = 236;
  const a = -6, b = Math.min(20, Math.max(6, c.d + 4.5)), offH1 = c.d + 4.5 > 20;
  const sx = v => L + (v - a) / (b - a) * (R - L);
  const N = 360, xs = Array.from({ length: N + 1 }, (_, i) => a + (b - a) * i / N);
  const y0 = xs.map(v => tpdf(v, c.df)), y1 = xs.map(v => ncPdf(v, c.df, c.d));
  const peak = Math.max(...y0, ...y1) * 1.1, sy = d => base - d / peak * (base - top);
  const seg = (ys, lo, hi) => { const o = []; xs.forEach((v, i) => { if (v >= lo && v <= hi) o.push([sx(v), sy(ys[i])]); }); return o; };
  let s = "";
  for (const v of ticks(a, b, 14)) s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${top}" y2="${base}" stroke="var(--grid)"/><text x="${sx(v)}" y="${base + 18}" text-anchor="middle">${v}</text>`;
  s += `<path d="${area(seg(y1, -c.tc, c.tc), base)}" fill="var(--beta-fill)" fill-opacity=".75"/>`;
  s += `<path d="${area(seg(y1, c.tc, b), base)}" fill="var(--power-fill)" fill-opacity=".45"/>`;
  s += `<path d="${area(seg(y0, c.tc, b), base)}" fill="var(--alpha-fill)" fill-opacity=".85"/><path d="${area(seg(y0, a, -c.tc), base)}" fill="var(--alpha-fill)" fill-opacity=".85"/>`;
  s += `<path d="${path(seg(y0, a, b))}" fill="none" stroke="var(--kontrolle)" stroke-width="2.5"/>`;
  s += `<path d="${path(seg(y1, a, b))}" fill="none" stroke="var(--therapie)" stroke-width="2.5"/>`;
  s += `<line x1="${L}" x2="${R}" y1="${base}" y2="${base}" stroke="var(--line)"/>`;
  [c.tc, -c.tc].forEach(v => { s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${top}" y2="${base}" stroke="var(--fg)" stroke-width="1.2" stroke-dasharray="4 3"/>`; });
  s += `<text x="${sx(0)}" y="${top + 8}" text-anchor="middle" style="fill:var(--kontrolle-ink)">H0</text>`;
  if (!offH1 && c.d > 0.9) s += `<text x="${sx(c.d)}" y="${top + 8}" text-anchor="middle" style="fill:var(--therapie-ink)">H1</text>`;
  if (offH1) s += `<text x="${R}" y="${top + 8}" text-anchor="end" style="fill:var(--therapie-ink)">H1 liegt bei t ≈ ${fmt(c.d, 1)} →</text>`;
  s += `<text x="${R}" y="${base + 38}" text-anchor="end">t-Wert · df = ${c.df} · Nichtzentralität δ = ${fmt(c.d, 2)}</text>`;
  $("power").innerHTML = s;
  $("power").setAttribute("aria-label", `Power ${pct(c.power)}, Beta ${pct(c.beta)}, Alpha ${fmt(S.alpha, 2)}`);
  $("p-stats").innerHTML = readout("α · Fehlalarm", pct(S.alpha), "r-alpha") + readout("β · übersehen", pct(c.beta), "r-beta") +
    readout("Power = 1 − β", pct(c.power), "r-power") + readout("Effektstärke d = Δ / σ", fmt(S.delta / S.sigma, 2));
}

// ---------- 5 Simulation ----------
let simRan = false;
function clearSim(msg) { simRan = false; $("tiles").innerHTML = Array.from({ length: 100 }, () => '<div class="tile"></div>').join(""); $("sim-text").textContent = msg; }
function simulate() {
  const c = compute(), r = mulberry32((Math.random() * 2 ** 31) | 0), n = S.n;
  let sig = 0; const res = [];
  for (let k = 0; k < 100; k++) {
    let sK = 0, qK = 0, sT = 0, qT = 0;
    for (let i = 0; i < n; i++) { const a = MU_K + S.sigma * randn(r), b = MU_K + S.delta + S.sigma * randn(r); sK += a; qK += a * a; sT += b; qT += b * b; }
    const mK = sK / n, mT = sT / n, vK = (qK - n * mK * mK) / (n - 1), vT = (qT - n * mT * mT) / (n - 1);
    const t = (mT - mK) / (Math.sqrt((vK + vT) / 2) * Math.sqrt(2 / n));
    const s = Math.abs(t) > c.tc; res.push(s); if (s) sig++;
  }
  const h0 = S.delta === 0;
  $("tiles").innerHTML = res.map(s => `<div class="tile ${s ? "sig" : ""} ${s && h0 ? "h0" : ""}"></div>`).join("");
  $("sim-text").innerHTML = h0
    ? `<b>${sig} von 100</b> Studien sind signifikant, obwohl die Therapie nichts bewirkt. Jede davon ist ein Alpha-Fehler. Erwartet: etwa ${pct(S.alpha)}.`
    : `<b>${sig} von 100</b> Studien finden den Effekt. Theoretische Power: <b>${pct(c.power)}</b>. Die übrigen ${100 - sig} sind Beta-Fehler: Der Effekt existiert, wurde aber übersehen.`;
  simRan = true;
}

// ---------- Verdrahtung ----------
function render() {
  $("delta-v").textContent = S.delta + " mm"; $("sigma-v").textContent = S.sigma + " mm"; $("n-v").textContent = `${S.n} (df ${2 * S.n - 2})`;
  const c = compute(); drawRaw(c); drawRuler(c); drawT(c); drawCdf(c); drawPower(c);
}
function paramsChanged() { render(); if (simRan) clearSim("Parameter geändert. Simulieren Sie erneut, um die neue Power zu prüfen."); }
[["delta", "delta"], ["sigma", "sigma"], ["n", "n"]].forEach(([id, k]) => $(id).addEventListener("input", e => { S[k] = +e.target.value; paramsChanged(); }));
document.querySelectorAll("[data-alpha]").forEach(b => b.addEventListener("click", () => { S.alpha = +b.dataset.alpha; document.querySelectorAll("[data-alpha]").forEach(x => x.setAttribute("aria-pressed", x === b)); paramsChanged(); }));
document.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => { S.view = b.dataset.view; document.querySelectorAll("[data-view]").forEach(x => x.setAttribute("aria-pressed", x === b)); render(); }));
$("shownormal").addEventListener("change", e => { S.showNormal = e.target.checked; render(); });
$("resample").addEventListener("click", () => { rand = mulberry32((Math.random() * 2 ** 31) | 0); draw(); render(); });
$("simulate").addEventListener("click", simulate);
const PRESETS = { h0: { delta: 0 }, pilot: { n: 8, delta: 10, sigma: 20 }, big: { n: 100, delta: 10, sigma: 20 }, clean: { sigma: 8, n: 20 } };
document.querySelectorAll("[data-preset]").forEach(b => b.addEventListener("click", () => {
  Object.assign(S, PRESETS[b.dataset.preset]); $("delta").value = S.delta; $("sigma").value = S.sigma; $("n").value = S.n; paramsChanged();
}));
clearSim("Noch keine Simulation. Drücken Sie den Knopf.");
render();
if (location.hash === "#calc") { $("calc").open = true; $("calc").scrollIntoView(); }
})();
