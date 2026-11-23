/* Die Fall-Kontroll-Studie · Stats Lab
   Station „Die Fall-Kontroll-Studie“: simulierte Population mit Fällen und Kontrollen, Doll und Hill 1950, Erinnerungsverzerrung. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const fmt = (x, d = 2) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");
const pct = (x, d = 0) => fmt(x * 100, d) + " %";
const readout = (l, v, cls = "") => `<div class="readout ${cls}"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;
const pick = (e, el) => { const b = e.target.closest("button"); if (!b) return null; el.querySelectorAll("button").forEach(z => z.setAttribute("aria-pressed", z === b)); return b; };
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const or2 = (a, b, c, d) => (a * d) / (b * c);
const tab2 = (rows, head) => `<thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr class="${r.cls || ""}">${r.c.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>`;

/* ---------- 1 Simulation ---------- */
const N = 1000, COLS = 50, P0S = [0.005, 0.01, 0.02, 0.05, 0.1, 0.2], RR = 3, PE = 0.3;
let seed = 3, step = 0, pop = [];
function build() {
  const r = mulberry32(seed * 7919 + +$("fp").value), p0 = P0S[+$("fp").value];
  pop = Array.from({ length: N }, () => { const e = r() < PE; return { e, d: r() < (e ? p0 * RR : p0), u: r() }; });
}
function draw1() {
  const p0 = P0S[+$("fp").value], k = +$("fk").value;
  $("fp-v").textContent = pct(p0, p0 < 0.01 ? 1 : 0) + `, bei Exponierten ${pct(p0 * RR, p0 * RR < 0.1 ? 1 : 0)}`; $("fk-v").textContent = `${k} : 1`;
  const cases = pop.filter(p => p.d), nonc = pop.map((p, i) => i).filter(i => !pop[i].d).sort((a, b) => pop[a].u - pop[b].u);
  const ctrl = new Set(nonc.slice(0, Math.min(nonc.length, cases.length * k)));
  const W = 900, gap = 17, x0 = 30, y0 = 18;
  let s = "";
  pop.forEach((p, i) => {
    const cx = x0 + (i % COLS) * gap, cy = y0 + Math.floor(i / COLS) * gap, isC = ctrl.has(i);
    const on = step === 0 || p.d || (step >= 2 && isC);
    const fill = p.d ? "var(--beta-ink)" : (step >= 2 && isC ? "var(--fg)" : "var(--pal-3)");
    const ring = p.e && (step === 0 || (step === 3 && on));
    s += `<circle cx="${cx}" cy="${cy}" r="${on && step ? 6 : 5}" fill="${fill}" fill-opacity="${on ? 1 : .15}" ${ring ? `stroke="var(--accent)" stroke-width="2.4"` : ""}/>`;
  });
  $("f-ch").innerHTML = s;
  // Wahrheit in der Population
  const A = pop.filter(p => p.e && p.d).length, B = pop.filter(p => p.e && !p.d).length, C = pop.filter(p => !p.e && p.d).length, D = pop.filter(p => !p.e && !p.d).length;
  const rrT = (A / (A + B)) / (C / (C + D)), orT = or2(A, B, C, D);
  // Stichprobe
  const ca = cases.filter(p => p.e).length, cb = cases.length - ca, cl = [...ctrl].map(i => pop[i]), ka = cl.filter(p => p.e).length, kb = cl.length - ka;
  const orS = or2(ca, ka, cb, kb), riskE = ca / (ca + ka);
  if (step < 3) {
    $("f-tab").innerHTML = tab2([{ c: ["exponiert", A, B, A + B] }, { c: ["nicht exponiert", C, D, C + D] }, { cls: "sum", c: ["gesamt", A + C, B + D, N] }], ["Population", "erkrankt", "gesund", "gesamt"]);
    $("f-r").innerHTML = readout("wahres relatives Risiko", fmt(rrT)) + readout("wahres Odds Ratio", fmt(orT)) + readout("Fälle in der Population", `${cases.length}`);
  } else {
    $("f-tab").innerHTML = tab2([{ c: ["exponiert", ca, ka] }, { c: ["nicht exponiert", cb, kb] }, { cls: "sum", c: ["gesamt", cases.length, cl.length] }], ["Studie", "Fälle", "Kontrollen"]);
    $("f-r").innerHTML = readout("Odds Ratio der Studie", isFinite(orS) ? fmt(orS) : "–", "hl") + readout("wahres Odds Ratio", fmt(orT)) + readout("wahres relatives Risiko", fmt(rrT)) + readout("scheinbares „Risiko“ bei Exponierten", pct(riskE));
  }
  $("f-c").innerHTML = [
    `Die ganze Population mit der Wahrheit: ${cases.length} Erkrankte unter ${N} Menschen. Eine Kohorte müsste alle ${N} begleiten, um diese wenigen Fälle zu sehen. Das relative Risiko liegt bei ${fmt(rrT)}${p0 <= 0.02 ? ", das Odds Ratio fast gleich" : `, das Odds Ratio schon bei ${fmt(orT)}`}.`,
    `Schritt 2: Die Studie beginnt bei den ${cases.length} Erkrankten, etwa aus Praxen oder Kliniken. Alle anderen sind zunächst unsichtbar.`,
    `Schritt 3: Zu jedem Fall werden ${k === 1 ? "eine Kontrolle" : k + " Kontrollen"} aus der Population der Gesunden gezogen, hier per Zufall. In echten Studien werden Kontrollen oft nach Alter und Geschlecht passend ausgewählt (Matching).`,
    `Schritt 4: Erst jetzt wird gefragt, wer exponiert war. Das Odds Ratio der Studie, <b>${isFinite(orS) ? fmt(orS) : "nicht berechenbar"}</b>, schätzt das wahre Odds Ratio der Population (${fmt(orT)}). Ein Risiko lässt sich nicht berechnen: Das scheinbare „Risiko“ bei Exponierten (${pct(riskE)}) hängt nur davon ab, wie viele Kontrollen Sie ziehen. Stellen Sie 1 : 1 und 4 : 1 ein: Das „Risiko“ springt, das Odds Ratio bleibt im Rahmen des Zufalls stabil. ${p0 <= 0.02 ? "Weil die Erkrankung selten ist, liegt das Odds Ratio nah am relativen Risiko." : "Bei dieser häufigen Erkrankung überschätzt das Odds Ratio das relative Risiko deutlich, siehe <a href=\"../../grundlagen/risiko-odds/#acc-3\">Wann OR und RR auseinanderlaufen</a>."}`
  ][step];
}
$("f-sw").addEventListener("click", e => { const b = pick(e, $("f-sw")); if (!b) return; step = +b.dataset.k; draw1(); });
$("fp").addEventListener("input", () => { build(); draw1(); });
$("fk").addEventListener("input", draw1);
$("f-new").addEventListener("click", () => { seed++; build(); draw1(); });

