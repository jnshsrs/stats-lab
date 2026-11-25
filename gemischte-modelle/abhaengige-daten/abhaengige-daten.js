/* Abhängige Daten · Stats Lab
   Cluster-randomisiertes RCT mit zehn Praxen: naiver t-Test gegen gemischtes Modell (Zufallsachsenabschnitt Praxis),
   Simulation des Fehlers 1. Art, Designeffekt, ICC-Bild. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const { fmt, fp, rng, rnorm, frame, pick, mean, ttest, tz } = window.GM;
const { tcdf, tinv, pnorm } = window.REG;
const TS = (t, fb) => window.katex ? texSteps(t) : fb;
const TB = (t, fb) => window.katex ? texBlock(t) : fb;
const K = 10, SDT = 2, BASE = 3;
const small = () => window.innerWidth < 640;
let icc = 0.1, m = 20, eff = 0, seed = 11, data = null;

function simulate(sd, icc, m, eff) {
  const u = rng(sd), z = rnorm(u), tau = Math.sqrt(icc) * SDT, sig = Math.sqrt(1 - icc) * SDT, d = [];
  for (let k = 0; k < K; k++) { const arm = k >= K / 2 ? 1 : 0, uk = tau * z(); for (let i = 0; i < m; i++) d.push({ k, arm, y: BASE + eff * arm + uk + sig * z(), j: u() }); }
  return d;
}
function analyse(d) {
  const naive = ttest(d.filter(r => !r.arm).map(r => r.y), d.filter(r => r.arm).map(r => r.y));
  const f = window.LMM.fit(d.map(r => r.y), d.map(r => [1, r.arm]), d.map(() => [1]), d.map(r => r.k));
  const df = K - 2, t = f.beta[1] / f.se[1];
  const mix = { d: f.beta[1], se: f.se[1], t, df, p: 2 * (1 - tcdf(Math.abs(t), df)), tau2: f.G[0][0], s2: f.s2 };
  return { naive, mix };
}

function draw1() {
  data = simulate(seed, icc, m, eff);
  const res = analyse(data), xs = k => k + (k >= K / 2 ? 0.8 : 0);
  const ys = data.map(r => r.y), lo = Math.min(-2, Math.floor(Math.min(...ys))), hi = Math.max(9, Math.ceil(Math.max(...ys)));
  const W = small() ? 520 : 900, H = small() ? 420 : 380;
  $("c1").setAttribute("viewBox", `0 0 ${W} ${H}`);
  const f = frame(W, H, -0.7, K - 1 + 0.8 + 0.7, lo, hi, { P: { L: small() ? 40 : 56, R: 8, T: 30, B: 40 }, nx: 0, yl: small() ? "" : "Verbesserung in NRS-Punkten" });
  let s = f.s;
  [0, 1].forEach(arm => {
    const ks = [...Array(K / 2)].map((_, i) => i + arm * K / 2), am = mean(data.filter(r => r.arm === arm).map(r => r.y));
    s += `<line x1="${f.sx(xs(ks[0]) - 0.45)}" x2="${f.sx(xs(ks[4]) + 0.45)}" y1="${f.sy(am)}" y2="${f.sy(am)}" stroke="var(--fg)" stroke-width="2" stroke-dasharray="6 5"/>`;
    s += `<text x="${(f.sx(xs(ks[0])) + f.sx(xs(ks[4]))) / 2}" y="18" text-anchor="middle" class="strong">${arm ? (small() ? "Übung" : "Übungsprogramm") : (small() ? "Standard" : "Standardbehandlung")} · Mittel ${fmt(am, 2)}</text>`;
  });
  for (let k = 0; k < K; k++) {
    const col = k >= K / 2 ? "var(--therapie)" : "var(--kontrolle)", pts = data.filter(r => r.k === k);
    pts.forEach(r => s += `<circle cx="${f.sx(xs(k) + (r.j - 0.5) * 0.6)}" cy="${f.sy(r.y)}" r="${m > 25 ? 2.6 : 3.4}" fill="${col}" fill-opacity=".55"/>`);
    const pm = mean(pts.map(r => r.y));
    s += `<line x1="${f.sx(xs(k) - 0.36)}" x2="${f.sx(xs(k) + 0.36)}" y1="${f.sy(pm)}" y2="${f.sy(pm)}" stroke="var(--fg)" stroke-width="3.5"/>`;
    s += `<text x="${f.sx(xs(k))}" y="${H - 40 + 20}" text-anchor="middle">P${k + 1}</text>`;
  }
  $("c1").innerHTML = s;
  const row = (lab, r, n) => { const tc = tinv(0.975, r.df); return `<tr><td>${lab}</td><td>${fmt(r.d, 2)}</td><td>${fmt(r.se, 2)}</td><td>${fmt(r.d - tc * r.se, 2)} bis ${fmt(r.d + tc * r.se, 2)}</td><td>${n}</td><td>${fp(r.p)}</td></tr>`; };
  $("t1").innerHTML = `<thead><tr><th>Auswertung</th><th>Unterschied</th><th>SE</th><th>95-%-KI</th><th>df</th><th>p</th></tr></thead><tbody>${row("t-Test, alle Patientinnen als unabhängig", res.naive, res.naive.df)}${row("Gemischtes Modell, Praxis als Zufallseffekt", res.mix, res.mix.df)}</tbody>`;
  const ratio = res.mix.se / res.naive.se, iccHat = res.mix.tau2 / (res.mix.tau2 + res.mix.s2);
  const sigN = res.naive.p < 0.05, sigM = res.mix.p < 0.05;
  let c = `Geschätzte ICC in dieser Studie: <b>${fmt(iccHat, 2)}</b>. Der Standardfehler des gemischten Modells ist <b>${fmt(ratio, 1)}-mal</b> so groß wie der des naiven t-Tests. `;
  if (sigN && !sigM) c += eff ? "Der naive t-Test ist signifikant, das gemischte Modell nicht: Hier sind zehn Praxen zu wenig, um einen Effekt von 1 Punkt sicher zu erkennen." : "<b>Der naive t-Test meldet einen Effekt, den es nicht gibt.</b> Er hält Unterschiede zwischen den Praxen für einen Behandlungseffekt.";
  else if (sigN && sigM) c += "Beide Auswertungen sind signifikant, das Konfidenzintervall des naiven t-Tests ist aber zu schmal.";
  else if (!sigN && !sigM) c += eff ? "Keine Auswertung findet den wahren Effekt. Ziehen Sie mehrere Studien: Mit zehn Praxen ist die Power gering." : "Hier liegen beide richtig. Ziehen Sie ein paar neue Studien: Der naive t-Test wird deutlich öfter fälschlich signifikant.";
  else c += "Das gemischte Modell ist signifikant, der naive t-Test nicht. Das kommt selten vor, etwa wenn die Praxen sich zufällig kaum unterscheiden.";
  if (icc === 0) c = `Bei ICC = 0 unterscheiden sich die Praxen nicht systematisch. Dann sind beide Auswertungen nahezu gleich, das gemischte Modell hat nur weniger Freiheitsgrade. Geschätzte ICC: ${fmt(iccHat, 2)}.`;
  $("cl1").innerHTML = c;
}

/* ---------- 2 Simulation und Designeffekt ---------- */
function sim() {
  const R = 1000, u = rng(seed * 7919 + Math.round(icc * 100) * 31 + m), z = rnorm(u), tau = Math.sqrt(icc) * SDT, sig = Math.sqrt(1 - icc) * SDT;
  let hitN = 0, hitM = 0;
  for (let r = 0; r < R; r++) {
    const a = [], b = [], ma = [], mb = [];
    for (let k = 0; k < K; k++) { const uk = tau * z(), arr = k < K / 2 ? a : b; let sm = 0; for (let i = 0; i < m; i++) { const y = BASE + uk + sig * z(); arr.push(y); sm += y; } (k < K / 2 ? ma : mb).push(sm / m); }
    if (ttest(a, b).p < 0.05) hitN++;
    if (ttest(ma, mb).p < 0.05) hitM++;
  }
  const bar = (lab, v, col) => `<div class="row"><span>${lab}</span><span class="bar"><i style="width:${Math.min(100, v / 0.5 * 100)}%;background:${col}"></i><b style="position:absolute;left:10%;top:-3px;bottom:-3px;width:2px;background:var(--fg)"></b></span><span class="val">${fmt(v * 100, 1)} %</span></div>`;
  $("mt").innerHTML = bar("naiver t-Test", hitN / R, "var(--beta-ink)") + bar("gemischtes Modell", hitM / R, "var(--therapie)") + `<p class="note">Senkrechter Strich: 5 %. Skala bis 50 %. Bei gleich großen Praxen entspricht das gemischte Modell dem t-Test auf die zehn Praxis-Mittelwerte, deshalb wird es hier so gerechnet.</p>`;
  $("sim-n").textContent = `ICC ${fmt(icc, 2)}, ${m} pro Praxis`;
  $("cl2").innerHTML = hitN / R > 0.08 ? `Der naive t-Test wird in <b>${fmt(hitN / R * 100, 0)} %</b> der Studien signifikant, obwohl das Übungsprogramm nichts bewirkt. Das gemischte Modell hält mit ${fmt(hitM / R * 100, 1)} % das vereinbarte α von 5 % ein.` : `Bei dieser kleinen ICC und Praxisgröße fällt der Fehler des naiven t-Tests (${fmt(hitN / R * 100, 1)} %) noch kaum auf. Erhöhen Sie ICC oder Praxisgröße.`;
}
function design() {
  const DE = 1 + (m - 1) * icc, N = K * m;
  $("f2").innerHTML = TS(`\\text{DE} = 1 + (m - 1)\\cdot\\text{ICC} = 1 + (${m} - 1)\\cdot ${tz(fmt(icc, 2))} = ${tz(fmt(DE, 2))}`, `DE = 1 + (m − 1) · ICC = ${fmt(DE, 2)}`) +
    TS(`n_{\\text{eff}} = \\frac{N}{\\text{DE}} = \\frac{${N}}{${tz(fmt(DE, 2))}} = ${tz(fmt(N / DE, 0))}`, `n_eff = N / DE = ${fmt(N / DE, 0)}`) +
    `<span class="dim">${N} Patientinnen in ${K} Praxen sind so viel wert wie ${fmt(N / DE, 0)} unabhängige Personen. Untergrenze ist die Zahl der Praxen: Bei sehr großer ICC zählt jede Praxis nur noch wie eine Person.</span>`;
  const ICC = [0.01, 0.02, 0.05, 0.1, 0.2], M = [5, 10, 20, 40], a = (i, mm) => 2 * (1 - pnorm(1.96 / Math.sqrt(1 + (mm - 1) * i)));
  $("t2").innerHTML = `<thead><tr><th>tatsächliches α des naiven t-Tests</th>${M.map(x => `<th>${x} pro Praxis</th>`).join("")}</tr></thead><tbody>` +
    ICC.map(i => `<tr${Math.abs(i - icc) < 1e-9 ? ' class="dd"' : ""}><td>ICC ${fmt(i, 2)}</td>${M.map(x => `<td${x === m && Math.abs(i - icc) < 1e-9 ? ' class="diff"' : ""}>${fmt(a(i, x) * 100, 0)} %</td>`).join("")}</tr>`).join("") + `</tbody>`;
}

