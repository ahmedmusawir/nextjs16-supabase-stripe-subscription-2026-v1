import { type Page } from '@playwright/test';
import { supabaseAdmin } from './supabase-admin';

export function uniqueEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@e2e.test`;
}

export async function registerUser(
  page: Page,
  email: string,
  password: string = 'TestPassword123!'
): Promise<void> {
  await page.goto('/auth');
  await page.getByRole('tab', { name: 'Register' }).click();
  await page.locator('input[name="name"]').fill('E2E Test User');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="passwordConfirm"]').fill(password);
  await page.getByRole('button', { name: 'Signup' }).click();
  await page.waitForURL('**/members-portal', { timeout: 15000 });
}

export async function loginUser(
  page: Page,
  email: string,
  password: string = 'TestPassword123!'
): Promise<void> {
  await page.goto('/auth');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/members-portal', { timeout: 15000 });
}

export async function getUserId(email: string): Promise<string | null> {
  const { data } = await supabaseAdmin.auth.admin.listUsers();
  const user = data?.users?.find((u) => u.email === email);
  return user?.id ?? null;
}

export async function deleteTestUser(email: string): Promise<void> {
  const userId = await getUserId(email);
  if (!userId) return;

  // Delete subscription first (FK constraint)
  await supabaseAdmin.from('subscriptions').delete().eq('user_id', userId);
  // Delete user role
  await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
  // Delete auth user
  await supabaseAdmin.auth.admin.deleteUser(userId);
}
