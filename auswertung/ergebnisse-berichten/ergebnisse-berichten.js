/* Stats Lab · Ergebnisse berichten: Bausteine, Output lesen, Checkliste */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const { fmt, fp, pick } = window.GM;
const { logit, tinv, tcdf } = window.REG;
const P = (p, d = 3) => p < 0.001 ? "p < 0,001" : "p = " + fmt(p, d);

/* ---------- Modelle aus den Stationsdaten ---------- */
// Cam-Morphologie: logistische Regression Knorpeldefekt ~ Alpha-Winkel + Schmerz
const CC = window.CAM.cols, CD = window.CAM.rows, col = n => CD.map(r => r[CC.indexOf(n)]);
const AL = col("alpha"), Y = col("knorpeldefekt"), SY = col("schmerz"), N = CD.length, EV = Y.reduce((a, v) => a + v, 0);
const M = logit(Y, [AL, SY]);
const p2 = (a, s) => 1 / (1 + Math.exp(-(M.b[0] + M.b[1] * a + M.b[2] * s)));
const AME10 = AL.reduce((t, a, i) => t + p2(a + 10, SY[i]) - p2(a, SY[i]), 0) / N;
const or10 = Math.exp(10 * M.b[1]), or10l = Math.exp(10 * (M.b[1] - 1.96 * M.se[1])), or10h = Math.exp(10 * (M.b[1] + 1.96 * M.se[1]));

// Hüftarthroskopie: gemischtes Modell Schmerz ~ Gruppe * Zeitpunkt + (1 | id), ohne fortgeschriebene Werte
const FC = window.FAI.cols, FR = window.FAI.rows.map(r => Object.fromEntries(FC.map((c, i) => [c, r[i]])));
const rows = FR.filter(r => r.schmerz_vas !== null && !r.fortgeschrieben);
const X = rows.map(r => { const iv = r.gruppe === "Intervention" ? 1 : 0; return [1, +(r.zeit_nr === 1), +(r.zeit_nr === 2), iv, iv * (r.zeit_nr === 1), iv * (r.zeit_nr === 2)]; });
const F = window.LMM.fit(rows.map(r => r.schmerz_vas), X, X.map(() => [1]), rows.map(r => r.id));
const NP = new Set(rows.map(r => r.id)).size, DF = NP - 2, TC = tinv(0.975, DF);
const tau2 = F.G[0][0], s2 = F.s2, ICC = tau2 / (tau2 + s2);
const lci = i => [F.beta[i] - TC * F.se[i], F.beta[i] + TC * F.se[i]], lp = i => 2 * (1 - tcdf(Math.abs(F.beta[i] / F.se[i]), DF));
const [h5l, h5h] = lci(5);

