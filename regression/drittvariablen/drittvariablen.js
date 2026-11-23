/* Drittvariablen · Stats Lab
   Station „Drittvariablen“: Confounder (Alter bei Rauchen und FEV), Mediator (Größe zwischen Alter und FEV),
   Collider (Überweisung bei Alpha-Winkel und Schmerz, simuliert). Pfeildiagramme als SVG. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const fmt = (x, d = 2) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");
const tz = x => String(x).replace(/\./g, "{.}").replace(/,/g, "{,}").replace(/−/g, "-");
const readout = (l, v, cls = "") => `<div class="readout ${cls}"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;
const TB = (t, fb) => window.katex ? texBlock(t) : fb;
const fp = p => p < 0.001 ? "< 0,001" : fmt(p, 3);
const { ols, mean, tinv } = window.REG;
const R = window.FEV.rows, A = R.map(r => r[0]), Y = R.map(r => r[1]), H = R.map(r => r[2]), S = R.map(r => r[4]);
function ticks(lo, hi, n = 8) { const span = hi - lo, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw))); const st = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => span / s <= n); const o = []; for (let v = Math.ceil(lo / st - 1e-9) * st; v <= hi + 1e-9; v += st) o.push(+v.toFixed(6)); return o; }
let cpId = 0;
function frame(W, H, xlo, xhi, ylo, yhi, o = {}) {
  const P = o.P || { L: 60, R: 16, T: 14, B: 46 }, xl = o.xl ?? "", yl = o.yl ?? "", nx = o.nx || 8, ny = o.ny ?? 6;
  const sx = v => P.L + (v - xlo) / (xhi - xlo) * (W - P.L - P.R), sy = v => H - P.B - (v - ylo) / (yhi - ylo) * (H - P.T - P.B);
  const id = "cp" + (++cpId);
  let s = `<defs><clipPath id="${id}"><rect x="${P.L}" y="${P.T}" width="${W - P.L - P.R}" height="${H - P.T - P.B}"/></clipPath></defs>`;
  ticks(xlo, xhi, nx).forEach(v => s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${P.T}" y2="${H - P.B}" stroke="var(--grid)"/><text x="${sx(v)}" y="${H - P.B + 18}" text-anchor="middle">${o.fx ? o.fx(v) : fmt(v, 0)}</text>`);
  if (ny) ticks(ylo, yhi, ny).forEach(v => s += `<line x1="${P.L}" x2="${W - P.R}" y1="${sy(v)}" y2="${sy(v)}" stroke="var(--grid)"/><text x="${P.L - 8}" y="${sy(v) + 4}" text-anchor="end">${fmt(v, v % 1 ? 1 : 0)}</text>`);
  s += `<text x="${W - P.R}" y="${H - 6}" text-anchor="end">${xl}</text>`;
  if (yl) s += `<text x="14" y="${(P.T + H - P.B) / 2}" transform="rotate(-90 14 ${(P.T + H - P.B) / 2})" text-anchor="middle">${yl}</text>`;
  return { sx, sy, s, clip: `clip-path="url(#${id})"`, P, W, H };
}
const pick = (e, el) => { const b = e.target.closest("button"); if (!b) return null; el.querySelectorAll("button").forEach(z => z.setAttribute("aria-pressed", z === b)); return b; };

/* ---------- Pfeildiagramm ----------
   nodes: { key: { x, y, label, role: "x" | "y" | "z", adj, tag } }, edges: [from, to, cls, label, labelSide] */
