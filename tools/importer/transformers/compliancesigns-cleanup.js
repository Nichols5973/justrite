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
      // UserWay accessibility widget
      '#userwayAccessibilityIcon',
      '.uwy',
      '#uw-open-accessibility',
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
  }
}
