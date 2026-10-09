import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** About 4600px. +=4000 is not this span. */
const PIN_END = "+=6800";
const LINE_BLUR = 18;
const LINE_Y = 50;
const LINE_Z = -200;
const LINE_ROTATE = 10;
const PILL_Y = 20;
/** Pill blur radius was not recorded. Not blur(18px). */
const PILL_BLUR = 6;
/** Perspective distance was not recorded. 800px keeps translateZ(-200px) in front of the camera. */
const PERSPECTIVE = 800;
/** Not an inspection figure. First portion of each equal quarter, so the state can be read before the next one. */
const REVEAL_FRACTION = 0.35;

function isPill(state, index) {
  const flag = (state.getAttribute("data-motion-state") || "").toLowerCase();
  if (flag === "pills" || flag === "pill" || flag === "tags") return true;
  return false;
}

function targetsFor(state, pills) {
  if (pills) {
    const marked = [...state.querySelectorAll("[data-pill]")];
    if (marked.length) return marked;
    const items = [...state.querySelectorAll("li")];
    if (items.length) return items;
  } else {
    const lines = [...state.querySelectorAll("[data-line]")];
    if (lines.length) return lines;
  }
  const children = [...state.children].filter((el) => {
    if (el.hasAttribute("data-pin-mark") || el.hasAttribute("data-step")) return false;
    return !(el.childElementCount === 0 && el.textContent.trim() === "1");
  });
  return children.length ? children : [state];
}

function mostlyInside(frameBox, lineBox) {
  if (lineBox.width < 1 || lineBox.height < 1) return true;
  const width = Math.min(lineBox.right, frameBox.right) - Math.max(lineBox.left, frameBox.left);
  const height = Math.min(lineBox.bottom, frameBox.bottom) - Math.max(lineBox.top, frameBox.top);
  if (width <= 0 || height <= 0) return false;
  return (width * height) / (lineBox.width * lineBox.height) >= 0.5;
}

function paintLine(el, amount, useZ) {
  const rest = 1 - amount;
  el.style.opacity = String(amount);
  if (amount >= 0.999) {
    el.style.filter = "none";
    el.style.transform = "none";
    return;
  }
  el.style.filter = `blur(${LINE_BLUR * rest}px)`;
  const z = useZ ? ` translateZ(${LINE_Z * rest}px)` : "";
  el.style.transform = `translateY(${LINE_Y * rest}%)${z} rotateX(${LINE_ROTATE * rest}deg)`;
}

function paintPill(el, amount) {
  const rest = 1 - amount;
  el.style.opacity = String(amount);
  if (amount >= 0.999) {
    el.style.filter = "none";
    el.style.transform = "none";
    return;
  }
  el.style.filter = `blur(${PILL_BLUR * rest}px)`;
  el.style.transform = `translateY(${PILL_Y * rest}px)`;
}

function clearPaint(el) {
  el.style.opacity = "";
  el.style.filter = "";
  el.style.transform = "";
  el.style.pointerEvents = "";
  el.style.zIndex = "";
  el.style.position = "";
  el.style.inset = "";
  el.style.margin = "";
}

