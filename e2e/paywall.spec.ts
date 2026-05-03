import { test, expect } from '@playwright/test';
import { uniqueEmail, registerUser, loginUser, getUserId, deleteTestUser } from './helpers/test-user';
import { seedSubscription } from './helpers/seed-subscription';

const PRO_ARTICLE = '/articles/building-stripe-subscriptions-the-right-way';
const ENTERPRISE_ARTICLE = '/articles/multi-tenant-architecture-for-saas';

test.describe('Paywall — Article Access by Tier', () => {
  let freeEmail: string;
  let proEmail: string;

  test.beforeAll(async ({ browser }) => {
    freeEmail = uniqueEmail();
    proEmail = uniqueEmail();

    for (const email of [freeEmail, proEmail]) {
      const page = await browser.newPage();
      await registerUser(page, email);
      await page.close();
    }

    const proId = await getUserId(proEmail);
    if (proId) await seedSubscription(proId, 'pro');
  });

  test.afterAll(async () => {
    await deleteTestUser(freeEmail);
    await deleteTestUser(proEmail);
  });

  test('anonymous user sees "Sign up to read" CTA on Pro article', async ({ page }) => {
    await page.goto(PRO_ARTICLE);
    await expect(page.getByRole('link', { name: 'Sign up to read' })).toBeVisible();
  });

  test('free user sees "Upgrade to Pro" CTA on Pro article', async ({ page }) => {
    await loginUser(page, freeEmail);
    await page.goto(PRO_ARTICLE);
    await expect(page.getByRole('link', { name: /Upgrade to Pro/i })).toBeVisible();
  });

  test('Pro user sees full content on Pro article, no paywall', async ({ page }) => {
    await loginUser(page, proEmail);
    await page.goto(PRO_ARTICLE);
    // Full content visible (text from content_full that isn't in preview)
    await expect(page.getByText('idempotent')).toBeVisible();
    // No paywall
    await expect(page.getByText('Sign up to read')).not.toBeVisible();
    await expect(page.getByText('Upgrade to')).not.toBeVisible();
  });

  test('Pro user sees "Upgrade to Enterprise" CTA on Enterprise article', async ({ page }) => {
    await loginUser(page, proEmail);
    await page.goto(ENTERPRISE_ARTICLE);
    await expect(page.getByRole('link', { name: /Upgrade to Enterprise/i })).toBeVisible();
  });
});
