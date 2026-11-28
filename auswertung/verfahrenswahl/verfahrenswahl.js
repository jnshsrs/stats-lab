/* Stats Lab · Verfahrenswahl: Entscheidungsweg, Fallbeispiele, Übersicht */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const R = "../../";

/* ---------- Skizzen: wie die Daten aussehen ---------- */
// feste Pseudozufallszahlen, damit die Skizzen stabil bleiben
const u = (i, k = 1) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
const z = (i, k) => (u(i, k) + u(i, k + 7) + u(i, k + 13) - 1.5) * 1.4;
const W = 320, H = 170;
const ax = (xl, yl) => `<line class="ax" x1="36" x2="${W - 12}" y1="${H - 26}" y2="${H - 26}"/><line class="ax" x1="36" x2="36" y1="12" y2="${H - 26}"/>` + (xl ? `<text x="${W - 12}" y="${H - 8}" text-anchor="end">${xl}</text>` : "") + (yl ? `<text x="30" y="20" text-anchor="end" transform="rotate(-90 26 20)">${yl}</text>` : "");
const dot = (x, y, c, r = 4) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" class="${c}" fill-opacity=".85"/>`;
const ln = (x1, y1, x2, y2, c, w = 1.5, o = 1) => `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="${c}" stroke-width="${w}" stroke-opacity="${o}"/>`;
const grp = (cx, cy, n, c, k, sp = 16) => { let s = ""; for (let i = 0; i < n; i++) s += dot(cx + (u(i, k) - 0.5) * 34, cy + z(i, k) * sp, c); return s + ln(cx - 26, cy, cx + 26, cy, "m", 3); };
const FIG = {
  t1: () => ax("", "Messwert") + grp(150, 78, 14, "i", 1) + `<line class="ref" x1="60" x2="300" y1="104" y2="104"/><text x="300" y="98" text-anchor="end" class="strong">μ₀</text>`,
  t2: () => ax("", "Messwert") + grp(110, 92, 13, "k", 2) + grp(220, 62, 13, "i", 3) + `<text x="110" y="${H - 10}" text-anchor="middle">Kontrolle</text><text x="220" y="${H - 10}" text-anchor="middle">Intervention</text>`,
  reg: () => { let s = ax("Einflussgröße x", "Zielgröße y"); for (let i = 0; i < 22; i++) { const x = 50 + u(i, 4) * 250, y = 128 - (x - 50) * 0.36 + z(i, 5) * 12; s += dot(x, y, "i"); } return s + ln(50, 128, 300, 38, "m", 2.5); },
  mreg: () => { let s = ax("Einflussgröße x", "Zielgröße y"); for (let i = 0; i < 26; i++) { const g = i % 2, x = 50 + u(i, 6) * 250, y = 128 - (x - 50) * 0.3 - g * 30 + z(i, 7) * 9; s += dot(x, y, g ? "i" : "k"); } return s + ln(50, 128, 300, 53, "kl", 2.5) + ln(50, 98, 300, 23, "il", 2.5); },
  tp: () => { let s = ax("", "Messwert"); for (let i = 0; i < 11; i++) { const a = 104 + z(i, 8) * 18, b = a - 22 + z(i, 9) * 9; s += ln(90, a, 230, b, "il", 1.4, .6) + dot(90, a, "k") + dot(230, b, "i"); } return s + `<text x="90" y="${H - 10}" text-anchor="middle">vorher</text><text x="230" y="${H - 10}" text-anchor="middle">nachher</text>`; },
  ancova: () => { let s = ax("Ausgangswert", "Endwert"); for (let i = 0; i < 26; i++) { const g = i % 2, x = 50 + u(i, 10) * 250, y = 132 - (x - 50) * 0.32 - g * 32 + z(i, 11) * 8; s += dot(x, y, g ? "i" : "k"); } return s + ln(50, 132, 300, 52, "kl", 2.5) + ln(50, 100, 300, 20, "il", 2.5) + `<text x="300" y="${H - 34}" text-anchor="end">Abstand = Effekt</text>`; },
  ri: () => { let s = ax("Zeit", "Messwert"); const X = [60, 170, 280]; for (let i = 0; i < 12; i++) { const g = i % 2, a = 60 + z(i, 12) * 16, sl = g ? 26 : 10; const pts = X.map((x, j) => [x, a + sl * j + z(i * 3 + j, 13) * 4]); const n = i === 3 || i === 8 ? 2 : 3; s += `<polyline points="${pts.slice(0, n).map(p => p.join(",")).join(" ")}" fill="none" class="${g ? "il" : "kl"}" stroke-width="1.4" stroke-opacity=".7"/>` + pts.slice(0, n).map(p => dot(p[0], p[1], g ? "i" : "k", 3)).join(""); } return s; },
  rs: () => { let s = ax("Woche", "Messwert"); for (let i = 0; i < 14; i++) { const a = 44 + z(i, 14) * 10, sl = 0.12 + u(i, 15) * 0.34; s += ln(50, a, 300, a + sl * 250, i % 2 ? "il" : "kl", 1.6, .7); } return s + ln(50, 44, 300, 44 + 0.29 * 250, "m", 3); },
  cl: () => { let s = ax("", "Messwert"); [70, 115, 160, 205, 250, 295].forEach((cx, j) => { const g = j % 2, m = 90 - g * 22 + z(j, 16) * 12; for (let i = 0; i < 6; i++) s += dot(cx + (u(i + j * 9, 17) - .5) * 26, m + z(i + j * 9, 18) * 13, g ? "i" : "k", 3.4); s += ln(cx - 15, m, cx + 15, m, "m", 2.5); }); return s + `<text x="${W - 12}" y="${H - 8}" text-anchor="end">sechs Praxen, je sechs Patientinnen</text>`; },
  binom: () => ax("", "Anzahl") + `<rect x="90" y="40" width="60" height="104" class="i"/><rect x="190" y="88" width="60" height="56" class="k"/><text x="120" y="${H - 10}" text-anchor="middle">Treffer</text><text x="220" y="${H - 10}" text-anchor="middle">kein Treffer</text><line class="ref" x1="60" x2="290" y1="71" y2="71"/><text x="290" y="64" text-anchor="end" class="strong">erwartet bei p₀</text>`,
  chi: () => `<rect x="40" y="20" width="110" height="60" class="i"/><rect x="40" y="80" width="110" height="60" class="k" fill-opacity=".5"/><rect x="170" y="20" width="110" height="34" class="i"/><rect x="170" y="54" width="110" height="86" class="k" fill-opacity=".5"/><text x="95" y="158" text-anchor="middle">Programm</text><text x="225" y="158" text-anchor="middle">Standard</text><text x="95" y="54" text-anchor="middle" fill="#fff">ja</text><text x="225" y="42" text-anchor="middle" fill="#fff">ja</text><text x="95" y="114" text-anchor="middle">nein</text><text x="225" y="102" text-anchor="middle">nein</text>`,
  logit: () => { let s = ax("Einflussgröße x", "Wahrscheinlichkeit"); let d = ""; for (let x = 50; x <= 300; x += 5) { const p = 1 / (1 + Math.exp(-(x - 175) / 28)); d += (d ? "L" : "M") + x + "," + (134 - p * 110).toFixed(1); } for (let i = 0; i < 26; i++) { const x = 50 + u(i, 19) * 250, p = 1 / (1 + Math.exp(-(x - 175) / 28)), y = u(i, 20) < p ? 1 : 0; s += dot(x, 134 - y * 110 + (u(i, 21) - .5) * 8, y ? "i" : "k", 3.4); } return s + `<path d="${d}" fill="none" class="m"/>`; },
  glmm: () => { let s = ax("Zeit", "Wahrscheinlichkeit"); for (let i = 0; i < 7; i++) { const c = 140 + z(i, 22) * 40; let d = ""; for (let x = 50; x <= 300; x += 6) { const p = 1 / (1 + Math.exp(-(x - c) / 30)); d += (d ? "L" : "M") + x + "," + (134 - p * 110).toFixed(1); } s += `<path d="${d}" fill="none" class="${i % 2 ? "il" : "kl"}" stroke-width="1.5" stroke-opacity=".7"/>`; } return s; }
};
const fig = (k, cap) => `<figure><svg class="schema" viewBox="0 0 ${W} ${H}" role="img" aria-label="${cap}">${FIG[k]()}</svg><figcaption>${cap}</figcaption></figure>`;

