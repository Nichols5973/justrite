import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * cards-review — customer testimonial cards on the dark-blue Reviews section.
 * Each authored card row has two cells:
 *   cell 0 (image): the star rating (e.g. ★★★★★)
 *   cell 1 (text):  headline (h3), quote (p), reviewer name (p > em)
 *
 * The live layout inside a card is: headline → star rating → quote → reviewer.
 * So we pull the rating out of cell 0 and re-insert it directly under the
 * headline.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

    const cells = [...row.children];
    const ratingCell = cells[0];
    const textCell = cells[1] || cells[0];

    // Extract the rating text (stars).
    const ratingText = ratingCell ? ratingCell.textContent.trim() : '';

    const body = document.createElement('div');
    body.className = 'cards-review-body';

    // Move the text-cell children (headline, quote, author) into the body.
    if (textCell) {
      while (textCell.firstElementChild) body.append(textCell.firstElementChild);
    }

    // Build the star rating element and insert it right after the headline.
    if (ratingText) {
      const stars = document.createElement('p');
      stars.className = 'cards-review-stars';
      stars.textContent = ratingText;
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
