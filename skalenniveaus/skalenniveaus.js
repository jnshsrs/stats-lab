/* Skalenniveaus · Stats Lab
   Reiter 1: vier Stufen mit animierten Marken (Form = Kategorie, Farbe ab Ordinal = Rang).
   Reiter 2: Kniewinkel nach Neutral-Null-Methode mit verschiebbarer Nulllinie.
   Reiter 3: Hop-Tests (LSI mit verschiebbarer Null, Timed Hop mit Falle „schneller“). */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";
const dec = (x, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const tz = x => String(x).replace(/\./g, "{.}").replace(/,/g, "{,}").replace(/−/g, "-").replace(/ %/g, "\\,\\%").replace(/≤/g, "\\le ").replace(/≥/g, "\\ge ");
const TB = (t, fb) => window.katex ? texBlock(t) : fb;
const pct = (x, d = 1) => dec(x * 100, d) + " %";
const deg = x => (x < 0 ? "−" : "") + Math.abs(Math.round(x)) + "°";
const readout = (l, v) => `<div class="readout"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;

/* ================= Reiter ================= */
const TABS = ["grundlagen", "knie", "hop"];
let tab = "grundlagen";
function showTab(name, scroll) {
  tab = TABS.includes(name) ? name : "grundlagen";
  TABS.forEach(t => { $("tab-" + t).setAttribute("aria-selected", t === tab); $("tab-" + t).tabIndex = t === tab ? 0 : -1; $("panel-" + t).hidden = t !== tab; });
  if (location.hash !== "#" + tab) history.replaceState(null, "", "#" + tab);
  if (scroll) document.querySelector(".tabs").scrollIntoView({ behavior: "smooth", block: "start" });
}
TABS.forEach(t => $("tab-" + t).addEventListener("click", () => showTab(t)));
document.querySelector(".tabs").addEventListener("keydown", e => {
  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
  const i = TABS.indexOf(tab) + (e.key === "ArrowRight" ? 1 : -1);
  if (i >= 0 && i < TABS.length) { showTab(TABS[i]); $("tab-" + TABS[i]).focus(); }
});
window.addEventListener("hashchange", () => showTab(location.hash.slice(1)));

/* ================= 1 Grundlagen ================= */
const LEVELS = [
  { name: "Nominal", lead: "Ich bilde Gruppen.", text: "Jede Beobachtung bekommt eine Kategorie. Mehr Information gibt es nicht: Die Gruppen haben keine Reihenfolge. Mischen Sie die Anordnung, es ändert sich nichts.", neu: "Gleich oder verschieden", ok: "Zählen und Anteile, Modus" },
  { name: "Ordinal", lead: "Ich bringe die Gruppen in eine Reihenfolge.", text: "Jetzt gibt es ein Mehr und ein Weniger. Wie groß die Abstände zwischen den Stufen sind, ist aber unbekannt. Ändern Sie die Abstände: Die Rangfolge bleibt dieselbe, und nur sie zählt.", neu: "Größer oder kleiner", ok: "zusätzlich Median und Quartile" },
  { name: "Intervall", lead: "Die Abstände sind jetzt gleich.", text: "Eine Einheit ist überall gleich groß, Differenzen sind deshalb sinnvoll. Die Null ist aber nur vereinbart. Verschieben Sie die Null: Die Differenz bleibt, das Verhältnis springt.", neu: "Differenzen (+, −)", ok: "zusätzlich Mittelwert und Standardabweichung" },
  { name: "Verhältnis", lead: "Es gibt eine echte Null: „nichts davon“.", text: "Wo nichts ist, beginnt die Skala. Jetzt ist „doppelt so viel“ sinnvoll. Wechseln Sie die Einheit: Die Zahlen ändern sich, das Verhältnis bleibt.", neu: "Verhältnisse (×, ÷, Prozent)", ok: "zusätzlich Variationskoeffizient und geometrisches Mittel" }
];
const OPS = [
  { k: "Gleich oder ungleich", s: "=, ≠", from: 0 },
  { k: "Ordnen", s: "<, >", from: 1 },
  { k: "Differenzen bilden", s: "+, −", from: 2 },
  { k: "Verhältnisse bilden", s: "×, ÷, %", from: 3 }
];
const STATS = [
  { k: "Lagemaß", v: ["Modus", "Median", "Mittelwert", "geometrisches Mittel"] },
  { k: "Streuung", v: ["–", "Quartilsabstand", "Standardabweichung", "Variationskoeffizient"] },
  { k: "Beispiele", v: ["Blutgruppe, Diagnose", "Schmerz: kein, leicht, stark", "Temperatur in °C, Kalenderjahr", "Körpergröße, Zeit, Gewicht"] }
];
const SHAPES = ["Kreise", "Quadrate", "Dreiecke"];
const ORD = ["niedrig", "mittel", "hoch"];
const FILL_NOM = "var(--pal-4)", FILL_ORD = ["var(--pal-3)", "var(--pal-5)", "var(--pal-6)"];
const G = { level: 0, perm: [0, 1, 2], ordX: [200, 380, 720], shift: 0, unit: "cm", visited: new Set([0]) };
const SLOTS = [[170, 140], [450, 200], [730, 130]];
const scene = $("scene");
// 15 Marken, 5 je Kategorie, mit fester Streuung im Cluster
const tokens = [];
for (let i = 0; i < 15; i++) {
  const cat = Math.floor(i / 5), j = i % 5, a = j * 2.4 + cat, r = j === 0 ? 0 : 42;
  tokens.push({ cat, j, dx: Math.cos(a) * r, dy: Math.sin(a) * r * 0.8 });
}
const tokLayer = document.createElementNS(NS, "g"), statLayer = document.createElementNS(NS, "g");
scene.append(statLayer, tokLayer);
tokens.forEach(t => {
  const g = document.createElementNS(NS, "g"); g.setAttribute("class", "tok");
  const s = t.cat === 0 ? `<circle r="12"/>` : t.cat === 1 ? `<rect x="-11" y="-11" width="22" height="22" rx="2"/>` : `<path d="M0 -14 L13 9 L-13 9 Z"/>`;
  g.innerHTML = s; g.style.transform = "translate(450px,160px)"; t.el = g; tokLayer.append(g);
});
function placeTokens() {
  const L = G.level;
  tokens.forEach(t => {
    let x, y, op = 1, fill = L === 0 ? FILL_NOM : FILL_ORD[t.cat];
    if (L === 0) { const c = SLOTS[G.perm[t.cat]]; x = c[0] + t.dx; y = c[1] + t.dy; }
    else if (L === 1) { x = G.ordX[t.cat]; y = 236 - t.j * 32; }
    else { x = 120 + (t.cat * 5 + t.j) * 47; y = 214; op = 0; }
    t.el.style.transform = `translate(${x}px,${y}px)`; t.el.style.opacity = op; t.el.style.fill = fill;
  });
}
function drawStatic() {
  const L = G.level; let s = "";
  if (L === 0) {
    [0, 1, 2].forEach(c => { const p = SLOTS[G.perm[c]]; s += `<ellipse class="fade" cx="${p[0]}" cy="${p[1]}" rx="78" ry="66" fill="none" stroke="var(--accent-soft)" stroke-dasharray="5 5" stroke-width="2"/><text class="lbl-strong" x="${p[0]}" y="${p[1] + 96}" text-anchor="middle">${SHAPES[c]}</text>`; });
    s += `<text x="450" y="28" text-anchor="middle">drei Gruppen, keine Reihenfolge</text>`;
  } else if (L === 1) {
    s += `<line x1="90" x2="830" y1="262" y2="262" stroke="var(--fg)" stroke-width="2"/><path d="M830 262 l-12 -6 v12 z" fill="var(--fg)"/><text x="836" y="267">mehr</text>`;
    [0, 1, 2].forEach(c => { const x = G.ordX[c]; s += `<line x1="${x}" x2="${x}" y1="255" y2="269" stroke="var(--fg)" stroke-width="2"/><text class="lbl-strong" x="${x}" y="292" text-anchor="middle">${ORD[c]}</text><text x="${x}" y="312" text-anchor="middle">Rang ${c + 1}</text>`; });
    const d1 = G.ordX[1] - G.ordX[0], d2 = G.ordX[2] - G.ordX[1];
    s += `<path d="M${G.ordX[0]} 60 v-10 h${d1} v10" fill="none" stroke="var(--accent-soft)" stroke-width="2"/><text x="${G.ordX[0] + d1 / 2}" y="40" text-anchor="middle">Abstand ?</text>`;
    s += `<path d="M${G.ordX[1]} 60 v-10 h${d2} v10" fill="none" stroke="var(--accent-soft)" stroke-width="2"/><text x="${G.ordX[1] + d2 / 2}" y="40" text-anchor="middle">Abstand ?</text>`;
  } else {
    // Lineal: Positionen 0..100 auf x 90..840; Marken A bei 30, B bei 60
    const x = v => 90 + v * 7.5, y0 = 214, A = 30, B = 60;
    const zeroPos = L === 2 ? 0 + G.shift : 0;  // Position der Null auf dem Lineal
    const f = L === 3 ? { cm: 1, mm: 10, Zoll: 1 / 2.54 }[G.unit] : 1;
    const val = v => (v - zeroPos) * f;
    s += `<line x1="${x(-5)}" x2="${x(105)}" y1="${y0}" y2="${y0}" stroke="var(--fg)" stroke-width="2"/>`;
    for (let v = -5; v <= 105; v += 5) { if (((v - zeroPos) % 10 + 10) % 10) continue; s += `<line x1="${x(v)}" x2="${x(v)}" y1="${y0 - 6}" y2="${y0 + 6}" stroke="var(--fg)"/>`; }
    if (L === 2) {
      for (let v = -5; v <= 105; v += 5) { const val0 = v - zeroPos; if (val0 % 20) continue; s += `<text x="${x(v)}" y="${y0 + 26}" text-anchor="middle">${dec(val0, 0).replace("-", "−")}</text>`; }
      if (zeroPos >= -5 && zeroPos <= 105) s += `<line x1="${x(zeroPos)}" x2="${x(zeroPos)}" y1="${y0 - 40}" y2="${y0 + 36}" stroke="var(--accent)" stroke-width="2.5" stroke-dasharray="6 4"/><text x="${x(zeroPos)}" y="${y0 - 48}" text-anchor="middle" style="fill:var(--accent)">Null (vereinbart)</text>`;
    } else {
      for (let v = 20; v <= 100; v += 20) s += `<text x="${x(v)}" y="${y0 + 26}" text-anchor="middle">${dec(v * f, G.unit === "Zoll" ? 1 : 0)}</text>`;
      s += `<rect x="${x(0) - 4}" y="${y0 - 140}" width="8" height="146" fill="var(--fg)"/><text x="${x(0)}" y="${y0 + 50}" text-anchor="middle" style="fill:var(--fg)">0 = nichts</text>`;
      s += `<rect x="${x(0)}" y="88" width="${x(A) - x(0)}" height="26" rx="3" fill="var(--pal-3)"/><rect x="${x(0)}" y="134" width="${x(B) - x(0)}" height="26" rx="3" fill="var(--pal-6)"/>`;
    }
    [[A, "A", 74], [B, "B", 74]].forEach(([p, n]) => { const yy = L === 3 ? (n === "A" ? 101 : 147) : y0; s += `<circle cx="${x(p)}" cy="${yy}" r="10" fill="${n === "A" ? "var(--pal-3)" : "var(--pal-6)"}" stroke="var(--surface)" stroke-width="2"/><text class="lbl-strong" x="${x(p)}" y="${yy - 18}" text-anchor="middle">${n} = ${dec(val(p), L === 3 && G.unit === "Zoll" ? 1 : 0).replace("-", "−")}</text>`; });
    const a = val(A), b = val(B), diff = b - a, ratio = a !== 0 ? b / a : null;
    const u = L === 3 ? " " + G.unit : "";
    const nd = L === 3 && G.unit === "Zoll" ? 1 : 0;
    s += `<g transform="translate(${L === 3 ? 640 : 560},40)"><text class="lbl-strong" x="0" y="0">B − A = ${dec(diff, nd)}${u}</text><text x="0" y="22">${L === 2 ? "bleibt gleich" : "ändert sich mit der Einheit"}</text>`;
    s += `<text class="lbl-strong" x="0" y="56">B ÷ A = ${ratio === null ? "nicht definiert" : dec(ratio, 2).replace("-", "−")}</text><text x="0" y="78">${L === 2 ? "hängt an der Null: nicht sinnvoll" : "bleibt gleich: „doppelt so viel“"}</text></g>`;
  }
  statLayer.innerHTML = s;
  statLayer.querySelectorAll("*").forEach(el => el.animate && el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: "ease-out" }));
}
function drawCtrl() {
  const L = G.level, c = $("scene-ctrl");
  if (L === 0) c.innerHTML = `<button class="btn ghost" type="button" id="mix">Anordnung mischen</button><span class="note">Kreise, Quadrate, Dreiecke: Keine Gruppe ist „mehr“ als eine andere.</span>`;
  else if (L === 1) c.innerHTML = `<button class="btn ghost" type="button" id="gaps">Abstände ändern</button><span class="note">Die Farben werden dunkler: Die Gruppen haben jetzt einen Rang.</span>`;
  else if (L === 2) c.innerHTML = `<div class="ctrl"><div class="ctrl-head"><label for="shift">Null verschieben</label><output id="shift-v">${G.shift}</output></div><input id="shift" type="range" min="-20" max="25" step="5" value="${G.shift}"></div>`;
  else c.innerHTML = `<span class="lbl">Einheit</span><div class="seg" id="unit">${["cm", "mm", "Zoll"].map(u => `<button type="button" data-u="${u}" aria-pressed="${u === G.unit}">${u}</button>`).join("")}</div>`;
  if ($("mix")) $("mix").onclick = () => { let p; do { p = [0, 1, 2].sort(() => Math.random() - 0.5); } while (p.join() === G.perm.join()); G.perm = p.slice(); placeTokens(); drawStatic(); };
  if ($("gaps")) $("gaps").onclick = () => { const a = 120 + Math.random() * 140, b = a + 90 + Math.random() * 250, c2 = Math.min(800, b + 80 + Math.random() * 300); G.ordX = [a, b, c2]; placeTokens(); drawStatic(); };
  if ($("shift")) $("shift").oninput = e => { G.shift = +e.target.value; $("shift-v").textContent = G.shift; drawStatic(); };
  if ($("unit")) $("unit").onclick = e => { const b = e.target.closest("button"); if (!b) return; G.unit = b.dataset.u; $("unit").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); drawStatic(); };
}
function drawOps() {
  const L = G.level;
  let s = `<thead><tr><th>Operation</th>${LEVELS.map((l, i) => `<th class="${i === L ? "cur" : ""}">${l.name}</th>`).join("")}</tr></thead><tbody>`;
  OPS.forEach(o => { s += `<tr><td>${o.k}${o.from === L ? '<span class="new">neu</span>' : ""}<small>${o.s}</small></td>${LEVELS.map((l, i) => `<td class="${i === L ? "cur" : ""}">${i >= o.from ? '<span class="yes">✓</span>' : '<span class="no">–</span>'}</td>`).join("")}</tr>`; });
  STATS.forEach(r => { s += `<tr class="stat"><td>${r.k}</td>${r.v.map((v, i) => `<td class="${i === L ? "cur" : ""}">${v}</td>`).join("")}</tr>`; });
  $("ops").innerHTML = s + "</tbody>";
}
function setLevel(L) {
  G.level = Math.max(0, Math.min(3, L)); G.visited.add(G.level);
  document.querySelectorAll("#levels button").forEach(b => { const i = +b.dataset.l; b.setAttribute("aria-pressed", i === G.level); b.classList.toggle("done", G.visited.has(i) && i !== G.level); });
  const l = LEVELS[G.level];
  $("level-text").innerHTML = `<div class="lt-main"><h2>${G.level + 1} · ${l.name}: ${l.lead}</h2><p>${l.text}</p></div><div class="lt-new"><span class="pill">neu auf dieser Stufe</span><b>${l.neu}</b><span>Kennwerte: ${l.ok}</span></div>`;
  $("lv-prev").disabled = G.level === 0; $("lv-next").disabled = G.level === 3;
  placeTokens(); drawStatic(); drawCtrl(); drawOps();
}
$("levels").addEventListener("click", e => { const b = e.target.closest("button"); if (b) setLevel(+b.dataset.l); });
$("lv-prev").onclick = () => setLevel(G.level - 1);
$("lv-next").onclick = () => setLevel(G.level + 1);

/* ================= 2 Knie ================= */
const K = { ext: 5, flex: 125, zero: 0 };
function kneeDraw() {
  $("ext-v").textContent = deg(K.ext) + (K.ext < 0 ? " Überstreckung" : K.ext > 0 ? " Streckdefizit" : "");
  $("flex-v").textContent = deg(K.flex);
  $("zero-v").textContent = (K.zero > 0 ? "+" : "") + deg(K.zero);
  const kx = 240, ky = 150, Ls = 190, rad = a => a * Math.PI / 180, pt = (a, r) => [kx + Math.cos(rad(a)) * r, ky + Math.sin(rad(a)) * r];
  let s = "";
  // Winkelmesser um das Knie, beschriftet relativ zur (verschobenen) Null
  for (let a = -30; a <= 160; a += 10) { const p1 = pt(a, 118), p2 = pt(a, a % 30 === 0 ? 132 : 126); s += `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke="var(--line)" stroke-width="2"/>`; }
  for (let a = -30; a <= 150; a += 30) { const p = pt(a, 156); const v = a - K.zero; s += `<text x="${p[0]}" y="${p[1] + 5}" text-anchor="middle" font-size="12">${deg(v)}</text>`; }
  // Bewegungsumfang als Sektor
  const e = pt(K.ext, 100), f = pt(K.flex, 100), large = K.flex - K.ext > 180 ? 1 : 0;
  s += `<path d="M${kx} ${ky} L${e[0]} ${e[1]} A100 100 0 ${large} 1 ${f[0]} ${f[1]} Z" fill="var(--area-b)" opacity=".85"/>`;
  // Oberschenkel
  s += `<line x1="20" y1="${ky}" x2="${kx}" y2="${ky}" stroke="var(--muted)" stroke-width="26" stroke-linecap="round" opacity=".55"/><text x="40" y="${ky - 24}">Oberschenkel</text>`;
  // Unterschenkel: Streckstellung (hell) und Beugestellung (dunkel)
  const leg = (a, col, op) => { const p = pt(a, Ls), foot = [p[0] + Math.cos(rad(a - 90)) * 34, p[1] + Math.sin(rad(a - 90)) * 34]; return `<line x1="${kx}" y1="${ky}" x2="${p[0]}" y2="${p[1]}" stroke="${col}" stroke-width="20" stroke-linecap="round" opacity="${op}"/><line x1="${p[0]}" y1="${p[1]}" x2="${foot[0]}" y2="${foot[1]}" stroke="${col}" stroke-width="14" stroke-linecap="round" opacity="${op}"/>`; };
  s += leg(K.ext, "var(--kontrolle)", 0.75) + leg(K.flex, "var(--therapie)", 1);
  // Nulllinie
  const z1 = pt(K.zero, 245), z2 = pt(K.zero, 262);
  s += `<line x1="${kx}" y1="${ky}" x2="${z1[0]}" y2="${z1[1]}" stroke="var(--fg)" stroke-width="2.5" stroke-dasharray="7 5"/><text class="lbl-strong" x="${z2[0]}" y="${z2[1] + 5}" text-anchor="start">0°</text>`;
  s += `<circle cx="${kx}" cy="${ky}" r="15" fill="var(--surface)" stroke="var(--fg)" stroke-width="3"/>`;
  const em = pt(K.ext, 72), fm = pt((K.ext + K.flex) / 2, 66);
  s += `<text class="lbl-strong" x="${fm[0]}" y="${fm[1] + 5}" text-anchor="middle">${deg(K.flex - K.ext)}</text>`;
  $("knee").innerHTML = s;
  const E = K.ext - K.zero, F = K.flex - K.zero, ratio = E !== 0 ? F / E : null;
  const nn = K.ext > 0 ? `0 – ${K.ext} – ${K.flex}` : `${-K.ext} – 0 – ${K.flex}`;
  $("knee-out").innerHTML =
    `<div class="cbox bad"><span class="k">Verhältnis der Stellungen</span><span class="v">${ratio === null ? "÷ 0" : dec(ratio, 1).replace("-", "−")}</span><span class="s">${deg(F)} ÷ ${deg(E)}</span><span class="tag">${K.zero ? "springt mit der Null" : "hängt an der Null"}</span></div>` +
    `<div class="cbox good"><span class="k">Differenz = Bewegungsumfang</span><span class="v">${deg(F - E)}</span><span class="s">${deg(F)} − ${deg(E)}</span><span class="tag">bleibt gleich</span></div>` +
    `<div class="cbox" style="grid-column:1/-1"><span class="k">Dokumentation nach Neutral-Null-Methode (Extension/Flexion)</span><span class="v num">${nn}</span><span class="s">${K.ext < 0 ? "Überstreckung – Neutralstellung durchlaufen – Beugung" : K.ext > 0 ? "Neutralstellung nicht erreicht: Streckdefizit in der Mitte" : "Neutralstellung erreicht"}</span></div>`;
}
["ext", "flex", "zero"].forEach(id => $(id).addEventListener("input", e => { K[id] = +e.target.value; kneeDraw(); }));

const C = { a: 108, b: 90 };
function clinicDraw() {
  $("romA-v").textContent = deg(C.a); $("romB-v").textContent = deg(C.b);
  const x = v => 120 + v * 5, bar = (y, v, col, n) => `<text class="lbl-strong" x="0" y="${y + 20}">${n}</text><rect x="${x(0)}" y="${y}" width="${x(v) - x(0)}" height="30" rx="3" fill="${col}"/><text x="${x(v) + 8}" y="${y + 20}" style="fill:var(--fg)">${deg(v)}</text>`;
  let s = bar(14, C.a, "var(--pal-6)", "Klinik A") + bar(66, C.b, "var(--pal-3)", "Klinik B");
  s += `<line x1="${x(0)}" x2="${x(0)}" y1="4" y2="110" stroke="var(--fg)" stroke-width="3"/><text x="${x(0)}" y="126" text-anchor="middle">0° = keine Bewegung</text>`;
  $("clinic").innerHTML = s;
  const r = C.a / C.b, d = Math.abs(r - 1);
  $("clinic-text").innerHTML = (C.a === C.b ? "Beide Kliniken erreichen denselben Bewegungsumfang." : `Klinik A erreicht ${pct(d, 0)} ${r > 1 ? "mehr" : "weniger"} Bewegungsumfang als Klinik B.`) +
    `<small>${deg(C.a)} ÷ ${deg(C.b)} = ${dec(r, 2)}. Zulässig, weil 0° Bewegungsumfang „keine Bewegung“ bedeutet. Mit Gelenkstellungen, etwa 5° gegen 10° Streckung, wäre derselbe Satz sinnlos.</small>`;
}
["romA", "romB"].forEach(id => $(id).addEventListener("input", e => { C[id === "romA" ? "a" : "b"] = +e.target.value; clinicDraw(); }));

/* ================= 3 Hop-Tests ================= */
const H = { g: 200, b: 150, z: 0 };
function hopDraw() {
  $("hg-v").textContent = H.g + " cm"; $("hb-v").textContent = H.b + " cm"; $("hz-v").textContent = H.z + " cm";
  const x = v => 90 + v * 3, lanes = [["gesund", H.g, 70, "var(--pal-6)"], ["betroffen", H.b, 160, "var(--pal-3)"]];
  let s = "";
  for (let v = 0; v <= 250; v += 10) s += `<line x1="${x(v)}" x2="${x(v)}" y1="214" y2="${v % 50 ? 220 : 226}" stroke="var(--muted)"/>` + (v % 50 ? "" : `<text x="${x(v)}" y="242" text-anchor="middle">${v}</text>`);
  s += `<line x1="${x(0)}" x2="${x(250)}" y1="214" y2="214" stroke="var(--muted)"/><text x="${x(250) + 22}" y="242">cm</text>`;
  s += `<line x1="${x(0)}" x2="${x(0)}" y1="20" y2="214" stroke="var(--fg)" stroke-width="3"/><text x="${x(0) - 8}" y="16" text-anchor="end" style="fill:var(--fg)">Absprung</text>`;
  lanes.forEach(([n, d, y, col]) => {
    s += `<text class="lbl-strong" x="0" y="${y + 5}">${n}</text>`;
    s += `<path d="M${x(0)} ${y + 20} Q${(x(0) + x(d)) / 2} ${y - 60} ${x(d)} ${y + 20}" fill="none" stroke="${col}" stroke-width="2.5" stroke-dasharray="4 5"/>`;
    s += `<circle cx="${x(d)}" cy="${y + 20}" r="8" fill="${col}"/>`;
    const m0 = Math.min(H.z, d);
    if (H.z > 0) s += `<rect x="${x(0)}" y="${y + 28}" width="${x(m0) - x(0)}" height="8" fill="var(--grid)"/>`;
    s += `<rect x="${x(m0)}" y="${y + 28}" width="${Math.max(0, x(d) - x(m0))}" height="8" fill="${col}"/>`;
    s += `<text x="${x(d) + 14}" y="${y + 26}" style="fill:var(--fg)">${d - H.z > 0 ? (H.z ? "gemessen " : "") + (d - H.z) + " cm" : "nicht messbar"}</text>`;
  });
  if (H.z > 0) s += `<line x1="${x(H.z)}" x2="${x(H.z)}" y1="30" y2="214" stroke="var(--accent)" stroke-width="2.5" stroke-dasharray="6 4"/><text x="${x(H.z) + 6}" y="30" style="fill:var(--accent)">neue „Null“</text>`;
  $("hop").innerHTML = s;
  const lsi = H.b / H.g, gb = H.g - H.z, bb = H.b - H.z, lsiZ = gb > 0 && bb > 0 ? bb / gb : null;
  let f = TB(String.raw`LSI = \dfrac{\text{betroffen}}{\text{gesund}} \cdot 100 = \dfrac{${H.b}}{${H.g}} \cdot 100 = ${tz(pct(lsi, 0))}`, `<span class="big">LSI = ${H.b} ÷ ${H.g} × 100 = ${pct(lsi, 0)}</span>`);
  if (H.z > 0) f += `<span class="warn">Mit Null bei ${H.z} cm:</span>` + TB(String.raw`LSI = \dfrac{${H.b} - ${H.z}}{${H.g} - ${H.z}} \cdot 100 = ${lsiZ === null ? "\\text{nicht berechenbar}" : tz(pct(lsiZ, 0))}`, `<span class="warn">(${H.b} − ${H.z}) ÷ (${H.g} − ${H.z}) × 100 = ${lsiZ === null ? "nicht berechenbar" : pct(lsiZ, 0)}</span>`);
  f += `<span>Häufiges Kriterium für die Rückkehr zum Sport: LSI ≥ 90 %</span>`;
  $("lsi-f").innerHTML = f;
  $("lsi-r").innerHTML = readout("LSI mit echter Null", pct(lsi, 0)) + readout(H.z ? `LSI mit Null bei ${H.z} cm` : "LSI mit verschobener Null", H.z ? (lsiZ === null ? "–" : pct(lsiZ, 0)) : "Regler bewegen") + readout("Differenz gesund − betroffen", (H.g - H.b) + " cm") + readout("Differenz bei verschobener Null", (H.g - H.b) + " cm");
}
["hg", "hb", "hz"].forEach(id => $(id).addEventListener("input", e => { H[id[1]] = +e.target.value; hopDraw(); }));

const T = { g: 2.2, b: 2.8 }, TRACK = 6;
let raceT = null, raceRAF = 0;
function raceDraw(t) {
  const x = m => 120 + m / TRACK * 680, lanes = [["gesund", T.g, 50, "var(--pal-6)"], ["betroffen", T.b, 112, "var(--pal-3)"]];
  let s = `<line x1="${x(0)}" x2="${x(0)}" y1="16" y2="138" stroke="var(--fg)" stroke-width="2"/><line x1="${x(TRACK)}" x2="${x(TRACK)}" y1="16" y2="138" stroke="var(--fg)" stroke-width="3" stroke-dasharray="4 3"/><text x="${x(TRACK)}" y="12" text-anchor="middle">6 m</text><text x="${x(0)}" y="12" text-anchor="middle">Start</text>`;
  lanes.forEach(([n, tt, y, col]) => {
    const done = t !== null && t >= tt, frac = t === null ? 0 : Math.min(1, t / tt), m = frac * TRACK;
    const hop = t === null || done ? 0 : Math.abs(Math.sin(frac * Math.PI * 7)) * 18;
    s += `<text class="lbl-strong" x="0" y="${y + 5}">${n}</text><line x1="${x(0)}" x2="${x(TRACK)}" y1="${y + 14}" y2="${y + 14}" stroke="var(--line)"/>`;
    s += `<circle cx="${x(m)}" cy="${y - hop}" r="10" fill="${col}"/>`;
    s += `<text x="${x(TRACK) + 14}" y="${y + 5}" style="fill:var(--fg)">${t === null ? dec(tt, 1) + " s" : done ? dec(tt, 1) + " s ✓" : dec(t, 1) + " s"}</text>`;
  });
  $("race").innerHTML = s;
}
$("race-go").onclick = () => {
  cancelAnimationFrame(raceRAF); const t0 = performance.now(), end = Math.max(T.g, T.b) + 0.3;
  const step = now => { const t = (now - t0) / 1000; raceDraw(Math.min(t, end)); if (t < end) raceRAF = requestAnimationFrame(step); };
  raceRAF = requestAnimationFrame(step);
};
function timeDraw() {
  $("tg-v").textContent = dec(T.g, 1) + " s"; $("tb-v").textContent = dec(T.b, 1) + " s";
  raceDraw(null);
  const fastT = Math.min(T.g, T.b), slowT = Math.max(T.g, T.b), fastName = T.g <= T.b ? "gesunde" : "betroffene";
  const less = 1 - fastT / slowT, more = slowT / fastT - 1;
  $("t-short").textContent = pct(less, 0); $("t-fast").textContent = pct(more, 0);
  $("time-r").innerHTML = readout(`weniger Zeit (${fastName}s Bein)`, pct(less)) + readout("höhere Geschwindigkeit", pct(more)) + readout("Geschwindigkeit gesund / betroffen", `${dec(TRACK / T.g, 2)} / ${dec(TRACK / T.b, 2)} m/s`) + readout("LSI Zeit = gesund ÷ betroffen × 100", pct(T.g / T.b, 0));
  const q = document.querySelector(".question");
  if (T.g === T.b) { q.textContent = "Beide Beine brauchen gleich lang. Verändern Sie die Zeiten."; $("answers").innerHTML = ""; $("feedback").textContent = ""; }
  else {
    q.textContent = `Um wie viel Prozent ist das ${fastName} Bein schneller?`;
    const opts = [[`${pct(less, 0)} schneller`, "a"], [`${pct(more, 0)} schneller`, "b"], ["Beides, je nachdem, was „schneller“ meint", "c"]];
    $("answers").innerHTML = opts.map(o => `<button type="button" data-a="${o[1]}">${o[0]}</button>`).join("");
    $("feedback").textContent = "";
  }
  $("log-text").textContent = `ln(${dec(slowT, 1)}) − ln(${dec(fastT, 1)}) = ln(${dec(slowT, 1)} ÷ ${dec(fastT, 1)}) = ${dec(Math.log(slowT / fastT), 3)}. Von der anderen Seite gerechnet ergibt sich −${dec(Math.log(slowT / fastT), 3)}: derselbe Betrag in beide Richtungen, anders als ${pct(less, 0)} gegen ${pct(more, 0)}.`;
}
$("answers").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  const fastT = Math.min(T.g, T.b), slowT = Math.max(T.g, T.b), less = pct(1 - fastT / slowT, 0), more = pct(slowT / fastT - 1, 0);
  $("answers").querySelectorAll("button").forEach(x => x.classList.remove("right", "wrong"));
  b.classList.add(b.dataset.a === "c" ? "right" : "wrong");
  $("feedback").innerHTML = {
    a: `Halb richtig: ${less} ist die <b>Zeitersparnis</b> (1 − ${dec(fastT, 1)} ÷ ${dec(slowT, 1)}). Die Geschwindigkeit ist aber um ${more} höher.`,
    b: `Halb richtig: ${more} ist die höhere <b>Geschwindigkeit</b> (${dec(slowT, 1)} ÷ ${dec(fastT, 1)} − 1). Die Zeit ist aber nur um ${less} kürzer.`,
    c: `Genau. ${less} weniger Zeit und ${more} mehr Geschwindigkeit beschreiben denselben Unterschied. Die Bezugsgröße entscheidet, deshalb immer dazuschreiben, worauf sich die Prozentangabe bezieht.`
  }[b.dataset.a];
});
["tg", "tb"].forEach(id => $(id).addEventListener("input", e => { T[id[1]] = +e.target.value; cancelAnimationFrame(raceRAF); timeDraw(); }));

/* ================= Start ================= */
setLevel(0); kneeDraw(); clinicDraw(); hopDraw(); timeDraw();
showTab(location.hash.slice(1));
})();