/* ---------- 1 Bausteine ---------- */
const BB = ["Vergleich", "Effekt mit Richtung und Einheit", "95-%-Konfidenzintervall", "p-Wert", "Verfahren und Daten", "Klinische Einordnung"];
const MISS = [
  "Ohne den Vergleich bleibt offen, wer gegen wen und zu welchem Zeitpunkt verglichen wurde.",
  "Ohne den Effekt in der Einheit der Zielgröße weiß niemand, wie groß der Unterschied ist. Der p-Wert sagt das nicht.",
  "Ohne Konfidenzintervall fehlt die Unsicherheit: Welche Effekte sind mit den Daten noch vereinbar?",
  "Ohne p-Wert fehlt die Testentscheidung. Er ist aber der verzichtbarste Baustein, denn das Konfidenzintervall enthält sie meist schon.",
  "Ohne Verfahren und Fallzahl lässt sich das Ergebnis weder prüfen noch nachrechnen.",
  "Ohne Einordnung bleibt die Frage nach der klinischen Bedeutung bei den Lesenden hängen."
];
const EX = {
  mp: { parts: ["Im Vergleich zum Kontrollarm", "nahm der Oberarmumfang am Trainingsarm direkt nach dem Training im Mittel um 0,50 cm stärker zu", "95-%-KI −0,17 bis 1,17 cm", "p = 0,12", "gepaarter t-Test der Differenzen, n = 10 Personen", "Das Intervall reicht von keinem Unterschied bis zu gut einem Zentimeter; für eine Aussage ist die Stichprobe zu klein."],
    est: 0.5, lo: -0.165, hi: 1.165, null: 0, x: [-1, 2], unit: "Differenz der Zunahme in cm", log: false,
    note: "Das Intervall schließt die Null ein, das Ergebnis ist nicht signifikant. Es heißt aber nicht, dass es keinen Effekt gibt: Auch ein Zuwachs von gut 1 cm ist mit den Daten vereinbar. Mehr dazu im <a href=\"../../testen/t-test-varianten/#praktikum\">Messpraktikum</a>." },
  cam: { parts: ["Pro 10 Grad größerem Alpha-Winkel", `waren die Odds eines Knorpeldefekts um den Faktor ${fmt(or10, 2)} höher`, `95-%-KI ${fmt(or10l, 2)} bis ${fmt(or10h, 2)}`, `${P(M.p[1])}`, `logistische Regression, adjustiert für Hüftschmerz, ${EV} Knorpeldefekte bei ${N} Spielern`, `Gemittelt über die Stichprobe entspricht das einer um ${fmt(AME10 * 100, 1)} Prozentpunkte höheren Wahrscheinlichkeit pro 10 Grad; weil symptomatische Spieler überrepräsentiert sind, gilt dieser Wert nur für vergleichbare Gruppen.`],
    est: or10, lo: or10l, hi: or10h, null: 1, x: [0.8, 2], unit: "OR pro 10 Grad, log. Achse", log: true,
    note: "Beim Odds Ratio liegt „kein Unterschied“ bei 1, nicht bei 0. Weil Odds Ratios multiplikativ sind, steht die Achse auf logarithmischer Skala; ein OR von 0,5 ist dann genauso weit von 1 entfernt wie eines von 2. Die Prozentpunkte stammen aus dem <a href=\"../../logistische-regression/cam-morphologie/#acc-4\">Average Marginal Effect</a>." },
  hip: { parts: ["Von vor der OP bis Woche 14", `sank der Schmerz in der Reha-Gruppe um ${fmt(-F.beta[5], 2)} Punkte (VAS 0 bis 10) stärker als in der Kontrollgruppe`, `95-%-KI ${fmt(-h5h, 2)} bis ${fmt(-h5l, 2)} Punkte`, `${P(lp(5))}`, `lineares gemischtes Modell mit Gruppe × Messzeitpunkt und zufälligem Achsenabschnitt je Person, ${rows.length} Messungen von ${NP} Personen`, "Auch die untere Grenze liegt bei rund drei Punkten auf einer Zehn-Punkte-Skala; ob das klinisch relevant ist, entscheidet der Vergleich mit einer publizierten MCID für diese Patientengruppe."],
    est: F.beta[5], lo: h5l, hi: h5h, null: 0, x: [-5, 1], unit: "Gruppe × Woche 14, VAS-Punkte", log: false,
    note: "Im Satz steht die Abnahme als positive Zahl, im Modell ist der Koeffizient negativ, weil weniger Schmerz einen kleineren Wert bedeutet. Beide Schreibweisen sind richtig, solange die Richtung im Text eindeutig ist. Woher die Zahl kommt, zeigt Abschnitt 3." }
};
let ex = "cam"; const on = BB.map(() => true);
$("bb").innerHTML = BB.map((b, i) => `<label><input type="checkbox" data-i="${i}" checked><sup class="bn">${i + 1}</sup>${b}</label>`).join("");
function drawCI(e) {
  const W = Math.max(380, Math.min(900, Math.round($("ci").getBoundingClientRect().width) || 900)), H = 150, L = 24, Rr = 24, tr = e.log ? Math.log : (v => v), [a, b] = e.x.map(tr);
  const sx = v => L + (tr(v) - a) / (b - a) * (W - L - Rr), y = 62;
  const tk = e.log ? [0.8, 1, 1.25, 1.5, 2] : window.GM.ticks(e.x[0], e.x[1], 6);
  let s = tk.map(v => `<line x1="${sx(v)}" x2="${sx(v)}" y1="20" y2="104" stroke="var(--grid)"/><text x="${sx(v)}" y="122" text-anchor="middle">${fmt(v, e.log ? 2 : (v % 1 ? 1 : 0))}</text>`).join("");
  s += `<line x1="${sx(e.null)}" x2="${sx(e.null)}" y1="14" y2="108" stroke="var(--fg)" stroke-width="1.6" stroke-dasharray="6 4"/><text x="${sx(e.null) + (sx(e.null) > W * 0.6 ? -6 : 6)}" y="24" class="strong" text-anchor="${sx(e.null) > W * 0.6 ? "end" : "start"}">kein Unterschied</text>`;
  s += `<line x1="${sx(e.lo)}" x2="${sx(e.hi)}" y1="${y}" y2="${y}" stroke="var(--therapie)" stroke-width="4" stroke-linecap="round"/><line x1="${sx(e.lo)}" x2="${sx(e.lo)}" y1="${y - 10}" y2="${y + 10}" stroke="var(--therapie)" stroke-width="3"/><line x1="${sx(e.hi)}" x2="${sx(e.hi)}" y1="${y - 10}" y2="${y + 10}" stroke="var(--therapie)" stroke-width="3"/><circle cx="${sx(e.est)}" cy="${y}" r="8" fill="var(--therapie)" stroke="var(--surface)" stroke-width="2"/>`;
  s += `<text x="${sx(e.est)}" y="${y - 16}" text-anchor="middle" class="strong">${fmt(e.est, 2)}</text><text x="${sx(e.lo)}" y="${y + 28}" text-anchor="middle">${fmt(e.lo, 2)}</text><text x="${sx(e.hi)}" y="${y + 28}" text-anchor="middle">${fmt(e.hi, 2)}</text>`;
  s += `<text x="${W - Rr}" y="${H - 6}" text-anchor="end">${e.unit}</text>`;
  $("ci").setAttribute("viewBox", `0 0 ${W} ${H}`); $("ci").innerHTML = s;
}
let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => drawCI(EX[ex]), 150); });
function draw1() {
  const e = EX[ex];
  const sp = i => on[i] ? `<span class="bb"><sup class="bn">${i + 1}</sup>${e.parts[i]}</span>` : "";
  const head = [0, 1].map(sp).filter(Boolean).join(" "), inner = [2, 3, 4].map(sp).filter(Boolean);
  $("sent").innerHTML = head + (inner.length ? ` (${inner.join("; ")})` : "") + "." + (on[5] ? " " + sp(5) : "");
  const m = on.map((v, i) => v ? "" : MISS[i]).filter(Boolean);
  $("miss").innerHTML = m.length ? m.join(" ") : "Alle sechs Bausteine sind enthalten. Nehmen Sie einzelne heraus, um zu sehen, was dann fehlt.";
  drawCI(e); $("cl1").innerHTML = e.note;
}
$("bb").addEventListener("change", e => { const c = e.target.closest("input"); if (!c) return; on[+c.dataset.i] = c.checked; draw1(); });
$("ex").addEventListener("click", e => { const b = pick(e, $("ex")); if (!b) return; ex = b.dataset.e; draw1(); });
draw1();

