/* Lernreise HELPP, Biostatistik in der Versorgungsforschung · Stats Lab
   Modul Angewandte Biometrie und Statistik in den Gesundheitsberufen (M.Sc. Versorgungsforschung und -gestaltung).
   Stationen in fester Reihenfolge, gegliedert in Abschnitte (day). Fragen im Format des Antwort-Wahl-Verfahrens.
   Fortschritt nur im Browser (localStorage). Pfade relativ zu lernreisen/helpp/. */
(() => {
"use strict";
const R = "../../";

/* ---------- Abbildungen: kleine Ausgaben ---------- */
const tab = (cap, head, rows) => `<div class="qout-wrap"><table class="qout"><caption>${cap}</caption><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const figAnova = () => tab("ONEWAY ANOVA: Belastung (ZBI)", ["", "Quadratsumme", "df", "Mittel der Quadrate", "F", "Sig."], [["Zwischen den Gruppen", "1000,0", "2", "500,0", "3,47", ",038"], ["Innerhalb der Gruppen", "8208,0", "57", "144,0", "", ""], ["Gesamt", "9208,0", "59", "", "", ""]]);
const figTies = () => tab("Zufriedenheit (1 bis 5), alle Antworten sortiert", ["Antwort", "Anzahl", "Positionen"], [["2", "3", "1 bis 3"], ["3", "4", "4 bis 7"], ["4", "5", "8 bis 12"]]);

/* ---------- Stationen ---------- */
const AB = ["Ausschließlich Aussage A ist richtig.", "Ausschließlich Aussage B ist richtig.", "Beide Aussagen sind richtig.", "Keine der beiden Aussagen ist richtig."];
const STOPS = [
  { day: "Zum Auffrischen", dd: "Für alle, die mit wenig Statistik starten: Skalen, Kennwerte und der Unterschied zwischen Stichprobe und Population." },
  { id: "skalenniveaus", kind: "grundlage", blk: "Grundlagen", t: "Skalenniveaus", href: "grundlagen/skalenniveaus/",
    d: "Nominal, ordinal, metrisch: Das Skalenniveau der Zielgröße entscheidet später über das Verfahren. Eine Zufriedenheitsskala von 1 bis 5 ist geordnet, ihre Abstände sind aber nicht gleich.",
    can: "Zielgrößen aus der eigenen Berufspraxis einem Skalenniveau zuordnen.",
    deep: [["grundlagen/lage-streuung/", "Welche Kennwerte zu welchem Skalenniveau passen"]],
    qs: [{ type: "sc", label: "Zuordnung", p: "Ordnen Sie zu. (1) Pflegegrad 1 bis 5. (2) Geburtsgewicht in Gramm. (3) Geburtsmodus: spontan, vaginal-operativ, Sectio.", o: ["1 ordinal · 2 metrisch · 3 nominal", "1 metrisch · 2 metrisch · 3 ordinal", "1 nominal · 2 ordinal · 3 nominal", "1 ordinal · 2 ordinal · 3 ordinal"], right: 0,
      why: "Pflegegrade sind geordnet, aber nicht gleichabständig. Gewicht hat gleiche Abstände und einen echten Nullpunkt. Geburtsmodi haben keine natürliche Reihenfolge." }] },
  { id: "lage-streuung", kind: "grundlage", blk: "Grundlagen", t: "Lage und Streuung", href: "grundlagen/lage-streuung/",
    d: "Mittelwert oder Median, Standardabweichung oder Interquartilsabstand: welche Kennwerte die Daten fair beschreiben, besonders bei schiefen Verteilungen und Ausreißern.",
    can: "Für eine Variable passende Lage- und Streuungsmaße wählen und begründen.",
    deep: [], qs: [] },
  { id: "stichprobe", kind: "grundlage", blk: "Schätzen", t: "Stichprobe und Population", href: "schaetzen/stichprobe/",
    d: "Die Population kennt niemand, man sieht nur eine Stichprobe. Standardabweichung beschreibt die Personen, der Standardfehler die Unsicherheit des Mittelwerts.",
    can: "Standardabweichung und Standardfehler unterscheiden.",
    deep: [["schaetzen/grosse-zahlen/", "Große und kleine Zahlen: warum kleine Stichproben extreme Ergebnisse liefern"]], qs: [] },
  { day: "Teil 1: Wie ein Test entscheidet", dd: "Hypothesen, Verteilungen, Prüfgröße und p-Wert, und wie Test und Konfidenzintervall zusammenhängen." },
  { id: "binomialtest", kind: "pflicht", blk: "Testen", t: "Hypothesen und der erste Test", href: "testen/binomialtest/",
    d: "Hypothesen gerichtet oder ungerichtet formulieren, vor der Datenerhebung einen Ablehnungsbereich festlegen und das Ergebnis darin verorten. Der p-Wert als Fläche in der Verteilung unter H0.",
    can: "Aus einer Forschungsfrage H0 und H1 formulieren und den p-Wert richtig lesen.",
    deep: [["hintergrund/inferenzzyklus/", "Induktion, Deduktion und der Signifikanztest"]],
    qs: [{ type: "ab", a: "Der p-Wert ist die Wahrscheinlichkeit, dass die Nullhypothese stimmt.", b: "Der p-Wert ist die Wahrscheinlichkeit, unter H0 ein so extremes oder extremeres Ergebnis zu beobachten.", right: 1,
      why: "A ist der häufigste Irrtum: Der p-Wert wird unter der Annahme berechnet, dass H0 stimmt, er kann deshalb nicht deren Wahrscheinlichkeit sein. B ist die korrekte Definition." }] },
  { id: "z-test", kind: "pflicht", blk: "Testen", t: "Der z-Test: das Prinzip in einfach", href: "testen/z-test/",
    d: "Prüfgröße gleich Abstand in Standardfehlern: Wie viele Standardfehler liegt das Ergebnis von H0 entfernt? Der z-Test zeigt die Idee, auf der alle weiteren Tests aufbauen.",
    can: "Einen Prüfwert als Abstand in Standardfehlern lesen und mit ±1,96 vergleichen.",
    deep: [["testen/z-test/#acc-3", "z oder t?"]],
    qs: [{ type: "sc", label: "Single Choice", p: "Ein Test liefert z = 2,4. Was folgt bei zweiseitigem α = 5 %?", o: ["H0 wird verworfen, weil |z| größer als 1,96 ist.", "H0 wird beibehalten, weil z kleiner als 3 ist.", "Der Effekt ist klinisch relevant.", "Die Wahrscheinlichkeit für H1 ist 98,4 %."], right: 0,
      why: "Zweiseitig liegen die kritischen Werte bei ±1,96. 2,4 liegt außerhalb, p ist also kleiner als 0,05. Über die klinische Relevanz und die Wahrscheinlichkeit von Hypothesen sagt der Test nichts." }] },
  { id: "t-test", kind: "pflicht", blk: "Testen", t: "Die t-Test-Kaskade", href: "testen/t-test/",
    d: "Wenn die Streuung geschätzt werden muss, wird aus z ein t. Kritischer Wert, Freiheitsgrade, Richtung der Hypothese und p-Wert Schritt für Schritt.",
    can: "Vorhersagen, wie sich der kritische Wert mit α, Freiheitsgraden und Richtung ändert.",
    deep: [["testen/t-test/#ci-exkurs", "Exkurs: p-Wert oder Konfidenzintervall?"]],
    qs: [{ type: "ab", a: "Mit mehr Freiheitsgraden rückt der kritische t-Wert näher an 1,96.", b: "Ein einseitiger Test hat bei gleichem α einen weiter außen liegenden kritischen Wert als ein zweiseitiger.", right: 0,
      why: "A stimmt: Mit wachsendem n nähert sich die t-Verteilung der Normalverteilung. B ist falsch: Einseitig liegen die ganzen 5 % auf einer Seite, der kritische Wert rückt nach innen." }] },
  { id: "zgws", kind: "pflicht", blk: "Schätzen", t: "Konfidenzintervall und Test im Vergleich", href: "schaetzen/zgws/#acc-3",
    d: "Das Konfidenzintervall als Bereich der Werte, die mit den Daten vereinbar sind. Die 95 % gehören zum Verfahren, nicht zum einzelnen Intervall; liegt der Vergleichswert außerhalb, ist der Test signifikant.",
    can: "Ein Konfidenzintervall korrekt interpretieren und mit dem Testergebnis verbinden.",
    deep: [["schaetzen/zgws/#ki-mitte", "Exkurs: Ist die Mitte des Intervalls wahrscheinlicher?"]],
    qs: [{ type: "sc", label: "Single Choice", p: "Eine Studie berichtet für den Unterschied der Belastung zweier Gruppen das 95-%-KI 0,8 bis 6,4 Punkte. Was folgt für den zweiseitigen Test von H0: Unterschied = 0 bei α = 5 %?", o: ["Signifikant, weil die 0 nicht im Intervall liegt.", "Nicht signifikant, weil das Intervall breit ist.", "Ohne p-Wert lässt sich nichts sagen.", "Signifikant nur, wenn das Intervall die 1 nicht enthält."], right: 0,
      why: "95-%-KI und zweiseitiger Test mit α = 5 % sind zwei Seiten derselben Rechnung: Liegt der H0-Wert außerhalb, ist p < 0,05. Die 1 ist nur bei Verhältnissen wie RR oder OR der Bezugswert." }] },
  { id: "entscheidung", kind: "pflicht", blk: "Testen", t: "α-Fehler, β-Fehler und Power", href: "testen/entscheidung/",
    d: "Jede Testentscheidung kann falsch sein. Die Power ist die Wahrscheinlichkeit, einen echten Effekt zu finden, und hängt von Effekt, Streuung, α und Fallzahl ab.",
    can: "α-Fehler, β-Fehler und Power an einem Beispiel erklären.",
    deep: [["testen/fallzahl/", "Fallzahl und Power: wie viele Personen braucht eine Studie?"]],
    qs: [{ type: "ab", a: "Ein nicht signifikantes Ergebnis zeigt, dass die Intervention nicht wirkt.", b: "Bei kleiner Fallzahl kann ein echter Effekt leicht übersehen werden.", right: 1,
      why: "A ist falsch: Nicht signifikant kann auch zu wenig Power bedeuten. B stimmt: Bei kleinem n ist die Power gering, der β-Fehler groß." }] },
  { day: "Teil 2: Unterschiede bei zwei und mehr Gruppen", dd: "Für metrische, ordinale und kategoriale Zielgrößen, unabhängig oder gepaart, und wie man das passende Verfahren findet." },
  { id: "verfahrenswahl", kind: "pflicht", blk: "Auswertung planen und berichten", t: "Welches Verfahren passt?", href: "auswertung/verfahrenswahl/",
    d: "Drei Fragen führen zum Verfahren: Skalenniveau der Zielgröße, Datenstruktur und Vergleich. Mit Fallbeispielen und typischen Fehlern; die Landkarte für den ganzen Teil 2.",
    can: "Für eine Forschungsfrage das Verfahren wählen und begründen.",
    deep: [["auswertung/verfahrenswahl/#acc-3", "Die Übersicht: Zielgröße und Datenstruktur auf einen Blick"]],
    qs: [{ type: "sc", label: "Zuordnung", p: "Ordnen Sie zu. (1) Zufriedenheit (1 bis 5) von Eltern nach Hebammenbetreuung zu Hause gegen in der Klinik. (2) Belastung (ZBI, 0 bis 88) pflegender Angehöriger in drei Versorgungsformen. (3) Anteil der Kinder mit Stillbeginn in der ersten Stunde, Kreißsaal gegen Geburtshaus.", o: ["1 Mann-Whitney-U · 2 einfaktorielle ANOVA · 3 Chi-Quadrat-Test", "1 ungepaarter t-Test · 2 drei t-Tests · 3 Chi-Quadrat-Test", "1 Wilcoxon · 2 Kruskal-Wallis · 3 Mann-Whitney-U", "1 Chi-Quadrat-Test · 2 einfaktorielle ANOVA · 3 ungepaarter t-Test"], right: 0,
      why: "Ein einzelnes Likert-Item ist ordinal: Mann-Whitney-U. Ein metrischer Summenscore in drei Gruppen: ANOVA statt dreier t-Tests. Ein Anteil in zwei Gruppen: Vierfeldertafel mit Chi-Quadrat-Test." }] },
  { id: "t-test-varianten", kind: "pflicht", blk: "Testen", t: "Welcher t-Test?", href: "testen/t-test-varianten/",
    d: "Einstichproben-, gepaarter und ungepaarter t-Test: dieselbe Logik, andere Fragen. Mit dem Messpraktikum und einem Vorher-nachher-Vergleich mit Kontrolle.",
    can: "Für ein Design den passenden t-Test wählen und in SPSS rechnen.",
    deep: [["testen/t-test-varianten/#acc-3", "Übung: Vorher-nachher mit Kontrolle"], ["hintergrund/regression-mitte/", "Regression zur Mitte"]],
    qs: [{ type: "sc", label: "Single Choice", p: "Die Sprechverständlichkeit von 18 Kindern wird vor und nach acht Wochen Logopädie mit einem metrischen Score gemessen. Welcher Test passt?", o: ["gepaarter t-Test", "ungepaarter t-Test", "Einstichproben-t-Test gegen den Normwert", "Chi-Quadrat-Test"], right: 0,
      why: "Dieselben Kinder werden zweimal gemessen, die Messungen sind gepaart. Ohne Kontrollgruppe bleibt offen, ob die Therapie oder die Entwicklung der Kinder die Veränderung erklärt." }] },
  { id: "anova", kind: "pflicht", blk: "Testen", t: "Mehr als zwei Gruppen: einfaktorielle ANOVA", href: "testen/anova/",
    d: "Belastung pflegender Angehöriger in drei Versorgungsformen. Warum drei t-Tests α aufblähen, wie die Varianzanalyse die Streuung zerlegt und wie Post-hoc-Vergleiche die Unterschiede finden.",
    can: "Eine ANOVA-Tabelle lesen, F und η² erklären und Post-hoc-Vergleiche korrekt einsetzen.",
    deep: [["testen/multiples-testen/", "Multiples Testen und α-Korrektur"], ["regression/bestimmtheitsmass/", "Streuungszerlegung und R²"]],
    qs: [{ type: "fig", label: "Output lesen", fig: figAnova, p: "Welche Aussage zur SPSS-Ausgabe ist richtig?", o: ["Mindestens zwei Versorgungsformen unterscheiden sich; welche, zeigen erst Post-hoc-Vergleiche.", "Alle drei Versorgungsformen unterscheiden sich signifikant voneinander.", "Die Versorgungsform erklärt 38 % der Streuung.", "Weil F größer als 1 ist, ist das Ergebnis signifikant."], right: 0,
      why: "p = 0,038 heißt: Die Gruppenmittel sind nicht alle gleich. Welche sich unterscheiden, sagt F nicht. η² = 1000 ÷ 9208 = 0,11, also 11 %. F > 1 allein reicht nicht; entscheidend ist der Vergleich mit dem kritischen Wert bzw. p." }] },
  { id: "rangtests", kind: "pflicht", blk: "Testen", t: "Rangtests für ordinale Daten", href: "testen/rangtests/",
    d: "Mann-Whitney-U, Wilcoxon und Kruskal-Wallis an Beispielen aus Hebammenwesen, Logopädie und Ergotherapie: aus Werten werden Ränge, gleiche Werte teilen sich den mittleren Rang.",
    can: "Für ordinale Zielgrößen den passenden Rangtest wählen, Bindungen erklären und das Ergebnis mit Median und Effektstärke berichten.",
    deep: [["testen/rangtests/#acc-4", "Welcher Test, was er prüft und wie man berichtet"]],
    qs: [{ type: "fig", label: "Rechnen", fig: figTies, p: "Welchen Rang erhalten die fünf Personen mit der Antwort 4?", o: ["jeweils 10", "8, 9, 10, 11 und 12", "jeweils 4", "jeweils 12"], right: 0,
      why: "Gleiche Werte (Bindungen) teilen sich den Mittelwert ihrer Positionen: (8 + 9 + 10 + 11 + 12) ÷ 5 = 10. So bekommt niemand zufällig einen höheren Rang als eine andere Person mit derselben Antwort." },
      { type: "ab", a: "Der Wilcoxon-Test ist das Gegenstück zum gepaarten t-Test, der Kruskal-Wallis-Test das Gegenstück zur einfaktoriellen ANOVA.", b: "Rangtests setzen voraus, dass die Zielgröße normalverteilt ist.", right: 0,
      why: "A stimmt. B ist falsch: Rangtests brauchen keine Normalverteilung, aber unabhängige Beobachtungen (beim Wilcoxon unabhängige Paare)." }] },
  { id: "chi-quadrat", kind: "pflicht", blk: "Testen", t: "Kategoriale Daten: Chi-Quadrat-Test", href: "testen/chi-quadrat/",
    d: "Beobachtete gegen erwartete Häufigkeiten in einer Kreuztabelle. Der Test sagt, ob ein Zusammenhang besteht; wie groß er ist, zeigen Risikodifferenz, Risikoverhältnis und Odds Ratio.",
    can: "Erwartete Häufigkeiten erklären, den Chi-Quadrat-Test lesen und eine passende Effektgröße berichten.",
    deep: [["grundlagen/risiko-odds/#acc-2", "Die Vierfeldertafel: RD, NNT, RR und OR berichten"]],
    qs: [{ type: "ab", a: "Der Chi-Quadrat-Test vergleicht beobachtete Häufigkeiten mit den Häufigkeiten, die bei Unabhängigkeit zu erwarten wären.", b: "Ein großer Chi-Quadrat-Wert zeigt einen klinisch großen Unterschied.", right: 0,
      why: "A stimmt. B ist falsch: Chi-Quadrat wächst mit der Fallzahl. Wie groß der Unterschied ist, zeigen RD, RR oder OR mit Konfidenzintervall." }] },
  { id: "risiko-odds", kind: "grundlage", blk: "Grundlagen", t: "Risiko, Odds und Odds Ratio", href: "grundlagen/risiko-odds/",
    d: "Zwei Sprachen für dasselbe: Risiko und Odds. Aus der Vierfeldertafel folgen Risikodifferenz, NNT, Risikoverhältnis und Odds Ratio.",
    can: "RD, NNT, RR und OR aus einer Vierfeldertafel berechnen und lesen.",
    deep: [["studiendesign/fall-kontrolle/", "Fall-Kontroll-Studie: warum dort nur das OR geht"]], qs: [] },
  { id: "effektgroessen", kind: "pflicht", blk: "Grundlagen", t: "Effektgrößen: signifikant heißt nicht relevant", href: "grundlagen/effektgroessen/",
    d: "Cohen's d, η², r und der kleinste klinisch bedeutsame Unterschied. Mit genug Personen wird jeder Unterschied signifikant; ob er für die Versorgung zählt, zeigt die Effektgröße.",
    can: "Eine passende Effektgröße wählen und signifikant von relevant unterscheiden.",
    deep: [["grundlagen/effektgroessen/#acc-2", "Wie groß ist groß? Cohens Richtwerte"]],
    qs: [{ type: "sc", label: "Single Choice", p: "Eine Routinedatenanalyse mit 40.000 Versicherten findet einen signifikanten Unterschied von 0,3 Punkten auf einer Lebensqualitätsskala (p < 0,001). Die kleinste klinisch bedeutsame Differenz liegt bei 5 Punkten. Wie ist das Ergebnis einzuordnen?", o: ["Statistisch signifikant, aber klinisch nicht relevant.", "Klinisch relevant, weil p sehr klein ist.", "Nicht interpretierbar, weil die Stichprobe zu groß ist.", "Ein Hinweis auf einen großen Effekt."], right: 0,
      why: "Bei sehr großen Stichproben wird auch ein winziger Unterschied signifikant. 0,3 Punkte liegen weit unter der MCID; für die Versorgung spielt der Unterschied keine Rolle." }] },
  { id: "multiples-testen", kind: "empfehlung", blk: "Testen", t: "Multiples Testen", href: "testen/multiples-testen/",
    d: "Viele Tests, viele Fehlalarme: Bonferroni, Holm und Benjamini-Hochberg, und warum Subgruppenanalysen mit Vorsicht zu lesen sind.",
    can: "Erklären, warum viele Tests korrigiert werden müssen, und eine Korrektur anwenden.",
    deep: [], qs: [] },
  { day: "Teil 3: Confounding und Effektmodifikation", dd: "Warum ein Unterschied nicht immer eine Wirkung ist, und wie man Drittvariablen in der Analyse berücksichtigt." },
  { id: "studienarten", kind: "grundlage", blk: "Studiendesign", t: "Beobachten oder eingreifen", href: "studiendesign/studienarten/",
    d: "Querschnitt, Kohorte, Fall-Kontrolle und RCT im Überblick: Welches Design erlaubt welche Aussage?",
    can: "Ein Design einordnen und seine Stärken und Schwächen nennen.",
    deep: [], qs: [] },
  { id: "randomisierung", kind: "pflicht", blk: "Studiendesign", t: "Warum randomisieren?", href: "studiendesign/randomisierung/",
    d: "Derselbe Test kann im RCT eine Wirkung belegen und in einer Beobachtungsstudie nur einen Zusammenhang. Nur der Zufall verteilt bekannte und unbekannte Confounder gleichmäßig.",
    can: "Erklären, warum ein signifikanter Unterschied im RCT anders zu lesen ist als in einer Beobachtungsstudie.",
    deep: [["studiendesign/randomisierung/#acc-4", "Und wenn kein RCT möglich ist?"]],
    qs: [{ type: "ab", a: "In einer Routinedatenanalyse haben Versicherte mit Heilmittelverordnung seltener Krankenhausaufenthalte. Daraus folgt, dass Heilmittel Krankenhausaufenthalte verhindern.", b: "Ein solcher Unterschied kann auch daran liegen, dass gesündere oder besser versorgte Menschen häufiger Heilmittel erhalten.", right: 1,
      why: "A schließt aus einem Zusammenhang auf eine Wirkung. B benennt Confounding: Wer eine Verordnung erhält, unterscheidet sich vielleicht schon vorher. Nur Randomisierung oder sorgfältige Adjustierung schützen davor." }] },
  { id: "drittvariablen", kind: "pflicht", blk: "Zusammenhänge und Regression", t: "Drittvariablen: Confounder, Mediator, Collider", href: "regression/drittvariablen/",
    d: "Eine Drittvariable kann einen Zusammenhang vortäuschen, übertragen oder verzerren. Ob man für sie adjustiert, hängt von ihrer Rolle im Pfeildiagramm ab.",
    can: "Confounder, Mediator und Collider unterscheiden und entscheiden, wofür adjustiert wird.",
    deep: [["regression/drittvariablen/#acc-4", "Adjustieren oder nicht?"]],
    qs: [{ type: "sc", label: "Single Choice", p: "Eine Studie untersucht, ob häusliche Pflegeberatung Stürze reduziert. Ältere Menschen erhalten häufiger Beratung und stürzen auch häufiger. Welche Rolle spielt das Alter?", o: ["Confounder: Es beeinflusst Beratung und Stürze und muss berücksichtigt werden.", "Mediator: Die Beratung wirkt über das Alter.", "Collider: Für das Alter darf nicht adjustiert werden.", "Keine: Das Alter ist für die Frage unerheblich."], right: 0,
      why: "Das Alter wirkt auf beides, die Exposition (Beratung) und das Ergebnis (Stürze). Ohne Adjustierung kann es den Zusammenhang verzerren oder sogar umkehren." }] },
  { id: "multiple-regression", kind: "pflicht", blk: "Zusammenhänge und Regression", t: "Adjustieren: multiple Regression", href: "regression/multiple-regression/",
    d: "Mehrere Einflüsse zugleich: Der Koeffizient einer Variable gilt dann bei gleichen Werten der anderen. So wird für Confounder adjustiert; ANOVA und t-Test sind Sonderfälle dieses Modells.",
    can: "Einen adjustierten Koeffizienten lesen und vom unadjustierten unterscheiden.",
    deep: [["regression/multiple-regression/#acc-3", "Koeffizienten lesen"]],
    qs: [{ type: "ab", a: "Ein adjustierter Koeffizient beschreibt den Zusammenhang bei gleichen Werten der übrigen Variablen im Modell.", b: "Mit Adjustierung lässt sich in einer Beobachtungsstudie jedes Confounding sicher ausschließen.", right: 0,
      why: "A stimmt. B ist falsch: Adjustiert wird nur für gemessene Variablen. Unbekannte oder schlecht gemessene Confounder bleiben (Restconfounding)." }] },
  { id: "wechselwirkungen", kind: "pflicht", blk: "Zusammenhänge und Regression", t: "Effektmodifikation: Wechselwirkungen", href: "regression/wechselwirkungen/",
    d: "Wenn der Effekt von einer dritten Größe abhängt, etwa eine Intervention nur bei hohem Pflegegrad wirkt. In der Epidemiologie heißt das Effektmodifikation, in der Regression Wechselwirkung.",
    can: "Effektmodifikation von Confounding unterscheiden und einen Wechselwirkungsterm lesen.",
    deep: [["regression/wechselwirkungen/#acc-4", "Lesen, berichten, rechnen"]],
    qs: [{ type: "ab", a: "Ein Confounder verzerrt den Effekt und wird herausgerechnet; ein Effektmodifikator verändert den Effekt und wird berichtet, etwa getrennt nach Subgruppen.", b: "Effektmodifikation liegt vor, wenn eine Variable mit Exposition und Ergebnis zusammenhängt.", right: 0,
      why: "A stimmt: Confounding ist eine Verzerrung, Effektmodifikation ein echter Befund. B beschreibt eher einen Confounder; Effektmodifikation heißt, dass der Effekt je nach Ausprägung der dritten Variable verschieden groß ist." }] },
  { day: "Zum Abschluss", dd: "Vom Output zum Text: was in den Projektbericht gehört." },
  { id: "ergebnisse-berichten", kind: "pflicht", blk: "Auswertung planen und berichten", t: "Ergebnisse berichten", href: "auswertung/ergebnisse-berichten/",
    d: "Sechs Bausteine eines Ergebnissatzes, SPSS-Ausgaben Zelle für Zelle lesen und eine Checkliste für Methoden- und Ergebnisteil nach CONSORT und STROBE.",
    can: "Einen vollständigen Ergebnissatz schreiben und einen Ergebnisteil mit der Checkliste prüfen.",
    deep: [["auswertung/ergebnisse-berichten/#acc-4", "Checkliste für den Projektbericht"]],
    qs: [{ type: "sc", label: "Single Choice", p: "„Die Pflegeberatung senkte die Belastung signifikant (p = 0,03).“ Was fehlt vor allem?", o: ["Effekt in der Einheit der Zielgröße mit Konfidenzintervall", "Die Teststatistik mit Freiheitsgraden", "Der p-Wert mit vier Nachkommastellen", "Nichts, der Satz ist vollständig."], right: 0,
      why: "Ohne Effekt und Konfidenzintervall bleibt offen, wie groß der Unterschied ist und ob er für die Versorgung zählt." }] }
];

/* ---------- Darstellung ---------- */
const KEY = "statslab-lernreise-helpp";
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
        ${s.deep.length ? `<div class="deeper"><span class="lbl">Zur Vertiefung</span><ul>${s.deep.map(([h, t]) => `<li><a href="${R}${h}">${t}</a></li>`).join("")}</ul></div>` : ""}
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
