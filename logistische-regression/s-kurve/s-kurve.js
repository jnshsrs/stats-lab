/* Von der Geraden zur S-Kurve · Stats Lab
   Block 6, Station 1: lineares Wahrscheinlichkeitsmodell gegen logistisches Modell, Skalen p/Odds/Logit, OR pro Einheit, Maximum Likelihood. */
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
const { ols, logit } = window.REG;
const R = window.FEV.rows, A = R.map(r => r[0]), S = R.map(r => r[4]), N = R.length;
const LPM = ols(S, [A]), LG = logit(S, [A]), B0 = LG.b[0], B1 = LG.b[1];
const P = x => 1 / (1 + Math.exp(-(B0 + B1 * x))), OD = x => Math.exp(B0 + B1 * x);
const AGES = {}; A.forEach((a, i) => { AGES[a] = AGES[a] || { n: 0, k: 0 }; AGES[a].n++; AGES[a].k += S[i]; });
const AG = Object.keys(AGES).map(Number).sort((a, b) => a - b);
const pick = (e, el) => { const b = e.target.closest("button"); if (!b) return null; el.querySelectorAll("button").forEach(z => z.setAttribute("aria-pressed", z === b)); return b; };
const pc = (x, d = 1) => fmt(x * 100, d) + " %";
const curve = (f, fn, lo, hi, st = 0.1) => { let d = ""; for (let x = lo; x <= hi + 1e-9; x += st) d += (d ? "L" : "M") + f.sx(x).toFixed(1) + "," + f.sy(fn(x)).toFixed(1); return d; };
const jit = i => ((i * 2654435761) % 1000) / 1000 - 0.5;

/* ---------- 1 ---------- */
let m1 = "lin";
function draw1() {
  const f = frame(900, 420, 2, 20, -0.25, 1.1, { xl: "Alter in Jahren", yl: "Anteil Rauchender", nx: 9, ny: 0 });
  let s = f.s;
  [-0.25, 0, 0.25, 0.5, 0.75, 1].forEach(v => s += `<line x1="${f.P.L}" x2="${900 - f.P.R}" y1="${f.sy(v)}" y2="${f.sy(v)}" stroke="var(--grid)"/><text x="${f.P.L - 8}" y="${f.sy(v) + 4}" text-anchor="end">${fmt(v * 100, 0)} %</text>`);
  s += `<rect x="${f.P.L}" y="${f.sy(0)}" width="${900 - f.P.L - f.P.R}" height="${f.sy(-0.25) - f.sy(0)}" fill="var(--beta-ink)" fill-opacity=".08"/><text x="${f.sx(19.8)}" y="${f.sy(-0.2)}" text-anchor="end" style="fill:var(--beta-ink)">unmöglich: unter 0 %</text>`;
  A.forEach((a, i) => s += `<circle cx="${(f.sx(a) + jit(i) * 22).toFixed(1)}" cy="${(f.sy(S[i]) + jit(i * 7) * 10).toFixed(1)}" r="2" fill="var(--pal-3)" fill-opacity=".45"/>`);
  AG.forEach(a => { const g = AGES[a]; s += `<circle cx="${f.sx(a)}" cy="${f.sy(g.k / g.n)}" r="${3 + Math.sqrt(g.n) * 0.9}" fill="var(--surface)" stroke="var(--fg)" stroke-width="2"/>`; });
  if (m1 === "lin") {
    s += `<path ${f.clip} d="${curve(f, x => LPM.b[0] + LPM.b[1] * x, 2, 20)}" fill="none" stroke="var(--beta-ink)" stroke-width="3"/>`;
    const x0 = -LPM.b[0] / LPM.b[1];
    s += `<line x1="${f.sx(x0)}" x2="${f.sx(x0)}" y1="${f.sy(0)}" y2="${f.sy(-0.25)}" stroke="var(--beta-ink)" stroke-dasharray="3 3"/><text x="${f.sx(x0) - 8}" y="${f.sy(-0.08)}" text-anchor="end" class="strong halo" style="fill:var(--beta-ink)">unter ${fmt(x0, 1)} Jahren negativ</text>`;
  } else s += `<path ${f.clip} d="${curve(f, P, 2, 20)}" fill="none" stroke="var(--therapie)" stroke-width="3.5"/>`;
  $("c1").innerHTML = s;
  $("r1").innerHTML = m1 === "lin"
    ? readout("Vorhersage mit 4 Jahren", pc(LPM.b[0] + LPM.b[1] * 4), "r-decision") + readout("Vorhersage mit 35 Jahren", pc(LPM.b[0] + LPM.b[1] * 35)) + readout("Steigung", "+" + fmt(LPM.b[1] * 100, 1) + " %-Punkte pro Jahr")
    : readout("Vorhersage mit 4 Jahren", pc(P(4), 2), "r-decision") + readout("mit 14 Jahren", pc(P(14))) + readout("mit 35 Jahren", pc(P(35)));
  $("k1").innerHTML = m1 === "lin"
    ? `Die Gerade wächst stur um ${fmt(LPM.b[1] * 100, 1)} Prozentpunkte pro Jahr. Für 4-Jährige sagt sie ${pc(LPM.b[0] + LPM.b[1] * 4)} Rauchende voraus, für 35-Jährige ${pc(LPM.b[0] + LPM.b[1] * 35)}. Beides ist unmöglich. Außerdem verfehlt sie die Kreise: Bis 9 Jahre raucht niemand, danach steigt der Anteil steil an.`
    : `Die S-Kurve bleibt immer zwischen 0 und 100 %. Bei jungen Kindern liegt sie fast bei null, dann steigt sie und flacht nach oben wieder ab. Sie trifft die Kreise deutlich besser. Wie entsteht diese Form? Abschnitt 2.`;
}
$("m1").addEventListener("click", e => { const b = pick(e, $("m1")); if (!b) return; m1 = b.dataset.m; draw1(); });

