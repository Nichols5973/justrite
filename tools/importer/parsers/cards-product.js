/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-product. Base: cards.
 * Source: https://www.compliancesigns.com/ (.home-best-seller)
 * Generated for xwalk project (field hints per card model: image, text).
 *
 * Source structure: <ul.product-items> with N <li.product-item>, each holding a
 * product photo (a.product-item-photo img), a title link (a.product-item-link),
 * a price (.price-box), and a CTA (a.select-options). Iterate the stable
 * <li.product-item> wrappers. cards (container) block: one row per card
 * [image cell, text cell].
 */
export default function parse(element, { document }) {
  // Each product is an <li.product-item>; iterate those stable wrappers.
  const items = [...element.querySelectorAll('li.product-item')];

  const cells = [];

  items.forEach((item) => {
    const image = item.querySelector('img.product-image-photo, .product-item-photo img, img');
    const titleLink = item.querySelector('a.product-item-link, .product-item-name a');
    const priceBox = item.querySelector('.price-box');
    const cta = item.querySelector('a.select-options, .actions-primary a');

    // Image cell (field:image).
    const imageCell = document.createDocumentFragment();
    if (image) {
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(image);
    }

    // Text cell (field:text) — title (linked), price line, and CTA.
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    if (titleLink) {
      const h = document.createElement('h3');
      const a = document.createElement('a');
      a.href = titleLink.getAttribute('href') || '';
      a.textContent = titleLink.textContent.trim();
      h.appendChild(a);
      textCell.appendChild(h);
    }
    if (priceBox) {
      const priceText = priceBox.textContent.replace(/\s+/g, ' ').trim();
      if (priceText) {
        const p = document.createElement('p');
        p.textContent = priceText;
        textCell.appendChild(p);
      }
    }
    if (cta) {
      const ctaLink = document.createElement('a');
      ctaLink.href = cta.getAttribute('href') || '';
      ctaLink.textContent = cta.textContent.trim();
      const p = document.createElement('p');
      p.appendChild(ctaLink);
      textCell.appendChild(p);
    }

    cells.push([imageCell, textCell]);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-product', cells });
  element.replaceWith(block);
}
