/**
 * bento-accordion.js — Feature 2: Bento-to-Accordion with State Persistence
 *
 * ARCHITECTURE:
 * - Tracks activeIndex across both desktop (bento) and mobile (accordion) layouts
 * - ResizeObserver watches body width for breakpoint crossing detection
 * - On crossing desktop → mobile: transfers active bento index to open accordion panel
 * - On crossing mobile → desktop: restores bento active card
 * - All transitions via native CSS — NO Framer Motion, NO external libs
 * - Zero external dependencies
 *
 * CONSTRAINT LOCK:
 * If user is hovering/interacting with bento-node and resizes past mobile breakpoint,
 * app programmatically transfers that exact activeIndex to mobile Accordion state.
 */
'use strict';

/* ─────────────────────────────────────────────
   STATE
   ───────────────────────────────────────────── */
const featureState = {
  activeIndex:     null,      // which card/item is currently active
  isMobile:        false,
  lastBreakpoint:  null,      // 'mobile' | 'desktop' — detect crossing only
};

const MOBILE_BREAKPOINT = 768;

/* ─────────────────────────────────────────────
   DOM REFS
   ───────────────────────────────────────────── */
let bentoCards     = [];
let accordionItems = [];

function cacheFeaturesRefs() {
  bentoCards     = Array.from(document.querySelectorAll('.bento-card'));
  accordionItems = Array.from(document.querySelectorAll('.accordion-item'));
}

/* ─────────────────────────────────────────────
   BENTO INTERACTIONS
   ───────────────────────────────────────────── */
function initBentoInteractions() {
  bentoCards.forEach((card, index) => {

    card.addEventListener('mouseenter', () => {
      setActiveBentoCard(index);
    });

    card.addEventListener('click', () => {
      setActiveBentoCard(index);
    });

    card.addEventListener('focus', () => {
      setActiveBentoCard(index);
    });

    // Radial gradient follows mouse
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width)  * 100;
      const y = ((e.clientY - rect.top)  / rect.height) * 100;
      card.style.setProperty('--mouse-x', `${x}%`);
      card.style.setProperty('--mouse-y', `${y}%`);
    });

    card.addEventListener('mouseleave', () => {
      card.classList.remove('active');
      // NOTE: featureState.activeIndex stays set — required for resize context transfer
    });
  });
}

function setActiveBentoCard(index) {
  bentoCards.forEach(c => c.classList.remove('active'));
  if (bentoCards[index]) {
    bentoCards[index].classList.add('active');
  }
  featureState.activeIndex = index;
}

/* ─────────────────────────────────────────────
   ACCORDION INTERACTIONS
   ───────────────────────────────────────────── */
function initAccordionInteractions() {
  accordionItems.forEach((item, index) => {
    const trigger = item.querySelector('.accordion-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      if (isOpen) {
        closeAccordionItem(index);
        featureState.activeIndex = null;
      } else {
        // Close all others
        accordionItems.forEach((_, i) => { if (i !== index) closeAccordionItem(i); });
        openAccordionItem(index);
        featureState.activeIndex = index;
      }
    });
  });
}

function openAccordionItem(index) {
  const item    = accordionItems[index];
  const trigger = item && item.querySelector('.accordion-trigger');
  if (!item) return;
  item.classList.add('open');
  item.setAttribute('aria-expanded', 'true');
  if (trigger) trigger.setAttribute('aria-expanded', 'true');
}

function closeAccordionItem(index) {
  const item    = accordionItems[index];
  const trigger = item && item.querySelector('.accordion-trigger');
  if (!item) return;
  item.classList.remove('open');
  item.setAttribute('aria-expanded', 'false');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
}

function closeAllAccordionItems() {
  accordionItems.forEach((_, i) => closeAccordionItem(i));
}

/* ─────────────────────────────────────────────
   CONTEXT TRANSFER — desktop → mobile
   Transfers activeIndex to accordion open state.
   Double rAF ensures the CSS display: flex has
   kicked in before the grid-template-rows animates.
   ───────────────────────────────────────────── */
function transferContextToAccordion() {
  const idx = featureState.activeIndex;
  closeAllAccordionItems();

  if (idx !== null && accordionItems[idx]) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        openAccordionItem(idx);
        accordionItems[idx].scrollIntoView({
          behavior: 'smooth',
          block:    'nearest',
        });
      });
    });
  }
}

/* Context transfer — mobile → desktop */
function transferContextToBento() {
  const idx = featureState.activeIndex;
  bentoCards.forEach(c => c.classList.remove('active'));

  if (idx !== null && bentoCards[idx]) {
    bentoCards[idx].classList.add('active');
  }
}

/* ─────────────────────────────────────────────
   RESIZE OBSERVER — breakpoint crossing
   ───────────────────────────────────────────── */
function initResizeObserver() {
  // Set initial state
  featureState.isMobile        = window.innerWidth < MOBILE_BREAKPOINT;
  featureState.lastBreakpoint  = featureState.isMobile ? 'mobile' : 'desktop';

  const observer = new ResizeObserver(() => {
    const nowMobile = window.innerWidth < MOBILE_BREAKPOINT;

    if (nowMobile && featureState.lastBreakpoint === 'desktop') {
      // Crossed desktop → mobile
      featureState.isMobile       = true;
      featureState.lastBreakpoint = 'mobile';
      transferContextToAccordion();

    } else if (!nowMobile && featureState.lastBreakpoint === 'mobile') {
      // Crossed mobile → desktop
      featureState.isMobile       = false;
      featureState.lastBreakpoint = 'desktop';
      transferContextToBento();
    }
  });

  // Observe body for width changes
  observer.observe(document.body);
}

/* ─────────────────────────────────────────────
   INIT
   ───────────────────────────────────────────── */
function initFeaturesComponent() {
  cacheFeaturesRefs();
  initBentoInteractions();
  initAccordionInteractions();
  initResizeObserver();
}

document.addEventListener('DOMContentLoaded', initFeaturesComponent);
