/* Das RCT Schritt für Schritt · Stats Lab
   Station „Das RCT Schritt für Schritt“: animierte Studie in neun Schritten (simuliert, Modell in ../rct-sim.js),
   CONSORT-Fluss, Tabelle 1, Drop-out und Auswertung, Streptomycin 1948 mit echten Daten, PEDro-Skala. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const fmt = (x, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");
const pct = (x, d = 0) => fmt(x * 100, d) + " %";
const S = window.RCTSIM, { mean, sd, diff } = S;
const NP = 240, SEED = 1;
const people = S.makePeople(SEED, NP), excl = people.filter(p => p.excl), refused = people.filter(p => !p.excl && !p.consent), enr = people.filter(p => !p.excl && p.consent);
const st = { step: 0, alloc: 1, unblind: false, rate: 0.15, mech: 0 };

/* ---------- Modell rechnen ---------- */
let I = [], K = [], R = {};
function compute() {
  const seq = S.blockSequence(1000 + st.alloc, enr.length);
  enr.forEach((p, k) => { p.k = k; p.arm = seq[k]; Object.assign(p, S.outcome(p, p.arm, { unblind: st.unblind })); });
  const nd = Math.round(st.rate * enr.length);
  const key = p => st.mech ? -(p.y6 - p.p0) + 1.4 * (p.ud - 0.5) : p.ud;
  const dropSet = new Set([...enr].sort((a, b) => key(a) - key(b)).slice(0, nd));
  enr.forEach(p => p.drop = dropSet.has(p) ? (p.ut < 0.5 ? 6 : 12) : 0);
  I = enr.filter(p => p.arm === "I"); K = enr.filter(p => p.arm === "K");
  const chg = p => p.y12 - p.p0, pp = p => p.arm === "K" || p.adh >= 0.6;
  R = {
    truth: -S.EFF * mean(enr.map(p => p.adh)),
    itt: diff(I.map(chg), K.map(chg)),
    cc: diff(I.filter(p => !p.drop).map(chg), K.filter(p => !p.drop).map(chg)),
    pp: diff(I.filter(p => !p.drop && pp(p)).map(chg), K.filter(p => !p.drop).map(chg)),
    nPP: I.filter(p => !p.drop && pp(p)).length
  };
}

