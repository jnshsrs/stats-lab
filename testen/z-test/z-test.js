/* Der z-Test · Stats Lab
   Station „Der z-Test“: Normalapproximation des Binomialtests, z-Test für einen Mittelwert bei bekanntem σ,
   z gegen t bei kleinen Stichproben. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const fmt = (x, d = 2) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");
const tz = x => String(x).replace(/\./g, "{.}").replace(/,/g, "{,}").replace(/−/g, "-");
const readout = (l, v, cls = "") => `<div class="readout ${cls}"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;
const TS = (t, fb) => window.katex ? texSteps(t) : fb;
const TB = (t, fb) => window.katex ? texBlock(t) : fb;
const fp = p => p < 0.001 ? "< 0,001" : fmt(p, 3);
const LG = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
function lgamma(x) { if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x); x -= 1; let a = 0.99999999999980993; const t = x + 7.5; for (let i = 0; i < 8; i++) a += LG[i] / (x + i + 1); return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a); }
function betacf(a, b, x) { const FP = 1e-300; let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < FP) d = FP; d = 1 / d; let h = d; for (let m = 1; m <= 400; m++) { const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2)); d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; h *= d * c; aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2)); d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-14) break; } return h; }
function ibeta(x, a, b) { if (x <= 0) return 0; if (x >= 1) return 1; const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)); return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b; }
const tcdf = (t, df) => { const ib = ibeta(df / (df + t * t), df / 2, 0.5); return t >= 0 ? 1 - 0.5 * ib : 0.5 * ib; };
function tinv(p, df) { let lo = -1e9, hi = 1e9; for (let i = 0; i < 140; i++) { const m = (lo + hi) / 2; if (tcdf(m, df) < p) lo = m; else hi = m; } return (lo + hi) / 2; }
function erf(x) { const s = x < 0 ? -1 : 1; x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)); }
const Phi = x => 0.5 * (1 + erf(x / Math.SQRT2));
const phi = x => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
const tpdf = (x, v) => Math.exp(lgamma((v + 1) / 2) - lgamma(v / 2)) / Math.sqrt(v * Math.PI) * Math.pow(1 + x * x / v, -(v + 1) / 2);
const lchoose = (n, k) => lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);
const bpmf = (k, n, p) => Math.exp(lchoose(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
function ticks(lo, hi, n = 8) { const span = hi - lo, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw))); const st = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => span / s <= n); const o = []; for (let v = Math.ceil(lo / st - 1e-9) * st; v <= hi + 1e-9; v += st) o.push(+v.toFixed(6)); return o; }
function axes(W, H, P, xlo, xhi, ylo, yhi, xl, fx, ny = 0) {
  const sx = v => P.L + (v - xlo) / (xhi - xlo) * (W - P.L - P.R), sy = v => H - P.B - (v - ylo) / (yhi - ylo) * (H - P.T - P.B);
  let s = `<line x1="${P.L}" x2="${W - P.R}" y1="${H - P.B}" y2="${H - P.B}" stroke="var(--fg)" stroke-width="1.2"/>`;
  ticks(xlo, xhi, 10).forEach(v => s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${H - P.B}" y2="${H - P.B + 5}" stroke="var(--fg)"/><text x="${sx(v)}" y="${H - P.B + 19}" text-anchor="middle">${fx ? fx(v) : fmt(v, 0)}</text>`);
  s += `<text x="${W - P.R}" y="${H - 4}" text-anchor="end">${xl}</text>`;
  return { sx, sy, s };
}
const curve = (f, sx, sy, lo, hi, n = 240) => Array.from({ length: n + 1 }, (_, i) => { const x = lo + (hi - lo) * i / n; return `${i ? "L" : "M"}${sx(x).toFixed(1)} ${sy(f(x)).toFixed(1)}`; }).join(" ");
const area = (f, sx, sy, lo, hi, y0) => `${curve(f, sx, sy, lo, hi, 80)} L${sx(hi).toFixed(1)} ${y0} L${sx(lo).toFixed(1)} ${y0} Z`;

$("z-gen").innerHTML = TB(String.raw`z = \dfrac{\text{Beobachtung} - \text{Erwartung unter } H_0}{\text{Standardfehler unter } H_0}`, `<span class="big">z = (Beobachtung − Erwartung) ÷ Standardfehler</span>`);

/* ---------- 1 Binomial gegen Normal ---------- */
function draw1() {
  const n = +$("bn").value, q = +$("bq").value, p0 = 0.5, k = Math.round(q * n), mu = n * p0, se = Math.sqrt(n * p0 * (1 - p0));
  $("bn-v").textContent = n; $("bq-v").textContent = `${fmt(q * 100, 0)} % (${k} Treffer)`;
  const pm = Array.from({ length: n + 1 }, (_, i) => bpmf(i, n, p0));
  const d = Math.abs(k - mu), ext = i => Math.abs(i - mu) >= d - 1e-9;
  const pEx = Math.min(1, pm.reduce((s, v, i) => s + (ext(i) ? v : 0), 0));
  const z = (k - mu) / se, pZ = 2 * (1 - Phi(Math.abs(z))), zc = (Math.abs(k - mu) - 0.5) / se, pC = Math.min(1, 2 * (1 - Phi(zc)));
  const lo = Math.max(0, Math.floor(mu - 4.5 * se)), hi = Math.min(n, Math.ceil(mu + 4.5 * se)), xlo = Math.min(lo, k) - 0.5, xhi = Math.max(hi, k) + 0.5;
  const W = 900, H = 340, P = { L: 20, R: 20, T: 14, B: 44 }, ymax = Math.max(...pm) * 1.12;
  const A = axes(W, H, P, xlo, xhi, 0, ymax, "Anzahl Treffer k unter H0 (Raten)", null);
  let s = A.s; const bw = Math.max(1, (A.sx(1) - A.sx(0)) * 0.8);
  for (let i = Math.max(0, Math.ceil(xlo)); i <= Math.min(n, Math.floor(xhi)); i++) s += `<rect x="${(A.sx(i) - bw / 2).toFixed(1)}" y="${A.sy(pm[i]).toFixed(1)}" width="${bw.toFixed(1)}" height="${(A.sy(0) - A.sy(pm[i])).toFixed(1)}" fill="${ext(i) ? "var(--therapie)" : "var(--pal-3)"}"/>`;
  s += `<path d="${curve(x => phi((x - mu) / se) / se, A.sx, A.sy, xlo, xhi)}" fill="none" stroke="var(--beta-ink)" stroke-width="3"/>`;
  s += `<line x1="${A.sx(k)}" x2="${A.sx(k)}" y1="${P.T}" y2="${H - P.B}" stroke="var(--fg)" stroke-width="1.6" stroke-dasharray="5 4"/><text x="${A.sx(k) + (k > mu ? -8 : 8)}" y="${P.T + 14}" text-anchor="${k > mu ? "end" : "start"}" class="strong halo">beobachtet: ${k}</text>`;
  $("b-ch").innerHTML = s;
  $("b-f").innerHTML = TS(String.raw`z = \dfrac{k - n \cdot p_0}{\sqrt{n \cdot p_0 \cdot (1 - p_0)}} = \dfrac{${k} - ${tz(fmt(mu, 0))}}{\sqrt{${n} \cdot 0{,}5 \cdot 0{,}5}} = \dfrac{${tz(fmt(k - mu, 0))}}{${tz(fmt(se, 2))}} = \mathbf{${tz(fmt(z, 2))}}`, `<span class="big">z = ${fmt(z, 2)}</span>`);
  const ok = n * p0 >= 10;
  $("b-r").innerHTML = readout("p exakt (Binomialtest)", fp(pEx), "hl") + readout("p z-Test", fp(pZ)) + readout("p z-Test mit Stetigkeitskorrektur", fp(pC)) + readout("n · p₀ ≥ 10?", ok ? "ja" : "nein");
  const dev = pZ - pEx;
  $("b-c").innerHTML = (ok ? `Mit n · p<sub>0</sub> = ${fmt(mu, 0)} ist die Faustregel erfüllt. ` : `Mit n · p<sub>0</sub> = ${fmt(mu, 0)} ist die Faustregel (mindestens 10) nicht erfüllt. `) +
    `Der z-Test liefert p = ${fp(pZ)}, der exakte Binomialtest p = ${fp(pEx)}. ${Math.abs(dev) < 0.005 ? "Beide stimmen praktisch überein." : dev < 0 ? "Der z-Test ist hier zu optimistisch: Die glatte Kurve lässt die Hälfte des Balkens am Rand weg." : "Der z-Test ist hier etwas vorsichtiger als der exakte Test."} Die Stetigkeitskorrektur rückt die Grenze um einen halben Treffer nach innen und gleicht das weitgehend aus (p = ${fp(pC)}). Je größer n, desto feiner die Balken und desto besser die Näherung.`;
}
["bn", "bq"].forEach(id => $(id).addEventListener("input", draw1));

