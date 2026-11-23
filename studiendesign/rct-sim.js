/* Stats Lab · Simulationsmodell für den Block Studiendesign (RCT und „Warum randomisieren?“)
   Szenario: Kniearthrose, 12 Wochen angeleitetes Krafttraining gegen Informationsbroschüre, Schmerz auf der NRS 0 bis 10.
   Jede Person hat einen wahren Schmerz (tau), eine verborgene Motivation (m) und Messfehler. Die Motivation verbessert den
   natürlichen Verlauf und die Trainingstreue (Adhärenz). Wer trainiert, gewinnt 2 NRS-Punkte mal Adhärenz. Weil nur Menschen
   mit gemessenem Schmerz ≥ 4 eingeschlossen werden, steckt in jedem Vorher-nachher-Vergleich auch Regression zur Mitte. */
(() => {
"use strict";
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const gauss = r => { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const EFF = 2.0; // NRS-Punkte bei voller Adhärenz

// Personen für das Screening erzeugen (Merkmale, die vor der Studie feststehen)
function makePeople(seed, n) {
  const r = mulberry32(seed);
  return Array.from({ length: n }, (_, id) => {
    const age = Math.round(clamp(63 + 9 * gauss(r), 38, 88)), female = r() < 0.62, m = gauss(r), tau = clamp(5 + 1.6 * gauss(r), 0.5, 9.5);
    const p0 = Math.round(clamp(tau + 0.9 * gauss(r), 0, 10) * 10) / 10;
    const op = r() < 0.08, consent = m + 0.9 * gauss(r) > -0.75;
    const excl = age < 45 ? "Alter unter 45" : p0 < 4 ? "Schmerz unter 4" : op ? "Knie-OP in den letzten 6 Monaten" : null;
    const adh = clamp(0.5 + 0.3 * m + 0.2 * gauss(r), 0, 1);
    // Zufallsanteile des Verlaufs, unabhängig von der Gruppe gezogen, damit eine neue Zuteilung dieselben Menschen betrifft
    const e6 = gauss(r), e12 = gauss(r), c = gauss(r), ud = r(), ut = r();
    return { id, age, female, m, tau, p0, op, consent, excl, adh, e6, e12, c, ud, ut };
  });
}
// Schmerz nach 6 und 12 Wochen für eine Person in einer Gruppe ("I" Training, "K" Kontrolle)
function outcome(p, arm, o = {}) {
  const course = -0.5 - 0.35 * p.m + 0.9 * p.c;                    // natürlicher Verlauf
  const train = arm === "I" ? -EFF * p.adh : 0;                       // Trainingseffekt
  const bias = arm === "I" && o.unblind ? -0.6 : 0;                   // unverblindete Untersuchende messen in der Trainingsgruppe günstiger
  const y6 = clamp(p.tau + 0.5 * (course + train) + 0.8 * p.e6 + bias, 0, 10), y12 = clamp(p.tau + course + train + 0.8 * p.e12 + bias, 0, 10);
  return { y6: Math.round(y6 * 10) / 10, y12: Math.round(y12 * 10) / 10 };
}
// Blockrandomisierung mit Blocklänge 4: in jedem Block zweimal I, zweimal K in zufälliger Reihenfolge
function blockSequence(seed, n) {
  const r = mulberry32(seed), out = [];
  while (out.length < n) { const b = ["I", "I", "K", "K"]; for (let i = 3; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } out.push(...b); }
  return out.slice(0, n);
}
const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
const sd = a => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)); };
// Mittelwertdifferenz a − b mit 95-%-KI (Welch, Normalapproximation)
function diff(a, b) { const d = mean(a) - mean(b), se = Math.sqrt(sd(a) ** 2 / a.length + sd(b) ** 2 / b.length); return { d, lo: d - 1.96 * se, hi: d + 1.96 * se, se, na: a.length, nb: b.length }; }
window.RCTSIM = { mulberry32, gauss, clamp, makePeople, outcome, blockSequence, mean, sd, diff, EFF };
})();
