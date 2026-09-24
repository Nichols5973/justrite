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
import { readFile, writeFile, mkdir, rm, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { deflateRawSync, crc32 } from 'node:zlib';
import { createRequire } from 'node:module';

// jsdom (CommonJS) from the content-import toolchain, for package-only DOM fixes.
const { JSDOM } = createRequire(
  '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json',
)('jsdom');

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

const CONTENT_DIR = 'content';

/**
 * Every page in the preview: all *.plain.html under content/ (recursively),
 * mapped to a JCR path under SITE_ROOT. Discovered at build time so new pages
 * are packaged automatically.
 */
async function discoverPages() {
  const pages = [];
  const walk = async (dir) => {
    const entries = await readdir(path.join(WORKSPACE, dir), { withFileTypes: true });
    for (const ent of entries) {
      const rel = path.join(dir, ent.name);
      // readdir reports a symlinked subdir as a symlink; follow it via stat.
      const isDir = ent.isDirectory()
        || (ent.isSymbolicLink() && (await stat(path.join(WORKSPACE, rel))).isDirectory());
      if (isDir) {
        if (ent.name !== 'images') await walk(rel);
      } else if (ent.name.endsWith('.plain.html')) {
        const jcrPath = path.relative(CONTENT_DIR, rel)
          .replace(/\.plain\.html$/, '')
          .split(path.sep)
          .join('/');
        pages.push({ html: rel, jcrPath });
      }
    }
  };
  await walk(CONTENT_DIR);
  return pages.sort((a, b) => a.jcrPath.localeCompare(b.jcrPath));
}

/**
 * Local images (content/images/*) -> their original source URLs. md2jcr drops
 * relative image paths, so without this the header/footer logos vanish from
 * the package. Every other image on the site already uses its source URL.
 */
const IMAGE_SOURCES = {
  'compliance-signs-logo.png': 'https://media.compliancesigns.com/media/homepage/compliance-signs-logo-new.png',
  'logo-footer.png': 'https://media.compliancesigns.com/media/wysiwyg/logo-footer.png',
  'trustpilot.png': 'https://www.compliancesigns.com/images/trustpilot.png',
};

/** Package-only: rewrite src="images/x.png" to the image's source URL. */
function absolutizeLocalImages(html) {
  const unmapped = [];
  const out = html.replace(/src="(?:\.\/|\/content\/)?images\/([^"]+)"/g, (match, file) => {
    if (IMAGE_SOURCES[file]) return `src="${IMAGE_SOURCES[file]}"`;
    unmapped.push(file);
    return match;
  });
  return { html: out, unmapped };
}

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
 * Package-only: normalize every tabs-industry block into the shape the
 * tabs-industry-item model expects — per tab: title | content_image (the one
 * featured banner) + content_richtext (text/links only). md2jcr maps a single
 * image per richtext field, so product thumbnails are dropped. Handles both the
 * field-hinted homepage markup and older un-hinted nested-div markup. The
 * rendered site keeps every image; this runs on the package payload only.
 */
/**
 * Package-only: md2jcr turns a link that wraps only an image into a button
 * component and discards the image (the header/footer logos came through as an
 * empty link to "/"). Unwrap such links so the image survives as an image; the
 * header/footer blocks re-link their logo to the homepage at runtime.
 */
function unwrapImageLinks(html) {
  if (!/<a\b[^>]*>\s*(?:<picture|<img)/.test(html)) return html;
  const { document } = new JSDOM(`<body>${html}</body>`).window;
  document.querySelectorAll('a').forEach((a) => {
    const onlyImage = a.children.length === 1
      && a.firstElementChild.matches('picture, img')
      && !a.textContent.trim();
    if (onlyImage) a.replaceWith(a.firstElementChild);
  });
  return document.body.innerHTML;
}

function normalizeTabsIndustry(html) {
  if (!html.includes('tabs-industry')) return html;
  const { document } = new JSDOM(`<body>${html}</body>`).window;
  document.querySelectorAll('div.tabs-industry').forEach((block) => {
    [...block.children].forEach((row) => {
      const cells = [...row.children];
      if (cells.length < 2) return;
      const title = cells[0].textContent.replace(/\s+/g, ' ').trim();
      const content = cells.slice(1);
      const banner = content.map((c) => c.querySelector('picture')).find(Boolean);
      // Text/link blocks in document order, excluding anything holding an image.
      const textEls = [];
      content.forEach((c) => c.querySelectorAll('p, h1, h2, h3, h4, h5, h6').forEach((el) => {
        if (!el.querySelector('picture, img') && el.textContent.trim()) textEls.push(el.cloneNode(true));
      }));

      const titleCell = document.createElement('div');
      titleCell.append(document.createComment(' field:title '));
      const tp = document.createElement('p');
      tp.textContent = title;
      titleCell.append(tp);

      const contentCell = document.createElement('div');
      if (banner) {
        contentCell.append(document.createComment(' field:content_image '));
        const bp = document.createElement('p');
        bp.append(banner.cloneNode(true));
        contentCell.append(bp);
      }
      contentCell.append(document.createComment(' field:content_richtext '));
      textEls.forEach((el) => contentCell.append(el));

      row.replaceChildren(titleCell, contentCell);
    });
  });
  return document.body.innerHTML;
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
  const pages = await discoverPages();
  console.log(`Found ${pages.length} page(s) in ${CONTENT_DIR}/\n`);
  for (const page of pages) {
    let raw = await readFile(path.join(WORKSPACE, page.html), 'utf-8');
    // Package-only: relink local images (logos) to their source URLs.
    const abs = absolutizeLocalImages(raw);
    raw = abs.html;
    if (abs.unmapped.length) {
      console.log(`⚠️  ${page.html}: no source URL for local image(s) ${abs.unmapped.join(', ')} — add to IMAGE_SOURCES`);
    }
    // Package-only: reshape tabs-industry to its UE model, and keep linked
    // images (logos) as images (see function docs).
    raw = normalizeTabsIndustry(raw);
    raw = unwrapImageLinks(raw);
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
