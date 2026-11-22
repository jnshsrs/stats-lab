/* Von der Geraden zur S-Kurve · Stats Lab
   Block 6, Station 1: Gerade durch 0/1-Daten, Herleitung der S-Kurve aus dem linearen Logit-Modell,
   Interpretation von b1 auf drei Skalen (Rise over Run), Exkurs Maximum Likelihood und LR-Test. */
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
const ETA = x => B0 + B1 * x, P = x => 1 / (1 + Math.exp(-ETA(x))), OD = x => Math.exp(ETA(x));
const AGES = {}; A.forEach((a, i) => { AGES[a] = AGES[a] || { n: 0, k: 0 }; AGES[a].n++; AGES[a].k += S[i]; });
const AG = Object.keys(AGES).map(Number).sort((a, b) => a - b);
const pick = (e, el) => { const b = e.target.closest("button"); if (!b) return null; el.querySelectorAll("button").forEach(z => z.setAttribute("aria-pressed", z === b)); return b; };
const pc = (x, d = 1) => fmt(x * 100, d) + " %";
const curve = (f, fn, lo, hi, st = 0.1) => { let d = ""; for (let x = lo; x <= hi + 1e-9; x += st) d += (d ? "L" : "M") + f.sx(x).toFixed(1) + "," + f.sy(fn(x)).toFixed(1); return d; };
const jit = i => ((i * 2654435761) % 1000) / 1000 - 0.5;
const meanOf = v => v.reduce((a, x) => a + x, 0) / v.length;

