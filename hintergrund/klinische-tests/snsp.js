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
  { name: "Test A · sehr sensitiv", se: 0.99, sp: 0.70, rule: "SnNout" },
  { name: "Test B · sehr spezifisch", se: 0.70, sp: 0.99, rule: "SpPin" }
];
let prev = 0.2;
function field(err, ok, errSick) {
  // Fehler zuerst, mit Ring markiert. Farbe = wahrer Zustand.
  const cols = 25, gap = 8.6, r = 3, n = err + ok, rows = Math.max(1, Math.ceil(n / cols));
  const SICK = "var(--therapie)", WELL = "var(--pal-2)";
  let s = "";
  for (let i = 0; i < n; i++) {
    const cx = 5.5 + (i % cols) * gap, cy = 5.5 + Math.floor(i / cols) * gap, isErr = i < err;
    const sickDot = isErr ? errSick : !errSick;
    if (isErr) s += `<circle cx="${cx}" cy="${cy}" r="${r + 1.5}" fill="none" stroke="var(--fg)" stroke-width="1.1"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${sickDot ? SICK : WELL}"/>`;
  }
  return `<svg viewBox="0 0 ${cols * gap + 2} ${rows * gap + 3}" role="img" aria-label="${err} Fehler, ${ok} richtig">${s}</svg>`;
}
function reading(t, c) {
  const p1 = x => fmt(x * 100, 1) + " %";
  if (t.rule === "SnNout") {
    let r = `<b>Lesehilfe SnNout</b><span><b>S</b>ensitivität hoch, <b>N</b>egatives Ergebnis, rule <b>out</b>. Test A erkennt ${c.tp} von ${c.sick} Kranken, ${c.fn === 0 ? "keiner landet" : c.fn === 1 ? "nur einer landet" : "nur " + c.fn + " landen"} links bei den Negativen. Wer hier negativ getestet wird, ist zu ${p1(1 - c.sickNeg)} gesund.</span>`;
    r += c.inn
      ? `<span>Ein positives Ergebnis ist bei dieser Prävalenz ebenfalls aussagekräftig, aber vor allem, weil ohnehin fast alle krank sind.</span>`
      : `<span>Ein positives Ergebnis sagt dagegen wenig: ${c.fp} Gesunde schlagen falsch an, nur ${pc(c.sickPos)} der Positiven sind krank.</span>`;
    if (!c.out) r += `<span>Bei ${pc(prev)} Prävalenz reicht aber auch SnNout nicht: Trotz negativem Test bleibt ein Risiko von ${pc(c.sickNeg)}.</span>`;
    return r;
  }
  let r = `<b>Lesehilfe SpPin</b><span><b>Sp</b>ezifität hoch, <b>P</b>ositives Ergebnis, rule <b>in</b>. Von ${c.healthy} Gesunden schlagen bei Test B nur ${c.fp} falsch an${c.inn ? ", rechts bei den Positiven sind also kaum Gesunde" : ""}. Wer hier positiv getestet wird, ist zu ${p1(c.sickPos)} krank.</span>`;
  r += c.out
    ? `<span>Ein negatives Ergebnis ist bei dieser Prävalenz ebenfalls aussagekräftig, aber vor allem, weil ohnehin kaum jemand krank ist.</span>`
    : `<span>Ein negatives Ergebnis sagt dagegen wenig: ${c.fn} Kranke werden übersehen, das Risiko trotz negativem Test liegt bei ${pc(c.sickNeg)}.</span>`;
  if (!c.inn) r += `<span>Bei nur ${pc(prev)} Prävalenz reicht aber auch SpPin nicht: Die ${c.fp} Fehlalarme fallen gegenüber nur ${c.sick} Kranken stark ins Gewicht.</span>`;
  return r;
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
        <div class="sn-half"><span class="hh neg">Test sagt <b>negativ</b> · ${neg}</span>${field(fn, tn, true)}
          <span class="res"><i class="d well"></i>richtig negativ (gesund): <b>${tn}</b></span>
          <span class="res"><i class="d sick ring"></i>falsch negativ (krank, übersehen): <b>${fn}</b></span>
          <span class="res sum">Risiko trotz negativem Test: <b>${pc(sickNeg)}</b></span></div>
        <div class="sn-half"><span class="hh pos">Test sagt <b>positiv</b> · ${pos}</span>${field(fp, tp, false)}
          <span class="res"><i class="d sick"></i>richtig positiv (krank): <b>${tp}</b></span>
          <span class="res"><i class="d well ring"></i>falsch positiv (gesund, Fehlalarm): <b>${fp}</b></span>
          <span class="res sum">Wirklich krank bei positivem Test: <b>${pc(sickPos)}</b></span></div>
      </div>
      <span class="sn-badge ${out ? "ok" : "no"}">${out ? "✓ negatives Ergebnis schließt aus" : "negatives Ergebnis schließt nicht sicher aus"}</span>
      <span class="sn-badge ${inn ? "ok" : "no"}">${inn ? "✓ positives Ergebnis bestätigt" : "positives Ergebnis bestätigt nicht sicher"}</span>
      <div class="sn-read">${reading(t, { sick, healthy, tp, fn, fp, tn, sickNeg, sickPos, out, inn })}</div></div>`;
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
