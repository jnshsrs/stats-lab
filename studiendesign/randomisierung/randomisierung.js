/* Warum randomisieren? · Stats Lab
   Station „Warum randomisieren?“: Praxisvergleich (Auswahl nach Motivation), RCT und Vorher-nachher aus derselben
   simulierten Population (Modell in ../rct-sim.js), wiederholt, mit Zerlegung des Vorher-nachher-Effekts. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const fmt = (x, d = 2) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");
const S = window.RCTSIM, { mean, sd, diff } = S;
const POP = S.makePeople(77, 6000).filter(p => !p.excl), N = 120;
POP.forEach(p => { p.oI = S.outcome(p, "I"); p.oK = S.outcome(p, "K"); });
const TRUTH = -S.EFF * mean(POP.map(p => p.adh));
const rng = S.mulberry32(2024);
const DES = [["Praxisvergleich", "Therapeutin wählt aus"], ["RCT", "Zufall teilt zu"], ["Vorher-nachher", "nur Trainingsgruppe"]];
let runs = [], last = null;

function study() {
  const sel = +$("sel").value, s = Array.from({ length: N }, () => POP[Math.floor(rng() * POP.length)]);
  const chI = p => p.oI.y12 - p.p0, chK = p => p.oK.y12 - p.p0;
  const rct = s.map(p => rng() < 0.5), prx = s.map(p => rng() < 1 / (1 + Math.exp(-sel * p.m)));
  const split = (a) => [s.filter((p, i) => a[i]), s.filter((p, i) => !a[i])];
  const [rI, rK] = split(rct), [pI, pK] = split(prx);
  const pre = rI.map(chI), pm = mean(pre), pse = sd(pre) / Math.sqrt(pre.length);
  return {
    est: [diff(pI.map(chI), pK.map(chK)), diff(rI.map(chI), rK.map(chK)), { d: pm, lo: pm - 1.96 * pse, hi: pm + 1.96 * pse }],
    bal: { pI, pK, rI, rK }
  };
}
function draw() {
  const W = 900, H = 400, L = 190, R = 20, T = 20, rowH = 110, x = v => L + (v + 3.5) / 4.5 * (W - L - R);
  let s = "";
  [-3, -2, -1, 0, 1].forEach(v => s += `<line x1="${x(v)}" x2="${x(v)}" y1="${T}" y2="${H - 40}" stroke="var(--grid)"/><text x="${x(v)}" y="${H - 22}" text-anchor="middle">${fmt(v, 0)}</text>`);
  s += `<line x1="${x(0)}" x2="${x(0)}" y1="${T}" y2="${H - 40}" stroke="var(--fg)" stroke-width="1.4"/>`;
  s += `<line x1="${x(TRUTH)}" x2="${x(TRUTH)}" y1="${T - 6}" y2="${H - 40}" stroke="var(--accent)" stroke-width="2" stroke-dasharray="6 4"/><text x="${x(TRUTH)}" y="${T - 8}" text-anchor="middle" style="fill:var(--accent)">wahrer Effekt ${fmt(TRUTH)}</text>`;
  s += `<text x="${W - R}" y="${H - 4}" text-anchor="end">geschätzter Effekt des Trainings auf den Schmerz (NRS-Punkte)</text>`;
  DES.forEach(([lab, sub], k) => {
    const y0 = T + 20 + k * rowH, base = y0 + 70;
    s += `<text x="${L - 14}" y="${y0 + 40}" text-anchor="end" class="strong">${lab}</text><text x="${L - 14}" y="${y0 + 58}" text-anchor="end">${sub}</text>`;
    // frühere Wiederholungen als gestapelte Punkte (Bins 0,05)
    const bins = {};
    runs.forEach(r => { const b = Math.round(r[k] / 0.05); bins[b] = (bins[b] || 0) + 1; const h = bins[b]; if (h <= 14) s += `<circle cx="${x(b * 0.05).toFixed(1)}" cy="${base - (h - 1) * 4.2}" r="2.2" fill="var(--pal-3)"/>`; });
    if (runs.length) { const m = mean(runs.map(r => r[k])); s += `<line x1="${x(m)}" x2="${x(m)}" y1="${y0 + 6}" y2="${base + 8}" stroke="var(--fg)" stroke-width="2"/><text x="${x(m)}" y="${base + 22}" text-anchor="middle" class="strong halo">Mittel ${fmt(m)}</text>`; }
    if (last) { const e = last.est[k], yy = y0 + 18; s += `<line x1="${x(e.lo)}" x2="${x(e.hi)}" y1="${yy}" y2="${yy}" stroke="var(--beta-ink)" stroke-width="3"/><circle cx="${x(e.d)}" cy="${yy}" r="6" fill="var(--beta-ink)"/>`; }
  });
  $("r-ch").innerHTML = s;
  $("nrun").textContent = runs.length ? `${runs.length} Studien` : "";
  if (last) {
    const b = last.bal, mm = G => fmt(mean(G.map(p => p.m))), pp = G => fmt(mean(G.map(p => p.p0)), 1);
    $("r-tab").innerHTML = `<thead><tr><th>aktuelle Studie</th><th>Praxis: Training</th><th>Praxis: kein Training</th><th>RCT: Training</th><th>RCT: Kontrolle</th></tr></thead><tbody>
      <tr><td>n</td><td>${b.pI.length}</td><td>${b.pK.length}</td><td>${b.rI.length}</td><td>${b.rK.length}</td></tr>
      <tr><td>Schmerz zu Beginn</td><td>${pp(b.pI)}</td><td>${pp(b.pK)}</td><td>${pp(b.rI)}</td><td>${pp(b.rK)}</td></tr>
      <tr><td>Motivation (verborgen, z-Wert)</td><td>${mm(b.pI)}</td><td>${mm(b.pK)}</td><td>${mm(b.rI)}</td><td>${mm(b.rK)}</td></tr></tbody>`;
  } else $("r-tab").innerHTML = "";
  const sel = +$("sel").value;
  if (runs.length >= 20) {
    const m = [0, 1, 2].map(k => mean(runs.map(r => r[k])));
    $("r-c").innerHTML = `Nach ${runs.length} Studien liegt das RCT im Mittel bei ${fmt(m[1])}, also beim wahren Effekt (${fmt(TRUTH)}); einzelne RCTs streuen, aber ohne Richtung. ${sel > 0 ? `Der Praxisvergleich liegt im Mittel bei ${fmt(m[0])}: Er überschätzt den Nutzen um ${fmt(TRUTH - m[0])} Punkte, weil die Motivierten ins Training kamen und es ihnen ohnehin besser ging. Mehr Daten helfen dagegen nicht, die Verzerrung bleibt.` : "Ohne Auswahl nach Motivation ist der Praxisvergleich so gut wie ein RCT, weil die Zuteilung dann praktisch zufällig ist. In der Realität ist sie das nie."} Der Vorher-nachher-Vergleich liegt bei ${fmt(m[2])} und schreibt dem Training alles zu, was sich ohnehin bessert (Abschnitt 3).`;
  } else if (last) {
    $("r-c").innerHTML = `Eine einzelne Studie: Praxisvergleich ${fmt(last.est[0].d)}, RCT ${fmt(last.est[1].d)}, Vorher-nachher ${fmt(last.est[2].d)}. Eine Studie allein sagt wenig darüber, welches Design verlässlich ist. Wiederholen Sie die Studien 200-mal.`;
  } else $("r-c").innerHTML = `Starten Sie mit „Eine Studie“. Die Tabelle zeigt dann, wie sich die Gruppen zu Beginn unterscheiden, auch in der Motivation, die in echten Daten niemand sieht.`;
}
const add = () => { last = study(); runs.push(last.est.map(e => e.d)); };
let timer = null;
$("one").addEventListener("click", () => { add(); draw(); });
$("many").addEventListener("click", () => {
  if (timer) return; let n = 0;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) { for (let i = 0; i < 200; i++) add(); draw(); return; }
  timer = setInterval(() => { for (let i = 0; i < 8; i++) add(); n += 8; draw(); if (n >= 200) { clearInterval(timer); timer = null; } }, 40);
});
$("reset").addEventListener("click", () => { runs = []; last = null; draw(); });
$("sel").addEventListener("input", () => { $("sel-v").textContent = ["keine", "schwach", "mäßig", "deutlich", "stark", "sehr stark", "extrem"][+$("sel").value * 2]; runs = []; last = null; draw(); });
$("sel-v").textContent = "deutlich";

/* ---------- 2 Gleicher t-Test, andere Aussage ---------- */
function erf(x) { const sg = x < 0 ? -1 : 1; x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); return sg * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)); }
const pval = e => 2 * (1 - 0.5 * (1 + erf(Math.abs(e.d / e.se) / Math.SQRT2)));
const fpv = p => p < 0.001 ? "< 0,001" : fmt(p, 3);
function drawInterp() {
  const st = study(), [P, R] = st.est;
  const row = (lab, e, say) => `<tr><td>${lab}</td><td>${fmt(e.d)}</td><td style="white-space:nowrap">${fmt(e.lo)} bis ${fmt(e.hi)}</td><td style="white-space:nowrap">${fpv(pval(e))}</td><td style="text-align:left;white-space:normal">${say}</td></tr>`;
  $("i-tab").innerHTML = `<thead><tr><th>Studie</th><th>Unterschied (NRS)</th><th>95-%-KI</th><th>p</th><th style="text-align:left">Was man sagen darf</th></tr></thead><tbody>` +
    row("Beobachtung (Praxis)", P, "Trainierende haben im Mittel weniger Schmerz. Ursache offen.") + row("RCT", R, "Das Training senkt den Schmerz.") + `</tbody>`;
  const sig = e => pval(e) < 0.05;
  $("i-c").innerHTML = `Diesmal: Praxis ${fmt(P.d)} Punkte (p ${fpv(pval(P)).startsWith("<") ? fpv(pval(P)) : "= " + fpv(pval(P))}), RCT ${fmt(R.d)} Punkte (p ${fpv(pval(R)).startsWith("<") ? fpv(pval(R)) : "= " + fpv(pval(R))}). ${sig(P) && sig(R) ? "Beide Tests sind signifikant, die Rechnung ist dieselbe." : "Ob signifikant oder nicht, die Rechnung ist in beiden Studien dieselbe."} Der Praxisvergleich zeigt hier im Mittel einen größeren Unterschied als das RCT (Abschnitt 1): Ein Teil davon geht auf die Motivation zurück, nicht auf das Training. Ein kleinerer p-Wert macht die Beobachtungsstudie nicht aussagekräftiger; er sagt nur, dass der Unterschied kaum Zufall ist, nicht, woher er kommt.`;
}
$("i-draw").addEventListener("click", drawInterp);

