/* Induktion und Deduktion · Stats Lab
   Oben die Ebene des Allgemeinen, unten die des Speziellen.
   Links der Weg nach oben, rechts der Weg nach unten. Jeder Schritt setzt Inhalt und Zustand der beiden Pfeile. */
(() => {
"use strict";

const STEPS = [
  {
    kicker: "Schritt 1 · Induktion", title: "Vom Speziellen aufs Allgemeine",
    top: ["Alle Schwäne sind weiß."], bottom: ["Schwan 1 bis 1.000", "war weiß."],
    up: { label: "Induktion", sub: "erweitert, aber unsicher", state: "on", color: "var(--kontrolle)" },
    down: { label: "Deduktion", sub: "", state: "off" },
    text: "Aus vielen Einzelbeobachtungen wird ein allgemeiner Satz. So lernen wir im Alltag und in der Praxis.",
    plus: "erweitert das Wissen", minus: "nie sicher",
    example: "Praxis: Zwanzig Patientinnen ging es nach der Mobilisation besser. Also wirkt Mobilisation. Klingt plausibel, folgt aber nicht zwingend.",
    note: "David Hume (1748): Aus noch so vielen Fällen folgt logisch kein allgemeiner Satz. Der nächste Fall kann anders sein."
  },
  {
    kicker: "Schritt 2 · Deduktion", title: "Vom Allgemeinen aufs Spezielle",
    top: ["Alle Schwäne sind weiß."], bottom: ["Also ist der nächste", "Schwan weiß."],
    up: { label: "Induktion", sub: "", state: "off" },
    down: { label: "Deduktion", sub: "sicher, aber nichts Neues", state: "on", color: "var(--therapie)" },
    text: "Aus einem allgemeinen Satz wird ein Einzelfall abgeleitet. Stimmt die Prämisse, stimmt zwingend auch die Folgerung.",
    plus: "wahrheitserhaltend", minus: "erweitert kein Wissen",
    example: "Wenn Mobilisation bei allen Betroffenen den Schmerz senkt, dann muss sie ihn auch bei Frau M. senken. Die Folgerung steckt schon in der Prämisse."
  },
  {
    kicker: "Schritt 3 · Poppers Antwort", title: "Prüfen statt beweisen",
    top: ["Hypothese H:", "Alle Schwäne sind weiß."], bottom: ["Beobachtung:", "ein schwarzer Schwan."],
    up: { label: "Falsifikation", sub: "B tritt nicht ein, also gilt H nicht", state: "on", color: "var(--accent)" },
    down: { label: "Deduktion", sub: "Vorhersage B ableiten", state: "on", color: "var(--therapie)" },
    text: "Popper streicht die Induktion als Begründung. Woher eine Hypothese kommt, ist egal. Wissenschaftlich zählt nur, was man aus ihr ableitet und an der Erfahrung scheitern lassen kann.",
    plus: "Falsifikation ist logisch gültig", minus: "Verifikation ist unmöglich",
    example: "1.000 weiße Schwäne beweisen den Satz nicht. Ein schwarzer widerlegt ihn. Eine Hypothese, die viele ernsthafte Widerlegungsversuche übersteht, gilt als bewährt, nicht als wahr.",
    note: "Karl Popper, Logik der Forschung (1935). Probieren Sie es unten im Schwan-Experiment aus."
  },
  {
    kicker: "Schritt 4 · Signifikanztest", title: "Popper mit Wahrscheinlichkeiten",
    top: ["H0: Die Therapie", "wirkt nicht."], bottom: ["Daten:", "t = 2,50 · p = 0,017"],
    up: { label: "H0 verwerfen", sub: "probabilistisch, kein gültiger Schluss", state: "dashed", color: "var(--accent)" },
    down: { label: "Deduktion", sub: "aus H0 folgt die t-Verteilung", state: "on", color: "var(--therapie)" },
    text: "Der Test leitet aus H0 ab, welche Ergebnisse zu erwarten wären. Liegen die Daten im unwahrscheinlichen Bereich, wird H0 verworfen. Der Weg nach oben ist aber kein strenger Modus tollens: Unwahrscheinliche Daten sind unter H0 trotzdem möglich.",
    plus: "deduktiver Kern: die Verteilung unter H0", minus: "Verwerfen bleibt fehlbar (α)",
    example: "Unter H0 wäre ein Betrag von t ab 2,50 in nur 1,7 % der Studien zu erwarten. Wir verwerfen H0 und irren uns dabei auf lange Sicht in höchstens α der Fälle, in denen H0 stimmt.",
    note: "Popper schlug selbst vor, sehr unwahrscheinliche Ergebnisse per Konvention wie Falsifikationen zu behandeln. Diese Konvention heißt heute α.",
    link: true
  },
  {
    kicker: "Schritt 5 · Induktion und Inferenz", title: "Ein und dasselbe? Nein.",
    top: ["Population:", "wahre Differenz Δ"], bottom: ["Stichprobe:", "beobachtete Differenz"],
    up: { label: "Statistische Inferenz", sub: "induktive Richtung, Unsicherheit beziffert", state: "dashed", color: "var(--kontrolle)" },
    down: { label: "Modell", sub: "deduktiver Kern: Stichprobenverteilung", state: "on", color: "var(--therapie)" },
    text: "Inferenz ist der Oberbegriff für jedes Schließen: deduktiv, induktiv, abduktiv. Statistische Inferenz schließt von der Stichprobe auf die Population, also induktiv der Richtung nach. Die Rechnung dahinter ist aber deduktiv: Unter festen Annahmen wird die Stichprobenverteilung mathematisch abgeleitet.",
    plus: "macht die Unsicherheit messbar", minus: "beseitigt sie nicht",
    example: "Ein 95-%-Konfidenzintervall sagt nicht, wo Δ sicher liegt. Es sagt, dass so konstruierte Intervalle Δ auf lange Sicht in 95 % der Studien einfangen."
  }
];

const $ = id => document.getElementById(id);
let cur = 0;

function drawLadder(st) {
  const box = (y, lines) => {
    const h = 92, x = 70, w = 420;
    let s = `<rect class="box" x="${x}" y="${y}" width="${w}" height="${h}" rx="14"/>`;
    const lh = 24, y0 = y + h / 2 - (lines.length - 1) * lh / 2 + 6;
    lines.forEach((l, i) => { s += `<text class="box-text" x="280" y="${y0 + i * lh}" text-anchor="middle">${l}</text>`; });
    return s;
  };
  const arrow = (x, y1, y2, a, side) => {
    const col = a.state === "off" ? "var(--line)" : a.color;
    const dash = a.state === "dashed" ? ' stroke-dasharray="10 8"' : "";
    const op = a.state === "off" ? .55 : 1;
    const dir = y2 < y1 ? -1 : 1;
    const head = `${x - 11},${y2 - dir * 16} ${x + 11},${y2 - dir * 16} ${x},${y2}`;
    const tx = side === "left" ? x + 22 : x - 22, anchor = side === "left" ? "start" : "end";
    const mid = (y1 + y2) / 2 + (side === "left" ? -26 : 30);
    return `<g class="arr" opacity="${op}">
      <line x1="${x}" x2="${x}" y1="${y1}" y2="${y2 - dir * 14}" stroke="${col}" stroke-width="${a.state === "off" ? 3 : 5}"${dash} stroke-linecap="round"/>
      <polygon points="${head}" fill="${col}"/>
      <text class="arrow-label" x="${tx}" y="${mid - 4}" text-anchor="${anchor}" fill="${a.state === "off" ? "var(--muted)" : "var(--fg)"}">${a.label}</text>
      ${a.sub ? `<text class="arrow-sub" x="${tx}" y="${mid + 18}" text-anchor="${anchor}">${a.sub}</text>` : ""}
    </g>`;
  };
  let s = "";
  s += `<rect x="0" y="0" width="560" height="190" fill="var(--theory-band)"/><rect x="0" y="280" width="560" height="190" fill="var(--empiric-band)"/>`;
  s += `<text class="band-label" x="16" y="24">ALLGEMEIN · THEORIE</text>`;
  s += `<text class="band-label" x="16" y="458">SPEZIELL · BEOBACHTUNG</text>`;
  s += box(48, st.top) + box(330, st.bottom);
  s += arrow(100, 326, 146, st.up, "left");
  s += arrow(460, 146, 326, st.down, "right");
  const svg = $("ladder");
  svg.innerHTML = s;
  svg.setAttribute("aria-label", `${st.kicker}. Oben: ${st.top.join(" ")} Unten: ${st.bottom.join(" ")} Nach oben: ${st.up.label}. Nach unten: ${st.down.label}.`);
}

function render() {
  const st = STEPS[cur];
  drawLadder(st);
  $("detail").innerHTML = `
    <span class="kicker">${st.kicker}</span>
    <h2>${st.title}</h2>
    <p>${st.text}</p>
    <div class="props"><span class="prop plus">+ ${st.plus}</span><span class="prop minus">− ${st.minus}</span></div>
    <div class="example">${st.example}</div>
    ${st.note ? `<p class="note">${st.note}</p>` : ""}
    ${st.link ? `<p class="note"><a href="../t-test/">Diesen Schritt in der t-Test-Kaskade ansehen →</a></p>` : ""}`;
  $("step-count").textContent = `${cur + 1} von ${STEPS.length}`;
  document.querySelectorAll("#dots button").forEach((b, i) => b.setAttribute("aria-selected", i === cur));
  $("prev").disabled = cur === 0; $("next").disabled = cur === STEPS.length - 1;
  $("prev").style.opacity = cur === 0 ? .4 : 1; $("next").style.opacity = cur === STEPS.length - 1 ? .4 : 1;
}
const go = i => { cur = Math.max(0, Math.min(STEPS.length - 1, i)); render(); };
$("dots").innerHTML = STEPS.map(s => `<button type="button" role="tab" aria-label="${s.kicker}"></button>`).join("");
document.querySelectorAll("#dots button").forEach((b, i) => b.addEventListener("click", () => go(i)));
$("prev").addEventListener("click", () => go(cur - 1));
$("next").addEventListener("click", () => go(cur + 1));
document.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") go(cur + 1);
  if (e.key === "ArrowLeft") go(cur - 1);
});

