/* Exkurs Positiver Befund · SnNout und SpPin
   Zwei Tests an 1.000 Personen: A sehr sensitiv, B sehr spezifisch. Punktfelder für negative und positive Ergebnisse. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const fmt = (x, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const pc = x => { const v = x * 100; return fmt(v, v < 1 && v > 0 ? 1 : 0) + " %"; };
const PREV = [0.01, 0.02, 0.05, 0.1, 0.2, 0.3, 0.5, 0.7, 0.9];
const N = 1000;
const TESTS = [
  { name: "Test A · sehr sensitiv", se: 0.99, sp: 0.70 },
  { name: "Test B · sehr spezifisch", se: 0.70, sp: 0.99 }
];
let prev = 0.2;
function field(sick, healthy) {
  const cols = 25, gap = 8.4, r = 3.2, n = sick + healthy, rows = Math.max(1, Math.ceil(n / cols));
  let s = "";
  for (let i = 0; i < n; i++) { const cx = 5 + (i % cols) * gap, cy = 5 + Math.floor(i / cols) * gap; s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${i < sick ? "var(--therapie)" : "var(--pal-2)"}"/>`; }
  return `<svg viewBox="0 0 ${cols * gap + 2} ${rows * gap + 4}" role="img" aria-label="${sick} erkrankt, ${healthy} gesund">${s || '<text x="4" y="12" font-size="10">keine</text>'}</svg>`;
}
function render() {
  $("sn-prev-v").textContent = `${pc(prev)} (${Math.round(N * prev)} von ${N} erkrankt)`;
  const sick = Math.round(N * prev), healthy = N - sick;
  let html = "", notes = [];
  TESTS.forEach((t, i) => {
    const tp = Math.round(sick * t.se), fn = sick - tp, fp = Math.round(healthy * (1 - t.sp)), tn = healthy - fp;
    const neg = fn + tn, pos = tp + fp, sickNeg = neg ? fn / neg : 0, sickPos = pos ? tp / pos : 0;
    const out = sickNeg <= 0.02, inn = sickPos >= 0.9;
    html += `<div class="sn-card"><h3>${t.name}</h3><span class="sub">Sensitivität ${pc(t.se)} · Spezifität ${pc(t.sp)}</span>
      <div class="sn-halves">
        <div class="sn-half"><span class="hh">Negativ: ${neg} Personen</span>${field(fn, tn)}<span class="res">davon erkrankt: <b>${fn}</b> (${pc(sickNeg)})</span></div>
        <div class="sn-half"><span class="hh">Positiv: ${pos} Personen</span>${field(tp, fp)}<span class="res">davon erkrankt: <b>${tp}</b> (${pc(sickPos)})</span></div>
      </div>
      <span class="sn-badge ${out ? "ok" : "no"}">${out ? "✓ negatives Ergebnis schließt aus" : "negatives Ergebnis schließt nicht sicher aus"}</span>
      <span class="sn-badge ${inn ? "ok" : "no"}">${inn ? "✓ positives Ergebnis bestätigt" : "positives Ergebnis bestätigt nicht sicher"}</span></div>`;
    notes.push({ sickNeg, sickPos, fn, fp });
  });
  $("sn-tests").innerHTML = html;
  const [a, b] = notes;
  let txt = `Bei ${pc(prev)} Prävalenz sind unter den negativen Ergebnissen von Test A nur <b>${a.fn}</b> ${a.fn===1?"erkrankte Person":"erkrankte Personen"} (${pc(a.sickNeg)}), unter den positiven Ergebnissen von Test B nur <b>${b.fp}</b> ${b.fp===1?"gesunde Person":"gesunde Personen"}. Sensitivität entscheidet über negative Befunde, Spezifität über positive.`;
  if (prev >= 0.5) txt += ` Bei so hoher Vortestwahrscheinlichkeit stößt aber selbst SnNout an Grenzen: Auch Test A lässt unter den Negativen noch ${pc(a.sickNeg)} Erkrankte übrig.`;
  else if (prev <= 0.05) txt += ` Bei so niedriger Prävalenz stößt dafür SpPin an Grenzen: Selbst bei Test B ist nur ${pc(b.sickPos)} der positiven Ergebnisse echt.`;
  else txt += " Verschieben Sie die Prävalenz nach ganz rechts und ganz links: Dann sieht man, wo die Faustregeln an ihre Grenzen kommen.";
  $("sn-callout").innerHTML = txt;
}
$("sn-prev").addEventListener("input", e => { prev = PREV[+e.target.value]; render(); });
render();
})();
