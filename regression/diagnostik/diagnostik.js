/* Passt das Modell? · Stats Lab
   Station 24: Anscombe-Quartett, Residuen- und Q-Q-Plot (linear gegen log), Hebelwert und Cook-Distanz zum Ziehen. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const fmt = (x, d = 2) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");
const tz = x => String(x).replace(/\./g, "{.}").replace(/,/g, "{,}").replace(/−/g, "-");
const readout = (l, v, cls = "") => `<div class="readout ${cls}"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;
const TB = (t, fb) => window.katex ? texBlock(t) : fb;
const fp = p => p < 0.001 ? "< 0,001" : fmt(p, 3);
const { ols, mean } = window.REG;
const R = window.FEV.rows, X = R.map(r => r[2]), Y = R.map(r => r[1]), N = X.length;
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
function qnorm(p) { const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924], b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857], c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878], d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742], pl = 0.02425; let q, r; if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); } if (p > 1 - pl) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); } q = p - 0.5; r = q * q; return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
const pick = (id, el) => { const b = id.target.closest("button"); if (!b) return null; el.querySelectorAll("button").forEach(z => z.setAttribute("aria-pressed", z === b)); return b; };

/* ---------- 1 Anscombe ---------- */
const AX = [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5], AX4 = [8, 8, 8, 8, 8, 8, 8, 19, 8, 8, 8];
const ANS = [
  { x: AX, y: [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68], txt: "So soll es aussehen: eine lineare Punktwolke, und im Residuenplot rechts ein Band ohne Muster um die Nulllinie. Die Gerade ist hier ein gutes Modell." },
  { x: AX, y: [9.14, 8.14, 8.74, 8.77, 9.26, 8.10, 6.13, 3.10, 9.13, 7.26, 4.74], txt: "Ein glatter Bogen. Die Gerade ist das falsche Modell, obwohl r = 0,82 einen starken linearen Zusammenhang vortäuscht. Im Residuenplot ist der Bogen noch deutlicher: links und rechts negative, in der Mitte positive Residuen." },
  { x: AX, y: [7.46, 6.77, 12.74, 7.11, 7.81, 8.84, 6.08, 5.39, 8.15, 6.42, 5.73], txt: "Zehn Punkte liegen exakt auf einer flacheren Geraden, ein einziger Ausreißer zieht sie nach oben. Im Residuenplot fällt er sofort auf. Ohne ihn wäre r fast 1." },
  { x: AX4, y: [6.58, 5.76, 7.71, 8.84, 8.47, 7.04, 5.25, 12.50, 5.56, 7.91, 6.89], txt: "Zehn Punkte haben denselben x-Wert. Die Steigung wird von einem einzigen Punkt allein bestimmt; sein Hebelwert ist 1, sein Residuum daher genau null. Ohne ihn ließe sich gar keine Gerade berechnen. Ein unauffälliges Residuum heißt also nicht, dass der Punkt unauffällig ist." }
];
let ai = 0;
function drawA() {
  const D = ANS[ai], m = ols(D.y, [D.x]);
  const f = frame(520, 380, 2, 20, 2, 14, { P: { L: 44, R: 10, T: 12, B: 44 }, xl: "x", yl: "y", nx: 6 });
  let s = f.s + `<line ${f.clip} x1="${f.sx(2)}" x2="${f.sx(20)}" y1="${f.sy(m.b[0] + m.b[1] * 2)}" y2="${f.sy(m.b[0] + m.b[1] * 20)}" stroke="var(--therapie)" stroke-width="2.5"/>`;
  D.x.forEach((x, i) => s += `<circle cx="${f.sx(x)}" cy="${f.sy(D.y[i])}" r="6" fill="var(--fg)"/>`);
  $("a1").innerHTML = s;
  const g = frame(520, 380, 2, 20, -4, 4, { P: { L: 44, R: 10, T: 12, B: 44 }, xl: "x", yl: "Residuum y − ŷ", nx: 6 });
  let t = g.s + `<line x1="${g.sx(2)}" x2="${g.sx(20)}" y1="${g.sy(0)}" y2="${g.sy(0)}" stroke="var(--therapie)" stroke-width="2"/>`;
  D.x.forEach((x, i) => t += `<line x1="${g.sx(x)}" x2="${g.sx(x)}" y1="${g.sy(0)}" y2="${g.sy(m.res[i])}" stroke="var(--beta-ink)" stroke-width="2" stroke-opacity=".6"/><circle cx="${g.sx(x)}" cy="${g.sy(m.res[i])}" r="6" fill="var(--beta-ink)"/>`);
  $("a2").innerHTML = t;
  $("a-r").innerHTML = readout("Mittelwert x", fmt(mean(D.x), 1)) + readout("Mittelwert y", fmt(mean(D.y), 2)) + readout("r", fmt(Math.sqrt(m.r2), 3)) + readout("Gerade", `ŷ = ${fmt(m.b[0])} + ${fmt(m.b[1])} · x`, "r-decision");
  $("a-c").innerHTML = D.txt;
}
$("ans").addEventListener("click", e => { const b = pick(e, $("ans")); if (!b) return; ai = +b.dataset.a; drawA(); });

