# Stats Lab

Interaktive Visualisierungen für die Statistiklehre in den Gesundheits- und Therapiewissenschaften.

## Visualisierungen

| Seite | Inhalt |
|---|---|
| [`skalenniveaus/`](skalenniveaus/) | Skalenniveaus in drei Reitern: vier Stufen animiert mit Tabelle der erlaubten Operationen; Kniewinkel nach Neutral-Null-Methode mit verschiebbarer Nulllinie (Stellung = Intervall, Bewegungsumfang = Verhältnis); Hop-Tests mit LSI bei verschobener Null und Timed Hop mit der Falle „21 % schneller“, Logarithmus als Exkurs |
| [`lage-streuung/`](lage-streuung/) | Lage und Streuung: Mittelwert als Schwerpunkt, Median, Quartile mit Boxplot und IQR, Varianz als Abweichungsquadrate mit n − 1 oder n, Standardabweichung; ziehbare Punkte, Datensätze symmetrisch, schief, mit Ausreißer |
| [`wahrscheinlichkeit/`](wahrscheinlichkeit/) | Wahrscheinlichkeit als Fläche in drei Reitern: Multiplikationssatz im Einheitsquadrat (Würfel und Münze), bedingte Wahrscheinlichkeit als flächentreues Venn-Diagramm (Mikrozensus 2024: Ehe und Kinder) und Satz von Bayes als Venn-Diagramm (Beispiel Leberzirrhose). Direkt verlinkbar über `#multiplikation`, `#bedingt`, `#bayes` |
| [`binomial/`](binomial/) | Pascal und die Binomialverteilung: Galton-Brett mit Pascalschem Dreieck, Histogramm gegen Binomialverteilung, Beispiel Therapieerfolg |
| [`verteilungen/`](verteilungen/) | Diskret und stetig: Binomialverteilung neben Normal-, t- und Exponentialverteilung, je Wahrscheinlichkeits- bzw. Dichtefunktion und Verteilungsfunktion, mit Wahrscheinlichkeitsrechner |
| [`grosse-zahlen/`](grosse-zahlen/) | Gesetz der großen Zahlen (laufender Erfolgsanteil von fünf Praxen mit 95-%-Trichter, absolute Abweichung wächst) und Falle der kleinen Zahlen nach Wainer (2007): 800 fiktive Countys mit gleicher wahrer Rate, höchste und niedrigste Raten auf dem Land, Funnel-Plot, Wechsel der Spitzengruppe von Jahr zu Jahr |
| [`zgws/`](zgws/) | Grenzwertsatz, Standardfehler, Konfidenzintervall: vier Populationen, gemeinsame Regler, drei aufklappbare Abschnitte |
| [`t-test/`](t-test/) | Die t-Test-Kaskade: Rohdaten, Signal und Rauschen, t-Verteilung, p-Wert, α, β, Power und ein Simulator für 100 Studien |
| [`entscheidung/`](entscheidung/) | Entscheidungstheorie: H0/H1 mit α, β und Power, Entscheidungsmatrix, Power-Kurve mit Fallzahl für 80 %, Gedankenexperiment zu den Kosten von α- und β-Fehlern (QALY, Euro) mit günstigstem α, Verständnis-Check |
| [`multiples-testen/`](multiples-testen/) | Multiples Testen in fünf Stufen: 20er-Würfel als Bild für α, simulierte t-Tests ohne Effekt mit FWER-Kurve 1 − 0,95^k und p-Histogramm, Bonferroni, Power-Verlust durch Korrektur, Holm und Benjamini-Hochberg mit sortierten p-Werten und Vergleich von FWER, FDR und Power |
| [`fallzahl/`](fallzahl/) | Fallzahl und Power: Rechner für n, Power, kleinsten entdeckbaren Effekt oder α (t-Test zwei Gruppen, gepaart, zwei Anteile), Drop-out, Methodensatz, Power-Kurve, Sensitivitätstabelle |
| [`chi-quadrat/`](chi-quadrat/) | Der Chi-Quadrat-Test auf Unabhängigkeit: editierbare Kreuztabelle, Mosaik, erwartete Häufigkeiten, Zellbeiträge, χ²-Verteilung mit p-Wert, Cramérs V, Simulation unter H0 |
| [`regression-mitte/`](regression-mitte/) | Regression zur Mitte: Schmerzverlauf einer Person mit Termin an einem schlechten Tag, Praxis-Simulation mit Warteliste und einstellbarem Therapieeffekt, Galtons Originaldaten (HistData::GaltonFamilies, in cm) mit Auswahlband in beide Richtungen |
| [`inferenzzyklus/`](inferenzzyklus/) | Induktion, Deduktion und der Signifikanztest: Poppers Perspektive in fünf Schritten, Schwan-Experiment, Modus tollens und die Frage, ob Induktion und Inferenz dasselbe sind |

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

Reihenfolge und Blöcke stehen zentral in `assets/js/path.js`. Daraus entsteht unten auf jeder Seite die Leiste „Zurück / Weiter“. Wer eine Seite ergänzt, trägt sie dort ein und legt auf der Startseite die Karte im passenden Block an.