let dagId = 0;
function dag(svg, nodes, edges, cap) {
  const id = "dg" + (++dagId), hw = n => n.label.length * 4.6 + 18, hh = 21;
  const mk = (k, col) => `<marker id="${id}-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${col}"/></marker>`;
  let s = `<defs>${mk("n", "var(--fg)")}${mk("off", "var(--muted)")}${mk("hot", "var(--beta-ink)")}</defs>`;
  edges.forEach(([a, b, cls = "", lab = "", side = 1, und]) => {
    const n1 = nodes[a], n2 = nodes[b], dx = n2.x - n1.x, dy = n2.y - n1.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    const t = n => Math.min(hw(n) / Math.abs(ux || 1e-9), hh / Math.abs(uy || 1e-9)) + 5;
    const x1 = n1.x + ux * t(n1), y1 = n1.y + uy * t(n1), x2 = n2.x - ux * t(n2), y2 = n2.y - uy * t(n2);
    const m = cls.includes("off") ? "off" : cls.includes("hot") ? "hot" : "n";
    s += `<line class="edge ${cls}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" ${und ? `stroke-dasharray="7 5"` : `marker-end="url(#${id}-${m})"`}/>`;
    if (lab) { const mx = (x1 + x2) / 2 - uy * 18 * side, my = (y1 + y2) / 2 + ux * 18 * side + 4; s += `<text class="elab" x="${mx.toFixed(1)}" y="${my.toFixed(1)}" text-anchor="middle">${lab}</text>`; }
  });
  Object.values(nodes).forEach(n => {
    s += `<g class="node ${n.role}${n.adj ? " adj" : ""}"><rect x="${n.x - hw(n)}" y="${n.y - hh}" width="${2 * hw(n)}" height="${2 * hh}" rx="10"/><text x="${n.x}" y="${n.y + 5}" text-anchor="middle">${n.label}</text>`;
    if (n.tag) s += `<text class="tag" x="${n.x}" y="${n.y + (n.tagUp ? -hh - 8 : hh + 18)}" text-anchor="middle">${n.tag}</text>`;
    s += `</g>`;
  });
  if (cap) s += `<text class="cap" x="${svg.viewBox.baseVal.width / 2}" y="${svg.viewBox.baseVal.height - 10}" text-anchor="middle">${cap}</text>`;
  svg.innerHTML = s;
}

/* ---------- 1 Confounder ---------- */
const crude = ols(Y, [S]), adjA = ols(Y, [S, A]);
const GR = [[9, 10], [11, 12], [13, 14], [15, 19]].map(([lo, hi]) => {
  const ix = A.map((a, i) => i).filter(i => A[i] >= lo && A[i] <= hi), ys = ix.filter(i => S[i]).map(i => Y[i]), yn = ix.filter(i => !S[i]).map(i => Y[i]);
  return { lab: `${lo}–${hi} Jahre`, d: mean(ys) - mean(yn), ns: ys.length, nn: yn.length };
});
let ck = 0;
function draw1() {
  const adj = ck === 1;
  dag($("c-dag"), {
    z: { x: 260, y: 52, label: "Alter", role: "z", adj, tag: adj ? "adjustiert" : "Confounder", tagUp: true },
    x: { x: 100, y: 200, label: "Rauchen", role: "x", tag: "X" },
    y: { x: 420, y: 200, label: "FEV", role: "y", tag: "Y" }
  }, [["z", "x", adj ? "off" : "hot", "", -1], ["z", "y", adj ? "off" : "hot", "", 1], ["x", "y", "", "Effekt?", -1]],
  adj ? "Hintertür geschlossen" : "Hintertür offen: Rauchen ← Alter → FEV");
  const z0 = v => Math.abs(v) < 0.005 ? 0 : v;
  const rows = [{ lab: "alle, roh", d: crude.b[1], ns: 65, on: !adj, big: true }, ...GR.map(g => ({ ...g, d: z0(g.d), on: adj })), { lab: "Modell + Alter", d: adjA.b[1], on: adj, big: true }];
  const f = frame(520, 300, -1.25, 1, 0, rows.length, { P: { L: 132, R: 16, T: 10, B: 44 }, xl: "Differenz FEV in Litern: rauchend − nicht", ny: 0, nx: 4, fx: v => fmt(v, 1) });
  let s = f.s + `<line x1="${f.sx(0)}" x2="${f.sx(0)}" y1="${f.P.T}" y2="${300 - f.P.B}" stroke="var(--fg)" stroke-width="1.6"/>`;
  rows.forEach((r, k) => {
    const y = f.sy(rows.length - k - 0.5), op = r.on ? 1 : .28, col = r.big ? "var(--beta-ink)" : "var(--accent)";
    const rad = r.big ? 8 : Math.max(4, Math.sqrt(r.ns) * 1.6);
    s += `<g style="opacity:${op}"><text x="${f.P.L - 10}" y="${y + 5}" text-anchor="end" class="${r.big ? "strong" : ""}">${r.lab}</text>`;
    s += `<line x1="${f.sx(0)}" x2="${f.sx(r.d)}" y1="${y}" y2="${y}" stroke="${col}" stroke-width="2"/><circle cx="${f.sx(r.d)}" cy="${y}" r="${rad}" fill="${col}"/>`;
    s += `<text x="${f.sx(r.d) + (r.d >= 0 ? 14 : -14)}" y="${y + 5}" text-anchor="${r.d >= 0 ? "start" : "end"}" class="strong halo">${fmt(r.d)}${r.big ? "" : ` (${r.ns})`}</text></g>`;
    if (k === 0 || k === rows.length - 2) s += `<line x1="${f.P.L - 120}" x2="${520 - f.P.R}" y1="${y + (f.sy(0) - f.sy(1)) / 2}" y2="${y + (f.sy(0) - f.sy(1)) / 2}" stroke="var(--line)"/>`;
  });
  $("c-ch").innerHTML = s;
  const ageS = mean(A.filter((a, i) => S[i])), ageN = mean(A.filter((a, i) => !S[i]));
  $("c-c").innerHTML = !adj
    ? `Roh haben rauchende Kinder <b>${fmt(crude.b[1])} l mehr</b> FEV. Sie sind aber im Mittel ${fmt(ageS, 1)} Jahre alt, die nichtrauchenden ${fmt(ageN, 1)}, und ältere Kinder haben größere Lungen. Der rohe Unterschied misst vor allem das Alter. Schalten Sie auf „für Alter adjustieren“.`
    : `Adjustieren heißt: nur Gleichaltrige vergleichen. In den Altersgruppen dreht sich das Bild, ab 13 Jahren haben Rauchende deutlich weniger FEV (in Klammern die Zahl der Rauchenden; unter 9 Jahren raucht niemand). Die Regression fasst alle Altersstufen zu einem Wert zusammen: <b>${fmt(adjA.b[1])} l</b> bei gleichem Alter (p = ${fmt(adjA.p[1], 3)}). Die Hintertür über das Alter ist geschlossen.`;
}
$("c-sw").addEventListener("click", e => { const b = pick(e, $("c-sw")); if (!b) return; ck = +b.dataset.k; draw1(); });

