/* Chi-Quadrat-Test auf Unabhängigkeit · Stats Lab
   Verteilungsfunktion der χ²-Verteilung über die regularisierte unvollständige Gammafunktion. */
(() => {
const tz = x => String(x).replace(/\./g, "{.}").replace(/,/g, "{,}").replace(/−/g, "-").replace(/ %/g, "\\,\\%");
const TB = (t, fb) => window.katex ? texBlock(t) : fb;
"use strict";

/* ---------- Mathematik ---------- */
const LG = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
function lgamma(x) { if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x); x -= 1; let a = 0.99999999999980993; const t = x + 7.5; for (let i = 0; i < 8; i++) a += LG[i] / (x + i + 1); return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a); }
function gammaP(a, x) {
  if (x <= 0) return 0;
  if (x < a + 1) { let sum = 1 / a, del = sum, ap = a; for (let n = 0; n < 500; n++) { ap += 1; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-14) break; } return sum * Math.exp(-x + a * Math.log(x) - lgamma(a)); }
  let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
  for (let i = 1; i < 500; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-14) break; }
  return 1 - Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}
const chiCdf = (x, k) => gammaP(k / 2, x / 2);
const chiPdf = (x, k) => x <= 0 ? (k === 2 ? 0.5 : 0) : Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.log(2) - lgamma(k / 2));
function chiInv(p, k) { let lo = 0, hi = 200; for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (chiCdf(m, k) < p) lo = m; else hi = m; } return (lo + hi) / 2; }

/* ---------- Daten ---------- */
const PRESETS = {
  rtw: { q: "Kehren nach sechs Wochen mehr Behandelte an den Arbeitsplatz zurück?", rows: ["Therapie", "Kontrolle"], cols: ["zurück", "nicht zurück"], m: [[34, 16], [22, 28]] },
  verlauf: { q: "Unterscheidet sich der Schmerzverlauf zwischen den Gruppen?", rows: ["Therapie", "Kontrolle"], cols: ["besser", "gleich", "schlechter"], m: [[30, 15, 5], [18, 20, 12]] },
  null: { q: "Ein Beispiel ohne echten Zusammenhang", rows: ["Therapie", "Kontrolle"], cols: ["zurück", "nicht zurück"], m: [[25, 25], [24, 26]] }
};
const S = { rows: [], cols: [], m: [], q: "", alpha: 0.05, preset: "rtw", sim: null };
function load(k) { const P = PRESETS[k]; S.rows = [...P.rows]; S.cols = [...P.cols]; S.m = P.m.map(r => [...r]); S.q = P.q; S.preset = k; S.sim = null; }

const $ = id => document.getElementById(id);
const fmt = (x, d = 2) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (x, d = 1) => (x * 100).toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }) + " %";
const fmtP = p => p < 0.001 ? "< 0,001" : fmt(p, 3);
const intf = x => Math.round(x).toLocaleString("de-DE");
const path = pts => pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join("");
const area = (pts, y0) => pts.length ? path(pts) + `L${pts[pts.length - 1][0].toFixed(1)},${y0}L${pts[0][0].toFixed(1)},${y0}Z` : "";
const readout = (l, v) => `<div class="readout"><div class="val">${v}</div><div class="lbl2">${l}</div></div>`;
const CAT = ["var(--pal-6)", "var(--pal-4)", "var(--pal-2)", "var(--pal-5)", "var(--pal-3)"];
const CAT_INK = ["#FFFFFF", "#10233A", "#10233A", "#FFFFFF", "#10233A"];

function stats(m) {
  const r = m.length, c = m[0].length;
  const rs = m.map(row => row.reduce((a, b) => a + b, 0)), cs = Array.from({ length: c }, (_, j) => m.reduce((a, row) => a + row[j], 0));
  const N = rs.reduce((a, b) => a + b, 0);
  const E = m.map((row, i) => row.map((_, j) => N ? rs[i] * cs[j] / N : 0));
  let chi = 0; const C = m.map((row, i) => row.map((o, j) => { const e = E[i][j]; const v = e > 0 ? (o - e) ** 2 / e : 0; chi += v; return v; }));
  const df = (r - 1) * (c - 1);
  return { r, c, rs, cs, N, E, C, chi, df, p: df > 0 ? 1 - chiCdf(chi, df) : 1, V: N && Math.min(r, c) > 1 ? Math.sqrt(chi / (N * (Math.min(r, c) - 1))) : 0 };
}

