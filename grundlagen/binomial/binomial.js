/* Pascal und die Binomialverteilung · Stats Lab
   Galton-Brett auf einem Canvas: Stiftreihen = Personen, rechts = Erfolg mit Wahrscheinlichkeit p.
   In den Stiften steht das Pascalsche Dreieck, unten das Histogramm der gefallenen Kugeln. */
(() => {
"use strict";

const S = { n: 10, p: 0.5, k: 5, mode: "paths" };
let counts = [], balls = [], queue = 0, lastSpawn = 0;

const $ = id => document.getElementById(id);
const canvas = $("board"), ctx = canvas.getContext("2d");
const pct = (x, d = 1) => (x * 100).toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }) + " %";
const fmt = (x, d = 2) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const intf = x => Math.round(x).toLocaleString("de-DE");

function binom(n, k) { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); }
const pmf = (n, k, p) => binom(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);

/* ---------- Farben aus dem Theme ---------- */
let C = {};
function readColors() {
  const cs = getComputedStyle(document.documentElement);
  const g = v => cs.getPropertyValue(v).trim();
  C = { fg: g("--fg"), muted: g("--muted"), line: g("--line"), surface: g("--surface"), areaA: g("--area-a"), areaB: g("--area-b"), strong: g("--therapie"), onStrong: g("--on-accent"), accent: g("--accent"), font: g("--font-sans"), mono: g("--font-mono") };
}

/* ---------- Geometrie ---------- */
const W = 640;
let G = {};
function layout() {
  const n = S.n;
  const dx = Math.min(56, (W - 40) / (n + 1));
  const dy = Math.min(40, 400 / Math.max(n, 1));
  const top = 34, boardH = (n + 1) * dy;
  const binTop = top + boardH + 10, histH = 190;
  G = { n, dx, dy, top, cx: W / 2, binTop, histH, H: binTop + histH + 50, pegR: Math.min(dx * 0.42, 17) };
  const cssW = canvas.clientWidth || W, dpr = window.devicePixelRatio || 1;
  const scale = cssW / W;
  canvas.style.height = (G.H * scale) + "px";
  canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(G.H * scale * dpr);
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
}
const pegX = (r, j) => G.cx + (j - r / 2) * G.dx;
const pegY = r => G.top + r * G.dy;
const binX = k => G.cx + (k - G.n / 2) * G.dx;

/* ---------- Kugeln ---------- */
function newBall() {
  const steps = []; let j = 0;
  for (let r = 0; r < S.n; r++) { steps.push(j); if (Math.random() < S.p) j++; }
  return { steps, k: j, t: 0 };
}
function ballPos(b) {
  // t läuft von 0 bis n (je Reihe 1), danach Fall in die Ablage
  const r = Math.floor(b.t), f = b.t - r;
  if (r >= S.n) return [binX(b.k), pegY(S.n) + Math.min(1, f) * (G.binTop + 20 - pegY(S.n))];
  const x0 = r === 0 ? G.cx : pegX(r, b.steps[r]);
  const y0 = pegY(r) - G.pegR - 5;
  const nextJ = r + 1 < S.n ? b.steps[r + 1] : b.k;
  const x1 = r + 1 < S.n ? pegX(r + 1, nextJ) : binX(b.k);
  const y1 = r + 1 < S.n ? pegY(r + 1) - G.pegR - 5 : G.binTop;
  const hop = Math.sin(Math.PI * f) * G.dy * 0.35;
  return [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f - hop];
}

