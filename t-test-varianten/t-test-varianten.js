/* Welcher t-Test? · Stats Lab
   Einstichproben (Knie-TEP, fiktives Kriterium), gepaart (Bizeps), ungepaart (Parkinson). Alle Daten simuliert, reproduzierbar über Startwerte. */
(() => {
"use strict";
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
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function zs(seed, n) { const r = mulberry32(seed), o = []; while (o.length < n) { let u = 0; while (!u) u = r(); const v = r(), m = Math.sqrt(-2 * Math.log(u)); o.push(m * Math.cos(2 * Math.PI * v), m * Math.sin(2 * Math.PI * v)); } return o.slice(0, n); }
const newSeed = () => (Math.random() * 2 ** 31) | 0;

const $ = id => document.getElementById(id);
const fmt = (x, d = 2) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");
const pTxt = p => p < 0.001 ? "< 0,001" : "= " + fmt(p, 3);
const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
const sd = (a, m = mean(a)) => Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1));
const path = pts => pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join("");
const li = (b, txt, eq) => `<li><b>${b}</b> ${txt}${eq ? `<span class="eq">${eq}</span>` : ""}</li>`;
const G = { alpha: 0.05 };

// t-Verteilung mit Ablehnungsbereich (mode: two, right, left)
function tMini(svg, df, t, mode, tc) {
  const W = +svg.viewBox.baseVal.width, H = +svg.viewBox.baseVal.height, L = 14, R = W - 14, T = 22, B = H - 34;
  const m = Math.min(9, Math.max(4.5, Math.abs(t) + 1)), sx = v => L + (v + m) / (2 * m) * (R - L), pk = tpdf(0, df) * 1.12, sy = d => B - d / pk * (B - T);
  const curve = (lo, hi) => { const o = []; for (let i = 0; i <= 120; i++) { const v = lo + (hi - lo) * i / 120; o.push([sx(v), sy(tpdf(v, df))]); } return o; };
  const area = (lo, hi) => { const c = curve(lo, hi); return path(c) + `L${sx(hi)},${B}L${sx(lo)},${B}Z`; };
  let s = "";
  if (mode !== "left") s += `<path d="${area(Math.min(m, Math.abs(tc)), m)}" fill="var(--alpha-fill)" fill-opacity=".7"/>`;
  if (mode !== "right") s += `<path d="${area(-m, -Math.min(m, Math.abs(tc)))}" fill="var(--alpha-fill)" fill-opacity=".7"/>`;
  s += `<path d="${path(curve(-m, m))}" fill="none" stroke="var(--fg)" stroke-width="2"/><line x1="${L}" x2="${R}" y1="${B}" y2="${B}" stroke="var(--line)"/>`;
  for (let v = -Math.floor(m); v <= m; v++) if (v % 2 === 0) s += `<text x="${sx(v)}" y="${B + 16}" text-anchor="middle">${v}</text>`;
  const crit = mode === "two" ? [Math.abs(tc), -Math.abs(tc)] : [tc];
  crit.forEach(c => s += `<line x1="${sx(c)}" x2="${sx(c)}" y1="${T + 10}" y2="${B}" stroke="var(--alpha-ink)" stroke-dasharray="4 3"/>`);
  s += `<text x="${sx(crit[0])}" y="${T + 4}" text-anchor="middle" style="fill:var(--alpha-ink)">t krit ${mode === "two" ? "±" : ""}${fmt(mode === "two" ? Math.abs(tc) : tc, 2)}</text>`;
  const tx = Math.max(-m, Math.min(m, t));
  s += `<line x1="${sx(tx)}" x2="${sx(tx)}" y1="${T + 4}" y2="${B}" stroke="var(--pval)" stroke-width="2.5"/><text class="strong" x="${sx(tx) + (t >= 0 ? -6 : 6)}" y="${B - 8}" text-anchor="${t >= 0 ? "end" : "start"}">t = ${fmt(t, 2)}</text>`;
  s += `<text x="${R}" y="${B + 30}" text-anchor="end">df = ${df}</text>`;
  svg.innerHTML = s;
}
// Punktdiagramm entlang x mit Stapeln
function dots(vals, lo, hi, L, R, y0, step, col, res) {
  const sx = v => L + (v - lo) / (hi - lo) * (R - L), seen = {}; let s = "";
  vals.forEach(v => { const key = Math.round(v / res); const k = seen[key] = (seen[key] ?? -1) + 1; s += `<circle cx="${sx(v)}" cy="${y0 - k * step}" r="5" fill="${col}" fill-opacity=".85"/>`; });
  return s;
}