/* ---------- Bühne ---------- */
const NS = "http://www.w3.org/2000/svg";
const dotEl = new Map();
people.forEach(p => { const c = document.createElementNS(NS, "circle"); c.setAttribute("r", "4.6"); c.setAttribute("class", "dot"); c.setAttribute("cx", 0); c.setAttribute("cy", 0); $("dots").appendChild(c); dotEl.set(p, c); });
const ARMY = { I: 74, K: 300 }, COLX = [470, 690];
function pos(p) {
  const s = st.step;
  if (s >= 1 && p.excl) { const k = excl.indexOf(p); return [28 + (k % 16) * 11.5, 300 + Math.floor(k / 16) * 11.5]; }
  if (s >= 2 && !p.excl && !p.consent) { const k = refused.indexOf(p); return [28 + (k % 16) * 11.5, 410 + Math.floor(k / 16) * 11.5]; }
  if (s === 3) return [272 + (p.k % 9) * 13, 60 + Math.floor(p.k / 9) * 13];
  if (s >= 4 && p.arm) {
    const grp = p.arm === "I" ? I : K;
    if (s >= 7 && p.drop) { const d = grp.filter(q => q.drop), k = d.indexOf(p); return [COLX[1] + (k % 10) * 13, ARMY[p.arm] + 104 + Math.floor(k / 10) * 13]; }
    const g = s >= 7 ? grp.filter(q => !q.drop) : grp, j = g.indexOf(p);
    return [COLX[s >= 6 ? 1 : 0] + (j % 10) * 13, ARMY[p.arm] + Math.floor(j / 10) * 13];
  }
  return [28 + (p.id % 16) * 13.5, 48 + Math.floor(p.id / 16) * 13.5];
}
function style(p) {
  const s = st.step;
  if ((s >= 1 && p.excl) || (s >= 2 && !p.consent && !p.excl)) return { fill: "var(--pal-3)", op: .35, stroke: "none" };
  if (s >= 4 && p.arm) {
    if (s >= 7 && p.drop) return { fill: "var(--surface)", op: 1, stroke: "var(--muted)" };
    const col = p.arm === "I" ? "var(--beta-ink)" : "var(--therapie)";
    return { fill: col, op: s >= 5 && p.arm === "I" ? .25 + .75 * p.adh : .9, stroke: "none" };
  }
  return { fill: s === 3 ? "var(--fg)" : "var(--pal-3)", op: .85, stroke: "none" };
}
function drawBg() {
  const s = st.step, nI = I.length, nK = K.length;
  let b = `<defs><marker id="sar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted)"/></marker></defs>`;
  const zone = (x, y, w, h, lab, on) => `<rect class="zone${on ? " on" : ""}" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/><text class="zl" x="${x + 6}" y="${y - 7}">${lab}</text>`;
  b += zone(16, 34, 222, 220, `Gescreent (${NP})`, s <= 1);
  if (s >= 1) b += zone(16, 288, 222, 92, `Ausgeschlossen (${excl.length})`, s === 1);
  if (s >= 2) b += zone(16, 398, 222, 50, `Lehnen ab (${refused.length})`, s === 2);
  if (s === 3) b += zone(262, 46, 128, 200, `Baseline (${enr.length})`, true);
  if (s >= 4) {
    b += `<circle cx="410" cy="232" r="26" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="4 3"/><text x="410" y="237" text-anchor="middle" class="zl">Zufall</text>`;
    b += `<line x1="430" y1="218" x2="462" y2="120" stroke="var(--muted)" stroke-width="1.6" marker-end="url(#sar)"/><line x1="430" y1="246" x2="462" y2="330" stroke="var(--muted)" stroke-width="1.6" marker-end="url(#sar)"/>`;
    b += zone(460, ARMY.I - 18, 140, 92, `Training (${nI})`, s === 4) + zone(460, ARMY.K - 18, 140, 92, `Kontrolle (${nK})`, s === 4);
    b += `<text x="530" y="${ARMY.K + 96}" text-anchor="middle">Woche 0</text>`;
  }
  if (s >= 5) b += `<text x="530" y="${ARMY.I + 96}" text-anchor="middle">${s === 5 ? "blass = wenig trainiert" : ""}</text>`;
  if (s >= 6) {
    b += zone(680, ARMY.I - 18, 140, 92, "Woche 12", s === 6) + zone(680, ARMY.K - 18, 140, 92, "Woche 12", s === 6);
    b += `<line x1="606" y1="${ARMY.I + 28}" x2="674" y2="${ARMY.I + 28}" stroke="var(--muted)" stroke-width="1.6" marker-end="url(#sar)"/><line x1="606" y1="${ARMY.K + 28}" x2="674" y2="${ARMY.K + 28}" stroke="var(--muted)" stroke-width="1.6" marker-end="url(#sar)"/>`;
    b += `<text x="640" y="${ARMY.I + 20}" text-anchor="middle">6 Wo.</text><text x="640" y="${ARMY.K + 20}" text-anchor="middle">6 Wo.</text>`;
  }
  if (s >= 7) {
    const dI = I.filter(p => p.drop).length, dK = K.filter(p => p.drop).length;
    b += `<text x="${COLX[1] - 4}" y="${ARMY.I + 92}">Drop-out (${dI})</text><text x="${COLX[1] - 4}" y="${ARMY.K + 92}">Drop-out (${dK})</text>`;
  }
  $("bg").innerHTML = b;
}
let first = true;
function drawDots() {
  const stagger = st.step === 4 || st.step === 6;
  if (first) $("stage").classList.add("noanim");
  people.forEach(p => {
    const [x, y] = pos(p), sty = style(p), c = dotEl.get(p);
    c.style.transitionDelay = stagger && p.k !== undefined ? `${p.k * 9}ms` : "0ms";
    c.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    c.style.fill = sty.fill; c.style.fillOpacity = sty.op; c.style.stroke = sty.stroke; c.style.strokeWidth = sty.stroke === "none" ? 0 : 1.6;
  });
  if (first) { requestAnimationFrame(() => requestAnimationFrame(() => $("stage").classList.remove("noanim"))); first = false; }
}

