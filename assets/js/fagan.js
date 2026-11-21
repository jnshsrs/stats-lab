/* Stats Lab · Fagan-Nomogramm (gemeinsam für Mammografie und Klinische Tests)
   Drei Achsen: Vortestwahrscheinlichkeit (links, Logit), Likelihood-Ratio (Mitte, log), Nachtestwahrscheinlichkeit (rechts, Logit umgekehrt).
   Eine Gerade von links durch die Mitte trifft rechts genau die Nachtestwahrscheinlichkeit, weil logit(post) = logit(pre) + ln(LR). */
window.drawFagan = function (svg, pre, lrPos, lrNeg) {
  const W = 600, H = 460, T = 40, B = 420, XL = 100, XM = 245, XR = 390;
  const lg = p => Math.log(p / (1 - p));
  const span = lg(0.999) - lg(0.001), a = (B - T) / span, c = (T + B) / 2;
  const yL = p => c + a * lg(p), yR = p => c - a * lg(p), yM = lr => c - (a / 2) * Math.log(lr);
  const clampP = p => Math.min(0.999, Math.max(0.001, p));
  const P = [0.001, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.3, 0.5, 0.7, 0.8, 0.9, 0.95, 0.98, 0.99, 0.995, 0.999];
  const LR = [0.001, 0.01, 0.1, 0.2, 0.5, 1, 2, 5, 10, 100, 1000];
  const pl = p => { const v = p * 100; return (v < 1 ? v.toLocaleString("de-DE", { maximumFractionDigits: 1 }) : v.toLocaleString("de-DE", { maximumFractionDigits: 1 })) + " %"; };
  const ll = v => v.toLocaleString("de-DE", { maximumFractionDigits: 3 });
  let s = "";
  s += `<text x="${XL}" y="18" text-anchor="middle" class="fg-h">Vortest</text><text x="${XM}" y="18" text-anchor="middle" class="fg-h">Likelihood-Ratio</text><text x="${XR}" y="18" text-anchor="middle" class="fg-h">Nachtest</text>`;
  [XL, XM, XR].forEach(x => s += `<line x1="${x}" x2="${x}" y1="${T}" y2="${B}" stroke="var(--fg)" stroke-width="1.6"/>`);
  P.forEach(p => {
    s += `<line x1="${XL - 6}" x2="${XL}" y1="${yL(p)}" y2="${yL(p)}" stroke="var(--fg)"/><text x="${XL - 10}" y="${yL(p) + 4}" text-anchor="end" class="fg-t">${pl(p)}</text>`;
    s += `<line x1="${XR}" x2="${XR + 6}" y1="${yR(p)}" y2="${yR(p)}" stroke="var(--fg)"/><text x="${XR + 10}" y="${yR(p) + 4}" class="fg-t">${pl(p)}</text>`;
  });
  LR.forEach(v => s += `<line x1="${XM - 5}" x2="${XM + 5}" y1="${yM(v)}" y2="${yM(v)}" stroke="var(--fg)"/><text x="${XM + 9}" y="${yM(v) + 4}" class="fg-t">${ll(v)}</text>`);
  const line = (lr, col, lab) => {
    if (!(lr > 0) || !isFinite(lr)) return "";
    const post = clampP(1 / (1 + (1 - pre) / (pre * lr)));
    const y0 = yL(clampP(pre)), y2 = yR(post), ym = yM(Math.min(1000, Math.max(0.001, lr)));
    return `<line x1="${XL}" y1="${y0}" x2="${XR}" y2="${y2}" stroke="${col}" stroke-width="2.6"/><circle cx="${XM}" cy="${ym}" r="5" fill="${col}"/><circle cx="${XR}" cy="${y2}" r="6" fill="${col}"/><text x="${XR + 62}" y="${y2 + 4}" class="fg-v" style="fill:${col}">← ${lab === "+" ? "positiv" : "negativ"}: ${pl(post)}</text>`;
  };
  s += line(lrPos, "var(--therapie)", "+") + line(lrNeg, "var(--kontrolle)", "−");
  s += `<circle cx="${XL}" cy="${yL(clampP(pre))}" r="6" fill="var(--fg)"/><text x="${XL + 10}" y="${yL(clampP(pre)) - 8}" class="fg-v">${pl(pre)}</text>`;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = s;
};
