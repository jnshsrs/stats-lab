/* Lernreise FM1, Teil Inferenzstatistik · Stats Lab
   Stationen in fester Reihenfolge. Art: "pflicht" (prüfungsrelevant), "grundlage" (Basis, nicht geprüft),
   "empfehlung" (freiwillig). Je Station Kurzbeschreibung, Lernziel, Vertiefungen und Fragen zur Selbstkontrolle
   in den Fragetypen der Klausur (zwei Aussagen bewerten, Single Choice, Zuordnung, Abbildung, Reihenfolge).
   Abbildungen werden als SVG erzeugt. Fortschritt nur im Browser (localStorage). Pfade relativ zu lernreisen/fm1/. */
(() => {
"use strict";
const R = "../../";
const fmt = (x, d = 2) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");

/* ---------- Abbildungen ---------- */
const lg = n => { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; };
const bpmf = (k, n, p) => Math.exp(lg(n) - lg(k) - lg(n - k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
const npdf = (x, m = 0, s = 1) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
function axisY(L, T, B, H, W, ymax, step, pct) {
  let s = "";
  for (let v = 0; v <= ymax + 1e-9; v += step) { const y = H - B - v / ymax * (H - T - B); s += `<line x1="${L}" x2="${W - 10}" y1="${y}" y2="${y}" stroke="var(--grid)"/><text x="${L - 6}" y="${y + 4}" text-anchor="end">${pct ? fmt(v * 100, 0) + " %" : fmt(v, 2)}</text>`; }
  return s;
}
// Wahrscheinlichkeitsfunktion und Verteilungsfunktion nebeneinander
function figPmfCdf(n, p) {
  const W = 360, H = 230, L = 46, B = 34, T = 22, pm = Array.from({ length: n + 1 }, (_, k) => bpmf(k, n, p)), cdf = pm.map((_, k) => pm.slice(0, k + 1).reduce((a, b) => a + b, 0));
  const panel = (vals, ymax, step, title) => {
    const sx = k => L + (k + 0.5) / (n + 1) * (W - L - 10), sy = v => H - B - v / ymax * (H - T - B);
    let s = `<text x="${L}" y="14" class="strong">${title}</text>` + axisY(L, T, B, H, W, ymax, step, true);
    vals.forEach((v, k) => { s += `<line x1="${sx(k)}" x2="${sx(k)}" y1="${sy(0)}" y2="${sy(v)}" stroke="var(--fg)" stroke-width="1.6"/><circle cx="${sx(k)}" cy="${sy(v)}" r="4.5" fill="var(--therapie)"/><text x="${sx(k)}" y="${H - B + 16}" text-anchor="middle">${k}</text>`; });
    return s + `<text x="${W - 10}" y="${H - 4}" text-anchor="end">Treffer</text>`;
  };
  return `<div class="figs"><svg viewBox="0 0 ${W} ${H}" class="qfig">${panel(pm, 0.3, 0.05, "Wahrscheinlichkeitsfunktion P(X = k)")}</svg><svg viewBox="0 0 ${W} ${H}" class="qfig">${panel(cdf, 1, 0.1, "Verteilungsfunktion P(X ≤ k)")}</svg></div>`;
}
// Binomialverteilung unter H0 mit Ablehnungsbereich und Beobachtung
function figReject(n, p, lo, hi, obs) {
  const W = 620, H = 220, L = 46, B = 34, T = 14, ymax = 0.2, sx = k => L + (k + 0.5) / (n + 1) * (W - L - 10), sy = v => H - B - v / ymax * (H - T - B);
  let s = axisY(L, T, B, H, W, ymax, 0.05, true);
  for (let k = 0; k <= n; k++) { const v = bpmf(k, n, p), rej = k <= lo || k >= hi; s += `<rect x="${sx(k) - 9}" y="${sy(v)}" width="18" height="${sy(0) - sy(v)}" fill="${rej ? "var(--beta-ink)" : "var(--pal-3)"}"/><text x="${sx(k)}" y="${H - B + 16}" text-anchor="middle">${k}</text>`; }
  s += `<line x1="${sx(obs)}" x2="${sx(obs)}" y1="${T}" y2="${sy(0)}" stroke="var(--fg)" stroke-width="2" stroke-dasharray="5 4"/><text x="${sx(obs) + 6}" y="${T + 12}" class="strong">beobachtet</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="qfig wide">${s}<text x="${W - 10}" y="${H - 4}" text-anchor="end">Anzahl Treffer unter H0</text></svg><p class="qleg"><i style="background:var(--beta-ink)"></i>Ablehnungsbereich (α = 5 %) <i style="background:var(--pal-3)"></i>Annahmebereich</p>`;
}
// Dichte der Prüfgröße unter H0 mit drei markierten Beobachtungen
function figMarks(marks) {
  const W = 620, H = 210, L = 20, B = 34, T = 14, sx = x => L + (x + 4) / 8 * (W - L - 20), sy = v => H - B - v / 0.42 * (H - T - B);
  let d = ""; for (let x = -4; x <= 4.001; x += 0.05) d += (d ? "L" : "M") + sx(x).toFixed(1) + "," + sy(npdf(x)).toFixed(1);
  let s = `<line x1="${L}" x2="${W - 20}" y1="${sy(0)}" y2="${sy(0)}" stroke="var(--fg)"/><path d="${d}" fill="none" stroke="var(--therapie)" stroke-width="2.6"/>`;
  for (let v = -4; v <= 4; v++) s += `<text x="${sx(v)}" y="${H - B + 16}" text-anchor="middle">${fmt(v, 0)}</text>`;
  marks.forEach(([lab, x]) => s += `<line x1="${sx(x)}" x2="${sx(x)}" y1="${sy(npdf(x)) - 4}" y2="${sy(0)}" stroke="var(--beta-ink)" stroke-width="2"/><circle cx="${sx(x)}" cy="${sy(0)}" r="5" fill="var(--beta-ink)"/><text x="${sx(x)}" y="${sy(npdf(x)) - 10}" text-anchor="middle" class="strong" style="fill:var(--beta-ink)">${lab}</text>`);
  return `<svg viewBox="0 0 ${W} ${H}" class="qfig wide">${s}<text x="${W - 20}" y="${H - 4}" text-anchor="end">Prüfgröße unter H0</text></svg>`;
}
// Verteilungen unter H0 und H1 mit kritischem Wert und zwei Flächen
function figAlphaBeta() {
  const W = 620, H = 230, L = 20, B = 30, T = 14, sx = x => L + (x + 3.5) / 9 * (W - L - 20), sy = v => H - B - v / 0.42 * (H - T - B), c = 1.65, d1 = 2.5;
  const path = (m, a, b) => { let p = `M${sx(a)},${sy(0)}`; for (let x = a; x <= b + 1e-9; x += 0.05) p += `L${sx(x).toFixed(1)},${sy(npdf(x, m)).toFixed(1)}`; return p + `L${sx(b)},${sy(0)}Z`; };
  const line = m => { let p = ""; for (let x = -3.5; x <= 5.5; x += 0.05) p += (p ? "L" : "M") + sx(x).toFixed(1) + "," + sy(npdf(x, m)).toFixed(1); return p; };
  let s = `<path d="${path(0, c, 3.5)}" fill="var(--beta-ink)" fill-opacity=".55"/><path d="${path(d1, -1, c)}" fill="var(--therapie)" fill-opacity=".35"/>`;
  s += `<path d="${line(0)}" fill="none" stroke="var(--fg)" stroke-width="2.4"/><path d="${line(d1)}" fill="none" stroke="var(--therapie)" stroke-width="2.4"/>`;
  s += `<line x1="${sx(c)}" x2="${sx(c)}" y1="${T}" y2="${sy(0)}" stroke="var(--fg)" stroke-dasharray="5 4" stroke-width="1.6"/><text x="${sx(c)}" y="${sy(0) + 18}" text-anchor="middle">kritischer Wert</text>`;
  s += `<text x="${sx(-1.2)}" y="${sy(0.3)}" text-anchor="end" class="strong">unter H0</text><text x="${sx(d1) + 40}" y="${sy(0.41) + 14}" text-anchor="start" class="strong" style="fill:var(--therapie)">unter H1</text>`;
  s += `<circle cx="${sx(2.15)}" cy="${sy(0.03)}" r="11" fill="var(--surface)" stroke="var(--fg)"/><text x="${sx(2.15)}" y="${sy(0.03) + 5}" text-anchor="middle" class="strong">1</text>`;
  s += `<circle cx="${sx(1.05)}" cy="${sy(0.09)}" r="11" fill="var(--surface)" stroke="var(--fg)"/><text x="${sx(1.05)}" y="${sy(0.09) + 5}" text-anchor="middle" class="strong">2</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="qfig wide"><line x1="${L}" x2="${W - 20}" y1="${sy(0)}" y2="${sy(0)}" stroke="var(--fg)"/>${s}</svg>`;
}

/* ---------- Stationen ---------- */
const AB = ["Ausschließlich Aussage A ist richtig.", "Ausschließlich Aussage B ist richtig.", "Beide Aussagen sind richtig.", "Keine der beiden Aussagen ist richtig."];
const STOPS = [
  { id: "wahrscheinlichkeit", kind: "grundlage", blk: "Grundlagen", t: "Wahrscheinlichkeit als Fläche", href: "grundlagen/wahrscheinlichkeit/",
    d: "Die Basis für alles Weitere: Wahrscheinlichkeiten als Anteile einer Fläche, bedingte Wahrscheinlichkeiten und der Satz von Bayes.",
    can: "P(A | B) und P(B | A) unterscheiden.",
    deep: [["hintergrund/mammografie/", "Mammografie: Wie wahrscheinlich ist Krebs bei positivem Befund?"], ["hintergrund/klinische-tests/", "Klinische Tests: Sensitivität, Spezifität und Likelihood-Ratios"]],
    qs: [{ type: "ab", a: "P(positiver Test | erkrankt) ist dasselbe wie P(erkrankt | positiver Test).", b: "Bei einer seltenen Erkrankung kann ein positiver Befund trotz hoher Sensitivität meist falsch-positiv sein.", right: 1,
      why: "A verwechselt die Bedingung: Die Sensitivität fragt, wie oft Erkrankte positiv getestet werden, der positive Vorhersagewert, wie oft positiv Getestete erkrankt sind. B stimmt: Bei niedriger Prävalenz überwiegen die Falsch-Positiven." }] },
  { id: "binomial", kind: "pflicht", blk: "Grundlagen", t: "Pascal und die Binomialverteilung", href: "grundlagen/binomial/",
    d: "Wie wahrscheinlich sind k Erfolge in n unabhängigen Versuchen mit derselben Erfolgswahrscheinlichkeit p? Hergeleitet über das Pascal'sche Dreieck.",
    can: "Wahrscheinlichkeiten aus der Wahrscheinlichkeitsfunktion und aus der Verteilungsfunktion ablesen und den Unterschied der beiden erklären.",
    deep: [["grundlagen/verteilungen/#p-diskret", "Die Binomialverteilung als diskrete Verteilung"], ["testen/binomialtest/#s2", "Die Verteilungsfunktion im Binomialtest"]],
    qs: [{ type: "fig", label: "Abbildung ablesen", fig: () => figPmfCdf(10, 0.5), p: "Ein Palpationstest wird an 10 Personen geprüft, bei reinem Raten ist die Trefferwahrscheinlichkeit 0,5. Wie wahrscheinlich sind höchstens 3 Treffer?", o: ["etwa 17 %", "etwa 12 %", "etwa 50 %", "etwa 83 %"], right: 0,
      why: "„Höchstens 3“ heißt 0, 1, 2 oder 3 Treffer. Die Verteilungsfunktion zeigt diese Summe direkt: P(X ≤ 3) ≈ 0,17. Die 12 % sind P(X = 3) allein, die 83 % die Gegenwahrscheinlichkeit P(X ≥ 4)." }] },
  { id: "verteilungen", kind: "grundlage", blk: "Grundlagen", t: "Diskret und stetig", href: "grundlagen/verteilungen/",
    d: "Bei Zählungen ist die Wahrscheinlichkeit eine Balkenhöhe, bei Messwerten eine Fläche unter der Kurve.",
    can: "Wahrscheinlichkeiten stetiger Größen als Flächen unter der Kurve lesen.",
    deep: [["glossar/#verteilungen-quantil", "Glossar: Quantil"]],
    qs: [{ type: "ab", a: "Bei der Binomialverteilung lässt sich die Wahrscheinlichkeit für genau 3 Treffer direkt an der Wahrscheinlichkeitsfunktion ablesen.", b: "Bei einer stetigen Verteilung ist die Wahrscheinlichkeit für genau einen Wert gleich der Höhe der Kurve an dieser Stelle.", right: 0,
      why: "A stimmt: Bei diskreten Verteilungen ist die Balkenhöhe die Wahrscheinlichkeit. B ist falsch: Bei stetigen Verteilungen haben nur Bereiche eine Wahrscheinlichkeit, nämlich die Fläche; für einen einzelnen Wert ist sie 0." }] },
  { id: "stichprobe", kind: "pflicht", blk: "Schätzen", t: "Stichprobe und Population", href: "schaetzen/stichprobe/",
    d: "Die Population kennt niemand, man sieht nur eine Stichprobe. Zwei Arten von Streuung: die der einzelnen Messwerte (Standardabweichung) und die der Mittelwerte vieler Stichproben (Standardfehler).",
    can: "Standardabweichung und Standardfehler unterscheiden und sagen, welche der beiden mit größerem n kleiner wird.",
    deep: [["schaetzen/grosse-zahlen/", "Große und kleine Zahlen: warum kleine Stichproben extreme Ergebnisse liefern"], ["glossar/#zgws-standardfehler-se", "Glossar: Standardfehler"]],
    qs: [{ type: "sc", label: "Single Choice", p: "Eine Physiotherapeutin misst die Griffkraft von 100 statt 25 Patientinnen derselben Klinik. Was ist typischerweise zu erwarten?", o: ["Die Standardabweichung bleibt etwa gleich, der Standardfehler halbiert sich.", "Standardabweichung und Standardfehler halbieren sich.", "Die Standardabweichung halbiert sich, der Standardfehler bleibt gleich.", "Beide bleiben gleich, weil dieselbe Klinik untersucht wird."], right: 0,
      why: "Die Standardabweichung beschreibt, wie verschieden die Patientinnen sind; das ändert eine größere Stichprobe nicht. Der Standardfehler ist SD ÷ √n: Bei vierfachem n halbiert er sich." }] },
  { id: "zgws", kind: "pflicht", blk: "Schätzen", t: "Standardfehler und Konfidenzintervall", href: "schaetzen/zgws/#acc-3",
    d: "Aus Standardfehler und kritischem Wert entsteht das Konfidenzintervall. Entscheidend ist, wovon seine Breite abhängt: Stichprobenumfang, Streuung der Messwerte und Konfidenzniveau.",
    can: "Vorhersagen, ob ein Konfidenzintervall breiter oder schmaler wird, wenn sich n, Streuung oder Konfidenzniveau ändern, und es korrekt interpretieren.",
    deep: [["schaetzen/zgws/#acc-1", "Der zentrale Grenzwertsatz: warum Mittelwerte normalverteilt sind"], ["testen/t-test/#ci-exkurs", "Exkurs: p-Wert oder Konfidenzintervall?"], ["testen/t-test-varianten/#ov-exkurs", "Exkurs: Überlappende Konfidenzintervalle, trotzdem signifikant?"]],
    qs: [{ type: "sc", label: "Zuordnung", p: "Wie verändert sich die Breite eines Konfidenzintervalls für den Mittelwert? (1) Es werden weniger Personen untersucht. (2) Statt 95 % wird ein 99-%-Konfidenzintervall berechnet. (3) Ein genaueres Messgerät verringert die Streuung der Messwerte.", o: ["1 breiter · 2 breiter · 3 schmaler", "1 breiter · 2 schmaler · 3 schmaler", "1 schmaler · 2 breiter · 3 gleich", "1 breiter · 2 gleich · 3 schmaler"], right: 0,
      why: "Weniger Personen vergrößern den Standardfehler, das Intervall wird breiter. Ein höheres Konfidenzniveau braucht einen größeren kritischen Wert, also ebenfalls breiter. Weniger Streuung verkleinert den Standardfehler, das Intervall wird schmaler." },
      { type: "ab", a: "Würde man die Studie sehr oft wiederholen, enthielten etwa 95 % der so berechneten 95-%-Konfidenzintervalle den wahren Mittelwert.", b: "Ein bereits berechnetes 95-%-Konfidenzintervall enthält den wahren Mittelwert mit 95 % Wahrscheinlichkeit.", right: 0,
      why: "Die 95 % beziehen sich auf das Verfahren, also auf viele Wiederholungen. Ein einzelnes, schon berechnetes Intervall enthält den wahren Wert oder nicht; eine Wahrscheinlichkeit dafür gibt das Konfidenzintervall nicht an." }] },
  { id: "binomialtest", kind: "pflicht", blk: "Testen", t: "Binomialtest: Hypothesen, Annahme- und Ablehnungsbereich", href: "testen/binomialtest/",
    d: "Der erste Signifikanztest: Hypothesen formulieren, vor dem Versuch den Ablehnungsbereich festlegen, das Ergebnis einordnen. Der p-Wert ist die Wahrscheinlichkeit des beobachteten und aller extremeren Ergebnisse unter H0.",
    can: "H0 und H1 gerichtet oder ungerichtet formulieren, und zwar vor der Datenerhebung; ein Ergebnis im Annahme- oder Ablehnungsbereich verorten und den p-Wert als Fläche in der Verteilung erklären.",
    deep: [["hintergrund/inferenzzyklus/", "Induktion, Deduktion und der Signifikanztest: was ein Test logisch leistet"], ["glossar/#binomialtest-p-wert", "Glossar: p-Wert"]],
    qs: [{ type: "sc", label: "Single Choice", p: "Ein Therapeut will zeigen, dass er mit einem Palpationstest die betroffene Seite besser als durch Raten erkennt. Er legt sein Hypothesenpaar vor der Datenerhebung fest. Welches passt?", o: ["H0: p ≤ 0,5 und H1: p > 0,5", "H0: p > 0,5 und H1: p ≤ 0,5", "H0: p ≠ 0,5 und H1: p = 0,5", "Das Paar wird erst festgelegt, wenn die Trefferzahl bekannt ist."], right: 0,
      why: "Die Behauptung „besser als Raten“ gehört in H1, der Gegenteil in H0. Die Richtung ergibt sich aus der Frage, nicht aus den Daten; wer sie nach dem Blick auf die Ergebnisse wählt, erhöht unbemerkt den α-Fehler." },
      { type: "fig", label: "Abbildung", fig: () => figReject(20, 0.5, 5, 15, 14), p: "Die Grafik zeigt die Verteilung der Trefferzahl unter H0 (n = 20, p = 0,5) mit dem vorab festgelegten Ablehnungsbereich. Beobachtet wurden 14 Treffer. Was folgt?", o: ["H0 wird beibehalten, weil 14 im Annahmebereich liegt.", "H0 wird verworfen, weil 14 mehr als die erwarteten 10 Treffer sind.", "H0 wird verworfen, weil 14 Treffer unter H0 selten sind.", "Ohne den genauen p-Wert lässt sich nicht entscheiden."], right: 0,
      why: "Entscheidend ist der vorab festgelegte Ablehnungsbereich, nicht der Abstand zum Erwartungswert. 14 liegt im Annahmebereich; der p-Wert ist deshalb größer als α. Das Ergebnis ist mit Raten vereinbar." }] },
  { id: "z-test", kind: "empfehlung", blk: "Testen", t: "Der z-Test: Übergang zum t-Test", href: "testen/z-test/",
    d: "Bei großen Stichproben lässt sich die Binomialverteilung durch die Normalverteilung nähern. Der z-Wert misst, wie viele Standardfehler ein Ergebnis von H0 entfernt liegt; der t-Test übernimmt diese Idee.",
    can: "Einen Prüfwert als Abstand in Standardfehlern lesen.",
    deep: [["testen/z-test/#acc-3", "Ausblick: z oder t, wenn die Standardabweichung geschätzt wird"]], qs: [] },
  { id: "t-test", kind: "pflicht", blk: "Testen", t: "Die t-Test-Kaskade", href: "testen/t-test/",
    d: "Signal geteilt durch Rauschen ergibt t. Der kritische Wert hängt von α, den Freiheitsgraden und der Richtung der Hypothese ab; wo das beobachtete t unter H0 liegt, zeigt der p-Wert.",
    can: "Vorhersagen, wie sich der kritische t-Wert mit α, Freiheitsgraden und Richtung ändert; Beobachtungen in der t-Verteilung verorten und nach ihrem p-Wert ordnen.",
    deep: [["testen/t-test/#calc", "Den kritischen Wert aus Tabelle und Verteilungsfunktion ablesen"], ["testen/t-test/#ci-exkurs", "Exkurs: p-Wert oder Konfidenzintervall, und einseitig gegen zweiseitig"]],
    qs: [{ type: "ab", a: "Wird α von 5 % auf 1 % gesenkt, liegt der kritische t-Wert weiter von 0 entfernt.", b: "Mit mehr Freiheitsgraden liegt der kritische t-Wert weiter von 0 entfernt.", right: 0,
      why: "A stimmt: Ein kleineres α lässt weniger Fläche im Ablehnungsbereich, die Grenze rückt nach außen. B ist falsch: Mit mehr Freiheitsgraden hat die t-Verteilung dünnere Ränder, der kritische Wert rückt nach innen Richtung 1,96." },
      { type: "fig", label: "Reihenfolge", fig: () => figMarks([["A", 0.6], ["B", -1.8], ["C", 2.7]]), p: "Drei Studien liefern die Prüfgrößen A, B und C. Ordnen Sie nach dem zweiseitigen p-Wert, vom kleinsten zum größten.", o: ["C, B, A", "A, B, C", "B, C, A", "C, A, B"], right: 0,
      why: "Zweiseitig zählt der Abstand von 0, egal in welche Richtung. C liegt am weitesten außen, die Fläche jenseits davon ist am kleinsten, also hat C den kleinsten p-Wert. A liegt nah an der Mitte und hat den größten." }] },
  { id: "t-test-varianten", kind: "pflicht", blk: "Testen", t: "Welcher t-Test?", href: "testen/t-test-varianten/",
    d: "Einstichproben-, gepaarter und ungepaarter t-Test: dieselbe Logik, andere Fragen. Mit einem Entscheidungsweg, welcher Test zu welchem Design passt.",
    can: "Für eine Studie den passenden t-Test wählen und begründen.",
    deep: [["testen/t-test-varianten/#acc-3", "Übung: Vorher-nachher mit Kontrolle (Bizeps-Beispiel)"], ["hintergrund/regression-mitte/", "Regression zur Mitte: warum Vorher-nachher ohne Kontrolle täuschen kann"]],
    qs: [{ type: "sc", label: "Zuordnung", p: "Ordnen Sie zu. (1) Die Sprunghöhe von 15 Volleyballerinnen wird vor und nach einem Plyometrie-Programm gemessen. (2) Die Gehgeschwindigkeit von 30 Personen mit Parkinson wird mit dem publizierten Normwert ihrer Altersgruppe verglichen. (3) 40 Personen mit Nackenschmerz werden zufällig auf Mobilisation oder Übungen verteilt, verglichen wird der Schmerz nach 6 Wochen.", o: ["1 gepaart · 2 Einstichprobe · 3 ungepaart", "1 ungepaart · 2 Einstichprobe · 3 gepaart", "1 gepaart · 2 ungepaart · 3 Einstichprobe", "1 Einstichprobe · 2 gepaart · 3 ungepaart"], right: 0,
      why: "Dieselben Personen zweimal gemessen: gepaart. Eine Stichprobe gegen einen festen Wert: Einstichprobe. Zwei unabhängige Gruppen: ungepaart." }] },
  { id: "randomisierung", kind: "pflicht", blk: "Studiendesign", t: "Beobachtungsstudie oder RCT: was der Test aussagt", href: "studiendesign/randomisierung/",
    d: "Derselbe t-Test kann in einer Beobachtungsstudie und in einem RCT dasselbe Ergebnis liefern, und trotzdem etwas anderes bedeuten. Nur wenn der Zufall die Gruppen bildet, lässt sich ein Unterschied der Behandlung zuschreiben.",
    can: "Erklären, warum ein signifikanter Unterschied im RCT auf eine Wirkung schließen lässt, in einer Beobachtungsstudie aber nur auf einen Zusammenhang.",
    deep: [["studiendesign/studienarten/", "Beobachten oder eingreifen: die Studiendesigns im Überblick"], ["studiendesign/rct/", "Das RCT Schritt für Schritt: Randomisierung, Verblindung, Drop-out"], ["regression/drittvariablen/", "Confounder: was ein Beobachtungsvergleich verzerrt"]],
    qs: [{ type: "sc", label: "Single Choice", p: "Zwei Studien finden mit einem ungepaarten t-Test signifikant weniger Knieschmerz bei Trainierenden (beide p = 0,01). In Studie A wurden die Teilnehmenden per Zufall zugeteilt. In Studie B stammen die Daten aus Praxen, in denen die Patientinnen selbst entschieden, ob sie trainieren. Welche Aussage stimmt?", o: ["Studie A spricht für eine Wirkung des Trainings, Studie B nur für einen Zusammenhang.", "Beide belegen die Wirkung gleich gut, weil der p-Wert gleich ist.", "Studie B ist aussagekräftiger, weil sie die Praxis abbildet.", "Keine der beiden sagt etwas, weil ein t-Test nie Ursachen prüft."], right: 0,
      why: "Der t-Test rechnet in beiden Studien gleich. Was der Unterschied bedeutet, entscheidet das Design: Wer selbst wählt, unterscheidet sich vielleicht in Motivation oder Schweregrad. Nur die Randomisierung verteilt solche Unterschiede gleichmäßig." }] },
  { id: "entscheidung", kind: "pflicht", blk: "Testen", t: "Entscheidungstheorie: α-Fehler, β-Fehler und Power", href: "testen/entscheidung/",
    d: "Jede Testentscheidung kann falsch sein: H0 zu Unrecht verwerfen (α-Fehler) oder einen echten Effekt übersehen (β-Fehler). Die Power ist die Wahrscheinlichkeit, einen echten Effekt zu finden.",
    can: "α-Fehler, β-Fehler und Power in einer Grafik zeigen, an einem Beispiel erklären und sagen, wie sie zusammenhängen.",
    deep: [["testen/multiples-testen/", "Multiples Testen: warum viele Tests viele Fehlalarme bringen"], ["glossar/#entscheidung-power-teststaerke", "Glossar: Power"]],
    qs: [{ type: "fig", label: "Abbildung", fig: figAlphaBeta, p: "Die Grafik zeigt die Verteilung der Prüfgröße unter H0 und unter H1 sowie den kritischen Wert. Welche Zuordnung stimmt?", o: ["Fläche 1 ist der α-Fehler, Fläche 2 der β-Fehler.", "Fläche 1 ist der β-Fehler, Fläche 2 der α-Fehler.", "Fläche 1 ist die Power, Fläche 2 der α-Fehler.", "Fläche 1 ist der α-Fehler, Fläche 2 die Power."], right: 0,
      why: "Fläche 1 liegt unter der H0-Verteilung jenseits des kritischen Werts: H0 stimmt, wird aber verworfen (α). Fläche 2 liegt unter der H1-Verteilung diesseits des kritischen Werts: Es gibt einen Effekt, er wird aber nicht gefunden (β). Die Power ist der Rest der H1-Fläche, rechts vom kritischen Wert." },
      { type: "ab", a: "Senkt man α von 5 % auf 1 %, steigt bei gleichem n die Wahrscheinlichkeit, einen echten Effekt zu übersehen.", b: "Ein nicht signifikantes Ergebnis zeigt, dass die Nullhypothese stimmt.", right: 0,
      why: "A stimmt: Eine strengere Schwelle verwirft seltener, auch wenn ein Effekt existiert; β steigt, die Power sinkt. B ist falsch: Ein nicht signifikantes Ergebnis kann auch an zu geringer Power liegen." }] },
  { id: "effektgroessen", kind: "pflicht", blk: "Grundlagen", t: "Effektgrößen: signifikant heißt nicht relevant", href: "grundlagen/effektgroessen/",
    d: "Cohen's d misst den Unterschied in Standardabweichungen, unabhängig von der Stichprobengröße. Ob ein Effekt für Patientinnen und Patienten zählt, zeigt der Vergleich mit dem kleinsten klinisch bedeutsamen Unterschied (MCID).",
    can: "Cohen's d aus Mittelwertdifferenz und Streuung einordnen und begründen, warum ein signifikantes Ergebnis klinisch irrelevant sein kann.",
    deep: [["testen/entscheidung/#info-verteilungen", "Die MCID am Beispiel Rückenschmerz"], ["grundlagen/effektgroessen/#acc-2", "Wie groß ist groß? Cohens Richtwerte"]],
    qs: [{ type: "ab", a: "Ein sehr kleiner p-Wert zeigt, dass der Effekt klinisch relevant ist.", b: "Bei sehr großer Stichprobe kann ein Unterschied unterhalb der MCID signifikant werden.", right: 1,
      why: "Der p-Wert hängt auch von n ab und sagt nichts über die Größe des Effekts. Mit genug Personen wird jeder noch so kleine Unterschied signifikant; ob er zählt, entscheidet der Vergleich mit der MCID." }] },
  { id: "fallzahl", kind: "pflicht", blk: "Testen", t: "Fallzahl und Power", href: "testen/fallzahl/",
    d: "Wie viele Personen braucht eine Studie? Fallzahl, Effekt, Streuung, α und Power hängen zusammen. Stellschrauben sind nicht nur mehr Personen, sondern auch genauere Messungen.",
    can: "Vorhersagen, wie sich die nötige Fallzahl ändert, wenn sich Effekt, Streuung, α oder Power ändern, und erklären, wie bessere Messungen den Standardfehler senken.",
    deep: [["grundlagen/effektgroessen/", "Woher der angenommene Effekt kommt: Effektgröße und MCID"]],
    qs: [{ type: "sc", label: "Single Choice", p: "Welche Maßnahme senkt den Standardfehler, ohne mehr Personen einzuschließen?", o: ["Standardisierte Messung mit einem genaueren Instrument", "α von 5 % auf 1 % senken", "einseitig statt zweiseitig testen", "einen größeren Effekt erwarten"], right: 0,
      why: "Der Standardfehler ist SD ÷ √n. Ohne n zu ändern, bleibt nur die SD: Genauere, standardisierte Messungen verringern den Messfehler und damit die Streuung. α, Richtung und erwarteter Effekt ändern den Standardfehler nicht." },
      { type: "sc", label: "Single Choice", p: "Welche Änderung erhöht die benötigte Fallzahl?", o: ["Man erwartet einen kleineren Effekt.", "Man lässt ein größeres α zu.", "Man gibt sich mit 70 % statt 80 % Power zufrieden.", "Die Messwerte streuen weniger."], right: 0,
      why: "Kleine Effekte sind schwerer vom Rauschen zu unterscheiden und brauchen mehr Personen. Die anderen drei Änderungen senken die nötige Fallzahl." }] }
];

/* ---------- Darstellung ---------- */
const KEY = "statslab-lernreise-fm1";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } };
const save = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* Speicher nicht verfügbar */ } };
let done = load();
const KIND = { pflicht: "Pflichtstation", grundlage: "Grundlage", empfehlung: "Empfehlung" };
const TYPE = { ab: "Zwei Aussagen bewerten", sc: "Single Choice", fig: "Abbildung" };
// Antwortreihenfolge fest gemischt (die richtige Antwort steht im Quelltext immer vorn), Bewertungsoptionen bleiben geordnet
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
