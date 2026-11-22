/* Übung Differenz der Differenzen (Bizeps, fiktiver Datensatz) · Stats Lab */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const fmt = (x, d = 2) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");
const tz = x => String(x).replace(/\./g, "{.}").replace(/,/g, "{,}").replace(/−/g, "-");
const TB = (t, fb) => window.katex ? texBlock(t) : fb;
const fp = p => p < 0.001 ? "< 0,001" : fmt(p, 3);
const LG = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
function lgamma(x) { if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x); x -= 1; let a = 0.99999999999980993; const t = x + 7.5; for (let i = 0; i < 8; i++) a += LG[i] / (x + i + 1); return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a); }
function betacf(a, b, x) { const FP = 1e-300; let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < FP) d = FP; d = 1 / d; let h = d; for (let m = 1; m <= 400; m++) { const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2)); d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; h *= d * c; aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2)); d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-14) break; } return h; }
function ibeta(x, a, b) { if (x <= 0) return 0; if (x >= 1) return 1; const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)); return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b; }
const tcdf = (t, df) => { const ib = ibeta(df / (df + t * t), df / 2, 0.5); return t >= 0 ? 1 - 0.5 * ib : 0.5 * ib; };
function tinv(p, df) { let lo = -1e9, hi = 1e9; for (let i = 0; i < 140; i++) { const m = (lo + hi) / 2; if (tcdf(m, df) < p) lo = m; else hi = m; } return (lo + hi) / 2; }
const C = window.BIZEPS.cols, D = window.BIZEPS.rows, col = k => D.map(r => r[C.indexOf(k)]);
const r1 = x => Math.round(x * 10) / 10;
const tv = col("train_vor"), tn = col("train_nach"), kv = col("kontr_vor"), kn = col("kontr_nach"), n = D.length;
const dT = tn.map((v, i) => r1(v - tv[i])), dK = kn.map((v, i) => r1(v - kv[i])), dD = dT.map((v, i) => r1(v - dK[i]));
const mean = v => v.reduce((a, x) => a + x, 0) / v.length, sd = v => { const m = mean(v); return Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / (v.length - 1)); };
function ttest(v) { const m = mean(v), s = sd(v), se = s / Math.sqrt(n), df = n - 1, t = m / se, p = 2 * (1 - tcdf(Math.abs(t), df)), tc = tinv(0.975, df); return { m, s, se, df, t, p, lo: m - tc * se, hi: m + tc * se, tc }; }
const T = ttest(dT), K = ttest(dK), X = ttest(dD);
$("did-f").innerHTML = TB(String.raw`\begin{aligned} \text{Effekt} &= (\text{nachher} - \text{vorher})_{\text{Training}} \\ &\quad - (\text{nachher} - \text{vorher})_{\text{Kontrolle}} \end{aligned}`, "<span>Effekt = Veränderung Trainingsarm − Veränderung Kontrollarm</span>") + `<span class="dim">Die erste Klammer enthält Training und Messeffekte, die zweite nur Messeffekte. Die Differenz lässt das Training übrig.</span>`;
const f1 = v => fmt(v, 1);
$("did-tab").innerHTML = `<thead><tr><th>Person</th><th>Training vorher</th><th>Training nachher</th><th>Kontrolle vorher</th><th>Kontrolle nachher</th><th class="calc">Δ Training</th><th class="calc">Δ Kontrolle</th><th class="calc">Differenz der Δ</th></tr></thead><tbody>` +
  D.map((r, i) => `<tr><td>${r[0]}</td><td>${f1(tv[i])}</td><td>${f1(tn[i])}</td><td>${f1(kv[i])}</td><td>${f1(kn[i])}</td><td class="calc">${f1(dT[i])}</td><td class="calc">${f1(dK[i])}</td><td class="calc">${f1(dD[i])}</td></tr>`).join("") +
  `</tbody><tfoot><tr><td>Mittelwert</td><td>${fmt(mean(tv), 2)}</td><td>${fmt(mean(tn), 2)}</td><td>${fmt(mean(kv), 2)}</td><td>${fmt(mean(kn), 2)}</td><td class="calc">${fmt(T.m, 2)}</td><td class="calc">${fmt(K.m, 2)}</td><td class="calc">${fmt(X.m, 2)}</td></tr></tfoot>`;
