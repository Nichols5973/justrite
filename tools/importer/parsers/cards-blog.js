/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-blog. Base: cards.
 * Source: https://www.compliancesigns.com/ (.home-lastest-blogs)
 * Generated for xwalk project (field hints per card model: image, text).
 *
 * Source structure: .blogs holds .blog-left / .blog-right columns of .blog-item
 * cards, each with .blog-img img, h3.blog-title, p.blog-desc, and an
 * a.read-more link. Iterate the stable .blog-item wrappers. The section heading
 * and "View All" CTA are section-level content, not cards.
 * cards (container) block: one row per article [image cell, text cell].
 */
export default function parse(element, { document }) {
  // Each article is a stable .blog-item wrapper (div, not inline).
  const items = [...element.querySelectorAll('.blog-item')];

  const cells = [];

  items.forEach((item) => {
    const image = item.querySelector('.blog-img img, img');
    const title = item.querySelector('.blog-title, h3');
    const desc = item.querySelector('.blog-desc, p');
    const readMore = item.querySelector('a.read-more, a[href]');

    // Image cell (field:image).
    const imageCell = document.createDocumentFragment();
    if (image) {
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(image);
    }

    // Text cell (field:text) — title, excerpt, and read-more link.
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    if (title) {
      const h = document.createElement('h3');
      h.textContent = title.textContent.replace(/\s+/g, ' ').trim();
      textCell.appendChild(h);
    }
    if (desc) {
      const p = document.createElement('p');
      p.textContent = desc.textContent.replace(/\s+/g, ' ').trim();
      textCell.appendChild(p);
    }
    if (readMore) {
      const a = document.createElement('a');
      a.href = readMore.getAttribute('href') || '';
      a.textContent = readMore.textContent.replace(/\s+/g, ' ').trim();
      const p = document.createElement('p');
      p.appendChild(a);
      textCell.appendChild(p);
    }

    cells.push([imageCell, textCell]);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-blog', cells });
  element.replaceWith(block);
}
