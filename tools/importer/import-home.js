/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsPromoParser from './parsers/cards-promo.js';
import cardsCategoryParser from './parsers/cards-category.js';
import cardsProductParser from './parsers/cards-product.js';
import tabsIndustryParser from './parsers/tabs-industry.js';
import cardsReviewParser from './parsers/cards-review.js';
import cardsBlogParser from './parsers/cards-blog.js';
import cardsValueParser from './parsers/cards-value.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/compliancesigns-cleanup.js';
import sectionsTransformer from './transformers/compliancesigns-sections.js';

// PARSER REGISTRY
const parsers = {
  'cards-promo': cardsPromoParser,
  'cards-category': cardsCategoryParser,
  'cards-product': cardsProductParser,
  'tabs-industry': tabsIndustryParser,
  'cards-review': cardsReviewParser,
  'cards-blog': cardsBlogParser,
  'cards-value': cardsValueParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'home',
  description: 'Compliance Signs homepage',
  urls: [
    'https://www.compliancesigns.com/',
  ],
  blocks: [
    {
      name: 'cards-promo',
      instances: ['.home-banner-section .banner-desktop', '.home-banner-section'],
    },
    {
      name: 'cards-category',
      instances: ['.home-shop-category .container-xl', '.home-shop-category'],
    },
    {
      name: 'cards-product',
      instances: ['.home-best-seller .container-xl', '.home-best-seller'],
    },
    {
      name: 'tabs-industry',
      instances: ['.home-food-service .container-xl', '.home-food-service'],
    },
    {
      name: 'cards-review',
      instances: ['.home-customer-review .review-right', '.home-customer-review .container-xl', '.home-customer-review'],
    },
    {
      name: 'cards-blog',
      instances: ['.home-lastest-blogs .blogs', '.home-lastest-blogs .container-xl', '.home-lastest-blogs'],
    },
    {
      name: 'cards-value',
      instances: ['.home-why-csign .container-xl', '.home-why-csign'],
    },
  ],
  sections: [
    { id: 'rc3', name: 'Promotional banner grid', selector: ['.home-banner-section'], style: null, blocks: ['cards-promo'], defaultContent: [] },
    { id: 'rc4', name: 'Shop by Category', selector: ['.home-shop-category'], style: 'light', blocks: ['cards-category'], defaultContent: ['.home-shop-category h1', '.home-shop-category h2'] },
    { id: 'rc5', name: 'Best Sellers', selector: ['.home-best-seller'], style: 'light', blocks: ['cards-product'], defaultContent: ['.home-best-seller h2'] },
    { id: 'rc6', name: 'Industry-based products', selector: ['.home-food-service'], style: 'light', blocks: ['tabs-industry'], defaultContent: ['.home-food-service h2'] },
    { id: 'rc7', name: 'Customer reviews', selector: ['.home-customer-review'], style: 'navy-blue', blocks: ['cards-review'], defaultContent: ['.home-customer-review .review-left h2', '.home-customer-review .review-left p', '.home-customer-review .review-left a'] },
    { id: 'rc8', name: 'News & Resources', selector: ['.home-lastest-blogs'], style: 'light', blocks: ['cards-blog'], defaultContent: ['.home-lastest-blogs h2', '.home-lastest-blogs .blog-left a'] },
    { id: 'rc9', name: 'Newsletter signup', selector: ['.home-sign-up'], style: 'dark', blocks: ['form'], defaultContent: ['.home-sign-up h2', '.home-sign-up p'] },
    { id: 'rc10', name: 'Why ComplianceSigns', selector: ['.home-why-csign'], style: 'light', blocks: ['cards-value'], defaultContent: ['.home-why-csign h2', '.home-why-csign .sub-title'] },
  ],
};

// TRANSFORMER REGISTRY - cleanup first, then section breaks/metadata (afterTransform)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration.
 * Only the first matching selector per block is used (instances are ordered
 * fallbacks), so a block is never parsed twice.
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    let matched = null;
    let matchedSelector = null;
    for (const selector of blockDef.instances) {
      const el = document.querySelector(selector);
      if (el) {
        matched = el;
        matchedSelector = selector;
        break;
      }
    }
    if (!matched) {
      console.warn(`Block "${blockDef.name}" not found with any selector: ${blockDef.instances.join(', ')}`);
      return;
    }
    pageBlocks.push({
      name: blockDef.name,
      selector: matchedSelector,
      element: matched,
      section: blockDef.section || null,
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. Initial cleanup (beforeTransform)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // Already replaced by earlier parser
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Final cleanup + section breaks/metadata (afterTransform)
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path (map homepage root to /index)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
