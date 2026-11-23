/* Lage und Streuung · Stats Lab
   Ein gemeinsamer Datensatz (Tage Arbeitsunfähigkeit), Punkte in allen Diagrammen ziehbar.
   Quartile nach Typ 7 (R-Standard, Excel QUARTILE.INC). Varianz wahlweise mit n − 1 oder n. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const tz = x => String(x).replace(/\./g, "{.}").replace(/,/g, "{,}").replace(/−/g, "-");
const TB = (t, fb) => window.texBlock ? texBlock(t, fb) : fb;
const TS = (t, fb) => window.katex ? texSteps(t) : fb;
const dec = (x, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const sgn = (x, d = 1) => (x < 0 ? "−" : x > 0 ? "+" : "") + dec(Math.abs(x), d);
const nice = x => Number.isInteger(x) ? String(x) : dec(x, 1);
const readout = (l, v) => `<div class="readout"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;

const PRESETS = {
  sym: [9, 11, 12, 13, 14, 15, 16, 17, 19, 21],
  skew: [2, 3, 4, 4, 5, 6, 8, 11, 16, 27],
  out: [9, 11, 12, 13, 14, 15, 16, 17, 19, 45]
};
const LO = 0, MAXV = 60, W = 900, L = 50, R = 30;
let HI = 30, PX = 1;   // Achsenende passt sich an die Daten an; PX = Pixel je Tag, auch für die Quadrate
const x = v => L + (v - LO) * PX;
const fitHI = shrink => { const m = Math.max(...S.data), h = Math.min(MAXV, Math.max(25, Math.ceil((m + 3) / 5) * 5)); HI = shrink ? h : Math.max(HI, h); PX = (W - L - R) / (HI - LO); };
const S = { data: PRESETS.sym.slice(), step: 1, den: "n1" };

/* ---------- Statistik ---------- */
function stats() {
  const d = S.data, n = d.length, sorted = d.slice().sort((a, b) => a - b);
  const sum = d.reduce((a, b) => a + b, 0), mean = sum / n;
  const q = p => { const h = (n - 1) * p, lo = Math.floor(h); return sorted[lo] + (h - lo) * ((sorted[lo + 1] ?? sorted[lo]) - sorted[lo]); };
  const med = q(0.5), q1 = q(0.25), q3 = q(0.75), iqr = q3 - q1;
  const sq = d.reduce((a, v) => a + (v - mean) ** 2, 0), dn = S.den === "n1" ? n - 1 : n, vr = sq / dn, sd = Math.sqrt(vr);
  return { n, sorted, sum, mean, med, q1, q3, iqr, sq, dn, vr, sd, min: sorted[0], max: sorted[n - 1] };
}
// Rang und Stapelhöhe je Datenpunkt (gleiche Werte werden übereinander gestapelt)
function layout() {
  const idx = S.data.map((v, i) => i).sort((a, b) => S.data[a] - S.data[b] || a - b);
  const rank = [], stack = [], seen = {};
  idx.forEach((i, r) => { rank[i] = r + 1; const v = S.data[i]; stack[i] = seen[v] = (seen[v] ?? -1) + 1; });
  return { idx, rank, stack };
}
function axis(y, ticks = true) {
  let s = `<line x1="${x(LO)}" x2="${x(HI)}" y1="${y}" y2="${y}" stroke="var(--fg)" stroke-width="2"/>`;
  if (ticks) for (let v = LO; v <= HI; v += 5) s += `<line x1="${x(v)}" x2="${x(v)}" y1="${y}" y2="${y + (v % 10 ? 5 : 8)}" stroke="var(--fg)"/>` + (v % 10 ? "" : `<text x="${x(v)}" y="${y + 24}" text-anchor="middle">${v}</text>`);
  return s + `<text x="${x(HI)}" y="${y + 42}" text-anchor="end">Tage arbeitsunfähig</text>`;
}
const dot = (i, cx, cy, fill, label, ring) => `<g class="dot" data-i="${i}"><circle cx="${cx}" cy="${cy}" r="10" fill="${fill}" stroke="${ring ? "var(--fg)" : "var(--surface)"}" stroke-width="${ring ? 2 : 1.5}"/>${label ? `<text class="rank" x="${cx}" y="${cy + 3.5}" text-anchor="middle" style="fill:${ring ? "var(--on-accent)" : "var(--fg)"}">${label}</text>` : ""}</g>`;