/* ---------- 3 ICC-Bild ---------- */
function draw3() {
  $("f3").innerHTML = TB(`\\text{ICC} = \\frac{\\tau^2}{\\tau^2 + \\sigma^2} = \\frac{\\text{Streuung zwischen den Gruppen}}{\\text{gesamte Streuung}}`, "ICC = τ² / (τ² + σ²)");
  const panel = (iv, sd) => {
    const u = rng(sd), z = rnorm(u), f = frame(420, 260, -0.6, 5.6, -5, 5, { P: { L: 16, R: 10, T: 30, B: 14 }, nx: 0, ny: 0 });
    let s = f.s + `<text x="16" y="18" class="strong">ICC = ${fmt(iv, 1)}</text>`;
    for (let g = 0; g < 6; g++) { const ug = Math.sqrt(iv) * 1.6 * z(); const pts = [...Array(8)].map(() => ug + Math.sqrt(1 - iv) * 1.6 * z());
      s += `<line x1="${f.sx(g - 0.35)}" x2="${f.sx(g + 0.35)}" y1="${f.sy(ug)}" y2="${f.sy(ug)}" stroke="var(--fg)" stroke-width="2.5"/>`;
      pts.forEach((y, i) => s += `<circle cx="${f.sx(g + (i - 3.5) * 0.07)}" cy="${f.sy(y)}" r="4" fill="var(--therapie)" fill-opacity=".6"/>`); }
    return `<figure><svg class="chart" viewBox="0 0 420 260" role="img" aria-label="Sechs Gruppen bei ICC ${fmt(iv, 1)}">${s}</svg><figcaption>${iv === 0 ? "Gruppen unterscheiden sich nicht: jede Messung zählt voll" : iv < 0.5 ? "Gruppen unterscheiden sich etwas" : "Gruppen unterscheiden sich stark: Messungen einer Gruppe sind fast gleich"}</figcaption></figure>`;
  };
  $("c3").innerHTML = panel(0, 5) + panel(0.8, 5);
}

/* ---------- Bedienung ---------- */
const sync = () => { $("icc-v").textContent = fmt(icc, 2); $("m-v").textContent = m; };
$("icc").addEventListener("input", e => { icc = +e.target.value; sync(); draw1(); design(); });
$("m").addEventListener("input", e => { m = +e.target.value; sync(); draw1(); design(); });
$("eff").addEventListener("click", e => { const b = pick(e, $("eff")); if (!b) return; eff = +b.dataset.e; draw1(); });
$("draw").addEventListener("click", () => { seed++; draw1(); });
$("sim").addEventListener("click", sim);
sync(); draw1(); design(); draw3();
let wasSmall = small(); window.addEventListener("resize", () => { if (small() !== wasSmall) { wasSmall = small(); draw1(); } });
$("mt").innerHTML = `<p class="note">Noch nicht simuliert.</p>`; $("cl2").textContent = "Klicken Sie auf „1.000 Studien ohne Effekt simulieren“.";
})();
