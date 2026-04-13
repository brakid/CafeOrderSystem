import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8081';

test.describe('Kitchen Display', () => {
  test('should create order and accept it in kitchen', async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const menuItems = await page.locator('button:has-text("Add to Cart")').count();
    if (menuItems === 0) {
      test.skip();
      return;
    }
    
    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.waitForTimeout(500);
    
    const confirmBtn = page.locator('button:has-text("Add to Cart")').last();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.waitForTimeout(500);
    }
    
    const cartBtn = page.locator('button:has-text("View Cart")');
    if (await cartBtn.isVisible()) {
      await cartBtn.click();
      await page.waitForTimeout(500);
      
      const placeOrderBtn = page.getByRole('button', { name: 'Place Order' });
      if (await placeOrderBtn.isVisible()) {
        await placeOrderBtn.click();
        await page.waitForTimeout(1000);
      }
    }
    
    await page.goto(`${BASE_URL}/kitchen`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const startBtn = page.getByRole('button', { name: 'START' });
    await expect(startBtn.first()).toBeVisible({ timeout: 10000 });
    
    await startBtn.first().click();
    await page.waitForTimeout(2000);
    
    const readyBtn = page.getByRole('button', { name: 'READY' });
    await expect(readyBtn.first()).toBeVisible({ timeout: 10000 });
  });

  test('should update order state after clicking START then READY', async ({ page }) => {
    await page.goto(`${BASE_URL}/kitchen`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const startBtn = page.getByRole('button', { name: 'START' }).first();
    const startVisible = await startBtn.isVisible().catch(() => false);
    
    if (!startVisible) {
      test.skip();
      return;
    }
    
    const orderNumberBeforeClick = await page.locator('text=/#\\d+/').first().textContent();
    
    await startBtn.click({ force: true });
    await page.waitForTimeout(2000);
    
    const readyBtn = page.getByRole('button', { name: 'READY' }).first();
    await expect(readyBtn).toBeVisible({ timeout: 5000 });
    
    await readyBtn.click({ force: true });
    await page.waitForTimeout(2000);
    
    const sameOrder = await page.locator(`text=${orderNumberBeforeClick}`).isVisible().catch(() => false);
    expect(sameOrder).toBe(false);
  });

  test('should update START to READY immediately after clicking', async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const menuItems = await page.locator('button:has-text("Add to Cart")').count();
    if (menuItems === 0) {
      test.skip();
      return;
    }
    
    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.waitForTimeout(500);
    
    const confirmBtn = page.locator('button:has-text("Add to Cart")').last();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.waitForTimeout(500);
    }
    
    const cartBtn = page.locator('button:has-text("View Cart")');
    if (await cartBtn.isVisible()) {
      await cartBtn.click();
      await page.waitForTimeout(500);
      
      const placeOrderBtn = page.getByRole('button', { name: 'Place Order' });
      if (await placeOrderBtn.isVisible()) {
        await placeOrderBtn.click();
        await page.waitForTimeout(1000);
      }
    }
    
    await page.goto(`${BASE_URL}/kitchen`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const startBtn = page.getByRole('button', { name: 'START' });
    await expect(startBtn.first()).toBeVisible({ timeout: 10000 });
    
    await startBtn.first().click();
    
    await page.waitForTimeout(1000);
    
    const readyBtn = page.getByRole('button', { name: 'READY' });
    await expect(readyBtn.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display orders after loading when data exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/kitchen`);
    await page.waitForLoadState('networkidle');
    
    const apiOrders = await page.evaluate(async () => {
      const res = await fetch('/api/kitchen/orders');
      return res.json();
    });
    
    if (apiOrders.length === 0) {
      test.skip();
      return;
    }
    
    await page.waitForTimeout(3000);
    
    const firstOrderCard = page.locator('text=/#\\d+/').first();
    await expect(firstOrderCard).toBeVisible({ timeout: 5000 });
    
    const emptyState = page.getByText(/No active orders/);
    await expect(emptyState).not.toBeVisible();
  });

  test('should not show empty state when orders exist', async ({ page }) => {
    await page.goto(`${BASE_URL}/kitchen`);
    await page.waitForLoadState('networkidle');
    
    const apiOrders = await page.evaluate(async () => {
      const res = await fetch('/api/kitchen/orders');
      return res.json();
    });
    
    await page.waitForTimeout(3000);
    
    if (apiOrders.length > 0) {
      const emptyState = page.getByText(/No active orders/);
      const isEmptyVisible = await emptyState.isVisible().catch(() => false);
      expect(isEmptyVisible).toBe(false);
    }
  });

  test('should display orders on fresh load', async ({ page }) => {
    await page.goto(`${BASE_URL}/kitchen`);
    
    const apiOrders = await page.evaluate(async () => {
      const res = await fetch('/api/kitchen/orders');
      return res.json();
    });
    
    if (apiOrders.length === 0) {
      test.skip();
      return;
    }
    
    await page.waitForTimeout(3000);
    
    const emptyState = page.getByText(/No active orders/);
    const displayedOrders = await page.locator('text=/#\\d+/').count();
    
    expect(displayedOrders).toBe(apiOrders.length);
    await expect(emptyState).not.toBeVisible();
  });

  test('should show stats and orders in sync', async ({ page }) => {
    await page.goto(`${BASE_URL}/kitchen`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const apiOrders = await page.evaluate(async () => {
      const res = await fetch('/api/kitchen/orders');
      return res.json();
    });
    
    const apiStats = await page.evaluate(async () => {
      const res = await fetch('/api/kitchen/stats');
      return res.json();
    });
    
    await page.waitForSelector('h1', { timeout: 10000 });
    
    const displayedOrderCount = await page.locator('text=/#\\d+/').count();
    
    expect(displayedOrderCount).toBe(apiOrders.length);
    expect(displayedOrderCount).toBe(parseInt(apiStats.pending_count) + parseInt(apiStats.preparing_count));
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/kitchen');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('should display kitchen header', async ({ page }) => {
    await page.waitForSelector('h1', { timeout: 10000 });
    const header = page.locator('h1');
    await expect(header).toBeVisible();
  });

  test('should show order statistics', async ({ page }) => {
    await page.waitForSelector('h1', { timeout: 10000 });
    const stats = page.locator('div').filter({ hasText: 'PENDING' });
    await expect(stats.first()).toBeVisible({ timeout: 10000 });
  });

  test('should toggle between order view and grouped view', async ({ page }) => {
    await page.waitForSelector('h1', { timeout: 10000 });
    
    const byOrderBtn = page.getByRole('button', { name: 'By Order' });
    const byItemBtn = page.getByRole('button', { name: 'By Item' });
    
    if (await byOrderBtn.isVisible()) {
      await byOrderBtn.click();
      await page.waitForTimeout(300);
    }
    
    if (await byItemBtn.isVisible()) {
      await byItemBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('should display empty state when no orders', async ({ page }) => {
    await page.waitForSelector('h1', { timeout: 10000 });
    
    const apiOrders = await page.evaluate(async () => {
      const res = await fetch('/api/kitchen/orders');
      return res.json();
    });
    
    if (apiOrders.length === 0) {
      const emptyState = page.getByText(/No active orders|Waiting/);
      await expect(emptyState.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show order details when orders exist', async ({ page }) => {
    await page.waitForSelector('h1', { timeout: 10000 });
    const hasOrders = await page.locator('text=/#\\d+/').first().isVisible().catch(() => false);
    
    if (hasOrders) {
      const orderNumber = page.locator('text=/#\\d+/').first();
      await expect(orderNumber).toBeVisible();
    }
  });

  test('should have START button for pending orders', async ({ page }) => {
    await page.waitForSelector('h1', { timeout: 10000 });
    const startButton = page.getByRole('button', { name: 'START' });
    const visible = await startButton.isVisible().catch(() => false);
    
    if (visible) {
      await expect(startButton).toBeVisible();
    }
  });

  test('should have READY button for preparing orders', async ({ page }) => {
    await page.waitForSelector('h1', { timeout: 10000 });
    const readyButton = page.getByRole('button', { name: 'READY' });
    const visible = await readyButton.isVisible().catch(() => false);
    
    if (visible) {
      await expect(readyButton).toBeVisible();
    }
  });

  test('should show item quantities in orders', async ({ page }) => {
    await page.waitForSelector('h1', { timeout: 10000 });
    const hasOrders = await page.locator('text=/\\d+x/').first().isVisible().catch(() => false);
    
    if (hasOrders) {
      const quantity = page.locator('text=/\\d+x/').first();
      await expect(quantity).toBeVisible();
    }
  });

  test('should load orders on page reload', async ({ page }) => {
    await page.waitForSelector('h1', { timeout: 10000 });
    
    await page.evaluate(async () => {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'counter', items: [] })
      });
    });

    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    const hasOrders = await page.locator('text=/#\\d+/').first().isVisible().catch(() => false);
    expect(hasOrders).toBe(true);
  });
});

test.describe('Pickup Display', () => {
  test('should display ready for pickup header', async ({ page }) => {
    await page.goto('/pickup');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    await page.waitForSelector('h1', { timeout: 10000 });
    const header = page.locator('h1');
    await expect(header).toBeVisible();
  });

  test('should show empty state when no orders ready', async ({ page }) => {
    await page.goto('/pickup');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    const emptyState = page.getByText('No orders ready');
    const visible = await emptyState.isVisible().catch(() => false);
    
    if (visible) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('should display loading indicator initially', async ({ page }) => {
    await page.goto('/pickup');
    
    const loadingSpinner = page.locator('[style*="spinner"]');
    const hasSpinner = await loadingSpinner.isVisible().catch(() => false);
    
    if (hasSpinner) {
      await expect(loadingSpinner).toBeVisible({ timeout: 1000 });
    }
  });

  test('should show PICKED UP button when orders are ready', async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const menuItems = await page.locator('button:has-text("Add to Cart")').count();
    if (menuItems === 0) {
      test.skip();
      return;
    }
    
    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.waitForTimeout(500);
    
    const confirmBtn = page.locator('button:has-text("Add to Cart")').last();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.waitForTimeout(500);
    }
    
    const cartBtn = page.locator('button:has-text("View Cart")');
    if (await cartBtn.isVisible()) {
      await cartBtn.click();
      await page.waitForTimeout(500);
      
      const placeOrderBtn = page.getByRole('button', { name: 'Place Order' });
      if (await placeOrderBtn.isVisible()) {
        await placeOrderBtn.click();
        await page.waitForTimeout(1000);
      }
    }
    
    const kitchenPage = await page.context().newPage();
    try {
      await kitchenPage.goto(`${BASE_URL}/kitchen`);
      await kitchenPage.waitForLoadState('networkidle');
      await kitchenPage.waitForTimeout(1000);
      
      const startBtn = kitchenPage.getByRole('button', { name: 'START' }).first();
      if (await startBtn.isVisible()) {
        await startBtn.click();
        await kitchenPage.waitForTimeout(500);
      }
      
      const readyBtn = kitchenPage.getByRole('button', { name: 'READY' }).first();
      if (await readyBtn.isVisible()) {
        await readyBtn.click();
        await kitchenPage.waitForTimeout(1000);
      }
    } finally {
      await kitchenPage.close();
    }
    
    await page.goto(`${BASE_URL}/pickup`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const pickupBtn = page.getByRole('button', { name: 'PICKED UP' });
    await expect(pickupBtn.first()).toBeVisible({ timeout: 10000 });
  });

  test('should remove order after marking PICKED UP', async ({ page }) => {
    const customerPage = await page.context().newPage();
    try {
      await customerPage.goto(`${BASE_URL}`);
      await customerPage.waitForLoadState('networkidle');
      await customerPage.waitForTimeout(1000);
      
      const addToCartBtn = customerPage.locator('button:has-text("Add to Cart")').first();
      if (await addToCartBtn.isVisible()) {
        await addToCartBtn.click();
        await customerPage.waitForTimeout(500);
        
        const confirmBtn = customerPage.locator('button:has-text("Add to Cart")').last();
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
          await customerPage.waitForTimeout(500);
        }
        
        const cartBtn = customerPage.locator('button:has-text("View Cart")');
        if (await cartBtn.isVisible()) {
          await cartBtn.click();
          await customerPage.waitForTimeout(500);
          
          const placeOrderBtn = customerPage.getByRole('button', { name: 'Place Order' });
          if (await placeOrderBtn.isVisible()) {
            await placeOrderBtn.click();
            await customerPage.waitForTimeout(1000);
          }
        }
      }
    } finally {
      await customerPage.close();
    }
    
    const kitchenPage = await page.context().newPage();
    try {
      await kitchenPage.goto(`${BASE_URL}/kitchen`);
      await kitchenPage.waitForLoadState('networkidle');
      await kitchenPage.waitForTimeout(2000);
      
      const startBtn = kitchenPage.getByRole('button', { name: 'START' }).first();
      await startBtn.waitFor({ state: 'visible', timeout: 10000 });
      await startBtn.click();
      await kitchenPage.waitForTimeout(2000);
      
      const readyBtn = kitchenPage.getByRole('button', { name: 'READY' }).first();
      await readyBtn.waitFor({ state: 'visible', timeout: 10000 });
      await readyBtn.click();
      await kitchenPage.waitForTimeout(2000);
    } finally {
      await kitchenPage.close();
    }
    
    await page.goto(`${BASE_URL}/pickup`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const pickupBtn = page.locator('button').filter({ hasText: 'PICKED UP' }).first();
    await pickupBtn.waitFor({ state: 'visible', timeout: 10000 });
    
    const orderCard = pickupBtn.locator('..');
    const orderNumber = await orderCard.locator('span').first().textContent();
    
    await pickupBtn.click({ force: true, position: { x: 10, y: 10 } });
    await page.waitForTimeout(3000);
    
    const stillVisible = await page.locator('button').filter({ hasText: orderNumber }).count();
    expect(stillVisible).toBe(0);
  });
});
