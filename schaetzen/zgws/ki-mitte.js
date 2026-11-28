/* Stats Lab · Exkurs: Ist die Mitte des Konfidenzintervalls wahrscheinlicher?
   Messpraktikum Trainingsarm: n = 10, Mittelwert 0,65 cm, SD 0,65 cm. Drei Lesarten: falsche Glocke über μ,
   Intervall-Leiter um ein festes μ, Kompatibilitätskurve (p-Wert-Funktion). */
(() => {
"use strict";
const $ = id => document.getElementById(id);
if (!$("km")) return;
const { tcdf, tinv } = window.REG;
const fmt = (x, d = 2) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");
const n = 10, xb = 0.65, sd = 0.6502, se = sd / Math.sqrt(n), df = n - 1, tc = tinv(0.975, df), lo = xb - tc * se, hi = xb + tc * se;
let W = 900; const H = 320, L = 60, R = 20, T = 20, B = 64, X0 = -0.4, X1 = 1.7;
const sx = v => L + (v - X0) / (X1 - X0) * (W - L - R), sy = v => H - B - v * (H - T - B);
const pv = m => 2 * (1 - tcdf(Math.abs(xb - m) / se, df));
const tdens = t => Math.pow(1 + t * t / df, -(df + 1) / 2);
let view = 0;
function axis() {
  let s = "";
  const st = W < 600 ? 0.4 : 0.2;
  for (let v = -0.4; v <= 1.701; v += st) { const x = sx(+v.toFixed(1)); s += `<line x1="${x}" x2="${x}" y1="${T}" y2="${H - B}" stroke="var(--grid)"/><text x="${x}" y="${H - B + 18}" text-anchor="middle">${fmt(+v.toFixed(1), 1)}</text>`; }
  s += `<text x="${W - R}" y="${H - 8}" text-anchor="end">Zunahme des Oberarmumfangs in cm (Parameter μ)</text>`;
  return s;
}
const ciBar = (y, col = "var(--therapie)") => `<line x1="${sx(lo)}" x2="${sx(hi)}" y1="${y}" y2="${y}" stroke="${col}" stroke-width="5" stroke-linecap="round"/><circle cx="${sx(xb)}" cy="${y}" r="7" fill="${col}" stroke="var(--surface)" stroke-width="2"/>`;
function draw() {
  W = Math.max(420, Math.min(900, Math.round($("km").getBoundingClientRect().width) || 900)); $("km").setAttribute("viewBox", `0 0 ${W} ${H}`);
  let s = axis(); const txt = $("km-text");
  $("km-ctrl").hidden = view !== 2;
  if (view === 0) {
    let d = `M${sx(lo)},${sy(0)}`;
    for (let m = X0; m <= X1 + 1e-9; m += 0.01) { const h = tdens((m - xb) / se) * 0.8; d += `L${sx(m).toFixed(1)},${sy(h).toFixed(1)}`; }
    s += `<path d="${d}" fill="var(--beta-fill)" fill-opacity=".55" stroke="var(--beta-ink)" stroke-width="2" stroke-dasharray="6 4"/>`;
    s += `<text x="${W < 600 ? W - R : sx(xb) + 70}" y="${sy(W < 600 ? 0.97 : 0.78)}" text-anchor="${W < 600 ? "end" : "start"}" class="bad">„Wahrscheinlichkeit, dass μ hier liegt“?</text>`;
    s += `<g transform="translate(${W < 600 ? L + 24 : sx(xb) - 40},${W < 600 ? sy(0.7) : sy(0.86) - 22})"><circle r="16" cx="0" cy="0" fill="var(--beta-ink)"/><path d="M-7,-7 L7,7 M7,-7 L-7,7" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>`;
    s += ciBar(H - B - 12) + `<text x="${sx(lo)}" y="${H - B - 22}" text-anchor="middle">${fmt(lo, 2)}</text><text x="${sx(hi)}" y="${H - B - 22}" text-anchor="middle">${fmt(hi, 2)}</text>`;
    txt.innerHTML = "<b>So nicht:</b> Diese Glocke würde μ eine Wahrscheinlichkeitsverteilung geben, als wäre μ eine Zufallsgröße. Im frequentistischen Rahmen ist μ aber ein fester, unbekannter Wert. Ob er im Intervall 0,18 bis 1,12 liegt, ist schlicht wahr oder falsch, auch wenn wir es nicht wissen.";
  } else if (view === 1) {
    const mu = 0.6; let a = 7;
    const rnd = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
    const rn = () => Math.sqrt(-2 * Math.log(rnd())) * Math.cos(2 * Math.PI * rnd());
    s += `<line x1="${sx(mu)}" x2="${sx(mu)}" y1="${T - 6}" y2="${H - B}" stroke="var(--fg)" stroke-width="2.4"/><text x="${W < 600 ? sx(mu) - 6 : sx(mu) + 6}" y="${T + 6}" text-anchor="${W < 600 ? "end" : "start"}" class="strong">μ (fest, hier angenommen 0,60)</text>`;
    let miss = 0;
    for (let k = 0; k < 20; k++) {
      const v = Array.from({ length: n }, () => mu + sd * rn()), m = v.reduce((p, c) => p + c, 0) / n, s2 = Math.sqrt(v.reduce((p, c) => p + (c - m) ** 2, 0) / (n - 1)), h = tc * s2 / Math.sqrt(n);
      const y = T + 22 + k * ((H - B - T - 30) / 19), hit = m - h <= mu && mu <= m + h; if (!hit) miss++;
      const col = hit ? "var(--area-a)" : "var(--therapie)";
      s += `<line x1="${sx(m - h)}" x2="${sx(m + h)}" y1="${y}" y2="${y}" stroke="${col}" stroke-width="${hit ? 3 : 4}" stroke-linecap="round"/><circle cx="${sx(m)}" cy="${y}" r="3" fill="${col}"/>`;
    }
    txt.innerHTML = `<b>Die Wahrscheinlichkeit steckt im Verfahren.</b> Wiederholt man die Studie, wackelt das Intervall von Stichprobe zu Stichprobe, μ bleibt fest. Auf lange Sicht fangen 95 % der Intervalle μ ein; hier verfehlen ${miss} von 20 (dunkel). Für ein einzelnes Intervall gibt es danach keine Wahrscheinlichkeit mehr, nur Treffer oder Fehlschuss.`;
  } else {
    let d = "";
    for (let m = X0; m <= X1 + 1e-9; m += 0.005) d += (d ? "L" : "M") + sx(m).toFixed(1) + "," + sy(pv(m)).toFixed(1);
    for (const v of [0, 0.25, 0.5, 0.75, 1]) s += `<line x1="${L}" x2="${W - R}" y1="${sy(v)}" y2="${sy(v)}" stroke="var(--grid)"/><text x="${L - 8}" y="${sy(v) + 4}" text-anchor="end">${fmt(v, 2)}</text>`;
    s += `<text x="16" y="${(T + H - B) / 2}" transform="rotate(-90 16 ${(T + H - B) / 2})" text-anchor="middle">p-Wert für H0: μ = μ₀</text>`;
    s += `<line x1="${L}" x2="${W - R}" y1="${sy(0.05)}" y2="${sy(0.05)}" stroke="var(--fg)" stroke-dasharray="6 4"/><text x="${W - R}" y="${sy(0.05) - 6}" text-anchor="end" class="strong">p = 0,05</text>`;
    s += `<path d="${d}" fill="none" stroke="var(--therapie)" stroke-width="3"/>`;
    s += `<line x1="${sx(lo)}" x2="${sx(hi)}" y1="${sy(0.05)}" y2="${sy(0.05)}" stroke="var(--therapie)" stroke-width="6" stroke-linecap="round" stroke-opacity=".6"/>`;
    const m0 = +$("km-mu").value, p0 = pv(m0), ok = p0 >= 0.05;
    $("km-mu-v").textContent = fmt(m0, 2) + " cm";
    s += `<line x1="${sx(m0)}" x2="${sx(m0)}" y1="${sy(0)}" y2="${sy(p0)}" stroke="var(--fg)" stroke-width="1.6"/><circle cx="${sx(m0)}" cy="${sy(p0)}" r="7" fill="${ok ? "var(--therapie)" : "var(--beta-ink)"}" stroke="var(--surface)" stroke-width="2"/>`;
    s += `<text x="${sx(m0) + (m0 > 1.2 ? -10 : 10)}" y="${sy(p0) - 10}" text-anchor="${m0 > 1.2 ? "end" : "start"}" class="strong">p = ${p0 < 0.001 ? "< 0,001" : fmt(p0, 3)}</text>`;
    txt.innerHTML = `<span class="flag">Vertiefung</span> <b>Kompatibilitätskurve:</b> Für jeden denkbaren Wert μ₀ zeigt die Kurve den p-Wert des t-Tests „H0: μ = μ₀“. An der Punktschätzung 0,65 ist p = 1, an den Grenzen des Intervalls genau 0,05. Das 95-%-KI sind also alle Werte, die ein Test mit α = 5 % nicht verwerfen würde. Für μ₀ = ${fmt(m0, 2)} cm: p = ${p0 < 0.001 ? "< 0,001" : fmt(p0, 3)}, ${ok ? "mit den Daten vereinbar, liegt im Intervall" : "nicht vereinbar, liegt außerhalb"}. Die Kurve sieht aus wie eine Glocke, ist aber keine: Ihre Höhe ist ein p-Wert, keine Wahrscheinlichkeit für μ, und die Fläche darunter bedeutet nichts.`;
  }
  $("km").innerHTML = s;
}
$("km-view").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; $("km-view").querySelectorAll("button").forEach(z => z.setAttribute("aria-pressed", z === b)); view = +b.dataset.v; draw(); });
$("km-mu").addEventListener("input", draw);
$("ki-mitte").addEventListener("toggle", draw);
let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(draw, 150); });
draw();
})();
