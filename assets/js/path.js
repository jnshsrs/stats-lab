/* Stats Lab · Lernpfad
   Einzige Stelle für Reihenfolge und Blöcke. Die Startseite und die Vor/Zurück-Leiste jeder Seite lesen von hier. */
(() => {
"use strict";
const BLOCKS = ["Grundlagen", "Schätzen", "Testen", "Hintergrund", "Zusammenhänge und Regression"];
const PATH = [
  ["skalenniveaus", "Skalenniveaus", 0],
  ["lage-streuung", "Lage und Streuung", 0],
  ["wahrscheinlichkeit", "Wahrscheinlichkeit als Fläche", 0],
  ["binomial", "Pascal und die Binomialverteilung", 0],
  ["verteilungen", "Diskret und stetig", 0],
  ["stichprobe", "Stichprobe und Population", 1],
  ["grosse-zahlen", "Große und kleine Zahlen", 1],
  ["zgws", "Grenzwertsatz, Standardfehler, Konfidenzintervall", 1],
  ["binomialtest", "Binomialtest: Annahme- und Ablehnungsbereich", 2],
  ["t-test", "Die t-Test-Kaskade", 2],
  ["t-test-varianten", "Welcher t-Test?", 2],
  ["entscheidung", "Entscheidungstheorie", 2],
  ["fallzahl", "Fallzahl und Power", 2],
  ["multiples-testen", "Multiples Testen", 2],
  ["chi-quadrat", "Chi-Quadrat-Test", 2],
  ["regression-mitte", "Regression zur Mitte", 3],
  ["mammografie", "Positiver Befund: Gigerenzers Mammografie-Aufgabe", 3],
  ["klinische-tests", "Klinische Tests: Gütekriterien und Likelihood-Ratios", 3],
  ["inferenzzyklus", "Induktion, Deduktion und der Signifikanztest", 3],
  ["korrelation", "Zusammenhang und Korrelation", 4],
  ["gerade", "Die beste Gerade: kleinste Quadrate", 4],
  ["normbereich", "Wie sicher ist der Sollwert? Inferenz und Normgrenze", 4],
  ["bestimmtheitsmass", "Wie viel erklärt die Gerade? R² und Streuungszerlegung", 4],
  ["diagnostik", "Passt das Modell? Residuen und Einfluss", 4]
];
window.STATS_LAB_PATH = { BLOCKS, PATH };
const parts = location.pathname.split("/").filter(Boolean);
const slug = parts[parts.length - 1] === "index.html" ? parts[parts.length - 2] : parts[parts.length - 1];
const i = PATH.findIndex(p => p[0] === slug);
const footer = document.querySelector(".site-footer");
if (i < 0 || !footer) return;
const prev = PATH[i - 1], next = PATH[i + 1], cur = PATH[i];
const link = (p, dir) => p ? `<a class="pn-${dir}" href="../${p[0]}/"><span class="pn-dir">${dir === "prev" ? "← Zurück" : "Weiter →"}</span><span class="pn-title">${p[1]}</span></a>` : `<a class="pn-${dir}" href="../"><span class="pn-dir">${dir === "prev" ? "← Start" : "Geschafft →"}</span><span class="pn-title">Alle Visualisierungen</span></a>`;
const nav = document.createElement("nav");
nav.className = "path-nav column"; nav.setAttribute("aria-label", "Lernpfad");
nav.innerHTML = `<p class="pn-where">Lernpfad · Block ${cur[2] + 1}: ${BLOCKS[cur[2]]} · Station ${i + 1} von ${PATH.length} · <a href="../glossar/#k-${cur[0]}">Begriffe dieses Kapitels im Glossar</a></p><div class="pn-row">${link(prev, "prev")}${link(next, "next")}</div>`;
footer.before(nav);
})();

/* Akkordeons: zunächst eingeklappt für die Übersicht.
   Grafiken werden geöffnet gezeichnet und erst danach zugeklappt, damit Größen stimmen.
   Ein Anker in der Adresse öffnet den passenden Abschnitt. */
(() => {
"use strict";
const accs = [...document.querySelectorAll("details.acc")];
if (!accs.length) return;
const target = () => { const id = decodeURIComponent(location.hash.slice(1)); const el = id && document.getElementById(id); return el ? (el.matches("details.acc") ? el : el.closest("details.acc")) : null; };
const bar = document.createElement("div");
bar.className = "acc-all";
bar.innerHTML = `<button type="button">Alle aufklappen</button>`;
const btn = bar.firstChild;
const sync = () => { btn.textContent = accs.every(d => d.open) ? "Alle zuklappen" : "Alle aufklappen"; };
btn.addEventListener("click", () => { const open = !accs.every(d => d.open); accs.forEach(d => { d.open = open; }); });
accs[0].before(bar);
accs.forEach(d => d.addEventListener("toggle", () => { if (d.open) window.dispatchEvent(new Event("resize")); sync(); }));
const closeAll = () => { const t = target(); accs.forEach(d => { d.open = d === t; }); if (t) t.scrollIntoView(); sync(); };
if (document.readyState === "complete") closeAll(); else window.addEventListener("load", closeAll);
window.addEventListener("hashchange", () => { const t = target(); if (t) { t.open = true; t.scrollIntoView(); } });
})();
