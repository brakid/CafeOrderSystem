import { test, expect } from '@playwright/test';

export const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8080';

export async function waitForApp(page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
}

export async function waitForSocketConnection(page) {
  await page.waitForTimeout(1000);
}

export async function getOrderNumber(page) {
  const orderNumberElement = await page.locator('text=/#\\d+/').first();
  const text = await orderNumberElement.textContent();
  const match = text?.match(/#(\\d+)/);
  return match ? parseInt(match[1]) : null;
}

export async function createTestMenuItem(page) {
  await page.goto(`${BASE_URL}/admin`);
  await page.click('text=Menu');
  
  const categoryExists = await page.locator('text=Coffee').first().isVisible().catch(() => false);
  
  if (!categoryExists) {
    await page.click('text=+ Add Category');
    await page.fill('input[placeholder="Category name"]', 'Test Category');
    await page.click('button:has-text("Save"):not(:has-text("Option"))');
    await page.waitForTimeout(500);
  }
}
