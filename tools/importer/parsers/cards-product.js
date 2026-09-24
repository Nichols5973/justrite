/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-product. Base: cards.
 * Source: https://www.compliancesigns.com/ (.home-best-seller)
 * Generated for xwalk project (field hints per card model: image, text).
 *
 * The source "Best Sellers" grid is populated by a dynamic product feed that
 * does not render reliably in static HTML. Per project decision, this block
 * ships a CURATED STATIC product set so the homepage is always complete and
 * self-contained. Authors can edit/extend the cards in the editor.
 * cards (container) block: one row per card [image cell, text cell].
 */
const STATIC_PRODUCTS = [
  { img: 'https://media.compliancesigns.com/media/wysiwyg/nfpa-704-nfpa-diamonds-sign-nfpa_printed_1200_150.jpg', alt: 'NFPA 704 Diamond Sign with 1-2-0-0 Hazard Ratings', title: 'NFPA 704 Diamond Sign with 1-2-0-0 Hazard Ratings', price: 'From $8.30', href: '/NFPA_PRINTED_1200' },
  { img: 'https://media.compliancesigns.com/media/wysiwyg/ada-unisex-family-assisted-sign-rrep-7030-white_on_blue_1000.jpg', alt: 'Black ADA Braille RESTROOM Sign With Accessible Symbol', title: 'Black ADA Braille RESTROOM Sign With Accessible Symbol, 9x6 in. Acrylic', price: 'From $22.40', href: '/RRE-120_White_on_Black' },
  { img: 'https://media.compliancesigns.com/media/wysiwyg/osha-flammable-sign-ode-15544_1000.jpg', alt: 'OSHA DANGER Confined Space Permit Required For Entry Sign', title: 'OSHA DANGER Confined Space Permit Required For Entry Sign', price: 'From $7.00', href: '/ODE-38982' },
  { img: 'https://media.compliancesigns.com/media/wysiwyg/osha-lockout-tagout-tag-cs669100_1000.jpg', alt: 'Blue Clean and Sweep Tools 5S Shadow Board', title: 'Blue Clean and Sweep Tools 5S Shadow Board', price: 'As low as $281.10', href: '/51BSCB' },
  { img: 'https://media.compliancesigns.com/media/wysiwyg/fire-extinguisher-sign-nhe-7470tri_1000.jpg', alt: 'Vertical Fire Extinguisher Sign', title: 'Vertical Fire Extinguisher Sign', price: 'From $8.30', href: '/NHE-7470' },
  { img: 'https://media.compliancesigns.com/media/catalog/product/cache/7a15876e2ecf8b844c2f5038b0f9fdd9/c/u/custom-osha-ansi-text-300.jpg', alt: 'Custom OSHA / ANSI Sign with Text Options', title: 'Custom OSHA / ANSI Sign with Text Options', price: 'From $5.10', href: '/OSHA-ANSI-CUSTOM1' },
];

export default function parse(element, { document }) {
  const cells = [];

  STATIC_PRODUCTS.forEach((product) => {
    // Image cell (field:image).
    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:image '));
    const img = document.createElement('img');
    img.src = product.img;
    img.alt = product.alt;
    imageCell.appendChild(img);

    // Text cell (field:text) — title (linked), price line, and CTA.
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));

    const h = document.createElement('h3');
    const a = document.createElement('a');
    a.href = product.href;
    a.textContent = product.title;
    h.appendChild(a);
    textCell.appendChild(h);

    const priceP = document.createElement('p');
    priceP.textContent = product.price;
    textCell.appendChild(priceP);

    const ctaP = document.createElement('p');
    const ctaLink = document.createElement('a');
    ctaLink.href = product.href;
    ctaLink.textContent = 'Select Options';
    ctaP.appendChild(ctaLink);
    textCell.appendChild(ctaP);

    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-product', cells });

  // Preserve the "Best Sellers" section heading above the block. The source
  // renders it dynamically so it may not be present in the scraped element;
  // fall back to the static heading so the section is always labelled.
  const heading = element.querySelector('h1, h2, h3');
  const frag = document.createDocumentFragment();
  const h = document.createElement('h2');
  h.textContent = heading ? heading.textContent.trim() : 'Best Sellers';
  frag.appendChild(h);
  frag.appendChild(block);
  element.replaceWith(frag);
}
