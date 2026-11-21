/* Binomialtest · Stats Lab
   Ablehnungsbereich: von außen nach innen, je Seite solange die Summe ≤ α/2 (zweiseitig) bzw. ≤ α (rechtsseitig).
   Zweiseitiger p-Wert: 2 · min(P(X ≤ k), P(X ≥ k)), höchstens 1. Damit gilt p ≤ α genau dann, wenn k im Ablehnungsbereich liegt. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const fmt = (x, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (x, d = 1) => fmt(x * 100, d) + " %";
const readout = (l, v, cls = "") => `<div class="readout ${cls}"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;
const S = { n: 20, p0: 0.6, alpha: 0.05, side: "two", k: 17, anim: null, sc: "medikament" };
/* Beispiele: Texte und Voreinstellungen */
const SC = {
  medikament: { n: 20, p0: 0.6, k: 17, hint: "zum Beispiel auf 17 und auf 7",
    lede: "Ein fiktives Medikament X soll eine Erkrankung heilen. Mit der Standardtherapie werden 60 % der Behandelten gesund. Wir behandeln n = 20 Patientinnen und Patienten mit X und zählen, wie viele geheilt werden. H0 sagt: X heilt genauso oft wie der Standard, die Heilungswahrscheinlichkeit ist p<sub>0</sub> = 0,6. Bevor wir auf das Ergebnis schauen, legen wir fest, welche Anzahlen wir als „zu selten für Zufall“ ansehen.",
    nLbl: "n · behandelte Patientinnen und Patienten", pLbl: "p<sub>0</sub> · Heilungswahrscheinlichkeit unter H0", kLbl: "k · beobachtete Heilungen", unit: "Heilungen", what: "Anzahl Heilungen",
    lead: "Die Punkte zeigen, wie wahrscheinlich jede Anzahl Heilungen wäre, wenn X genauso wirkt wie der Standard.",
    expect: "Wenn X genauso wirkt wie der Standard, wären im Mittel n · p<sub>0</sub> Heilungen zu erwarten.",
    hyp: { two: "X heilt anders oft als der Standard, häufiger oder seltener.", right: "X heilt häufiger als der Standard.", left: "X heilt seltener als der Standard." },
    yes: { two: "H0 verwerfen: Die Heilungsrate von X weicht vom Standard ab", right: "H0 verwerfen: X heilt häufiger als der Standard", left: "H0 verwerfen: X heilt seltener als der Standard" },
    no: "H0 beibehalten: mit der Heilungsrate des Standards vereinbar" },
  palpation: { n: 20, p0: 0.5, k: 15, hint: "zum Beispiel auf 15 und auf 4",
    lede: "Ein Therapeut behauptet, er erkenne mit einem Palpationstest die betroffene Seite. Bei 20 Patientinnen und Patienten liegt er 15-mal richtig. Kann das Raten sein? Raten hieße: Trefferwahrscheinlichkeit p<sub>0</sub> = 0,5. Bevor wir auf die 15 schauen, legen wir fest, welche Ergebnisse wir als „zu selten für Zufall“ ansehen.",
    nLbl: "n · untersuchte Patientinnen und Patienten", pLbl: "p<sub>0</sub> · Trefferwahrscheinlichkeit unter H0", kLbl: "k · beobachtete Treffer", unit: "Treffer", what: "Trefferzahl",
    lead: "Die Punkte zeigen, wie wahrscheinlich jede Trefferzahl wäre, wenn nur geraten wird.",
    expect: "Bei reinem Raten wären im Mittel n · p<sub>0</sub> Treffer zu erwarten.",
    hyp: { two: "Der Therapeut unterscheidet sich vom Raten, in welche Richtung auch immer.", right: "Der Therapeut ist besser als Raten.", left: "Der Therapeut ist schlechter als Raten." },
    yes: { two: "H0 verwerfen: anders als Raten", right: "H0 verwerfen: besser als Raten", left: "H0 verwerfen: schlechter als Raten" },
    no: "H0 beibehalten: mit Raten vereinbar" }
};
const SCN = () => SC[S.sc];
const ACC = "var(--pal-3)", REJ = "var(--therapie)";

