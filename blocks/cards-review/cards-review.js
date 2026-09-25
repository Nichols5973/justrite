import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * cards-review — customer testimonial cards on the dark-blue Reviews section.
 * Each authored card row has two cells:
 *   cell 0 (image): unused (older content: the star rating, e.g. ★★★★★)
 *   cell 1 (text):  headline (h3), star rating (p), quote (p), reviewer (p > em)
 *
 * The live layout inside a card is: headline → star rating → quote → reviewer.
 * A stars-only paragraph is styled as the rating and kept directly under the
 * headline, wherever it was authored.
 */
const STARS = /^[★☆\s]+$/;
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

    const cells = [...row.children];
    const ratingCell = cells.length > 1 ? cells[0] : null;
    const textCell = cells[1] || cells[0];

    const body = document.createElement('div');
    body.className = 'cards-review-body';

    // Move the text-cell children (headline, stars, quote, author) into the body.
    if (textCell) {
      while (textCell.firstElementChild) body.append(textCell.firstElementChild);
    }

    // Star rating: a stars-only paragraph in the text, or (older content) the
    // text of the image cell.
    let stars = [...body.querySelectorAll('p')].find((p) => STARS.test(p.textContent) && p.textContent.trim());
    const ratingText = ratingCell ? ratingCell.textContent.trim() : '';
    if (!stars && ratingText && STARS.test(ratingText)) {
      stars = document.createElement('p');
      stars.textContent = ratingText;
    }
    if (stars) {
      stars.className = 'cards-review-stars';
      const heading = body.querySelector('h2, h3, h4');
      if (heading) heading.after(stars);
      else body.prepend(stars);
    }

    li.append(body);
    ul.append(li);
  });

  block.textContent = '';
  block.append(ul);
}
