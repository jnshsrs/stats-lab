/* Zusammenhang und Korrelation · Stats Lab
   FEV-Daten (654 Kinder): Streudiagramm, Kovarianz als Rechtecke mit ziehbaren Punkten, Gefühl für r, Störgröße Alter. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const fmt = (x, d = 2) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");
const tz = x => String(x).replace(/\./g, "{.}").replace(/,/g, "{,}").replace(/−/g, "-");
const readout = (l, v, cls = "") => `<div class="readout ${cls}"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;
const R = window.FEV.rows, C = { alter: 0, fev: 1, cm: 2, m: 3, rauch: 4 };
const col = k => R.map(r => r[C[k]]);
const { cor, mean } = window.REG;
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function ticks(lo, hi, n = 8) { const span = hi - lo, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw))); const st = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => span / s <= n); const o = []; for (let v = Math.ceil(lo / st) * st; v <= hi + 1e-9; v += st) o.push(+v.toFixed(6)); return o; }
const LAB = { cm: "Körpergröße in cm", alter: "Alter in Jahren", fev: "FEV in Litern" };
function frame(W, H, xlo, xhi, ylo, yhi, xl, yl, P = { L: 60, R: 16, T: 14, B: 46 }) {
  const sx = v => P.L + (v - xlo) / (xhi - xlo) * (W - P.L - P.R), sy = v => H - P.B - (v - ylo) / (yhi - ylo) * (H - P.T - P.B);
  let s = "";
  ticks(xlo, xhi).forEach(v => s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${P.T}" y2="${H - P.B}" stroke="var(--grid)"/><text x="${sx(v)}" y="${H - P.B + 18}" text-anchor="middle">${fmt(v, v % 1 ? 1 : 0)}</text>`);
  ticks(ylo, yhi, 6).forEach(v => s += `<line x1="${P.L}" x2="${W - P.R}" y1="${sy(v)}" y2="${sy(v)}" stroke="var(--grid)"/><text x="${P.L - 8}" y="${sy(v) + 4}" text-anchor="end">${fmt(v, v % 1 ? 1 : 0)}</text>`);
  s += `<text x="${W - P.R}" y="${H - 6}" text-anchor="end">${xl}</text><text x="14" y="${(P.T + H - P.B) / 2}" transform="rotate(-90 14 ${(P.T + H - P.B) / 2})" text-anchor="middle">${yl}</text>`;
  return { sx, sy, s, P };
}

/* ---------- 1 Streudiagramm ---------- */
const S1 = { x: "cm", c: "none" };
function draw1() {
  const x = col(S1.x), y = col("fev"), r = cor(x, y);
  const xlo = S1.x === "cm" ? 110 : 2, xhi = S1.x === "cm" ? 190 : 20;
  const f = frame(900, 420, xlo, xhi, 0, 6, LAB[S1.x], LAB.fev);
  let s = f.s; const rnd = mulberry32(3);
  R.forEach((row, i) => {
    const jit = S1.x === "alter" ? (rnd() - 0.5) * 0.5 : 0, c = S1.c === "none" ? "var(--pal-4)" : row[C[S1.c]] ? "var(--therapie)" : "var(--pal-3)";
    s += `<circle cx="${f.sx(x[i] + jit)}" cy="${f.sy(y[i])}" r="3.2" fill="${c}" fill-opacity="${S1.c === "rauch" && !row[4] ? .45 : .7}"/>`;
  });
  $("sc").innerHTML = s;
  $("sc").setAttribute("aria-label", `Streudiagramm FEV gegen ${LAB[S1.x]}, r = ${fmt(r)}`);
  $("sc-lg").innerHTML = S1.c === "none" ? "" : S1.c === "m" ? `<span><i class="sw" style="background:var(--therapie)"></i>Jungen</span><span><i class="sw" style="background:var(--pal-3)"></i>Mädchen</span>` : `<span><i class="sw" style="background:var(--therapie)"></i>raucht</span><span><i class="sw" style="background:var(--pal-3)"></i>raucht nicht</span>`;
  $("sc-r").innerHTML = readout("Personen", "654") + readout(`r (FEV, ${S1.x === "cm" ? "Größe" : "Alter"})`, fmt(r), "r-decision") + readout("r²", fmt(r * r)) + readout(`Mittel ${S1.x === "cm" ? "Größe" : "Alter"}`, fmt(mean(x), 1) + (S1.x === "cm" ? " cm" : " J."));
  $("sc-c").innerHTML = S1.x === "cm"
    ? `Ein enger, fast gerader Zusammenhang: Größere Kinder atmen mehr Luft aus. Bei großen Kindern liegen die Punkte weiter auseinander, und die Wolke biegt sich leicht nach oben. Beides wird in der Diagnostik wichtig.`
    : `Auch das Alter hängt mit der FEV zusammen, aber lockerer (r = ${fmt(r)}): Gleichaltrige Kinder sind unterschiedlich groß. Die Punkte sind leicht seitlich verschoben, damit sich gleiche Alterswerte nicht verdecken.`;
}
const seg = (id, key, f) => $(id).addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; S1[key] = b.dataset[key === "x" ? "x" : "c"]; $(id).querySelectorAll("button").forEach(z => z.setAttribute("aria-pressed", z === b)); f(); });
seg("xvar", "x", draw1); seg("colby", "c", draw1);

