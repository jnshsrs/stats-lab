/* Wie viel erklärt die Gerade? · Stats Lab
   Station 23: Streuungszerlegung SQT = SQM + SQR, R² und Wertebereich, ANOVA-Tabelle, Regression zur Mitte. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const fmt = (x, d = 2) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");
const tz = x => String(x).replace(/\./g, "{.}").replace(/,/g, "{,}").replace(/−/g, "-");
const readout = (l, v, cls = "") => `<div class="readout ${cls}"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;
const TB = (t, fb) => window.katex ? texBlock(t) : fb;
const fp = p => p < 0.001 ? "< 0,001" : fmt(p, 3);
const { ols, mean, fcdf } = window.REG;
const R = window.FEV.rows, X = R.map(r => r[2]), Y = R.map(r => r[1]), SM = R.map(r => r[4]), N = X.length;
const MX = mean(X), MY = mean(Y), SDX = Math.sqrt(X.reduce((a, v) => a + (v - MX) ** 2, 0) / (N - 1)), SDY = Math.sqrt(Y.reduce((a, v) => a + (v - MY) ** 2, 0) / (N - 1));
const FULL = ols(Y, [X]), B0 = FULL.b[0], B1 = FULL.b[1];
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
const C = { tot: "var(--fg)", exp: "var(--therapie)", res: "var(--beta-ink)" };
const sq = v => v.toLocaleString("de-DE", { maximumFractionDigits: v < 10 ? 2 : 1, minimumFractionDigits: v < 10 ? 2 : 1 });

/* ---------- 1 Drei Abstände ---------- */
const ORD = X.map((x, i) => i).sort((a, b) => X[a] - X[b]);
const SUB = Array.from({ length: 25 }, (_, j) => ORD[Math.floor((j + 0.5) * N / 25)]);
const SX = SUB.map(i => X[i]), SY = SUB.map(i => Y[i]), SFIT = ols(SY, [SX]), SMY = mean(SY);
let view = "all", kid = 21;
function draw1() {
  const f = frame(900, 420, 110, 195, 0, 6);
  let s = f.s;
  s += `<line x1="${f.sx(110)}" x2="${f.sx(195)}" y1="${f.sy(SMY)}" y2="${f.sy(SMY)}" stroke="var(--muted)" stroke-width="1.6" stroke-dasharray="6 5"/><text x="${f.sx(112)}" y="${f.sy(SMY) - 8}" class="strong" style="fill:var(--muted)">Mittelwert ȳ = ${fmt(SMY)} l</text>`;
  s += `<line ${f.clip} x1="${f.sx(110)}" x2="${f.sx(195)}" y1="${f.sy(SFIT.b[0] + SFIT.b[1] * 110)}" y2="${f.sy(SFIT.b[0] + SFIT.b[1] * 195)}" stroke="var(--therapie)" stroke-width="2.5"/>`;
  const seg = (x, a, b, col, w, op) => `<line x1="${x}" x2="${x}" y1="${f.sy(a)}" y2="${f.sy(b)}" stroke="${col}" stroke-width="${w}" stroke-opacity="${op}" stroke-linecap="round"/>`;
  SX.forEach((x, j) => {
    const y = SY[j], yh = SFIT.fit[j], sel = j === kid, w = sel ? 4 : 2, op = sel ? 1 : .45, X0 = f.sx(x);
    if (view === "all") { s += seg(X0 - 5, SMY, y, C.tot, w, op) + seg(X0 + 1, SMY, yh, C.exp, w, op) + seg(X0 + 6, yh, y, C.res, w, op); }
    else s += view === "tot" ? seg(X0, SMY, y, C.tot, w, op) : view === "exp" ? seg(X0, SMY, yh, C.exp, w, op) : seg(X0, yh, y, C.res, w, op);
  });
  SX.forEach((x, j) => s += `<circle class="kid" data-j="${j}" cx="${f.sx(x)}" cy="${f.sy(SY[j])}" r="${j === kid ? 8 : 5.5}" fill="${j === kid ? "var(--fg)" : "var(--surface)"}" stroke="var(--fg)" stroke-width="2"/>`);
  $("d1").innerHTML = s;
  const y = SY[kid], yh = SFIT.fit[kid];
  $("d1-kid").innerHTML = TB(String.raw`\begin{aligned} \underbrace{y - \bar{y}}_{\text{gesamt}} &= \underbrace{(\hat{y} - \bar{y})}_{\text{erklärt}} + \underbrace{(y - \hat{y})}_{\text{Residuum}} \\ ${tz(fmt(y - SMY))} &= ${tz(fmt(yh - SMY))} + (${tz(fmt(y - yh))}) \end{aligned}`, "") +
    `<span class="dim">Ausgewähltes Kind: ${fmt(SX[kid], 0)} cm, FEV ${fmt(y)} l, Sollwert der Geraden ${fmt(yh)} l.</span>`;
  // Balken
  const T = SFIT.sqT, pm = SFIT.sqM / T * 100;
  $("d1-bar").innerHTML = `<div class="sqrow"><span class="sqlab">gesamt</span><div class="sqbar"><i class="t" style="width:100%">SQT = ${sq(T)}</i></div></div>
    <div class="sqrow"><span class="sqlab">zerlegt</span><div class="sqbar"><i class="m" style="width:${pm}%">SQM = ${sq(SFIT.sqM)}</i><i class="r" style="width:${100 - pm}%" title="SQR Residuen">${sq(SFIT.sqR)}</i></div></div>`;
  $("d1-f").innerHTML = TB(String.raw`\begin{aligned} \mathrm{SQT} &= \textstyle\sum (y_i - \bar{y})^2 \\ \mathrm{SQM} &= \textstyle\sum (\hat{y}_i - \bar{y})^2 \\ \mathrm{SQR} &= \textstyle\sum (y_i - \hat{y}_i)^2 \\[4pt] \mathrm{SQT} &= \mathrm{SQM} + \mathrm{SQR} \\ ${tz(sq(T))} &= ${tz(sq(SFIT.sqM))} + ${tz(sq(SFIT.sqR))} \\[4pt] R^2 &= \dfrac{\mathrm{SQM}}{\mathrm{SQT}} = ${tz(fmt(SFIT.r2, 3))} \end{aligned}`, "") +
    `<span class="dim">Die Abstände eines Kindes addieren sich immer. Die Quadrate tun das nur in der Summe über alle Kinder: Die Kreuzprodukte heben sich auf, weil die Residuen nicht mit den Vorhersagen zusammenhängen.</span>`;
  $("d1-r").innerHTML = readout("SQT gesamt", sq(T)) + readout("SQM erklärt", sq(SFIT.sqM)) + readout("SQR Residuen", sq(SFIT.sqR)) + readout("R²", fmt(SFIT.r2 * 100, 1) + " %", "r-decision");
  $("d1-c").innerHTML = `In diesen 25 Kindern erklärt die Größe ${fmt(SFIT.r2 * 100, 0)} % der Unterschiede in der FEV. Mit allen 654 Kindern sind es ${fmt(FULL.r2 * 100, 1)} %. Die übrigen ${fmt((1 - FULL.r2) * 100, 0)} % gehen auf alles zurück, was das Modell nicht kennt. R² ist bei einer einzigen Einflussgröße das Quadrat der Korrelation: r = ${fmt(Math.sqrt(FULL.r2), 3)}, r² = ${fmt(FULL.r2, 3)}.`;
}
$("d1").addEventListener("click", e => { const c = e.target.closest("circle.kid"); if (!c) return; kid = +c.dataset.j; draw1(); });
$("view").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; view = b.dataset.v; $("view").querySelectorAll("button").forEach(z => z.setAttribute("aria-pressed", z === b)); draw1(); });

