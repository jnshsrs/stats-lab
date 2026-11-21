/* ZGWS mit Würfeln · Stats Lab
   Summe von k fairen Würfeln: Histogramm der Würfe, exakte Verteilung (Faltung) und Normalapproximation. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const fmt = (x, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const intf = x => Math.round(x).toLocaleString("de-DE");
const readout = (l, v) => `<div class="readout"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;
const KS = [1, 2, 3, 5, 10, 30, 100];
const VAR1 = 35 / 12;
const D = { k: 2, counts: new Map(), n: 0, last: [] };

/* exakte Verteilung der Augensumme durch wiederholte Faltung */
function exact(k) { let p = [1]; for (let j = 0; j < k; j++) { const q = new Array(p.length + 6).fill(0); p.forEach((v, i) => { for (let f = 1; f <= 6; f++) q[i + f] += v / 6; }); p = q; } return p; }
let EX = exact(D.k);
const roll = () => 1 + Math.floor(Math.random() * 6);

function throwN(m) {
  for (let r = 0; r < m; r++) { let s = 0; const faces = []; for (let j = 0; j < D.k; j++) { const f = roll(); s += f; if (r === m - 1) faces.push(f); } D.counts.set(s, (D.counts.get(s) || 0) + 1); if (r === m - 1) D.last = faces; }
  D.n += m; render();
}

const PIPS = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] };
function die(f, sz = 40) { const pad = sz * 0.24, st = (sz - 2 * pad) / 2, r = sz * 0.085; return `<svg width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}" aria-label="${f}"><rect x="1" y="1" width="${sz - 2}" height="${sz - 2}" rx="${sz * 0.18}" fill="var(--surface)" stroke="var(--fg)" stroke-width="1.5"/>${PIPS[f].map(([x, y]) => `<circle cx="${pad + x * st}" cy="${pad + y * st}" r="${r}" fill="var(--fg)"/>`).join("")}</svg>`; }

function drawLast() {
  const el = $("dice-last");
  if (!D.last.length) { el.innerHTML = `<span class="hint">Noch nicht gewürfelt. Starten Sie mit „1 Wurf“.</span>`; return; }
  const s = D.last.reduce((a, b) => a + b, 0);
  const faces = D.k <= 10 ? D.last.map(f => die(f)).join("") : D.last.map(f => `<span class="die-sm">${f}</span>`).join("");
  el.innerHTML = `${faces}<span class="sum">Summe ${s}</span>`;
}

function drawHist() {
  const narrow = $("dice-hist").getBoundingClientRect().width < 600;
  const W = narrow ? 460 : 920, H = narrow ? 300 : 340, L = 50, R = 10, T = 18, B = 44, k = D.k;
  $("dice-hist").setAttribute("viewBox", `0 0 ${W} ${H}`);
  const mu = 3.5 * k, sd = Math.sqrt(VAR1 * k);
  const lo = Math.max(k, Math.floor(mu - 4.2 * sd)), hi = Math.min(6 * k, Math.ceil(mu + 4.2 * sd));
  const nb = hi - lo + 1, bw = (W - L - R) / nb;
  const x = v => L + (v - lo + 0.5) * bw;
  // Skala an der exakten Verteilung ausrichten, damit wenige Würfe sie nicht sprengen; zu hohe Balken werden gekappt
  let exMax = 0, obMax = 0; for (let v = lo; v <= hi; v++) { exMax = Math.max(exMax, EX[v]); if (D.n) obMax = Math.max(obMax, (D.counts.get(v) || 0) / D.n); }
  const top = D.n >= 300 ? Math.max(exMax, obMax) * 1.1 : exMax * 1.4;
  const raw = top / 4, mag = Math.pow(10, Math.floor(Math.log10(raw))), stepY = [1, 2, 2.5, 5, 10].map(m => m * mag).find(st => st >= raw);
  const ymax = Math.ceil(top / stepY) * stepY;
  const y = p => T + (H - T - B) * (1 - Math.min(p, ymax) / ymax);
  let s = "";
  const dec = stepY * 100 < 1 ? 1 : 0;
  for (let p = 0; p <= ymax + 1e-12; p += stepY) s += `<line x1="${L}" x2="${W - R}" y1="${y(p)}" y2="${y(p)}" stroke="var(--grid)"/><text x="${L - 8}" y="${y(p) + 4}" text-anchor="end">${fmt(p * 100, dec)} %</text>`;
  for (let v = lo; v <= hi; v++) { const c = D.counts.get(v) || 0; if (!c) continue; const p = c / D.n; s += `<rect x="${x(v) - bw * 0.42}" y="${y(p)}" width="${bw * 0.84}" height="${y(0) - y(p)}" fill="var(--area-b)"/>`; if (p > ymax) s += `<text x="${x(v)}" y="${T - 4}" text-anchor="middle" class="strong">▲ ${fmt(p * 100, 0)} %</text>`; }
  for (let v = lo; v <= hi; v++) s += `<line x1="${x(v) - bw * 0.42}" x2="${x(v) + bw * 0.42}" y1="${y(EX[v])}" y2="${y(EX[v])}" stroke="var(--fg)" stroke-width="${bw > 6 ? 2 : 1.4}"/>`;
  if (k > 1) { const pts = []; for (let i = 0; i <= 240; i++) { const v = lo - 0.5 + (hi - lo + 1) * i / 240; pts.push([x(v), y(Math.exp(-0.5 * ((v - mu) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI)))]); } s += `<path d="${pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join("")}" fill="none" stroke="var(--therapie)" stroke-width="2.4"/>`; }
  const step = [1, 2, 5, 10, 20, 25, 50].find(st => nb / st <= (narrow ? 7 : 14)) || 100;
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) s += `<line x1="${x(v)}" x2="${x(v)}" y1="${y(0)}" y2="${y(0) + 5}" stroke="var(--muted)"/><text x="${x(v)}" y="${y(0) + 20}" text-anchor="middle">${v}</text>`;
  s += `<line x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}" stroke="var(--muted)"/><text x="${(L + W - R) / 2}" y="${H - 4}" text-anchor="middle">Augensumme von ${k} ${k === 1 ? "Würfel" : "Würfeln"}${(lo > k || hi < 6 * k) && !narrow ? ` (gezeigt ${lo} bis ${hi}, möglich ${k} bis ${6 * k})` : ""}</text>`;
  $("dice-hist").innerHTML = s;
}

