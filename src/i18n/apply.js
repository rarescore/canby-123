import { isPhraseElement, normalizeKey, slotsOf, templateOf } from "./dom.js";
import { es } from "./es.js";
import { hy } from "./hy.js";

const catalogs = { es, hy };
const ATTRS = ["placeholder", "aria-label", "alt", "title"];

let lang = "en";
let applying = false;
let observer;

export function currentLanguage() {
  return lang;
}

export function phrase(english) {
  if (lang === "en" || english == null) return english;
  const hit = catalogs[lang]?.[normalizeKey(english)];
  return hit == null ? english : hit;
}

function remember(el) {
  if (el._i18n) return el._i18n;
  const children = [...el.childNodes].map((node) => {
    if (node.nodeType === Node.TEXT_NODE) return { type: "text", value: node.nodeValue };
    if (node.tagName === "BR") return { type: "br" };
    return { type: "slot", node };
  });
  el._i18n = { children, key: templateOf(el) };
  return el._i18n;
}

function clearChildren(el) {
  slotsOf(el).forEach((node) => node.remove());
  while (el.firstChild) el.removeChild(el.firstChild);
}

function writeText(el, value) {
  const lines = String(value).split("\n");
  lines.forEach((line, index) => {
    if (index) el.appendChild(document.createElement("br"));
    if (line) el.appendChild(document.createTextNode(line));
  });
}

function restore(el) {
  const snap = el._i18n;
  if (!snap) return;
  clearChildren(el);
  for (const child of snap.children) {
    if (child.type === "text") el.appendChild(document.createTextNode(child.value));
    else if (child.type === "br") el.appendChild(document.createElement("br"));
    else if (child.node) el.appendChild(child.node);
  }
}

function paint(el, translated) {
  const snap = el._i18n;
  const slots = snap.children.filter((child) => child.type === "slot").map((child) => child.node);
  clearChildren(el);
  const pattern = /\{(\d+)\}/g;
  let last = 0;
  let match;
  while ((match = pattern.exec(translated))) {
    writeText(el, translated.slice(last, match.index));
    const slot = slots[Number(match[1])];
    if (slot) el.appendChild(slot);
    last = match.index + match[0].length;
  }
  writeText(el, translated.slice(last));
}

function articleBody(node) {
  if (location.pathname !== "/articles" && !location.pathname.startsWith("/articles/")) return false;
  const el = node?.nodeType === 1 ? node : node?.parentElement;
  return !!el?.closest("main");
}

function knownForms(key) {
  const forms = new Set([key]);
  for (const catalog of Object.values(catalogs)) {
    const hit = catalog?.[key];
    if (hit != null) forms.add(normalizeKey(hit));
  }
  return forms;
}

function applyElement(el) {
  if (!isPhraseElement(el) || articleBody(el)) return;
  let snap = el._i18n;
  const now = templateOf(el);
  if (!snap) snap = remember(el);
  else if (!knownForms(snap.key).has(now)) {
    delete el._i18n;
    snap = remember(el);
  }
  if (lang === "en") {
    if (templateOf(el) !== snap.key) restore(el);
    return;
  }
  const hit = catalogs[lang]?.[snap.key];
  if (hit == null) {
    if (templateOf(el) !== snap.key) restore(el);
    return;
  }
  if (templateOf(el) !== normalizeKey(hit)) paint(el, hit);
}

function applyAttributes(root) {
  root.querySelectorAll("[placeholder], [aria-label], img[alt], [title]").forEach((el) => {
    if (articleBody(el)) return;
    if (el.closest("[data-site-language]") && el.tagName === "OPTION") return;
    for (const name of ATTRS) {
      if (!el.hasAttribute(name)) continue;
      const store = `data-en-${name}`;
      if (!el.hasAttribute(store)) el.setAttribute(store, el.getAttribute(name));
      const original = el.getAttribute(store);
      const next = lang === "en" ? original : (catalogs[lang]?.[normalizeKey(original)] ?? original);
      if (el.getAttribute(name) !== next) el.setAttribute(name, next);
    }
  });
}

function applyLooseText() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const parent = node.parentElement;
    if (!parent || parent.closest("[data-site-language], script, style, noscript, textarea")) continue;
    if (articleBody(parent)) continue;
    if (parent.hasAttribute("data-i18n-skip") || parent.closest("[data-i18n-skip]")) continue;
    if (isPhraseElement(parent)) continue;
    if (node._i18nEn == null) node._i18nEn = node.nodeValue;
    const currentKey = normalizeKey(node.nodeValue);
    const originalKey = normalizeKey(node._i18nEn);
    if (!knownForms(originalKey).has(currentKey)) node._i18nEn = node.nodeValue;
    const original = node._i18nEn;
    const key = normalizeKey(original);
    if (!key) continue;
    let next = original;
    if (lang !== "en") {
      const hit = catalogs[lang]?.[key];
      if (hit != null) {
        const lead = original.match(/^\s*/)[0];
        const trail = original.match(/\s*$/)[0];
        next = lead + hit + trail;
      }
    }
    if (node.nodeValue !== next) node.nodeValue = next;
  }
}

function applyTitle() {
  if (location.pathname === "/articles" || location.pathname.startsWith("/articles/")) return;
  const root = document.documentElement;
  if (!root.dataset.enTitle) root.dataset.enTitle = document.title;
  const original = root.dataset.enTitle;
  const next = lang === "en" ? original : (catalogs[lang]?.[normalizeKey(original)] ?? original);
  if (document.title !== next) document.title = next;
}

export function applyPage() {
  applying = true;
  const elements = [...document.body.querySelectorAll("*")].filter(isPhraseElement);
  elements.sort((a, b) => (a.contains(b) ? 1 : b.contains(a) ? -1 : 0));
  elements.forEach(applyElement);
  applyLooseText();
  applyAttributes(document.body);
  applyTitle();
  const onArticle = location.pathname === "/articles" || location.pathname.startsWith("/articles/");
  document.documentElement.lang = lang === "hy" ? "hy" : lang === "es" ? "es" : "en";
  const main = document.querySelector("main");
  if (main) {
    if (onArticle && lang !== "en") main.lang = "en";
    else main.removeAttribute("lang");
  }
  applying = false;
}

export function setLanguage(next) {
  lang = next === "es" || next === "hy" ? next : "en";
  try {
    localStorage.setItem("canby-navigation-language", lang);
  } catch {
    /* private mode */
  }
  document.querySelectorAll("[data-site-language]").forEach((select) => {
    if (select.value !== lang) select.value = lang;
  });
  applyPage();
  document.dispatchEvent(new CustomEvent("canby:language", { detail: { lang } }));
}

export function initLanguage() {
  document.querySelectorAll("[data-site-language]").forEach((select) => {
    select.addEventListener("change", () => setLanguage(select.value));
  });
  let saved = "en";
  try {
    saved = localStorage.getItem("canby-navigation-language") || "en";
  } catch {
    saved = "en";
  }
  setLanguage(saved);
  if (!observer) {
    observer = new MutationObserver(() => {
      if (applying || lang === "en") return;
      applyPage();
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  }
}
