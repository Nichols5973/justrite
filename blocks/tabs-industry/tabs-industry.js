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

    // The panel body arrives as a flat run of <p>/<h3> siblings (richtext
    // flattens the authored structure). Regroup it into a featured tile
    // followed by product cards so the CSS can lay them out side-by-side.
    // A new group starts at each element containing an image.
    const bodyWrap = tabpanel.querySelector(':scope > div') || tabpanel;
    const nodes = [...bodyWrap.children];
    if (nodes.length) {
      const groups = [];
      let current = null;
      nodes.forEach((node) => {
        const isImage = !!node.querySelector('picture, img');
        if (isImage) {
          current = document.createElement('div');
          current.className = 'tabs-industry-card';
          groups.push(current);
        }
        if (!current) {
          current = document.createElement('div');
          current.className = 'tabs-industry-card';
          groups.push(current);
        }
        current.append(node);
      });
      // First group is the featured industry tile; the rest are products.
      if (groups.length) groups[0].classList.add('tabs-industry-featured');
      const row = document.createElement('div');
      row.className = 'tabs-industry-cards';
      groups.forEach((g) => row.append(g));
      bodyWrap.textContent = '';
      bodyWrap.append(row);
    }
  });

  block.prepend(tablist);
}
