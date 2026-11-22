/* Fallzahl und Power · Stats Lab
   t-Tests: exakt über die nichtzentrale t-Verteilung. Zwei Anteile: Normalapproximation (Fleiss, ohne Stetigkeitskorrektur). */
(() => {
"use strict";

/* ---------- Mathematik ---------- */
const LG = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
function lgamma(x) { if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x); x -= 1; let a = 0.99999999999980993; const t = x + 7.5; for (let i = 0; i < 8; i++) a += LG[i] / (x + i + 1); return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a); }
function betacf(a, b, x) { const FP = 1e-300; let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < FP) d = FP; d = 1 / d; let h = d; for (let m = 1; m <= 400; m++) { const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2)); d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; h *= d * c; aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2)); d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-14) break; } return h; }
function ibeta(x, a, b) { if (x <= 0) return 0; if (x >= 1) return 1; const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)); return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b; }
const tcdf = (t, df) => { const ib = ibeta(df / (df + t * t), df / 2, 0.5); return t >= 0 ? 1 - 0.5 * ib : 0.5 * ib; };
function tinv(p, df) { let lo = -1e9, hi = 1e9; for (let i = 0; i < 140; i++) { const m = (lo + hi) / 2; if (tcdf(m, df) < p) lo = m; else hi = m; } return (lo + hi) / 2; }
function erf(x) { const s = x < 0 ? -1 : 1; x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)); }
const Phi = x => 0.5 * (1 + erf(x / Math.SQRT2));
function zinv(p) { let lo = -10, hi = 10; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (Phi(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; }
const quadCache = new Map();
function quad(df) {
  // Integration über die Chi-Verteilung von s = Wurzel(Chi-Quadrat): Dichte s^(df-1)·e^(-s²/2) ist auch bei df = 1 endlich.
  if (quadCache.has(df)) return quadCache.get(df);
  const m = Math.sqrt(df), lo = Math.max(0, m - 9), hi = m + 9, N = 600, h = (hi - lo) / N, V = [], W = []; let tot = 0;
  const xm = Math.sqrt(Math.max(df - 1, 0)), lmax = df > 1 ? (df - 1) * Math.log(xm) - xm * xm / 2 : 0;
  for (let i = 0; i <= N; i++) { const x = lo + i * h, dens = x <= 0 ? (df === 1 ? 1 : 0) : Math.exp((df - 1) * Math.log(x) - x * x / 2 - lmax), sw = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2); V.push(x / m); W.push(dens * sw); tot += dens * sw; }
  for (let i = 0; i < W.length; i++) W[i] /= tot;
  if (quadCache.size > 3000) quadCache.clear();
  const q = { V, W }; quadCache.set(df, q); return q;
}
function ncTail(c, df, d, upper) { const { V, W } = quad(df); let s = 0; for (let i = 0; i < V.length; i++) { const p = Phi(c * V[i] - d); s += W[i] * (upper ? 1 - p : p); } return s; }

/* ---------- Power je Test ---------- */
function power(test, alpha, eff, n, sides) {
  if (test === "p2") {
    const { p1, p2 } = eff, pb = (p1 + p2) / 2, za = zinv(sides === "two" ? 1 - alpha / 2 : 1 - alpha);
    const num = Math.abs(p1 - p2) * Math.sqrt(n) - za * Math.sqrt(2 * pb * (1 - pb));
    return Phi(num / Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)));
  }
  const d = Math.abs(eff.d);
  const df = test === "t2" ? 2 * n - 2 : n - 1, ncp = test === "t2" ? d * Math.sqrt(n / 2) : d * Math.sqrt(n);
  if (df < 1) return 0;
  const tc = tinv(sides === "two" ? 1 - alpha / 2 : 1 - alpha, df);
  const p = ncTail(tc, df, ncp, true) + (sides === "two" ? ncTail(-tc, df, ncp, false) : 0);
  return Math.min(1, Math.max(0, p));
}
function solveN(test, alpha, eff, target, sides) {
  if (test === "p2") {
    const { p1, p2 } = eff, pb = (p1 + p2) / 2, za = zinv(sides === "two" ? 1 - alpha / 2 : 1 - alpha), zb = zinv(target);
    if (p1 === p2) return null;
    return Math.ceil(((za * Math.sqrt(2 * pb * (1 - pb)) + zb * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) / Math.abs(p1 - p2)) ** 2);
  }
  if (Math.abs(eff.d) < 1e-6) return null;
  let lo = 2, hi = 4;
  while (power(test, alpha, eff, hi, sides) < target) { lo = hi; hi *= 2; if (hi > 2e6) return null; }
  while (hi - lo > 1) { const m = Math.floor((lo + hi) / 2); if (power(test, alpha, eff, m, sides) >= target) hi = m; else lo = m; }
  return power(test, alpha, eff, lo, sides) >= target ? lo : hi;
}
function solveEffect(test, alpha, n, target, sides, p1, up) {
  let lo, hi;
  if (test === "p2") { lo = p1; hi = up ? 0.9999 : 0.0001; }
  else { lo = 0; hi = 6; }
  const pw = v => power(test, alpha, test === "p2" ? { p1, p2: v } : { d: v }, n, sides);
  if (pw(hi) < target) return null;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (pw(m) >= target) hi = m; else lo = m; }
  return hi;
}
const ALPHA_MIN = 1e-7;
function solveAlpha(test, eff, n, target, sides) {
  if (power(test, 0.5, eff, n, sides) < target) return null;
  if (power(test, ALPHA_MIN, eff, n, sides) >= target) return 0;
  let lo = ALPHA_MIN, hi = 0.5;
  for (let i = 0; i < 60; i++) { const m = Math.sqrt(lo * hi); if (power(test, m, eff, n, sides) >= target) hi = m; else lo = m; }
  return hi;
}

