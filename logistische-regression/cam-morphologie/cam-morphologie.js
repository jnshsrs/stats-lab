/* Cam-Morphologie und Knorpeldefekt · Stats Lab
   Block „Logistische Regression“, Station „Cam-Morphologie und Knorpeldefekt“: logistische Regression mit Lehrdatensatz (angelehnt an Heerey et al. 2021). */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const fmt = (x, d = 2) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");
const tz = x => String(x).replace(/\./g, "{.}").replace(/,/g, "{,}").replace(/−/g, "-");
const readout = (l, v, cls = "") => `<div class="readout ${cls}"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;
const TB = (t, fb) => window.katex ? texBlock(t) : fb;
const fp = p => p < 0.001 ? "< 0,001" : fmt(p, 3);
function ticks(lo, hi, n = 8) { const span = hi - lo, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw))); const st = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => span / s <= n); const o = []; for (let v = Math.ceil(lo / st - 1e-9) * st; v <= hi + 1e-9; v += st) o.push(+v.toFixed(6)); return o; }
let cpId = 0;
function frame(W, H, xlo, xhi, ylo, yhi, o = {}) {
  const P = o.P || { L: 60, R: 16, T: 14, B: 46 }, xl = o.xl ?? "Körpergröße in cm", yl = o.yl ?? "FEV in Litern", nx = o.nx || 8, ny = o.ny ?? 6;
  const sx = v => P.L + (v - xlo) / (xhi - xlo) * (W - P.L - P.R), sy = v => H - P.B - (v - ylo) / (yhi - ylo) * (H - P.T - P.B);
  const id = "cp" + (++cpId);
  let s = `<defs><clipPath id="${id}"><rect x="${P.L}" y="${P.T}" width="${W - P.L - P.R}" height="${H - P.T - P.B}"/></clipPath></defs>`;
  ticks(xlo, xhi, nx).forEach(v => s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${P.T}" y2="${H - P.B}" stroke="var(--grid)"/><text x="${sx(v)}" y="${H - P.B + 18}" text-anchor="middle">${o.fx ? o.fx(v) : fmt(v, 0)}</text>`);
  if (ny) ticks(ylo, yhi, ny).forEach(v => s += `<line x1="${P.L}" x2="${W - P.R}" y1="${sy(v)}" y2="${sy(v)}" stroke="var(--grid)"/><text x="${P.L - 8}" y="${sy(v) + 4}" text-anchor="end">${fmt(v, v % 1 ? 1 : 0)}</text>`);
  s += `<text x="${W - P.R}" y="${H - 6}" text-anchor="end">${xl}</text>`;
  if (yl) s += `<text x="14" y="${(P.T + H - P.B) / 2}" transform="rotate(-90 14 ${(P.T + H - P.B) / 2})" text-anchor="middle">${yl}</text>`;
  return { sx, sy, s, clip: `clip-path="url(#${id})"`, P, W, H };
}
const { logit } = window.REG;
const C = window.CAM.cols, D = window.CAM.rows, col = n => D.map(r => r[C.indexOf(n)]);
const AL = col("alpha"), Y = col("knorpeldefekt"), SY = col("schmerz"), CAM = col("cam"), N = D.length;
const M1 = logit(Y, [AL]), M2 = logit(Y, [AL, SY]), M3 = logit(Y, [AL, SY, AL.map((a, i) => a * SY[i])]);
const pc = (x, d = 1) => fmt(x * 100, d) + " %";
const mean = v => v.reduce((a, x) => a + x, 0) / v.length;
const pick = (e, el) => { const b = e.target.closest("button"); if (!b) return null; el.querySelectorAll("button").forEach(z => z.setAttribute("aria-pressed", z === b)); return b; };
const jit = i => ((i * 2654435761) % 1000) / 1000 - 0.5;
const sig = (b0, b1) => x => 1 / (1 + Math.exp(-(b0 + b1 * x)));
const curve = (f, fn, lo, hi, st = 0.5) => { let d = ""; for (let x = lo; x <= hi + 1e-9; x += st) d += (d ? "L" : "M") + f.sx(x).toFixed(1) + "," + f.sy(fn(x)).toFixed(1); return d; };
const ci = (b, se, k = 1) => [Math.exp(k * (b - 1.96 * se)), Math.exp(k * (b + 1.96 * se))];
function spssRows(m, names, hl = 1) {
  return `<thead><tr><th></th><th>B</th><th>Standardfehler</th><th>Wald</th><th>df</th><th>Sig.</th><th>Exp(B)</th><th>95-%-KI für Exp(B)</th></tr></thead><tbody>` +
    [...names.map((n, j) => j + 1), 0].map(i => { const c = ci(m.b[i], m.se[i]); return `<tr class="${i === hl ? "hl" : ""}"><td>${i ? names[i - 1] : "Konstante"}</td><td>${fmt(m.b[i], 3)}</td><td>${fmt(m.se[i], 3)}</td><td>${fmt(m.wald[i], 2)}</td><td>1</td><td>${fp(m.p[i])}</td><td>${fmt(Math.exp(m.b[i]), 3)}</td><td>${i ? fmt(c[0], 3) + " bis " + fmt(c[1], 3) : ""}</td></tr>`; }).join("") + `</tbody>`;
}

