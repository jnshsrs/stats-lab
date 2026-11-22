/* Wie sicher ist der Sollwert? · Stats Lab
   Station „Wie sicher ist der Sollwert?“: Stichprobenverteilung der Steigung, t-Test und KI für b1, Konfidenz- und Vorhersageband, untere Normgrenze. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const fmt = (x, d = 2) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");
const tz = x => String(x).replace(/\./g, "{.}").replace(/,/g, "{,}").replace(/−/g, "-");
const readout = (l, v, cls = "") => `<div class="readout ${cls}"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;
const TB = (t, fb) => window.katex ? texBlock(t) : fb;
const fp = p => p < 0.001 ? "< 0,001" : fmt(p, 3);
const { ols, mean, tinv } = window.REG;
const R = window.FEV.rows, X = R.map(r => r[2]), Y = R.map(r => r[1]), N = X.length;
const MX = mean(X), SXX = X.reduce((a, v) => a + (v - MX) ** 2, 0), SDX = Math.sqrt(SXX / (N - 1));
const FULL = ols(Y, [X]), B0 = FULL.b[0], B1 = FULL.b[1];
const LOG = ols(Y.map(Math.log), [X]);
const Z05 = 1.6449;
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
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
const linePath = (f, fn, lo, hi, step = 1) => { let d = ""; for (let x = lo; x <= hi + 1e-9; x += step) d += (d ? "L" : "M") + f.sx(x).toFixed(1) + "," + f.sy(fn(x)).toFixed(1); return d; };
const bandPath = (f, lo, hi, up, dn, step = 1) => { let a = [], b = []; for (let x = lo; x <= hi + 1e-9; x += step) { a.push(f.sx(x).toFixed(1) + "," + f.sy(up(x)).toFixed(1)); b.unshift(f.sx(x).toFixed(1) + "," + f.sy(dn(x)).toFixed(1)); } return "M" + a.join("L") + "L" + b.join("L") + "Z"; };

/* ---------- Population, H0-Variante ---------- */
const YH0 = (() => { const r = mulberry32(99), a = Y.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; })();
const POP = { real: { y: Y, m: FULL }, h0: { y: YH0, m: ols(YH0, [X]) } };
let dmode = "real", nS = 30, rng = mulberry32(7), hist = [], cur = null;
function fitSample(idx, ys) {
  const xs = idx.map(i => X[i]), yv = idx.map(i => ys[i]), m = ols(yv, [xs]), mx = mean(xs), sxx = xs.reduce((a, v) => a + (v - mx) ** 2, 0);
  return { idx, xs, yv, m, b0: m.b[0], b1: m.b[1], se1: m.se[1], p: m.p[1], t: m.t[1], df: m.df, mx, sxx, s: m.s, n: xs.length };
}
function draw() { const s = new Set(); while (s.size < nS) s.add(Math.floor(rng() * N)); return fitSample([...s], POP[dmode].y); }
function addSamples(k) { for (let i = 0; i < k; i++) { cur = draw(); hist.push(cur); } if (hist.length > 2000) hist = hist.slice(-2000); }
const seTheo = () => POP[dmode].m.s / (SDX * Math.sqrt(nS - 1));

