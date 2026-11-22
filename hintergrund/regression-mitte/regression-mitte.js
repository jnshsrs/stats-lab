/* Regression zur Mitte · Stats Lab
   Schmerz: persönlicher Mittelwert + AR(1)-Tagesschwankung (φ = 0,7), NRS 0 bis 10.
   Termin am ersten Tag (ab Tag 10), an dem die Schwelle erreicht wird; Nachkontrolle 14 Tage später.
   Galton: Originaldaten aus galton-data.js. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const dec = (x, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const sgn = (x, d = 1) => (x < 0 ? "−" : x > 0 ? "+" : "±") + dec(Math.abs(x), d);
const readout = (l, v) => `<div class="readout"><div class="val">${v}</div><div class="lbl">${l}</div></div>`;
const path = pts => pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join("");
function randn() { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ================= Schmerzmodell ================= */
const DAYS = 90, PHI = 0.7, FU = 14, FIRST = 10, LAST = DAYS - FU - 1;
const P = { thr: 7, sd: 1.5, eff: 0 };
function person() {
  const mu = clamp(4.5 + randn(), 1.5, 7), xs = []; let e = randn() * P.sd;
  for (let t = 0; t < DAYS; t++) { e = PHI * e + Math.sqrt(1 - PHI * PHI) * P.sd * randn(); xs.push(clamp(mu + e, 0, 10)); }
  let v = -1; for (let t = FIRST; t <= LAST; t++) if (xs[t] >= P.thr) { v = t; break; }
  return { mu, xs, v };
}

/* ---------- 1 Eine Person ---------- */
let cur = null;
function newPerson() { for (let k = 0; k < 400; k++) { const p = person(); if (p.v >= 0) { cur = p; return; } } cur = person(); }
function draw1() {
  $("thr-v").textContent = dec(P.thr); $("sd-v").textContent = dec(P.sd);
  const W = 900, H = 320, L = 50, R = 20, T = 16, B = 40, x = t => L + t / (DAYS - 1) * (W - L - R), y = v => T + (10 - v) / 10 * (H - T - B);
  let s = "";
  for (let v = 0; v <= 10; v += 2) s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  for (let t = 0; t < DAYS; t += 14) s += `<text x="${x(t)}" y="${H - B + 20}" text-anchor="middle">${t}</text>`;
  s += `<text x="${(L + W - R) / 2}" y="${H - 4}" text-anchor="middle">Tag</text><text x="14" y="${(T + H - B) / 2}" transform="rotate(-90 14 ${(T + H - B) / 2})" text-anchor="middle">Schmerz (NRS)</text>`;
  const p = cur;
  if (p.v >= 0) s += `<rect x="${x(p.v)}" y="${T}" width="${x(p.v + FU) - x(p.v)}" height="${H - T - B}" fill="var(--highlight)"/>`;
  s += `<line x1="${L}" x2="${W - R}" y1="${y(P.thr)}" y2="${y(P.thr)}" stroke="var(--accent)" stroke-dasharray="3 4"/><text x="${W - R}" y="${y(P.thr) - 6}" text-anchor="end" style="fill:var(--accent)">Schwelle ${dec(P.thr)}</text>`;
  s += `<line x1="${L}" x2="${W - R}" y1="${y(p.mu)}" y2="${y(p.mu)}" stroke="var(--fg)" stroke-width="2" stroke-dasharray="8 5"/><text x="${W - R}" y="${y(p.mu) + 18}" text-anchor="end" style="fill:var(--fg)">Mittelwert der Person ${dec(p.mu)}</text>`;
  s += `<path d="${path(p.xs.map((v, t) => [x(t), y(v)]))}" fill="none" stroke="var(--pal-4)" stroke-width="2"/>`;
  if (p.v >= 0) {
    const a = p.xs[p.v], b = p.xs[p.v + FU];
    s += `<line x1="${x(p.v)}" x2="${x(p.v + FU)}" y1="${y(a)}" y2="${y(b)}" stroke="var(--therapie)" stroke-width="2" stroke-dasharray="4 4"/>`;
    s += `<circle cx="${x(p.v)}" cy="${y(a)}" r="8" fill="var(--therapie)"/><text class="strong" x="${x(p.v)}" y="${y(a) - 14}" text-anchor="middle">Termin ${dec(a)}</text>`;
    s += `<circle cx="${x(p.v + FU)}" cy="${y(b)}" r="8" fill="var(--surface)" stroke="var(--therapie)" stroke-width="3"/><text class="strong" x="${x(p.v + FU)}" y="${y(b) + (b > p.mu ? -14 : 24)}" text-anchor="middle">nach 14 Tagen ${dec(b)}</text>`;
    $("ts-text").innerHTML = `Termin bei ${dec(a)}, zwei Wochen später ${dec(b)}, ohne jede Behandlung.<small>Der Termin fand gezielt an einem schlechten Tag statt. Bei der Nachkontrolle ist die Schwankung im Mittel wieder null, der Wert liegt deshalb meist näher am persönlichen Mittelwert von ${dec(p.mu)}. Klicken Sie mehrmals auf „Nächste Person“.</small>`;
  } else $("ts-text").innerHTML = `Diese Person hat die Schwelle in 90 Tagen nicht erreicht.<small>Senken Sie die Schwelle oder erhöhen Sie die Tagesschwankung.</small>`;
  $("ts").innerHTML = s;
}

