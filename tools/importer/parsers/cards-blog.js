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
const STATIC_ARTICLES = [
  {
    img: 'https://media.compliancesigns.com/media/wysiwyg/osha-authorized-personnel-only-sign-one-1336_1000.jpg',
    alt: 'Safe + Sound Week Helps Employers Improve Workplace Safety',
    title: 'Safe + Sound Week Helps Employers Improve Workplace Safety',
    desc: "OSHA's Safe + Sound campaign helps employers keep workplaces safe and healthy.",
    href: 'https://www.compliancesigns.com/blog/oshas-safe-and-sound-campaign-helps-employers-keep-workplaces-safe-and-healthy/',
  },
  {
    img: 'https://media.compliancesigns.com/media/wysiwyg/osha-flammable-sign-ode-15544_1000.jpg',
    alt: '5 Steps for Effective Safety Conversations',
    title: '5 Steps for Effective Safety Conversations',
    desc: 'Follow these 5 steps for effective safety conversations in your workplace.',
    href: 'https://www.compliancesigns.com/blog/follow-these-5-steps-for-effective-safety-conversations/',
  },
  {
    img: 'https://media.compliancesigns.com/media/wysiwyg/osha-electrical-high-voltage-sign-ode-3686_1000.jpg',
    alt: 'The Top 5 CNC Machining Hazards and the Safety Signs That Keep Workers Safe',
    title: 'The Top 5 CNC Machining Hazards and the Safety Signs That Keep Workers Safe',
    desc: 'Learn the top CNC machining hazards and the required safety signs that protect workers.',
    href: 'https://www.compliancesigns.com/blog/top-cnc-machining-hazards-required-safety-signs/',
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

  // Preserve the "News & Resources" section heading if present in the matched
  // element; the dynamic blog section often renders without it, so fall back to
  // a static heading so the section is always labelled.
  const heading = element.querySelector('h1, h2, h3');
  const frag = document.createDocumentFragment();
  const h = document.createElement('h2');
  h.textContent = heading ? heading.textContent.trim() : 'News & Resources';
  frag.appendChild(h);
  frag.appendChild(block);
  element.replaceWith(frag);
}
