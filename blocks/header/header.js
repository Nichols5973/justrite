// ComplianceSigns header — content-first, generic (reads content/nav.plain.html)

/**
 * Fetch the nav fragment. Metadata-independent dual-fetch:
 * /content first (localhost / aem up), then root (DA/EDS production).
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp;
}

/**
 * Build the search form (form controls are created in JS, not the fragment).
 */
function buildSearch() {
  const form = document.createElement('form');
  form.className = 'nav-search';
  form.action = '/search';
  form.setAttribute('role', 'search');
  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = 'Search';
  input.setAttribute('aria-label', 'Search');
  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.setAttribute('aria-label', 'Search');
  btn.innerHTML = '<span class="nav-search-icon" aria-hidden="true"></span><span class="nav-search-label">Search</span>';
  form.append(input, btn);
  return form;
}

/** Icon for a utility link, from where it points (phone, contact, account, cart). */
function toolIcon(href) {
  if (href.startsWith('tel:')) return 'phone';
  if (/contact/i.test(href)) return 'contact';
  if (/account|customer|login/i.test(href)) return 'account';
  if (/cart/i.test(href)) return 'cart';
  return null;
}

/**
 * Decorate a utility link: phone numbers keep their visible text; the other
 * tools become icon buttons with the link text kept as the accessible label.
 */
function buildTool(a) {
  const href = a.getAttribute('href') || '';
  const icon = toolIcon(href);
  const label = a.textContent.trim();
  a.textContent = '';
  if (icon) {
    const span = document.createElement('span');
    span.className = `nav-icon nav-icon-${icon}`;
    span.setAttribute('aria-hidden', 'true');
    a.append(span);
  }
  const text = document.createElement('span');
  text.className = icon === 'phone' || !icon ? 'nav-tool-label' : 'nav-tool-label nav-visually-hidden';
  text.textContent = label;
  a.append(text);
  a.title = label;
  if (icon === 'cart') {
    const count = document.createElement('span');
    count.className = 'nav-cart-count';
    count.textContent = '0';
    a.append(count);
  }
  a.className = icon === 'phone' ? 'nav-phone' : 'nav-tool';
  return a;
}

function closeAllPanels(navList) {
  navList.querySelectorAll('[aria-expanded="true"]').forEach((el) => {
    el.setAttribute('aria-expanded', 'false');
  });
}

export default async function decorate(block) {
  const nav = await fetchNav();
  block.textContent = '';

  const header = document.createElement('nav');
  header.className = 'nav';
  header.setAttribute('aria-label', 'Main navigation');

  const sections = nav ? [...nav.children].filter((c) => c.tagName === 'DIV') : [];
  const [brandSection, navSection, ...ctaSections] = sections;
  const desktop = window.matchMedia('(min-width: 900px)');

  // --- Brand / utility bar ---
  const brand = document.createElement('div');
  brand.className = 'nav-brand';

  if (brandSection) {
    const logoP = brandSection.querySelector('p');
    if (logoP) {
      const logoWrap = document.createElement('div');
      logoWrap.className = 'nav-logo';
      let logoLink = logoP.querySelector('a');
      if (!logoLink) {
        // AEM content stores the logo as a plain image; link it to the homepage.
        logoLink = document.createElement('a');
        logoLink.href = '/';
        logoLink.setAttribute('aria-label', 'Home');
        logoLink.append(...logoP.childNodes);
      }
      logoWrap.append(logoLink);
      brand.append(logoWrap);
    }
  }

  brand.append(buildSearch());

  const tools = document.createElement('div');
  tools.className = 'nav-tools';
  if (brandSection) {
    const toolLinks = brandSection.querySelector('ul');
    if (toolLinks) {
      toolLinks.querySelectorAll('a').forEach((a) => {
        const tool = buildTool(a);
        if (tool.classList.contains('nav-phone')) brand.append(tool);
        else tools.append(tool);
      });
    }
  }
  brand.append(tools);

  // Hamburger toggle (mobile)
  const hamburger = document.createElement('button');
  hamburger.className = 'nav-hamburger';
  hamburger.type = 'button';
  hamburger.setAttribute('aria-label', 'Open navigation');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = '<span class="nav-hamburger-icon"></span>';
  brand.prepend(hamburger);

  // --- Main nav ---
  const navList = document.createElement('ul');
  navList.className = 'nav-sections';

  if (navSection) {
    const topUl = navSection.querySelector('ul');
    if (topUl) {
      [...topUl.children].forEach((li) => {
        const item = document.createElement('li');
        // AEM rich text wraps each top-level label in a <p>.
        const trigger = li.querySelector(':scope > a, :scope > p > a');
        const panel = li.querySelector(':scope > ul');

        if (trigger && panel) {
          item.className = 'nav-drop';
          const btn = document.createElement('a');
          btn.href = trigger.getAttribute('href') || '#';
          btn.textContent = trigger.textContent;
          btn.className = 'nav-drop-trigger';
          btn.setAttribute('aria-expanded', 'false');
          // Desktop: the label links to its landing page and the panel opens on
          // hover. Mobile: tapping the label toggles its panel.
          btn.addEventListener('click', (e) => {
            if (desktop.matches && btn.getAttribute('href') !== '#') return;
            e.preventDefault();
            const open = btn.getAttribute('aria-expanded') === 'true';
            closeAllPanels(navList);
            btn.setAttribute('aria-expanded', open ? 'false' : 'true');
          });

          const dropdown = document.createElement('div');
          dropdown.className = 'nav-panel';
          const panelList = document.createElement('ul');
          panel.querySelectorAll(':scope > li').forEach((sub) => {
            const subLi = document.createElement('li');
            const link = sub.querySelector('a');
            if (link) {
              subLi.append(link);
            } else {
              // Unlinked entries are group headings within the panel.
              subLi.className = 'nav-panel-heading';
              subLi.textContent = sub.textContent.trim();
            }
            panelList.append(subLi);
          });
          dropdown.append(panelList);

          item.append(btn, dropdown);
        } else if (trigger) {
          item.append(trigger);
        }
        navList.append(item);
      });
    }
  }

  hamburger.addEventListener('click', () => {
    const open = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', open ? 'false' : 'true');
    header.classList.toggle('nav-open', !open);
  });

  // Close panels on outside click / Escape
  document.addEventListener('click', (e) => {
    if (!header.contains(e.target)) closeAllPanels(navList);
  });
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') closeAllPanels(navList);
  });

  // Reset state when crossing the desktop breakpoint
  desktop.addEventListener('change', () => {
    closeAllPanels(navList);
    hamburger.setAttribute('aria-expanded', 'false');
    header.classList.remove('nav-open');
  });

  // Main nav row: sections + call-to-action links (e.g. Request a Quote).
  const navRow = document.createElement('div');
  navRow.className = 'nav-row';
  navRow.append(navList);
  ctaSections.forEach((section) => {
    section.querySelectorAll('a').forEach((a) => {
      a.className = 'nav-cta';
      navRow.append(a);
    });
  });

  header.append(brand, navRow);
  block.append(header);
}
