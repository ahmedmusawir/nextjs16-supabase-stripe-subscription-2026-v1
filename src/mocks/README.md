# MOCK DATA — DELETE IN PHASE 2

This folder exists ONLY for the frontend prototype phase.

When real backend is wired (Stripe + Supabase subscriptions table):
1. Update services in src/services/* to query real data sources
2. Delete this entire folder
3. Delete src/store/useDevSubscriptionStore.ts
4. Delete the dev tier toggle widget component (src/components/dev/)
5. Clear the `dev_mock_tier` cookie from all environments
6. Verify no imports from `@/mocks` remain anywhere

If anything still imports from `@/mocks`, the swap is incomplete.
