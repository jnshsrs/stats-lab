/* Stats Lab · LaTeX-Helfer auf Basis von KaTeX (lokal in assets/vendor/katex).
   tex(src, fallback): Inline-Formel als HTML; texBlock(src, fallback): abgesetzte Formel.
   Ohne KaTeX erscheint der Fallback. dz(x, d) formatiert Zahlen mit Dezimalkomma für LaTeX.
   Statische Formeln \( … \) und \[ … \] in Elementen mit class="tex-auto" werden beim Laden gesetzt. */
(() => {
  const render = (src, display, fb) => window.katex ? katex.renderToString(src, { throwOnError: false, displayMode: display }) : (fb ?? src);
  window.tex = (src, fb) => render(src, false, fb);
  window.texBlock = (src, fb) => render(src, true, fb);
  window.dz = (x, d = 2) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/\./g, "{.}").replace(",", "{,}");
  const auto = () => document.querySelectorAll(".tex-auto").forEach(el => { if (window.renderMathInElement) renderMathInElement(el, { delimiters: [{ left: "\\[", right: "\\]", display: true }, { left: "\\(", right: "\\)", display: false }], throwOnError: false }); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", auto); else auto();
})();
