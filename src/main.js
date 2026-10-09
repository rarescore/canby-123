import { initMotion } from './motion/index.js';
import { initFaq } from './ui/faq.js';
import { initMenu } from './ui/menu.js';
import { initLanguage, phrase } from './i18n/apply.js';

initMenu();
initFaq();
initMotion();

const video = document.querySelector('#hero-video');
const toggle = document.querySelector('#video-toggle');
toggle?.setAttribute('data-i18n-skip', '');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let manuallyPaused = reduced.matches;
let inView = true;
function paintVideo() {
  if (!toggle || !video) return;
  const paused = video.paused;
  toggle.textContent = paused ? phrase('Play film ▷') : phrase('Pause film Ⅱ');
  toggle.setAttribute('aria-label', paused ? phrase('Play background video') : phrase('Pause background video'));
}
function syncVideo() {
  if (manuallyPaused || document.hidden || !inView) video.pause();
  else video.play().catch(paintVideo);
}
toggle.addEventListener('click', () => { manuallyPaused = !video.paused; syncVideo(); });
video.addEventListener('play', paintVideo);
video.addEventListener('pause', paintVideo);
document.addEventListener('visibilitychange', syncVideo);
reduced.addEventListener('change', () => { manuallyPaused = reduced.matches; syncVideo(); });
new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; syncVideo(); }).observe(video);
document.addEventListener('canby:language', paintVideo);
syncVideo();
initLanguage();
