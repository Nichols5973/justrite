import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * cards-value — value-proposition items.
 * Each card renders a small centered icon above a heading and a short
 * description. No CTA.
 *
 * Expected authored structure per card (row):
 *   cell 0: icon image
 *   cell 1: body (heading + description)
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    // Drop empty extra cells (e.g. an unset CTA Style field in AEM).
    [...li.children].slice(1).forEach((div) => {
      if (!div.textContent.trim() && !div.querySelector('picture, img')) div.remove();
    });

    [...li.children].forEach((div, index) => {
      if (index === 0) {
        div.className = 'cards-value-icon';
      } else {
        div.className = 'cards-value-body';
      }
    });

    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    // Only run EDS image optimization for same-origin media; external
    // absolute URLs (e.g. media.compliancesigns.com) must be preserved as-is,
    // otherwise createOptimizedPicture drops the host and the src 404s.
    let sameOrigin = true;
    try {
      sameOrigin = new URL(img.src, window.location.href).origin === window.location.origin;
    } catch (e) {
      sameOrigin = false;
    }
    if (!sameOrigin) return;
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '150' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.textContent = '';
  block.append(ul);
}