/* ---------- 2 Mittelwert mit bekanntem σ ---------- */
const MU0 = 30, SIG = 6;
function normPlot(svgId, z, crit, df) {
  const W = 520, H = 300, P = { L: 14, R: 14, T: 14, B: 44 }, A = axes(W, H, P, -4.5, 4.5, 0, 0.45, "z", v => fmt(v, 0));
  const f = df ? x => tpdf(x, df) : phi, y0 = A.sy(0).toFixed(1);
  let s = A.s + `<path d="${area(f, A.sx, A.sy, -4.5, -crit, y0)}" fill="var(--therapie)" fill-opacity=".35"/><path d="${area(f, A.sx, A.sy, crit, 4.5, y0)}" fill="var(--therapie)" fill-opacity=".35"/>`;
  s += `<path d="${curve(f, A.sx, A.sy, -4.5, 4.5)}" fill="none" stroke="var(--beta-ink)" stroke-width="3"/>`;
  [-crit, crit].forEach(c => s += `<text x="${A.sx(c)}" y="${A.sy(0.2)}" text-anchor="middle" class="halo">${fmt(c, 2)}</text>`);
  const zc = Math.max(-4.4, Math.min(4.4, z));
  s += `<line x1="${A.sx(zc)}" x2="${A.sx(zc)}" y1="${P.T + 10}" y2="${H - P.B}" stroke="var(--fg)" stroke-width="2"/><circle cx="${A.sx(zc)}" cy="${H - P.B}" r="6" fill="var(--fg)"/><text x="${A.sx(zc) + (zc < 0 ? 8 : -8)}" y="${P.T + 22}" text-anchor="${zc < 0 ? "start" : "end"}" class="strong halo">z = ${fmt(z, 2)}${Math.abs(z) > 4.4 ? " (außerhalb)" : ""}</text>`;
  $(svgId).innerHTML = s;
}
function draw2() {
  const n = +$("mn").value, xb = +$("mx").value, se = SIG / Math.sqrt(n), z = (xb - MU0) / se, p = 2 * (1 - Phi(Math.abs(z)));
  $("mn-v").textContent = n; $("mx-v").textContent = `${fmt(xb, 1)} kg`;
  $("m-f").innerHTML = TS(String.raw`z = \dfrac{\bar{x} - \mu_0}{\sigma / \sqrt{n}} = \dfrac{${tz(fmt(xb, 1))} - 30}{6 / \sqrt{${n}}} = \dfrac{${tz(fmt(xb - MU0, 1))}}{${tz(fmt(se, 2))}} = \mathbf{${tz(fmt(z, 2))}}`, `<span class="big">z = ${fmt(z, 2)}</span>`);
  normPlot("m-ch", z, 1.96, 0);
  $("m-r").innerHTML = readout("Standardfehler σ/√n", `${fmt(se, 2)} kg`) + readout("z", fmt(z, 2)) + readout("p (zweiseitig)", fp(p), p < 0.05 ? "hl" : "") + readout("95-%-KI", `${fmt(xb - 1.96 * se, 1)} bis ${fmt(xb + 1.96 * se, 1)} kg`);
  $("m-c").innerHTML = `Der Mittelwert der Patientinnen liegt ${fmt(Math.abs(xb - MU0), 1)} kg ${xb < MU0 ? "unter" : "über"} der Norm, das sind ${fmt(Math.abs(z), 2)} Standardfehler. ${p < 0.05 ? `Jenseits von ±1,96: H0 wird bei α = 5 % verworfen (p ${fp(p).startsWith("<") ? fp(p) : "= " + fp(p)}). Das 95-%-KI schließt 30 kg aus.` : `Innerhalb von ±1,96: H0 wird beibehalten (p = ${fp(p)}). Das 95-%-KI enthält 30 kg.`} Derselbe Unterschied wird mit mehr Patientinnen eher signifikant, weil der Standardfehler mit √n schrumpft. Bekannt ist σ hier nur, weil es aus einer großen Normstichprobe stammt; in der eigenen Studie wäre es geschätzt, und dann gilt der t-Test.`;
}
["mn", "mx"].forEach(id => $(id).addEventListener("input", draw2));