/* ---------- Ergebnisse des Entscheidungswegs ---------- */
const L = (h, t) => `<a href="${R}${h}">${t} →</a>`;
const RES = {
  t1: { name: "Einstichproben-t-Test", fig: ["t1", "Eine Stichprobe, ein fester Vergleichswert μ₀"],
    why: "Eine Gruppe, eine Messung pro Person, verglichen mit einem bekannten Wert, etwa einem publizierten Normwert. Der Test fragt, ob der Mittelwert der Population von μ₀ abweicht.",
    rep: "Mittelwert und Differenz zu μ₀ mit 95-%-KI, t, Freiheitsgrade, p", spss: "Analysieren → Mittelwerte vergleichen → T-Test bei einer Stichprobe", r: "t.test(d$gehgeschw, mu = 1.2)",
    links: [["testen/t-test/", "Die t-Test-Kaskade"], ["testen/t-test-varianten/", "Welcher t-Test?"]] },
  t2: { name: "Ungepaarter t-Test", fig: ["t2", "Zwei unabhängige Gruppen, je eine Messung"],
    why: "Zwei Gruppen verschiedener Personen, eine metrische Zielgröße, kein Ausgangswert und keine weiteren Einflussgrößen. Mit Welch-Korrektur, wenn die Streuungen verschieden sind.",
    rep: "Mittelwertdifferenz mit 95-%-KI, t, Freiheitsgrade, p; dazu Cohen's d oder der Vergleich mit der MCID", spss: "Analysieren → Mittelwerte vergleichen → T-Test bei unabhängigen Stichproben", r: "t.test(schmerz ~ gruppe, data = d)",
    links: [["testen/t-test-varianten/#acc-2", "Ungepaarter t-Test: Parkinson"], ["grundlagen/effektgroessen/", "Effektgrößen"]] },
  reg: { name: "Korrelation und einfache lineare Regression", fig: ["reg", "Zwei metrische Größen, eine Gerade"],
    why: "Zwei metrische Größen pro Person. Die Korrelation r beschreibt die Stärke des Zusammenhangs, die Regression die Steigung in der Einheit der Zielgröße: um wie viel ändert sich y pro Einheit x.",
    rep: "Steigung b mit 95-%-KI und p, dazu R²; bei der Korrelation r mit 95-%-KI", spss: "Analysieren → Regression → Linear (für r: Analysieren → Korrelation → Bivariat)", r: "lm(gehgeschw ~ kraft, data = d)",
    links: [["regression/korrelation/", "Zusammenhang und Korrelation"], ["regression/gerade/", "Die beste Gerade"]] },
  mreg: { name: "Multiple lineare Regression", fig: ["mreg", "Adjustierter Effekt: Abstand zweier paralleler Geraden"],
    why: "Ein Effekt soll für andere Größen adjustiert werden, etwa für Alter oder einen Confounder, oder mehrere Einflüsse werden zugleich geschätzt. Ein Gruppenvergleich ist dabei nur eine Regression mit einer Dummy-Variable.",
    rep: "Adjustierter Koeffizient der interessierenden Größe mit 95-%-KI und p; die Liste der Adjustierungsvariablen", spss: "Analysieren → Regression → Linear, alle Einflussgrößen unter „Unabhängige Variablen“", r: "lm(gehgeschw ~ kraft + alter, data = d)",
    links: [["regression/multiple-regression/", "Multiple Regression"], ["regression/drittvariablen/", "Drittvariablen"]] },
  tp: { name: "Gepaarter t-Test", fig: ["tp", "Dieselben Personen vorher und nachher"],
    why: "Dieselben Personen zweimal gemessen, oder zwei Seiten derselben Person. Getestet wird die mittlere Differenz. Ohne Kontrollgruppe zeigt das Ergebnis eine Veränderung, aber nicht, ob die Behandlung sie verursacht hat.",
    rep: "Mittlere Differenz mit 95-%-KI, t, Freiheitsgrade, p", spss: "Analysieren → Mittelwerte vergleichen → T-Test bei verbundenen Stichproben", r: "t.test(d$nach, d$vor, paired = TRUE)",
    links: [["testen/t-test-varianten/#acc-1", "Gepaarter t-Test: Bizeps"], ["hintergrund/regression-mitte/", "Regression zur Mitte"]],
    warn: "Ohne Kontrollgruppe kann die Veränderung auch Spontanverlauf oder Regression zur Mitte sein." },
  ancova: { name: "ANCOVA: Endwert mit Ausgangswert als Kovariate", fig: ["ancova", "Endwert gegen Ausgangswert, eine Gerade je Gruppe"],
    why: "Zwei Gruppen, jeweils vorher und nachher gemessen, kaum fehlende Werte. Die Regression des Endwerts auf Gruppe und Ausgangswert gleicht zufällige Unterschiede zu Beginn aus und hat mehr Power als der Vergleich der Endwerte oder der Differenzen.",
    rep: "Adjustierte Mittelwertdifferenz der Gruppen mit 95-%-KI und p", spss: "Analysieren → Regression → Linear: Endwert abhängig, Gruppe und Ausgangswert unabhängig", r: "lm(schmerz_nach ~ gruppe + schmerz_vor, data = d)",
    links: [["regression/multiple-regression/", "Multiple Regression"], ["testen/t-test-varianten/#acc-3", "Übung: Vorher-nachher mit Kontrolle"]],
    warn: "Fehlen Endwerte, fällt die Person ganz heraus. Dann ist das gemischte Modell die bessere Wahl." },
  ri: { name: "Gemischtes Modell mit Random Intercept", fig: ["ri", "Verläufe je Person, einzelne Messungen fehlen"],
    why: "Mehrere Messzeitpunkte pro Person, zwei oder mehr Gruppen, oft fehlende Werte. Gruppe, Zeit und ihre Wechselwirkung sind feste Effekte, der Achsenabschnitt pro Person ist zufällig. Alle vorhandenen Messungen gehen ein.",
    rep: "Wechselwirkung Gruppe × Zeitpunkt mit 95-%-KI und p; Streuung zwischen Personen und Residualstreuung oder ICC", spss: "Analysieren → Gemischte Modelle → Linear; Subjekt id, Faktoren gruppe und zeit; unter „Fest“ gruppe, zeit und gruppe*zeit, unter „Zufällig“ der konstante Term", r: "lme4::lmer(schmerz ~ gruppe * zeit + (1 | id), data = d)",
    links: [["gemischte-modelle/warum/", "Warum gemischte Modelle?"], ["gemischte-modelle/hueftarthroskopie/", "Reha nach Hüftarthroskopie"]] },
  rs: { name: "Gemischtes Modell mit Random Slope", fig: ["rs", "Eigene Steigung je Person"],
    why: "Viele Messzeitpunkte, Zeit als metrische Größe, und die Personen verändern sich unterschiedlich schnell. Ohne zufällige Steigung sind die Standardfehler für den Zeiteffekt und die Wechselwirkung zu klein.",
    rep: "Steigung pro Zeiteinheit je Gruppe und deren Differenz (Gruppe × Zeit) mit 95-%-KI; Streuung der Steigungen", spss: "Analysieren → Gemischte Modelle → Linear; Subjekt id, Kovariate woche; unter „Zufällig“ der konstante Term und woche, Kovarianztyp „Unstrukturiert“", r: "lme4::lmer(schmerz ~ gruppe * woche + (woche | id), data = d)",
    links: [["gemischte-modelle/random-slopes/", "Jeder Verlauf ist anders"]] },
  cl: { name: "Gemischtes Modell mit Random Intercept je Cluster", fig: ["cl", "Patientinnen geschachtelt in Praxen"],
    why: "Personen gehören zu Gruppen, die sich ähneln: Praxen, Teams, Stationen. Oft werden ganze Praxen randomisiert. Der Zufallseffekt pro Praxis berücksichtigt die Ähnlichkeit; entscheidend für die Power ist die Zahl der Praxen.",
    rep: "Behandlungseffekt mit 95-%-KI und p; ICC und Zahl der Cluster", spss: "Analysieren → Gemischte Modelle → Linear; Subjekt praxis; unter „Zufällig“ der konstante Term", r: "lme4::lmer(schmerz ~ gruppe + (1 | praxis), data = d)",
    links: [["gemischte-modelle/abhaengige-daten/", "Abhängige Daten"]],
    warn: "Ein t-Test über alle Patientinnen ignoriert die Praxen und wird viel zu oft signifikant." },
  binom: { name: "Binomialtest", fig: ["binom", "Ein Anteil gegen einen festen Wert"],
    why: "Ein Ergebnis mit zwei Ausprägungen, eine Gruppe, ein fester Vergleichsanteil, etwa 50 % bei reinem Raten. Bei großen Stichproben nähert der z-Test das Ergebnis an.",
    rep: "Beobachteter Anteil mit 95-%-KI, p", spss: "Analysieren → Nicht parametrische Tests → Alte Dialogfelder → Binomial", r: "binom.test(14, 20, p = 0.5)",
    links: [["testen/binomialtest/", "Binomialtest"], ["testen/z-test/", "Der z-Test"]] },
  chi: { name: "Vierfeldertafel: Chi-Quadrat-Test mit RD, RR und OR", fig: ["chi", "Zwei Gruppen, Ereignis ja oder nein"],
    why: "Zwei Gruppen und ein Ergebnis ja oder nein, keine weiteren Einflussgrößen. Der Chi-Quadrat-Test prüft, ob die Anteile sich unterscheiden; die Effektgröße ist die Risikodifferenz, das Risikoverhältnis oder das Odds Ratio.",
    rep: "Anteile je Gruppe, RD mit 95-%-KI (daraus NNT), RR oder OR mit 95-%-KI, p", spss: "Analysieren → Deskriptive Statistiken → Kreuztabellen; unter „Statistiken“ Chi-Quadrat und Risiko", r: "chisq.test(table(d$gruppe, d$rueckkehr))",
    links: [["testen/chi-quadrat/", "Chi-Quadrat-Test"], ["grundlagen/risiko-odds/#acc-2", "Die Vierfeldertafel"]],
    warn: "In einer Fall-Kontroll-Studie ist nur das Odds Ratio sinnvoll, nicht das Risikoverhältnis." },
  logit: { name: "Logistische Regression", fig: ["logit", "Ereignis ja oder nein, metrische Einflussgröße"],
    why: "Ein Ergebnis ja oder nein, und eine metrische Einflussgröße oder mehrere Einflüsse, für die adjustiert werden soll. Das Modell schätzt die Odds auf der Logit-Skala; auf der Wahrscheinlichkeitsskala helfen Marginal Effects.",
    rep: "Odds Ratio pro sinnvoller Einheit mit 95-%-KI und p; Zahl der Ereignisse; bei Bedarf AME in Prozentpunkten", spss: "Analysieren → Regression → Binär logistisch; unter „Optionen“ KI für Exp(B)", r: "glm(knorpeldefekt ~ alpha + schmerz, family = binomial, data = d)",
    links: [["logistische-regression/s-kurve/", "Von der Geraden zur S-Kurve"], ["logistische-regression/cam-morphologie/", "Cam-Morphologie"]] },
  glmm: { name: "Gemischtes logistisches Modell (Ausblick)", fig: ["glmm", "Wiederholte Ja-Nein-Messungen je Person"],
    why: "Ein Ergebnis ja oder nein, wiederholt gemessen oder in Clustern. Die logistische Regression bekommt wie das lineare Modell einen Zufallseffekt pro Person oder Praxis. Bei nur zwei Zeitpunkten und einer Gruppe reicht der McNemar-Test.",
    rep: "Odds Ratio der Wechselwirkung Gruppe × Zeit mit 95-%-KI; Varianz des Zufallseffekts", spss: "Analysieren → Gemischte Modelle → Verallgemeinert linear; Verteilung binomial, Verknüpfung Logit", r: "lme4::glmer(schmerzfrei ~ gruppe * zeit + (1 | id), family = binomial, data = d)",
    links: [["logistische-regression/s-kurve/", "Logistische Regression"], ["gemischte-modelle/abhaengige-daten/", "Abhängige Daten"]],
    warn: "Im Stats Lab gibt es dazu noch keine eigene Station. Die Logik ist dieselbe wie im linearen gemischten Modell." }
};