/* ---------- 1 Daten ---------- */
function draw1() {
  const f = frame(900, 340, 38, 100, 0, 1, { xl: "Alpha-Winkel in Grad", yl: "", ny: 0, nx: 6, fx: v => fmt(v, 0) + "°", P: { L: 130, R: 16, T: 24, B: 46 } });
  let s = f.s;
  s += `<rect x="${f.sx(60)}" y="${f.P.T}" width="${f.sx(100) - f.sx(60)}" height="${f.sy(0) - f.P.T}" fill="var(--highlight)"/><line x1="${f.sx(60)}" x2="${f.sx(60)}" y1="${f.P.T}" y2="${f.sy(0)}" stroke="var(--fg)" stroke-dasharray="5 4"/><text x="${f.sx(99)}" y="${f.sy(0) - 8}" text-anchor="end" class="strong">Cam-Bereich: Alpha ≥ 60°</text>`;
  const yr = y => y ? 0.72 : 0.28;
  [[1, "mit Defekt"], [0, "ohne Defekt"]].forEach(([y, lab]) => { s += `<text x="${f.P.L - 12}" y="${f.sy(yr(y)) + 5}" text-anchor="end" class="strong">${lab}</text>`; const mu = mean(AL.filter((a, i) => Y[i] === y)); s += `<line x1="${f.sx(mu)}" x2="${f.sx(mu)}" y1="${f.sy(yr(y) + 0.2)}" y2="${f.sy(yr(y) - 0.2)}" stroke="var(--fg)" stroke-width="3"/><text x="${f.sx(mu)}" y="${f.sy(yr(y) + 0.2) - 4}" text-anchor="middle" class="strong halo">Ø ${fmt(mu, 1)}°</text>`; });
  AL.forEach((a, i) => s += `<circle cx="${(f.sx(a) + jit(i) * 6).toFixed(1)}" cy="${(f.sy(yr(Y[i])) + jit(i * 13) * 60).toFixed(1)}" r="3.6" fill="${SY[i] ? "var(--beta-ink)" : "var(--therapie)"}" fill-opacity=".6"/>`);
  $("c1").innerHTML = s;
  const ev = Y.reduce((a, v) => a + v, 0);
  $("r1").innerHTML = readout("Spieler", String(N)) + readout("mit Knorpeldefekt", `${ev} (${pc(ev / N, 0)})`) + readout("Ø Alpha mit Defekt", fmt(mean(AL.filter((a, i) => Y[i])), 1) + "°") + readout("Ø Alpha ohne Defekt", fmt(mean(AL.filter((a, i) => !Y[i])), 1) + "°");
  const a = D.filter((r, i) => CAM[i] && Y[i]).length, b = D.filter((r, i) => CAM[i] && !Y[i]).length, c = D.filter((r, i) => !CAM[i] && Y[i]).length, d = D.filter((r, i) => !CAM[i] && !Y[i]).length;
  $("t1").innerHTML = `<thead><tr><th></th><th>Defekt</th><th>kein Defekt</th><th>Risiko</th></tr></thead><tbody><tr><th>Cam (≥ 60°)</th><td>${a}</td><td>${b}</td><td class="rk">${pc(a / (a + b))}</td></tr><tr><th>keine Cam</th><td>${c}</td><td>${d}</td><td class="rk">${pc(c / (c + d))}</td></tr></tbody>`;
  $("f1").innerHTML = TB(String.raw`\text{OR} = \dfrac{a \cdot d}{b \cdot c} = \dfrac{${a} \cdot ${d}}{${b} \cdot ${c}} = ${tz(fmt(a * d / (b * c), 2))}`, "");
  $("k1").innerHTML = `Spieler mit Defekt haben im Mittel einen um ${fmt(mean(AL.filter((x, i) => Y[i])) - mean(AL.filter((x, i) => !Y[i])), 1)} Grad größeren Alpha-Winkel. Teilt man bei 60 Grad in „Cam ja/nein“, ergibt die Vierfeldertafel ein OR von ${fmt(a * d / (b * c), 2)} (siehe <a href="../../grundlagen/risiko-odds/#acc-2">Vierfeldertafel</a>). Die logistische Regression nutzt stattdessen den ganzen Winkel. Violett: symptomatische Spieler, blau: schmerzfreie.`;
}

