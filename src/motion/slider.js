import { gsap } from "gsap";
import { phrase } from "../i18n/apply.js";

/** Not an inspection figure. No crossfade duration was recorded. */
const TITLE_FADE_SECONDS = 0.2;

let reasonSeq = 0;

function slideTitle(slide) {
  const explicit = slide.getAttribute("data-title");
  if (explicit) return explicit.trim();
  const heading = slide.querySelector("h1, h2, h3, h4, [data-slide-title]");
  return heading ? heading.textContent.trim() : "";
}

function reasonCopy(which) {
  return phrase(which === "first" ? "First slide" : "Last slide");
}

function remember(el, name) {
  const had = el.hasAttribute(name);
  const value = el.getAttribute(name);
  return () => {
    if (had) el.setAttribute(name, value);
    else el.removeAttribute(name);
  };
}

export function initSlider(env) {
  const root = document.querySelector('[data-motion="slider"]');
  if (!root) return () => {};

  const slides = [...root.querySelectorAll("[data-slide]")];
  if (!slides.length) return () => {};

  const prev = root.querySelector("[data-slider-prev]");
  const next = root.querySelector("[data-slider-next]");
  const title = root.querySelector("[data-slider-title]");
  const originalTitle = title ? title.innerHTML : "";
  const restore = [];
  const listeners = [];
  let index = 0;
  let fade = null;
  const hideInactive = env.motion;

  const on = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    listeners.push(() => target.removeEventListener(type, handler, options));
  };

  if (title) {
    restore.push(remember(title, "aria-live"));
    if (!title.hasAttribute("aria-live")) title.setAttribute("aria-live", "polite");
  }

  const reasons = new Map();
  const describedBy = new Map();
  [prev, next].forEach((button, buttonIndex) => {
    if (!button) return;
    const note = document.createElement("span");
    note.dataset.motionReason = "";
    note.id = `canby-slider-reason-${reasonSeq += 1}`;
    note.hidden = true;
    note.textContent = reasonCopy(buttonIndex === 0 ? "first" : "last");
    button.after(note);
    reasons.set(button, note);
    describedBy.set(button, button.getAttribute("aria-describedby"));
    restore.push(remember(button, "aria-disabled"));
    restore.push(remember(button, "aria-describedby"));
  });

  const writeTitle = (text, animate) => {
    if (!title || !text) return false;
    if (!animate || !hideInactive) {
      title.textContent = text;
      title.style.opacity = "";
      return false;
    }
    if (fade) fade.kill();
    fade = gsap.timeline();
    fade.to(title, { opacity: 0, duration: TITLE_FADE_SECONDS / 2, ease: "none" });
    fade.add(() => {
      title.textContent = text;
    });
    fade.to(title, { opacity: 1, duration: TITLE_FADE_SECONDS / 2, ease: "none" });
    return true;
  };

  const paint = (animateTitle) => {
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === index;
      if (!hideInactive) {
        slide.style.opacity = "";
        slide.style.visibility = "";
        return;
      }
      slide.style.opacity = active ? "1" : "0";
      slide.style.visibility = active ? "visible" : "hidden";
    });
    const atStart = index <= 0;
    const atEnd = index >= slides.length - 1;
    setEnd(prev, atStart);
    setEnd(next, atEnd);
    return writeTitle(slideTitle(slides[index]), animateTitle);
  };

  function setEnd(button, atEnd) {
    if (!button) return;
    const note = reasons.get(button);
    const original = describedBy.get(button);
    if (atEnd) {
      button.setAttribute("aria-disabled", "true");
      if (note) {
        note.hidden = false;
        button.setAttribute("aria-describedby", original ? `${original} ${note.id}` : note.id);
      }
      return;
    }
    button.setAttribute("aria-disabled", "false");
    if (original) button.setAttribute("aria-describedby", original);
    else button.removeAttribute("aria-describedby");
    if (note) note.hidden = true;
  }

  let changeId = 0;

  const go = (delta, source) => {
    const upcoming = Math.min(slides.length - 1, Math.max(0, index + delta));
    if (upcoming === index) return;
    const leaving = slides[index];
    index = upcoming;
    const id = changeId + 1;
    changeId = id;
    const animated = paint(true);
    const emit = () => {
      if (id !== changeId) return;
      root.dispatchEvent(
        new CustomEvent("canby:slide", { bubbles: true, detail: { index } }),
      );
    };
    if (animated && fade) fade.eventCallback("onComplete", emit);
    else emit();
    if (source && leaving.contains(document.activeElement)) source.focus();
  };

  const activate = (button, delta) => (event) => {
    if (button?.getAttribute("aria-disabled") === "true") {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    go(delta, button);
  };

  if (prev) on(prev, "click", activate(prev, -1));
  if (next) on(next, "click", activate(next, 1));

  on(root, "keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const active = document.activeElement;
    if (!active || !root.contains(active)) return;
    const tag = active.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || active.isContentEditable) return;
    event.preventDefault();
    const source = active.closest("[data-slider-prev], [data-slider-next]");
    if (event.key === "ArrowLeft") go(-1, source || prev);
    else go(1, source || next);
  });

  paint(false);

  return () => {
    if (fade) fade.kill();
    listeners.splice(0).forEach((off) => off());
    slides.forEach((slide) => {
      slide.style.opacity = "";
      slide.style.visibility = "";
    });
    reasons.forEach((note) => note.remove());
    restore.splice(0).forEach((fn) => fn());
    if (title) {
      title.innerHTML = originalTitle;
      title.style.opacity = "";
    }
  };
}
