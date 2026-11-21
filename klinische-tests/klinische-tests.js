/* Klinische Tests · Stats Lab
   Gütekriterien (Zielscheiben, Kappa, ICC/SEM/MDC), Vierfeldertafel mit Likelihood-Ratios und Fagan-Nomogramm, Testtabelle. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const fmt = (x, d = 2) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const pc = (x, d = 0) => fmt(x * 100, d) + " %";
const intf = x => Math.round(x).toLocaleString("de-DE");
const f2 = x => !isFinite(x) ? "∞" : x >= 100 ? intf(x) : x >= 10 ? fmt(x, 1) : x >= 0.1 ? fmt(x, 2) : fmt(x, 3);
const readout = (l, v, cls = "") => `<div class="readout ${cls}"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- 1 Zielscheiben ---------- */
(function targets() {
  const T = [["reliabel und valide", 0, 0, 7], ["reliabel, nicht valide", 26, -18, 7], ["nicht reliabel, im Mittel valide", 0, 0, 30], ["weder reliabel noch valide", 24, 20, 30]];
  const r = mulberry32(11); let s = "";
  T.forEach(([lab, dx, dy, sp], i) => {
    const cx = 115 + i * 230, cy = 110;
    [80, 60, 40, 20].forEach((rr, k) => s += `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="${k % 2 ? "var(--surface)" : "var(--highlight)"}" stroke="var(--line)"/>`);
    s += `<circle cx="${cx}" cy="${cy}" r="4" fill="var(--fg)"/>`;
    for (let j = 0; j < 9; j++) { let u = 0; while (!u) u = r(); const v = r(), m = Math.sqrt(-2 * Math.log(u)); s += `<circle cx="${cx + dx + sp * 0.6 * m * Math.cos(2 * Math.PI * v)}" cy="${cy + dy + sp * 0.6 * m * Math.sin(2 * Math.PI * v)}" r="5" fill="var(--therapie)" fill-opacity=".85"/>`; }
    s += `<text x="${cx}" y="${cy + 112}" text-anchor="middle" class="strong">${lab}</text>`;
  });
  $("targets").innerHTML = s;
})();

/* ---------- 1 Kappa ---------- */
const KP = { good: [40, 5, 5, 50], para: [85, 5, 5, 5], rand: [25, 25, 25, 25] };
let K = KP.good.slice();
function drawKappa() {
  const [a, b, c, d] = K, n = a + b + c + d || 1;
  const po = (a + d) / n, p1 = (a + b) / n, p2 = (a + c) / n, pe = p1 * p2 + (1 - p1) * (1 - p2), k = pe < 1 ? (po - pe) / (1 - pe) : 1;
  const inp = (i, v) => `<input type="number" min="0" max="200" value="${v}" data-i="${i}" aria-label="Anzahl">`;
  $("ktab").innerHTML = `<thead><tr><th></th><th colspan="2">Therapeutin 2</th><th></th></tr><tr><th>Therapeutin 1</th><th>positiv</th><th>negativ</th><th>Summe</th></tr></thead>
    <tbody><tr><th>positiv</th><td class="agree">${inp(0, a)}</td><td>${inp(1, b)}</td><td>${a + b}</td></tr>
    <tr><th>negativ</th><td>${inp(2, c)}</td><td class="agree">${inp(3, d)}</td><td>${c + d}</td></tr>
    <tr><th>Summe</th><td>${a + c}</td><td>${b + d}</td><td>${n}</td></tr></tbody>`;
  $("ktab").querySelectorAll("input").forEach(el => el.addEventListener("change", e => { K[+e.target.dataset.i] = Math.max(0, Math.round(+e.target.value || 0)); document.querySelectorAll("#k-pre button").forEach(x => x.setAttribute("aria-pressed", "false")); drawKappa(); }));
  $("k-form").innerHTML = `<span>beobachtete Übereinstimmung p<sub>o</sub> = (${a} + ${d}) ÷ ${n} = ${fmt(po)}</span><span>Zufallsübereinstimmung p<sub>e</sub> = ${fmt(p1)} · ${fmt(p2)} + ${fmt(1 - p1)} · ${fmt(1 - p2)} = ${fmt(pe)}</span><span class="big">κ = (p<sub>o</sub> − p<sub>e</sub>) ÷ (1 − p<sub>e</sub>) = ${fmt(k)}</span>`;
  const band = k < 0 ? "schlecht" : k <= 0.2 ? "gering" : k <= 0.4 ? "ausreichend" : k <= 0.6 ? "mittelmäßig" : k <= 0.8 ? "beachtlich" : "fast vollkommen";
  $("k-out").innerHTML = readout("Übereinstimmung", pc(po)) + readout("davon zufällig erwartet", pc(pe)) + readout("Kappa", fmt(k), "r-decision") + readout("Einordnung", band);
  $("k-call").innerHTML = po >= 0.85 && k < 0.6
    ? `<b>Prävalenz-Paradox:</b> ${pc(po)} Übereinstimmung klingt hervorragend, Kappa ist aber nur ${fmt(k)}. Fast alle Befunde sind positiv, deshalb stimmen zwei Personen schon zufällig in ${pc(pe)} der Fälle überein. Bei sehr ungleich verteilten Befunden immer beides berichten.`
    : k < 0.1 ? `Die Übereinstimmung entspricht dem, was zwei Personen auch durch Münzwurf erreichen würden. Kappa nahe null heißt: keine Übereinstimmung über den Zufall hinaus.`
    : `Kappa ${fmt(k)}: Von der Übereinstimmung, die über den Zufall hinaus möglich wäre, wird ${pc(Math.max(0, k))} erreicht.`;
}
document.querySelectorAll("#k-pre button").forEach(b => b.addEventListener("click", () => { K = KP[b.dataset.k].slice(); document.querySelectorAll("#k-pre button").forEach(x => x.setAttribute("aria-pressed", x === b)); drawKappa(); }));
drawKappa();

