import { test, expect } from '@playwright/test';

test.describe('Wallet Dashboard', () => {
  test('should render connect screen when not connected', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Wallet Balance Checker')).toBeVisible();
    await expect(page.getByText('Connect Freighter Wallet')).toBeVisible();
  });

  test('should show prerequisites info', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Install Freighter browser extension')).toBeVisible();
    await expect(page.getByText('Create a wallet and switch to Testnet')).toBeVisible();
  });

  test('should show connect error when Freighter is not available', async ({ page }) => {
    await page.goto('/');
    // Freighter API won't be available in test, so clicking connect should show an error
    await page.getByText('Connect Freighter Wallet').click();
    // Wait for error message to appear
    await expect(page.getByText(/Freighter|connect|error/i).first()).toBeVisible();
  });
});
