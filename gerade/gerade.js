/* Die beste Gerade · Stats Lab
   Story: Sollwert für die Lungenfunktion. Mittelwert, Gruppenmittel, Gerade; kleinste Quadrate zum Anfassen; Gerade lesen und vorhersagen. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const fmt = (x, d = 2) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");
const tz = x => String(x).replace(/\./g, "{.}").replace(/,/g, "{,}").replace(/−/g, "-");
const readout = (l, v, cls = "") => `<div class="readout ${cls}"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;
const TB = (t, fb) => window.katex ? texBlock(t) : fb;
const R = window.FEV.rows, X = R.map(r => r[2]), Y = R.map(r => r[1]);
const { ols, mean } = window.REG;
const FULL = ols(Y, [X]), B0 = FULL.b[0], B1 = FULL.b[1];
const GIRL = { x: 150, y: 2.0 };
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function ticks(lo, hi, n = 8) { const span = hi - lo, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw))); const st = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => span / s <= n); const o = []; for (let v = Math.ceil(lo / st) * st; v <= hi + 1e-9; v += st) o.push(+v.toFixed(6)); return o; }
function frame(W, H, xlo, xhi, ylo, yhi, P = { L: 60, R: 16, T: 14, B: 46 }) {
  const sx = v => P.L + (v - xlo) / (xhi - xlo) * (W - P.L - P.R), sy = v => H - P.B - (v - ylo) / (yhi - ylo) * (H - P.T - P.B);
  let s = `<defs><clipPath id="cp${W}${H}${xlo}"><rect x="${P.L}" y="${P.T}" width="${W - P.L - P.R}" height="${H - P.T - P.B}"/></clipPath></defs>`;
  ticks(xlo, xhi).forEach(v => s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${P.T}" y2="${H - P.B}" stroke="var(--grid)"/><text x="${sx(v)}" y="${H - P.B + 18}" text-anchor="middle">${fmt(v, 0)}</text>`);
  ticks(ylo, yhi, 6).forEach(v => s += `<line x1="${P.L}" x2="${W - P.R}" y1="${sy(v)}" y2="${sy(v)}" stroke="var(--grid)"/><text x="${P.L - 8}" y="${sy(v) + 4}" text-anchor="end">${fmt(v, v % 1 ? 1 : 0)}</text>`);
  s += `<text x="${W - P.R}" y="${H - 6}" text-anchor="end">Körpergröße in cm</text><text x="14" y="${(P.T + H - P.B) / 2}" transform="rotate(-90 14 ${(P.T + H - P.B) / 2})" text-anchor="middle">FEV in Litern</text>`;
  return { sx, sy, s, clip: `clip-path="url(#cp${W}${H}${xlo})"`, P, W, H };
}

/* ---------- 1 Wozu eine Gerade ---------- */
const BINS = (() => { const g = {}; R.forEach(r => { const b = Math.floor(r[2] / 10) * 10; (g[b] = g[b] || []).push(r[1]); }); return Object.keys(g).map(Number).sort((a, b) => a - b).map(b => ({ lo: b, hi: b + 10, m: mean(g[b]), n: g[b].length })); })();
const binOf = x => BINS.find(b => x >= b.lo && x < b.hi) || BINS[BINS.length - 1];
const MODELS = {
  mean: { f: () => FULL.mean, k: 1 },
  bins: { f: x => binOf(x).m, k: BINS.length },
  line: { f: x => B0 + B1 * x, k: 2 }
};
let mode = "mean";
const SQB = R.reduce((a, r) => a + (r[1] - binOf(r[2]).m) ** 2, 0);
function draw1() {
  const f = frame(900, 420, 105, 195, 0, 6), M = MODELS[mode];
  let s = f.s;
  R.forEach(r => s += `<circle cx="${f.sx(r[2])}" cy="${f.sy(r[1])}" r="2.8" fill="var(--pal-3)" fill-opacity=".6"/>`);
  if (mode === "mean") s += `<line x1="${f.sx(105)}" x2="${f.sx(195)}" y1="${f.sy(FULL.mean)}" y2="${f.sy(FULL.mean)}" stroke="var(--therapie)" stroke-width="3"/>`;
  if (mode === "bins") BINS.forEach(b => s += `<line x1="${f.sx(b.lo)}" x2="${f.sx(b.hi)}" y1="${f.sy(b.m)}" y2="${f.sy(b.m)}" stroke="var(--therapie)" stroke-width="3"/><text x="${f.sx(b.lo + 5)}" y="${f.sy(b.m) - 8}" text-anchor="middle" class="strong">n=${b.n}</text>`);
  if (mode === "line") s += `<line ${f.clip} x1="${f.sx(105)}" x2="${f.sx(195)}" y1="${f.sy(B0 + B1 * 105)}" y2="${f.sy(B0 + B1 * 195)}" stroke="var(--therapie)" stroke-width="3"/>`;
  const pred = M.f(GIRL.x);
  s += `<line x1="${f.sx(GIRL.x)}" x2="${f.sx(GIRL.x)}" y1="${f.sy(GIRL.y)}" y2="${f.sy(pred)}" stroke="var(--alpha-ink)" stroke-width="2" stroke-dasharray="4 3"/>`;
  s += `<circle cx="${f.sx(GIRL.x)}" cy="${f.sy(pred)}" r="6" fill="var(--surface)" stroke="var(--therapie)" stroke-width="3"/><circle cx="${f.sx(GIRL.x)}" cy="${f.sy(GIRL.y)}" r="7" fill="var(--alpha-ink)"/>`;
  s += `<text x="${f.sx(GIRL.x) + 12}" y="${f.sy(pred) - 10}" class="strong">Sollwert ${fmt(pred)} l</text>`;
  $("m1").innerHTML = s;
  let sq = 0; R.forEach(r => sq += (r[1] - M.f(r[2])) ** 2);
  $("m1-r").innerHTML = readout("Sollwert für 150 cm", fmt(pred) + " l", "r-decision") + readout("das Mädchen erreicht", Math.round(GIRL.y / pred * 100) + " % vom Soll") + readout("Zahlen im Modell", String(M.k)) + readout("Fehlerquadratsumme", fmt(sq, 0));
  $("m1-c").innerHTML = {
    mean: `Ein Mittelwert für alle (${fmt(FULL.mean)} l) ignoriert die Größe völlig. Für das 150 cm große Mädchen wäre der Sollwert zu hoch, für einen 180 cm großen Jugendlichen viel zu niedrig. Die Fehler sind riesig: Quadratsumme ${fmt(sq, 0)}.`,
    bins: `Eigene Mittelwerte je 10-cm-Gruppe treffen den Trend schon gut. Aber das Modell braucht ${BINS.length} Zahlen, springt an den Gruppengrenzen (149 cm und 151 cm bekommen ganz verschiedene Sollwerte) und wird an den Rändern unsicher, wo nur wenige Kinder sind.`,
    line: `Die Gerade beschreibt den Trend mit nur zwei Zahlen: einem Startwert und einem Anstieg pro Zentimeter. Sie ist fast genauso gut wie die ${BINS.length} Gruppenmittel (Quadratsumme ${fmt(sq, 0)} statt ${fmt(SQB, 0)}), springt nicht und liefert für jede Größe einen Wert. Das Mädchen erreicht ${Math.round(GIRL.y / pred * 100)} % des Sollwerts. Mit dem Mittelwert für alle waren es nur ${Math.round(GIRL.y / FULL.mean * 100)} %: Ein zu grobes Modell hätte ein gesundes, eher kleines Kind als auffällig eingestuft.`
  }[mode];
}
$("mode").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; mode = b.dataset.m; $("mode").querySelectorAll("button").forEach(z => z.setAttribute("aria-pressed", z === b)); draw1(); });

