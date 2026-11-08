/* Small, progressive animations: content remains visible if this script cannot run. */
(() => {
  'use strict';
  if (typeof document.documentElement.animate !== 'function') return;

  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Set();
  const revealed = new WeakSet();
  const targets = [...document.querySelectorAll(
    '.section .section-heading, .section .split > *, .skills-grid > .skill, .projects > .project, .contact-grid > *'
  )];
  let observer;
  let initialized = false;

  function reveal(element, delay = 0) {
    if (preference.matches || revealed.has(element)) return;
    revealed.add(element);
    const animation = element.animate([
      { opacity: 0, transform: 'translateY(14px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], {
      duration: 620, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards'
    });
    const record = { element, animation };
    running.add(record);
    animation.onfinish = animation.oncancel = () => running.delete(record);
  }

  function configure() {
    observer?.disconnect();
    for (const { animation } of running) animation.cancel();
    running.clear();

    if (!initialized) {
      initialized = true;
      if (!preference.matches) {
        document.querySelectorAll('.hero-copy > *').forEach((element, index) => reveal(element, index * 55));
      }
    }
    if (preference.matches || !('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        const index = [...entry.target.parentElement.children].indexOf(entry.target);
        reveal(entry.target, Math.min(index, 4) * 45);
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' });
    targets.forEach(element => { if (!revealed.has(element)) observer.observe(element); });
  }

  // A focused control must be immediately visible, even during its entrance.
  document.addEventListener('focusin', event => {
    for (const { element, animation } of running) {
      if (element.contains(event.target)) animation.cancel();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) for (const { animation } of running) animation.cancel();
  });
  preference.addEventListener('change', configure);

  // Pointer navigation glides; keyboard and skip-link navigation keep native focus behavior.
  document.addEventListener('click', event => {
    if (preference.matches || event.defaultPrevented || event.button !== 0 || !event.detail ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#"]');
    if (!link || link.classList.contains('skip')) return;
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  configure();
})();
