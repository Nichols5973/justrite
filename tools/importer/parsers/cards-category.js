/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-category. Base: cards.
 * Source: https://www.compliancesigns.com/ (.home-shop-category)
 * Generated for xwalk project (field hints per card model: image, text).
 *
 * Source structure: a pagebuilder-column holds N <figure> tiles, each with an
 * <a href> wrapping duplicate mobile/desktop <img> (identical src) and a
 * <figcaption> label. Iterate the <figure> wrappers (stable, non-inline) so the
 * item count is safe. cards (container) block: one row per card [image, text].
 */
export default function parse(element, { document }) {
  // Each category tile is a <figure>; iterate those stable wrappers, not anchors.
  const figures = [...element.querySelectorAll('figure')];

  const cells = [];

  figures.forEach((figure) => {
    // Two <img> per figure are mobile/desktop duplicates with identical src — take one.
    const image = figure.querySelector('img');
    const anchor = figure.querySelector('a[href]');
    const caption = figure.querySelector('figcaption');
    const href = anchor ? anchor.getAttribute('href') : '';
    const labelText = caption ? caption.textContent.trim() : '';

    // Image cell (field:image).
    const imageCell = document.createDocumentFragment();
    if (image) {
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(image);
    }

    // Text cell (field:text) — the caption label, linked to the category page.
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    if (labelText && href) {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = labelText;
      const p = document.createElement('p');
      p.appendChild(link);
      textCell.appendChild(p);
    } else if (labelText) {
      const p = document.createElement('p');
      p.textContent = labelText;
      textCell.appendChild(p);
    }

    cells.push([imageCell, textCell]);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-category', cells });
  element.replaceWith(block);
}
