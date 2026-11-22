/* Diskret und stetig · Stats Lab
   Links Binomialverteilung (Wahrscheinlichkeitsfunktion und Treppen-Verteilungsfunktion),
   rechts Normal-, t- oder Exponentialverteilung (Dichte und glatte Verteilungsfunktion). */
(() => {
"use strict";

/* ---------- Mathematik ---------- */
const LG = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
function lgamma(x) { if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x); x -= 1; let a = 0.99999999999980993; const t = x + 7.5; for (let i = 0; i < 8; i++) a += LG[i] / (x + i + 1); return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a); }
function betacf(a, b, x) { const FP = 1e-300; let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < FP) d = FP; d = 1 / d; let h = d; for (let m = 1; m <= 300; m++) { const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2)); d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; h *= d * c; aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2)); d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-14) break; } return h; }
function ibeta(x, a, b) { if (x <= 0) return 0; if (x >= 1) return 1; const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)); return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b; }
function erf(x) { const s = x < 0 ? -1 : 1; x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)); }
const Phi = z => 0.5 * (1 + erf(z / Math.SQRT2));
const phi = z => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
const tcdf = (t, df) => { const ib = ibeta(df / (df + t * t), df / 2, 0.5); return t >= 0 ? 1 - 0.5 * ib : 0.5 * ib; };
const tpdf = (t, df) => Math.exp(lgamma((df + 1) / 2) - lgamma(df / 2) - 0.5 * Math.log(df * Math.PI) - ((df + 1) / 2) * Math.log(1 + t * t / df));
function binom(n, k) { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; }
const bpmf = (n, p, k) => (k < 0 || k > n) ? 0 : binom(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
function bcdf(n, p, k) { if (k < 0) return 0; let s = 0; for (let i = 0; i <= Math.min(k, n); i++) s += bpmf(n, p, i); return Math.min(1, s); }

/* ---------- Helfer ---------- */
const $ = id => document.getElementById(id);
const tz = x => String(x).replace(/\./g, "{.}").replace(/,/g, "{,}").replace(/−/g, "-").replace(/ %/g, "\\,\\%").replace(/≤/g, "\\le ").replace(/≥/g, "\\ge ");
const TB = (t, fb) => window.katex ? texBlock(t) : fb;
const fmt = (x, d = 3) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (x, d = 1) => (x * 100).toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }) + " %";
const path = pts => pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join("");
const area = (pts, y0) => pts.length ? path(pts) + `L${pts[pts.length - 1][0].toFixed(1)},${y0}L${pts[0][0].toFixed(1)},${y0}Z` : "";
const readout = (l, v) => `<div class="readout"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;
function ticks(lo, hi, target = 8) { const span = hi - lo, raw = span / target, mag = Math.pow(10, Math.floor(Math.log10(raw))); const step = [1, 2, 5, 10].map(m => m * mag).find(s => span / s <= target) || 10 * mag; const out = []; for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10)); return out; }
const L = 46, R = 456, T = 14, B = 196;
function yAxis(sy, max, isCdf) {
  let s = "";
  const tv = isCdf ? [0, 0.25, 0.5, 0.75, 1] : ticks(0, max, 4);
  tv.forEach(v => { s += `<line x1="${L}" x2="${R}" y1="${sy(v)}" y2="${sy(v)}" stroke="var(--grid)"/><text x="${L - 6}" y="${sy(v) + 4}" text-anchor="end">${fmt(v, isCdf ? 2 : (v < 0.1 && v > 0 ? 3 : 2))}</text>`; });
  return s;
}
function segButtons(el, items, current, attr) {
  el.innerHTML = items.map(([k, label]) => `<button type="button" data-${attr}="${k}" aria-pressed="${k === current}">${label}</button>`).join("");
}

/* =====================================================================
   Diskret: Binomial
   ===================================================================== */
const D = { n: 10, p: 0.6, mode: "btw", a: 4, b: 7 };
const DMODES = [["eq", "X = k"], ["le", "X ≤ b"], ["ge", "X ≥ a"], ["btw", "a ≤ X ≤ b"]];

function dRange() {
  const { n, a, b, mode } = D;
  if (mode === "eq") return [a, a];
  if (mode === "le") return [0, b];
  if (mode === "ge") return [a, n];
  return [Math.min(a, b), Math.max(a, b)];
}
function dQuestion() {
  const { a, b, mode } = D;
  if (mode === "eq") return `P(X = ${a})`;
  if (mode === "le") return `P(X ≤ ${b})`;
  if (mode === "ge") return `P(X ≥ ${a})`;
  return `P(${Math.min(a, b)} ≤ X ≤ ${Math.max(a, b)})`;
}

function renderD() {
  const { n, p } = D;
  ["da", "db"].forEach(id => { $(id).max = n; });
  D.a = Math.min(D.a, n); D.b = Math.min(D.b, n); $("da").value = D.a; $("db").value = D.b;
  $("bn-v").textContent = n; $("bp-v").textContent = pct(p, 0);
  $("da-wrap").hidden = D.mode === "le"; $("db-wrap").hidden = D.mode === "eq" || D.mode === "ge";
  $("da-l").textContent = D.mode === "eq" ? "k" : "a (untere Grenze)"; $("db-l").textContent = "b (obere Grenze)";
  $("da-v").textContent = D.a; $("db-v").textContent = D.b;
  document.querySelectorAll("[data-dm]").forEach(x => x.setAttribute("aria-pressed", x.dataset.dm === D.mode));

  const [lo, hi] = dRange();
  const prob = bcdf(n, p, hi) - bcdf(n, p, lo - 1);
  $("d-result").innerHTML = `<span class="q">${dQuestion()}</span><span class="a">${pct(prob)}</span>`;

  const sx = k => L + (k + 0.5) / (n + 1) * (R - L), bw = Math.max(2, (R - L) / (n + 1) * 0.72);
  const pm = Array.from({ length: n + 1 }, (_, k) => bpmf(n, p, k)), ymax = Math.max(...pm) * 1.12;
  const sy = v => B - v / ymax * (B - T);
  const showEvery = n <= 20 ? 1 : 5;
  let s = yAxis(sy, ymax, false);
  pm.forEach((v, k) => {
    const inR = k >= lo && k <= hi;
    s += `<rect x="${(sx(k) - bw / 2).toFixed(1)}" y="${sy(v).toFixed(1)}" width="${bw.toFixed(1)}" height="${(B - sy(v)).toFixed(1)}" fill="${inR ? "var(--therapie)" : "var(--area-b)"}"/>`;
    if (k % showEvery === 0) s += `<text x="${sx(k)}" y="${B + 16}" text-anchor="middle">${k}</text>`;
  });
  s += `<line x1="${L}" x2="${R}" y1="${B}" y2="${B}" stroke="var(--line)"/><text x="${R}" y="${B + 32}" text-anchor="end">k Erfolge</text>`;
  $("d-pmf").innerHTML = s;
  $("d-pmf").setAttribute("aria-label", `Binomialverteilung n = ${n}, p = ${pct(p, 0)}, ${dQuestion()} = ${pct(prob)}`);

  // Treppenfunktion
  const cx = k => L + (k + 0.5) / (n + 1) * (R - L);
  const sc = v => B - v * (B - T);
  let c = yAxis(sc, 1, true);
  for (let k = 0; k <= n; k++) {
    const F = bcdf(n, p, k), Fp = bcdf(n, p, k - 1);
    const x0 = cx(k), x1 = k < n ? cx(k + 1) : R;
    c += `<line x1="${x0}" x2="${x1}" y1="${sc(F)}" y2="${sc(F)}" stroke="var(--fg)" stroke-width="2"/>`;
    const inR = k >= lo && k <= hi;
    c += `<line x1="${x0}" x2="${x0}" y1="${sc(Fp)}" y2="${sc(F)}" stroke="${inR ? "var(--therapie)" : "var(--line)"}" stroke-width="${inR ? 4 : 1.5}" ${inR ? "" : 'stroke-dasharray="3 3"'}/>`;
    c += `<circle cx="${x0}" cy="${sc(Fp)}" r="3" fill="var(--surface)" stroke="var(--fg)" stroke-width="1.5"/><circle cx="${x0}" cy="${sc(F)}" r="3.2" fill="var(--fg)"/>`;
    if (k % showEvery === 0) c += `<text x="${x0}" y="${B + 16}" text-anchor="middle">${k}</text>`;
  }
  c += `<line x1="${L}" x2="${L}" y1="${sc(0)}" y2="${sc(0)}"/>`;
  const Fhi = bcdf(n, p, hi), Flo = bcdf(n, p, lo - 1);
  c += `<line x1="${L}" x2="${cx(hi)}" y1="${sc(Fhi)}" y2="${sc(Fhi)}" stroke="var(--therapie)" stroke-dasharray="4 3"/>`;
  c += `<line x1="${L}" x2="${cx(Math.max(lo - 1, 0))}" y1="${sc(Flo)}" y2="${sc(Flo)}" stroke="var(--therapie)" stroke-dasharray="4 3"/>`;
  c += `<line x1="${L}" x2="${R}" y1="${B}" y2="${B}" stroke="var(--line)"/><text x="${R}" y="${B + 32}" text-anchor="end">k Erfolge</text>`;
  $("d-cdf").innerHTML = c;
  $("d-cdf").setAttribute("aria-label", `Verteilungsfunktion als Treppe, F(${hi}) = ${fmt(Fhi)}`);

  $("d-formula").innerHTML = D.mode === "eq"
    ? TB(String.raw`\begin{aligned}P(X = ${lo}) &= \binom{${n}}{${lo}} \cdot ${tz(fmt(p, 2))}^{${lo}} \cdot ${tz(fmt(1 - p, 2))}^{${n - lo}} \\ &= ${tz(fmt(prob, 4))} \\ &= F(${lo}) - F(${lo - 1})\end{aligned}`, `<span>P(X = ${lo}) = ${fmt(prob, 4)}</span>`) + `<span class="dim">Die Wahrscheinlichkeit ist die Sprunghöhe der Treppe bei k = ${lo}.</span>`
    : TB(String.raw`\begin{aligned}${tz(dQuestion())} &= F(${hi}) - F(${lo - 1}) \\ &= ${tz(fmt(Fhi, 4))} - ${tz(fmt(Flo, 4))} = ${tz(fmt(prob, 4))}\end{aligned}`, `<span>${dQuestion()} = ${fmt(prob, 4)}</span>`) + `<span class="dim">Summe der markierten Balken</span>`;
  $("d-stats").innerHTML = readout("Erwartungswert n · p", fmt(n * p, 1)) + readout("Standardabweichung", fmt(Math.sqrt(n * p * (1 - p)), 2)) + readout(`F(${hi})`, fmt(Fhi, 3));
}

segButtons($("dmode"), DMODES, D.mode, "dm");
document.querySelectorAll("[data-dm]").forEach(b => b.addEventListener("click", () => { D.mode = b.dataset.dm; renderD(); }));
$("bn").addEventListener("input", e => { D.n = +e.target.value; renderD(); });
$("bp").addEventListener("input", e => { D.p = +e.target.value; renderD(); });
$("da").addEventListener("input", e => { D.a = +e.target.value; renderD(); });
$("db").addEventListener("input", e => { D.b = +e.target.value; renderD(); });

/* =====================================================================
   Stetig: Normal, t, Exponential
   ===================================================================== */
const DISTS = {
  normal: {
    label: "Normal", text: "Ein Messwert auf einer Skala von 0 bis 100, normalverteilt mit Mittelwert μ und Standardabweichung σ.",
    lo: 0, hi: 100, step: 0.5, params: [["mu", "μ · Mittelwert", 20, 80, 1, 50], ["sigma", "σ · Standardabweichung", 2, 25, 0.5, 10]],
    a: 40, b: 60,
    pdf: (x, P) => phi((x - P.mu) / P.sigma) / P.sigma, cdf: (x, P) => Phi((x - P.mu) / P.sigma),
    mean: P => P.mu, sd: P => P.sigma
  },
  t: {
    label: "t", text: "Die t-Verteilung aus dem t-Test, mit df Freiheitsgraden. Gestrichelt zum Vergleich die Standardnormalverteilung.",
    lo: -5, hi: 5, step: 0.05, params: [["df", "df · Freiheitsgrade", 1, 60, 1, 5]],
    a: -2, b: 2,
    pdf: (x, P) => tpdf(x, P.df), cdf: (x, P) => tcdf(x, P.df),
    mean: P => P.df > 1 ? 0 : NaN, sd: P => P.df > 2 ? Math.sqrt(P.df / (P.df - 2)) : NaN
  },
  exp: {
    label: "Exponential", text: "Wartezeit in Minuten bis zum nächsten Ereignis, im Mittel m Minuten. Typisch rechtsschief.",
    lo: 0, hi: 60, step: 0.5, params: [["m", "m · mittlere Wartezeit", 1, 20, 0.5, 10]],
    a: 5, b: 15,
    pdf: (x, P) => x < 0 ? 0 : Math.exp(-x / P.m) / P.m, cdf: (x, P) => x < 0 ? 0 : 1 - Math.exp(-x / P.m),
    mean: P => P.m, sd: P => P.m
  }
};
const CMODES = [["le", "X ≤ b"], ["ge", "X ≥ a"], ["btw", "a ≤ X ≤ b"], ["eq", "X = x"]];
const C = { dist: "normal", mode: "btw", P: {}, a: 40, b: 60 };

function setupDist() {
  const Dd = DISTS[C.dist];
  C.P = {}; Dd.params.forEach(([k, , , , , v]) => C.P[k] = v);
  C.a = Dd.a; C.b = Dd.b;
  $("c-text").textContent = Dd.text;
  $("c-params").innerHTML = Dd.params.map(([k, label, min, max, step, v]) =>
    `<div class="ctrl"><div class="ctrl-head"><label for="cp-${k}">${label}</label><output id="cp-${k}-v"></output></div><input id="cp-${k}" type="range" min="${min}" max="${max}" step="${step}" value="${v}"></div>`).join("");
  Dd.params.forEach(([k]) => $("cp-" + k).addEventListener("input", e => { C.P[k] = +e.target.value; renderC(); }));
  ["ca", "cb"].forEach(id => { $(id).min = Dd.lo; $(id).max = Dd.hi; $(id).step = Dd.step; });
  $("ca").value = C.a; $("cb").value = C.b;
  document.querySelectorAll("[data-cd]").forEach(x => x.setAttribute("aria-pressed", x.dataset.cd === C.dist));
  renderC();
}
const xf = v => fmt(v, Math.abs(v) < 10 && v % 1 !== 0 ? 2 : (v % 1 ? 1 : 0));

function renderC() {
  const Dd = DISTS[C.dist], P = C.P;
  Dd.params.forEach(([k]) => { $("cp-" + k + "-v").textContent = fmt(P[k], P[k] % 1 ? 1 : 0); });
  document.querySelectorAll("[data-cm]").forEach(x => x.setAttribute("aria-pressed", x.dataset.cm === C.mode));
  $("ca-wrap").hidden = C.mode === "le"; $("cb-wrap").hidden = C.mode === "ge" || C.mode === "eq";
  $("ca-l").textContent = C.mode === "eq" ? "x" : "a (untere Grenze)"; $("cb-l").textContent = "b (obere Grenze)";
  $("ca-v").textContent = xf(C.a); $("cb-v").textContent = xf(C.b);

  let lo, hi, q;
  if (C.mode === "le") { lo = Dd.lo; hi = C.b; q = `P(X ≤ ${xf(C.b)})`; }
  else if (C.mode === "ge") { lo = C.a; hi = Dd.hi; q = `P(X ≥ ${xf(C.a)})`; }
  else if (C.mode === "eq") { lo = hi = C.a; q = `P(X = ${xf(C.a)})`; }
  else { lo = Math.min(C.a, C.b); hi = Math.max(C.a, C.b); q = `P(${xf(lo)} ≤ X ≤ ${xf(hi)})`; }
  const Fl = C.mode === "le" ? 0 : Dd.cdf(lo, P), Fh = C.mode === "ge" ? 1 : Dd.cdf(hi, P);
  const prob = C.mode === "eq" ? 0 : Fh - Fl;
  $("c-result").innerHTML = `<span class="q">${q}</span><span class="a">${C.mode === "eq" ? "0 %" : pct(prob)}</span>`;

  const sx = v => L + (v - Dd.lo) / (Dd.hi - Dd.lo) * (R - L);
  const N = 300, xs = Array.from({ length: N + 1 }, (_, i) => Dd.lo + (Dd.hi - Dd.lo) * i / N);
  const ys = xs.map(x => Dd.pdf(x, P));
  const nrm = C.dist === "t" ? xs.map(x => phi(x)) : null;
  const ymax = Math.max(...ys, ...(nrm || [0])) * 1.12;
  const sy = v => B - v / ymax * (B - T);
  let s = yAxis(sy, ymax, false);
  for (const v of ticks(Dd.lo, Dd.hi, 8)) s += `<text x="${sx(v)}" y="${B + 16}" text-anchor="middle">${v}</text>`;
  if (C.mode !== "eq") {
    const seg = []; xs.forEach((x, i) => { if (x >= lo && x <= hi) seg.push([sx(x), sy(ys[i])]); });
    seg.unshift([sx(lo), sy(Dd.pdf(lo, P))]); seg.push([sx(hi), sy(Dd.pdf(hi, P))]);
    s += `<path d="${area(seg, B)}" fill="var(--therapie)" fill-opacity=".85"/>`;
  }
  if (nrm) s += `<path d="${path(xs.map((x, i) => [sx(x), sy(nrm[i])]))}" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="5 4"/>`;
  s += `<path d="${path(xs.map((x, i) => [sx(x), sy(ys[i])]))}" fill="none" stroke="var(--fg)" stroke-width="2"/>`;
  if (C.mode === "eq") {
    const fx = Dd.pdf(C.a, P);
    s += `<line x1="${sx(C.a)}" x2="${sx(C.a)}" y1="${B}" y2="${sy(fx)}" stroke="var(--therapie)" stroke-width="2.5"/>`;
    s += `<circle cx="${sx(C.a)}" cy="${sy(fx)}" r="4" fill="var(--therapie)"/>`;
    s += `<text x="${sx(C.a) + 8}" y="${sy(fx) - 8}" class="acc">f(x) = ${fmt(fx, 4)}, Fläche = 0</text>`;
  }
  s += `<line x1="${L}" x2="${R}" y1="${B}" y2="${B}" stroke="var(--line)"/><text x="${R}" y="${B + 32}" text-anchor="end">x</text>`;
  $("c-pdf").innerHTML = s;
  $("c-pdf").setAttribute("aria-label", `${Dd.label}verteilung, ${q} = ${C.mode === "eq" ? "0" : pct(prob)}`);
  $("c-pdf-title").textContent = "Dichtefunktion f(x)" + (C.dist === "t" ? " · gestrichelt: Normalverteilung" : "");

  const sc = v => B - v * (B - T);
  let c = yAxis(sc, 1, true);
  for (const v of ticks(Dd.lo, Dd.hi, 8)) c += `<text x="${sx(v)}" y="${B + 16}" text-anchor="middle">${v}</text>`;
  c += `<path d="${path(xs.map(x => [sx(x), sc(Dd.cdf(x, P))]))}" fill="none" stroke="var(--fg)" stroke-width="2"/>`;
  if (C.mode !== "eq") {
    const xb = C.mode === "ge" ? Dd.hi : hi, xa = C.mode === "le" ? Dd.lo : lo;
    if (C.mode !== "le") c += `<line x1="${L}" x2="${sx(xa)}" y1="${sc(Fl)}" y2="${sc(Fl)}" stroke="var(--therapie)" stroke-dasharray="4 3"/><circle cx="${sx(xa)}" cy="${sc(Fl)}" r="3.5" fill="var(--therapie)"/>`;
    if (C.mode !== "ge") c += `<line x1="${L}" x2="${sx(xb)}" y1="${sc(Fh)}" y2="${sc(Fh)}" stroke="var(--therapie)" stroke-dasharray="4 3"/><circle cx="${sx(xb)}" cy="${sc(Fh)}" r="3.5" fill="var(--therapie)"/>`;
    const bx = Math.min(R - 4, sx(xb) + 10);
    c += `<line x1="${bx}" x2="${bx}" y1="${sc(Fl)}" y2="${sc(Fh)}" stroke="var(--therapie)" stroke-width="5"/>`;
    c += `<text x="${bx - 6}" y="${(sc(Fl) + sc(Fh)) / 2 + 4}" text-anchor="end" class="acc">${pct(prob)}</text>`;
  } else {
    c += `<circle cx="${sx(C.a)}" cy="${sc(Dd.cdf(C.a, P))}" r="4" fill="var(--therapie)"/>`;
    c += `<text x="${sx(C.a) + 8}" y="${sc(Dd.cdf(C.a, P)) + 16}" class="acc">kein Sprung: P(X = x) = 0</text>`;
  }
  c += `<line x1="${L}" x2="${R}" y1="${B}" y2="${B}" stroke="var(--line)"/><text x="${R}" y="${B + 32}" text-anchor="end">x</text>`;
  $("c-cdf").innerHTML = c;

  const z = C.dist === "normal" ? v => ` (z = ${fmt((v - P.mu) / P.sigma, 2)})` : () => "";
  const qT = tz(q), zT = v => C.dist === "normal" ? String.raw`\quad (z = ${tz(fmt((v - P.mu) / P.sigma, 2))})` : "";
  $("c-formula").innerHTML = C.mode === "eq"
    ? TB(String.raw`P(X = ${tz(xf(C.a))}) = 0`, `<span>P(X = ${xf(C.a)}) = 0</span>`) + `<span class="dim">Eine Linie hat keine Fläche. f(${xf(C.a)}) = ${fmt(Dd.pdf(C.a, P), 4)} ist eine Dichte, keine Wahrscheinlichkeit.</span>`
    : C.mode === "le" ? TB(String.raw`${qT} = F(${tz(xf(hi))}) = ${tz(fmt(Fh, 4))}`, `<span>${q} = ${fmt(Fh, 4)}</span>`) + `<span class="dim">Fläche links von b</span>`
    : C.mode === "ge" ? TB(String.raw`\begin{aligned}${qT} &= 1 - F(${tz(xf(lo))}) \\ &= 1 - ${tz(fmt(Fl, 4))} = ${tz(fmt(prob, 4))}\end{aligned}`, `<span>${q} = ${fmt(prob, 4)}</span>`)
    : TB(String.raw`\begin{aligned}${qT} &= F(${tz(xf(hi))}) - F(${tz(xf(lo))}) \\ &= ${tz(fmt(Fh, 4))} - ${tz(fmt(Fl, 4))} = ${tz(fmt(prob, 4))}\end{aligned}`, `<span>${q} = ${fmt(prob, 4)}</span>`) + `<span class="dim">Fläche zwischen a und b${C.dist === "normal" ? `, z-Werte ${fmt((lo - P.mu) / P.sigma, 2)} und ${fmt((hi - P.mu) / P.sigma, 2)}` : ""}</span>`;
  const m = Dd.mean(P), sd = Dd.sd(P);
  $("c-stats").innerHTML = readout("Erwartungswert", isNaN(m) ? "n. def." : fmt(m, 1)) + readout("Standardabweichung", isNaN(sd) ? "n. def." : fmt(sd, 2)) +
    readout(C.mode === "ge" || C.mode === "eq" ? `F(${xf(lo)})` : `F(${xf(hi)})`, fmt(C.mode === "ge" || C.mode === "eq" ? Dd.cdf(lo, P) : Fh, 3));
}

segButtons($("cdist"), Object.entries(DISTS).map(([k, d]) => [k, d.label]), C.dist, "cd");
document.querySelectorAll("[data-cd]").forEach(b => b.addEventListener("click", () => { C.dist = b.dataset.cd; setupDist(); }));
segButtons($("cmode"), CMODES, C.mode, "cm");
document.querySelectorAll("[data-cm]").forEach(b => b.addEventListener("click", () => { C.mode = b.dataset.cm; renderC(); }));
$("ca").addEventListener("input", e => { C.a = +e.target.value; renderC(); });
$("cb").addEventListener("input", e => { C.b = +e.target.value; renderC(); });

renderD();
setupDist();
})();