/* ---------- 2 Wertebereich ---------- */
function draw2(src) {
  let lo = +$("lo").value, hi = +$("hi").value;
  if (hi - lo < 6) { if (src === "lo") { hi = Math.min(189, lo + 6); $("hi").value = hi; } else { lo = Math.max(117, hi - 6); $("lo").value = lo; } }
  $("lo-v").textContent = lo + " cm"; $("hi-v").textContent = hi + " cm";
  const id = X.map((x, i) => i).filter(i => X[i] >= lo && X[i] <= hi), xs = id.map(i => X[i]), ys = id.map(i => Y[i]);
  const m = id.length > 3 ? ols(ys, [xs]) : null;
  const f = frame(900, 400, 110, 195, 0, 6);
  let s = f.s;
  s += `<rect x="${f.sx(110)}" y="${f.P.T}" width="${f.sx(lo) - f.sx(110)}" height="${f.sy(0) - f.P.T}" fill="var(--highlight)"/><rect x="${f.sx(hi)}" y="${f.P.T}" width="${f.sx(195) - f.sx(hi)}" height="${f.sy(0) - f.P.T}" fill="var(--highlight)"/>`;
  X.forEach((x, i) => { const inn = x >= lo && x <= hi; s += `<circle cx="${f.sx(x).toFixed(1)}" cy="${f.sy(Y[i]).toFixed(1)}" r="${inn ? 2.8 : 2}" fill="${inn ? "var(--pal-5)" : "var(--pal-3)"}" fill-opacity="${inn ? .7 : .3}"/>`; });
  s += `<line ${f.clip} x1="${f.sx(110)}" x2="${f.sx(195)}" y1="${f.sy(B0 + B1 * 110)}" y2="${f.sy(B0 + B1 * 195)}" stroke="var(--fg)" stroke-width="1.5" stroke-dasharray="6 5"/>`;
  if (m) s += `<line ${f.clip} x1="${f.sx(lo)}" x2="${f.sx(hi)}" y1="${f.sy(m.b[0] + m.b[1] * lo)}" y2="${f.sy(m.b[0] + m.b[1] * hi)}" stroke="var(--therapie)" stroke-width="4"/>`;
  $("d2").innerHTML = s;
  if (!m) return;
  const sdx = Math.sqrt(xs.reduce((a, v) => a + (v - mean(xs)) ** 2, 0) / (xs.length - 1));
  $("d2-r").innerHTML = readout("Kinder", String(id.length)) + readout("Steigung pro 10 cm", fmt(m.b[1] * 10) + " l") + readout("Streuung der Größe (SD)", fmt(sdx, 1) + " cm") + readout("R²", fmt(m.r2 * 100, 1) + " %", "r-decision");
  const full = lo <= 117 && hi >= 189;
  $("d2-c").innerHTML = full
    ? `Mit allen Kindern: Steigung ${fmt(B1 * 10)} l pro 10 cm, R² = ${fmt(FULL.r2 * 100, 1)} %. Schränken Sie den Bereich ein und beobachten Sie, was mit beiden Zahlen passiert.`
    : `Die Steigung bleibt in der Nähe von ${fmt(B1 * 10)} l pro 10 cm (hier ${fmt(m.b[1] * 10)} l), der Zusammenhang pro Zentimeter ist also derselbe. R² fällt aber auf ${fmt(m.r2 * 100, 0)} %. Der Grund: Die Größe streut im eingeschränkten Bereich kaum noch (SD ${fmt(sdx, 1)} statt ${fmt(SDX, 1)} cm). Dann gibt es wenig zu erklären, während die Residualstreuung gleich bleibt. Für die Praxis: R² und r beschreiben eine Stichprobe, keine Naturkonstante. Studien mit engen Einschlusskriterien finden kleinere Korrelationen.`;
}
["lo", "hi"].forEach(k => $(k).addEventListener("input", () => draw2(k)));
document.querySelectorAll("[data-rg]").forEach(b => b.addEventListener("click", () => { const [a, c] = b.dataset.rg.split(","); $("lo").value = a; $("hi").value = c; draw2(); }));