/* ---------- 2 Kleinste Quadrate ---------- */
let seed = 4, sub = [], best = null, view = "sq";
function pick(sd) { const r = mulberry32(sd), idx = new Set(); while (idx.size < 25) idx.add(Math.floor(r() * R.length)); sub = [...idx].map(i => ({ x: R[i][2], y: R[i][1] })); const m = ols(sub.map(p => p.y), [sub.map(p => p.x)]); best = { b0: m.b[0], b1: m.b[1], sq: m.sqR, sqT: m.sqT, my: m.mean, mx: mean(sub.map(p => p.x)) }; }
function line2() { const h = +$("h150").value, k = +$("slope").value / 10; return { b1: k, b0: h - k * 150 }; }
function draw2() {
  const f = frame(900, 420, 110, 190, 0, 5.5), L = line2();
  $("h150-v").textContent = fmt(+$("h150").value) + " l"; $("slope-v").textContent = fmt(+$("slope").value) + " l";
  let s = f.s, sq = 0;
  const res = sub.map(p => { const yh = L.b0 + L.b1 * p.x, e = p.y - yh; sq += e * e; return { p, yh, e }; });
  if (view === "sq") res.forEach(({ p, yh, e }) => { const side = Math.abs(f.sy(p.y) - f.sy(yh)); s += `<rect ${f.clip} x="${f.sx(p.x) - (e > 0 ? side : 0)}" y="${Math.min(f.sy(p.y), f.sy(yh))}" width="${side}" height="${side}" fill="${e > 0 ? "var(--therapie)" : "var(--kontrolle)"}" fill-opacity=".13" stroke="${e > 0 ? "var(--therapie)" : "var(--kontrolle)"}" stroke-opacity=".4"/>`; });
  res.forEach(({ p, yh }) => s += `<line x1="${f.sx(p.x)}" x2="${f.sx(p.x)}" y1="${f.sy(p.y)}" y2="${f.sy(yh)}" stroke="var(--alpha-ink)" stroke-width="1.6"/>`);
  if (Math.abs(L.b1 - best.b1) > 1e-4 || Math.abs(L.b0 - best.b0) > 1e-3) s += `<line ${f.clip} x1="${f.sx(110)}" x2="${f.sx(190)}" y1="${f.sy(best.b0 + best.b1 * 110)}" y2="${f.sy(best.b0 + best.b1 * 190)}" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="5 5" opacity="${showGhost ? .8 : 0}"/>`;
  s += `<line ${f.clip} x1="${f.sx(110)}" x2="${f.sx(190)}" y1="${f.sy(L.b0 + L.b1 * 110)}" y2="${f.sy(L.b0 + L.b1 * 190)}" stroke="var(--therapie)" stroke-width="3"/>`;
  s += `<circle cx="${f.sx(150)}" cy="${f.sy(L.b0 + L.b1 * 150)}" r="5" fill="var(--therapie)"/>`;
  sub.forEach(p => s += `<circle cx="${f.sx(p.x)}" cy="${f.sy(p.y)}" r="5.5" fill="var(--fg)"/>`);
  $("ls").innerHTML = s;
  const mx = Math.max(sq, best.sqT), bar = (lab, v, col) => `<div class="row"><span>${lab}</span><span class="bar"><i style="width:${Math.min(100, v / mx * 100)}%;background:${col}"></i></span><span class="val">${fmt(v, 2)}</span></div>`;
  $("meter").innerHTML = bar("Ihre Gerade", sq, "var(--therapie)") + bar("waagerecht beim Mittelwert", best.sqT, "var(--pal-3)") + bar("beste Gerade (Minimum)", best.sq, "var(--kontrolle)");
  const rel = sq / best.sq;
  $("ls-c").innerHTML = rel < 1.005 ? `<b>Getroffen.</b> Kleiner wird die Quadratsumme nicht. Diese Gerade läuft durch den Schwerpunkt (x̄ = ${fmt(best.mx, 1)} cm, ȳ = ${fmt(best.my)} l): Positive und negative Residuen gleichen sich genau aus.`
    : `Ihre Quadratsumme ist ${fmt(rel, 1)}-mal so groß wie das Minimum. ${L.b1 < best.b1 * 0.7 ? "Die Gerade ist zu flach." : L.b1 > best.b1 * 1.3 ? "Die Gerade ist zu steil." : "Die Steigung passt ungefähr, jetzt die Höhe anpassen."} Warum Quadrate und nicht einfach Abstände? Große Fehler werden stärker bestraft, und es gibt genau eine beste Lösung, die man mit einer Formel ausrechnen kann.`;
  $("ls-f").innerHTML = TB(String.raw`SQ_{\text{Rest}} = \sum_{i=1}^{n} \bigl(y_i - \hat{y}_i\bigr)^2 = ${tz(fmt(sq, 2))} \qquad \text{Minimum: } ${tz(fmt(best.sq, 2))}`, `<span>SQ = ${fmt(sq, 2)}</span>`) +
    TB(String.raw`b_1 = \dfrac{\text{cov}(x, y)}{s_x^2} = ${tz(fmt(best.b1 * 10, 3))}\ \text{l pro 10 cm} \qquad b_0 = \bar{y} - b_1 \bar{x}`, "");
}
let showGhost = false;
function setBest() { $("h150").value = (best.b0 + best.b1 * 150).toFixed(2); $("slope").value = (best.b1 * 10).toFixed(2); showGhost = true; draw2(); }
$("best").onclick = setBest;
$("new25").onclick = () => { seed++; pick(seed); showGhost = false; $("h150").value = 3.2; $("slope").value = 0.15; draw2(); };
["h150", "slope"].forEach(id => $(id).addEventListener("input", draw2));
$("view").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; view = b.dataset.v; $("view").querySelectorAll("button").forEach(z => z.setAttribute("aria-pressed", z === b)); draw2(); });

