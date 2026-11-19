/* Wahrscheinlichkeit als Fläche · Stats Lab
   Das Quadrat ist der Möglichkeitsraum. Spalten teilen ihn nach Ereignis A,
   innerhalb jeder Spalte liegt Ereignis B unten. Bei Unabhängigkeit liegt die
   B-Grenze in allen Spalten auf gleicher Höhe, bei Abhängigkeit springt sie. */
(() => {
"use strict";

// Mikrozensus 2024, Erstergebnisse, Lebensformen in Tausend (Statistisches Bundesamt 2025, Tabelle 12211-33)
const MZ = { ehe0: 9401, ehe1: 7873, lg0: 2198, lg1: 1143 };

const S = { pA: 0.3, pB: 0.5, generic: false, dir5: "KgV", prev: 0.05, noSymZ: 0.40, noSymH: 0.85, dir6: "SgZ" };

const $ = id => document.getElementById(id);
const pct = (x, d = 1) => (x * 100).toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }) + " %";
const num = (x, d = 3) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const int = x => Math.round(x).toLocaleString("de-DE");

// ---------- Zeichnen ----------
const X0 = 60, Y0 = 76, SIZE = 420;
const FILL = {
  strong: ["var(--therapie)", "var(--on-accent)"],
  soft: ["var(--area-a)", "var(--fg)"],
  b: ["var(--area-b)", "var(--fg)"],
  none: ["var(--surface)", "var(--muted)"]
};

function drawSquare(m) {
  let s = "";
  let x = X0;
  const outlines = [];
  m.cols.forEach((c, ci) => {
    const w = c.w * SIZE;
    const parts = m.bFrac ? [
      { isB: false, y: Y0, h: (1 - m.bFrac[ci]) * SIZE },
      { isB: true, y: Y0 + (1 - m.bFrac[ci]) * SIZE, h: m.bFrac[ci] * SIZE }
    ] : [{ isB: false, y: Y0, h: SIZE }];
    parts.forEach(p => {
      const role = m.role(ci, p.isB);
      const [fill, ink] = FILL[role];
      s += `<rect x="${x.toFixed(1)}" y="${p.y.toFixed(1)}" width="${w.toFixed(1)}" height="${p.h.toFixed(1)}" fill="${fill}" stroke="var(--line)" stroke-width="1.5"/>`;
      const lab = m.cellLabel ? m.cellLabel(ci, p.isB) : null;
      if (lab && p.h > 0) {
        const cx = x + w / 2, cy = p.y + p.h / 2;
        if (w >= 84 && p.h >= 46) {
          s += `<text class="cell-label" x="${cx}" y="${cy - 3}" text-anchor="middle" fill="${ink}">${lab[0]}</text>`;
          if (lab[1]) s += `<text class="cell-sub" x="${cx}" y="${cy + 15}" text-anchor="middle" fill="${ink}">${lab[1]}</text>`;
        } else if (w >= 40 && p.h >= 22 && lab[1]) {
          s += `<text class="cell-sub" x="${cx}" y="${cy + 4}" text-anchor="middle" fill="${ink}">${lab[1]}</text>`;
        }
      }
      if (m.outline && m.outline(ci, p.isB) && p.h > 0) outlines.push({ x, y: p.y, w, h: p.h });
    });
    // Spaltenbeschriftung
    if (c.label) {
      const narrow = w < 90;
      const tx = narrow ? x + 2 : x + w / 2, anchor = narrow ? "start" : "middle";
      s += `<text class="col-label" x="${tx}" y="${Y0 - 30}" text-anchor="${anchor}">${c.label}</text>`;
      if (c.sub) s += `<text class="col-sub" x="${tx}" y="${Y0 - 12}" text-anchor="${anchor}">${c.sub}</text>`;
    }
    x += w;
  });
  if (m.indep != null) {
    const y = Y0 + (1 - m.indep) * SIZE;
    s += `<line x1="${X0}" x2="${X0 + SIZE}" y1="${y}" y2="${y}" stroke="var(--fg)" stroke-width="1.5" stroke-dasharray="6 5"/>`;
    s += `<text class="indep" x="${X0 + SIZE + 6}" y="${y + 4}">${pct(m.indep)}</text>`;
  }
  outlines.forEach(o => { s += `<rect x="${(o.x + 2).toFixed(1)}" y="${(o.y + 2).toFixed(1)}" width="${Math.max(0, o.w - 4).toFixed(1)}" height="${Math.max(0, o.h - 4).toFixed(1)}" fill="none" stroke="var(--accent)" stroke-width="4" stroke-dasharray="9 6"/>`; });
  s += `<rect x="${X0}" y="${Y0}" width="${SIZE}" height="${SIZE}" fill="none" stroke="var(--fg)" stroke-width="2"/>`;
  if (m.bLabel) {
    s += `<text class="indep" x="${X0 - 10}" y="${Y0 + SIZE - 6}" text-anchor="start" transform="rotate(-90 ${X0 - 10} ${Y0 + SIZE - 6})">${m.bLabel} liegt jeweils unten</text>`;
  }
  s += `<text class="indep" x="${X0}" y="${Y0 + SIZE + 26}">Gesamtfläche = 1 · ${m.caption || ""}</text>`;
  $("square").innerHTML = s;
  $("square").setAttribute("aria-label", m.aria || "Möglichkeitsraum als Quadrat");
}