/* ---------- Zeichnen ---------- */
function draw() {
  const n = S.n, k = S.k;
  ctx.clearRect(0, 0, W, G.H);
  // Stifte mit Pascal-Zahlen
  for (let r = 0; r < n; r++) {
    for (let j = 0; j <= r; j++) {
      const onPath = j <= k && (r - j) <= (n - k);
      const x = pegX(r, j), y = pegY(r);
      ctx.beginPath(); ctx.arc(x, y, G.pegR, 0, 2 * Math.PI);
      ctx.fillStyle = onPath ? C.areaA : C.surface; ctx.fill();
      ctx.lineWidth = 1.2; ctx.strokeStyle = C.line; ctx.stroke();
      if (G.pegR >= 9) {
        const label = S.mode === "paths" ? String(binom(r, j)) : Math.round(pmf(r, j, S.p) * 100) + "%";
        const fs = Math.min(13, G.pegR * 2 / Math.max(2.2, label.length * 0.62));
        ctx.font = `600 ${fs}px ${C.mono}`; ctx.fillStyle = C.fg; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(label, x, y + 0.5);
      }
    }
  }
  // Zeile n des Dreiecks: die Fächer, in denen die Kugeln landen
  for (let j = 0; j <= n; j++) {
    const x = binX(j), y = pegY(n), w = Math.min(G.dx * 0.86, 46), h = Math.min(G.dy * 0.8, 28);
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, 6);
    ctx.fillStyle = j === k ? C.strong : C.areaA; ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = j === k ? C.strong : C.line; ctx.stroke();
    if (G.dx >= 22) {
      const label = S.mode === "paths" ? String(binom(n, j)) : Math.round(pmf(n, j, S.p) * 100) + "%";
      const fs = Math.min(13, w / Math.max(2.2, label.length * 0.62));
      ctx.font = `700 ${fs}px ${C.mono}`; ctx.fillStyle = j === k ? C.onStrong : C.fg; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(label, x, y + 0.5);
    }
  }
  ctx.font = `400 11.5px ${C.mono}`; ctx.fillStyle = C.muted; ctx.textAlign = "left"; ctx.textBaseline = "middle";
  const lx = binX(n) + Math.min(G.dx * 0.43, 23) + 8;
  if (lx + 62 <= W) ctx.fillText(`Zeile ${n}`, lx, pegY(n));
  ctx.fillText("Zeile 0", G.cx + G.pegR + 8, pegY(0));
  // Ablagen und Histogramm
  const total = counts.reduce((a, b) => a + b, 0);
  const exp = Array.from({ length: n + 1 }, (_, i) => pmf(n, i, S.p));
  const maxShare = Math.max(...exp, ...(total ? counts.map(c => c / total) : [0]));
  const base = G.binTop + G.histH, bw = G.dx * 0.78;
  ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(binX(0) - G.dx / 2, base); ctx.lineTo(binX(n) + G.dx / 2, base); ctx.stroke();
  for (let i = 0; i <= n; i++) {
    const x = binX(i);
    if (total) {
      const h = (counts[i] / total) / maxShare * (G.histH - 24);
      ctx.fillStyle = i === k ? C.strong : C.areaB;
      ctx.fillRect(x - bw / 2, base - h, bw, h);
    }
    // erwartete Höhe als Punkt
    const he = exp[i] / maxShare * (G.histH - 24);
    ctx.beginPath(); ctx.arc(x, base - he, 4, 0, 2 * Math.PI); ctx.fillStyle = C.strong; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = C.surface; ctx.stroke();
    // k und Koeffizient unter der Ablage
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.font = `${i === k ? 700 : 500} 13px ${C.font}`; ctx.fillStyle = i === k ? C.fg : C.muted;
    ctx.fillText(String(i), x, base + 18);
  }
  ctx.textAlign = "center"; ctx.font = `400 11.5px ${C.mono}`; ctx.fillStyle = C.muted;
  ctx.fillText("k Erfolge", G.cx, base + 38);
  ctx.textAlign = "right";
  ctx.fillText(total ? `${intf(total)} Kugeln` : "noch keine Kugeln", W - 8, G.binTop + 14);
  // Kugeln im Flug
  for (const b of balls) {
    const [x, y] = ballPos(b);
    ctx.beginPath(); ctx.arc(x, y, Math.max(3.5, G.pegR * 0.35), 0, 2 * Math.PI);
    ctx.fillStyle = b.k === k ? C.strong : C.accent; ctx.fill();
  }
}

/* ---------- Animation ---------- */
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let last = 0, running = false;
function tick(ts) {
  const dt = last ? Math.min(64, ts - last) : 16; last = ts;
  const speed = reduced ? 1000 : 0.012; // Reihen pro Millisekunde
  if (queue > 0 && ts - lastSpawn > 35) { balls.push(newBall()); queue--; lastSpawn = ts; }
  for (const b of balls) b.t += dt * speed;
  const done = balls.filter(b => b.t >= S.n + 1);
  done.forEach(b => counts[b.k]++);
  if (done.length) { balls = balls.filter(b => b.t < S.n + 1); updateText(); }
  draw();
  if (balls.length || queue) requestAnimationFrame(tick); else { running = false; last = 0; }
}
function start() { if (!running) { running = true; requestAnimationFrame(tick); } }

