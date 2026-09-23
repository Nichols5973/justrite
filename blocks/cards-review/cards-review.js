import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * cards-review — customer testimonial cards.
 * Each card is text-only: a star rating, a headline, a quote, and the reviewer
 * name. Rendered on a dark section background (styling applied by the section /
 * design pass).
 *
 * Expected authored structure per card (row): a single body cell containing the
 * rating, headline, quote, and reviewer name as stacked paragraphs/headings.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((div) => {
      div.className = 'cards-review-body';
    });

    ul.append(li);
  });

  block.textContent = '';
  block.append(ul);
}