/* ---------- 1 Stichprobenverteilung ---------- */
function draw1() {
  $("n-v").textContent = nS;
  const pop = POP[dmode], pb0 = pop.m.b[0], pb1 = pop.m.b[1];
  // links: Geraden
  const f = frame(520, 400, 110, 190, 0, 6, { P: { L: 48, R: 10, T: 12, B: 44 }, nx: 4 });
  let s = f.s;
  X.forEach((x, i) => s += `<circle cx="${f.sx(x).toFixed(1)}" cy="${f.sy(pop.y[i]).toFixed(1)}" r="1.8" fill="var(--pal-3)" fill-opacity=".25"/>`);
  hist.slice(-100).forEach(h => { if (h !== cur) s += `<line ${f.clip} x1="${f.sx(110)}" x2="${f.sx(190)}" y1="${f.sy(h.b0 + h.b1 * 110)}" y2="${f.sy(h.b0 + h.b1 * 190)}" stroke="var(--therapie)" stroke-opacity=".14" stroke-width="1.4"/>`; });
  s += `<line ${f.clip} x1="${f.sx(110)}" x2="${f.sx(190)}" y1="${f.sy(pb0 + pb1 * 110)}" y2="${f.sy(pb0 + pb1 * 190)}" stroke="var(--fg)" stroke-width="2" stroke-dasharray="6 4"/>`;
  cur.xs.forEach((x, i) => s += `<circle cx="${f.sx(x)}" cy="${f.sy(cur.yv[i])}" r="4" fill="var(--fg)"/>`);
  s += `<line ${f.clip} x1="${f.sx(110)}" x2="${f.sx(190)}" y1="${f.sy(cur.b0 + cur.b1 * 110)}" y2="${f.sy(cur.b0 + cur.b1 * 190)}" stroke="var(--therapie)" stroke-width="3"/>`;
  $("s1").innerHTML = s;
  // rechts: Histogramm der Steigungen (pro 10 cm)
  const c = pb1 * 10, se = seTheo() * 10, lo = c - 4.2 * se, hi = c + 4.2 * se, nb = 28, bw = (hi - lo) / nb, cnt = new Array(nb).fill(0);
  hist.forEach(h => { const k = Math.floor((h.b1 * 10 - lo) / bw); if (k >= 0 && k < nb) cnt[k]++; });
  const K = hist.length, peak = K * bw / (se * Math.sqrt(2 * Math.PI)), ymax = Math.max(1, ...cnt, peak) * 1.15;
  const d = se < 0.02 ? 3 : 2;
  const g = frame(520, 400, lo, hi, 0, ymax, { P: { L: 16, R: 10, T: 12, B: 44 }, nx: 5, ny: 0, yl: "", xl: "Steigung b₁ in l pro 10 cm", fx: v => fmt(v, d) });
  let t = g.s;
  cnt.forEach((v, k) => { if (v) t += `<rect x="${g.sx(lo + k * bw) + .5}" y="${g.sy(v)}" width="${g.sx(lo + bw) - g.sx(lo) - 1}" height="${g.sy(0) - g.sy(v)}" fill="var(--therapie)" fill-opacity=".55"/>`; });
  if (K >= 2) { let dd = ""; for (let i = 0; i <= 120; i++) { const v = lo + (hi - lo) * i / 120, y = K * bw * Math.exp(-0.5 * ((v - c) / se) ** 2) / (se * Math.sqrt(2 * Math.PI)); dd += (i ? "L" : "M") + g.sx(v).toFixed(1) + "," + g.sy(y).toFixed(1); } t += `<path d="${dd}" fill="none" stroke="var(--fg)" stroke-width="1.6"/>`; }
  t += `<line x1="${g.sx(c)}" x2="${g.sx(c)}" y1="${g.P.T}" y2="${g.sy(0)}" stroke="var(--fg)" stroke-width="2" stroke-dasharray="6 4"/><text x="${g.sx(c) + 6}" y="${g.P.T + 14}" class="strong">Population ${fmt(Math.abs(c) < 0.5 * 10 ** -d ? 0 : c, d)}</text>`;
  const cb = Math.min(hi, Math.max(lo, cur.b1 * 10));
  t += `<line x1="${g.sx(cb)}" x2="${g.sx(cb)}" y1="${g.P.T + 22}" y2="${g.sy(0)}" stroke="var(--therapie)" stroke-width="2.5"/><circle cx="${g.sx(cb)}" cy="${g.P.T + 22}" r="5" fill="var(--therapie)"/>`;
  $("h1").innerHTML = t;
  const sdSim = K >= 5 ? Math.sqrt(hist.reduce((a, h) => a + (h.b1 * 10 - mean(hist.map(z => z.b1 * 10))) ** 2, 0) / (K - 1)) : null;
  $("s1-r").innerHTML = readout("b₁ dieser Stichprobe, pro 10 cm", fmt(cur.b1 * 10, d) + " l", "r-decision") + readout("SE(b₁) aus der Formel", fmt(cur.se1 * 10, 3) + " l") + readout("SD der simulierten b₁", sdSim == null ? "–" : fmt(sdSim, 3) + " l") + readout("Stichproben", String(K));
  $("s1-f").innerHTML = TB(String.raw`\begin{aligned} \mathrm{SE}(b_1) &= \dfrac{s}{\sqrt{\sum (x_i - \bar{x})^2}} = \dfrac{${tz(fmt(cur.s, 3))}}{\sqrt{${Math.round(cur.sxx)}}} \\ &= ${tz(fmt(cur.se1, 4))}\ \text{l pro cm} \\ &= ${tz(fmt(cur.se1 * 10, 3))}\ \text{l pro 10 cm} \end{aligned}`, `<span>SE(b₁) = ${fmt(cur.se1 * 10, 3)} l pro 10 cm</span>`) +
    `<span class="dim">s ist die Streuung der Punkte um die Gerade. Je mehr Kinder und je breiter ihre Größen streuen, desto größer wird die Summe im Nenner und desto genauer die Steigung.</span>`;
  $("s1-c").innerHTML = K < 20
    ? `Jede Stichprobe ergibt eine eigene Gerade. Klicken Sie auf „100 Stichproben“, dann entsteht rechts die Stichprobenverteilung der Steigung.`
    : dmode === "real"
      ? `Die ${K} Steigungen streuen glockenförmig um die wahre Steigung der Population (${fmt(c, d)} l pro 10 cm). Ihre Standardabweichung (${fmt(sdSim, 3)} l) ist genau das, was die Formel aus einer einzigen Stichprobe schätzt: der Standardfehler. Wie beim Mittelwert gilt: Vierfaches n, halber Standardfehler.`
      : `Hier hat die Größe nichts mit der FEV zu tun, die wahre Steigung ist praktisch null. Trotzdem liefert jede Stichprobe eine Steigung ungleich null. Genau diese Zufallsschwankung muss ein Test von einem echten Zusammenhang unterscheiden.`;
}

