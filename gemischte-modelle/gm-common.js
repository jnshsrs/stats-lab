/* Stats Lab · Gemischte Modelle: gemeinsame Helfer (window.GM) */
(() => {
"use strict";
const fmt = (x, d = 2) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");
const fp = p => p < 0.001 ? "< 0,001" : fmt(p, 3);
const rng = seed => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const rnorm = u => () => { let x = 0; while (!x) x = u(); return Math.sqrt(-2 * Math.log(x)) * Math.cos(2 * Math.PI * u()); };
function ticks(lo, hi, n = 8) { const span = hi - lo, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw))); const st = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => span / s <= n); const o = []; for (let v = Math.ceil(lo / st - 1e-9) * st; v <= hi + 1e-9; v += st) o.push(+v.toFixed(6)); return o; }
let cpId = 0;
function frame(W, H, xlo, xhi, ylo, yhi, o = {}) {
  const P = o.P || { L: 60, R: 16, T: 14, B: 46 }, xl = o.xl ?? "", yl = o.yl ?? "", nx = o.nx ?? 8, ny = o.ny ?? 6;
  const sx = v => P.L + (v - xlo) / (xhi - xlo) * (W - P.L - P.R), sy = v => H - P.B - (v - ylo) / (yhi - ylo) * (H - P.T - P.B);
  const id = "gmcp" + (++cpId);
  let s = `<defs><clipPath id="${id}"><rect x="${P.L}" y="${P.T}" width="${W - P.L - P.R}" height="${H - P.T - P.B}"/></clipPath></defs>`;
  if (nx) ticks(xlo, xhi, nx).forEach(v => s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${P.T}" y2="${H - P.B}" stroke="var(--grid)"/><text x="${sx(v)}" y="${H - P.B + 18}" text-anchor="middle">${o.fx ? o.fx(v) : fmt(v, 0)}</text>`);
  if (ny) ticks(ylo, yhi, ny).forEach(v => s += `<line x1="${P.L}" x2="${W - P.R}" y1="${sy(v)}" y2="${sy(v)}" stroke="var(--grid)"/><text x="${P.L - 8}" y="${sy(v) + 4}" text-anchor="end">${o.fy ? o.fy(v) : fmt(v, v % 1 ? 1 : 0)}</text>`);
  if (xl) s += `<text x="${W - P.R}" y="${H - 6}" text-anchor="end">${xl}</text>`;
  if (yl) s += `<text x="14" y="${(P.T + H - P.B) / 2}" transform="rotate(-90 14 ${(P.T + H - P.B) / 2})" text-anchor="middle">${yl}</text>`;
  return { sx, sy, s, clip: `clip-path="url(#${id})"`, P, W, H };
}
const pick = (e, el) => { const b = e.target.closest("button"); if (!b) return null; el.querySelectorAll("button").forEach(z => z.setAttribute("aria-pressed", z === b)); return b; };
const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
const sd = a => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)); };
/* Welch-freier klassischer t-Test zweier Gruppen (gleiche Varianzen) */
function ttest(a, b) {
  const na = a.length, nb = b.length, df = na + nb - 2, sp2 = ((na - 1) * sd(a) ** 2 + (nb - 1) * sd(b) ** 2) / df, se = Math.sqrt(sp2 * (1 / na + 1 / nb)), d = mean(b) - mean(a), t = d / se;
  return { d, se, t, df, p: 2 * (1 - window.REG.tcdf(Math.abs(t), df)) };
}
const tz = x => String(x).replace(/\./g, "{.}").replace(/,/g, "{,}").replace(/−/g, "-");
window.GM = { fmt, fp, rng, rnorm, ticks, frame, pick, mean, sd, ttest, tz };
})();
/* Modellkarte: dieselbe Gleichung oben in jeder Station, der Teil der Station ist markiert.
   <div class="mcard" data-on="u0,e" data-note="..."></div> */
(() => {
const T = [["b", "β<sub>0</sub> + β<sub>1</sub> · x<sub>ij</sub>", "fest: für alle gleich"], ["u0", "u<sub>0i</sub>", "zufällig: Niveau von i"], ["u1", "u<sub>1i</sub> · x<sub>ij</sub>", "zufällig: Steigung von i"], ["e", "e<sub>ij</sub>", "Rest: Messung j"]];
document.querySelectorAll(".mcard[data-on]").forEach(el => {
  const on = el.dataset.on.split(",");
  el.innerHTML = `<span class="mc-lab">Das Modell dieses Blocks</span><div class="mc-eq"><span class="mc-y">y<sub>ij</sub> =</span>${T.map(([k, f, l], i) => `${i ? '<span class="mc-plus">+</span>' : ""}<span class="mc-t${on.includes(k) ? " on" : ""}"><span class="mc-f">${f}</span><small>${l}</small></span>`).join("")}</div><p class="mc-note">${el.dataset.note}</p>`;
});
})();