/* ---------- Zustand und Oberfläche ---------- */
const TESTS = {
  t2: { label: "Zwei unabhängige Gruppen", sub: "t-Test, zum Beispiel Therapie gegen Kontrolle", nLabel: "n pro Gruppe" },
  t1: { label: "Gepaart oder eine Stichprobe", sub: "t-Test, zum Beispiel Vorher-Nachher", nLabel: "n Personen (Paare)" },
  p2: { label: "Zwei Anteile", sub: "zum Beispiel Erfolgsrate Therapie gegen Kontrolle", nLabel: "n pro Gruppe" }
};
const TARGETS = [["n", "Fallzahl"], ["power", "Power"], ["effect", "Effekt"], ["alpha", "α"]];
const S = { test: "t2", target: "n", sides: "two", alpha: 0.05, power: 0.8, d: 0.5, effMode: "d", delta: 10, sd: 20, p1: 0.3, p2: 0.5, n: 64, dropout: 10 };

const $ = id => document.getElementById(id);
const fmt = (x, d = 2) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (x, d = 1) => (x * 100).toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }) + " %";
const apct = a => a < 0.00001 ? "< 0,001 %" : (a * 100).toLocaleString("de-DE", { maximumSignificantDigits: a < 0.01 ? 2 : 3 }) + " %";
const intf = x => Math.round(x).toLocaleString("de-DE");
const path = pts => pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join("");

const effOf = () => S.test === "p2" ? { p1: S.p1, p2: S.p2 } : { d: S.effMode === "raw" ? (S.sd > 0 ? S.delta / S.sd : 0) : S.d };

