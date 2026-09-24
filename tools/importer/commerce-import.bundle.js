/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/commerce-import.js
  var commerce_import_exports = {};
  __export(commerce_import_exports, {
    default: () => commerce_import_default
  });
  function pageTypeFromUrl(url) {
    const path = new URL(url).pathname;
    if (/^\/pd\//.test(path)) return "PDP";
    return "PLP";
  }
  function skuFromUrl(url) {
    try {
      const last = new URL(url).pathname.replace(/\/+$/, "").split("/").pop() || "";
      const sku = last.split("-").pop();
      return sku ? sku.toUpperCase() : "";
    } catch (e) {
      return "";
    }
  }
  function categoryPathFromUrl(url) {
    const path = new URL(url).pathname.replace(/\/+$/, "");
    const segs = path.split("/").filter(Boolean);
    return segs.slice(1).join("/") || segs[segs.length - 1] || "";
  }
  function parseDescription(document) {
    const el = document.querySelector('[class*="product-description_desc"]');
    if (!el) {
      console.warn("\u26A0\uFE0F parseDescription: description element not found");
      return null;
    }
    const clone = el.cloneNode(true);
    clone.querySelectorAll('style, script, [data-bv-show], [class*="bv_"]').forEach((n) => n.remove());
    const text = clone.textContent.replace(/\s+/g, " ").trim();
    if (!text) {
      console.warn("\u26A0\uFE0F parseDescription: description text empty after cleanup");
      return null;
    }
    const wrap = document.createElement("div");
    const h = document.createElement("h2");
    h.textContent = "Product Details";
    wrap.append(h);
    const p = document.createElement("p");
    p.textContent = text;
    wrap.append(p);
    return wrap;
  }
  var commerce_import_default = {
    transform: ({ document, url }) => {
      const main = document.body;
      const pageType = pageTypeFromUrl(url);
      const h1 = document.querySelector("h1");
      const title = h1 ? h1.textContent.replace(/\s+/g, " ").trim() : document.title || "";
      const descBlock = pageType === "PDP" ? parseDescription(document) : null;
      const buildConfigCell = (fieldName, value) => {
        const cell = document.createElement("div");
        cell.append(document.createComment(` field:${fieldName} `));
        const p = document.createElement("p");
        p.textContent = value;
        cell.append(p);
        return cell;
      };
      let commerceBlock;
      if (pageType === "PDP") {
        commerceBlock = WebImporter.DOMUtils.createTable([
          ["product-details"],
          [buildConfigCell("defaultSku", skuFromUrl(url))]
        ], document);
      } else {
        commerceBlock = WebImporter.DOMUtils.createTable([
          ["product-list-page"],
          [buildConfigCell("urlPath", categoryPathFromUrl(url))]
        ], document);
      }
      main.innerHTML = "";
      const mainSection = document.createElement("div");
      if (title) {
        const h = document.createElement("h1");
        h.textContent = title;
        mainSection.append(h);
      }
      mainSection.append(commerceBlock);
      main.append(mainSection);
      if (descBlock) {
        const descSection = document.createElement("div");
        descSection.append(descBlock);
        main.append(descSection);
      }
      const metaSection = document.createElement("div");
      const metaRows = [["Metadata"]];
      if (title) metaRows.push(["Title", title]);
      const descMeta = document.querySelector('meta[name="description"], meta[property="og:description"]');
      if (descMeta) metaRows.push(["Description", descMeta.getAttribute("content") || ""]);
      metaSection.append(WebImporter.DOMUtils.createTable(metaRows, document));
      main.append(metaSection);
      const rawPath = new URL(url).pathname.replace(/\.html?$/i, "").replace(/\/+$/, "") || "/";
      return [{ element: main, path: WebImporter.FileUtils.sanitizePath(rawPath) }];
    }
  };
  return __toCommonJS(commerce_import_exports);
})();
