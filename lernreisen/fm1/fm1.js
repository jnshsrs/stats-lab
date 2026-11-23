/* Lernreise FM1, Teil Inferenzstatistik · Stats Lab
   Stationen in fester Reihenfolge mit Kurzbeschreibung, Lernziel, Vertiefungen und einer Frage zur Selbstkontrolle.
   Der Fortschritt („erledigt“) liegt nur im Browser (localStorage). Pfade relativ zur Seite lernreisen/fm1/. */
(() => {
"use strict";
const R = "../../";
const STOPS = [
  { id: "wahrscheinlichkeit", blk: "Grundlagen", t: "Wahrscheinlichkeit als Fläche", href: "grundlagen/wahrscheinlichkeit/",
    d: "Wahrscheinlichkeiten als Anteile einer Fläche: Wann darf man multiplizieren, was heißt „bedingt“, und wie dreht der Satz von Bayes eine bedingte Wahrscheinlichkeit um?",
    can: "P(A | B) und P(B | A) unterscheiden und erklären, warum sie verschieden groß sein können.",
    deep: [["hintergrund/mammografie/", "Mammografie: Wie wahrscheinlich ist Krebs bei positivem Befund?"], ["hintergrund/klinische-tests/", "Klinische Tests: Sensitivität, Spezifität und Likelihood-Ratios"]],
    q: { type: "ab", a: "P(positiver Test | erkrankt) ist dasselbe wie P(erkrankt | positiver Test).", b: "Bei einer seltenen Erkrankung kann ein positiver Befund trotz hoher Sensitivität meist falsch-positiv sein.", right: 1,
      why: "Aussage A verwechselt die Bedingung: Die Sensitivität fragt, wie oft Erkrankte positiv getestet werden, der positive Vorhersagewert, wie oft positiv Getestete erkrankt sind. B stimmt: Bei niedriger Prävalenz überwiegen die Falsch-Positiven." } },
  { id: "binomial", blk: "Grundlagen", t: "Pascal und die Binomialverteilung", href: "grundlagen/binomial/",
    d: "Wie wahrscheinlich sind k Erfolge in n unabhängigen Versuchen mit derselben Erfolgswahrscheinlichkeit p? Hergeleitet über das Pascal'sche Dreieck.",
    can: "Erwartungswert n · p angeben und die Form der Verteilung für verschiedene n und p beschreiben.",
    deep: [["grundlagen/verteilungen/#p-diskret", "Die Binomialverteilung als diskrete Verteilung"]],
    q: { type: "sc", p: "Ein Palpationstest wird an 20 Personen geprüft. Wenn nur geraten wird, ist die Trefferwahrscheinlichkeit 0,5. Welche Aussage stimmt?", o: ["Am wahrscheinlichsten sind 10 Treffer, und 20 Treffer sind sehr unwahrscheinlich.", "Jede Trefferzahl von 0 bis 20 ist gleich wahrscheinlich.", "20 Treffer sind wahrscheinlicher als 10, weil 20 die höchste Zahl ist.", "Die Verteilung ist stetig, weil die Wahrscheinlichkeit 0,5 beträgt."], right: 0,
      why: "Der Erwartungswert ist n · p = 10. Trefferzahlen nahe 10 sind am wahrscheinlichsten, extreme Zahlen wie 0 oder 20 sehr selten. Die Verteilung ist diskret, weil nur ganze Trefferzahlen möglich sind." } },
  { id: "verteilungen", blk: "Grundlagen", t: "Diskret und stetig", href: "grundlagen/verteilungen/",
    d: "Bei Zählungen ist die Wahrscheinlichkeit eine Balkenhöhe, bei Messwerten eine Fläche unter der Kurve. Was diskrete und stetige Verteilungen unterscheidet.",
    can: "Wahrscheinlichkeiten stetiger Größen als Flächen unter der Kurve lesen.",
    deep: [["glossar/#verteilungen-quantil", "Glossar: Quantil"]],
    q: { type: "sc", p: "Die Prüfgröße eines Tests ist stetig verteilt. Wie groß ist die Wahrscheinlichkeit, dass sie genau den Wert 1,96 annimmt?", o: ["0", "0,05", "0,025", "Das hängt von der Standardabweichung ab."], right: 0,
      why: "Bei stetigen Verteilungen haben nur Bereiche eine Fläche, ein einzelner Punkt hat die Fläche 0. Deshalb fragt man immer nach „mindestens so extrem“ und nie nach „genau dieser Wert“." } },
  { id: "stichprobe", blk: "Schätzen", t: "Stichprobe und Population", href: "schaetzen/stichprobe/",
    d: "Die Population kennt niemand, man sieht nur eine Stichprobe. Zwei Arten von Streuung: die der einzelnen Messwerte und die der Mittelwerte vieler Stichproben.",
    can: "Parameter und Kennwert unterscheiden und erklären, welche Streuung mit größerem n kleiner wird.",
    deep: [["schaetzen/grosse-zahlen/", "Große und kleine Zahlen: warum kleine Stichproben extreme Ergebnisse liefern"]],
    q: { type: "ab", a: "Mit größerer Stichprobe wird die Standardabweichung der einzelnen Messwerte kleiner.", b: "Mit größerer Stichprobe schwanken die Mittelwerte wiederholter Stichproben weniger.", right: 1,
      why: "Die Standardabweichung beschreibt, wie verschieden Menschen sind. Daran ändert eine größere Stichprobe nichts, sie wird nur genauer geschätzt. Der Mittelwert dagegen wird mit wachsendem n stabiler: Das misst der Standardfehler." } },
  { id: "zgws", blk: "Schätzen", t: "Grenzwertsatz, Standardfehler, Konfidenzintervall", href: "schaetzen/zgws/",
    d: "Mittelwerte sind annähernd normalverteilt, egal wie die Daten verteilt sind (zentraler Grenzwertsatz). Ihre Streuung ist der Standardfehler, und daraus entsteht das Konfidenzintervall.",
    can: "Den Standardfehler aus SD und n bestimmen und vorhersagen, wie sich die Breite des Konfidenzintervalls mit n und Konfidenzniveau ändert.",
    deep: [["testen/t-test/#ci-exkurs", "Exkurs: p-Wert oder Konfidenzintervall, kommen sie immer zum selben Ergebnis?"], ["testen/t-test-varianten/#ov-exkurs", "Exkurs: Überlappende Konfidenzintervalle, trotzdem signifikant?"], ["glossar/#zgws-standardfehler-se", "Glossar: Standardfehler"]],
    q: { type: "sc", p: "Eine Studie wird mit viermal so vielen Personen wiederholt, alles andere bleibt gleich. Was passiert mit dem 95-%-Konfidenzintervall für den Mittelwert?", o: ["Es wird etwa halb so breit.", "Es wird etwa ein Viertel so breit.", "Es bleibt gleich breit, weil das Konfidenzniveau gleich bleibt.", "Es wird breiter, weil mehr Messwerte mehr Streuung bringen."], right: 0,
      why: "Der Standardfehler ist SD ÷ √n. Vervierfacht man n, halbiert sich √n im Nenner, also halbiert sich der Standardfehler und mit ihm die Breite des Intervalls." } },
  { id: "binomialtest", blk: "Testen", t: "Binomialtest: Annahme- und Ablehnungsbereich", href: "testen/binomialtest/",
    d: "Der erste Signifikanztest: Hypothesen formulieren, vor dem Versuch den Ablehnungsbereich festlegen, das Ergebnis einordnen, den p-Wert als Summe extremer Ergebnisse berechnen. Gerichtet oder ungerichtet?",
    can: "H0 und H1 formulieren, den p-Wert korrekt interpretieren und einseitige von zweiseitigen Hypothesen unterscheiden.",
    deep: [["hintergrund/inferenzzyklus/", "Induktion, Deduktion und der Signifikanztest: was ein Test logisch leistet"], ["glossar/#binomialtest-p-wert", "Glossar: p-Wert"]],
    q: { type: "sc", p: "Ein Test liefert p = 0,03. Was bedeutet das?", o: ["Mit 3 % Wahrscheinlichkeit stimmt die Nullhypothese.", "Wenn H0 stimmt, wäre ein mindestens so extremes Ergebnis mit 3 % Wahrscheinlichkeit zu erwarten.", "Der Effekt beträgt 3 %.", "Mit 97 % Wahrscheinlichkeit stimmt die Alternativhypothese."], right: 1,
      why: "Der p-Wert ist eine Wahrscheinlichkeit für Daten unter der Annahme, dass H0 stimmt, keine Wahrscheinlichkeit für eine Hypothese. Über die Größe des Effekts sagt er nichts." } },
  { id: "z-test", blk: "Testen", t: "Der z-Test", href: "testen/z-test/",
    d: "Bei großen Stichproben lässt sich die Binomialverteilung durch die Normalverteilung nähern. Der z-Wert misst, wie viele Standardfehler ein Ergebnis von der Nullhypothese entfernt liegt.",
    can: "Einen z-Wert als Abstand in Standardfehlern lesen und mit der Grenze 1,96 vergleichen.",
    deep: [["testen/z-test/#acc-3", "Ausblick: Was passiert, wenn man die Standardabweichung schätzen muss?"]],
    q: { type: "sc", p: "Ein Ergebnis liegt 2,5 Standardfehler über dem Wert der Nullhypothese. Zweiseitig getestet bei α = 5 %, was folgt?", o: ["H0 wird verworfen, weil 2,5 jenseits von 1,96 liegt.", "H0 wird beibehalten, weil 2,5 kleiner als 3 ist.", "Ohne n lässt sich nichts sagen.", "H0 wird nur bei einseitiger Hypothese verworfen."], right: 0,
      why: "Zweiseitig liegt die Grenze bei α = 5 % bei ±1,96 Standardfehlern. Der Stichprobenumfang steckt bereits im Standardfehler." } },
  { id: "t-test", blk: "Testen", t: "Die t-Test-Kaskade", href: "testen/t-test/",
    d: "Signal geteilt durch Rauschen ergibt t. Woher der kritische Wert kommt, wo das beobachtete t unter H0 liegt und wie daraus der p-Wert wird.",
    can: "Vorhersagen, wie sich t, kritischer Wert und p-Wert ändern, wenn sich Mittelwertdifferenz, Streuung, n oder α ändern.",
    deep: [["testen/t-test/#calc", "Quantile in der Praxis: den kritischen Wert aus Tabelle und Verteilungsfunktion ablesen"], ["testen/t-test/#ci-exkurs", "Exkurs: p-Wert oder Konfidenzintervall?"]],
    q: { type: "sc", p: "Ein ungenaueres Messgerät erhöht die Standardabweichung der Messwerte, alles andere bleibt gleich. Was passiert?", o: ["t wird kleiner und der p-Wert größer.", "t wird größer und der p-Wert kleiner.", "t bleibt gleich, nur das Konfidenzintervall wird breiter.", "Der kritische t-Wert sinkt."], right: 0,
      why: "Die Standardabweichung steht im Nenner von t. Mehr Rauschen macht t kleiner, der p-Wert steigt. Der kritische Wert hängt nur von α und den Freiheitsgraden ab und bleibt gleich." } },
  { id: "t-test-varianten", blk: "Testen", t: "Welcher t-Test?", href: "testen/t-test-varianten/",
    d: "Einstichproben-, gepaarter und ungepaarter t-Test: dieselbe Logik, andere Fragen. Mit einem Entscheidungsweg, welcher Test zu welchem Design passt.",
    can: "Für eine Studie den passenden t-Test wählen und begründen.",
    deep: [["testen/t-test-varianten/#acc-3", "Übung: Vorher-nachher mit Kontrolle (Bizeps-Beispiel)"], ["hintergrund/regression-mitte/", "Regression zur Mitte: warum Vorher-nachher ohne Kontrolle täuschen kann"]],
    q: { type: "sc", p: "Bei 12 Personen wird der Bizepsumfang vor und nach sechs Wochen Training gemessen. Welcher Test passt?", o: ["Gepaarter t-Test", "Ungepaarter t-Test", "Einstichproben-t-Test gegen den Vorher-Mittelwert", "Binomialtest"], right: 0,
      why: "Dieselben Personen werden zweimal gemessen. Der gepaarte t-Test nutzt die Differenzen je Person und rechnet die Unterschiede zwischen den Personen heraus." } },
  { id: "entscheidung", blk: "Testen", t: "Entscheidungstheorie: α, β und Power", href: "testen/entscheidung/",
    d: "Jede Testentscheidung kann falsch sein: H0 zu Unrecht verwerfen (α-Fehler) oder einen echten Effekt übersehen (β-Fehler). Power, die Verteilung unter H1 und die Frage, was Fehler kosten.",
    can: "α, β und Power an einem Beispiel erklären und sagen, wie sie zusammenhängen.",
    deep: [["grundlagen/effektgroessen/", "Effektgrößen: signifikant heißt nicht relevant"], ["testen/multiples-testen/", "Multiples Testen: warum viele Tests viele Fehlalarme bringen"], ["glossar/#entscheidung-power-teststaerke", "Glossar: Power"]],
    q: { type: "ab", a: "Senkt man α von 5 % auf 1 %, steigt bei gleichem n die Wahrscheinlichkeit, einen echten Effekt zu übersehen.", b: "Ein nicht signifikantes Ergebnis beweist, dass die Nullhypothese stimmt.", right: 0,
      why: "A stimmt: Eine strengere Schwelle verwirft seltener, auch dann, wenn ein Effekt existiert; β steigt, die Power sinkt. B ist falsch: Ein nicht signifikantes Ergebnis kann auch an zu geringer Power liegen." } },
  { id: "fallzahl", blk: "Testen", t: "Fallzahl und Power", href: "testen/fallzahl/",
    d: "Wie viele Personen braucht eine Studie? Fallzahl, Effekt, Streuung, α und Power hängen zusammen; kennt man vier, ergibt sich der fünfte.",
    can: "Vorhersagen, in welche Richtung sich die Fallzahl ändert, wenn sich Effekt, Streuung, α oder Power ändern.",
    deep: [["testen/entscheidung/#info-verteilungen", "Woher der angenommene Effekt kommt: die MCID am Beispiel Rückenschmerz"], ["grundlagen/effektgroessen/", "Effektgrößen: Cohen's d und klinische Relevanz"]],
    q: { type: "sc", p: "Welche Änderung erhöht die benötigte Fallzahl?", o: ["Man erwartet einen kleineren Effekt.", "Man lässt ein größeres α zu.", "Man gibt sich mit 70 % statt 80 % Power zufrieden.", "Die Messwerte streuen weniger."], right: 0,
      why: "Kleine Effekte sind schwerer vom Rauschen zu unterscheiden und brauchen mehr Personen. Die anderen drei Änderungen senken die nötige Fallzahl." } }
];
const KEY = "statslab-lernreise-fm1";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } };
const save = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* Speicher nicht verfügbar */ } };
let done = load();
function question(s, i) {
  const q = s.q, opts = q.type === "ab" ? ["Nur A ist richtig.", "Nur B ist richtig.", "A und B sind richtig.", "Keine der beiden Aussagen ist richtig."] : q.o;
  const stem = q.type === "ab" ? `<p>Bewerten Sie die beiden Aussagen.</p><p><b>A:</b> ${q.a}</p><p><b>B:</b> ${q.b}</p>` : `<p>${q.p}</p>`;
  return `<details class="check-q"><summary>Selbstkontrolle</summary><div class="q" data-i="${i}">${stem}<div class="opts">${opts.map((o, k) => `<button type="button" data-k="${k}">${o}</button>`).join("")}</div><p class="fb" hidden></p></div></details>`;
}
function render() {
  document.getElementById("journey").innerHTML = STOPS.map((s, i) => `
    <li id="${s.id}" class="${done[s.id] ? "done" : ""}">
      <div class="node" aria-hidden="true">${i + 1}</div>
      <article class="stop">
        <span class="blk">Block ${s.blk}</span>
        <h2><a href="${R}${s.href}">${s.t}</a></h2>
        <p>${s.d}</p>
        <p class="can"><b>Danach können Sie:</b> ${s.can}</p>
        <div class="deeper"><span class="lbl">Zur Vertiefung</span><ul>${s.deep.map(([h, t]) => `<li><a href="${R}${h}">${t}</a></li>`).join("")}</ul></div>
        ${question(s, i)}
        <div class="foot"><a class="go" href="${R}${s.href}">Zur Station →</a><label class="done-chk"><input type="checkbox" data-id="${s.id}" ${done[s.id] ? "checked" : ""}> erledigt</label></div>
      </article>
    </li>`).join("");
  progress();
}
function progress() { const n = STOPS.filter(s => done[s.id]).length; document.getElementById("prog").textContent = n ? `${n} von ${STOPS.length} Stationen erledigt` : ""; }
const J = document.getElementById("journey");
J.addEventListener("change", e => { const c = e.target.closest("input[data-id]"); if (!c) return; done[c.dataset.id] = c.checked; if (!c.checked) delete done[c.dataset.id]; save(done); c.closest("li").classList.toggle("done", c.checked); progress(); });
J.addEventListener("click", e => {
  const b = e.target.closest(".opts button"); if (!b) return;
  const box = b.closest(".q"), s = STOPS[+box.dataset.i], k = +b.dataset.k, fb = box.querySelector(".fb");
  box.querySelectorAll(".opts button").forEach(x => x.classList.remove("right", "wrong"));
  b.classList.add(k === s.q.right ? "right" : "wrong");
  if (k !== s.q.right) box.querySelector(`button[data-k="${s.q.right}"]`).classList.add("right");
  fb.hidden = false; fb.innerHTML = `<b>${k === s.q.right ? "Richtig." : "Nicht ganz."}</b> ${s.q.why}`;
});
render();
})();
