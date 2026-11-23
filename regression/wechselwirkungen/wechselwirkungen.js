/* Wechselwirkungen · Stats Lab
   Station „Wechselwirkungen“: 2 × 2 (Geschlecht × Altersgruppe) als Differenz der Differenzen,
   Alter × Geschlecht mit Zentrierung, Alter × Größe mit bedingten Steigungen. */
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

const TS = (t, fb) => window.katex ? texSteps(t) : fb;

/* ---------- 1 Zwei Gruppen mal zwei Gruppen ---------- */
const G = A.map(a => a >= 11 ? 1 : 0), MG = M.map((m, i) => m * G[i]);
const Q0 = ols(Y, [M, G]), Q1 = ols(Y, [M, G, MG]);
const cm = (m, g) => mean(Y.filter((y, i) => M[i] === m && G[i] === g)), cn = (m, g) => Y.filter((y, i) => M[i] === m && G[i] === g).length;
const CM = [[cm(0, 0), cm(0, 1)], [cm(1, 0), cm(1, 1)]];
let qk = 1;
function draw1q() {
  const m = qk ? Q1 : Q0, b = m.b, pred = (s, g) => b[0] + b[1] * s + b[2] * g + (qk ? b[3] * s * g : 0);
  const f = frame(520, 400, -0.45, 1.45, 1.5, 4.2, { P: { L: 58, R: 16, T: 12, B: 44 }, yl: "mittlere FEV in Litern", xl: "Altersgruppe", nx: 1, ny: 6, fx: v => "" });
  let s = f.s;
  [["3–10 Jahre", 0], ["11–19 Jahre", 1]].forEach(([l, g]) => s += `<text x="${f.sx(g)}" y="${400 - 44 + 18}" text-anchor="middle" class="strong">${l}</text>`);
  [[0, "var(--therapie)", "Mädchen"], [1, "var(--beta-ink)", "Jungen"]].forEach(([sx, col, lab]) => {
    s += `<line x1="${f.sx(0)}" x2="${f.sx(1)}" y1="${f.sy(pred(sx, 0))}" y2="${f.sy(pred(sx, 1))}" stroke="${col}" stroke-width="3.4"/>`;
    [0, 1].forEach(g => s += `<circle cx="${f.sx(g)}" cy="${f.sy(CM[sx][g])}" r="7" fill="${col}" stroke="var(--surface)" stroke-width="2"/>`);
    const inc = pred(sx, 1) - pred(sx, 0);
    s += `<text x="${f.sx(1) + 14}" y="${f.sy(pred(sx, 1)) + 5}" class="strong halo" style="fill:${col}">${lab}</text>`;
    s += `<text x="${f.sx(0.5) + (sx ? -10 : 10)}" y="${f.sy((pred(sx, 0) + pred(sx, 1)) / 2) + (sx ? -12 : 22)}" text-anchor="${sx ? "end" : "start"}" class="strong halo" style="fill:${col}">+${fmt(inc)} l</text>`;
  });
  $("q-ch").innerHTML = s;
  const d = (a, b2) => fmt(a - b2, 3);
  $("q-tab").innerHTML = `<thead><tr><th></th><th>3–10 Jahre</th><th>11–19 Jahre</th><th>Zuwachs</th></tr></thead><tbody>
    <tr><td>Mädchen</td><td>${fmt(CM[0][0], 3)} <span class="muted">(${cn(0, 0)})</span></td><td>${fmt(CM[0][1], 3)} <span class="muted">(${cn(0, 1)})</span></td><td class="diff">${d(CM[0][1], CM[0][0])}</td></tr>
    <tr><td>Jungen</td><td>${fmt(CM[1][0], 3)} <span class="muted">(${cn(1, 0)})</span></td><td>${fmt(CM[1][1], 3)} <span class="muted">(${cn(1, 1)})</span></td><td class="diff">${d(CM[1][1], CM[1][0])}</td></tr>
    <tr class="dd"><td colspan="3">Differenz der Differenzen</td><td>${fmt((CM[1][1] - CM[1][0]) - (CM[0][1] - CM[0][0]), 3)}</td></tr></tbody>`;
  $("q-f").innerHTML = TS(String.raw`b_3 = \text{Zuwachs}_{\text{J}} - \text{Zuwachs}_{\text{M}} = (${tz(fmt(CM[1][1], 3))} - ${tz(fmt(CM[1][0], 3))}) - (${tz(fmt(CM[0][1], 3))} - ${tz(fmt(CM[0][0], 3))}) = ${tz(fmt(CM[1][1] - CM[1][0], 3))} - ${tz(fmt(CM[0][1] - CM[0][0], 3))} = ${tz(fmt(Q1.b[3], 3))}`, "");
  $("q-coef").innerHTML = coefTable(m, ["Achsenabschnitt (Mädchen, 3–10 Jahre)", "männlich (bei 3–10 Jahren)", "älter: 11–19 Jahre (bei Mädchen)", ...(qk ? ["männlich × älter"] : [])], qk ? 3 : 1, "Zielgröße FEV in Litern");
  $("q-c").innerHTML = qk
    ? `Mit Wechselwirkung trifft das Modell alle vier Mittelwerte genau. Mädchen legen von der jüngeren zur älteren Gruppe ${fmt(CM[0][1] - CM[0][0])} l zu, Jungen ${fmt(CM[1][1] - CM[1][0])} l. Der Unterschied, <b>${fmt(Q1.b[3])} l</b>, ist der Wechselwirkungsterm (p ${fp(Q1.p[3])}). Beachten Sie die Zeile „männlich“: Sie ist jetzt nur noch der Geschlechtsunterschied bei den Jüngeren, ${fmt(Q1.b[1])} l und nicht signifikant. Bei den Älteren beträgt er ${fmt(Q1.b[1])} + ${fmt(Q1.b[3])} = ${fmt(Q1.b[1] + Q1.b[3])} l.`
    : `Ohne Wechselwirkung muss das Modell parallele Linien ziehen: ein Geschlechtsunterschied von ${fmt(Q0.b[1])} l, gleich in beiden Altersgruppen. Die Punkte, also die echten Mittelwerte, liegen daneben. Bei den Jüngeren überschätzt das Modell den Unterschied, bei den Älteren unterschätzt es ihn. Schalten Sie die Wechselwirkung ein.`;
}
$("q-sw").addEventListener("click", e => { const b = pick(e, $("q-sw")); if (!b) return; qk = +b.dataset.k; draw1q(); });