/* ---------- 2 Kovarianz mit ziehbaren Punkten ---------- */
const XL = 110, XH = 190, YL = 0, YH = 6;
let pts = [], seed2 = 7;
function pick20(sd) { const r = mulberry32(sd), idx = new Set(); while (idx.size < 20) idx.add(Math.floor(r() * R.length)); return [...idx].map(i => ({ x: R[i][2], y: R[i][1] })); }
function draw2() {
  const f = frame(900, 420, XL, XH, YL, YH, LAB.cm, LAB.fev), n = pts.length;
  const mx = mean(pts.map(p => p.x)), my = mean(pts.map(p => p.y));
  let s = f.s, sp = 0, sn = 0;
  pts.forEach(p => { const pr = (p.x - mx) * (p.y - my), pos = pr >= 0; if (pos) sp += pr; else sn += pr;
    s += `<rect x="${Math.min(f.sx(p.x), f.sx(mx))}" y="${Math.min(f.sy(p.y), f.sy(my))}" width="${Math.abs(f.sx(p.x) - f.sx(mx))}" height="${Math.abs(f.sy(p.y) - f.sy(my))}" fill="${pos ? "var(--therapie)" : "var(--kontrolle)"}" fill-opacity=".14" stroke="${pos ? "var(--therapie)" : "var(--kontrolle)"}" stroke-opacity=".35"/>`; });
  s += `<line x1="${f.sx(mx)}" x2="${f.sx(mx)}" y1="${f.P.T}" y2="${420 - f.P.B}" stroke="var(--fg)" stroke-dasharray="6 4"/><line x1="${f.P.L}" x2="${900 - f.P.R}" y1="${f.sy(my)}" y2="${f.sy(my)}" stroke="var(--fg)" stroke-dasharray="6 4"/>`;
  s += `<text x="${f.sx(mx) + 6}" y="${f.P.T + 12}">x̄ = ${fmt(mx, 1)} cm</text><text x="${900 - f.P.R - 4}" y="${f.sy(my) - 6}" text-anchor="end">ȳ = ${fmt(my, 2)} l</text>`;
  pts.forEach((p, i) => s += `<circle class="pt" data-i="${i}" cx="${f.sx(p.x)}" cy="${f.sy(p.y)}" r="${p.out ? 9 : 7}" fill="${p.out ? "var(--alpha-ink)" : "var(--fg)"}" stroke="var(--surface)" stroke-width="2"/>`);
  $("cov").innerHTML = s;
  const sxy = sp + sn, cov = sxy / (n - 1), sdx = Math.sqrt(pts.reduce((a, p) => a + (p.x - mx) ** 2, 0) / (n - 1)), sdy = Math.sqrt(pts.reduce((a, p) => a + (p.y - my) ** 2, 0) / (n - 1)), r = cov / (sdx * sdy);
  $("cov-f").innerHTML = (window.katex ? texBlock(String.raw`\text{cov}(x, y) = \dfrac{\sum (x_i - \bar{x})(y_i - \bar{y})}{n - 1} = \dfrac{${tz(fmt(sp, 1))} ${sn < 0 ? "-" : "+"} ${tz(fmt(Math.abs(sn), 1))}}{${n - 1}} = ${tz(fmt(cov, 2))}`) + texBlock(String.raw`r = \dfrac{\text{cov}(x, y)}{s_x \cdot s_y} = \dfrac{${tz(fmt(cov, 2))}}{${tz(fmt(sdx, 2))} \cdot ${tz(fmt(sdy, 2))}} = \mathbf{${tz(fmt(r, 2))}}`) : `<span>cov = ${fmt(cov, 2)} · r = ${fmt(r, 2)}</span>`) +
    `<span class="dim">Die Kovarianz hängt von den Einheiten ab (cm mal Liter). Geteilt durch beide Standardabweichungen wird daraus r, ohne Einheit und immer zwischen −1 und +1.</span>`;
  $("cov-r").innerHTML = readout("Summe dunkle Rechtecke", fmt(sp, 1)) + readout("Summe helle Rechtecke", fmt(sn, 1)) + readout("Kovarianz", fmt(cov, 2)) + readout("r", fmt(r), "r-decision");
  const hasOut = pts.some(p => p.out);
  $("cov-c").innerHTML = hasOut
    ? `Ein einzelner Punkt weit weg vom Schwerpunkt erzeugt ein riesiges Rechteck. Er kann r allein deutlich verändern. Deshalb immer zuerst das Streudiagramm ansehen und Ausreißer prüfen, bevor man r berichtet.`
    : `Fast alle Rechtecke sind dunkel: Wer größer ist als der Durchschnitt, hat meist auch eine höhere FEV als der Durchschnitt. Ziehen Sie einen Punkt nach rechts unten und beobachten Sie, wie r sinkt.`;
}
function setPts(sd) { seed2 = sd; pts = pick20(sd); draw2(); }
$("new20").onclick = () => setPts(seed2 + 1);
$("reset20").onclick = () => setPts(seed2);
$("outlier").onclick = () => { if (!pts.some(p => p.out)) pts.push({ x: 182, y: 1.4, out: true }); draw2(); };
(() => {
  const svg = $("cov"); let drag = null;
  const toXY = e => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const q = pt.matrixTransform(svg.getScreenCTM().inverse()); return { x: XL + (q.x - 60) / (900 - 76) * (XH - XL), y: YL + (420 - 46 - q.y) / (420 - 60) * (YH - YL) }; };
  svg.addEventListener("pointerdown", e => { const c = e.target.closest(".pt"); if (!c) return; drag = +c.dataset.i; svg.setPointerCapture(e.pointerId); e.preventDefault(); });
  svg.addEventListener("pointermove", e => { if (drag == null) return; const v = toXY(e); pts[drag].x = Math.max(XL, Math.min(XH, v.x)); pts[drag].y = Math.max(YL, Math.min(YH, v.y)); draw2(); });
  ["pointerup", "pointercancel"].forEach(ev => svg.addEventListener(ev, () => { drag = null; }));
})();