function dist(side = S.side) {
  const { n, p0 } = S, pm = [];
  let c = 1; for (let k = 0; k <= n; k++) { pm.push(c * Math.pow(p0, k) * Math.pow(1 - p0, n - k)); c = c * (n - k) / (k + 1); }
  const F = [], G = []; let s = 0; for (let k = 0; k <= n; k++) { s += pm[k]; F.push(Math.min(1, s)); }
  s = 0; for (let k = n; k >= 0; k--) { s += pm[k]; G[k] = Math.min(1, s); }
  const lim = side === "two" ? S.alpha / 2 : S.alpha;
  let kL = -1; if (side !== "right") for (let k = 0; k <= n; k++) if (F[k] <= lim + 1e-12) kL = k; else break;
  let kU = n + 1; if (side !== "left") for (let k = n; k >= 0; k--) if (G[k] <= lim + 1e-12) kU = k; else break;
  const aL = kL >= 0 ? F[kL] : 0, aU = kU <= n ? G[kU] : 0;
  return { n, pm, F, G, lim, kL, kU, aL, aU, act: aL + aU, side };
}
const rej = (d, k) => k <= d.kL || k >= d.kU;
const pval = (d, k) => d.side === "two" ? Math.min(1, 2 * Math.min(d.F[k], d.G[k])) : d.side === "right" ? d.G[k] : d.F[k];

/* ---------- 1 Stabdiagramm ---------- */
function drawPmf(d) {
  const W = 920, L = 50, R = 900, T = 16, B = 250, n = d.n, k0 = S.k;
  const bw = (R - L) / (n + 1), x = k => L + k * bw, ymax = Math.max(...d.pm) * 1.18, y = v => B - v / ymax * (B - T);
  let s = "";
  [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4].filter(v => v <= ymax).forEach(v => s += `<line x1="${L}" x2="${R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${fmt(v, 2)}</text>`);
  // Animation: wie viele Punkte je Seite schon geprüft sind
  const A = S.anim, step = A ? A.step : Infinity;
  const pSide = S.side === "right" ? "up" : S.side === "left" ? "down" : (k0 >= S.n * S.p0 ? "up" : "down");
  // Bereich des p-Werts: k und alle extremeren Ergebnisse als helles Band
  if (!A) { const k1 = pSide === "up" ? k0 : 0, k2 = pSide === "up" ? n : k0; s += `<rect x="${x(k1)}" y="${T}" width="${x(k2 + 1) - x(k1)}" height="${B - T}" fill="var(--highlight)"/>`; }
  for (let k = 0; k <= n; k++) {
    const fromL = k, fromR = n - k, cx = x(k) + bw / 2, cy = y(d.pm[k]);
    const checked = S.side === "two" ? Math.min(fromL, fromR) < step : S.side === "right" ? fromR < step : fromL < step;
    const open = A && !checked, col = rej(d, k) ? REJ : ACC;
    s += `<line x1="${cx}" x2="${cx}" y1="${B}" y2="${cy}" stroke="${open ? "var(--line)" : "var(--muted)"}" stroke-width="1.4"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${Math.min(7, bw * 0.32)}" fill="${open ? "var(--surface)" : col}" stroke="${open ? "var(--line)" : "var(--surface)"}" stroke-width="1.5"/>`;
    if (!open) s += `<rect x="${x(k) + 1.5}" y="${B + 10}" width="${bw - 3}" height="5" fill="${col}"/>`;
    if (k === k0 && !A) s += `<circle cx="${cx}" cy="${cy}" r="${Math.min(12, bw * 0.48)}" fill="none" stroke="var(--fg)" stroke-width="2.5"/><text class="strong" x="${cx}" y="${cy - 16}" text-anchor="middle">k = ${k}</text>`;
    if (n <= 30 || k % 5 === 0) s += `<text x="${cx}" y="${B + 30}" text-anchor="middle">${k}</text>`;
  }
  s += `<line x1="${L}" x2="${R}" y1="${B}" y2="${B}" stroke="var(--line)"/>`;
  // Klammern für die Bereiche
  const br = (k1, k2, txt, col) => { if (k2 < k1) return ""; const a = x(k1) + 2, b = x(k2 + 1) - 2; return `<path d="M${a} ${B + 40} v6 H${b} v-6" fill="none" stroke="${col}" stroke-width="2"/><text x="${(a + b) / 2}" y="${B + 62}" text-anchor="middle" style="fill:${col}">${txt}</text>`; };
  if (!A) {
    if (d.kL >= 0) s += br(0, d.kL, `k ≤ ${d.kL}`, "var(--alpha-ink)");
    s += br(d.kL + 1, Math.min(n, d.kU - 1), "Annahmebereich", "var(--accent)");
    if (d.kU <= n) s += br(d.kU, n, `k ≥ ${d.kU}`, "var(--alpha-ink)");
  } else s += `<text x="${(L + R) / 2}" y="${B + 60}" text-anchor="middle" class="strong">${A.msg}</text>`;
  s += `<text x="${R}" y="${T + 4}" text-anchor="end">${SCN().what} unter H0: Binomial(n = ${n}, p0 = ${fmt(S.p0, 2)})</text>`;
  $("pmf").innerHTML = s;
}

