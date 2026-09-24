/* eslint-disable no-console, no-restricted-syntax, no-await-in-loop */
/* eslint-disable no-bitwise, no-continue, object-curly-newline, max-len */
/**
 * Build an AEM (xwalk / crosswalk) content package from the migrated
 * .plain.html pages.
 *
 * Pipeline per page:  .plain.html  →  wrap in <main>  →  html2md  →  md2jcr
 *   →  .content.xml under jcr_root/content/justrite/<path>/
 *
 * Also emits the vault metadata (filter.xml + properties.xml) and zips the
 * whole thing into tools/package/dist/<pkg>.zip, ready for AEM Package Manager.
 *
 * Usage: node tools/package/build-aem-package.mjs
 */
import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { deflateRawSync, crc32 } from 'node:zlib';

/**
 * Minimal ZIP writer (deflate) — used when the `zip` binary is unavailable.
 * Produces a standard PKZIP archive AEM Package Manager can read.
 */
async function zipDir(rootDir, outPath) {
  const files = [];
  const walk = async (dir) => {
    for (const ent of await readdir(dir, { withFileTypes: true })) {
      const abs = path.join(dir, ent.name);
      if (ent.isDirectory()) await walk(abs);
      else files.push(abs);
    }
  };
  await walk(rootDir);

  const chunks = [];
  const central = [];
  let offset = 0;
  const enc = new TextEncoder();

  for (const abs of files) {
    const name = path.relative(rootDir, abs).split(path.sep).join('/');
    const data = await readFile(abs);
    const nameBuf = Buffer.from(enc.encode(name));
    const crc = crc32(data) >>> 0;
    const comp = deflateRawSync(data);
    const method = comp.length < data.length ? 8 : 0;
    const body = method === 8 ? comp : data;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, nameBuf, body);

    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);
    cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(0, 8);
    cen.writeUInt16LE(method, 10);
    cen.writeUInt16LE(0, 12);
    cen.writeUInt16LE(0, 14);
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(body.length, 20);
    cen.writeUInt32LE(data.length, 24);
    cen.writeUInt16LE(nameBuf.length, 28);
    cen.writeUInt16LE(0, 30);
    cen.writeUInt16LE(0, 32);
    cen.writeUInt16LE(0, 34);
    cen.writeUInt16LE(0, 36);
    cen.writeUInt32LE(0, 38);
    cen.writeUInt32LE(offset, 42);
    central.push(Buffer.concat([cen, nameBuf]));

    offset += local.length + nameBuf.length + body.length;
  }

  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  await writeFile(outPath, Buffer.concat([...chunks, centralBuf, end]));
}

const WORKSPACE = process.cwd();
const SCRIPTS_NM = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/node_modules';
const HTML2MD_DIR = '/home/node/.excat-marketplaces/excat-marketplace/excat/tools/excatops-mcp/node_modules/@adobe/helix-html2md';

const SITE_ROOT = '/content/justrite';
const PKG_GROUP = 'compliancesigns';
const PKG_NAME = 'compliancesigns-content';
const PKG_VERSION = '1.0.0';

// Real pages + fragments to include (QA preview scaffolds excluded).
const PAGES = [
  { html: 'content/index.plain.html', jcrPath: 'index', title: 'Home' },
  { html: 'content/pd/oneok-spottters-rerquired-sign-cs949629.plain.html', jcrPath: 'pd/oneok-spottters-rerquired-sign-cs949629', title: 'Spotter Required When Backing Sign for ONEOK' },
  { html: 'content/products/safety-labels.plain.html', jcrPath: 'products/safety-labels', title: 'Safety Labels' },
  { html: 'content/c/chemical-hazard-safety-signs.plain.html', jcrPath: 'c/chemical-hazard-safety-signs', title: 'Chemical Safety Signs & Labels' },
  { html: 'content/nav.plain.html', jcrPath: 'nav', title: 'Navigation' },
  { html: 'content/footer.plain.html', jcrPath: 'footer', title: 'Footer' },
];

const DIST = path.join(WORKSPACE, 'tools/package/dist');
const STAGE = path.join(DIST, PKG_NAME);

async function loadHtml2md() {
  const mod = await import(path.join(HTML2MD_DIR, 'src/index.js'));
  return mod.html2md;
}

async function loadMd2jcr() {
  const mod = await import(path.join(SCRIPTS_NM, '@adobe/helix-md2jcr/src/index.js'));
  return mod.md2jcr;
}

const noopLog = {
  info() {}, warn() {}, error() {}, debug() {},
};

/**
 * Package-only: inside each tabs-industry tab, keep the featured banner image
 * (the one following the `field:content_image` hint) and drop the product-card
 * thumbnails. md2jcr maps one image per richtext field, so multiple images in a
 * repeating item's richtext break JCR conversion. The rendered site keeps all
 * images — this transform runs only on the package payload, never on disk.
 */
