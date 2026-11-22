/* Effektgrößen · Stats Lab
   Grundlagen: Cohen's d mit Überlappung und Überlegenheitswahrscheinlichkeit, Richtwerte, signifikant gegen relevant. */
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
const LG = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
function lgamma(x) { if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x); x -= 1; let a = 0.99999999999980993; const t = x + 7.5; for (let i = 0; i < 8; i++) a += LG[i] / (x + i + 1); return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a); }
function betacf(a, b, x) { const FP = 1e-300; let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < FP) d = FP; d = 1 / d; let h = d; for (let m = 1; m <= 400; m++) { const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2)); d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; h *= d * c; aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2)); d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-14) break; } return h; }
function ibeta(x, a, b) { if (x <= 0) return 0; if (x >= 1) return 1; const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)); return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b; }
const tcdf = (t, df) => { const ib = ibeta(df / (df + t * t), df / 2, 0.5); return t >= 0 ? 1 - 0.5 * ib : 0.5 * ib; };
function tinv(p, df) { let lo = -1e9, hi = 1e9; for (let i = 0; i < 140; i++) { const m = (lo + hi) / 2; if (tcdf(m, df) < p) lo = m; else hi = m; } return (lo + hi) / 2; }
function erf(x) { const s = x < 0 ? -1 : 1; x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)); }
const Phi = x => 0.5 * (1 + erf(x / Math.SQRT2));
const pdf = (x, m, s) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
const pc = (x, d = 0) => fmt(x * 100, d) + " %";
const ovl = d => 2 * Phi(-Math.abs(d) / 2), sup = d => Phi(d / Math.SQRT2);
function curves(f, m0, m1, s, lo, hi) {
  let a = "", b = "", o = "";
  const N = 240, pts = [];
  for (let i = 0; i <= N; i++) { const x = lo + (hi - lo) * i / N; pts.push([x, pdf(x, m0, s), pdf(x, m1, s)]); }
  a = "M" + pts.map(p => f.sx(p[0]).toFixed(1) + "," + f.sy(p[1]).toFixed(1)).join("L");
  b = "M" + pts.map(p => f.sx(p[0]).toFixed(1) + "," + f.sy(p[2]).toFixed(1)).join("L");
  o = "M" + f.sx(lo) + "," + f.sy(0) + "L" + pts.map(p => f.sx(p[0]).toFixed(1) + "," + f.sy(Math.min(p[1], p[2])).toFixed(1)).join("L") + "L" + f.sx(hi) + "," + f.sy(0) + "Z";
  return `<path d="${o}" fill="var(--beta-ink)" fill-opacity=".28"/><path d="${a}" fill="none" stroke="var(--kontrolle)" stroke-width="3"/><path d="${b}" fill="none" stroke="var(--therapie)" stroke-width="3"/>`;
}

