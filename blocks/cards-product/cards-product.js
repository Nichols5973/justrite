import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * cards-product — product listing cards.
 * Each card renders as a bordered tile: product image, title, price line, and a
 * call-to-action button (e.g. "Select Options").
 *
 * Expected authored structure per card (row):
 *   cell 0: image (product photo)
 *   cell 1: body (title + price + CTA link)
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
        div.className = 'cards-product-image';
      } else {
        div.className = 'cards-product-body';
      }
    });

    // Split the price line ("From $8.30" / "As low as $281.10") into a regular
    // label and a bold amount so each can be styled like the source design.
    const body = li.querySelector('.cards-product-body');
    if (body) {
      const priceP = [...body.querySelectorAll('p')].find(
        (p) => !p.querySelector('a') && /\$\s*[\d.,]+/.test(p.textContent),
      );
      if (priceP) {
        const match = priceP.textContent.match(/^(.*?)(\$\s*[\d.,]+.*)$/s);
        if (match) {
          const label = match[1].trim();
          const amount = match[2].trim();
          priceP.classList.add('cards-product-price');
          priceP.textContent = '';
          if (label) {
            const labelSpan = document.createElement('span');
            labelSpan.className = 'cards-product-price-label';
            labelSpan.textContent = label;
            priceP.append(labelSpan, ' ');
          }
          const amountSpan = document.createElement('span');
          amountSpan.className = 'cards-product-price-amount';
          amountSpan.textContent = amount;
          priceP.append(amountSpan);
        }
      }
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
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.textContent = '';
  block.append(ul);
}
