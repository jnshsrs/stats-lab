/* t-Test-Kaskade · Stats Lab
   Einstichproben-t-Test am Beispiel Knie-TEP (fiktives Kriterium 90° Flexion).
   Hypothese zweiseitig, rechtsseitig oder linksseitig umschaltbar; alles im Browser gerechnet. */
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


// ---------- Zufall ----------
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function zs(seed, n) { const r = mulberry32(seed), o = []; while (o.length < n) { let u = 0; while (!u) u = r(); const v = r(), m = Math.sqrt(-2 * Math.log(u)); o.push(m * Math.cos(2 * Math.PI * v), m * Math.sin(2 * Math.PI * v)); } return o.slice(0, n); }

// ---------- Zustand ----------
const MU0 = 90, NMAX = 60;
const S = { mu: 94, sigma: 10, n: 20, alpha: 0.05, dir: "two", seed: 1, showNormal: false };
const $ = id => document.getElementById(id);
const fmt = (x, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");
const fmtP = p => p < 0.001 ? "< 0,001" : fmt(p, 3);
const pEq = p => p < 0.001 ? "< 0,001" : "= " + fmt(p, 3);
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const sdv = (a, m) => Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
const DIRS = {
  two: { name: "zweiseitig", h0: "μ = 90°", h1: "μ ≠ 90°", who: "Neutrale Frage: Weicht die Klinik vom Kriterium ab, egal in welche Richtung?", h0s: "Die Klinik liegt genau beim Kriterium.", h1s: "Die Klinik weicht ab, nach oben oder unten." },
  right: { name: "rechtsseitig", h0: "μ ≤ 90°", h1: "μ > 90°", who: "Die Klinik will zeigen, dass sie das Kriterium erfüllt.", h0s: "Die Klinik erfüllt das Kriterium nicht.", h1s: "Die Klinik erfüllt das Kriterium." },
  left: { name: "linksseitig", h0: "μ ≥ 90°", h1: "μ < 90°", who: "Eine Prüfstelle will zeigen, dass die Klinik das Kriterium verfehlt.", h0s: "Die Klinik erfüllt das Kriterium.", h1s: "Die Klinik verfehlt das Kriterium." }
};
// je Richtung: kritische Werte und p-Wert
function testFor(dir, t, df, a) {
  if (dir === "two") { const c = tinv(1 - a / 2, df); return { crit: [-c, c], p: 2 * (1 - tcdf(Math.abs(t), df)), rej: Math.abs(t) > c, critTxt: "±" + fmt(c, 2) }; }
  if (dir === "right") { const c = tinv(1 - a, df); return { crit: [c], p: 1 - tcdf(t, df), rej: t > c, critTxt: fmt(c, 2) }; }
  const c = tinv(a, df); return { crit: [c], p: tcdf(t, df), rej: t < c, critTxt: fmt(c, 2) };
}
function sample(seed = S.seed, mu = S.mu, sigma = S.sigma, n = S.n) { return zs(seed, NMAX).slice(0, n).map(z => Math.round(mu + sigma * z)); }
function compute() {
  const x = sample(), n = x.length, m = mean(x), s = sdv(x, m), se = s / Math.sqrt(n), df = n - 1, t = (m - MU0) / se;
  return { x, n, m, s, se, df, t, diff: m - MU0, T: testFor(S.dir, t, df, S.alpha) };
}
function findSeed(ok, mu = S.mu, sigma = S.sigma, n = S.n) {
  for (let sd = 1; sd < 20000; sd++) { const x = sample(sd, mu, sigma, n), m = mean(x), se = sdv(x, m) / Math.sqrt(n), t = (m - MU0) / se; if (ok(t, n - 1, m)) return sd; }
  return 1;
}

// ---------- SVG-Helfer ----------
const L = 24, R = 896;
const path = pts => pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join("");
const area = (pts, y0) => pts.length ? path(pts) + `L${pts[pts.length - 1][0].toFixed(1)},${y0}L${pts[0][0].toFixed(1)},${y0}Z` : "";
function ticks(lo, hi, target = 8) {
  const span = hi - lo, raw = span / target, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 5, 10].map(m => m * mag).find(s => span / s <= target) || 10 * mag;
  const out = []; for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10)); return out;
}
const readout = (lbl, val, cls = "") => `<div class="readout ${cls}"><div class="val">${val}</div><div class="lbl">${lbl}</div></div>`;