/* ---------- 3 ANOVA ---------- */
const BIN = X.map(x => Math.min(7, Math.floor((x - 115) / 10)));
const grpFit = g => { const k = [...new Set(g)].sort((a, b) => a - b), mu = {}; k.forEach(v => { const id = g.map((z, i) => i).filter(i => g[i] === v); mu[v] = mean(id.map(i => Y[i])); }); return { fit: g.map(v => mu[v]), mu, k }; };
const MODELS = {
  line: { name: "Regression (erklärt)", rest: "Residuen", df1: 1, fit: FULL.fit },
  bins: { name: "zwischen den Gruppen", rest: "innerhalb der Gruppen", df1: 7, ...grpFit(BIN) },
  smoke: { name: "zwischen den Gruppen", rest: "innerhalb der Gruppen", df1: 1, ...grpFit(SM) }
};
Object.values(MODELS).forEach(M => { M.sqM = M.fit.reduce((a, v) => a + (v - MY) ** 2, 0); M.sqR = Y.reduce((a, y, i) => a + (y - M.fit[i]) ** 2, 0); M.df2 = N - 1 - M.df1; M.F = (M.sqM / M.df1) / (M.sqR / M.df2); M.p = 1 - fcdf(M.F, M.df1, M.df2); M.r2 = M.sqM / (M.sqM + M.sqR); });
let model = "line";
function draw3() {
  const M = MODELS[model], f = frame(900, 400, 110, 195, 0, 6);
  let s = f.s;
  X.forEach((x, i) => { const sm = model === "smoke" && SM[i]; s += `<circle cx="${f.sx(x).toFixed(1)}" cy="${f.sy(Y[i]).toFixed(1)}" r="${sm ? 3.2 : 2.3}" fill="${sm ? "var(--beta-ink)" : "var(--pal-3)"}" fill-opacity="${sm ? .9 : .45}"/>`; });
  s += `<line x1="${f.sx(110)}" x2="${f.sx(195)}" y1="${f.sy(MY)}" y2="${f.sy(MY)}" stroke="var(--muted)" stroke-dasharray="6 5"/>`;
  if (model === "line") s += `<line ${f.clip} x1="${f.sx(110)}" x2="${f.sx(195)}" y1="${f.sy(B0 + B1 * 110)}" y2="${f.sy(B0 + B1 * 195)}" stroke="var(--therapie)" stroke-width="3.5"/>`;
  if (model === "bins") M.k.forEach(k => { const a = Math.max(110, 115 + 10 * k), b = k === 7 ? 195 : 125 + 10 * k; s += `<line x1="${f.sx(a)}" x2="${f.sx(b)}" y1="${f.sy(M.mu[k])}" y2="${f.sy(M.mu[k])}" stroke="var(--therapie)" stroke-width="3.5"/>`; });
  if (model === "smoke") [0, 1].forEach(k => s += `<line x1="${f.sx(110)}" x2="${f.sx(195)}" y1="${f.sy(M.mu[k])}" y2="${f.sy(M.mu[k])}" stroke="${k ? "var(--beta-ink)" : "var(--therapie)"}" stroke-width="3.5"/><text x="${f.sx(193)}" y="${f.sy(M.mu[k]) + (k ? -8 : 18)}" text-anchor="end" class="strong" style="fill:${k ? "var(--beta-ink)" : "var(--therapie)"}">${k ? "Rauchende" : "Nichtrauchende"}: ${fmt(M.mu[k])} l</text>`);
  $("d3").innerHTML = s;
  const n2 = v => fmt(v, 2), T = M.sqM + M.sqR;
  $("anova").innerHTML = `<thead><tr><th>Quelle</th><th>SQ</th><th>df</th><th>MQ = SQ/df</th><th>F</th><th>p</th></tr></thead><tbody>
    <tr><td class="exp">${M.name}</td><td>${n2(M.sqM)}</td><td>${M.df1}</td><td>${n2(M.sqM / M.df1)}</td><td>${fmt(M.F, 1)}</td><td>${fp(M.p)}</td></tr>
    <tr><td class="res">${M.rest}</td><td>${n2(M.sqR)}</td><td>${M.df2}</td><td>${fmt(M.sqR / M.df2, 3)}</td><td></td><td></td></tr>
    <tr class="tot"><td>gesamt</td><td>${n2(T)}</td><td>${N - 1}</td><td></td><td></td><td></td></tr></tbody>`;
  $("d3-f").innerHTML = TB(String.raw`\begin{aligned} F &= \dfrac{\mathrm{SQM}/df_1}{\mathrm{SQR}/df_2} = \dfrac{${tz(n2(M.sqM))}/${M.df1}}{${tz(n2(M.sqR))}/${M.df2}} \\ &= ${tz(fmt(M.F, 1))} \\[4pt] ${model === "line" ? "R^2" : "\\eta^2"} &= \dfrac{\mathrm{SQM}}{\mathrm{SQT}} = ${tz(fmt(M.r2, 3))} \end{aligned}`, "");
  $("d3-c").innerHTML = {
    line: `Die Gerade braucht nur eine Zahl mehr als der Mittelwert (df = 1) und erklärt ${fmt(M.r2 * 100, 1)} % der Streuung. Der F-Test prüft, ob das mehr ist als Zufall. Bei einer einzigen Einflussgröße ist er derselbe Test wie der t-Test der Steigung: F = t², hier ${fmt(FULL.t[1], 2)}² = ${fmt(FULL.t[1] ** 2, 1)}.`,
    bins: `Das ist eine einfaktorielle Varianzanalyse mit 8 Gruppen. In der ANOVA heißt R² meist η² (Eta-Quadrat), gemeint ist dasselbe. Die 8 Gruppenmittel brauchen 7 Freiheitsgrade und erklären ${fmt(M.r2 * 100, 1)} %, die Gerade mit einem einzigen Freiheitsgrad ${fmt(MODELS.line.r2 * 100, 1)} %. Wenn der Zusammenhang linear ist, ist die Gerade das sparsamere und bessere Modell.`,
    smoke: `Rauchen erklärt nur ${fmt(M.r2 * 100, 1)} % der Streuung, der Unterschied ist aber signifikant. Und er zeigt in die falsche Richtung: Rauchende Kinder haben im Mittel eine <b>höhere</b> FEV. Sie sind älter und größer, das kennen Sie aus <a href="../korrelation/#acc-4">Zusammenhang und Korrelation</a>. Ein kleines R² heißt nicht „unwichtig“, ein signifikantes F heißt nicht „kausal“. Beides auseinanderzunehmen ist Aufgabe der multiplen Regression.`
  }[model];
}
$("model").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; model = b.dataset.m; $("model").querySelectorAll("button").forEach(z => z.setAttribute("aria-pressed", z === b)); draw3(); });