/* ---------- 1 Gerade durch 0/1 ---------- */
let m1 = "lin";
function draw1() {
  const f = frame(900, 440, 0, 40, -0.45, 1.45, { xl: "Alter in Jahren", yl: "", nx: 8, ny: 0, P: { L: 120, R: 16, T: 14, B: 46 } });
  let s = f.s;
  const band = (y0, y1, lab, ly) => `<rect x="${f.P.L}" y="${f.sy(y1)}" width="${900 - f.P.L - f.P.R}" height="${f.sy(y0) - f.sy(y1)}" fill="var(--beta-ink)" fill-opacity=".08"/><text x="${f.sx(39.5)}" y="${f.sy(ly)}" text-anchor="end" style="fill:var(--beta-ink)">${lab}</text>`;
  s += band(-0.45, 0, "unter 0: keine Bedeutung", -0.33) + band(1, 1.45, "über 1: keine Bedeutung", 1.36);
  s += `<rect x="${f.sx(19.5)}" y="${f.P.T}" width="${f.sx(40) - f.sx(19.5)}" height="${f.sy(-0.45) - f.P.T}" fill="var(--highlight)" fill-opacity=".6"/><text x="${f.sx(29.75)}" y="${f.sy(0.5)}" text-anchor="middle" style="fill:var(--muted)">keine Daten über 19 Jahre</text>`;
  [[0, "0 = raucht nicht"], [1, "1 = raucht"]].forEach(([v, l]) => s += `<line x1="${f.P.L}" x2="${900 - f.P.R}" y1="${f.sy(v)}" y2="${f.sy(v)}" stroke="var(--fg)" stroke-opacity=".35"/><text x="${f.P.L - 8}" y="${f.sy(v) + 4}" text-anchor="end" class="strong">${l}</text>`);
  if (m1 !== "lin") s += `<text x="${f.P.L - 8}" y="${f.sy(0.5) + 4}" text-anchor="end" style="fill:var(--muted)">0,5</text><line x1="${f.P.L}" x2="${900 - f.P.R}" y1="${f.sy(0.5)}" y2="${f.sy(0.5)}" stroke="var(--grid)"/>`;
  A.forEach((a, i) => s += `<circle cx="${(f.sx(a) + jit(i) * 14).toFixed(1)}" cy="${(f.sy(S[i]) + jit(i * 7) * 14).toFixed(1)}" r="2.6" fill="${S[i] ? "var(--fg)" : "var(--pal-3)"}" fill-opacity="${S[i] ? .75 : .5}"/>`);
  const lin = x => LPM.b[0] + LPM.b[1] * x;
  if (m1 === "lin") {
    s += `<path ${f.clip} d="${curve(f, lin, 0, 40)}" fill="none" stroke="var(--beta-ink)" stroke-width="3.5"/>`;
    const x0 = -LPM.b[0] / LPM.b[1], x1 = (1 - LPM.b[0]) / LPM.b[1];
    s += `<circle cx="${f.sx(x0)}" cy="${f.sy(0)}" r="6" fill="var(--beta-ink)"/><circle cx="${f.sx(x1)}" cy="${f.sy(1)}" r="6" fill="var(--beta-ink)"/>`;
    s += `<text x="${f.sx(x0) + 8}" y="${f.sy(0) + 22}" class="strong halo" style="fill:var(--beta-ink)">unter ${fmt(x0, 1)} J. negativ</text><text x="${f.sx(x1) - 8}" y="${f.sy(1) - 12}" text-anchor="end" class="strong halo" style="fill:var(--beta-ink)">ab ${fmt(x1, 1)} J. über 1</text>`;
  } else {
    s += `<path ${f.clip} d="${curve(f, lin, 0, 40)}" fill="none" stroke="var(--beta-ink)" stroke-width="1.6" stroke-dasharray="6 5" stroke-opacity=".6"/>`;
    s += `<path ${f.clip} d="${curve(f, P, 0, 40)}" fill="none" stroke="var(--therapie)" stroke-width="4"/>`;
  }
  $("c1").innerHTML = s;
  $("r1").innerHTML = m1 === "lin"
    ? readout("Gerade: ŷ = b₀ + b₁ · Alter", `${fmt(LPM.b[0], 3)} + ${fmt(LPM.b[1], 3)} · Alter`) + readout("ŷ mit 4 Jahren", fmt(LPM.b[0] + LPM.b[1] * 4, 2), "r-decision") + readout("ŷ mit 35 Jahren", fmt(LPM.b[0] + LPM.b[1] * 35, 2), "r-decision")
    : readout("S-Kurve mit 4 Jahren", fmt(P(4), 4)) + readout("mit 14 Jahren", fmt(P(14), 2), "r-decision") + readout("mit 35 Jahren", fmt(P(35), 4));
  $("k1").innerHTML = {
    lin: `Die Gerade ist die gewöhnliche lineare Regression durch die Nullen und Einsen. Ihre Vorhersagen ergeben keinen Sinn: Für ein 4-jähriges Kind liefert sie ${fmt(LPM.b[0] + LPM.b[1] * 4, 2)}, für eine 35-jährige Person ${fmt(LPM.b[0] + LPM.b[1] * 35, 2)}. Was sollen „minus 0,14 Rauchen“ oder „1,13 Rauchen“ sein? Auch die Residuen sind seltsam: Bei jedem Alter gibt es nur zwei mögliche Werte.`,
    log: `Die S-Kurve bleibt immer zwischen 0 und 1, egal wie weit man nach links oder rechts geht. Ihre Werte lassen sich deshalb als <b>Wahrscheinlichkeiten</b> lesen: Ein 14-jähriges Kind raucht mit einer Wahrscheinlichkeit von ${fmt(P(14), 2)}, also ${pc(P(14), 0)}. Wie man zu dieser Kurve kommt, zeigt Abschnitt 2.`
  }[m1];
}
$("m1").addEventListener("click", e => { const b = pick(e, $("m1")); if (!b) return; m1 = b.dataset.m; draw1(); });

