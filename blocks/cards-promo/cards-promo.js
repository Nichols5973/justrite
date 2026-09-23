import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * cards-promo — promotional banner tiles.
 * Each card renders as a clickable tile with a full-bleed background image and
 * overlaid heading, short description, and a call-to-action label.
 *
 * Expected authored structure per card (row):
 *   cell 0: image
 *   cell 1: body (heading + description + CTA text/link)
 *   cell 2 (optional): link URL that makes the whole tile clickable
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

    // Optional trailing cell holding the tile-level link URL.
    let linkUrl = '';
    const cells = [...row.children];
    if (cells.length > 2) {
      const lastCell = cells[cells.length - 1];
      const anchor = lastCell.querySelector('a');
      const text = lastCell.textContent.trim();
      if (anchor) {
        linkUrl = anchor.href;
      } else if (/^https?:\/\//.test(text) || text.startsWith('/')) {
        linkUrl = text;
      }
      if (linkUrl) lastCell.remove();
    }

    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((div, index) => {
      if (index === 0) {
        div.className = 'cards-promo-image';
      } else {
        div.className = 'cards-promo-body';
      }
    });

    // Make the whole tile clickable when a link is provided.
    if (linkUrl) {
      const tileLink = document.createElement('a');
      tileLink.className = 'cards-promo-link';
      tileLink.href = linkUrl;
      while (li.firstChild) tileLink.append(li.firstChild);
      li.append(tileLink);
    }

    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    // Only run EDS image optimization for same-origin (local) assets.
    // External CDN URLs (e.g. media.compliancesigns.com) must be preserved
    // as-is; optimizing them rewrites the origin and breaks the image.
    let isExternal = false;
    try {
      isExternal = new URL(img.src, window.location.href).origin !== window.location.origin;
    } catch (e) {
      isExternal = false;
    }
    if (isExternal) return;
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.textContent = '';
  block.append(ul);
}
