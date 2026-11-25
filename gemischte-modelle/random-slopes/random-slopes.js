/* Jeder Verlauf ist anders · Stats Lab
   1: zwanzig Verläufe, Random Intercept gegen Random Intercept und Slope (REML, lmm.js).
   2: RCT mit Training und Kontrolle, Wechselwirkung Gruppe × Woche mit Random Slope. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const { fmt, fp, rng, rnorm, frame, pick, tz } = window.GM;
const { tcdf, tinv } = window.REG;
const TS = (t, fb) => window.katex ? texSteps(t) : fb;
const WEEKS = [0, 2, 4, 6, 8, 10, 12], B0 = 6.5, B1 = -0.25, T0 = 1.0, SIG = 0.8;

function persons(seed, n, slopeMean, slopeSD, grp = 0) {
  const u = rng(seed), z = rnorm(u), out = [];
  for (let i = 0; i < n; i++) { const a = B0 + T0 * z(), b = slopeMean + slopeSD * z(); out.push({ grp, a, b, y: WEEKS.map(t => a + b * t + SIG * z()) }); }
  return out;
}
function stack(P, X) { const y = [], XX = [], Z1 = [], Z2 = [], g = []; P.forEach((p, i) => WEEKS.forEach((t, k) => { y.push(p.y[k]); XX.push(X(p, t)); Z1.push([1]); Z2.push([1, t]); g.push(i); })); return { y, XX, Z1, Z2, g }; }

/* ---------- 1 ---------- */
let ts = 0.16, s1 = 21, m1 = 1, A = null;
function fit1() {
  const P = persons(s1, 20, B1, ts), S = stack(P, (p, t) => [1, t]);
  A = { P, ri: window.LMM.fit(S.y, S.XX, S.Z1, S.g), rs: window.LMM.fit(S.y, S.XX, S.Z2, S.g) };
}
function draw1() {
  const { P, ri, rs } = A, M = m1 ? rs : ri, all = P.flatMap(p => p.y), lo = Math.floor(Math.min(0, ...all)), hi = Math.ceil(Math.max(10, ...all));
  const fa = frame(520, 400, -0.5, 12.5, lo, hi, { P: { L: 46, R: 12, T: 12, B: 44 }, xl: "Woche", yl: "Schmerz (NRS)", nx: 7 });
  let s = fa.s;
  P.forEach(p => s += `<polyline points="${WEEKS.map((t, k) => `${fa.sx(t)},${fa.sy(p.y[k])}`).join(" ")}" fill="none" stroke="var(--kontrolle)" stroke-opacity=".55" stroke-width="1.4"/>`);
  $("c1a").innerHTML = s;
  const fb = frame(520, 400, -0.5, 12.5, lo, hi, { P: { L: 46, R: 12, T: 12, B: 44 }, xl: "Woche", yl: "Schmerz (NRS)", nx: 7 });
  s = fb.s;
  M.blup.forEach(u => { const a = M.beta[0] + u[0], b = M.beta[1] + (m1 ? u[1] : 0); s += `<line x1="${fb.sx(0)}" x2="${fb.sx(12)}" y1="${fb.sy(a)}" y2="${fb.sy(a + 12 * b)}" stroke="var(--kontrolle)" stroke-width="1.6" stroke-opacity=".8" ${fb.clip}/>`; });
  s += `<line x1="${fb.sx(0)}" x2="${fb.sx(12)}" y1="${fb.sy(M.beta[0])}" y2="${fb.sy(M.beta[0] + 12 * M.beta[1])}" stroke="var(--fg)" stroke-width="4"/>`;
  $("c1b").innerHTML = s;
  $("c1b-cap").textContent = m1 ? "Verläufe laut Modell: eigenes Niveau und eigene Steigung" : "Verläufe laut Modell: eigenes Niveau, gleiche Steigung";
  const df = P.length - 1, row = (lab, f, hl) => { const tc = tinv(0.975, df); return `<tr class="${hl ? "hl" : ""}"><td>${lab}</td><td>${fmt(f.beta[1], 3)}</td><td>${fmt(f.se[1], 3)}</td><td>${fmt(f.beta[1] - tc * f.se[1], 3)} bis ${fmt(f.beta[1] + tc * f.se[1], 3)}</td><td>${f.G.length > 1 ? fmt(Math.sqrt(f.G[1][1]), 3) : "nicht geschätzt"}</td></tr>`; };
  $("t1").innerHTML = `<thead><tr><th>Modell</th><th>Steigung pro Woche</th><th>SE</th><th>95-%-KI</th><th>SD der Steigungen</th></tr></thead><tbody>${row("Random Intercept", ri, !m1)}${row("Random Intercept und Slope", rs, m1)}</tbody>`;
  const worse = rs.blup.filter(u => rs.beta[1] + u[1] > 0).length, ratio = rs.se[1] / ri.se[1];
  $("cl1").innerHTML = ts < 0.03 ? `Bei fast gleichen Steigungen liefern beide Modelle praktisch dasselbe. Der Random Slope kostet dann nur einen Parameter.` :
    `Ohne Random Slope ist der Standardfehler der Steigung <b>${fmt(ratio, 1)}-mal zu klein</b> (${fmt(ri.se[1], 3)} statt ${fmt(rs.se[1], 3)}). Das Modell tut so, als verliefen alle gleich, und überschätzt deshalb, wie genau der mittlere Verlauf bekannt ist. Laut Random-Slope-Modell nimmt der Schmerz bei <b>${worse} von 20</b> Personen sogar zu.`;
}

