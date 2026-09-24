/**
 * newsletter — email signup (demo, static).
 * The source "Stay Up to Date with Compliance" section uses a dynamic HubSpot
 * form that isn't present in static HTML. This block renders a static version
 * of that form: First Name / Last Name / Email / Industry + Submit, matching
 * the live layout (two fields per row). The section's background image, heading
 * and copy sit behind/above it (handled by the section CSS).
 *
 * Authored config (optional, positional single-column rows in fixed order):
 *   cta (submit label), action (form action URL).
 */
function readConfig(block) {
  const config = {};
  const order = ['cta', 'action'];
  [...block.children].forEach((row, i) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      const value = cells[1].textContent.trim();
      if (key && order.includes(key)) config[key] = value;
    } else if (cells.length === 1 && order[i]) {
      const value = cells[0].textContent.trim();
      if (value) config[order[i]] = value;
    }
  });
  return config;
}

const INDUSTRIES = [
  'Please Select', 'Construction', 'Education', 'Food & Beverage', 'Government',
  'Healthcare', 'Manufacturing', 'Oil & Gas', 'Transportation', 'Utilities',
  'Warehousing', 'Other',
];

function textField(name, placeholder, type = 'text') {
  const input = document.createElement('input');
  input.type = type;
  input.name = name;
  input.placeholder = placeholder;
  input.setAttribute('aria-label', placeholder);
  if (type === 'email') input.required = true;
  return input;
}

export default function decorate(block) {
  const { cta = 'Submit', action = '/p/emailconnection-subscribe' } = readConfig(block);
  block.textContent = '';

  const form = document.createElement('form');
  form.className = 'newsletter-form';
  form.action = action;
  form.setAttribute('novalidate', '');

  // Row 1: First Name + Last Name
  const row1 = document.createElement('div');
  row1.className = 'newsletter-row';
  row1.append(textField('firstname', 'First Name'), textField('lastname', 'Last Name'));

  // Row 2: Email + Industry
  const row2 = document.createElement('div');
  row2.className = 'newsletter-row';
  const email = textField('email', 'Email*', 'email');
  const select = document.createElement('select');
  select.name = 'industry';
  select.setAttribute('aria-label', 'Industry');
  INDUSTRIES.forEach((label, i) => {
    const opt = document.createElement('option');
    opt.value = i === 0 ? '' : label;
    opt.textContent = label;
    if (i === 0) { opt.disabled = true; opt.selected = true; }
    select.append(opt);
  });
  row2.append(email, select);

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'newsletter-submit';
  button.textContent = cta;

  form.append(row1, row2, button);

  // Demo-only: prevent navigation and show a confirmation.
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!email.checkValidity()) {
      email.reportValidity();
      return;
    }
    form.innerHTML = '<p class="newsletter-thanks">Thanks — you’re signed up!</p>';
  });

  block.append(form);
}