function numInput(key, label, min, max, step, help) {
  return `<div class="in" data-key="${key}"><label for="in-${key}">${label}</label><input type="number" id="in-${key}" min="${min}" max="${max}" step="${step}" inputmode="decimal">${help ? `<span class="help">${help}</span>` : ""}<span class="state"></span></div>`;
}
function buildForm() {
  $("test-seg").innerHTML = Object.entries(TESTS).map(([k, t]) => `<button type="button" data-test="${k}" aria-pressed="${k === S.test}">${t.label}<small>${t.sub}</small></button>`).join("");
  $("target-seg").innerHTML = TARGETS.map(([k, l]) => `<button type="button" data-target="${k}" aria-pressed="${k === S.target}">${l}</button>`).join("");
  let h = "";
  h += numInput("alpha", "Signifikanzniveau α", 0.0001, 0.5, 0.005, "");
  h += `<div class="in"><span class="lbl sub-seg">Hypothese</span><div class="seg sub-seg" role="group" aria-label="Hypothese"><button type="button" data-sides="two">zweiseitig</button><button type="button" data-sides="one">einseitig</button></div></div>`;
  h += numInput("power", "Power 1 − β", 0.5, 0.999, 0.05, "Üblich sind 0,80 oder 0,90.");
  if (S.test === "p2") {
    h += numInput("p1", "Anteil Kontrolle p₁", 0.001, 0.999, 0.01, "Erwartete Erfolgsrate ohne Therapie.");
    h += numInput("p2", "Anteil Therapie p₂", 0.001, 0.999, 0.01, "Erwartete Erfolgsrate mit Therapie.");
  } else {
    h += `<div class="in"><span class="lbl sub-seg">Effekt angeben als</span><div class="seg sub-seg" role="group" aria-label="Effekt angeben als"><button type="button" data-eff="d">Cohen's d</button><button type="button" data-eff="raw">Differenz und SD</button></div></div>`;
    h += numInput("d", "Effektstärke d", 0.01, 5, 0.05, "Klein 0,2 · mittel 0,5 · groß 0,8 (Cohen).");
    h += numInput("delta", "erwartete Differenz Δ", 0, 1e6, 1, S.test === "t1" ? "Mittlere Veränderung, zum Beispiel in mm VAS." : "Unterschied der Mittelwerte, zum Beispiel in mm VAS.");
    h += numInput("sd", S.test === "t1" ? "SD der Differenzen" : "Standardabweichung", 0.01, 1e6, 1, "");
  }
  h += numInput("n", TESTS[S.test].nLabel, 2, 1e6, 1, "");
  h += numInput("dropout", "erwarteter Drop-out in %", 0, 80, 5, "Wird auf die berechnete Fallzahl aufgeschlagen.");
  $("inputs").innerHTML = h;

  document.querySelectorAll("[data-test]").forEach(b => b.addEventListener("click", () => { S.test = b.dataset.test; if (S.test === "p2" && S.target === "effect") {} buildForm(); }));
  document.querySelectorAll("[data-target]").forEach(b => b.addEventListener("click", () => { S.target = b.dataset.target; buildForm(); }));
  document.querySelectorAll("[data-sides]").forEach(b => b.addEventListener("click", () => { S.sides = b.dataset.sides; update(); }));
  document.querySelectorAll("[data-eff]").forEach(b => b.addEventListener("click", () => { S.effMode = b.dataset.eff; update(); }));
  ["alpha", "power", "p1", "p2", "d", "delta", "sd", "n", "dropout"].forEach(k => {
    const el = $("in-" + k); if (!el) return;
    el.value = S[k];
    el.addEventListener("input", () => { const v = parseFloat(String(el.value).replace(",", ".")); if (isFinite(v)) { S[k] = v; update(false); } });
  });
  update();
}

function setVal(key, v, digits) { const el = $("in-" + key); if (el && document.activeElement !== el) el.value = digits == null ? v : (+v.toFixed(digits)); }

