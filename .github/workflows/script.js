const menuButton = document.querySelector('.menu-toggle');
const menuPanel = document.querySelector('.menu-panel');
const menuClose = document.querySelector('.menu-close');
const backdrop = document.querySelector('.menu-backdrop');
const menuLinks = [...document.querySelectorAll('.menu-panel a, .menu-panel button, .menu-panel summary')];
let previousFocus;
let menuHideTimer;
const getMenuFocusables = () => menuLinks.filter((element) => element.offsetParent !== null && !element.closest('details:not([open])'));

function setMenu(open) {
  clearTimeout(menuHideTimer);
  menuButton.setAttribute('aria-expanded', String(open));
  menuPanel.setAttribute('aria-hidden', String(!open));
  if (open) {
    menuPanel.hidden = false;
    backdrop.hidden = false;
    requestAnimationFrame(() => menuPanel.classList.add('is-open'));
  } else {
    menuPanel.classList.remove('is-open');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    menuHideTimer = window.setTimeout(() => {
      menuPanel.hidden = true;
      backdrop.hidden = true;
    }, reducedMotion ? 0 : 360);
  }
  document.body.classList.toggle('menu-is-open', open);
  if (open) {
    previousFocus = document.activeElement;
    menuClose.focus();
  } else {
    previousFocus?.focus();
  }
}

menuButton.addEventListener('click', () => setMenu(true));
menuClose.addEventListener('click', () => setMenu(false));
backdrop.addEventListener('click', () => setMenu(false));
menuLinks.filter((link) => link.tagName === 'A').forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuPanel.classList.contains('is-open')) setMenu(false);
  if (event.key === 'Tab' && menuPanel.classList.contains('is-open')) {
    const focusables = getMenuFocusables();
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});

const tabs = [...document.querySelectorAll('.day-tab')];
const calendarStatus = document.querySelector('#calendar-status');

function activateTab(tab, { updateUrl = true } = {}) {
  tabs.forEach((item) => {
    const active = item === tab;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-selected', String(active));
    document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
  });
  calendarStatus.textContent = tab.dataset.status;
  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set('day', String(tabs.indexOf(tab) + 1));
    window.history.pushState({ day: tabs.indexOf(tab) + 1 }, '', url);
  }
}

const dayFromUrl = Number(new URLSearchParams(window.location.search).get('day'));
const initialTab = tabs[dayFromUrl > 0 && dayFromUrl <= tabs.length ? dayFromUrl - 1 : 0];
activateTab(initialTab, { updateUrl: false });
window.addEventListener('popstate', () => {
  const day = Number(new URLSearchParams(window.location.search).get('day'));
  const tab = tabs[day > 0 && day <= tabs.length ? day - 1 : 0];
  activateTab(tab, { updateUrl: false });
});

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    else nextIndex = (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[nextIndex].focus();
    activateTab(tabs[nextIndex]);
  });
});

const accessibilityStatus = document.querySelector('#a11y-status');
const accessibilityButtons = document.querySelectorAll('[data-a11y]');
let textScale = 0;

function announceAccessibility(message) {
  accessibilityStatus.textContent = message;
}

accessibilityButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.a11y;
    if (action === 'larger' && textScale < 2) textScale += 1;
    if (action === 'smaller' && textScale > 0) textScale -= 1;
    if (action === 'larger' || action === 'smaller') {
      document.documentElement.classList.toggle('text-large', textScale === 1);
      document.documentElement.classList.toggle('text-larger', textScale === 2);
      const labels = ['standardowy', 'powiększony', 'największy'];
      announceAccessibility(`Rozmiar tekstu: ${labels[textScale]}.`);
    }
    if (action === 'contrast') {
      const enabled = document.documentElement.classList.toggle('high-contrast');
      button.setAttribute('aria-pressed', String(enabled));
      button.setAttribute('aria-label', enabled ? 'Wyłącz wysoki kontrast' : 'Włącz wysoki kontrast');
      button.title = enabled ? 'Wyłącz wysoki kontrast' : 'Włącz wysoki kontrast';
      announceAccessibility(enabled ? 'Wysoki kontrast włączony.' : 'Wysoki kontrast wyłączony.');
    }
    if (action === 'links') {
      const enabled = document.documentElement.classList.toggle('highlight-links');
      button.setAttribute('aria-pressed', String(enabled));
      button.setAttribute('aria-label', enabled ? 'Wyłącz podkreślanie i podświetlanie linków' : 'Podkreśl i podświetl linki');
      button.title = enabled ? 'Wyłącz podkreślanie i podświetlanie linków' : 'Podkreśl i podświetl linki';
      announceAccessibility(enabled ? 'Podkreślanie i podświetlanie linków włączone.' : 'Podkreślanie i podświetlanie linków wyłączone.');
    }
    if (action === 'mono') {
      const enabled = document.documentElement.classList.toggle('monochrome');
      button.setAttribute('aria-pressed', String(enabled));
      button.setAttribute('aria-label', enabled ? 'Wyłącz tryb monochromatyczny' : 'Włącz tryb monochromatyczny');
      button.title = enabled ? 'Wyłącz tryb monochromatyczny' : 'Włącz tryb monochromatyczny';
      announceAccessibility(enabled ? 'Tryb monochromatyczny włączony.' : 'Tryb monochromatyczny wyłączony.');
    }
  });
});
