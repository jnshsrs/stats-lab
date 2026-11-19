/* Inferenzzyklus · Stats Lab
   Fünf Phasen des empirischen Zyklus nach de Groot, oben die Welt der Theorie, unten die Welt der Daten. */
(() => {
"use strict";

const STATIONS = [
  {
    id: "beobachtung", name: "Beobachtung", angle: 236, kind: "empiric", mode: "Empirie · Ausgangspunkt",
    what: "Am Anfang steht eine Erfahrung, die auffällt oder überrascht. Sie ist noch keine Erkenntnis, sondern ein Anlass zu fragen.",
    example: "In der Praxis fällt auf: Patientinnen und Patienten mit akuten unspezifischen Rückenschmerzen berichten nach einer <b>Mobilisation der Lendenwirbelsäule</b> oft schnell von weniger Schmerz. Das sind Einzelfälle ohne Kontrollgruppe.",
    who: ["peirce", "degroot"],
    whoText: "<b>Peirce:</b> Eine überraschende Beobachtung verlangt nach einer Erklärung. Daraus entsteht durch Abduktion die erste Vermutung.",
    pitfall: "<b>Falle:</b> Was man erwartet, sieht man leichter. Spontane Besserung und der natürliche Verlauf akuter Rückenschmerzen sehen in der Praxis genauso aus wie ein Therapieeffekt."
  },
  {
    id: "induktion", name: "Induktion", angle: 300, kind: "theory", mode: "Schluss nach oben · vom Einzelnen zum Allgemeinen",
    what: "Aus vielen einzelnen Fällen wird eine allgemeine Hypothese. Peirce unterscheidet davon die Abduktion: das Finden der plausibelsten Erklärung, der eigentlich kreative Schritt.",
    example: "<b>Hypothese:</b> Mobilisation zusätzlich zur Standardversorgung reduziert den Schmerz nach sechs Wochen stärker als die Standardversorgung allein.<br><b>Statistisch:</b> H1: μ<sub>Therapie</sub> ≠ μ<sub>Kontrolle</sub> · H0: kein Unterschied.",
    who: ["peirce", "degroot", "box"],
    whoText: "<b>Peirce:</b> Abduktion ist die einzige Schlussart, die eine neue Idee hervorbringt. <b>Box:</b> Die Daten verändern das Modell, das Modell lenkt den Blick auf neue Daten.",
    pitfall: "<b>Falle:</b> Aus endlich vielen Fällen folgt nie sicher ein allgemeiner Satz. Die Hypothese kann falsch sein, so überzeugend die Einzelfälle auch wirken."
  },
  {
    id: "deduktion", name: "Deduktion", angle: 60, kind: "theory", mode: "Schluss nach unten · vom Allgemeinen zum Einzelnen",
    what: "Aus der Hypothese werden prüfbare Vorhersagen logisch abgeleitet. Wenn die Hypothese stimmt, muss unter bestimmten Bedingungen etwas Bestimmtes beobachtbar sein.",
    example: "<b>Wenn</b> die Mobilisation wirkt, <b>dann</b> muss in einer randomisierten Studie die mittlere Schmerzreduktion auf der VAS in der Therapiegruppe größer sein.<br><b>Und:</b> Wenn H0 stimmt, folgt t einer t-Verteilung mit 2n − 2 Freiheitsgraden.",
    who: ["popper", "degroot"],
    whoText: "<b>Popper:</b> Eine Hypothese ist nur dann wissenschaftlich, wenn sie Vorhersagen macht, die an der Erfahrung scheitern können.",
    pitfall: "<b>Falle:</b> Vage Hypothesen sind unwiderlegbar. „Mobilisation hilft manchen irgendwie“ verbietet kein einziges Studienergebnis.",
    tlink: true
  },
  {
    id: "pruefung", name: "Prüfung", angle: 120, kind: "empiric", mode: "Empirie · Vorhersage trifft Daten",
    what: "Neue Daten werden gezielt erhoben, um die Vorhersage zu prüfen. Design, Fallzahl und Analyse werden vorher festgelegt.",
    example: "Randomisierte Studie mit zwei Gruppen, Fallzahl aus einer Poweranalyse, primärer Endpunkt Schmerz auf der VAS nach sechs Wochen. Auswertung mit dem <b>t-Test</b> für unabhängige Stichproben.",
    who: ["popper", "box", "degroot"],
    whoText: "<b>Box:</b> Statistik ist das Werkzeug an der Nahtstelle zwischen Modell und Daten. <b>Popper:</b> Der Test ist ein ernsthafter Versuch, die eigene Hypothese zu widerlegen.",
    pitfall: "<b>Falle:</b> Eine zu kleine Studie hat zu wenig Power. Sie kann einen echten Effekt kaum entdecken, und der Zyklus dreht sich ins Leere.",
    tlink: true
  },
  {
    id: "bewertung", name: "Bewertung", angle: 180, kind: "empiric", mode: "Empirie · Was folgt daraus?",
    what: "Das Ergebnis wird auf die Hypothese zurückbezogen. Sie hat sich vorläufig bewährt, muss eingeschränkt werden oder ist gescheitert. In jedem Fall entstehen neue Fragen.",
    example: "<b>Signifikant:</b> Die Hypothese hat sich bewährt, bewiesen ist sie nicht.<br><b>Nicht signifikant:</b> Die Hypothese ist nicht automatisch widerlegt, vielleicht war die Power zu gering.<br><b>Neue Fragen:</b> Für wen wirkt es? In welcher Dosis? Wie lange hält der Effekt?",
    who: ["popper", "box", "degroot"],
    whoText: "<b>Popper:</b> Hypothesen werden nie verifiziert, nur bewährt oder falsifiziert. <b>Box:</b> Jede Antwort ist der Anfang der nächsten Iteration.",
    pitfall: "<b>Falle:</b> „Nicht signifikant“ heißt nicht „kein Effekt“. Und ein einzelnes signifikantes Ergebnis kann ein Alpha-Fehler sein."
  }
];

const PEOPLE = [
  { id: "peirce", initials: "CP", name: "Charles S. Peirce", years: "1839 bis 1914", role: "Philosoph und Logiker, USA", color: "var(--person-1)",
    idea: "Unterschied drei Schlussarten: Deduktion, Induktion und Abduktion. Nur die Abduktion bringt neue Hypothesen hervor.",
    work: "Begründer des Pragmatismus" },
  { id: "popper", initials: "KP", name: "Karl Popper", years: "1902 bis 1994", role: "Wissenschaftsphilosoph, Wien und London", color: "var(--person-2)",
    idea: "Theorien lassen sich nicht beweisen, nur an der Erfahrung prüfen. Gute Hypothesen sind kühn und können scheitern.",
    work: "Logik der Forschung, 1934" },
  { id: "degroot", initials: "AG", name: "Adriaan de Groot", years: "1914 bis 2006", role: "Psychologe und Methodiker, Niederlande", color: "var(--person-3)",
    idea: "Beschrieb den empirischen Zyklus in fünf Phasen: Beobachtung, Induktion, Deduktion, Prüfung, Bewertung.",
    work: "Methodologie, 1961" },
  { id: "box", initials: "GB", name: "George E. P. Box", years: "1919 bis 2013", role: "Statistiker, England und USA", color: "var(--person-4)",
    idea: "Sah Forschung als iteratives Wechselspiel zwischen Theorie und Daten, mit der Statistik als Motor dazwischen.",
    work: "Science and Statistics, 1976" }
];

const NS = "http://www.w3.org/2000/svg";
const CX = 280, CY = 290, R = 180, NODE_R = 52;
const $ = id => document.getElementById(id);
const rad = d => d * Math.PI / 180;
const pt = (deg, r = R) => [CX + r * Math.sin(rad(deg)), CY - r * Math.cos(rad(deg))];

let current = 0;
let person = null;

function arc(a1, a2, off1, off2) {
  // Kreisbogen im Uhrzeigersinn von a1 nach a2, an beiden Enden um den Knotenradius gekürzt
  if (a2 <= a1) a2 += 360;
  const s = a1 + off1, e = a2 - off2;
  const [x1, y1] = pt(s), [x2, y2] = pt(e);
  const large = (e - s) > 180 ? 1 : 0;
  return `M${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)}`;
}

function build() {
  const svg = $("cycle");
  const nodeOff = (NODE_R + 8) / R * 180 / Math.PI;
  const hypOff = 58 / R * 180 / Math.PI;
  let s = `<defs><marker id="head" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke"/></marker></defs>`;
  // Hintergrund: oben Theorie, unten Empirie
  s += `<rect x="0" y="0" width="560" height="${CY}" fill="var(--theory-band)"/>`;
  s += `<rect x="0" y="${CY}" width="560" height="${560 - CY}" fill="var(--empiric-band)"/>`;
  s += `<line x1="0" x2="560" y1="${CY}" y2="${CY}" stroke="var(--line)" stroke-dasharray="4 5"/>`;
  s += `<text class="band-label" x="16" y="26">WELT DER THEORIE</text>`;
  s += `<text class="band-label" x="16" y="${560 - 14}">WELT DER DATEN</text>`;
  // Kanten
  const edges = [
    { from: 236, to: 300, o1: nodeOff, o2: nodeOff, label: "Abduktion", la: 268, step: 1 },
    { from: 300, to: 360, o1: nodeOff, o2: hypOff, label: "", la: 330, step: 1 },
    { from: 0, to: 60, o1: hypOff, o2: nodeOff, label: "", la: 30, step: 2 },
    { from: 60, to: 120, o1: nodeOff, o2: nodeOff, label: "Vorhersage", la: 90, step: 3 },
    { from: 120, to: 180, o1: nodeOff, o2: nodeOff, label: "Daten", la: 150, step: 4 },
    { from: 180, to: 236, o1: nodeOff, o2: nodeOff, label: "neue Fragen", la: 208, step: 0 }
  ];
  edges.forEach((e, i) => {
    s += `<path class="edge" data-step="${e.step}" id="edge-${i}" d="${arc(e.from, e.to, e.o1, e.o2)}" marker-end="url(#head)"/>`;
    if (e.label) {
      const [x, y] = pt(e.la, R + 30);
      const anchor = Math.abs(x - CX) < 20 ? "middle" : (x > CX ? "start" : "end");
      s += `<text class="edge-label" data-step="${e.step}" x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${anchor}">${e.label}</text>`;
    }
  });
  // Hypothese als Scheitelpunkt
  const [hx, hy] = pt(0);
  s += `<g class="hyp" id="hyp"><rect x="${hx - 56}" y="${hy - 18}" width="112" height="36" rx="18"/><text x="${hx}" y="${hy + 5}" text-anchor="middle">Hypothese</text></g>`;
  // Knoten
  STATIONS.forEach((st, i) => {
    const [x, y] = pt(st.angle);
    s += `<g class="node" data-i="${i}" role="button" tabindex="0" aria-label="Station ${i + 1}: ${st.name}">
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${NODE_R}"/>
      <text class="n-no" x="${x.toFixed(1)}" y="${(y - 8).toFixed(1)}" text-anchor="middle">${i + 1}</text>
      <text class="n-lbl" x="${x.toFixed(1)}" y="${(y + 12).toFixed(1)}" text-anchor="middle">${st.name}</text>
    </g>`;
  });
  // Mitte: Leitfrage
  s += `<text x="${CX}" y="${CY - 8}" text-anchor="middle" style="font-size:13px;fill:var(--muted)">Theorie und Daten</text>`;
  s += `<text x="${CX}" y="${CY + 14}" text-anchor="middle" style="font-size:13px;fill:var(--muted)">prüfen sich gegenseitig</text>`;
  svg.innerHTML = s;

  svg.querySelectorAll(".node").forEach(g => {
    g.addEventListener("click", () => go(+g.dataset.i));
    g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(+g.dataset.i); } });
  });

  $("people").innerHTML = PEOPLE.map(p => {
    const initials = p.initials;
    const stations = STATIONS.filter(st => st.who.includes(p.id)).map(st => `<span class="chip">${st.name}</span>`).join("");
    return `<button class="person" type="button" data-p="${p.id}" aria-pressed="false">
      <div class="person-top"><span class="mono" style="background:${p.color}" aria-hidden="true">${initials}</span>
      <div><h3>${p.name}</h3><div class="years">${p.years}</div></div></div>
      <div class="role">${p.role}</div>
      <p class="idea">${p.idea}</p>
      <div class="work">${p.work}</div>
      <div class="stations">${stations}</div>
    </button>`;
  }).join("");
  document.querySelectorAll(".person").forEach(b => b.addEventListener("click", () => {
    person = person === b.dataset.p ? null : b.dataset.p;
    document.querySelectorAll(".person").forEach(x => x.setAttribute("aria-pressed", x.dataset.p === person));
    if (person) { const first = STATIONS.findIndex(st => st.who.includes(person)); if (!STATIONS[current].who.includes(person)) current = first; }
    render();
  }));
}

