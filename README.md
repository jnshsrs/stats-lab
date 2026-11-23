# Stats Lab

Interaktive Visualisierungen für die Statistiklehre in den Gesundheits- und Therapiewissenschaften.

## Visualisierungen

| Seite | Inhalt |
|---|---|
| [`grundlagen/skalenniveaus/`](grundlagen/skalenniveaus/) | Skalenniveaus in drei Reitern: vier Stufen animiert mit Tabelle der erlaubten Operationen; Kniewinkel nach Neutral-Null-Methode mit verschiebbarer Nulllinie (Stellung = Intervall, Bewegungsumfang = Verhältnis); Hop-Tests mit LSI bei verschobener Null und Timed Hop mit der Falle „21 % schneller“, Logarithmus als Exkurs |
| [`grundlagen/lage-streuung/`](grundlagen/lage-streuung/) | Lage und Streuung: Mittelwert als Schwerpunkt, Median, Quartile mit Boxplot und IQR, Varianz als Abweichungsquadrate mit n − 1 oder n, Standardabweichung; ziehbare Punkte, Datensätze symmetrisch, schief, mit Ausreißer |
| [`grundlagen/wahrscheinlichkeit/`](grundlagen/wahrscheinlichkeit/) |  Wahrscheinlichkeit als Fläche in drei Reitern: Multiplikationssatz im Einheitsquadrat (Würfel und Münze), bedingte Wahrscheinlichkeit als flächentreues Venn-Diagramm (Mikrozensus 2024: Ehe und Kinder) und Satz von Bayes als Venn-Diagramm (Beispiel Leberzirrhose). Direkt verlinkbar über `#multiplikation`, `#bedingt`, `#bayes` |
| [`grundlagen/risiko-odds/`](grundlagen/risiko-odds/) | Risiko, Odds und Odds Ratio: Risiko gegen Odds mit 100er-Raster und Kurve, Vierfeldertafel mit RD, NNT, RR und OR, Abweichung OR gegen RR in Abhängigkeit vom Ausgangsrisiko, Fall-Kontroll-Studie mit wählbarer Zahl an Kontrollen (OR bleibt, RR nicht). |
| [`grundlagen/binomial/`](grundlagen/binomial/) | Pascal und die Binomialverteilung: Galton-Brett mit Pascalschem Dreieck, Histogramm gegen Binomialverteilung, Beispiel Therapieerfolg |
| [`grundlagen/verteilungen/`](grundlagen/verteilungen/) | Diskret und stetig: Binomialverteilung neben Normal-, t- und Exponentialverteilung, je Wahrscheinlichkeits- bzw. Dichtefunktion und Verteilungsfunktion, mit Wahrscheinlichkeitsrechner |
| [`grundlagen/effektgroessen/`](grundlagen/effektgroessen/) | Effektgrößen: Cohen's d mit Reglern für Differenz und SD, Überlappung und Überlegenheitswahrscheinlichkeit; Cohens Richtwerte als kleine Vielfache und MCID; signifikant gegen relevant mit zwei Studien und wählbarem n (KI gegen MCID); Übersicht aller Effektgrößen mit Links. |
| [`studiendesign/studienarten/`](studiendesign/studienarten/) | Beobachten oder eingreifen. Querschnitt, Kohorte, Fall-Kontrolle und RCT auf einer Zeitachse mit Steckbrief (Ausgangspunkt, Blickrichtung, Kennzahl, Stärke, Schwäche, Physio-Beispiel), Vergleichstabelle, Hinweis zur Evidenzpyramide, Übung mit fünf Forschungsfragen. |
| [`schaetzen/stichprobe/`](schaetzen/stichprobe/) | Stichprobe und Population: feste Population aus 2.000 fiktiven Personen (Bizepsumfang), Stichproben ohne Zurücklegen, gezogene Personen in der Punktwolke, letzte acht Stichproben mit x̄ und Stichprobenfehler, Streuung der Personen (σ) gegen Streuung der Mittelwerte (SE) auf gleicher Achse, σ und σ/√n gegen n; dieselbe Population als Excel, SPSS und Syntax in `stichprobe/daten/` |
| [`schaetzen/grosse-zahlen/`](schaetzen/grosse-zahlen/) | Gesetz der großen Zahlen (laufender Erfolgsanteil von fünf Praxen mit 95-%-Trichter, absolute Abweichung wächst) und Falle der kleinen Zahlen nach Wainer (2007): 800 fiktive Countys mit gleicher wahrer Rate, höchste und niedrigste Raten auf dem Land, Funnel-Plot, Wechsel der Spitzengruppe von Jahr zu Jahr |
| [`schaetzen/zgws/`](schaetzen/zgws/) | Grenzwertsatz, Standardfehler, Konfidenzintervall: vier Populationen, gemeinsame Regler, drei aufklappbare Abschnitte |
| [`testen/binomialtest/`](testen/binomialtest/) | Binomialtest: Ablehnungsbereich von außen nach innen aufbauen (animiert), tatsächliches α, Verteilungsfunktion als Treppe mit kritischen Werten, Tabelle, p-Wert Schritt für Schritt; zwei- oder rechtsseitig |
| [`testen/t-test/`](testen/t-test/) | Die t-Test-Kaskade am Einstichproben-t-Test (Knie-TEP gegen fiktives 90°-Kriterium): Rohdaten, Hypothesen, Signal und Rauschen, t-Verteilung, kritischer Wert und p-Wert, Vergleichstabelle der drei Richtungen, Schritt 3 mit Simulation unter H0, verschiebbarer Grenze, t-Tabelle und Verteilungsfunktion (#calc). Richtung zweiseitig, rechtsseitig, linksseitig umschaltbar. |
| [`testen/t-test-varianten/`](testen/t-test-varianten/) | Welcher t-Test? Ausgangspunkt Einstichproben-Test mit Verweis auf die Kaskade, dann gepaart (Bizeps vorher/nachher, mit Kontrast ungepaart) und ungepaart (Parkinson, mit Welch). Je Test Richtungsschalter, Herleitung von p nur per Verweis.; Übung Vorher-nachher mit Kontrollarm (Differenz der Differenzen) mit fiktivem Bizeps-Datensatz (CSV, SAV), fünf Schritten mit aufklappbaren Lösungen und SPSS-Weg. |
| [`testen/entscheidung/`](testen/entscheidung/) | Entscheidungstheorie: H0/H1 mit α, β und Power, Entscheidungsmatrix, Simulator für 100 Studien (#studien, mit und ohne Effekt), Power-Kurve mit Fallzahl für 80 %, Gedankenexperiment zu den Kosten von α- und β-Fehlern (QALY, Euro) mit günstigstem α, Verständnis-Check |
| [`testen/multiples-testen/`](testen/multiples-testen/) | Multiples Testen in fünf Stufen: 20er-Würfel als Bild für α, simulierte t-Tests ohne Effekt mit FWER-Kurve 1 − 0,95^k und p-Histogramm, Bonferroni, Power-Verlust durch Korrektur, Holm und Benjamini-Hochberg mit sortierten p-Werten und Vergleich von FWER, FDR und Power |
| [`testen/fallzahl/`](testen/fallzahl/) | Fallzahl und Power: Rechner für n, Power, kleinsten entdeckbaren Effekt oder α (t-Test zwei Gruppen, gepaart, zwei Anteile), Drop-out, Methodensatz, Power-Kurve, Sensitivitätstabelle |
| [`testen/chi-quadrat/`](testen/chi-quadrat/) | Der Chi-Quadrat-Test auf Unabhängigkeit: editierbare Kreuztabelle, Mosaik, erwartete Häufigkeiten, Zellbeiträge, χ²-Verteilung mit p-Wert, Cramérs V, Simulation unter H0 |
| [`hintergrund/regression-mitte/`](hintergrund/regression-mitte/) | Regression zur Mitte: Schmerzverlauf einer Person mit Termin an einem schlechten Tag, Praxis-Simulation mit Warteliste und einstellbarem Therapieeffekt, Galtons Originaldaten (HistData::GaltonFamilies, in cm) mit Auswahlband in beide Richtungen |
| [`hintergrund/mammografie/`](hintergrund/mammografie/) | Exkurs Positiver Befund: Gigerenzers Mammografie-Aufgabe mit Quiz, Häufigkeitsbaum absolut oder als Wahrscheinlichkeiten, Szenarien (Gigerenzer 2007, Eddy 1982, Tastbefund, seltener Krebs), Regler für Prävalenz, Sensitivität und Falsch-positiv-Rate; verlinkt vom Bayes-Reiter Zweiter Rechenweg über Likelihood-Ratios (#likelihood) mit Fagan-Nomogramm. SnNout/SpPin ist nach klinische-tests/ umgezogen. |
| [`hintergrund/klinische-tests/`](hintergrund/klinische-tests/) | Klinische Tests: Gütekriterien mit Zielscheiben, Vertiefung Kappa (inkl. Prävalenz-Paradox) und ICC/SEM/MDC, Vierfeldertafel mit Lachman, Pivot-Shift, SLR, gekreuztem SLR, Ottawa Ankle Rules, Likelihood-Ratios und Fagan-Nomogramm (assets/js/fagan.js), SnNout/SpPin (#snnout-sppin), Testtabelle mit Quellen. |
| [`hintergrund/inferenzzyklus/`](hintergrund/inferenzzyklus/) | Induktion, Deduktion und der Signifikanztest: Poppers Perspektive in fünf Schritten, Schwan-Experiment, Modus tollens und die Frage, ob Induktion und Inferenz dasselbe sind |
| [`regression/korrelation/`](regression/korrelation/) | Zusammenhang und Korrelation mit den FEV-Daten (654 Kinder, `regression-daten/`): Streudiagramm nach Größe oder Alter, Kovarianz als Rechtecke mit ziehbaren Punkten und Ausreißer, Gefühl für r per Simulation, Störgröße Alter beim Rauchen. Rechenmodul `assets/js/reg.js`. |
| [`regression/gerade/`](regression/gerade/) | Die beste Gerade. Story Sollwert der Lungenfunktion: Mittelwert, Gruppenmittel, Gerade im Vergleich; kleinste Quadrate mit Reglern, Residuenquadraten und Quadratsummen-Balken; Gerade lesen, Vorhersage, % vom Soll, Extrapolation. |
| [`regression/normbereich/`](regression/normbereich/) | Wie sicher ist der Sollwert? Stichprobenverteilung der Steigung (auch unter H₀), t-Test und KI für b₁, Konfidenz- gegen Vorhersageband, untere Normgrenze (fest, relativ über log) gegen 80-%-Regel mit Anteilen je Größengruppe. |
| [`regression/bestimmtheitsmass/`](regression/bestimmtheitsmass/) | Wie viel erklärt die Gerade? Streuungszerlegung an 25 Kindern, R² und Wertebereich, ANOVA-Tabelle für Gerade, Größenklassen und Rauchen (F = t², η²), standardisierte Regression und Regression zur Mitte. |
| [`regression/diagnostik/`](regression/diagnostik/) | Passt das Modell? Anscombe-Quartett mit Residuenplot, Residuen- und Q-Q-Plot der FEV-Daten (linear gegen ln), Hebelwert und Cook-Distanz mit ziehbarem Punkt, Checkliste mit SPSS-Hinweis. |
| [`regression/multiple-regression/`](regression/multiple-regression/) | Mehrere Einflüsse zugleich. Rauch-Effekt in fünf Modellen (roh, + Alter, + Größe, + Geschlecht, ln) mit Koeffiziententabelle und Effektplot, Ausblick auf Wechselwirkungen (eigene Station). |
| [`regression/drittvariablen/`](regression/drittvariablen/) | Drittvariablen: Confounder, Mediator, Collider. Pfeildiagramme (DAG); Confounder Alter bei Rauchen und FEV (roh, Altersgruppen, adjustiert), Mediator Größe zwischen Alter und FEV (totaler, direkter, indirekter Effekt, Fenster gleicher Größe), Collider Überweisung bei Alpha-Winkel und Schmerz (simuliert, Auswahl und Adjustierung erzeugen Scheinzusammenhang), Entscheidungstabelle, Mediator vs. Moderator. |
| [`regression/wechselwirkungen/`](regression/wechselwirkungen/) | Wechselwirkungen. Zwei Gruppen mal zwei Gruppen (Geschlecht × Altersgruppe) mit Interaktionsdiagramm und Differenz der Differenzen (Brücke zur Bizeps-Übung), Alter × Geschlecht mit Zentrier-Regler (aus der multiplen Regression verschoben), Alter × Größe mit bedingten Steigungen und roher gegen zentrierte Kodierung, Regeln zum Lesen und Berichten, Subgruppen-Fehlschluss, Fallzahl, SPSS. |
| [`logistische-regression/s-kurve/`](logistische-regression/s-kurve/) | Von der Geraden zur S-Kurve. Rauchen nach Alter (FEV-Daten): Gerade durch die 0/1-Rohdaten gegen S-Kurve, Herleitung p = 1/(1 + e^−Logit) aus dem linearen Logit-Modell, zwei Diagramme (Alter → Logit, Alter → p) mit Umrechnungsformel dazwischen, Rise-over-Run-Tabelle (Logit konstant, p variabel, Odds-Faktor konstant = OR), Exkurs Maximum Likelihood mit Beispieltabelle (Produkt gegen Log-Summe), Likelihood-Ratio-Test, SPSS-Tabelle. |
| [`logistische-regression/cam-morphologie/`](logistische-regression/cam-morphologie/) | Cam-Morphologie und Knorpeldefekt. Lehrdatensatz (simuliert, angelehnt an Heerey et al. 2021) mit Download als CSV und SPSS, Alpha-Winkel nach Defekt, Vierfeldertafel Cam ja/nein, logistische Regression mit OR pro 1/5/10 Grad und SPSS-Tabelle, Adjustierung für Schmerz mit Wechselwirkung, Ergebnissatz und Checkliste. |

## Aufbau

```
index.html            Hauptseite mit allen Visualisierungen
assets/css/theme.css  Theme: Schriften, Palette, Farbrollen, Dunkelmodus
assets/css/base.css   Gemeinsames Layout: Kopfzeile, Typografie, Footer
assets/fonts/         Geist, Geist Mono und IBM Plex (nur Griechisch), lokal eingebunden
assets/img/           Favicon
t-test/               Eine Visualisierung = ein Ordner mit index.html, CSS und JS
```

Keine Abhängigkeiten, kein Build-Schritt, keine externen Ressourcen. Die Seiten laufen direkt aus dem Repo, auch lokal per Doppelklick auf `index.html`.

## Neue Visualisierung hinzufügen

1. Ordner `t-test/` kopieren und umbenennen, zum Beispiel `konfidenzintervall/`.
2. In der neuen `index.html` Titel und Inhalte anpassen. `../assets/css/base.css` bleibt eingebunden, damit Theme, Kopfzeile und Footer einheitlich sind. In der Seite nur Variablen wie `var(--therapie)` verwenden, keine festen Farbwerte.
3. In der Hauptseite `index.html` eine weitere Karte im Block `<div class="grid">` ergänzen.

## Gestaltung anpassen

Farben und Schriften stehen ausschließlich in `assets/css/theme.css`. Alle Seiten laden diese Datei über `base.css`, Änderungen wirken sofort überall.

- **Farbschema wechseln:** die sechs Werte `--pal-1` bis `--pal-6` ersetzen (aktuell ColorBrewer PuBu, hell nach dunkel). Wer Rollen anders verteilen will, passt den Block „Bedeutungen“ an, etwa welche Farbe für Kontrolle, Therapie, α, β und Power steht.
- **Schrift wechseln:** die woff2-Dateien nach `assets/fonts/` legen, die `@font-face`-Einträge oben in `theme.css` anpassen und den Namen in `--font-sans` bzw. `--font-mono` eintragen.
- **Dunkelmodus:** Die Seiten sind immer hell. Die dunklen Werte stehen am Ende von `theme.css` und lassen sich über `data-theme="dark"` oder wieder per Systemeinstellung aktivieren.
- **Ausnahme:** `assets/img/favicon.svg` ist eine eigene Bilddatei und wird bei einem Farbwechsel von Hand angepasst.

Aktuell: Palette ColorBrewer PuBu, Schrift Geist und Geist Mono (SIL OFL), griechische Buchstaben aus IBM Plex Sans (SIL OFL), da Geist keine enthält.

## Cache und Versionsnummer

GitHub Pages erlaubt Browsern, CSS und JS zehn Minuten zwischenzuspeichern. Damit Änderungen sofort ankommen, hängen alle Verweise auf eigene CSS- und JS-Dateien eine Versionsnummer an (`?v=…`), ebenso der `@import` von `theme.css` in `base.css`. Nach Änderungen an CSS oder JS die Nummer überall erhöhen, zum Beispiel per Suchen und Ersetzen.

## Veröffentlichen mit GitHub Pages

Settings → Pages → Source: „Deploy from a branch“, Branch `main`, Ordner `/ (root)`. Die Seite ist danach unter `https://jnshsrs.github.io/stats-lab/` erreichbar.

## Lernpfad

Reihenfolge und Blöcke stehen zentral in `assets/js/path.js`. Jede Station liegt im Ordner ihres Blocks: `grundlagen/`, `studiendesign/`, `schaetzen/`, `testen/`, `hintergrund/`, `regression/`, `logistische-regression/`, also etwa `regression/korrelation/`. Unter den alten Adressen ohne Block (etwa `korrelation/`) liegen Weiterleitungen, damit verteilte Links weiter funktionieren; die Block-Ordner selbst leiten auf den passenden Abschnitt der Startseite. Daraus entsteht unten auf jeder Seite die Leiste „Zurück / Weiter“. Wer eine Seite ergänzt, trägt sie dort ein und legt auf der Startseite die Karte im passenden Block an.

## Glossar

`glossar/` erklärt die Fachbegriffe kapitelweise in der Reihenfolge des Lernpfads, mit Suche und einem Anker je Begriff (z. B. `glossar/#binomialtest-p-wert`). Jede Seite verlinkt in der Lernpfad-Leiste auf ihr Kapitel (`glossar/#k-<seite>`), der Link „Glossar“ steht in der Kopfzeile aller Seiten.

`assets/vendor/katex/` enthält KaTeX 0.16.11 (MIT-Lizenz, lokal eingebunden, ohne externe Abrufe) für LaTeX-Formeln, derzeit auf `binomial/` und `binomialtest/` (Rechenweg Schritt 3).
