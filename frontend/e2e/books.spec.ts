import { test, expect } from '@playwright/test';

test.describe('Books Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@biblioteca.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|books/, { timeout: 5000 });
  });

  test('should display book list', async ({ page }) => {
    await page.goto('/books');
    await expect(page.locator('text=Catálogo')).toBeVisible({ timeout: 5000 });
  });

  test('should search books', async ({ page }) => {
    await page.goto('/books');
    const searchInput = page.locator('input[placeholder*="buscar" i], input[placeholder*="search" i]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Cien');
      await page.waitForTimeout(500);
    }
  });
});
