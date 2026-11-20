/* Wahrscheinlichkeit · Reiter 4: Testergebnisse lesen (Gigerenzers Mammografie-Aufgabe)
   Häufigkeitsbaum absolut oder als Wahrscheinlichkeiten, Szenarien als Voreinstellung, Regler für Prävalenz,
   Sensitivität und Falsch-positiv-Rate. Die Reitersteuerung liegt in wahrscheinlichkeit.js und ruft window.renderMammo(). */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const dec = (x, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const intf = x => Math.round(x).toLocaleString("de-DE");
const pc = (x, d) => { const v = x * 100; if (d === undefined) { d = v === 0 ? 0 : v < 0.1 ? 3 : v < 1 ? 2 : v < 10 ? 1 : 0; return dec(v, d).replace(/,0+$/, "") + " %"; } return dec(v, d) + " %"; };

const PREV = [0.1, 0.2, 0.3, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 7.5, 10, 12.5, 15, 20, 25, 30, 40, 50];
const SCEN = [
  { id: "gig", label: "Gigerenzer 2007", prev: 1, sens: 90, fpr: 9, note: "Die Zahlen, die Gigerenzer 2007 in einer Fortbildung 160 Gynäkologinnen und Gynäkologen vorlegte. Nur 21 % wählten die richtige Antwort, nach einer Schulung in natürlichen Häufigkeiten 87 %." },
  { id: "eddy", label: "Eddy 1982", prev: 1, sens: 80, fpr: 9.6, note: "Die ältere Fassung der Aufgabe nach David Eddy. Rund 95 von 100 befragten Ärzten schätzten etwa 75 %. Richtig sind knapp 8 %." },
  { id: "sympt", label: "Gleicher Test, Tastbefund", prev: 15, sens: 90, fpr: 9, note: "Beispielwerte: derselbe Test, aber bei Frauen, die mit einem tastbaren Knoten kommen. Die Vortestwahrscheinlichkeit ist viel höher, und plötzlich ist ein positiver Befund aussagekräftig." },
  { id: "rare", label: "Sehr seltener Krebs, sehr guter Test", prev: 0.1, sens: 99, fpr: 1, note: "Beispielwerte: Selbst ein Test mit 99 % Sensitivität und nur 1 % Fehlalarmen liefert bei einer Prävalenz von 1 zu 1.000 überwiegend falsche positive Befunde." }
];
const M = { prev: 1, sens: 90, fpr: 9, view: "abs", N: 1000, scen: "gig", revealed: false };

function counts() {
  const N = M.N, sick = Math.round(N * M.prev / 100), healthy = N - sick;
  const tp = Math.round(sick * M.sens / 100), fn = sick - tp, fp = Math.round(healthy * M.fpr / 100), tn = healthy - fp;
  return { N, sick, healthy, tp, fn, fp, tn };
}
function probs() {
  const p = M.prev / 100, se = M.sens / 100, f = M.fpr / 100;
  const tp = p * se, fp = (1 - p) * f, fn = p * (1 - se), tn = (1 - p) * (1 - f);
  return { p, se, f, tp, fp, fn, tn, ppv: tp / (tp + fp), npv: tn / (tn + fn) };
}

function drawTree() {
  const c = counts(), q = probs(), abs = M.view === "abs";
  const W = 900, R = { x: 96, y: 226 }, L1 = [{ x: 390, y: 131 }, { x: 390, y: 321 }], L2x = 680, L2y = [76, 181, 271, 376];
  const node = (x, y, w, h, fill, stroke, main, sub, ink) => `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="2"/><text class="n-main" x="${x}" y="${y + (sub ? -2 : 6)}" text-anchor="middle" style="fill:${ink || "var(--fg)"}">${main}</text>${sub ? `<text class="n-sub" x="${x}" y="${y + 18}" text-anchor="middle" style="fill:${ink || "var(--muted)"}">${sub}</text>` : ""}`;
  const edge = (a, b, lab) => { const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; return `<path d="M${a.x + 70} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x - 78} ${b.y}" fill="none" stroke="var(--line)" stroke-width="3"/><rect x="${mx - 34}" y="${my - 13}" width="68" height="24" rx="12" fill="var(--surface)" stroke="var(--accent-soft)"/><text class="e-lab" x="${mx}" y="${my + 4}" text-anchor="middle">${lab}</text>`; };
  let s = "";
  s += edge(R, L1[0], pc(q.p)) + edge(R, L1[1], pc(1 - q.p));
  s += edge(L1[0], { x: L2x, y: L2y[0] }, pc(q.se)) + edge(L1[0], { x: L2x, y: L2y[1] }, pc(1 - q.se));
  s += edge(L1[1], { x: L2x, y: L2y[2] }, pc(q.f)) + edge(L1[1], { x: L2x, y: L2y[3] }, pc(1 - q.f));
  s += node(R.x, R.y, 150, 66, "var(--surface)", "var(--fg)", abs ? intf(c.N) : "100 %", "Frauen");
  s += node(L1[0].x, L1[0].y, 150, 62, "var(--surface)", "var(--fg)", abs ? intf(c.sick) : pc(q.p), "mit Krebs");
  s += node(L1[1].x, L1[1].y, 150, 62, "var(--surface)", "var(--fg)", abs ? intf(c.healthy) : pc(1 - q.p), "ohne Krebs");
  const leaves = [
    [c.tp, q.tp, "positiv", "var(--therapie)", "var(--therapie)", "var(--on-accent)"],
    [c.fn, q.fn, "negativ", "var(--beta-fill)", "var(--beta-fill)", "var(--fg)"],
    [c.fp, q.fp, "positiv", "var(--alpha-fill)", "var(--alpha-fill)", "var(--fg)"],
    [c.tn, q.tn, "negativ", "var(--highlight)", "var(--line)", "var(--fg)"]
  ];
  leaves.forEach(([n, pr, lab, fill, st, ink], i) => s += node(L2x, L2y[i], 156, 62, fill, st, abs ? intf(n) : pc(pr, 2), lab, ink));
  // Kopfzeilen
  s += `<text class="h-lab" x="${R.x}" y="16" text-anchor="middle">Alle</text><text class="h-lab" x="${L1[0].x}" y="16" text-anchor="middle">Krankheit</text><text class="h-lab" x="${L2x}" y="16" text-anchor="middle">Mammografie</text>`;
  // Klammer: alle Positiven
  const tot = abs ? `${intf(c.tp)} + ${intf(c.fp)} = ${intf(c.tp + c.fp)}` : `${pc(q.tp)} + ${pc(q.fp)} = ${pc(q.tp + q.fp)}`;
  s += `<path d="M770 ${L2y[0]} h18 V${L2y[2]} h-18" fill="none" stroke="var(--accent)" stroke-width="2.5"/><text class="n-sub" x="798" y="${(L2y[0] + L2y[2]) / 2 - 24}" style="fill:var(--accent)">alle</text><text class="n-sub" x="798" y="${(L2y[0] + L2y[2]) / 2 - 8}" style="fill:var(--accent)">positiven</text><text class="n-main" x="798" y="${(L2y[0] + L2y[2]) / 2 + 18}" style="fill:var(--accent);font-size:18px">${abs ? intf(c.tp + c.fp) : pc(q.tp + q.fp, 2)}</text>`;
  s += `<text class="n-sub" x="0" y="428">${abs ? "Kanten: bedingte Wahrscheinlichkeiten. Kästchen: Anzahl Frauen." : "Kanten: bedingte Wahrscheinlichkeiten. Kästchen: Produkt entlang des Pfads (Multiplikationssatz)."}</text>`;
  $("m-tree").innerHTML = s;
  $("m-tree").setAttribute("aria-label", `Baum: von ${intf(c.N)} Frauen sind ${tot} positiv`);
}

function drawIcons() {
  const c = counts(), pos = c.tp + c.fp, q = probs();
  $("m-pos-h").innerHTML = `Alle ${intf(pos)} Frauen mit positivem Befund: <b>${intf(c.tp)}</b> davon haben Krebs`;
  const svg = $("m-icons");
  if (pos > 400) {
    // zu viele Symbole: Balken statt Punkte
    const w = 860 * c.tp / pos;
    svg.setAttribute("viewBox", "0 0 900 70");
    svg.innerHTML = `<rect x="20" y="16" width="${w}" height="34" fill="var(--therapie)"/><rect x="${20 + w}" y="16" width="${860 - w}" height="34" fill="var(--alpha-fill)"/><text x="20" y="66" class="n-sub">je Balkenbreite: Anteil an allen ${intf(pos)} positiven Befunden (${pc(q.ppv)} richtig positiv)</text>`;
    return;
  }
  const per = 50, r = 7, gap = 17.2, rows = Math.max(1, Math.ceil(pos / per));
  svg.setAttribute("viewBox", `0 0 900 ${rows * 20 + 10}`);
  let s = "";
  for (let i = 0; i < pos; i++) { const cx = 20 + (i % per) * gap, cy = 14 + Math.floor(i / per) * 20; s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${i < c.tp ? "var(--therapie)" : "var(--alpha-fill)"}"/>`; }
  svg.innerHTML = s || `<text x="20" y="20" class="n-sub">kein positiver Befund</text>`;
}

function drawText() {
  const c = counts(), q = probs(), sc = SCEN.find(s => s.id === M.scen);
  $("m-facts").textContent = `${pc(q.p)} der Frauen dieser Gruppe haben Brustkrebs. Von den Erkrankten haben ${pc(q.se)} einen positiven Befund, von den Gesunden ${pc(q.f)}.`;
  $("m-scen-note").textContent = sc ? sc.note : "Eigene Werte.";
  $("m-compare").innerHTML =
    `<div class="cbox"><span class="k">Sensitivität · P(positiv | Krebs)</span><span class="v">${pc(q.se)}</span><span class="s">Von ${intf(c.sick)} Frauen mit Krebs sind ${intf(c.tp)} positiv.</span></div>` +
    `<div class="cbox good"><span class="k">Positiver Vorhersagewert · P(Krebs | positiv)</span><span class="v">${pc(q.ppv)}</span><span class="s">Von ${intf(c.tp + c.fp)} positiven Befunden sind ${intf(c.tp)} echt.</span></div>` +
    `<div class="cbox"><span class="k">Negativer Vorhersagewert · P(kein Krebs | negativ)</span><span class="v">${q.npv > 0.9999 ? "> 99,99 %" : pc(q.npv, q.npv > 0.999 ? 2 : 1)}</span><span class="s">Von ${intf(c.fn + c.tn)} negativen Befunden sind ${intf(c.tn)} richtig.</span></div>`;
  $("m-formula").innerHTML = `<span class="big">P(Krebs | positiv) = richtig positive ÷ alle positiven</span>` +
    `<span>= ${intf(c.tp)} ÷ (${intf(c.tp)} + ${intf(c.fp)}) = ${pc(c.tp / Math.max(1, c.tp + c.fp))}</span>` +
    `<span class="dim">Satz von Bayes: P(K | +) = P(+ | K) · P(K) ÷ [P(+ | K) · P(K) + P(+ | ¬K) · P(¬K)] = ${dec(q.se, 3)} · ${dec(q.p, 4)} ÷ (${dec(q.se, 3)} · ${dec(q.p, 4)} + ${dec(q.f, 3)} · ${dec(1 - q.p, 4)}) = ${pc(q.ppv)}</span>`;
  const ratio = q.fp / q.tp;
  $("m-callout").innerHTML = q.ppv < 0.5
    ? `Der Test erkennt ${pc(q.se)} der Erkrankten. Trotzdem ist nur etwa <b>jeder ${Math.max(1, Math.round(1 / q.ppv))}. positive Befund</b> echt, weil es so viel mehr Gesunde gibt: Auf einen richtig positiven Befund kommen ${dec(ratio, 1)} Fehlalarme. Sensitivität und Vorhersagewert sind zwei verschiedene Wahrscheinlichkeiten, und die Prävalenz entscheidet, wie weit sie auseinanderliegen.`
    : `Hier ist ein positiver Befund überwiegend echt (${pc(q.ppv)}), weil die Prävalenz in dieser Gruppe hoch ist. Derselbe Test kann im Screening überwiegend Fehlalarme und in der Abklärung überwiegend Treffer liefern.`;
}

function syncCtrls() {
  const pi = PREV.reduce((b, v, i) => Math.abs(v - M.prev) < Math.abs(PREV[b] - M.prev) ? i : b, 0);
  $("m-prev").max = PREV.length - 1; $("m-prev").value = pi; $("m-sens").value = M.sens; $("m-fpr").value = M.fpr;
  $("m-prev-v").textContent = `${pc(M.prev / 100)} (1 von ${intf(100 / M.prev)})`;
  $("m-sens-v").textContent = pc(M.sens / 100); $("m-fpr-v").textContent = pc(M.fpr / 100);
  $("m-scen").innerHTML = SCEN.map(s => `<button type="button" data-s="${s.id}" aria-pressed="${s.id === M.scen}">${s.label}</button>`).join("");
}
function render() {
  syncCtrls(); drawText();
  if (!M.revealed) return;
  drawTree(); drawIcons();
}
window.renderMammo = render;

function reveal() { M.revealed = true; $("m-body").hidden = false; $("m-skip").hidden = true; render(); }
$("m-answers").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  $("m-answers").querySelectorAll("button").forEach(x => x.classList.remove("right", "wrong"));
  const ok = b.dataset.a === "2"; b.classList.add(ok ? "right" : "wrong");
  $("m-feedback").innerHTML = ok
    ? "Richtig. Damit gehören Sie zu den 21 % der Gynäkologinnen und Gynäkologen, die 2007 so geantwortet haben. Der Baum unten zeigt, warum."
    : ["Diese Antwort wählten viele Ärztinnen und Ärzte. Sie verwechselt P(Krebs | positiv) mit P(positiv | Krebs). Der Baum unten zeigt, wie es wirklich aussieht.",
       "Diese Antwort wählten viele Ärztinnen und Ärzte. Sie verwechselt P(Krebs | positiv) mit P(positiv | Krebs). Der Baum unten zeigt, wie es wirklich aussieht.",
       "", "Zu niedrig: 1 % ist die Prävalenz vor dem Test. Der positive Befund erhöht die Wahrscheinlichkeit deutlich, nur nicht so stark, wie viele denken."][+b.dataset.a];
  reveal();
});
$("m-skip").onclick = reveal;
$("m-scen").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; const sc = SCEN.find(s => s.id === b.dataset.s); Object.assign(M, { prev: sc.prev, sens: sc.sens, fpr: sc.fpr, scen: sc.id }); if (sc.prev < 0.5 && M.N < 10000) setN(10000); render(); });
$("m-prev").addEventListener("input", e => { M.prev = PREV[+e.target.value]; M.scen = null; render(); });
$("m-sens").addEventListener("input", e => { M.sens = +e.target.value; M.scen = null; render(); });
$("m-fpr").addEventListener("input", e => { M.fpr = +e.target.value; M.scen = null; render(); });
$("m-view").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; M.view = b.dataset.v; $("m-view").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); render(); });
function setN(n) { M.N = n; $("m-n").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", +x.dataset.n === n)); }
$("m-n").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; setN(+b.dataset.n); render(); });
render();
})();