/* ---------- 2 Output logistische Regression ---------- */
const hot = (k, v) => `<td class="hot" data-k="${k}" tabindex="0">${v}</td>`;
const ciB = i => [Math.exp(M.b[i] - 1.96 * M.se[i]), Math.exp(M.b[i] + 1.96 * M.se[i])];
const X1 = {
  b: `B ist der Koeffizient auf der Logit-Skala: Pro Grad Alpha-Winkel steigen die logarithmierten Odds um ${fmt(M.b[1], 3)}. Diese Zahl gehört nicht in den Text, weil niemand Log-Odds anschaulich lesen kann.`,
  se: `Der Standardfehler von B. Aus ihm entstehen Wald-Statistik und Konfidenzintervall. Im Text taucht er nicht auf.`,
  wald: `Wald = (B ÷ SE)² = (${fmt(M.b[1], 3)} ÷ ${fmt(M.se[1], 3)})² = ${fmt(M.wald[1], 2)}. Die Prüfgröße zum p-Wert; berichtet wird meist nur p.`,
  sig: `„Sig.“ ist der p-Wert. SPSS schreibt ,000, wenn p unter 0,0005 liegt; im Text steht dann p < 0,001, nie p = 0,000. Hier: ${P(M.p[1])}.`,
  exp: `Exp(B) ist das Odds Ratio pro Grad: ${fmt(Math.exp(M.b[1]), 3)}. Pro Grad klingt das nach nichts. Pro 10 Grad ist es exp(10 · B) = ${fmt(or10, 2)}: Diese Zahl gehört in den Text.`,
  ci: `Das 95-%-KI für das OR pro Grad. Für 10 Grad werden die Grenzen hoch 10 genommen: ${fmt(ciB(1)[0], 3)}¹⁰ = ${fmt(or10l, 2)} und ${fmt(ciB(1)[1], 3)}¹⁰ = ${fmt(or10h, 2)}. Einfacher: in SPSS eine Variable alpha10 = alpha / 10 bilden.`,
  sy: `Die Adjustierungsvariable. Ihr OR (${fmt(Math.exp(M.b[2]), 2)}, ${P(M.p[2])}) wird berichtet, wenn sie inhaltlich interessiert, sonst genügt „adjustiert für Hüftschmerz“.`,
  k: `Die Konstante sind die Log-Odds bei Alpha-Winkel 0 Grad ohne Schmerz, ein Wert weit außerhalb der Daten. Sie wird nicht berichtet.`
};
const row1 = (lab, i, keys) => { const [l, h] = ciB(i); return `<tr${i === 1 ? ' class="tot"' : ""}><td>${lab}</td>${(keys ? hot("b", fmt(M.b[i], 3)) : `<td>${fmt(M.b[i], 3)}</td>`)}${keys ? hot("se", fmt(M.se[i], 3)) : `<td>${fmt(M.se[i], 3)}</td>`}${keys ? hot("wald", fmt(M.wald[i], 3)) : `<td>${fmt(M.wald[i], 3)}</td>`}<td>1</td>${keys ? hot("sig", M.p[i] < 0.0005 ? ",000" : fmt(M.p[i], 3).replace(/^0/, "")) : `<td>${M.p[i] < 0.0005 ? ",000" : fmt(M.p[i], 3).replace(/^0/, "")}</td>`}${keys ? hot("exp", fmt(Math.exp(M.b[i]), 3)) : `<td>${fmt(Math.exp(M.b[i]), 3)}</td>`}${keys ? hot("ci", fmt(l, 3)) + hot("ci", fmt(h, 3)) : `<td>${i ? fmt(l, 3) : ""}</td><td>${i ? fmt(h, 3) : ""}</td>`}</tr>`; };
$("o1").innerHTML = `<caption>Variablen in der Gleichung</caption><thead><tr><th></th><th>B</th><th>Standardfehler</th><th>Wald</th><th>df</th><th>Sig.</th><th>Exp(B)</th><th>95 % KI unterer Wert</th><th>oberer Wert</th></tr></thead><tbody>` +
  row1("alpha", 1, true) + row1("schmerz", 2, false).replace("<td>schmerz</td>", `<td class="hot" data-k="sy" tabindex="0">schmerz</td>`) + row1("Konstante", 0, false).replace("<td>Konstante</td>", `<td class="hot" data-k="k" tabindex="0">Konstante</td>`) + `</tbody>`;