/* ---------- 3 Gefühl für r ---------- */
let seed3 = 11;
function draw3() {
  const rr = +$("rr").value, rnd = mulberry32(seed3), n = 100, xs = [], ys = [];
  for (let i = 0; i < n; i++) { let u = 0; while (!u) u = rnd(); const v = rnd(), m = Math.sqrt(-2 * Math.log(u)), z1 = m * Math.cos(2 * Math.PI * v), z2 = m * Math.sin(2 * Math.PI * v); xs.push(z1); ys.push(rr * z1 + Math.sqrt(Math.max(0, 1 - rr * rr)) * z2); }
  const f = frame(900, 340, -3.5, 3.5, -3.5, 3.5, "x (standardisiert)", "y (standardisiert)");
  let s = f.s; xs.forEach((x, i) => s += `<circle cx="${f.sx(x)}" cy="${f.sy(ys[i])}" r="4" fill="var(--pal-4)" fill-opacity=".75"/>`);
  $("rsim").innerHTML = s;
  const re = cor(xs, ys);
  $("rr-v").textContent = fmt(rr);
  $("rsim-r").innerHTML = readout("eingestelltes r", fmt(rr)) + readout("r in dieser Stichprobe", fmt(re), "r-decision") + readout("r² · erklärter Anteil", Math.round(re * re * 100) + " %");
  const a = Math.abs(rr);
  $("rsim-c").innerHTML = (a >= 0.9 ? "Sehr eng: Die Punkte liegen fast auf einer Linie." : a >= 0.7 ? "Deutlich: Die Wolke ist klar gestreckt. Etwa so eng ist FEV und Körpergröße (r = 0,87)." : a >= 0.4 ? "Mittel: Der Trend ist sichtbar, aber die Streuung ist groß. Viele Zusammenhänge in der Physiotherapie liegen in diesem Bereich." : a >= 0.15 ? "Schwach: Ohne den Wert von r würde man den Trend kaum erkennen." : "Praktisch kein linearer Zusammenhang.") +
    ` r² = ${fmt(re * re)} heißt: ${Math.round(re * re * 100)} % der Unterschiede in y gehen mit Unterschieden in x einher. r misst nur <b>lineare</b> Zusammenhänge: Eine U-Form kann r = 0 haben und trotzdem einen starken Zusammenhang zeigen.`;
}
$("rr").addEventListener("input", draw3);
$("rr-new").onclick = () => { seed3++; draw3(); };