function build() {
  const d = dist(); let step = 0;
  const run = () => {
    let sumL = 0, sumR = 0; const lim = d.lim; let msg;
    for (let i = 0; i < step; i++) { if (i <= d.kL) sumL += d.pm[i]; if (d.n - i >= d.kU) sumR += d.pm[d.n - i]; }
    const nextR = d.n - step, nextL = step;
    const sumTxt = S.side === "two" ? `links ${fmt(sumL, 4)} · rechts ${fmt(sumR, 4)} · Grenze je Seite α/2 = ${fmt(lim, 3)}` : S.side === "right" ? `rechts ${fmt(sumR, 4)} · Grenze α = ${fmt(lim, 3)}` : `links ${fmt(sumL, 4)} · Grenze α = ${fmt(lim, 3)}`;
    const stopR = S.side === "left" || nextR < d.kU, stopL = S.side === "right" || nextL > d.kL;
    msg = stopR && stopL ? `Der nächste Punkt würde die Grenze überschreiten. Fertig: ${sumTxt}` : `Prüfe k = ${S.side === "two" ? nextL + " und " + nextR : S.side === "right" ? nextR : nextL}: ${sumTxt}`;
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
    const col = rej(d, k) ? REJ : "var(--fg)";
    s += `<line x1="${x(k)}" x2="${x(k + 1)}" y1="${y(d.F[k])}" y2="${y(d.F[k])}" stroke="${col}" stroke-width="3"/>`;
    if (k > 0) s += `<line x1="${x(k)}" x2="${x(k)}" y1="${y(d.F[k - 1])}" y2="${y(d.F[k])}" stroke="var(--line)" stroke-dasharray="2 3"/>`;
    if (n <= 30 || k % 5 === 0) s += `<text x="${x(k) + bw / 2}" y="${B + 16}" text-anchor="middle">${k}</text>`;
  }
  if (S.side !== "right") s += `<line x1="${L}" x2="${R}" y1="${y(lo)}" y2="${y(lo)}" stroke="var(--alpha-ink)" stroke-dasharray="6 4"/><text x="${R}" y="${y(lo) - 6}" text-anchor="end" style="fill:var(--alpha-ink)">${S.side === "two" ? "α/2" : "α"} = ${fmt(lo, 3)}</text>`;
  if (S.side !== "left") s += `<line x1="${L}" x2="${R}" y1="${y(hi)}" y2="${y(hi)}" stroke="var(--alpha-ink)" stroke-dasharray="6 4"/><text x="${L + 6}" y="${y(hi) - 6}" style="fill:var(--alpha-ink)">${S.side === "two" ? "1 − α/2" : "1 − α"} = ${fmt(hi, 3)}</text>`;
  if (d.kL >= 0) s += `<circle cx="${x(d.kL) + bw / 2}" cy="${y(d.F[d.kL])}" r="5" fill="var(--alpha-ink)"/><text class="strong" x="${x(d.kL) + bw / 2}" y="${y(d.F[d.kL]) - 10}" text-anchor="middle" style="fill:var(--alpha-ink)">F(${d.kL}) = ${fmt(d.F[d.kL], 3)}</text>`;
  if (d.kU <= n && d.kU > 0) s += `<circle cx="${x(d.kU - 1) + bw / 2}" cy="${y(d.F[d.kU - 1])}" r="5" fill="var(--alpha-ink)"/><text class="strong" x="${x(d.kU - 1) + bw / 2}" y="${y(d.F[d.kU - 1]) + 22}" text-anchor="middle" style="fill:var(--alpha-ink)">F(${d.kU - 1}) = ${fmt(d.F[d.kU - 1], 3)}</text>`;
  s += `<text x="${R}" y="${B + 40}" text-anchor="end">k · ${SCN().what}</text><text x="18" y="${(T + B) / 2}" transform="rotate(-90 18 ${(T + B) / 2})" text-anchor="middle">F(k) = P(X ≤ k)</text>`;
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
    : S.side === "right" ? `p = P(X ≥ ${k}) = ${fmt(p, 4)}` : `p = P(X ≤ ${k}) = ${fmt(p, 4)}`;
  const region = (d.kL >= 0 ? `k ≤ ${d.kL}` : "") + (d.kL >= 0 && d.kU <= n ? " oder " : "") + (d.kU <= n ? `k ≥ ${d.kU}` : "") || "leer";
  $("steps").innerHTML =
    `<li><b>Erwartung unter H0.</b> ${SCN().expect}<span class="eq">${n} · ${fmt(S.p0, 2)} = ${fmt(e, 1)}</span></li>` +
    `<li><b>Ergebnis einordnen.</b> Beobachtet sind ${k} ${SCN().unit}.<span class="eq">Ablehnungsbereich: ${region} → k = ${k} liegt im ${inR ? "Ablehnungsbereich" : "Annahmebereich"}</span></li>` +
    `<li><b>p-Wert berechnen.</b> Wie wahrscheinlich ist unter H0 ein Ergebnis, das mindestens so extrem ist wie ${k}? ${S.side === "two" ? "Zweiseitig zählt auch die Gegenrichtung, daher mal 2." : S.side === "right" ? "Rechtsseitig zählt nur die obere Richtung." : "Linksseitig zählt nur die untere Richtung."}<span class="eq">${S.side === "two" ? tail + "<br>" : ""}${pLine}</span></li>` +
    `<li><b>Entscheiden.</b> Beide Wege führen zum selben Ergebnis.<span class="eq">p = ${fmt(p, 4)} ${p <= S.alpha ? "≤" : ">"} α = ${fmt(S.alpha, 2)} → ${p <= S.alpha ? SCN().yes[S.side] : SCN().no}</span></li>`;
}

