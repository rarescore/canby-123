/*
 * GA4 loader. This is the ONLY place the measurement ID lives.
 * GA_MEASUREMENT_ID is empty on purpose. Until a real "G-..." ID from Canby's
 * GA4 web stream is pasted here, this file does nothing: no request and no cookie.
 * Assumption: the property should be owned by the Google account that owns
 * Canby's Search Console (likely usscallisterllc@gmail.com). Confirm before setting it.
 * Privacy: GA4 page views only. No Clarity or session recording, and no form or patient data.
 * The query string is stripped from page_location. When the property is created,
 * turn OFF Enhanced Measurement "Form interactions" (it is a GA4 setting, not code).
 */
(function () {
  var GA_MEASUREMENT_ID = "G-FCLLNY1HW4"; // property 561803302 (site-changes/tracking-ids-2026-11-01.md)
  if (!/^G-[A-Z0-9]{6,}$/.test(GA_MEASUREMENT_ID) || /^G-X+$/.test(GA_MEASUREMENT_ID)) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, {
    page_location: location.origin + location.pathname,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_MEASUREMENT_ID);
  document.head.appendChild(s);
})();