/* ---------- 2 Residuen FEV ---------- */
const MODS = { lin: ols(Y, [X]), log: ols(Y.map(Math.log), [X]) };
const X2 = X.map(x => (x - 150) ** 2);
const QP = { lin: ols(Y, [X, X2]).p[2], log: ols(Y.map(Math.log), [X, X2]).p[2] };
let md = "lin";
function terc(m) { const o = m.fit.map((f, i) => i).sort((a, b) => m.fit[a] - m.fit[b]); return [0, 1, 2].map(k => { const id = o.slice(Math.floor(k * N / 3), Math.floor((k + 1) * N / 3)); return Math.sqrt(id.reduce((a, i) => a + m.res[i] ** 2, 0) / (id.length - 1)); }); }
function drawR() {
  const m = MODS[md], lg = md === "log";
  const flo = Math.min(...m.fit), fhi = Math.max(...m.fit), pad = (fhi - flo) * 0.04, ylim = lg ? 0.7 : 2;
  const f = frame(520, 380, flo - pad, fhi + pad, -ylim, ylim, { P: { L: 50, R: 10, T: 12, B: 44 }, xl: lg ? "Vorhersage ln(FEV)" : "Vorhersage ŷ in Litern", yl: lg ? "Residuum (ln-Einheiten)" : "Residuum in Litern", nx: 5, fx: v => fmt(v, 1) });
  let s = f.s;
  const o = m.fit.map((v, i) => i).sort((a, b) => m.fit[a] - m.fit[b]), G = 14, grp = [];
  for (let k = 0; k < G; k++) { const id = o.slice(Math.floor(k * N / G), Math.floor((k + 1) * N / G)), r = id.map(i => m.res[i]), mu = mean(r), sd = Math.sqrt(r.reduce((a, v) => a + (v - mu) ** 2, 0) / (r.length - 1)); grp.push({ x: mean(id.map(i => m.fit[i])), mu, sd }); }
  s += `<path ${f.clip} d="M${grp.map(g => f.sx(g.x) + "," + f.sy(g.mu + g.sd)).join("L")}L${grp.slice().reverse().map(g => f.sx(g.x) + "," + f.sy(g.mu - g.sd)).join("L")}Z" fill="var(--fg)" fill-opacity=".1"/>`;
  m.fit.forEach((v, i) => s += `<circle cx="${f.sx(v).toFixed(1)}" cy="${f.sy(m.res[i]).toFixed(1)}" r="2.2" fill="var(--beta-ink)" fill-opacity=".45"/>`);
  s += `<line x1="${f.P.L}" x2="${520 - f.P.R}" y1="${f.sy(0)}" y2="${f.sy(0)}" stroke="var(--fg)" stroke-width="1.4"/>`;
  s += `<path ${f.clip} d="M${grp.map(g => f.sx(g.x).toFixed(1) + "," + f.sy(g.mu).toFixed(1)).join("L")}" fill="none" stroke="var(--therapie)" stroke-width="3"/>`;
  $("r1").innerHTML = s;
  const z = m.res.map(v => v / m.s).sort((a, b) => a - b), q = z.map((v, i) => qnorm((i + 0.5) / N));
  const g = frame(520, 380, -3.5, 3.5, -4, 4, { P: { L: 44, R: 10, T: 12, B: 44 }, xl: "erwartet bei Normalverteilung", yl: "standardisiertes Residuum", nx: 7, fx: v => fmt(v, 0) });
  let t = g.s + `<line ${g.clip} x1="${g.sx(-3.5)}" x2="${g.sx(3.5)}" y1="${g.sy(-3.5)}" y2="${g.sy(3.5)}" stroke="var(--therapie)" stroke-width="2"/>`;
  z.forEach((v, i) => t += `<circle cx="${g.sx(q[i]).toFixed(1)}" cy="${g.sy(v).toFixed(1)}" r="2.2" fill="var(--fg)" fill-opacity=".5"/>`);
  $("r2").innerHTML = t;
  const tc = terc(m), u = lg ? "" : " l";
  $("r-r").innerHTML = readout("SD der Residuen, kleine ŷ", fmt(tc[0], lg ? 3 : 2) + u) + readout("SD der Residuen, mittlere ŷ", fmt(tc[1], lg ? 3 : 2) + u) + readout("SD der Residuen, große ŷ", fmt(tc[2], lg ? 3 : 2) + u) + readout("Krümmung: p des quadratischen Terms", QP[md] < 0.001 ? "< 0,001" : fmt(QP[md], 2), "r-decision");
  $("r-c").innerHTML = lg
    ? `Mit dem Logarithmus der FEV verschwinden beide Probleme. Die Residuen streuen überall gleich stark (${fmt(tc[0], 2)}, ${fmt(tc[1], 2)}, ${fmt(tc[2], 2)}), und ein quadratischer Term bringt nichts mehr (p = ${fmt(QP.log, 2)}). Ein Residuum von 0,15 auf der ln-Skala bedeutet rund 15 % über dem Sollwert: Kinder streuen in Prozent gleich stark, nicht in Litern. Genau darauf beruhte die relative Normgrenze in <a href="../../regression/normbereich/#acc-4">Wie sicher ist der Sollwert?</a>.`
    : `Zwei Muster: <b>ein Trichter</b>, denn die Residuen streuen bei großen Vorhersagen doppelt so stark wie bei kleinen (${fmt(tc[0], 2)} gegen ${fmt(tc[2], 2)} l). Und <b>ein leichter Bogen</b>, denn die blaue Kurve liegt an den Rändern über, in der Mitte unter null. Ein quadratischer Term ist hochsignifikant. Die Steigung ist trotzdem brauchbar geschätzt, aber Vorhersagebänder und Normgrenzen stimmen nicht. Schalten Sie auf Modell 2.`;
}
$("mod").addEventListener("click", e => { const b = pick(e, $("mod")); if (!b) return; md = b.dataset.m; drawR(); });