/* ---------- 1 Mittelwert und Median ---------- */
function draw1(st, lay) {
  const ay = 190, n = st.n, mid = n % 2 ? [Math.ceil(n / 2)] : [n / 2, n / 2 + 1];
  let s = axis(ay);
  s += `<line x1="${x(st.med)}" x2="${x(st.med)}" y1="38" y2="${ay}" stroke="var(--kontrolle)" stroke-width="2.5" stroke-dasharray="6 4"/><text class="strong" x="${x(st.med)}" y="28" text-anchor="middle" style="fill:var(--kontrolle-ink)">Median ${nice(st.med)}</text>`;
  S.data.forEach((v, i) => { const isMid = mid.includes(lay.rank[i]); s += dot(i, x(v), ay - 22 - lay.stack[i] * 22, isMid ? "var(--kontrolle)" : "var(--pal-2)", lay.rank[i], isMid); });
  const mx = x(st.mean);
  s += `<path d="M${mx} ${ay + 2} l-13 22 h26 z" fill="var(--therapie)" stroke="var(--surface)" stroke-width="2"/><text class="strong" x="${mx}" y="${ay + 50}" text-anchor="middle" style="fill:var(--therapie-ink)">x̄ = ${dec(st.mean)}</text>`;
  $("c1").innerHTML = s;
  const left = S.data.filter(v => v < st.mean).reduce((a, v) => a + (v - st.mean), 0);
  const sortedTxt = st.sorted.map((v, r) => mid.includes(r + 1) ? `<b>${v}</b>` : v).join(", ");
  const medTex = n % 2 ? String.raw`\text{Median } \tilde{x} = x_{(${mid[0]})} = ${tz(nice(st.med))}` : String.raw`\text{Median } \tilde{x} = \dfrac{x_{(${mid[0]})} + x_{(${mid[1]})}}{2} = ${tz(nice(st.med))}`;
  $("f1").innerHTML = TS(String.raw`\bar{x} = \dfrac{\sum x_i}{n} = \dfrac{${st.sum}}{${n}} = ${tz(dec(st.mean, 2))}`, `<span class="big">x̄ = Σx ÷ n = ${st.sum} ÷ ${n} = ${dec(st.mean, 2)}</span>`) +
    `<span>sortiert: ${sortedTxt}</span>` +
    TB(medTex, `<span class="big">Median = ${nice(st.med)}</span>`) +
    `<span class="dim">Abstände zum Mittelwert: links ${sgn(left)}, rechts ${sgn(-left)}</span>`;
  $("r1").innerHTML = readout("Mittelwert", dec(st.mean)) + readout("Median", nice(st.med)) + readout("Mittelwert − Median", sgn(st.mean - st.med));
  const gap = st.mean - st.med;
  $("t1").innerHTML = Math.abs(gap) >= 1.5
    ? `Der Mittelwert liegt <b>${dec(Math.abs(gap))} Tage ${gap > 0 ? "über" : "unter"}</b> dem Median. Einzelne lange Ausfälle ziehen den Schwerpunkt mit, der Median zählt nur Ränge und bleibt stehen. Bei schiefen Daten beschreibt der Median die typische Person besser.`
    : `Mittelwert und Median liegen nah beieinander, die Daten sind etwa symmetrisch. Der Mittelwert ist der Punkt, an dem die Wippe im Gleichgewicht ist: Die Abstände links und rechts heben sich auf. Ziehen Sie den rechten Punkt weit nach rechts und beobachten Sie beide Maße.`;
}