/* ---------- 3 Gerade lesen ---------- */
function draw3() {
  $("eq").innerHTML = TB(String.raw`\widehat{\text{FEV}} = b_0 + b_1 \cdot \text{Größe} = ${tz(fmt(B0, 2))} + ${tz(fmt(B1, 4))} \cdot \text{Größe}`, `<span class="big">FEV = ${fmt(B0, 2)} + ${fmt(B1, 4)} · Größe</span>`);
  $("b1-txt").innerHTML = `Pro Zentimeter mehr Körpergröße liegt die FEV im Mittel um ${fmt(B1, 3)} l höher, pro 10 cm also um gut ${fmt(B1 * 10, 2)} l. Das ist die eigentliche Aussage des Modells.`;
  $("b0-txt").innerHTML = `${fmt(B0, 2)} l wäre die FEV bei 0 cm Größe. Das ist sinnlos: Der Achsenabschnitt ist hier nur ein Rechenwert, damit die Gerade an der richtigen Höhe liegt. In Abschnitt 4 machen wir ihn lesbar.`;
  const x = +$("px").value, y = +$("py").value, yh = B0 + B1 * x, inside = x >= 117 && x <= 189;
  $("px-v").textContent = x + " cm"; $("py-v").textContent = fmt(y) + " l";
  const f = frame(900, 360, 85, 205, -1, 6);
  let s = f.s;
  s += `<rect x="${f.sx(85)}" y="${f.P.T}" width="${f.sx(117) - f.sx(85)}" height="${360 - f.P.T - f.P.B}" fill="var(--highlight)"/><rect x="${f.sx(189)}" y="${f.P.T}" width="${f.sx(205) - f.sx(189)}" height="${360 - f.P.T - f.P.B}" fill="var(--highlight)"/>`;
  s += `<text x="${f.sx(101)}" y="${f.P.T + 14}" text-anchor="middle">keine Daten</text><text x="${900 - f.P.R - 4}" y="${f.P.T + 14}" text-anchor="end">keine Daten</text>`;
  s += `<line x1="${f.P.L}" x2="${900 - f.P.R}" y1="${f.sy(0)}" y2="${f.sy(0)}" stroke="var(--muted)"/>`;
  R.forEach(r => s += `<circle cx="${f.sx(r[2])}" cy="${f.sy(r[1])}" r="2.4" fill="var(--pal-3)" fill-opacity=".5"/>`);
  s += `<line x1="${f.sx(85)}" x2="${f.sx(117)}" y1="${f.sy(B0 + B1 * 85)}" y2="${f.sy(B0 + B1 * 117)}" stroke="var(--therapie)" stroke-width="2.5" stroke-dasharray="6 5"/><line x1="${f.sx(117)}" x2="${f.sx(189)}" y1="${f.sy(B0 + B1 * 117)}" y2="${f.sy(B0 + B1 * 189)}" stroke="var(--therapie)" stroke-width="3"/><line x1="${f.sx(189)}" x2="${f.sx(205)}" y1="${f.sy(B0 + B1 * 189)}" y2="${f.sy(B0 + B1 * 205)}" stroke="var(--therapie)" stroke-width="2.5" stroke-dasharray="6 5"/>`;
  s += `<line x1="${f.sx(x)}" x2="${f.sx(x)}" y1="${f.sy(y)}" y2="${f.sy(yh)}" stroke="var(--alpha-ink)" stroke-width="2" stroke-dasharray="4 3"/><circle cx="${f.sx(x)}" cy="${f.sy(yh)}" r="6" fill="var(--surface)" stroke="var(--therapie)" stroke-width="3"/><circle cx="${f.sx(x)}" cy="${f.sy(y)}" r="7" fill="var(--alpha-ink)"/>`;
  $("pred").innerHTML = s;
  const pct = y / yh * 100;
  $("pred-f").innerHTML = TB(String.raw`\hat{y} = ${tz(fmt(B0, 2))} + ${tz(fmt(B1, 4))} \cdot ${x} = ${tz(fmt(yh, 2))}\ \text{l} \qquad \text{gemessen: } \dfrac{${tz(fmt(y, 2))}}{${tz(fmt(yh, 2))}} = ${yh > 0 ? tz(fmt(pct, 0)) + "\\,\\%" : "\\text{nicht sinnvoll}"}\ \text{vom Soll}`, `<span>Sollwert ${fmt(yh)} l</span>`);
  $("pred-c").innerHTML = !inside
    ? `<b>Vorsicht, Extrapolation.</b> ${x} cm liegt außerhalb der Daten (117 bis 189 cm). Die Gerade rechnet stur weiter${yh < 0.5 ? " und landet sogar bei einer unmöglich kleinen oder negativen FEV" : ""}. Ob der Zusammenhang dort noch linear ist, wissen wir nicht.`
    : yh <= 0 ? "" : `Sollwert für ${x} cm: ${fmt(yh)} l. Gemessen sind ${fmt(y)} l, also ${fmt(pct, 0)} % vom Soll. ${pct < 80 ? "Klassisch gelten Werte unter 80 % des Solls als auffällig. Heute nutzt man dafür eher die untere Normgrenze aus der Streuung um die Gerade, mehr dazu in <a href=\"../normbereich/#acc-4\">Wie sicher ist der Sollwert?</a>." : "Das liegt im üblichen Bereich."} Das Residuum ist ${fmt(y - yh)} l.`;
}
["px", "py"].forEach(id => $(id).addEventListener("input", draw3));

