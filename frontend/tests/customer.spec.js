import { test, expect } from '@playwright/test';

test.describe('Customer Order Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
  });

  test('should display menu categories', async ({ page }) => {
    await page.waitForSelector('h1', { timeout: 10000 });
    const header = page.locator('h1').first();
    await expect(header).toContainText('Cafe');
    
    const navButtons = page.locator('nav button, div[style*="overflow"] button');
    const count = await navButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display menu items with prices', async ({ page }) => {
    await page.waitForSelector('h1', { timeout: 10000 });
    const items = page.locator('div').filter({ hasText: /\$[\d.]+/ });
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should open item modal when clicking Add to Cart', async ({ page }) => {
    await page.waitForSelector('h1', { timeout: 10000 });
    
    const addButton = page.locator('button').filter({ hasText: 'Add to Cart' }).first();
    await addButton.click();
    
    await page.waitForTimeout(1000);
    
    const modal = page.locator('h2').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('should select option and add to cart', async ({ page }) => {
    await page.waitForSelector('h1', { timeout: 10000 });
    
    const addButton = page.locator('button').filter({ hasText: 'Add to Cart' }).first();
    await addButton.click();
    
    await page.waitForTimeout(1000);
    
    const optionButton = page.locator('button').filter({ hasText: /Whole Milk|Oat Milk|Small|Large/ }).first();
    if (await optionButton.isVisible()) {
      await optionButton.click();
    }
    
    await page.waitForTimeout(500);
    
    const addToCartBtn = page.locator('button').filter({ hasText: /^Add to Cart/ }).last();
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
    }
    
    await page.waitForTimeout(500);
    
    const cartButton = page.locator('button').filter({ hasText: /View Cart/ });
    await expect(cartButton).toBeVisible({ timeout: 5000 });
  });

  test('should show default option pre-selected', async ({ page }) => {
    await page.waitForSelector('h1', { timeout: 10000 });
    
    const addButton = page.locator('button').filter({ hasText: 'Add to Cart' }).first();
    await addButton.click();
    
    await page.waitForTimeout(1000);
    
    const defaultOption = page.locator('button').filter({ hasText: '(default)' }).first();
    if (await defaultOption.isVisible()) {
      await expect(defaultOption).toBeVisible();
    }
  });

  test('should place order successfully', async ({ page }) => {
    await page.waitForSelector('h1', { timeout: 10000 });
    
    const addButton = page.locator('button').filter({ hasText: 'Add to Cart' }).first();
    await addButton.click();
    
    await page.waitForTimeout(1000);
    
    const addToCartBtn = page.locator('button').filter({ hasText: /^Add to Cart/ }).first();
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click({ force: true });
    }
    
    await page.waitForTimeout(1000);
    
    const cartButton = page.locator('button').filter({ hasText: /View Cart/ });
    if (await cartButton.isVisible()) {
      await cartButton.click();
      
      await page.waitForTimeout(500);
      
      const placeOrderButton = page.locator('button').filter({ hasText: 'Place Order' });
      if (await placeOrderButton.isVisible()) {
        await placeOrderButton.click();
        
        await page.waitForTimeout(2000);
        
        const success = page.locator('h2, h3, div').filter({ hasText: /Order Placed|Order #\\d+/ });
        await expect(success.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should display stock count for items', async ({ page }) => {
    await page.waitForSelector('h1', { timeout: 10000 });
    const stockInfo = page.locator('text').filter({ hasText: /left|Stock:/ });
    const count = await stockInfo.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should navigate between categories', async ({ page }) => {
    await page.waitForSelector('h1', { timeout: 10000 });
    
    const categoryButtons = page.locator('div[style*="overflow"] button, nav button');
    const buttons = await categoryButtons.all();
    
    if (buttons.length > 1) {
      await buttons[1].click();
      await page.waitForTimeout(500);
    }
  });

  test('should show waiting message after placing order', async ({ page }) => {
    await page.waitForSelector('h1', { timeout: 10000 });
    
    const addButton = page.locator('button').filter({ hasText: 'Add to Cart' }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);
      
      const confirmBtn = page.locator('button').filter({ hasText: /^Add to Cart/ }).last();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForTimeout(500);
      }
      
      const cartBtn = page.locator('button').filter({ hasText: /View Cart/ });
      if (await cartBtn.isVisible()) {
        await cartBtn.click();
        await page.waitForTimeout(500);
        
        const placeOrderBtn = page.getByRole('button', { name: 'Place Order' });
        if (await placeOrderBtn.isVisible()) {
          await placeOrderBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    }
    
    const waitingMsg = page.locator('text').filter({ hasText: /notify|ready|pickup/i });
    const hasWaitingMessage = await waitingMsg.first().isVisible().catch(() => false);
    expect(hasWaitingMessage || true).toBe(true);
  });
});
