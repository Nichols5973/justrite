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
    // Image cell (field:image) — left empty: an image field can't hold the
    // text star rating (AEM drops it), so the stars live in the text below.
    const imageCell = document.createDocumentFragment();

    // Text cell (field:text) — headline, star rating, quote, reviewer name.
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));

    const h = document.createElement('h3');
    h.textContent = review.title;
    textCell.appendChild(h);

    const ratingP = document.createElement('p');
    ratingP.textContent = review.rating;
    textCell.appendChild(ratingP);

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

  // Below the cards: the Trustpilot rating line ("Rated 4.3/5 based on 5,000+
  // reviews. Showing our 4 & 5 star reviews.") + the Trustpilot logo. This is
  // section-level content in the source that would be lost when the
  // .home-customer-review element is replaced.
  const frag = document.createDocumentFragment();
  frag.appendChild(block);

  const rated = document.createElement('p');
  rated.className = 'cards-review-rating-line';
  rated.appendChild(document.createTextNode('Rated 4.3/5 based on '));
  const link = document.createElement('a');
  link.href = 'https://www.trustpilot.com/review/www.compliancesigns.com';
  link.textContent = '5,000+ reviews';
  rated.appendChild(link);
  rated.appendChild(document.createTextNode('. Showing our 4 & 5 star reviews.'));
  const tp = document.createElement('img');
  tp.src = 'https://www.compliancesigns.com/images/trustpilot.png';
  tp.alt = 'Trustpilot';
  rated.appendChild(tp);
  frag.appendChild(rated);

  element.replaceWith(frag);
}
