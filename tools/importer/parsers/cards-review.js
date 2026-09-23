/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-review. Base: cards.
 * Source: https://www.compliancesigns.com/ (.home-customer-review)
 * Generated for xwalk project (field hints per card model: image, text).
 *
 * Source structure: .review-right holds a slick slider of .review-item cards,
 * each with a rating image, a .title headline, a .review-text quote, and a
 * .review-author name. Iterate the stable .review-item wrappers. The .review-left
 * intro (heading + "View All Reviews" CTA) is section-level content, not a card.
 * cards (container) block: one row per review [image cell, text cell].
 */
export default function parse(element, { document }) {
  // Only real slides (skip slick clones, which carry a slick-cloned class).
  const items = [...element.querySelectorAll('.review-item')]
    .filter((item) => !item.closest('.slick-cloned'));

  const cells = [];
  const seen = new Set();

  items.forEach((item) => {
    const title = item.querySelector('.title');
    const text = item.querySelector('.review-text');
    const author = item.querySelector('.review-author');
    const ratingImg = item.querySelector('.review-rating img, img');

    // De-dupe on quote text in case the slider markup repeats a slide.
    const key = (text ? text.textContent : title ? title.textContent : '').replace(/\s+/g, ' ').trim();
    if (key && seen.has(key)) return;
    if (key) seen.add(key);

    // Image cell (field:image) — the star rating graphic.
    const imageCell = document.createDocumentFragment();
    if (ratingImg) {
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(ratingImg.cloneNode(true));
    }

    // Text cell (field:text) — headline, quote, and reviewer name.
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    if (title) {
      const h = document.createElement('h3');
      h.textContent = title.textContent.replace(/\s+/g, ' ').trim();
      textCell.appendChild(h);
    }
    if (text) {
      const p = document.createElement('p');
      p.textContent = text.textContent.replace(/\s+/g, ' ').trim();
      textCell.appendChild(p);
    }
    if (author) {
      const p = document.createElement('p');
      const em = document.createElement('em');
      em.textContent = author.textContent.replace(/\s+/g, ' ').trim();
      p.appendChild(em);
      textCell.appendChild(p);
    }

    cells.push([imageCell, textCell]);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-review', cells });
  element.replaceWith(block);
}