$("show-diff").addEventListener("click", e => { const t = $("did-tab"); t.classList.toggle("show"); e.target.textContent = t.classList.contains("show") ? "Berechnete Spalten ausblenden" : "Berechnete Spalten einblenden"; });
const res = (R, lab) => `<div class="formula">` + TB(String.raw`\begin{aligned} \bar{d} &= ${tz(fmt(R.m, 3))}\ \text{cm} \\ s_d &= ${tz(fmt(R.s, 3))} \\ SE &= \dfrac{s_d}{\sqrt{n}} = \dfrac{${tz(fmt(R.s, 3))}}{\sqrt{${n}}} = ${tz(fmt(R.se, 3))} \\ t &= \dfrac{${tz(fmt(R.m, 3))}}{${tz(fmt(R.se, 3))}} = ${tz(fmt(R.t, 2))} \\ df &= ${R.df}, \quad p ${R.p < 0.001 ? "< 0{,}001" : "= " + tz(fmt(R.p, 3))} \\ \text{KI}_{95\,\%} &= ${tz(fmt(R.m, 2))} \pm ${tz(fmt(R.tc, 3))} \cdot ${tz(fmt(R.se, 3))} \\ &= [${tz(fmt(R.lo, 2))};\ ${tz(fmt(R.hi, 2))}]\ \text{cm} \end{aligned}`, "") + `</div>`;
$("sol-t").innerHTML = res(T) + `<p>Der Trainingsarm ist im Mittel um <b>${fmt(T.m, 2)} cm</b> dicker geworden, hochsignifikant (p ${fp(T.p)}). Wer hier aufhört, schreibt: „Kettlebell-Curls vergrößern den Oberarmumfang um gut einen Zentimeter.“</p>`;
$("sol-k").innerHTML = res(K) + `<p>Erwartet hätte man: keine Veränderung, denn dieser Arm hat nicht trainiert. Gefunden: <b>+${fmt(K.m, 2)} cm</b>, und das ist sogar signifikant (p = ${fmt(K.p, 3)}). Der Kontrollarm „wächst“ also auch. Das kann nicht am Training liegen, sondern an allem anderen, was sich zwischen den Messungen ändert: Messperson, Wärme, Durchblutung.</p>`;
$("sol-d").innerHTML = res(X) + `<p>Die Differenz der Differenzen beträgt <b>${fmt(X.m, 2)} cm</b> (95-%-KI ${fmt(X.lo, 2)} bis ${fmt(X.hi, 2)}). Rechnerisch ist sie genau die Veränderung des Trainingsarms minus die des Kontrollarms: ${fmt(T.m, 2)} − ${fmt(K.m, 2)} = ${fmt(T.m - K.m, 2)}. Der Test ist ein gewöhnlicher Einstichproben-t-Test, nur auf eine geschickt gebildete Variable.</p>`;
(() => {
  const W = 640, H = 320, L = 70, R = 170, Tp = 20, B = 270, lo = Math.floor(Math.min(mean(kv), mean(tv)) - 0.5), hi = Math.ceil(Math.max(mean(tn), mean(kn)) + 0.5);
  const y = v => B - (v - lo) / (hi - lo) * (B - Tp), xa = L + 40, xb = W - R - 40;
  let s = "";
  for (let v = lo; v <= hi + 1e-9; v += 0.5) s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${fmt(v, 1)}</text>`;
  s += `<text x="${xa}" y="${B + 22}" text-anchor="middle" class="strong">vorher</text><text x="${xb}" y="${B + 22}" text-anchor="middle" class="strong">nachher</text><text x="16" y="${(Tp + B) / 2}" transform="rotate(-90 16 ${(Tp + B) / 2})" text-anchor="middle">Mittelwert in cm</text>`;
  const cf = mean(tv) + K.m;
  s += `<line x1="${xa}" x2="${xb}" y1="${y(mean(kv))}" y2="${y(mean(kn))}" stroke="var(--kontrolle)" stroke-width="3.5"/><line x1="${xa}" x2="${xb}" y1="${y(mean(tv))}" y2="${y(mean(tn))}" stroke="var(--therapie)" stroke-width="3.5"/>`;
  s += `<line x1="${xa}" x2="${xb}" y1="${y(mean(tv))}" y2="${y(cf)}" stroke="var(--therapie)" stroke-width="2" stroke-dasharray="6 5"/>`;
  [[mean(kv), mean(kn), "var(--kontrolle)"], [mean(tv), mean(tn), "var(--therapie)"]].forEach(([a, b, c]) => s += `<circle cx="${xa}" cy="${y(a)}" r="6" fill="${c}"/><circle cx="${xb}" cy="${y(b)}" r="6" fill="${c}"/>`);
  s += `<line x1="${xb + 14}" x2="${xb + 14}" y1="${y(cf)}" y2="${y(mean(tn))}" stroke="var(--beta-ink)" stroke-width="5"/><text x="${xb + 24}" y="${(y(cf) + y(mean(tn))) / 2 + 5}" class="strong" style="fill:var(--beta-ink)">Pump ${fmt(X.m, 2)} cm</text>`;
  s += `<text x="${xb + 24}" y="${y(mean(kn)) + 5}" style="fill:var(--kontrolle)">Kontrollarm +${fmt(K.m, 2)}</text><text x="${xb + 24}" y="${y(cf) + 18}" style="fill:var(--therapie)">ohne Training erwartet</text>`;
  $("did-plot").innerHTML = s;
})();
$("sol-i-text").innerHTML = `<p>Durchgezogen die tatsächlichen Mittelwerte, gestrichelt der Verlauf, den der Trainingsarm ohne Training vermutlich genommen hätte: parallel zum Kontrollarm. Der violette Abstand ist der Pump.</p><p><b>Der Pump beträgt ${fmt(X.m, 2)} cm, nicht ${fmt(T.m, 2)} cm.</b> Der naive gepaarte t-Test aus Schritt 2 hat den Effekt um ${fmt((T.m - X.m) / X.m * 100, 0)} % überschätzt, weil er Messeffekte mitzählt. Hier ist der Pump auch nach der Korrektur deutlich. Wäre der echte Effekt kleiner, könnte ein naiv „signifikantes“ Ergebnis allein aus Messeffekten entstehen.</p><p>Ohne Kontrollarm hätte niemand bemerkt, dass ein Teil der Veränderung gar nicht vom Training kommt. Deshalb braucht jede Vorher-nachher-Untersuchung eine Kontrolle, und deshalb haben randomisierte Studien eine Kontrollgruppe.</p>`;
})();
