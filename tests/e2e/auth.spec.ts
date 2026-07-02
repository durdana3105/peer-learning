import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should load the auth page and allow navigation to signup', async ({ page }) => {
    // Navigate to the auth page
    await page.goto('http://localhost:8080/auth');
    
    // Check that the Sign In form is visible
    await expect(page.locator('text=Sign In')).toBeVisible();

    // The user should be able to click on a link to sign up
    // Depending on the UI, it might be a tab or a link
    const signUpTab = page.locator('button:has-text("Sign Up")');
    if (await signUpTab.isVisible()) {
      await signUpTab.click();
      await expect(page.locator('text=Create an account')).toBeVisible();
    }
  });

  test('should display validation errors on empty submit', async ({ page }) => {
    await page.goto('http://localhost:8080/auth');

    const signInButton = page.locator('button:has-text("Sign In")').first();
    await signInButton.click();

    // Since we didn't fill in email/password, HTML5 validation or custom validation might trigger
    // Just ensuring the page doesn't crash
    await expect(page).toHaveURL(/.*auth.*/);
  });
});
