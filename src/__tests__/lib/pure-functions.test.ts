import { meetsTier, tierDisplayName } from '@/lib/tiers';
import { safeRedirect } from '@/lib/safeRedirect';

// tierResolver reads process.env at module scope — set before importing
process.env.STRIPE_PRICE_STARTER = 'price_test_starter';
process.env.STRIPE_PRICE_PRO = 'price_test_pro';
process.env.STRIPE_PRICE_ENTERPRISE = 'price_test_enterprise';

import {
  resolveTierFromPriceId,
  resolvePriceIdFromTier,
} from '@/lib/stripe/tierResolver';

// ─── meetsTier ───────────────────────────────────────────────

describe('meetsTier', () => {
  // Same tier always passes
  it.each(['free', 'starter', 'pro', 'enterprise'] as const)(
    '%s meets itself',
    (tier) => {
      expect(meetsTier(tier, tier)).toBe(true);
    }
  );

  // Higher tier meets lower requirement
  it('enterprise meets all tiers', () => {
    expect(meetsTier('enterprise', 'free')).toBe(true);
    expect(meetsTier('enterprise', 'starter')).toBe(true);
    expect(meetsTier('enterprise', 'pro')).toBe(true);
  });

  it('pro meets free and starter', () => {
    expect(meetsTier('pro', 'free')).toBe(true);
    expect(meetsTier('pro', 'starter')).toBe(true);
  });

  it('starter meets free', () => {
    expect(meetsTier('starter', 'free')).toBe(true);
  });

  // Lower tier does NOT meet higher requirement
  it('free does not meet any paid tier', () => {
    expect(meetsTier('free', 'starter')).toBe(false);
    expect(meetsTier('free', 'pro')).toBe(false);
    expect(meetsTier('free', 'enterprise')).toBe(false);
  });

  it('starter does not meet pro or enterprise', () => {
    expect(meetsTier('starter', 'pro')).toBe(false);
    expect(meetsTier('starter', 'enterprise')).toBe(false);
  });

  it('pro does not meet enterprise', () => {
    expect(meetsTier('pro', 'enterprise')).toBe(false);
  });
});

// ─── tierDisplayName ─────────────────────────────────────────

describe('tierDisplayName', () => {
  it.each([
    ['free', 'Free'],
    ['starter', 'Starter'],
    ['pro', 'Pro'],
    ['enterprise', 'Enterprise'],
  ] as const)('displays %s as %s', (input, expected) => {
    expect(tierDisplayName(input)).toBe(expected);
  });
});

// ─── safeRedirect ────────────────────────────────────────────

describe('safeRedirect', () => {
  it('accepts valid internal paths', () => {
    expect(safeRedirect('/pricing')).toBe('/pricing');
    expect(safeRedirect('/members-portal/pro')).toBe('/members-portal/pro');
    expect(safeRedirect('/articles?page=2')).toBe('/articles?page=2');
  });

  it('returns null for null, undefined, and empty string', () => {
    expect(safeRedirect(null)).toBeNull();
    expect(safeRedirect(undefined)).toBeNull();
    expect(safeRedirect('')).toBeNull();
  });

  it('rejects protocol-relative URLs', () => {
    expect(safeRedirect('//evil.com')).toBeNull();
    expect(safeRedirect('//evil.com/path')).toBeNull();
  });

  it('rejects schemed URLs', () => {
    expect(safeRedirect('https://evil.com')).toBeNull();
    expect(safeRedirect('http://evil.com')).toBeNull();
    expect(safeRedirect('javascript:alert(1)')).toBeNull();
  });

  it('rejects backslashes', () => {
    expect(safeRedirect('/path\\evil')).toBeNull();
    expect(safeRedirect('\\evil')).toBeNull();
  });

  it('rejects paths that do not start with /', () => {
    expect(safeRedirect('evil')).toBeNull();
    expect(safeRedirect('evil.com/path')).toBeNull();
  });
});

// ─── resolveTierFromPriceId ──────────────────────────────────

describe('resolveTierFromPriceId', () => {
  it('resolves known price IDs to tiers', () => {
    expect(resolveTierFromPriceId('price_test_starter')).toBe('starter');
    expect(resolveTierFromPriceId('price_test_pro')).toBe('pro');
    expect(resolveTierFromPriceId('price_test_enterprise')).toBe('enterprise');
  });

  it('returns null for unknown price IDs', () => {
    expect(resolveTierFromPriceId('price_unknown')).toBeNull();
    expect(resolveTierFromPriceId('')).toBeNull();
  });
});

// ─── resolvePriceIdFromTier ──────────────────────────────────

describe('resolvePriceIdFromTier', () => {
  it('resolves known tiers to price IDs', () => {
    expect(resolvePriceIdFromTier('starter')).toBe('price_test_starter');
    expect(resolvePriceIdFromTier('pro')).toBe('price_test_pro');
    expect(resolvePriceIdFromTier('enterprise')).toBe('price_test_enterprise');
  });

  it('returns null for free tier', () => {
    expect(resolvePriceIdFromTier('free')).toBeNull();
  });
});
