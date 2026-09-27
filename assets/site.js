document.documentElement.classList.add('js');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
    menuButton.textContent = open ? 'Close' : 'Menu';
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      menuButton.click();
      menuButton.focus();
    }
  });
}
let toastTimer;
function announce(message) {
  const toast = document.querySelector('#toast');
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 4500);
}
document.querySelectorAll('[data-copy]').forEach(button => {
  button.hidden = false;
  button.addEventListener('click', async () => {
    const code = document.getElementById(button.dataset.copy);
    try {
      await navigator.clipboard.writeText(code.textContent);
      announce('Command copied to clipboard.');
    } catch {
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      announce('Command selected. Press Ctrl+C or Command+C to copy.');
    }
  });
});
document.querySelectorAll('[data-directory]').forEach(directory => {
  const input = directory.querySelector('input[type="search"]');
  const buttons = directory.querySelectorAll('[data-filter]');
  const cards = [...directory.querySelectorAll('[data-category]')];
  const count = directory.querySelector('[data-count]');
  const empty = directory.querySelector('[data-empty]');
  let category = 'all';
  directory.querySelectorAll('[data-enhanced]').forEach(element => { element.hidden = false; });
  function filter() {
    const words = (input?.value || '').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    let visible = 0;
    cards.forEach(card => {
      const matchesCategory = category === 'all' || card.dataset.category.split(' ').includes(category);
      const text = card.textContent.toLocaleLowerCase();
      card.hidden = !(matchesCategory && words.every(word => text.includes(word)));
      if (!card.hidden) visible++;
    });
    count.textContent = `${visible} of ${cards.length} resources`;
    empty.hidden = visible !== 0;
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.filter;
    buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    filter();
  }));
  input?.addEventListener('input', filter);
  directory.querySelector('[data-reset]')?.addEventListener('click', () => {
    if (input) input.value = '';
    category = 'all';
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === 'all')));
    filter();
    input?.focus();
  });
  filter();
});
