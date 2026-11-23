/* Stats Lab · LaTeX-Helfer auf Basis von KaTeX (lokal in assets/vendor/katex).
   tex(src, fallback): Inline-Formel als HTML; texBlock(src, fallback): abgesetzte Formel.
   texSteps(src, fallback): Rechenkette a = b = c als abgesetzte Formel, ein Gleichheitszeichen pro Zeile, am = ausgerichtet.
   Ohne KaTeX erscheint der Fallback. dz(x, d) formatiert Zahlen mit Dezimalkomma für LaTeX.
   Statische Formeln \( … \) und \[ … \] in Elementen mit class="tex-auto" werden beim Laden gesetzt. */
(() => {
  const render = (src, display, fb) => window.katex ? katex.renderToString(src, { throwOnError: false, displayMode: display }) : (fb ?? src);
  window.tex = (src, fb) => render(src, false, fb);
  window.texBlock = (src, fb) => render(src, true, fb);
  const split = src => { const out = []; let d = 0, last = 0;
    for (let i = 0; i < src.length; i++) { const ch = src[i];
      if (ch === "{" || ch === "(") d++; else if (ch === "}" || ch === ")") d--;
      else if (ch === "=" && d === 0 && !"<>!\\".includes(src[i - 1] || "")) { out.push(src.slice(last, i).trim()); last = i + 1; } }
    out.push(src.slice(last).trim()); return out; };
  window.texSteps = (src, fb) => { const p = split(src); if (p.length < 3) return render(src, true, fb);
    const gap = s => /\d?frac/.test(s) ? "\\\\[6pt]" : "\\\\[3pt]";
    const rows = p.slice(1).map((x, i) => (i ? "" : p[0] + " ") + "&= " + x);
    return render("\\begin{aligned} " + rows.map((r, i) => i < rows.length - 1 ? r + " " + gap(r + p[i + 2]) : r).join(" ") + " \\end{aligned}", true, fb); };
  window.dz = (x, d = 2) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/\./g, "{.}").replace(",", "{,}");
  const auto = () => document.querySelectorAll(".tex-auto").forEach(el => { if (window.renderMathInElement) renderMathInElement(el, { delimiters: [{ left: "\\[", right: "\\]", display: true }, { left: "\\(", right: "\\)", display: false }], throwOnError: false }); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", auto); else auto();
})();