/* ---------- 2 t-Test und KI ---------- */
function draw2() {
  const tc = tinv(0.975, cur.df), lo = (cur.b1 - tc * cur.se1) * 10, hi = (cur.b1 + tc * cur.se1) * 10, b = cur.b1 * 10, pv = POP[dmode].m.b[1] * 10, d = seTheo() * 10 < 0.02 ? 3 : 2;
  $("t-f").innerHTML = TB(String.raw`\begin{aligned} t &= \dfrac{b_1 - 0}{\mathrm{SE}(b_1)} = \dfrac{${tz(fmt(cur.b1, 4))}}{${tz(fmt(cur.se1, 4))}} = ${tz(fmt(cur.t, 2))} \\ df &= n - 2 = ${cur.df}, \quad p ${cur.p < 0.001 ? "< 0{,}001" : "= " + tz(fmt(cur.p, 3))} \\ \mathrm{KI}_{95\,\%} &= b_1 \pm t_{0{,}975;\,${cur.df}} \cdot \mathrm{SE}(b_1) \\ &= ${tz(fmt(b, d))} \pm ${tz(fmt(tc, 3))} \cdot ${tz(fmt(cur.se1 * 10, 3))} \\ &= [${tz(fmt(lo, d))};\ ${tz(fmt(hi, d))}]\ \text{l pro 10 cm} \end{aligned}`, `<span>t = ${fmt(cur.t, 2)}, p ${fp(cur.p)}</span>`) +
    `<span class="dim">Warum df = n − 2? Für die Gerade schätzen wir zwei Zahlen, b₀ und b₁. Beim Einstichproben-t-Test war es eine, der Mittelwert.</span>`;
  const span = Math.max(hi, pv, 0) - Math.min(lo, pv, 0), xlo = Math.min(lo, pv, 0) - span * 0.15, xhi = Math.max(hi, pv, 0) + span * 0.15;
  const f = frame(900, 170, xlo, xhi, 0, 1, { P: { L: 20, R: 20, T: 10, B: 46 }, ny: 0, yl: "", xl: "Steigung in l pro 10 cm", fx: v => fmt(v, d), nx: 8 });
  const sig = cur.p < 0.05, col = sig ? "var(--therapie)" : "var(--muted)", y = f.sy(0.5);
  let s = f.s;
  s += `<line x1="${f.sx(0)}" x2="${f.sx(0)}" y1="${f.P.T}" y2="${f.sy(0)}" stroke="var(--alpha-ink)" stroke-width="2"/><text x="${f.sx(0) + 6}" y="${f.P.T + 14}" style="fill:var(--alpha-ink)" class="strong">H₀: β₁ = 0</text>`;
  s += `<line x1="${f.sx(pv)}" x2="${f.sx(pv)}" y1="${f.P.T + 24}" y2="${f.sy(0)}" stroke="var(--fg)" stroke-width="1.6" stroke-dasharray="5 4"/>`;
  s += `<line x1="${f.sx(lo)}" x2="${f.sx(hi)}" y1="${y}" y2="${y}" stroke="${col}" stroke-width="6" stroke-linecap="round"/><circle cx="${f.sx(b)}" cy="${y}" r="8" fill="var(--surface)" stroke="${col}" stroke-width="3"/>`;
  const pvText = `Population ${fmt(Math.abs(pv) < 0.5 * 10 ** -d ? 0 : pv, d)}`, pvRight = f.sx(pv) > f.sx(0) + 120 || f.sx(pv) < f.sx(0) - 120;
  s += `<text x="${f.sx(pv) + (pvRight ? 6 : -6)}" y="${y + 30}" text-anchor="${pvRight ? "start" : "end"}">${pvText}</text>`;
  $("ci").innerHTML = s;
  const K = hist.length, nsig = hist.filter(h => h.p < 0.05).length;
  $("t-r").innerHTML = readout("t", fmt(cur.t, 2)) + readout("p", fp(cur.p), "r-decision") + readout("95-%-KI pro 10 cm", `${fmt(lo, d)} bis ${fmt(hi, d)}`) + readout("signifikant in allen Stichproben", K ? `${nsig} von ${K} (${fmt(nsig / K * 100, 0)} %)` : "–");
  const share = K ? ` Über alle ${K} Stichproben waren ${fmt(nsig / K * 100, 0)} % signifikant.` : "";
  $("t-c").innerHTML = dmode === "real"
    ? (sig ? `<b>Die Steigung ist signifikant.</b> Das Konfidenzintervall schließt die Null aus: Größere Kinder haben im Mittel eine höhere FEV, und zwar um ${fmt(lo, d)} bis ${fmt(hi, d)} l pro 10 cm. Das Intervall ist die nützlichere Aussage, denn es sagt auch, wie groß der Effekt ist.${share} Bei diesem starken Zusammenhang ist das die Power des Tests.`
      : `<b>Nicht signifikant.</b> Das Intervall enthält die Null. Bei so wenigen Kindern ist das selten, kommt aber vor: ein Fehler 2. Art.${share}`)
    : `Hier ist H₀ wahr. ${sig ? "<b>Diese Stichprobe ist trotzdem signifikant:</b> ein Fehler 1. Art." : "Diese Stichprobe ist korrekt nicht signifikant."}${share} Auf lange Sicht sind es etwa 5 %, genau das Signifikanzniveau α. Mehr dazu in der <a href="../../testen/entscheidung/">Entscheidungstheorie</a>.`;
}