/* ---------- 2 Quartile und Boxplot ---------- */
function draw2(st, lay) {
  const ay = 240, by0 = 150, by1 = 192, bm = (by0 + by1) / 2;
  let s = axis(ay);
  const qs = [[st.q1, "Q1"], [st.med, "Median"], [st.q3, "Q3"]];
  qs.forEach(([v, n], k) => s += `<line x1="${x(v)}" x2="${x(v)}" y1="${k === 1 ? 16 : 34}" y2="${by1}" stroke="var(--fg)" stroke-width="1.5" stroke-dasharray="4 4"/><text class="strong" x="${x(v) + (k === 0 ? -5 : k === 2 ? 5 : 0)}" y="${k === 1 ? 10 : 28}" text-anchor="${k === 0 ? "end" : k === 2 ? "start" : "middle"}">${n} ${nice(+v.toFixed(2))}</text>`);
  const cuts = [st.min, st.q1, st.med, st.q3, st.max];
  for (let k = 0; k < 4; k++) { const cx = (x(cuts[k]) + x(cuts[k + 1])) / 2; if (x(cuts[k + 1]) - x(cuts[k]) > 34) s += `<text x="${cx}" y="128" text-anchor="middle">25 %</text>`; }
  const lf = st.q1 - 1.5 * st.iqr, uf = st.q3 + 1.5 * st.iqr;
  const inside = st.sorted.filter(v => v >= lf && v <= uf), wl = inside[0], wu = inside[inside.length - 1];
  s += `<line x1="${x(wl)}" x2="${x(st.q1)}" y1="${bm}" y2="${bm}" stroke="var(--fg)" stroke-width="2"/><line x1="${x(st.q3)}" x2="${x(wu)}" y1="${bm}" y2="${bm}" stroke="var(--fg)" stroke-width="2"/>`;
  s += `<line x1="${x(wl)}" x2="${x(wl)}" y1="${bm - 10}" y2="${bm + 10}" stroke="var(--fg)" stroke-width="2"/><line x1="${x(wu)}" x2="${x(wu)}" y1="${bm - 10}" y2="${bm + 10}" stroke="var(--fg)" stroke-width="2"/>`;
  s += `<rect x="${x(st.q1)}" y="${by0}" width="${Math.max(1, x(st.q3) - x(st.q1))}" height="${by1 - by0}" fill="var(--area-b)" stroke="var(--fg)" stroke-width="2"/><line x1="${x(st.med)}" x2="${x(st.med)}" y1="${by0}" y2="${by1}" stroke="var(--therapie)" stroke-width="4"/>`;
  st.sorted.filter(v => v < lf || v > uf).forEach(v => s += `<circle cx="${x(v)}" cy="${bm}" r="7" fill="var(--surface)" stroke="var(--therapie)" stroke-width="2.5"/>`);
  s += `<path d="M${x(st.q1)} ${by1 + 8} v6 h${x(st.q3) - x(st.q1)} v-6" fill="none" stroke="var(--accent)" stroke-width="2"/><text class="strong" x="${(x(st.q1) + x(st.q3)) / 2}" y="${by1 + 30}" text-anchor="middle" style="fill:var(--accent)">IQR = ${nice(+st.iqr.toFixed(2))}</text>`;
  S.data.forEach((v, i) => s += dot(i, x(v), 96 - lay.stack[i] * 22, "var(--pal-3)", lay.rank[i], false));
  $("c2").innerHTML = s;
  const f = v => nice(+v.toFixed(2));
  $("r2").innerHTML = readout("Minimum", f(st.min)) + readout("Q1 (25 %)", f(st.q1)) + readout("Median (50 %)", f(st.med)) + readout("Q3 (75 %)", f(st.q3)) + readout("Maximum", f(st.max)) + readout("IQR = Q3 − Q1", f(st.iqr)) + readout("Spannweite", f(st.max - st.min));
}

