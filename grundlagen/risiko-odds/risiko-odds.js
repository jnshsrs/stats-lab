/* Risiko, Odds und Odds Ratio · Stats Lab
   Grundlagen: Risiko gegen Odds, Vierfeldertafel mit RD, NNT, RR, OR, Abweichung OR/RR, Fall-Kontroll-Design. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const fmt = (x, d = 2) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");
const tz = x => String(x).replace(/\./g, "{.}").replace(/,/g, "{,}").replace(/−/g, "-");
const readout = (l, v, cls = "") => `<div class="readout ${cls}"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;
const TB = (t, fb) => window.katex ? texBlock(t) : fb;
const fp = p => p < 0.001 ? "< 0,001" : fmt(p, 3);
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
const pct = (x, d = 1) => fmt(x * 100, d) + " %";
const ratioWords = o => o < 1 ? `1 : ${fmt(1 / o, 1)}` : `${fmt(o, 1)} : 1`;

/* ---------- 1 Risiko und Odds ---------- */
function draw1() {
  const p = +$("p").value / 100, o = p / (1 - p), k = Math.round(p * 100);
  $("p-v").textContent = pct(p, 0);
  let s = "";
  for (let i = 0; i < 100; i++) { const r = Math.floor(i / 10), c = i % 10, hit = i < k; s += `<circle cx="${60 + c * 44}" cy="${30 + r * 34}" r="13" fill="${hit ? "var(--therapie)" : "var(--pal-3)"}" fill-opacity="${hit ? 1 : .35}"/>`; }
  s += `<text x="260" y="372" text-anchor="middle" class="strong">${k} betroffen, ${100 - k} nicht betroffen</text>`;
  $("icons").innerHTML = s;
  const f = frame(520, 380, 0, 1, 0, 6, { P: { L: 44, R: 12, T: 12, B: 44 }, xl: "Risiko p", yl: "Odds", nx: 5, fx: v => fmt(v * 100, 0) + " %" });
  let t = f.s;
  let d = ""; for (let q = 0; q <= 0.857; q += 0.005) d += (d ? "L" : "M") + f.sx(q).toFixed(1) + "," + f.sy(q / (1 - q)).toFixed(1);
  t += `<line ${f.clip} x1="${f.sx(0)}" x2="${f.sx(1)}" y1="${f.sy(0)}" y2="${f.sy(1)}" stroke="var(--fg)" stroke-dasharray="5 4" stroke-width="1.4"/><text x="${f.sx(0.62)}" y="${f.sy(0.62) + 18}" style="fill:var(--muted)">Odds = Risiko</text>`;
  t += `<path ${f.clip} d="${d}" fill="none" stroke="var(--beta-ink)" stroke-width="3"/>`;
  if (o <= 6) t += `<line x1="${f.sx(p)}" x2="${f.sx(p)}" y1="${f.sy(0)}" y2="${f.sy(o)}" stroke="var(--therapie)" stroke-dasharray="3 3"/><circle cx="${f.sx(p)}" cy="${f.sy(o)}" r="7" fill="var(--beta-ink)"/>`;
  else t += `<text x="${f.sx(0.84)}" y="${f.P.T + 16}" text-anchor="end" class="strong" style="fill:var(--beta-ink)">Odds ${fmt(o, 1)} ↑</text>`;
  $("oc").innerHTML = t;
  $("o-f").innerHTML = TB(String.raw`\begin{aligned} \text{Odds} &= \dfrac{p}{1 - p} = \dfrac{${tz(fmt(p, 2))}}{${tz(fmt(1 - p, 2))}} = ${tz(fmt(o, 2))} \\ p &= \dfrac{\text{Odds}}{1 + \text{Odds}} \end{aligned}`, "");
  $("o-r").innerHTML = readout("Risiko", pct(p, 0), "r-decision") + readout("Odds", fmt(o, 2)) + readout("als Verhältnis", ratioWords(o)) + readout("in Worten", `${k} zu ${100 - k}`);
  $("o-c").innerHTML = p <= 0.1
    ? `Bei seltenen Ereignissen sind Risiko und Odds fast gleich (${pct(p, 0)} gegen ${fmt(o, 3)}): Die Nichtbetroffenen sind dann fast alle. Deshalb liegen bei seltenen Ereignissen auch relatives Risiko und Odds Ratio nah beieinander.`
    : p < 0.5 ? `Bei ${pct(p, 0)} betragen die Odds ${fmt(o, 2)}: Auf eine betroffene Person kommen ${fmt(1 / o, 1)} nicht betroffene. Je häufiger das Ereignis, desto weiter laufen Risiko und Odds auseinander. Mit Odds rechnet auch die <a href="../../hintergrund/mammografie/#likelihood">Likelihood-Ratio</a>: Nachtest-Odds = Vortest-Odds × LR.`
    : `Ab 50 % sind die Odds größer als 1 und wachsen ohne Obergrenze: Bei 80 % betragen sie 4, bei 95 % schon 19. Ein Risiko endet bei 100 %, Odds nie. Genau diese fehlende Obergrenze nutzt später die logistische Regression.`;
}
$("p").addEventListener("input", draw1);

