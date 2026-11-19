# Stats Lab

Interaktive Visualisierungen für die Statistiklehre in den Gesundheits- und Therapiewissenschaften.

## Visualisierungen

| Seite | Inhalt |
|---|---|
| [`t-test/`](t-test/) | Die t-Test-Kaskade: Rohdaten, Signal und Rauschen, t-Verteilung, p-Wert, α, β, Power und ein Simulator für 100 Studien |
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
- **Dunkelmodus:** eigener Block am Ende von `theme.css`, folgt der Systemeinstellung.
- **Ausnahme:** `assets/img/favicon.svg` ist eine eigene Bilddatei und wird bei einem Farbwechsel von Hand angepasst.

Aktuell: Palette ColorBrewer PuBu, Schrift Geist und Geist Mono (SIL OFL), griechische Buchstaben aus IBM Plex Sans (SIL OFL), da Geist keine enthält.

## Veröffentlichen mit GitHub Pages

Settings → Pages → Source: „Deploy from a branch“, Branch `main`, Ordner `/ (root)`. Die Seite ist danach unter `https://jnshsrs.github.io/stats-lab/` erreichbar.