/* ---------- Verlauf ---------- */
function drawTrend() {
  const s = st.step, W = 520, H = 320, L = 48, Rr = 16, T = 16, B = 44, sx = w => L + w / 12 * (W - L - Rr), sy = v => H - B - (v - 2) / 5 * (H - T - B);
  let g = "";
  [2, 3, 4, 5, 6, 7].forEach(v => g += `<line x1="${L}" x2="${W - Rr}" y1="${sy(v)}" y2="${sy(v)}" stroke="var(--grid)"/><text x="${L - 8}" y="${sy(v) + 4}" text-anchor="end">${v}</text>`);
  [0, 6, 12].forEach(w => g += `<text x="${sx(w)}" y="${H - B + 18}" text-anchor="middle">Woche ${w}</text>`);
  g += `<text x="14" y="${(T + H - B) / 2}" transform="rotate(-90 14 ${(T + H - B) / 2})" text-anchor="middle">Schmerz (NRS)</text>`;
  if (s < 3) g += `<text x="${W / 2}" y="${H / 2}" text-anchor="middle">noch keine Messung</text>`;
  if (s === 3) { const m = mean(enr.map(p => p.p0)); g += `<circle cx="${sx(0)}" cy="${sy(m)}" r="7" fill="var(--fg)"/><text x="${sx(0) + 14}" y="${sy(m) + 5}" class="strong">alle: ${fmt(m)}</text>`; }
  if (s >= 4) [["I", I, "var(--beta-ink)", "Training"], ["K", K, "var(--therapie)", "Kontrolle"]].forEach(([a, G, col, lab]) => {
    const obs = (w) => G.filter(p => w === 0 || !(s >= 7 && p.drop && p.drop <= w)).map(p => w === 0 ? p.p0 : w === 6 ? p.y6 : p.y12);
    const pts = (s >= 6 ? [0, 6, 12] : [0]).map(w => [w, mean(obs(w))]);
    g += `<polyline points="${pts.map(([w, v]) => `${sx(w)},${sy(v)}`).join(" ")}" fill="none" stroke="${col}" stroke-width="3"/>`;
    pts.forEach(([w, v]) => g += `<circle cx="${sx(w)}" cy="${sy(v)}" r="6" fill="${col}"/>`);
    const [lw, lv] = pts[pts.length - 1];
    g += `<text x="${sx(lw) - (lw ? 10 : -12)}" y="${sy(lv) + (a === "I" ? 22 : -12)}" text-anchor="${lw ? "end" : "start"}" class="strong halo" style="fill:${col}">${lab} ${fmt(lv)}</text>`;
  });
  $("trend").innerHTML = g;
}

