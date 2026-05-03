import { test, expect } from '@playwright/test';
import { uniqueEmail, registerUser, loginUser, getUserId, deleteTestUser } from './helpers/test-user';
import { seedSubscription, deleteSubscription } from './helpers/seed-subscription';

test.describe('Subscription Gating — Tier Access Control', () => {
  let starterEmail: string;
  let proEmail: string;
  let enterpriseEmail: string;

  test.beforeAll(async ({ browser }) => {
    starterEmail = uniqueEmail();
    proEmail = uniqueEmail();
    enterpriseEmail = uniqueEmail();

    // Register all 3 users
    for (const email of [starterEmail, proEmail, enterpriseEmail]) {
      const page = await browser.newPage();
      await registerUser(page, email);
      await page.close();
    }

    // Seed subscriptions
    const starterId = await getUserId(starterEmail);
    const proId = await getUserId(proEmail);
    const enterpriseId = await getUserId(enterpriseEmail);

    if (starterId) await seedSubscription(starterId, 'starter');
    if (proId) await seedSubscription(proId, 'pro');
    if (enterpriseId) await seedSubscription(enterpriseId, 'enterprise');
  });

  test.afterAll(async () => {
    for (const email of [starterEmail, proEmail, enterpriseEmail]) {
      await deleteTestUser(email);
    }
  });

  test('Starter user: can access starter, blocked from pro and enterprise', async ({ page }) => {
    await loginUser(page, starterEmail);

    await page.goto('/members-portal/starter');
    await expect(page.locator('h1')).toContainText('Starter Content');

    await page.goto('/members-portal/pro');
    await page.waitForURL('**/pricing**', { timeout: 10000 });

    await page.goto('/members-portal/enterprise');
    await page.waitForURL('**/pricing**', { timeout: 10000 });
  });

  test('Pro user: can access starter + pro, blocked from enterprise', async ({ page }) => {
    await loginUser(page, proEmail);

    await page.goto('/members-portal/starter');
    await expect(page.locator('h1')).toContainText('Starter Content');

    await page.goto('/members-portal/pro');
    await expect(page.locator('h1')).toContainText('Pro Content');

    await page.goto('/members-portal/enterprise');
    await page.waitForURL('**/pricing**', { timeout: 10000 });
  });

  test('Enterprise user: can access all tiers', async ({ page }) => {
    await loginUser(page, enterpriseEmail);

    await page.goto('/members-portal/starter');
    await expect(page.locator('h1')).toContainText('Starter Content');

    await page.goto('/members-portal/pro');
    await expect(page.locator('h1')).toContainText('Pro Content');

    await page.goto('/members-portal/enterprise');
    await expect(page.locator('h1')).toContainText('Enterprise Content');
  });
});