/* ---------- 2 Mediator ---------- */
const tot = ols(Y, [A]), dir = ols(Y, [A, H]), aH = ols(H, [A]);
const cT = tot.b[1], cD = dir.b[1], bH = dir.b[2], aA = aH.b[1], ind = aA * bH;
let mk = 0;
function draw2() {
  const direct = mk === 1;
  $("m-ctrl").hidden = !direct;
  dag($("m-dag"), {
    x: { x: 80, y: 200, label: "Alter", role: "x", tag: "X" },
    z: { x: 260, y: 62, label: "Körpergröße", role: "z", adj: direct, tag: direct ? "adjustiert" : "Mediator", tagUp: true },
    y: { x: 440, y: 200, label: "FEV", role: "y", tag: "Y" }
  }, [["x", "z", direct ? "off" : "", `a = ${fmt(aA)} cm/Jahr`, -1], ["z", "y", direct ? "off" : "", `b = ${fmt(bH, 3)} l/cm`, -1], ["x", "y", direct ? "hot" : "", `direkt ${fmt(cD, 3)} l/Jahr`, -1]],
  direct ? "Weg über die Größe abgeschnitten" : `beide Wege: total ${fmt(cT, 3)} l/Jahr`);
  const f = frame(520, 400, 2, 20, 0, 6, { P: { L: 48, R: 10, T: 12, B: 44 }, xl: "Alter in Jahren", yl: "FEV in Litern", nx: 6 });
  let s = f.s;
  const c = +$("mh").value; $("mh-v").textContent = `${c} cm (± 5)`;
  const inW = i => H[i] >= c - 5 && H[i] < c + 5;
  A.forEach((a, i) => { const on = !direct || inW(i); s += `<circle cx="${(f.sx(a) + (i % 7 - 3) * 1.2).toFixed(1)}" cy="${f.sy(Y[i]).toFixed(1)}" r="${on && direct ? 3.4 : 2.4}" fill="${on && direct ? "var(--beta-ink)" : "var(--pal-3)"}" fill-opacity="${on ? (direct ? .85 : .55) : .18}"/>`; });
  const ln = (b0, b1, a0, a1, col, w = 3) => `<line ${f.clip} x1="${f.sx(a0)}" x2="${f.sx(a1)}" y1="${f.sy(b0 + b1 * a0)}" y2="${f.sy(b0 + b1 * a1)}" stroke="${col}" stroke-width="${w}"/>`;
  let wTxt = "";
  if (!direct) {
    s += ln(tot.b[0], cT, 3, 19, "var(--fg)") + `<text x="${f.sx(19)}" y="${f.sy(tot.b[0] + cT * 19) - 12}" text-anchor="end" class="strong halo">+${fmt(cT, 3)} l/Jahr</text>`;
  } else {
    const ix = A.map((a, i) => i).filter(inW), wa = ix.map(i => A[i]), wy = ix.map(i => Y[i]), wm = ols(wy, [wa]);
    const a0 = Math.min(...wa), a1 = Math.max(...wa);
    s += ln(tot.b[0], cT, 3, 19, "var(--muted)", 1.6) + `<text x="${f.sx(4)}" y="${f.sy(tot.b[0] + cT * 4) - 10}" class="halo">totaler Effekt</text>`;
    s += ln(wm.b[0], wm.b[1], a0, a1, "var(--beta-ink)", 4) + `<text x="${f.sx(a1)}" y="${f.sy(wm.b[0] + wm.b[1] * a1) + 24}" text-anchor="end" class="strong halo" style="fill:var(--beta-ink)">+${fmt(wm.b[1], 3)} l/Jahr</text>`;
    wTxt = ` Im Fenster ${c - 5} bis ${c + 5} cm (${ix.length} Kinder) steigt die FEV nur um ${fmt(wm.b[1], 3)} l pro Jahr.`;
  }
  $("m-ch").innerHTML = s;
  $("m-f").innerHTML = TB(String.raw`\begin{aligned} \text{total} &= \text{direkt} + \underbrace{a \cdot b}_{\text{indirekt}} \\[6pt] ${tz(fmt(cT, 3))} &= ${tz(fmt(cD, 3))} + ${tz(fmt(aA, 2))} \cdot ${tz(fmt(bH, 4))} \\[3pt] &= ${tz(fmt(cD, 3))} + ${tz(fmt(ind, 3))} \end{aligned}`, `<span class="big">${fmt(cT, 3)} = ${fmt(cD, 3)} + ${fmt(ind, 3)}</span>`);
  $("m-c").innerHTML = !direct
    ? `Mit dem Alter allein im Modell steigt die FEV um <b>${fmt(cT, 3)} l pro Jahr</b>. Das ist der totale Effekt: alles, was ein Jahr mehr bewirkt, egal auf welchem Weg. Nehmen Sie jetzt die Größe dazu.`
    : `Bei gleicher Größe bleiben nur <b>${fmt(cD, 3)} l pro Jahr</b>, der direkte Effekt.${wTxt} Der Rest, ${fmt(ind, 3)} l pro Jahr oder ${fmt(ind / cT * 100, 0)} %, läuft über das Wachstum. Beide Zahlen sind richtig. Sie beantworten verschiedene Fragen: Wie stark wächst die Lungenfunktion mit dem Alter? Und: Wie stark wächst sie mit dem Alter <b>über die Körpergröße hinaus</b>?`;
}
$("m-sw").addEventListener("click", e => { const b = pick(e, $("m-sw")); if (!b) return; mk = +b.dataset.k; draw2(); });
$("mh").addEventListener("input", draw2);

