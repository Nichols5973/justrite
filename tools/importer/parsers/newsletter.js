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
  const rows = [
    ['newsletter'],
    [cell('placeholder', 'Enter your email address')],
    [cell('cta', 'Sign Up')],
    [cell('action', '/p/emailconnection-subscribe')],
  ];
  const block = WebImporter.DOMUtils.createTable(rows, document);

  // Preserve the section's heading + copy (default content), then append the
  // newsletter block below it — the source shows the form under the heading.
  const frag = document.createDocumentFragment();
  const heading = element.querySelector('h1, h2, h3');
  if (heading) {
    const h = document.createElement(heading.tagName.toLowerCase());
    h.textContent = heading.textContent.trim();
    frag.appendChild(h);
  }
  element.querySelectorAll('p').forEach((p) => {
    const text = p.textContent.replace(/\s+/g, ' ').trim();
    if (text && !p.querySelector('img, picture')) {
      const np = document.createElement('p');
      np.textContent = text;
      frag.appendChild(np);
    }
  });
  frag.appendChild(block);
  element.replaceWith(frag);
}
