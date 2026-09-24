/**
 * product-details — commerce PDP drop-in (demo placeholder).
 *
 * Authored config (from the import table): a `defaultSku` row.
 *   <div class="product-details"><div><div>defaultSku</div><div>CS949629</div></div></div>
 *
 * In production this block is replaced by the Adobe Commerce product-details
 * drop-in, which fetches live product data (title, price, gallery, options,
 * add-to-cart) from the Catalog Service API keyed on the SKU. For the demo it
 * renders a styled placeholder that shows the wired SKU and the runtime slots,
 * so the page reads as intentional rather than blank.
 */
function readConfig(block) {
  const config = {};
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim();
      const value = cells[1].textContent.trim();
      if (key) config[key] = value;
    }
  });
  return config;
}

export default function decorate(block) {
  const { defaultSku = '' } = readConfig(block);
  block.textContent = '';

  const wrap = document.createElement('div');
  wrap.className = 'product-details-placeholder';

  // Gallery slot (skeleton).
  const gallery = document.createElement('div');
  gallery.className = 'product-details-gallery';
  gallery.innerHTML = '<div class="pd-skeleton pd-skeleton-image"></div>';

  // Info slot.
  const info = document.createElement('div');
  info.className = 'product-details-info';
  info.innerHTML = `
    <span class="pd-badge">Adobe Commerce · Live product</span>
    <div class="pd-skeleton pd-skeleton-line pd-w-80"></div>
    <div class="pd-skeleton pd-skeleton-line pd-w-40 pd-price"></div>
    <div class="pd-skeleton pd-skeleton-line pd-w-100"></div>
    <div class="pd-skeleton pd-skeleton-line pd-w-90"></div>
    <div class="pd-options">
      <div class="pd-skeleton pd-skeleton-chip"></div>
      <div class="pd-skeleton pd-skeleton-chip"></div>
      <div class="pd-skeleton pd-skeleton-chip"></div>
    </div>
    <button type="button" class="pd-cta" disabled>Add to Cart</button>
    <p class="pd-note">Renders live from the Catalog Service API · SKU
      <code>${defaultSku || '—'}</code></p>
  `;

  wrap.append(gallery, info);
  block.append(wrap);
}
