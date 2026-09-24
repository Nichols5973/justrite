/* eslint-disable */
/* global WebImporter */
/**
 * Commerce import script — compliancesigns.com PDP + PLP pages.
 *
 * Routes by URL pattern:
 *   /pd/<slug>-<sku>          → PDP: `product-details` block (keyed on SKU)
 *   /products/... , /c/...    → PLP: `product-list-page` block (keyed on category urlPath)
 *
 * The core commerce experience (PDP: title/price/gallery/add-to-cart/variants;
 * PLP: product grid/filters/sort/pagination) is rendered at runtime by the
 * commerce drop-in block, which fetches live data from the Adobe Commerce
 * catalog API. This importer emits the block shell + surrounding default
 * content — it does NOT bake product data.
 */

/** Classify a URL as PDP or PLP by its path pattern. */
function pageTypeFromUrl(url) {
  const path = new URL(url).pathname;
  if (/^\/pd\//.test(path)) return 'PDP';
  return 'PLP'; // /products/, /c/, /pl/ → listing
}

/** Derive the product SKU from a /pd/<slug>-<sku> URL. */
function skuFromUrl(url) {
  try {
    const last = new URL(url).pathname.replace(/\/+$/, '').split('/').pop() || '';
    const sku = last.split('-').pop();
    return sku ? sku.toUpperCase() : '';
  } catch (e) {
    return '';
  }
}

/** Derive the category urlPath from a /products/<...>/<cat> or /c/<cat> URL. */
function categoryPathFromUrl(url) {
  const path = new URL(url).pathname.replace(/\/+$/, '');
  const segs = path.split('/').filter(Boolean); // e.g. ['products','safety-labels']
  // Drop the leading root segment (products / c / pl); the remainder is the category path.
  return segs.slice(1).join('/') || segs[segs.length - 1] || '';
}

/**
 * Product long-form description (default content below the product block).
 * Targets the narrow WYSIWYG description node and strips embedded <style>/
 * <script> (the source injects a large Bazaarvoice CleanSlate stylesheet into
 * the surrounding container, which must not leak into the text).
 */
function parseDescription(document) {
  const el = document.querySelector('[class*="product-description_desc"]');
  if (!el) {
    console.warn('⚠️ parseDescription: description element not found');
    return null;
  }
  // Work on a clone so we can safely remove noise nodes.
  const clone = el.cloneNode(true);
  clone.querySelectorAll('style, script, [data-bv-show], [class*="bv_"]').forEach((n) => n.remove());
  const text = clone.textContent.replace(/\s+/g, ' ').trim();
  if (!text) {
    console.warn('⚠️ parseDescription: description text empty after cleanup');
    return null;
  }
  const wrap = document.createElement('div');
  const h = document.createElement('h2');
  h.textContent = 'Product Details';
  wrap.append(h);
  const p = document.createElement('p');
  p.textContent = text;
  wrap.append(p);
  return wrap;
}

export default {
  transform: ({ document, url }) => {
    const main = document.body;
    const pageType = pageTypeFromUrl(url);

    // STEP 1: Extract everything while the DOM is intact.
    const h1 = document.querySelector('h1');
    const title = h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : (document.title || '');
    // PDP-only: long-form description below the product block.
    const descBlock = pageType === 'PDP' ? parseDescription(document) : null;

    // Commerce block config (not DOM-dependent).
    let commerceBlock;
    if (pageType === 'PDP') {
      commerceBlock = WebImporter.DOMUtils.createTable([
        ['product-details'],
        ['defaultSku', skuFromUrl(url)],
      ], document);
    } else {
      commerceBlock = WebImporter.DOMUtils.createTable([
        ['product-list-page'],
        ['urlPath', categoryPathFromUrl(url)],
      ], document);
    }

    // STEP 2: Clear — no DOM queries after this line.
    main.innerHTML = '';

    // STEP 3: Rebuild sections in page order.
    // Section 1: page title (heading) + the commerce block.
    const mainSection = document.createElement('div');
    if (title) {
      const h = document.createElement('h1');
      h.textContent = title;
      mainSection.append(h);
    }
    mainSection.append(commerceBlock);
    main.append(mainSection);

    // Section 2 (PDP only): long-form description (default content).
    if (descBlock) {
      const descSection = document.createElement('div');
      descSection.append(descBlock);
      main.append(descSection);
    }

    // STEP 4: Metadata block (final section).
    const metaSection = document.createElement('div');
    const metaRows = [['Metadata']];
    if (title) metaRows.push(['Title', title]);
    const descMeta = document.querySelector('meta[name="description"], meta[property="og:description"]');
    if (descMeta) metaRows.push(['Description', descMeta.getAttribute('content') || '']);
    metaSection.append(WebImporter.DOMUtils.createTable(metaRows, document));
    main.append(metaSection);

    // Strip trailing .html/.htm and trailing slash before sanitizing.
    const rawPath = new URL(url).pathname.replace(/\.html?$/i, '').replace(/\/+$/, '') || '/';
    return [{ element: main, path: WebImporter.FileUtils.sanitizePath(rawPath) }];
  },
};
