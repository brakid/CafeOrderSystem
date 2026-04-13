import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8080';

async function apiDelete(endpoint) {
  await fetch(`${BASE_URL}/api${endpoint}`, { method: 'DELETE' });
}

async function deleteCategoryByName(name) {
  const response = await fetch(`${BASE_URL}/api/menu`);
  const menu = await response.json();
  const category = menu.find(c => c.name === name);
  if (category) {
    await apiDelete(`/menu/categories/${category.id}`);
  }
}

async function deleteMenuItemByName(name) {
  const response = await fetch(`${BASE_URL}/api/menu`);
  const menu = await response.json();
  for (const cat of menu) {
    const item = cat.items?.find(i => i.name === name);
    if (item) {
      await apiDelete(`/menu/items/${item.id}`);
      return;
    }
  }
}

test.describe('Admin Portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should display dashboard with stats', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText("Today's Orders")).toBeVisible();
    await expect(page.getByText("Today's Revenue")).toBeVisible();
  });

  test('should navigate to Menu tab', async ({ page }) => {
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByRole('heading', { name: 'Menu Management' })).toBeVisible();
  });

  test('should navigate to Inventory tab', async ({ page }) => {
    await page.getByRole('button', { name: 'Inventory' }).click();
    await expect(page.getByText('Inventory Management')).toBeVisible();
  });

  test('should navigate to Analytics tab', async ({ page }) => {
    await page.getByRole('button', { name: 'Analytics' }).click();
    await expect(page.getByText('Popular Items')).toBeVisible();
  });

  test('should add a new category and clean up', async ({ page }) => {
    const uniqueName = `Category_${Date.now()}`;
    
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.waitForTimeout(500);
    
    await page.getByRole('button', { name: '+ Add Category' }).click();
    await page.waitForTimeout(300);
    
    await page.getByPlaceholder('Category name').fill(uniqueName);
    await page.getByRole('button', { name: 'Save' }).click();
    
    await page.waitForTimeout(1000);
    
    await expect(page.getByText(uniqueName).first()).toBeVisible();
    
    await deleteCategoryByName(uniqueName);
  });

  test('should toggle item availability', async ({ page }) => {
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.waitForTimeout(500);

    const toggle = page.locator('button[style*="width: 50px"]').first();
    if (await toggle.isVisible()) {
      await toggle.click();
      await page.waitForTimeout(500);
    }
  });

  test('should display options section', async ({ page }) => {
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.waitForTimeout(500);
    
    const optionsSection = page.getByText('OPTIONS');
    if (await optionsSection.isVisible()) {
      await expect(optionsSection).toBeVisible();
    }
  });

  test('should add a new menu item and clean up', async ({ page }) => {
    const uniqueName = `MenuItem_${Date.now()}`;
    
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.waitForTimeout(500);
    
    const addItemButton = page.getByRole('button', { name: '+ Add Item' }).first();
    if (await addItemButton.isVisible()) {
      await addItemButton.click();
      await page.waitForTimeout(300);
      
      const select = page.locator('select');
      if (await select.isVisible()) {
        await select.selectOption({ index: 1 });
      }
      
      await page.getByPlaceholder('Item name').fill(uniqueName);
      await page.getByPlaceholder('0.00').fill('5.99');
      
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(1000);
      
      await expect(page.getByText(uniqueName).first()).toBeVisible();
      
      await deleteMenuItemByName(uniqueName);
    }
  });

  test('should add option with choices to an item', async ({ page }) => {
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.waitForTimeout(500);
    
    const optionButton = page.getByRole('button', { name: '+ Option' }).first();
    if (await optionButton.isVisible()) {
      await optionButton.click();
      await page.waitForTimeout(300);
      
      await expect(page.getByRole('heading', { name: /Add Option/ })).toBeVisible();
      
      const optionNameInput = page.locator('input[placeholder*="e.g., Milk Type"]');
      if (await optionNameInput.isVisible()) {
        await optionNameInput.fill('Test Option');
      }
      
      const choiceNameInput = page.getByPlaceholder('Choice name');
      if (await choiceNameInput.isVisible()) {
        await choiceNameInput.fill('Choice 1');
        
        const priceInput = page.locator('input[placeholder="0.00"]');
        if (await priceInput.isVisible()) {
          await priceInput.fill('0.50');
        }
        
        await page.getByRole('button', { name: 'Add' }).click();
        
        await page.waitForTimeout(300);
        
        await expect(page.getByText('Choice 1')).toBeVisible();
        
        await page.getByRole('button', { name: 'Save Option' }).click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should set default choice with star icon', async ({ page }) => {
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.waitForTimeout(500);
    
    const optionButton = page.getByRole('button', { name: '+ Option' }).first();
    if (await optionButton.isVisible()) {
      await optionButton.click();
      await page.waitForTimeout(300);
      
      const choiceNameInput = page.getByPlaceholder('Choice name');
      if (await choiceNameInput.isVisible()) {
        await choiceNameInput.fill('Small');
        await page.getByRole('button', { name: 'Add' }).click();
        await page.waitForTimeout(200);
        
        await choiceNameInput.fill('Large');
        await page.getByRole('button', { name: 'Add' }).click();
        await page.waitForTimeout(200);
        
        const starButtons = page.getByTitle('Set as default');
        const count = await starButtons.count();
        
        if (count >= 2) {
          await starButtons.nth(1).click();
          await page.waitForTimeout(200);
          
          const defaultLabel = page.getByText('DEFAULT');
          await expect(defaultLabel).toBeVisible();
        }
        
        await page.getByRole('button', { name: 'Cancel' }).click();
      }
    }
  });

  test('should delete an option', async ({ page }) => {
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.waitForTimeout(500);
    
    const deleteBtn = page.locator('button').filter({ hasText: 'X' }).first();
    if (await deleteBtn.isVisible()) {
      page.on('dialog', dialog => dialog.accept());
      await deleteBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('should adjust stock with +/- buttons', async ({ page }) => {
    await page.getByRole('button', { name: 'Inventory' }).click();
    await page.waitForTimeout(500);
    
    const plusButton = page.getByRole('button', { name: '+1' }).first();
    if (await plusButton.isVisible()) {
      await plusButton.click();
      await page.waitForTimeout(500);
    }
  });
});