/* ---------- 2 ---------- */
let sc = "p";
function draw2() {
  const a = +$("a2").value; $("a2-v").textContent = a + " Jahre";
  const T = { p: P, o: OD, l: x => B0 + B1 * x }[sc];
  const yr = { p: [0, 1], o: [0, 4], l: [-7, 3] }[sc], yl = { p: "Wahrscheinlichkeit", o: "Odds", l: "Logit = ln(Odds)" }[sc];
  const f = frame(900, 400, 2, 20, yr[0], yr[1], { xl: "Alter in Jahren", yl, nx: 9, fx: v => fmt(v, 0) });
  let s = f.s;
  AG.forEach(x => { const g = AGES[x], q = g.k / g.n; const v = sc === "p" ? q : sc === "o" ? q / (1 - q) : Math.log(q / (1 - q));
    if (q === 0 && sc === "l") s += `<path d="M${f.sx(x) - 6},${f.sy(yr[0]) - 2}L${f.sx(x) + 6},${f.sy(yr[0]) - 2}L${f.sx(x)},${f.sy(yr[0]) - 12}Z" fill="var(--muted)"/>`;
    else if (isFinite(v)) s += `<circle cx="${f.sx(x)}" cy="${f.sy(Math.min(v, yr[1]))}" r="${3 + Math.sqrt(g.n) * 0.9}" fill="var(--surface)" stroke="var(--fg)" stroke-width="2"/>`; });
  s += `<path ${f.clip} d="${curve(f, T, 2, 20)}" fill="none" stroke="var(--therapie)" stroke-width="3.5"/>`;
  const v = T(a); s += `<line x1="${f.sx(a)}" x2="${f.sx(a)}" y1="${f.sy(yr[0])}" y2="${f.sy(Math.min(v, yr[1]))}" stroke="var(--beta-ink)" stroke-dasharray="3 3"/><circle cx="${f.sx(a)}" cy="${f.sy(Math.max(yr[0], Math.min(v, yr[1])))}" r="8" fill="var(--beta-ink)"/>`;
  if (sc === "l") s += `<text x="${f.sx(2.3)}" y="${f.sy(yr[0]) - 30}" class="halo" style="fill:var(--muted)">▲ Alter ohne Rauchende: Logit −∞</text>`;
  $("c2").innerHTML = s;
  const eta = B0 + B1 * a, od = Math.exp(eta), p = od / (1 + od);
  $("f2").innerHTML = TB(String.raw`\begin{aligned} \ln(\text{Odds}) &= b_0 + b_1 \cdot \text{Alter} \\ &= ${tz(fmt(B0, 2))} + ${tz(fmt(B1, 3))} \cdot ${a} \\ \text{Odds} &= e^{${tz(fmt(eta, 2))}} = ${tz(fmt(od, 3))} \\ p &= \dfrac{\text{Odds}}{1 + \text{Odds}} = ${tz(fmt(p, 3))} \end{aligned}`, "");
  $("r2").innerHTML = readout("Logit", fmt(eta, 2)) + readout("Odds", fmt(od, 3)) + readout("Wahrscheinlichkeit", pc(p), "r-decision");
  $("k2").innerHTML = { p: `Auf der Wahrscheinlichkeitsskala ist das Modell eine S-Kurve. Wechseln Sie zu „Logit“.`, o: `Als Odds wächst die Kurve exponentiell: Jedes Jahr werden die Odds mit demselben Faktor multipliziert. Nach oben gibt es keine Grenze mehr.`, l: `Auf der Logit-Skala ist das Modell eine <b>Gerade</b>: ln(Odds) = ${fmt(B0, 2)} + ${fmt(B1, 3)} · Alter. Alles, was Sie aus der linearen Regression kennen, gilt hier: Achsenabschnitt, Steigung, mehrere Einflussgrößen, Adjustierung. Nur die Zielgröße ist eine andere, und das ist der ganze Trick.` }[sc];
}
$("sc").addEventListener("click", e => { const b = pick(e, $("sc")); if (!b) return; sc = b.dataset.s; draw2(); });
$("a2").addEventListener("input", draw2);

