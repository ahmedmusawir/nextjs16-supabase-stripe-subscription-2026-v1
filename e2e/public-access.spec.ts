import { test, expect } from '@playwright/test';

test.describe('Public Access — Anonymous Browsing', () => {
  test('home page loads with hero', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('StarkReads');
    await expect(page.getByRole('link', { name: 'See Pricing' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse Articles' })).toBeVisible();
  });

  test('articles page shows at least 6 articles', async ({ page }) => {
    await page.goto('/articles');
    await expect(page.locator('h1')).toContainText('All Articles');
    const articleCards = page.locator('a[href^="/articles/"]');
    await expect(articleCards).toHaveCount(6);
  });

  test('free article shows full content without paywall', async ({ page }) => {
    await page.goto('/articles/why-rbac-and-subscriptions-are-different');
    await expect(page.locator('h1')).toContainText('Why RBAC and Subscriptions Are Different');
    // Free article should show full content
    await expect(page.getByText('orthogonal')).toBeVisible();
    // No paywall
    await expect(page.getByText('Sign up to read')).not.toBeVisible();
  });

  test('gated article shows preview + paywall CTA', async ({ page }) => {
    await page.goto('/articles/building-stripe-subscriptions-the-right-way');
    await expect(page.locator('h1')).toContainText('Building Stripe Subscriptions');
    // Preview visible
    await expect(page.getByText('Most Stripe subscription tutorials')).toBeVisible();
    // Paywall CTA for unauthenticated
    await expect(page.getByRole('link', { name: 'Sign up to read' })).toBeVisible();
  });

  test('pricing page shows 3 plan cards', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('h1')).toContainText('Choose Your Plan');
    await expect(page.getByText('$5')).toBeVisible();
    await expect(page.getByText('$15')).toBeVisible();
    await expect(page.getByText('$49')).toBeVisible();
    await expect(page.getByText('Recommended')).toBeVisible();
  });
});