// ---------- 1 Rohdaten ----------
function drawRaw(c) {
  const lo = 40, hi = 140, sx = v => L + (v - lo) / (hi - lo) * (R - L), base = 168;
  let s = "";
  for (const v of ticks(lo, hi, 10)) s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="10" y2="${base + 4}" stroke="var(--grid)"/><text x="${sx(v)}" y="${base + 66}" text-anchor="middle">${v}°</text>`;
  s += `<line x1="${sx(MU0)}" x2="${sx(MU0)}" y1="6" y2="${base + 48}" stroke="var(--alpha-ink)" stroke-width="2" stroke-dasharray="6 4"/><text x="${sx(MU0) - 8}" y="18" text-anchor="end" style="fill:var(--alpha-ink)">Sollwert μ₀ = 90°</text>`;
  const seen = {}, step = c.n > 40 ? 7 : 9;
  c.x.forEach(v => { const k = seen[v] = (seen[v] ?? -1) + 1; s += `<circle cx="${sx(Math.max(lo, Math.min(hi, v)))}" cy="${base - 6 - k * step}" r="${c.n > 40 ? 3.6 : 4.6}" fill="var(--pal-4)" fill-opacity=".85"/>`; });
  s += `<line x1="${L}" x2="${R}" y1="${base}" y2="${base}" stroke="var(--line)"/>`;
  const y = base + 30;
  s += `<line x1="${sx(c.m - c.s)}" x2="${sx(c.m + c.s)}" y1="${y}" y2="${y}" stroke="var(--therapie)" stroke-width="3"/>`;
  [c.m - c.s, c.m + c.s].forEach(v => s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${y - 5}" y2="${y + 5}" stroke="var(--therapie)" stroke-width="3"/>`);
  s += `<circle cx="${sx(c.m)}" cy="${y}" r="7" fill="var(--therapie)"/><text class="strong" x="${sx(c.m + c.s) + 10}" y="${y + 5}">x̄ = ${fmt(c.m)}° · s = ${fmt(c.s)}°</text>`;
  $("raw").innerHTML = s;
  $("raw").setAttribute("aria-label", `${c.n} Messwerte, Mittelwert ${fmt(c.m)} Grad, Sollwert 90 Grad`);
  $("raw-stats").innerHTML = readout("Mittelwert x̄", fmt(c.m) + "°", "r-therapie") + readout("Standardabweichung s", fmt(c.s) + "°") +
    readout("Stichprobengröße n", String(c.n)) + readout("Abstand x̄ − 90°", (c.diff >= 0 ? "+" : "") + fmt(c.diff) + "°", "r-therapie");
}

