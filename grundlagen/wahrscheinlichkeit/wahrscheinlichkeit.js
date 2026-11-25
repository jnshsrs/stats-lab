/* Wahrscheinlichkeit als Fläche · Stats Lab
   Reiter 1: Einheitsquadrat als Möglichkeitsraum (Würfel, Münze, Multiplikationssatz).
   Reiter 2 und 3: flächentreue Venn-Diagramme für bedingte Wahrscheinlichkeit und Bayes. */
(() => {
"use strict";

// Mikrozensus 2024, Erstergebnisse, Paare in Tausend (Statistisches Bundesamt 2025, Tabelle 12211-33)
const MZ = { ehe0: 9401, ehe1: 7873, lg0: 2198, lg1: 1143 };

const S = { pA: 0.3, pB: 0.5, generic: false, dir5: "KgV", prev: 0.05, noSymZ: 0.40, noSymH: 0.85, dir6: "SgZ" };

const $ = id => document.getElementById(id);
const tz = x => String(x).replace(/\./g, "{.}").replace(/,/g, "{,}").replace(/−/g, "-").replace(/ %/g, "\\,\\%");
const TB = (t, fb) => window.katex ? texBlock(t) : fb;
const pct = (x, d = 1) => (x * 100).toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }) + " %";
const num = (x, d = 3) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const int = x => Math.round(x).toLocaleString("de-DE");

/* =====================================================================
   Reiter 1: Quadrat
   ===================================================================== */
const X0 = 60, Y0 = 76, SIZE = 420;
const FILL = {
  strong: ["var(--therapie)", "var(--on-accent)"],
  soft: ["var(--area-a)", "var(--fg)"],
  b: ["var(--area-b)", "var(--fg)"],
  none: ["var(--surface)", "var(--muted)"]
};

function drawSquare(m) {
  let s = "", x = X0;
  m.cols.forEach((c, ci) => {
    const w = c.w * SIZE;
    const parts = m.bFrac ? [
      { isB: false, y: Y0, h: (1 - m.bFrac[ci]) * SIZE },
      { isB: true, y: Y0 + (1 - m.bFrac[ci]) * SIZE, h: m.bFrac[ci] * SIZE }
    ] : [{ isB: false, y: Y0, h: SIZE }];
    parts.forEach(p => {
      const [fill, ink] = FILL[m.role(ci, p.isB)];
      s += `<rect x="${x.toFixed(1)}" y="${p.y.toFixed(1)}" width="${w.toFixed(1)}" height="${p.h.toFixed(1)}" fill="${fill}" stroke="var(--line)" stroke-width="1.5"/>`;
      const lab = m.cellLabel ? m.cellLabel(ci, p.isB) : null;
      if (lab && p.h > 0) {
        const cx = x + w / 2, cy = p.y + p.h / 2;
        if (w >= 84 && p.h >= 46 && lab[0]) {
          s += `<text class="cell-label" x="${cx}" y="${cy - 3}" text-anchor="middle" fill="${ink}">${lab[0]}</text>`;
          if (lab[1]) s += `<text class="cell-sub" x="${cx}" y="${cy + 15}" text-anchor="middle" fill="${ink}">${lab[1]}</text>`;
        } else if (w >= 40 && p.h >= 22 && lab[1]) {
          s += `<text class="cell-sub" x="${cx}" y="${cy + 4}" text-anchor="middle" fill="${ink}">${lab[1]}</text>`;
        }
      }
    });
    if (c.label) {
      const narrow = w < 90, tx = narrow ? x + 2 : x + w / 2, anchor = narrow ? "start" : "middle";
      s += `<text class="col-label" x="${tx}" y="${Y0 - 30}" text-anchor="${anchor}">${c.label}</text>`;
      if (c.sub) s += `<text class="col-sub" x="${tx}" y="${Y0 - 12}" text-anchor="${anchor}">${c.sub}</text>`;
    }
    x += w;
  });
  s += `<rect x="${X0}" y="${Y0}" width="${SIZE}" height="${SIZE}" fill="none" stroke="var(--fg)" stroke-width="2"/>`;
  if (m.bLabel) s += `<text class="indep" x="${X0 - 10}" y="${Y0 + SIZE - 6}" text-anchor="start" transform="rotate(-90 ${X0 - 10} ${Y0 + SIZE - 6})">${m.bLabel} liegt jeweils unten</text>`;
  s += `<text class="indep" x="${X0}" y="${Y0 + SIZE + 26}">Gesamtfläche = 1 · ${m.caption || ""}</text>`;
  $("square").innerHTML = s;
  $("square").setAttribute("aria-label", m.aria || "Möglichkeitsraum als Quadrat");
}