function update(syncInputs = true) {
  document.querySelectorAll("[data-sides]").forEach(b => b.setAttribute("aria-pressed", b.dataset.sides === S.sides));
  document.querySelectorAll("[data-eff]").forEach(b => b.setAttribute("aria-pressed", b.dataset.eff === S.effMode));
  // welche Felder sichtbar und welches berechnet wird
  const solvedKey = S.target === "n" ? "n" : S.target === "power" ? "power" : S.target === "alpha" ? "alpha" : (S.test === "p2" ? "p2" : (S.effMode === "raw" ? "delta" : "d"));
  const unused = {};
  if (S.test !== "p2") { if (S.effMode === "d") { unused.delta = unused.sd = "nicht benötigt: Effekt als Cohen's d angegeben"; } else unused.d = "nicht benötigt: Effekt als Differenz und SD angegeben"; }
  if (S.target !== "n") unused.dropout = "nicht benötigt: nur für die Fallzahl relevant";
  document.querySelectorAll(".in[data-key]").forEach(r => {
    const k = r.dataset.key, sol = k === solvedKey, un = !sol && unused[k], st = r.querySelector(".state"), inp = r.querySelector("input");
    r.hidden = false; r.classList.toggle("solved", sol); r.classList.toggle("unused", !!un);
    if (inp) inp.disabled = sol || !!un;
    if (st) st.textContent = sol ? "wird berechnet, siehe Ergebnis" : un || "";
  });

  const T = TESTS[S.test], unitN = S.test === "t1" ? "Personen" : "pro Gruppe";
  let eff = effOf(), big = "", sub = "", warn = "", n = S.n, pw = S.power, alpha = S.alpha;
  if (S.target === "n") {
    n = solveN(S.test, alpha, eff, S.power, S.sides);
    if (n == null) { big = "nicht berechenbar"; warn = "Bei einem Effekt von null gibt es nichts zu entdecken."; }
    else {
      setVal("n", n);
      const nd = Math.ceil(n / (1 - S.dropout / 100));
      big = S.test === "t1" ? `${intf(n)} Personen` : `${intf(n)} pro Gruppe`;
      sub = S.test === "t1" ? `mit ${fmt(S.dropout, 0)} % Drop-out: ${intf(nd)} Personen einschließen`
        : `insgesamt ${intf(2 * n)} · mit ${fmt(S.dropout, 0)} % Drop-out: ${intf(nd)} pro Gruppe, ${intf(2 * nd)} insgesamt`;
      pw = power(S.test, alpha, eff, n, S.sides);
      sub += ` · tatsächliche Power ${pct(pw)}`;
    }
  } else if (S.target === "power") {
    pw = power(S.test, alpha, eff, n, S.sides); setVal("power", pw, 3);
    big = `Power ${pct(pw)}`; sub = `β = ${pct(1 - pw)}: So oft würde ein echter Effekt dieser Größe übersehen.`;
    if (pw < 0.8) warn = "Unter 80 %: Ein echter Effekt bliebe in mehr als jeder fünften Studie unentdeckt.";
  } else if (S.target === "effect") {
    const up = S.p2 >= S.p1;
    const v = solveEffect(S.test, alpha, n, S.power, S.sides, S.p1, up);
    if (v == null) { big = "nicht erreichbar"; warn = "Mit diesem n wird die gewünschte Power für keinen Effekt erreicht."; }
    else if (S.test === "p2") { setVal("p2", v, 3); eff = { p1: S.p1, p2: v }; big = `p₂ = ${pct(v)}`; sub = `Kleinste entdeckbare Differenz: ${fmt(Math.abs(v - S.p1) * 100, 1)} Prozentpunkte gegenüber ${pct(S.p1)}.`; }
    else {
      if (S.effMode === "raw") { setVal("delta", v * S.sd, 2); } else { setVal("d", v, 3); }
      eff = { d: v }; big = `d = ${fmt(v, 2)}`; sub = S.effMode === "raw" ? `Das entspricht Δ = ${fmt(v * S.sd, 1)} bei SD = ${fmt(S.sd, 1)}. Kleinere Effekte werden mit weniger als ${pct(S.power, 0)} Power entdeckt.` : `Kleinere Effekte werden mit weniger als ${pct(S.power, 0)} Power entdeckt.`;
    }
  } else {
    const a = solveAlpha(S.test, eff, n, S.power, S.sides);
    if (a == null) { big = "nicht erreichbar"; warn = "Selbst mit α = 50 % reicht die Power nicht. Mehr Personen oder ein größerer Effekt sind nötig."; }
    else if (a === 0) { alpha = ALPHA_MIN; big = "α beliebig klein"; sub = `Selbst bei α = 0,00001 % erreicht die Studie mehr als ${pct(S.power, 0)} Power. Effekt und Fallzahl sind so groß, dass das Signifikanzniveau praktisch keine Rolle spielt.`; { const el = $("in-alpha"); if (el && document.activeElement !== el) el.value = "0.0000001"; } }
    else { setVal("alpha", a, 4); alpha = a; big = `α = ${apct(a)}`; sub = `Mit diesem Signifikanzniveau erreicht die Studie ${pct(S.power, 0)} Power.`; if (a > 0.05) warn = "Größer als 5 %: Das gängige Niveau ist mit diesem Design nicht einzuhalten."; }
  }
  if (S.target !== "alpha") alpha = S.alpha;
  if (syncInputs) ["alpha", "power", "p1", "p2", "d", "delta", "sd", "n", "dropout"].forEach(k => { if (k !== solvedKey) setVal(k, S[k]); });

  { const tt = $("tab-title"); if (tt) tt.textContent = S.test === "t1" ? "Fallzahl (Personen) für typische Annahmen" : "Fallzahl pro Gruppe für typische Annahmen"; }
  $("result").innerHTML = `<span class="k">Ergebnis · ${TARGETS.find(t => t[0] === S.target)[1]}</span><span class="big">${big}</span>${sub ? `<span class="sub">${sub}</span>` : ""}${warn ? `<span class="warn">${warn}</span>` : ""}`;

  // Methodensatz
  const testText = S.test === "t2" ? "einen t-Test für unabhängige Stichproben" : S.test === "t1" ? "einen t-Test für gepaarte Stichproben" : "einen Vergleich zweier Anteile (z-Test)";
  const testNom = S.test === "t2" ? "ein t-Test für unabhängige Stichproben" : S.test === "t1" ? "ein t-Test für gepaarte Stichproben" : "ein Vergleich zweier Anteile (z-Test)";
  const side = S.sides === "two" ? "zweiseitig" : "einseitig";
  const effText = S.test === "p2" ? `einen Unterschied der Anteile von ${pct(eff.p1, 0)} gegenüber ${pct(eff.p2, 0)}` : (S.effMode === "raw" && S.target !== "effect" ? `eine Differenz von ${fmt(S.delta, 1)} bei einer Standardabweichung von ${fmt(S.sd, 1)} (d = ${fmt(eff.d, 2)})` : `einen Effekt von d = ${fmt(eff.d, 2)}`);
  let rep = "";
  if (S.target === "n" && n != null) {
    const nd = Math.ceil(n / (1 - S.dropout / 100));
    rep = `Die Fallzahlplanung erfolgte für ${testText} (${side}, α = ${fmt(S.alpha, 3).replace(/0+$/, "").replace(/,$/, "")}). Um ${effText} mit einer Power von ${pct(S.power, 0)} zu entdecken, werden ${S.test === "t1" ? `${intf(n)} Personen` : `${intf(n)} Personen pro Gruppe`} benötigt. Unter Berücksichtigung eines erwarteten Drop-outs von ${fmt(S.dropout, 0)} % werden ${S.test === "t1" ? `${intf(nd)} Personen` : `${intf(nd)} Personen pro Gruppe (insgesamt ${intf(2 * nd)})`} eingeschlossen.`;
  } else if (S.target === "power") {
    rep = `Mit ${S.test === "t1" ? `${intf(n)} Personen` : `${intf(n)} Personen pro Gruppe`} erreicht ${testNom} (${side}, α = ${apct(S.alpha)}) für ${effText} eine Power von ${pct(pw)}.`;
  } else if (S.target === "effect" && big !== "nicht erreichbar") {
    rep = `Mit ${S.test === "t1" ? `${intf(n)} Personen` : `${intf(n)} Personen pro Gruppe`} kann ${testNom} (${side}, α = ${apct(S.alpha)}) mit einer Power von ${pct(S.power, 0)} ${effText} entdecken (Sensitivitätsanalyse).`;
  } else if (S.target === "alpha" && big !== "nicht erreichbar") {
    rep = `Für ${effText} erreicht ${testNom} mit ${S.test === "t1" ? `${intf(n)} Personen` : `${intf(n)} Personen pro Gruppe`} eine Power von ${pct(S.power, 0)} bei einem Signifikanzniveau von ${apct(alpha)} (${side}).`;
  } else rep = "Keine Formulierung möglich: Bitte Eingaben anpassen.";
  $("report").textContent = rep;

  drawCurve(eff, alpha, n);
  drawSens(alpha);
  $("method-note").textContent = S.test === "p2"
    ? "Berechnung für zwei Anteile über die Normalapproximation ohne Stetigkeitskorrektur (Fleiss). G*Power rechnet hier je nach Einstellung exakt und kann leicht abweichende Fallzahlen liefern."
    : "Berechnung exakt über die nichtzentrale t-Verteilung, wie in G*Power. Gleich große Gruppen.";
}