/* ---------- 3 Einfluss ---------- */
const ORD = X.map((x, i) => i).sort((a, b) => X[a] - X[b]);
const BASE = Array.from({ length: 20 }, (_, j) => ORD[Math.floor((j + 0.5) * N / 20)]);
const BX = BASE.map(i => X[i]), BY = BASE.map(i => Y[i]), M0 = ols(BY, [BX]);
let P = { x: 188, y: 1.7 }, F3 = null;
function drawI() {
  const xs = BX.concat(P.x), ys = BY.concat(P.y), n = xs.length, m = ols(ys, [xs]), mx = mean(xs), sxx = xs.reduce((a, v) => a + (v - mx) ** 2, 0);
  const h = 1 / n + (P.x - mx) ** 2 / sxx, e = m.res[n - 1], rs = e / (m.s * Math.sqrt(1 - h)), D = rs * rs * h / (2 * (1 - h));
  const f = frame(900, 420, 110, 195, 0, 6); F3 = f;
  let s = f.s;
  s += `<line ${f.clip} x1="${f.sx(110)}" x2="${f.sx(195)}" y1="${f.sy(M0.b[0] + M0.b[1] * 110)}" y2="${f.sy(M0.b[0] + M0.b[1] * 195)}" stroke="var(--fg)" stroke-width="1.8" stroke-dasharray="7 5"/>`;
  s += `<line ${f.clip} x1="${f.sx(110)}" x2="${f.sx(195)}" y1="${f.sy(m.b[0] + m.b[1] * 110)}" y2="${f.sy(m.b[0] + m.b[1] * 195)}" stroke="var(--therapie)" stroke-width="3"/>`;
  BX.forEach((x, i) => s += `<circle cx="${f.sx(x)}" cy="${f.sy(BY[i])}" r="5" fill="var(--fg)"/>`);
  const yh = m.b[0] + m.b[1] * P.x;
  s += `<line x1="${f.sx(P.x)}" x2="${f.sx(P.x)}" y1="${f.sy(P.y)}" y2="${f.sy(yh)}" stroke="var(--beta-ink)" stroke-width="2" stroke-dasharray="4 3"/>`;
  s += `<circle class="drag" id="pt" cx="${f.sx(P.x)}" cy="${f.sy(P.y)}" r="${10 + 14 * Math.min(1, h * 2)}" fill="var(--beta-ink)" fill-opacity=".85" stroke="var(--surface)" stroke-width="3"/>`;
  s += `<text x="${f.sx(P.x) + (P.x > 170 ? -30 : 30)}" y="${f.sy(P.y) + 5}" text-anchor="${P.x > 170 ? "end" : "start"}" class="strong" style="fill:var(--beta-ink)">ziehen</text>`;
  $("inf").innerHTML = s;
  const lvl = D > 1 ? "stark" : D > 4 / n ? "auffällig" : "gering";
  $("inf-r").innerHTML = readout("Hebelwert h", fmt(h, 3)) + readout("standardisiertes Residuum", fmt(rs, 2)) + readout("Cook-Distanz", fmt(D, 2) + ` (${lvl})`, "r-decision") + readout("Steigung pro 10 cm: ohne / mit", `${fmt(M0.b[1] * 10)} / ${fmt(m.b[1] * 10)} l`);
  $("inf-f").innerHTML = TB(String.raw`\begin{aligned} h &= \tfrac{1}{n} + \tfrac{(x - \bar{x})^2}{\sum (x_i - \bar{x})^2} = ${tz(fmt(h, 3))} \\ D &= \dfrac{r^2}{2} \cdot \dfrac{h}{1 - h} \\ &= \dfrac{${tz(fmt(rs, 2))}^2}{2} \cdot \dfrac{${tz(fmt(h, 3))}}{${tz(fmt(1 - h, 3))}} = ${tz(fmt(D, 2))} \end{aligned}`, "") +
    `<span class="dim">Der Hebelwert misst, wie weit der Punkt bei x am Rand liegt. Die Cook-Distanz kombiniert Hebel und Residuum: Einfluss entsteht nur, wenn beides zusammenkommt. Faustregeln: über 4/n = ${fmt(4 / n, 2)} genauer ansehen, über 1 stark einflussreich.</span>`;
  const hiH = h > 2 * 2 / n, hiR = Math.abs(rs) > 2;
  $("inf-c").innerHTML = hiH && hiR ? `<b>Großer Hebel und großes Residuum:</b> Der Punkt liegt am Rand und weit neben der Geraden. Er kippt die Steigung von ${fmt(M0.b[1] * 10)} auf ${fmt(m.b[1] * 10)} l pro 10 cm. Ein einzelnes Kind bestimmt hier das Ergebnis mit. Prüfen: Messfehler? Anderes Kollektiv? Analyse mit und ohne berichten.`
    : hiH ? `<b>Großer Hebel, kleines Residuum:</b> Der Punkt liegt am Rand, aber auf der Linie der anderen. Er verändert die Steigung kaum und macht sie sogar genauer. Ein Hebelpunkt ist nicht automatisch ein Problem.`
    : hiR ? `<b>Großes Residuum, kleiner Hebel:</b> Ein klarer Ausreißer, aber in der Mitte der Daten. Er verschiebt die Gerade etwas nach oben oder unten, die Steigung ändert sich kaum. Er vergrößert aber die Residualstreuung und damit alle Standardfehler.`
    : `Der Punkt liegt unauffällig im Bereich der anderen Kinder. Ziehen Sie ihn an den Rand und weit weg von der Geraden.`;
}
(() => {
  const svg = $("inf"); let drag = false;
  const toData = ev => { const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()), f = F3; const x = 110 + (p.x - f.P.L) / (900 - f.P.L - f.P.R) * 85, y = (420 - f.P.B - p.y) / (420 - f.P.T - f.P.B) * 6; return { x: Math.min(194, Math.max(111, x)), y: Math.min(5.9, Math.max(0.1, y)) }; };
  svg.addEventListener("pointerdown", ev => { if (ev.target.id !== "pt") return; drag = true; svg.setPointerCapture(ev.pointerId); ev.preventDefault(); });
  svg.addEventListener("pointermove", ev => { if (!drag) return; P = toData(ev); drawI(); });
  svg.addEventListener("pointerup", () => drag = false);
  svg.addEventListener("click", ev => { if (ev.target.id === "pt" || drag) return; P = toData(ev); drawI(); });
})();
$("presets").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; const [x, y] = b.dataset.p.split(",").map(Number); P = { x, y }; drawI(); });

drawA(); drawR(); drawI();
})();
