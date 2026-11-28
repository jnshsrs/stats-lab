/* Stats Lab · Einfaktorielle ANOVA
   Pflegende Angehörige, Belastung (Zarit Burden Interview), drei Versorgungsformen, simuliert.
   1 Alpha-Inflation durch drei t-Tests (Simulation), 2 Streuungszerlegung und F, 3 F-Verteilung, 4 Bonferroni-Paarvergleiche. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const { fmt, rng, rnorm, frame, mean, sd } = window.GM;
const { fcdf, tcdf, tinv, lgamma } = window.REG;
const TB = (t, fb) => window.katex ? texBlock(t) : fb;
const tz = x => String(x).replace(/\./g, "{.}").replace(/,/g, "{,}").replace(/−/g, "-");
const fp = p => p < 0.001 ? "< 0,001" : fmt(p, 3);
const NM = ["ohne Unterstützung", "Pflegeberatung", "Beratung + Angehörigengruppe"], COL = ["var(--kontrolle)", "var(--therapie)", "var(--beta-ink)"];
const n = 20, k = 3, N = n * k, df1 = k - 1, df2 = N - k;
function anova(G) {
  const gm = mean(G.flat()), ms = G.map(mean);
  const qz = G.reduce((s, g, j) => s + g.length * (ms[j] - gm) ** 2, 0), qi = G.reduce((s, g, j) => s + g.reduce((a, v) => a + (v - ms[j]) ** 2, 0), 0);
  const F = (qz / df1) / (qi / df2);
  return { gm, ms, qz, qi, F, p: 1 - fcdf(F, df1, df2), eta: qz / (qz + qi), mse: qi / df2 };
}
const t2 = (a, b) => { const s2 = ((a.length - 1) * sd(a) ** 2 + (b.length - 1) * sd(b) ** 2) / (a.length + b.length - 2), t = (mean(a) - mean(b)) / Math.sqrt(s2 * (1 / a.length + 1 / b.length)); return 2 * (1 - tcdf(Math.abs(t), a.length + b.length - 2)); };

/* ---------- 1 Alpha-Inflation ---------- */
let simN = 0, anyT = 0, anyF = 0, seed = 100;
function bar(lab, v, col, note) { return `<div class="row"><span>${lab}</span><div class="bar"><i style="width:${Math.min(100, v * 100 / 0.3)}%;background:${col}"></i><b style="position:absolute;left:${0.05 * 100 / 0.3}%;top:-3px;bottom:-3px;width:2px;background:var(--fg)"></b></div><span class="val">${simN ? fmt(v * 100, 1) + " %" : "–"}</span></div>`; }
function draw1() {
  $("mt").innerHTML = bar("mindestens ein t-Test signifikant", simN ? anyT / simN : 0, "var(--beta-ink)") + bar("ANOVA signifikant", simN ? anyF / simN : 0, "var(--therapie)");
  $("sim-n").textContent = simN ? `${simN.toLocaleString("de-DE")} Studien, je 3 × 20 Personen; Strich bei 5 %` : "";
  $("tk").innerHTML = `<thead><tr><th>Gruppen k</th><th>Paarvergleiche</th><th>Chance auf mindestens einen Fehlalarm</th></tr></thead><tbody>${[2, 3, 4, 5, 6].map(g => { const m = g * (g - 1) / 2; return `<tr${g === 3 ? ' class="dd"' : ""}><td>${g}</td><td>${m}</td><td>${fmt((1 - 0.95 ** m) * 100, 1)} %</td></tr>`; }).join("")}</tbody>`;
  $("cl1").innerHTML = simN ? `In ${fmt(anyT / simN * 100, 1)} % der Studien war mindestens einer der drei t-Tests signifikant, obwohl es keinen Unterschied gibt; die ANOVA lag bei ${fmt(anyF / simN * 100, 1)} %, also bei den vereinbarten 5 %. Die Tabelle zeigt die Faustrechnung 1 − 0,95<sup>m</sup> für m unabhängige Tests; weil die drei Paarvergleiche Gruppen teilen, liegt der simulierte Wert etwas darunter.` : "Bei drei Gruppen gibt es drei Paarvergleiche. Wie oft schlägt mindestens einer an, wenn es keinen Unterschied gibt? Starten Sie die Simulation.";
}
$("sim").addEventListener("click", () => {
  const u = rng(seed++), z = rnorm(u);
  for (let s = 0; s < 1000; s++) {
    const G = [0, 1, 2].map(() => Array.from({ length: n }, () => 30 + 12 * z()));
    if (t2(G[0], G[1]) < 0.05 || t2(G[0], G[2]) < 0.05 || t2(G[1], G[2]) < 0.05) anyT++;
    if (anova(G).p < 0.05) anyF++;
    simN++;
  }
  draw1();
});
draw1();

