/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-promo. Base: cards.
 * Source: https://www.compliancesigns.com/ (.home-banner-section)
 * Generated for xwalk project (field hints per card model: image, text).
 *
 * Source structure: each promo tile is an <a class="banner-item"> wrapping an
 * <img> and a .banner-text (h2.banner-title + p.banner-desc + span.button-orange).
 * The tiles have distinct hrefs, so html2md inline-merge does not fold them.
 * cards (container) block: one row per card -> [image cell, text cell].
 */
export default function parse(element, { document }) {
  // Each promo tile is an anchor; distinct hrefs make sibling-anchor iteration safe.
  const items = [...element.querySelectorAll('a.banner-item')];

  const cells = [];

  items.forEach((item) => {
    const image = item.querySelector('img');
    const heading = item.querySelector('.banner-title, h2, h3');
    const desc = item.querySelector('.banner-desc, p');
    const ctaLabel = item.querySelector('.button-orange, .button, [class*="button"]');
    const href = item.getAttribute('href');

    // Image cell (field:image). Include the cell even if empty.
    const imageCell = document.createDocumentFragment();
    if (image) {
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(image);
    }

    // Text cell (field:text) — heading + description + CTA rendered as rich text.
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    if (heading) textCell.appendChild(heading);
    if (desc) textCell.appendChild(desc);
    // Preserve the tile link by rendering the CTA label as an anchor.
    if (ctaLabel && href) {
      const cta = document.createElement('a');
      cta.href = href;
      cta.textContent = ctaLabel.textContent.trim();
      const p = document.createElement('p');
      p.appendChild(cta);
      textCell.appendChild(p);
    } else if (ctaLabel) {
      textCell.appendChild(ctaLabel);
    }

    cells.push([imageCell, textCell]);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-promo', cells });
  element.replaceWith(block);
}