/* ---------- 1 ---------- */
function draw1() {
  const D = +$("dd").value, S = +$("sd").value, d = D / S, m0 = 60, m1 = 60 - D;
  $("dd-v").textContent = D + " mm"; $("sd-v").textContent = S + " mm";
  const ymax = pdf(0, 0, S) * 1.2;
  const f = frame(900, 360, -20, 140, 0, ymax, { xl: "Schmerz VAS in mm (weniger ist besser)", yl: "", ny: 0, nx: 8, fx: v => fmt(v, 0) });
  let s = f.s + curves(f, m0, m1, S, -20, 140);
  s += `<line x1="${f.sx(m0)}" x2="${f.sx(m0)}" y1="${f.sy(0)}" y2="${f.sy(pdf(0, 0, S))}" stroke="var(--kontrolle)" stroke-dasharray="4 3"/><line x1="${f.sx(m1)}" x2="${f.sx(m1)}" y1="${f.sy(0)}" y2="${f.sy(pdf(0, 0, S))}" stroke="var(--therapie)" stroke-dasharray="4 3"/>`;
  const yb = f.sy(pdf(0, 0, S)) - 14;
  if (D > 0) s += `<line x1="${f.sx(m1)}" x2="${f.sx(m0)}" y1="${yb}" y2="${yb}" stroke="var(--fg)" stroke-width="2"/><text x="${(f.sx(m0) + f.sx(m1)) / 2}" y="${yb - 6}" text-anchor="middle" class="strong">Δ = ${D} mm</text>`;
  s += `<text x="${f.sx(m0) + 6}" y="${f.sy(pdf(0, 0, S) * 0.5)}" class="halo" style="fill:var(--kontrolle)">Kontrolle Ø ${m0}</text><text x="${f.sx(m1) - 6}" y="${f.sy(pdf(0, 0, S) * 0.5)}" text-anchor="end" class="halo" style="fill:var(--therapie)">Therapie Ø ${m1}</text>`;
  $("c1").innerHTML = s;
  $("f1").innerHTML = TB(String.raw`d = \dfrac{\bar{x}_{\text{Kontrolle}} - \bar{x}_{\text{Therapie}}}{s} = \dfrac{${D}}{${S}} = ${tz(fmt(d, 2))}`, "");
  $("r1").innerHTML = readout("Cohen's d", fmt(d, 2), "r-decision") + readout("Überlappung", pc(ovl(d))) + readout("Therapie-Person besser als Kontroll-Person", pc(sup(d))) + readout("Therapie unter dem Kontroll-Mittelwert", pc(Phi(d)));
  $("k1").innerHTML = d < 0.01 ? `Ohne Unterschied liegen beide Verteilungen aufeinander: d = 0, Überlappung 100 %, und eine zufällige Therapie-Person hat nur in 50 % der Fälle weniger Schmerz als eine zufällige Kontroll-Person, wie beim Münzwurf.`
    : `Die Gruppen liegen ${fmt(d, 2)} Standardabweichungen auseinander. Trotzdem überlappen sich die Verteilungen zu ${pc(ovl(d))}: Viele Personen der Kontrollgruppe haben weniger Schmerz als viele der Therapiegruppe. Zieht man zufällig je eine Person aus beiden Gruppen, hat die Therapie-Person in ${pc(sup(d))} der Fälle weniger Schmerz. Verändern Sie die Standardabweichung: Dieselben ${D} mm sind bei großer Streuung ein kleiner, bei kleiner Streuung ein großer Effekt.`;
}
["dd", "sd"].forEach(id => $(id).addEventListener("input", draw1));

/* ---------- 2 ---------- */
[[0.2, "s02", "klein"], [0.5, "s05", "mittel"], [0.8, "s08", "groß"]].forEach(([d, id, lab]) => {
  const f = frame(300, 170, -5, 4, 0, 0.48, { P: { L: 8, R: 8, T: 34, B: 22 }, xl: "", yl: "", ny: 0, nx: 1, fx: () => "" });
  $(id).innerHTML = f.s + curves(f, 0, -d, 1, -5, 4) + `<text x="150" y="16" text-anchor="middle" class="strong">d = ${fmt(d, 1)} (${lab})</text><text x="150" y="30" text-anchor="middle" style="fill:var(--muted)">Überlappung ${pc(ovl(d))} · besser: ${pc(sup(d))}</text>`;
});