/* ---------- 2 Herleitung ---------- */
const st = (lab, tex) => `<span class="step-l">${lab}</span>` + TB(tex, "");
$("f2").innerHTML = st("(1) Lineares Modell für den Logit, wie in Block 5", String.raw`\begin{aligned} \text{logit}(p) &= \ln\!\Bigl(\dfrac{p}{1-p}\Bigr) \\ &= b_0 + b_1 \cdot \text{Alter} \end{aligned}`) +
  st("(2) Beide Seiten hoch e: links stehen die Odds", String.raw`\dfrac{p}{1-p} = e^{\,b_0 + b_1 \cdot \text{Alter}}`) +
  st("(3) Nach p auflösen (kurz: e hoch Logit)", String.raw`\begin{aligned} p &= e^{\text{Logit}}\,(1 - p) \\ p\,(1 + e^{\text{Logit}}) &= e^{\text{Logit}} \\ p &= \dfrac{e^{\text{Logit}}}{1 + e^{\text{Logit}}} \end{aligned}`) +
  st("(4) Zähler und Nenner durch e hoch Logit teilen", String.raw`p = \dfrac{1}{1 + e^{-(b_0 + b_1 \cdot \text{Alter})}}`) +
  `<span class="dim">Mit den FEV-Daten: b₀ = ${fmt(B0, 3)}, b₁ = ${fmt(B1, 3)}. In Lehrbüchern hat der lineare Teil b₀ + b₁ · x oft ein eigenes Symbol: η („linearer Prädiktor“), z oder g(x). Gemeint ist immer der vorhergesagte Logit.</span>`;
function draw2() {
  const a = +$("a2").value; $("a2-v").textContent = a + " Jahre";
  const mini = (id, fn, ylo, yhi, yl, fy, col) => {
    const f = frame(420, 320, 2, 20, ylo, yhi, { P: { L: 60, R: 10, T: 12, B: 40 }, xl: "Alter in Jahren", yl, nx: 6, ny: 4, fx: v => fmt(v, 0) });
    let s = f.s + `<path ${f.clip} d="${curve(f, fn, 2, 20)}" fill="none" stroke="${col}" stroke-width="3"/>`;
    const v = fn(a), vy = Math.max(ylo, Math.min(yhi, v));
    s += `<line x1="${f.sx(a)}" x2="${f.sx(a)}" y1="${f.sy(ylo)}" y2="${f.sy(vy)}" stroke="var(--fg)" stroke-dasharray="3 3"/><circle cx="${f.sx(a)}" cy="${f.sy(vy)}" r="7" fill="var(--fg)"/><text x="${f.sx(a) + (a > 14 ? -10 : 10)}" y="${f.sy(vy) - 10}" text-anchor="${a > 14 ? "end" : "start"}" class="strong halo">${fy(v)}</text>`;
    $(id).innerHTML = s;
  };
  mini("c2a", ETA, -7, 3, "Logit", v => "Logit " + fmt(v, 2), "var(--fg)");
  mini("c2c", P, 0, 1, "Wahrscheinlichkeit p", v => "p = " + fmt(v, 3), "var(--therapie)");
  const e = ETA(a), o = Math.exp(e), p = o / (1 + o);
  $("bridge").innerHTML = `<span class="br-arrow">→</span><span class="br-f">p = 1 ÷ (1 + e<sup>−Logit</sup>)</span><span class="br-n">${fmt(e, 2)} → ${fmt(p, 3)}</span><span class="br-arrow">→</span>`;
  $("f2b").innerHTML = TB(String.raw`\begin{aligned} \text{Logit} &= ${tz(fmt(B0, 3))} + ${tz(fmt(B1, 3))} \cdot ${a} = ${tz(fmt(e, 2))} \\ \text{Odds} &= e^{${tz(fmt(e, 2))}} = ${tz(fmt(o, 3))} \\ p &= \dfrac{1}{1 + e^{${tz(fmt(-e, 2))}}} = ${tz(fmt(p, 3))} \end{aligned}`, "");
  $("k2").innerHTML = `Links das lineare Modell, wie Sie es aus Block 5 kennen: eine Gerade, hier für den Logit. Rechts dieselben Alterswerte, durch die Formel in der Mitte in Wahrscheinlichkeiten umgerechnet: die S-Kurve aus Abschnitt 1. Die S-Form entsteht also durch die Umrechnung; die Daten bestimmen nur, wo die Kurve liegt und wie steil sie ist. Für ein ${a}-jähriges Kind: Logit ${fmt(e, 2)}, Odds ${fmt(o, 3)}, Wahrscheinlichkeit ${pc(p)}. Alles, was die lineare Regression kann (mehrere Prädiktoren, Adjustierung, Wechselwirkung), steckt im linearen Teil b₀ + b₁ · Alter.`;
}
$("a2").addEventListener("input", draw2);