/* ---------- 2 Streuungszerlegung ---------- */
// feste Zufallszahlen, je Gruppe auf Mittel 0 und SD 1 standardisiert: Gruppenmittel und SD folgen exakt den Reglern
const Z = (() => { const u = rng(42), z = rnorm(u); return [0, 1, 2].map(() => { const v = Array.from({ length: n }, () => z()), m = mean(v), s = sd(v); return v.map(x => (x - m) / s); }); })();
let G = [], A = null;
function draw2() {
  const eff = +$("eff").value, sw = +$("sdw").value, base = 40, mu = [base, base - eff / 2, base - eff];
  $("eff-v").textContent = `${fmt(eff, 0)} Punkte`; $("sdw-v").textContent = `${fmt(sw, 0)} Punkte`;
  G = Z.map((zz, j) => zz.map(x => mu[j] + sw * x)); A = anova(G);
  const f = frame(900, 380, -0.6, 2.6, 0, 88, { P: { L: 56, R: 16, T: 14, B: 46 }, nx: 0, ny: 8, yl: "Belastung (ZBI, 0 bis 88)" });
  let s = f.s;
  s += `<line x1="${f.P.L}" x2="${900 - f.P.R}" y1="${f.sy(A.gm)}" y2="${f.sy(A.gm)}" stroke="var(--beta-ink)" stroke-width="2" stroke-dasharray="7 5"/><text x="${f.P.L + 6}" y="${f.sy(A.gm) - 6}" style="fill:var(--beta-ink)" class="strong halo">Gesamtmittel ${fmt(A.gm, 1)}</text>`;
  G.forEach((g, j) => {
    const x0 = f.sx(j);
    g.forEach((v, i) => { const x = x0 - 70 + (i + 0.5) * 7; s += `<line x1="${x}" x2="${x}" y1="${f.sy(A.ms[j])}" y2="${f.sy(v)}" stroke="${COL[j]}" stroke-opacity=".35"/><circle cx="${x}" cy="${f.sy(v)}" r="3.4" fill="${COL[j]}"/>`; });
    s += `<line x1="${x0 - 80}" x2="${x0 + 80}" y1="${f.sy(A.ms[j])}" y2="${f.sy(A.ms[j])}" stroke="var(--fg)" stroke-width="3"/>`;
    if (Math.abs(A.ms[j] - A.gm) > 0.8) s += `<line x1="${x0 + 88}" x2="${x0 + 88}" y1="${f.sy(A.gm)}" y2="${f.sy(A.ms[j])}" stroke="var(--fg)" stroke-width="2.5" marker-end="url(#ar)"/>`;
    s += `<text x="${x0}" y="${380 - 46 + 18}" text-anchor="middle" class="strong">${NM[j]}</text><text x="${x0}" y="${380 - 46 + 34}" text-anchor="middle">M = ${fmt(A.ms[j], 1)}</text>`;
  });
  s = `<defs><marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--fg)"/></marker></defs>` + s;
  $("c2").innerHTML = s;
  const qt = A.qz + A.qi, w = v => (v / qt * 100).toFixed(1);
  $("qs").innerHTML = `<div class="row"><span>zwischen den Gruppen (erklärt)</span><div class="bar"><i style="width:${w(A.qz)}%;background:var(--therapie)"></i></div><span class="val">${fmt(A.qz / qt * 100, 0)} %</span></div><div class="row"><span>innerhalb der Gruppen (Rest)</span><div class="bar"><i style="width:${w(A.qi)}%;background:var(--kontrolle)"></i></div><span class="val">${fmt(A.qi / qt * 100, 0)} %</span></div>`;
  $("f2").innerHTML = TB(String.raw`F = \frac{QS_{\text{zwischen}} / (k-1)}{QS_{\text{innerhalb}} / (N-k)} = \frac{${tz(fmt(A.qz, 1))} / ${df1}}{${tz(fmt(A.qi, 1))} / ${df2}} = \frac{${tz(fmt(A.qz / df1, 1))}}{${tz(fmt(A.mse, 1))}} = ${tz(fmt(A.F, 2))}, \qquad \eta^2 = \frac{QS_{\text{zwischen}}}{QS_{\text{gesamt}}} = ${tz(fmt(A.eta, 2))}`, `F = ${fmt(A.F, 2)}, η² = ${fmt(A.eta, 2)}`);
  $("t2").innerHTML = `<thead><tr><th>Quelle</th><th>Quadratsumme</th><th>df</th><th>Mittlere Quadratsumme</th><th>F</th><th>Sig.</th></tr></thead><tbody><tr><td>Zwischen den Gruppen</td><td>${fmt(A.qz, 1)}</td><td>${df1}</td><td>${fmt(A.qz / df1, 1)}</td><td>${fmt(A.F, 2)}</td><td>${fp(A.p)}</td></tr><tr><td>Innerhalb der Gruppen</td><td>${fmt(A.qi, 1)}</td><td>${df2}</td><td>${fmt(A.mse, 1)}</td><td></td><td></td></tr><tr class="tot"><td>Gesamt</td><td>${fmt(qt, 1)}</td><td>${N - 1}</td><td></td><td></td><td></td></tr></tbody>`;
  $("cl2").innerHTML = `Die Pfeile neben den Gruppen zeigen den Abstand jedes Gruppenmittels zum Gesamtmittel: Das ist der Teil, den die Gruppe erklärt. Die dünnen Linien zeigen, wie weit jede Person von ihrem Gruppenmittel abweicht: der Rest. ${A.p < 0.05 ? `Mit F = ${fmt(A.F, 2)} ist der erklärte Teil größer, als bei reinem Zufall zu erwarten wäre (p = ${fp(A.p)}).` : `Mit F = ${fmt(A.F, 2)} ist der erklärte Teil nicht größer, als bei reinem Zufall zu erwarten wäre (p = ${fp(A.p)}).`} η² = ${fmt(A.eta, 2)} heißt: ${fmt(A.eta * 100, 0)} % der Unterschiede in der Belastung gehen auf die Versorgungsform zurück. Mehr Streuung innerhalb macht denselben Abstand der Mittel weniger deutlich.`;
  draw3(); draw4();
}
["eff", "sdw"].forEach(id => $(id).addEventListener("input", draw2));