// ---------- Schwan-Experiment ----------
let white = 0, black = 0;
const SHOW = 400;
function renderSwans() {
  const n = Math.min(white, SHOW);
  $("swans").innerHTML = '<span class="swan"></span>'.repeat(n) + '<span class="swan black"></span>'.repeat(black);
  const st = $("swan-status"), hyp = document.querySelector(".hyp-text"), tx = $("swan-text");
  const nf = white.toLocaleString("de-DE");
  hyp.classList.toggle("struck", black > 0);
  if (black > 0) {
    st.className = "status no"; st.textContent = "falsifiziert";
    tx.innerHTML = `${nf} weiße Schwäne haben nichts bewiesen. <b>Ein einziger schwarzer Schwan</b> genügt, um die Hypothese logisch zu widerlegen. Das ist Poppers Asymmetrie.`;
  } else if (white > 0) {
    st.className = "status ok"; st.textContent = "bewährt, nicht bewiesen";
    tx.innerHTML = `${nf} weiße Schwäne${white > SHOW ? " (angezeigt: " + SHOW + ")" : ""}. Die Hypothese hat sich bewährt. Bewiesen ist sie nicht, und daran ändert auch der nächste weiße Schwan nichts.`;
  } else {
    st.className = "status"; st.textContent = "ungeprüft";
    tx.textContent = "Noch keine Beobachtung.";
  }
  $("w1").disabled = $("w100").disabled = black > 0;
  $("w1").style.opacity = $("w100").style.opacity = black > 0 ? .4 : 1;
}
$("w1").addEventListener("click", () => { white += 1; renderSwans(); });
$("w100").addEventListener("click", () => { white += 100; renderSwans(); });
$("b1").addEventListener("click", () => { black = 1; renderSwans(); });
$("reset").addEventListener("click", () => { white = 0; black = 0; renderSwans(); });

render();
white = 12; renderSwans();
})();
