/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: compliancesigns.com section breaks + Section Metadata.
 *
 * Template "home" has 8 sections (page-templates.json). Each section's
 * `selector` array was verified against migration-work/cleaned.html:
 *   rc3  .home-banner-section   (style: null   — first section, no break/metadata)
 *   rc4  .home-shop-category    (style: light)
 *   rc5  .home-best-seller      (style: light)
 *   rc6  .home-food-service     (style: light)
 *   rc7  .home-customer-review  (style: navy-blue)
 *   rc8  .home-lastest-blogs    (style: light)
 *   rc9  .home-sign-up          (style: dark)
 *   rc10 .home-why-csign        (style: light)
 *
 * Breaks are inserted in beforeTransform (while every section element still
 * exists, before block parsers can replace them) using a temporary marker
 * attribute; Section Metadata blocks are anchored to that marker in
 * afterTransform. Sections are iterated in reverse in each hook so that
 * inserting relative to a live element never disturbs unprocessed sections.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

// section.selector is an array of candidate selectors — try each in order, first match wins.
function querySection(root, selectors) {
  for (const sel of selectors) {
    const el = root.querySelector(sel);
    if (el) return el;
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = payload.template.sections || [];

  if (hookName === 'beforeTransform') {
    // Insert breaks now, before parsers can replace any section element.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (i === 0 && !section.style) continue; // first section: no break, no metadata needed
      const sectionEl = querySection(element, section.selector);
      if (!sectionEl) continue; // no selector matched on this page — skip, never guess a replacement

      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    // Parsers have now run and may have replaced section elements. Anchor each
    // styled section's Section Metadata block to whichever still exists: the
    // marker <hr> placed above, or (first section, no marker inserted) the
    // original element itself.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || querySection(element, section.selector);
      if (!anchor) continue; // neither survived — no selector matched post-parse; skip, never guess

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove(); // section 0 never gets a real leading break
      }
    }
  }
}
