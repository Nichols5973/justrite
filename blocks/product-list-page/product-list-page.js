/**
 * product-list-page — commerce PLP drop-in (demo placeholder).
 *
 * Authored config (from the import table): a `urlPath` row.
 *   <div class="product-list-page"><div><div>urlPath</div><div>safety-labels</div></div></div>
 *
 * In production this block is replaced by the Adobe Commerce product-list-page
 * drop-in, which fetches the category's products, facets, sort, and pagination
 * from the Catalog Service / Live Search API keyed on the category urlPath. For
 * the demo it renders a styled placeholder — facet rail + a skeleton product
 * grid — showing the wired category, so the page reads as intentional.
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

const CARD_COUNT = 9;

export default function decorate(block) {
  const { urlPath = '' } = readConfig(block);
  block.textContent = '';

  const wrap = document.createElement('div');
  wrap.className = 'plp-placeholder';

  // Toolbar: results count + sort.
  const toolbar = document.createElement('div');
  toolbar.className = 'plp-toolbar';
  toolbar.innerHTML = `
    <span class="plp-badge">Adobe Commerce · Live catalog</span>
    <div class="plp-toolbar-right">
      <div class="pd-skeleton plp-skeleton-line plp-w-results"></div>
      <div class="pd-skeleton plp-skeleton-sort"></div>
    </div>
  `;

  const body = document.createElement('div');
  body.className = 'plp-body';

  // Facet rail.
  const facets = document.createElement('aside');
  facets.className = 'plp-facets';
  facets.innerHTML = Array.from({ length: 3 }, () => `
    <div class="plp-facet-group">
      <div class="pd-skeleton plp-skeleton-line plp-w-facet-title"></div>
      <div class="pd-skeleton plp-skeleton-line"></div>
      <div class="pd-skeleton plp-skeleton-line"></div>
      <div class="pd-skeleton plp-skeleton-line plp-w-70"></div>
    </div>
  `).join('');

  // Product grid.
  const grid = document.createElement('div');
  grid.className = 'plp-grid';
  grid.innerHTML = Array.from({ length: CARD_COUNT }, () => `
    <div class="plp-card">
      <div class="pd-skeleton plp-skeleton-thumb"></div>
      <div class="pd-skeleton plp-skeleton-line plp-w-90"></div>
      <div class="pd-skeleton plp-skeleton-line plp-w-50 plp-price"></div>
      <div class="pd-skeleton plp-skeleton-cta"></div>
    </div>
  `).join('');

  body.append(facets, grid);
  wrap.append(toolbar, body);

  const note = document.createElement('p');
  note.className = 'plp-note';
  note.innerHTML = `Products, facets, sort &amp; pagination render live from the
    Catalog Service API · category <code>${urlPath || '—'}</code>`;
  wrap.append(note);

  block.append(wrap);
}
