/* Multiples Testen · Stats Lab
   Jeder Test ist ein echter Zwei-Gruppen-t-Test (gleiche Varianzen) auf simulierten Normaldaten.
   Stufe 1 Würfel, Stufe 2 FWER ohne Korrektur, Stufe 3 Bonferroni, Stufe 4 Power-Verlust, Stufe 5 Holm und BH. */
(() => {
const tz = x => String(x).replace(/\./g, "{.}").replace(/,/g, "{,}").replace(/−/g, "-").replace(/ %/g, "\\,\\%");
const TB = (t, fb) => window.katex ? texBlock(t) : fb;
const TS = (t, fb) => window.katex ? texSteps(t) : fb;
"use strict";

/* ---------- Mathematik ---------- */
const LG = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
function lgamma(x) { if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x); x -= 1; let a = 0.99999999999980993; const t = x + 7.5; for (let i = 0; i < 8; i++) a += LG[i] / (x + i + 1); return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a); }
function betacf(a, b, x) { const FP = 1e-300; let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < FP) d = FP; d = 1 / d; let h = d; for (let m = 1; m <= 300; m++) { const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2)); d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; h *= d * c; aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2)); d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-14) break; } return h; }
function ibeta(x, a, b) { if (x <= 0) return 0; if (x >= 1) return 1; const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)); return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b; }

let spare = null;
function randn() { if (spare !== null) { const s = spare; spare = null; return s; } let u = 0, v = 0; while (u === 0) u = Math.random(); v = Math.random(); const r = Math.sqrt(-2 * Math.log(u)); spare = r * Math.sin(2 * Math.PI * v); return r * Math.cos(2 * Math.PI * v); }

// Zweiseitiger t-Test für zwei Gruppen mit je n Personen und wahrem Effekt d (in SD-Einheiten)
function ttest(n, d) {
  let s1 = 0, q1 = 0, s2 = 0, q2 = 0;
  for (let i = 0; i < n; i++) { const a = randn(); s1 += a; q1 += a * a; const b = randn() + d; s2 += b; q2 += b * b; }
  const m1 = s1 / n, m2 = s2 / n, v1 = (q1 - n * m1 * m1) / (n - 1), v2 = (q2 - n * m2 * m2) / (n - 1);
  const df = 2 * n - 2, t = (m2 - m1) / Math.sqrt((v1 + v2) / n);
  return ibeta(df / (df + t * t), df / 2, 0.5);
}

const ALPHA = 0.05;
function reject(ps, method) {
  const k = ps.length, out = new Array(k).fill(false);
  if (method === "none") { ps.forEach((p, i) => out[i] = p < ALPHA); return out; }
  if (method === "bonf") { ps.forEach((p, i) => out[i] = p < ALPHA / k); return out; }
  const ord = ps.map((p, i) => i).sort((a, b) => ps[a] - ps[b]);
  if (method === "holm") { for (let r = 0; r < k; r++) { if (ps[ord[r]] <= ALPHA / (k - r)) out[ord[r]] = true; else break; } return out; }
  let last = -1; for (let r = 0; r < k; r++) if (ps[ord[r]] <= (r + 1) * ALPHA / k) last = r;
  for (let r = 0; r <= last; r++) out[ord[r]] = true; return out;
}

