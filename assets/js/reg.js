/* Stats Lab · Regressionsrechner (kleinste Quadrate) für Block 5.
   ols(y, X) mit X als Liste von Spalten (ohne Konstante); liefert b, SE, t, p, R², s, Residuen, Vorhersagen.
   Rechnet wie R lm() bzw. SPSS: Normalgleichungen, t-Verteilung mit n − k − 1 Freiheitsgraden. */
(() => {
"use strict";
function lgamma(x) { const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]; if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x); x -= 1; let a = c[0]; const t = x + g + 0.5; for (let i = 1; i < g + 2; i++) a += c[i] / (x + i); return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a); }
function betacf(a, b, x) { const FP = 1e-300; let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < FP) d = FP; d = 1 / d; let h = d; for (let m = 1; m <= 300; m++) { const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2)); d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; h *= d * c; aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2)); d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-14) break; } return h; }
function ibeta(x, a, b) { if (x <= 0) return 0; if (x >= 1) return 1; const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)); return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b; }
const tcdf = (t, df) => { const x = df / (df + t * t), p = 0.5 * ibeta(x, df / 2, 0.5); return t >= 0 ? 1 - p : p; };
function tinv(p, df) { let lo = -60, hi = 60; for (let i = 0; i < 120; i++) { const m = (lo + hi) / 2; if (tcdf(m, df) < p) lo = m; else hi = m; } return (lo + hi) / 2; }
// Gauß-Jordan-Inverse einer kleinen symmetrischen Matrix
function inv(A) { const n = A.length, M = A.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => +(i === j))]); for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]]; const v = M[c][c]; for (let j = 0; j < 2 * n; j++) M[c][j] /= v; for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c]; for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j]; } } return M.map(r => r.slice(n)); }
function ols(y, cols) {
  const n = y.length, k = cols.length, p = k + 1, X = y.map((_, i) => [1, ...cols.map(c => c[i])]);
  const XtX = Array.from({ length: p }, (_, a) => Array.from({ length: p }, (_, b) => X.reduce((s, r) => s + r[a] * r[b], 0)));
  const Xty = Array.from({ length: p }, (_, a) => X.reduce((s, r, i) => s + r[a] * y[i], 0));
  const XtXi = inv(XtX), b = XtXi.map(r => r.reduce((s, v, j) => s + v * Xty[j], 0));
  const fit = X.map(r => r.reduce((s, v, j) => s + v * b[j], 0)), res = y.map((v, i) => v - fit[i]);
  const my = y.reduce((s, v) => s + v, 0) / n, sqT = y.reduce((s, v) => s + (v - my) ** 2, 0), sqR = res.reduce((s, v) => s + v * v, 0);
  const df = n - p, s2 = sqR / df, se = XtXi.map((r, j) => Math.sqrt(s2 * r[j])), t = b.map((v, j) => v / se[j]);
  const pv = t.map(v => 2 * (1 - tcdf(Math.abs(v), df)));
  return { b, se, t, p: pv, df, n, fit, res, sqT, sqR, sqM: sqT - sqR, r2: 1 - sqR / sqT, s: Math.sqrt(s2), XtXi, mean: my };
}
const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
function cor(x, y) { const mx = mean(x), my = mean(y); let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < x.length; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; } return sxy / Math.sqrt(sxx * syy); }
const fcdf = (F, d1, d2) => F <= 0 ? 0 : ibeta(d1 * F / (d1 * F + d2), d1 / 2, d2 / 2);
window.REG = { ols, cor, mean, tcdf, tinv, fcdf };
})();
