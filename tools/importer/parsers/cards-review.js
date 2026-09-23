/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-review. Base: cards.
 * Source: https://www.compliancesigns.com/ (.home-customer-review)
 * Generated for xwalk project (field hints per card model: image, text).
 *
 * The source review slider is powered by a Trustpilot widget that is disabled
 * at render time (showTrustPilot:false), so no cards exist in static HTML. Per
 * project decision, this block ships a CURATED STATIC set of the verified
 * testimonials shown on the source page so the section is complete. The
 * "Reviews Are In" intro heading is section-level default content (imported
 * separately); this block only emits the review cards.
 * cards (container) block: one row per review [image cell, text cell].
 */
const STATIC_REVIEWS = [
  {
    rating: '★★★★★',
    title: 'Easy to find products',
    quote: 'The ease in which I was able to find & customize the signs I needed was amazing. Definitely number one in my book. With that being said, I recommend Compliance Signs to your signage projects and needs.',
    author: 'Keith J.',
  },
  {
    rating: '★★★★★',
    title: 'Outstanding Customer Service',
    quote: 'I received a 5-star customer service from the person that helped me over the phone. Very attentive and guided me in the right direction regarding the sign that I needed to purchase.',
    author: 'Glenda H.',
  },
  {
    rating: '★★★★★',
    title: 'Easy to Use',
    quote: 'Site was easy to use and I was able to quickly locate and request the specific items I needed and have them arranged to be shipped straight away. Will definitely be returning to use this site again in the future for compliance needs!',
    author: 'Richard H.',
  },
];

export default function parse(element, { document }) {
  const cells = [];

  STATIC_REVIEWS.forEach((review) => {
    // Image cell (field:image) — star rating rendered as text.
    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:image '));
    const ratingP = document.createElement('p');
    ratingP.textContent = review.rating;
    imageCell.appendChild(ratingP);

    // Text cell (field:text) — headline, quote, and reviewer name.
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));

    const h = document.createElement('h3');
    h.textContent = review.title;
    textCell.appendChild(h);

    const quoteP = document.createElement('p');
    quoteP.textContent = review.quote;
    textCell.appendChild(quoteP);

    const authorP = document.createElement('p');
    const em = document.createElement('em');
    em.textContent = review.author;
    authorP.appendChild(em);
    textCell.appendChild(authorP);

    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-review', cells });
  element.replaceWith(block);
}