/* ---------- 2 Vierfeldertafel ---------- */
function draw2() {
  const [a, b, c, d] = ["a", "b", "c", "d"].map(id => Math.max(0, +$(id).value || 0));
  const n1 = a + b, n0 = c + d, r1 = n1 ? a / n1 : NaN, r0 = n0 ? c / n0 : NaN, o1 = b ? a / b : NaN, o0 = d ? c / d : NaN;
  const RD = r1 - r0, RR = r1 / r0, OR = (a * d) / (b * c), ok = isFinite(RR) && isFinite(OR) && RR > 0 && OR > 0;
  $("n1").textContent = n1; $("n0").textContent = n0; $("r1").textContent = isFinite(r1) ? pct(r1) : "–"; $("r0").textContent = isFinite(r0) ? pct(r0) : "–";
  $("od1").textContent = isFinite(o1) ? fmt(o1, 3) : "–"; $("od0").textContent = isFinite(o0) ? fmt(o0, 3) : "–";
  const W = 340, L = 84, R = 64, w = W - L - R, bar = (y, r, lab, col) => `<text x="${L - 10}" y="${y + 22}" text-anchor="end" class="strong">${lab}</text><rect x="${L}" y="${y}" width="${w}" height="34" rx="4" fill="var(--highlight)"/><rect x="${L}" y="${y}" width="${Math.max(0, w * (r || 0))}" height="34" rx="4" fill="${col}"/><text x="${L + w * (r || 0) + 8}" y="${y + 22}" class="strong">${isFinite(r) ? pct(r) : "–"}</text>`;
  $("bars").innerHTML = `<text x="${L}" y="18" style="fill:var(--muted)">Risiko, verletzt zu werden</text>` + bar(36, r1, "Programm", "var(--therapie)") + bar(100, r0, "Kontrolle", "var(--fg)") + `<line x1="${L}" x2="${L}" y1="30" y2="146" stroke="var(--fg)"/>`;
  const nnt = Math.abs(RD) > 1e-9 ? Math.ceil(1 / Math.abs(RD) - 1e-9) : Infinity;
  $("t-r").innerHTML = readout("Risikodifferenz", isFinite(RD) ? (RD > 0 ? "+" : "") + fmt(RD * 100, 1) + " %-Punkte" : "–") + readout(RD < 0 ? "NNT" : "NNH", isFinite(nnt) ? String(nnt) : "–") + readout("relatives Risiko RR", ok ? fmt(RR, 2) : "–", "r-decision") + readout("Odds Ratio OR", ok ? fmt(OR, 2) : "–", "r-decision");
  if (!ok) { $("t-f").innerHTML = ""; $("t-c").innerHTML = "Für RR und OR darf keine Zelle null sein."; return; }
  $("t-f").innerHTML = TB(String.raw`\begin{aligned} \text{RD} &= \tfrac{a}{a+b} - \tfrac{c}{c+d} \\ &= ${tz(fmt(r1, 3))} - ${tz(fmt(r0, 3))} = ${tz(fmt(RD, 3))} \\ \text{NNT} &= 1 / |\text{RD}| = ${tz(fmt(1 / Math.abs(RD), 1))} \approx ${nnt} \\ \text{RR} &= \dfrac{a/(a+b)}{c/(c+d)} = \dfrac{${tz(fmt(r1, 3))}}{${tz(fmt(r0, 3))}} = ${tz(fmt(RR, 2))} \\ \text{OR} &= \dfrac{a/b}{c/d} = \dfrac{a \cdot d}{b \cdot c} \\ &= \dfrac{${a} \cdot ${d}}{${b} \cdot ${c}} = ${tz(fmt(OR, 2))} \end{aligned}`, "");
  const lower = RR < 1;
  $("t-c").innerHTML = Math.abs(RR - 1) < 1e-9
    ? `Beide Gruppen haben dasselbe Risiko: RD = 0, RR = 1 und OR = 1. „Kein Effekt“ heißt bei Differenzen 0, bei Verhältnissen 1.`
    : `Mit Programm verletzen sich ${pct(r1)}, ohne ${pct(r0)}. <b>Absolut</b> sind das ${fmt(Math.abs(RD) * 100, 1)} Prozentpunkte ${lower ? "weniger" : "mehr"}: ${nnt} Spielerinnen müssen das Programm machen, damit ${lower ? "eine Verletzung weniger" : "eine Verletzung mehr"} auftritt (${lower ? "number needed to treat" : "number needed to harm"}). <b>Relativ</b> ${lower ? "sinkt" : "steigt"} das Risiko auf das ${fmt(RR, 2)}-Fache, ${lower ? "eine relative Risikoreduktion" : "eine Erhöhung"} um ${fmt(Math.abs(1 - RR) * 100, 0)} %. Die <b>Odds</b> ${lower ? "sinken" : "steigen"} auf das ${fmt(OR, 2)}-Fache. Das OR liegt weiter von 1 entfernt als das RR; wie weit, hängt von der Häufigkeit ab (Abschnitt 3).`;
}
["a", "b", "c", "d"].forEach(id => $(id).addEventListener("input", draw2));
$("pre2").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; b.dataset.t.split(",").forEach((v, i) => $("abcd"[i]).value = v); draw2(); });