/* ---------- 2 Gruppe × Messgröße (aus der multiplen Regression übernommen) ---------- */
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
      `Mädchen legen ${fmt(b[1])} l pro Jahr zu, Jungen ${fmt(b[1])} + ${fmt(b[3])} = ${fmt(b[1] + b[3])} l. Der Wechselwirkungsterm ${fmt(b[3])} ist dieser Unterschied der Steigungen; er bleibt beim Zentrieren gleich, nur der Haupteffekt ändert seine Bedeutung. Dahinter steckt die Pubertät: Ab etwa 10 Jahren wachsen die Lungen der Jungen weiter, die der Mädchen kaum noch. Das Zentrieren kennen Sie aus <a href="../../regression/gerade/#acc-4">Die beste Gerade</a>.`;
}
$("ia").addEventListener("click", e => { const b = pick(e, $("ia")); if (!b) return; inter = +b.dataset.i; draw2(); });
$("ac").addEventListener("input", draw2);


/* ---------- 3 Zwei Messgrößen: Alter × Größe ---------- */
const H10 = H.map(h => h / 10), AH = A.map((a, i) => a * H10[i]);
const G0 = ols(Y, [A, H10]), G1 = ols(Y, [A, H10, AH]);
const Ac10 = A.map(a => a - 10), Hc = H10.map(h => h - 15.5), G1c = ols(Y, [Ac10, Hc, Ac10.map((a, i) => a * Hc[i])]);
const slope = a => G1.b[2] + G1.b[3] * a, fitAt = (a, h) => G1.b[0] + G1.b[1] * a + slope(a) * h / 10;
let gk = 0;
function draw3() {
  const a = +$("ga").value; $("ga-v").textContent = a + " Jahren";
  const f = frame(520, 400, 110, 190, 0, 6, { P: { L: 48, R: 10, T: 12, B: 44 }, xl: "Körpergröße in cm", yl: "FEV in Litern", nx: 4 });
  let s = f.s;
  const near = i => Math.abs(A[i] - a) <= 1;
  H.forEach((h, i) => s += `<circle cx="${f.sx(h).toFixed(1)}" cy="${f.sy(Y[i]).toFixed(1)}" r="${near(i) ? 3.2 : 2.2}" fill="${near(i) ? "var(--beta-ink)" : "var(--pal-3)"}" fill-opacity="${near(i) ? .85 : .3}"/>`);
  const hs = H.filter((h, i) => near(i)), h0 = Math.min(...hs), h1 = Math.max(...hs);
  [6, 14].filter(x => Math.abs(x - a) > 1).forEach(x => { const hh = H.filter((h, i) => Math.abs(A[i] - x) <= 1), l0 = Math.min(...hh), l1 = Math.max(...hh); s += `<line ${f.clip} x1="${f.sx(l0)}" x2="${f.sx(l1)}" y1="${f.sy(fitAt(x, l0))}" y2="${f.sy(fitAt(x, l1))}" stroke="var(--muted)" stroke-width="1.6" stroke-dasharray="5 4"/><text x="${f.sx(l1) + 6}" y="${f.sy(fitAt(x, l1)) + 4}" class="halo">${x} J.</text>`; });
  s += `<line ${f.clip} x1="${f.sx(h0)}" x2="${f.sx(h1)}" y1="${f.sy(fitAt(a, h0))}" y2="${f.sy(fitAt(a, h1))}" stroke="var(--beta-ink)" stroke-width="4"/>`;
  s += `<text x="${f.P.L + 8}" y="${f.P.T + 16}" class="strong">${a} Jahre (± 1): +${fmt(slope(a))} l pro 10 cm</text>`;
  $("g-ch").innerHTML = s;
  const g = frame(520, 400, 0, 19, 0, 0.8, { P: { L: 48, R: 10, T: 12, B: 44 }, xl: "Alter in Jahren", yl: "Steigung der Größe: l pro 10 cm", nx: 6, ny: 4 });
  let t = g.s + `<rect x="${g.sx(0)}" y="${g.P.T}" width="${g.sx(3) - g.sx(0)}" height="${g.sy(0) - g.P.T}" fill="var(--highlight)"/><text x="${g.sx(1.5)}" y="${g.P.T + 16}" text-anchor="middle">keine</text><text x="${g.sx(1.5)}" y="${g.P.T + 32}" text-anchor="middle">Daten</text>`;
  t += `<line x1="${g.sx(0)}" x2="${g.sx(19)}" y1="${g.sy(G0.b[2])}" y2="${g.sy(G0.b[2])}" stroke="var(--muted)" stroke-width="1.6" stroke-dasharray="6 4"/><text x="${g.sx(19)}" y="${g.sy(G0.b[2]) - 8}" text-anchor="end" class="halo">ohne Wechselwirkung: ${fmt(G0.b[2])}</text>`;
  t += `<line x1="${g.sx(0)}" x2="${g.sx(3)}" y1="${g.sy(slope(0))}" y2="${g.sy(slope(3))}" stroke="var(--fg)" stroke-width="2" stroke-dasharray="3 4"/><line x1="${g.sx(3)}" x2="${g.sx(19)}" y1="${g.sy(slope(3))}" y2="${g.sy(slope(19))}" stroke="var(--fg)" stroke-width="3"/>`;
  t += `<circle cx="${g.sx(0)}" cy="${g.sy(slope(0))}" r="5" fill="var(--surface)" stroke="var(--fg)" stroke-width="2"/><text x="${g.sx(0) + 10}" y="${g.sy(slope(0)) + 18}" class="halo">Alter 0: ${fmt(slope(0))}</text>`;
  t += `<line x1="${g.sx(a)}" x2="${g.sx(a)}" y1="${g.sy(0)}" y2="${g.sy(slope(a))}" stroke="var(--beta-ink)" stroke-width="1.6" stroke-dasharray="4 3"/><circle cx="${g.sx(a)}" cy="${g.sy(slope(a))}" r="7" fill="var(--beta-ink)"/><text x="${g.sx(a) - 10}" y="${g.sy(slope(a)) - 12}" text-anchor="end" class="strong halo" style="fill:var(--beta-ink)">${fmt(slope(a))}</text>`;
  $("g-sl").innerHTML = t;
  $("g-f").innerHTML = TS(String.raw`\text{Steigung}_{\text{Größe}} = b_{\text{Größe}} + b_{\text{Alter} \times \text{Größe}} \cdot \text{Alter} = ${tz(fmt(G1.b[2], 3))} + ${tz(fmt(G1.b[3], 4))} \cdot ${a} = ${tz(fmt(slope(a), 3))}\ \text{l pro 10 cm}`, "");
  const mm = gk ? G1c : G1;
  $("g-tab").innerHTML = coefTable(mm, gk ? ["Achsenabschnitt (10 Jahre, 155 cm)", "Alter − 10 (pro Jahr, bei 155 cm)", "Größe − 155 (pro 10 cm, mit 10 Jahren)", "Alter × Größe"] : ["Achsenabschnitt (Alter 0, Größe 0)", "Alter (pro Jahr, bei Größe 0 cm)", "Größe (pro 10 cm, mit Alter 0)", "Alter × Größe"], gk ? 2 : 1, "Zielgröße FEV in Litern");
  $("g-c").innerHTML = (gk
    ? `Zentriert lesen sich die Haupteffekte sinnvoll: Bei 10-Jährigen bringen 10 cm mehr <b>${fmt(G1c.b[2])} l</b>, bei 155 cm bringt ein Jahr mehr ${fmt(G1c.b[1], 3)} l. `
    : `Roh ergibt die Tabelle Unsinn: Ein Jahr älter hieße ${fmt(G1.b[1])} l <b>weniger</b> FEV. Das gilt aber nur für Kinder mit 0 cm Körpergröße, und die gibt es nicht. Ebenso ist ${fmt(G1.b[2], 3)} die Steigung der Größe bei Neugeborenen, weit außerhalb der Daten (rechts der offene Punkt). Wählen Sie „zentriert“. `) +
    `Der Wechselwirkungsterm bleibt in beiden Kodierungen ${fmt(G1.b[3], 4)} (p ${fp(G1.p[3])}): Mit jedem Lebensjahr wird die Gerade der Größe um diesen Betrag pro 10 cm steiler. Mit 6 Jahren bringen 10 cm ${fmt(slope(6))} l, mit 14 Jahren ${fmt(slope(14))} l. R² steigt durch die Wechselwirkung von ${fmt(G0.r2 * 100, 1)} auf ${fmt(G1.r2 * 100, 1)} %.`;
}
$("ga").addEventListener("input", draw3);
$("g-sw").addEventListener("click", e => { const b = pick(e, $("g-sw")); if (!b) return; gk = +b.dataset.k; draw3(); });

draw1q(); draw2(); draw3();
})();
