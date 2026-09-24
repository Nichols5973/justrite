/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-blog. Base: cards.
 * Source: https://www.compliancesigns.com/ (.home-lastest-blogs)
 * Generated for xwalk project (field hints per card model: image, text).
 *
 * The source "News & Resources" cards are populated by a dynamic blog feed that
 * does not render reliably in static HTML. Per project decision, this block
 * ships a CURATED STATIC set of the featured articles from the source so the
 * section is always complete. The section heading + "View All" CTA are
 * section-level default content (imported separately); this block emits the
 * article cards. cards (container) block: one row per article [image, text].
 */
// Featured article (large card, left) + two secondary articles (stacked, right),
// matching the live News & Resources layout. Images use the real blog resource
// thumbnails (media/wysiwyg/Navigation/resource-N.jpg), not product photos.
const STATIC_ARTICLES = [
  {
    img: 'https://www.compliancesigns.com/media/wysiwyg/Navigation/resource-1.jpg',
    alt: 'Make Your 5S Red Tag Program Successful',
    title: 'Make Your 5S Red Tag Program Successful',
    desc: 'The first step in 5S is “Sort,” and it doesn’t have to be difficult. With an effective 5S red tag strategy, you can clear out the ‘dirt’ and cut waste from your facility.',
    href: 'https://www.compliancesigns.com/blog/improve-your-5s-red-tag-program/',
  },
  {
    img: 'https://www.compliancesigns.com/media/wysiwyg/Navigation/resource-2.jpg',
    alt: 'September is National Preparedness Month',
    title: 'September is National Preparedness Month',
    desc: 'If an emergency occurred, how would you protect the most important people in your life – and your business? Disasters don’t plan ahead… but you can!',
    href: 'https://www.compliancesigns.com/blog/september-is-national-preparedness-month/',
  },
  {
    img: 'https://www.compliancesigns.com/media/wysiwyg/Navigation/resource-3.jpg',
    alt: 'Top 10 OSHA Violations of 2026',
    title: 'Top 10 OSHA Violations of 2026',
    desc: 'The list of top OSHA citations in 2026 may look familiar - but some standards took big jumps. See the details to find out where to focus in 2027.',
    href: 'https://www.compliancesigns.com/blog/top-10-osha-violations-of-2026/',
  },
];

export default function parse(element, { document }) {
  const cells = [];

  STATIC_ARTICLES.forEach((article) => {
    // Image cell (field:image).
    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:image '));
    const img = document.createElement('img');
    img.src = article.img;
    img.alt = article.alt;
    imageCell.appendChild(img);

    // Text cell (field:text) — title, excerpt, and read-more link.
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));

    const h = document.createElement('h3');
    h.textContent = article.title;
    textCell.appendChild(h);

    const descP = document.createElement('p');
    descP.textContent = article.desc;
    textCell.appendChild(descP);

    const readMoreP = document.createElement('p');
    const a = document.createElement('a');
    a.href = article.href;
    a.textContent = 'Read More';
    readMoreP.appendChild(a);
    textCell.appendChild(readMoreP);

    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-blog', cells });

  // Preserve the "News & Resources" section heading + a "View All" link
  // (top-right on the live site) above the cards. The dynamic blog section
  // often renders without them, so fall back to static values.
  const heading = element.querySelector('h1, h2, h3');
  const frag = document.createDocumentFragment();
  const h = document.createElement('h2');
  h.textContent = heading ? heading.textContent.trim() : 'News & Resources';
  frag.appendChild(h);

  const viewAllP = document.createElement('p');
  const viewAll = document.createElement('a');
  viewAll.href = 'https://www.compliancesigns.com/blog/';
  viewAll.textContent = 'View All';
  viewAllP.appendChild(viewAll);
  frag.appendChild(viewAllP);

  frag.appendChild(block);
  element.replaceWith(frag);
}
