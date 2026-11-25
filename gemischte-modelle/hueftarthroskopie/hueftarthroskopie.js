/* Reha nach Hüftarthroskopie · Stats Lab
   Offene RCT-Daten (Müller-Torrente et al. 2021): Verläufe je Gruppe, gemischtes Modell Gruppe × Zeit (kategorial)
   mit Zufallsachsenabschnitt pro Person (REML, lmm.js), Vergleich mit t-Test je Zeitpunkt, Werkstatt. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const { fmt, fp, frame, pick, mean, sd, ttest, tz } = window.GM;
const { tcdf, tinv } = window.REG;
const TB = (t, fb) => window.katex ? texBlock(t) : fb;
const TS = (t, fb) => window.katex ? texSteps(t) : fb;
const C = window.FAI.cols, R = window.FAI.rows.map(r => Object.fromEntries(C.map((c, i) => [c, r[i]])));
const IDS = [...new Set(R.map(r => r.id))];
const TL = ["vor OP", "Woche 4", "Woche 14"];
const META = {
  schmerz_vas: { lab: "Schmerz (VAS)", unit: "Punkte", lo: 0, hi: 10, better: -1, d: 2 },
  flexion: { lab: "Flexion", unit: "Grad", better: 1, d: 1 }, extension: { lab: "Extension", unit: "Grad", better: 1, d: 1 },
  abduktion: { lab: "Abduktion", unit: "Grad", better: 1, d: 1 }, adduktion: { lab: "Adduktion", unit: "Grad", better: 1, d: 1 },
  innenrotation: { lab: "Innenrotation", unit: "Grad", better: 1, d: 1 }, aussenrotation: { lab: "Außenrotation", unit: "Grad", better: 1, d: 1 },
  mhhs: { lab: "mHHS", unit: "Punkte", lo: 0, hi: 100, better: 1, d: 1 }
};
let v = "schmerz_vas", locf = 0;
const use = r => r[v] !== null && (locf || !r.fortgeschrieben);

function fitModel(vr, withLocf) {
  const rows = R.filter(r => r[vr] !== null && (withLocf || !r.fortgeschrieben));
  const times = [1, 2].filter(t => rows.some(r => r.zeit_nr === t));
  const X = rows.map(r => { const iv = r.gruppe === "Intervention" ? 1 : 0; return [1, ...times.map(t => +(r.zeit_nr === t)), iv, ...times.map(t => iv * (r.zeit_nr === t))]; });
  const f = window.LMM.fit(rows.map(r => r[vr]), X, X.map(() => [1]), rows.map(r => r.id));
  const k = times.length, df = new Set(rows.map(r => r.id)).size - 2;
  const names = ["Kontrolle vor OP (Achsenabschnitt)", ...times.map(t => `Veränderung bis ${TL[t]}, Kontrolle`), "Intervention minus Kontrolle vor OP", ...times.map(t => `Gruppe × ${TL[t]}: zusätzliche Veränderung Intervention`)];
  return { f, times, k, df, names, n: rows.length, persons: new Set(rows.map(r => r.id)).size };
}
const ci = (b, se, df) => { const tc = tinv(0.975, df); return [b - tc * se, b + tc * se]; };
const pv = (b, se, df) => 2 * (1 - tcdf(Math.abs(b / se), df));

function cell(g, t) { return R.filter(r => r.gruppe === g && r.zeit_nr === t && use(r)).map(r => r[v]); }
function draw2() {
  const m = META[v], vals = R.filter(use).map(r => r[v]);
  const lo = m.lo ?? Math.floor((Math.min(...vals) - 5) / 10) * 10, hi = m.hi ?? Math.ceil((Math.max(...vals) + 5) / 10) * 10;
  [["Kontrolle", "c2k", "var(--kontrolle-ink)"], ["Intervention", "c2i", "var(--therapie)"]].forEach(([g, id, col]) => {
    const f = frame(520, 400, -0.35, 2.35, lo, hi, { P: { L: 46, R: 14, T: 14, B: 40 }, nx: 0, yl: `${m.lab} (${m.unit})` });
    let s = f.s;
    TL.forEach((l, t) => s += `<text x="${f.sx(t)}" y="${400 - 40 + 20}" text-anchor="middle" class="strong">${l}</text>`);
    IDS.filter(id2 => R.find(r => r.id === id2).gruppe === g).forEach((pid, j) => {
      const pts = R.filter(r => r.id === pid && use(r)).sort((a, b) => a.zeit_nr - b.zeit_nr), jit = ((j * 37) % 17 - 8) / 100;
      const lf = R.some(r => r.id === pid && r.fortgeschrieben) && locf;
      if (pts.length > 1) s += `<polyline points="${pts.map(r => `${f.sx(r.zeit_nr + jit)},${f.sy(r[v])}`).join(" ")}" fill="none" stroke="${lf ? "var(--beta-ink)" : "var(--pal-3)"}" stroke-width="${lf ? 2 : 1.2}" ${lf ? 'stroke-dasharray="5 4"' : ""} stroke-opacity="${lf ? 1 : .7}"/>`;
      pts.forEach(r => s += `<circle cx="${f.sx(r.zeit_nr + jit)}" cy="${f.sy(r[v])}" r="2.4" fill="${r.fortgeschrieben ? "var(--beta-ink)" : "var(--pal-4)"}"/>`);
    });
    const ms = [0, 1, 2].map(t => { const a = cell(g, t); return a.length ? [t, mean(a), a.length > 1 ? tinv(0.975, a.length - 1) * sd(a) / Math.sqrt(a.length) : 0] : null; }).filter(Boolean);
    s += `<polyline points="${ms.map(([t, mu]) => `${f.sx(t)},${f.sy(mu)}`).join(" ")}" fill="none" stroke="${col}" stroke-width="4"/>`;
    ms.forEach(([t, mu, h]) => s += `<line x1="${f.sx(t)}" x2="${f.sx(t)}" y1="${f.sy(mu - h)}" y2="${f.sy(mu + h)}" stroke="var(--fg)" stroke-width="2.4"/><circle cx="${f.sx(t)}" cy="${f.sy(mu)}" r="6" fill="${col}" stroke="var(--surface)" stroke-width="2"/>`);
    $(id).innerHTML = s;
  });
  const row = g => `<tr><td>${g === "Kontrolle" ? "Standardversorgung" : "Supervidierte Reha"}</td>${[0, 1, 2].map(t => { const a = cell(g, t); return `<td>${a.length ? `${fmt(mean(a), m.d)} (${fmt(sd(a), m.d)})` : "nicht erhoben"}</td>`; }).join("")}<td>${[0, 1, 2].map(t => cell(g, t).length).join(" / ")}</td></tr>`;
  $("t2").innerHTML = `<thead><tr><th>Mittelwert (SD)</th>${TL.map(l => `<th>${l}</th>`).join("")}<th>n</th></tr></thead><tbody>${row("Kontrolle")}${row("Intervention")}</tbody>`;
  const b0 = mean(cell("Intervention", 0)) - mean(cell("Kontrolle", 0));
  $("cl2").innerHTML = `Vor der OP liegt die Reha-Gruppe ${fmt(Math.abs(b0), m.d)} ${m.unit} ${b0 > 0 ? "höher" : "niedriger"} als die Kontrollgruppe. ` + (v === "schmerz_vas" ? "Trotz Randomisierung hatte sie also mehr Schmerz. Das muss die Auswertung berücksichtigen, sonst wird der Vorteil der Reha in Woche 14 unterschätzt." : "Beachten Sie, wie groß die Streuung zwischen den Personen ist im Vergleich zur Veränderung über die Zeit: genau dafür ist der Zufallsachsenabschnitt da.");
}

function draw3() {
  const m = META[v], M = fitModel(v, locf), { f, times, k, df, names } = M, d = m.d;
  const W = t => t === 1 ? "W4" : "W14";
  const terms = ["\\beta_0", ...times.map((t, j) => `\\beta_${j + 1}\\cdot \\text{${W(t)}}_{ij}`), `\\beta_${k + 1}\\cdot \\text{Int}_i`, ...times.map((t, j) => `\\beta_${k + 2 + j}\\cdot \\text{Int}_i \\cdot \\text{${W(t)}}_{ij}`)];
  $("f3").innerHTML = TB(`\\text{${tz(m.lab)}}_{ij} = ${terms.join(" + ")} + u_i + e_{ij}`, "Modellgleichung") +
    `<span class="dim">Hilfsvariablen (0 oder 1): ${times.map(t => `${W(t)} = 1 bei ${TL[t]}`).join(", ")}, sonst 0; Int = 1 in der Reha-Gruppe, 0 in der Kontrollgruppe. u<sub>i</sub>: Abweichung der Person i vom Mittel ihrer Gruppe, e<sub>ij</sub>: Rest der einzelnen Messung.</span>`;
  const dir = b => b < 0 ? "sinkt" : "steigt", U = m.unit, A = x => fmt(Math.abs(x), d);
  const sym = ["β₀", ...times.map((_, j) => "β" + "₁₂"[j]), "β" + "₁₂₃"[k], ...times.map((_, j) => "β" + "₃₄₅"[k - 1 + j])];
  const interp = i => {
    const b = f.beta[i];
    if (i === 0) return `Mittelwert der Kontrollgruppe vor der OP: ${fmt(b, d)} ${U}. Alle anderen Koeffizienten sind Abweichungen davon.`;
    if (i <= k) return `In der Kontrollgruppe ${dir(b)} der Wert bis ${TL[times[i - 1]]} um ${A(b)} ${U}. Das ist der Verlauf ohne Reha-Programm.`;
    if (i === k + 1) return `Vor der OP liegt die Reha-Gruppe ${A(b)} ${U} ${b > 0 ? "höher" : "niedriger"}. Im RCT ein Zufallsunterschied, kein Effekt der Reha, die da noch nicht begonnen hat.`;
    const t = times[i - k - 2];
    return `So viel ${b < 0 ? "stärker sinkt" : "stärker steigt"} der Wert in der Reha-Gruppe bis ${TL[t]} als in der Kontrollgruppe: ${A(b)} ${U}. ${t === 2 ? "Das ist der Behandlungseffekt nach 14 Wochen, die Hauptfrage des RCT." : "Der Behandlungseffekt nach 4 Wochen."}`;
  };
  $("t3").innerHTML = `<thead><tr><th></th><th>Fester Effekt</th><th>b</th><th>SE</th><th>p</th><th>95-%-KI</th></tr></thead><tbody>` +
    f.beta.map((b, i) => { const [l, h] = ci(b, f.se[i], df); return `<tr class="${i > k + 1 && times[i - k - 2] === 2 ? "hl" : ""}"><td class="sym">${sym[i]}</td><td>${names[i]}</td><td>${fmt(b, d)}</td><td>${fmt(f.se[i], d)}</td><td>${fp(pv(b, f.se[i], df))}</td><td>${fmt(l, d)} bis ${fmt(h, d)}</td></tr>`; }).join("") +
    `<tr class="tot"><td></td><td>Zufallseffekte</td><td colspan="4" style="text-align:left;font-family:var(--font-sans);font-weight:400;color:var(--muted)">SD zwischen Personen ${fmt(Math.sqrt(f.G[0][0]), m.d)}, SD innerhalb ${fmt(Math.sqrt(f.s2), m.d)}, ICC ${fmt(f.G[0][0] / (f.G[0][0] + f.s2), 2)} · ${M.n} Messungen von ${M.persons} Personen · REML, df = ${df}</td></tr></tbody>`;
  $("t3k").innerHTML = `<p class="ck-h">So lesen Sie die Koeffizienten</p>` + f.beta.map((_, i) => `<div><dt>${sym[i]}</dt><dd>${interp(i)}</dd></div>`).join("");
  const j14 = times.indexOf(2), c = j => f.beta[j];
  const parts = [0, 1 + j14, k + 1, k + 2 + j14], val = parts.reduce((a, j) => a + c(j), 0);
  $("f3b").innerHTML = `<span class="dim">Mittelwerte zusammensetzen, Beispiel Reha-Gruppe in Woche 14 (alle Hilfsvariablen = 1):</span>` +
    TS(`\\hat y = \\beta_0 + \\beta_{${1 + j14}} + \\beta_{${k + 1}} + \\beta_{${k + 2 + j14}} = ${parts.map(j => tz(fmt(c(j), d))).join(" + ").replace(/\+ −/g, "− ").replace(/\+ -/g, "- ")} = ${tz(fmt(val, d))}`, `ŷ = ${fmt(val, d)}`) +
    `<span class="dim">Kontrollgruppe in Woche 14: β₀ + β${"₁₂"[j14]} = ${fmt(c(0) + c(1 + j14), d)}. Der Abstand zwischen beiden ist nicht β${"₃₄₅"[k - 1 + j14]}, sondern β${"₁₂₃"[k]} + β${"₃₄₅"[k - 1 + j14]} = ${fmt(c(k + 1) + c(k + 2 + j14), d)}: Der Unterschied vor der OP steckt mit drin.</span>`;
  // Vergleich
  const iw = f.beta.length - 1, b14 = f.beta[iw], s14 = f.se[iw];
  const a = R.filter(r => r.zeit_nr === 2 && use(r)), tt = ttest(a.filter(r => r.gruppe === "Kontrolle").map(r => r[v]), a.filter(r => r.gruppe === "Intervention").map(r => r[v]));
  const [tl, th] = ci(tt.d, tt.se, tt.df), [ml, mh] = ci(b14, s14, df);
  const o = fitModel(v, 1 - locf), ob = o.f.beta[o.f.beta.length - 1], os = o.f.se[o.f.se.length - 1], [ol, oh] = ci(ob, os, o.df);
  $("t3b").innerHTML = `<thead><tr><th>Auswertung für Woche 14</th><th>Unterschied</th><th>95-%-KI</th><th>p</th></tr></thead><tbody>
    <tr><td>t-Test der Endwerte (wie im Artikel)</td><td>${fmt(tt.d, d)}</td><td>${fmt(tl, d)} bis ${fmt(th, d)}</td><td>${fp(tt.p)}</td></tr>
    <tr class="hl"><td>Gemischtes Modell: Unterschied der Veränderung</td><td>${fmt(b14, d)}</td><td>${fmt(ml, d)} bis ${fmt(mh, d)}</td><td>${fp(pv(b14, s14, df))}</td></tr>
    <tr><td>dasselbe Modell, fortgeschriebene Werte ${locf ? "ausgeschlossen" : "eingeschlossen"}</td><td>${fmt(ob, d)}</td><td>${fmt(ol, d)} bis ${fmt(oh, d)}</td><td>${fp(pv(ob, os, o.df))}</td></tr></tbody>`;
  const base = f.beta[k + 1];
  $("cl3").innerHTML = `In Woche 14 liegt die Reha-Gruppe um <b>${fmt(Math.abs(tt.d), d)} ${m.unit}</b> ${tt.d * m.better > 0 ? "besser" : "schlechter"} als die Kontrollgruppe. Gemessen an der Veränderung seit der OP beträgt der Vorteil aber <b>${fmt(Math.abs(b14), d)} ${m.unit}</b>, weil die Gruppen vor der OP um ${fmt(Math.abs(base), d)} ${m.unit} auseinanderlagen. ` +
    `Die fortgeschriebenen Werte zweier Personen verschieben das Ergebnis von ${fmt(locf ? ob : b14, d)} auf ${fmt(locf ? b14 : ob, d)}: Wer nicht nachuntersucht wurde, bekommt beim Fortschreiben keinerlei Besserung zugeschrieben. Das gemischte Modell braucht diesen Trick nicht, es nutzt einfach die vorhandenen Messungen.`;
}

function tasks() {
  const M = fitModel("schmerz_vas", 0), f = M.f, n0 = R.filter(r => !r.fortgeschrieben).length;
  const iw = f.beta.length - 1, [l, h] = ci(f.beta[iw], f.se[iw], M.df);
  const T = [
    ["Datensatz verstehen", "Wie viele Zeilen und wie viele Personen enthält die Datei? Warum braucht ein Modell für Messwiederholungen die Spalte id?", `270 Zeilen von 90 Personen, je drei Zeitpunkte. Ohne fortgeschriebene Werte bleiben ${n0} Zeilen. Die id sagt dem Modell, welche Messungen zur selben Person gehören; nur so kann es die Streuung zwischen Personen von der innerhalb einer Person trennen.`],
    ["Verlauf beschreiben", "Berechnen Sie Mittelwert und SD des Schmerzes je Gruppe und Zeitpunkt und zeichnen Sie ein Verlaufsdiagramm.", `Kontrolle: ${[0, 1, 2].map(t => fmt(mean(R.filter(r => r.gruppe === "Kontrolle" && r.zeit_nr === t).map(r => r.schmerz_vas)), 2)).join(" → ")}. Intervention ohne fortgeschriebene Werte: ${[0, 1, 2].map(t => fmt(mean(R.filter(r => r.gruppe === "Intervention" && r.zeit_nr === t && !r.fortgeschrieben).map(r => r.schmerz_vas)), 2)).join(" → ")}. Die Reha-Gruppe startet höher und endet deutlich tiefer.`],
    ["Modell rechnen", "Rechnen Sie das gemischte Modell mit Gruppe, Zeit (kategorial) und ihrer Wechselwirkung sowie einem Zufallsachsenabschnitt pro Person. Welcher Koeffizient beantwortet die Frage des RCT?", `Die Wechselwirkung Gruppe × Woche 14: ${fmt(f.beta[iw], 2)} Punkte (95-%-KI ${fmt(l, 2)} bis ${fmt(h, 2)}). Der Schmerz sinkt bis Woche 14 in der Reha-Gruppe um so viel stärker als in der Kontrollgruppe. In SPSS mit Bezug auf die letzte Kategorie steht derselbe Wert eventuell mit anderem Vorzeichen oder in einer anderen Zeile; die geschätzten Randmittel stimmen überein.`],
    ["Mit dem Artikel vergleichen", "Der Artikel vergleicht die Gruppen in Woche 14 mit einem t-Test. Warum ist der Unterschied dort kleiner als die Wechselwirkung im Modell?", `Der t-Test vergleicht nur Endwerte. Vor der OP hatte die Reha-Gruppe ${fmt(f.beta[M.k + 1], 2)} Punkte mehr Schmerz. Dieser Rückstand steckt im t-Test noch drin und verkleinert den Vorteil. Das Modell vergleicht die Veränderungen und rechnet den Ausgangsunterschied heraus.`],
    ["Sensitivitätsanalyse", "Rechnen Sie das Modell einmal mit und einmal ohne die fortgeschriebenen Werte von I44 und I45. Was ändert sich, und welche Variante ist ehrlicher?", `Mit fortgeschriebenen Werten ist der Effekt etwas kleiner, weil zwei Personen ohne jede Besserung eingehen. Ehrlicher ist das Modell ohne sie: Es nutzt deren Messung vor der OP und trifft für die fehlenden Termine die Annahme „missing at random“, statt Werte zu erfinden. Berichten sollte man beide Varianten.`]
  ];
  $("tasks").innerHTML = T.map(([t, q, a], i) => `<div class="task"><p><b>${i + 1}. ${t}.</b> ${q}</p><details><summary>Lösung</summary><div><p>${a}</p></div></details></div>`).join("");
}

function all() { draw2(); draw3(); }
$("var").addEventListener("change", e => { v = e.target.value; all(); });
$("locf").addEventListener("click", e => { const b = pick(e, $("locf")); if (!b) return; locf = +b.dataset.l; all(); });
all(); tasks();
})();
