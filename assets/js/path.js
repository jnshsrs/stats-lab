/* Stats Lab · Lernpfad
   Einzige Stelle für Reihenfolge und Blöcke. Die Startseite und die Vor/Zurück-Leiste jeder Seite lesen von hier. */
(() => {
"use strict";
const BLOCKS = ["Grundlagen", "Studiendesign", "Schätzen", "Testen", "Hintergrund", "Zusammenhänge und Regression", "Logistische Regression"];
const BLOCK_SLUGS = ["grundlagen", "studiendesign", "schaetzen", "testen", "hintergrund", "regression", "logistische-regression"];
const PATH = [
  ["skalenniveaus", "Skalenniveaus", 0],
  ["lage-streuung", "Lage und Streuung", 0],
  ["wahrscheinlichkeit", "Wahrscheinlichkeit als Fläche", 0],
  ["risiko-odds", "Risiko, Odds und Odds Ratio", 0],
  ["binomial", "Pascal und die Binomialverteilung", 0],
  ["verteilungen", "Diskret und stetig", 0],
  ["effektgroessen", "Effektgrößen", 0],
  ["studienarten", "Beobachten oder eingreifen: Studiendesigns im Überblick", 1],
  ["fall-kontrolle", "Die Fall-Kontroll-Studie", 1],
  ["rct", "Das RCT Schritt für Schritt", 1],
  ["randomisierung", "Warum randomisieren? Praxis gegen Studie", 1],
  ["stichprobe", "Stichprobe und Population", 2],
  ["grosse-zahlen", "Große und kleine Zahlen", 2],
  ["zgws", "Grenzwertsatz, Standardfehler, Konfidenzintervall", 2],
  ["binomialtest", "Binomialtest: Annahme- und Ablehnungsbereich", 3],
  ["t-test", "Die t-Test-Kaskade", 3],
  ["t-test-varianten", "Welcher t-Test?", 3],
  ["entscheidung", "Entscheidungstheorie", 3],
  ["fallzahl", "Fallzahl und Power", 3],
  ["multiples-testen", "Multiples Testen", 3],
  ["chi-quadrat", "Chi-Quadrat-Test", 3],
  ["regression-mitte", "Regression zur Mitte", 4],
  ["mammografie", "Positiver Befund: Gigerenzers Mammografie-Aufgabe", 4],
  ["klinische-tests", "Klinische Tests: Gütekriterien und Likelihood-Ratios", 4],
  ["inferenzzyklus", "Induktion, Deduktion und der Signifikanztest", 4],
  ["korrelation", "Zusammenhang und Korrelation", 5],
  ["gerade", "Die beste Gerade: kleinste Quadrate", 5],
  ["normbereich", "Wie sicher ist der Sollwert? Inferenz und Normgrenze", 5],
  ["bestimmtheitsmass", "Wie viel erklärt die Gerade? R² und Streuungszerlegung", 5],
  ["diagnostik", "Passt das Modell? Residuen und Einfluss", 5],
  ["multiple-regression", "Mehrere Einflüsse zugleich: multiple Regression", 5],
  ["drittvariablen", "Drittvariablen: Confounder, Mediator, Collider", 5],
  ["wechselwirkungen", "Wechselwirkungen: wenn der Effekt von einer dritten Größe abhängt", 5],
  ["s-kurve", "Von der Geraden zur S-Kurve", 6],
  ["cam-morphologie", "Cam-Morphologie und Knorpeldefekt", 6]
];
window.STATS_LAB_PATH = { BLOCKS, BLOCK_SLUGS, PATH };
const url = p => `../../${BLOCK_SLUGS[p[2]]}/${p[0]}/`;
const parts = location.pathname.split("/").filter(Boolean);
const slug = parts[parts.length - 1] === "index.html" ? parts[parts.length - 2] : parts[parts.length - 1];
const i = PATH.findIndex(p => p[0] === slug);
const footer = document.querySelector(".site-footer");
if (i < 0 || !footer) return;
const prev = PATH[i - 1], next = PATH[i + 1], cur = PATH[i];
const link = (p, dir) => p ? `<a class="pn-${dir}" href="${url(p)}"><span class="pn-dir">${dir === "prev" ? "← Zurück" : "Weiter →"}</span><span class="pn-title">${p[1]}</span></a>` : `<a class="pn-${dir}" href="../../"><span class="pn-dir">${dir === "prev" ? "← Start" : "Geschafft →"}</span><span class="pn-title">Alle Visualisierungen</span></a>`;
const nav = document.createElement("nav");
nav.className = "path-nav column"; nav.setAttribute("aria-label", "Lernpfad");
nav.innerHTML = `<p class="pn-where">Lernpfad · Block ${cur[2] + 1}: ${BLOCKS[cur[2]]} · Station ${i + 1} von ${PATH.length} · <a href="../../glossar/#k-${cur[0]}">Begriffe dieses Kapitels im Glossar</a></p><div class="pn-row">${link(prev, "prev")}${link(next, "next")}</div>`;
footer.before(nav);
})();

/* Akkordeons: zunächst eingeklappt für die Übersicht.
   Grafiken werden geöffnet gezeichnet und erst danach zugeklappt, damit Größen stimmen.
   Ein Anker in der Adresse öffnet den passenden Abschnitt. */
(() => {
"use strict";
// Anker auf aufklappbare Kästen (auch verschachtelt, auch ohne Akkordeon): öffnen und hinscrollen
const openHash = () => { const id = decodeURIComponent(location.hash.slice(1)); const el = id && document.getElementById(id); if (!el) return; let d = el.closest("details"); if (!d || d.matches("details.acc")) return; while (d) { d.open = true; d = d.parentElement && d.parentElement.closest("details"); } el.scrollIntoView(); };
if (document.readyState === "complete") setTimeout(openHash, 0); else window.addEventListener("load", () => setTimeout(openHash, 0));
window.addEventListener("hashchange", openHash);
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
