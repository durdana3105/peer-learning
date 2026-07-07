import { test, expect } from '@playwright/test';

test('shows validation errors on empty submit', async ({ page }) => {
  await page.goto('/signup');
  await page.getByRole('button', { name: 'Sign Up' }).click();

  await expect(page.getByText('Name is required')).toBeVisible();
  await expect(page.getByText('Email is required')).toBeVisible();
  await expect(page.getByText('Password is required')).toBeVisible();
});

test('submits form and shows confirmation toast', async ({ page }) => {
  await page.goto('/signup');

  await page.getByPlaceholder('Full Name').fill('Test User');
  await page.getByPlaceholder('Email').fill(`test${Date.now()}@example.com`);
  await page.getByPlaceholder('Password', { exact: true }).fill('Test1234!');
  await page.getByPlaceholder('Confirm Password').fill('Test1234!');

  await page.getByRole('button', { name: 'Sign Up' }).click();

  await expect(page.getByText('Account created!')).toBeVisible({ timeout: 10000 });
});
