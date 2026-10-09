import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initHero } from "./hero.js";
import { initGallery } from "./gallery.js";
import { initSlider } from "./slider.js";
import { initPin } from "./pin.js";
import { initMarquee } from "./marquee.js";

gsap.registerPlugin(ScrollTrigger);

/** OPEN-BREAKPOINT. Not an inspection figure and not an approved deviation. */
const SMALL_SCREEN_QUERY = "(max-width: 800px)";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

let cleanupCurrent = () => {};
let listening = false;

function readEnvironment() {
  const reduced = window.matchMedia(REDUCED_QUERY).matches;
  const small = window.matchMedia(SMALL_SCREEN_QUERY).matches;
  return {
    reduced,
    small,
    desktop: !reduced && !small,
    motion: !reduced,
  };
}

export function initMotion() {
  cleanupCurrent();
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

  const env = readEnvironment();
  const cleanups = [
    initHero(env),
    initGallery(env),
    initSlider(env),
    initPin(env),
    initMarquee(env),
  ].filter((fn) => typeof fn === "function");

  ScrollTrigger.refresh();

  cleanupCurrent = () => {
    while (cleanups.length) {
      const fn = cleanups.pop();
      fn();
    }
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  };

  if (!listening) {
    listening = true;
    const onChange = () => initMotion();
    window.matchMedia(REDUCED_QUERY).addEventListener("change", onChange);
    window.matchMedia(SMALL_SCREEN_QUERY).addEventListener("change", onChange);
  }

  return cleanupCurrent;
}