const DICE = [1, 2, 3, 4, 5, 6].map(k => ({ w: 1 / 6, label: String(k), sub: "1/6" }));
const STEPS = [
  {
    kicker: "Schritt 1 · Möglichkeitsraum", title: "Alles, was passieren kann",
    panel: () => `
      <p>Das Quadrat steht für alle möglichen Ergebnisse eines Zufallsexperiments. Seine Fläche ist 1, also 100 %. Eine Wahrscheinlichkeit ist nichts anderes als der Anteil dieser Fläche, den ein Ereignis einnimmt.</p>
      <div class="formula">${TB(String.raw`P(\Omega) = 1`, `<span class="big">P(Ω) = 1</span>`)}<span>Ω (Omega) ist der Ergebnisraum.</span></div>`,
    model: () => ({ cols: [{ w: 1 }], bFrac: null, role: () => "none", cellLabel: () => ["Alle möglichen Ergebnisse", "Fläche = 1"], caption: "Ω", aria: "Leeres Quadrat, Fläche 1" })
  },
  {
    kicker: "Schritt 2 · Ein Ereignis", title: "Ein Würfel teilt die Fläche in sechs Streifen",
    panel: () => `
      <p>Ein fairer sechsseitiger Würfel: Jede Augenzahl bekommt einen gleich breiten senkrechten Streifen. Das Ereignis „Sechs“ ist der markierte Streifen.</p>
      <div class="formula">${TB(String.raw`P(6) = \dfrac{1}{6} \approx 16{,}7\,\%`, `<span class="big">P(6) = 1/6 ≈ 16,7 %</span>`)}</div>
      <div class="legend"><span><i class="sw" style="background:var(--area-a)"></i>Ereignis A: Sechs</span></div>`,
    model: () => ({ cols: DICE, bFrac: null, role: ci => ci === 5 ? "soft" : "none", cellLabel: ci => ci === 5 ? ["Sechs", "1/6"] : null, caption: "6 Streifen", aria: "Quadrat in sechs Streifen, der sechste markiert" })
  },
  {
    kicker: "Schritt 3 · Ein zweites Ereignis", title: "Eine Münze teilt die Fläche quer",
    panel: () => `
      <p>Jetzt eine Münze, unabhängig vom Würfel. Sie teilt das Quadrat waagerecht: unten Kopf, oben Zahl, jeweils die halbe Fläche.</p>
      <div class="formula">${TB(String.raw`P(\text{Kopf}) = \dfrac{1}{2} = 50\,\%`, `<span class="big">P(Kopf) = 1/2 = 50 %</span>`)}</div>
      <div class="legend"><span><i class="sw" style="background:var(--area-b)"></i>Ereignis B: Kopf</span></div>`,
    model: () => ({ cols: [{ w: 1 }], bFrac: [0.5], role: (ci, b) => b ? "b" : "none", cellLabel: (ci, b) => b ? ["Kopf", "1/2"] : ["Zahl", "1/2"], caption: "2 Hälften", aria: "Quadrat waagerecht geteilt in Kopf und Zahl" })
  },
  {
    kicker: "Schritt 4 · Multiplikationssatz", title: "Beides zugleich: die Schnittfläche",
    panel: () => `
      <p>Legt man beide Teilungen übereinander, entstehen 12 gleich große Felder. „Sechs und Kopf“ ist genau ein Feld: das Rechteck, das von beiden Ereignissen begrenzt wird. Seine Fläche ist Breite mal Höhe.</p>
      <div class="formula" id="f4"></div>
      <p>Die waagerechte Grenze läuft in jeder Spalte auf derselben Höhe. Die Münze „weiß“ nichts vom Würfel. Genau das heißt <b>unabhängig</b>: P(Kopf | 6) = P(Kopf). Was passiert, wenn das nicht mehr gilt, zeigt der nächste Reiter.</p>
      <div class="legend"><span><i class="sw" style="background:var(--therapie)"></i>A und B</span><span><i class="sw" style="background:var(--area-a)"></i>nur A</span><span><i class="sw" style="background:var(--area-b)"></i>nur B</span></div>
      <div class="ctrls">
        <span class="source">Eigene Werte ausprobieren:</span>
        <div class="ctrl"><div class="ctrl-head"><label for="pA">P(A)</label><output id="pA-v"></output></div><input id="pA" type="range" min="0.05" max="0.95" step="0.01"></div>
        <div class="ctrl"><div class="ctrl-head"><label for="pB">P(B)</label><output id="pB-v"></output></div><input id="pB" type="range" min="0.05" max="0.95" step="0.01"></div>
        <button class="linkbtn" type="button" id="back-dice">Zurück zu Würfel und Münze</button>
      </div>
      <button class="btn" type="button" id="to-bedingt">Weiter zu Reiter 2: Bedingte Wahrscheinlichkeit →</button>`,
    init: () => {
      $("pA").value = S.pA; $("pB").value = S.pB;
      $("pA").addEventListener("input", e => { S.pA = +e.target.value; S.generic = true; updateSquare(); });
      $("pB").addEventListener("input", e => { S.pB = +e.target.value; S.generic = true; updateSquare(); });
      $("back-dice").addEventListener("click", () => { S.generic = false; updateSquare(); });
      $("to-bedingt").addEventListener("click", () => showTab("bedingt", true));
    },
    update: () => {
      $("pA-v").textContent = pct(S.pA, 0); $("pB-v").textContent = pct(S.pB, 0);
      $("back-dice").hidden = !S.generic;
      $("f4").innerHTML = S.generic
        ? TB(String.raw`\begin{aligned}P(A \cap B) &= P(A) \cdot P(B) \\ &= ${tz(num(S.pA, 2))} \cdot ${tz(num(S.pB, 2))} = ${tz(num(S.pA * S.pB, 3))} \approx ${tz(pct(S.pA * S.pB))}\end{aligned}`, `<span>P(A ∩ B) = P(A) · P(B)</span><span class="big">= ${num(S.pA * S.pB, 3)} ≈ ${pct(S.pA * S.pB)}</span>`)
        : TB(String.raw`\begin{aligned}P(6 \cap \text{Kopf}) &= P(6) \cdot P(\text{Kopf}) \\ &= \dfrac{1}{6} \cdot \dfrac{1}{2} = \dfrac{1}{12} \approx 8{,}3\,\%\end{aligned}`, `<span>P(6 ∩ Kopf) = P(6) · P(Kopf)</span><span class="big">= 1/12 ≈ 8,3 %</span>`);
    },
    model: () => S.generic ? {
      cols: [{ w: S.pA, label: "A", sub: pct(S.pA, 0) }, { w: 1 - S.pA, label: "nicht A", sub: pct(1 - S.pA, 0) }], bFrac: [S.pB, S.pB],
      role: (ci, b) => ci === 0 && b ? "strong" : ci === 0 ? "soft" : b ? "b" : "none",
      cellLabel: (ci, b) => ci === 0 && b ? ["A und B", pct(S.pA * S.pB)] : null, bLabel: "B", caption: "unabhängig", aria: "Schnittfläche A und B"
    } : {
      cols: DICE, bFrac: Array(6).fill(0.5),
      role: (ci, b) => ci === 5 && b ? "strong" : ci === 5 ? "soft" : b ? "b" : "none",
      cellLabel: () => [null, "1/12"], bLabel: "Kopf", caption: "12 gleiche Felder", aria: "Zwölf Felder, Sechs und Kopf markiert"
    }
  }
];

