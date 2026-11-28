/* Stats Lab · Rangtests: Mann-Whitney-U, Wilcoxon-Vorzeichen-Rang, Kruskal-Wallis
   Simulierte ordinale Daten aus der Versorgungsforschung (latente Normalverteilung, in Stufen geschnitten).
   p-Werte asymptotisch mit Bindungskorrektur, ohne Stetigkeitskorrektur (wie SPSS „Asymptotische Signifikanz“). */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const { fmt, rng, rnorm, frame, pick } = window.GM;
const { pnorm, lgamma } = window.REG;
const TB = (t, fb) => window.katex ? texBlock(t) : fb;
const tz = x => String(x).replace(/\./g, "{.}").replace(/,/g, "{,}").replace(/−/g, "-");
const fp = p => p < 0.001 ? "< 0,001" : fmt(p, 3);

/* ---------- Hilfen ---------- */
// Chi-Quadrat-Verteilung: obere Fläche über die regularisierte unvollständige Gammafunktion
function gammaP(a, x) {
  if (x <= 0) return 0;
  if (x < a + 1) { let s = 1 / a, t = s; for (let n = 1; n < 300; n++) { t *= x / (a + n); s += t; if (t < s * 1e-14) break; } return s * Math.exp(-x + a * Math.log(x) - lgamma(a)); }
  let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
  for (let i = 1; i < 300; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-14) break; }
  return 1 - Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}
const chiSf = (x, df) => 1 - gammaP(df / 2, x / 2);
// Ränge mit mittleren Rängen bei Bindungen; liefert auch die Bindungsgruppen
function ranks(v) {
  const idx = v.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]), r = new Array(v.length), ties = [];
  for (let i = 0; i < idx.length;) { let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++; const m = (i + j + 2) / 2; for (let k = i; k <= j; k++) r[idx[k][1]] = m; ties.push({ val: idx[i][0], from: i + 1, to: j + 1, mean: m, t: j - i + 1 }); i = j + 1; }
  return { r, ties };
}
const tieSum = ties => ties.reduce((s, g) => s + g.t ** 3 - g.t, 0);
const cut = (z, cuts) => 1 + cuts.filter(c => z > c).length;
const quant = (v, q) => { const s = [...v].sort((a, b) => a - b), h = (s.length - 1) * q, l = Math.floor(h); return s[l] + (h - l) * ((s[Math.ceil(h)] ?? s[l]) - s[l]); };
const med = v => quant(v, 0.5);
const mdIqr = v => `${fmt(med(v), 1).replace(",0", "")} (${fmt(quant(v, 0.25), 1).replace(",0", "")} bis ${fmt(quant(v, 0.75), 1).replace(",0", "")})`;

/* Gestapelte Punkte je Stufe für eine oder mehrere Gruppen */
function stacks(el, groups, levels, labels, W = 900) {
  const rowH = 96, H = 30 + groups.length * rowH + 40, L = 170, R = 20, cw = (W - L - R) / levels.length;
  let s = "";
  levels.forEach((lv, k) => { const x = L + cw * (k + 0.5); s += `<line x1="${x}" x2="${x}" y1="20" y2="${H - 40}" stroke="var(--grid)"/><text x="${x}" y="${H - 22}" text-anchor="middle" class="strong">${lv}</text>${labels[k] ? `<text x="${x}" y="${H - 6}" text-anchor="middle">${labels[k]}</text>` : ""}`; });
  groups.forEach(({ name, vals, col, mr }, g) => {
    const y0 = 30 + g * rowH + rowH - 14;
    s += `<text x="${L - 14}" y="${y0 - 40}" text-anchor="end" class="strong">${name}</text><text x="${L - 14}" y="${y0 - 22}" text-anchor="end">n = ${vals.length}</text>${mr !== undefined ? `<text x="${L - 14}" y="${y0 - 4}" text-anchor="end">mittl. Rang ${fmt(mr, 1)}</text>` : ""}`;
    s += `<line x1="${L}" x2="${W - R}" y1="${y0 + 6}" y2="${y0 + 6}" stroke="var(--line)"/>`;
    levels.forEach((lv, k) => { const n = vals.filter(v => v === lv).length, x = L + cw * (k + 0.5); for (let i = 0; i < n; i++) { const c = i % 6, r = Math.floor(i / 6); s += `<circle cx="${x - 25 + c * 10}" cy="${y0 - r * 10}" r="4.2" fill="${col}"/>`; } });
  });
  el.setAttribute("viewBox", `0 0 ${W} ${H}`); el.innerHTML = s;
}