/* ---------- CONSORT ---------- */
function drawConsort() {
  const s = st.step, reasons = {}; excl.forEach(p => reasons[p.excl] = (reasons[p.excl] || 0) + 1);
  const dI = I.filter(p => p.drop), dK = K.filter(p => p.drop), w6 = G => G.filter(p => p.drop === 6).length;
  const box = (on, cls, html) => `<div class="cb ${cls}${on ? "" : " off"}">${html}</div>`;
  $("consort").innerHTML =
    box(true, "", `Gescreent <b>${NP}</b>`) +
    box(s >= 1, "side", `Ausgeschlossen <b>${excl.length}</b><small>${Object.entries(reasons).map(([k, v]) => `${k}: ${v}`).join(" · ")}</small>`) +
    box(s >= 2, "side", `Teilnahme abgelehnt <b>${refused.length}</b>`) +
    box(s >= 4, "", `Randomisiert <b>${enr.length}</b><small>Blockrandomisierung, Blocklänge 4, verdeckte Zuteilung</small>`) +
    `<div class="row2">${box(s >= 4, "i", `Training <b>${I.length}</b>`)}${box(s >= 4, "k", `Kontrolle <b>${K.length}</b>`)}</div>` +
    `<div class="row2">${box(s >= 7, "i", `Drop-out <b>${dI.length}</b><small>Woche 6: ${w6(I)} · Woche 12: ${dI.length - w6(I)}</small>`)}${box(s >= 7, "k", `Drop-out <b>${dK.length}</b><small>Woche 6: ${w6(K)} · Woche 12: ${dK.length - w6(K)}</small>`)}</div>` +
    `<div class="row2">${box(s >= 8, "i", `Ausgewertet <b>${I.length - dI.length}</b><small>Per Protocol: ${R.nPP}</small>`)}${box(s >= 8, "k", `Ausgewertet <b>${K.length - dK.length}</b>`)}</div>`;
}

/* ---------- Tabelle 1 und Auswertung ---------- */
function table1() {
  const ms = (G, f, d = 1) => `${fmt(mean(G.map(f)), d)} (${fmt(sd(G.map(f)), d)})`, fem = G => `${G.filter(p => p.female).length} (${pct(G.filter(p => p.female).length / G.length)})`;
  return `<p class="text"><b>Tabelle 1</b>: Merkmale zu Studienbeginn, Mittelwert (Standardabweichung). Die letzte Zeile kennt nur die Simulation.</p><div class="tab-wrap"><table class="cells"><thead><tr><th></th><th>Training</th><th>Kontrolle</th></tr></thead><tbody>
    <tr><td>n</td><td>${I.length}</td><td>${K.length}</td></tr>
    <tr><td>Alter in Jahren</td><td>${ms(I, p => p.age)}</td><td>${ms(K, p => p.age)}</td></tr>
    <tr><td>Frauen, n (%)</td><td>${fem(I)}</td><td>${fem(K)}</td></tr>
    <tr><td>Schmerz (NRS)</td><td>${ms(I, p => p.p0)}</td><td>${ms(K, p => p.p0)}</td></tr>
    <tr class="hidden-var"><td>Motivation (verborgen, z-Wert)</td><td>${ms(I, p => p.m, 2)}</td><td>${ms(K, p => p.m, 2)}</td></tr></tbody></table></div>`;
}
function forest() {
  const rows = [["ITT: alle Randomisierten", R.itt, "mit den Werten der Drop-outs"], ["Nur vollständige Fälle", R.cc, "ohne Drop-outs"], ["Per Protocol", R.pp, "nur wer ≥ 60 % trainiert hat"]];
  const W = 900, H = 230, L = 300, Rr = 30, x = v => L + (v + 3) / 4 * (W - L - Rr);
  let s = "";
  [-3, -2, -1, 0, 1].forEach(v => s += `<line x1="${x(v)}" x2="${x(v)}" y1="20" y2="${H - 40}" stroke="var(--grid)"/><text x="${x(v)}" y="${H - 22}" text-anchor="middle">${fmt(v, 0)}</text>`);
  s += `<line x1="${x(0)}" x2="${x(0)}" y1="20" y2="${H - 40}" stroke="var(--fg)" stroke-width="1.4"/><line x1="${x(R.truth)}" x2="${x(R.truth)}" y1="14" y2="${H - 40}" stroke="var(--accent)" stroke-width="2" stroke-dasharray="6 4"/><text x="${x(R.truth)}" y="12" text-anchor="middle" style="fill:var(--accent)">wahrer Effekt ${fmt(R.truth, 2)}</text>`;
  rows.forEach(([lab, d, sub], i) => { const y = 50 + i * 52; s += `<text x="${L - 12}" y="${y}" text-anchor="end" class="strong">${lab}</text><text x="${L - 12}" y="${y + 16}" text-anchor="end">${sub}</text><line x1="${x(d.lo)}" x2="${x(d.hi)}" y1="${y}" y2="${y}" stroke="var(--beta-ink)" stroke-width="3"/><circle cx="${x(d.d)}" cy="${y}" r="7" fill="var(--beta-ink)"/><text x="${x(d.hi) + 10}" y="${y + 5}" class="strong halo">${fmt(d.d, 2)} [${fmt(d.lo, 2)}; ${fmt(d.hi, 2)}]</text>`; });
  s += `<text x="${W - Rr}" y="${H - 4}" text-anchor="end">Unterschied der Schmerzänderung (Training − Kontrolle), NRS-Punkte</text>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Effektschätzer je Auswertung">${s}</svg>`;
}

