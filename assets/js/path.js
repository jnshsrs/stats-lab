/* Stats Lab · Lernpfad
   Einzige Stelle für Reihenfolge und Blöcke. Die Startseite und die Vor/Zurück-Leiste jeder Seite lesen von hier. */
(() => {
"use strict";
const BLOCKS = ["Grundlagen", "Schätzen", "Testen", "Hintergrund"];
const PATH = [
  ["skalenniveaus", "Skalenniveaus", 0],
  ["lage-streuung", "Lage und Streuung", 0],
  ["wahrscheinlichkeit", "Wahrscheinlichkeit als Fläche", 0],
  ["binomial", "Pascal und die Binomialverteilung", 0],
  ["verteilungen", "Diskret und stetig", 0],
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
  ["inferenzzyklus", "Induktion, Deduktion und der Signifikanztest", 3]
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
nav.innerHTML = `<p class="pn-where">Lernpfad · Block ${cur[2] + 1}: ${BLOCKS[cur[2]]} · Station ${i + 1} von ${PATH.length}</p><div class="pn-row">${link(prev, "prev")}${link(next, "next")}</div>`;
footer.before(nav);
})();