/* ---------- 4 Zentrieren und Skalieren ---------- */
const MX = mean(X), SDX = Math.sqrt(X.reduce((a, v) => a + (v - MX) ** 2, 0) / (X.length - 1)), SDY = Math.sqrt(Y.reduce((a, v) => a + (v - FULL.mean) ** 2, 0) / (Y.length - 1));
let kSel = "1";
const kVal = () => kSel === "sd" ? SDX : +kSel;
const seB0 = c => FULL.s * Math.sqrt(1 / X.length + (c - MX) ** 2 / X.reduce((a, v) => a + (v - MX) ** 2, 0));
function draw4() {
  const raw = +$("cc").value, isMean = Math.abs(raw - MX) < 0.6, c = isMean ? MX : raw, k = kVal(), b0s = B0 + B1 * c, b1s = B1 * k;
  $("cc-v").textContent = (isMean ? fmt(MX, 1) : c) + " cm";
  $("kk-v").textContent = kSel === "sd" ? `1 SD = ${fmt(SDX, 1)} cm` : `${k} cm`;
  $("cc-pre").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.c === "mean" ? isMean : +b.dataset.c === raw && !isMean));
  const cT = isMean ? String.raw`\bar{x} = ${tz(fmt(MX, 1))}` : String(c), kT = kSel === "sd" ? String.raw`s_x = ${tz(fmt(SDX, 1))}` : String(k);
  $("cs-def").innerHTML = (raw === 0 && kSel === "1") ? TB(String.raw`x^{*} = \dfrac{\text{Größe} - 0}{1} = \text{Größe}\quad\text{(roh)}`, "<span>x* = Größe</span>") + `<span class="dim">c verschiebt den Nullpunkt (Zentrieren), k legt fest, was „eine Einheit mehr“ bedeutet (Skalieren).</span>` : TB(String.raw`x^{*} = \dfrac{\text{Größe} - c}{k} = \dfrac{\text{Größe} - ${isMean ? tz(fmt(MX, 1)) : c}}{${kSel === "sd" ? tz(fmt(SDX, 1)) : k}}`, `<span>x* = (Größe − c) / k</span>`) +
    `<span class="dim">c verschiebt den Nullpunkt (Zentrieren), k legt fest, was „eine Einheit mehr“ bedeutet (Skalieren).</span>`;
  // chart
  const W = 900, H = 440, P = { L: 60, R: 16, T: 14, B: 78 }, f = frame(W, H, 105, 195, 0, 6, P);
  let s = f.s.replace(/<text x="[^"]*" y="[^"]*" text-anchor="end">Körpergröße in cm<\/text>/, "");
  s += `<text x="${P.L - 8}" y="${H - P.B + 18}" text-anchor="end">cm</text><text x="${P.L - 8}" y="${H - P.B + 42}" text-anchor="end" class="xs">x*</text>`;
  const pxPer = (W - P.L - P.R) / 90, mult = [1, 2, 5, 10, 20, 50, 100, 200].find(m => m * k * pxPer >= 46);
  const jlo = Math.ceil((105 - c) / (k * mult)), jhi = Math.floor((195 - c) / (k * mult));
  for (let j = jlo; j <= jhi; j++) { const v = j * mult, xx = c + v * k; s += `<line x1="${f.sx(xx)}" x2="${f.sx(xx)}" y1="${H - P.B + 24}" y2="${H - P.B + 29}" stroke="var(--accent)"/><text x="${f.sx(xx)}" y="${H - P.B + 42}" text-anchor="middle" class="xs">${fmt(v, 0)}</text>`; }
  s += `<line x1="${P.L}" x2="${W - P.R}" y1="${H - P.B + 24}" y2="${H - P.B + 24}" stroke="var(--accent)" stroke-opacity=".5"/>`;
  R.forEach(r => s += `<circle cx="${f.sx(r[2])}" cy="${f.sy(r[1])}" r="2.4" fill="var(--pal-3)" fill-opacity=".45"/>`);
  s += `<line ${f.clip} x1="${f.sx(105)}" x2="${f.sx(195)}" y1="${f.sy(B0 + B1 * 105)}" y2="${f.sy(B0 + B1 * 195)}" stroke="var(--therapie)" stroke-width="3"/>`;
  const inView = c >= 105 && c <= 195;
  if (inView) {
    s += `<line x1="${f.sx(c)}" x2="${f.sx(c)}" y1="${P.T}" y2="${H - P.B + 24}" stroke="var(--accent)" stroke-width="1.6" stroke-dasharray="5 4"/>`;
    s += `<line x1="${P.L}" x2="${f.sx(c)}" y1="${f.sy(b0s)}" y2="${f.sy(b0s)}" stroke="var(--accent)" stroke-width="1.4" stroke-dasharray="3 3"/>`;
    s += `<circle cx="${f.sx(c)}" cy="${f.sy(b0s)}" r="7" fill="var(--accent)"/><text x="${f.sx(c) - 12}" y="${f.sy(b0s) - 12}" text-anchor="end" class="strong" style="fill:var(--accent)">b₀* = ${fmt(b0s)} l</text>`;
  } else {
    s += `<text x="${P.L + 10}" y="${P.T + 18}" class="strong" style="fill:var(--accent)">← x* = 0 liegt bei ${c} cm, weit außerhalb der Daten</text>`;
  }
  // Steigungsdreieck
  let t0 = inView && c + k <= 192 ? c : (c - k >= 108 && inView ? c - k : 165 - k / 2);
  const ya = B0 + B1 * t0, yb = B0 + B1 * (t0 + k);
  s += `<path d="M${f.sx(t0)},${f.sy(ya)} H${f.sx(t0 + k)} V${f.sy(yb)}" fill="none" stroke="var(--fg)" stroke-width="2"/>`;
  const kLab = kSel === "sd" ? "1 SD" : k + " cm", bLab = "+" + fmt(b1s, kSel === "1" ? 3 : 2) + " l";
  s += (f.sx(t0 + k) - f.sx(t0) < 60)
    ? `<line x1="${f.sx(t0 + k) + 4}" x2="${f.sx(t0 + k) + 34}" y1="${f.sy(ya) + 2}" y2="${f.sy(ya) + 30}" stroke="var(--fg)"/><text x="${f.sx(t0 + k) + 38}" y="${f.sy(ya) + 42}" class="strong">+${kLab} → ${bLab}</text>`
    : `<text x="${(f.sx(t0) + f.sx(t0 + k)) / 2}" y="${f.sy(ya) + 18}" text-anchor="middle">+1 Einheit (${kLab})</text><text x="${f.sx(t0 + k) + 8}" y="${(f.sy(ya) + f.sy(yb)) / 2 + 4}" class="strong">${bLab}</text>`;
  $("cs").innerHTML = s;
  // Gleichung
  const varT = String.raw`\dfrac{\text{Größe} - ${isMean ? tz(fmt(MX, 1)) : c}}{${kSel === "sd" ? tz(fmt(SDX, 1)) : k}}`;
  const plain = raw === 0 && kSel === "1";
  $("cs-eq").innerHTML = TB(String.raw`\widehat{\text{FEV}} = ${tz(fmt(b0s, 2))} + ${tz(fmt(b1s, kSel === "1" ? 4 : 3))} \cdot ${plain ? String.raw`\text{Größe}` : String.raw`x^{*}`}`, `<span class="big">FEV = ${fmt(b0s)} + ${fmt(b1s, 3)} · x*</span>`) +
    (plain ? "" : `<span class="dim">ausgeschrieben, mit der Größe in cm:</span>` + TB(String.raw`\widehat{\text{FEV}} = ${tz(fmt(b0s, 2))} + ${tz(fmt(b1s, kSel === "1" ? 4 : 3))} \cdot ${varT}`, ""));
  const yG = b0s + b1s * (150 - c) / k;
  $("cs-r").innerHTML = readout("b₀*", fmt(b0s) + " l", "r-decision") + readout("b₁*", fmt(b1s, 3) + " l") + readout("R²", fmt(FULL.r2, 3)) + readout("Sollwert für 150 cm", fmt(yG) + " l");
  const unit = kSel === "sd" ? `eine Standardabweichung (${fmt(SDX, 1)} cm)` : k === 1 ? "einen Zentimeter" : `${k} cm`;
  const where = isMean ? `durchschnittlich großes Kind (${fmt(MX, 1)} cm)` : `Kind mit ${c} cm`;
  $("cs-b0").innerHTML = raw === 0 ? `Vorhergesagte FEV bei 0 cm Größe: ${fmt(b0s)} l. Inhaltlich sinnlos, weil x = 0 weit außerhalb der Daten liegt.`
    : !inView ? `Vorhergesagte FEV bei ${c} cm. Auch das liegt außerhalb der Daten (117 bis 189 cm) und ist eine Extrapolation.`
    : `Ein ${where} hat im Mittel eine FEV von ${fmt(b0s)} l.${isMean ? " Beim Mittelwert ist b₀* genau ȳ: Die Gerade läuft durch den Schwerpunkt." : c === 150 ? " Das ist direkt der Sollwert für unser Mädchen." : ""}`;
  $("cs-b1").innerHTML = `Pro ${unit} mehr Körpergröße liegt die FEV im Mittel um ${fmt(b1s, kSel === "1" ? 3 : 2)} l höher.${kSel === "1" ? " Korrekt, aber eine sehr kleine Zahl, die man schlecht greifen kann." : kSel === "sd" ? " Das macht Variablen mit verschiedenen Einheiten vergleichbar." : ""}`;
  $("cs-c").innerHTML = `Die Gerade im Bild bewegt sich nicht, egal was Sie einstellen. Es ändert sich nur die Beschriftung der x-Achse und damit die Bedeutung der beiden Zahlen. Faustregel: Zentrieren Sie auf einen Wert, der in den Daten vorkommt und inhaltlich etwas bedeutet. Skalieren Sie so, dass „eine Einheit mehr“ ein Unterschied ist, der in der Praxis zählt.`;
  $("se0").textContent = fmt(seB0(0), 3); $("se150").textContent = fmt(seB0(150), 3); $("r-std").textContent = fmt(B1 * SDX / SDY, 3);
}
$("cc").addEventListener("input", draw4);
$("cc-pre").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; $("cc").value = b.dataset.c === "mean" ? MX : b.dataset.c; draw4(); });
$("kk").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; kSel = b.dataset.k; $("kk").querySelectorAll("button").forEach(z => z.setAttribute("aria-pressed", z === b)); draw4(); });

draw1(); pick(seed); draw2(); draw3(); draw4();
})();