/* ---------- Tabelle ---------- */
function buildTable() {
  const st = stats(S.m);
  let h = `<tr><th></th>${S.cols.map((c, j) => `<th><input class="lab" data-col="${j}" value="${c}" aria-label="Name der Spalte ${j + 1}"></th>`).join("")}<th class="tot">Summe</th></tr>`;
  S.m.forEach((row, i) => {
    h += `<tr><th class="rowh"><input class="lab" data-row="${i}" value="${S.rows[i]}" aria-label="Name der Zeile ${i + 1}"></th>${row.map((v, j) => `<td><input type="number" min="0" step="1" data-i="${i}" data-j="${j}" value="${v}" aria-label="${S.rows[i]}, ${S.cols[j]}"></td>`).join("")}<td class="tot" id="rs${i}">${st.rs[i]}</td></tr>`;
  });
  h += `<tr><th class="rowh tot">Summe</th>${st.cs.map((v, j) => `<td class="tot" id="cs${j}">${v}</td>`).join("")}<td class="tot" id="N">${st.N}</td></tr>`;
  $("obs").innerHTML = h;
  $("obs").querySelectorAll("input[type=number]").forEach(el => el.addEventListener("input", () => {
    const v = Math.max(0, Math.round(+el.value || 0)); S.m[+el.dataset.i][+el.dataset.j] = v; S.sim = null; markPreset(null); update(true);
  }));
  $("obs").querySelectorAll("input.lab").forEach(el => el.addEventListener("input", () => {
    if (el.dataset.col != null) S.cols[+el.dataset.col] = el.value; else S.rows[+el.dataset.row] = el.value; update(false);
  }));
  $("question").textContent = S.q;
  $("delRow").disabled = S.rows.length <= 2; $("delCol").disabled = S.cols.length <= 2;
  $("addRow").disabled = S.rows.length >= 4; $("addCol").disabled = S.cols.length >= 5;
}
function markPreset(k) { document.querySelectorAll("[data-preset]").forEach(b => b.setAttribute("aria-pressed", b.dataset.preset === k)); if (!k) S.q = "Eigene Daten"; $("question").textContent = S.q; }

/* ---------- Darstellung ---------- */
function update(totals) {
  const st = stats(S.m);
  if (totals) { st.rs.forEach((v, i) => { const el = $("rs" + i); if (el) el.textContent = v; }); st.cs.forEach((v, j) => { const el = $("cs" + j); if (el) el.textContent = v; }); $("N").textContent = st.N; }
  document.querySelectorAll("[data-alpha]").forEach(b => b.setAttribute("aria-pressed", +b.dataset.alpha === S.alpha));
  const crit = chiInv(1 - S.alpha, st.df), sig = st.p < S.alpha;
  $("verdict").innerHTML = `<span class="big">χ² = ${fmt(st.chi, 2)}, p ${st.p < 0.001 ? "< 0,001" : "= " + fmt(st.p, 3)}</span><span class="sub">df = ${st.df} · Cramérs V = ${fmt(st.V, 2)} · ${sig ? "H0 verwerfen: Zusammenhang nachweisbar" : "H0 beibehalten: kein Zusammenhang nachweisbar"}</span>`;
  drawMosaic(st); drawExpected(st); drawContrib(st); drawDist(st, crit); drawEffect(st); drawSim(st);
}

