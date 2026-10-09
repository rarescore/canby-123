import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const COLUMN_SECONDS = 0.8;
const BAR_SECONDS = 1.5;
const COUNT_SECONDS = 2;
const DOT_MS = 240;
const LANDING = "00";
/** Column travel distance was not recorded. Not the line-reveal 50%. */
const COLUMN_Y_PX = 24;

/** CSS keyword ease-out is cubic-bezier(0, 0, 0.58, 1). Not easeOutCubic. */
function cssEaseOut(x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const x2 = 0.58;
  const ax = 1 - 3 * x2;
  const bx = 3 * x2;
  const sampleX = (t) => ((ax * t + bx) * t) * t;
  const sampleDX = (t) => (3 * ax * t + 2 * bx) * t;
  const sampleY = (t) => (3 - 2 * t) * t * t;
  let t = x;
  for (let i = 0; i < 6; i += 1) {
    const dx = sampleX(t) - x;
    const d = sampleDX(t);
    if (Math.abs(dx) < 1e-5 || Math.abs(d) < 1e-6) break;
    t -= dx / d;
  }
  t = Math.min(1, Math.max(0, t));
  return sampleY(t);
}

function dotGroups(root) {
  const nodes = [...root.querySelectorAll("[data-dots]")];
  const groups = [];
  const loose = new Map();
  nodes.forEach((node) => {
    if (node.querySelector("[data-value]")) return;
    if (node.children.length) {
      groups.push([...node.children]);
      return;
    }
    const parent = node.parentElement || root;
    if (!loose.has(parent)) loose.set(parent, []);
    loose.get(parent).push(node);
  });
  loose.forEach((dots) => {
    if (dots.length) groups.push(dots);
  });
  return groups;
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

export function initHero(env) {
  const root = document.querySelector('[data-motion="hero"]');
  if (!root) return () => {};

  const field = root.querySelector("[data-hero-field]");
  const restore = [];
  const listeners = [];
  let dotTimer = 0;
  let parked = false;
  let spacer = null;
  let counted = false;

  const on = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    listeners.push(() => target.removeEventListener(type, handler, options));
  };

  const setPlaying = (onPlaying) => {
    if (!field || !env.motion) return;
    field.classList.toggle("is-playing", Boolean(onPlaying) && !document.hidden && !parked);
  };

  const ctx = gsap.context(() => {
    if (!env.motion) {
      field?.classList.remove("is-playing");
      return;
    }

    const columns = [...root.querySelectorAll("[data-stat]")];
    if (columns.length) {
      gsap.fromTo(
        columns,
        { opacity: 0, y: COLUMN_Y_PX },
        {
          opacity: 1,
          y: 0,
          duration: COLUMN_SECONDS,
          ease: cssEaseOut,
          stagger: 0,
        },
      );
    }

    const bars = [...root.querySelectorAll("[data-bar]")];
    if (bars.length) {
      gsap.fromTo(
        bars,
        { scaleX: 0, transformOrigin: "0% 50%" },
        { scaleX: 1, duration: BAR_SECONDS, ease: "none" },
      );
    }

    const values = [...root.querySelectorAll("[data-value]")];
    if (values.length) {
      counted = true;
      const clock = { t: 0 };
      values.forEach((el) => {
        el.textContent = "0";
      });
      gsap.to(clock, {
        t: 1,
        duration: COUNT_SECONDS,
        ease: "power2.out",
        onUpdate: () => {
          values.forEach((el) => {
            el.textContent = String(Math.round(Number(el.dataset.target || 0) * clock.t));
          });
        },
        onComplete: () => {
          values.forEach((el) => {
            el.textContent = el.dataset.target || LANDING;
          });
          root.dispatchEvent(
            new CustomEvent("canby:hero", {
              bubbles: true,
              detail: { landing: LANDING },
            }),
          );
        },
      });
    }

    root.querySelectorAll("[data-dots]").forEach((node) => {
      if (node.querySelector("[data-value]") || node.getAttribute("aria-hidden") != null) return;
      node.setAttribute("aria-hidden", "true");
      restore.push(() => node.removeAttribute("aria-hidden"));
    });
    const groups = dotGroups(root);
    groups.forEach((dots) => {
      dots.forEach((dot, index) => dot.classList.toggle("is-active", index === 0));
    });
    if (groups.length) {
      let step = 0;
      const tick = () => {
        if (document.hidden || parked) return;
        step += 1;
        groups.forEach((dots) => {
          if (!dots.length) return;
          const active = step % dots.length;
          dots.forEach((dot, index) => dot.classList.toggle("is-active", index === active));
        });
      };
      dotTimer = window.setInterval(tick, DOT_MS);
    }

    if (field) setPlaying(true);

    if (env.desktop) holdHeroUntilCovered();

    const syncVisibility = () => {
      if (!env.desktop) {
        const rect = root.getBoundingClientRect();
        const inView = rect.bottom > 0 && rect.top < window.innerHeight;
        setPlaying(inView);
        return;
      }
      setPlaying(!parked);
    };
    on(document, "visibilitychange", syncVisibility);

    if (!env.desktop && field) {
      if (typeof IntersectionObserver === "function") {
        const observer = new IntersectionObserver((entries) => {
          const inView = entries.some((entry) => entry.isIntersecting);
          setPlaying(inView);
        });
        observer.observe(root);
        restore.push(() => observer.disconnect());
      }
    }
  }, root);

  function holdHeroUntilCovered() {
    const next = root.nextElementSibling;
    if (!next) return;

    const height = root.getBoundingClientRect().height;
    spacer = document.createElement("div");
    spacer.setAttribute("data-motion-hero-hold", "");
    spacer.setAttribute("aria-hidden", "true");
    spacer.style.height = `${height}px`;
    spacer.style.pointerEvents = "none";
    root.before(spacer);

    const restoreRoot = rememberStyle(root, ["position", "top", "left", "right", "zIndex", "width", "maxWidth"]);
    const restoreNext = rememberStyle(next, ["position", "zIndex"]);
    root.style.position = "fixed";
    root.style.top = "0";
    root.style.left = "0";
    root.style.right = "auto";
    root.style.width = "100%";
    root.style.maxWidth = "100%";
    root.style.zIndex = "1";
    if (getComputedStyle(next).position === "static") next.style.position = "relative";
    next.style.zIndex = "2";

    const park = () => {
      const parent = root.offsetParent;
      const origin = parent ? parent.getBoundingClientRect().top + window.scrollY : 0;
      const top = spacer.getBoundingClientRect().top + window.scrollY - origin;
      root.style.position = "absolute";
      root.style.top = `${top}px`;
      root.style.width = "100%";
      parked = true;
      field?.classList.remove("is-playing");
    };
    const unpark = () => {
      root.style.position = "fixed";
      root.style.top = "0";
      parked = false;
      if (field && !document.hidden) field.classList.add("is-playing");
    };

    ScrollTrigger.create({
      trigger: next,
      start: "top top",
      onEnter: park,
      onLeaveBack: unpark,
    });

    const onResize = () => {
      if (!spacer) return;
      spacer.style.height = `${root.getBoundingClientRect().height}px`;
      if (parked) {
        const parent = root.offsetParent;
        const origin = parent ? parent.getBoundingClientRect().top + window.scrollY : 0;
        const top = spacer.getBoundingClientRect().top + window.scrollY - origin;
        root.style.top = `${top}px`;
      }
      ScrollTrigger.refresh();
    };
    on(window, "resize", onResize);

    restore.push(() => {
      restoreRoot();
      restoreNext();
      spacer?.remove();
      spacer = null;
      parked = false;
    });
  }

  return () => {
    window.clearInterval(dotTimer);
    listeners.splice(0).forEach((off) => off());
    ctx.revert();
    restore.splice(0).forEach((fn) => fn());
    field?.classList.remove("is-playing");
    if (counted) {
      root.querySelectorAll("[data-value]").forEach((el) => {
        el.textContent = el.dataset.target || LANDING;
      });
    }
    if (spacer) {
      spacer.remove();
      spacer = null;
    }
  };
}