$("m1").innerHTML = `Der Zusammenhang zwischen Alpha-Winkel und Knorpeldefekt wurde mit einer logistischen Regression geschätzt, adjustiert für Hüftschmerz (ja oder nein). Der Alpha-Winkel ging metrisch ein; berichtet wird das Odds Ratio pro 10 Grad mit 95-%-Konfidenzintervall. Mit ${EV} Ereignissen bei zwei Prädiktoren war die Faustregel von mindestens 10 Ereignissen pro Prädiktor erfüllt.`;
$("r1").innerHTML = `${N} Spieler wurden ausgewertet, ${EV} (${fmt(EV / N * 100, 0)} %) hatten einen Knorpeldefekt. Pro 10 Grad größerem Alpha-Winkel waren die Odds eines Defekts um den Faktor ${fmt(or10, 2)} höher (95-%-KI ${fmt(or10l, 2)} bis ${fmt(or10h, 2)}; ${P(M.p[1])}), adjustiert für Hüftschmerz.`;

/* ---------- 3 Output gemischtes Modell ---------- */
const PN = ["Konstanter Term", "[zeit = Woche 4]", "[zeit = Woche 14]", "[gruppe = Intervention]", "[gruppe = Intervention] * [zeit = Woche 4]", "[gruppe = Intervention] * [zeit = Woche 14]"];
const X2 = {
  b0: `Mittlerer Schmerz der Kontrollgruppe vor der OP: ${fmt(F.beta[0], 2)} Punkte. Die Referenz, von der aus alle anderen Koeffizienten zählen.`,
  b2: `Veränderung der Kontrollgruppe von vor der OP bis Woche 14: ${fmt(F.beta[2], 2)} Punkte. Auch ohne spezielle Reha sinkt der Schmerz; deshalb braucht ein RCT die Kontrollgruppe.`,
  b3: `Unterschied der Gruppen vor der OP: Die Reha-Gruppe lag ${fmt(F.beta[3], 2)} Punkte höher. Ein zufälliger Ausgangsunterschied, den das Modell über die Wechselwirkung ausgleicht.`,
  b5: `Die Antwort auf die Frage des RCT: Um ${fmt(-F.beta[5], 2)} Punkte sank der Schmerz in der Reha-Gruppe bis Woche 14 stärker als in der Kontrolle. Diese Zeile mit Schätzung, Konfidenzintervall und p-Wert gehört in den Ergebnissatz.`,
  se: `Der Standardfehler berücksichtigt, dass die drei Messungen einer Person zusammenhängen. Ein Modell, das alle ${rows.length} Messungen als unabhängig behandelt, hätte hier einen anderen, meist zu optimistischen Wert.`,
  df: `Freiheitsgrade für den t-Test der Koeffizienten. SPSS schätzt sie nach Satterthwaite; die Größenordnung richtet sich nach der Zahl der Personen, nicht der Messungen.`,
  sig: `p-Wert des Koeffizienten. Für die Wechselwirkung in Woche 14: ${P(lp(5))}.`,
  ci: `95-%-KI der Wechselwirkung: ${fmt(h5l, 2)} bis ${fmt(h5h, 2)} Punkte. Im Text als Abnahme: ${fmt(-h5h, 2)} bis ${fmt(-h5l, 2)} Punkte.`,
  res: `Residuum: Streuung der Messungen einer Person um ihren eigenen Verlauf, σ² = ${fmt(s2, 2)}.`,
  tau: `Varianz des zufälligen Achsenabschnitts: Wie stark sich die Personen in ihrem Schmerzniveau unterscheiden, τ² = ${fmt(tau2, 2)}, also eine Standardabweichung von ${fmt(Math.sqrt(tau2), 2)} Punkten. Daraus die ICC = τ² ÷ (τ² + σ²) = ${fmt(ICC, 2)}: ${fmt(ICC * 100, 0)} % der Streuung liegen zwischen den Personen.`
};
const hk = { 0: "b0", 2: "b2", 3: "b3", 5: "b5" };
$("o2").innerHTML = `<caption>Schätzungen fester Parameter</caption><thead><tr><th>Parameter</th><th>Schätzung</th><th>Standardfehler</th><th>df</th><th>t</th><th>Sig.</th><th>95 % KI Untergrenze</th><th>Obergrenze</th></tr></thead><tbody>` +
  F.beta.map((b, i) => { const [l, h] = lci(i), p = lp(i), sig = p < 0.0005 ? ",000" : fmt(p, 3).replace(/^0/, ""), w = i === 5;
    return `<tr${w ? ' class="tot"' : ""}><td>${PN[i]}</td>${hk[i] ? hot(hk[i], fmt(b, 3)) : `<td>${fmt(b, 3)}</td>`}${w ? hot("se", fmt(F.se[i], 3)) : `<td>${fmt(F.se[i], 3)}</td>`}${w ? hot("df", DF) : `<td>${DF}</td>`}<td>${fmt(b / F.se[i], 3)}</td>${w ? hot("sig", sig) : `<td>${sig}</td>`}${w ? hot("ci", fmt(l, 3)) + hot("ci", fmt(h, 3)) : `<td>${fmt(l, 3)}</td><td>${fmt(h, 3)}</td>`}</tr>`; }).join("") + `</tbody>`;