/* ---------- 1 Mann-Whitney-U ---------- */
const CUT5 = [-1.5, -0.7, 0.1, 0.9], LAB5 = ["sehr unzufrieden", "", "teils, teils", "", "sehr zufrieden"];
let e1 = 1, s1 = 11;
function draw1() {
  const u = rng(s1), z = rnorm(u), A = Array.from({ length: 18 }, () => cut(z() + 0.2 + e1 * 0.5, CUT5)), B = Array.from({ length: 20 }, () => cut(z() + 0.2 - e1 * 0.5, CUT5));
  const all = [...A, ...B], N = all.length, { r, ties } = ranks(all), RA = r.slice(0, A.length).reduce((a, b) => a + b, 0), RB = r.slice(A.length).reduce((a, b) => a + b, 0);
  const n1 = A.length, n2 = B.length, U1 = RA - n1 * (n1 + 1) / 2, U2 = n1 * n2 - U1, U = Math.min(U1, U2);
  const sd = Math.sqrt(n1 * n2 / 12 * ((N + 1) - tieSum(ties) / (N * (N - 1)))), zz = (U - n1 * n2 / 2) / sd, p = 2 * (1 - pnorm(Math.abs(zz))), rEff = Math.abs(zz) / Math.sqrt(N);
  stacks($("c1"), [{ name: "mit Hebamme", vals: A, col: "var(--therapie)", mr: RA / n1 }, { name: "ohne Hebamme", vals: B, col: "var(--kontrolle)", mr: RB / n2 }], [1, 2, 3, 4, 5], LAB5);
  // Rangleiste: Bindungsblöcke mit mittlerem Rang, Punkte farbig nach Gruppe
  const W = 900, L = 30, Rr = 20, sx = i => L + (i - 0.5) / N * (W - L - Rr);
  let s = "";
  const order = all.map((v, i) => [v, i < n1 ? 0 : 1]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  ties.forEach((g, gi) => { const cx = (sx(g.from) + sx(g.to)) / 2, wd = (g.to - g.from + 1) * (W - L - Rr) / N, nar = wd < 120, dy = nar && gi % 2 ? 16 : 0; s += `<rect x="${sx(g.from) - (W - L - Rr) / N / 2}" y="40" width="${wd}" height="70" class="tie" stroke="var(--line)"/><text x="${cx}" y="32" text-anchor="middle" class="strong">Stufe ${g.val}</text><text x="${cx}" y="${128 + dy}" text-anchor="middle">${nar ? "" : `Ränge ${g.from}–${g.to}, `}Ø ${fmt(g.mean, 1)}</text>`; });
  order.forEach(([v, g], i) => s += `<circle cx="${sx(i + 1)}" cy="${g ? 92 : 62}" r="${Math.min(6, (W - L - Rr) / N / 2.2)}" fill="${g ? "var(--kontrolle)" : "var(--therapie)"}"/>`);
  s += `<text x="${L}" y="166">← niedrigster Rang</text><text x="${W - Rr}" y="166" text-anchor="end">höchster Rang (N = ${N}) →</text>`;
  $("c1r").innerHTML = s;
  $("f1").innerHTML = TB(String.raw`U_1 = R_1 - \tfrac{n_1(n_1+1)}{2} = ${tz(fmt(RA, 1))} - \tfrac{${n1}\cdot ${n1 + 1}}{2} = ${tz(fmt(U1, 1))}, \quad U = \min(U_1,\, n_1 n_2 - U_1) = ${tz(fmt(U, 1))}, \quad z = \frac{U - n_1 n_2 / 2}{\sigma_U} = ${tz(fmt(zz, 2))}`, `U = ${fmt(U, 1)}, z = ${fmt(zz, 2)}`);
  $("t1").innerHTML = `<thead><tr><th>Gruppe</th><th>n</th><th>Median (IQR)</th><th>mittlerer Rang</th><th>Rangsumme</th></tr></thead><tbody><tr><td>mit Hebamme</td><td>${n1}</td><td>${mdIqr(A)}</td><td>${fmt(RA / n1, 1)}</td><td>${fmt(RA, 1)}</td></tr><tr><td>ohne Hebamme</td><td>${n2}</td><td>${mdIqr(B)}</td><td>${fmt(RB / n2, 1)}</td><td>${fmt(RB, 1)}</td></tr><tr class="tot"><td>Test</td><td colspan="4" class="l">U = ${fmt(U, 1)}, z = ${fmt(zz, 2)}, p = ${fp(p)}, r = ${fmt(rEff, 2)}</td></tr></tbody>`;
  $("cl1").innerHTML = (p < 0.05 ? `Die Frauen mit Hebammenbetreuung haben im Mittel ${RA / n1 > RB / n2 ? "höhere" : "niedrigere"} Ränge, der Unterschied ist signifikant (p = ${fp(p)}).` : `Der Unterschied der mittleren Ränge ist nicht signifikant (p = ${fp(p)}).`) + ` Die Effektstärke r = ${fmt(rEff, 2)} liegt ${rEff < 0.1 ? "unter dem kleinen Bereich" : rEff < 0.3 ? "im kleinen Bereich" : rEff < 0.5 ? "im mittleren Bereich" : "im großen Bereich"} (Richtwerte 0,1 / 0,3 / 0,5). Der Test nimmt nur an, was die Skala hergibt, nämlich eine Reihenfolge. Die vielen Bindungen bei nur fünf Stufen berücksichtigt er über die mittleren Ränge.`;
  $("rep1").innerHTML = `„Frauen mit Hebammenbetreuung im Wochenbett waren ${p < 0.05 ? (RA / n1 > RB / n2 ? "zufriedener" : "weniger zufrieden") : "nicht signifikant zufriedener"} (Median ${mdIqr(A)}) als Frauen ohne (Median ${mdIqr(B)}); Mann-Whitney-U = ${fmt(U, 1).replace(",0", "")}, z = ${fmt(zz, 2)}, p = ${fp(p)}, r = ${fmt(rEff, 2)}.“`;
}
$("e1").addEventListener("click", e => { const b = pick(e, $("e1")); if (!b) return; e1 = +b.dataset.e; draw1(); });
$("d1").addEventListener("click", () => { s1++; draw1(); });
draw1();

/* ---------- 2 Wilcoxon-Vorzeichen-Rang ---------- */
const CUT7 = [-1.2, -0.5, 0.1, 0.7, 1.3, 1.9];
let e2 = 0.6, s2 = 5;
function draw2() {
  const u = rng(s2 * 7 + 3), z = rnorm(u), n = 14;
  const P = Array.from({ length: n }, (_, i) => { const lat = z() - 0.2; return { id: i + 1, vor: cut(lat, CUT7), nach: cut(lat + e2 + z() * 0.6, CUT7) }; });
  P.forEach(q => q.d = q.nach - q.vor);
  const nz = P.filter(q => q.d !== 0), { r, ties } = ranks(nz.map(q => Math.abs(q.d))); nz.forEach((q, i) => q.rk = r[i]);
  const Wp = nz.filter(q => q.d > 0).reduce((s, q) => s + q.rk, 0), Wm = nz.filter(q => q.d < 0).reduce((s, q) => s + q.rk, 0), m = nz.length;
  const sd = Math.sqrt(m * (m + 1) * (2 * m + 1) / 24 - tieSum(ties) / 48), zz = m ? (Math.min(Wp, Wm) - m * (m + 1) / 4) / sd : 0, p = m ? 2 * (1 - pnorm(Math.abs(zz))) : 1, rEff = Math.abs(zz) / Math.sqrt(n);
  const S = [...P].sort((a, b) => Math.abs(a.d) - Math.abs(b.d) || a.d - b.d), mx = Math.max(3, ...P.map(q => Math.abs(q.d)));
  const f = frame(900, 340, -0.6, n - 0.4, -mx - 0.5, mx + 0.5, { P: { L: 60, R: 16, T: 20, B: 56 }, nx: 0, ny: 6, yl: "nachher − vorher (FOIS-Stufen)", fy: v => (v > 0 ? "+" : "") + fmt(v, 0) });
  let s = f.s + `<line x1="${f.P.L}" x2="${900 - f.P.R}" y1="${f.sy(0)}" y2="${f.sy(0)}" stroke="var(--fg)" stroke-width="1.4"/>`;
  S.forEach((q, i) => {
    const x = f.sx(i), col = q.d > 0 ? "var(--therapie)" : q.d < 0 ? "var(--beta-ink)" : "var(--pal-2)";
    if (q.d) s += `<rect x="${x - 18}" y="${f.sy(Math.max(0, q.d))}" width="36" height="${Math.abs(f.sy(q.d) - f.sy(0))}" rx="3" fill="${col}"/><text x="${x}" y="${q.d > 0 ? f.sy(q.d) - 6 : f.sy(q.d) + 15}" text-anchor="middle" class="strong">${q.d > 0 ? "+" : "−"}${fmt(q.rk, 1).replace(",0", "")}</text>`;
    else s += `<circle cx="${x}" cy="${f.sy(0)}" r="6" fill="${col}" stroke="var(--muted)"/><text x="${x}" y="${f.sy(0) - 12}" text-anchor="middle">0</text>`;
    s += `<text x="${x}" y="${340 - 56 + 18}" text-anchor="middle">P${q.id}</text><text x="${x}" y="${340 - 56 + 34}" text-anchor="middle" class="rk">${q.vor}→${q.nach}</text>`;
  });
  s += `<text x="${900 - 16}" y="${340 - 4}" text-anchor="end">sortiert nach |Differenz|; Zahl am Balken: Rang mit Vorzeichen</text>`;
  $("c2").innerHTML = s;
  $("f2").innerHTML = TB(String.raw`W_+ = ${tz(fmt(Wp, 1))}, \quad W_- = ${tz(fmt(Wm, 1))}, \quad n = ${m} \text{ ohne Nulldifferenzen}, \quad z = \frac{\min(W_+, W_-) - n(n+1)/4}{\sigma_W} = ${tz(fmt(zz, 2))}`, `W+ = ${fmt(Wp, 1)}, W− = ${fmt(Wm, 1)}, z = ${fmt(zz, 2)}`);
  $("t2").innerHTML = `<thead><tr><th>Messung</th><th>Median (IQR)</th><th>verbessert</th><th>verschlechtert</th><th>unverändert</th></tr></thead><tbody><tr><td>vorher</td><td>${mdIqr(P.map(q => q.vor))}</td><td rowspan="2">${P.filter(q => q.d > 0).length}</td><td rowspan="2">${P.filter(q => q.d < 0).length}</td><td rowspan="2">${P.filter(q => q.d === 0).length}</td></tr><tr><td>nachher</td><td>${mdIqr(P.map(q => q.nach))}</td></tr><tr class="tot"><td>Test</td><td colspan="4" class="l">Wilcoxon z = ${fmt(zz, 2)}, p = ${fp(p)}, r = ${fmt(rEff, 2)}</td></tr></tbody>`;
  $("cl2").innerHTML = `Ohne Wirkung sollten positive und negative Ränge etwa gleich groß sein. Hier stehen W<sub>+</sub> = ${fmt(Wp, 1)} und W<sub>−</sub> = ${fmt(Wm, 1)} gegenüber; ${p < 0.05 ? "der Unterschied ist signifikant" : "der Unterschied ist nicht signifikant"} (p = ${fp(p)}). ${(c => c === 0 ? "Keine Person ist unverändert." : c === 1 ? "Die eine Person ohne Veränderung fällt heraus." : `Die ${c} Personen ohne Veränderung fallen heraus.`)(P.filter(q => q.d === 0).length)} Anders als der Vorzeichentest zählt der Wilcoxon-Test nicht nur die Richtung, sondern auch, wie groß eine Veränderung im Vergleich zu den anderen ist.`;
}
$("e2").addEventListener("click", e => { const b = pick(e, $("e2")); if (!b) return; e2 = +b.dataset.e; draw2(); });
$("d2").addEventListener("click", () => { s2++; draw2(); });
draw2();

/* ---------- 3 Kruskal-Wallis ---------- */
let e3 = 1, s3 = 21;
function draw3() {
  const u = rng(s3 * 13 + 1), z = rnorm(u), sh = [0, 0.45, -0.45], G = sh.map(d => Array.from({ length: 15 }, () => cut(z() + 0.2 + e3 * d, CUT5)));
  const all = G.flat(), N = all.length, { r, ties } = ranks(all); let o = 0;
  const R = G.map(g => { const rs = r.slice(o, o + g.length); o += g.length; return rs.reduce((a, b) => a + b, 0); });
  const k = G.length, H0 = 12 / (N * (N + 1)) * R.reduce((s, Rj, j) => s + Rj * Rj / G[j].length, 0) - 3 * (N + 1), C = 1 - tieSum(ties) / (N ** 3 - N), H = H0 / C, p = chiSf(H, k - 1), eta = Math.max(0, (H - k + 1) / (N - k));
  const NM = ["Praxis", "Hausbesuch", "Teletherapie"], COL = ["var(--kontrolle)", "var(--therapie)", "var(--beta-ink)"];
  stacks($("c3"), G.map((g, j) => ({ name: NM[j], vals: g, col: COL[j], mr: R[j] / g.length })), [1, 2, 3, 4, 5], LAB5);
  $("f3").innerHTML = TB(String.raw`H = \frac{12}{N(N+1)} \sum_j \frac{R_j^2}{n_j} - 3(N+1) = ${tz(fmt(H, 2))} \;\text{(mit Bindungskorrektur)}, \quad df = k - 1 = ${k - 1}`, `H = ${fmt(H, 2)}, df = ${k - 1}`);
  $("t3").innerHTML = `<thead><tr><th>Setting</th><th>n</th><th>Median (IQR)</th><th>mittlerer Rang</th></tr></thead><tbody>${G.map((g, j) => `<tr><td>${NM[j]}</td><td>${g.length}</td><td>${mdIqr(g)}</td><td>${fmt(R[j] / g.length, 1)}</td></tr>`).join("")}<tr class="tot"><td>Test</td><td colspan="3" class="l">Kruskal-Wallis H = ${fmt(H, 2)}, df = ${k - 1}, p = ${fp(p)}, η²<sub>H</sub> = ${fmt(eta, 2)}</td></tr></tbody>`;
  $("cl3").innerHTML = `Ohne Unterschied sollte jedes Setting einen mittleren Rang nahe (N + 1) ÷ 2 = ${fmt((N + 1) / 2, 1)} haben. H misst, wie weit die mittleren Ränge davon abweichen, und folgt unter H0 näherungsweise einer Chi-Quadrat-Verteilung mit k − 1 = ${k - 1} Freiheitsgraden. ${p < 0.05 ? `Hier ist das Ergebnis signifikant (p = ${fp(p)}): Mindestens zwei Settings unterscheiden sich.` : `Hier ist das Ergebnis nicht signifikant (p = ${fp(p)}).`}`;
}
$("e3").addEventListener("click", e => { const b = pick(e, $("e3")); if (!b) return; e3 = +b.dataset.e; draw3(); });
$("d3").addEventListener("click", () => { s3++; draw3(); });
draw3();
})();