function drawMosaic(st) {
  const L = 40, R = 600, T = 30, B = 290, gap = 6;
  let s = "", x = L;
  const W = R - L - gap * (st.r - 1);
  const overall = st.cs.map(c => st.N ? c / st.N : 0);
  S.m.forEach((row, i) => {
    const w = st.N ? st.rs[i] / st.N * W : 0;
    let y = T;
    row.forEach((o, j) => {
      const h = st.rs[i] ? o / st.rs[i] * (B - T) : 0;
      s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(0, w).toFixed(1)}" height="${h.toFixed(1)}" fill="${CAT[j % CAT.length]}" stroke="var(--surface)" stroke-width="1.5"/>`;
      if (h > 22 && w > 50) s += `<text x="${x + w / 2}" y="${y + h / 2 + 5}" text-anchor="middle" style="fill:${CAT_INK[j % CAT.length]};font-weight:600">${o} · ${pct(o / st.rs[i], 0)}</text>`;
      y += h;
    });
    s += `<text class="lab" x="${x + w / 2}" y="${T - 10}" text-anchor="middle">${S.rows[i]} (n = ${st.rs[i]})</text>`;
    x += w + gap;
  });
  let cum = 0;
  overall.slice(0, -1).forEach(p => { cum += p; const y = T + cum * (B - T); s += `<line x1="${L - 6}" x2="${R + 6}" y1="${y}" y2="${y}" stroke="var(--fg)" stroke-width="2" stroke-dasharray="7 5"/>`; });
  s += `<text x="${L}" y="${B + 22}">Breite = Gruppengröße · Höhe = Anteil der Kategorie in der Gruppe · gestrichelt = Anteil insgesamt</text>`;
  $("mosaic").innerHTML = s;
  $("mosaic").setAttribute("aria-label", "Mosaikdiagramm der beobachteten Häufigkeiten");
  $("mosaic-legend").innerHTML = S.cols.map((c, j) => `<span><i class="sw" style="background:${CAT[j % CAT.length]}"></i>${c} (insgesamt ${pct(overall[j], 0)})</span>`).join("");
}

function drawExpected(st) {
  const i0 = 0, j0 = 0;
  $("e-formula").innerHTML = `<span class="dim">Beispiel ${S.rows[i0]} · ${S.cols[j0]}</span>` + TB(String.raw`E = \dfrac{\text{Zeilensumme} \cdot \text{Spaltensumme}}{N} = \dfrac{${st.rs[i0]} \cdot ${st.cs[j0]}}{${st.N}} = ${tz(fmt(st.E[i0][j0], 1))}`, `<span class="big">E = ${fmt(st.E[i0][j0], 1)}</span>`) + `<span class="dim">beobachtet: ${S.m[i0][j0]}</span>`;
  $("exp").innerHTML = `<tr><th class="rowh">beobachtet (erwartet)</th>${S.cols.map(c => `<th>${c}</th>`).join("")}</tr>` +
    S.m.map((row, i) => `<tr><th class="rowh">${S.rows[i]}</th>${row.map((o, j) => `<td><span class="o">${o}</span> <span class="e">(${fmt(st.E[i][j], 1)})</span></td>`).join("")}</tr>`).join("");
  const low = st.E.flat().filter(e => e < 5).length;
  $("e-warn").textContent = low ? `Achtung: ${low} erwartete Häufigkeit${low > 1 ? "en liegen" : " liegt"} unter 5. Dann ist die χ²-Näherung ungenau, für 2 × 2-Tabellen ist der exakte Test nach Fisher die bessere Wahl.` : "";
}

function drawContrib(st) {
  const max = Math.max(...st.C.flat(), 1e-9);
  $("contrib").innerHTML = `<tr><th class="rowh">(O − E)² / E</th>${S.cols.map(c => `<th>${c}</th>`).join("")}</tr>` +
    S.m.map((row, i) => `<tr><th class="rowh">${S.rows[i]}</th>${row.map((o, j) => {
      const v = st.C[i][j], a = v / max, dir = o > st.E[i][j] ? "mehr als erwartet" : o < st.E[i][j] ? "weniger als erwartet" : "wie erwartet";
      const bg = `rgba(4, 90, 141, ${(a * 0.85).toFixed(2)})`, ink = a > 0.5 ? "#FFFFFF" : "var(--fg)";
      return `<td style="background:${bg};color:${ink}"><span class="o">${fmt(v, 2)}</span><span class="dir">${dir}</span></td>`;
    }).join("")}</tr>`).join("");
  const parts = st.C.flat().map(v => fmt(v, 2));
  const partsT = st.C.flat().map(v => tz(fmt(v, 2)));
  $("chi-formula").innerHTML = TB(String.raw`\chi^2 = \sum \dfrac{(O - E)^2}{E} = ${partsT.length <= 6 ? partsT.join(" + ") : partsT.slice(0, 5).join(" + ") + " + \\ldots"} = \mathbf{${tz(fmt(st.chi, 2))}}`, `<span class="big">χ² = ${fmt(st.chi, 2)}</span>`);
}