/* ---------- Schritte ---------- */
const PE = n => `<span class="pedro">PEDro ${n}</span>`;
const STEPS = [
  { t: "Die Frage", pedro: [], x: () => `Zuerst steht die Frage, nach dem PICO-Schema: <b>P</b>opulation: Menschen ab 45 mit Kniearthrose und Schmerz von mindestens 4 auf der NRS. <b>I</b>ntervention: 12 Wochen angeleitetes Krafttraining, zweimal pro Woche. <b>C</b>omparison: eine Informationsbroschüre. <b>O</b>utcome: Schmerz nach 12 Wochen. Vor dem ersten Patienten wird die Studie registriert und das Protokoll festgelegt, auch welcher Endpunkt der primäre ist. ${NP} Menschen melden sich auf Aufrufe in Praxen.` },
  { t: "Screening", pedro: [1], x: () => `Wer erfüllt die Einschlusskriterien? ${excl.length} von ${NP} nicht. Die Kriterien machen die Studie sauber, aber auch enger: Die Ergebnisse gelten zunächst nur für Menschen wie die Eingeschlossenen.` },
  { t: "Einwilligung", pedro: [], x: () => `${refused.length} Geeignete lehnen die Teilnahme ab. In der Simulation sind es eher die wenig Motivierten. Schon hier unterscheiden sich Studienteilnehmende von der Praxis.` },
  { t: "Baseline-Messung", pedro: [], x: () => `Die ${enr.length} Teilnehmenden werden gemessen, <b>bevor</b> sie zugeteilt werden. Sonst könnte das Wissen um die Gruppe die Messung beeinflussen. Mittlerer Schmerz: ${fmt(mean(enr.map(p => p.p0)))}.` },
  { t: "Randomisierung", pedro: [2, 3, 4], ctrl: () => `<div class="actions"><button type="button" class="btn ghost" id="realloc">Neu randomisieren</button><span class="muted" style="font-family:var(--font-mono);font-size:13px">Liste: ${S.blockSequence(1000 + st.alloc, 16).join("").replace(/(.{4})/g, "$1 ")}…</span></div>`, x: () => `Der Zufall teilt zu, in Blöcken zu vier: In jedem Block landen zwei im Training und zwei in der Kontrolle, so bleiben die Gruppen gleich groß. Die Liste erstellt jemand, der keine Teilnehmenden rekrutiert, und sie bleibt verdeckt, etwa in versiegelten Umschlägen oder einem zentralen System. Sonst könnte jemand die nächste Zuteilung erahnen und steuern, wer ins Training kommt. Tabelle 1 zeigt: Die Gruppen sind sich ähnlich, auch in der Motivation, die niemand gemessen hat. Klicken Sie „Neu randomisieren“: Kleine Unterschiede entstehen jedes Mal zufällig.`, extra: table1 },
  { t: "Intervention und Verblindung", pedro: [5, 6, 7], ctrl: () => `<div class="roles"><span class="n"><b>✗</b>Teilnehmende verblindet</span><span class="n"><b>✗</b>Therapeutinnen verblindet</span><span class="${st.unblind ? "n" : "y"}"><b>${st.unblind ? "✗" : "✓"}</b>Untersuchende verblindet</span></div><label class="chk"><input type="checkbox" id="unblind" ${st.unblind ? "checked" : ""}> Untersuchende kennen die Gruppe</label>`, x: () => `Wer trainiert, weiß es, und wer anleitet, auch. Verblindet werden kann bei Bewegungstherapie meist nur, wer misst. Die Trainingspunkte sind umso blasser, je weniger jemand tatsächlich trainiert hat (Adhärenz im Mittel ${pct(mean(I.map(p => p.adh)))}). ${st.unblind ? "<b>Jetzt kennen die Untersuchenden die Gruppe</b> und schätzen in der Trainingsgruppe unbewusst günstiger ein. Der Effekt wird größer, als er ist. Schauen Sie sich in Schritt 9 die Auswertung an." : "Probieren Sie aus, was passiert, wenn die Untersuchenden die Gruppe kennen."}` },
  { t: "Messzeitpunkte", pedro: [], x: () => `Gemessen wird nach 6 und nach 12 Wochen, mit denselben Instrumenten wie zu Beginn. Beide Gruppen werden besser: auch die Kontrolle, durch den natürlichen Verlauf und die <a href="../../hintergrund/regression-mitte/">Regression zur Mitte</a>, weil nur Menschen mit hohem Schmerz eingeschlossen wurden. Der Effekt des Trainings ist nur der <b>Unterschied</b> zwischen den Gruppen.` },
  { t: "Drop-out", pedro: [8], ctrl: () => `<div class="ctrl"><div class="ctrl-head"><label for="rate">Anteil Drop-out</label><output>${pct(st.rate)}</output></div><input id="rate" type="range" min="0" max="0.4" step="0.05" value="${st.rate}"></div><div class="seg two" role="group" aria-label="Wer bricht ab" id="mech"><button type="button" data-k="0" aria-pressed="${!st.mech}">zufällig</button><button type="button" data-k="1" aria-pressed="${!!st.mech}">wer nicht profitiert, bricht ab</button></div>`, x: () => { const f = 1 - enr.filter(p => p.drop).length / enr.length; return `Nicht alle kommen zur letzten Messung. Bei ${pct(st.rate)} Drop-out liegen für ${pct(f)} der Randomisierten Daten vor${f >= 0.85 ? ", PEDro-Kriterium 8 ist erfüllt" : ", <b>unter 85 %</b>: PEDro-Kriterium 8 ist nicht erfüllt"}. Entscheidend ist, <b>wer</b> abbricht. ${st.mech ? "Brechen vor allem die ab, denen es nicht besser geht, sehen die Übrigen gesünder aus, als die Gruppe war." : "Zufälliger Drop-out kostet nur Genauigkeit."}`; } },
  { t: "Auswertung", pedro: [9, 10, 11], ctrl: () => STEPS[7].ctrl(), x: () => `Verglichen wird die Schmerzänderung zwischen den Gruppen, mit 95-%-Konfidenzintervall. <b>Intention to treat</b> heißt: Jede Person zählt in der Gruppe, der sie zugelost wurde, ob sie trainiert hat oder nicht. Nur so bleibt der Vorteil der Randomisierung erhalten. <b>Per Protocol</b> wertet nur aus, wer nach Plan trainiert hat. Das sind die Motivierten, denen es ohnehin besser geht, und der Effekt wird überschätzt: hier ${fmt(R.pp.d, 2)} statt ${fmt(R.itt.d, 2)}. In echten Studien fehlen die Werte der Drop-outs; man ersetzt sie mit Verfahren wie der multiplen Imputation oder nutzt <a href="../../regression/multiple-regression/#acc-3">gemischte Modelle</a>.`, extra: forest }
];
function render() {
  compute();
  const s = st.step, d = STEPS[s];
  $("s-title").textContent = `Schritt ${s + 1} von ${STEPS.length}: ${d.t}`;
  $("s-text").innerHTML = d.x();
  $("s-pedro").innerHTML = d.pedro.map(PE).join("");
  $("s-ctrl").innerHTML = d.ctrl ? d.ctrl() : "";
  $("s-extra").innerHTML = d.extra ? d.extra() : "";
  $("s-dots").querySelectorAll("button").forEach((b, i) => { b.setAttribute("aria-pressed", i === s); b.classList.toggle("done", i < s); });
  $("s-prev").disabled = s === 0; $("s-next").disabled = s === STEPS.length - 1;
  // schmale Bildschirme: nur den gerade wichtigen Ausschnitt der Bühne zeigen
  $("stage").setAttribute("viewBox", innerWidth < 640 ? (s <= 3 ? "4 20 400 450" : "380 40 500 440") : "0 0 900 480");
  drawBg(); drawDots(); drawTrend(); drawConsort();
}
$("s-dots").innerHTML = STEPS.map((d, i) => `<button type="button" data-s="${i}" title="${d.t}" aria-label="Schritt ${i + 1}: ${d.t}">${i + 1}</button>`).join("");
const go = s => { st.step = Math.max(0, Math.min(STEPS.length - 1, s)); render(); };
$("s-dots").addEventListener("click", e => { const b = e.target.closest("button"); if (b) go(+b.dataset.s); });
$("s-prev").addEventListener("click", () => go(st.step - 1));
$("s-next").addEventListener("click", () => go(st.step + 1));
$("s-ctrl").addEventListener("click", e => {
  if (e.target.id === "realloc") { st.alloc++; render(); }
  const b = e.target.closest("#mech button"); if (b) { st.mech = +b.dataset.k; render(); }
});
$("s-ctrl").addEventListener("change", e => { if (e.target.id === "unblind") { st.unblind = e.target.checked; render(); } });
$("s-ctrl").addEventListener("input", e => { if (e.target.id === "rate") { st.rate = +e.target.value; render(); } });