/* ---------- 1 ICC, SEM, MDC ---------- */
function drawIcc() {
  const icc = +$("icc").value, sd = +$("icc-sd").value, sem = sd * Math.sqrt(1 - icc), mdc = 1.96 * Math.SQRT2 * sem;
  $("icc-v").textContent = fmt(icc); $("icc-sd-v").textContent = fmt(sd, 1) + " cm";
  $("icc-form").innerHTML = `<span>SEM = SD · √(1 − ICC) = ${fmt(sd, 1)} · √(1 − ${fmt(icc)}) = <b>${fmt(sem)} cm</b></span><span>MDC<sub>95</sub> = 1,96 · √2 · SEM = <b>${fmt(mdc)} cm</b></span>`;
  $("icc-call").innerHTML = `Bei ICC = ${fmt(icc)} muss sich der Armumfang einer Person um mehr als <b>${fmt(mdc, 1)} cm</b> ändern, bevor man sicher sein kann, dass es keine Messschwankung war. Ist die erwartete Zunahme durch den Pump kleiner, lässt sie sich bei einzelnen Personen nicht von Messfehlern unterscheiden. Beim Gruppenmittelwert kann sie trotzdem nachweisbar sein, weil sich Messfehler über viele Personen ausmitteln.`;
}
["icc", "icc-sd"].forEach(id => $(id).addEventListener("input", drawIcc));
drawIcc();

