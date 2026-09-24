import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * cards-blog — editorial article cards.
 * Each card renders a featured image above a title, short excerpt, and a
 * read-more link.
 *
 * Expected authored structure per card (row):
 *   cell 0: image (featured image)
 *   cell 1: body (title + excerpt + read-more link)
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row, cardIndex) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    // First card is the large featured article (left); the rest stack (right).
    if (cardIndex === 0) li.classList.add('cards-blog-featured');
    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((div, index) => {
      if (index === 0) {
        div.className = 'cards-blog-image';
      } else {
        div.className = 'cards-blog-body';
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
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.textContent = '';
  block.append(ul);
}