/* ---------- 3 z gegen t ---------- */
function draw3() {
  const df = +$("df").value, tk = tinv(0.975, df), real = 2 * (1 - tcdf(1.96, df));
  $("df-v").textContent = `${df} (n = ${df + 1})`;
  const W = 900, H = 320, P = { L: 20, R: 20, T: 14, B: 44 }, A = axes(W, H, P, -5, 5, 0, 0.42, "Prüfgröße", v => fmt(v, 0)), y0 = A.sy(0).toFixed(1);
  let s = A.s + `<path d="${area(x => tpdf(x, df), A.sx, A.sy, -5, -1.96, y0)}" fill="var(--therapie)" fill-opacity=".35"/><path d="${area(x => tpdf(x, df), A.sx, A.sy, 1.96, 5, y0)}" fill="var(--therapie)" fill-opacity=".35"/>`;
  s += `<path d="${curve(phi, A.sx, A.sy, -5, 5)}" fill="none" stroke="var(--beta-ink)" stroke-width="3"/><path d="${curve(x => tpdf(x, df), A.sx, A.sy, -5, 5)}" fill="none" stroke="var(--therapie)" stroke-width="3"/>`;
  [-1.96, 1.96].forEach(c => s += `<line x1="${A.sx(c)}" x2="${A.sx(c)}" y1="${P.T}" y2="${H - P.B}" stroke="var(--beta-ink)" stroke-dasharray="5 4"/>`);
  [-tk, tk].filter(c => Math.abs(c) < 5).forEach(c => s += `<line x1="${A.sx(c)}" x2="${A.sx(c)}" y1="${P.T}" y2="${H - P.B}" stroke="var(--therapie)" stroke-dasharray="2 3" stroke-width="2"/>`);
  s += `<text x="${A.sx(1.96) + 6}" y="${P.T + 14}" class="halo" style="fill:var(--beta-ink)">z-Grenze 1,96</text>`;
  if (tk < 5) s += `<text x="${A.sx(tk) + 6}" y="${P.T + 32}" class="halo" style="fill:var(--therapie)">t-Grenze ${fmt(tk, 2)}</text>`;
  $("t-ch").innerHTML = s;
  $("t-r").innerHTML = readout("kritischer t-Wert (α = 5 %, zweiseitig)", fmt(tk, 2)) + readout("kritischer z-Wert", "1,96") + readout("tatsächliches α mit der z-Grenze", fmt(real * 100, 1) + " %", real > 0.06 ? "hl" : "");
  $("t-c").innerHTML = real > 0.06
    ? `Mit ${df} Freiheitsgraden liegt die t-Grenze bei ${fmt(tk, 2)}. Wer mit 1,96 testet, verwirft H0 in ${fmt(real * 100, 1)} % der Fälle, obwohl sie stimmt, statt in 5 %. Kleine Stichproben brauchen den t-Test.`
    : `Mit ${df} Freiheitsgraden sind t- und Normalverteilung fast deckungsgleich: t-Grenze ${fmt(tk, 2)}, tatsächliches α mit der z-Grenze ${fmt(real * 100, 1)} %. Ab etwa 30 Personen ist der Unterschied in der Praxis vernachlässigbar, der t-Test bleibt aber die korrekte Wahl.`;
}
$("df").addEventListener("input", draw3);

draw1(); draw2(); draw3();
})();