// ---------- Schritte ----------
const STEPS = [
  {
    kicker: "Schritt 1 · Möglichkeitsraum", title: "Alles, was passieren kann",
    panel: () => `
      <p>Das Quadrat steht für alle möglichen Ergebnisse eines Zufallsexperiments. Seine Fläche ist 1, also 100 %. Eine Wahrscheinlichkeit ist nichts anderes als der Anteil dieser Fläche, den ein Ereignis einnimmt.</p>
      <div class="formula"><span class="big">P(Ω) = 1</span><span>Ω (Omega) ist der Ergebnisraum.</span></div>`,
    model: () => ({ cols: [{ w: 1 }], bFrac: null, role: () => "none", cellLabel: () => ["Alle möglichen Ergebnisse", "Fläche = 1"], caption: "Ω", aria: "Leeres Quadrat, Fläche 1" })
  },
  {
    kicker: "Schritt 2 · Ein Ereignis", title: "Ein Würfel teilt die Fläche in sechs Streifen",
    panel: () => `
      <p>Ein fairer sechsseitiger Würfel: Jede Augenzahl bekommt einen gleich breiten senkrechten Streifen. Das Ereignis „Sechs“ ist der markierte Streifen.</p>
      <div class="formula"><span class="big">P(6) = 1/6 ≈ 16,7 %</span></div>
      <div class="legend"><span><i class="sw" style="background:var(--area-a)"></i>Ereignis A: Sechs</span></div>`,
    model: () => ({
      cols: [1, 2, 3, 4, 5, 6].map(k => ({ w: 1 / 6, label: String(k), sub: "1/6" })), bFrac: null,
      role: ci => ci === 5 ? "soft" : "none", cellLabel: ci => ci === 5 ? ["Sechs", "1/6"] : null, caption: "6 Streifen", aria: "Quadrat in sechs Streifen, der sechste markiert"
    })
  },
  {
    kicker: "Schritt 3 · Ein zweites Ereignis", title: "Eine Münze teilt die Fläche quer",
    panel: () => `
      <p>Jetzt eine Münze, unabhängig vom Würfel. Sie teilt das Quadrat waagerecht: unten Kopf, oben Zahl, jeweils die halbe Fläche.</p>
      <div class="formula"><span class="big">P(Kopf) = 1/2 = 50 %</span></div>
      <div class="legend"><span><i class="sw" style="background:var(--area-b)"></i>Ereignis B: Kopf</span></div>`,
    model: () => ({ cols: [{ w: 1 }], bFrac: [0.5], role: (ci, b) => b ? "b" : "none", cellLabel: (ci, b) => b ? ["Kopf", "1/2"] : ["Zahl", "1/2"], caption: "2 Hälften", aria: "Quadrat waagerecht geteilt in Kopf und Zahl" })
  },
  {
    kicker: "Schritt 4 · Multiplikationssatz", title: "Beides zugleich: die Schnittfläche",
    panel: () => `
      <p>Legt man beide Teilungen übereinander, entstehen 12 gleich große Felder. „Sechs und Kopf“ ist genau ein Feld: das Rechteck, das von beiden Ereignissen begrenzt wird. Seine Fläche ist Breite mal Höhe.</p>
      <div class="formula" id="f4"></div>
      <p>Die waagerechte Grenze läuft in jeder Spalte auf derselben Höhe. Die Münze „weiß“ nichts vom Würfel. Genau das heißt <b>unabhängig</b>: P(Kopf | 6) = P(Kopf).</p>
      <div class="legend"><span><i class="sw" style="background:var(--therapie)"></i>A und B</span><span><i class="sw" style="background:var(--area-a)"></i>nur A</span><span><i class="sw" style="background:var(--area-b)"></i>nur B</span></div>
      <div class="ctrls">
        <span class="source">Eigene Werte ausprobieren:</span>
        <div class="ctrl"><div class="ctrl-head"><label for="pA">P(A)</label><output id="pA-v"></output></div><input id="pA" type="range" min="0.05" max="0.95" step="0.01"></div>
        <div class="ctrl"><div class="ctrl-head"><label for="pB">P(B)</label><output id="pB-v"></output></div><input id="pB" type="range" min="0.05" max="0.95" step="0.01"></div>
        <button class="linkbtn" type="button" id="back-dice">Zurück zu Würfel und Münze</button>
      </div>`,
    init: () => {
      $("pA").value = S.pA; $("pB").value = S.pB;
      $("pA").addEventListener("input", e => { S.pA = +e.target.value; S.generic = true; update(); });
      $("pB").addEventListener("input", e => { S.pB = +e.target.value; S.generic = true; update(); });
      $("back-dice").addEventListener("click", () => { S.generic = false; update(); });
    },
    update: () => {
      $("pA-v").textContent = pct(S.pA, 0); $("pB-v").textContent = pct(S.pB, 0);
      $("back-dice").hidden = !S.generic;
      $("f4").innerHTML = S.generic
        ? `<span>P(A ∩ B) = P(A) · P(B)</span><span class="big">= ${num(S.pA, 2)} · ${num(S.pB, 2)} = ${num(S.pA * S.pB, 3)} ≈ ${pct(S.pA * S.pB)}</span>`
        : `<span>P(6 ∩ Kopf) = P(6) · P(Kopf)</span><span class="big">= 1/6 · 1/2 = 1/12 ≈ 8,3 %</span>`;
    },
    model: () => S.generic ? {
      cols: [{ w: S.pA, label: "A", sub: pct(S.pA, 0) }, { w: 1 - S.pA, label: "nicht A", sub: pct(1 - S.pA, 0) }], bFrac: [S.pB, S.pB],
      role: (ci, b) => ci === 0 && b ? "strong" : ci === 0 ? "soft" : b ? "b" : "none",
      cellLabel: (ci, b) => ci === 0 && b ? ["A und B", pct(S.pA * S.pB)] : null, bLabel: "B", caption: "unabhängig", aria: "Schnittfläche A und B"
    } : {
      cols: [1, 2, 3, 4, 5, 6].map(k => ({ w: 1 / 6, label: String(k), sub: "1/6" })), bFrac: Array(6).fill(0.5),
      role: (ci, b) => ci === 5 && b ? "strong" : ci === 5 ? "soft" : b ? "b" : "none",
      cellLabel: (ci, b) => ci === 5 && b ? ["6 + Kopf", "1/12"] : (b ? [null, "1/12"] : [null, "1/12"]), bLabel: "Kopf", caption: "12 gleiche Felder", aria: "Zwölf Felder, Sechs und Kopf markiert"
    }
  },
  {
    kicker: "Schritt 5 · Abhängige Ereignisse", title: "Verheiratet und Kinder",
    panel: () => {
      const tot = MZ.ehe0 + MZ.ehe1 + MZ.lg0 + MZ.lg1;
      return `
      <p>Echte Daten: alle Paare in Deutschland 2024, rund ${num(tot / 1000, 1)} Mio. Senkrecht geteilt nach verheiratet oder nicht, unten jeweils der Anteil mit Kindern im Haushalt.</p>
      <p>Jetzt springt die Grenze: Bei Ehepaaren liegt der Kinderanteil höher als bei unverheirateten Paaren. Die Ereignisse sind <b>abhängig</b>. Der Multiplikationssatz braucht dann die bedingte Wahrscheinlichkeit.</p>
      <div class="formula" id="f5"></div>
      <div class="seg" role="group" aria-label="Richtung der Bedingung">
        <button type="button" data-d5="KgV">P(Kinder | verheiratet)</button>
        <button type="button" data-d5="VgK">P(verheiratet | Kinder)</button>
      </div>
      <div class="legend"><span><i class="sw" style="background:var(--therapie)"></i>verheiratet und Kinder</span><span><i class="sw outline"></i>Bezugsfläche (das, was gegeben ist)</span><span>gestrichelte Linie: Kinderanteil, wenn Ehe und Kinder unabhängig wären</span></div>
      <p class="callout">Gleicher Zähler, andere Bezugsfläche: Darum ist P(Kinder | verheiratet) nicht dasselbe wie P(verheiratet | Kinder). Das ist die Brücke zu Bayes.</p>
      <p class="source">Quelle: Statistisches Bundesamt (2025), Mikrozensus 2024, Haushalte und Familien, Erstergebnisse, Tabelle 12211-33. Kinder = ledige Kinder jeden Alters im Haushalt; Paare, deren Kinder ausgezogen sind, zählen als „ohne Kinder“.</p>`;
    },
    init: () => document.querySelectorAll("[data-d5]").forEach(b => b.addEventListener("click", () => { S.dir5 = b.dataset.d5; update(); })),
    update: () => {
      const tot = MZ.ehe0 + MZ.ehe1 + MZ.lg0 + MZ.lg1, pV = (MZ.ehe0 + MZ.ehe1) / tot, pK = (MZ.ehe1 + MZ.lg1) / tot;
      const pVK = MZ.ehe1 / tot, pKgV = MZ.ehe1 / (MZ.ehe0 + MZ.ehe1), pKgN = MZ.lg1 / (MZ.lg0 + MZ.lg1), pVgK = MZ.ehe1 / (MZ.ehe1 + MZ.lg1);
      document.querySelectorAll("[data-d5]").forEach(b => b.setAttribute("aria-pressed", b.dataset.d5 === S.dir5));
      $("f5").innerHTML = (S.dir5 === "KgV"
        ? `<span>P(Kinder | verheiratet) = P(verh. ∩ Kinder) / P(verh.)</span><span class="big">= ${num(pVK)} / ${num(pV)} = ${pct(pKgV)}</span><span>zum Vergleich: P(Kinder | nicht verh.) = ${pct(pKgN)} · P(Kinder) = ${pct(pK)}</span>`
        : `<span>P(verheiratet | Kinder) = P(verh. ∩ Kinder) / P(Kinder)</span><span class="big">= ${num(pVK)} / ${num(pK)} = ${pct(pVgK)}</span><span>zum Vergleich: P(verheiratet) = ${pct(pV)}</span>`)
        + `<span>Multiplikationssatz: P(verh. ∩ Kinder) = P(verh.) · P(Kinder | verh.) = ${num(pV)} · ${num(pKgV)} = ${num(pVK)}</span>`;
    },
    model: () => {
      const tot = MZ.ehe0 + MZ.ehe1 + MZ.lg0 + MZ.lg1, pV = (MZ.ehe0 + MZ.ehe1) / tot, pK = (MZ.ehe1 + MZ.lg1) / tot;
      const fr = [MZ.ehe1 / (MZ.ehe0 + MZ.ehe1), MZ.lg1 / (MZ.lg0 + MZ.lg1)];
      return {
        cols: [{ w: pV, label: "verheiratet", sub: pct(pV) }, { w: 1 - pV, label: "nicht verh.", sub: pct(1 - pV) }], bFrac: fr,
        role: (ci, b) => ci === 0 && b ? "strong" : ci === 0 ? "soft" : b ? "b" : "none",
        cellLabel: (ci, b) => b ? ["mit Kindern", pct(fr[ci])] : ["ohne Kinder", pct(1 - fr[ci])],
        outline: (ci, b) => S.dir5 === "KgV" ? ci === 0 : b,
        indep: pK, bLabel: "Kinder", caption: "Paare 2024, Mikrozensus", aria: "Paare nach Ehe und Kindern, Kinderanteil je Spalte verschieden"
      };
    }
  },
  {
    kicker: "Schritt 6 · Satz von Bayes", title: "Symptomfrei bei Zirrhose oder Zirrhose bei Symptomfreiheit?",
    panel: () => `
      <p>Viele Leberzirrhosen verlaufen lange ohne Symptome. Heißt das umgekehrt: Wer keine Symptome hat, hat wahrscheinlich eine Zirrhose? Die Flächen zeigen, warum nicht.</p>
      <div class="seg" role="group" aria-label="Richtung der Bedingung">
        <button type="button" data-d6="SgZ">P(keine Sympt. | Zirrhose)</button>
        <button type="button" data-d6="ZgS">P(Zirrhose | keine Sympt.)</button>
      </div>
      <div class="formula" id="f6"></div>
      <p class="freq" id="freq6"></p>
      <div class="legend"><span><i class="sw" style="background:var(--therapie)"></i>Zirrhose und keine Symptome</span><span><i class="sw" style="background:var(--area-b)"></i>keine Symptome, keine Zirrhose</span><span><i class="sw outline"></i>Bezugsfläche</span></div>
      <div class="ctrls">
        <span class="source">Beispielzahlen, keine klinischen Daten. Verschieben Sie die Annahmen:</span>
        <div class="ctrl"><div class="ctrl-head"><label for="prev">Prävalenz P(Zirrhose)</label><output id="prev-v"></output></div><input id="prev" type="range" min="0.005" max="0.5" step="0.005"></div>
        <div class="ctrl"><div class="ctrl-head"><label for="nsz">P(keine Symptome | Zirrhose)</label><output id="nsz-v"></output></div><input id="nsz" type="range" min="0" max="1" step="0.01"></div>
        <div class="ctrl"><div class="ctrl-head"><label for="nsh">P(keine Symptome | keine Zirrhose)</label><output id="nsh-v"></output></div><input id="nsh" type="range" min="0" max="1" step="0.01"></div>
      </div>
      <p class="callout">Der p-Wert hat dieselbe Struktur: P(Daten | H0) ist nicht P(H0 | Daten). Wer die Richtung vertauscht, vergisst die Prävalenz, in der Statistik die Vorab-Wahrscheinlichkeit von H0.</p>`,
    init: () => {
      $("prev").value = S.prev; $("nsz").value = S.noSymZ; $("nsh").value = S.noSymH;
      $("prev").addEventListener("input", e => { S.prev = +e.target.value; update(); });
      $("nsz").addEventListener("input", e => { S.noSymZ = +e.target.value; update(); });
      $("nsh").addEventListener("input", e => { S.noSymH = +e.target.value; update(); });
      document.querySelectorAll("[data-d6]").forEach(b => b.addEventListener("click", () => { S.dir6 = b.dataset.d6; update(); }));
    },
    update: () => {
      const p = S.prev, a = S.noSymZ, b = S.noSymH;
      const joint = p * a, pS = p * a + (1 - p) * b, post = pS > 0 ? joint / pS : 0;
      $("prev-v").textContent = pct(p); $("nsz-v").textContent = pct(a, 0); $("nsh-v").textContent = pct(b, 0);
      document.querySelectorAll("[data-d6]").forEach(x => x.setAttribute("aria-pressed", x.dataset.d6 === S.dir6));
      $("f6").innerHTML = S.dir6 === "SgZ"
        ? `<span>P(keine Sympt. | Zirrhose) = Schnittfläche / Zirrhose-Spalte</span><span class="big">= ${num(joint, 4)} / ${num(p, 4)} = ${pct(a)}</span>`
        : `<span>P(Zirrhose | keine Sympt.) = P(Z) · P(kS | Z) / P(kS)</span><span>= ${num(p, 3)} · ${num(a, 2)} / (${num(p, 3)} · ${num(a, 2)} + ${num(1 - p, 3)} · ${num(b, 2)})</span><span class="big">= ${num(joint, 4)} / ${num(pS, 4)} = ${pct(post)}</span>`;
      const n = 1000, nz = n * p, nzs = nz * a, nh = n - nz, nhs = nh * b;
      $("freq6").innerHTML = `Von ${int(n)} Personen haben ${int(nz)} eine Zirrhose, davon sind ${int(nzs)} symptomfrei. Von den ${int(nh)} ohne Zirrhose sind ${int(nhs)} symptomfrei. <b>Unter ${int(nzs + nhs)} Symptomfreien haben nur ${int(nzs)} eine Zirrhose.</b>`;
    },
    model: () => {
      const p = S.prev;
      return {
        cols: [{ w: p, label: "Zirrhose", sub: pct(p) }, { w: 1 - p, label: "keine Zirrhose", sub: pct(1 - p) }], bFrac: [S.noSymZ, S.noSymH],
        role: (ci, b) => ci === 0 && b ? "strong" : ci === 0 ? "soft" : b ? "b" : "none",
        cellLabel: (ci, b) => ci === 1 ? (b ? ["keine Symptome", pct(S.noSymH, 0)] : ["Symptome", pct(1 - S.noSymH, 0)]) : null,
        outline: (ci, b) => S.dir6 === "SgZ" ? ci === 0 : b,
        bLabel: "keine Symptome", caption: "Beispielzahlen", aria: "Bayes-Quadrat zu Zirrhose und Symptomfreiheit"
      };
    }
  }
];