/* ---------- 4 Gerichtet oder ungerichtet ---------- */
const HYP = { two: ["ungerichtet (zweiseitig)", "p ≠ p0"], right: ["gerichtet (rechtsseitig)", "p > p0"], left: ["gerichtet (linksseitig)", "p < p0"] };
function mini(side) {
  const d = dist(side), W = 920, L = 50, R = 900, T = 10, B = 120, n = d.n, k0 = S.k, bw = (R - L) / (n + 1), x = k => L + k * bw;
  const ymax = Math.max(...d.pm) * 1.12, y = v => B - v / ymax * (B - T);
  let s = "";
  for (let k = 0; k <= n; k++) {
    const cx = x(k) + bw / 2, cy = y(d.pm[k]), col = rej(d, k) ? REJ : ACC;
    s += `<line x1="${cx}" x2="${cx}" y1="${B}" y2="${cy}" stroke="var(--muted)" stroke-width="1.2"/><circle cx="${cx}" cy="${cy}" r="${Math.min(5.5, bw * 0.3)}" fill="${col}"/>`;
    s += `<rect x="${x(k) + 1.5}" y="${B + 9}" width="${bw - 3}" height="4" fill="${col}"/>`;
    if (n <= 30 || k % 5 === 0) s += `<text x="${x(k) + bw / 2}" y="${B + 27}" text-anchor="middle">${k}</text>`;
  }
  s += `<line x1="${x(k0) + bw / 2}" x2="${x(k0) + bw / 2}" y1="${T}" y2="${B + 8}" stroke="var(--pval)" stroke-width="2.5"/><text class="strong" x="${x(k0) + bw / 2 + (k0 > n / 2 ? -8 : 8)}" y="${T + 12}" text-anchor="${k0 > n / 2 ? "end" : "start"}">k = ${k0}</text>`;
  const p = pval(d, k0), sig = p <= S.alpha;
  const region = (d.kL >= 0 ? `k ≤ ${d.kL}` : "") + (d.kL >= 0 && d.kU <= n ? " oder " : "") + (d.kU <= n ? `k ≥ ${d.kU}` : "") || "leer";
  return `<div class="hcard ${S.side === side ? "on" : ""}"><div class="hhead"><b>${HYP[side][0]}</b><span class="num">H0: p = ${fmt(S.p0, 2)} · H1: ${HYP[side][1]}</span></div><p class="hsay">${SCN().hyp[side]}</p>
    <svg class="chart" viewBox="0 0 920 155" role="img" aria-label="Ablehnungsbereich ${HYP[side][0]}">${s}</svg>
    <div class="hres"><span>Ablehnungsbereich: <b>${region}</b></span><span>p = <b>${fmt(p, 4)}</b></span><span class="${sig ? "sig" : ""}">${sig ? "H0 verwerfen" : "H0 beibehalten"}</span></div></div>`;
}
function drawCompare() {
  $("compare").innerHTML = ["two", "right", "left"].map(mini).join("");
  const d2 = dist("two"), dr = dist("right"), dl = dist("left"), k = S.k, p2 = pval(d2, k), pr = pval(dr, k), pl = pval(dl, k);
  const up = k >= S.n * S.p0, pd = up ? pr : pl;
  $("c4").innerHTML = `Für k = ${k} liefert der gerichtete Test in Richtung des Ergebnisses p = <b>${fmt(pd, 4)}</b>, der ungerichtete p = <b>${fmt(p2, 4)}</b>, also ungefähr das Doppelte. Der gerichtete Test in die <b>andere</b> Richtung kommt auf p = <b>${fmt(up ? pl : pr, 4)}</b> und kann das Ergebnis nie entdecken, egal wie extrem es ist. Deshalb wird die Richtung vor der Datenerhebung festgelegt und begründet. Wer erst die Daten ansieht und dann einseitig testet, halbiert sich den p-Wert unberechtigt.`;
}