let cur = 0;
function updateSquare() { const st = STEPS[cur]; if (st.update) st.update(); drawSquare(st.model()); }
function renderStep() {
  const st = STEPS[cur];
  $("detail").innerHTML = `<span class="kicker">${st.kicker}</span><h2>${st.title}</h2>${st.panel()}`;
  if (st.init) st.init();
  updateSquare();
  $("step-count").textContent = `${cur + 1} von ${STEPS.length}`;
  document.querySelectorAll("#dots button").forEach((b, i) => b.setAttribute("aria-pressed", i === cur));
  $("prev").disabled = cur === 0; $("next").disabled = cur === STEPS.length - 1;
  $("prev").style.opacity = cur === 0 ? .4 : 1; $("next").style.opacity = cur === STEPS.length - 1 ? .4 : 1;
}
const go = i => { cur = Math.max(0, Math.min(STEPS.length - 1, i)); renderStep(); };
$("dots").innerHTML = STEPS.map(s => `<button type="button" aria-label="${s.kicker}"></button>`).join("");
document.querySelectorAll("#dots button").forEach((b, i) => b.addEventListener("click", () => go(i)));
$("prev").addEventListener("click", () => go(cur - 1));
$("next").addEventListener("click", () => go(cur + 1));

/* =====================================================================
   Reiter 2 und 3: flächentreue Venn-Diagramme
   ===================================================================== */