function stripTabsIndustryThumbnails(html) {
  const start = html.indexOf('class="tabs-industry"');
  if (start === -1) return html;
  // The tabs-industry block is a self-contained top-level section <div>. Find its
  // bounds by walking div depth from the opening tag.
  const openTagStart = html.lastIndexOf('<div', start);
  let depth = 0;
  let end = html.length;
  const tagRe = /<\/?div\b[^>]*>/g;
  tagRe.lastIndex = openTagStart;
  let m = tagRe.exec(html);
  while (m) {
    if (m[0].startsWith('</')) depth -= 1;
    else depth += 1;
    if (depth === 0) { end = m.index + m[0].length; break; }
    m = tagRe.exec(html);
  }
  const before = html.slice(0, openTagStart);
  let block = html.slice(openTagStart, end);
  const after = html.slice(end);

  // Within each tab's content cell, the first image (featured banner) sits right
  // after `field:content_image`; all later images are product thumbnails. Remove
  // <p>…<picture/img>…</p> wrappers that are NOT the featured banner.
  // Split on the content_image hint so the banner in each tab is preserved.
  const parts = block.split('<!-- field:content_image -->');
  block = parts.map((part, idx) => {
    if (idx === 0) return part; // before the first tab's banner
    // The banner picture is the first <picture>…</picture> in this segment; keep
    // it, then strip any subsequent <p> that wraps a picture/img (product thumbs).
    const firstPicEnd = part.indexOf('</picture>');
    if (firstPicEnd === -1) return part;
    const head = part.slice(0, firstPicEnd + '</picture>'.length);
    let tail = part.slice(firstPicEnd + '</picture>'.length);
    // Remove <p> blocks in the tail that contain an image.
    tail = tail.replace(/<p>\s*<picture>[\s\S]*?<\/picture>\s*<\/p>/g, '');
    return head + tail;
  }).join('<!-- field:content_image -->');

  return before + block + after;
}

async function main() {
  const html2md = await loadHtml2md();
  const md2jcr = await loadMd2jcr();

  // Load the Universal Editor component config once.
  const models = JSON.parse(await readFile(path.join(WORKSPACE, 'component-models.json'), 'utf-8'));
  const definitionRaw = JSON.parse(await readFile(path.join(WORKSPACE, 'component-definition.json'), 'utf-8'));
  const filters = JSON.parse(await readFile(path.join(WORKSPACE, 'component-filters.json'), 'utf-8'));
  const definition = definitionRaw.groups
    ? definitionRaw
    : { groups: [{ title: 'Blocks', id: 'blocks', components: definitionRaw.definitions || [] }] };

  // Fresh staging dir.
  if (existsSync(STAGE)) await rm(STAGE, { recursive: true, force: true });
  await mkdir(STAGE, { recursive: true });

  const filterRoots = [];

  const failures = [];
  for (const page of PAGES) {
    let raw = await readFile(path.join(WORKSPACE, page.html), 'utf-8');
    // Package-only transform: md2jcr maps a repeating item's richtext to a single
    // image field, so the tabs-industry per-tab product THUMBNAILS (which the
    // rendered site keeps) must be dropped for JCR — the featured banner image
    // stays. This does NOT modify the on-disk content; it only affects the
    // package payload so the block round-trips into the Universal Editor model.
    raw = stripTabsIndustryThumbnails(raw);
    // Wrap the plain fragment so html2md finds a <main>.
    const doc = `<!DOCTYPE html><html><body><main>${raw}</main></body></html>`;
    const md = await html2md(doc, {
      log: noopLog,
      url: `https://main--justrite--nichols5973.aem.page/${page.jcrPath}`,
    });
    let xml;
    try {
      xml = await md2jcr(md, { models, definition, filters });
    } catch (e) {
      failures.push({ page: page.html, error: e.message.split('\n')[0] });
      console.log(`✗ ${page.html} — ${e.message.split('\n')[0]}`);
      continue;
    }

    const jcrDir = path.join(STAGE, 'jcr_root', SITE_ROOT.replace(/^\//, ''), page.jcrPath);
    await mkdir(jcrDir, { recursive: true });
    await writeFile(path.join(jcrDir, '.content.xml'), xml, 'utf-8');
    filterRoots.push(`${SITE_ROOT}/${page.jcrPath}`);
    console.log(`✓ ${page.html} → jcr_root${SITE_ROOT}/${page.jcrPath}/.content.xml`);
  }
  if (failures.length) {
    console.log(`\n⚠️  ${failures.length} page(s) failed conversion:`);
    failures.forEach((f) => console.log(`   - ${f.page}: ${f.error}`));
  }

  // vault meta: filter.xml
  const metaDir = path.join(STAGE, 'META-INF/vault');
  await mkdir(metaDir, { recursive: true });
  const filterXml = `<?xml version="1.0" encoding="UTF-8"?>\n<workspaceFilter version="1.0">\n${filterRoots.map((r) => `  <filter root="${r}"/>`).join('\n')}\n</workspaceFilter>\n`;
  await writeFile(path.join(metaDir, 'filter.xml'), filterXml, 'utf-8');

  // vault meta: properties.xml
  const propsXml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">\n<properties>\n  <comment>ComplianceSigns migrated content</comment>\n  <entry key="name">${PKG_NAME}</entry>\n  <entry key="group">${PKG_GROUP}</entry>\n  <entry key="version">${PKG_VERSION}</entry>\n  <entry key="createdBy">excat-migration</entry>\n  <entry key="packageType">content</entry>\n</properties>\n`;
  await writeFile(path.join(metaDir, 'properties.xml'), propsXml, 'utf-8');

  // Zip it. Prefer the `zip` binary; fall back to Node's zlib-based archiver.
  const zipPath = path.join(DIST, `${PKG_NAME}-${PKG_VERSION}.zip`);
  if (existsSync(zipPath)) await rm(zipPath);
  try {
    execFileSync('zip', ['-r', '-q', zipPath, 'jcr_root', 'META-INF'], { cwd: STAGE });
  } catch {
    await zipDir(STAGE, zipPath);
  }
  console.log(`\n📦 Package built: ${path.relative(WORKSPACE, zipPath)}`);
  console.log(`   Roots: ${filterRoots.length} pages under ${SITE_ROOT}`);
  if (failures.length) {
    console.log(`   Note: ${failures.length} page(s) omitted (see above).`);
  }
}

main().catch((e) => {
  console.error('Package build failed:', e);
  process.exit(1);
});
