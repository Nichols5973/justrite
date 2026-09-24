/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/cards-promo.js
  function parse(element, { document: document2 }) {
    const items = [...element.querySelectorAll("a.banner-item")];
    const cells = [];
    items.forEach((item) => {
      const image = item.querySelector("img");
      const heading = item.querySelector(".banner-title, h2, h3");
      const desc = item.querySelector(".banner-desc, p");
      const ctaLabel = item.querySelector('.button-orange, .button, [class*="button"]');
      const href = item.getAttribute("href");
      const imageCell = document2.createDocumentFragment();
      if (image) {
        imageCell.appendChild(document2.createComment(" field:image "));
        imageCell.appendChild(image);
      }
      const textCell = document2.createDocumentFragment();
      textCell.appendChild(document2.createComment(" field:text "));
      if (heading) textCell.appendChild(heading);
      if (desc) textCell.appendChild(desc);
      if (ctaLabel && href) {
        const cta = document2.createElement("a");
        cta.href = href;
        cta.textContent = ctaLabel.textContent.trim();
        const p = document2.createElement("p");
        p.appendChild(cta);
        textCell.appendChild(p);
      } else if (ctaLabel) {
        textCell.appendChild(ctaLabel);
      }
      cells.push([imageCell, textCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-promo", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-category.js
  function parse2(element, { document: document2 }) {
    const figures = [...element.querySelectorAll("figure")];
    const cells = [];
    figures.forEach((figure) => {
      const image = figure.querySelector("img");
      const anchor = figure.querySelector("a[href]");
      const caption = figure.querySelector("figcaption");
      const href = anchor ? anchor.getAttribute("href") : "";
      const labelText = caption ? caption.textContent.trim() : "";
      const imageCell = document2.createDocumentFragment();
      if (image) {
        imageCell.appendChild(document2.createComment(" field:image "));
        imageCell.appendChild(image);
      }
      const textCell = document2.createDocumentFragment();
      textCell.appendChild(document2.createComment(" field:text "));
      if (labelText && href) {
        const link = document2.createElement("a");
        link.href = href;
        link.textContent = labelText;
        const p = document2.createElement("p");
        p.appendChild(link);
        textCell.appendChild(p);
      } else if (labelText) {
        const p = document2.createElement("p");
        p.textContent = labelText;
        textCell.appendChild(p);
      }
      cells.push([imageCell, textCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-category", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-product.js
  var STATIC_PRODUCTS = [
    { img: "https://media.compliancesigns.com/media/wysiwyg/nfpa-704-nfpa-diamonds-sign-nfpa_printed_1200_150.jpg", alt: "NFPA 704 Diamond Sign with 1-2-0-0 Hazard Ratings", title: "NFPA 704 Diamond Sign with 1-2-0-0 Hazard Ratings", price: "From $8.30", href: "/NFPA_PRINTED_1200" },
    { img: "https://media.compliancesigns.com/media/wysiwyg/ada-unisex-family-assisted-sign-rrep-7030-white_on_blue_1000.jpg", alt: "Black ADA Braille RESTROOM Sign With Accessible Symbol", title: "Black ADA Braille RESTROOM Sign With Accessible Symbol, 9x6 in. Acrylic", price: "From $22.40", href: "/RRE-120_White_on_Black" },
    { img: "https://media.compliancesigns.com/media/wysiwyg/osha-flammable-sign-ode-15544_1000.jpg", alt: "OSHA DANGER Confined Space Permit Required For Entry Sign", title: "OSHA DANGER Confined Space Permit Required For Entry Sign", price: "From $7.00", href: "/ODE-38982" },
    { img: "https://media.compliancesigns.com/media/wysiwyg/osha-lockout-tagout-tag-cs669100_1000.jpg", alt: "Blue Clean and Sweep Tools 5S Shadow Board", title: "Blue Clean and Sweep Tools 5S Shadow Board", price: "As low as $281.10", href: "/51BSCB" },
    { img: "https://media.compliancesigns.com/media/wysiwyg/fire-extinguisher-sign-nhe-7470tri_1000.jpg", alt: "Vertical Fire Extinguisher Sign", title: "Vertical Fire Extinguisher Sign", price: "From $8.30", href: "/NHE-7470" },
    { img: "https://media.compliancesigns.com/media/catalog/product/cache/7a15876e2ecf8b844c2f5038b0f9fdd9/c/u/custom-osha-ansi-text-300.jpg", alt: "Custom OSHA / ANSI Sign with Text Options", title: "Custom OSHA / ANSI Sign with Text Options", price: "From $5.10", href: "/OSHA-ANSI-CUSTOM1" }
  ];
  function parse3(element, { document: document2 }) {
    const cells = [];
    STATIC_PRODUCTS.forEach((product) => {
      const imageCell = document2.createDocumentFragment();
      imageCell.appendChild(document2.createComment(" field:image "));
      const img = document2.createElement("img");
      img.src = product.img;
      img.alt = product.alt;
      imageCell.appendChild(img);
      const textCell = document2.createDocumentFragment();
      textCell.appendChild(document2.createComment(" field:text "));
      const h = document2.createElement("h3");
      const a = document2.createElement("a");
      a.href = product.href;
      a.textContent = product.title;
      h.appendChild(a);
      textCell.appendChild(h);
      const priceP = document2.createElement("p");
      priceP.textContent = product.price;
      textCell.appendChild(priceP);
      const ctaP = document2.createElement("p");
      const ctaLink = document2.createElement("a");
      ctaLink.href = product.href;
      ctaLink.textContent = "Select Options";
      ctaP.appendChild(ctaLink);
      textCell.appendChild(ctaP);
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-product", cells });
    const heading = element.querySelector("h1, h2, h3");
    const frag = document2.createDocumentFragment();
    if (heading) {
      const h = document2.createElement(heading.tagName.toLowerCase());
      h.textContent = heading.textContent.trim();
      frag.appendChild(h);
    }
    frag.appendChild(block);
    element.replaceWith(frag);
  }

  // tools/importer/parsers/tabs-industry.js
  var STATIC_TABS = [
    {
      title: "Manufacturing",
      bannerImg: "https://media.compliancesigns.com/media/wysiwyg/CSigns_310x485_Manufacturing-sign.jpg",
      bannerAlt: "Manufacturing",
      shopAllHref: "/products/industrial-notices/manufacturing-signs",
      products: [
        { img: "https://media.compliancesigns.com/media/wysiwyg/osha-flammable-sign-ode-15544_1000.jpg", alt: "OSHA DANGER Confined Space", title: "OSHA DANGER Confined Space Permit Required For Entry Sign", price: "From $7.00", href: "/ODE-38982" },
        { img: "https://media.compliancesigns.com/media/wysiwyg/fire-extinguisher-sign-nhe-7470tri_1000.jpg", alt: "OSHA EMERGENCY Eye Wash Station", title: "OSHA EMERGENCY Eye Wash Station Sign", price: "From $7.00", href: "/NHE-7470" },
        { img: "https://media.compliancesigns.com/media/wysiwyg/osha-lockout-tagout-tag-cs669100_1000.jpg", alt: "OSHA DANGER Do Not Operate", title: "OSHA DANGER Do Not Operate Lock/Tag May Only Be Removed By Tag", price: "From $6.30", href: "/CS669100" },
        { img: "https://media.compliancesigns.com/media/wysiwyg/nfpa-704-nfpa-diamonds-sign-nfpa_printed_1200_150.jpg", alt: "OSHA NOTICE PPE Required", title: "OSHA NOTICE PPE Required Beyond This Point Sign", price: "From $7.00", href: "/NFPA_PRINTED_1200" }
      ]
    },
    {
      title: "Construction",
      bannerImg: "https://media.compliancesigns.com/media/wysiwyg/osha-authorized-personnel-only-sign-one-1336_1000.jpg",
      bannerAlt: "Construction",
      shopAllHref: "/c/construction-safety-signs",
      products: [
        { img: "https://media.compliancesigns.com/media/wysiwyg/ada-unisex-family-assisted-sign-rrep-7030-white_on_blue_1000.jpg", alt: "Hard Hat Area Sign", title: "OSHA NOTICE Hard Hat Area Sign", price: "From $9.00", href: "/ONE-1336" }
      ]
    },
    {
      title: "Transportation",
      bannerImg: "https://media.compliancesigns.com/media/wysiwyg/parking-not-allowed-reflective-sign-cs911647_1000.jpg",
      bannerAlt: "Transportation",
      shopAllHref: "/c/roadway-transportation-signs",
      products: [
        { img: "https://media.compliancesigns.com/media/wysiwyg/alarm-will-sound-sign-nhe-19901_1000.jpg", alt: "No Parking Sign", title: "Reflective No Parking Any Time Sign", price: "From $12.00", href: "/CS911647" }
      ]
    },
    {
      title: "Food & Beverage",
      bannerImg: "https://media.compliancesigns.com/media/wysiwyg/osha-electrical-high-voltage-sign-ode-3686_1000.jpg",
      bannerAlt: "Food & Beverage",
      shopAllHref: "/c/food-safety-kitchen-signs",
      products: [
        { img: "https://media.compliancesigns.com/media/wysiwyg/ada-accessibility-sign-rre-190_white_on_blue_1000_1.jpg", alt: "Wash Hands Sign", title: "Employees Must Wash Hands Sign", price: "From $8.00", href: "/ODE-3686" }
      ]
    }
  ];
  function parse4(element, { document: document2 }) {
    const cells = [];
    STATIC_TABS.forEach((tab) => {
      const titleCell = document2.createDocumentFragment();
      titleCell.appendChild(document2.createComment(" field:title "));
      const titleP = document2.createElement("p");
      titleP.textContent = tab.title;
      titleCell.appendChild(titleP);
      const contentCell = document2.createDocumentFragment();
      const img = document2.createElement("img");
      img.src = tab.bannerImg;
      img.alt = tab.bannerAlt;
      contentCell.appendChild(document2.createComment(" field:content_image "));
      contentCell.appendChild(img);
      contentCell.appendChild(document2.createComment(" field:content_richtext "));
      const shopAll = document2.createElement("a");
      shopAll.href = tab.shopAllHref;
      shopAll.textContent = "Shop All";
      const shopAllP = document2.createElement("p");
      shopAllP.appendChild(shopAll);
      contentCell.appendChild(shopAllP);
      tab.products.forEach((product) => {
        const pImg = document2.createElement("p");
        const productImg = document2.createElement("img");
        productImg.src = product.img;
        productImg.alt = product.alt;
        pImg.appendChild(productImg);
        contentCell.appendChild(pImg);
        const priceP = document2.createElement("p");
        priceP.textContent = product.price;
        contentCell.appendChild(priceP);
        const h = document2.createElement("h3");
        const a = document2.createElement("a");
        a.href = product.href;
        a.textContent = product.title;
        h.appendChild(a);
        contentCell.appendChild(h);
        const selectP = document2.createElement("p");
        const selectA = document2.createElement("a");
        selectA.href = product.href;
        selectA.textContent = "Select Options";
        selectP.appendChild(selectA);
        contentCell.appendChild(selectP);
      });
      cells.push([titleCell, contentCell]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "tabs-industry", cells });
    const heading = element.querySelector("h1, h2, h3");
    const frag = document2.createDocumentFragment();
    if (heading) {
      const h = document2.createElement(heading.tagName.toLowerCase());
      h.textContent = heading.textContent.trim();
      frag.appendChild(h);
    }
    frag.appendChild(block);
    element.replaceWith(frag);
  }

  // tools/importer/parsers/cards-review.js
  var STATIC_REVIEWS = [
    {
      rating: "\u2605\u2605\u2605\u2605\u2605",
      title: "Easy to find products",
      quote: "The ease in which I was able to find & customize the signs I needed was amazing. Definitely number one in my book. With that being said, I recommend Compliance Signs to your signage projects and needs.",
      author: "Keith J."
    },
    {
      rating: "\u2605\u2605\u2605\u2605\u2605",
      title: "Outstanding Customer Service",
      quote: "I received a 5-star customer service from the person that helped me over the phone. Very attentive and guided me in the right direction regarding the sign that I needed to purchase.",
      author: "Glenda H."
    },
    {
      rating: "\u2605\u2605\u2605\u2605\u2605",
      title: "Easy to Use",
      quote: "Site was easy to use and I was able to quickly locate and request the specific items I needed and have them arranged to be shipped straight away. Will definitely be returning to use this site again in the future for compliance needs!",
      author: "Richard H."
    }
  ];
  function parse5(element, { document: document2 }) {
    const cells = [];
    STATIC_REVIEWS.forEach((review) => {
      const imageCell = document2.createDocumentFragment();
      imageCell.appendChild(document2.createComment(" field:image "));
      const ratingP = document2.createElement("p");
      ratingP.textContent = review.rating;
      imageCell.appendChild(ratingP);
      const textCell = document2.createDocumentFragment();
      textCell.appendChild(document2.createComment(" field:text "));
      const h = document2.createElement("h3");
      h.textContent = review.title;
      textCell.appendChild(h);
      const quoteP = document2.createElement("p");
      quoteP.textContent = review.quote;
      textCell.appendChild(quoteP);
      const authorP = document2.createElement("p");
      const em = document2.createElement("em");
      em.textContent = review.author;
      authorP.appendChild(em);
      textCell.appendChild(authorP);
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-review", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-blog.js
  var STATIC_ARTICLES = [
    {
      img: "https://media.compliancesigns.com/media/wysiwyg/osha-authorized-personnel-only-sign-one-1336_1000.jpg",
      alt: "Safe + Sound Week Helps Employers Improve Workplace Safety",
      title: "Safe + Sound Week Helps Employers Improve Workplace Safety",
      desc: "OSHA's Safe + Sound campaign helps employers keep workplaces safe and healthy.",
      href: "https://www.compliancesigns.com/blog/oshas-safe-and-sound-campaign-helps-employers-keep-workplaces-safe-and-healthy/"
    },
    {
      img: "https://media.compliancesigns.com/media/wysiwyg/osha-flammable-sign-ode-15544_1000.jpg",
      alt: "5 Steps for Effective Safety Conversations",
      title: "5 Steps for Effective Safety Conversations",
      desc: "Follow these 5 steps for effective safety conversations in your workplace.",
      href: "https://www.compliancesigns.com/blog/follow-these-5-steps-for-effective-safety-conversations/"
    },
    {
      img: "https://media.compliancesigns.com/media/wysiwyg/osha-electrical-high-voltage-sign-ode-3686_1000.jpg",
      alt: "The Top 5 CNC Machining Hazards and the Safety Signs That Keep Workers Safe",
      title: "The Top 5 CNC Machining Hazards and the Safety Signs That Keep Workers Safe",
      desc: "Learn the top CNC machining hazards and the required safety signs that protect workers.",
      href: "https://www.compliancesigns.com/blog/top-cnc-machining-hazards-required-safety-signs/"
    }
  ];
  function parse6(element, { document: document2 }) {
    const cells = [];
    STATIC_ARTICLES.forEach((article) => {
      const imageCell = document2.createDocumentFragment();
      imageCell.appendChild(document2.createComment(" field:image "));
      const img = document2.createElement("img");
      img.src = article.img;
      img.alt = article.alt;
      imageCell.appendChild(img);
      const textCell = document2.createDocumentFragment();
      textCell.appendChild(document2.createComment(" field:text "));
      const h2 = document2.createElement("h3");
      h2.textContent = article.title;
      textCell.appendChild(h2);
      const descP = document2.createElement("p");
      descP.textContent = article.desc;
      textCell.appendChild(descP);
      const readMoreP = document2.createElement("p");
      const a = document2.createElement("a");
      a.href = article.href;
      a.textContent = "Read More";
      readMoreP.appendChild(a);
      textCell.appendChild(readMoreP);
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-blog", cells });
    const heading = element.querySelector("h1, h2, h3");
    const frag = document2.createDocumentFragment();
    const h = document2.createElement("h2");
    h.textContent = heading ? heading.textContent.trim() : "News & Resources";
    frag.appendChild(h);
    frag.appendChild(block);
    element.replaceWith(frag);
  }

  // tools/importer/parsers/cards-value.js
  function parse7(element, { document: document2 }) {
    const items = [...element.querySelectorAll(".pagebuilder-column")];
    const cells = [];
    items.forEach((item) => {
      const image = item.querySelector("figure img, img");
      const heading = item.querySelector("h3, h4");
      const desc = item.querySelector("div p, p");
      const imageCell = document2.createDocumentFragment();
      if (image) {
        imageCell.appendChild(document2.createComment(" field:image "));
        imageCell.appendChild(image);
      }
      const textCell = document2.createDocumentFragment();
      textCell.appendChild(document2.createComment(" field:text "));
      if (heading) {
        const h = document2.createElement("h3");
        h.textContent = heading.textContent.replace(/\s+/g, " ").trim();
        textCell.appendChild(h);
      }
      if (desc) {
        const p = document2.createElement("p");
        p.textContent = desc.textContent.replace(/\s+/g, " ").trim();
        textCell.appendChild(p);
      }
      cells.push([imageCell, textCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-value", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/newsletter.js
  function parse8(element, { document: document2 }) {
    const cell = (fieldName, value) => {
      const div = document2.createElement("div");
      div.append(document2.createComment(` field:${fieldName} `));
      const p = document2.createElement("p");
      p.textContent = value;
      div.append(p);
      return div;
    };
    const rows = [
      ["newsletter"],
      [cell("placeholder", "Enter your email address")],
      [cell("cta", "Sign Up")],
      [cell("action", "/p/emailconnection-subscribe")]
    ];
    const block = WebImporter.DOMUtils.createTable(rows, document2);
    const frag = document2.createDocumentFragment();
    const heading = element.querySelector("h1, h2, h3");
    if (heading) {
      const h = document2.createElement(heading.tagName.toLowerCase());
      h.textContent = heading.textContent.trim();
      frag.appendChild(h);
    }
    element.querySelectorAll("p").forEach((p) => {
      const text = p.textContent.replace(/\s+/g, " ").trim();
      if (text && !p.querySelector("img, picture")) {
        const np = document2.createElement("p");
        np.textContent = text;
        frag.appendChild(np);
      }
    });
    frag.appendChild(block);
    element.replaceWith(frag);
  }

  // tools/importer/transformers/compliancesigns-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        // Cookiebot cookie-consent dialog
        "#CybotCookiebotDialog",
        '[id^="CybotCookiebot"]',
        '[class^="CybotCookiebot"]',
        "#CookiebotWidget",
        // HubSpot web-interactives (floating containers, modal overlay, anchors)
        "#hs-web-interactives-floating-container",
        "#hs-interactives-modal-overlay",
        '[id^="hs-web-interactives-"]',
        // UserWay accessibility widget
        "#userwayAccessibilityIcon",
        ".uwy",
        "#uw-open-accessibility"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        // Global header / navigation (detected: #main-header)
        "#main-header",
        "header",
        // Global footer (detected: #new_footer)
        "#new_footer",
        "footer",
        // Bottom promotional banner overlay
        "#bottom-banner",
        // SearchSpring product-listing widget (sibling after home-content)
        "#searchspring-div",
        // Leftover non-authorable elements
        "iframe",
        "noscript",
        "link"
      ]);
    }
  }

  // tools/importer/transformers/compliancesigns-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    for (const sel of selectors) {
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload.template.sections || [];
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-home.js
  var parsers = {
    "cards-promo": parse,
    "cards-category": parse2,
    "cards-product": parse3,
    "tabs-industry": parse4,
    "cards-review": parse5,
    "cards-blog": parse6,
    "cards-value": parse7,
    newsletter: parse8
  };
  var PAGE_TEMPLATE = {
    name: "home",
    description: "Compliance Signs homepage",
    urls: [
      "https://www.compliancesigns.com/"
    ],
    blocks: [
      {
        name: "cards-promo",
        instances: [".home-banner-section .banner-desktop", ".home-banner-section"]
      },
      {
        name: "cards-category",
        instances: [".home-shop-category .container-xl", ".home-shop-category"]
      },
      {
        name: "cards-product",
        instances: [".home-best-seller .container-xl", ".home-best-seller"]
      },
      {
        name: "tabs-industry",
        instances: [".home-food-service .container-xl", ".home-food-service"]
      },
      {
        name: "cards-review",
        instances: [".home-customer-review .review-right", ".home-customer-review .container-xl", ".home-customer-review"]
      },
      {
        name: "cards-blog",
        instances: [".home-lastest-blogs .blogs", ".home-lastest-blogs .container-xl", ".home-lastest-blogs"]
      },
      {
        name: "cards-value",
        instances: [".home-why-csign .container-xl", ".home-why-csign"]
      },
      {
        name: "newsletter",
        instances: [".home-sign-up .container-xl", ".home-sign-up"]
      }
    ],
    sections: [
      { id: "rc3", name: "Promotional banner grid", selector: [".home-banner-section"], style: null, blocks: ["cards-promo"], defaultContent: [] },
      { id: "rc4", name: "Shop by Category", selector: [".home-shop-category"], style: "light", blocks: ["cards-category"], defaultContent: [".home-shop-category h1", ".home-shop-category h2"] },
      { id: "rc5", name: "Best Sellers", selector: [".home-best-seller"], style: "light", blocks: ["cards-product"], defaultContent: [".home-best-seller h2"] },
      { id: "rc6", name: "Industry-based products", selector: [".home-food-service"], style: "light", blocks: ["tabs-industry"], defaultContent: [".home-food-service h2"] },
      { id: "rc7", name: "Customer reviews", selector: [".home-customer-review"], style: "navy-blue", blocks: ["cards-review"], defaultContent: [".home-customer-review .review-left h2", ".home-customer-review .review-left p", ".home-customer-review .review-left a"] },
      { id: "rc8", name: "News & Resources", selector: [".home-lastest-blogs"], style: "light", blocks: ["cards-blog"], defaultContent: [".home-lastest-blogs h2", ".home-lastest-blogs .blog-left a"] },
      { id: "rc9", name: "Newsletter signup", selector: [".home-sign-up"], style: "dark", blocks: ["newsletter"], defaultContent: [] },
      { id: "rc10", name: "Why ComplianceSigns", selector: [".home-why-csign"], style: "light", blocks: ["cards-value"], defaultContent: [".home-why-csign h2", ".home-why-csign .sub-title"] }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      let matched = null;
      let matchedSelector = null;
      for (const selector of blockDef.instances) {
        const el = document2.querySelector(selector);
        if (el) {
          matched = el;
          matchedSelector = selector;
          break;
        }
      }
      if (!matched) {
        console.warn(`Block "${blockDef.name}" not found with any selector: ${blockDef.instances.join(", ")}`);
        return;
      }
      pageBlocks.push({
        name: blockDef.name,
        selector: matchedSelector,
        element: matched,
        section: blockDef.section || null
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_home_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_home_exports);
})();
