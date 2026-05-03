import { test, expect } from '@playwright/test';
import { uniqueEmail, registerUser, loginUser, getUserId, deleteTestUser } from './helpers/test-user';
import { seedSubscription } from './helpers/seed-subscription';

test.describe('Navbar Badge — Tier Display', () => {
  let freeEmail: string;
  let starterEmail: string;
  let proEmail: string;

  test.beforeAll(async ({ browser }) => {
    freeEmail = uniqueEmail();
    starterEmail = uniqueEmail();
    proEmail = uniqueEmail();

    for (const email of [freeEmail, starterEmail, proEmail]) {
      const page = await browser.newPage();
      await registerUser(page, email);
      await page.close();
    }

    const starterId = await getUserId(starterEmail);
    const proId = await getUserId(proEmail);

    if (starterId) await seedSubscription(starterId, 'starter');
    if (proId) await seedSubscription(proId, 'pro');
  });

  test.afterAll(async () => {
    await deleteTestUser(freeEmail);
    await deleteTestUser(starterEmail);
    await deleteTestUser(proEmail);
  });

  test('free user badge shows "Free"', async ({ page }) => {
    await loginUser(page, freeEmail);
    // Navigate to a page that shows the navbar with badge
    await page.goto('/members-portal');
    await expect(page.getByText('Free').first()).toBeVisible();
  });

  test('starter user badge shows "Starter"', async ({ page }) => {
    await loginUser(page, starterEmail);
    await page.goto('/members-portal');
    await expect(page.getByText('Starter').first()).toBeVisible();
  });

  test('pro user badge shows "Pro"', async ({ page }) => {
    await loginUser(page, proEmail);
    await page.goto('/members-portal');
    await expect(page.getByText('Pro').first()).toBeVisible();
  });
});