/* ---------- 3 F-Verteilung ---------- */
const fdens = (x, a, b) => x <= 0 ? 0 : Math.exp(lgamma((a + b) / 2) - lgamma(a / 2) - lgamma(b / 2) + (a / 2) * Math.log(a / b) + (a / 2 - 1) * Math.log(x) - ((a + b) / 2) * Math.log(1 + a * x / b));
const finv = (p, a, b) => { let lo = 0, hi = 100; for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (fcdf(m, a, b) < p) lo = m; else hi = m; } return (lo + hi) / 2; };
const FK = finv(0.95, df1, df2);
function draw3() {
  const xm = Math.max(8, Math.ceil(A.F + 1)), ym = 1.05;
  const f = frame(900, 300, 0, xm, 0, ym, { P: { L: 50, R: 16, T: 14, B: 46 }, nx: 8, ny: 0, xl: `F (df = ${df1} und ${df2})`, fx: v => fmt(v, 0) });
  const path = (a, b, close) => { let d = ""; for (let x = a; x <= b + 1e-9; x += (b - a) / 200) d += (d ? "L" : "M") + f.sx(x).toFixed(1) + "," + f.sy(fdens(x, df1, df2)).toFixed(1); return close ? `M${f.sx(a)},${f.sy(0)}L` + d.slice(1) + `L${f.sx(b)},${f.sy(0)}Z` : d; };
  let s = f.s + `<path d="${path(FK, xm, 1)}" fill="var(--alpha-fill)"/>`;
  if (A.F < xm) s += `<path d="${path(Math.max(A.F, 0.001), xm, 1)}" fill="var(--therapie)" fill-opacity=".55"/>`;
  s += `<path d="${path(0.001, xm)}" fill="none" stroke="var(--fg)" stroke-width="2"/>`;
  s += `<line x1="${f.sx(FK)}" x2="${f.sx(FK)}" y1="${f.sy(0)}" y2="${f.sy(0.55)}" stroke="var(--fg)" stroke-dasharray="5 4"/><text x="${f.sx(FK) + 6}" y="${f.sy(0.5)}" class="strong">kritischer Wert ${fmt(FK, 2)}</text>`;
  s += `<line x1="${f.sx(A.F)}" x2="${f.sx(A.F)}" y1="${f.sy(0)}" y2="${f.sy(0.9)}" stroke="var(--therapie)" stroke-width="3"/><text x="${f.sx(A.F) + (A.F > xm * 0.7 ? -6 : 6)}" y="${f.sy(0.85)}" text-anchor="${A.F > xm * 0.7 ? "end" : "start"}" class="strong">beobachtet F = ${fmt(A.F, 2)}, p = ${fp(A.p)}</text>`;
  $("c3").innerHTML = s;
  $("cl3").innerHTML = `Bei ${df1} und ${df2} Freiheitsgraden liegt der kritische Wert bei F = ${fmt(FK, 2)}. Das beobachtete F = ${fmt(A.F, 2)} liegt ${A.F > FK ? "im Ablehnungsbereich: H0 wird verworfen" : "darunter: H0 wird beibehalten"}. Anders als beim t-Test ist der F-Test immer einseitig: Unterschiede in jede Richtung machen F größer.`;
}