/* ---------- 2 Streptomycin 1948 ---------- */
(() => {
  const D = window.STREP.rows, A = D.filter(r => r[0] === 1), C = D.filter(r => r[0] === 0);
  const n = (G, f) => G.filter(f).length, np = (G, f) => `${n(G, f)} (${pct(n(G, f) / G.length)})`;
  $("st-tab").innerHTML = `<thead><tr><th></th><th>Streptomycin</th><th>nur Bettruhe</th></tr></thead><tbody>
    <tr><td>n</td><td>${A.length}</td><td>${C.length}</td></tr>
    <tr><td>Frauen</td><td>${np(A, r => r[1] === "F")}</td><td>${np(C, r => r[1] === "F")}</td></tr>
    <tr><td>Zustand zu Beginn schlecht</td><td>${np(A, r => r[2] === "3_Poor")}</td><td>${np(C, r => r[2] === "3_Poor")}</td></tr>
    <tr><td>Kavernen im Röntgen</td><td>${np(A, r => r[3] === "yes")}</td><td>${np(C, r => r[3] === "yes")}</td></tr>
    <tr class="sum"><td>gestorben nach 6 Monaten</td><td>${np(A, r => r[4] === 1)}</td><td>${np(C, r => r[4] === 1)}</td></tr>
    <tr class="sum"><td>deutlich gebessert</td><td>${np(A, r => r[4] === 6)}</td><td>${np(C, r => r[4] === 6)}</td></tr></tbody>`;
  const LAB = ["gestorben", "deutlich schlechter", "etwas schlechter", "unverändert", "etwas besser", "deutlich besser"];
  const W = 520, H = 330, L = 150, Rr = 50, x = v => L + v / 0.6 * (W - L - Rr);
  let s = "";
  [0, 0.2, 0.4, 0.6].forEach(v => s += `<line x1="${x(v)}" x2="${x(v)}" y1="8" y2="${H - 34}" stroke="var(--grid)"/><text x="${x(v)}" y="${H - 16}" text-anchor="middle">${fmt(v * 100, 0)} %</text>`);
  LAB.forEach((l, k) => {
    const y = 14 + k * 48, a = n(A, r => r[4] === k + 1) / A.length, c = n(C, r => r[4] === k + 1) / C.length;
    s += `<text x="${L - 10}" y="${y + 20}" text-anchor="end" class="strong">${l}</text>`;
    s += `<rect x="${L}" y="${y}" width="${x(a) - L}" height="17" fill="var(--beta-ink)"/><text x="${x(a) + 6}" y="${y + 13}">${pct(a)}</text>`;
    s += `<rect x="${L}" y="${y + 19}" width="${x(c) - L}" height="17" fill="var(--therapie)"/><text x="${x(c) + 6}" y="${y + 32}">${pct(c)}</text>`;
  });
  s += `<text x="${W - Rr}" y="${H - 2}" text-anchor="end">Röntgenbefund nach 6 Monaten</text>`;
  $("st-ch").innerHTML = s;
  const dA = n(A, r => r[4] === 1) / A.length, dC = n(C, r => r[4] === 1) / C.length;
  $("st-c").innerHTML = `Zu Beginn sind die Gruppen ähnlich, so wie es die Randomisierung verspricht. Nach sechs Monaten waren ${n(A, r => r[4] === 1)} von ${A.length} Streptomycin-Patienten gestorben (${pct(dA)}) gegen ${n(C, r => r[4] === 1)} von ${C.length} unter Bettruhe (${pct(dC)}): relatives Risiko ${fmt(dA / dC, 2)}. Eine deutliche Besserung zeigten ${pct(n(A, r => r[4] === 6) / A.length)} gegen ${pct(n(C, r => r[4] === 6) / C.length)}.`;
})();

