# Stats Lab

Interaktive Visualisierungen für die Statistiklehre in den Gesundheits- und Therapiewissenschaften.

## Visualisierungen

| Seite | Inhalt |
|---|---|
| [`t-test/`](t-test/) | Die t-Test-Kaskade: Rohdaten, Signal und Rauschen, t-Verteilung, p-Wert, α, β, Power und ein Simulator für 100 Studien |

## Aufbau

```
index.html            Hauptseite mit allen Visualisierungen
assets/css/base.css   Gemeinsame Gestaltung: Farben, Schriften, Kopfzeile, Footer
assets/fonts/         IBM Plex Sans und Mono, lokal eingebunden (SIL Open Font License)
assets/img/           Favicon
t-test/               Eine Visualisierung = ein Ordner mit index.html, CSS und JS
```

Keine Abhängigkeiten, kein Build-Schritt, keine externen Ressourcen. Die Seiten laufen direkt aus dem Repo, auch lokal per Doppelklick auf `index.html`.

## Neue Visualisierung hinzufügen

1. Ordner `t-test/` kopieren und umbenennen, zum Beispiel `konfidenzintervall/`.
2. In der neuen `index.html` Titel und Inhalte anpassen. `../assets/css/base.css` bleibt eingebunden, damit Farben, Schriften, Kopfzeile und Footer einheitlich sind.
3. In der Hauptseite `index.html` eine weitere Karte im Block `<div class="grid">` ergänzen.

## Gestaltung

- Farben: CARTO-Palette „Geyser“ (7 Stufen). Warm steht für die Welt ohne Effekt (H0, Kontrolle, α), kühl für die Welt mit Effekt (H1, Therapie, Power).
- Schrift: IBM Plex Sans und IBM Plex Mono.
- Hell- und Dunkelmodus folgen der Systemeinstellung.

## Veröffentlichen mit GitHub Pages

Settings → Pages → Source: „Deploy from a branch“, Branch `main`, Ordner `/ (root)`. Die Seite ist danach unter `https://jnshsrs.github.io/stats-lab/` erreichbar.
