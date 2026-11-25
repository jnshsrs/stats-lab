/* Partial Pooling · Stats Lab
   Sechzehn simulierte Schmerzverläufe mit 1 bis 7 Messungen, Random-Intercept-Modell per REML (lmm.js).
   Vergleich Complete Pooling (OLS), No Pooling (eigener Achsenabschnitt, gemeinsame Steigung), Partial Pooling (BLUP). */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const { fmt, fp, rng, rnorm, frame, pick, mean, tz } = window.GM;
const { ols, tinv } = window.REG;
const TS = (t, fb) => window.katex ? texSteps(t) : fb;
const TB = (t, fb) => window.katex ? texBlock(t) : fb;
const NP = 16, WEEKS = [0, 2, 4, 6, 8, 10, 12], B0 = 6.5, B1 = -0.25;
let tau = 1.2, sig = 1.2, seed = 4, view = 2, sel = 0, D = null;

function simulate() {
  const u = rng(seed), z = rnorm(u), P = [];
  for (let i = 0; i < NP; i++) { const n = 1 + Math.floor(u() * 7), ui = tau * z(); P.push({ n, t: WEEKS.slice(0, n), y: WEEKS.slice(0, n).map(t => B0 + B1 * t + ui + sig * z()) }); }
  P.sort((a, b) => a.n - b.n); P.forEach((p, i) => p.id = i + 1);
  const y = [], X = [], g = [], T = [];
  P.forEach(p => p.t.forEach((t, k) => { y.push(p.y[k]); X.push([1, t]); g.push(p.id); T.push(t); }));
  const f = window.LMM.fit(y, X, X.map(() => [1]), g);
  const o = ols(y, [T]);
  // No Pooling: gemeinsame Steigung innerhalb der Personen, eigener Achsenabschnitt
  let sxy = 0, sxx = 0; P.forEach(p => { const tm = mean(p.t), ym = mean(p.y); p.t.forEach((t, k) => { sxy += (t - tm) * (p.y[k] - ym); sxx += (t - tm) ** 2; }); });
  const bw = sxx ? sxy / sxx : 0;
  const t2 = f.G[0][0], s2 = f.s2;
  P.forEach((p, i) => { p.np = mean(p.y) - bw * mean(p.t); p.rbar = mean(p.y.map((v, k) => v - f.beta[0] - f.beta[1] * p.t[k])); p.lam = t2 / (t2 + s2 / p.n); p.u = f.blup[f.ids.indexOf(p.id)][0]; });
  D = { P, f, o, bw, t2, s2, N: y.length };
}
function line(p) {
  const { f, o, bw } = D;
  if (view === 0) return [o.b[0], o.b[1]];
  if (view === 1) return [p.np, bw];
  return [f.beta[0] + p.u, f.beta[1]];
}
function draw1() {
  const all = D.P.flatMap(p => p.y), lo = Math.floor(Math.min(0, ...all)), hi = Math.ceil(Math.max(10, ...all));
  $("mini").innerHTML = D.P.map(p => {
    const f = frame(220, 150, -1, 13, lo, hi, { P: { L: 8, R: 8, T: 22, B: 8 }, nx: 0, ny: 0 }), [a, b] = line(p);
    let s = f.s + `<line x1="${f.sx(-1)}" x2="${f.sx(13)}" y1="${f.sy(5)}" y2="${f.sy(5)}" stroke="var(--grid)"/>`;
    s += `<line x1="${f.sx(0)}" x2="${f.sx(12)}" y1="${f.sy(D.f.beta[0])}" y2="${f.sy(D.f.beta[0] + 12 * D.f.beta[1])}" stroke="var(--muted)" stroke-width="1.4" stroke-dasharray="4 4"/>`;
    s += `<line x1="${f.sx(0)}" x2="${f.sx(12)}" y1="${f.sy(a)}" y2="${f.sy(a + 12 * b)}" stroke="var(--therapie)" stroke-width="2.6" ${f.clip}/>`;
    p.t.forEach((t, k) => s += `<circle cx="${f.sx(t)}" cy="${f.sy(p.y[k])}" r="4" fill="var(--therapie)" fill-opacity=".75"/>`);
    s += `<text x="8" y="15" class="strong">P${p.id}</text><text x="212" y="15" text-anchor="end">${p.n} Messung${p.n > 1 ? "en" : ""}</text>`;
    return `<svg viewBox="0 0 220 150" role="img" aria-label="Patientin ${p.id}">${s}</svg>`;
  }).join("");
  $("cap1").innerHTML = ["<b>Alle gleich:</b> Die durchgezogene Linie ist in allen 16 Kästchen dieselbe Gerade, eine gewöhnliche Regression über alle Messungen. Wie die einzelne Person liegt, spielt keine Rolle.",
    "<b>Jede für sich:</b> Die durchgezogene Linie ist so hoch, wie es die eigenen Punkte der Person verlangen. Die Steigung ist für alle gleich, das Niveau stammt nur aus den eigenen Messungen.",
    "<b>Gemischtes Modell:</b> Die durchgezogene Linie liegt zwischen den eigenen Punkten und der gestrichelten Linie. Je weniger Punkte, desto näher an der gestrichelten Linie."][view];
  drawKey();
  const one = D.P.find(p => p.n === 1);
  $("cl1").innerHTML = [
    "<b>Alle gleich:</b> Eine einzige Gerade für alle. Die Unterschiede zwischen den Personen werden ignoriert, die Gerade passt zu kaum jemandem.",
    `<b>Jede für sich:</b> Jede Person bekommt ihr eigenes Niveau, berechnet nur aus ihren eigenen Messungen.${one ? ` Bei P${one.id} mit nur einer Messung geht die Linie genau durch diesen einen Wert, auch wenn er ein Ausreißer an einem schlechten Tag war.` : ""}`,
    `<b>Gemischtes Modell:</b> Jede Person bekommt ihr eigenes Niveau, aber es wird umso stärker zum Mittel gezogen, je weniger Messungen sie hat und je stärker es von Termin zu Termin schwankt. Personen mit sieben Messungen behalten fast ihr eigenes Niveau.`][view];
}
function drawKey() {
  const f = frame(300, 150, -1, 13, 0, 10, { P: { L: 34, R: 10, T: 22, B: 26 }, nx: 0, ny: 0 });
  let s = f.s + `<rect x="${f.P.L}" y="${f.P.T}" width="${300 - f.P.L - f.P.R}" height="${150 - f.P.T - f.P.B}" fill="none" stroke="var(--line)"/>`;
  s += `<line x1="${f.sx(-1)}" x2="${f.sx(13)}" y1="${f.sy(5)}" y2="${f.sy(5)}" stroke="var(--grid)" stroke-width="2"/>`;
  [0, 5, 10].forEach(v => s += `<text x="${f.P.L - 6}" y="${f.sy(v) + 4}" text-anchor="end">${v}</text>`);
  [0, 6, 12].forEach(v => s += `<text x="${f.sx(v)}" y="${150 - 8}" text-anchor="middle">${v}</text>`);
  s += `<text x="${f.P.L}" y="14" class="strong">Schmerz (NRS)</text><text x="290" y="14" text-anchor="end">Woche →</text>`;
  s += `<line x1="${f.sx(0)}" x2="${f.sx(12)}" y1="${f.sy(6.5)}" y2="${f.sy(3.5)}" stroke="var(--muted)" stroke-width="1.4" stroke-dasharray="4 4"/>`;
  s += `<line x1="${f.sx(0)}" x2="${f.sx(12)}" y1="${f.sy(7.6)}" y2="${f.sy(4.6)}" stroke="var(--therapie)" stroke-width="2.6"/>`;
  [[0, 8.2], [2, 7.1], [4, 7.4]].forEach(([t, y]) => s += `<circle cx="${f.sx(t)}" cy="${f.sy(y)}" r="4" fill="var(--therapie)" fill-opacity=".75"/>`);
  $("mini-key").innerHTML = s;
}
function draw2() {
  const { P, f } = D, rows = P.length, sm = window.innerWidth < 640, W = sm ? 480 : 900, H = sm ? 600 : 520, top = 36, rh = (H - top - 40) / rows;
  $("c2").setAttribute("viewBox", `0 0 ${W} ${H}`);
  const vals = P.flatMap(p => [f.beta[0] + p.rbar, f.beta[0] + p.u]), lo = Math.floor(Math.min(...vals) - 0.5), hi = Math.ceil(Math.max(...vals) + 0.5);
  const fr = frame(W, H, lo, hi, 0, 1, { P: { L: sm ? 100 : 150, R: 16, T: top, B: 40 }, ny: 0, nx: sm ? 5 : 8, xl: "Schmerz zu Beginn (NRS)" });
  let s = fr.s + `<line x1="${fr.sx(f.beta[0])}" x2="${fr.sx(f.beta[0])}" y1="${top - 8}" y2="${H - 40}" stroke="var(--fg)" stroke-width="1.6" stroke-dasharray="5 4"/><text x="${fr.sx(f.beta[0])}" y="${top - 14}" text-anchor="middle" class="strong">Mittel aller: ${fmt(f.beta[0], 2)}</text>`;
  s += `<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--therapie)"/></marker></defs>`;
  P.forEach((p, i) => {
    const y = top + (i + 0.5) * rh, own = f.beta[0] + p.rbar, bl = f.beta[0] + p.u;
    s += `<g class="row-hit" data-i="${i}"><rect class="bg${i === sel ? " sel" : ""}" x="0" y="${y - rh / 2}" width="${W}" height="${rh}" fill="transparent"/>`;
    s += `<text x="10" y="${y + 4}" class="${i === sel ? "strong" : ""}">P${p.id} · n = ${p.n}</text>`;
    { const xo = fr.sx(own), xb = fr.sx(bl), dir = xb > xo ? 1 : -1; if (Math.abs(xb - xo) > 16) s += `<line x1="${xo + dir * 9}" x2="${xb - dir * 6}" y1="${y}" y2="${y}" stroke="var(--therapie)" stroke-width="2" marker-end="url(#ar)"/>`; }
    s += `<circle cx="${fr.sx(bl)}" cy="${y}" r="4.5" fill="var(--therapie)"/><circle cx="${fr.sx(own)}" cy="${y}" r="8.5" fill="none" stroke="var(--fg)" stroke-width="1.8"/></g>`;
  });
  $("c2").innerHTML = s;
  $("c2").querySelectorAll(".row-hit").forEach(g => g.addEventListener("click", () => { sel = +g.dataset.i; draw2(); }));
  const p = P[sel], d2 = v => tz(fmt(v, 2));
  $("f2").innerHTML = `<span class="dim">P${p.id} mit ${p.n} Messung${p.n > 1 ? "en" : ""}. Geschätzt: τ̂² = ${fmt(D.t2, 2)} (zwischen den Personen), σ̂² = ${fmt(D.s2, 2)} (von Termin zu Termin).</span>` +
    TS(`\\lambda = \\frac{\\hat\\tau^2}{\\hat\\tau^2 + \\hat\\sigma^2 / n} = \\frac{${d2(D.t2)}}{${d2(D.t2)} + ${d2(D.s2)} / ${p.n}} = ${d2(p.lam)}`, `λ = τ² / (τ² + σ²/n) = ${fmt(p.lam, 2)}`) +
    TS(`\\hat u = \\lambda \\cdot \\bar r = ${d2(p.lam)} \\cdot (${d2(p.rbar)}) = ${d2(p.u)}`, `û = λ · r̄ = ${fmt(p.u, 2)}`) +
    `<span class="dim">r̄ ist die mittlere Abweichung der Person vom mittleren Verlauf. Das Modell übernimmt davon den Anteil λ: ${fmt(p.lam * 100, 0)} %.</span>`;
  const few = P.filter(q => q.n <= 2), many = P.filter(q => q.n >= 6);
  const maxShift = Math.max(...P.map(q => Math.abs(q.rbar - q.u)));
  $("cl2").innerHTML = (maxShift < 0.25 ? `<b>Bei dieser Einstellung schrumpft das Modell kaum:</b> Die Unterschiede zwischen den Personen (τ) sind groß im Vergleich zur Schwankung von Termin zu Termin (σ). Kreis und Punkt liegen deshalb fast aufeinander. Schieben Sie σ nach rechts oder τ nach links. ` : "") + (few.length && many.length ? `Bei Personen mit ein oder zwei Messungen übernimmt das Modell im Mittel <b>${fmt(mean(few.map(q => q.lam)) * 100, 0)} %</b> ihrer eigenen Abweichung, bei sechs oder sieben Messungen <b>${fmt(mean(many.map(q => q.lam)) * 100, 0)} %</b>. Erhöhen Sie σ: Je unzuverlässiger die einzelne Messung, desto stärker schrumpft das Modell.` : "Je weniger Messungen eine Person hat, desto stärker zieht das Modell sie zum Mittel.");
}
function draw3() {
  const { f, o, t2, s2, N } = D;
  $("f3").innerHTML = TB(`\\text{Schmerz}_{ij} = \\underbrace{\\beta_0 + \\beta_1 \\cdot \\text{Woche}_{ij}}_{\\text{fest: für alle gleich}} + \\underbrace{u_i}_{\\text{Person } i} + \\underbrace{e_{ij}}_{\\text{Termin } j}, \\quad u_i \\sim N(0, \\tau^2),\\; e_{ij} \\sim N(0, \\sigma^2)`, "Schmerz = β₀ + β₁ · Woche + u_i + e_ij");
  const r = (lab, b, se, d) => { const tc = tinv(0.975, d); return `<tr><td>${lab}</td><td>${fmt(b, 3)}</td><td>${fmt(se, 3)}</td><td>${fmt(b - tc * se, 3)} bis ${fmt(b + tc * se, 3)}</td></tr>`; };
  $("t3").innerHTML = `<thead><tr><th>Steigung pro Woche</th><th>b</th><th>SE</th><th>95-%-KI</th></tr></thead><tbody>` +
    r("Lineare Regression, alle Messungen unabhängig", o.b[1], o.se[1], N - 2) + r("Gemischtes Modell", f.beta[1], f.se[1], N - 2) +
    `<tr class="tot"><td>Streuung zwischen Personen τ̂² = ${fmt(t2, 2)}</td><td colspan="3" style="text-align:left;font-family:inherit;font-weight:400;color:var(--muted)">innerhalb σ̂² = ${fmt(s2, 2)}, ICC = ${fmt(t2 / (t2 + s2), 2)}, ${N} Messungen von ${NP} Personen</td></tr></tbody>`;
  $("cl3").innerHTML = `Die Regression, die alle ${N} Messungen als unabhängig behandelt, schätzt die Steigung mit SE ${fmt(o.se[1], 3)}, das gemischte Modell mit SE ${fmt(f.se[1], 3)}. ` + (f.se[1] < o.se[1] ? "Weil jede Person mit sich selbst verglichen wird, ist die Steigung hier sogar <b>genauer</b>: Die Unterschiede zwischen den Personen landen in τ² statt im Rauschen." : "Hier sind beide etwa gleich genau, weil sich die Personen kaum unterscheiden. Erhöhen Sie τ.") + ` Wahrer Wert in der Simulation: ${fmt(B1, 2)}.`;
}
function all() { simulate(); draw1(); draw2(); draw3(); }
const sync = () => { $("tau-v").textContent = fmt(tau, 1); $("sig-v").textContent = fmt(sig, 1); };
$("pview").addEventListener("click", e => { const b = pick(e, $("pview")); if (!b) return; view = +b.dataset.v; draw1(); });
$("tau").addEventListener("input", e => { tau = +e.target.value; sync(); all();
let wasSmall = window.innerWidth < 640; window.addEventListener("resize", () => { const n = window.innerWidth < 640; if (n !== wasSmall) { wasSmall = n; draw2(); } }); });
$("sig").addEventListener("input", e => { sig = +e.target.value; sync(); all();
let wasSmall = window.innerWidth < 640; window.addEventListener("resize", () => { const n = window.innerWidth < 640; if (n !== wasSmall) { wasSmall = n; draw2(); } }); });
$("draw").addEventListener("click", () => { seed++; sel = 0; all(); });
sync(); all();
let wasSmall = window.innerWidth < 640; window.addEventListener("resize", () => { const n = window.innerWidth < 640; if (n !== wasSmall) { wasSmall = n; draw2(); } });
})();