/* ---------- 3 ---------- */
let study = "small";
const MCID = 13, SD = 20;
const nOf = v => Math.round(5 * Math.pow(400, v / 100));
function draw3() {
  const n = nOf(+$("nn").value), D = study === "small" ? 3 : 15, se = SD * Math.sqrt(2 / n), df = 2 * n - 2, t = D / se;
  const p = 2 * (1 - tcdf(t, df)), tc = tinv(0.975, df), lo = D - tc * se, hi = D + tc * se, sig = lo > 0, rel = D >= MCID;
  $("nn-v").textContent = n.toLocaleString("de-DE");
  const f = frame(900, 230, -15, 40, 0, 1, { xl: "Differenz der Mittelwerte in mm VAS", yl: "", ny: 0, nx: 11, fx: v => fmt(v, 0), P: { L: 20, R: 16, T: 40, B: 46 } });
  let s = f.s;
  s += `<rect x="${f.sx(MCID)}" y="${f.P.T}" width="${f.sx(40) - f.sx(MCID)}" height="${f.sy(0) - f.P.T}" fill="var(--therapie)" fill-opacity=".08"/><line x1="${f.sx(MCID)}" x2="${f.sx(MCID)}" y1="${f.P.T - 20}" y2="${f.sy(0)}" stroke="var(--therapie)" stroke-width="2" stroke-dasharray="6 4"/><text x="${f.sx(MCID) + 6}" y="${f.P.T - 8}" class="strong" style="fill:var(--therapie)">MCID 13 mm: klinisch relevant</text>`;
  s += `<line x1="${f.sx(0)}" x2="${f.sx(0)}" y1="${f.P.T - 20}" y2="${f.sy(0)}" stroke="var(--fg)" stroke-width="2"/><text x="${f.sx(0) - 6}" y="${f.P.T - 8}" text-anchor="end" class="strong">kein Unterschied</text>`;
  const y = f.sy(0.5), L = Math.max(-15, lo), H = Math.min(40, hi), col = sig ? "var(--beta-ink)" : "var(--muted)";
  s += `<line x1="${f.sx(L)}" x2="${f.sx(H)}" y1="${y}" y2="${y}" stroke="${col}" stroke-width="6" stroke-linecap="round"/><circle cx="${f.sx(D)}" cy="${y}" r="9" fill="var(--surface)" stroke="${col}" stroke-width="3"/>`;
  s += `<text x="${f.sx(D)}" y="${y + 30}" text-anchor="middle" class="strong halo">${D} mm, 95-%-KI ${fmt(lo, 1)} bis ${fmt(hi, 1)}</text>`;
  $("c3").innerHTML = s;
  $("r3").innerHTML = readout("Personen pro Gruppe", n.toLocaleString("de-DE")) + readout("Cohen's d (bleibt gleich)", fmt(D / SD, 2)) + readout("p-Wert", fp(p), "r-decision") + readout("Ergebnis", sig ? "signifikant" : "nicht signifikant");
  $("k3").innerHTML = sig && rel ? `<b>Signifikant und relevant.</b> Der Unterschied ist sicher größer als null, und mit ${D} mm liegt er über der MCID. Das Konfidenzintervall zeigt allerdings, wie genau: Reicht es unter 13 mm, ist auch ein klinisch unbedeutender Effekt mit den Daten vereinbar.`
    : sig ? `<b>Signifikant, aber klinisch unbedeutend.</b> Mit ${n.toLocaleString("de-DE")} Personen pro Gruppe wird selbst ein Unterschied von ${D} mm signifikant. Die Effektgröße bleibt aber d = ${fmt(D / SD, 2)}, und das Konfidenzintervall liegt vollständig unter der MCID. Ein kleiner p-Wert heißt nicht „großer Effekt“.`
    : rel ? `<b>Nicht signifikant, aber möglicherweise relevant.</b> Der geschätzte Unterschied von ${D} mm liegt über der MCID, doch mit ${n} Personen pro Gruppe ist das Konfidenzintervall so breit, dass es auch null einschließt. Das ist kein Beleg, dass die Therapie nicht wirkt; die Studie war zu klein (vgl. <a href="../../testen/fallzahl/">Fallzahl und Power</a>). Erhöhen Sie n.`
    : `<b>Nicht signifikant und klein.</b> Der Unterschied ist klein, und mit ${n} Personen pro Gruppe ist er auch nicht von null zu unterscheiden. Erhöhen Sie n: Irgendwann wird er signifikant, ohne größer zu werden.`;
}
$("nn").addEventListener("input", draw3);
$("st").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; study = b.dataset.s; $("st").querySelectorAll("button").forEach(z => z.setAttribute("aria-pressed", z === b)); draw3(); });

draw1(); draw3();
})();
