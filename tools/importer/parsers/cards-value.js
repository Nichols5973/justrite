/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-value. Base: cards.
 * Source: https://www.compliancesigns.com/ (.home-why-csign)
 * Generated for xwalk project (field hints per card model: image, text).
 *
 * Source structure: a .pagebuilder-column-group holds N .pagebuilder-column
 * value items, each with a <figure> icon (duplicate mobile/desktop imgs with
 * identical src), an <h3> heading, and a <p> description. Iterate the stable
 * .pagebuilder-column wrappers. The intro heading (h2 "Why ComplianceSigns?" +
 * p.sub-title) is section-level content, not a card.
 * cards (container) block: one row per value item [image cell, text cell].
 */
export default function parse(element, { document }) {
  const items = [...element.querySelectorAll('.pagebuilder-column')];

  const cells = [];

  items.forEach((item) => {
    // Two <img> per figure are mobile/desktop duplicates with identical src — take one.
    const image = item.querySelector('figure img, img');
    const heading = item.querySelector('h3, h4');
    const desc = item.querySelector('div p, p');

    // Image cell (field:image) — the value icon.
    const imageCell = document.createDocumentFragment();
    if (image) {
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(image);
    }

    // Text cell (field:text) — heading + description.
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    if (heading) {
      const h = document.createElement('h3');
      h.textContent = heading.textContent.replace(/\s+/g, ' ').trim();
      textCell.appendChild(h);
    }
    if (desc) {
      const p = document.createElement('p');
      p.textContent = desc.textContent.replace(/\s+/g, ' ').trim();
      textCell.appendChild(p);
    }

    cells.push([imageCell, textCell]);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-value', cells });

  // Preserve the section's intro heading ("Why ComplianceSigns?") + subtitle
  // above the block. These are section-level default content that would
  // otherwise be lost when we replace the .home-why-csign element. Fall back to
  // the source's static copy if the nodes don't scrape.
  const frag = document.createDocumentFragment();
  const srcHeading = element.querySelector('h2, h1');
  const h = document.createElement('h2');
  h.textContent = srcHeading ? srcHeading.textContent.replace(/\s+/g, ' ').trim() : 'Why ComplianceSigns?';
  frag.appendChild(h);

  const srcSub = element.querySelector('.sub-title');
  const sub = document.createElement('p');
  sub.textContent = srcSub
    ? srcSub.textContent.replace(/\s+/g, ' ').trim()
    : 'Quality you can trust. In our products. In our people. In every order';
  frag.appendChild(sub);

  frag.appendChild(block);
  element.replaceWith(frag);
}