/* ---------- 3 Varianz ---------- */
function draw3(st, lay) {
  const step = S.step, n = st.n, mean = st.mean, devs = S.data.map(v => v - mean);
  const maxSide = Math.max(...devs.map(d => Math.abs(d))) * PX, sdSide = st.sd * PX;
  const top = 30, ay = step === 0 ? top + 20 + n * 18 : top + Math.max(maxSide, sdSide) + 10;
  const H = ay + 56; $("c3").setAttribute("viewBox", `0 0 ${W} ${H}`);
  let s = "";
  if (step === 3) s += `<rect x="${x(mean - st.sd)}" y="${ay - 14}" width="${2 * sdSide}" height="28" fill="var(--area-b)" opacity=".8"/>`;
  s += axis(ay);
  s += `<line x1="${x(mean)}" x2="${x(mean)}" y1="${top - 10}" y2="${ay}" stroke="var(--therapie)" stroke-width="2.5"/><text class="strong" x="${x(mean)}" y="${top - 16}" text-anchor="middle" style="fill:var(--therapie-ink)">x̄ = ${dec(mean)}</text>`;
  if (step === 0) {
    lay.idx.forEach((i, r) => { const d = devs[i], y = ay - 22 - r * 18, col = d < 0 ? "var(--kontrolle)" : "var(--therapie)";
      s += `<line x1="${x(mean)}" x2="${x(S.data[i])}" y1="${y}" y2="${y}" stroke="${col}" stroke-width="3"/><circle cx="${x(S.data[i])}" cy="${y}" r="3.5" fill="${col}"/><text x="${x(S.data[i]) + (d < 0 ? -8 : 8)}" y="${y + 4}" text-anchor="${d < 0 ? "end" : "start"}" style="fill:var(--fg)">${sgn(d)}</text>`; });
  }
  if (step >= 1) {
    const op = step === 1 ? 0.22 : 0.08, sop = step === 1 ? 1 : 0.35;
    lay.idx.forEach(i => { const d = devs[i], side = Math.abs(d) * PX, x0 = Math.min(x(S.data[i]), x(mean));
      s += `<rect x="${x0}" y="${ay - side}" width="${side}" height="${side}" fill="var(--pal-4)" fill-opacity="${op}" stroke="var(--pal-5)" stroke-opacity="${sop}" stroke-width="1.5"/>`; });
  }
  if (step >= 2) {
    s += `<rect x="${x(mean)}" y="${ay - sdSide}" width="${sdSide}" height="${sdSide}" fill="var(--therapie)" fill-opacity=".28" stroke="var(--therapie)" stroke-width="3"/>`;
    s += `<text class="strong" x="${x(mean) + sdSide / 2}" y="${ay - sdSide / 2 + 5}" text-anchor="middle" style="fill:var(--therapie-ink)">s² = ${dec(st.vr)}</text>`;
  }
  if (step === 3) {
    s += `<line x1="${x(mean)}" x2="${x(mean) + sdSide}" y1="${ay}" y2="${ay}" stroke="var(--therapie)" stroke-width="7"/><line x1="${x(mean) + sdSide}" x2="${x(mean) + sdSide}" y1="${ay}" y2="${ay - sdSide}" stroke="var(--therapie)" stroke-width="7"/>`;
    s += `<text class="strong" x="${x(mean) + sdSide + 10}" y="${ay - sdSide / 2}" style="fill:var(--therapie-ink)">s = ${dec(st.sd)}</text>`;
    s += `<text x="${x(mean - st.sd)}" y="${ay - 20}" text-anchor="middle">x̄ − s</text><text x="${x(mean + st.sd)}" y="${ay - 20}" text-anchor="middle">x̄ + s</text>`;
  }
  S.data.forEach((v, i) => s += dot(i, x(v), ay, "var(--pal-3)", "", false));
  $("c3").innerHTML = s;

  $("lg3").innerHTML = step === 0 ? `<span><i class="sw" style="background:var(--kontrolle)"></i>unter dem Mittelwert</span><span><i class="sw" style="background:var(--therapie)"></i>über dem Mittelwert</span>`
    : `<span><i class="sw" style="background:var(--pal-4);opacity:.5"></i>Abweichungsquadrat je Person</span>` + (step >= 2 ? `<span><i class="sw" style="background:var(--therapie);opacity:.5"></i>mittleres Quadrat = Varianz</span>` : "") + (step === 3 ? `<span><i class="sw" style="background:var(--area-b)"></i>x̄ ± s</span>` : "");
  const dn = S.den === "n1" ? `(n − 1) = ${st.dn}` : `n = ${st.dn}`;
  const terms = lay.idx.map(i => `${sgn(devs[i])}²`).join(" + ");
  const sumDev = devs.reduce((a, b) => a + b, 0);
  const dnT = S.den === "n1" ? "n - 1" : "n";
  const termsT = lay.idx.map(i => `(${tz(sgn(devs[i]))})^2`).join(" + ");
  const F = [
    TB(String.raw`\text{Abweichung} = x_i - \bar{x} \qquad \sum (x_i - \bar{x}) = ${tz(dec(Math.abs(sumDev) < 1e-9 ? 0 : sumDev))}`, "") + `<span class="dim">Plus und Minus heben sich immer auf. Deshalb wird quadriert.</span>`,
    TB(String.raw`SQ = \sum (x_i - \bar{x})^2 = ${tz(dec(st.sq))}`, "") + `<span class="dim">${terms}</span>`,
    TS(String.raw`s^2 = \dfrac{SQ}{${dnT}} = \dfrac{${tz(dec(st.sq))}}{${st.dn}} = ${tz(dec(st.vr))}\ \text{Tage}^2`, ""),
    TS(String.raw`s = \sqrt{s^2} = \sqrt{${tz(dec(st.vr))}} = ${tz(dec(st.sd))}\ \text{Tage}`, "")
  ];
  const Ffb = [
    `<span class="big">Abweichung = x − x̄</span><span>Summe aller Abweichungen = ${dec(Math.abs(sumDev) < 1e-9 ? 0 : sumDev)}</span><span class="dim">Plus und Minus heben sich immer auf. Deshalb wird quadriert.</span>`,
    `<span class="big">Quadratsumme SQ = Σ(x − x̄)² = ${dec(st.sq)}</span><span class="dim">${terms}</span>`,
    `<span>SQ = ${dec(st.sq)}</span><span class="big">Varianz s² = SQ ÷ ${dn} = ${dec(st.sq)} ÷ ${st.dn} = ${dec(st.vr)} Tage²</span>`,
    `<span>s² = ${dec(st.vr)} Tage²</span><span class="big">Standardabweichung s = √s² = √${dec(st.vr)} = ${dec(st.sd)} Tage</span>`
  ];
  if (!window.katex) F.splice(0, 4, ...Ffb);
  $("f3").innerHTML = F[step];
  $("r3").innerHTML = readout("Quadratsumme SQ (Tage²)", dec(st.sq)) + readout("Varianz s² (Tage²)", dec(st.vr)) + readout("Standardabweichung s (Tage)", dec(st.sd)) + readout("Nenner", S.den === "n1" ? `n − 1 = ${st.dn}` : `n = ${st.dn}`);
  const within = S.data.filter(v => Math.abs(v - mean) <= st.sd).length;
  const T = [
    "Jeder Pfeil zeigt, wie weit eine Person vom Mittelwert entfernt ist. Die Summe ist immer null, das ist die Schwerpunkt-Eigenschaft aus Abschnitt 1. Als Streuungsmaß taugt sie deshalb nicht.",
    "Aus jeder Abweichung wird ein echtes Quadrat mit der Abweichung als Seitenlänge. Große Abweichungen zählen überproportional: Ziehen Sie einen Punkt nach außen und sehen Sie, wie sein Quadrat wächst.",
    `Die Varianz ist die Fläche des mittleren Quadrats. Deshalb hat sie die Einheit Tage². ${S.den === "n1" ? "Geteilt wird durch n − 1, weil die Abweichungen vom Stichprobenmittelwert gemessen werden. Der liegt immer näher an den Daten als der wahre Mittelwert, ohne Korrektur fiele die Varianz im Mittel zu klein aus." : "Mit n geteilt ergibt sich die Varianz der vorliegenden Werte selbst. Als Schätzung für die Population fällt sie im Mittel zu klein aus, deshalb rechnen Statistikprogramme mit n − 1."}`,
    `Die Standardabweichung ist die Seitenlänge des mittleren Quadrats, wieder in Tagen. Bei annähernd normalverteilten Daten liegen etwa zwei Drittel der Werte im Bereich x̄ ± s. Hier sind es ${within} von ${n}.`
  ];
  $("t3").innerHTML = T[step];
  let t = `<thead><tr><th>Rang</th><th>x</th><th>x − x̄</th><th>(x − x̄)²</th></tr></thead><tbody>`;
  lay.idx.forEach((i, r) => t += `<tr><td>${r + 1}</td><td>${S.data[i]}</td><td>${sgn(devs[i], 2)}</td><td>${dec(devs[i] ** 2, 2)}</td></tr>`);
  t += `</tbody><tfoot><tr><td>Σ</td><td>${st.sum}</td><td>${dec(0, 2)}</td><td>${dec(st.sq, 2)}</td></tr></tfoot>`;
  $("tab3").innerHTML = t;
}