/* ---------- 3 Bänder ---------- */
let basis = "sample";
function draw3() {
  const x0 = +$("bx").value; $("bx-v").textContent = x0 + " cm";
  const B = basis === "all" ? { xs: X, yv: Y, n: N, b0: B0, b1: B1, s: FULL.s, mx: MX, sxx: SXX, df: N - 2 } : { ...cur };
  const tc = tinv(0.975, B.df), fit = x => B.b0 + B.b1 * x;
  const seM = x => B.s * Math.sqrt(1 / B.n + (x - B.mx) ** 2 / B.sxx), seP = x => B.s * Math.sqrt(1 + 1 / B.n + (x - B.mx) ** 2 / B.sxx);
  const f = frame(900, 420, 110, 190, 0, 6);
  let s = f.s;
  s += `<path ${f.clip} d="${bandPath(f, 110, 190, x => fit(x) + tc * seP(x), x => fit(x) - tc * seP(x))}" fill="var(--pal-3)" fill-opacity=".22"/>`;
  s += `<path ${f.clip} d="${bandPath(f, 110, 190, x => fit(x) + tc * seM(x), x => fit(x) - tc * seM(x))}" fill="var(--therapie)" fill-opacity=".38"/>`;
  const big = basis === "all";
  B.xs.forEach((x, i) => s += `<circle cx="${f.sx(x).toFixed(1)}" cy="${f.sy(B.yv[i]).toFixed(1)}" r="${big ? 2.2 : 4}" fill="${big ? "var(--pal-3)" : "var(--fg)"}" fill-opacity="${big ? .55 : 1}"/>`);
  s += `<line ${f.clip} x1="${f.sx(110)}" x2="${f.sx(190)}" y1="${f.sy(fit(110))}" y2="${f.sy(fit(190))}" stroke="var(--therapie)" stroke-width="2.5"/>`;
  const yh = fit(x0), cm = tc * seM(x0), cp = tc * seP(x0), X1 = f.sx(x0);
  s += `<line x1="${X1}" x2="${X1}" y1="${f.P.T}" y2="${f.sy(0)}" stroke="var(--muted)" stroke-dasharray="3 4"/>`;
  const bar = (xx, a, b, col, w) => `<line x1="${xx}" x2="${xx}" y1="${f.sy(a)}" y2="${f.sy(b)}" stroke="${col}" stroke-width="${w}"/><line x1="${xx - 7}" x2="${xx + 7}" y1="${f.sy(a)}" y2="${f.sy(a)}" stroke="${col}" stroke-width="2"/><line x1="${xx - 7}" x2="${xx + 7}" y1="${f.sy(b)}" y2="${f.sy(b)}" stroke="${col}" stroke-width="2"/>`;
  const side = x0 > 168 ? -1 : 1;
  s += bar(X1 + side * 14, yh - cp, yh + cp, "var(--fg)", 2) + bar(X1, yh - cm, yh + cm, "var(--therapie)", 4);
  s += `<circle cx="${X1}" cy="${f.sy(yh)}" r="5" fill="var(--surface)" stroke="var(--therapie)" stroke-width="2.5"/>`;
  s += `<text x="${X1 + side * 26}" y="${f.sy(yh + cp) + 4}" text-anchor="${side > 0 ? "start" : "end"}" class="strong">einzelnes Kind</text><text x="${X1 + side * 26}" y="${f.sy(yh) + 4}" text-anchor="${side > 0 ? "start" : "end"}" class="strong" style="fill:var(--therapie)">Mittelwert</text>`;
  $("band").innerHTML = s;
  $("band-r").innerHTML = readout(`Sollwert für ${x0} cm`, fmt(yh) + " l", "r-decision") + readout("95-%-KI für den Mittelwert", `${fmt(yh - cm)} bis ${fmt(yh + cm)} l`) + readout("95-%-Vorhersageintervall", `${fmt(Math.max(0, yh - cp))} bis ${fmt(yh + cp)} l`) + readout("Breite: Vorhersage / KI", fmt(cp / cm, 1) + "-fach");
  $("band-f").innerHTML = TB(String.raw`\begin{aligned} \mathrm{SE}_{\text{MW}} &= s\sqrt{\tfrac{1}{n} + \tfrac{(x_0 - \bar{x})^2}{\sum (x_i - \bar{x})^2}} \\ &= ${tz(fmt(seM(x0), 3))} \\[4pt] \mathrm{SE}_{\text{Vorh.}} &= s\sqrt{1 + \tfrac{1}{n} + \tfrac{(x_0 - \bar{x})^2}{\sum (x_i - \bar{x})^2}} \\ &= ${tz(fmt(seP(x0), 3))} \end{aligned}`, `<span>SE Mittelwert ${fmt(seM(x0), 3)}, SE Vorhersage ${fmt(seP(x0), 3)}</span>`) +
    `<span class="dim">Der Unterschied ist die „1“ unter der Wurzel: die Streuung der einzelnen Kinder um ihren Mittelwert. Sie verschwindet nicht, auch wenn n sehr groß wird.</span>`;
  $("band-c").innerHTML = big
    ? `Mit allen ${N} Kindern ist die mittlere FEV bei ${x0} cm auf ±${fmt(cm, 2)} l genau bekannt, das Konfidenzband ist kaum breiter als die Gerade. Ein einzelnes Kind kann aber ±${fmt(cp, 2)} l davon abweichen. Für die Ärztin heißt das: Der Sollwert selbst ist sicher. Unsicher ist, wie weit gesunde Kinder natürlicherweise um ihn streuen.`
    : `Mit ${B.n} Kindern ist schon die Gerade selbst unsicher: Das Konfidenzband ist ±${fmt(cm, 2)} l breit, am schmalsten beim Mittelwert der Größe (${fmt(B.mx, 0)} cm) und zu den Rändern hin trichterförmig. Das Vorhersageband ist ${fmt(cp / cm, 1)}-mal so breit. Schalten Sie auf alle 654 Kinder: Das Konfidenzband schrumpft, das Vorhersageband kaum.`;
  const res = X.map((x, i) => Y[i] - (B0 + B1 * x)), tcF = tinv(0.975, N - 2);
  const outside = (lo, hi) => { const id = X.map((x, i) => i).filter(i => X[i] >= lo && X[i] < hi); return id.filter(i => Math.abs(res[i]) > tcF * FULL.s * Math.sqrt(1 + 1 / N + (X[i] - MX) ** 2 / SXX)).length / id.length * 100; };
  $("band-n").innerHTML = `Ein Haken: Das Vorhersageband nimmt an, dass die Kinder bei jeder Größe gleich stark streuen. Erwartet liegen dann überall 5 % außerhalb. In den FEV-Daten sind es bei Kindern unter 140 cm ${fmt(outside(0, 140), 1)} %, zwischen 140 und 164 cm ${fmt(outside(140, 165), 1)} % und ab 165 cm ${fmt(outside(165, 999), 1)} %. Die Streuung wächst mit der Größe. Was das für eine Normgrenze bedeutet, zeigt Abschnitt 4.`;
}