function applyScenario() {
  const t = SCN();
  $("lede").innerHTML = t.lede; $("n-lbl").textContent = t.nLbl; $("p0-lbl").innerHTML = t.pLbl; $("k-lbl").textContent = t.kLbl;
  $("s1-lead").textContent = t.lead; $("s4-hint").textContent = t.hint;
  document.querySelectorAll(".tab").forEach(b => b.setAttribute("aria-selected", b.dataset.sc === S.sc));
}
function setScenario(sc, keepHash) {
  if (!SC[sc]) sc = "medikament";
  S.sc = sc; const t = SC[sc]; S.n = t.n; S.p0 = t.p0; S.k = t.k; S.anim = null;
  $("n").value = S.n; $("p0").value = S.p0; $("k").max = S.n; $("k").value = S.k;
  if (!keepHash) history.replaceState(null, "", "#" + sc);
  applyScenario(); render();
}
function render() {
  $("n-v").textContent = S.n; $("p0-v").textContent = fmt(S.p0, 2); $("k-v").textContent = S.k;
  $("k").max = S.n; if (S.k > S.n) { S.k = S.n; $("k").value = S.n; }
  const d = dist();
  drawPmf(d); drawCdf(d); drawSteps(d); drawCompare();
  const region = (d.kL >= 0 ? `k ≤ ${d.kL}` : "") + (d.kL >= 0 && d.kU <= d.n ? " oder " : "") + (d.kU <= d.n ? `k ≥ ${d.kU}` : "") || "leer";
  const acc = `${d.kL + 1} bis ${Math.min(d.n, d.kU - 1)}`;
  $("r1").innerHTML = readout("Ablehnungsbereich", region, "r-alpha") + readout("Annahmebereich", acc) + readout("tatsächliches α", pct(d.act, 1), "r-alpha") + readout(`erwartete ${SCN().unit} unter H0`, fmt(d.n * S.p0, 1));
  // Was wäre mit einem Punkt mehr?
  const extra = S.side === "two" ? Math.min(d.kL + 1 <= d.n ? d.pm[d.kL + 1] : 1, d.kU - 1 >= 0 ? d.pm[d.kU - 1] : 1) : S.side === "right" ? (d.kU - 1 >= 0 ? d.pm[d.kU - 1] : 1) : (d.kL + 1 <= d.n ? d.pm[d.kL + 1] : 1);
  $("c1").innerHTML = `Der Ablehnungsbereich schöpft α nicht ganz aus: Das tatsächliche α liegt bei <b>${pct(d.act, 1)}</b> statt ${pct(S.alpha, 0)}. Nähme man noch einen Punkt dazu, käme mindestens ${pct(d.act + extra, 1)} heraus${S.side === "two" ? " (auf einer Seite schon mehr als α/2)" : ""}. Bei diskreten Verteilungen ist der Test deshalb etwas konservativ.`;
  $("build-note").textContent = "";
}

const seg = (id, key, conv) => $(id).addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; $(id).querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); S[key] = conv(b.dataset[key === "alpha" ? "a" : "s"]); S.anim = null; render(); });
seg("alpha", "alpha", Number); seg("side", "side", String);
$("n").addEventListener("input", e => { S.n = +e.target.value; S.anim = null; render(); });
$("p0").addEventListener("input", e => { S.p0 = +e.target.value; S.anim = null; render(); });
$("k").addEventListener("input", e => { S.k = +e.target.value; render(); });
$("build").onclick = build;
document.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => setScenario(b.dataset.sc)));
setScenario(location.hash.slice(1) || "medikament", true);
})();