/* ---------- Hilfen ---------- */
const $ = id => document.getElementById(id);
const pct = (x, d = 1) => (x * 100).toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }) + " %";
const dec = (x, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const intf = x => Math.round(x).toLocaleString("de-DE");
const fmtP = p => p < 0.001 ? "< 0,001" : dec(p, 3);
const thr = x => x.toLocaleString("de-DE", { maximumSignificantDigits: 3 });
const readout = (l, v) => `<div class="readout"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;
const path = pts => pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join("");
function segInit(id, cb) { const el = $(id); el.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; el.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false")); cb(b.dataset.m); }); return () => el.querySelector('[aria-pressed="true"]').dataset.m; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function study(k, t, n, d) { const truth = shuffle(Array.from({ length: k }, (_, i) => i < t)); return { truth, ps: truth.map(e => ttest(n, e ? d : 0)) }; }

function fwerChart(svg, k, curves, empir) {
  // curves: [{f, cls, width}], empir: [{v, strong}]
  const W = +svg.viewBox.baseVal.width, H = +svg.viewBox.baseVal.height, L = 52, R = 16, T = 14, B = 38, KM = 40;
  const x = v => L + (v - 1) / (KM - 1) * (W - L - R), y = v => T + (1 - v) * (H - T - B);
  let s = "";
  for (let v = 0; v <= 1.001; v += 0.25) s += `<line class="gridl" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${pct(v, 0)}</text>`;
  [1, 10, 20, 30, 40].forEach(v => s += `<text x="${x(v)}" y="${H - B + 18}" text-anchor="middle">${v}</text>`);
  s += `<text x="${(L + W - R) / 2}" y="${H - 4}" text-anchor="middle">k · Anzahl Tests</text>`;
  s += `<line class="axis" x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}"/>`;
  s += `<line x1="${L}" x2="${W - R}" y1="${y(ALPHA)}" y2="${y(ALPHA)}" stroke="var(--muted)" stroke-dasharray="3 4"/><text x="${W - R}" y="${y(ALPHA) - 6}" text-anchor="end">α = 5 %</text>`;
  s += `<line x1="${x(k)}" x2="${x(k)}" y1="${T}" y2="${y(0)}" stroke="var(--line)" stroke-width="2"/>`;
  curves.forEach(c => { const pts = []; for (let v = 1; v <= KM; v += 0.25) pts.push([x(v), y(c.f(v))]); s += `<path d="${path(pts)}" fill="none" stroke="${c.col}" stroke-width="${c.w}"/>`; s += `<circle cx="${x(k)}" cy="${y(c.f(k))}" r="4.5" fill="var(--surface)" stroke="${c.col}" stroke-width="2.5"/>`; if (c.label) { const v = c.f(k), low = v < 0.2; s += `<text class="strong" x="${x(k) + (k > 30 ? -10 : 10)}" y="${low ? y(v) - 10 : y(v) + 20}" text-anchor="${k > 30 ? "end" : "start"}">${pct(v)}</text>`; } });
  empir.forEach(e => { if (e.v !== null) s += `<circle cx="${x(k)}" cy="${y(e.v)}" r="${e.strong ? 6 : 4.5}" fill="var(--kontrolle)" stroke="var(--surface)" stroke-width="1.5"/>`; });
  svg.innerHTML = s;
}

function tilesHTML(ps, cls) {
  return ps.map((p, i) => `<div class="tile ${cls(p, i)}"><span class="tn">#${i + 1}</span><span class="tp">${fmtP(p)}</span></div>`).join("");
}

/* ---------- Stufe 1: Würfel ---------- */
const D = { rolls: [], total: 0, ones: 0 };
function roll(times) {
  let last = 1;
  for (let i = 0; i < times; i++) { last = 1 + Math.floor(Math.random() * 20); D.total++; if (last === 1) D.ones++; D.rolls.push(last); }
  if (D.rolls.length > 100) D.rolls = D.rolls.slice(-100);
  const die = $("die"); die.textContent = last; die.classList.toggle("hit", last === 1);
  die.classList.add("roll"); setTimeout(() => die.classList.remove("roll"), 180);
  drawDie();
}
function drawDie() {
  let s = ""; for (let i = 0; i < 100; i++) { const r = D.rolls[i]; s += `<i class="${r === undefined ? "empty" : r === 1 ? "hit" : ""}"></i>`; }
  $("die-strip").innerHTML = s;
  $("die-stats").innerHTML = readout("Würfe", intf(D.total)) + readout("davon Einsen (Fehlalarme)", intf(D.ones)) + readout("Anteil Einsen", D.total ? pct(D.ones / D.total) : "–") + readout("erwartet: 1 von 20 = α", "5,0 %");
}
$("d1").onclick = () => roll(1);
$("d100").onclick = () => roll(100);
$("d-reset").onclick = () => { D.rolls = []; D.total = 0; D.ones = 0; const die = $("die"); die.textContent = "?"; die.classList.remove("hit"); drawDie(); };