/* ---------- 3 Collider (simuliert) ---------- */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function zs(seed, n) { const r = mulberry32(seed), o = []; while (o.length < n) { let u = 0; while (!u) u = r(); const v = r(), m = Math.sqrt(-2 * Math.log(u)); o.push(m * Math.cos(2 * Math.PI * v), m * Math.sin(2 * Math.PI * v)); } return o.slice(0, n); }
const NK = 500, SEED = 7, ZA = zs(SEED, NK), ZP = zs(SEED + 1, NK);
const AL = ZA.map(z => Math.min(92, Math.max(38, Math.round(58 + 9 * z)))), PN = ZP.map(z => Math.min(10, Math.max(0, Math.round(3.5 + 2.2 * z))));
const JX = Array.from({ length: NK }, (_, i) => ((i * 37) % 11 - 5) / 14), JY = Array.from({ length: NK }, (_, i) => ((i * 53) % 13 - 6) / 20);
let kk = 0;
function draw3() {
  const thr = +$("kt").value; $("kt-v").textContent = ["sehr locker", "locker", "locker", "mittel", "mittel", "mittel", "streng", "streng", "sehr streng", "sehr streng", "extrem streng"][Math.round(thr / 0.25)] + ` (Schwelle ${fmt(thr, 2)})`;
  const ref = AL.map((a, i) => (a - 58) / 9 + (PN[i] - 3.5) / 2.2 > thr ? 1 : 0), nRef = ref.reduce((s, v) => s + v, 0);
  const ix = kk === 1 ? AL.map((a, i) => i).filter(i => ref[i]) : AL.map((a, i) => i);
  const xs = ix.map(i => AL[i] / 10), ys = ix.map(i => PN[i]);
  const m = kk === 2 ? ols(ys, [xs, ix.map(i => ref[i])]) : ols(ys, [xs]), tc = tinv(0.975, m.df);
  dag($("k-dag"), {
    x: { x: 100, y: 200, label: "Alpha-Winkel", role: "x", tag: "X" },
    y: { x: 420, y: 200, label: "Schmerz", role: "y", tag: "Y" },
    z: { x: 260, y: 52, label: "Überweisung", role: "z", adj: kk > 0, tag: kk === 1 ? "ausgewählt" : kk === 2 ? "adjustiert" : "Collider", tagUp: true }
  }, [["x", "z", ""], ["y", "z", ""], ...(kk ? [["x", "y", "hot", "Scheinzusammenhang", -1, true]] : [])],
  kk ? "Pfad über den Collider geöffnet" : "kein Pfeil zwischen Alpha und Schmerz");
  const f = frame(520, 400, 35, 95, 0, 10, { P: { L: 48, R: 10, T: 12, B: 44 }, xl: "Alpha-Winkel in Grad", yl: "Schmerz (NRS)", nx: 6, ny: 5 });
  let s = f.s;
  AL.forEach((a, i) => { const shown = kk !== 1 || ref[i]; s += `<circle cx="${(f.sx(a + JX[i])).toFixed(1)}" cy="${f.sy(PN[i] + JY[i]).toFixed(1)}" r="${ref[i] ? 3 : 2.4}" fill="${ref[i] ? "var(--beta-ink)" : "var(--pal-3)"}" fill-opacity="${shown ? (ref[i] ? .8 : .6) : .12}"/>`; });
  const ln = (b0, b1, col, w = 3, a0 = 38, a1 = 92) => `<line ${f.clip} x1="${f.sx(a0)}" x2="${f.sx(a1)}" y1="${f.sy(b0 + b1 * a0 / 10)}" y2="${f.sy(b0 + b1 * a1 / 10)}" stroke="${col}" stroke-width="${w}"/>`;
  if (kk === 2) s += ln(m.b[0], m.b[1], "var(--fg)", 2.4) + ln(m.b[0] + m.b[2], m.b[1], "var(--beta-ink)", 3);
  else s += ln(m.b[0], m.b[1], kk === 1 ? "var(--beta-ink)" : "var(--fg)", 3.4);
  $("k-ch").innerHTML = s;
  $("k-r").innerHTML = readout("in der Auswertung", `${ix.length}`) + readout("Steigung: Schmerz pro 10° Alpha", fmt(m.b[1], 2)) + readout("95-%-KI", `${fmt(m.b[1] - tc * m.se[1], 2)} bis ${fmt(m.b[1] + tc * m.se[1], 2)}`) + readout("p-Wert", fp(m.p[1]), m.p[1] < 0.05 ? "hl" : "");
  const sig = m.p[1] < 0.05;
  $("k-c").innerHTML = [
    `Über alle Spieler ist die Gerade flach: ${fmt(m.b[1], 2)} Punkte Schmerz pro 10° Alpha-Winkel, p = ${fmt(m.p[1], 2)}. So soll es sein, die Daten sind unabhängig erzeugt. ${nRef} Spieler werden überwiesen. Wählen Sie „nur Sprechstunde“.`,
    `In der Sprechstunde hat ein großer Alpha-Winkel scheinbar <b>weniger Schmerz</b> zur Folge: ${fmt(m.b[1], 2)} Punkte pro 10°, p ${m.p[1] < 0.001 ? "< 0,001" : "= " + fmt(m.p[1], 3)}${sig ? "" : " (bei dieser Schwelle knapp, schieben Sie den Regler)"}. Der Grund ist die Auswahl: Wer mit kleinem Winkel überwiesen wurde, muss starke Schmerzen haben, sonst säße er nicht hier. Wer mit wenig Schmerz da ist, hat einen auffälligen Befund. Je strenger die Schwelle, desto deutlicher das Muster.`,
    `Dasselbe passiert ohne Auswahl, wenn man die Überweisung ins Modell nimmt: ${fmt(m.b[1], 2)} Punkte pro 10°, p ${m.p[1] < 0.001 ? "< 0,001" : "= " + fmt(m.p[1], 3)}. Innerhalb beider Gruppen fällt die Gerade. Für einen Collider zu adjustieren öffnet einen Weg, der vorher geschlossen war.`
  ][kk];
}
$("k-sw").addEventListener("click", e => { const b = pick(e, $("k-sw")); if (!b) return; kk = +b.dataset.k; draw3(); });
$("kt").addEventListener("input", draw3);

draw1(); draw2(); draw3();
})();