/* ---------- 3 OR gegen RR ---------- */
function draw3() {
  const p0 = +$("p0").value / 100, RR = +$("rr").value, p1 = RR * p0;
  $("p0-v").textContent = pct(p0, 0); $("rr-v").textContent = fmt(RR, 2);
  const orAt = q => { const q1 = RR * q; return q1 >= 1 ? NaN : (q1 / (1 - q1)) / (q / (1 - q)); };
  const qmax = Math.min(0.9, RR > 1 ? 0.999 / RR : 0.9);
  let ymax = RR < 1 ? 1.25 : Math.min(12, Math.max(RR * 1.3, orAt(Math.min(qmax, 0.9) * 0.97) * 1.1));
  const f = frame(900, 380, 0, 0.9, 0, ymax, { xl: "Risiko in der Kontrollgruppe", yl: "Verhältnis", nx: 9, fx: v => fmt(v * 100, 0) + " %" });
  let s = f.s;
  s += `<line x1="${f.sx(0)}" x2="${f.sx(0.9)}" y1="${f.sy(1)}" y2="${f.sy(1)}" stroke="var(--muted)" stroke-dasharray="2 4"/><text x="${f.sx(0.89)}" y="${f.sy(1) - 6}" text-anchor="end" style="fill:var(--muted)">kein Effekt</text>`;
  s += `<line ${f.clip} x1="${f.sx(0)}" x2="${f.sx(qmax)}" y1="${f.sy(RR)}" y2="${f.sy(RR)}" stroke="var(--therapie)" stroke-width="3"/><text x="${f.sx(0.01)}" y="${f.sy(RR) + (RR < 1 ? 18 : -8)}" class="strong" style="fill:var(--therapie)">RR = ${fmt(RR, 2)}</text>`;
  let d = ""; for (let q = 0.005; q <= qmax; q += 0.005) { const v = orAt(q); if (isFinite(v)) d += (d ? "L" : "M") + f.sx(q).toFixed(1) + "," + f.sy(v).toFixed(1); }
  s += `<path ${f.clip} d="${d}" fill="none" stroke="var(--beta-ink)" stroke-width="3"/>`;
  if (RR > 1 && qmax < 0.9) s += `<rect x="${f.sx(qmax)}" y="${f.P.T}" width="${f.sx(0.9) - f.sx(qmax)}" height="${f.sy(0) - f.P.T}" fill="var(--highlight)"/><text x="${(f.sx(qmax) + f.sx(0.9)) / 2}" y="${f.P.T + 18}" text-anchor="middle">RR hier unmöglich</text>`;
  const OR = orAt(p0);
  if (isFinite(OR)) s += `<line x1="${f.sx(p0)}" x2="${f.sx(p0)}" y1="${f.sy(RR)}" y2="${f.sy(Math.min(OR, ymax))}" stroke="var(--fg)" stroke-width="2"/><circle cx="${f.sx(p0)}" cy="${f.sy(Math.min(OR, ymax))}" r="7" fill="var(--beta-ink)"/><text x="${f.sx(p0) + 10}" y="${f.sy(Math.min(OR, ymax)) + (RR < 1 ? 18 : -8)}" class="strong halo" style="fill:var(--beta-ink)">OR = ${fmt(OR, 2)}</text>`;
  $("div").innerHTML = s;
  if (!isFinite(OR)) { $("d-r").innerHTML = readout("Risiko mit Programm", "> 100 %"); $("d-c").innerHTML = `Bei einem Ausgangsrisiko von ${pct(p0, 0)} ist ein RR von ${fmt(RR, 2)} unmöglich: Das Risiko läge über 100 %. Ein relatives Risiko hat eine Obergrenze, ein Odds Ratio nicht.`; return; }
  $("d-r").innerHTML = readout("Risiko Kontrolle", pct(p0, 0)) + readout("Risiko Programm", pct(p1)) + readout("RR", fmt(RR, 2), "r-decision") + readout("OR", fmt(OR, 2), "r-decision");
  const dev = Math.abs(OR - RR) / Math.abs(RR - 1 || 1);
  $("d-c").innerHTML = Math.abs(RR - 1) < 0.01 ? `Ohne Effekt sind RR und OR beide 1, bei jedem Ausgangsrisiko.`
    : p0 <= 0.1 ? `Bei einem Ausgangsrisiko von ${pct(p0, 0)} ist das OR (${fmt(OR, 2)}) fast gleich dem RR (${fmt(RR, 2)}). Bei seltenen Ereignissen darf man ein OR näherungsweise wie ein RR lesen.`
    : `Bei einem Ausgangsrisiko von ${pct(p0, 0)} liegt das OR mit ${fmt(OR, 2)} deutlich weiter von 1 entfernt als das RR mit ${fmt(RR, 2)}. Wer dieses OR als RR liest, ${RR < 1 ? `glaubt an eine Risikoreduktion um ${fmt((1 - OR) * 100, 0)} % statt um ${fmt((1 - RR) * 100, 0)} %` : `glaubt an ein ${fmt(OR, 1)}-faches statt ${fmt(RR, 1)}-faches Risiko`}. Das OR übertreibt bei häufigen Ereignissen immer, es ist aber nicht falsch, nur eine andere Größe.`;
}
["p0", "rr"].forEach(id => $(id).addEventListener("input", draw3));