$("o3").innerHTML = `<caption>Schätzungen von Kovarianzparametern</caption><thead><tr><th>Parameter</th><th></th><th>Schätzung</th></tr></thead><tbody><tr><td>Residuum</td><td></td>${hot("res", fmt(s2, 3))}</tr><tr><td>Konstanter Term [Subjekt = id]</td><td>Varianz</td>${hot("tau", fmt(tau2, 3))}</tr></tbody>`;
$("m2").innerHTML = `Der Schmerz (VAS 0 bis 10) wurde mit einem linearen gemischten Modell ausgewertet: Gruppe, Messzeitpunkt (kategorial: vor OP, Woche 4, Woche 14) und deren Wechselwirkung als feste Effekte, ein zufälliger Achsenabschnitt je Person, Schätzung mit REML. Primärer Parameter war die Wechselwirkung Gruppe × Woche 14. Alle vorhandenen Messungen gingen ein; fehlende Werte wurden nicht ersetzt (Annahme: missing at random). Zwei Personen mit vermutlich fortgeschriebenen Werten wurden in einer Sensitivitätsanalyse ein- und ausgeschlossen.`;
$("r2").innerHTML = `Ausgewertet wurden ${rows.length} Messungen von ${NP} Personen. Von vor der OP bis Woche 14 sank der Schmerz in der Reha-Gruppe um ${fmt(-F.beta[5], 2)} Punkte stärker als in der Kontrollgruppe (95-%-KI ${fmt(-h5h, 2)} bis ${fmt(-h5l, 2)}; ${P(lp(5))}). Die Standardabweichung zwischen den Personen betrug ${fmt(Math.sqrt(tau2), 2)} Punkte, die Intraklassenkorrelation ${fmt(ICC, 2)}.`;

