import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

function setWindowScroll(top) {
  const scroller = document.scrollingElement || document.documentElement;
  scroller.scrollTop = top;
}

function rememberStyle(el, props) {
  const previous = {};
  props.forEach((prop) => {
    previous[prop] = el.style[prop];
  });
  return () => {
    props.forEach((prop) => {
      el.style[prop] = previous[prop];
    });
  };
}

export function initGallery(env) {
  const root = document.querySelector('[data-motion="gallery"]');
  if (!root) return () => {};

  const viewport = root.querySelector("[data-gallery-viewport]");
  const track = root.querySelector("[data-gallery-track]");
  if (!viewport || !track) return () => {};

  const section = viewport.closest("section") || root;
  const restore = [
    rememberStyle(section, ["overflowX"]),
    rememberStyle(viewport, ["overflowX", "overflowY", "touchAction", "overscrollBehaviorX"]),
    rememberStyle(track, ["display", "flexWrap", "width"]),
  ];
  const listeners = [];
  let jack = null;
  let freeX = 0;

  const on = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    listeners.push(() => target.removeEventListener(type, handler, options));
  };

  const maxTravel = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

  section.style.overflowX = "hidden";
  track.style.display = "flex";
  track.style.flexWrap = "nowrap";
  track.style.width = "max-content";
  viewport.style.overscrollBehaviorX = "contain";

  const useJack = env.desktop;
  let tween = null;

  const releaseJack = () => {
    root.dispatchEvent(
      new CustomEvent("canby:gallery", {
        bubbles: true,
        detail: { released: true },
      }),
    );
  };

  const syncJack = (andRefresh) => {
    if (!useJack) return;
    const distance = maxTravel();
    if (!tween) {
      if (distance <= 1) return;
      gsap.set(track, { x: 0 });
      freeX = 0;
      tween = gsap.to(track, {
        x: () => -maxTravel(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          pin: section,
          start: "top top",
          end: () => `+=${Math.max(1, Math.round(maxTravel() * 1.5))}`,
          scrub: true,
          invalidateOnRefresh: true,
          onLeave: releaseJack,
        },
      });
      jack = tween.scrollTrigger;
    } else if (distance <= 1) jack?.disable(true);
    else jack?.enable();
    if (andRefresh) ScrollTrigger.refresh();
  };

  if (useJack) {
    viewport.style.overflowX = "hidden";
    viewport.style.overflowY = "hidden";
    viewport.style.touchAction = "pan-y";
    syncJack(false);
  } else {
    viewport.style.overflowX = "auto";
    viewport.style.overflowY = "hidden";
    viewport.style.touchAction = "pan-x pan-y";
    on(
      viewport,
      "wheel",
      (event) => {
        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        event.preventDefault();
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
        setWindowScroll(window.scrollY + event.deltaY * unit);
      },
      { passive: false },
    );
  }

  let pointerId = null;
  let originX = 0;
  let originY = 0;
  let lastX = 0;
  let lastY = 0;
  let dragging = false;
  let suppressClick = false;

  const applyFree = (deltaX) => {
    if (viewport.scrollWidth > viewport.clientWidth + 1) {
      viewport.scrollLeft -= deltaX;
      return;
    }
    const max = maxTravel();
    freeX = Math.min(0, Math.max(-max, freeX + deltaX));
    track.style.transform = max ? `translateX(${freeX}px)` : "";
  };

  const applyJack = (deltaX) => {
    const trigger = jack;
    const max = maxTravel();
    if (!trigger || trigger.end <= trigger.start || max <= 1) {
      applyFree(deltaX);
      return;
    }
    const range = trigger.end - trigger.start;
    const next = Math.min(
      trigger.end,
      Math.max(trigger.start, window.scrollY + (-deltaX / max) * range),
    );
    setWindowScroll(next);
  };

  on(viewport, "pointerdown", (event) => {
    if (event.button != null && event.button !== 0) return;
    pointerId = event.pointerId;
    originX = lastX = event.clientX;
    originY = lastY = event.clientY;
    dragging = false;
  });

  on(
    viewport,
    "pointermove",
    (event) => {
      if (pointerId !== event.pointerId) return;
      const totalX = event.clientX - originX;
      const totalY = event.clientY - originY;
      const dx = event.clientX - lastX;
      if (!dragging) {
        if (Math.hypot(totalX, totalY) < 6) return;
        if (Math.abs(totalY) > Math.abs(totalX)) {
          pointerId = null;
          if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
          return;
        }
        dragging = true;
        suppressClick = true;
        viewport.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
      if (useJack) applyJack(dx);
      else applyFree(dx);
      lastX = event.clientX;
      lastY = event.clientY;
    },
    { passive: false },
  );

  const endPointer = (event) => {
    if (pointerId !== event.pointerId) return;
    pointerId = null;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    if (!suppressClick) return;
    window.setTimeout(() => {
      suppressClick = false;
    }, 0);
  };
  on(viewport, "pointerup", endPointer);
  on(viewport, "pointercancel", endPointer);
  on(
    viewport,
    "click",
    (event) => {
      if (!suppressClick) return;
      suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    },
    true,
  );

  on(viewport, "focusin", (event) => {
    const slide = event.target.closest("a, button, article, li, figure");
    if (!slide || !track.contains(slide)) return;
    const max = maxTravel();
    if (max <= 1) return;
    const target = Math.min(max, Math.max(0, slide.offsetLeft));
    if (useJack && jack && jack.end > jack.start) {
      const top = jack.start + (target / max) * (jack.end - jack.start);
      setWindowScroll(top);
      return;
    }
    if (viewport.scrollWidth > viewport.clientWidth + 1) {
      viewport.scrollLeft = target;
      return;
    }
    freeX = -target;
    track.style.transform = `translateX(${freeX}px)`;
  });

  if (document.readyState !== "complete") on(window, "load", () => syncJack(true));

  return () => {
    listeners.splice(0).forEach((off) => off());
    if (tween) tween.kill();
    gsap.set(track, { clearProps: "transform" });
    freeX = 0;
    restore.splice(0).forEach((fn) => fn());
  };
}
