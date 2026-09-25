/* eslint-disable no-console, no-restricted-syntax, no-await-in-loop, max-len */
/**
 * AEM-shape check: rebuild each packaged page as the HTML AEM (xwalk) serves
 * for it, so the real block code can be tested against AEM's structure
 * without an AEM instance.
 *
 * Rules (xwalk rendering):
 * - section → <div>, with its style as a section-metadata block
 * - text → rich text; title → <hN>; image → <p><picture>; button → <p><a>
 * - block with items → one row per item; block without items → one row per field
 * - a row has one cell per field group: fields sharing a "prefix_" share a
 *   cell; <field>Alt/Type/Text/Title/MimeType collapse into <field>
 * - reference → <picture>, richtext → its HTML, other fields → <p>value</p>
 *
 * Usage: node tools/package/aem-shape-preview.mjs [zip]
 * Writes migration-work/aem-check/<page>.html
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

// jsdom (CommonJS) from the content-import toolchain, as in build-aem-package.mjs.
const { JSDOM } = createRequire(
  '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json',
)('jsdom');

const WORKSPACE = process.cwd();
const OUT = path.join(WORKSPACE, 'migration-work/aem-check');
const SUFFIXES = ['Alt', 'Type', 'MimeType', 'Text', 'Title'];

const models = JSON.parse(await readFile(path.join(WORKSPACE, 'component-models.json'), 'utf-8'));
// First definition wins for duplicate ids (e.g. "card"), as in md2jcr.
const modelById = {};
models.forEach((m) => { if (!modelById[m.id]) modelById[m.id] = m.fields || []; });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const picture = (src, alt = '') => `<picture><img src="${esc(src)}" alt="${esc(alt)}"></picture>`;

/** Field list of a model, grouped into cells (xwalk element grouping + collapsing). */
function cellsFor(modelId) {
  const fields = (modelById[modelId] || []).filter((f) => !['tab', 'container'].includes(f.component));
  const names = new Set(fields.map((f) => f.name));
  const cells = [];
  const byKey = new Map();
  fields.forEach((f) => {
    const base = SUFFIXES.map((s) => (f.name.endsWith(s) ? f.name.slice(0, -s.length) : null)).find((b) => b && names.has(b));
    if (base) return; // collapsed into its base field
    const key = f.name.includes('_') ? f.name.split('_')[0] : f.name;
    if (!byKey.has(key)) {
      byKey.set(key, []);
      cells.push(byKey.get(key));
    }
    byKey.get(key).push(f);
  });
  return cells;
}

function renderField(node, f) {
  const v = node.getAttribute(f.name);
  if (!v) return '';
  if (f.component === 'reference') return `<p>${picture(v, node.getAttribute(`${f.name}Alt`) || '')}</p>`;
  if (f.component === 'richtext') return v;
  return `<p>${esc(v)}</p>`;
}

function renderRow(node, modelId) {
  return `<div>${cellsFor(modelId).map((group) => `<div>${group.map((f) => renderField(node, f)).join('')}</div>`).join('')}</div>`;
}

function renderBlock(node) {
  const name = node.getAttribute('name') || '';
  const cls = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const items = [...node.children].filter((c) => (c.getAttribute('sling:resourceType') || '').endsWith('/block/item'));
  let rows;
  if (items.length) {
    rows = items.map((it) => renderRow(it, it.getAttribute('model'))).join('');
  } else {
    // Simple block: one row per field (grouped the same way).
    const modelId = node.getAttribute('model');
    rows = cellsFor(modelId).map((group) => `<div><div>${group.map((f) => renderField(node, f)).join('')}</div></div>`).join('');
  }
  return `<div class="${cls}">${rows}</div>`;
}

function renderComponent(node) {
  const rt = node.getAttribute('sling:resourceType') || '';
  if (rt.endsWith('/text/v1/text')) return node.getAttribute('text') || '';
  if (rt.endsWith('/title/v1/title')) {
    const level = (node.getAttribute('titleType') || 'h2').replace(/[^h1-6]/g, '') || 'h2';
    return `<${level}>${esc(node.getAttribute('title') || '')}</${level}>`;
  }
  if (rt.endsWith('/image/v1/image')) return `<p>${picture(node.getAttribute('image') || '', node.getAttribute('imageAlt') || '')}</p>`;
  if (rt.endsWith('/button/v1/button')) return `<p><a href="${esc(node.getAttribute('link') || '#')}">${esc(node.getAttribute('linkText') || '')}</a></p>`;
  if (rt.endsWith('/block/v1/block')) return renderBlock(node);
  return `<!-- unhandled ${rt} -->`;
}

function renderPage(xml) {
  const { document } = new JSDOM(xml, { contentType: 'text/xml' }).window;
  const root = [...document.getElementsByTagName('*')]
    .find((el) => (el.getAttribute('sling:resourceType') || '').endsWith('/root/v1/root'));
  return [...root.children].map((section) => {
    const style = section.getAttribute('style');
    const meta = style ? `<div class="section-metadata"><div><div>style</div><div>${esc(style)}</div></div></div>` : '';
    return `<div>${meta}${[...section.children].map(renderComponent).join('')}</div>`;
  }).join('\n');
}

const zipPath = process.argv[2] || (await (async () => {
  const src = await readFile(path.join(WORKSPACE, 'tools/package/build-aem-package.mjs'), 'utf-8');
  const version = src.match(/PKG_VERSION = '([^']+)'/)[1];
  return `tools/package/dist/compliancesigns-content-${version}.zip`;
})());

// Read page XML straight from the zip (stored or deflated entries).
const { inflateRawSync } = await import('node:zlib');
const buf = await readFile(path.join(WORKSPACE, zipPath));
const entries = {};
let off = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
const count = buf.readUInt16LE(off + 10);
off = buf.readUInt32LE(off + 16);
for (let i = 0; i < count; i += 1) {
  const method = buf.readUInt16LE(off + 10);
  const csize = buf.readUInt32LE(off + 20);
  const nlen = buf.readUInt16LE(off + 28);
  const xlen = buf.readUInt16LE(off + 30);
  const clen = buf.readUInt16LE(off + 32);
  const local = buf.readUInt32LE(off + 42);
  const name = buf.toString('utf8', off + 46, off + 46 + nlen);
  const lnlen = buf.readUInt16LE(local + 26);
  const lxlen = buf.readUInt16LE(local + 28);
  const data = buf.subarray(local + 30 + lnlen + lxlen, local + 30 + lnlen + lxlen + csize);
  if (name.endsWith('.content.xml') && name.startsWith('jcr_root/content/justrite/')) {
    entries[name] = (method === 8 ? inflateRawSync(data) : data).toString('utf-8');
  }
  off += 46 + nlen + xlen + clen;
}

await mkdir(OUT, { recursive: true });
for (const [name, xml] of Object.entries(entries)) {
  const page = name.replace('jcr_root/content/justrite/', '').replace('/.content.xml', '').replace(/\//g, '--');
  await writeFile(path.join(OUT, `${page}.html`), renderPage(xml), 'utf-8');
  console.log(`✓ ${page}`);
}
console.log(`AEM-shaped pages written to ${path.relative(WORKSPACE, OUT)}/ from ${zipPath}`);