/* ---------- 2 Praxis-Simulation ---------- */
let sim = null;
function simulate() {
  const out = { K: [], T: [], mu: [] };
  for (let i = 0; i < 1000; i++) {
    const p = person(); if (p.v < 0) continue;
    const g = Math.random() < 0.5 ? "K" : "T", pre = p.xs[p.v], post = clamp(p.xs[p.v + FU] - (g === "T" ? P.eff : 0), 0, 10);
    out[g].push([pre, post]); out.mu.push(p.mu);
  }
  sim = out; draw2();
}
const mean = a => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length);
function draw2() {
  $("eff-v").textContent = P.eff ? "−" + dec(P.eff, 2) : "0 (wirkungslos)";
  const { K, T, mu } = sim, n = K.length + T.length;
  $("n2").textContent = `${n} von 1.000 Personen hatten einen Termin`;
  const preK = mean(K.map(r => r[0])), postK = mean(K.map(r => r[1])), preT = mean(T.map(r => r[0])), postT = mean(T.map(r => r[1])), muM = mean(mu);
  // Verläufe
  {
    const W = 440, H = 320, L = 40, T0 = 16, B = 44, y = v => T0 + (10 - v) / 10 * (H - T0 - B);
    const panels = [[K, "Warteliste", "var(--kontrolle)", 70, 190], [T, "Therapie", "var(--therapie)", 260, 380]];
    let s = "";
    for (let v = 0; v <= 10; v += 2) s += `<line x1="${L}" x2="${W - 10}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
    s += `<line x1="${L}" x2="${W - 10}" y1="${y(muM)}" y2="${y(muM)}" stroke="var(--fg)" stroke-dasharray="8 5"/>`;
    panels.forEach(([rows, name, col, x0, x1]) => {
      rows.slice(0, 30).forEach(r => s += `<line x1="${x0}" x2="${x1}" y1="${y(r[0])}" y2="${y(r[1])}" stroke="${col}" stroke-opacity=".3" stroke-width="1.5"/>`);
      const a = mean(rows.map(r => r[0])), b = mean(rows.map(r => r[1]));
      s += `<line x1="${x0}" x2="${x1}" y1="${y(a)}" y2="${y(b)}" stroke="${col}" stroke-width="4"/><circle cx="${x0}" cy="${y(a)}" r="5" fill="${col}"/><circle cx="${x1}" cy="${y(b)}" r="5" fill="${col}"/>`;
      s += `<text x="${x0}" y="${H - B + 18}" text-anchor="middle">Termin</text><text x="${x1}" y="${H - B + 18}" text-anchor="middle">+14 Tage</text><text class="strong" x="${(x0 + x1) / 2}" y="${H - 6}" text-anchor="middle">${name}</text>`;
    });
    $("spag").innerHTML = s;
  }
  // Balken
  {
    const W = 440, H = 320, L = 40, T0 = 16, B = 44, y = v => T0 + (10 - v) / 10 * (H - T0 - B), bw = 52;
    let s = "";
    for (let v = 0; v <= 10; v += 2) s += `<line x1="${L}" x2="${W - 10}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
    const bars = [[preK, 70, "var(--kontrolle)", 0.45], [postK, 130, "var(--kontrolle)", 1], [preT, 250, "var(--therapie)", 0.45], [postT, 310, "var(--therapie)", 1]];
    bars.forEach(([v, x0, col, op]) => s += `<rect x="${x0}" y="${y(v)}" width="${bw}" height="${y(0) - y(v)}" fill="${col}" fill-opacity="${op}"/><text class="strong" x="${x0 + bw / 2}" y="${y(v) - 6}" text-anchor="middle">${dec(v)}</text>`);
    s += `<line x1="${L}" x2="${W - 10}" y1="${y(muM)}" y2="${y(muM)}" stroke="var(--fg)" stroke-dasharray="8 5"/><text x="216" y="${y(muM) - 8}" text-anchor="middle" style="fill:var(--fg)">normaler Tag ${dec(muM)}</text>`;
    s += `<text x="96" y="${H - B + 18}" text-anchor="middle">Termin</text><text x="156" y="${H - B + 18}" text-anchor="middle">+14</text><text x="276" y="${H - B + 18}" text-anchor="middle">Termin</text><text x="336" y="${H - B + 18}" text-anchor="middle">+14</text>`;
    s += `<text class="strong" x="126" y="${H - 6}" text-anchor="middle">Warteliste</text><text class="strong" x="306" y="${H - 6}" text-anchor="middle">Therapie</text>`;
    $("bars").innerHTML = s;
  }
  const dT = preT - postT, dK = preK - postK, est = postK - postT;
  $("r2").innerHTML = readout("Verbesserung Therapiegruppe (vorher − nachher)", dec(dT)) + readout("davon Regression zur Mitte (Warteliste)", dec(dK)) + readout("Therapieeffekt geschätzt (Warteliste − Therapie)", sgn(est).replace("+", "")) + readout("Therapieeffekt eingestellt", dec(P.eff, 2));
  $("c2").innerHTML = P.eff === 0
    ? `Die Therapiegruppe verbessert sich um <b>${dec(dT)} NRS-Punkte</b>, obwohl die Therapie hier gar nichts bewirkt. Die Warteliste verbessert sich genauso. Ohne Kontrollgruppe würde man diese Verbesserung als Therapieerfolg verbuchen.`
    : `Vorher-nachher zeigt <b>${dec(dT)} Punkte</b> Verbesserung. Davon gehen rund <b>${dec(dK)}</b> auf Regression zur Mitte zurück, nur <b>${dec(est)}</b> auf die Therapie. Erst der Vergleich mit der Warteliste trennt beides.`;
}

