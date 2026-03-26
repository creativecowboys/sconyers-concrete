// ── NAV: scrolled state ──
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ── MOBILE MENU ──
const navToggle = document.getElementById('navToggle');
const navLinksList = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
  const isOpen = navLinksList.classList.toggle('open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', isOpen);
});

// Close menu on link click
navLinksList.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinksList.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Close menu on outside click
document.addEventListener('click', (e) => {
  if (!nav.contains(e.target)) {
    navLinksList.classList.remove('open');
    navToggle.classList.remove('open');
  }
});

// ── SCROLL REVEAL ──
const revealEls = document.querySelectorAll(
  '.service-card, .stat-card, .pillar, .section-header, .about-text, .contact-info, .contact-form, .about-img, .footer-brand, .footer-links, .footer-contact'
);

revealEls.forEach(el => el.classList.add('reveal'));

// Stagger siblings within grid containers
document.querySelectorAll('.services-grid, .about-stats, .pillars').forEach(group => {
  group.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.09}s`;
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

// ── SMOOTH SCROLL (fallback) ──
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = nav.offsetHeight + 16;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ── HERO SCROLL INDICATOR: fade on scroll ──
const heroScroll = document.querySelector('.hero-scroll');
if (heroScroll) {
  window.addEventListener('scroll', () => {
    const opacity = Math.max(0, 1 - window.scrollY / 200);
    heroScroll.style.opacity = opacity;
  }, { passive: true });
}

// ── CONTACT FORM: submit feedback ──
const form = document.querySelector('.contact-form');
if (form) {
  form.addEventListener('submit', () => {
    const btn = form.querySelector('button[type="submit"]');
    if (btn) {
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Sending...`;
      btn.disabled = true;
      btn.style.opacity = '0.8';
    }
  });
}
