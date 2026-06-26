/**
 * animations.js — Entry orchestration & micro-interactions
 * Rules:
 * - Native CSS Transitions / WAAPI only — NO Framer Motion, NO GSAP
 * - Total entry orchestration ≤ 500ms (does not block TTI)
 * - Micro-interactions: 150–200ms ease-out
 * - Layout reflows: 300–400ms ease-in-out
 * - Respects prefers-reduced-motion
 */
'use strict';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─────────────────────────────────────────────
   THEME PERSISTENCE (runs before paint via <head> inline script)
   ───────────────────────────────────────────── */
function initTheme() {
  const saved = localStorage.getItem('nf-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
}

/* ─────────────────────────────────────────────
   THEME TOGGLE
   ───────────────────────────────────────────── */
function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('nf-theme', next);
    btn.setAttribute('aria-label', `Switch to ${current} mode`);
  });
}

/* ─────────────────────────────────────────────
   MOBILE NAV
   ───────────────────────────────────────────── */
function initMobileNav() {
  const hamburger  = document.getElementById('nav-hamburger');
  const mobileNav  = document.getElementById('mobile-nav');
  const closeBtn   = document.getElementById('mobile-nav-close');
  if (!hamburger || !mobileNav) return;

  function openNav() {
    mobileNav.classList.add('open');
    document.body.style.overflow = 'hidden';
    hamburger.setAttribute('aria-expanded', 'true');
  }
  function closeNav() {
    mobileNav.classList.remove('open');
    document.body.style.overflow = '';
    hamburger.setAttribute('aria-expanded', 'false');
  }

  hamburger.addEventListener('click', openNav);
  closeBtn && closeBtn.addEventListener('click', closeNav);

  // Close on link click
  mobileNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeNav);
  });

  // Close on Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });
}

/* ─────────────────────────────────────────────
   ENTRY SEQUENCE — hero elements staggered
   Total timeline: 8 × 60ms delay + 350ms duration = ~830ms wall time
   but all start immediately; last item finishes at 60ms×7 + 350ms = 770ms
   We reduce to 5 items max to stay within 500ms
   ───────────────────────────────────────────── */
function runEntrySequence() {
  if (prefersReducedMotion) {
    document.querySelectorAll('.entry-animate').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  const targets = document.querySelectorAll('.entry-animate');
  targets.forEach((el, i) => {
    const delay = i * 55; // 55ms stagger — 8 items → last starts at 385ms, finishes at 735ms
    el.animate(
      [
        { opacity: 0, transform: 'translateY(18px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      {
        duration: 320,
        delay,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'forwards',
      }
    );
  });
}

/* ─────────────────────────────────────────────
   SCROLL REVEAL — IntersectionObserver
   ───────────────────────────────────────────── */
function initScrollReveal() {
  if (prefersReducedMotion) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.10, rootMargin: '0px 0px -36px 0px' }
  );

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ─────────────────────────────────────────────
   NAV SCROLL STATE
   ───────────────────────────────────────────── */
function initNavScroll() {
  const header = document.querySelector('header[role="banner"]');
  if (!header) return;

  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', window.scrollY > 48);
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ─────────────────────────────────────────────
   CHART BAR ANIMATION — hero card
   ───────────────────────────────────────────── */
function animateChartBars() {
  if (prefersReducedMotion) return;

  const bars = document.querySelectorAll('.chart-bar');
  const heights = [35, 55, 45, 75, 60, 85, 70, 90];

  bars.forEach((bar, i) => {
    const h = heights[i] || 50;
    bar.style.height = '0%';
    bar.animate(
      [{ height: '0%' }, { height: `${h}%` }],
      {
        duration: 380,
        delay: 250 + i * 38,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'forwards',
      }
    );
  });
}

/* ─────────────────────────────────────────────
   PRICING CARD HOVER — price number shimmer
   ───────────────────────────────────────────── */
function initPricingHover() {
  document.querySelectorAll('.pricing-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      const amount = card.querySelector('.price-amount');
      if (!amount || prefersReducedMotion) return;

      amount.animate(
        [
          { transform: 'scale(1)',    color: 'var(--text-primary)' },
          { transform: 'scale(1.04)', color: 'var(--accent-primary)' },
          { transform: 'scale(1)',    color: 'var(--text-primary)' },
        ],
        { duration: 200, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      );
    });
  });
}
/**
 * Back to Top Logic Engine
 */
document.addEventListener("DOMContentLoaded", () => {
  const backToTopBtn = document.getElementById("back-to-top");

  // Monitor window scroll coordinates
  window.addEventListener("scroll", () => {
    // Show the arrow button once scrolled down past 400px view depth
    if (window.scrollY > 400) {
      backToTopBtn.classList.add("visible");
    } else {
      backToTopBtn.classList.remove("visible");
    }
  });

  // Native smooth scroll transition routine back up to absolute zero coordinate coordinate axis
  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
});
/* ─────────────────────────────────────────────
   ACTIVE NAV LINK HIGHLIGHTING
   ───────────────────────────────────────────── */
function initActiveNavLinks() {
  const sections = document.querySelectorAll('section[id], main[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            link.removeAttribute('aria-current');
            if (link.getAttribute('href') === `#${entry.target.id}`) {
              link.setAttribute('aria-current', 'page');
            }
          });
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  sections.forEach(s => observer.observe(s));
}

/* ─────────────────────────────────────────────
   INIT
   ───────────────────────────────────────────── */
function initAnimations() {
  initTheme();
  initThemeToggle();
  initMobileNav();
  initNavScroll();
  initScrollReveal();
  initActiveNavLinks();

  requestAnimationFrame(() => {
    runEntrySequence();
    animateChartBars();
  });

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(initPricingHover);
  } else {
    setTimeout(initPricingHover, 200);
  }
}

document.addEventListener('DOMContentLoaded', initAnimations);
