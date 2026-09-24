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
  btn.innerHTML = '<span class="nav-search-icon" aria-hidden="true"></span>';
  form.append(input, btn);
  return form;
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
  const brandSection = sections[0];
  const navSection = sections[1];

  // --- Brand / utility bar ---
  const brand = document.createElement('div');
  brand.className = 'nav-brand';

  if (brandSection) {
    const logoP = brandSection.querySelector('p');
    if (logoP) {
      const logoWrap = document.createElement('div');
      logoWrap.className = 'nav-logo';
      logoWrap.append(logoP.querySelector('a') || logoP);
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
        tools.append(a);
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
    const topUl = navSection.querySelector(':scope > ul');
    if (topUl) {
      [...topUl.children].forEach((li) => {
        const item = document.createElement('li');
        const trigger = li.querySelector(':scope > a');
        const panel = li.querySelector(':scope > ul');

        if (trigger && panel) {
          item.className = 'nav-drop';
          const btn = document.createElement('a');
          btn.href = trigger.getAttribute('href') || '#';
          btn.textContent = trigger.textContent;
          btn.className = 'nav-drop-trigger';
          btn.setAttribute('aria-expanded', 'false');
          btn.addEventListener('click', (e) => {
            if (btn.getAttribute('href') === '#') e.preventDefault();
            const open = btn.getAttribute('aria-expanded') === 'true';
            closeAllPanels(navList);
            btn.setAttribute('aria-expanded', open ? 'false' : 'true');
          });

          const dropdown = document.createElement('div');
          dropdown.className = 'nav-panel';
          const panelList = document.createElement('ul');
          panel.querySelectorAll(':scope > li').forEach((sub) => {
            const subLi = document.createElement('li');
            subLi.append(sub.querySelector('a') || sub);
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
  const desktop = window.matchMedia('(min-width: 900px)');
  desktop.addEventListener('change', () => {
    closeAllPanels(navList);
    hamburger.setAttribute('aria-expanded', 'false');
    header.classList.remove('nav-open');
  });

  header.append(brand, navList);
  block.append(header);
}