/* ---------- Stufe 2: viele Tests ohne Korrektur ---------- */
const S2 = { k: 20, N: 0, fa: 0, hist: new Array(20).fill(0), last: null };
function run2(times) { for (let j = 0; j < times; j++) { const ps = study(S2.k, 0, 20, 0).ps; S2.N++; if (ps.some(p => p < ALPHA)) S2.fa++; ps.forEach(p => S2.hist[Math.min(19, Math.floor(p * 20))]++); S2.last = ps; } draw2(); }
function reset2() { S2.N = 0; S2.fa = 0; S2.hist.fill(0); S2.last = null; draw2(); }
function draw2() {
  const k = S2.k, th = 1 - Math.pow(1 - ALPHA, k);
  $("k2-v").textContent = k;
  $("tiles2").innerHTML = S2.last ? tilesHTML(S2.last, p => p < ALPHA ? "sig" : "") : `<p class="empty-note">Klicken Sie auf „1 Studie“. Jede Kachel ist dann ein t-Test ohne echten Effekt.</p>`;
  $("s2-count").textContent = S2.N ? `${intf(S2.N)} Studien · ${intf(S2.N * k)} Tests` : "";
  fwerChart($("fwer2"), k, [{ f: v => 1 - Math.pow(1 - ALPHA, v), col: "var(--therapie)", w: 3, label: true }], [{ v: S2.N ? S2.fa / S2.N : null, strong: true }]);
  // Histogramm
  const svg = $("hist2"), W = 440, H = 280, L = 52, R = 10, T = 14, B = 38, tot = S2.hist.reduce((a, b) => a + b, 0);
  const max = Math.max(0.1, ...S2.hist.map(h => tot ? h / tot : 0)) * 1.15;
  const x = v => L + v * (W - L - R), y = v => T + (1 - v / max) * (H - T - B);
  let s = "";
  [0, 0.05, 0.1].filter(v => v <= max).forEach(v => s += `<line class="gridl" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${pct(v, 0)}</text>`);
  S2.hist.forEach((h, i) => { const v = tot ? h / tot : 0; s += `<rect x="${x(i / 20) + 1}" y="${y(v)}" width="${(W - L - R) / 20 - 2}" height="${y(0) - y(v)}" fill="${i === 0 ? "var(--therapie)" : "var(--beta-fill)"}"/>`; });
  s += `<line x1="${L}" x2="${W - R}" y1="${y(0.05)}" y2="${y(0.05)}" stroke="var(--fg)" stroke-dasharray="5 4"/><text x="${W - R}" y="${y(0.05) - 6}" text-anchor="end">gleichverteilt: je 5 %</text>`;
  s += `<line class="axis" x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}"/>`;
  [0, 0.25, 0.5, 0.75, 1].forEach(v => s += `<text x="${x(v)}" y="${H - B + 18}" text-anchor="middle">${dec(v, 2).replace(",00", "")}</text>`);
  s += `<text x="${(L + W - R) / 2}" y="${H - 4}" text-anchor="middle">p-Wert</text>`;
  if (!tot) s += `<text x="${(L + W - R) / 2}" y="${(T + H - B) / 2}" text-anchor="middle">noch keine Tests</text>`;
  svg.innerHTML = s;
  $("f2").innerHTML = TB(String.raw`P(\text{kein Fehlalarm in einem Test}) = 1 - \alpha = 0{,}95`, "") + TB(String.raw`P(\text{kein Fehlalarm in } k \text{ Tests}) = 0{,}95^{k}`, "") + `<span class="dim">Multiplikationssatz, Tests unabhängig</span>` + TB(String.raw`P(\text{mindestens ein Fehlalarm}) = 1 - 0{,}95^{${k}} = \mathbf{${tz(pct(th))}}`, `<span class="big">P(mindestens ein Fehlalarm) = 1 − 0,95<sup>${k}</sup> = ${pct(th)}</span>`);
  const sig = S2.last ? S2.last.filter(p => p < ALPHA).length : null;
  $("r2").innerHTML = readout("signifikant in der letzten Studie", sig === null ? "–" : `${sig} von ${k}`) + readout("Studien mit mindestens einem Fehlalarm", S2.N ? `${pct(S2.fa / S2.N)}` : "–") + readout("Theorie: 1 − 0,95ᵏ", pct(th)) + readout("erwartete Fehlalarme je Studie: k · α", dec(k * ALPHA, 2));
}
$("k2").addEventListener("input", e => { S2.k = +e.target.value; reset2(); });
$("s2-1").onclick = () => run2(1);
$("s2-100").onclick = () => run2(100);
$("s2-reset").onclick = reset2;

