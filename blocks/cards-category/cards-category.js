import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * cards-category — compact category navigation tiles.
 * Each card renders as a small thumbnail image above a short label; the whole
 * tile links to a category page.
 *
 * Expected authored structure per card (row):
 *   cell 0: image (thumbnail)
 *   cell 1: label (text, optionally a link)
 *   cell 2 (optional): tile link URL
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

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
        div.className = 'cards-category-image';
      } else {
        div.className = 'cards-category-label';
      }
    });

    // Fall back to an existing label link if no explicit link cell was provided.
    if (!linkUrl) {
      const labelAnchor = li.querySelector('.cards-category-label a');
      if (labelAnchor) linkUrl = labelAnchor.href;
    }

    if (linkUrl) {
      const tileLink = document.createElement('a');
      tileLink.className = 'cards-category-link';
      tileLink.href = linkUrl;
      while (li.firstChild) tileLink.append(li.firstChild);
      li.append(tileLink);
    }

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
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '300' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.textContent = '';
  block.append(ul);
}