/* ================= 1 Einstichproben ================= */
const S1 = { m: 94, s: 10, n: 20, view: "klinik", seed: 11, ref: 90 };
// einseitige p-Werte (Klinik, Prüfstelle) für einen Startwert
function p1For(seed) {
  const x = zs(seed, 60).slice(0, S1.n).map(v => Math.round(S1.m + S1.s * v)), n = x.length, m = mean(x), se = sd(x, m) / Math.sqrt(n), F = tcdf((m - S1.ref) / se, n - 1);
  return [1 - F, F, m];
}
function findSeed(ok) { for (let s = 1; s < 5000; s++) if (ok(p1For(s))) return s; return 11; }
function render1() {
  $("m1-v").textContent = S1.m + "°"; $("s1-v").textContent = S1.s + "°"; $("n1-v").textContent = S1.n;
  const z = zs(S1.seed, 60), x = z.slice(0, S1.n).map(v => Math.round(S1.m + S1.s * v));
  const n = x.length, m = mean(x), s = sd(x, m), se = s / Math.sqrt(n), df = n - 1, t = (m - S1.ref) / se, a = G.alpha;
  const kl = S1.view === "klinik", tc = kl ? tinv(1 - a, df) : -tinv(1 - a, df), F = tcdf(t, df), p = kl ? 1 - F : F, pOther = kl ? F : 1 - F, rej = kl ? t > tc : t < tc;
  $("hyp1").innerHTML = kl
    ? `<div><span class="k">H0</span><div class="v">μ ≤ 90°</div><span class="s">Die Klinik erfüllt das Kriterium nicht.</span></div><div><span class="k">H1, soll gezeigt werden</span><div class="v">μ > 90°</div><span class="s">Die Klinik erfüllt das Kriterium.</span></div>`
    : `<div><span class="k">H0</span><div class="v">μ ≥ 90°</div><span class="s">Die Klinik erfüllt das Kriterium.</span></div><div><span class="k">H1, soll gezeigt werden</span><div class="v">μ < 90°</div><span class="s">Die Klinik verfehlt das Kriterium.</span></div>`;
  // Daten
  const svg = $("d1"), L = 20, R = 500, lo = 50, hi = 130, sx = v => L + (v - lo) / (hi - lo) * (R - L), y0 = 150;
  let g = "";
  for (let v = 50; v <= 130; v += 10) g += `<line x1="${sx(v)}" x2="${sx(v)}" y1="20" y2="${y0 + 8}" stroke="var(--grid)"/><text x="${sx(v)}" y="${y0 + 26}" text-anchor="middle">${v}</text>`;
  g += `<line x1="${sx(90)}" x2="${sx(90)}" y1="14" y2="${y0 + 8}" stroke="var(--alpha-ink)" stroke-width="2" stroke-dasharray="6 4"/><text x="${sx(90) - 6}" y="16" text-anchor="end" style="fill:var(--alpha-ink)">Sollwert 90°</text>`;
  g += dots(x, lo, hi, L, R, y0, 9, "var(--pal-4)", 1);
  g += `<line x1="${sx(m - 1.96 * se)}" x2="${sx(m + 1.96 * se)}" y1="${y0 + 50}" y2="${y0 + 50}" stroke="var(--therapie)" stroke-width="3"/><circle cx="${sx(m)}" cy="${y0 + 50}" r="6" fill="var(--therapie)"/><text class="strong" x="${sx(m + 1.96 * se) + 8}" y="${y0 + 54}">x̄ = ${fmt(m, 1)}° (± 1,96 SE)</text>`;
  svg.setAttribute("viewBox", `0 0 520 ${y0 + 64}`); svg.innerHTML = g;
  tMini($("t1"), df, t, kl ? "right" : "left", tc);
  $("c1").innerHTML =
    li("Kennwerte.", "", `x̄ = ${fmt(m, 1)}° · s = ${fmt(s, 1)}° · n = ${n}`) +
    li("Standardfehler.", "Wie stark schwankt der Mittelwert von Stichprobe zu Stichprobe?", `SE = s / √n = ${fmt(s, 1)} / √${n} = ${fmt(se, 2)}°`) +
    li("Prüfgröße.", "Abstand des Mittelwerts zum Sollwert in Standardfehlern.", `t = (x̄ − 90) / SE = (${fmt(m, 1)} − 90) / ${fmt(se, 2)} = ${fmt(t, 2)} · df = n − 1 = ${df}`) +
    li("Kritischer Wert, gerichtet.", `Das ganze α liegt auf der ${kl ? "rechten" : "linken"} Seite.`, `t krit = ${kl ? "" : "−"}t(${fmt(1 - a, 2)}; ${df}) = ${fmt(tc, 3)} · Ablehnung, wenn t ${kl ? ">" : "<"} ${fmt(tc, 2)}`) +
    li("p-Wert.", `Nur die Fläche ${kl ? "rechts" : "links"} vom beobachteten t zählt.`, `p = ${kl ? "1 − F(t)" : "F(t)"} ${pTxt(p)}`);
  const other = kl ? "Aus Sicht der Prüfstelle (H1: μ < 90°)" : "Aus Sicht der Klinik (H1: μ > 90°)";
  $("v1").innerHTML = (rej
    ? (kl ? "H0 verworfen: Die Klinik erfüllt das Kriterium nachweislich." : "H0 verworfen: Die Klinik verfehlt das Kriterium nachweislich.")
    : (kl ? "H0 beibehalten: Nicht belegt, dass die Klinik das Kriterium erfüllt. Das heißt aber nicht, dass sie es verfehlt." : "H0 beibehalten: Nicht belegt, dass die Klinik das Kriterium verfehlt. Das heißt aber nicht, dass sie es erfüllt.")) +
    `<small>${other} wäre p ${pTxt(pOther)}. ${!rej && pOther >= a ? "Hier ist also keine der beiden Behauptungen belegt: Für eine Entscheidung reichen die Daten nicht." : ""}</small>`;
}

