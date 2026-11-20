/* Binomialtest · Stats Lab
   Ablehnungsbereich: von außen nach innen, je Seite solange die Summe ≤ α/2 (zweiseitig) bzw. ≤ α (rechtsseitig).
   Zweiseitiger p-Wert: 2 · min(P(X ≤ k), P(X ≥ k)), höchstens 1. Damit gilt p ≤ α genau dann, wenn k im Ablehnungsbereich liegt. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const fmt = (x, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (x, d = 1) => fmt(x * 100, d) + " %";
const readout = (l, v, cls = "") => `<div class="readout ${cls}"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;
const S = { n: 20, p0: 0.5, alpha: 0.05, side: "two", k: 15, anim: null };

function dist() {
  const { n, p0 } = S, pm = [];
  let c = 1; for (let k = 0; k <= n; k++) { pm.push(c * Math.pow(p0, k) * Math.pow(1 - p0, n - k)); c = c * (n - k) / (k + 1); }
  const F = [], G = []; let s = 0; for (let k = 0; k <= n; k++) { s += pm[k]; F.push(Math.min(1, s)); }
  s = 0; for (let k = n; k >= 0; k--) { s += pm[k]; G[k] = Math.min(1, s); }
  const lim = S.side === "two" ? S.alpha / 2 : S.alpha;
  let kL = -1; if (S.side === "two") for (let k = 0; k <= n; k++) if (F[k] <= lim + 1e-12) kL = k; else break;
  let kU = n + 1; for (let k = n; k >= 0; k--) if (G[k] <= lim + 1e-12) kU = k; else break;
  const aL = kL >= 0 ? F[kL] : 0, aU = kU <= n ? G[kU] : 0;
  return { n, pm, F, G, lim, kL, kU, aL, aU, act: aL + aU };
}
const rej = (d, k) => k <= d.kL || k >= d.kU;
const pval = (d, k) => S.side === "two" ? Math.min(1, 2 * Math.min(d.F[k], d.G[k])) : d.G[k];

/* ---------- 1 Balkendiagramm ---------- */
function drawPmf(d) {
  const W = 920, L = 50, R = 900, T = 16, B = 250, n = d.n, k0 = S.k;
  const bw = (R - L) / (n + 1), x = k => L + k * bw, ymax = Math.max(...d.pm) * 1.18, y = v => B - v / ymax * (B - T);
  let s = "";
  [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4].filter(v => v <= ymax).forEach(v => s += `<line x1="${L}" x2="${R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${fmt(v, 2)}</text>`);
  // Animation: wie viele Balken je Seite schon geprüft sind
  const A = S.anim, step = A ? A.step : Infinity;
  const pSide = k0 >= S.n * S.p0 || S.side === "right" ? "up" : "down";
  for (let k = 0; k <= n; k++) {
    const fromL = k, fromR = n - k;
    const checked = S.side === "two" ? Math.min(fromL, fromR) < step : fromR < step;
    const col = A && !checked ? "none" : rej(d, k) ? "var(--kontrolle)" : "var(--line)";
    s += `<rect x="${x(k) + 1.5}" y="${y(d.pm[k])}" width="${bw - 3}" height="${B - y(d.pm[k])}" fill="${col}" stroke="${col === "none" ? "var(--line)" : "none"}" stroke-dasharray="3 3" rx="2"/>`;
    if (!A || checked) s += `<rect x="${x(k) + 1.5}" y="${B + 2}" width="${bw - 3}" height="7" fill="${rej(d, k) ? "var(--kontrolle)" : "var(--line)"}"/>`;
    const extreme = !A && (pSide === "up" ? k >= k0 : k <= k0);
    if (extreme) s += `<rect x="${x(k) + bw * 0.3}" y="${y(d.pm[k])}" width="${bw * 0.4}" height="${B - y(d.pm[k])}" fill="var(--pval)"/>`;
    if (k === k0 && !A) s += `<rect x="${x(k) + 0.5}" y="${y(d.pm[k]) - 1}" width="${bw - 1}" height="${B - y(d.pm[k]) + 1}" fill="none" stroke="var(--pval)" stroke-width="2.5" rx="2"/><text class="strong" x="${x(k) + bw / 2}" y="${y(d.pm[k]) - 8}" text-anchor="middle">k = ${k}</text>`;
    if (n <= 30 || k % 5 === 0) s += `<text x="${x(k) + bw / 2}" y="${B + 24}" text-anchor="middle">${k}</text>`;
  }
  s += `<line x1="${L}" x2="${R}" y1="${B}" y2="${B}" stroke="var(--line)"/>`;
  // Klammern für die Bereiche
  const br = (k1, k2, txt, col) => { if (k2 < k1) return ""; const a = x(k1) + 2, b = x(k2 + 1) - 2; return `<path d="M${a} ${B + 32} v6 H${b} v-6" fill="none" stroke="${col}" stroke-width="2"/><text x="${(a + b) / 2}" y="${B + 54}" text-anchor="middle" style="fill:${col}">${txt}</text>`; };
  if (!A) {
    if (d.kL >= 0) s += br(0, d.kL, `k ≤ ${d.kL}`, "var(--alpha-ink)");
    s += br(d.kL + 1, Math.min(n, d.kU - 1), "Annahmebereich", "var(--accent)");
    if (d.kU <= n) s += br(d.kU, n, `k ≥ ${d.kU}`, "var(--alpha-ink)");
  } else s += `<text x="${(L + R) / 2}" y="${B + 52}" text-anchor="middle" class="strong">${A.msg}</text>`;
  s += `<text x="${R}" y="${T + 4}" text-anchor="end">Trefferzahl unter H0: Binomial(n = ${n}, p0 = ${fmt(S.p0, 2)})</text>`;
  $("pmf").innerHTML = s;
}

