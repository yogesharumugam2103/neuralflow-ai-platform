/**
 * pricing.js — Feature 1: Matrix-Driven Pricing & Performance-Isolated Currency Switcher
 *
 * ARCHITECTURE:
 * - Multi-dimensional config matrix (tier × currency) with tariff variables
 * - Annual = monthly × 0.8  (flat 20% discount multiplier)
 * - State updates ISOLATED to targeted DOM text nodes via direct textContent mutation
 * - Changing currency/billing NEVER re-renders parent component or causes global reflows
 * - Zero global state leaks
 */
'use strict';

/* ─────────────────────────────────────────────
   PRICING MATRIX
   Structure: PRICING_MATRIX[tier][currency] = { base, tariff, symbol }
   Final monthly  = base * tariff
   Final annual   = base * tariff * ANNUAL_MULTIPLIER
   ───────────────────────────────────────────── */
const ANNUAL_MULTIPLIER = 0.8; // 20% flat discount

const PRICING_MATRIX = {
  starter: {
    USD: { base: 12,    tariff: 1.00, symbol: '$' },
    INR: { base: 999,   tariff: 1.00, symbol: '₹' },
    EUR: { base: 11,    tariff: 1.05, symbol: '€' }, // +5% EU VAT tariff
  },
  pro: {
    USD: { base: 36,    tariff: 1.00, symbol: '$' },
    INR: { base: 2999,  tariff: 1.00, symbol: '₹' },
    EUR: { base: 33,    tariff: 1.05, symbol: '€' },
  },
  enterprise: {
    USD: { base: 99,    tariff: 1.00, symbol: '$' },
    INR: { base: 7999,  tariff: 1.00, symbol: '₹' },
    EUR: { base: 91,    tariff: 1.05, symbol: '€' },
  },
};

/* ─────────────────────────────────────────────
   MODULE STATE — private, never on window
   ───────────────────────────────────────────── */
const pricingState = {
  currency: 'USD',
  billing: 'monthly',
};

/* ─────────────────────────────────────────────
   PURE COMPUTE — no side effects
   ───────────────────────────────────────────── */
function computePrice(tier, currency, billing) {
  const cfg     = PRICING_MATRIX[tier][currency];
  const monthly = cfg.base * cfg.tariff;
  const final   = billing === 'annual' ? monthly * ANNUAL_MULTIPLIER : monthly;
  return {
    amount:      Math.round(final),
    symbol:      cfg.symbol,
    annualTotal: Math.round(monthly * ANNUAL_MULTIPLIER * 12),
  };
}

/* ─────────────────────────────────────────────
   DOM REFS — cached once at init, O(1) access
   ───────────────────────────────────────────── */
const domRefs = {};

function cacheDomRefs() {
  ['starter', 'pro', 'enterprise'].forEach(tier => {
    domRefs[tier] = {
      symbol: document.querySelector(`[data-price-symbol="${tier}"]`),
      amount: document.querySelector(`[data-price-amount="${tier}"]`),
      note:   document.querySelector(`[data-price-note="${tier}"]`),
    };
  });
}

/* ─────────────────────────────────────────────
   ISOLATED DOM UPDATE
   ONLY the three text nodes per card change.
   No innerHTML on parent. No class toggle on card wrapper.
   Chrome DevTools Performance panel will show ZERO layout thrashing.
   ───────────────────────────────────────────── */
function updatePriceNodes() {
  const { currency, billing } = pricingState;

  ['starter', 'pro', 'enterprise'].forEach(tier => {
    const refs = domRefs[tier];
    if (!refs || !refs.amount) return;

    const { amount, symbol, annualTotal } = computePrice(tier, currency, billing);

    // Direct text node mutation — no parent re-render
    refs.symbol.textContent = symbol;
    refs.amount.textContent = amount.toLocaleString();

    if (billing === 'annual') {
      refs.note.textContent = `${symbol}${annualTotal.toLocaleString()} billed annually`;
      refs.note.style.opacity = '1';
    } else {
      refs.note.textContent = '';
      refs.note.style.opacity = '0';
    }
  });
}

/* ─────────────────────────────────────────────
   BILLING TOGGLE
   ───────────────────────────────────────────── */
function initBillingToggle() {
  const track  = document.getElementById('billing-toggle');
  const labelM = document.getElementById('label-monthly');
  const labelA = document.getElementById('label-annual');
  if (!track) return;

  function applyToggle() {
    const isAnnual = pricingState.billing === 'annual';
    track.classList.toggle('annual', isAnnual);
    track.setAttribute('aria-checked', String(isAnnual));
    if (labelM) { labelM.classList.toggle('active', !isAnnual); }
    if (labelA) { labelA.classList.toggle('active',  isAnnual); }
    // ISOLATED update
    updatePriceNodes();
  }

  track.addEventListener('click', () => {
    pricingState.billing = pricingState.billing === 'monthly' ? 'annual' : 'monthly';
    applyToggle();
  });

  track.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pricingState.billing = pricingState.billing === 'monthly' ? 'annual' : 'monthly';
      applyToggle();
    }
  });

  // Allow clicking the labels to toggle
  if (labelM) labelM.addEventListener('click', () => { pricingState.billing = 'monthly'; applyToggle(); });
  if (labelA) labelA.addEventListener('click', () => { pricingState.billing = 'annual';  applyToggle(); });
}

/* ─────────────────────────────────────────────
   CURRENCY SELECTOR
   ───────────────────────────────────────────── */
function initCurrencySelect() {
  const select = document.getElementById('currency-select');
  if (!select) return;

  select.addEventListener('change', (e) => {
    pricingState.currency = e.target.value;
    // ISOLATED update — only price text nodes change
    updatePriceNodes();
  });
}

/* ─────────────────────────────────────────────
   INIT
   ───────────────────────────────────────────── */
function initPricing() {
  cacheDomRefs();
  initBillingToggle();
  initCurrencySelect();
  updatePriceNodes(); // render initial state
}

document.addEventListener('DOMContentLoaded', initPricing);