/* ---------- 4 Fall-Kontroll ---------- */
const CO = { ea: 45, eb: 180, ua: 55, ub: 720 };
let kpf = 1;
const tab = (ea, eb, ua, ub, h1, h2, rh = "Risiko") => `<thead><tr><th>frühere Verletzung</th><th>${h1}</th><th>${h2}</th><th>${rh}</th></tr></thead><tbody><tr><th>ja</th><td>${ea}</td><td>${eb}</td><td class="rk">${pct(ea / (ea + eb))}</td></tr><tr><th>nein</th><td>${ua}</td><td>${ub}</td><td class="rk">${pct(ua / (ua + ub))}</td></tr></tbody>`;
function draw4() {
  const rr = (ea, eb, ua, ub) => (ea / (ea + eb)) / (ua / (ua + ub)), or = (ea, eb, ua, ub) => ea * ub / (eb * ua);
  $("coh").innerHTML = tab(CO.ea, CO.eb, CO.ua, CO.ub, "verletzt", "nicht verletzt");
  const RRc = rr(CO.ea, CO.eb, CO.ua, CO.ub), ORc = or(CO.ea, CO.eb, CO.ua, CO.ub);
  $("coh-r").innerHTML = readout("RR", fmt(RRc, 2), "r-decision") + readout("OR", fmt(ORc, 2), "r-decision");
  const ce = 20 * kpf, cu = 80 * kpf;
  $("cc").innerHTML = tab(CO.ea, ce, CO.ua, cu, "Fälle", "Kontrollen", "„Risiko“");
  const RRx = rr(CO.ea, ce, CO.ua, cu), ORx = or(CO.ea, ce, CO.ua, cu);
  $("cc-r").innerHTML = readout("„RR“ aus der Tabelle", fmt(RRx, 2)) + readout("OR", fmt(ORx, 2), "r-decision");
  $("cc-c").innerHTML = `Die Kontrollen sind ein Abbild der Unverletzten: Ein Fünftel war früher schon verletzt. Mit ${kpf} Kontrolle${kpf > 1 ? "n" : ""} pro Fall ergibt die Tabelle ein „RR“ von ${fmt(RRx, 2)}, in der Kohorte sind es ${fmt(RRc, 2)}. Das „Risiko“ in der Fall-Kontroll-Tabelle hat keine Bedeutung, es hängt nur davon ab, wie viele Kontrollen man gezogen hat. Das <b>Odds Ratio bleibt ${fmt(ORx, 2)}</b>, genau wie in der Kohorte. Probieren Sie die anderen Verhältnisse aus.`;
}
$("kpf").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; $("kpf").querySelectorAll("button").forEach(z => z.setAttribute("aria-pressed", z === b)); kpf = +b.dataset.k; draw4(); });

draw1(); draw2(); draw3(); draw4();
})();
