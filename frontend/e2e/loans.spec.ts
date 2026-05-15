import { test, expect } from '@playwright/test';

test.describe('Loans Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@biblioteca.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|books/, { timeout: 5000 });
  });

  test('should display loans page', async ({ page }) => {
    await page.goto('/loans');
    await expect(page.locator('text=Préstamos')).toBeVisible({ timeout: 5000 });
  });
});