/* ---------- 4 Regression zur Mitte ---------- */
const RR = Math.sqrt(FULL.r2);
function draw4() {
  const zx = +$("zx").value, zy = RR * zx; $("zx-v").textContent = fmt(zx, 1);
  const f = frame(900, 440, -3, 3, -3, 3, { xl: "Größe als z-Wert", yl: "FEV als z-Wert", nx: 6, fx: v => fmt(v, 0) });
  let s = f.s;
  X.forEach((x, i) => s += `<circle cx="${f.sx((x - MX) / SDX).toFixed(1)}" cy="${f.sy((Y[i] - MY) / SDY).toFixed(1)}" r="2.2" fill="var(--pal-3)" fill-opacity=".4"/>`);
  s += `<line ${f.clip} x1="${f.sx(-3)}" x2="${f.sx(3)}" y1="${f.sy(-3)}" y2="${f.sy(3)}" stroke="var(--fg)" stroke-width="1.6" stroke-dasharray="6 5"/><text x="${f.sx(-1.5)}" y="${f.sy(-2.5)}" class="strong">Steigung 1: keine Regression zur Mitte</text>`;
  s += `<line ${f.clip} x1="${f.sx(-3)}" x2="${f.sx(3)}" y1="${f.sy(-3 * RR)}" y2="${f.sy(3 * RR)}" stroke="var(--therapie)" stroke-width="3"/><text x="${f.sx(2.95)}" y="${f.sy(3 * RR) + 20}" text-anchor="end" class="strong" style="fill:var(--therapie)">Steigung r = ${fmt(RR, 2)}</text>`;
  s += `<line x1="${f.sx(zx)}" x2="${f.sx(zx)}" y1="${f.sy(0)}" y2="${f.sy(zx)}" stroke="var(--muted)" stroke-dasharray="3 3"/>`;
  s += `<line x1="${f.sx(0)}" x2="${f.sx(zx)}" y1="${f.sy(zx)}" y2="${f.sy(zx)}" stroke="var(--fg)" stroke-width="1.4" stroke-dasharray="3 3"/><line x1="${f.sx(0)}" x2="${f.sx(zx)}" y1="${f.sy(zy)}" y2="${f.sy(zy)}" stroke="var(--therapie)" stroke-width="1.6" stroke-dasharray="3 3"/>`;
  s += `<line x1="${f.sx(zx) + (zx >= 0 ? 14 : -14)}" x2="${f.sx(zx) + (zx >= 0 ? 14 : -14)}" y1="${f.sy(zx)}" y2="${f.sy(zy)}" stroke="var(--beta-ink)" stroke-width="4"/>`;
  s += `<circle cx="${f.sx(zx)}" cy="${f.sy(zx)}" r="6" fill="var(--surface)" stroke="var(--fg)" stroke-width="2"/><circle cx="${f.sx(zx)}" cy="${f.sy(zy)}" r="8" fill="var(--therapie)"/>`;
  $("d4").innerHTML = s;
  $("d4-r").innerHTML = readout("Größe", fmt(MX + zx * SDX, 0) + " cm") + readout("z-Wert der Größe", fmt(zx, 1)) + readout("vorhergesagter z-Wert FEV", fmt(zy, 2), "r-decision") + readout("vorhergesagte FEV", fmt(MY + zy * SDY) + " l");
  $("d4-c").innerHTML = `Ein Kind mit einer Größe von ${fmt(zx, 1)} Standardabweichungen ${zx >= 0 ? "über" : "unter"} dem Mittelwert bekommt eine FEV von nur ${fmt(Math.abs(zy), 2)} Standardabweichungen ${zx >= 0 ? "über" : "unter"} dem Mittelwert vorhergesagt. Der violette Abstand ist der „Zug zur Mitte“. Er ist umso größer, je kleiner r und damit R² ist; bei R² = 0 sagt das Modell für alle Kinder ȳ voraus. Daher hat die Regression ihren Namen, und genau dieser Effekt täuscht in Vorher-nachher-Studien Behandlungserfolge vor, siehe <a href="../regression-mitte/">Regression zur Mitte</a>.`;
}
$("zx").addEventListener("input", draw4);

draw1(); draw2(); draw3(); draw4();
})();