function build() {
  const d = dist(); let step = 0;
  const run = () => {
    let sumL = 0, sumR = 0; const lim = d.lim; let msg;
    for (let i = 0; i < step; i++) { if (S.side === "two" && i <= d.kL) sumL += d.pm[i]; if (d.n - i >= d.kU) sumR += d.pm[d.n - i]; }
    const nextR = d.n - step, nextL = step;
    const sumTxt = S.side === "two" ? `links ${fmt(sumL, 4)} · rechts ${fmt(sumR, 4)} · Grenze je Seite α/2 = ${fmt(lim, 3)}` : `rechts ${fmt(sumR, 4)} · Grenze α = ${fmt(lim, 3)}`;
    const stopR = nextR < d.kU, stopL = S.side !== "two" || nextL > d.kL;
    msg = stopR && stopL ? `Nächster Balken würde die Grenze überschreiten. Fertig: ${sumTxt}` : `Prüfe Balken ${S.side === "two" ? nextL + " und " : ""}${nextR}: ${sumTxt}`;
    S.anim = { step, msg }; drawPmf(d);
    if (stopR && stopL) { setTimeout(() => { S.anim = null; render(); }, 1400); return; }
    step++; setTimeout(run, 650);
  };
  run();
}

/* ---------- 2 Verteilungsfunktion und Tabelle ---------- */
function drawCdf(d) {
  const L = 70, R = 900, T = 16, B = 240, n = d.n, bw = (R - L) / (n + 1), x = k => L + k * bw, y = p => B - p * (B - T);
  let s = "";
  [0, 0.25, 0.5, 0.75, 1].forEach(p => s += `<line x1="${L}" x2="${R}" y1="${y(p)}" y2="${y(p)}" stroke="var(--grid)"/><text x="${L - 8}" y="${y(p) + 4}" text-anchor="end">${fmt(p, 2)}</text>`);
  const hi = 1 - d.lim, lo = d.lim;
  for (let k = 0; k <= n; k++) {
    const col = rej(d, k) ? "var(--kontrolle)" : "var(--fg)";
    s += `<line x1="${x(k)}" x2="${x(k + 1)}" y1="${y(d.F[k])}" y2="${y(d.F[k])}" stroke="${col}" stroke-width="3"/>`;
    if (k > 0) s += `<line x1="${x(k)}" x2="${x(k)}" y1="${y(d.F[k - 1])}" y2="${y(d.F[k])}" stroke="var(--line)" stroke-dasharray="2 3"/>`;
    if (n <= 30 || k % 5 === 0) s += `<text x="${x(k) + bw / 2}" y="${B + 16}" text-anchor="middle">${k}</text>`;
  }
  if (S.side === "two") s += `<line x1="${L}" x2="${R}" y1="${y(lo)}" y2="${y(lo)}" stroke="var(--alpha-ink)" stroke-dasharray="6 4"/><text x="${R}" y="${y(lo) - 6}" text-anchor="end" style="fill:var(--alpha-ink)">α/2 = ${fmt(lo, 3)}</text>`;
  s += `<line x1="${L}" x2="${R}" y1="${y(hi)}" y2="${y(hi)}" stroke="var(--alpha-ink)" stroke-dasharray="6 4"/><text x="${L + 6}" y="${y(hi) - 6}" style="fill:var(--alpha-ink)">${S.side === "two" ? "1 − α/2" : "1 − α"} = ${fmt(hi, 3)}</text>`;
  if (d.kL >= 0) s += `<circle cx="${x(d.kL) + bw / 2}" cy="${y(d.F[d.kL])}" r="5" fill="var(--alpha-ink)"/><text class="strong" x="${x(d.kL) + bw / 2}" y="${y(d.F[d.kL]) - 10}" text-anchor="middle" style="fill:var(--alpha-ink)">F(${d.kL}) = ${fmt(d.F[d.kL], 3)}</text>`;
  if (d.kU <= n && d.kU > 0) s += `<circle cx="${x(d.kU - 1) + bw / 2}" cy="${y(d.F[d.kU - 1])}" r="5" fill="var(--alpha-ink)"/><text class="strong" x="${x(d.kU - 1) + bw / 2}" y="${y(d.F[d.kU - 1]) + 22}" text-anchor="middle" style="fill:var(--alpha-ink)">F(${d.kU - 1}) = ${fmt(d.F[d.kU - 1], 3)}</text>`;
  s += `<text x="${R}" y="${B + 40}" text-anchor="end">k · Trefferzahl</text><text x="18" y="${(T + B) / 2}" transform="rotate(-90 18 ${(T + B) / 2})" text-anchor="middle">F(k) = P(X ≤ k)</text>`;
  $("cdf").innerHTML = s;
  let t = `<thead><tr><th>k</th><th>P(X = k)</th><th>F(k) = P(X ≤ k)</th><th>P(X ≥ k)</th><th>Bereich</th></tr></thead><tbody>`;
  for (let k = 0; k <= n; k++) t += `<tr class="${rej(d, k) ? "rej" : ""} ${k === S.k ? "obs" : ""}"><td>${k}</td><td>${fmt(d.pm[k], 4)}</td><td>${fmt(d.F[k], 4)}</td><td>${fmt(d.G[k], 4)}</td><td>${rej(d, k) ? "Ablehnung" : "Annahme"}</td></tr>`;
  $("tab").innerHTML = t + "</tbody>";
}

