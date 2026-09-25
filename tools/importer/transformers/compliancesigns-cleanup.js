/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: compliancesigns.com site-wide cleanup.
 *
 * Removes non-authorable site chrome and third-party overlay widgets so the
 * import contains only page-level authorable content (main > div.home-content).
 *
 * All selectors below were verified by reading migration-work/cleaned.html:
 *   - <header id="main-header" class="header-thick scrolled">          (global nav/header)
 *   - <footer class="container-fluid footer " id="new_footer">         (global footer)
 *   - <div id="bottom-banner">                                         (bottom promo banner)
 *   - <div ... id="searchspring-div" class="homepage ...">             (SearchSpring PLP widget, sibling after content)
 *   - <div id="CybotCookiebotDialog"> + [id^="CybotCookiebot"] + [class^="Cybot"] (Cookiebot consent)
 *   - <div id="hs-web-interactives-floating-container"> + #hs-interactives-modal-overlay + [id^="hs-web-interactives-"] (HubSpot)
 *   - <div id="userwayAccessibilityIcon"> + <div class="uwy ..."> + #uw-open-accessibility (UserWay accessibility)
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays / third-party widgets — removed before block parsing so they
    // never interfere with block matching. Selectors from captured DOM.
    WebImporter.DOMUtils.remove(element, [
      // Cookiebot cookie-consent dialog
      '#CybotCookiebotDialog',
      '[id^="CybotCookiebot"]',
      '[class^="CybotCookiebot"]',
      '#CookiebotWidget',
      // HubSpot web-interactives (floating containers, modal overlay, anchors)
      '#hs-web-interactives-floating-container',
      '#hs-interactives-modal-overlay',
      '[id^="hs-web-interactives-"]',
      // UserWay accessibility widget (incl. its injected skip-link buttons:
      // "Skip to main content" / "Enable accessibility for low vision")
      '#userwayAccessibilityIcon',
      '.uwy',
      '#uw-open-accessibility',
      '.uw-sl',
      '[id^="uw-skip"]',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome and non-content widgets. Selectors from captured DOM.
    WebImporter.DOMUtils.remove(element, [
      // Global header / navigation (detected: #main-header)
      '#main-header',
      'header',
      // Global footer (detected: #new_footer)
      '#new_footer',
      'footer',
      // Bottom promotional banner overlay
      '#bottom-banner',
      // SearchSpring product-listing widget (sibling after home-content)
      '#searchspring-div',
      // Leftover non-authorable elements
      'iframe',
      'noscript',
      'link',
    ]);

    // Analytics tracking pixels (e.g. Bing UET <img src="https://bat.bing.com/action/...">)
    // injected into the page body. They are not content, and in AEM an image
    // outside the DAM renders as link text. Drop them and any wrapper left empty.
    const TRACKING_PIXELS = [
      'img[src*="bat.bing.com"]',
      'img[src*="facebook.com/tr"]',
      'img[src*="doubleclick.net"]',
      'img[src*="googleadservices.com"]',
      'img[src*="google-analytics.com"]',
      'img[src*="px.ads.linkedin.com"]',
    ];
    element.querySelectorAll(TRACKING_PIXELS.join(',')).forEach((img) => {
      let parent = img.parentElement;
      img.remove();
      while (parent && parent !== element && !parent.textContent.trim() && !parent.querySelector('img, picture, video, iframe')) {
        const next = parent.parentElement;
        parent.remove();
        parent = next;
      }
    });
  }
}
