/* Lernreise FM3, quantitative Auswertung · Stats Lab
   Stationen in fester Reihenfolge, gegliedert in Abschnitte (day). Art: "pflicht", "grundlage", "empfehlung".
   Fragen zur Selbstkontrolle üben Zuordnung und das Lesen von Ausgaben (FM3 wird über Hausarbeiten geprüft).
   Fortschritt nur im Browser (localStorage). Pfade relativ zu lernreisen/fm3/. */
(() => {
"use strict";
const R = "../../";

/* ---------- Abbildungen: kleine Ausgaben und Tafeln ---------- */
const tab = (cap, head, rows) => `<div class="qout-wrap"><table class="qout"><caption>${cap}</caption><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const figFour = () => tab("Rückkehr in den Wettkampf nach sechs Monaten", ["", "zurückgekehrt", "nicht zurückgekehrt", "gesamt"], [["Programm", "30", "30", "60"], ["Standard", "20", "40", "60"]]);
const figLogit = () => tab("Variablen in der Gleichung", ["", "B", "Standardfehler", "Sig.", "Exp(B)", "95 % KI unten", "oben"], [["alpha", "0,028", "0,012", ",019", "1,029", "1,005", "1,053"], ["schmerz", "0,486", "0,339", ",152", "1,626", "0,836", "3,161"], ["Konstante", "−2,597", "0,795", ",001", "0,074", "", ""]]);
const figMixed = () => tab("Schätzungen fester Parameter (Schmerz, VAS 0 bis 10)", ["Parameter", "Schätzung", "Standardfehler", "Sig."], [["Konstanter Term", "5,600", "0,265", ",000"], ["[zeit = Woche 14]", "−2,111", "0,243", ",000"], ["[gruppe = Intervention]", "1,200", "0,375", ",002"], ["[gruppe = Intervention] * [zeit = Woche 14]", "−3,528", "0,346", ",000"]]);

/* ---------- Stationen ---------- */
const AB = ["Ausschließlich Aussage A ist richtig.", "Ausschließlich Aussage B ist richtig.", "Beide Aussagen sind richtig.", "Keine der beiden Aussagen ist richtig."];
const STOPS = [
  { day: "Zum Einstieg", dd: "Vor dem Start: die Landkarte der Verfahren." },
  { id: "verfahrenswahl-start", kind: "pflicht", blk: "Auswertung planen und berichten", t: "Welches Verfahren passt? Der Entscheidungsweg", href: "auswertung/verfahrenswahl/#acc-1",
    d: "Drei Fragen führen zum Verfahren: Was wird gemessen, wie hängen die Messungen zusammen, was wird verglichen? Der Entscheidungsweg zeigt, wo die Stationen dieser Reise auf der Landkarte liegen.",
    can: "Für eine Studie Zielgröße, Datenstruktur und Vergleich benennen und daraus die Modellfamilie ableiten.",
    deep: [["auswertung/verfahrenswahl/#acc-3", "Die Übersicht: Zielgröße und Datenstruktur auf einen Blick"], ["testen/t-test-varianten/", "Welcher t-Test? Die Verfahren aus FM1"]],
    qs: [{ type: "ab", a: "Ob die Zielgröße metrisch oder binär ist, entscheidet, ob ein lineares oder ein logistisches Modell passt.", b: "Ob Messungen zusammenhängen, spielt bei großer Stichprobe keine Rolle mehr.", right: 0,
      why: "A stimmt: Die Zielgröße bestimmt die Modellfamilie. B ist falsch: Abhängige Messungen verkleinern den Standardfehler fälschlich, gleich wie groß n ist. Bei vielen Patientinnen pro Praxis wird das Problem sogar größer." }] },
  { day: "Teil 1: Logistische Regression", dd: "Wenn das Ergebnis ja oder nein lautet: Odds, S-Kurve und eine Werkstatt zur Cam-Morphologie." },
  { id: "risiko-odds", kind: "grundlage", blk: "Grundlagen", t: "Risiko, Odds und Odds Ratio", href: "grundlagen/risiko-odds/",
    d: "Zwei Sprachen für dasselbe: Risiko ist der Anteil der Betroffenen, Odds das Verhältnis von Betroffenen zu Nichtbetroffenen. Aus der Vierfeldertafel folgen Risikodifferenz, NNT, Risikoverhältnis und Odds Ratio.",
    can: "Aus einer Vierfeldertafel RD, NNT, RR und OR berechnen und sagen, wann OR und RR auseinanderlaufen.",
    deep: [["grundlagen/risiko-odds/#acc-2", "So berichten und lesen Sie die Kennzahlen"], ["studiendesign/fall-kontrolle/", "Die Fall-Kontroll-Studie: warum dort nur das OR geht"]],
    qs: [{ type: "fig", label: "Vierfeldertafel lesen", fig: figFour, p: "Welche Kennzahlen stimmen für das Programm im Vergleich zum Standard?", o: ["RR 1,5 und OR 2,0", "RR 2,0 und OR 1,5", "RR 1,5 und OR 1,5", "RR 1,25 und OR 2,0"], right: 0,
      why: "Risiken: 30 von 60 = 0,50 gegen 20 von 60 = 0,33; RR = 0,50 ÷ 0,33 = 1,5. Odds: 30 ÷ 30 = 1 gegen 20 ÷ 40 = 0,5; OR = 2,0. Bei häufigem Ereignis liegt das OR weiter von 1 entfernt als das RR. Die Risikodifferenz von 0,17 ergibt eine NNT von 6." }] },
  { id: "klinische-tests", kind: "empfehlung", blk: "Hintergrund", t: "Klinische Tests: Gütekriterien und Likelihood-Ratios", href: "hintergrund/klinische-tests/",
    d: "Sensitivität, Spezifität und Likelihood-Ratios beschreiben, wie gut ein klinischer Test eine Diagnose stützt. Die Logik der Odds kehrt hier wieder: Vortest-Odds mal Likelihood-Ratio ergibt die Nachtest-Odds.",
    can: "Erklären, wie eine Likelihood-Ratio die Wahrscheinlichkeit einer Diagnose verändert.",
    deep: [["hintergrund/mammografie/", "Mammografie: positiver Befund, was nun?"]],
    qs: [{ type: "ab", a: "Ein sehr sensitiver Test eignet sich vor allem, um eine Diagnose bei negativem Ergebnis auszuschließen.", b: "Die positive Likelihood-Ratio eines Tests hängt von der Prävalenz in der untersuchten Gruppe ab.", right: 0,
      why: "A stimmt: Ein sensitiver Test übersieht kaum Erkrankte, ein negatives Ergebnis macht die Diagnose deshalb unwahrscheinlich. B ist falsch: Die Likelihood-Ratio folgt aus Sensitivität und Spezifität; von der Prävalenz hängt der Vorhersagewert ab." }] },
  { id: "s-kurve", kind: "pflicht", blk: "Logistische Regression", t: "Von der Geraden zur S-Kurve", href: "logistische-regression/s-kurve/",
    d: "Eine Gerade durch Nullen und Einsen sagt Wahrscheinlichkeiten unter 0 und über 1 voraus. Die logistische Regression modelliert stattdessen die Log-Odds linear; zurückübersetzt entsteht die S-Kurve.",
    can: "Erklären, warum die logistische Regression auf der Logit-Skala rechnet, und b₁ sowie exp(b₁) richtig lesen.",
    deep: [["logistische-regression/s-kurve/#acc-3", "Was bedeutet b₁?"], ["logistische-regression/s-kurve/#acc-4", "Exkurs: Wie findet man die beste Kurve?"]],
    qs: [{ type: "ab", a: "b₁ gibt an, um wie viel sich die Log-Odds pro Einheit der Einflussgröße ändern.", b: "exp(b₁) gibt an, um wie viele Prozentpunkte sich die Wahrscheinlichkeit pro Einheit ändert.", right: 0,
      why: "A stimmt. B ist falsch: exp(b₁) ist das Odds Ratio, also ein Faktor für die Odds. Wie stark sich die Wahrscheinlichkeit ändert, hängt davon ab, wo auf der S-Kurve man sich befindet; dafür gibt es Marginal Effects." }] },
  { id: "cam-morphologie", kind: "pflicht", blk: "Logistische Regression", t: "Werkstatt 1: Cam-Morphologie und Knorpeldefekt", href: "logistische-regression/cam-morphologie/",
    d: "Ein realitätsnaher Datensatz mit 240 Fußballspielern: Hängt der Alpha-Winkel mit Knorpeldefekten zusammen, auch adjustiert für Schmerz? Mit Odds Ratio pro 10 Grad, Marginal Effects und einem Ergebnissatz.",
    can: "Eine logistische Regression in SPSS rechnen, das OR in einer sinnvollen Einheit berichten und die Grenzen bei Auswahl nach Symptomen benennen.",
    deep: [["logistische-regression/cam-morphologie/#acc-4", "Vom Odds Ratio zu Prozentpunkten"], ["auswertung/ergebnisse-berichten/#acc-2", "Output lesen: logistische Regression"]],
    qs: [{ type: "fig", label: "Output lesen", fig: figLogit, p: "Knorpeldefekt (ja oder nein) in Abhängigkeit vom Alpha-Winkel in Grad, adjustiert für Schmerz. Welcher Satz gibt das Ergebnis für den Alpha-Winkel richtig wieder?", o: ["Pro Grad Alpha-Winkel steigen die Odds eines Knorpeldefekts um den Faktor 1,03 (95-%-KI 1,01 bis 1,05).", "Pro Grad Alpha-Winkel steigt die Wahrscheinlichkeit eines Knorpeldefekts um 2,8 Prozentpunkte.", "Pro Grad Alpha-Winkel steigt das Risiko eines Knorpeldefekts um das 1,03-Fache.", "Der Alpha-Winkel ist ohne Bedeutung, weil Exp(B) fast 1 ist."], right: 0,
      why: "Exp(B) ist das Odds Ratio pro Grad. B ist kein Prozentpunktwert, sondern eine Änderung der Log-Odds, und ein OR ist kein Risikoverhältnis. Klein wirkt das OR nur wegen der Einheit: Pro 10 Grad sind es 1,03¹⁰ ≈ 1,33." }] },
  { day: "Teil 2: Gemischte Modelle", dd: "Wenn Messungen zusammenhängen: Praxen, Personen, Verläufe und eine Werkstatt mit offenen RCT-Daten." },
  { id: "warum", kind: "pflicht", blk: "Gemischte Modelle", t: "Warum gemischte Modelle? Feste und zufällige Effekte", href: "gemischte-modelle/warum/",
    d: "Dasselbe RCT mit drei Messzeitpunkten auf vier Wegen ausgewertet: t-Test der Endwerte, t-Test der Veränderung, Regression über alle Zeilen, gemischtes Modell. Dann eine einzelne Messung zerlegt in festen Teil, Zufallseffekt der Person und Rest.",
    can: "Begründen, warum t-Test und Regression bei Messwiederholungen Information verschenken oder falsche Standardfehler liefern, und feste von zufälligen Effekten unterscheiden.",
    deep: [["gemischte-modelle/warum/#acc-3", "Begriffe und Synonyme: LMM, Mehrebenenmodell, Random Intercept"]],
    qs: [{ type: "ab", a: "Ein fester Effekt gilt für alle Personen gleich und wird mit Konfidenzintervall berichtet, etwa der Behandlungseffekt.", b: "Für einen Zufallseffekt schätzt das Modell vor allem einen eigenen Parameter je Person, der einzeln berichtet wird.", right: 0,
      why: "A stimmt. B ist falsch: Die Personen gelten als Zufallsstichprobe. Geschätzt wird, wie stark sie streuen (τ); die Werte der einzelnen Personen sind ein Nebenprodukt und werden nicht berichtet." },
      { type: "sc", label: "Single Choice", p: "90 Personen, je drei Messzeitpunkte. Jemand rechnet eine gewöhnliche Regression mit allen 266 Messungen. Was ist das Hauptproblem?", o: ["Die Regression behandelt die 266 Messungen als unabhängig; die Standardfehler stimmen nicht.", "Die Regression kann keine Wechselwirkung Gruppe × Zeit schätzen.", "Die Regression liefert einen völlig anderen Effekt als das gemischte Modell.", "Die Regression wirft alle Personen mit fehlenden Werten hinaus."], right: 0,
      why: "Der Effekt ist oft ähnlich, aber die Regression weiß nicht, welche Messungen zu einer Person gehören. Im Hüftarthroskopie-RCT ist ihr Standardfehler deshalb zu groß, bei Praxisvergleichen wäre er zu klein. Fehlende Werte stören sie dagegen nicht." }] },
  { id: "abhaengige-daten", kind: "pflicht", blk: "Gemischte Modelle", t: "Abhängige Daten: Wie viel ist die Ähnlichkeit wert?", href: "gemischte-modelle/abhaengige-daten/",
    d: "In einem cluster-randomisierten RCT wird der naive t-Test viel zu oft signifikant. Die ICC misst, wie ähnlich sich Messungen derselben Gruppe sind, der Designeffekt, wie viel die Daten wirklich wert sind.",
    can: "ICC und Designeffekt erklären und die effektive Fallzahl einer geschachtelten Studie abschätzen.",
    deep: [["gemischte-modelle/abhaengige-daten/#acc-3", "Die ICC: wie ähnlich sich eine Gruppe ist"], ["hintergrund/klinische-tests/", "Dieselbe ICC als Reliabilität klinischer Tests"]],
    qs: [{ type: "sc", label: "Rechnen mit dem Designeffekt", p: "20 Praxen schließen je 21 Patientinnen ein, zusammen 420. Die ICC beträgt 0,05. Wie vielen unabhängigen Patientinnen entsprechen die Daten etwa?", o: ["210", "420", "400", "21"], right: 0,
      why: "DE = 1 + (m − 1) · ICC = 1 + 20 · 0,05 = 2. Die effektive Fallzahl ist 420 ÷ 2 = 210. Schon eine kleine ICC halbiert die Information, wenn viele Personen pro Praxis gemessen werden." }] },
  { id: "partial-pooling", kind: "pflicht", blk: "Gemischte Modelle", t: "Partial Pooling: zwischen allen gleich und jeder für sich", href: "gemischte-modelle/partial-pooling/",
    d: "Alle Messungen zusammenwerfen, jede Person für sich schätzen oder der Mittelweg des gemischten Modells: Wer wenig gemessen wurde, wird zum Gesamtmittel gezogen.",
    can: "Complete, No und Partial Pooling unterscheiden und vorhersagen, wann eine Person stark zur Mitte gezogen wird.",
    deep: [["gemischte-modelle/partial-pooling/#acc-3", "Was das Modell schätzt: feste und zufällige Effekte"]],
    qs: [{ type: "ab", a: "Im gemischten Modell wird eine Person mit nur einer Messung stärker zum Gesamtmittel gezogen als eine mit sieben Messungen.", b: "Je größer die Unterschiede zwischen den Personen (τ²), desto stärker werden alle zur Mitte gezogen.", right: 0,
      why: "A stimmt: Wenige Messungen tragen wenig eigene Information. B ist falsch: Bei großem τ² sind echte Unterschiede plausibel, das Modell traut den eigenen Daten mehr und zieht weniger. Der Anteil λ = τ² ÷ (τ² + σ²/n) wächst mit τ²." }] },
  { id: "random-slopes", kind: "pflicht", blk: "Gemischte Modelle", t: "Jeder Verlauf ist anders: Random Slopes", href: "gemischte-modelle/random-slopes/",
    d: "Personen haben nicht nur ein eigenes Niveau, sie verändern sich auch unterschiedlich schnell. Im RCT mit mehreren Messzeitpunkten steckt der Behandlungseffekt in der Wechselwirkung Gruppe × Zeit.",
    can: "Erklären, wann ein Random Slope nötig ist, und die Wechselwirkung Gruppe × Zeit als Behandlungseffekt lesen.",
    deep: [["gemischte-modelle/random-slopes/#acc-3", "Gemischte Modelle rechnen und berichten"]],
    qs: [{ type: "sc", label: "Single Choice", p: "Die Verläufe der Personen sind sehr unterschiedlich steil. Das Modell enthält aber nur einen zufälligen Achsenabschnitt. Was ist die Folge?", o: ["Der Standardfehler der Wechselwirkung Gruppe × Zeit ist zu klein, der p-Wert zu optimistisch.", "Der Effekt wird systematisch überschätzt, der Standardfehler stimmt.", "Das Modell lässt sich nicht schätzen.", "Nichts, der zufällige Achsenabschnitt fängt die Unterschiede auf."], right: 0,
      why: "Die Punktschätzung bleibt meist ähnlich, aber das Modell unterschätzt, wie unsicher die mittlere Steigung ist: Es behandelt Abweichungen der Steigungen als Rauschen der einzelnen Messungen. Die Standardfehler für Zeit und Gruppe × Zeit werden zu klein." }] },
  { id: "hueftarthroskopie", kind: "pflicht", blk: "Gemischte Modelle", t: "Werkstatt 2: Reha nach Hüftarthroskopie", href: "gemischte-modelle/hueftarthroskopie/",
    d: "Offene Daten eines RCT: 90 Personen mit Cam-Impingement, drei Messzeitpunkte, fehlende und fortgeschriebene Werte. Aufbereiten, Verläufe ansehen, das gemischte Modell rechnen und mit dem t-Test des Artikels vergleichen.",
    can: "Ein gemischtes Modell mit Gruppe × Zeitpunkt in SPSS rechnen, den entscheidenden Koeffizienten finden und den Umgang mit fehlenden Werten begründen.",
    deep: [["gemischte-modelle/hueftarthroskopie/#acc-4", "Werkstatt mit Lösungen"], ["auswertung/ergebnisse-berichten/#acc-3", "Output lesen: gemischtes Modell"], ["testen/t-test-varianten/#acc-4", "Dieselben Daten mit t-Tests"]],
    qs: [{ type: "fig", label: "Output lesen", fig: figMixed, p: "Kontrolle und „vor OP“ sind die Referenz. Welche Zeile beantwortet, ob die Reha den Schmerz bis Woche 14 stärker senkt als die Standardversorgung?", o: ["[gruppe = Intervention] * [zeit = Woche 14]", "[gruppe = Intervention]", "[zeit = Woche 14]", "Konstanter Term"], right: 0,
      why: "Die Wechselwirkung ist die zusätzliche Veränderung der Interventionsgruppe: 3,53 Punkte mehr Abnahme. [gruppe = Intervention] ist der Unterschied vor der OP, [zeit = Woche 14] die Veränderung der Kontrollgruppe, der konstante Term ihr Ausgangswert." }] },
  { day: "Zum Abschluss", dd: "Die Landkarte noch einmal, diesmal an echten Studienbeschreibungen, und der Weg vom Output zum Text." },
  { id: "verfahrenswahl-fall", kind: "pflicht", blk: "Auswertung planen und berichten", t: "Fallbeispiele zuordnen", href: "auswertung/verfahrenswahl/#acc-2",
    d: "Acht Studien aus der Physiotherapie: Cluster-RCT, Vorher-nachher, Verlaufsmessung, Fall-Kontroll-Studie, beide Beine einer Person. Wählen und begründen Sie das Verfahren und vermeiden Sie die typischen Fehler.",
    can: "Für eine Studienbeschreibung das Verfahren wählen, begründen und die typischen Fehler benennen.",
    deep: [["auswertung/verfahrenswahl/#acc-4", "Typische Fehler bei der Wahl"]],
    qs: [{ type: "sc", label: "Zuordnung", p: "Ordnen Sie zu. (1) 24 Praxen werden randomisiert, Zielgröße ist der Schmerz nach 8 Wochen. (2) Bei 30 Personen wird die Kraft beider Schultern gemessen, betroffen gegen gesund. (3) Ob ein Rezidiv auftritt, wird in Abhängigkeit vom Alter untersucht.", o: ["1 gemischtes Modell · 2 gepaarter t-Test · 3 logistische Regression", "1 ungepaarter t-Test · 2 ungepaarter t-Test · 3 logistische Regression", "1 gemischtes Modell · 2 ungepaarter t-Test · 3 Chi-Quadrat-Test", "1 Chi-Quadrat-Test · 2 gepaarter t-Test · 3 lineare Regression"], right: 0,
      why: "Patientinnen in randomisierten Praxen sind geschachtelt: Zufallseffekt je Praxis. Beide Schultern einer Person sind gepaart. Ein Ergebnis ja oder nein mit metrischer Einflussgröße: logistische Regression." }] },
  { id: "ergebnisse-berichten", kind: "pflicht", blk: "Auswertung planen und berichten", t: "Ergebnisse berichten", href: "auswertung/ergebnisse-berichten/",
    d: "Sechs Bausteine machen einen Ergebnissatz vollständig. Dazu SPSS-Ausgaben Zelle für Zelle lesen und eine Checkliste für Methoden- und Ergebnisteil der Hausarbeit nach CONSORT und STROBE.",
    can: "Einen vollständigen Ergebnissatz schreiben und Methoden- und Ergebnisteil mit der Checkliste prüfen.",
    deep: [["auswertung/ergebnisse-berichten/#acc-4", "Checkliste für die Hausarbeit"], ["grundlagen/effektgroessen/", "Effektgrößen: signifikant heißt nicht relevant"]],
    qs: [{ type: "sc", label: "Single Choice", p: "„Die Reha senkte den Schmerz signifikant (p < 0,001).“ Was fehlt vor allem?", o: ["Der Effekt in der Einheit der Zielgröße mit Konfidenzintervall", "Die Teststatistik t mit Freiheitsgraden", "Der exakte p-Wert mit drei Nachkommastellen", "Nichts, der Satz ist vollständig."], right: 0,
      why: "Der Satz sagt nur, dass es einen Unterschied gibt, nicht wie groß er ist und wie sicher die Schätzung. Effekt und Konfidenzintervall sind die wichtigsten Bausteine; erst damit lässt sich die klinische Relevanz beurteilen." },
      { type: "ab", a: "SPSS zeigt bei „Sig.“ den Wert ,000. Im Text steht dann p < 0,001.", b: "In einem RCT gehören p-Werte für Unterschiede zu Beginn in Tabelle 1.", right: 0,
      why: "A stimmt: ,000 heißt nur, dass p unter 0,0005 liegt; p = 0 gibt es nicht. B ist falsch: Im RCT sind Unterschiede zu Beginn per Definition zufällig, CONSORT rät von Tests in Tabelle 1 ab." }] }
];

/* ---------- Darstellung ---------- */
const KEY = "statslab-lernreise-fm3";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } };
const save = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* Speicher nicht verfügbar */ } };
let done = load();
const KIND = { pflicht: "Pflichtstation", grundlage: "Grundlage", empfehlung: "Empfehlung" };
const TYPE = { ab: "Zwei Aussagen bewerten", sc: "Single Choice", fig: "Abbildung" };
function order(n, seed) { const o = Array.from({ length: n }, (_, i) => i); let x = seed * 9301 + 49297; for (let i = n - 1; i > 0; i--) { x = (x * 9301 + 49297) % 233280; const j = Math.floor(x / 233280 * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; }
function question(q, si, qi) {
  const base = q.type === "ab" ? AB : q.o, ord = q.type === "ab" ? base.map((_, i) => i) : order(base.length, si * 31 + qi * 7 + 3);
  q.ord = ord; const opts = ord.map(i => base[i]);
  const stem = q.type === "ab" ? `<p>Beurteilen Sie die folgenden Aussagen.</p><p><b>A:</b> ${q.a}</p><p><b>B:</b> ${q.b}</p>` : `${q.fig ? q.fig() : ""}<p>${q.p}</p>`;
  return `<div class="q" data-s="${si}" data-q="${qi}"><span class="qtype">${q.label || TYPE[q.type]}</span>${stem}<div class="opts">${opts.map((o, k) => `<button type="button" data-k="${k}">${o}</button>`).join("")}</div><p class="fb" hidden></p></div>`;
}
function render() {
  let n = 0;
  document.getElementById("journey").innerHTML = STOPS.map((s, i) => {
    if (s.day) return `<li class="day"><h3>${s.day}</h3><p>${s.dd}</p></li>`;
    const nr = s.kind === "pflicht" ? String(++n) : s.kind === "grundlage" ? "G" : "+";
    return `
    <li id="${s.id}" class="${s.kind}${done[s.id] ? " done" : ""}">
      <div class="node" aria-hidden="true">${nr}</div>
      <article class="stop">
        <span class="blk">${KIND[s.kind]} · Block ${s.blk}</span>
        <h2><a href="${R}${s.href}">${s.t}</a></h2>
        <p>${s.d}</p>
        <p class="can"><b>Danach können Sie:</b> ${s.can}</p>
        <div class="deeper"><span class="lbl">Zur Vertiefung</span><ul>${s.deep.map(([h, t]) => `<li><a href="${R}${h}">${t}</a></li>`).join("")}</ul></div>
        ${s.qs.length ? `<details class="check-q"><summary>Selbstkontrolle (${s.qs.length === 1 ? "eine Frage" : s.qs.length + " Fragen"})</summary>${s.qs.map((q, k) => question(q, i, k)).join("")}</details>` : ""}
        <div class="foot"><a class="go" href="${R}${s.href}">Zur Station →</a><label class="done-chk"><input type="checkbox" data-id="${s.id}" ${done[s.id] ? "checked" : ""}> erledigt</label></div>
      </article>
    </li>`;
  }).join("");
  progress();
}
function progress() { const P = STOPS.filter(s => s.kind === "pflicht"), n = P.filter(s => done[s.id]).length; document.getElementById("prog").textContent = n ? `${n} von ${P.length} Pflichtstationen erledigt` : ""; }
const J = document.getElementById("journey");
J.addEventListener("change", e => { const c = e.target.closest("input[data-id]"); if (!c) return; if (c.checked) done[c.dataset.id] = true; else delete done[c.dataset.id]; save(done); c.closest("li").classList.toggle("done", c.checked); progress(); });
J.addEventListener("click", e => {
  const b = e.target.closest(".opts button"); if (!b) return;
  const box = b.closest(".q"), q = STOPS[+box.dataset.s].qs[+box.dataset.q], k = q.ord[+b.dataset.k], fb = box.querySelector(".fb");
  box.querySelectorAll(".opts button").forEach(x => x.classList.remove("right", "wrong"));
  b.classList.add(k === q.right ? "right" : "wrong");
  if (k !== q.right) box.querySelector(`button[data-k="${q.ord.indexOf(q.right)}"]`).classList.add("right");
  fb.hidden = false; fb.innerHTML = `<b>${k === q.right ? "Richtig." : "Nicht ganz."}</b> ${q.why}`;
});
render();
})();