/* ---------- 3 Rise over Run ---------- */
(() => {
  const ages = [9, 10, 11, 12, 13, 14, 15, 16];
  let h = `<thead><tr><th rowspan="2">Alter</th><th class="grp" colspan="2">Logit</th><th class="grp" colspan="2">Wahrscheinlichkeit</th><th class="grp" colspan="2">Odds</th></tr><tr><th>Logit</th><th>Δ pro Jahr</th><th>p</th><th>Δ pro Jahr</th><th>Odds</th><th>× pro Jahr</th></tr></thead><tbody>`;
  ages.forEach((a, k) => {
    const prev = k ? ages[k - 1] : null;
    h += `<tr><td>${a}</td><td>${fmt(ETA(a), 2)}</td><td class="const">${prev ? "+" + fmt(ETA(a) - ETA(prev), 3) : ""}</td><td>${fmt(P(a), 3)}</td><td class="var">${prev ? "+" + fmt(P(a) - P(prev), 3) : ""}</td><td>${fmt(OD(a), 3)}</td><td class="const">${prev ? "× " + fmt(OD(a) / OD(prev), 3) : ""}</td></tr>`;
  });
  $("rr").innerHTML = h + `</tbody>`;
  const dps = ages.slice(1).map((a, k) => P(a) - P(ages[k]));
  $("e-l").innerHTML = `Steigt jedes Jahr um genau b₁ = ${fmt(B1, 3)}. Konstant wie in der linearen Regression, aber was heißt „0,48 Logit mehr“? Inhaltlich lesbar ist nur die Richtung: positiv, also steigt das Rauchen mit dem Alter.`;
  $("e-p").innerHTML = `Steigt jedes Jahr um einen anderen Betrag: von ${fmt(Math.min(...dps), 3)} bis ${fmt(Math.max(...dps), 3)}. Eine Steigung „pro Jahr“ gibt es hier nicht, der Zuwachs hängt vom Ausgangsalter ab.`;
  $("e-o").innerHTML = `Wachsen jedes Jahr um denselben <b>Faktor</b> e<sup>b₁</sup> = e<sup>${fmt(B1, 3)}</sup> = ${fmt(Math.exp(B1), 2)}. Das ist das <b>Odds Ratio pro Jahr</b>: Mit jedem Lebensjahr sind die Odds zu rauchen um ${fmt((Math.exp(B1) - 1) * 100, 0)} % höher.`;
})();
let u = 1;
function draw3() {
  const a = +$("a3").value; $("a3-v").textContent = a + " Jahre";
  const b = a + u, ORu = Math.exp(B1 * u), oa = OD(a), ob = OD(b), pa = P(a), pb = P(b);
  const f = frame(900, 340, 7, 20, 0, 1, { xl: "Alter in Jahren", yl: "Wahrscheinlichkeit", nx: 13, fx: v => fmt(v, 0) });
  let s = f.s + `<path ${f.clip} d="${curve(f, P, 7, 20)}" fill="none" stroke="var(--therapie)" stroke-width="3"/>`;
  s += `<line x1="${f.sx(a)}" x2="${f.sx(b)}" y1="${f.sy(pa)}" y2="${f.sy(pa)}" stroke="var(--fg)" stroke-width="2.5"/><line x1="${f.sx(b)}" x2="${f.sx(b)}" y1="${f.sy(pa)}" y2="${f.sy(pb)}" stroke="var(--beta-ink)" stroke-width="5"/>`;
  s += `<circle cx="${f.sx(a)}" cy="${f.sy(pa)}" r="7" fill="var(--fg)"/><circle cx="${f.sx(b)}" cy="${f.sy(pb)}" r="7" fill="var(--beta-ink)"/><text x="${f.sx(b) + 10}" y="${f.sy((pa + pb) / 2) + 4}" class="strong halo" style="fill:var(--beta-ink)">p: +${fmt(pb - pa, 3)}</text>`;
  $("c3").innerHTML = s;
  $("f3").innerHTML = TB(String.raw`\begin{aligned} \text{OR}_{\text{pro } ${u} \text{ Jahr${u > 1 ? "e" : ""}}} &= e^{${u > 1 ? u + " \\cdot " : ""}b_1} = e^{${u > 1 ? u + " \\cdot " : ""}${tz(fmt(B1, 3))}} = ${tz(fmt(ORu, 2))} \\ \dfrac{\text{Odds}(${b})}{\text{Odds}(${a})} &= \dfrac{${tz(fmt(ob, 3))}}{${tz(fmt(oa, 3))}} = ${tz(fmt(ob / oa, 2))} \end{aligned}`, "");
  $("k3").innerHTML = `Von ${a} auf ${b} Jahre steigt die Wahrscheinlichkeit um ${fmt(pb - pa, 3)}, die Odds steigen um den Faktor ${fmt(ORu, 2)}. Verschieben Sie das Ausgangsalter: Der Faktor bleibt, der Zuwachs an Wahrscheinlichkeit nicht. Für k Einheiten gilt e hoch (k · b₁), nicht k mal das OR. Die Einheit wählt man so, dass sie inhaltlich sinnvoll ist (vgl. <a href="../../regression/gerade/#acc-4">Skalieren</a>). Dieselbe Rechnung kennen Sie aus der Diagnostik: Nachtest-Odds = Vortest-Odds × LR; hier Odds mit ${b} = Odds mit ${a} × OR.`;
}
$("a3").addEventListener("input", draw3);
$("unit").addEventListener("click", e => { const b = pick(e, $("unit")); if (!b) return; u = +b.dataset.u; draw3(); });

