import { moveInstrumentation } from '../../scripts/scripts.js';

// keep track globally of the number of industry-tab blocks on the page
let tabBlockCnt = 0;

/**
 * tabs-industry — industry switcher.
 * A horizontal tab bar (e.g. Manufacturing, Construction, Transportation,
 * Food & Beverage) switches panels; each panel shows a featured industry tile
 * plus a row of product cards.
 *
 * Expected authored structure: one row per tab; the first cell is the tab
 * label/heading, remaining content is the panel body.
 */
export default function decorate(block) {
  const tablist = document.createElement('div');
  tablist.className = 'tabs-industry-list';
  tablist.setAttribute('role', 'tablist');
  tabBlockCnt += 1;
  tablist.id = `tabs-industry-list-${tabBlockCnt}`;

  const tabItems = [];
  [...block.children].forEach((child) => {
    if (!child || !child.firstElementChild) return;
    const heading = child.firstElementChild;
    const explicitTitle = child.querySelector('p[data-aue-prop="title"]');
    const labelText = (explicitTitle?.textContent || heading?.textContent || '').trim();
    if (!labelText) return;
    tabItems.push({ tabpanel: child, heading, labelText });
  });

  tabItems.forEach((item, i) => {
    const { tabpanel, heading } = item;
    const id = `tabs-industry-${tabBlockCnt}-panel-${i + 1}`;

    tabpanel.className = 'tabs-industry-panel';
    tabpanel.id = id;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');

    const button = document.createElement('button');
    button.className = 'tabs-industry-tab';
    button.id = `tab-${id}`;
    button.textContent = item.labelText;
    button.setAttribute('aria-controls', id);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');

    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      tabpanel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
    });

    tablist.append(button);

    // Remove the heading node used only as the tab label.
    if (heading && heading.parentElement === tabpanel && !heading.querySelector('picture')) {
      moveInstrumentation(heading, null);
      heading.remove();
    }

    // Build the featured tile + product cards. Current content has one cell per
    // field group (featured, product1..4), so each non-empty cell is a card.
    // Older content has a single cell holding a flat run of <p>/<h3> siblings;
    // there a new card starts at each element containing an image.
    const cells = [...tabpanel.children];
    const groups = [];
    const newCard = () => {
      const card = document.createElement('div');
      card.className = 'tabs-industry-card';
      groups.push(card);
      return card;
    };
    if (cells.length > 1) {
      cells.forEach((cell) => {
        const hasContent = cell.textContent.trim() || cell.querySelector('picture, img');
        if (hasContent) newCard().append(...cell.childNodes);
      });
    } else if (cells.length) {
      let current = null;
      [...cells[0].children].forEach((node) => {
        if (!current || node.querySelector('picture, img') || node.matches('picture, img')) {
          current = newCard();
        }
        current.append(node);
      });
    }
    if (groups.length) {
      // Drop whitespace text nodes and empty paragraphs (AEM rich text wraps
      // headings in <p>, which the parser splits into empty siblings).
      groups.forEach((card) => {
        [...card.childNodes].forEach((n) => {
          const emptyText = n.nodeType === Node.TEXT_NODE && !n.textContent.trim();
          const emptyP = n.nodeType === Node.ELEMENT_NODE && n.tagName === 'P'
            && !n.textContent.trim() && !n.querySelector('picture, img');
          if (emptyText || emptyP) n.remove();
        });
      });

      // First group is the featured industry tile.
      const featured = groups[0];
      featured.classList.add('tabs-industry-featured');
      // Overlay the industry name on the featured tile (matches source).
      const label = document.createElement('span');
      label.className = 'tabs-industry-featured-label';
      label.textContent = item.labelText;
      featured.append(label);
      // The featured tile's link is the filled "Shop All" CTA.
      featured.querySelectorAll('a').forEach((a) => a.classList.add('tabs-industry-shop-all'));

      // Tag the "From $X" price line in each product card for styling.
      groups.slice(1).forEach((card) => {
        [...card.children].forEach((el) => {
          if (el.tagName === 'P' && /\$\s*[\d.,]+/.test(el.textContent) && !el.querySelector('a')) {
            el.classList.add('tabs-industry-price');
          }
        });
      });

      const row = document.createElement('div');
      row.className = 'tabs-industry-cards';
      groups.forEach((g) => row.append(g));
      tabpanel.textContent = '';
      tabpanel.append(row);
    }
  });

  block.prepend(tablist);
}