/* ---------- 2 Vierfeldertafel ---------- */
const TESTS = [
  { id: "lachman", name: "Lachman", target: "Ruptur des vorderen Kreuzbands", se: 0.85, sp: 0.94, src: "Benjaminse et al. 2006" },
  { id: "pivot", name: "Pivot-Shift", target: "Ruptur des vorderen Kreuzbands", se: 0.24, sp: 0.98, src: "Benjaminse et al. 2006" },
  { id: "slr", name: "Straight Leg Raise", target: "Bandscheibenvorfall mit Radikulopathie", se: 0.91, sp: 0.26, src: "Devillé et al. 2000" },
  { id: "cslr", name: "gekreuzter SLR", target: "Bandscheibenvorfall mit Radikulopathie", se: 0.29, sp: 0.88, src: "Devillé et al. 2000" },
  { id: "ottawa", name: "Ottawa Ankle Rules", target: "Fraktur am Sprunggelenk", se: 0.98, sp: 0.40, src: "Bachmann et al. 2003, Spezifität als Median" }
];
const D = { t: "lachman" };
$("t-seg").innerHTML = TESTS.map(t => `<button type="button" data-t="${t.id}" aria-pressed="${t.id === D.t}">${t.name}</button>`).join("") + `<button type="button" data-t="own" aria-pressed="false">eigene Werte</button>`;
function setTest(id) {
  D.t = id; const t = TESTS.find(x => x.id === id);
  if (t) { $("se").value = t.se; $("sp").value = t.sp; }
  document.querySelectorAll("#t-seg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.t === id));
  drawDx();
}
$("t-seg").addEventListener("click", e => { const b = e.target.closest("button"); if (b) setTest(b.dataset.t); });
["se", "sp"].forEach(id => $(id).addEventListener("input", () => { D.t = "own"; document.querySelectorAll("#t-seg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.t === "own")); drawDx(); }));
$("pv").addEventListener("input", drawDx);
function drawDx() {
  const se = +$("se").value, sp = +$("sp").value, pv = +$("pv").value, N = 1000;
  $("se-v").textContent = pc(se); $("sp-v").textContent = pc(sp); $("pv-v").textContent = pc(pv);
  const t = TESTS.find(x => x.id === D.t);
  $("t-note").innerHTML = t ? `Zielerkrankung: ${t.target} · Quelle: ${t.src}` : "Eigene Werte: Sensitivität und Spezifität frei einstellbar.";
  const sick = Math.round(N * pv), well = N - sick, tp = Math.round(sick * se), fn = sick - tp, tn = Math.round(well * sp), fp = well - tn;
  const ppv = tp / (tp + fp || 1), npv = tn / (tn + fn || 1), lrp = se / (1 - sp), lrn = (1 - se) / sp;
  $("dx").innerHTML = `<thead><tr><th>${N.toLocaleString("de-DE")} Personen</th><th>krank</th><th>gesund</th><th>Summe</th></tr></thead><tbody>
    <tr><th>Test positiv</th><td class="tp">${intf(tp)}<small>richtig positiv</small></td><td class="fp">${intf(fp)}<small>falsch positiv</small></td><td class="row">${intf(tp + fp)}<small>PPV ${pc(ppv, 1)}</small></td></tr>
    <tr><th>Test negativ</th><td class="fn">${intf(fn)}<small>falsch negativ</small></td><td class="tn">${intf(tn)}<small>richtig negativ</small></td><td class="row">${intf(fn + tn)}<small>NPV ${pc(npv, 1)}</small></td></tr>
    <tr><th>Summe</th><td class="col">${intf(sick)}<small>Sens. ${pc(tp / (sick || 1), 0)}</small></td><td class="col">${intf(well)}<small>Spez. ${pc(tn / (well || 1), 0)}</small></td><td>${intf(N)}</td></tr></tbody>`;
  $("dx-m").innerHTML = readout("Sensitivität · Spalte krank", pc(se)) + readout("Spezifität · Spalte gesund", pc(sp)) +
    readout("PPV · Zeile positiv", pc(ppv, 1), "r-p") + readout("NPV · Zeile negativ", pc(npv, 1), "r-p") +
    readout("LR+ = Sens ÷ (1 − Spez)", f2(lrp), "r-decision") + readout("LR− = (1 − Sens) ÷ Spez", f2(lrn), "r-decision");
  window.drawFagan($("dx-fagan"), pv, lrp, lrn);
  const sP = lrp > 10 ? "stark" : lrp >= 5 ? "mäßig" : lrp >= 2 ? "wenig" : "kaum";
  const sN = lrn < 0.1 ? "stark" : lrn <= 0.2 ? "mäßig" : lrn <= 0.5 ? "wenig" : "kaum";
  const oP = pv / (1 - pv) * lrp, oN = pv / (1 - pv) * lrn;
  $("dx-call").innerHTML = `Ein positives Ergebnis hebt die Wahrscheinlichkeit von ${pc(pv)} auf <b>${pc(oP / (1 + oP), 1)}</b> (LR+ ${f2(lrp)}, ${sP}). Ein negatives senkt sie auf <b>${pc(oN / (1 + oN), 1)}</b> (LR− ${f2(lrn)}, ${sN}).`;
}
drawDx();

/* ---------- 4 Testtabelle ---------- */
(function table() {
  const rows = TESTS.map(t => {
    const lrp = t.se / (1 - t.sp), lrn = (1 - t.se) / t.sp;
    const sN = lrn < 0.1 ? "stark" : lrn <= 0.2 ? "mäßig" : lrn <= 0.5 ? "wenig" : "kaum";
    const sP = lrp > 10 ? "stark" : lrp >= 5 ? "mäßig" : lrp >= 2 ? "wenig" : "kaum";
    return `<tr data-t="${t.id}" tabindex="0"><th>${t.name}<small>${t.target}</small></th><td>${pc(t.se)}</td><td>${pc(t.sp)}</td><td>${f2(lrp)}</td><td>${f2(lrn)}</td><td class="lv ${sN}">${sN}</td><td class="lv ${sP}">${sP}</td><td class="src">${t.src}</td></tr>`;
  }).join("");
  $("pt").innerHTML = `<thead><tr><th>Test</th><th>Sens.</th><th>Spez.</th><th>LR+</th><th>LR−</th><th>negativ schließt aus</th><th>positiv bestätigt</th><th>Quelle</th></tr></thead><tbody>${rows}</tbody>`;
  const go = tr => { setTest(tr.dataset.t); const acc = $("acc-2"); acc.open = true; acc.scrollIntoView({ behavior: "smooth" }); };
  $("pt").querySelectorAll("tbody tr").forEach(tr => { tr.addEventListener("click", () => go(tr)); tr.addEventListener("keydown", e => { if (e.key === "Enter") go(tr); }); });
})();
})();