/* ---------- 3 Zerlegung Vorher-nachher ---------- */
(() => {
  const tot = mean(POP.map(p => p.oI.y12 - p.p0)), rtm = mean(POP.map(p => p.tau - p.p0)), nat = mean(POP.map(p => -0.5 - 0.35 * p.m + 0.9 * p.c)), tr = TRUTH;
  const rest = tot - rtm - nat - tr, mx = Math.abs(tot);
  const row = (l, v, col) => `<div class="row"><span>${l}</span><div class="bar"><i style="width:${(Math.abs(v) / mx * 100).toFixed(1)}%;background:${col}"></i></div><span class="val">${fmt(v)}</span></div>`;
  $("pp-m").innerHTML = row("gesamte Veränderung", tot, "var(--fg)") + row("Training", tr, "var(--beta-ink)") + row("natürlicher Verlauf", nat, "var(--therapie)") + row("Regression zur Mitte", rtm, "var(--pal-3)") + (Math.abs(rest) >= 0.05 ? row("Rundung, Messgrenzen", rest, "var(--muted)") : "");
  $("pp-c").innerHTML = `Die Trainingsgruppe verbessert sich im Mittel um ${fmt(-tot)} NRS-Punkte. Nur ${fmt(-tr)} davon gehen auf das Training zurück, also ${fmt(tr / tot * 100, 0)} %. Der Rest wäre auch ohne Training eingetreten: ${fmt(-nat)} durch den natürlichen Verlauf und ${fmt(-rtm)} durch Regression zur Mitte. Ein Vorher-nachher-Vergleich hätte das Training um das ${fmt(tot / tr, 1).replace(",0", "")}-Fache überschätzt.`;
})();

draw();
drawInterp();
})();
