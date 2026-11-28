/* Stats Lab · Warum gemischte Modelle?
   Hüftarthroskopie-RCT (Müller-Torrente et al. 2021): vier Auswertungswege im Vergleich,
   Zerlegung einer Messung in festen Teil, Personenabweichung und Rest, Verteilung der Personenabweichungen. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const { fmt, fp, frame, pick, mean, ttest, tz } = window.GM;
const { ols, tcdf, tinv } = window.REG;
const TS = (t, fb) => window.katex ? texSteps(t) : fb;
const C = window.FAI.cols, ALL = window.FAI.rows.map(r => Object.fromEntries(C.map((c, i) => [c, r[i]])));
const R = ALL.filter(r => r.schmerz_vas !== null && !r.fortgeschrieben);
const IDS = [...new Set(R.map(r => r.id))], TL = ["vor OP", "Woche 4", "Woche 14"];
const GR = id => R.find(r => r.id === id).gruppe;
const val = (id, t) => { const r = R.find(x => x.id === id && x.zeit_nr === t); return r ? r.schmerz_vas : null; };
const cell = (g, t) => R.filter(r => r.gruppe === g && r.zeit_nr === t).map(r => r.schmerz_vas);
const P = p => p < 0.001 ? "< 0,001" : fmt(p, 3);

/* ---------- vier Auswertungswege ---------- */
const X = R.map(r => { const iv = r.gruppe === "Intervention" ? 1 : 0; return [1, +(r.zeit_nr === 1), +(r.zeit_nr === 2), iv, iv * (r.zeit_nr === 1), iv * (r.zeit_nr === 2)]; });
const F = window.LMM.fit(R.map(r => r.schmerz_vas), X, X.map(() => [1]), R.map(r => r.id));
const DF = IDS.length - 2, pF = 2 * (1 - tcdf(Math.abs(F.beta[5] / F.se[5]), DF));
const O = ols(R.map(r => r.schmerz_vas), [1, 2, 3, 4, 5].map(j => X.map(x => x[j])));
const endT = ttest(cell("Kontrolle", 2), cell("Intervention", 2));
const chg = g => IDS.filter(id => GR(id) === g && val(id, 0) !== null && val(id, 2) !== null).map(id => val(id, 2) - val(id, 0));
const chT = ttest(chg("Kontrolle"), chg("Intervention"));
const nEnd = cell("Kontrolle", 2).length + cell("Intervention", 2).length, nCh = chg("Kontrolle").length + chg("Intervention").length;
const base = mean(cell("Intervention", 0)) - mean(cell("Kontrolle", 0));
const WAYS = [
  { lab: "t-Test der Endwerte", m: nEnd, p: nEnd, est: endT.d, se: endT.se, pv: endT.p, prob: "wirft vor OP und Woche 4 weg; Ausgangsunterschied verzerrt den Effekt",
    cl: `Gezählt wird nur Woche 14. Dass die Reha-Gruppe vor der OP ${fmt(base, 2)} Punkte mehr Schmerz hatte, sieht der Test nicht. Er unterschätzt den Effekt deshalb: ${fmt(endT.d, 2)} statt rund −3,5 Punkte.` },
  { lab: "t-Test der Veränderung", m: nCh * 2, p: nCh, est: chT.d, se: chT.se, pv: chT.p, prob: "nur zwei Zeitpunkte; Woche 4 ungenutzt; Personen mit Lücke fallen ganz heraus",
    cl: `Pro Person wird Woche 14 minus vor OP gerechnet, der Ausgangsunterschied ist damit raus. Aber Woche 4 bleibt ungenutzt, und wer in Woche 14 fehlt, fällt mit allen Messungen heraus: ${IDS.length - nCh} Personen. Bei mehr Zeitpunkten und mehr Drop-outs wird das schnell zum Problem.` },
  { lab: "Regression über alle Zeilen", m: R.length, p: R.length, est: O.b[5], se: O.se[5], pv: O.p[5], prob: `zählt ${R.length} Messungen als ${R.length} Personen; Standardfehler falsch`,
    cl: `Alle ${R.length} Messungen gehen ein, Gruppe × Zeitpunkt liefert den richtigen Effekt. Doch die Regression kennt keine Personen: Für sie sind es ${R.length} Unbekannte. Hier ist ihr Standardfehler zu groß (${fmt(O.se[5], 2)} statt ${fmt(F.se[5], 2)}), weil sie nicht weiß, dass jede Person ihre eigene Kontrolle ist. Bei Vergleichen zwischen Praxen ist er dagegen zu klein, siehe <a href="../abhaengige-daten/">Abhängige Daten</a>.` },
  { lab: "Gemischtes Modell", m: R.length, p: IDS.length, est: F.beta[5], se: F.se[5], pv: pF, prob: "nutzt alle Messungen und weiß, welche zu einer Person gehören",
    cl: `Alle ${R.length} Messungen gehen ein, auch die der Personen mit Lücke, und das Modell weiß, dass sie von ${IDS.length} Personen stammen. Dafür bekommt jede Person ihr eigenes Niveau: einen Zufallseffekt. Ergebnis: ${fmt(F.beta[5], 2)} Punkte (95-%-KI ${fmt(F.beta[5] - tinv(0.975, DF) * F.se[5], 2)} bis ${fmt(F.beta[5] + tinv(0.975, DF) * F.se[5], 2)}), mit einem Standardfehler, der die Abhängigkeit der Messungen berücksichtigt.` }
];
let way = 0;
function draw1() {
  [["Kontrolle", "c1k", "var(--kontrolle-ink)"], ["Intervention", "c1i", "var(--therapie)"]].forEach(([g, id, col]) => {
    const f = frame(520, 380, -0.35, 2.35, 0, 10, { P: { L: 46, R: 14, T: 14, B: 40 }, nx: 0, yl: "Schmerz (VAS)" });
    let s = f.s;
    TL.forEach((l, t) => s += `<text x="${f.sx(t)}" y="360" text-anchor="middle" class="strong">${l}</text>`);
    IDS.filter(p => GR(p) === g).forEach((pid, j) => {
      const jit = ((j * 37) % 17 - 8) / 90, pts = [0, 1, 2].map(t => [t, val(pid, t)]).filter(q => q[1] !== null);
      const out = way === 1 && (val(pid, 0) === null || val(pid, 2) === null);
      const xy = ([t, v]) => `${f.sx(t + jit).toFixed(1)},${f.sy(v).toFixed(1)}`;
      if (way === 3 && pts.length > 1) s += `<polyline points="${pts.map(xy).join(" ")}" fill="none" stroke="var(--pal-3)" stroke-width="1.2"/>`;
      if (way === 1 && !out) s += `<line x1="${f.sx(0 + jit)}" y1="${f.sy(val(pid, 0))}" x2="${f.sx(2 + jit)}" y2="${f.sy(val(pid, 2))}" stroke="var(--pal-3)" stroke-width="1.2"/>`;
      pts.forEach(([t, v]) => {
        const used = way === 0 ? t === 2 : way === 1 ? t !== 1 && !out : true;
        s += `<circle cx="${f.sx(t + jit)}" cy="${f.sy(v)}" r="${out ? 4.5 : used ? 2.8 : 2.2}" fill="${out ? "var(--beta-ink)" : used ? "var(--pal-5)" : "var(--pal-2)"}" ${used || out ? "" : 'fill-opacity=".7"'}/>`;
      });
    });
    const ts = way === 0 ? [2] : way === 1 ? [0, 2] : [0, 1, 2], ms = ts.map(t => [t, mean(cell(g, t))]);
    if (ms.length > 1) s += `<polyline points="${ms.map(([t, m]) => `${f.sx(t)},${f.sy(m)}`).join(" ")}" fill="none" stroke="${col}" stroke-width="4"/>`;
    ms.forEach(([t, m]) => s += `<circle cx="${f.sx(t)}" cy="${f.sy(m)}" r="7" fill="${col}" stroke="var(--surface)" stroke-width="2"/>`);
    $(id).innerHTML = s;
  });
  const L = ['<span><i style="background:var(--pal-5);border-radius:50%;width:8px;height:8px"></i>Messung, geht ein</span>', '<span><i style="background:var(--pal-2);border-radius:50%;width:8px;height:8px"></i>Messung, bleibt ungenutzt</span>', '<span><i style="background:var(--fg);height:4px"></i>Gruppenmittel</span>'];
  if (way === 1) L.push('<span><i style="background:var(--beta-ink);border-radius:50%;width:8px;height:8px"></i>Person fällt ganz heraus</span>');
  if (way === 1 || way === 3) L.push('<span><i style="background:var(--pal-3);height:2px"></i>Linie: Messungen derselben Person</span>');
  if (way === 2) L.push('<span>keine Linien: die Regression kennt keine Personen</span>');
  $("leg1").innerHTML = L.join("");
  $("cl1").innerHTML = WAYS[way].cl;
  $("t1").innerHTML = `<thead><tr><th>Weg</th><th>Messungen</th><th>als unabhängig gezählt</th><th>Effekt</th><th>SE</th><th>p</th><th>Problem</th></tr></thead><tbody>` +
    WAYS.map((w, i) => `<tr class="${i === way ? "hl" : ""}"><td>${i + 1} ${w.lab}</td><td>${w.m}</td><td>${w.p}</td><td>${fmt(w.est, 2)}</td><td>${fmt(w.se, 2)}</td><td>${P(w.pv)}</td><td class="prob">${w.prob}</td></tr>`).join("") + `</tbody>`;
}
$("way").addEventListener("click", e => { const b = pick(e, $("way")); if (!b) return; way = +b.dataset.w; draw1(); });
draw1();