/* ================= 3 Galton ================= */
const GD = window.GALTON, N = GD.p.length;
const gm = a => a.reduce((s, v) => s + v, 0) / a.length;
const mp = gm(GD.p), mc = gm(GD.c);
const sdp = Math.sqrt(GD.p.reduce((s, v) => s + (v - mp) ** 2, 0) / (N - 1)), sdc = Math.sqrt(GD.c.reduce((s, v) => s + (v - mc) ** 2, 0) / (N - 1));
const rr = GD.p.reduce((s, v, i) => s + (v - mp) * (GD.c[i] - mc), 0) / ((N - 1) * sdp * sdc);
const bPC = rr * sdc / sdp, bCP = rr * sdp / sdc;
// feste, reproduzierbare Verschiebung gegen Überdeckung (Daten auf einen halben Zoll gerundet)
const jit = i => { const s = Math.sin(i * 12.9898) * 43758.5453; return (s - Math.floor(s) - 0.5) * 1.1; };
const G = { dir: "pc", band: 184 };
function draw3() {
  const W = 900, H = 560, L = 64, R = 24, T = 16, B = 52, X0 = 160, X1 = 196, Y0 = 150, Y1 = 206;
  const x = v => L + (v - X0) / (X1 - X0) * (W - L - R), y = v => T + (Y1 - v) / (Y1 - Y0) * (H - T - B);
  const half = 1.3, fw = G.dir === "pc";
  $("band-lbl").textContent = fw ? "Gruppe auswählen: Eltern um" : "Gruppe auswählen: Kinder um";
  $("band").min = fw ? 166 : 160; $("band").max = fw ? 188 : 192;
  if (G.band < +$("band").min) G.band = +$("band").min; if (G.band > +$("band").max) G.band = +$("band").max; $("band").value = G.band;
  $("band-v").textContent = G.band + " cm";
  let s = "";
  for (let v = 165; v <= 195; v += 5) s += `<line x1="${x(v)}" x2="${x(v)}" y1="${T}" y2="${H - B}" stroke="var(--grid)"/><text x="${x(v)}" y="${H - B + 20}" text-anchor="middle">${v}</text>`;
  for (let v = 150; v <= 205; v += 10) s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  s += `<text x="${(L + W - R) / 2}" y="${H - 8}" text-anchor="middle">Eltern (Mittel aus Vater und Mutter), cm</text><text x="16" y="${(T + H - B) / 2}" transform="rotate(-90 16 ${(T + H - B) / 2})" text-anchor="middle">erwachsenes Kind, cm</text>`;
  // Auswahlband
  if (fw) s += `<rect x="${x(G.band - half)}" y="${T}" width="${x(G.band + half) - x(G.band - half)}" height="${H - T - B}" fill="var(--highlight)"/>`;
  else s += `<rect x="${L}" y="${y(G.band + half)}" width="${W - L - R}" height="${y(G.band - half) - y(G.band + half)}" fill="var(--highlight)"/>`;
  const sel = [];
  for (let i = 0; i < N; i++) { const inb = fw ? Math.abs(GD.p[i] - G.band) <= half : Math.abs(GD.c[i] - G.band) <= half; if (inb) sel.push(i);
    s += `<circle cx="${x(GD.p[i] + jit(i))}" cy="${y(GD.c[i] + jit(i + 7))}" r="${inb ? 4 : 3}" fill="${inb ? "var(--kontrolle)" : "var(--pal-3)"}" fill-opacity="${inb ? .9 : .45}"/>`; }
  // Mittelwerte, Diagonale, Regressionsgerade
  s += `<line x1="${x(mp)}" x2="${x(mp)}" y1="${T}" y2="${H - B}" stroke="var(--muted)" stroke-dasharray="2 4"/><line x1="${L}" x2="${W - R}" y1="${y(mc)}" y2="${y(mc)}" stroke="var(--muted)" stroke-dasharray="2 4"/>`;
  const d0 = Math.max(X0, Y0), d1 = Math.min(X1, Y1);
  s += `<line x1="${x(d0)}" y1="${y(d0)}" x2="${x(d1)}" y2="${y(d1)}" stroke="var(--fg)" stroke-width="2" stroke-dasharray="7 5"/><text x="${x(d1) - 4}" y="${y(d1) + 18}" text-anchor="end" style="fill:var(--fg)">Kind = Eltern</text>`;
  if (fw) { const f = v => mc + bPC * (v - mp); s += `<line x1="${x(X0)}" y1="${y(f(X0))}" x2="${x(X1)}" y2="${y(f(X1))}" stroke="var(--therapie)" stroke-width="3"/><text class="strong" x="${x(X1) - 4}" y="${y(f(X1)) + 22}" text-anchor="end" style="fill:var(--therapie-ink)">Regressionsgerade, Steigung ${dec(bPC, 2)}</text>`;
    // Galtons Klassenmittel
    for (let c = 163; c <= 193; c += 2.54) { const idx = []; for (let i = 0; i < N; i++) if (GD.p[i] >= c && GD.p[i] < c + 2.54) idx.push(i); if (idx.length < 15) continue; const px = gm(idx.map(i => GD.p[i])), py = gm(idx.map(i => GD.c[i])); s += `<rect x="${x(px) - 5}" y="${y(py) - 5}" width="10" height="10" fill="var(--surface)" stroke="var(--therapie)" stroke-width="2.5" transform="rotate(45 ${x(px)} ${y(py)})"/>`; }
  } else { const f = v => mp + bCP * (v - mc); s += `<line x1="${x(f(Y0))}" y1="${y(Y0)}" x2="${x(f(Y1))}" y2="${y(Y1)}" stroke="var(--therapie)" stroke-width="3"/><text class="strong" x="${x(f(Y0)) + 12}" y="${y(Y0) - 10}" style="fill:var(--therapie-ink)">Regression Eltern auf Kinder, Steigung ${dec(bCP, 2)}</text>`; }
  // Gruppe: Pfeil von der Diagonale zum tatsächlichen Mittel
  let gp = NaN, gc = NaN;
  if (sel.length) {
    gp = gm(sel.map(i => GD.p[i])); gc = gm(sel.map(i => GD.c[i]));
    if (fw) s += `<circle cx="${x(gp)}" cy="${y(gp)}" r="7" fill="var(--surface)" stroke="var(--fg)" stroke-width="2.5"/><line x1="${x(gp)}" y1="${y(gp)}" x2="${x(gp)}" y2="${y(gc)}" stroke="var(--accent)" stroke-width="3"/><circle cx="${x(gp)}" cy="${y(gc)}" r="8" fill="var(--accent)"/><text class="strong" x="${x(gp) + 12}" y="${y(gc) + (gc > mc ? 18 : -10)}" style="fill:var(--accent)">Kinder Ø ${dec(gc)}</text>`;
    else s += `<circle cx="${x(gc)}" cy="${y(gc)}" r="7" fill="var(--surface)" stroke="var(--fg)" stroke-width="2.5"/><line x1="${x(gc)}" y1="${y(gc)}" x2="${x(gp)}" y2="${y(gc)}" stroke="var(--accent)" stroke-width="3"/><circle cx="${x(gp)}" cy="${y(gc)}" r="8" fill="var(--accent)"/><text class="strong" x="${x(gp)}" y="${y(gc) - 14}" text-anchor="middle" style="fill:var(--accent)">Eltern Ø ${dec(gp)}</text>`;
  }
  $("gal").innerHTML = s;
  $("lg3").innerHTML = `<span><i class="sw" style="background:var(--kontrolle)"></i>ausgewählte ${fw ? "Eltern und ihre Kinder" : "Kinder und ihre Eltern"}</span><span><i class="sw line dashed"></i>Kind = Eltern</span><span><i class="sw line" style="border-color:var(--therapie)"></i>Regressionsgerade</span>` + (fw ? `<span><i class="sw" style="background:var(--surface);border:2px solid var(--therapie);width:12px;height:12px;transform:rotate(45deg)"></i>Mittel je Elternklasse (wie bei Galton)</span>` : "");
  const devA = fw ? gp - mp : gc - mc, devB = fw ? gc - mc : gp - mp;
  $("r3").innerHTML = readout(fw ? "Eltern der Gruppe Ø" : "Kinder der Gruppe Ø", sel.length ? dec(fw ? gp : gc) + " cm" : "–") + readout(fw ? "ihre Kinder Ø" : "ihre Eltern Ø", sel.length ? dec(fw ? gc : gp) + " cm" : "–") + readout("Abstand zum Gesamtmittel", sel.length ? `${sgn(devA)} → ${sgn(devB)}` : "–") + readout("Personen in der Gruppe", sel.length) + readout("Korrelation r", dec(rr, 2)) + readout("SD Eltern / Kinder", `${dec(sdp)} / ${dec(sdc)}`);
  $("c3").innerHTML = !sel.length ? "In diesem Bereich gibt es keine Daten." : fw
    ? `Diese Eltern liegen im Mittel <b>${sgn(devA)} cm</b> vom Durchschnitt entfernt, ihre Kinder nur <b>${sgn(devB)} cm</b>. Lägen die Kinder auf der gestrichelten Diagonale, gäbe es keine Regression. Trotzdem wird die nächste Generation nicht einheitlicher: Die Kinder streuen mit ${dec(sdc)} cm sogar stärker als die Elternmittel, denn auch durchschnittliche Eltern haben sehr große und sehr kleine Kinder.`
    : `Rückwärts gilt dasselbe: Kinder, die <b>${sgn(devA)} cm</b> vom Durchschnitt entfernt sind, haben Eltern, die nur <b>${sgn(devB)} cm</b> abweichen. Kinder machen ihre Eltern nicht kleiner. Regression zur Mitte ist keine Vererbungsregel, sondern folgt aus jeder Korrelation unter 1.`;
}

/* ================= Steuerung ================= */
$("thr").addEventListener("input", e => { P.thr = +e.target.value; newPerson(); draw1(); simulate(); });
$("sd").addEventListener("input", e => { P.sd = +e.target.value; newPerson(); draw1(); simulate(); });
$("next1").onclick = () => { newPerson(); draw1(); };
$("eff").addEventListener("input", e => { P.eff = +e.target.value; simulate(); });
$("sim2").onclick = simulate;
$("dir").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; $("dir").querySelectorAll("button").forEach(z => z.setAttribute("aria-pressed", z === b)); G.dir = b.dataset.d; G.band = G.dir === "pc" ? 184 : 188; draw3(); });
$("band").addEventListener("input", e => { G.band = +e.target.value; draw3(); });
newPerson(); draw1(); simulate(); draw3();
})();