function lens(rA, rB, d) {
  if (d >= rA + rB) return 0;
  if (d <= Math.abs(rA - rB)) return Math.PI * Math.min(rA, rB) ** 2;
  const a = rA * rA * Math.acos((d * d + rA * rA - rB * rB) / (2 * d * rA));
  const b = rB * rB * Math.acos((d * d + rB * rB - rA * rA) / (2 * d * rB));
  const c = 0.5 * Math.sqrt((-d + rA + rB) * (d + rA - rB) * (d - rA + rB) * (d + rA + rB));
  return a + b - c;
}
// Abstand der Kreismittelpunkte, so dass die Schnittfläche genau pAB ist
function distanceFor(rA, rB, pAB) {
  let lo = Math.abs(rA - rB), hi = rA + rB;
  if (pAB <= 0) return hi;
  if (pAB >= Math.PI * Math.min(rA, rB) ** 2 - 1e-12) return lo;
  for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (lens(rA, rB, mid) > pAB) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

/* v = { pA, pB, pAB, nameA, nameB, denom: "A" | "B", aria } */
function drawVenn(svgId, v) {
  const rA0 = Math.sqrt(v.pA / Math.PI), rB0 = Math.sqrt(v.pB / Math.PI), d0 = distanceFor(rA0, rB0, v.pAB);
  const left = Math.min(-rA0, d0 - rB0), right = Math.max(rA0, d0 + rB0), half = Math.max(rA0, rB0);
  const box = { x: 16, y: 64, w: 528, h: 320 };
  const k = Math.min((box.w - 70) / (right - left), (box.h - 50) / (2 * half));
  const rA = rA0 * k, rB = rB0 * k, d = d0 * k;
  const cy = box.y + box.h / 2;
  const cxA = box.x + box.w / 2 - ((left + right) / 2) * k, cxB = cxA + d;
  let s = `<defs><clipPath id="${svgId}-clipA"><circle cx="${cxA}" cy="${cy}" r="${rA}"/></clipPath></defs>`;
  s += `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="10" fill="var(--surface)" stroke="var(--fg)" stroke-width="1.5"/>`;
  s += `<text class="v-note" x="${box.x + 12}" y="${box.y + 20}">Ω · alle</text>`;
  s += `<circle cx="${cxA}" cy="${cy}" r="${rA}" fill="var(--area-a)" stroke="var(--fg)" stroke-width="1.5"/>`;
  s += `<circle cx="${cxB}" cy="${cy}" r="${rB}" fill="var(--area-b)" fill-opacity=".9" stroke="var(--fg)" stroke-width="1.5"/>`;
  s += `<circle cx="${cxB}" cy="${cy}" r="${rB}" fill="var(--therapie)" clip-path="url(#${svgId}-clipA)"/>`;
  s += `<circle cx="${cxA}" cy="${cy}" r="${rA}" fill="none" stroke="var(--fg)" stroke-width="1.5"/>`;
  const den = v.denom === "A" ? [cxA, rA] : [cxB, rB];
  s += `<circle cx="${den[0]}" cy="${cy}" r="${Math.max(0, den[1] - 3)}" fill="none" stroke="var(--surface)" stroke-width="4"/><circle cx="${den[0]}" cy="${cy}" r="${Math.max(0, den[1] - 3)}" fill="none" stroke="var(--fg)" stroke-width="1.8" stroke-dasharray="7 5"/>`;
  const pAonly = v.pA - v.pAB, pBonly = v.pB - v.pAB;
  const label = (x, val, ink, minW) => minW >= 46 ? `<text class="v-val" x="${x}" y="${cy + 2}" text-anchor="middle" fill="${ink}">${pct(val)}</text><text class="v-of" x="${x}" y="${cy + 18}" text-anchor="middle" fill="${ink}">von allen</text>` : "";
  const aL = cxA - rA, aR = cxA + rA, bL = cxB - rB, bR = cxB + rB;
  const inside = d + Math.min(rA, rB) <= Math.max(rA, rB) + 0.5;
  if (inside) {
    const small = rA <= rB ? [cxA, rA] : [cxB, rB];
    s += label(small[0], v.pAB, "var(--on-accent)", small[1] * 2);
  } else {
    const ovL = Math.max(aL, bL), ovR = Math.min(aR, bR);
    s += label((ovL + ovR) / 2, v.pAB, "var(--on-accent)", ovR - ovL);
    s += label((aL + bL) / 2, pAonly, "var(--fg)", bL - aL);
    s += label((aR + bR) / 2, pBonly, "var(--fg)", bR - aR);
  }
  [[cxA, rA, v.nameA, v.pA, "start", box.x + 4], [cxB, rB, v.nameB, v.pB, "end", box.x + box.w - 4]].forEach(([cx, r, name, p, anchor, lx]) => {
    s += `<line x1="${cx}" x2="${lx + (anchor === "start" ? 40 : -40)}" y1="${cy - r}" y2="52" stroke="var(--muted)" stroke-width="1"/>`;
    s += `<text class="v-name" x="${lx}" y="16" text-anchor="${anchor}">${name}</text>`;
    s += `<text class="v-sub" x="${lx}" y="33" text-anchor="${anchor}">P(${name}) = ${pct(p)}</text>`;
    s += `<text class="v-of" x="${lx}" y="47" text-anchor="${anchor}" fill="var(--muted)">von allen</text>`;
  });
  s += `<text class="v-note" x="${box.x + box.w - 12}" y="${box.y + box.h - 12}" text-anchor="end">weder noch: ${pct(1 - v.pA - v.pB + v.pAB)}</text>`;
  s += `<text class="v-note" x="${box.x}" y="${box.y + box.h + 22}">Prozentzahlen: Anteil an allen (Ω). Kreise maßstabsgetreu.</text>`;
  $(svgId).innerHTML = s;
  $(svgId).setAttribute("aria-label", v.aria);
}

function regionTable(rows) {
  return `<table class="regions"><tr><th>Fläche</th><th class="n">Anteil an allen</th></tr>${rows.map(r =>
    `<tr><td><i class="sw" style="background:${r[0]};border:1px solid var(--line)"></i>${r[1]}</td><td class="n">${r[2]}</td></tr>`).join("")}</table>`;
}

/* Zoom-Leiste: oben alle = 100 %, unten nur die Bezugsfläche = 100 % */
function drawZoom(svgId, z) {
  const X = 20, W = 520, y1 = 44, y2 = 170, h = 34, segs = z.segs, tot = segs.reduce((a, b) => a + b.p, 0);
  let s = `<text class="v-name" x="${X}" y="${y1 - 12}">${z.allName} = 100 %</text>`, x = X;
  const pos = [];
  segs.forEach(g => { const w = g.p / tot * W; pos.push([x, w]);
    s += `<rect x="${x}" y="${y1}" width="${w}" height="${h}" fill="${g.fill}" stroke="var(--fg)" stroke-width="1"/>`;
    if (w > 52) s += `<text class="v-val" x="${x + w / 2}" y="${y1 + h / 2 + 5}" text-anchor="middle" fill="${g.ink || "var(--fg)"}">${pct(g.p)}</text>`;
    x += w; });
  const [a0] = pos[z.ref[0]], [b0, bw] = pos[z.ref[1]], rx0 = a0 > b0 ? b0 : a0, rx1 = Math.max(a0 + pos[z.ref[0]][1], b0 + bw);
  s += `<rect x="${rx0 + 2}" y="${y1 + 2}" width="${rx1 - rx0 - 4}" height="${h - 4}" fill="none" stroke="var(--surface)" stroke-width="4"/><rect x="${rx0 + 2}" y="${y1 + 2}" width="${rx1 - rx0 - 4}" height="${h - 4}" fill="none" stroke="var(--fg)" stroke-width="1.8" stroke-dasharray="7 5"/>`;
  s += `<path d="M${rx0} ${y1 + h + 8} L${X} ${y2 - 28} M${rx1} ${y1 + h + 8} L${X + W} ${y2 - 28}" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="4 4" fill="none"/>`;
  s += `<text class="v-note" x="${X + W / 2}" y="${y2 - 34}" text-anchor="middle" fill="var(--accent)">${z.zoomText}</text>`;
  s += `<text class="v-name" x="${X}" y="${y2 - 12}">${z.refName} = 100 %</text>`;
  const wc = z.cond * W;
  s += `<rect x="${X}" y="${y2}" width="${wc}" height="${h}" fill="var(--therapie)" stroke="var(--fg)"/><rect x="${X + wc}" y="${y2}" width="${W - wc}" height="${h}" fill="${z.restFill}" stroke="var(--fg)"/>`;
  const seg = (cx, w, lab, val, ink) => w > 150 ? `<text class="v-val" x="${cx}" y="${y2 + h / 2 + 5}" text-anchor="middle" fill="${ink}">${lab} ${pct(val)}</text>` : w > 52 ? `<text class="v-val" x="${cx}" y="${y2 + h / 2 + 5}" text-anchor="middle" fill="${ink}">${pct(val)}</text>` : "";
  s += seg(X + wc / 2, wc, z.condLab, z.cond, "var(--on-accent)") + seg(X + wc + (W - wc) / 2, W - wc, z.restLab, 1 - z.cond, "var(--fg)");
  s += `<text class="v-cond" x="${X}" y="${y2 + h + 24}">${z.result}</text>`;
  if (z.result2) s += `<text class="v-note" x="${X}" y="${y2 + h + 42}">${z.result2}</text>`;
  $(svgId).innerHTML = s;
}

/* ----- Reiter 2: bedingte Wahrscheinlichkeit, Mikrozensus ----- */
function renderBedingt() {
  const tot = MZ.ehe0 + MZ.ehe1 + MZ.lg0 + MZ.lg1;
  const pV = (MZ.ehe0 + MZ.ehe1) / tot, pK = (MZ.ehe1 + MZ.lg1) / tot, pVK = MZ.ehe1 / tot;
  const pKgV = pVK / pV, pVgK = pVK / pK, pKgN = MZ.lg1 / (MZ.lg0 + MZ.lg1);
  document.querySelectorAll("[data-d5]").forEach(b => b.setAttribute("aria-pressed", b.dataset.d5 === S.dir5));
  drawVenn("venn-bedingt", {
    pA: pV, pB: pK, pAB: pVK, nameA: "verheiratet", nameB: "mit Kindern", denom: S.dir5 === "KgV" ? "A" : "B",
    aria: `Venn-Diagramm: verheiratet ${pct(pV)}, mit Kindern ${pct(pK)}, beides ${pct(pVK)}`
  });
  const KgV = S.dir5 === "KgV";
  drawZoom("zoom-bedingt", {
    segs: [{ p: pV - pVK, fill: "var(--area-a)" }, { p: pVK, fill: "var(--therapie)", ink: "var(--on-accent)" }, { p: pK - pVK, fill: "var(--area-b)" }, { p: 1 - pV - pK + pVK, fill: "var(--surface)" }],
    allName: "Alle Paare", ref: KgV ? [0, 1] : [1, 2], refName: KgV ? "Nur Ehepaare" : "Nur Paare mit Kindern",
    zoomText: `nur diese ${pct(KgV ? pV : pK)} betrachten, auf 100 % strecken`,
    cond: KgV ? pKgV : pVgK, condLab: KgV ? "mit Kindern" : "verheiratet", restLab: KgV ? "ohne Kinder" : "unverheiratet", restFill: KgV ? "var(--area-a)" : "var(--area-b)",
    result: KgV ? `P(Kinder | verheiratet) = ${pct(pKgV)}` : `P(verheiratet | Kinder) = ${pct(pVgK)}`,
    result2: KgV ? `= ${pct(pVK)} ÷ ${pct(pV)}, Anteil an den Ehepaaren` : `= ${pct(pVK)} ÷ ${pct(pK)}, Anteil an den Paaren mit Kindern`
  });
  const formula = S.dir5 === "KgV"
    ? TB(String.raw`\begin{aligned}P(\text{Kinder} \mid \text{verh.}) &= \dfrac{P(\text{verh.} \cap \text{Kinder})}{P(\text{verh.})} \\ &= \dfrac{${tz(num(pVK))}}{${tz(num(pV))}} = ${tz(pct(pKgV))}\end{aligned}`, `<span class="big">P(Kinder | verheiratet) = ${pct(pKgV)}</span>`) + `<span>Bezugsfläche: der Kreis „verheiratet“</span>`
    : TB(String.raw`\begin{aligned}P(\text{verh.} \mid \text{Kinder}) &= \dfrac{P(\text{verh.} \cap \text{Kinder})}{P(\text{Kinder})} \\ &= \dfrac{${tz(num(pVK))}}{${tz(num(pK))}} = ${tz(pct(pVgK))}\end{aligned}`, `<span class="big">P(verheiratet | Kinder) = ${pct(pVgK)}</span>`) + `<span>Bezugsfläche: der Kreis „mit Kindern“</span>`;
  $("detail-bedingt").innerHTML = `
    <span class="kicker">Reiter 2 · Bedingte Wahrscheinlichkeit</span>
    <h2>Verheiratet und Kinder</h2>
    <p>Alle Paare in Deutschland 2024, rund ${num(tot / 1000, 1)} Mio. Ein Kreis steht für die Ehepaare, einer für die Paare mit Kindern im Haushalt. Die dunkle Schnittfläche sind Ehepaare mit Kindern.</p>
    <p><b>So lesen Sie das Diagramm.</b> Alle Zahlen im Venn-Diagramm sind Anteile an <b>allen</b> Paaren, also unbedingte Wahrscheinlichkeiten. Über den Kreisen steht, wie groß jeder Kreis ist: P(verheiratet) und P(mit Kindern). In den Flächen steht, wie viel von allen Paaren in genau diesem Stück liegt, etwa die Schnittfläche P(verheiratet ∩ Kinder) = ${pct(pVK)}. Eine bedingte Wahrscheinlichkeit steht im Venn-Diagramm nirgends direkt.</p>
    <p>„Gegeben“ heißt: Die Welt schrumpft auf einen Kreis. Die bedingte Wahrscheinlichkeit ist der Anteil der Schnittfläche an <b>diesem</b> Kreis, nicht an allen. Die Leiste unter dem Diagramm zeigt genau diesen Schritt: Der gestrichelte Teil wird herausgenommen und auf 100 % gestreckt.</p>
    <div class="formula">${formula}</div>
    <div class="legend"><span><i class="sw" style="background:var(--therapie)"></i>verheiratet und Kinder</span><span><i class="sw outline"></i>Bezugsfläche (das, was gegeben ist)</span></div>
    <p><b>Abhängig:</b> Unter Ehepaaren haben ${pct(pKgV)} Kinder im Haushalt, unter unverheirateten Paaren ${pct(pKgN)}, insgesamt ${pct(pK)}. Wären Ehe und Kinder unabhängig, läge die Schnittfläche bei P(verh.) · P(Kinder) = ${pct(pV * pK)} statt ${pct(pVK)}.</p>
    <div class="formula"><span>Allgemeiner Multiplikationssatz</span>${TB(String.raw`\begin{aligned}P(A \cap B) &= P(A) \cdot P(B \mid A) \\ &= ${tz(num(pV))} \cdot ${tz(num(pKgV))} = ${tz(num(pVK))}\end{aligned}`, `<span class="big">P(A ∩ B) = P(A) · P(B | A)</span><span>${num(pV)} · ${num(pKgV)} = ${num(pVK)}</span>`)}</div>
    ${regionTable([
      ["var(--area-a)", "nur verheiratet (ohne Kinder)", pct(pV - pVK)],
      ["var(--therapie)", "verheiratet und Kinder", pct(pVK)],
      ["var(--area-b)", "nur Kinder (unverheiratet)", pct(pK - pVK)],
      ["var(--surface)", "weder noch", pct(1 - pV - pK + pVK)]
    ])}
    <p class="note-warn"><b>Achtung, Zufall in den Daten:</b> Die Fläche „nur verheiratet“ ist ${pct(pV - pVK, 2)} von allen Paaren, und P(Kinder | verheiratet) ist ${pct(pKgV, 2)}. Gerundet stehen beide Male 45,6 %. Das sind zwei verschiedene Größen mit verschiedenem Bezug, die hier nur zufällig fast gleich groß sind.</p>
    <p class="callout">Gleicher Zähler, andere Bezugsfläche: P(Kinder | verheiratet) = ${pct(pKgV)}, aber P(verheiratet | Kinder) = ${pct(pVgK)}. Die Reihenfolge der Bedingung ist nicht egal.</p>
    <p class="source">Quelle: Statistisches Bundesamt (2025), Mikrozensus 2024, Haushalte und Familien, Erstergebnisse, Tabelle 12211-33. Kinder = ledige Kinder jeden Alters im Haushalt; Paare, deren Kinder ausgezogen sind, zählen als „ohne Kinder“.</p>
    <button class="btn" type="button" id="to-bayes">Weiter zu Reiter 3: Satz von Bayes →</button>`;
  $("to-bayes").addEventListener("click", () => showTab("bayes", true));
}
document.querySelectorAll("[data-d5]").forEach(b => b.addEventListener("click", () => { S.dir5 = b.dataset.d5; renderBedingt(); }));

/* ----- Reiter 3: Bayes, Leberzirrhose ----- */
function bayesPanel() {
  $("detail-bayes").innerHTML = `
    <span class="kicker">Reiter 3 · Satz von Bayes</span>
    <h2>Symptomfrei bei Zirrhose oder Zirrhose bei Symptomfreiheit?</h2>
    <p>Viele Leberzirrhosen verlaufen lange ohne Symptome. Heißt das umgekehrt: Wer keine Symptome hat, hat wahrscheinlich eine Zirrhose? Der kleine Kreis sind die Erkrankten, der große alle Symptomfreien.</p>
    <div class="formula" id="f6"></div>
    <p class="freq" id="freq6"></p>
    <div class="legend"><span><i class="sw" style="background:var(--therapie)"></i>Zirrhose und keine Symptome</span><span><i class="sw" style="background:var(--area-b)"></i>keine Symptome, keine Zirrhose</span><span><i class="sw outline"></i>Bezugsfläche</span></div>
    <div class="ctrls">
      <span class="source">Beispielzahlen, keine klinischen Daten. Verschieben Sie die Annahmen:</span>
      <div class="ctrl"><div class="ctrl-head"><label for="prevalence">Prävalenz P(Zirrhose)</label><output id="prevalence-v"></output></div><input id="prevalence" type="range" min="0.005" max="0.5" step="0.005"></div>
      <div class="ctrl"><div class="ctrl-head"><label for="nsz">P(keine Symptome | Zirrhose)</label><output id="nsz-v"></output></div><input id="nsz" type="range" min="0" max="1" step="0.01"></div>
      <div class="ctrl"><div class="ctrl-head"><label for="nsh">P(keine Symptome | keine Zirrhose)</label><output id="nsh-v"></output></div><input id="nsh" type="range" min="0" max="1" step="0.01"></div>
    </div>
    <p class="callout">Der p-Wert hat dieselbe Struktur: P(Daten | H0) ist nicht P(H0 | Daten). Wer die Richtung vertauscht, vergisst die Prävalenz, in der Statistik die Vorab-Wahrscheinlichkeit von H0.</p>`;
  $("prevalence").value = S.prev; $("nsz").value = S.noSymZ; $("nsh").value = S.noSymH;
  $("prevalence").addEventListener("input", e => { S.prev = +e.target.value; updateBayes(); });
  $("nsz").addEventListener("input", e => { S.noSymZ = +e.target.value; updateBayes(); });
  $("nsh").addEventListener("input", e => { S.noSymH = +e.target.value; updateBayes(); });
}
function updateBayes() {
  const p = S.prev, a = S.noSymZ, b = S.noSymH;
  const joint = p * a, pS = p * a + (1 - p) * b, post = pS > 0 ? joint / pS : 0;
  document.querySelectorAll("[data-d6]").forEach(x => x.setAttribute("aria-pressed", x.dataset.d6 === S.dir6));
  $("prevalence-v").textContent = pct(p); $("nsz-v").textContent = pct(a, 0); $("nsh-v").textContent = pct(b, 0);
  drawVenn("venn-bayes", {
    pA: p, pB: pS, pAB: joint, nameA: "Zirrhose", nameB: "keine Symptome", denom: S.dir6 === "SgZ" ? "A" : "B",
    aria: `Venn-Diagramm: Zirrhose ${pct(p)}, keine Symptome ${pct(pS)}, beides ${pct(joint)}`
  });
  $("f6").innerHTML = S.dir6 === "SgZ"
    ? TB(String.raw`\begin{aligned}P(kS \mid Z) &= \dfrac{\text{Schnittfläche}}{\text{Kreis Zirrhose}} \\ &= \dfrac{${tz(num(joint, 4))}}{${tz(num(p, 4))}} = ${tz(pct(a))}\end{aligned}`, `<span class="big">P(keine Sympt. | Zirrhose) = ${pct(a)}</span>`) + `<span class="dim">Z: Zirrhose · kS: keine Symptome</span>`
    : TB(String.raw`\begin{aligned}P(Z \mid kS) &= \dfrac{P(Z) \cdot P(kS \mid Z)}{P(Z) \cdot P(kS \mid Z) + P(\neg Z) \cdot P(kS \mid \neg Z)} \\ &= \dfrac{${tz(num(p, 3))} \cdot ${tz(num(a, 2))}}{${tz(num(p, 3))} \cdot ${tz(num(a, 2))} + ${tz(num(1 - p, 3))} \cdot ${tz(num(b, 2))}} \\ &= ${tz(pct(post))}\end{aligned}`, `<span class="big">P(Zirrhose | keine Sympt.) = ${pct(post)}</span>`) + `<span class="dim">Z: Zirrhose · kS: keine Symptome</span>`;
  const n = 1000, nz = n * p, nzs = nz * a, nh = n - nz, nhs = nh * b;
  $("freq6").innerHTML = `Von ${int(n)} Personen haben ${int(nz)} eine Zirrhose, davon sind ${int(nzs)} symptomfrei. Von den ${int(nh)} ohne Zirrhose sind ${int(nhs)} symptomfrei. <b>Unter ${int(nzs + nhs)} Symptomfreien haben nur ${int(nzs)} eine Zirrhose.</b>`;
}
document.querySelectorAll("[data-d6]").forEach(b => b.addEventListener("click", () => { S.dir6 = b.dataset.d6; updateBayes(); }));

/* =====================================================================
   Reiter-Steuerung
   ===================================================================== */
const TABS = ["multiplikation", "bedingt", "bayes"];
let tab = "multiplikation";
function showTab(name, scroll) {
  tab = TABS.includes(name) ? name : "multiplikation";
  TABS.forEach(t => {
    $("tab-" + t).setAttribute("aria-selected", t === tab);
    $("tab-" + t).tabIndex = t === tab ? 0 : -1;
    $("panel-" + t).hidden = t !== tab;
  });
  if (tab === "bedingt") renderBedingt();
  if (tab === "bayes") updateBayes();
  if (location.hash !== "#" + tab) history.replaceState(null, "", "#" + tab);
  if (scroll) document.querySelector(".tabs").scrollIntoView({ behavior: "smooth", block: "start" });
}
TABS.forEach(t => $("tab-" + t).addEventListener("click", () => showTab(t)));
document.addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT") return;
  if (e.target.getAttribute && e.target.getAttribute("role") === "tab" && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
    const i = TABS.indexOf(tab) + (e.key === "ArrowRight" ? 1 : -1);
    if (i >= 0 && i < TABS.length) { showTab(TABS[i]); $("tab-" + TABS[i]).focus(); }
    return;
  }
  if (tab !== "multiplikation") return;
  if (e.key === "ArrowRight") go(cur + 1);
  if (e.key === "ArrowLeft") go(cur - 1);
});
window.addEventListener("hashchange", () => showTab(location.hash.slice(1)));

bayesPanel();
renderStep();
showTab(location.hash.slice(1));
})();