const bindOut = (ids, box, TXT) => ids.forEach(id => {
  const t = $(id);
  const act = c => { document.querySelectorAll(ids.map(x => "#" + x + " td.hot").join(",")).forEach(z => z.classList.toggle("sel", z === c)); $(box).innerHTML = TXT[c.dataset.k]; };
  t.addEventListener("click", e => { const c = e.target.closest("td.hot"); if (c) act(c); });
  t.addEventListener("keydown", e => { const c = e.target.closest("td.hot"); if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); act(c); } });
});
bindOut(["o1"], "o1x", X1); bindOut(["o2", "o3"], "o2x", X2);

/* ---------- 4 Checkliste ---------- */
const CK = [
  ["Methodenteil", [
    ["Design, Setting, Zeitraum, Ein- und Ausschlusskriterien", "Bei RCTs nach CONSORT, bei Beobachtungsstudien nach STROBE"],
    ["Primäre Zielgröße vorab festgelegt, mit Messinstrument und Messzeitpunkten", "Sekundäre Zielgrößen getrennt aufführen"],
    ["Fallzahlplanung: angenommener Effekt, Streuung, α und Power", "Bei Beobachtungsstudien: wie die Stichprobengröße zustande kam"],
    ["Statistisches Verfahren je Fragestellung, begründet über Zielgröße und Datenstruktur", "Siehe den Entscheidungsweg in der Station Verfahrenswahl"],
    ["Adjustierungsvariablen und warum sie vorab gewählt wurden", "Confounder begründen, nicht nach Signifikanz auswählen"],
    ["Umgang mit fehlenden Werten und Drop-outs", "Welche Annahme gilt, gab es eine Sensitivitätsanalyse?"],
    ["Signifikanzniveau, ein- oder zweiseitig, Korrektur bei mehreren Tests", ""],
    ["Software mit Version, bei R auch die Pakete", "etwa SPSS 29, R 4.4 mit lme4"]]],
  ["Ergebnisteil", [
    ["Flussdiagramm: eingeschlossen, zugeteilt, ausgewertet, mit Gründen für Ausfälle", "CONSORT-Flussdiagramm"],
    ["Tabelle 1 mit den Ausgangsmerkmalen je Gruppe, im RCT ohne p-Werte", "Unterschiede zu Beginn sind im RCT per Definition zufällig"],
    ["Deskriptive Werte je Gruppe und Zeitpunkt: Mittelwert, SD und n", ""],
    ["Primäre Zielgröße zuerst: Effekt in der Einheit der Zielgröße, 95-%-KI, p-Wert", "Die sechs Bausteine aus Abschnitt 1"],
    ["Exakte p-Werte mit zwei oder drei Stellen, unter 0,001 als p < 0,001", "nicht „p < 0,05“ und nie „p = 0,000“"],
    ["Modellspezifische Angaben: Ereignisse bei logistischer Regression, Varianzkomponenten oder ICC bei gemischten Modellen", ""],
    ["Sekundäre und explorative Analysen als solche gekennzeichnet", ""]]],
  ["Abbildungen und Diskussion", [
    ["Abbildung des Verlaufs: Mittelwerte mit 95-%-KI je Gruppe und Zeitpunkt", "Achsen beschriftet, Einheit genannt"],
    ["Statistische Signifikanz nicht mit klinischer Relevanz gleichsetzen; Vergleich mit der MCID", ""],
    ["Nicht signifikant heißt nicht „kein Effekt“; das Konfidenzintervall interpretieren", ""],
    ["Bei Beobachtungsstudien: Zusammenhang statt Wirkung formulieren", "Restconfounding als Limitation nennen"]]]
];
const KEY = "statslab-ergebnisse-checkliste";
let st = {}; try { st = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { st = {}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* Speicher nicht verfügbar */ } };
let n = 0;
$("chk").innerHTML = CK.map(([h, items]) => `<p class="chk-h">${h}</p><ul class="chk">${items.map(([t, s]) => { const id = "c" + (n++); return `<li><label><input type="checkbox" data-id="${id}" ${st[id] ? "checked" : ""}><span>${t}${s ? `<small>${s}</small>` : ""}</span></label></li>`; }).join("")}</ul>`).join("");
const bar = () => { const k = Object.values(st).filter(Boolean).length; $("chkbar").textContent = `${k} von ${n} Punkten abgehakt`; };
$("chk").addEventListener("change", e => { const c = e.target.closest("input"); if (!c) return; if (c.checked) st[c.dataset.id] = 1; else delete st[c.dataset.id]; save(); bar(); });
$("chkreset").addEventListener("click", () => { st = {}; save(); $("chk").querySelectorAll("input").forEach(c => c.checked = false); bar(); });
bar();
})();
