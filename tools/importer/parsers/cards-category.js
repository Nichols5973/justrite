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

  // Preserve the section's intro headings above the block — the page H1
  // ("Safety Signs, Tags, Labels, and 5S Products Manufactured in the USA")
  // and the H2 ("Shop by Category") — plus the "View All Categories" link
  // below. These are section default content that would otherwise be lost when
  // the .home-shop-category element is replaced. Static fallbacks match the
  // source in case the nodes don't scrape.
  const frag = document.createDocumentFragment();

  const srcH1 = element.querySelector('h1');
  const h1 = document.createElement('h1');
  h1.textContent = srcH1
    ? srcH1.textContent.replace(/\s+/g, ' ').trim()
    : 'Safety Signs, Tags, Labels, and 5S Products Manufactured in the USA';
  frag.appendChild(h1);

  const srcH2 = element.querySelector('h2');
  const h2 = document.createElement('h2');
  h2.textContent = srcH2 ? srcH2.textContent.replace(/\s+/g, ' ').trim() : 'Shop by Category';
  frag.appendChild(h2);

  frag.appendChild(block);

  // "View All Categories" link below the grid, if present in the source.
  const viewAll = [...element.querySelectorAll('a[href]')]
    .find((a) => /view all/i.test(a.textContent));
  const vaLink = document.createElement('a');
  vaLink.href = viewAll ? viewAll.getAttribute('href') : 'https://www.compliancesigns.com/p/safety-5s-product-types';
  vaLink.textContent = viewAll ? viewAll.textContent.replace(/\s+/g, ' ').trim() : 'View All Categories';
  const vaP = document.createElement('p');
  vaP.appendChild(vaLink);
  frag.appendChild(vaP);

  element.replaceWith(frag);
}
