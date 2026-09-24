/* eslint-disable */
/* global WebImporter */
/**
 * Parser for newsletter. Base: standalone.
 * Source: https://www.compliancesigns.com/ (.home-sign-up)
 *
 * The source email signup is a dynamic HubSpot form absent from static HTML,
 * so there is nothing to scrape. This emits a curated static newsletter block
 * (email input + Sign Up button rendered by blocks/newsletter/newsletter.js).
 * The section heading + copy are section-level default content.
 */
export default function parse(element, { document }) {
  // Modeled xwalk block: each field is a single-column body cell carrying a
  // `field:<name>` hint + value (md2jcr rejects two-column key/value rows for a
  // multi-field model). The block JS reads these hint-labelled rows.
  const cell = (fieldName, value) => {
    const div = document.createElement('div');
    div.append(document.createComment(` field:${fieldName} `));
    const p = document.createElement('p');
    p.textContent = value;
    div.append(p);
    return div;
  };
  // Config, in fixed positional order: cta (submit label), action (URL),
  // intro (text above the form), footnote (text below the form).
  const rows = [
    ['newsletter'],
    [cell('cta', 'Submit')],
    [cell('action', '/p/emailconnection-subscribe')],
    [cell('intro', "Don't Miss Out On Important Updates! Find out about the latest news, promotions, special offers and more.")],
    [cell('footnote', 'Save 5% off your first order. Sign up today & save!')],
  ];
  const block = WebImporter.DOMUtils.createTable(rows, document);

  // Preserve the section's background image + heading as default content above
  // the block. The intro/footnote copy is rendered by the block (above/below
  // the form), so paragraphs are intentionally not duplicated here.
  const frag = document.createDocumentFragment();
  const bgImg = element.querySelector('picture, img');
  if (bgImg) {
    const p = document.createElement('p');
    p.appendChild(bgImg.closest('picture') || bgImg);
    frag.appendChild(p);
  }
  const heading = element.querySelector('h1, h2, h3');
  if (heading) {
    const h = document.createElement(heading.tagName.toLowerCase());
    h.textContent = heading.textContent.trim();
    frag.appendChild(h);
  }
  frag.appendChild(block);
  element.replaceWith(frag);
}