/* ---------- 3 ---------- */
let u = 1;
function draw3() {
  const a = +$("a3").value; $("a3-v").textContent = a + " Jahre";
  const b = a + u, ORu = Math.exp(B1 * u), oa = OD(a), ob = OD(b), pa = P(a), pb = P(b);
  const f = frame(900, 360, 7, 20, 0, 1, { xl: "Alter in Jahren", yl: "Wahrscheinlichkeit", nx: 13, fx: v => fmt(v, 0) });
  let s = f.s + `<path ${f.clip} d="${curve(f, P, 7, 20)}" fill="none" stroke="var(--therapie)" stroke-width="3"/>`;
  for (let x = 8; x + u <= 19; x += u) { s += `<line x1="${f.sx(x)}" x2="${f.sx(x + u)}" y1="${f.sy(P(x))}" y2="${f.sy(P(x))}" stroke="var(--muted)" stroke-width="1" stroke-dasharray="2 3"/><line x1="${f.sx(x + u)}" x2="${f.sx(x + u)}" y1="${f.sy(P(x))}" y2="${f.sy(P(x + u))}" stroke="var(--muted)" stroke-width="1" stroke-dasharray="2 3"/>`; }
  s += `<line x1="${f.sx(a)}" x2="${f.sx(b)}" y1="${f.sy(pa)}" y2="${f.sy(pa)}" stroke="var(--fg)" stroke-width="2.5"/><line x1="${f.sx(b)}" x2="${f.sx(b)}" y1="${f.sy(pa)}" y2="${f.sy(pb)}" stroke="var(--beta-ink)" stroke-width="5"/>`;
  s += `<circle cx="${f.sx(a)}" cy="${f.sy(pa)}" r="7" fill="var(--fg)"/><circle cx="${f.sx(b)}" cy="${f.sy(pb)}" r="7" fill="var(--beta-ink)"/><text x="${f.sx(b) + 10}" y="${f.sy((pa + pb) / 2) + 4}" class="strong halo" style="fill:var(--beta-ink)">+${fmt((pb - pa) * 100, 1)} %-Punkte</text>`;
  $("c3").innerHTML = s;
  $("f3").innerHTML = TB(String.raw`\begin{aligned} \text{OR}_{\text{pro } ${u} \text{ Jahr${u > 1 ? "e" : ""}}} &= e^{${u > 1 ? u + " \\cdot " : ""}b_1} = e^{${u > 1 ? u + " \\cdot " : ""}${tz(fmt(B1, 3))}} = ${tz(fmt(ORu, 2))} \\ \dfrac{\text{Odds}(${b})}{\text{Odds}(${a})} &= \dfrac{${tz(fmt(ob, 3))}}{${tz(fmt(oa, 3))}} = ${tz(fmt(ob / oa, 2))} \end{aligned}`, "");
  $("r3").innerHTML = readout(`p mit ${a} Jahren`, pc(pa)) + readout(`p mit ${b} Jahren`, pc(pb)) + readout("Risikodifferenz", "+" + fmt((pb - pa) * 100, 1) + " %-Punkte") + readout(`Odds Ratio pro ${u} J.`, fmt(ORu, 2), "r-decision");
  $("k3").innerHTML = `Egal bei welchem Alter Sie starten: Die Odds wachsen ${u === 1 ? "pro Jahr" : `über ${u} Jahre`} immer um den Faktor ${fmt(ORu, 2)}. Die Risikodifferenz dagegen hängt vom Ausgangsalter ab (graue Treppe): Bei 9 Jahren ist sie winzig, in der Mitte der Kurve am größten. Deshalb berichtet man das OR und rechnet für konkrete Personen in Wahrscheinlichkeiten zurück. Die Einheit wählen Sie wie in der linearen Regression so, dass sie inhaltlich sinnvoll ist (vgl. <a href="../../regression/gerade/#acc-4">Skalieren</a>). Die Rechnung kennen Sie aus der Diagnostik: Nachtest-Odds = Vortest-Odds × LR. Hier: Odds mit ${b} = Odds mit ${a} × OR.`;
}
$("a3").addEventListener("input", draw3);
$("unit").addEventListener("click", e => { const b = pick(e, $("unit")); if (!b) return; u = +b.dataset.u; draw3(); });

