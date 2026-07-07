import { test, expect } from '@playwright/test';

test('redirects unauthenticated user to login', async ({ page }) => {
  await page.goto('/chat');
  await expect(page).toHaveURL(/\/login/);
});