function drawDist(st, crit) {
  const L = 46, R = 600, T = 14, B = 220, k = st.df;
  const xmax = Math.max(crit * 1.6, st.chi * 1.15, k + 4 * Math.sqrt(2 * k));
  const sx = v => L + v / xmax * (R - L);
  const N = 400, xs = Array.from({ length: N + 1 }, (_, i) => 0.0001 + xmax * i / N), ys = xs.map(x => chiPdf(x, k));
  const ymax = Math.min(Math.max(...ys.slice(2)), 1.2) * 1.1, sy = v => B - Math.min(v, ymax) / ymax * (B - T);
  let s = "";
  const step = xmax > 40 ? 10 : xmax > 15 ? 5 : xmax > 8 ? 2 : 1;
  for (let v = 0; v <= xmax; v += step) s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${T}" y2="${B}" stroke="var(--grid)"/><text x="${sx(v)}" y="${B + 18}" text-anchor="middle">${v}</text>`;
  const seg = lo => { const o = []; xs.forEach((x, i) => { if (x >= lo) o.push([sx(x), sy(ys[i])]); }); return o; };
  s += `<path d="${area(seg(crit), B)}" fill="var(--alpha-fill)" fill-opacity=".8"/>`;
  if (st.chi < xmax) s += `<path d="${area(seg(st.chi), B)}" fill="var(--therapie)" fill-opacity=".85"/>`;
  s += `<path d="${path(xs.map((x, i) => [sx(x), sy(ys[i])]))}" fill="none" stroke="var(--fg)" stroke-width="2"/>`;
  s += `<line x1="${sx(crit)}" x2="${sx(crit)}" y1="${T + 18}" y2="${B}" stroke="var(--alpha-ink)" stroke-width="1.5" stroke-dasharray="5 4"/>`;
  s += `<text x="${sx(crit) + 6}" y="${T + 30}" style="fill:var(--alpha-ink)">kritischer Wert ${fmt(crit, 2)}</text>`;
  s += `<line x1="${sx(st.chi)}" x2="${sx(st.chi)}" y1="${T}" y2="${B}" stroke="var(--therapie)" stroke-width="2.5"/>`;
  s += `<text x="${sx(st.chi) + (sx(st.chi) > 450 ? -6 : 6)}" y="${T + 10}" text-anchor="${sx(st.chi) > 450 ? "end" : "start"}" class="strong">χ² = ${fmt(st.chi, 2)}</text>`;
  s += `<line x1="${L}" x2="${R}" y1="${B}" y2="${B}" stroke="var(--line)"/><text x="${R}" y="${B + 36}" text-anchor="end">χ²-Wert · df = ${k}</text>`;
  $("dist").innerHTML = s;
  $("dist").setAttribute("aria-label", `χ²-Verteilung mit ${k} Freiheitsgraden, beobachtet ${fmt(st.chi, 2)}, p ${fmtP(st.p)}`);
  $("dist-stats").innerHTML = readout("χ²", fmt(st.chi, 2)) + readout("Freiheitsgrade", String(k)) + readout(`kritischer Wert bei α = ${pct(S.alpha, 0)}`, fmt(crit, 2)) + readout("p-Wert", fmtP(st.p));
}

function drawEffect(st) {
  const lab = st.V < 0.1 ? "sehr klein" : st.V < 0.3 ? "klein" : st.V < 0.5 ? "mittel" : "groß";
  $("eff-stats").innerHTML = readout(st.r === 2 && st.c === 2 ? "Cramérs V (= φ)" : "Cramérs V", fmt(st.V, 2)) + readout("Einordnung", lab) + readout("N", intf(st.N)) + readout("χ²", fmt(st.chi, 2));
}

