/**
 * newsletter — email signup (demo).
 * The source "Stay Up to Date with Compliance" section uses a dynamic HubSpot
 * form that isn't present in static HTML. This block renders a lightweight
 * email input + Sign Up button so the section matches the live design. The
 * heading and copy above it are authored as default content in the section.
 *
 * Authored config (optional key/value rows): placeholder, cta, action.
 */
/**
 * Read config from the decorated block. The import emits one single-column row
 * per field in a fixed order (placeholder, cta, action). At runtime EDS strips
 * the field-hint comments, so read the rows positionally. Falls back to
 * two-column key/value rows if an author uses that shape in the editor.
 */
function readConfig(block) {
  const config = {};
  const order = ['placeholder', 'cta', 'action'];
  const rows = [...block.children];
  rows.forEach((row, i) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      // key/value shape
      const key = cells[0].textContent.trim().toLowerCase();
      const value = cells[1].textContent.trim();
      if (key && order.includes(key)) config[key] = value;
    } else if (cells.length === 1 && order[i]) {
      // positional single-column shape
      const value = cells[0].textContent.trim();
      if (value) config[order[i]] = value;
    }
  });
  return config;
}

export default function decorate(block) {
  const {
    placeholder = 'Enter your email address',
    cta = 'Sign Up',
    action = '/p/emailconnection-subscribe',
  } = readConfig(block);

  block.textContent = '';

  const form = document.createElement('form');
  form.className = 'newsletter-form';
  form.action = action;
  form.setAttribute('novalidate', '');

  const input = document.createElement('input');
  input.type = 'email';
  input.name = 'email';
  input.required = true;
  input.placeholder = placeholder;
  input.setAttribute('aria-label', 'Email address');

  const button = document.createElement('button');
  button.type = 'submit';
  button.textContent = cta;

  form.append(input, button);

  // Demo-only: prevent an actual navigation and show a simple confirmation.
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!input.checkValidity()) {
      input.reportValidity();
      return;
    }
    form.classList.add('newsletter-done');
    form.innerHTML = '<p class="newsletter-thanks">Thanks — you’re signed up!</p>';
  });

  block.append(form);
}