/* ---------- Stufe 3: Bonferroni ---------- */
const S3 = { k: 20, N: 0, faN: 0, faB: 0, last: null };
const m3 = segInit("m3", () => draw3());
function run3(times) { for (let j = 0; j < times; j++) { const ps = study(S3.k, 0, 20, 0).ps; S3.N++; if (ps.some(p => p < ALPHA)) S3.faN++; if (ps.some(p => p < ALPHA / S3.k)) S3.faB++; S3.last = ps; } draw3(); }
function reset3() { S3.N = 0; S3.faN = 0; S3.faB = 0; S3.last = null; draw3(); }
function draw3() {
  const k = S3.k, m = m3(), bt = ALPHA / k, thN = 1 - Math.pow(1 - ALPHA, k), thB = 1 - Math.pow(1 - bt, k), cut = m === "bonf" ? bt : ALPHA;
  $("k3-v").textContent = k;
  $("tiles3").innerHTML = S3.last ? tilesHTML(S3.last, p => p < cut ? "sig" : (m === "bonf" && p < ALPHA ? "near" : "")) : `<p class="empty-note">Klicken Sie auf „1 Studie“ oder „100 Studien“.</p>`;
  $("s3-count").textContent = S3.N ? `${intf(S3.N)} Studien` : "";
  fwerChart($("fwer3"), k, [
    { f: v => 1 - Math.pow(1 - ALPHA, v), col: "var(--accent-soft)", w: m === "none" ? 3.5 : 2, label: m === "none" },
    { f: v => 1 - Math.pow(1 - ALPHA / v, v), col: "var(--therapie)", w: m === "bonf" ? 3.5 : 2, label: m === "bonf" }
  ], [{ v: S3.N ? S3.faN / S3.N : null, strong: m === "none" }, { v: S3.N ? S3.faB / S3.N : null, strong: m === "bonf" }]);
  $("f3").innerHTML = TS(String.raw`\alpha_{\text{je Test}} = \dfrac{\alpha}{k} = \dfrac{0{,}05}{${k}} = ${tz(thr(bt))}`, `<span>Schwelle je Test: α / k = ${thr(bt)}</span>`) + TB(String.raw`P(\text{mindestens ein Fehlalarm}) = 1 - (1 - ${tz(thr(bt))})^{${k}} = \mathbf{${tz(pct(thB))}} \le 5\,\%`, `<span class="big">P(mindestens ein Fehlalarm) = ${pct(thB)} ≤ 5 %</span>`);
  $("r3").innerHTML = readout("Schwelle je Test", m === "bonf" ? thr(bt) : "0,05") +
    readout("Studien mit Fehlalarm, ohne Korrektur", S3.N ? pct(S3.faN / S3.N) : pct(thN) + " (Theorie)") +
    readout("Studien mit Fehlalarm, Bonferroni", S3.N ? pct(S3.faB / S3.N) : pct(thB) + " (Theorie)");
}
$("k3").addEventListener("input", e => { S3.k = +e.target.value; reset3(); });
$("s3-1").onclick = () => run3(1);
$("s3-100").onclick = () => run3(100);
$("s3-reset").onclick = reset3;