/* ---------- 4 Störgröße Alter ---------- */
function draw4() {
  const f = frame(900, 380, 2, 20, 0, 6, LAB.alter, LAB.fev), rnd = mulberry32(5);
  let s = f.s;
  [0, 1].forEach(sm => R.forEach(r => { if (r[4] !== sm) return; s += `<circle cx="${f.sx(r[0] + (rnd() - 0.5) * 0.5)}" cy="${f.sy(r[1])}" r="${sm ? 4.6 : 3}" fill="${sm ? "var(--therapie)" : "var(--pal-3)"}" fill-opacity="${sm ? .95 : .5}"/>`; }));
  const g = sm => R.filter(r => r[4] === sm);
  const f0 = mean(g(0).map(r => r[1])), f1 = mean(g(1).map(r => r[1])), a0 = mean(g(0).map(r => r[0])), a1 = mean(g(1).map(r => r[0]));
  const C0 = "var(--fg)", C1 = "var(--therapie)", X0 = f.sx(2), X1 = f.sx(20), YT = f.sy(6), YB = f.sy(0);
  const halo = 'style="paint-order:stroke;stroke:var(--surface);stroke-width:5px;stroke-linejoin:round;fill:';
  // mittleres Alter (dezent)
  s += `<line x1="${f.sx(a0)}" x2="${f.sx(a0)}" y1="${YT}" y2="${YB}" stroke="${C0}" stroke-width="1.4" stroke-dasharray="3 4" stroke-opacity=".55"/><line x1="${f.sx(a1)}" x2="${f.sx(a1)}" y1="${YT}" y2="${YB}" stroke="${C1}" stroke-width="1.4" stroke-dasharray="3 4" stroke-opacity=".7"/>`;
  s += `<text x="${f.sx(a0) - 6}" y="${YT + 14}" text-anchor="end" ${halo}${C0}">Ø Alter Nichtrauchende ${fmt(a0, 1)} J.</text><text x="${f.sx(a1) + 6}" y="${YT + 14}" ${halo}${C1}">Ø Alter Rauchende ${fmt(a1, 1)} J.</text>`;
  // mittlere FEV
  s += `<line x1="${X0}" x2="${X1}" y1="${f.sy(f0)}" y2="${f.sy(f0)}" stroke="${C0}" stroke-width="2.6" stroke-dasharray="9 5"/><line x1="${X0}" x2="${X1}" y1="${f.sy(f1)}" y2="${f.sy(f1)}" stroke="${C1}" stroke-width="3"/>`;
  s += `<text x="${X0 + 8}" y="${f.sy(f1) - 9}" class="strong" ${halo}${C1}">Ø FEV Rauchende ${fmt(f1)} l</text><text x="${X0 + 8}" y="${f.sy(f0) - 9}" class="strong" ${halo}${C0}">Ø FEV Nichtrauchende ${fmt(f0)} l</text>`;
  // Schwerpunkte
  s += `<circle cx="${f.sx(a0)}" cy="${f.sy(f0)}" r="8" fill="var(--surface)" stroke="${C0}" stroke-width="3"/><circle cx="${f.sx(a1)}" cy="${f.sy(f1)}" r="8" fill="var(--surface)" stroke="${C1}" stroke-width="3"/>`;
  $("conf").innerHTML = s;
  $("conf-r").innerHTML = readout("FEV Rauchende", fmt(f1) + " l", "r-decision") + readout("FEV Nichtrauchende", fmt(f0) + " l") + readout("Alter Rauchende", fmt(a1, 1) + " J.") + readout("Alter Nichtrauchende", fmt(a0, 1) + " J.");
}

draw1(); setPts(seed2); draw3(); draw4();
})();
