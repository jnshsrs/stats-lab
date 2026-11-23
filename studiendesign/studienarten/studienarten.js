/* Beobachten oder eingreifen · Stats Lab
   Station „Beobachten oder eingreifen“: vier Studiendesigns auf einer Zeitachse, Steckbriefe, Übung zur Designwahl. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const pick = (e, el) => { const b = e.target.closest("button"); if (!b) return null; el.querySelectorAll("button").forEach(z => z.setAttribute("aria-pressed", z === b)); return b; };

/* ---------- 1 Zeitachse ---------- */
const W = 900, H = 360, AX = 318, NOW = 450;
// Punktgruppe: n Personen in cols Spalten, exp(i) / out(i) legen Ring und Füllung fest
function group(x, y, n, cols, exp, out, r = 6, gap = 17) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const cx = x + (i % cols) * gap, cy = y + Math.floor(i / cols) * gap;
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${out(i) ? "var(--beta-ink)" : "var(--pal-3)"}" ${exp(i) ? `stroke="var(--accent)" stroke-width="2.6"` : ""}/>`;
  }
  return s;
}
const arrow = (x1, y1, x2, y2, lab, up = true) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--fg)" stroke-width="2.4" marker-end="url(#ar)"/>` + (lab ? `<text class="lbl-s" x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 + (up ? -10 : 22)}" text-anchor="middle">${lab}</text>` : "");
const box = (x, y, w, h, lab) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="var(--line)" stroke-width="1.4"/>` + (lab ? `<text class="lbl-b" x="${x + w / 2}" y="${y - 8}" text-anchor="middle">${lab}</text>` : "");
const hash = i => ((i * 2654435761) >>> 0) % 100;
const cnt = (n, f) => Array.from({ length: n }, (_, i) => i).filter(f).length;
const DESIGNS = [
  { name: "Querschnitt", draw: () =>
      box(355, 70, 190, 150, "eine Messung") + group(372, 92, 40, 10, i => hash(i) < 35, i => hash(i + 7) < (hash(i) < 35 ? 45 : 20)) +
      `<text class="lbl-s" x="450" y="250" text-anchor="middle">Exposition und Outcome</text><text class="lbl-s" x="450" y="268" text-anchor="middle">zum selben Zeitpunkt erhoben</text>`,
    prof: { "Ausgangspunkt": "Eine Stichprobe zu einem Zeitpunkt.", "Blickrichtung": "keine: ein Schnappschuss.", "Exposition": "wird gemessen, nicht zugeteilt.", "Kennzahl": "Prävalenz (Anteil Betroffener), Prävalenz-Odds-Ratio.", "Stärke": "schnell, günstig, gut für Häufigkeiten und erste Hypothesen.", "Schwäche": "Man weiß nicht, was zuerst da war: Haben Menschen mit Nackenschmerz weniger Bewegung, oder bewegen sie sich weniger, weil es schmerzt?", "Beispiel": "Wie viele Büroangestellte haben aktuell Nackenschmerzen, und hängt das mit der Bildschirmzeit zusammen?" } },
  { name: "Kohorte", draw: () =>
      box(150, 60, 190, 80, "exponiert") + group(167, 80, 20, 10, () => true, () => false) +
      box(150, 170, 190, 80, "nicht exponiert") + group(167, 190, 20, 10, () => false, () => false) +
      arrow(355, 100, 545, 100, "beobachten über Jahre") + arrow(355, 210, 545, 210, "") +
      box(560, 60, 190, 80, "") + group(577, 80, 20, 10, () => true, i => hash(i) < 40) +
      box(560, 170, 190, 80, "") + group(577, 190, 20, 10, () => false, i => hash(i + 3) < 15) +
      `<text class="lbl-s" x="770" y="104">Risiko ${cnt(20, i => hash(i) < 40)}/20</text><text class="lbl-s" x="770" y="214">Risiko ${cnt(20, i => hash(i + 3) < 15)}/20</text>`,
    prof: { "Ausgangspunkt": "Menschen ohne das Outcome, eingeteilt nach Exposition.", "Blickrichtung": "vorwärts: von der Exposition zum Outcome. Retrospektiv, wenn der Startpunkt in alten Akten liegt.", "Exposition": "wird gemessen, nicht zugeteilt.", "Kennzahl": "Inzidenz, Risiko, relatives Risiko (RR), Risikodifferenz.", "Stärke": "zeitliche Reihenfolge klar, mehrere Outcomes möglich, gut für Prognose.", "Schwäche": "lange Dauer, für seltene Outcomes riesige Stichproben nötig, Confounder.", "Beispiel": "Haben junge Fußballer mit Cam-Morphologie nach fünf Jahren häufiger Arthrosezeichen?" } },
  { name: "Fall-Kontrolle", draw: () =>
      box(560, 60, 190, 80, "Fälle (Outcome ja)") + group(577, 80, 20, 10, i => hash(i) < 60, () => true) +
      box(560, 170, 190, 80, "Kontrollen (Outcome nein)") + group(577, 190, 20, 10, i => hash(i + 5) < 25, () => false) +
      arrow(545, 100, 355, 100, "zurückfragen: exponiert?") + arrow(545, 210, 355, 210, "") +
      `<text class="lbl-b" x="250" y="106" text-anchor="middle">${cnt(20, i => hash(i) < 60)} von 20 exponiert</text><text class="lbl-b" x="250" y="216" text-anchor="middle">${cnt(20, i => hash(i + 5) < 25)} von 20 exponiert</text>`,
    prof: { "Ausgangspunkt": "Menschen, die das Outcome schon haben (Fälle), und vergleichbare ohne (Kontrollen).", "Blickrichtung": "rückwärts: vom Outcome zur früheren Exposition.", "Exposition": "wird erfragt oder aus Akten erhoben.", "Kennzahl": "nur das Odds Ratio. Das Verhältnis von Fällen zu Kontrollen legen die Forschenden selbst fest, ein Risiko lässt sich daraus nicht berechnen.", "Stärke": "schnell und günstig, oft das einzige machbare Design bei seltenen Erkrankungen.", "Schwäche": "Erinnerungsverzerrung, die Wahl passender Kontrollen ist schwierig.", "Beispiel": "Welche Belastungen gehen einem seltenen Cauda-equina-Syndrom voraus?" } },
  { name: "RCT", draw: () =>
      box(80, 95, 140, 130, "Teilnehmende") + group(96, 115, 32, 7, () => false, () => false, 5.5, 17) +
      arrow(228, 160, 300, 160, "") + `<text x="335" y="166" text-anchor="middle" class="lbl-b">Zufall</text><circle cx="335" cy="160" r="30" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="4 3"/>` +
      arrow(362, 145, 440, 100, "") + arrow(362, 175, 440, 220, "") +
      box(450, 60, 170, 80, "Intervention") + group(467, 80, 16, 8, () => true, () => false) +
      box(450, 180, 170, 80, "Kontrolle") + group(467, 200, 16, 8, () => false, () => false) +
      arrow(628, 100, 690, 100, "") + arrow(628, 220, 690, 220, "") +
      box(700, 60, 170, 80, "") + group(717, 80, 16, 8, () => true, i => hash(i) < 25) +
      box(700, 180, 170, 80, "") + group(717, 200, 16, 8, () => false, i => hash(i + 9) < 55),
    prof: { "Ausgangspunkt": "Freiwillige, die die Einschlusskriterien erfüllen und einwilligen.", "Blickrichtung": "vorwärts: von der Zuteilung zum Outcome.", "Exposition": "teilt der Zufall zu. Das unterscheidet das RCT von allen Beobachtungsstudien.", "Kennzahl": "Mittelwertdifferenz, RR, Risikodifferenz, Number Needed to Treat.", "Stärke": "Störgrößen, auch unbekannte, sind im Mittel gleich verteilt. Unterschiede lassen sich auf die Intervention zurückführen.", "Schwäche": "aufwendig, teuer, oft sehr ausgewählte Teilnehmende; nicht für Schäden oder seltene Ereignisse geeignet.", "Beispiel": "Senkt ein 12-wöchiges Krafttraining den Knieschmerz bei Arthrose stärker als eine Informationsbroschüre?" } }
];
let dk = 0;
function draw1() {
  const d = DESIGNS[dk];
  let s = `<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--fg)"/></marker></defs>`;
  s += `<line x1="40" x2="${W - 30}" y1="${AX}" y2="${AX}" stroke="var(--muted)" stroke-width="1.6" marker-end="url(#ar)"/>`;
  s += `<text class="lbl-s" x="40" y="${AX + 24}">Vergangenheit</text><text class="lbl-s" x="${W - 30}" y="${AX + 24}" text-anchor="end">Zukunft · Zeit</text>`;
  const now = [NOW, 135, 765, 68][dk];
  s += `<line x1="${now}" x2="${now}" y1="30" y2="${AX}" stroke="var(--accent)" stroke-width="1.6" stroke-dasharray="5 4"/><text class="lbl-s" x="${now}" y="22" text-anchor="middle" style="fill:var(--accent)">Studienbeginn</text>`;
  s += d.draw();
  $("d-ch").innerHTML = s;
  $("d-prof").innerHTML = Object.entries(d.prof).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
}
$("d-sw").addEventListener("click", e => { const b = pick(e, $("d-sw")); if (!b) return; dk = +b.dataset.k; draw1(); });

