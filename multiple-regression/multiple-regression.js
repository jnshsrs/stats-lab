/* Mehrere Einflüsse zugleich · Stats Lab
   Station 25: Adjustierung (Rauchen), Wechselwirkung Alter × Geschlecht mit Zentrierung. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const fmt = (x, d = 2) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");
const tz = x => String(x).replace(/\./g, "{.}").replace(/,/g, "{,}").replace(/−/g, "-");
const readout = (l, v, cls = "") => `<div class="readout ${cls}"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;
const TB = (t, fb) => window.katex ? texBlock(t) : fb;
const fp = p => p < 0.001 ? "< 0,001" : fmt(p, 3);
const { ols, mean, tinv } = window.REG;
const R = window.FEV.rows, A = R.map(r => r[0]), Y = R.map(r => r[1]), H = R.map(r => r[2]), M = R.map(r => r[3]), S = R.map(r => r[4]), N = R.length;
function ticks(lo, hi, n = 8) { const span = hi - lo, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw))); const st = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => span / s <= n); const o = []; for (let v = Math.ceil(lo / st - 1e-9) * st; v <= hi + 1e-9; v += st) o.push(+v.toFixed(6)); return o; }
let cpId = 0;
function frame(W, H, xlo, xhi, ylo, yhi, o = {}) {
  const P = o.P || { L: 60, R: 16, T: 14, B: 46 }, xl = o.xl ?? "Körpergröße in cm", yl = o.yl ?? "FEV in Litern", nx = o.nx || 8, ny = o.ny ?? 6;
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
function coefTable(m, names, hlIdx, unit) {
  const tc = tinv(0.975, m.df), d = v => fmt(v, Math.abs(v) < 0.1 ? 4 : 3);
  return `<thead><tr><th>Term</th><th>b</th><th>SE</th><th>t</th><th>p</th><th>95-%-KI</th></tr></thead><tbody>` +
    m.b.map((b, i) => `<tr class="${i === hlIdx ? "hl" : ""}"><td>${names[i]}</td><td>${d(b)}</td><td>${d(m.se[i])}</td><td>${fmt(m.t[i], 2)}</td><td>${fp(m.p[i])}</td><td>${d(b - tc * m.se[i])} bis ${d(b + tc * m.se[i])}</td></tr>`).join("") +
    `<tr class="tot"><td>R² = ${fmt(m.r2, 3)}</td><td colspan="5" style="text-align:left;font-family:inherit;font-weight:400;color:var(--muted)">n = ${N}, df = ${m.df}${unit ? ", " + unit : ""}</td></tr></tbody>`;
}

/* ---------- 1 Adjustierung Rauchen ---------- */
const LY = Y.map(Math.log);
const SM = [
  { cols: [S], y: Y, terms: ["Rauchen"] },
  { cols: [S, A], y: Y, terms: ["Rauchen", "Alter"] },
  { cols: [S, A, H], y: Y, terms: ["Rauchen", "Alter", "Größe"] },
  { cols: [S, A, H, M], y: Y, terms: ["Rauchen", "Alter", "Größe", "männlich"] },
  { cols: [S, A, H, M], y: LY, terms: ["Rauchen", "Alter", "Größe", "männlich"], log: true }
].map(o => ({ ...o, m: ols(o.y, o.cols) }));
const TN = { Rauchen: "Rauchen (ja = 1)", Alter: "Alter (Jahre)", Größe: "Größe (cm)", männlich: "Geschlecht (männlich = 1)" };
const pct = b => (Math.exp(b) - 1) * 100;
let sk = 0;
function draw1() {
  const o = SM[sk], m = o.m, tc = tinv(0.975, m.df);
  const terms = o.terms.map((t, i) => `${tz(fmt(Math.abs(m.b[i + 1]), Math.abs(m.b[i + 1]) < 0.1 ? 4 : 3))} \\cdot \\text{${t}}`);
  const signs = o.terms.map((t, i) => m.b[i + 1] < 0 ? "-" : "+");
  let eq = `\\widehat{${o.log ? "\\ln \\text{FEV}" : "\\text{FEV}"}} &= ${tz(fmt(m.b[0], 3))}`;
  terms.forEach((t, i) => eq += " \\\\ &\\quad " + signs[i] + " " + t);
  $("s-eq").innerHTML = TB(`\\begin{aligned} ${eq} \\end{aligned}`, "");
  // links: Streudiagramm nach Alter
  const f = frame(520, 400, 2, 20, 0, 6, { P: { L: 48, R: 10, T: 12, B: 44 }, xl: "Alter in Jahren", nx: 6 });
  let s = f.s;
  A.forEach((a, i) => s += `<circle cx="${(f.sx(a) + (i % 7 - 3) * 0.9).toFixed(1)}" cy="${f.sy(Y[i]).toFixed(1)}" r="${S[i] ? 3.4 : 2.2}" fill="${S[i] ? "var(--beta-ink)" : "var(--pal-3)"}" fill-opacity="${S[i] ? .9 : .4}"/>`);
  const B = SM[1].m, ln = (b0, b1, col, w, op, a0 = 3, a1 = 19) => `<line ${f.clip} x1="${f.sx(a0)}" x2="${f.sx(a1)}" y1="${f.sy(b0 + b1 * a0)}" y2="${f.sy(b0 + b1 * a1)}" stroke="${col}" stroke-width="${w}" stroke-opacity="${op}"/>`;
  if (sk === 0) {
    s += ln(m.b[0], 0, "var(--therapie)", 3, 1) + ln(m.b[0] + m.b[1], 0, "var(--beta-ink)", 3, 1, 9, 19);
    s += `<text x="${f.sx(19)}" y="${f.sy(m.b[0] + m.b[1]) - 8}" text-anchor="end" class="strong" style="fill:var(--beta-ink)">${fmt(m.b[0] + m.b[1])} l</text><text x="${f.sx(19)}" y="${f.sy(m.b[0]) + 18}" text-anchor="end" class="strong" style="fill:var(--therapie)">${fmt(m.b[0])} l</text>`;
  } else {
    const op = sk === 1 ? 1 : .35;
    s += ln(B.b[0], B.b[2], "var(--therapie)", 3, op) + ln(B.b[0] + B.b[1], B.b[2], "var(--beta-ink)", 3, op, 9, 19);
    const a = 17, y0 = B.b[0] + B.b[2] * a, y1 = y0 + B.b[1];
    s += `<line x1="${f.sx(a)}" x2="${f.sx(a)}" y1="${f.sy(y0)}" y2="${f.sy(y1)}" stroke="var(--fg)" stroke-width="3" stroke-opacity="${op}"/><text x="${f.sx(a) - 8}" y="${f.sy(y1) + 26}" text-anchor="end" class="strong halo" style="opacity:${op}">Abstand ${fmt(B.b[1])} l</text>`;
    if (sk > 1) s += `<text x="${f.P.L + 8}" y="${f.P.T + 16}" class="strong">Linien aus Modell B</text><text x="${f.P.L + 8}" y="${f.P.T + 34}">Ab drei Einflussgrößen kein Bild in einer Ebene mehr</text>`;
  }
  $("s1").innerHTML = s;
  // rechts: Rauch-Effekt über Modelle
  const g = frame(520, 400, -0.5, 1, 0, 6, { P: { L: 44, R: 14, T: 12, B: 44 }, xl: "Rauch-Effekt in Litern, 95-%-KI", yl: "", ny: 0, nx: 6, fx: v => fmt(v, 1) });
  let t = g.s + `<line x1="${g.sx(0)}" x2="${g.sx(0)}" y1="${g.P.T}" y2="${g.sy(0)}" stroke="var(--fg)" stroke-width="1.6"/>`;
  SM.slice(0, 4).forEach((o2, k) => {
    const mm = o2.m, c = tinv(0.975, mm.df), yy = g.sy(5.2 - k * 1.15), on = k === sk, col = on ? "var(--beta-ink)" : "var(--muted)";
    t += `<text x="${g.P.L - 10}" y="${yy + 5}" text-anchor="end" class="strong" style="fill:${col}">${"ABCD"[k]}</text><line x1="${g.sx(mm.b[1] - c * mm.se[1])}" x2="${g.sx(mm.b[1] + c * mm.se[1])}" y1="${yy}" y2="${yy}" stroke="${col}" stroke-width="${on ? 5 : 3}" stroke-linecap="round"/><circle cx="${g.sx(mm.b[1])}" cy="${yy}" r="${on ? 8 : 6}" fill="${col}"/><text x="${g.sx(mm.b[1])}" y="${yy - 14}" text-anchor="middle" style="fill:${col}" class="${on ? "strong" : ""}">${fmt(mm.b[1])}</text>`;
  });
  const E = SM[4].m, ce = tinv(0.975, E.df), yE = g.sy(0.7);
  t += `<text x="${g.P.L - 10}" y="${yE + 5}" text-anchor="end" class="strong" style="fill:${sk === 4 ? "var(--beta-ink)" : "var(--muted)"}">E</text><text x="${g.P.L + 6}" y="${yE + 5}" style="fill:${sk === 4 ? "var(--beta-ink)" : "var(--muted)"}" class="${sk === 4 ? "strong" : ""}">ln-Skala: ${fmt(pct(E.b[1]), 1)} % (KI ${fmt(pct(E.b[1] - ce * E.se[1]), 1)} bis ${fmt(pct(E.b[1] + ce * E.se[1]), 1)} %)</text>`;
  $("s2").innerHTML = t;
  $("s-tab").innerHTML = coefTable(m, ["Achsenabschnitt", ...o.terms.map(x => TN[x])], 1, o.log ? "Zielgröße ln(FEV)" : "Zielgröße FEV in Litern");
  const b = m.b[1], lo = b - tc * m.se[1], hi = b + tc * m.se[1], P = fp(m.p[1]);
  const ageS = mean(A.filter((a, i) => S[i])), ageN = mean(A.filter((a, i) => !S[i]));
  $("s-c").innerHTML = [
    () => `Ohne Adjustierung haben Rauchende im Mittel <b>${fmt(b)} l mehr</b> FEV (p ${P}). Rauchen als Lungentraining? Nein: Die Rauchenden sind im Mittel ${fmt(ageS, 1)} Jahre alt, die Nichtrauchenden ${fmt(ageN, 1)}. Das Alter ist eine Störgröße. Wählen Sie Modell B.`,
    () => `<b>Bei gleichem Alter</b> haben Rauchende im Mittel ${fmt(-b)} l <b>weniger</b> FEV (p = ${fmt(m.p[1], 3)}, KI ${fmt(lo)} bis ${fmt(hi)} l). Das Vorzeichen hat sich umgedreht. Im Diagramm sind das zwei parallele Geraden: Ihre gemeinsame Steigung ist der Alterseffekt (${fmt(m.b[2])} l pro Jahr), ihr Abstand der Rauch-Effekt. R² steigt von ${fmt(SM[0].m.r2 * 100, 0)} auf ${fmt(m.r2 * 100, 0)} %.`,
    () => `Bei gleichem Alter <b>und gleicher Größe</b> sinkt der Effekt auf ${fmt(b)} l und ist knapp nicht mehr signifikant (p = ${fmt(m.p[1], 3)}). Ein Teil des Rauch-Effekts lief also über die Größe. Ob man dafür adjustieren sollte, ist eine inhaltliche Frage: Wenn Rauchen das Wachstum bremst, rechnet man einen echten Effekt heraus (siehe Abschnitt 3).`,
    () => `Mit Geschlecht: ${fmt(b)} l, p = ${fmt(m.p[1], 2)}. Das Konfidenzintervall reicht von ${fmt(lo)} bis ${fmt(hi)} l. Nicht signifikant heißt hier nicht „kein Effekt“, sondern „mit diesen Daten nicht genau genug bestimmbar“: Es sind nur 65 Rauchende.`,
    () => `Auf der ln-Skala, die nach der <a href="../diagnostik/#acc-2">Diagnostik</a> besser zu den Daten passt, ist der Effekt wieder signifikant: Bei gleichem Alter, gleicher Größe und gleichem Geschlecht haben Rauchende im Mittel <b>${fmt(-pct(b), 1)} % weniger</b> FEV (p = ${fmt(m.p[1], 3)}). Umrechnung: (e<sup>b</sup> − 1) · 100 %. Die Lehre: Das Ergebnis hängt von der Modellwahl ab. Deshalb legt man das Modell vor der Auswertung fest.`
  ][sk]();
}
$("sm").addEventListener("click", e => { const b = pick(e, $("sm")); if (!b) return; sk = +b.dataset.k; draw1(); });