function stats() {
  const k = D.k, mu = 3.5 * k, sd = Math.sqrt(VAR1 * k);
  let m = 0, v = 0, inside = 0;
  if (D.n) { D.counts.forEach((c, s) => m += s * c); m /= D.n; D.counts.forEach((c, s) => { v += c * (s - m) ** 2; if (Math.abs(s - mu) <= sd) inside += c; }); v /= Math.max(1, D.n - 1); }
  $("dcount").textContent = `${intf(D.n)} ${D.n === 1 ? "Wurf" : "Würfe"}`;
  $("dice-stats").innerHTML = readout("Mittelwert der Summen", D.n ? fmt(m) : "–") + readout("erwartet: μ = 3,5 · k", fmt(mu)) + readout("SD der Summen", D.n > 1 ? fmt(v ** 0.5, 2) : "–") + readout("erwartet: σ = √(k · 35/12)", fmt(sd, 2));
  let t;
  if (k === 1) t = "Ein Würfel: Jede Augenzahl kommt gleich oft vor, die Verteilung ist flach. Von einer Glocke keine Spur.";
  else if (k === 2) t = "Zwei Würfel: Eine 7 entsteht auf sechs Arten, eine 2 oder 12 nur auf eine. Schon jetzt hat die Verteilung eine Spitze in der Mitte, sie ist dreieckig.";
  else if (k <= 5) t = `${k} Würfel: Die Verteilung ist bereits glockenförmig und liegt fast auf der Normalverteilung. Die Summen ${k} und ${6 * k} sind möglich, kommen aber praktisch nie vor (Wahrscheinlichkeit je ${fmt(100 / 6 ** k, k > 3 ? 3 : 2)} %).`;
  else t = `${k} Würfel: Exakte Verteilung und Normalverteilung sind kaum noch zu unterscheiden. Die Glocke wird breiter (σ wächst mit √k), relativ zum Wertebereich aber immer schmaler: Fast alle Summen liegen nahe ${fmt(mu, 0)}.`;
  if (D.n >= 200 && k > 1) t += ` In Ihren Würfen liegen ${fmt(100 * inside / D.n)} % im Bereich μ ± σ, bei einer Normalverteilung wären es rund 68 %.`;
  $("dice-callout").textContent = t;
}

function render() { drawLast(); drawHist(); stats(); }
function setK(k) { D.k = k; EX = exact(k); D.counts = new Map(); D.n = 0; D.last = []; $("k-seg").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", +b.dataset.k === k)); render(); }

$("k-seg").innerHTML = KS.map(k => `<button type="button" data-k="${k}" aria-pressed="false">${k}</button>`).join("");
$("k-seg").addEventListener("click", e => { const b = e.target.closest("button"); if (b) setK(+b.dataset.k); });
$("d1").onclick = () => throwN(1); $("d100").onclick = () => throwN(100); $("d1000").onclick = () => throwN(1000); $("d10000").onclick = () => throwN(10000);
$("dreset").onclick = () => setK(D.k);
setK(2);
let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(drawHist, 120); });
})();
