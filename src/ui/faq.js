export function initFaq() {
  const buttons = document.querySelectorAll("[data-faq]");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const expanded = button.getAttribute("aria-expanded") === "true";
      const panelId = button.getAttribute("aria-controls");
      const panel = panelId ? document.getElementById(panelId) : null;
      const next = !expanded;
      button.setAttribute("aria-expanded", next ? "true" : "false");
      if (panel) panel.hidden = !next;
    });
  });
}