/* ---------- 2 Doll und Hill 1950, Tabelle IV ---------- */
const DH = [{ n: 649, cs: 647, cn: 2, ks: 622, kn: 27 }, { n: 60, cs: 41, cn: 19, ks: 28, kn: 32 }];
let hk = 0;
function draw2() {
  const d = DH[hk], o = or2(d.cs, d.ks, d.cn, d.kn);
  $("h-tab").innerHTML = tab2([{ c: ["Raucher", d.cs, d.ks] }, { c: ["Nichtraucher", d.cn, d.kn] }, { cls: "sum", c: ["gesamt", d.n, d.n] }], [hk ? "Frauen" : "Männer", "Lungenkrebs", "Kontrollen"]);
  const W = 520, L = 120, R = 70, sx = v => L + v * (W - L - R) / (hk ? 0.6 : 0.06);
  let s = "";
  [["Lungenkrebs", d.cn / d.n, "var(--beta-ink)"], ["Kontrollen", d.kn / d.n, "var(--kontrolle)"]].forEach(([l, v, col], i) => {
    const y = 60 + i * 80;
    s += `<text x="${L - 10}" y="${y + 22}" text-anchor="end" class="lbl-b">${l}</text><rect x="${L}" y="${y}" width="${sx(v) - L}" height="34" rx="4" fill="${col}"/><text x="${sx(v) + 8}" y="${y + 22}" class="lbl-b">${pct(v, 1)}</text>`;
  });
  s += `<line x1="${L}" x2="${L}" y1="40" y2="200" stroke="var(--fg)" stroke-width="1.4"/><text x="${L}" y="230" class="lbl-s">Anteil Nichtraucher</text>`;
  $("h-ch").innerHTML = s;
  $("h-c").innerHTML = hk === 0
    ? `Unter 649 Männern mit Lungenkrebs waren nur <b>2</b> Nichtraucher, unter den 649 Kontrollen 27. Odds Ratio: (647 · 27) ÷ (2 · 622) = <b>${fmt(o, 1)}</b>. Die Odds, Raucher zu sein, waren bei Lungenkrebs also rund 14-mal so hoch wie bei den Kontrollen. Weil Lungenkrebs selten ist, ist das Odds Ratio hier eine gute Näherung für das relative Risiko.`
    : `Bei den Frauen ist der Unterschied kleiner, aber vorhanden: Odds Ratio (41 · 32) ÷ (19 · 28) = <b>${fmt(o, 2)}</b>. Mit nur 60 Paaren ist die Schätzung unsicher. Damals rauchten deutlich weniger Frauen, und wer rauchte, meist weniger.`;
}
$("h-sw").addEventListener("click", e => { const b = pick(e, $("h-sw")); if (!b) return; hk = +b.dataset.k; draw2(); });

/* ---------- 3 Erinnerungsverzerrung ---------- */
function draw3() {
  const f = +$("rb").value / 100; $("rb-v").textContent = `${fmt(f * 100, 0)} %`;
  const ca = 40, cb = 60, ka0 = 25, kb0 = 75, ka = ka0 * (1 - f), kb = kb0 + ka0 * f, o = or2(ca, ka, cb, kb);
  $("rb-tab").innerHTML = tab2([{ c: ["angegeben: exponiert", ca, fmt(ka, 0)] }, { c: ["angegeben: nicht exponiert", cb, fmt(kb, 0)] }, { cls: "sum", c: ["gesamt", 100, 100] }], ["", "Fälle", "Kontrollen"]);
  $("rb-r").innerHTML = readout("wahres Odds Ratio", "2,00") + readout("beobachtetes Odds Ratio", fmt(o), f > 0 ? "hl" : "") + readout("Überschätzung", f > 0 ? "+" + fmt((o / 2 - 1) * 100, 0) + " %" : "keine");
}
$("rb").addEventListener("input", draw3);

build(); draw1(); draw2(); draw3();
})();