/* ---------- 2 Modell ---------- */
let u = 1;
function draw2() {
  const ax = +$("ax").value; $("ax-v").textContent = ax + "°";
  const P = sig(M1.b[0], M1.b[1]);
  const f = frame(900, 400, 38, 100, 0, 1, { xl: "Alpha-Winkel in Grad", yl: "Wahrscheinlichkeit Knorpeldefekt", nx: 6, fx: v => fmt(v, 0) + "°" });
  let s = f.s;
  AL.forEach((a, i) => s += `<circle cx="${(f.sx(a) + jit(i) * 6).toFixed(1)}" cy="${(f.sy(Y[i]) + (Y[i] ? 1 : -1) * Math.abs(jit(i * 7)) * 16).toFixed(1)}" r="2.6" fill="var(--pal-3)" fill-opacity=".5"/>`);
  for (let lo = 40; lo < 100; lo += 10) { const id = AL.map((a, i) => i).filter(i => AL[i] >= lo && AL[i] < lo + 10); if (id.length < 5) continue; const q = id.reduce((a, i) => a + Y[i], 0) / id.length; s += `<circle cx="${f.sx(lo + 5)}" cy="${f.sy(q)}" r="${3 + Math.sqrt(id.length) * 0.9}" fill="var(--surface)" stroke="var(--fg)" stroke-width="2"/>`; }
  s += `<path ${f.clip} d="${curve(f, P, 38, 100)}" fill="none" stroke="var(--therapie)" stroke-width="3.5"/>`;
  const b2 = Math.min(98, ax + u);
  s += `<line x1="${f.sx(ax)}" x2="${f.sx(ax)}" y1="${f.sy(0)}" y2="${f.sy(P(ax))}" stroke="var(--beta-ink)" stroke-dasharray="3 3"/><circle cx="${f.sx(ax)}" cy="${f.sy(P(ax))}" r="8" fill="var(--beta-ink)"/><text x="${f.sx(ax) - 12}" y="${f.sy(P(ax)) - 12}" text-anchor="end" class="strong halo" style="fill:var(--beta-ink)">${pc(P(ax))}</text>`;
  $("c2").innerHTML = s;
  $("spss2").innerHTML = spssRows(M1, ["alpha"]);
  const ORu = Math.exp(M1.b[1] * u), c = ci(M1.b[1], M1.se[1], u), eta = M1.b[0] + M1.b[1] * ax, od = Math.exp(eta);
  $("f2").innerHTML = TB(String.raw`\begin{aligned} \ln(\text{Odds}) &= ${tz(fmt(M1.b[0], 3))} + ${tz(fmt(M1.b[1], 4))} \cdot \alpha \\ \text{OR}_{\text{pro } ${u}^\circ} &= e^{${u > 1 ? u + " \\cdot " : ""}${tz(fmt(M1.b[1], 4))}} = ${tz(fmt(ORu, 3))} \\ \text{95-\%-KI} &= [${tz(fmt(c[0], 3))};\ ${tz(fmt(c[1], 3))}] \\ p(${ax}^\circ) &= \dfrac{e^{${tz(fmt(eta, 2))}}}{1 + e^{${tz(fmt(eta, 2))}}} = ${tz(fmt(od / (1 + od), 3))} \end{aligned}`, "");
  $("r2").innerHTML = readout(`OR pro ${u}°`, fmt(ORu, 3), "r-decision") + readout("95-%-KI", `${fmt(c[0], 3)} bis ${fmt(c[1], 3)}`) + readout(`p bei ${ax}°`, pc(P(ax))) + readout("Nagelkerke-R²", fmt(M1.nagelkerke, 3));
  $("k2").innerHTML = u === 1
    ? `Exp(B) = ${fmt(Math.exp(M1.b[1]), 3)}: Mit jedem Grad Alpha-Winkel steigen die Odds eines Knorpeldefekts um ${fmt((Math.exp(M1.b[1]) - 1) * 100, 1)} %. Das wirkt klein, weil ein Grad klein ist. Wählen Sie „10 Grad“. Warum man Exp(B) liest und nicht B, zeigt die <a href="../s-kurve/#acc-3">Rise-over-Run-Tabelle</a>.`
    : `Pro ${u} Grad steigen die Odds um den Faktor ${fmt(ORu, 2)}, also um ${fmt((ORu - 1) * 100, 0)} %. Rechnung: e hoch (${u} · B), nicht ${u} · Exp(B). Auch das Konfidenzintervall wird so umgerechnet. Die Kurve ist flacher als beim Rauchen in der <a href="../s-kurve/">S-Kurven-Station</a>: Der Alpha-Winkel ist ein Risikofaktor unter vielen, Nagelkerke-R² = ${fmt(M1.nagelkerke, 2)}.`;
  $("ev").textContent = Y.reduce((a, v) => a + v, 0);
  report();
}
$("ax").addEventListener("input", draw2);
$("unit").addEventListener("click", e => { const b = pick(e, $("unit")); if (!b) return; u = +b.dataset.u; draw2(); });