/* ---------- 4 Normgrenze ---------- */
const RELF = Math.exp(-Z05 * LOG.s);
const RULES = {
  p80: { soll: x => B0 + B1 * x, lim: x => 0.8 * (B0 + B1 * x) },
  abs: { soll: x => B0 + B1 * x, lim: x => B0 + B1 * x - Z05 * FULL.s },
  rel: { soll: x => Math.exp(LOG.b[0] + LOG.b[1] * x), lim: x => RELF * Math.exp(LOG.b[0] + LOG.b[1] * x) }
};
const GROUPS = [["unter 140 cm", 0, 140], ["140 bis 164 cm", 140, 165], ["ab 165 cm", 165, 999], ["alle Kinder", 0, 999]];
const flagShare = (r, lo, hi) => { const id = X.map((x, i) => i).filter(i => X[i] >= lo && X[i] < hi); return id.filter(i => Y[i] < RULES[r].lim(X[i])).length / id.length * 100; };
const SHARES = Object.fromEntries(Object.keys(RULES).map(r => [r, GROUPS.map(g => flagShare(r, g[1], g[2]))]));
let rule = "p80";
function draw4() {
  const x0 = +$("qx").value, y0 = +$("qy").value, Rr = RULES[rule];
  $("qx-v").textContent = x0 + " cm"; $("qy-v").textContent = fmt(y0) + " l";
  const f = frame(900, 420, 110, 195, 0, 6);
  let s = f.s;
  X.forEach((x, i) => { const fl = Y[i] < Rr.lim(x); s += `<circle cx="${f.sx(x).toFixed(1)}" cy="${f.sy(Y[i]).toFixed(1)}" r="${fl ? 3.2 : 2.3}" fill="${fl ? "var(--beta-ink)" : "var(--pal-3)"}" fill-opacity="${fl ? .9 : .4}"/>`; });
  s += `<path ${f.clip} d="${linePath(f, Rr.soll, 110, 195)}" fill="none" stroke="var(--therapie)" stroke-width="3"/>`;
  s += `<path ${f.clip} d="${linePath(f, Rr.lim, 110, 195)}" fill="none" stroke="var(--beta-ink)" stroke-width="2.5" stroke-dasharray="7 5"/>`;
  s += `<text x="${f.sx(192)}" y="${f.sy(Rr.soll(192)) - 10}" text-anchor="end" class="strong" style="fill:var(--therapie)">Sollwert</text><text x="${f.sx(192)}" y="${f.sy(Rr.lim(192)) + 20}" text-anchor="end" class="strong" style="fill:var(--beta-ink)">Grenze</text>`;
  const sw = Rr.soll(x0), lw = Rr.lim(x0), bad = y0 < lw;
  s += `<line x1="${f.sx(x0)}" x2="${f.sx(x0)}" y1="${f.sy(y0)}" y2="${f.sy(sw)}" stroke="var(--fg)" stroke-width="1.6" stroke-dasharray="4 3"/>`;
  s += `<circle cx="${f.sx(x0)}" cy="${f.sy(y0)}" r="9" fill="${bad ? "var(--beta-ink)" : "var(--kontrolle)"}" stroke="var(--surface)" stroke-width="2.5"/>`;
  $("lln").innerHTML = s;
  const z = (Math.log(y0) - Math.log(RULES.rel.soll(x0))) / LOG.s;
  $("lln-r").innerHTML = readout(`Sollwert für ${x0} cm`, fmt(sw) + " l") + readout("Grenze", fmt(lw) + " l") + readout("gemessen", `${fmt(y0)} l = ${fmt(y0 / sw * 100, 0)} % vom Soll`) + (rule === "rel" ? readout("z-Score", fmt(z, 2)) : "") + readout("Urteil", `<span class="${bad ? "verdict-bad" : "verdict-ok"}">${bad ? "auffällig" : "unauffällig"}</span>`, "r-decision");
  const sh = SHARES[rule], mx = 14;
  $("flag").innerHTML = `<div class="cap">Anteil der Kinder unter der Grenze, Ziel: 5 % in jeder Gruppe (schwarzer Strich)</div>` + GROUPS.map((g, k) => `<div class="row"><span>${g[0]}</span><span class="bar"><i style="width:${Math.min(100, sh[k] / mx * 100)}%"></i><b style="left:${5 / mx * 100}%"></b></span><span class="val">${fmt(sh[k], 1)} %</span></div>`).join("");
  $("lln-f").innerHTML = {
    p80: TB(String.raw`\begin{aligned} \text{Grenze} &= 0{,}80 \cdot \text{Sollwert} \\ &= 0{,}80 \cdot ${tz(fmt(sw, 2))} = ${tz(fmt(lw, 2))}\ \text{l} \end{aligned}`, ""),
    abs: TB(String.raw`\begin{aligned} \text{Grenze} &= \text{Sollwert} - 1{,}645 \cdot s \\ &= ${tz(fmt(sw, 2))} - 1{,}645 \cdot ${tz(fmt(FULL.s, 3))} \\ &= ${tz(fmt(lw, 2))}\ \text{l} \end{aligned}`, ""),
    rel: TB(String.raw`\begin{aligned} \ln(\text{FEV}) &= ${tz(fmt(LOG.b[0], 3))} + ${tz(fmt(LOG.b[1], 4))} \cdot \text{Größe} \\ s_{\ln} &= ${tz(fmt(LOG.s, 3))} \\ \text{Grenze} &= \text{Sollwert} \cdot e^{-1{,}645 \cdot s_{\ln}} \\ &= ${tz(fmt(RELF * 100, 0))}\,\%\ \text{vom Soll} = ${tz(fmt(lw, 2))}\ \text{l} \end{aligned}`, "")
  }[rule];
  const g = SHARES[rule].map(v => fmt(v, 1) + " %");
  $("lln-c").innerHTML = {
    p80: `Die 80-%-Regel zieht bei jeder Größe denselben Anteil ab, egal wie stark gesunde Kinder dort tatsächlich streuen. Ergebnis: Von den kleinen Kindern gelten ${g[0]} als auffällig, von den größeren ${g[1]} und ${g[2]}. Eine feste Prozentgrenze ist also für manche Gruppen zu streng, für andere zu milde.`,
    abs: `Die Normgrenze aus dem Vorhersageband: Sollwert minus 1,645 Streuungen, sodass 5 % darunter liegen sollten. Weil das Modell aber eine überall gleiche Streuung annimmt, gilt bei den kleinen Kindern fast niemand als auffällig (${g[0]}), bei den großen ${g[2]}. Bei 120 cm läge die Grenze bei ${fmt(RULES.abs.lim(120))} l, klinisch unbrauchbar.`,
    rel: `Rechnet man mit dem Logarithmus, streuen alle Kinder um denselben Prozentsatz um ihren Sollwert. Die Grenze liegt dann bei jeder Größe bei ${fmt(RELF * 100, 0)} % vom Soll, also nahe an der alten 80-%-Regel. Die Anteile (${g[0]}, ${g[1]}, ${g[2]}) liegen am nächsten an den angestrebten 5 %. Für unser Mädchen mit 2,0 l: z = ${fmt((Math.log(2) - Math.log(RULES.rel.soll(150))) / LOG.s, 2)}, deutlich über −1,645, also unauffällig. Probieren Sie 1,80 l: Nach der 80-%-Regel auffällig, nach dieser Normgrenze nicht.`
  }[rule];
  $("relf").textContent = fmt(RELF * 100, 0);
}

/* ---------- Events ---------- */
function all() { draw1(); draw2(); draw3(); }
function reset() { rng = mulberry32(7); hist = []; addSamples(1); all(); }
$("n").addEventListener("input", () => { nS = +$("n").value; reset(); });
$("one").onclick = () => { addSamples(1); all(); };
$("hundred").onclick = () => { addSamples(100); all(); };
$("reset").onclick = reset;
$("data").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; dmode = b.dataset.d; $("data").querySelectorAll("button").forEach(z => z.setAttribute("aria-pressed", z === b)); reset(); });
$("basis").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; basis = b.dataset.b; $("basis").querySelectorAll("button").forEach(z => z.setAttribute("aria-pressed", z === b)); draw3(); });
$("bx").addEventListener("input", draw3);
["qx", "qy"].forEach(id => $(id).addEventListener("input", draw4));
$("rule").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; rule = b.dataset.r; $("rule").querySelectorAll("button").forEach(z => z.setAttribute("aria-pressed", z === b)); draw4(); });
reset(); draw4();
})();
