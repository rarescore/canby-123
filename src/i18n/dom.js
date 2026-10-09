const PHRASING = new Set(["A", "STRONG", "EM", "SPAN", "B", "I", "SMALL", "ABBR", "TIME", "MARK", "BR", "SUB", "SUP"]);

export function isPhraseElement(el) {
  if (!el || el.nodeType !== 1) return false;
  if (el.closest("[data-site-language], textarea, script, style, noscript")) return false;
  if (el.hasAttribute("data-i18n-skip")) return false;
  for (const child of el.querySelectorAll("*")) {
    if (!PHRASING.has(child.tagName)) return false;
  }
  return true;
}

export function normalizeKey(value) {
  return String(value).replace(/[ \t\f\v]+/g, " ").replace(/ *\n */g, "\n").trim();
}

export function templateOf(el) {
  let index = 0;
  let text = "";
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) text += node.nodeValue;
    else if (node.nodeType === Node.ELEMENT_NODE) text += node.tagName === "BR" ? "\n" : `{${index++}}`;
  }
  return normalizeKey(text);
}

export function slotsOf(el) {
  return [...el.childNodes].filter((node) => node.nodeType === Node.ELEMENT_NODE && node.tagName !== "BR");
}