function drawSim(st) {
  const L = 46, R = 600, T = 14, B = 200, k = st.df;
  if (!S.sim) { $("simchart").innerHTML = `<text x="${(L + R) / 2}" y="${(T + B) / 2}" text-anchor="middle">Noch keine Simulation.</text>`; $("sim-text").textContent = ""; return; }
  const vals = S.sim, xmax = Math.max(chiInv(0.995, k), st.chi * 1.1);
  const nb = 40, bw = xmax / nb, counts = new Array(nb).fill(0);
  vals.forEach(v => { const b = Math.floor(v / bw); if (b >= 0 && b < nb) counts[b]++; });
  const dens = counts.map(c => c / vals.length / bw);
  const xs = Array.from({ length: 201 }, (_, i) => 0.0001 + xmax * i / 200), ys = xs.map(x => chiPdf(x, k));
  const ymax = Math.min(Math.max(...dens, ...ys.slice(2)), 1.2) * 1.1;
  const sx = v => L + v / xmax * (R - L), sy = v => B - Math.min(v, ymax) / ymax * (B - T);
  let s = "";
  dens.forEach((d, b) => { const x0 = sx(b * bw), x1 = sx((b + 1) * bw); s += `<rect x="${x0.toFixed(1)}" y="${sy(d).toFixed(1)}" width="${(x1 - x0 - 1).toFixed(1)}" height="${(B - sy(d)).toFixed(1)}" fill="${(b + 1) * bw > st.chi ? "var(--therapie)" : "var(--area-b)"}"/>`; });
  s += `<path d="${path(xs.map((x, i) => [sx(x), sy(ys[i])]))}" fill="none" stroke="var(--fg)" stroke-width="2"/>`;
  s += `<line x1="${sx(st.chi)}" x2="${sx(st.chi)}" y1="${T}" y2="${B}" stroke="var(--therapie)" stroke-width="2.5"/>`;
  const step = xmax > 40 ? 10 : xmax > 15 ? 5 : xmax > 8 ? 2 : 1;
  for (let v = 0; v <= xmax; v += step) s += `<text x="${sx(v)}" y="${B + 18}" text-anchor="middle">${v}</text>`;
  s += `<line x1="${L}" x2="${R}" y1="${B}" y2="${B}" stroke="var(--line)"/><text x="${R}" y="${B + 36}" text-anchor="end">χ² simulierter Tabellen · Kurve: χ²-Verteilung, df = ${k}</text>`;
  $("simchart").innerHTML = s;
  const share = vals.filter(v => v >= st.chi - 1e-12).length / vals.length;
  $("sim-text").innerHTML = `<b>${pct(share)}</b> der ${intf(vals.length)} simulierten Tabellen haben ein χ² von mindestens ${fmt(st.chi, 2)}. Theoretischer p-Wert: ${fmtP(st.p)}.`;
}

function simulate() {
  const st = stats(S.m), pr = st.rs.map(v => v / st.N), pc = st.cs.map(v => v / st.N);
  const pick = p => { const u = Math.random(); let a = 0; for (let i = 0; i < p.length; i++) { a += p[i]; if (u < a) return i; } return p.length - 1; };
  const out = [];
  for (let s = 0; s < 1000; s++) {
    const m = st.rs.map(() => new Array(st.c).fill(0));
    for (let n = 0; n < st.N; n++) m[pick(pr)][pick(pc)]++;
    out.push(stats(m).chi);
  }
  S.sim = out; update(false);
}

/* ---------- Steuerung ---------- */
document.querySelectorAll("[data-preset]").forEach(b => b.addEventListener("click", () => { load(b.dataset.preset); markPreset(b.dataset.preset); S.q = PRESETS[b.dataset.preset].q; buildTable(); update(false); }));
document.querySelectorAll("[data-alpha]").forEach(b => b.addEventListener("click", () => { S.alpha = +b.dataset.alpha; update(false); }));
$("addRow").addEventListener("click", () => { S.rows.push(`Gruppe ${S.rows.length + 1}`); S.m.push(new Array(S.cols.length).fill(10)); S.sim = null; markPreset(null); buildTable(); update(false); });
$("delRow").addEventListener("click", () => { if (S.rows.length > 2) { S.rows.pop(); S.m.pop(); S.sim = null; markPreset(null); buildTable(); update(false); } });
$("addCol").addEventListener("click", () => { S.cols.push(`Kategorie ${S.cols.length + 1}`); S.m.forEach(r => r.push(10)); S.sim = null; markPreset(null); buildTable(); update(false); });
$("delCol").addEventListener("click", () => { if (S.cols.length > 2) { S.cols.pop(); S.m.forEach(r => r.pop()); S.sim = null; markPreset(null); buildTable(); update(false); } });
$("double").addEventListener("click", () => { S.m = S.m.map(r => r.map(v => v * 2)); S.sim = null; buildTable(); update(false); });
$("sim").addEventListener("click", simulate);

load("rtw"); markPreset("rtw"); buildTable(); update(false);
})();
