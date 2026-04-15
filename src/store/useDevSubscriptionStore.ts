import { create } from 'zustand';
import type { SubscriptionTier } from '@/types/subscription';

interface DevSubscriptionState {
  mockTier: SubscriptionTier;
  setMockTier: (tier: SubscriptionTier) => void;
}

/**
 * DEV-ONLY store for prototype phase.
 * Drives the mock subscription state across the entire app (client side).
 * Server-side reads come from the `dev_mock_tier` cookie (set by DevTierToggle).
 *
 * SECURITY: This store and its widget MUST be excluded from production builds.
 * Gate all imports behind `process.env.NODE_ENV !== 'production'`.
 *
 * In Phase 2: this store is DELETED. Real subscription state comes from
 * Supabase via subscriptionService.getCurrentSubscription().
 */
export const useDevSubscriptionStore = create<DevSubscriptionState>((set) => ({
  mockTier: 'free',
  setMockTier: (tier) => set({ mockTier: tier }),
}));

// Selectors
export const selectMockTier = (state: DevSubscriptionState) => state.mockTier;
export const selectSetMockTier = (state: DevSubscriptionState) =>
  state.setMockTier;
