/* eslint-disable no-console, no-restricted-syntax, no-await-in-loop */
/* eslint-disable no-bitwise, no-continue, object-curly-newline, max-len */
/**
 * Build an AEM (xwalk / crosswalk) content package from the migrated
 * .plain.html pages.
 *
 * Pipeline per page:  .plain.html  →  wrap in <main>  →  html2md  →  md2jcr
 *   →  .content.xml under jcr_root/content/justrite/<path>/
 *
 * Images are downloaded and packaged as DAM assets under /content/dam/justrite.
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
const PKG_VERSION = '1.3.0';

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
const IMAGE_CACHE = path.join(DIST, 'image-cache');

/**
 * AEM only renders image fields that reference DAM assets; an external URL is
 * shown as link text. Every source-site image is therefore downloaded, packaged
 * as a DAM asset under DAM_ROOT, and the pages are repointed at it.
 */
const DAM_ROOT = '/content/dam/justrite';
const EXTERNAL_IMAGE = /https?:\/\/(?:media|www)\.compliancesigns\.com\/[^"&\s<>]+?\.(?:png|jpe?g|gif|webp|svg)/gi;
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml' };

/**
 * Source URL -> DAM path, mirroring the source folders. Drops the leading
 * "media" segment and Magento's catalog cache hash / single-letter shards.
 */
function damPathFor(url) {
  const segs = decodeURIComponent(new URL(url).pathname).split('/').filter(Boolean);
  if (segs[0] === 'media') segs.shift();
  const out = [];
  for (let i = 0; i < segs.length; i += 1) {
    if (segs[i] === 'cache' && i < segs.length - 1) { i += 1; continue; }
    if (segs[i].length === 1 && i < segs.length - 1) continue;
    out.push(segs[i].replace(/[^A-Za-z0-9._-]+/g, '-'));
  }
  return `${DAM_ROOT}/${out.join('/')}`;
}

/** Pixel size from the image header (PNG, GIF, JPEG); null if unknown. */
function imageSize(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf.length > 10 && buf.toString('ascii', 0, 3) === 'GIF') {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i += 1; continue; }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
      }
      i += 2 + len;
    }
  }
  return null;
}

/** Download a source image once (cached under dist/, which is gitignored). */
async function fetchImage(url, damPath) {
  const cached = path.join(IMAGE_CACHE, damPath);
  if (existsSync(cached)) return readFile(cached);
  const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  await mkdir(path.dirname(cached), { recursive: true });
  await writeFile(cached, buf);
  return buf;
}

const FOLDER_XML = (title) => `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:sling="http://sling.apache.org/jcr/sling/1.0" xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0"
    jcr:primaryType="sling:OrderedFolder">
    <jcr:content
        jcr:primaryType="nt:unstructured"
        jcr:title="${title}"/>
</jcr:root>
`;

/**
 * Write one image as a dam:Asset in vault layout: the asset node, its
 * original rendition binary, and the rendition's mime type.
 */