// ---------- 2 Hypothesen und t ----------
function drawHyp() {
  const d = DIRS[S.dir];
  $("hyp").innerHTML = `<p class="who">${d.who}</p><div class="hyp-grid"><div><span class="k">H0</span><div class="v">${d.h0}</div><span class="s">${d.h0s}</span></div><div><span class="k">H1, soll gezeigt werden</span><div class="v">${d.h1}</div><span class="s">${d.h1s}</span></div></div>`;
}
function drawRuler(c) {
  $("formula").innerHTML =
    `t = (<span class="ink-therapie"><b>x̄ − μ₀</b></span>) / (<span class="ink-kontrolle"><b>s / √n</b></span>)` +
    ` = (<span class="ink-therapie">${fmt(c.m)} − 90</span>) / (<span class="ink-kontrolle">${fmt(c.s)} / √${c.n}</span>)` +
    ` = <span class="ink-therapie">${fmt(c.diff)}</span> / <span class="ink-kontrolle">${fmt(c.se, 2)}</span> = <b>${fmt(c.t, 2)}</b><br><span class="df-line">Freiheitsgrade: df = n − 1 = ${c.df}</span>`;
  const lo = Math.min(MU0, c.m), hi = Math.max(MU0, c.m);
  const span = Math.max(hi - lo, c.se * 2, 4), pad = span * 0.25, a = lo - pad, b = lo + span + pad;
  const sx = v => L + (v - a) / (b - a) * (R - L);
  let s = "";
  for (const v of ticks(a, b, 10)) s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="14" y2="96" stroke="var(--grid)"/><text x="${sx(v)}" y="116" text-anchor="middle">${fmt(v, v % 1 ? 1 : 0)}°</text>`;
  const y = 34;
  s += `<line x1="${sx(MU0)}" x2="${sx(c.m)}" y1="${y}" y2="${y}" stroke="var(--therapie)" stroke-width="4"/>`;
  s += `<circle cx="${sx(MU0)}" cy="${y}" r="7" fill="var(--alpha-ink)"/><circle cx="${sx(c.m)}" cy="${y}" r="7" fill="var(--therapie)"/>`;
  s += `<text x="${(sx(MU0) + sx(c.m)) / 2}" y="${y - 13}" text-anchor="middle" class="strong">Signal ${fmt(c.diff)}°</text>`;
  const dir = c.diff >= 0 ? 1 : -1, full = Math.floor(Math.abs(c.t)), y2 = 56, h = 20;
  let x0 = MU0;
  for (let i = 0; i < full && i < 80; i++) { const x1 = x0 + dir * c.se; s += `<rect x="${Math.min(sx(x0), sx(x1))}" y="${y2}" width="${Math.abs(sx(x1) - sx(x0))}" height="${h}" fill="var(--accent-soft)" fill-opacity="${i % 2 ? .45 : .8}"/>`; x0 = x1; }
  const rest = Math.abs(c.t) - full;
  if (rest > 0.01) { const x1 = x0 + dir * c.se * rest; s += `<rect x="${Math.min(sx(x0), sx(x1))}" y="${y2}" width="${Math.abs(sx(x1) - sx(x0))}" height="${h}" fill="none" stroke="var(--accent-soft)" stroke-dasharray="3 2"/>`; }
  s += `<text x="${L}" y="${y2 + h + 16}">Ein Block = ein Standardfehler (${fmt(c.se, 2)}°) · ${fmt(Math.abs(c.t), 2)} Blöcke passen in das Signal</text>`;
  $("ruler").innerHTML = s;
  $("ruler").setAttribute("aria-label", `Signal ${fmt(c.diff)} Grad entspricht ${fmt(Math.abs(c.t), 2)} Standardfehlern`);
}

// ---------- 3 t-Verteilung ----------
function drawT(c) {
  const top = 16, base = 236, T = c.T;
  const cmax = Math.max(...T.crit.map(Math.abs));
  const m = Math.min(14, Math.max(5, Math.abs(c.t) + 1.5, cmax + 1.5)), a = -m, b = m;
  const sx = v => L + (v - a) / (b - a) * (R - L);
  const peak = Math.max(tpdf(0, c.df), S.showNormal ? phi(0) : 0) * 1.1, sy = d => base - d / peak * (base - top);
  const pts = (f, lo, hi) => { const o = []; lo = Math.max(a, lo); hi = Math.min(b, hi); if (hi <= lo) return o; const N = Math.max(2, Math.ceil((hi - lo) / (b - a) * 400)); for (let i = 0; i <= N; i++) { const v = lo + (hi - lo) * i / N; o.push([sx(v), sy(f(v))]); } return o; };
  const f = v => tpdf(v, c.df);
  let s = "";
  for (const v of ticks(a, b, 14)) s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${top}" y2="${base}" stroke="var(--grid)"/><text x="${sx(v)}" y="${base + 18}" text-anchor="middle">${fmt(v, 0)}</text>`;
  // Ablehnungsbereich
  if (S.dir !== "left") s += `<path d="${area(pts(f, T.crit[T.crit.length - 1], b), base)}" fill="var(--alpha-fill)" fill-opacity=".6"/>`;
  if (S.dir !== "right") s += `<path d="${area(pts(f, a, T.crit[0]), base)}" fill="var(--alpha-fill)" fill-opacity=".6"/>`;
  // p-Fläche
  const at = Math.abs(c.t);
  if (S.dir === "two") s += `<path d="${area(pts(f, at, b), base)}" fill="var(--pval)" fill-opacity=".9"/><path d="${area(pts(f, a, -at), base)}" fill="var(--pval)" fill-opacity=".9"/>`;
  if (S.dir === "right") s += `<path d="${area(pts(f, c.t, b), base)}" fill="var(--pval)" fill-opacity="${c.t < 0 ? .45 : .9}"/>`;
  if (S.dir === "left") s += `<path d="${area(pts(f, a, c.t), base)}" fill="var(--pval)" fill-opacity="${c.t > 0 ? .45 : .9}"/>`;
  s += `<path d="${path(pts(f, a, b))}" fill="none" stroke="var(--fg)" stroke-width="2"/>`;
  if (S.showNormal) s += `<path d="${path(pts(phi, a, b))}" fill="none" stroke="var(--muted)" stroke-width="1.6" stroke-dasharray="6 4"/>`;
  s += `<line x1="${L}" x2="${R}" y1="${base}" y2="${base}" stroke="var(--line)"/>`;
  T.crit.forEach(v => { s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${top + 26}" y2="${base}" stroke="var(--kontrolle)" stroke-width="1.5" stroke-dasharray="4 3"/>`; });
  // Beschriftung des kritischen Werts auf der vom beobachteten t abgewandten Seite
  const cl = S.dir === "two" ? (c.t >= 0 ? T.crit[1] : T.crit[0]) : T.crit[0], away = c.t > cl ? -1 : 1;
  s += `<text x="${sx(cl) + away * 8}" y="${top + 52}" text-anchor="${away < 0 ? "end" : "start"}" style="fill:var(--alpha-ink)">kritisches t = ${T.critTxt}</text>`;
  const tx = Math.max(a, Math.min(b, c.t)), off = Math.abs(c.t) > b;
  s += `<line x1="${sx(tx)}" x2="${sx(tx)}" y1="${top}" y2="${base}" stroke="var(--pval)" stroke-width="2.5"/>`;
  s += `<text x="${sx(tx) + (c.t >= 0 ? -8 : 8)}" y="${top + 12}" text-anchor="${c.t >= 0 ? "end" : "start"}" class="strong">t = ${fmt(c.t, 2)}${off ? " (außerhalb)" : ""}</text>`;
  if (S.dir !== "two") s += `<text x="${S.dir === "right" ? R : L}" y="${base - 8 - 120}" text-anchor="${S.dir === "right" ? "end" : "start"}" style="fill:var(--alpha-ink)">${S.dir === "right" ? "ganzes α rechts →" : "← ganzes α links"}</text>`;
  if (S.showNormal) s += `<text x="${L}" y="${top + 12}">gestrichelt: Standardnormalverteilung</text>`;
  s += `<text x="${R}" y="${base + 38}" text-anchor="end">t-Wert · df = ${c.df}</text>`;
  $("tdist").innerHTML = s;
  $("tdist").setAttribute("aria-label", `t-Verteilung mit ${c.df} Freiheitsgraden, ${DIRS[S.dir].name}, beobachtetes t ${fmt(c.t, 2)}, p ${fmtP(T.p)}`);
  $("t-stats").innerHTML = readout("t-Wert", fmt(c.t, 2)) + readout("kritisches t", T.critTxt, "r-alpha") + readout(`p-Wert (${DIRS[S.dir].name})`, fmtP(T.p), "r-p") +
    readout(`Entscheidung bei α = ${fmt(S.alpha, 2)}`, T.rej ? "H0 verwerfen" : "H0 beibehalten", "r-decision" + (T.rej ? " sig" : ""));
  // Vergleich der drei Richtungen
  const rows = ["two", "right", "left"].map(k => { const r = testFor(k, c.t, c.df, S.alpha); return `<tr class="${k === S.dir ? "cur" : ""}"><td><b>${DIRS[k].name}</b><br><span class="muted">H1: ${DIRS[k].h1}</span></td><td>${r.critTxt}</td><td>${k === "two" ? "2 · (1 − F(|t|))" : k === "right" ? "1 − F(t)" : "F(t)"}</td><td>${fmtP(r.p)}</td><td>${r.rej ? "<b>H0 verwerfen</b>" : "H0 beibehalten"}</td></tr>`; });
  $("dir-tab").innerHTML = `<thead><tr><th>Hypothese</th><th>kritisches t</th><th>Formel für p</th><th>p-Wert</th><th>Entscheidung</th></tr></thead><tbody>${rows.join("")}</tbody>`;
  const r2 = testFor("two", c.t, c.df, S.alpha), rR = testFor("right", c.t, c.df, S.alpha), rL = testFor("left", c.t, c.df, S.alpha);
  const good = c.t >= 0 ? rR : rL, wrong = c.t >= 0 ? rL : rR, goodName = c.t >= 0 ? "rechtsseitig" : "linksseitig", wrongName = c.t >= 0 ? "linksseitig" : "rechtsseitig";
  let txt = `Einseitig in der passenden Richtung (hier ${goodName}) ist der p-Wert halb so groß wie zweiseitig (${fmtP(good.p)} statt ${fmtP(r2.p)}), weil nur ein Rand zählt. In der falschen Richtung (${wrongName}) ist er ${fmtP(wrong.p)}: Ein t auf der anderen Seite führt nie zur Ablehnung, egal wie groß es ist.`;
  if (good.rej && !r2.rej) txt += ` <b>Genau hier entscheidet die Richtung:</b> Einseitig wird H0 verworfen, zweiseitig nicht. Deshalb muss die Richtung vor der Datenerhebung feststehen. Wer sie nach einem Blick auf die Daten wählt, verdoppelt heimlich sein α.`;
  else txt += " Die Richtung wird vor der Datenerhebung festgelegt, nie nach einem Blick auf die Daten.";
  $("dir-callout").innerHTML = txt;
}

// ---------- 4 Verteilungsfunktion ----------
function drawCdf(c) {
  const top = 18, base = 280, PL = 70, PR = R, T = c.T, dir = S.dir, a0 = S.alpha;
  const cmax = Math.max(...T.crit.map(Math.abs));
  const m = Math.min(14, Math.max(5, Math.abs(c.t) + 1.5, cmax + 1.5)), a = -m, b = m;
  const sx = v => PL + (v - a) / (b - a) * (PR - PL), sy = p => base - p * (base - top), F = v => tcdf(v, c.df);
  let s = "";
  const accL = dir === "right" ? PL : sx(T.crit[0]), accR = dir === "left" ? PR : sx(T.crit[T.crit.length - 1]);
  s += `<rect x="${accL}" y="${top}" width="${accR - accL}" height="${base - top}" fill="var(--highlight)"/>`;
  if (dir !== "right") s += `<rect x="${PL}" y="${top}" width="${sx(T.crit[0]) - PL}" height="${base - top}" fill="var(--alpha-fill)" fill-opacity=".25"/>`;
  if (dir !== "left") s += `<rect x="${sx(T.crit[T.crit.length - 1])}" y="${top}" width="${PR - sx(T.crit[T.crit.length - 1])}" height="${base - top}" fill="var(--alpha-fill)" fill-opacity=".25"/>`;
  [0, 0.25, 0.5, 0.75, 1].forEach(p => s += `<line x1="${PL}" x2="${PR}" y1="${sy(p)}" y2="${sy(p)}" stroke="var(--grid)"/><text x="${PL - 8}" y="${sy(p) + 4}" text-anchor="end">${fmt(p, 2)}</text>`);
  for (const v of ticks(a, b, 14)) s += `<text x="${sx(v)}" y="${base + 18}" text-anchor="middle">${fmt(v, 0)}</text>`;
  const pts = []; for (let i = 0; i <= 400; i++) { const v = a + (b - a) * i / 400; pts.push([sx(v), sy(F(v))]); }
  s += `<path d="${path(pts)}" fill="none" stroke="var(--fg)" stroke-width="2.5"/>`;
  const qs = dir === "two" ? [[1 - a0 / 2, T.crit[1], "1 − α/2"], [a0 / 2, T.crit[0], "α/2"]] : dir === "right" ? [[1 - a0, T.crit[0], "1 − α"]] : [[a0, T.crit[0], "α"]];
  qs.forEach(([p, v, lab]) => {
    s += `<path d="M${PL} ${sy(p)} H${sx(v)} V${base}" fill="none" stroke="var(--alpha-ink)" stroke-width="2" stroke-dasharray="6 4"/><circle cx="${sx(v)}" cy="${sy(p)}" r="4.5" fill="var(--alpha-ink)"/>`;
    s += `<text x="${PL + 6}" y="${sy(p) - 7}" style="fill:var(--alpha-ink)">${lab} = ${fmt(p, 3)}</text>`;
    s += `<text class="strong" x="${sx(v)}" y="${base + 36}" text-anchor="middle" style="fill:var(--alpha-ink)">${fmt(v, 2)}</text>`;
  });
  const tObs = dir === "two" ? Math.abs(c.t) : c.t, tx = Math.max(a, Math.min(b, tObs)), Ft = F(tObs);
  s += `<path d="M${sx(tx)} ${base} V${sy(Ft)} H${PL}" fill="none" stroke="var(--pval)" stroke-width="2.5"/><circle cx="${sx(tx)}" cy="${sy(Ft)}" r="5" fill="var(--pval)"/>`;
  const lr = sx(tx) > PR - 220;
  s += `<text class="strong" x="${sx(tx) + (lr ? -8 : 8)}" y="${sy(Ft) + (Ft > 0.5 ? 18 : -10)}" text-anchor="${lr ? "end" : "start"}">${dir === "two" ? "|t|" : "t"} = ${fmt(tObs, 2)}, F = ${fmt(Ft, 4)}</text>`;
  s += `<text x="${(accL + accR) / 2}" y="${dir === "left" ? base - 30 : top + 46}" text-anchor="middle">Annahmebereich</text>`;
  s += `<text x="${PR}" y="${base + 52}" text-anchor="end">t-Wert · df = ${c.df}</text><text x="18" y="${(top + base) / 2}" transform="rotate(-90 18 ${(top + base) / 2})" text-anchor="middle">F(t)</text>`;
  $("tcdf").innerHTML = s;
  $("tcdf").setAttribute("aria-label", `Verteilungsfunktion der t-Verteilung, ${DIRS[dir].name}, kritisches t ${T.critTxt}, p ${fmtP(T.p)}`);
  const pe = pEq(T.p), dec = T.rej ? "H0 verwerfen" : "H0 beibehalten", cmp = T.p < a0 ? "<" : "≥";
  let st;
  if (dir === "two") st = [
    ["Annahmebereich festlegen.", `Er enthält die mittleren ${fmt((1 - a0) * 100, 0)} % der t-Verteilung, links und rechts bleiben je α/2 = ${fmt(a0 / 2, 3)}.`, `F(t) zwischen ${fmt(a0 / 2, 3)} und ${fmt(1 - a0 / 2, 3)}`],
    ["Kritischen Wert rückwärts ablesen.", `Gesucht ist das t, bei dem F(t) den Wert ${fmt(1 - a0 / 2, 3)} erreicht. Wegen der Symmetrie liegt der linke bei minus demselben Wert.`, `t<sub>krit</sub> = F⁻¹(${fmt(1 - a0 / 2, 3)}; df = ${c.df}) = ±${fmt(T.crit[1], 3)}`],
    ["Bereiche benennen.", "", `Annahmebereich: −${fmt(T.crit[1], 2)} ≤ t ≤ ${fmt(T.crit[1], 2)} · Ablehnungsbereich: |t| > ${fmt(T.crit[1], 2)}`],
    ["p-Wert vorwärts ablesen.", "Vom beobachteten |t| hinauf zur Kurve. Was rechts übrig bleibt, zählt doppelt, weil beide Ränder zählen.", `p = 2 · (1 − F(${fmt(tObs, 2)})) = 2 · (1 − ${fmt(Ft, 4)}) ${pe}`],
    ["Entscheiden.", "Beide Wege führen zum selben Ergebnis.", `|t| = ${fmt(tObs, 2)} ${T.rej ? ">" : "≤"} ${fmt(T.crit[1], 2)} und p ${pe} ${cmp} α = ${fmt(a0, 2)} → ${dec}`]];
  else if (dir === "right") st = [
    ["Annahmebereich festlegen.", "H1 sagt μ > 90° voraus. Das ganze α kommt deshalb an den rechten Rand, links gibt es keinen Ablehnungsbereich.", `F(t) bis ${fmt(1 - a0, 3)}`],
    ["Kritischen Wert rückwärts ablesen.", "Er liegt näher an der Mitte als zweiseitig, weil α nicht geteilt wird.", `t<sub>krit</sub> = F⁻¹(${fmt(1 - a0, 3)}; df = ${c.df}) = ${fmt(T.crit[0], 3)}`],
    ["Bereiche benennen.", "", `Annahmebereich: t ≤ ${fmt(T.crit[0], 2)} · Ablehnungsbereich: t > ${fmt(T.crit[0], 2)}`],
    ["p-Wert vorwärts ablesen.", "Nur die Fläche rechts vom beobachteten t zählt, ohne Faktor 2.", `p = 1 − F(${fmt(c.t, 2)}) = 1 − ${fmt(Ft, 4)} ${pe}`],
    ["Entscheiden.", "", `t = ${fmt(c.t, 2)} ${T.rej ? ">" : "≤"} ${fmt(T.crit[0], 2)} und p ${pe} ${cmp} α = ${fmt(a0, 2)} → ${dec}`]];
  else st = [
    ["Annahmebereich festlegen.", "H1 sagt μ < 90° voraus. Das ganze α kommt deshalb an den linken Rand, rechts gibt es keinen Ablehnungsbereich.", `F(t) ab ${fmt(a0, 3)}`],
    ["Kritischen Wert rückwärts ablesen.", "Gesucht ist das t, bei dem F(t) erst α erreicht. Er ist negativ.", `t<sub>krit</sub> = F⁻¹(${fmt(a0, 3)}; df = ${c.df}) = ${fmt(T.crit[0], 3)}`],
    ["Bereiche benennen.", "", `Annahmebereich: t ≥ ${fmt(T.crit[0], 2)} · Ablehnungsbereich: t < ${fmt(T.crit[0], 2)}`],
    ["p-Wert vorwärts ablesen.", "Nur die Fläche links vom beobachteten t zählt: Das ist F(t) selbst.", `p = F(${fmt(c.t, 2)}) ${pe}`],
    ["Entscheiden.", "", `t = ${fmt(c.t, 2)} ${T.rej ? "<" : "≥"} ${fmt(T.crit[0], 2)} und p ${pe} ${cmp} α = ${fmt(a0, 2)} → ${dec}`]];
  $("calc-steps").innerHTML = st.map(([b, t, e]) => `<li><b>${b}</b> ${t}<span class="eq">${e}</span></li>`).join("");
}


// ---------- 3 Kritischer Wert: Simulation unter H0, verschiebbare Grenze, t-Tabelle ----------
const H = { ts: [], df: null, last: null };
const randn = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
S.crit = 1.2;
function simH0(k) {
  const n = S.n;
  for (let j = 0; j < k; j++) { let sm = 0, q = 0; for (let i = 0; i < n; i++) { const x = MU0 + S.sigma * randn(); sm += x; q += x * x; } const m = sm / n, sd = Math.sqrt((q - n * m * m) / (n - 1)); H.last = (m - MU0) / (sd / Math.sqrt(n)); H.ts.push(H.last); }
  drawH0();
}
const tailArea = (c, df) => S.dir === "two" ? 2 * (1 - tcdf(c, df)) : 1 - tcdf(c, df);
const critFor = (df, a = S.alpha) => S.dir === "two" ? tinv(1 - a / 2, df) : tinv(1 - a, df);
const beyond = (t, c) => S.dir === "two" ? Math.abs(t) > c : S.dir === "right" ? t > c : t < -c;
const H0X = { a: -5, b: 5, L: 24, R: 896, T: 30, B: 250 };
function drawH0() {
  const df = S.n - 1, { a, b, L: l, R: r, T: top, B: base } = H0X, c = S.crit;
  if (H.df !== df) { H.ts = []; H.df = df; H.last = null; }
  const sx = v => l + (v - a) / (b - a) * (r - l), bw = 0.25, nb = Math.round((b - a) / bw), cnt = new Array(nb).fill(0);
  H.ts.forEach(t => { const i = Math.min(nb - 1, Math.max(0, Math.floor((t - a) / bw))); cnt[i]++; });
  const N = H.ts.length, dens = cnt.map(k => N ? k / (N * bw) : 0);
  const peak = Math.max(tpdf(0, df), ...dens) * 1.12, sy = d => base - d / peak * (base - top);
  let g = "";
  for (let v = -5; v <= 5; v++) g += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${top}" y2="${base}" stroke="var(--grid)"/><text x="${sx(v)}" y="${base + 18}" text-anchor="middle">${fmt(v, 0)}</text>`;
  // Fläche jenseits der Grenze unter der Kurve
  const seg = (lo, hi) => { const o = []; for (let i = 0; i <= 80; i++) { const v = lo + (hi - lo) * i / 80; o.push([sx(v), sy(tpdf(v, df))]); } return o; };
  if (S.dir !== "left") g += `<path d="${area(seg(Math.min(c, b), b), base)}" fill="var(--alpha-fill)" fill-opacity=".35"/>`;
  if (S.dir !== "right") g += `<path d="${area(seg(a, Math.max(-c, a)), base)}" fill="var(--alpha-fill)" fill-opacity=".35"/>`;
  cnt.forEach((k, i) => { if (!k) return; const lo = a + i * bw, mid = lo + bw / 2, out = beyond(mid, c); g += `<rect x="${sx(lo) + 1}" y="${sy(dens[i])}" width="${sx(lo + bw) - sx(lo) - 2}" height="${base - sy(dens[i])}" fill="${out ? "var(--alpha-ink)" : "var(--pal-3)"}" fill-opacity="${out ? .85 : .55}"/>`; });
  g += `<path d="${path(seg(a, b))}" fill="none" stroke="var(--fg)" stroke-width="2"/>`;
  g += `<line x1="${l}" x2="${r}" y1="${base}" y2="${base}" stroke="var(--line)"/>`;
  if (H.last != null) { const x = sx(Math.max(a, Math.min(b, H.last))); g += `<path d="M${x} ${base + 2} l-6 10 h12 z" fill="var(--therapie)"/>`; }
  const lines = S.dir === "two" ? [-c, c] : S.dir === "right" ? [c] : [-c];
  const tail = tailArea(c, df), each = S.dir === "two" ? tail / 2 : tail;
  lines.forEach(v => {
    const x = sx(v);
    g += `<g class="crit-line" data-side="${v < 0 ? -1 : 1}"><line x1="${x}" x2="${x}" y1="${top - 14}" y2="${base}" stroke="var(--alpha-ink)" stroke-width="2.5" stroke-dasharray="6 4"/><line x1="${x}" x2="${x}" y1="${top - 14}" y2="${base}" stroke="transparent" stroke-width="22"/><circle cx="${x}" cy="${top - 14}" r="8" fill="var(--alpha-ink)"/><path d="M${x - 4} ${top - 14} h8 M${x - 2} ${top - 17} l-3 3 3 3 M${x + 2} ${top - 17} l3 3 -3 3" stroke="var(--on-accent)" stroke-width="1.4" fill="none"/></g>`;
    g += `<text x="${x + (v > 0 ? 12 : -12)}" y="${top + 4}" text-anchor="${v > 0 ? "start" : "end"}" style="fill:var(--alpha-ink)" class="strong">${fmt(v, 2)}</text>`;
    g += `<text x="${x + (v > 0 ? 12 : -12)}" y="${top + 22}" text-anchor="${v > 0 ? "start" : "end"}" style="fill:var(--alpha-ink)">Fläche ${fmt(each * 100, 1)} %</text>`;
  });
  g += `<text x="${r}" y="${base + 40}" text-anchor="end">t-Werte der Kliniken mit μ = 90° · df = ${df}</text>`;
  if (!N) g += `<text x="${sx(0)}" y="${top + 60}" text-anchor="middle">Noch keine Klinik simuliert. Die Kurve zeigt, was herauskommen wird.</text>`;
  $("h0sim").innerHTML = g;
  // Kennzahlen
  const k = H.ts.filter(t => beyond(t, c)).length, target = critFor(df), hit = Math.abs(c - target) < 0.015;
  $("crit-v").textContent = (S.dir === "two" ? "±" : S.dir === "left" ? "−" : "") + fmt(c, 2);
  $("crit").value = c;
  $("h0-count").textContent = N ? `${N.toLocaleString("de-DE")} Kliniken, letzte: t = ${fmt(H.last, 2)}` : "";
  $("crit-stats").innerHTML = readout("Fläche jenseits der Grenze", fmt(tail * 100, 1) + " %", "r-alpha") +
    readout("simuliert jenseits", N ? `${fmt(100 * k / N, 1)} %` : "–") + readout(`Ziel: α = ${fmt(S.alpha, 2)}`, fmt(S.alpha * 100, 0) + " %") +
    readout("richtiger kritischer Wert", (S.dir === "two" ? "±" : S.dir === "left" ? "−" : "") + fmt(target, 2), "r-decision" + (hit ? " sig" : ""));
  const side = S.dir === "two" ? `an beiden Rändern je ${fmt(S.alpha / 2 * 100, 1)} %` : `am ${S.dir === "right" ? "rechten" : "linken"} Rand die ganzen ${fmt(S.alpha * 100, 0)} %`;
  $("crit-callout").innerHTML = hit
    ? `<b>Getroffen.</b> Jenseits von ${$("crit-v").textContent} liegen ${side}. Das ist der kritische Wert: Nur so viele Kliniken, die das Kriterium genau erfüllen, landen trotzdem im Ablehnungsbereich. α ist also die Fehlalarm-Rate, die wir uns bei wahrer H0 erlauben.`
    : `Verschieben Sie die Grenze, bis ${side} übrig bleiben. ${tail > S.alpha ? "Im Moment liegt zu viel Fläche jenseits: Die Grenze muss weiter nach außen." : "Im Moment liegt zu wenig Fläche jenseits: Die Grenze darf weiter nach innen."}`;
}
// Ziehen mit Maus oder Finger
(() => {
  const svg = $("h0sim"); let drag = false;
  const toT = e => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const q = pt.matrixTransform(svg.getScreenCTM().inverse()); return H0X.a + (q.x - H0X.L) / (H0X.R - H0X.L) * (H0X.b - H0X.a); };
  const set = e => { S.crit = Math.max(0.3, Math.min(4.5, Math.round(Math.abs(toT(e)) * 100) / 100)); drawH0(); };
  svg.addEventListener("pointerdown", e => { if (!e.target.closest(".crit-line")) return; drag = true; svg.setPointerCapture(e.pointerId); e.preventDefault(); });
  svg.addEventListener("pointermove", e => { if (drag) set(e); });
  ["pointerup", "pointercancel"].forEach(ev => svg.addEventListener(ev, () => { drag = false; }));
})();

// t-Tabelle
const TAB_A2 = [0.20, 0.10, 0.05, 0.02, 0.01];
function drawTable(c) {
  const df = c.df, rows = [...Array(30).keys()].map(i => i + 1).concat([40, 50, 60, 100]);
  if (!rows.includes(df)) { rows.push(df); rows.sort((x, y) => x - y); }
  const colA2 = S.dir === "two" ? S.alpha : 2 * S.alpha, col = TAB_A2.findIndex(v => Math.abs(v - colA2) < 1e-9);
  let h = `<thead><tr><th>α zweiseitig</th>${TAB_A2.map((v, i) => `<th class="${i === col ? "hc" : ""}">${fmt(v, 2)}</th>`).join("")}</tr><tr><th>α einseitig</th>${TAB_A2.map((v, i) => `<th class="${i === col ? "hc" : ""}">${fmt(v / 2, v / 2 < 0.01 ? 3 : 3)}</th>`).join("")}</tr></thead><tbody>`;
  rows.forEach(d => { h += `<tr class="${d === df ? "hr" : ""}"><th>${d}</th>${TAB_A2.map((v, i) => `<td class="${i === col ? "hc" : ""}${d === df && i === col ? " hit" : ""}">${fmt(tinv(1 - v / 2, d), 3)}</td>`).join("")}</tr>`; });
  h += `<tr class="inf"><th>∞</th>${TAB_A2.map((v, i) => { const z = tinv(1 - v / 2, 100000); return `<td class="${i === col ? "hc" : ""}">${fmt(z, 3)}</td>`; }).join("")}</tr></tbody>`;
  $("ttab").innerHTML = h;
  const val = tinv(1 - colA2 / 2, df);
  $("ttab-note").innerHTML = `Ihr Fall: df = ${df}, α = ${fmt(S.alpha, 2)} ${DIRS[S.dir].name} → Spalte „${S.dir === "two" ? "zweiseitig" : "einseitig"} ${fmt(S.alpha, 2)}“ → <b>${S.dir === "two" ? "±" : S.dir === "left" ? "−" : ""}${fmt(val, 3)}</b>.${S.dir === "left" ? " Die Tabelle listet nur positive Werte, linksseitig nimmt man das Minus dazu." : ""}${df > 30 && ![40, 50, 60, 100].includes(df) ? " In gedruckten Tabellen fehlt diese Zeile oft, dann nimmt man die nächstkleinere (strenger)." : ""}`;
  const wrap = $("ttab-wrap"), row = wrap.querySelector("tr.hr");
  if (row && wrap.offsetParent) wrap.scrollTop = row.offsetTop - wrap.clientHeight / 2;
}

// ---------- Verdrahtung ----------
function render() {
  $("mu-v").textContent = S.mu + "°"; $("sigma-v").textContent = S.sigma + "°"; $("n-v").textContent = `${S.n} (df ${S.n - 1})`;
  const c = compute(); drawRaw(c); drawHyp(); drawRuler(c); drawH0(); drawTable(c); drawT(c); drawCdf(c);
}
const syncInputs = () => { $("mu").value = S.mu; $("sigma").value = S.sigma; $("n").value = S.n; };
[["mu", "mu"], ["sigma", "sigma"], ["n", "n"]].forEach(([id, k]) => $(id).addEventListener("input", e => { S[k] = +e.target.value; render(); }));
document.querySelectorAll("[data-alpha]").forEach(b => b.addEventListener("click", () => { S.alpha = +b.dataset.alpha; document.querySelectorAll("[data-alpha]").forEach(x => x.setAttribute("aria-pressed", x === b)); render(); }));
document.querySelectorAll("[data-dir]").forEach(b => b.addEventListener("click", () => { S.dir = b.dataset.dir; document.querySelectorAll("[data-dir]").forEach(x => x.setAttribute("aria-pressed", x === b)); render(); }));
$("shownormal").addEventListener("change", e => { S.showNormal = e.target.checked; render(); });
$("resample").addEventListener("click", () => { S.seed = (Math.random() * 2 ** 31) | 0; render(); });
// Grenzfall: einseitig signifikant, zweiseitig nicht (bei α = 0,05)
const edgeOk = (t, df) => { const p1 = 1 - tcdf(t, df); return p1 > 0.012 && p1 < 0.045 && 2 * p1 > 0.05; };
document.querySelectorAll("[data-preset]").forEach(b => b.addEventListener("click", () => {
  const k = b.dataset.preset;
  if (k === "h0") { Object.assign(S, { mu: 90, sigma: 10, n: 20 }); S.seed = (Math.random() * 2 ** 31) | 0; }
  if (k === "edge") { Object.assign(S, { mu: 94, sigma: 10, n: 20 }); S.seed = findSeed(edgeOk); }
  if (k === "bad") { Object.assign(S, { mu: 86, sigma: 10, n: 20 }); S.seed = (Math.random() * 2 ** 31) | 0; }
  syncInputs(); render();
}));
S.seed = findSeed(edgeOk);
render();
$("h0-1").onclick = () => simH0(1); $("h0-100").onclick = () => simH0(100); $("h0-1000").onclick = () => simH0(1000);
$("h0-reset").onclick = () => { H.ts = []; H.last = null; drawH0(); };
$("crit").addEventListener("input", e => { S.crit = +e.target.value; drawH0(); });
$("crit-snap").onclick = () => { S.crit = Math.round(critFor(S.n - 1) * 100) / 100; drawH0(); };
$("calc").addEventListener("toggle", () => { if ($("calc").open) drawTable(compute()); });
if (location.hash === "#calc") { $("calc").open = true; $("calc").scrollIntoView(); }
})();