/* ---------- Zerlegung einer Messung ---------- */
const tau = Math.sqrt(F.G[0][0]), sig = Math.sqrt(F.s2), U = Object.fromEntries(F.ids.map((id, k) => [id, F.blup[k][0]]));
// Startperson: deutlich über dem Mittel, alle drei Termine gemessen
let pid = IDS.filter(p => [0, 1, 2].every(t => val(p, t) !== null)).sort((a, b) => U[b] - U[a])[2], tt = 2;
$("pers").innerHTML = ["Kontrolle", "Intervention"].map(g => `<optgroup label="${g === "Kontrolle" ? "Standardversorgung" : "Supervidierte Reha"}">${IDS.filter(p => GR(p) === g).map(p => `<option value="${p}">${p}</option>`).join("")}</optgroup>`).join("");
$("pers").value = pid;
function draw2() {
  if (val(pid, tt) === null) { tt = [2, 1, 0].find(t => val(pid, t) !== null); }
  $("tt").querySelectorAll("button").forEach(b => { b.setAttribute("aria-pressed", +b.dataset.t === tt); b.disabled = val(pid, +b.dataset.t) === null; });
  const iv = GR(pid) === "Intervention" ? 1 : 0, b = F.beta;
  const time = tt === 1 ? b[1] : tt === 2 ? b[2] : 0, grp = iv ? b[3] + (tt === 1 ? b[4] : tt === 2 ? b[5] : 0) : 0;
  const fix = b[0] + time + grp, u = U[pid], y = val(pid, tt), e = y - fix - u;
  const sb = n => "₀₁₂₃₄₅"[n];
  const steps = [
    ["Kontrolle vor OP", "β₀", 0, b[0], "var(--therapie)", "fest"],
    ["Zeit", tt ? `β${sb(tt)}` : "", b[0], b[0] + time, "var(--therapie)", "fest"],
    ["Gruppe", iv ? (tt ? `β₃ + β${sb(tt + 3)}` : "β₃") : "", b[0] + time, fix, "var(--therapie)", "fest"],
    ["fester Teil", "Gruppenmittel", 0, fix, "var(--pal-6)", "sum"],
    ["Person", "u₀ᵢ", fix, fix + u, "var(--kontrolle)", "zuf"],
    ["Rest", "eᵢⱼ", fix + u, y, "var(--beta-ink)", "rest"],
    ["gemessen", "yᵢⱼ", 0, y, "var(--fg)", "sum"]
  ];
  const f = frame(900, 380, -0.6, steps.length - 0.4, 0, 10, { P: { L: 46, R: 14, T: 16, B: 56 }, nx: 0, yl: "Schmerz (VAS)" });
  let s = f.s; const bw = 70;
  steps.forEach(([lab, sym, a, z, col, k], i) => {
    const x = f.sx(i), y1 = f.sy(Math.max(a, z)), y2 = f.sy(Math.min(a, z)), h = Math.max(1.5, y2 - y1), d = z - a;
    s += `<rect x="${x - bw / 2}" y="${y1}" width="${bw}" height="${h}" rx="3" fill="${col}" ${k === "sum" ? 'fill-opacity=".85"' : ""}/>`;
    if (i < steps.length - 1) s += `<line x1="${x + bw / 2}" x2="${f.sx(i + 1) - bw / 2}" y1="${f.sy(z)}" y2="${f.sy(z)}" stroke="var(--muted)" stroke-dasharray="3 3"/>`;
    s += `<text x="${x}" y="${y1 - 7}" text-anchor="middle" class="strong">${k === "sum" || i === 0 ? fmt(z, 2) : (d >= 0 ? "+" : "") + fmt(d, 2)}</text>`;
    s += `<text x="${x}" y="${380 - 56 + 18}" text-anchor="middle" class="strong">${lab}</text><text x="${x}" y="${380 - 56 + 34}" text-anchor="middle">${sym}</text>`;
  });
  $("c2").innerHTML = s;
  $("f2").innerHTML = TS(String.raw`y_{ij} = \underbrace{${tz(fmt(fix, 2))}}_{\text{fest}} ${u < 0 ? "-" : "+"} \underbrace{${tz(fmt(Math.abs(u), 2))}}_{u_{0i}\text{: Person}} ${e < 0 ? "-" : "+"} \underbrace{${tz(fmt(Math.abs(e), 2))}}_{e_{ij}\text{: Rest}} = ${tz(fmt(y, 2))}`, `y = ${fmt(fix, 2)} + ${fmt(u, 2)} + ${fmt(e, 2)} = ${fmt(y, 2)}`);
  $("cl2").innerHTML = `Der <b>feste Teil</b> (${fmt(fix, 2)}) ist für alle Personen der ${iv ? "Reha-Gruppe" : "Kontrollgruppe"} zu diesem Termin gleich. <b>Person ${pid}</b> liegt ${u >= 0 ? "über" : "unter"} diesem Mittel, um ${fmt(Math.abs(u), 2)} Punkte, und zwar an allen drei Terminen gleich: Das ist ihr Zufallseffekt u<sub>0i</sub>. Genau diese gemeinsame Abweichung macht die Messungen einer Person ähnlich, und genau sie fehlte der Regression in Weg 3. Der <b>Rest</b> (${fmt(e, 2)}) ist das, was an diesem Termin zusätzlich schwankt.`;
  // Verteilung der Personenabweichungen
  const g = frame(900, 190, -4, 4, 0, 1, { P: { L: 30, R: 20, T: 14, B: 40 }, ny: 0, nx: 8, xl: "Abweichung der Person vom Gruppenmittel (Punkte)", fx: v => (v > 0 ? "+" : "") + fmt(v, 0) });
  let q = g.s, dpath = "";
  for (let x = -4; x <= 4.001; x += 0.1) { const dn = Math.exp(-0.5 * (x / tau) ** 2); dpath += (dpath ? "L" : "M") + g.sx(x).toFixed(1) + "," + g.sy(dn * 0.85).toFixed(1); }
  q += `<path d="${dpath}" fill="none" stroke="var(--kontrolle-ink)" stroke-width="2"/>`;
  const sorted = IDS.map(p => [p, U[p]]).sort((a, c) => a[1] - c[1]), bins = {};
  sorted.forEach(([p, v]) => { const k = Math.round(v / 0.2); bins[k] = (bins[k] || 0) + 1; const yy = g.sy(0) - 6 - (bins[k] - 1) * 7; q += `<circle cx="${g.sx(v)}" cy="${yy}" r="${p === pid ? 6 : 3.2}" fill="${p === pid ? "var(--beta-ink)" : "var(--pal-4)"}" ${p === pid ? 'stroke="var(--surface)" stroke-width="2"' : ""}/>`; });
  q += `<text x="${g.sx(-4) + 4}" y="28" class="strong">τ = ${fmt(tau, 2)} Punkte</text><text x="${g.sx(U[pid])}" y="${g.sy(1) + 2}" text-anchor="middle" class="strong">${pid}</text>`;
  $("c3").innerHTML = q;
}
$("pers").addEventListener("change", e => { pid = e.target.value; draw2(); });
$("tt").addEventListener("click", e => { const b = pick(e, $("tt")); if (!b || b.disabled) return; tt = +b.dataset.t; draw2(); });
draw2();
$("vk").innerHTML = `τ² = ${fmt(tau ** 2, 2)} zwischen den Personen, σ² = ${fmt(sig ** 2, 2)} innerhalb`;
$("icc3").innerHTML = `${fmt(tau ** 2 / (tau ** 2 + sig ** 2), 2)}: ${fmt(100 * tau ** 2 / (tau ** 2 + sig ** 2), 0)} % der Streuung liegen zwischen den Personen`;
})();
