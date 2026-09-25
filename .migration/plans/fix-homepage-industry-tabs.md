# Plan: Fix the homepage in AEM (Industry tabs, then the whole page)

## Status
**Ready to execute. You've approved it ("go ahead and fix it").** Plan mode is still on, though, so I can't make changes yet. Switch to **Execute mode** and I'll work through the checklist below in order, without further questions. The only exception is the optional item, which is left out unless you ask for it.

**Header phone number:** you've confirmed it's showing in AEM, so no change is needed. The whole-page audit below still re-checks the header, so it stays intact after the new package is installed.

## Current package
- **Latest package (1.2.0):** https://github.com/Nichols5973/justrite/raw/main/tools/package/releases/compliancesigns-content-1.2.0.zip
- **Contents:** all 8 preview pages, the updated header (phone number, icons, Request a Quote) and footer, and 27 images as DAM assets.
- **Limitation:** it does **not** fix the Industry tabs yet. That fix will ship as **1.3.0**.
- **Browsing the folder on GitHub:** https://github.com/Nichols5973/justrite/tree/main/tools/package/releases

## Problem
In Universal Editor, **Industry Based Safety Signs & Labels** is broken. Each tab shows one narrow tile with the featured image, and every product name and "Select Options" link is stacked on top of it as an orange button.

**Root cause:** the AEM version of each tab has a different structure from the preview version.
- **In the preview:** each tab holds the featured image, then a run of product entries. Each product entry has its own image, price, title and "Select Options" link. The tab code starts a new product card at each image.
- **In AEM:** the tab's editable fields are *Tab Title*, *Featured Image* and one *Content* rich-text field. AEM allows only one image per rich-text field, so the package builder had to drop every product thumbnail. Only the featured image is left, so the tab code puts everything into a single featured tile, and every link picks up the orange "Shop All" button style.

## Decisions (confirmed)
- **Scope:** fix the Industry tabs, then audit every homepage section against AEM's structure and fix anything else that breaks.
- **Editing model:** each tab gets a **Tab Name**, a **Featured Image with its Shop All link**, and **up to 4 product slots** (image plus details: price, title link, Select Options). Empty slots are hidden.
- **Optional product capture:** not included by default. Construction, Transportation and Food & Beverage keep their current single product unless you ask me to capture all 4 from the live site.
- **Header phone number:** already done and confirmed in AEM; no change.

## Approach

### 1. New editing model for the Industry tabs
- Replace the tab item's fields with grouped fields. AEM renders each group as its own cell, so each product keeps its own image:
  - `title`: Tab Name
  - `featured_image` + `featured_text`: the featured tile (image, and rich text holding the Shop All link)
  - `product1_image` + `product1_text` … `product4_image` + `product4_text`: product image, and rich text holding the price, title link and Select Options
- Regenerate the combined Universal Editor config files (component definitions, models, filters) from the block files.

### 2. Tab code reads cells, not image boundaries
- Treat the first content cell as the featured tile, and each later non-empty cell as a product card.
- Skip empty product slots.
- Keep the current image-based grouping as a fallback for older content.
- Apply the "Shop All" button style only to the featured tile's link. Keep the product styling (price line, title link, Select Options button) as it is in the preview today.

### 3. Content produced in the new shape
- Update the Industry tabs import parser to write the new field groups, so the preview content and the AEM content have the same structure.
- Re-run the homepage import with the bundled import scripts (no hand edits to content).
- Remove the package builder's special Industry-tabs rewrite, which dropped the thumbnails. It is no longer needed once the content matches the model.

### 4. Whole-page audit against AEM's structure
- Build an "AEM-shaped" preview check that uses the package itself:
  1. Take each block's content from the package.
  2. Lay it out the way AEM renders it (one row per item, one cell per field or field group, rich text as-is, image fields as pictures, single links as buttons).
  3. Run the real block code on it and compare the result with the current preview.
- Run the check for every homepage section: promo banners, Shop by Category, Best Sellers, Industry tabs, Reviews, News & Resources, Stay Up to Date, Why ComplianceSigns, header and footer.
  - **Header:** confirm the phone icon and number, the contact/account/cart icons with the cart badge, the five nav items and Request a Quote.
- One problem is already found: the Why ComplianceSigns section contains two hidden Bing tracking-pixel images from the live site. In AEM they would show as link text. Remove them during import cleanup and re-import.
- Fix anything else the check finds, at the parser, model or block-code level.

### 5. Package, verify, deliver
- Bump the package to **1.3.0**, rebuild it, and confirm that the tabs content has 4 product images per Manufacturing tab and every image is packaged in the DAM.
- Lint all changed code. Check desktop and mobile in the preview and in the AEM-shaped check.
- Replace 1.2.0 in the repo's download folder with 1.3.0, then open a PR with a testing URL. Merge only when you say so.
- After merge, 1.3.0 downloads from: https://github.com/Nichols5973/justrite/raw/main/tools/package/releases/compliancesigns-content-1.3.0.zip

## Checklist
- [x] Header phone number with icon (1-800-578-1245), as on the live site: done in 1.2.0 and confirmed in AEM
- [ ] Update the Industry tabs editing model to Tab Name + featured group + 4 product groups; regenerate the combined Universal Editor config
- [ ] Update the Industry tabs code to build the featured tile and product cards from cells (skip empty slots, keep the fallback)
- [ ] Scope the "Shop All" button style to the featured tile only; confirm the product card styling matches the preview
- [ ] Update the Industry tabs import parser to write the new field groups
- [ ] Add import cleanup that removes tracking-pixel images (Bing) from page content
- [ ] Re-run the homepage import with the import scripts and check the preview renders the same as today
- [ ] Remove the package builder's Industry-tabs rewrite; rebuild the package
- [ ] Build the AEM-shaped preview check and run it on every homepage section plus header and footer (confirm the header phone, icons, nav and Request a Quote are intact)
- [ ] Fix every section the check shows as broken, then re-run until all pass
- [ ] (Optional, only on request) Capture all 4 products per industry tab from the live site
- [ ] Bump the package to 1.3.0; confirm the Manufacturing tab has 4 product images and every image is packaged in the DAM
- [ ] Lint JS and CSS; check desktop (1440px) and mobile (375px)
- [ ] Replace 1.2.0 with 1.3.0 in the download folder, commit on a new branch, and open a PR with a testing URL
- [ ] Share the 1.3.0 download link (branch link before merge, `main` link after) and confirm it serves the right file
- [ ] After you merge: install 1.3.0 in Package Manager, reload Universal Editor, and confirm the tabs show the featured tile plus product cards side by side and the header still shows the phone number

## Notes
- **Execution requires Execute mode.** This plan hasn't changed anything yet; switch modes and I'll start with the first open checklist item.
- Installing 1.3.0 replaces the current homepage content in AEM. Any edits made in Universal Editor since the last install will be overwritten.
- Optional add-on: there's a project-management add-on that can produce handover documentation for this migration. Say the word if you'd like me to turn it on.