/* ---------- 4 Post-hoc ---------- */
function draw4() {
  const P = [[1, 0], [2, 0], [2, 1]], m = P.length, tc = tinv(1 - 0.05 / (2 * m), df2);
  const rows = P.map(([a, b]) => { const d = A.ms[a] - A.ms[b], se = Math.sqrt(A.mse * (2 / n)), p = Math.min(1, m * 2 * (1 - tcdf(Math.abs(d / se), df2))); return { a, b, d, lo: d - tc * se, hi: d + tc * se, p }; });
  $("t4").innerHTML = `<thead><tr><th>Vergleich</th><th>Differenz</th><th>95-%-KI (Bonferroni)</th><th>p (Bonferroni)</th></tr></thead><tbody>${rows.map(r => `<tr${r.p < 0.05 ? ' class="hl"' : ""}><td class="l">${NM[r.a]} − ${NM[r.b]}</td><td>${fmt(r.d, 1)}</td><td>${fmt(r.lo, 1)} bis ${fmt(r.hi, 1)}</td><td>${fp(r.p)}</td></tr>`).join("")}</tbody>`;
  const sig = rows.filter(r => r.p < 0.05);
  $("cl4").innerHTML = A.p >= 0.05 ? "Die ANOVA ist nicht signifikant. Post-hoc-Vergleiche sind dann in der Regel nicht angezeigt; wer sie trotzdem rechnet, findet meist nichts oder sucht nach Zufallsbefunden." : sig.length ? `Signifikant nach Korrektur: ${sig.map(r => `${NM[r.a]} gegen ${NM[r.b]} (${fmt(r.d, 1)} Punkte)`).join("; ")}. Negative Differenzen heißen geringere Belastung.` : "Die ANOVA ist signifikant, aber kein Paarvergleich übersteht die Korrektur. Das kommt vor, wenn sich das Muster auf mehrere kleine Unterschiede verteilt.";
  $("rep").innerHTML = `„Die Belastung unterschied sich zwischen den Versorgungsformen ${A.p < 0.05 ? "" : "nicht "}signifikant, F(${df1}, ${df2}) = ${fmt(A.F, 2)}, p = ${fp(A.p)}, η² = ${fmt(A.eta, 2)}.${A.p < 0.05 && sig.length ? ` Paarvergleiche mit Bonferroni-Korrektur: ${sig.map(r => `${NM[r.a]} gegen ${NM[r.b]} ${fmt(r.d, 1)} Punkte (95-%-KI ${fmt(r.lo, 1)} bis ${fmt(r.hi, 1)})`).join("; ")}.` : ""}“`;
}
draw2();
})();
