import { test, expect } from '@playwright/test';

test('shows validation errors on empty submit', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Log In' }).click();

  await expect(page.getByText('Email is required')).toBeVisible();
  await expect(page.getByText('Password is required')).toBeVisible();
});

test('shows error on invalid credentials', async ({ page }) => {
  await page.goto('/login');

  await page.getByPlaceholder('Email Address').fill('nonexistent@example.com');
  await page.getByPlaceholder('Password').fill('wrongpassword');
  await page.getByRole('button', { name: 'Log In' }).click();

  await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
});
