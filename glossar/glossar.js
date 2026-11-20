/* Glossar: Suche über Begriff und Erklärung, leere Kapitel und Blöcke ausblenden */
(() => {
"use strict";
const q = document.getElementById("q"), terms = [...document.querySelectorAll(".g-term")], total = terms.length;
terms.forEach(t => { t.dataset.txt = t.textContent.toLowerCase(); });
function filter() {
  const v = q.value.trim().toLowerCase(); let n = 0;
  terms.forEach(t => { const hit = !v || t.dataset.txt.includes(v); t.hidden = !hit; if (hit) n++; });
  document.querySelectorAll(".g-ch").forEach(c => c.hidden = !c.querySelector(".g-term:not([hidden])"));
  document.querySelectorAll(".g-block").forEach(b => b.hidden = !b.querySelector(".g-ch:not([hidden])"));
  document.querySelector(".g-toc").hidden = !!v;
  document.getElementById("g-count").textContent = v ? `${n} von ${total} Begriffen` : `${total} Begriffe`;
  document.getElementById("g-empty").hidden = n > 0;
}
q.addEventListener("input", filter);
document.addEventListener("keydown", e => { if (e.key === "/" && document.activeElement !== q) { e.preventDefault(); q.focus(); } });
})();
