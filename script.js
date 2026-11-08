'use strict';

const root = document.documentElement;
const themeButton = document.querySelector('#theme');
function updateThemeControls() {
  const dark = root.dataset.theme === 'dark';
  themeButton.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
  themeButton.setAttribute('aria-pressed', String(dark));
  document.querySelector('meta[name="theme-color"]').content = dark ? '#111925' : '#ffffff';
}
themeButton.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch (_) { /* Storage may be disabled. */ }
  updateThemeControls();
});
updateThemeControls();

const menuButton = document.querySelector('#menu');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
  navigation.classList.remove('open');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', `${open ? 'Close' : 'Open'} navigation`);
  navigation.classList.toggle('open', open);
});
navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('click', event => { if (!event.target.closest('.header')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('open')) {
    closeMenu();
    menuButton.focus();
  }
});
window.matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
const navLinks = [...navigation.querySelectorAll('a')];
const sections = [...document.querySelectorAll('main section[id]')];
function updateNavigation() {
  const current = sections.filter(section => section.getBoundingClientRect().top <= 180).at(-1);
  navLinks.forEach(link => {
    const active = link.hash === `#${current?.id || 'home'}`;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
let scrollPending = false;
window.addEventListener('scroll', () => {
  if (scrollPending) return;
  scrollPending = true;
  requestAnimationFrame(() => { updateNavigation(); scrollPending = false; });
}, { passive: true });
updateNavigation();

const projects = {
  commerce: {
    title: 'E-Commerce Redesign',
    category: 'SAMPLE CONCEPT / WEB DESIGN',
    description: 'An illustrative storefront concept exploring product discovery and a clear shopping interface. This is a sample design, not a completed client website.',
    direction: 'A simple information hierarchy, generous product space, and clear shopping actions keep the focus on browsing. The preview was constructed with HTML and CSS for this portfolio.',
    tags: ['Sample concept', 'E-commerce', 'Interface design']
  },
  fitness: {
    title: 'Fitness App Design',
    category: 'SAMPLE CONCEPT / MOBILE DESIGN',
    description: 'A sample mobile interface exploring daily activity summaries and a focused workout action. The numbers in the preview are illustrative.',
    direction: 'The design groups daily activity, progress, and a primary action into a compact view. It is an interface preview, not a functioning health or fitness application.',
    tags: ['Sample concept', 'Mobile interface', 'Activity tracking']
  },
  dashboard: {
    title: 'Portfolio Dashboard',
    category: 'SAMPLE CONCEPT / DASHBOARD',
    description: 'An illustrative analytics interface for a creative portfolio. All metrics and trends in the preview are sample data, not measured portfolio results.',
    direction: 'A navigation sidebar, grouped metrics, and an audience chart demonstrate a possible information layout. This preview does not connect to a database or analytics service.',
    tags: ['Sample concept', 'Dashboard', 'Data presentation']
  }
};
const dialog = document.querySelector('#project-dialog');
document.querySelectorAll('[data-project]').forEach(button => {
  button.addEventListener('click', () => {
    const project = projects[button.dataset.project];
    if (!project) return;
    document.querySelector('#dialog-category').textContent = project.category;
    document.querySelector('#dialog-title').textContent = project.title;
    document.querySelector('#dialog-description').textContent = project.description;
    document.querySelector('#dialog-direction').textContent = project.direction;
    document.querySelector('#dialog-tags').replaceChildren(...project.tags.map(tag => {
      const span = document.createElement('span');
      span.textContent = tag;
      return span;
    }));
    dialog.showModal();
  });
});
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
document.querySelector('#dialog-contact').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
});

const form = document.querySelector('#contact-form');
const formStatus = document.querySelector('#form-status');
let submitting = false;
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting || !form.reportValidity()) return;
  const button = form.querySelector('button[type="submit"]');
  submitting = true;
  button.disabled = true;
  form.setAttribute('aria-busy', 'true');
  button.textContent = 'Sending…';
  formStatus.textContent = 'Submitting your inquiry…';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    if (!response.ok) throw new Error('Submission rejected');
    formStatus.textContent = 'Thank you. Your inquiry has been submitted successfully.';
    form.reset();
  } catch (error) {
    formStatus.textContent = error.name === 'AbortError'
      ? 'The request timed out. Your message may not have arrived. Please try again or contact me on LinkedIn. Your entries have been retained.'
      : 'Your inquiry could not be submitted. Please try again or contact me on LinkedIn. Your entries have been retained.';
  } finally {
    clearTimeout(timeout);
    submitting = false;
    button.disabled = false;
    form.removeAttribute('aria-busy');
    const arrow = document.createElement('span');
    arrow.textContent = '↗';
    arrow.setAttribute('aria-hidden', 'true');
    button.replaceChildren('Send inquiry ', arrow);
  }
});
document.querySelectorAll('[data-year]').forEach(element => {
  element.textContent = new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Asia/Manila' }).format(new Date());
});

// Decorative hover grid: no animation loop, touch input, or reduced-motion tracking.
const hoverGrid = document.querySelector('#hover-grid');
const gridPreference = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
let gridFrame = 0;
let gridX = 0;
let gridY = 0;
function hideHoverGrid() {
  if (gridFrame) cancelAnimationFrame(gridFrame);
  gridFrame = 0;
  hoverGrid.classList.remove('is-active');
}
function moveHoverGrid(event) {
  if (event.pointerType !== 'mouse') { hideHoverGrid(); return; }
  gridX = event.clientX;
  gridY = event.clientY;
  if (gridFrame) return;
  gridFrame = requestAnimationFrame(() => {
    gridFrame = 0;
    hoverGrid.style.setProperty('--grid-x', `${gridX}px`);
    hoverGrid.style.setProperty('--grid-y', `${gridY}px`);
    hoverGrid.classList.add('is-active');
  });
}
function configureHoverGrid() {
  hideHoverGrid();
  document.removeEventListener('pointermove', moveHoverGrid);
  document.removeEventListener('pointerleave', hideHoverGrid);
  window.removeEventListener('blur', hideHoverGrid);
  if (!gridPreference.matches) return;
  document.addEventListener('pointermove', moveHoverGrid, { passive: true });
  document.addEventListener('pointerleave', hideHoverGrid);
  window.addEventListener('blur', hideHoverGrid);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) hideHoverGrid(); });
gridPreference.addEventListener('change', configureHoverGrid);
configureHoverGrid();