/* ---------- 4 ML ---------- */
const llOf = (b0, b1) => S.reduce((a, y, i) => { const e = b0 + b1 * A[i]; return a + y * e - Math.log(1 + Math.exp(e)); }, 0);
const bestB0 = b1 => { let b0 = Math.log(0.1 / 0.9) - b1 * mean(A); for (let it = 0; it < 30; it++) { let g = 0, h = 0; for (let i = 0; i < N; i++) { const p = 1 / (1 + Math.exp(-(b0 + b1 * A[i]))); g += S[i] - p; h += p * (1 - p); } b0 += g / h; } return b0; };
function mean(v) { return v.reduce((a, x) => a + x, 0) / v.length; }
const PROF = []; for (let b = 0.1; b <= 1.0001; b += 0.01) { const b0 = bestB0(b); PROF.push([b, llOf(b0, b)]); }
function draw4() {
  const b1 = +$("b1").value, b0 = bestB0(b1), ll = llOf(b0, b1); $("b1-v").textContent = fmt(b1, 2);
  const f = frame(520, 380, 2, 20, 0, 1, { P: { L: 48, R: 10, T: 12, B: 44 }, xl: "Alter in Jahren", yl: "Wahrscheinlichkeit", nx: 6, fx: v => fmt(v, 0) });
  let s = f.s;
  AG.forEach(a => { const g = AGES[a]; s += `<circle cx="${f.sx(a)}" cy="${f.sy(g.k / g.n)}" r="${3 + Math.sqrt(g.n) * 0.7}" fill="var(--surface)" stroke="var(--fg)" stroke-width="1.6"/>`; });
  s += `<path ${f.clip} d="${curve(f, P, 2, 20)}" fill="none" stroke="var(--muted)" stroke-width="1.6" stroke-dasharray="5 4"/>`;
  s += `<path ${f.clip} d="${curve(f, x => 1 / (1 + Math.exp(-(b0 + b1 * x))), 2, 20)}" fill="none" stroke="var(--beta-ink)" stroke-width="3"/>`;
  $("c4a").innerHTML = s;
  const lo = Math.min(...PROF.map(p => p[1])), hi = LG.ll;
  const g = frame(520, 380, 0.1, 1, lo - 5, hi + 10, { P: { L: 56, R: 10, T: 12, B: 44 }, xl: "Steigung b₁", yl: "Log-Likelihood", nx: 9, fx: v => fmt(v, 1) });
  let t = g.s + `<path d="M${PROF.map(p => g.sx(p[0]).toFixed(1) + "," + g.sy(p[1]).toFixed(1)).join("L")}" fill="none" stroke="var(--therapie)" stroke-width="3"/>`;
  t += `<line x1="${g.sx(B1)}" x2="${g.sx(B1)}" y1="${g.P.T}" y2="${g.sy(lo - 5)}" stroke="var(--muted)" stroke-dasharray="4 4"/><text x="${g.sx(B1) + 6}" y="${g.P.T + 14}" style="fill:var(--muted)">Maximum bei ${fmt(B1, 3)}</text>`;
  t += `<circle cx="${g.sx(b1)}" cy="${g.sy(ll)}" r="8" fill="var(--beta-ink)"/>`;
  $("c4b").innerHTML = t;
  $("r4").innerHTML = readout("Log-Likelihood Ihrer Kurve", fmt(ll, 1)) + readout("Maximum", fmt(LG.ll, 1), "r-decision") + readout("−2 Log-Likelihood", fmt(-2 * ll, 1)) + readout("Nagelkerke-R²", fmt(LG.nagelkerke, 3));
  const ci = (b, se) => [Math.exp(b - 1.96 * se), Math.exp(b + 1.96 * se)], c1 = ci(B1, LG.se[1]);
  $("spss").innerHTML = `<thead><tr><th></th><th>B</th><th>Standardfehler</th><th>Wald</th><th>df</th><th>Sig.</th><th>Exp(B)</th><th>95-%-KI für Exp(B)</th></tr></thead><tbody>
    <tr class="hl"><td>Alter</td><td>${fmt(B1, 3)}</td><td>${fmt(LG.se[1], 3)}</td><td>${fmt(LG.wald[1], 1)}</td><td>1</td><td>${fp(LG.p[1])}</td><td>${fmt(Math.exp(B1), 3)}</td><td>${fmt(c1[0], 3)} bis ${fmt(c1[1], 3)}</td></tr>
    <tr><td>Konstante</td><td>${fmt(B0, 3)}</td><td>${fmt(LG.se[0], 3)}</td><td>${fmt(LG.wald[0], 1)}</td><td>1</td><td>${fp(LG.p[0])}</td><td>${fmt(Math.exp(B0), 5)}</td><td></td></tr></tbody>`;
  $("k4").innerHTML = Math.abs(b1 - B1) < 0.006 ? `Das ist die beste Kurve: Keine andere Steigung macht die beobachteten Daten wahrscheinlicher. So entstehen die Koeffizienten in SPSS und R.` :
    `Ihre Kurve erreicht eine Log-Likelihood von ${fmt(ll, 1)}, die beste ${fmt(LG.ll, 1)}. Je näher am Maximum, desto besser passt die Kurve zu den Kreisen.`;
}
$("b1").addEventListener("input", draw4);
$("best").addEventListener("click", () => { $("b1").value = B1.toFixed(2); draw4(); $("k4").innerHTML = `Das Maximum liegt bei b₁ = ${fmt(B1, 3)}. Lesen Sie die SPSS-Tabelle: <b>B</b> ist die Steigung auf der Logit-Skala, <b>Exp(B)</b> = ${fmt(Math.exp(B1), 2)} das Odds Ratio pro Jahr. <b>Wald</b> = (B ÷ SE)² ist der Test von H₀: B = 0, das Gegenstück zum t-Test der linearen Regression. Das Konfidenzintervall für Exp(B) schließt die 1 aus. Der Likelihood-Ratio-Test vergleicht das Modell mit einem ohne Alter: χ² = ${fmt(LG.chi2, 1)}, df = 1. Nagelkerke-R² ist ein Pseudo-R² und nicht wie R² in der linearen Regression als erklärter Varianzanteil zu lesen.`; });

draw1(); draw2(); draw3(); draw4();
})();
