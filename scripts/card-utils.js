const CTA_STYLES = ['button', 'button-secondary', 'button-dark'];

/**
 * Removes the card "CTA Style" config cell (Universal Editor select field)
 * from a block row so its value isn't rendered as text.
 * @param {Element} row the block row
 * @returns {string} the selected style (e.g. 'button-secondary'), or ''
 */
// eslint-disable-next-line import/prefer-default-export
export function extractCtaStyle(row) {
  const cell = [...row.children].slice(2)
    .find((div) => CTA_STYLES.includes(div.textContent.trim()));
  if (!cell) return '';
  const style = cell.textContent.trim();
  cell.remove();
  return style;
}
