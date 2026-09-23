/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-industry. Base: tabs.
 * Source: https://www.compliancesigns.com/ (.home-food-service)
 * Generated for xwalk project.
 *
 * The source "Industry Based Safety Signs & Labels" panels are populated by a
 * dynamic product feed that does not render in static HTML, so scraping yields
 * empty panels. Per project decision, this block ships a CURATED STATIC tab set
 * (4 industries, each a featured banner + a few representative product cards)
 * so the homepage renders complete and self-contained. Authors can later edit
 * or extend the tabs in the editor.
 *
 * xwalk item model (tabs-industry-item): title (cell 1), plus the grouped
 * content_* fields in cell 2 — content_image and content_richtext.
 */
const STATIC_TABS = [
  {
    title: 'Manufacturing',
    bannerImg: 'https://media.compliancesigns.com/media/wysiwyg/CSigns_310x485_Manufacturing-sign.jpg',
    bannerAlt: 'Manufacturing',
    shopAllHref: '/products/industrial-notices/manufacturing-signs',
    products: [
      { img: 'https://media.compliancesigns.com/media/wysiwyg/osha-flammable-sign-ode-15544_1000.jpg', alt: 'OSHA DANGER Confined Space', title: 'OSHA DANGER Confined Space Permit Required For Entry Sign', price: 'From $7.00', href: '/ODE-38982' },
      { img: 'https://media.compliancesigns.com/media/wysiwyg/fire-extinguisher-sign-nhe-7470tri_1000.jpg', alt: 'OSHA EMERGENCY Eye Wash Station', title: 'OSHA EMERGENCY Eye Wash Station Sign', price: 'From $7.00', href: '/NHE-7470' },
      { img: 'https://media.compliancesigns.com/media/wysiwyg/osha-lockout-tagout-tag-cs669100_1000.jpg', alt: 'OSHA DANGER Do Not Operate', title: 'OSHA DANGER Do Not Operate Lock/Tag May Only Be Removed By Tag', price: 'From $6.30', href: '/CS669100' },
      { img: 'https://media.compliancesigns.com/media/wysiwyg/nfpa-704-nfpa-diamonds-sign-nfpa_printed_1200_150.jpg', alt: 'OSHA NOTICE PPE Required', title: 'OSHA NOTICE PPE Required Beyond This Point Sign', price: 'From $7.00', href: '/NFPA_PRINTED_1200' },
    ],
  },
  {
    title: 'Construction',
    bannerImg: 'https://media.compliancesigns.com/media/wysiwyg/osha-authorized-personnel-only-sign-one-1336_1000.jpg',
    bannerAlt: 'Construction',
    shopAllHref: '/c/construction-safety-signs',
    products: [
      { img: 'https://media.compliancesigns.com/media/wysiwyg/ada-unisex-family-assisted-sign-rrep-7030-white_on_blue_1000.jpg', alt: 'Hard Hat Area Sign', title: 'OSHA NOTICE Hard Hat Area Sign', price: 'From $9.00', href: '/ONE-1336' },
    ],
  },
  {
    title: 'Transportation',
    bannerImg: 'https://media.compliancesigns.com/media/wysiwyg/parking-not-allowed-reflective-sign-cs911647_1000.jpg',
    bannerAlt: 'Transportation',
    shopAllHref: '/c/roadway-transportation-signs',
    products: [
      { img: 'https://media.compliancesigns.com/media/wysiwyg/alarm-will-sound-sign-nhe-19901_1000.jpg', alt: 'No Parking Sign', title: 'Reflective No Parking Any Time Sign', price: 'From $12.00', href: '/CS911647' },
    ],
  },
  {
    title: 'Food & Beverage',
    bannerImg: 'https://media.compliancesigns.com/media/wysiwyg/osha-electrical-high-voltage-sign-ode-3686_1000.jpg',
    bannerAlt: 'Food & Beverage',
    shopAllHref: '/c/food-safety-kitchen-signs',
    products: [
      { img: 'https://media.compliancesigns.com/media/wysiwyg/ada-accessibility-sign-rre-190_white_on_blue_1000_1.jpg', alt: 'Wash Hands Sign', title: 'Employees Must Wash Hands Sign', price: 'From $8.00', href: '/ODE-3686' },
    ],
  },
];

export default function parse(element, { document }) {
  const cells = [];

  STATIC_TABS.forEach((tab) => {
    // Cell 1: tab title.
    const titleCell = document.createDocumentFragment();
    titleCell.appendChild(document.createComment(' field:title '));
    const titleP = document.createElement('p');
    titleP.textContent = tab.title;
    titleCell.appendChild(titleP);

    // Cell 2: grouped content_* fields.
    const contentCell = document.createDocumentFragment();

    // content_image: the featured industry banner image.
    const img = document.createElement('img');
    img.src = tab.bannerImg;
    img.alt = tab.bannerAlt;
    contentCell.appendChild(document.createComment(' field:content_image '));
    contentCell.appendChild(img);

    // content_richtext: featured "Shop All" CTA + representative product cards.
    contentCell.appendChild(document.createComment(' field:content_richtext '));

    const shopAll = document.createElement('a');
    shopAll.href = tab.shopAllHref;
    shopAll.textContent = 'Shop All';
    const shopAllP = document.createElement('p');
    shopAllP.appendChild(shopAll);
    contentCell.appendChild(shopAllP);

    tab.products.forEach((product) => {
      const pImg = document.createElement('p');
      const productImg = document.createElement('img');
      productImg.src = product.img;
      productImg.alt = product.alt;
      pImg.appendChild(productImg);
      contentCell.appendChild(pImg);

      const priceP = document.createElement('p');
      priceP.textContent = product.price;
      contentCell.appendChild(priceP);

      const h = document.createElement('h3');
      const a = document.createElement('a');
      a.href = product.href;
      a.textContent = product.title;
      h.appendChild(a);
      contentCell.appendChild(h);

      const selectP = document.createElement('p');
      const selectA = document.createElement('a');
      selectA.href = product.href;
      selectA.textContent = 'Select Options';
      selectP.appendChild(selectA);
      contentCell.appendChild(selectP);
    });

    cells.push([titleCell, contentCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-industry', cells });

  // Preserve the section heading ("Industry Based Safety Signs & Labels - Trusted
  // by Pros") that lives inside the matched element, so it isn't lost when we
  // replace the element with the block.
  const heading = element.querySelector('h1, h2, h3');
  const frag = document.createDocumentFragment();
  if (heading) {
    const h = document.createElement(heading.tagName.toLowerCase());
    h.textContent = heading.textContent.trim();
    frag.appendChild(h);
  }
  frag.appendChild(block);
  element.replaceWith(frag);
}