/* ---------- Stufe 4: Preis der Korrektur ---------- */
const S4 = { k: 20, t: 5, d: 0.5, n: 50, last: null, res: null };
const NS4 = 500;
const m4 = segInit("m4", () => draw4tiles());
function sim4() {
  const r = { none: { fa: 0, fwer: 0, hit: 0 }, bonf: { fa: 0, fwer: 0, hit: 0 } };
  for (let j = 0; j < NS4; j++) {
    const s = study(S4.k, S4.t, S4.n, S4.d);
    ["none", "bonf"].forEach(m => { const rj = reject(s.ps, m); let fa = 0, hit = 0; rj.forEach((v, i) => { if (v) { if (s.truth[i]) hit++; else fa++; } }); r[m].fa += fa; r[m].hit += hit; if (fa) r[m].fwer++; });
    if (j === NS4 - 1) S4.last = s;
  }
  S4.res = r; draw4();
}
function draw4tiles() {
  const s = S4.last, m = m4(); if (!s) return;
  const rj = reject(s.ps, m);
  $("tiles4").innerHTML = tilesHTML(s.ps, (p, i) => s.truth[i] ? (rj[i] ? "sig" : "miss") : (rj[i] ? "fa" : ""));
}
function draw4() {
  const { k, t } = S4, r = S4.res;
  draw4labels();
  $("n4-studies").textContent = intf(NS4);
  draw4tiles();
  const nNull = k - t, card = (m, title) => {
    const q = r[m], fw = q.fwer / NS4, pw = t ? q.hit / (NS4 * t) : null;
    const row = (l, v, cls, txt) => `<div class="bar-row"><span class="bl">${l}</span><span class="bar"><i class="${cls}" style="width:${(v || 0) * 100}%"></i></span><span class="bv">${txt}</span></div>`;
    return `<div class="cmp"><h4>${title}</h4>${row("Studien mit Fehlalarm", nNull ? fw : 0, "a", nNull ? pct(fw, 0) : "–")}${row("Power je echtem Effekt", pw, "p", pw === null ? "–" : pct(pw, 0))}<p class="note">Im Mittel je Studie: ${dec(q.fa / NS4, 2)} Fehlalarme, ${dec(q.hit / NS4, 1)} von ${t} echten Effekten gefunden.</p></div>`;
  };
  $("cmp4").innerHTML = card("none", "Ohne Korrektur · α = 0,05") + card("bonf", `Bonferroni · α / k = ${thr(ALPHA / k)}`);
  const pN = t ? r.none.hit / (NS4 * t) : 0, pB = t ? r.bonf.hit / (NS4 * t) : 0;
  $("c4").innerHTML = t && nNull ? `Bonferroni senkt den Anteil der Studien mit Fehlalarm von <b>${pct(r.none.fwer / NS4, 0)}</b> auf <b>${pct(r.bonf.fwer / NS4, 0)}</b>. Gleichzeitig sinkt die Power je echtem Effekt von <b>${pct(pN, 0)}</b> auf <b>${pct(pB, 0)}</b>, β steigt also auf ${pct(1 - pB, 0)}. Wer korrigieren muss, braucht mehr Personen: Erhöhen Sie n und beobachten Sie, wie die Power zurückkommt.`
    : t ? "Alle Tests haben einen echten Effekt: Fehlalarme sind unmöglich, die Korrektur kostet nur Power." : "Kein Test hat einen echten Effekt: Hier gibt es nur Fehlalarme, wie in Stufe 2 und 3.";
}
let t4 = 0; const later4 = () => { clearTimeout(t4); t4 = setTimeout(sim4, 60); };
$("k4").addEventListener("input", e => { S4.k = +e.target.value; $("t4").max = S4.k; if (S4.t > S4.k) { S4.t = S4.k; $("t4").value = S4.k; } later4(); draw4labels(); });
$("t4").addEventListener("input", e => { S4.t = +e.target.value; later4(); draw4labels(); });
$("d4").addEventListener("input", e => { S4.d = +e.target.value; later4(); draw4labels(); });
$("n4").addEventListener("input", e => { S4.n = +e.target.value; later4(); draw4labels(); });
function draw4labels() { $("k4-v").textContent = S4.k; $("t4-v").textContent = S4.t; $("d4-v").textContent = dec(S4.d, 1); $("n4-v").textContent = S4.n; }
$("s4-1").onclick = () => { S4.last = study(S4.k, S4.t, S4.n, S4.d); draw4tiles(); };
$("s4-500").onclick = sim4;