function render() {
  const st = STATIONS[current];
  document.querySelectorAll("#cycle .node").forEach(g => {
    const i = +g.dataset.i, s = STATIONS[i], on = i === current;
    const col = s.kind === "theory" ? "var(--theory)" : "var(--empiric)";
    const c = g.querySelector("circle");
    c.setAttribute("fill", on ? col : "var(--surface)");
    c.setAttribute("stroke", col);
    g.querySelectorAll("text").forEach(t => t.setAttribute("fill", !on ? "var(--fg)" : s.kind === "theory" ? "var(--on-theory)" : "var(--on-empiric)"));
    g.classList.toggle("dim", !!person && !s.who.includes(person));
    g.setAttribute("aria-current", on ? "step" : "false");
  });
  document.querySelectorAll("#cycle .edge, #cycle .edge-label").forEach(e => {
    e.classList.toggle("active", +e.dataset.step === current);
  });
  // Hervorgehoben ist jeweils der Weg, der zur aktuellen Station führt
  $("hyp").classList.toggle("dim", !!person && !["induktion", "deduktion"].some(id => STATIONS.find(s => s.id === id).who.includes(person)));

  const who = st.who.map(id => PEOPLE.find(p => p.id === id).name).join(" · ");
  $("detail").innerHTML = `
    <span class="mode ${st.kind}">${st.mode}</span>
    <h2>${current + 1} · ${st.name}</h2>
    <p class="what">${st.what}</p>
    <div class="example">${st.example}</div>
    <p class="who">${st.whoText}</p>
    <p class="pitfall">${st.pitfall}</p>
    ${st.tlink ? `<p class="tlink"><a href="../t-test/">Diesen Schritt in der t-Test-Kaskade ansehen →</a></p>` : ""}
    <p class="who">Geprägt von: ${who}</p>`;
  $("step-count").textContent = `${current + 1} von ${STATIONS.length}`;
}

function go(i) { current = (i + STATIONS.length) % STATIONS.length; render(); }
$("prev").addEventListener("click", () => go(current - 1));
$("next").addEventListener("click", () => go(current + 1));
document.addEventListener("keydown", e => {
  if (e.target.closest && e.target.closest("input, textarea")) return;
  if (e.key === "ArrowRight") go(current + 1);
  if (e.key === "ArrowLeft") go(current - 1);
});

build();
render();
})();