async function writeDamAsset(damPath, buf) {
  const ext = damPath.split('.').pop().toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  const size = imageSize(buf);
  const dims = size ? `\n            tiff:ImageLength="{Long}${size.height}"\n            tiff:ImageWidth="{Long}${size.width}"` : '';
  const assetDir = path.join(STAGE, 'jcr_root', damPath.replace(/^\//, ''));
  const renditions = path.join(assetDir, '_jcr_content', 'renditions');
  await mkdir(path.join(renditions, 'original.dir'), { recursive: true });
  await writeFile(path.join(assetDir, '.content.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:tiff="http://ns.adobe.com/tiff/1.0/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:dam="http://www.day.com/dam/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0"
    jcr:primaryType="dam:Asset">
    <jcr:content
        jcr:primaryType="dam:AssetContent">
        <metadata
            dc:format="${mime}"
            jcr:primaryType="nt:unstructured"${dims}/>
        <related jcr:primaryType="nt:unstructured"/>
    </jcr:content>
</jcr:root>
`, 'utf-8');
  await writeFile(path.join(renditions, 'original'), buf);
  await writeFile(path.join(renditions, 'original.dir', '.content.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0"
    jcr:primaryType="nt:file">
    <jcr:content
        jcr:mimeType="${mime}"
        jcr:primaryType="nt:resource"/>
</jcr:root>
`, 'utf-8');
}

/** DAM folder nodes (sling:OrderedFolder) from DAM_ROOT down to each asset. */
async function writeDamFolders(damPaths) {
  const folders = new Set();
  damPaths.forEach((p) => {
    const segs = p.split('/');
    for (let i = DAM_ROOT.split('/').length; i < segs.length; i += 1) folders.add(segs.slice(0, i).join('/'));
  });
  for (const folder of folders) {
    const dir = path.join(STAGE, 'jcr_root', folder.replace(/^\//, ''));
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, '.content.xml'), FOLDER_XML(folder.split('/').pop()), 'utf-8');
  }
}

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

/**
 * Package-only: upgrade older tabs-industry markup (a single content cell, or
 * un-hinted nested divs) to the tabs-industry-item model — title | featured
 * image + text | product1..4 image + text — so every product keeps its own
 * image in AEM (a rich-text field holds at most one). Rows already in that
 * shape (field-hinted featured_image) pass through unchanged.
 */
/**
 * Package-only: md2jcr wraps headings inside rich-text values in a paragraph
 * (<p><h3>…</h3></p>). That is invalid HTML; browsers split it into empty
 * paragraphs around the heading, adding stray spacing in AEM. Unwrap them in
 * the (XML-escaped) rich-text attribute values.
 */
function unwrapRichtextHeadings(xml) {
  return xml
    .replace(
      /&lt;p&gt;\s*(&lt;(h[1-6])(?:(?!&gt;)[\s\S])*&gt;[\s\S]*?&lt;\/\2&gt;)\s*&lt;\/p&gt;/g,
      '$1',
    )
    // md2jcr also drops the <p> around a paragraph that is entirely bold
    // (<p>A</p><strong>B</strong>); put it back.
    .replace(
      /(text="|&lt;\/p&gt;)(&lt;strong&gt;(?:(?!&lt;\/?p&gt;)[^"])*?&lt;\/strong&gt;)(?=&lt;p&gt;|")/g,
      '$1&lt;p&gt;$2&lt;/p&gt;',
    );
}

const TABS_PRODUCT_SLOTS = 4;

function normalizeTabsIndustry(html) {
  if (!html.includes('tabs-industry')) return html;
  const { document } = new JSDOM(`<body>${html}</body>`).window;
  document.querySelectorAll('div.tabs-industry').forEach((block) => {
    [...block.children].forEach((row) => {
      if (row.innerHTML.includes('field:featured_image')) return;
      const cells = [...row.children];
      if (cells.length < 2) return;
      const title = cells[0].textContent.replace(/\s+/g, ' ').trim();

      // Text/image blocks in document order; a new group starts at each image.
      // The first group is the featured tile, the rest are products.
      const groups = [];
      cells.slice(1).forEach((c) => c.querySelectorAll('p, h1, h2, h3, h4, h5, h6').forEach((el) => {
        const pic = el.querySelector('picture, img');
        if (pic || !groups.length) groups.push({ image: null, text: [] });
        const group = groups[groups.length - 1];
        if (pic && !group.image) group.image = pic.closest('picture') || pic;
        else if (!pic && el.textContent.trim()) group.text.push(el);
      }));

      const cell = (fields) => {
        const div = document.createElement('div');
        fields.forEach(([name, nodes]) => {
          div.append(document.createComment(` field:${name} `));
          nodes.forEach((n) => div.append(n.cloneNode(true)));
        });
        return div;
      };
      const imageNodes = (g) => {
        if (!g?.image) return [];
        const p = document.createElement('p');
        p.append(g.image.cloneNode(true));
        return [p];
      };

      const titleP = document.createElement('p');
      titleP.textContent = title;
      const [featured, ...products] = groups;
      const out = [
        cell([['title', [titleP]]]),
        cell([['featured_image', imageNodes(featured)], ['featured_text', featured?.text || []]]),
      ];
      for (let i = 0; i < TABS_PRODUCT_SLOTS; i += 1) {
        const g = products[i];
        out.push(g
          ? cell([[`product${i + 1}_image`, imageNodes(g)], [`product${i + 1}_text`, g.text]])
          : document.createElement('div'));
      }
      row.replaceChildren(...out);
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
  const images = new Map(); // DAM path -> source URL
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

    xml = unwrapRichtextHeadings(xml);

    // Repoint source-site images at their packaged DAM assets.
    xml = xml.replace(EXTERNAL_IMAGE, (url) => {
      const damPath = damPathFor(url);
      if (images.has(damPath) && images.get(damPath) !== url) {
        throw new Error(`DAM path collision: ${url} and ${images.get(damPath)} → ${damPath}`);
      }
      images.set(damPath, url);
      return damPath;
    });

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

  // DAM assets for every referenced image.
  console.log(`\nPackaging ${images.size} image(s) as DAM assets under ${DAM_ROOT}`);
  const imageFailures = [];
  for (const [damPath, url] of images) {
    try {
      await writeDamAsset(damPath, await fetchImage(url, damPath));
    } catch (e) {
      imageFailures.push(damPath);
      console.log(`✗ ${url} — ${e.message}`);
    }
  }
  await writeDamFolders([...images.keys()]);

  // vault meta: filter.xml. Pages are replaced; the DAM root is "update" so
  // assets authors add later aren't removed by a re-install.
  const metaDir = path.join(STAGE, 'META-INF/vault');
  await mkdir(metaDir, { recursive: true });
  const filterEntries = filterRoots.map((r) => `  <filter root="${r}"/>`);
  if (images.size) filterEntries.push(`  <filter root="${DAM_ROOT}" mode="update"/>`);
  const filterXml = `<?xml version="1.0" encoding="UTF-8"?>\n<workspaceFilter version="1.0">\n${filterEntries.join('\n')}\n</workspaceFilter>\n`;
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
  console.log(`   Assets: ${images.size - imageFailures.length} images under ${DAM_ROOT}`);
  if (imageFailures.length) {
    console.log(`   Note: ${imageFailures.length} image(s) failed to download and are missing.`);
  }
  if (failures.length) {
    console.log(`   Note: ${failures.length} page(s) omitted (see above).`);
  }
}

main().catch((e) => {
  console.error('Package build failed:', e);
  process.exit(1);
});