/* ---------- 3 Adjustiert ---------- */
let m3 = 0;
function draw3() {
  const m = m3 ? M3 : M2, b = m.b;
  const Ps = x => 1 / (1 + Math.exp(-(b[0] + b[1] * x + b[2] + (m3 ? b[3] * x : 0)))), Pf = x => 1 / (1 + Math.exp(-(b[0] + b[1] * x)));
  const f = frame(900, 380, 38, 100, 0, 1, { xl: "Alpha-Winkel in Grad", yl: "Wahrscheinlichkeit Knorpeldefekt", nx: 6, fx: v => fmt(v, 0) + "°" });
  let s = f.s + `<path ${f.clip} d="${curve(f, Ps, 38, 100)}" fill="none" stroke="var(--beta-ink)" stroke-width="3.5"/><path ${f.clip} d="${curve(f, Pf, 38, 100)}" fill="none" stroke="var(--therapie)" stroke-width="3.5"/>`;
  s += `<text x="${f.sx(97)}" y="${f.sy(Ps(97)) - 10}" text-anchor="end" class="strong halo" style="fill:var(--beta-ink)">symptomatisch</text><text x="${f.sx(97)}" y="${f.sy(Pf(97)) + 22}" text-anchor="end" class="strong halo" style="fill:var(--therapie)">schmerzfrei</text>`;
  $("c3").innerHTML = s;
  $("spss3").innerHTML = spssRows(m, m3 ? ["alpha", "schmerz (1 = symptomatisch)", "alpha × schmerz"] : ["alpha", "schmerz (1 = symptomatisch)"]);
  const c = ci(M2.b[1], M2.se[1], 10);
  $("k3").innerHTML = m3
    ? `Der Wechselwirkungsterm prüft, ob der Alpha-Winkel bei symptomatischen Spielern stärker mit Defekten zusammenhängt. p = ${fmt(M3.p[3], 2)}: kein Hinweis darauf. Das entspricht dem Befund der Originalstudie, die Assoziation war bei symptomatischen Spielern nicht größer. Ohne Wechselwirkung ist das Modell einfacher und die Haupteffekte sind direkt lesbar.`
    : `Adjustiert für den Symptomstatus bleibt das OR für den Alpha-Winkel praktisch gleich: ${fmt(Math.exp(M2.b[1] * 10), 2)} pro 10 Grad (KI ${fmt(c[0], 2)} bis ${fmt(c[1], 2)}) statt ${fmt(Math.exp(M1.b[1] * 10), 2)}. Der Zusammenhang läuft also nicht über den Schmerz. Auf der Logit-Skala sind die beiden Kurven parallel verschoben; Schmerz hat ein OR von ${fmt(Math.exp(M2.b[2]), 2)}, aber mit p = ${fmt(M2.p[2], 2)} ist das mit diesen Daten nicht gesichert.`;
}
$("m3").addEventListener("click", e => { const b = pick(e, $("m3")); if (!b) return; m3 = +b.dataset.m; draw3(); });

/* ---------- 4 Bericht ---------- */
function report() {
  const c = ci(M2.b[1], M2.se[1], 10);
  $("rep").innerHTML = `<span><b>So könnte der Ergebnissatz lauten:</b> Pro 10 Grad größerem Alpha-Winkel waren die Odds eines Knorpeldefekts um den Faktor ${fmt(Math.exp(M2.b[1] * 10), 2)} höher (95-%-KI ${fmt(c[0], 2)} bis ${fmt(c[1], 2)}; p = ${fmt(M2.p[1], 3)}), adjustiert für den Symptomstatus. Bei einem Spieler mit 70 Grad lag die vorhergesagte Wahrscheinlichkeit bei ${pc(sig(M1.b[0], M1.b[1])(70), 0)}, bei 90 Grad bei ${pc(sig(M1.b[0], M1.b[1])(90), 0)}.</span><span class="dim">Zum Vergleich die Originalstudie: OR 1,03 (95-%-KI 1,01 bis 1,04) pro Grad, also etwa 1,34 pro 10 Grad.</span>`;
}

draw1(); draw2(); draw3();
})();