/* ================= 2 Gepaart ================= */
const S2 = { m: 0.6, s: 0.4, n: 10, seed: 21 };
function render2() {
  $("m2-v").textContent = fmt(S2.m, 1) + " cm"; $("s2-v").textContent = fmt(S2.s, 2) + " cm"; $("n2-v").textContent = S2.n;
  const za = zs(S2.seed, 30), zb = zs(S2.seed + 1, 30), zc = zs(S2.seed + 2, 30), r1 = v => Math.round(v * 10) / 10;
  const pre = [], post = [];
  for (let i = 0; i < S2.n; i++) { const base = 31 + 3 * za[i]; pre.push(r1(base + S2.s * zb[i])); post.push(r1(base + S2.m + S2.s * zc[i])); }
  const n = S2.n, d = post.map((v, i) => r1(v - pre[i])), md = mean(d), sdd = sd(d, md), se = sdd / Math.sqrt(n), df = n - 1, t = md / se, a = G.alpha;
  const tc = tinv(1 - a / 2, df), p = 2 * (1 - tcdf(Math.abs(t), df)), rej = Math.abs(t) > tc;
  $("hyp2").innerHTML = `<div><span class="k">H0</span><div class="v">μ<sub>d</sub> = 0</div><span class="s">Im Mittel ändert sich der Umfang nicht.</span></div><div><span class="k">H1</span><div class="v">μ<sub>d</sub> ≠ 0</div><span class="s">Der Umfang ändert sich durch das Training.</span></div>`;
  // Linien je Person
  const all = pre.concat(post), lo = Math.floor(Math.min(...all) - 1), hi = Math.ceil(Math.max(...all) + 1), T = 16, B = 210, y = v => B - (v - lo) / (hi - lo) * (B - T), xa = 150, xb = 370;
  let g = "";
  for (let v = lo; v <= hi; v += (hi - lo > 12 ? 2 : 1)) g += `<line x1="70" x2="450" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/><text x="62" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  pre.forEach((v, i) => { const col = d[i] >= 0 ? "var(--therapie)" : "var(--kontrolle)"; g += `<line x1="${xa}" x2="${xb}" y1="${y(v)}" y2="${y(post[i])}" stroke="${col}" stroke-opacity=".7" stroke-width="2"/><circle cx="${xa}" cy="${y(v)}" r="4.5" fill="${col}"/><circle cx="${xb}" cy="${y(post[i])}" r="4.5" fill="${col}"/>`; });
  g += `<text class="strong" x="${xa}" y="${B + 22}" text-anchor="middle">vorher</text><text class="strong" x="${xb}" y="${B + 22}" text-anchor="middle">nachher</text>`;
  $("d2").innerHTML = g;
  // Differenzen
  const dl = Math.min(-0.5, Math.floor((Math.min(...d) - 0.3) * 2) / 2), dh = Math.max(1.5, Math.ceil((Math.max(...d) + 0.3) * 2) / 2), L = 20, R = 420, sx = v => L + (v - dl) / (dh - dl) * (R - L), y0 = 150;
  let h = "";
  for (let v = Math.ceil(dl * 2) / 2; v <= dh + 1e-9; v += 0.5) h += `<line x1="${sx(v)}" x2="${sx(v)}" y1="20" y2="${y0 + 8}" stroke="var(--grid)"/><text x="${sx(v)}" y="${y0 + 26}" text-anchor="middle">${fmt(v, 1)}</text>`;
  h += `<line x1="${sx(0)}" x2="${sx(0)}" y1="14" y2="${y0 + 8}" stroke="var(--alpha-ink)" stroke-width="2" stroke-dasharray="6 4"/><text x="${sx(0) + 6}" y="16" style="fill:var(--alpha-ink)">keine Änderung</text>`;
  h += dots(d, dl, dh, L, R, y0, 10, "var(--pal-4)", 0.1);
  h += `<line x1="${sx(md - 1.96 * se)}" x2="${sx(md + 1.96 * se)}" y1="${y0 + 46}" y2="${y0 + 46}" stroke="var(--therapie)" stroke-width="3"/><circle cx="${sx(md)}" cy="${y0 + 46}" r="6" fill="var(--therapie)"/><text class="strong" x="${Math.min(sx(md) + 10, R - 120)}" y="${y0 + 40}">d̄ = ${fmt(md, 2)} cm</text>`;
  $("dd2").innerHTML = h;
  $("c2").innerHTML =
    li("Differenzen bilden.", "Für jede Person: nachher minus vorher. Ab jetzt zählt nur noch diese eine Spalte.", `d = ${d.slice(0, 8).map(v => fmt(v, 1)).join(" · ")}${n > 8 ? " · …" : ""}`) +
    li("Kennwerte der Differenzen.", "", `d̄ = ${fmt(md, 2)} cm · s<sub>d</sub> = ${fmt(sdd, 2)} cm · n = ${n}`) +
    li("Standardfehler.", "Wie beim Einstichproben-Test, nur mit den Differenzen.", `SE = s<sub>d</sub> / √n = ${fmt(sdd, 2)} / √${n} = ${fmt(se, 3)} cm`) +
    li("Prüfgröße.", "Einstichproben-t-Test der Differenzen gegen 0.", `t = (d̄ − 0) / SE = ${fmt(md, 2)} / ${fmt(se, 3)} = ${fmt(t, 2)} · df = n − 1 = ${df}`) +
    li("Kritischer Wert und p-Wert, ungerichtet.", "", `t krit = ±${fmt(tc, 3)} · p = 2 · (1 − F(|t|)) ${pTxt(p)}`);
  $("v2").innerHTML = (rej ? "H0 verworfen: Der Armumfang hat sich verändert." : "H0 beibehalten: Eine Veränderung ist nicht belegt.") + `<small>Mittlere Zunahme ${fmt(md, 2)} cm, 95-%-KI ${fmt(md - tc * se, 2)} bis ${fmt(md + tc * se, 2)} cm.</small>`;
  // Kontrast: ungepaart
  const m1 = mean(pre), m2 = mean(post), s1 = sd(pre, m1), s2 = sd(post, m2), dfu = 2 * n - 2, sp = Math.sqrt(((n - 1) * s1 * s1 + (n - 1) * s2 * s2) / dfu), seu = sp * Math.sqrt(2 / n), tu = (m2 - m1) / seu, pu = 2 * (1 - tcdf(Math.abs(tu), dfu));
  $("cmp2").innerHTML = `<thead><tr><th></th><th>gepaart</th><th>ungepaart (falsch)</th></tr></thead><tbody>` +
    `<tr><td>Mittelwertdifferenz</td><td>${fmt(md, 2)} cm</td><td>${fmt(m2 - m1, 2)} cm</td></tr>` +
    `<tr><td>Standardfehler</td><td>${fmt(se, 3)} cm</td><td>${fmt(seu, 3)} cm</td></tr>` +
    `<tr><td>t</td><td>${fmt(t, 2)}</td><td>${fmt(tu, 2)}</td></tr><tr><td>df</td><td>${df}</td><td>${dfu}</td></tr>` +
    `<tr><td>p</td><td>${pTxt(p).replace("= ", "")}</td><td>${pTxt(pu).replace("= ", "")}</td></tr></tbody>`;
  $("cmpn2").innerHTML = `Die Differenz ist identisch, aber der Standardfehler ist ungepaart rund ${fmt(seu / se, 1)}-mal so groß. Der Grund: Die Arme sind unterschiedlich dick (SD vorher ${fmt(s1, 1)} cm). Ungepaart steckt dieser Unterschied zwischen den Personen im Rauschen, gepaart fällt er durch die Differenzbildung heraus. Ungepaart wäre hier ohnehin falsch, weil die Messungen nicht unabhängig sind.`;
}

/* ================= 3 Ungepaart ================= */
const S3 = { m: 0.06, s: 0.1, n: 25, seed: 31 };
function render3() {
  $("m3-v").textContent = fmt(S3.m, 2) + " m"; $("s3-v").textContent = fmt(S3.s, 2) + " m"; $("n3-v").textContent = S3.n;
  const za = zs(S3.seed, 60), zb = zs(S3.seed + 1, 60), r2 = v => Math.round(v * 100) / 100;
  const kg = za.slice(0, S3.n).map(v => r2(0.45 + S3.s * v)), ra = zb.slice(0, S3.n).map(v => r2(0.45 + S3.m + S3.s * v));
  const n1 = ra.length, n2 = kg.length, m1 = mean(ra), m2 = mean(kg), s1 = sd(ra, m1), s2 = sd(kg, m2), df = n1 + n2 - 2;
  const sp = Math.sqrt(((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / df), se = sp * Math.sqrt(1 / n1 + 1 / n2), t = (m1 - m2) / se, a = G.alpha;
  const tc = tinv(1 - a / 2, df), p = 2 * (1 - tcdf(Math.abs(t), df)), rej = Math.abs(t) > tc;
  const sew = Math.sqrt(s1 * s1 / n1 + s2 * s2 / n2), tw = (m1 - m2) / sew, dfw = (s1 * s1 / n1 + s2 * s2 / n2) ** 2 / ((s1 * s1 / n1) ** 2 / (n1 - 1) + (s2 * s2 / n2) ** 2 / (n2 - 1)), pw = 2 * (1 - tcdf(Math.abs(tw), dfw));
  $("hyp3").innerHTML = `<div><span class="k">H0</span><div class="v">μ<sub>Rhythmus</sub> = μ<sub>KG</sub></div><span class="s">Beide Therapien führen im Mittel zur gleichen Schrittlänge.</span></div><div><span class="k">H1</span><div class="v">μ<sub>Rhythmus</sub> ≠ μ<sub>KG</sub></div><span class="s">Die Schrittlänge unterscheidet sich.</span></div>`;
  const all = kg.concat(ra), lo = Math.min(0.1, Math.floor(Math.min(...all) * 10) / 10), hi = Math.max(0.8, Math.ceil(Math.max(...all) * 10) / 10), L = 90, R = 500, sx = v => L + (v - lo) / (hi - lo) * (R - L);
  let g = "";
  for (let v = Math.round(lo * 10); v <= Math.round(hi * 10); v++) g += `<line x1="${sx(v / 10)}" x2="${sx(v / 10)}" y1="10" y2="180" stroke="var(--grid)"/><text x="${sx(v / 10)}" y="198" text-anchor="middle">${fmt(v / 10, 1)}</text>`;
  [[kg, m2, s2, 70, "KG", "var(--kontrolle)"], [ra, m1, s1, 160, "Rhythmus", "var(--therapie)"]].forEach(([vals, m, s, y0, lab, col]) => {
    g += `<text class="strong" x="${L - 12}" y="${y0 - 10}" text-anchor="end">${lab}</text>` + dots(vals, lo, hi, L, R, y0 - 10, 7, col, 0.01);
    g += `<line x1="${sx(m - s)}" x2="${sx(m + s)}" y1="${y0 + 6}" y2="${y0 + 6}" stroke="${col}" stroke-width="3"/><line x1="${sx(m)}" x2="${sx(m)}" y1="${y0 - 58}" y2="${y0 + 12}" stroke="${col}" stroke-width="2.5"/><text x="${sx(m) + 6}" y="${y0 + 18}" style="fill:var(--fg)">x̄ = ${fmt(m, 3)}</text>`;
  });
  g += `<text x="${R}" y="214" text-anchor="end">Linie: Mittelwert · Balken: ± 1 SD</text>`;
  $("d3").innerHTML = g;
  tMini($("t3"), df, t, "two", tc);
  $("c3").innerHTML =
    li("Kennwerte je Gruppe.", "", `Rhythmus: x̄₁ = ${fmt(m1, 3)} m, s₁ = ${fmt(s1, 3)}, n₁ = ${n1} · KG: x̄₂ = ${fmt(m2, 3)} m, s₂ = ${fmt(s2, 3)}, n₂ = ${n2}`) +
    li("Gepoolte Streuung.", "Beide Gruppen schätzen dieselbe Streuung, deshalb wird gemittelt, gewichtet mit den Freiheitsgraden.", `s<sub>p</sub> = √[((n₁ − 1)s₁² + (n₂ − 1)s₂²) / (n₁ + n₂ − 2)] = ${fmt(sp, 3)} m`) +
    li("Standardfehler der Differenz.", "Zwei Mittelwerte schwanken, deshalb zwei Summanden.", `SE = s<sub>p</sub> · √(1/n₁ + 1/n₂) = ${fmt(sp, 3)} · √(1/${n1} + 1/${n2}) = ${fmt(se, 4)} m`) +
    li("Prüfgröße.", "", `t = (x̄₁ − x̄₂) / SE = ${fmt(m1 - m2, 3)} / ${fmt(se, 4)} = ${fmt(t, 2)} · df = n₁ + n₂ − 2 = ${df}`) +
    li("Kritischer Wert und p-Wert, ungerichtet.", "", `t krit = ±${fmt(tc, 3)} · p = 2 · (1 − F(|t|)) ${pTxt(p)}`);
  $("v3").innerHTML = (rej ? "H0 verworfen: Die Schrittlänge unterscheidet sich zwischen den Gruppen." : "H0 beibehalten: Ein Unterschied ist nicht belegt.") + `<small>Differenz ${fmt(m1 - m2, 3)} m, 95-%-KI ${fmt(m1 - m2 - tc * se, 3)} bis ${fmt(m1 - m2 + tc * se, 3)} m.</small>`;
  $("welch3").innerHTML = `Welch-Variante (ohne Annahme gleicher Streuungen): SE = √(s₁²/n₁ + s₂²/n₂) = ${fmt(sew, 4)} m, t = ${fmt(tw, 2)}, df = ${fmt(dfw, 1)}, p ${pTxt(pw)}. Bei gleich großen Gruppen und ähnlichen Streuungen liegen beide Varianten nah beieinander.`;
}

function renderAll() { render1(); render2(); render3(); }
const bind = (id, obj, key, f) => $(id).addEventListener("input", e => { obj[key] = +e.target.value; f(); });
bind("m1", S1, "m", render1); bind("s1", S1, "s", render1); bind("n1", S1, "n", render1);
bind("m2", S2, "m", render2); bind("s2", S2, "s", render2); bind("n2", S2, "n", render2);
bind("m3", S3, "m", render3); bind("s3", S3, "s", render3); bind("n3", S3, "n", render3);
$("new1").onclick = () => { S1.seed = newSeed(); render1(); };
$("new2").onclick = () => { S2.seed = newSeed(); render2(); };
$("new3").onclick = () => { S3.seed = newSeed(); render3(); };
$("edge1").onclick = () => { S1.m = 91; S1.n = 12; S1.s = 10; $("m1").value = 91; $("n1").value = 12; $("s1").value = 10;
  S1.seed = findSeed(([pk, pp, m]) => pk >= G.alpha && pp >= G.alpha && m > 90 && m < 92.5); render1(); };
$("view1").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; S1.view = b.dataset.v; $("view1").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); render1(); });
$("alpha").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; G.alpha = +b.dataset.a; $("alpha").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); renderAll(); });
S1.seed = findSeed(([pk, , m]) => pk < 0.03 && Math.abs(m - S1.m) < 1.5);
renderAll();
})();