/* ---------- 3 PEDro-Skala ---------- */
(() => {
  const P = [[1, "Ein- und Ausschlusskriterien wurden festgelegt (zählt nicht zur Punktzahl)", 1], [2, "Zuteilung per Zufall", 4], [3, "Zuteilung verdeckt", 4], [4, "Gruppen zu Beginn in den wichtigsten Merkmalen ähnlich", 4], [5, "Teilnehmende verblindet", 5], [6, "Therapeutinnen und Therapeuten verblindet", 5], [7, "Untersuchende verblindet, mindestens für ein Hauptoutcome", 5], [8, "Für mindestens ein Hauptoutcome Daten von über 85 % der Zugeteilten", 7], [9, "Auswertung nach Intention to treat, oder alle erhielten die zugeteilte Behandlung", 8], [10, "Statistischer Vergleich zwischen den Gruppen, mindestens für ein Hauptoutcome", 8], [11, "Punktschätzer und Streuungsmaß angegeben", 8]];
  $("pedro-tab").innerHTML = `<thead><tr><th>Nr.</th><th>Kriterium</th><th>Schritt in der Animation</th></tr></thead><tbody>${P.map(([k, t, s]) => `<tr><td>${k}</td><td>${t}</td><td><button type="button" class="btn ghost" data-s="${s}">Schritt ${s + 1}: ${STEPS[s].t}</button></td></tr>`).join("")}</tbody>`;
  $("pedro-tab").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; go(+b.dataset.s); $("acc-1").open = true; $("acc-1").scrollIntoView({ behavior: "smooth" }); });
})();

render();
addEventListener("resize", () => $("stage").setAttribute("viewBox", innerWidth < 640 ? (st.step <= 3 ? "4 20 400 450" : "380 40 500 440") : "0 0 900 480"));
})();