let cur = 0;
function update() { const st = STEPS[cur]; if (st.update) st.update(); drawSquare(st.model()); }
function render() {
  const st = STEPS[cur];
  $("detail").innerHTML = `<span class="kicker">${st.kicker}</span><h2>${st.title}</h2>${st.panel()}`;
  if (st.init) st.init();
  update();
  $("step-count").textContent = `${cur + 1} von ${STEPS.length}`;
  document.querySelectorAll("#dots button").forEach((b, i) => b.setAttribute("aria-selected", i === cur));
  $("prev").disabled = cur === 0; $("next").disabled = cur === STEPS.length - 1;
  $("prev").style.opacity = cur === 0 ? .4 : 1; $("next").style.opacity = cur === STEPS.length - 1 ? .4 : 1;
}
const go = i => { cur = Math.max(0, Math.min(STEPS.length - 1, i)); render(); };
$("dots").innerHTML = STEPS.map(s => `<button type="button" role="tab" aria-label="${s.kicker}"></button>`).join("");
document.querySelectorAll("#dots button").forEach((b, i) => b.addEventListener("click", () => go(i)));
$("prev").addEventListener("click", () => go(cur - 1));
$("next").addEventListener("click", () => go(cur + 1));
document.addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT") return;
  if (e.key === "ArrowRight") go(cur + 1);
  if (e.key === "ArrowLeft") go(cur - 1);
});
render();
})();