/* ---------- 3 Ergebnis ---------- */
function drawSteps(d) {
  const k = S.k, n = d.n, e = n * S.p0, p = pval(d, k), inR = rej(d, k), up = k >= e;
  const tail = up ? `P(X ≥ ${k}) = ${fmt(d.G[k], 4)}` : `P(X ≤ ${k}) = ${fmt(d.F[k], 4)}`;
  const pLine = S.side === "two"
    ? `p = 2 · min(P(X ≤ ${k}), P(X ≥ ${k})) = 2 · ${fmt(Math.min(d.F[k], d.G[k]), 4)} = ${fmt(p, 4)}${p >= 1 ? " (höchstens 1)" : ""}`
    : `p = P(X ≥ ${k}) = ${fmt(p, 4)}`;
  const region = (d.kL >= 0 ? `k ≤ ${d.kL}` : "") + (d.kL >= 0 && d.kU <= n ? " oder " : "") + (d.kU <= n ? `k ≥ ${d.kU}` : "") || "leer";
  $("steps").innerHTML =
    `<li><b>Erwartung unter H0.</b> Bei reinem Raten wären im Mittel n · p<sub>0</sub> Treffer zu erwarten.<span class="eq">${n} · ${fmt(S.p0, 2)} = ${fmt(e, 1)}</span></li>` +
    `<li><b>Ergebnis einordnen.</b> Beobachtet sind ${k} Treffer.<span class="eq">Ablehnungsbereich: ${region} → k = ${k} liegt im ${inR ? "Ablehnungsbereich" : "Annahmebereich"}</span></li>` +
    `<li><b>p-Wert berechnen.</b> Wie wahrscheinlich ist unter H0 ein Ergebnis, das mindestens so extrem ist wie ${k}? ${S.side === "two" ? "Zweiseitig zählt auch die Gegenrichtung, daher mal 2." : "Rechtsseitig zählt nur die obere Richtung."}<span class="eq">${S.side === "two" ? tail + "<br>" : ""}${pLine}</span></li>` +
    `<li><b>Entscheiden.</b> Beide Wege führen zum selben Ergebnis.<span class="eq">p = ${fmt(p, 4)} ${p <= S.alpha ? "≤" : ">"} α = ${fmt(S.alpha, 2)} → ${p <= S.alpha ? "H0 verwerfen: mehr als Raten" : "H0 beibehalten: mit Raten vereinbar"}</span></li>`;
}