/* ---------- Text und Kennzahlen ---------- */
function updateText() {
  const { n, p, k } = S;
  $("n-v").textContent = n; $("p-v").textContent = pct(p, 0); $("k-v").textContent = k;
  const c = binom(n, k), w = Math.pow(p, k) * Math.pow(1 - p, n - k), pk = c * w;
  $("k-title").textContent = `Genau ${k} von ${n} sprechen an`;
  // Rechenweg als LaTeX (KaTeX); ohne KaTeX bleibt die Textfassung
  const tn = (x, d) => fmt(x, d).replace(/\./g, "{.}").replace(",", "{,}");
  const tw = w < 0.0001 ? (() => { const [m, e] = w.toExponential(2).split("e"); return `${m.replace(".", "{,}")} \\cdot 10^{${+e}}`; })() : tn(w, 6);
  const tc = intf(c).replace(/\./g, "{.}");
  const tq = x => x.toLocaleString("de-DE", { maximumFractionDigits: 2 }).replace(",", "{,}");
  const tex = String.raw`\begin{aligned}
    P(X = ${k}) &= \binom{${n}}{${k}} \cdot p^{${k}} \cdot (1-p)^{${n - k}} \\
    &= ${tc} \cdot ${tq(p)}^{${k}} \cdot ${tq(1 - p)}^{${n - k}} \\
    &= ${tc}\ \text{Wege} \cdot ${tw}\ \text{je Weg} \\
    &= \mathbf{${tn(pk * 100, 1)}\,\%}
  \end{aligned}`;
  if (window.katex) { $("formula").classList.add("tex"); katex.render(tex, $("formula"), { throwOnError: false, displayMode: true }); }
  else $("formula").innerHTML =
    `<span>P(X = ${k}) = (${n} über ${k}) · p<sup>${k}</sup> · (1 − p)<sup>${n - k}</sup></span>` +
    `<span>= ${intf(c)} Wege · ${w < 0.0001 ? w.toExponential(2).replace(".", ",") : fmt(w, 6)} je Weg</span>` +
    `<span class="big">= ${pct(pk)}</span>`;
  const total = counts.reduce((a, b) => a + b, 0);
  const obs = total ? counts[k] / total : null;
  $("readouts").innerHTML =
    ro(`erwartet: P(X = ${k})`, pct(pk)) +
    ro(`beobachtet bei ${intf(total)} Kugeln`, obs == null ? "–" : pct(obs)) +
    ro("Erwartungswert n · p", fmt(n * p, 1)) +
    ro("Standardabweichung", fmt(Math.sqrt(n * p * (1 - p)), 2));
}
const ro = (l, v) => `<div class="readout"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;

/* ---------- Steuerung ---------- */
function resetCounts() { counts = Array(S.n + 1).fill(0); balls = []; queue = 0; }
function rebuild(clear) {
  if (clear) resetCounts();
  $("k").max = S.n; if (S.k > S.n) S.k = S.n; $("k").value = S.k;
  layout(); updateText(); draw();
}
$("n").addEventListener("input", e => { S.n = +e.target.value; S.k = Math.min(S.k, S.n); rebuild(true); });
$("p").addEventListener("input", e => { S.p = +e.target.value; rebuild(true); });
$("k").addEventListener("input", e => { S.k = +e.target.value; updateText(); draw(); });
document.querySelectorAll("[data-mode]").forEach(b => b.addEventListener("click", () => {
  S.mode = b.dataset.mode; document.querySelectorAll("[data-mode]").forEach(x => x.setAttribute("aria-pressed", x === b)); draw();
}));
$("drop1").addEventListener("click", () => { queue += 1; start(); });
$("drop100").addEventListener("click", () => { queue += 100; start(); });
$("drop1000").addEventListener("click", () => { for (let i = 0; i < 1000; i++) counts[newBall().k]++; updateText(); draw(); });
$("reset").addEventListener("click", () => { resetCounts(); updateText(); draw(); });
canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect(), x = (e.clientX - rect.left) * W / rect.width;
  const k = Math.round((x - G.cx) / G.dx + S.n / 2);
  if (k >= 0 && k <= S.n) { S.k = k; $("k").value = k; updateText(); draw(); }
});
new ResizeObserver(() => { layout(); draw(); }).observe(canvas);

readColors();
resetCounts();
rebuild(false);
// Startzustand: 200 Kugeln, damit das Histogramm sofort etwas zeigt
for (let i = 0; i < 200; i++) counts[newBall().k]++;
updateText(); draw();
if (document.fonts) document.fonts.ready.then(() => draw());
if (window.renderMathInElement) renderMathInElement(document.querySelector(".explain"), { delimiters: [{ left: "\\[", right: "\\]", display: true }, { left: "\\(", right: "\\)", display: false }], throwOnError: false });
})();