/* ---------- Entscheidungsbaum ---------- */
const TREE = {
  start: { q: "Was wird gemessen? Die Zielgröße", o: [
    ["metrisch", "Schmerz auf der NRS, Bewegungsumfang in Grad, Kraft, Gehgeschwindigkeit", "met"],
    ["binär", "ja oder nein: Knorpeldefekt, Rückkehr in den Sport, Rezidiv", "bin"]] },
  met: { q: "Wie hängen die Messungen zusammen?", o: [
    ["unabhängig", "jede Person einmal gemessen, keine Gruppierung", "met-u"],
    ["Messwiederholung", "dieselben Personen mehrfach gemessen, oder beide Seiten einer Person", "met-w"],
    ["Cluster", "Personen in Praxen, Teams oder Stationen; oft ganze Gruppen randomisiert", "=cl"]] },
  "met-u": { q: "Was wird verglichen?", o: [
    ["mit einem festen Wert", "eine Stichprobe gegen Normwert oder Sollwert", "=t1"],
    ["zwei Gruppen", "Intervention gegen Kontrolle, ohne weitere Einflüsse", "=t2"],
    ["Zusammenhang mit einer metrischen Größe", "etwa Quadrizepskraft und Gehgeschwindigkeit", "=reg"],
    ["mehrere Einflüsse zugleich", "ein Effekt, adjustiert für Alter oder Confounder", "=mreg"]] },
  "met-w": { q: "Wie viele Gruppen und Zeitpunkte?", o: [
    ["eine Gruppe, zwei Messungen", "vorher und nachher ohne Kontrolle, oder zwei Seiten", "=tp"],
    ["zwei Gruppen, vorher und nachher", "RCT mit Ausgangs- und Endmessung, kaum fehlende Werte", "=ancova"],
    ["drei oder mehr Zeitpunkte oder fehlende Werte", "RCT mit Verlaufsmessungen und Drop-outs", "=ri"],
    ["viele Zeitpunkte, unterschiedliche Verläufe", "Zeit metrisch, jede Person verändert sich anders schnell", "=rs"]] },
  bin: { q: "Wie hängen die Messungen zusammen?", o: [
    ["unabhängig", "jede Person einmal gemessen, keine Gruppierung", "bin-u"],
    ["Messwiederholung oder Cluster", "dieselben Personen mehrfach, oder Personen in Praxen", "=glmm"]] },
  "bin-u": { q: "Was wird verglichen?", o: [
    ["Anteil gegen einen festen Wert", "Trefferquote eines Palpationstests gegen Raten", "=binom"],
    ["zwei Gruppen", "Rückkehr in den Sport mit und ohne Programm", "=chi"],
    ["metrische Einflussgröße oder Adjustierung", "Knorpeldefekt und Alpha-Winkel, adjustiert für Schmerz", "=logit"]] }
};
const SHORT = { start: "Zielgröße", met: "Datenstruktur", bin: "Datenstruktur", "met-u": "Vergleich", "met-w": "Gruppen und Zeitpunkte", "bin-u": "Vergleich" };
let path = []; // gewählte Indizes
function walk() { // Knoten entlang des Pfads
  const nodes = ["start"]; let res = null;
  for (const k of path) { const nx = TREE[nodes[nodes.length - 1]].o[k][2]; if (nx[0] === "=") { res = nx.slice(1); break; } nodes.push(nx); }
  return { nodes, res };
}
function renderTree() {
  const { nodes, res } = walk();
  $("tree").innerHTML = nodes.map((n, i) => {
    const t = TREE[n], sel = path[i];
    return `<div class="tstep${sel !== undefined ? " done" : ""}"><div class="tno">${i + 1}</div><div><p class="tq">${t.q}</p><div class="topts" data-l="${i}">${t.o.map((o, k) => `<button type="button" data-k="${k}" aria-pressed="${sel === k}">${o[0]}<small>${o[1]}</small></button>`).join("")}</div></div></div>`;
  }).join("");
  if (!res) { $("res").innerHTML = ""; return; }
  const r = RES[res], trail = nodes.map((n, i) => `<span>${SHORT[n]}: ${TREE[n].o[path[i]][0]}</span>`).join("");
  $("res").innerHTML = `<div class="res" aria-live="polite"><div class="rmain"><span class="rlab">Passendes Verfahren</span><h3>${r.name}</h3><div class="trail">${trail}</div><p>${r.why}</p>
    <dl><dt>Berichten</dt><dd>${r.rep}</dd><dt>SPSS</dt><dd>${r.spss}</dd><dt>R</dt><dd><code>${r.r}</code></dd></dl>
    ${r.warn ? `<p class="warn">${r.warn}</p>` : ""}<div class="rlinks">${r.links.map(([h, t]) => L(h, t)).join("")}</div></div>${fig(r.fig[0], r.fig[1])}</div>`;
}
$("tree").addEventListener("click", e => {
  const b = e.target.closest(".topts button"); if (!b) return;
  const l = +b.closest(".topts").dataset.l, k = +b.dataset.k;
  path = path.slice(0, l); path[l] = k; renderTree();
});
// Startwert: metrisch, Messwiederholung, drei Zeitpunkte (wie im Hüftarthroskopie-RCT)
path = [0, 1, 2]; renderTree();

