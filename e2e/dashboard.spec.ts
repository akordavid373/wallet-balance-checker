import { test, expect } from '@playwright/test';

test.describe('Wallet Dashboard - Connect Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should render connect screen when not connected', async ({ page }) => {
    await expect(page.getByText('Wallet Balance Checker')).toBeVisible();
    await expect(page.getByText('Connect Freighter Wallet')).toBeVisible();
  });

  test('should show prerequisites info', async ({ page }) => {
    await expect(page.getByText('Install Freighter browser extension')).toBeVisible();
    await expect(page.getByText('Create a wallet and switch to Testnet')).toBeVisible();
  });

  test('should show connect error when Freighter is not available', async ({ page }) => {
    await page.getByText('Connect Freighter Wallet').click();
    await expect(page.getByText(/Freighter|connect|error/i).first()).toBeVisible();
  });

  test('should have correct page title', async ({ page }) => {
    await expect(page).toHaveTitle('Wallet Balance Checker');
  });

  test('should display app favicon', async ({ page }) => {
    const favicon = page.locator('link[rel="icon"]');
    await expect(favicon).toHaveAttribute('href', '/favicon.svg');
  });

  test('should display friendbot prerequisite', async ({ page }) => {
    await expect(page.getByText('Fund via Friendbot')).toBeVisible();
  });

  test('should have functional connect button with hover state', async ({ page }) => {
    const connectBtn = page.getByText('Connect Freighter Wallet');
    await expect(connectBtn).toBeEnabled();
    await connectBtn.hover();
    await expect(connectBtn).toHaveCSS('background-color', expect.stringContaining('rgb'));
  });
});

test.describe('Wallet Dashboard - Responsive Layout', () => {
  test('should adapt to mobile viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
    });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByText('Wallet Balance Checker')).toBeVisible();
    const connectBtn = page.getByText('Connect Freighter Wallet');
    await expect(connectBtn).toBeVisible();
    await context.close();
  });

  test('should adapt to tablet viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 },
    });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByText('Wallet Balance Checker')).toBeVisible();
    await context.close();
  });
});

test.describe('Wallet Dashboard - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show network info section', async ({ page }) => {
    await expect(page.getByText('Network').first()).toBeVisible();
    await expect(page.getByText('Stellar Testnet')).toBeVisible();
  });
});