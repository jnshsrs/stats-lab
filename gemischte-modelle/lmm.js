/* Stats Lab · Gemischte Modelle: Rechenkern (window.LMM)
   fit(y, X, Z, g): lineares gemischtes Modell y = Xβ + Zu + e mit u_g ~ N(0, G), e ~ N(0, σ²).
   Schätzung per REML (wie SPSS MIXED und lme4), profiliert über σ², Nelder-Mead über die
   Cholesky-Parameter von G/σ². Pro Gruppe Woodbury: V = I + Z L Lᵀ Zᵀ, A = Lᵀ Zᵀ Z L + I.
   Liefert β, SE(β), σ², G, BLUPs je Gruppe. Für q ≤ 2 Zufallseffekte gedacht. */
(() => {
"use strict";
const inv = M => { const n = M.length, A = M.map((r, i) => [...r, ...M.map((_, j) => +(i === j))]);
  for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r; [A[c], A[p]] = [A[p], A[c]];
    const d = A[c][c]; for (let j = 0; j < 2 * n; j++) A[c][j] /= d;
    for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c]; for (let j = 0; j < 2 * n; j++) A[r][j] -= f * A[c][j]; } }
  return A.map(r => r.slice(n)); };
const logdet = M => { const n = M.length, A = M.map(r => [...r]); let s = 0;
  for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r; [A[c], A[p]] = [A[p], A[c]];
    s += Math.log(Math.abs(A[c][c])); for (let r = c + 1; r < n; r++) { const f = A[r][c] / A[c][c]; for (let j = c; j < n; j++) A[r][j] -= f * A[c][j]; } }
  return s; };
const mm = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
const tr = A => A[0].map((_, j) => A.map(r => r[j]));
function nelder(f, x0, step = 0.5, it = 400) {
  const n = x0.length; let S = [x0, ...x0.map((_, i) => x0.map((v, j) => v + (i === j ? step : 0)))].map(x => [x, f(x)]);
  for (let k = 0; k < it; k++) {
    S.sort((a, b) => a[1] - b[1]); if (Math.abs(S[n][1] - S[0][1]) < 1e-10) break;
    const c = x0.map((_, j) => S.slice(0, n).reduce((s, p) => s + p[0][j], 0) / n), at = t => c.map((v, j) => v + t * (S[n][0][j] - v));
    const r = at(-1), fr = f(r);
    if (fr < S[0][1]) { const e = at(-2), fe = f(e); S[n] = fe < fr ? [e, fe] : [r, fr]; }
    else if (fr < S[n - 1][1]) S[n] = [r, fr];
    else { const ct = at(0.5), fc = f(ct); if (fc < S[n][1]) S[n] = [ct, fc]; else S = S.map((p, i) => { if (!i) return p; const x = p[0].map((v, j) => S[0][0][j] + 0.5 * (v - S[0][0][j])); return [x, f(x)]; }); }
  }
  S.sort((a, b) => a[1] - b[1]); return S[0][0];
}
function fit(y, X, Z, g) {
  const N = y.length, p = X[0].length, q = Z[0].length, ids = [...new Set(g)];
  const grp = ids.map(id => g.map((v, i) => v === id ? i : -1).filter(i => i >= 0));
  const Lof = th => q === 1 ? [[th[0]]] : [[th[0], 0], [th[1], th[2]]];
  function parts(th) {
    const L = Lof(th); let XVX = X[0].map(() => X[0].map(() => 0)), XVy = X[0].map(() => 0), ld = 0; const cache = [];
    grp.forEach(ix => {
      const Zi = ix.map(i => Z[i]), Xi = ix.map(i => X[i]), yi = ix.map(i => y[i]);
      const ZL = mm(Zi, L), A = mm(tr(ZL), ZL).map((r, a) => r.map((v, b) => v + (a === b))), Ai = inv(A); ld += logdet(A);
      const Vi = v => { const t = mm(tr(ZL), v.map(x => [x])).map(r => r[0]), s = Ai.map(r => r.reduce((a, b, k) => a + b * t[k], 0)); return v.map((x, r) => x - ZL[r].reduce((a, b, k) => a + b * s[k], 0)); };
      const Xc = X[0].map((_, j) => Vi(Xi.map(r => r[j]))), yv = Vi(yi);
      for (let a = 0; a < p; a++) { for (let b = 0; b < p; b++) XVX[a][b] += Xi.reduce((s, r, k) => s + r[a] * Xc[b][k], 0); XVy[a] += Xi.reduce((s, r, k) => s + r[a] * yv[k], 0); }
      cache.push({ ix, ZL, Ai, Vi, Xi, yi });
    });
    const XVXi = inv(XVX), beta = XVXi.map(r => r.reduce((s, v, k) => s + v * XVy[k], 0));
    let rss = 0; cache.forEach(c => { const r = c.yi.map((v, k) => v - c.Xi[k].reduce((s, x, j) => s + x * beta[j], 0)); c.r = r; const vr = c.Vi(r); rss += r.reduce((s, v, k) => s + v * vr[k], 0); });
    const s2 = rss / (N - p), crit = (N - p) * Math.log(s2) + ld + logdet(XVX);
    return { L, beta, XVXi, s2, crit, cache };
  }
  const th0 = q === 1 ? [0.8] : [0.8, 0, 0.3];
  let best = nelder(th => parts(th).crit, th0, 0.5); best = nelder(th => parts(th).crit, best, 0.1);
  const P = parts(best), G = mm(P.L, tr(P.L)).map(r => r.map(v => v * P.s2));
  const blup = P.cache.map(c => { const t = mm(tr(c.ZL), c.r.map(x => [x])).map(r => r[0]), s = c.Ai.map(r => r.reduce((a, b, k) => a + b * t[k], 0)); return P.L.map(r => r.reduce((a, b, k) => a + b * s[k], 0)); });
  const se = P.XVXi.map((r, i) => Math.sqrt(r[i] * P.s2));
  return { beta: P.beta, se, s2: P.s2, G, ids, blup, crit: P.crit };
}
window.LMM = { fit, inv };
})();
