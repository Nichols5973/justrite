// ComplianceSigns footer — content-first, generic (reads content/footer.plain.html)

/**
 * Fetch the footer fragment. Metadata-independent dual-fetch:
 * /content first (localhost / aem up), then root (DA/EDS production).
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp;
}

export default async function decorate(block) {
  const fragment = await fetchFooter();
  block.textContent = '';

  const footer = document.createElement('div');
  footer.className = 'footer-inner';

  const sections = fragment ? [...fragment.children].filter((c) => c.tagName === 'DIV') : [];

  // The last section is the copyright / legal bar; everything before is the main grid.
  const legal = sections.length ? sections[sections.length - 1] : null;
  const columns = sections.slice(0, Math.max(0, sections.length - 1));

  const grid = document.createElement('div');
  grid.className = 'footer-grid';
  columns.forEach((col, i) => {
    const c = document.createElement('div');
    c.className = i === 0 ? 'footer-brand' : 'footer-col';
    while (col.firstElementChild) c.append(col.firstElementChild);
    // AEM content stores the brand logo as a plain image; link it to the homepage.
    const logo = i === 0 ? c.querySelector('picture, img') : null;
    if (logo && !logo.closest('a')) {
      const link = document.createElement('a');
      link.href = '/';
      link.setAttribute('aria-label', 'Home');
      logo.replaceWith(link);
      link.append(logo);
    }
    grid.append(c);
  });
  footer.append(grid);

  if (legal) {
    const bar = document.createElement('div');
    bar.className = 'footer-legal';
    while (legal.firstElementChild) bar.append(legal.firstElementChild);
    footer.append(bar);
  }

  block.append(footer);
}