function render() {
  $("n-v").textContent = S.n; $("p0-v").textContent = fmt(S.p0, 2); $("k-v").textContent = S.k;
  $("k").max = S.n; if (S.k > S.n) { S.k = S.n; $("k").value = S.n; }
  const d = dist();
  drawPmf(d); drawCdf(d); drawSteps(d);
  const region = (d.kL >= 0 ? `k ≤ ${d.kL}` : "") + (d.kL >= 0 && d.kU <= d.n ? " oder " : "") + (d.kU <= d.n ? `k ≥ ${d.kU}` : "") || "leer";
  const acc = `${d.kL + 1} bis ${Math.min(d.n, d.kU - 1)}`;
  $("r1").innerHTML = readout("Ablehnungsbereich", region, "r-alpha") + readout("Annahmebereich", acc) + readout("tatsächliches α", pct(d.act, 1), "r-alpha") + readout("erwartete Treffer unter H0", fmt(d.n * S.p0, 1));
  // Was wäre mit einem Balken mehr?
  const extra = S.side === "two" ? Math.min(d.kL + 1 <= d.n ? d.pm[d.kL + 1] : 1, d.kU - 1 >= 0 ? d.pm[d.kU - 1] : 1) : (d.kU - 1 >= 0 ? d.pm[d.kU - 1] : 1);
  $("c1").innerHTML = `Der Ablehnungsbereich schöpft α nicht ganz aus: Das tatsächliche α liegt bei <b>${pct(d.act, 1)}</b> statt ${pct(S.alpha, 0)}. Nähme man noch einen Balken dazu, käme mindestens ${pct(d.act + extra, 1)} heraus${S.side === "two" ? " (auf einer Seite schon mehr als α/2)" : ""}. Bei diskreten Verteilungen ist der Test deshalb etwas konservativ.`;
  $("build-note").textContent = "";
}

const seg = (id, key, conv) => $(id).addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; $(id).querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); S[key] = conv(b.dataset[key === "alpha" ? "a" : "s"]); S.anim = null; render(); });
seg("alpha", "alpha", Number); seg("side", "side", String);
$("n").addEventListener("input", e => { S.n = +e.target.value; S.anim = null; render(); });
$("p0").addEventListener("input", e => { S.p0 = +e.target.value; S.anim = null; render(); });
$("k").addEventListener("input", e => { S.k = +e.target.value; render(); });
$("build").onclick = build;
render();
})();