/* ---------- 2 ---------- */
let dd = 0.12, s2 = 7, B = null;
function fit2() {
  const P = [...persons(s2, 15, -0.1, 0.12, 0), ...persons(s2 + 1000, 15, -0.1 - dd, 0.12, 1)];
  const S = stack(P, (p, t) => [1, t, p.grp, p.grp * t]);
  B = { P, f: window.LMM.fit(S.y, S.XX, S.Z2, S.g) };
}
function draw2() {
  const { P, f } = B, lo = 0, hi = 11;
  const sm = window.innerWidth < 640, W = sm ? 520 : 900, H = sm ? 440 : 400;
  $("c2").setAttribute("viewBox", `0 0 ${W} ${H}`);
  const fr = frame(W, H, -0.5, 12.5, lo, hi, { P: { L: 46, R: sm ? 120 : 150, T: 14, B: 44 }, xl: "Woche", yl: "Schmerz (NRS)", nx: 7 });
  let s = fr.s;
  P.forEach((p, i) => { const u = f.blup[i], a = f.beta[0] + f.beta[2] * p.grp + u[0], b = f.beta[1] + f.beta[3] * p.grp + u[1];
    s += `<line x1="${fr.sx(0)}" x2="${fr.sx(12)}" y1="${fr.sy(a)}" y2="${fr.sy(a + 12 * b)}" stroke="${p.grp ? "var(--therapie)" : "var(--kontrolle)"}" stroke-width="1.3" stroke-opacity=".5" ${fr.clip}/>`; });
  [0, 1].forEach(g => { const a = f.beta[0] + f.beta[2] * g, b = f.beta[1] + f.beta[3] * g, col = g ? "var(--therapie)" : "var(--kontrolle-ink)";
    s += `<line x1="${fr.sx(0)}" x2="${fr.sx(12)}" y1="${fr.sy(a)}" y2="${fr.sy(a + 12 * b)}" stroke="${col}" stroke-width="5"/><text x="${fr.sx(12) + 10}" y="${fr.sy(a + 12 * b) + 5}" class="strong halo" style="fill:${col}">${g ? "Training" : "Standard"} ${fmt(a + 12 * b, 1)}</text>`; });
  $("c2").innerHTML = s;
  const b3 = f.beta[3], se3 = f.se[3];
  $("f2").innerHTML = TS(`\\Delta_{\\text{Woche 12}} = \\hat\\beta_2 + 12 \\cdot \\hat\\beta_3 = ${tz(fmt(f.beta[2], 2))} + 12 \\cdot (${tz(fmt(b3, 3))}) = ${tz(fmt(f.beta[2] + 12 * b3, 2))}`, `Δ Woche 12 = β₂ + 12 · β₃ = ${fmt(f.beta[2] + 12 * b3, 2)}`) + `<span class="dim">Δ: geschätzter Unterschied Training minus Standard in Woche 12.</span>`;
  const df = P.length - 2, tc = tinv(0.975, df), names = ["Achsenabschnitt (Standard, Woche 0)", "Woche (Steigung Standard)", "Gruppe Training (Unterschied in Woche 0)", "Woche × Training (Zusatz pro Woche)"];
  $("t2").innerHTML = `<thead><tr><th>Fester Effekt</th><th>b</th><th>SE</th><th>t</th><th>p</th><th>95-%-KI</th></tr></thead><tbody>` +
    f.beta.map((b, i) => { const t = b / f.se[i], p = 2 * (1 - tcdf(Math.abs(t), df)); return `<tr class="${i === 3 ? "hl" : ""}"><td>${names[i]}</td><td>${fmt(b, 3)}</td><td>${fmt(f.se[i], 3)}</td><td>${fmt(t, 2)}</td><td>${fp(p)}</td><td>${fmt(b - tc * f.se[i], 3)} bis ${fmt(b + tc * f.se[i], 3)}</td></tr>`; }).join("") +
    `<tr class="tot"><td>Zufallseffekte</td><td colspan="5" style="text-align:left;font-family:inherit;font-weight:400;color:var(--muted)">SD Niveau ${fmt(Math.sqrt(f.G[0][0]), 2)}, SD Steigung ${fmt(Math.sqrt(f.G[1][1]), 3)}, SD Messfehler ${fmt(Math.sqrt(f.s2), 2)} · REML, df = ${df} (Personen − 2)</td></tr></tbody>`;
  const p3 = 2 * (1 - tcdf(Math.abs(b3 / se3), df));
  $("cl2").innerHTML = `Die entscheidende Zeile ist die Wechselwirkung: In der Trainingsgruppe sinkt der Schmerz pro Woche um <b>${fmt(-b3, 3)} Punkte</b> stärker (95-%-KI ${fmt(-(b3 + tc * se3), 3)} bis ${fmt(-(b3 - tc * se3), 3)}, p ${p3 < 0.001 ? "< 0,001" : "= " + fmt(p3, 3)}). Wahrer Wert: ${fmt(dd, 2)}. Der Gruppen-Haupteffekt beschreibt nur den Unterschied in Woche 0. Dank Randomisierung weicht er nur zufällig von null ab.` + (p3 >= 0.05 && dd > 0 ? " Nicht signifikant heißt hier nicht „kein Effekt“: Mit 30 Personen ist die Power für Wechselwirkungen gering." : "");
}

/* ---------- Bedienung ---------- */
const sync = () => { $("ts-v").textContent = fmt(ts, 2); $("dd-v").textContent = fmt(dd, 2); };
$("rs-m").addEventListener("click", e => { const b = pick(e, $("rs-m")); if (!b) return; m1 = +b.dataset.k; draw1(); });
$("ts").addEventListener("input", e => { ts = +e.target.value; sync(); fit1(); draw1(); });
$("draw1").addEventListener("click", () => { s1++; fit1(); draw1(); });
$("dd").addEventListener("input", e => { dd = +e.target.value; sync(); fit2(); draw2(); });
$("draw2").addEventListener("click", () => { s2++; fit2(); draw2(); });
sync(); fit1(); draw1(); fit2(); draw2();
let wasSmall = window.innerWidth < 640; window.addEventListener("resize", () => { const n = window.innerWidth < 640; if (n !== wasSmall) { wasSmall = n; draw2(); } });
})();
