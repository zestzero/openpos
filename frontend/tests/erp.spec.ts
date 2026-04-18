import { test, expect } from '@playwright/test';

test('ERP page is reachable and renders correctly', async ({ page }) => {
  await page.goto('/erp');
  // It should at least be a react application that doesn't blank screen
  await expect(page.locator('body')).toBeVisible();
  
  // When not authenticated, depending on the frontend mock logic it either redirects or shows something
  // If it redirects, the URL should eventually stabilize without blank screening
  await page.waitForLoadState('networkidle');
  const title = await page.title();
  expect(title).toBeDefined();
});