/* ---------- Steuerung ---------- */
function draw(shrink) {
  fitHI(shrink);
  const st = stats(), lay = layout();
  $("count").textContent = `n = ${st.n}`;
  $("values").innerHTML = "Werte sortiert: " + st.sorted.join(" · ");
  draw1(st, lay); draw2(st, lay); draw3(st, lay);
}
function seg(id, attr, cb) { $(id).addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; $(id).querySelectorAll("button").forEach(z => z.setAttribute("aria-pressed", z === b)); cb(b.dataset[attr]); }); }
seg("preset", "p", p => { S.data = PRESETS[p].slice(); draw(true); });
seg("step", "s", v => { S.step = +v; draw(); });
seg("den", "d", v => { S.den = v; draw(); });
const clearPreset = () => $("preset").querySelectorAll("button").forEach(z => z.setAttribute("aria-pressed", "false"));
const clamp = v => Math.max(LO, Math.min(MAXV, Math.round(v)));
function randn() { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); }
$("add").onclick = () => { if (S.data.length >= 20) return; const st = stats(); S.data.push(clamp(st.mean + randn() * Math.max(2, st.sd))); clearPreset(); draw(); };
$("del").onclick = () => { if (S.data.length <= 3) return; S.data.pop(); clearPreset(); draw(true); };
$("rnd").onclick = () => { S.data = Array.from({ length: 10 }, () => clamp(Math.exp(2.3 + 0.55 * randn()))); clearPreset(); draw(true); };

// Ziehen: in allen drei Diagrammen
["c1", "c2", "c3"].forEach(id => {
  const svg = $(id); let drag = null;
  const toVal = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(svg.getScreenCTM().inverse()); return clamp(LO + (q.x - L) / PX); };
  svg.addEventListener("pointerdown", e => { const g = e.target.closest(".dot"); if (!g) return; drag = +g.dataset.i; svg.setPointerCapture(e.pointerId); e.preventDefault(); });
  svg.addEventListener("pointermove", e => { if (drag === null) return; const v = toVal(e); if (v !== S.data[drag]) { S.data[drag] = v; clearPreset(); draw(); } });
  const end = () => { if (drag !== null) { drag = null; draw(true); } };
  svg.addEventListener("pointerup", end); svg.addEventListener("pointercancel", end);
});
draw(true);
})();