/* ---------- 4 Exkurs Maximum Likelihood ---------- */
const llOf = (b0, b1) => S.reduce((a, y, i) => { const e = b0 + b1 * A[i]; return a + y * e - Math.log(1 + Math.exp(e)); }, 0);
const bestB0 = b1 => { let b0 = Math.log(0.1 / 0.9) - b1 * meanOf(A); for (let it = 0; it < 30; it++) { let g = 0, h = 0; for (let i = 0; i < N; i++) { const p = 1 / (1 + Math.exp(-(b0 + b1 * A[i]))); g += S[i] - p; h += p * (1 - p); } b0 += g / h; } return b0; };
const PROF = []; for (let b = 0.1; b <= 1.0001; b += 0.01) PROF.push([b, llOf(bestB0(b), b)]);
const EX = (() => { const want = [[8, 0], [10, 0], [12, 1], [13, 0], [15, 1], [17, 0]]; return want.map(([a, y]) => A.findIndex((x, i) => x === a && S[i] === y)); })();
function draw4() {
  const b1 = +$("b1").value, b0 = bestB0(b1), ll = llOf(b0, b1), pf = x => 1 / (1 + Math.exp(-(b0 + b1 * x))); $("b1-v").textContent = fmt(b1, 2);
  const f = frame(520, 380, 2, 20, -0.1, 1.1, { P: { L: 48, R: 10, T: 12, B: 44 }, xl: "Alter in Jahren", yl: "vorhergesagtes p", nx: 6, ny: 0, fx: v => fmt(v, 0) });
  let s = f.s;
  [0, 0.5, 1].forEach(v => s += `<line x1="${f.P.L}" x2="${510}" y1="${f.sy(v)}" y2="${f.sy(v)}" stroke="var(--grid)"/><text x="${f.P.L - 8}" y="${f.sy(v) + 4}" text-anchor="end">${fmt(v, v === 0.5 ? 1 : 0)}</text>`);
  A.forEach((a, i) => s += `<circle cx="${(f.sx(a) + jit(i) * 10).toFixed(1)}" cy="${(f.sy(S[i]) + jit(i * 7) * 10).toFixed(1)}" r="2" fill="var(--pal-3)" fill-opacity=".5"/>`);
  s += `<path ${f.clip} d="${curve(f, pf, 2, 20)}" fill="none" stroke="var(--beta-ink)" stroke-width="3"/>`;
  EX.forEach(i => { const y = S[i], p = pf(A[i]); s += `<line x1="${f.sx(A[i])}" x2="${f.sx(A[i])}" y1="${f.sy(y)}" y2="${f.sy(p)}" stroke="var(--fg)" stroke-width="1.6" stroke-dasharray="3 2"/><circle cx="${f.sx(A[i])}" cy="${f.sy(y)}" r="6" fill="var(--fg)"/>`; });
  $("c4a").innerHTML = s;
  const lo = Math.min(...PROF.map(p => p[1])), hi = LG.ll;
  const g = frame(520, 380, 0.1, 1, lo - 5, hi + 10, { P: { L: 56, R: 10, T: 12, B: 44 }, xl: "Steigung b₁", yl: "Log-Likelihood", nx: 9, fx: v => fmt(v, 1) });
  let t = g.s + `<path d="M${PROF.map(p => g.sx(p[0]).toFixed(1) + "," + g.sy(p[1]).toFixed(1)).join("L")}" fill="none" stroke="var(--therapie)" stroke-width="3"/>`;
  t += `<line x1="${g.sx(B1)}" x2="${g.sx(B1)}" y1="${g.P.T}" y2="${g.sy(lo - 5)}" stroke="var(--muted)" stroke-dasharray="4 4"/><text x="${g.sx(B1) + 6}" y="${g.P.T + 14}" style="fill:var(--muted)">Maximum bei ${fmt(B1, 3)}</text><circle cx="${g.sx(b1)}" cy="${g.sy(ll)}" r="8" fill="var(--beta-ink)"/>`;
  $("c4b").innerHTML = t;
  let prod = 1, sum = 0;
  let h = `<thead><tr><th>Kind</th><th>Alter</th><th>raucht</th><th>p der Kurve</th><th>Beitrag: p bzw. 1 − p</th><th>ln(Beitrag)</th></tr></thead><tbody>`;
  EX.forEach((i, k) => { const p = pf(A[i]), c = S[i] ? p : 1 - p; prod *= c; sum += Math.log(c); h += `<tr><td>${k + 1}</td><td>${A[i]}</td><td>${S[i] ? "ja" : "nein"}</td><td>${fmt(p, 3)}</td><td>${fmt(c, 3)}</td><td>${fmt(Math.log(c), 3)}</td></tr>`; });
  const l10 = ll / Math.LN10, ex = Math.floor(l10), man = Math.pow(10, l10 - ex);
  h += `<tr class="hl"><td colspan="4">diese 6 Kinder</td><td>Produkt ${fmt(prod, 4)}</td><td>Summe ${fmt(sum, 3)}</td></tr><tr class="tot"><td colspan="4">alle ${N} Kinder</td><td>Produkt ≈ ${fmt(man, 1)} · 10<sup>${ex}</sup></td><td>Summe ${fmt(ll, 1)}</td></tr></tbody>`;
  $("lt").innerHTML = h;
  const atBest = Math.abs(b1 - B1) < 0.006;
  $("k4").innerHTML = (atBest ? `<b>Das ist die beste Kurve:</b> Keine andere Steigung macht die beobachteten Daten wahrscheinlicher. ` : `Ihre Kurve erreicht eine Log-Likelihood von ${fmt(ll, 1)}, die beste ${fmt(LG.ll, 1)}. `) +
    `Warum der Logarithmus? Das Produkt über alle ${N} Kinder ist eine winzige Zahl mit ${-ex - 1} Nullen hinter dem Komma; damit kann kein Rechner sinnvoll arbeiten. Der Logarithmus macht aus dem Produkt eine <b>Summe</b>, und weil er monoton ist, liegt das Maximum an derselben Stelle. Die Software maximiert also die Summe der logarithmierten Beiträge, die <b>Log-Likelihood</b>.`;
}
$("lrt-b").innerHTML = `<p>Die Log-Likelihood vergleicht auch Modelle. Ein Modell ohne Alter sagt für alle Kinder denselben Anteil voraus (${pc(meanOf(S))}); seine Log-Likelihood ist ${fmt(LG.ll0, 1)}. Mit Alter steigt sie auf ${fmt(LG.ll, 1)}. Software berichtet meist −2 · Log-Likelihood: ${fmt(-2 * LG.ll0, 1)} gegen ${fmt(-2 * LG.ll, 1)}.</p><p>Die Differenz χ² = ${fmt(LG.chi2, 1)} folgt unter H₀ (Alter hat keinen Effekt) einer χ²-Verteilung mit so vielen Freiheitsgraden, wie Prädiktoren dazugekommen sind, hier 1; p &lt; 0,001. Das ist der <b>Likelihood-Ratio-Test</b> (in SPSS: „Omnibus-Tests der Modellkoeffizienten“).</p><p>Achtung, Namensvetter: Die Likelihood-Ratio aus der <a href="../../hintergrund/klinische-tests/">Diagnostik</a> (LR+ und LR− eines Tests) ist etwas anderes. Gemeinsam ist beiden nur die Idee, zwei Wahrscheinlichkeiten ins Verhältnis zu setzen.</p>`;
$("b1").addEventListener("input", draw4);
$("best").addEventListener("click", () => { $("b1").value = B1.toFixed(2); draw4(); });
(() => {
  const c1 = [Math.exp(B1 - 1.96 * LG.se[1]), Math.exp(B1 + 1.96 * LG.se[1])];
  $("spss").innerHTML = `<thead><tr><th></th><th>B</th><th>Standardfehler</th><th>Wald</th><th>df</th><th>Sig.</th><th>Exp(B)</th><th>95-%-KI für Exp(B)</th></tr></thead><tbody>
    <tr class="hl"><td>Alter</td><td>${fmt(B1, 3)}</td><td>${fmt(LG.se[1], 3)}</td><td>${fmt(LG.wald[1], 1)}</td><td>1</td><td>${fp(LG.p[1])}</td><td>${fmt(Math.exp(B1), 3)}</td><td>${fmt(c1[0], 3)} bis ${fmt(c1[1], 3)}</td></tr>
    <tr><td>Konstante</td><td>${fmt(B0, 3)}</td><td>${fmt(LG.se[0], 3)}</td><td>${fmt(LG.wald[0], 1)}</td><td>1</td><td>${fp(LG.p[0])}</td><td>${fmt(Math.exp(B0), 5)}</td><td></td></tr></tbody>`;
  $("spss-n").innerHTML = `<b>B</b> = Steigung auf der Logit-Skala (Abschnitt 3), <b>Exp(B)</b> = ${fmt(Math.exp(B1), 2)} das Odds Ratio pro Jahr. <b>Wald</b> = (B ÷ SE)² testet H₀: B = 0, das Gegenstück zum t-Test der linearen Regression. Nagelkerke-R² = ${fmt(LG.nagelkerke, 2)} ist ein Pseudo-R² und nicht als erklärter Varianzanteil zu lesen.`;
})();

draw1(); draw2(); draw3(); draw4();
})();