/* ---------- 3 Übung ---------- */
const OPTS = ["Querschnitt", "Kohorte", "Fall-Kontrolle", "RCT"];
const QS = [
  ["Wie häufig sind Nackenschmerzen bei Büroangestellten?", 0, "Eine Häufigkeit zu einem Zeitpunkt ist eine Prävalenz. Dafür reicht ein Querschnitt."],
  ["Wirkt ein 12-wöchiges Krafttraining bei Kniearthrose besser als eine Informationsbroschüre?", 3, "Eine Frage nach der Wirksamkeit einer Therapie, die man ethisch zuteilen darf: RCT."],
  ["Welche Belastungen gehen dem seltenen Cauda-equina-Syndrom voraus?", 2, "Bei einer seltenen Erkrankung müsste eine Kohorte Zehntausende jahrelang begleiten. Die Fall-Kontroll-Studie startet bei den wenigen Fällen."],
  ["Entwickeln junge Fußballer mit Cam-Morphologie später häufiger eine Hüftarthrose?", 1, "Die Exposition liegt vor dem Outcome und lässt sich nicht zuteilen. Eine Kohorte zeigt die zeitliche Reihenfolge und liefert ein Risiko."],
  ["Verzögert Rauchen die Rückkehr zum Sport nach einer Kreuzbandplastik?", 1, "Ein RCT wäre unethisch: Niemand darf zum Rauchen randomisiert werden. Eine Kohorte von Operierten, nach Rauchstatus eingeteilt, ist das beste machbare Design."]
];
$("quiz").innerHTML = QS.map(([q], i) => `<div class="q" data-i="${i}"><p>${i + 1}. ${q}</p><div class="opts">${OPTS.map((o, k) => `<button type="button" data-k="${k}">${o}</button>`).join("")}</div><p class="fb" hidden></p></div>`).join("");
$("quiz").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  const q = b.closest(".q"), [, right, why] = QS[+q.dataset.i], k = +b.dataset.k, fb = q.querySelector(".fb");
  q.querySelectorAll("button").forEach(x => x.classList.remove("right", "wrong"));
  b.classList.add(k === right ? "right" : "wrong");
  if (k !== right) q.querySelector(`button[data-k="${right}"]`).classList.add("right");
  fb.hidden = false; fb.innerHTML = `<b>${k === right ? "Richtig." : "Besser: " + OPTS[right] + "."}</b> ${why}`;
});

draw1();
})();