export function initPin(env) {
  const root = document.querySelector('[data-motion="narrative"]');
  if (!root) return () => {};
  const frame = root.querySelector("[data-pin-frame]");
  if (!frame) return () => {};

  const states = [...frame.querySelectorAll("[data-motion-state]")];
  if (!states.length) return () => {};

  const prepared = states.map((state, index) => {
    const pills = isPill(state, index);
    return { state, pills, nodes: targetsFor(state, pills) };
  });

  const reset = () => {
    prepared.forEach(({ state, nodes }) => {
      clearPaint(state);
      nodes.forEach(clearPaint);
    });
    frame.removeAttribute("data-translate-z");
  };

  if (!env.motion) {
    reset();
    return () => reset();
  }

  const host = states[0].parentNode || frame;
  const marks = [...host.children].filter((el) => {
    if (states.includes(el)) return false;
    if (el.hasAttribute("data-pin-mark") || el.hasAttribute("data-step")) return true;
    return el.childElementCount === 0 && el.textContent.trim() === "1";
  });
  const markStyles = marks.map((el) => ({
    el,
    position: el.style.position,
    zIndex: el.style.zIndex,
  }));

  const previous = {
    minHeight: frame.style.minHeight,
    overflow: frame.style.overflow,
    touchAction: frame.style.touchAction,
    rootTouchAction: root.style.touchAction,
  };

  const scene = document.createElement("div");
  scene.setAttribute("data-motion-scene", "");
  scene.style.position = "relative";
  scene.style.minHeight = "100svh";
  scene.style.height = "100%";
  scene.style.perspective = `${PERSPECTIVE}px`;
  scene.style.pointerEvents = "none";
  host.insertBefore(scene, states[0]);
  states.forEach((state) => {
    state.style.position = "absolute";
    state.style.inset = "0";
    state.style.margin = "0";
    scene.appendChild(state);
  });
  scene.style.pointerEvents = "none";
  states.forEach((state) => {
    state.style.pointerEvents = "auto";
  });

  frame.style.minHeight = "100svh";
  frame.style.overflow = "visible";
  frame.style.touchAction = "pan-y";
  root.style.touchAction = "pan-y";
  marks.forEach((el) => {
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    el.style.zIndex = "2";
  });

  let useZ = true;
  const frameBox = frame.getBoundingClientRect();
  if (frameBox.height >= 80) {
    const samples = prepared.filter((item) => !item.pills).flatMap((item) => item.nodes);
    samples.forEach((el) => {
      el.style.transform = `translateZ(${LINE_Z}px) rotateX(${LINE_ROTATE}deg)`;
    });
    const measured = frame.getBoundingClientRect();
    const thrown = samples.some((el) => !mostlyInside(measured, el.getBoundingClientRect()));
    samples.forEach((el) => {
      el.style.transform = "";
    });
    useZ = !thrown;
  }
  frame.setAttribute("data-translate-z", useZ ? "on" : "reduced");

  const photograph = frame.querySelector('.narrative-photo');
  let amounts = prepared.map((_, index) => (index === 0 ? 1 : 0));
  let lastIndex = -1;
  let hashApplied = false;

  const render = (progress) => {
    if (photograph) gsap.set(photograph, { yPercent: -3 + progress * 6, scale: 1.08 - progress * .035 });
    const count = prepared.length;
    const scaled = Math.min(0.999999, Math.max(0, progress)) * count;
    const active = Math.min(count - 1, Math.floor(scaled));
    const local = scaled - Math.floor(scaled);
    amounts = prepared.map((_, index) => {
      if (index === active) {
        return index === 0 ? 1 : Math.min(1, local / REVEAL_FRACTION);
      }
      if (index === active - 1) return 1 - Math.min(1, local / REVEAL_FRACTION);
      return 0;
    });
    prepared.forEach((item, index) => {
      const amount = amounts[index];
      item.nodes.forEach((el) => {
        if (item.pills) paintPill(el, amount);
        else paintLine(el, amount, useZ);
      });
      item.state.style.pointerEvents = amount > 0.55 ? "auto" : "none";
      item.state.style.zIndex = amount > 0.55 ? "1" : "0";
    });
    const indexLabel = frame.querySelector('.pin-index');
    if (indexLabel) indexLabel.textContent = String(active + 1);
    const progressMark = frame.querySelector('[data-pin-mark]');
    if (progressMark) progressMark.style.transform = `scaleX(${Math.max(.02, progress)})`;
    if (active !== lastIndex) {
      lastIndex = active;
      root.dispatchEvent(
        new CustomEvent("canby:pin", { bubbles: true, detail: { index: active } }),
      );
    }
  };

  const trigger = ScrollTrigger.create({
    trigger: frame,
    pin: frame,
    start: "top top",
    end: env.small ? "+=4400" : PIN_END,
    onUpdate: (self) => render(self.progress),
    onRefresh: (self) => render(self.progress),
  });

  const scrollToState = (index) => {
    const count = prepared.length;
    const local = index === 0 ? 0.05 : Math.min(0.9, REVEAL_FRACTION + 0.15);
    const progress = (index + local) / count;
    const top = trigger.start + (trigger.end - trigger.start) * progress;
    const scroller = document.scrollingElement || document.documentElement;
    scroller.scrollTop = top;
  };

  const onFocus = (event) => {
    const state = event.target.closest("[data-motion-state]");
    if (!state) return;
    const index = states.indexOf(state);
    if (index < 0 || amounts[index] > 0.9) return;
    scrollToState(index);
  };
  frame.addEventListener("focusin", onFocus);

  const applyHash = () => {
    if (hashApplied) return;
    hashApplied = true;
    const id = location.hash.replace(/^#/, "");
    if (!id) return;
    let target = null;
    try {
      target = document.getElementById(decodeURIComponent(id));
    } catch {
      target = null;
    }
    if (!target || !frame.contains(target)) return;
    const state = target.closest("[data-motion-state]");
    const index = state ? states.indexOf(state) : -1;
    if (index < 0) return;
    scrollToState(index);
  };
  const hashFrame = window.requestAnimationFrame(applyHash);

  render(trigger.progress || 0);

  return () => {
    window.cancelAnimationFrame(hashFrame);
    frame.removeEventListener("focusin", onFocus);
    trigger.kill();
    if (photograph) gsap.set(photograph, {clearProps:"transform"});
    states.forEach((state) => host.insertBefore(state, scene));
    scene.remove();
    reset();
    frame.style.minHeight = previous.minHeight;
    frame.style.overflow = previous.overflow;
    frame.style.touchAction = previous.touchAction;
    root.style.touchAction = previous.rootTouchAction;
    markStyles.forEach(({ el, position, zIndex }) => {
      el.style.position = position;
      el.style.zIndex = zIndex;
    });
  };
}