function drawCurve(eff, alpha, n) {
  const L = 54, R = 600, T = 14, B = 250;
  const nCur = n || 50, nmax = Math.max(40, Math.ceil(nCur * 2 / 10) * 10);
  const sx = v => L + (v - 2) / (nmax - 2) * (R - L), sy = p => B - p * (B - T);
  let s = "";
  [0, 0.2, 0.4, 0.6, 0.8, 1].forEach(p => { s += `<line x1="${L}" x2="${R}" y1="${sy(p)}" y2="${sy(p)}" stroke="var(--grid)"/><text x="${L - 8}" y="${sy(p) + 4}" text-anchor="end">${p * 100} %</text>`; });
  const step = Math.max(1, Math.round((nmax - 2) / 80)), ns = []; for (let v = 2; v <= nmax; v += step) ns.push(v);
  const tk = []; { const st = nmax <= 60 ? 10 : nmax <= 150 ? 25 : nmax <= 400 ? 50 : Math.pow(10, Math.floor(Math.log10(nmax))) / 2; for (let v = 0; v <= nmax; v += st) if (v >= 2 || v === 0) tk.push(Math.max(2, v)); }
  tk.forEach(v => { s += `<text x="${sx(v)}" y="${B + 18}" text-anchor="middle">${intf(v)}</text>`; });
  const leg = [];
  if (S.test !== "p2") {
    [[0.2, "klein"], [0.5, "mittel"], [0.8, "groß"]].forEach(([d, l]) => {
      if (Math.abs(d - Math.abs(eff.d)) < 1e-6) return;
      s += `<path d="${path(ns.map(v => [sx(v), sy(power(S.test, alpha, { d }, v, S.sides))]))}" fill="none" stroke="var(--accent-soft)" stroke-width="1.8" stroke-dasharray="5 4"/>`;
    });
    leg.push(`<span><i class="sw" style="border-color:var(--accent-soft);border-top-style:dashed"></i>d = 0,2 / 0,5 / 0,8 zum Vergleich</span>`);
  }
  s += `<path d="${path(ns.map(v => [sx(v), sy(power(S.test, alpha, eff, v, S.sides))]))}" fill="none" stroke="var(--therapie)" stroke-width="3"/>`;
  leg.unshift(`<span><i class="sw" style="border-color:var(--therapie)"></i>Ihre Annahmen</span>`);
  s += `<line x1="${L}" x2="${R}" y1="${sy(S.power)}" y2="${sy(S.power)}" stroke="var(--fg)" stroke-dasharray="6 5"/><text x="${R}" y="${sy(S.power) - 6}" text-anchor="end">Ziel-Power ${pct(S.power, 0)}</text>`;
  if (n) { const p = power(S.test, alpha, eff, n, S.sides); s += `<circle cx="${sx(Math.min(n, nmax))}" cy="${sy(p)}" r="7" fill="var(--therapie)" stroke="var(--surface)" stroke-width="2"/><text x="${sx(Math.min(n, nmax)) + 10}" y="${sy(p) + 18}" class="strong">n = ${intf(n)}: ${pct(p, 0)}</text>`; }
  s += `<line x1="${L}" x2="${R}" y1="${B}" y2="${B}" stroke="var(--line)"/><text x="${R}" y="${B + 36}" text-anchor="end">${TESTS[S.test].nLabel}</text>`;
  $("curve").innerHTML = s;
  $("curve").setAttribute("aria-label", "Power in Abhängigkeit von der Stichprobengröße");
  $("curve-legend").innerHTML = leg.join("");
}