/* ---------- 2 Wechselwirkung ---------- */
let inter = 1;
function draw2() {
  const c = +$("ac").value; $("ac-v").textContent = c + " Jahre";
  const Ac = A.map(a => a - c), cols = inter ? [Ac, M, Ac.map((a, i) => a * M[i])] : [Ac, M], m = ols(Y, cols);
  const b = m.b, girl = a => b[0] + b[1] * (a - c), boy = a => b[0] + b[2] + (b[1] + (inter ? b[3] : 0)) * (a - c);
  const aT = c === 0 ? "\\text{Alter}" : `(\\text{Alter} - ${c})`;
  $("i-eq").innerHTML = TB(String.raw`\begin{aligned} \widehat{\text{FEV}} &= ${tz(fmt(b[0], 3))} + ${tz(fmt(b[1], 3))} \cdot ${aT} \\ &{} ${b[2] < 0 ? "-" : "+"} ${tz(fmt(Math.abs(b[2]), 3))} \cdot \text{männlich}${inter ? String.raw` \\ &{} + ${tz(fmt(b[3], 3))} \cdot ${aT} \cdot \text{männl.}` : ""} \end{aligned}`, "");
  const f = frame(900, 420, 0, 20, -1, 6, { xl: "Alter in Jahren", nx: 10 });
  let s = f.s;
  A.forEach((a, i) => s += `<circle cx="${(f.sx(a) + (i % 7 - 3) * 1.3).toFixed(1)}" cy="${f.sy(Y[i]).toFixed(1)}" r="2.4" fill="${M[i] ? "var(--beta-ink)" : "var(--therapie)"}" fill-opacity=".38"/>`);
  s += `<rect x="${f.sx(0)}" y="${f.P.T}" width="${f.sx(3) - f.sx(0)}" height="${f.sy(-1) - f.P.T}" fill="var(--highlight)"/><text x="${f.sx(1.5)}" y="${f.P.T + 16}" text-anchor="middle">keine Daten</text>`;
  const L = (fn, col) => `<line ${f.clip} x1="${f.sx(0)}" x2="${f.sx(20)}" y1="${f.sy(fn(0))}" y2="${f.sy(fn(20))}" stroke="${col}" stroke-width="3"/>`;
  s += L(girl, "var(--therapie)") + L(boy, "var(--beta-ink)");
  s += `<line x1="${f.sx(c)}" x2="${f.sx(c)}" y1="${f.P.T}" y2="${f.sy(-1)}" stroke="var(--accent)" stroke-width="1.6" stroke-dasharray="5 4"/>`;
  s += `<line x1="${f.sx(c)}" x2="${f.sx(c)}" y1="${f.sy(girl(c))}" y2="${f.sy(boy(c))}" stroke="var(--fg)" stroke-width="5"/><circle cx="${f.sx(c)}" cy="${f.sy(girl(c))}" r="6" fill="var(--therapie)"/><circle cx="${f.sx(c)}" cy="${f.sy(boy(c))}" r="6" fill="var(--beta-ink)"/>`;
  const right = c < 14;
  s += `<text x="${f.sx(c) + (right ? 12 : -12)}" y="${f.sy((girl(c) + boy(c)) / 2) + 5}" text-anchor="${right ? "start" : "end"}" class="strong halo">b(männlich) = ${fmt(b[2])} l</text>`;
  $("i1").innerHTML = s;
  const nm = ["Achsenabschnitt (Mädchen, " + (c === 0 ? "Alter 0" : c + " Jahre") + ")", "Alter" + (c ? " − " + c : "") + " (pro Jahr)", "Geschlecht (männlich = 1)"];
  if (inter) nm.push("Alter × Geschlecht");
  $("i-tab").innerHTML = coefTable(m, nm, 2, "");
  const out = c < 3;
  $("i-c").innerHTML = !inter
    ? `Ohne Wechselwirkung sind die Geraden parallel: Jungen haben bei jedem Alter ${fmt(b[2])} l mehr, und Zentrieren ändert daran nichts. Das ist eine starke Annahme. Schalten Sie die Wechselwirkung ein: R² steigt von ${fmt(m.r2 * 100, 1)} auf ${fmt(ols(Y, [A, M, A.map((a, i) => a * M[i])]).r2 * 100, 1)} %, und der Wechselwirkungsterm ist hochsignifikant.`
    : (out ? `<b>Vorsicht:</b> Mit Wechselwirkung ist der Geschlechtseffekt der Abstand der Geraden bei Alter* = 0, hier also bei ${c} Jahren. ${c === 0 ? `Der Wert ${fmt(b[2])} l würde bedeuten, dass neugeborene Jungen weniger FEV haben, und das liegt weit außerhalb der Daten (3 bis 19 Jahre).` : "Das liegt außerhalb der Daten."} Schieben Sie c auf 10 Jahre. ` : `Der Geschlechtseffekt ${fmt(b[2])} l ist jetzt der Unterschied zwischen Jungen und Mädchen <b>im Alter von ${c} Jahren</b>. `) +
      `Mädchen legen ${fmt(b[1])} l pro Jahr zu, Jungen ${fmt(b[1])} + ${fmt(b[3])} = ${fmt(b[1] + b[3])} l. Der Wechselwirkungsterm ${fmt(b[3])} ist dieser Unterschied der Steigungen; er bleibt beim Zentrieren gleich, nur der Haupteffekt ändert seine Bedeutung. Dahinter steckt die Pubertät: Ab etwa 10 Jahren wachsen die Lungen der Jungen weiter, die der Mädchen kaum noch. Das Zentrieren kennen Sie aus <a href="../gerade/#acc-4">Die beste Gerade</a>.`;
}
$("ia").addEventListener("click", e => { const b = pick(e, $("ia")); if (!b) return; inter = +b.dataset.i; draw2(); });
$("ac").addEventListener("input", draw2);

draw1(); draw2();
})();