/* ---------- Fallbeispiele ---------- */
const CASES = [
  { t: "Zwölf Physiotherapiepraxen werden per Los einem neuen Übungsprogramm bei Nackenschmerz oder der Standardbehandlung zugeteilt. In jeder Praxis werden 15 Patientinnen eingeschlossen. Zielgröße ist der Schmerz auf der NRS nach 8 Wochen.",
    o: ["Gemischtes Modell mit Random Intercept je Praxis", "Ungepaarter t-Test mit 180 Patientinnen", "Gepaarter t-Test", "Chi-Quadrat-Test"],
    why: "Randomisiert wurden Praxen, nicht Personen. Patientinnen derselben Praxis ähneln sich, ein t-Test über alle 180 tut so, als gäbe es 180 unabhängige Informationen, und wird zu oft signifikant. Der Zufallseffekt je Praxis berücksichtigt die Ähnlichkeit.", l: ["gemischte-modelle/abhaengige-daten/", "Abhängige Daten"] },
  { t: "Bei 20 Personen nach distaler Radiusfraktur wird die Griffkraft vor und nach sechs Wochen Handtherapie gemessen. Eine Kontrollgruppe gibt es nicht.",
    o: ["Gepaarter t-Test", "Ungepaarter t-Test vorher gegen nachher", "Einstichproben-t-Test gegen 0 mit den Werten nach der Therapie", "Logistische Regression"],
    why: "Dieselben Personen zweimal gemessen: Getestet wird die mittlere Differenz. Ein ungepaarter Test würde vorher und nachher wie zwei fremde Gruppen behandeln und die Paarung verschenken. Ohne Kontrolle bleibt offen, ob die Therapie oder die Heilung die Kraft verbessert hat.", l: ["testen/t-test-varianten/#acc-1", "Gepaarter t-Test"] },
  { t: "In einem RCT mit 80 Personen nach Kreuzbandplastik wird die Kniestreckung vor und 12 Wochen nach Beginn eines neuen Krafttrainings gemessen, Kontrolle ist die Standardreha. Alle Personen werden zweimal gemessen.",
    o: ["Regression des Endwerts auf Gruppe und Ausgangswert (ANCOVA)", "Je ein gepaarter t-Test pro Gruppe, dann p-Werte vergleichen", "Chi-Quadrat-Test", "Einstichproben-t-Test"],
    why: "Zwei Gruppen, vorher und nachher, keine fehlenden Werte: Die ANCOVA vergleicht die Endwerte bei gleichem Ausgangswert. Zwei getrennte gepaarte Tests vergleichen die Gruppen gar nicht; ein Unterschied in der Signifikanz ist kein signifikanter Unterschied.", l: ["testen/t-test-varianten/#acc-3", "Übung: Vorher-nachher mit Kontrolle"] },
  { t: "Ein RCT zur Reha nach Hüftarthroskopie misst den Schmerz vor der OP sowie 4 und 14 Wochen danach. Zwei Personen fehlen beim letzten Termin, eine beim mittleren.",
    o: ["Gemischtes Modell mit Gruppe × Zeitpunkt und Random Intercept je Person", "Ungepaarter t-Test der Werte in Woche 14", "Ungepaarter t-Test mit allen 270 Messungen", "ANCOVA mit vollständigen Fällen"],
    why: "Drei Zeitpunkte und fehlende Werte: Das gemischte Modell nutzt alle vorhandenen Messungen, berücksichtigt, dass sie von denselben Personen stammen, und beantwortet die RCT-Frage über die Wechselwirkung Gruppe × Zeitpunkt.", l: ["gemischte-modelle/hueftarthroskopie/", "Reha nach Hüftarthroskopie"] },
  { t: "Nach vorderer Schulterluxation erhalten 120 Sportlerinnen per Zufall ein Stabilisationsprogramm oder Standardversorgung. Zielgröße ist, ob sie nach sechs Monaten in den Wettkampf zurückgekehrt sind.",
    o: ["Vierfeldertafel mit Chi-Quadrat-Test, RD und RR", "Ungepaarter t-Test", "Gemischtes Modell", "Korrelation"],
    why: "Zwei randomisierte Gruppen, Ergebnis ja oder nein, keine Adjustierung nötig: Die Vierfeldertafel liefert die Anteile, der Chi-Quadrat-Test den p-Wert. Klinisch berichtet werden Risikodifferenz (daraus die NNT) und Risikoverhältnis.", l: ["grundlagen/risiko-odds/#acc-2", "Die Vierfeldertafel"] },
  { t: "Bei 240 Fußballspielern wird der Alpha-Winkel im MRT gemessen und festgestellt, ob ein Knorpeldefekt der Hüfte vorliegt. Gefragt ist, ob größere Winkel mit Defekten zusammenhängen, adjustiert für Hüftschmerz.",
    o: ["Logistische Regression", "Multiple lineare Regression mit dem Alpha-Winkel als Zielgröße", "Chi-Quadrat-Test mit Cam ja oder nein", "Gepaarter t-Test"],
    why: "Zielgröße ja oder nein, metrische Einflussgröße und eine Adjustierung: logistische Regression. Den Winkel in „Cam ja oder nein“ zu teilen wirft Information weg. Berichtet wird das Odds Ratio pro 10 Grad.", l: ["logistische-regression/cam-morphologie/", "Cam-Morphologie"] },
  { t: "60 Läuferinnen mit Achillessehnenbeschwerden und 120 ohne Beschwerden werden gefragt, ob sie im Jahr davor mehr als 50 km pro Woche gelaufen sind.",
    o: ["Vierfeldertafel mit Odds Ratio", "Vierfeldertafel mit Risikoverhältnis", "Ungepaarter t-Test", "Binomialtest"],
    why: "Ausgewählt wurde nach dem Outcome: eine Fall-Kontroll-Studie. Wie viele Beschwerden haben, hat die Studie selbst festgelegt; ein Risiko lässt sich daraus nicht berechnen. Das Odds Ratio dagegen bleibt gültig.", l: ["studiendesign/fall-kontrolle/", "Die Fall-Kontroll-Studie"] },
  { t: "Bei 30 Personen nach einseitiger Knie-TEP wird die Quadrizepskraft auf beiden Seiten gemessen, um das operierte mit dem nicht operierten Bein zu vergleichen.",
    o: ["Gepaarter t-Test", "Ungepaarter t-Test mit 60 Beinen", "Chi-Quadrat-Test", "Multiple Regression mit 60 Beinen"],
    why: "Beide Beine gehören zu derselben Person. Kraft, Alter und Training wirken auf beide Seiten, die Messungen sind gepaart. 60 Beine als unabhängige Beobachtungen zu zählen, verdoppelt scheinbar die Fallzahl.", l: ["testen/t-test-varianten/", "Welcher t-Test?"] }
];
function order(n, seed) { const o = Array.from({ length: n }, (_, i) => i); let x = seed * 9301 + 49297; for (let i = n - 1; i > 0; i--) { x = (x * 9301 + 49297) % 233280; const j = Math.floor(x / 233280 * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; }
const answered = {};
$("cases").innerHTML = CASES.map((c, i) => { c.ord = order(c.o.length, i * 17 + 5); return `<div class="case" data-i="${i}"><span class="cno">Fall ${i + 1} von ${CASES.length}</span><p>${c.t}</p><div class="opts">${c.ord.map((k, j) => `<button type="button" data-j="${j}">${c.o[k]}</button>`).join("")}</div><p class="fb" hidden></p></div>`; }).join("");
const score = () => { const n = Object.keys(answered).length, r = Object.values(answered).filter(Boolean).length; $("score").textContent = n ? `${r} von ${n} beim ersten Versuch richtig zugeordnet, ${CASES.length - n} offen` : `${CASES.length} Fälle offen`; };
$("cases").addEventListener("click", e => {
  const b = e.target.closest(".opts button"); if (!b) return;
  const box = b.closest(".case"), i = +box.dataset.i, c = CASES[i], k = c.ord[+b.dataset.j], ok = k === 0;
  if (!(i in answered)) answered[i] = ok;
  box.querySelectorAll(".opts button").forEach(x => x.classList.remove("right", "wrong"));
  b.classList.add(ok ? "right" : "wrong");
  if (!ok) box.querySelector(`button[data-j="${c.ord.indexOf(0)}"]`).classList.add("right");
  const fb = box.querySelector(".fb"); fb.hidden = false;
  fb.innerHTML = `<b>${ok ? "Richtig." : "Nicht ganz."}</b> Passend ist: ${c.o[0]}. ${c.why} ${L(c.l[0], c.l[1])}`;
  score();
});
score();

/* ---------- Übersicht ---------- */
const OV = [
  ["metrisch", "unabhängig, eine Gruppe", "Einstichproben-t-Test", "Mittelwert, Differenz zu μ₀", "testen/t-test/"],
  ["metrisch", "unabhängig, zwei Gruppen", "Ungepaarter t-Test", "Mittelwertdifferenz", "testen/t-test-varianten/#acc-2"],
  ["metrisch", "unabhängig, metrischer Einfluss", "Korrelation, einfache Regression", "r, Steigung b", "regression/gerade/"],
  ["metrisch", "unabhängig, mehrere Einflüsse", "Multiple Regression", "adjustierter Koeffizient", "regression/multiple-regression/"],
  ["metrisch", "gepaart, zwei Messungen", "Gepaarter t-Test", "mittlere Differenz", "testen/t-test-varianten/#acc-1"],
  ["metrisch", "zwei Gruppen, vorher und nachher", "ANCOVA (Regression mit Ausgangswert)", "adjustierte Differenz", "regression/multiple-regression/"],
  ["metrisch", "Messwiederholung, drei und mehr Zeitpunkte", "Gemischtes Modell, Random Intercept", "Gruppe × Zeit", "gemischte-modelle/hueftarthroskopie/"],
  ["metrisch", "Messwiederholung, Verläufe unterschiedlich", "Gemischtes Modell, Random Slope", "Steigungsdifferenz", "gemischte-modelle/random-slopes/"],
  ["metrisch", "Cluster (Praxen, Teams)", "Gemischtes Modell, Random Intercept je Cluster", "Effekt, ICC", "gemischte-modelle/abhaengige-daten/"],
  ["binär", "unabhängig, eine Gruppe", "Binomialtest", "Anteil", "testen/binomialtest/"],
  ["binär", "unabhängig, zwei Gruppen", "Vierfeldertafel, Chi-Quadrat-Test", "RD, NNT, RR, OR", "testen/chi-quadrat/"],
  ["binär", "unabhängig, metrischer Einfluss oder Adjustierung", "Logistische Regression", "OR pro Einheit, AME", "logistische-regression/cam-morphologie/"],
  ["binär", "gepaart oder Cluster", "McNemar-Test, gemischtes logistisches Modell", "OR", ""],
  ["Zeit bis zum Ereignis", "unabhängig", "Kaplan-Meier, Cox-Regression", "Hazard Ratio", ""],
  ["ordinal mit wenigen Stufen", "unabhängig", "Mann-Whitney-U-Test, ordinale Regression", "Rangunterschied, OR", ""]
];
$("ov").innerHTML = `<thead><tr><th>Zielgröße</th><th>Datenstruktur und Vergleich</th><th>Verfahren</th><th>Berichtet wird</th></tr></thead><tbody>` +
  OV.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[4] ? `<a href="${R}${r[4]}">${r[2]}</a>` : `${r[2]} <span class="note">(Ausblick)</span>`}</td><td>${r[3]}</td></tr>`).join("") + `</tbody>`;
})();