function drawSens(alpha) {
  const pows = [0.8, 0.9, 0.95];
  let rows;
  if (S.test === "p2") rows = [0.05, 0.1, 0.15, 0.2].map(dd => { const p2 = Math.min(0.99, S.p1 + dd); return [`p₂ = ${pct(p2, 0)} (+${fmt(dd * 100, 0)} Pp.)`, { p1: S.p1, p2 }, Math.abs(p2 - S.p2) < 1e-9]; });
  else rows = [0.2, 0.3, 0.5, 0.8].map(d => [`d = ${fmt(d, 1)}`, { d }, Math.abs(d - Math.abs(effOf().d)) < 1e-9]);
  const unit = S.test === "t1" ? "Personen" : "Personen pro Gruppe";
  $("sens").innerHTML = `<tr><th>Effekt</th>${pows.map(p => `<th>Power ${pct(p, 0)}</th>`).join("")}</tr>` +
    rows.map(([lab, eff, isCur]) => `<tr><td>${lab}</td>${pows.map(p => { const n = solveN(S.test, alpha, eff, p, S.sides); return `<td class="${isCur && Math.abs(p - S.power) < 1e-9 ? "cur" : ""}">${n == null ? "–" : intf(n)}</td>`; }).join("")}</tr>`).join("") +
    `<tr><td colspan="4" style="text-align:left;font-size:12.5px;color:var(--muted)">Angaben in ${unit}, bei α = ${apct(alpha)}, ${S.sides === "two" ? "zweiseitig" : "einseitig"}, ohne Drop-out.</td></tr>`;
}

$("copy").addEventListener("click", async () => {
  const t = $("report").textContent;
  try { await navigator.clipboard.writeText(t); $("copy").textContent = "Kopiert"; }
  catch (e) { const r = document.createRange(); r.selectNodeContents($("report")); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); $("copy").textContent = "Markiert, mit Cmd+C kopieren"; }
  setTimeout(() => { $("copy").textContent = "Kopieren"; }, 2000);
});

buildForm();
})();
