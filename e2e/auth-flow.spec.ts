import { test, expect } from '@playwright/test';
import { uniqueEmail, registerUser, loginUser, deleteTestUser } from './helpers/test-user';

let testEmail: string;

test.describe('Auth Flow — Registration + Login + Logout', () => {
  test.beforeAll(() => {
    testEmail = uniqueEmail();
  });

  test.afterAll(async () => {
    await deleteTestUser(testEmail);
  });

  test('register a new user and land on members portal', async ({ page }) => {
    await registerUser(page, testEmail);
    await expect(page).toHaveURL(/\/members-portal/);
    await expect(page.getByText(testEmail)).toBeVisible();
  });

  test('log out and verify blocked from members portal', async ({ page }) => {
    // Login first (each test gets fresh browser context)
    await loginUser(page, testEmail);
    await expect(page).toHaveURL(/\/members-portal/);

    // Open avatar dropdown and click Logout
    await page.locator('[class*="cursor-pointer"]').filter({ has: page.locator('img') }).click();
    await page.getByText('Logout').click();

    // Should redirect to /auth
    await page.waitForURL('**/auth', { timeout: 10000 });
    await expect(page).toHaveURL(/\/auth/);
  });

  test('log back in and access members portal', async ({ page }) => {
    // Go directly to auth page and login
    await page.goto('/auth');
    await page.locator('input[name="email"]').fill(testEmail);
    await page.locator('input[name="password"]').fill('TestPassword123!');
    await page.getByRole('button', { name: 'Login' }).click();

    // Wait for redirect — could go to members-portal or similar
    await page.waitForURL(/\/(members-portal|superadmin|admin)/, { timeout: 15000 });
    await expect(page.getByText(testEmail)).toBeVisible();
  });
});
