export function initMenu() {
  const dropdowns = [...document.querySelectorAll('.nav-dropdown')];
  dropdowns.forEach(dropdown => {
    let closeTimer;
    dropdown.addEventListener('pointerenter', event => {
      if(event.pointerType==='touch'||!matchMedia('(hover: hover) and (min-width: 801px)').matches)return;
      clearTimeout(closeTimer);dropdown.open=true;
    });
    dropdown.addEventListener('pointerleave', () => {
      if(!matchMedia('(hover: hover) and (min-width: 801px)').matches)return;
      closeTimer=setTimeout(()=>{if(!dropdown.contains(document.activeElement))dropdown.open=false;},160);
    });
    dropdown.addEventListener('toggle', () => {
      if (dropdown.open) dropdowns.forEach(other => { if (other !== dropdown) other.open = false; });
    });
    dropdown.addEventListener('keydown', event => {
      if (event.key === 'Escape' && dropdown.open) {
        event.preventDefault(); event.stopPropagation(); dropdown.open = false;
        dropdown.querySelector('summary').focus();
      }
    });
  });
  document.addEventListener('click', event => {
    dropdowns.forEach(dropdown => { if (!dropdown.contains(event.target)) dropdown.open = false; });
  });
  const openButton = document.querySelector("[data-menu-open]");
  const closeButton = document.querySelector("[data-menu-close]");
  const overlay = document.querySelector("[data-menu-overlay]");
  const inertTargets = document.querySelectorAll("[data-inert-with-menu]");
  if (!openButton || !closeButton || !overlay) return;

  const desktopQuery = window.matchMedia("(min-width: 801px)");
  let returnFocus = null;

  function setInert(isInert) {
    inertTargets.forEach((element) => {
      element.inert = isInert;
    });
  }

  function openMenu() {
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : openButton;
    overlay.hidden = false;
    openButton.setAttribute("aria-expanded", "true");
    document.documentElement.classList.add("menu-open");
    setInert(true);
    requestAnimationFrame(() => {
      closeButton.focus();
    });
  }

  function closeMenu() {
    overlay.hidden = true;
    openButton.setAttribute("aria-expanded", "false");
    document.documentElement.classList.remove("menu-open");
    setInert(false);
    if (desktopQuery.matches) return;
    const target = returnFocus instanceof HTMLElement ? returnFocus : openButton;
    requestAnimationFrame(() => {
      target.focus();
    });
  }

  overlay.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  overlay.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const items = [...overlay.querySelectorAll('a, button, summary')].filter(el => el.getClientRects().length > 0);
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  openButton.addEventListener("click", openMenu);
  closeButton.addEventListener("click", closeMenu);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || overlay.hidden) return;
    event.preventDefault();
    closeMenu();
  });
  desktopQuery.addEventListener("change", () => {
    if (desktopQuery.matches && !overlay.hidden) closeMenu();
  });
}