/* ---------- Stufe 5: Holm und Benjamini-Hochberg ---------- */
const S5 = { k: 20, t: 6, d: 0.5, n: 50, last: null, tab: null };
const NAMES = { none: "Ohne Korrektur", bonf: "Bonferroni", holm: "Holm", bh: "Benjamini-Hochberg" };
const m5 = segInit("m5", () => draw5());
function sim5() {
  const M = ["none", "bonf", "holm", "bh"], acc = {}; M.forEach(m => acc[m] = { fwer: 0, fdr: 0, hit: 0, disc: 0 });
  const N = 1000;
  for (let j = 0; j < N; j++) {
    const s = study(S5.k, S5.t, S5.n, S5.d);
    M.forEach(m => { const rj = reject(s.ps, m); let fa = 0, hit = 0; rj.forEach((v, i) => { if (v) { if (s.truth[i]) hit++; else fa++; } }); const a = acc[m]; if (fa) a.fwer++; if (fa + hit) a.fdr += fa / (fa + hit); a.hit += hit; a.disc += fa + hit; });
  }
  S5.tab = { acc, N }; drawTab();
}
function drawTab() {
  const { acc, N } = S5.tab, t = S5.t, sel = m5();
  const ctl = { none: "nichts", bonf: "FWER ≤ 5 %", holm: "FWER ≤ 5 %", bh: "FDR ≤ 5 %" };
  let s = `<thead><tr><th>Verfahren</th><th>kontrolliert</th><th>FWER</th><th>FDR</th><th>Power</th><th>Ø Befunde</th></tr></thead><tbody>`;
  Object.keys(acc).forEach(m => { const a = acc[m]; s += `<tr class="${m === sel ? "on" : ""}"><td>${NAMES[m]}</td><td><small>${ctl[m]}</small></td><td>${S5.k - t ? pct(a.fwer / N) : "–"}</td><td>${S5.k - t ? pct(a.fdr / N) : "–"}</td><td>${t ? pct(a.hit / (N * t)) : "–"}</td><td>${dec(a.disc / N, 1)}</td></tr>`; });
  $("tab5").innerHTML = s + "</tbody>";
}
function draw5() {
  const { k, t } = S5, s = S5.last, sel = m5();
  $("k5-v").textContent = k; $("t5-v").textContent = t;
  if (!s) return;
  const ord = s.ps.map((p, i) => i).sort((a, b) => s.ps[a] - s.ps[b]);
  const rj = {}; ["none", "bonf", "holm", "bh"].forEach(m => rj[m] = reject(s.ps, m));
  const svg = $("pplot"), W = 900, H = 380, L = 70, R = 150, T = 16, B = 42, LO = -5;
  const bw = (W - L - R) / k, x = r => L + (r + 0.5) * bw, y = p => T + (-Math.log10(Math.max(p, 1e-5))) / -LO * (H - T - B);
  let g = "";
  const lab = ["1", "0,1", "0,01", "0,001", "0,0001", "0,00001"];
  for (let e = 0; e >= LO; e--) g += `<line class="gridl" x1="${L}" x2="${W - R}" y1="${y(Math.pow(10, e))}" y2="${y(Math.pow(10, e))}"/><text x="${L - 8}" y="${y(Math.pow(10, e)) + 4}" text-anchor="end">${lab[-e]}</text>`;
  g += `<text x="${(L + W - R) / 2}" y="${H - 6}" text-anchor="middle">Rang des p-Werts (vom kleinsten zum größten)</text>`;
  g += `<text x="16" y="${(T + H - B) / 2}" transform="rotate(-90 16 ${(T + H - B) / 2})" text-anchor="middle">p-Wert (log)</text>`;
  [1, Math.ceil(k / 2), k].forEach(r => g += `<text x="${x(r - 1)}" y="${H - B + 18}" text-anchor="middle">${r}</text>`);
  // Schwellen: alle dünn, die gewählte kräftig
  const labs = [];
  const thrAt = (m, r) => m === "none" ? ALPHA : m === "bonf" ? ALPHA / k : m === "holm" ? ALPHA / (k - r) : (r + 1) * ALPHA / k;
  ["none", "bonf", "holm", "bh"].forEach(m => {
    const on = m === sel; let pts = [];
    for (let r = 0; r < k; r++) { const yy = y(thrAt(m, r)); pts.push([L + r * bw, yy], [L + (r + 1) * bw, yy]); }
    g += `<path d="${path(pts)}" fill="none" stroke="${on ? "var(--fg)" : "var(--accent-soft)"}" stroke-width="${on ? 2.5 : 1.2}" stroke-dasharray="${on ? "" : "4 4"}"/>`;
    labs.push({ y: pts[pts.length - 1][1] + 4, on, t: NAMES[m].replace("Benjamini-Hochberg", "BH").replace("Ohne Korrektur", "ohne (α = 0,05)") });
  });
  labs.sort((a, b) => a.y - b.y).forEach((l, i, arr) => { if (i && l.y < arr[i - 1].y + 16) l.y = arr[i - 1].y + 16; g += `<text x="${W - R + 8}" y="${l.y}" class="${l.on ? "strong" : ""}">${l.t}</text>`; });
  ord.forEach((i, r) => {
    const p = s.ps[i], cx = x(r), cy = y(p);
    if (rj[sel][i]) g += `<circle cx="${cx}" cy="${cy}" r="${Math.min(13, bw * 0.45 + 4)}" fill="var(--alpha-fill)" opacity=".5"/>`;
    g += s.truth[i] ? `<circle cx="${cx}" cy="${cy}" r="5.5" fill="var(--therapie)"/>` : `<circle cx="${cx}" cy="${cy}" r="5" fill="var(--surface)" stroke="var(--kontrolle)" stroke-width="2"/>`;
  });
  svg.innerHTML = g;
  const cnt = m => { let fa = 0, hit = 0; rj[m].forEach((v, i) => { if (v) { if (s.truth[i]) hit++; else fa++; } }); return { fa, hit }; };
  const c = cnt(sel), others = ["none", "bonf", "holm", "bh"].filter(m => m !== sel).map(m => { const o = cnt(m); return `${NAMES[m]} ${o.fa + o.hit} (${o.fa} Fehlalarm${o.fa === 1 ? "" : "e"})`; });
  $("t5-text").innerHTML = `In dieser Studie verwirft <b>${NAMES[sel]}</b> ${c.fa + c.hit} von ${k} Hypothesen: ${c.hit} von ${t} echten Effekten gefunden, ${c.fa} Fehlalarm${c.fa === 1 ? "" : "e"}. Zum Vergleich: ${others.join(", ")}. Holm und Bonferroni starten mit derselben Schwelle α / k, doch Holm lockert sie mit jedem Treffer. BH steigt linear mit dem Rang an.`;
  if (S5.tab) drawTab();
}
function new5() { S5.last = study(S5.k, S5.t, S5.n, S5.d); draw5(); }
let t5 = 0;
$("k5").addEventListener("input", e => { S5.k = +e.target.value; $("t5").max = Math.min(20, S5.k); if (S5.t > S5.k) { S5.t = S5.k; $("t5").value = S5.k; } new5(); clearTimeout(t5); t5 = setTimeout(sim5, 80); });
$("t5").addEventListener("input", e => { S5.t = +e.target.value; new5(); clearTimeout(t5); t5 = setTimeout(sim5, 80); });
$("s5-1").onclick = new5;

/* ---------- Start ---------- */
drawDie(); draw2(); draw3(); draw4labels(); sim4(); new5(); sim5();
})();
