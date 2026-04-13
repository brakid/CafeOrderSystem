# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: kitchen.spec.js >> Kitchen Display >> should update START to READY immediately after clicking
- Location: tests/kitchen.spec.js:80:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'START' }).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('button', { name: 'START' }).first()

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - heading "Kitchen Display" [level=1] [ref=e5]
    - generic [ref=e6]:
      - generic [ref=e7]:
        - generic [ref=e8]: "0"
        - generic [ref=e9]: PENDING
      - generic [ref=e10]:
        - generic [ref=e11]: "10"
        - generic [ref=e12]: PREPARING
      - generic [ref=e13]:
        - generic [ref=e14]: "2"
        - generic [ref=e15]: AVG MINS
  - generic [ref=e16]:
    - button "By Order" [ref=e17] [cursor=pointer]
    - button "By Item" [ref=e18] [cursor=pointer]
  - generic [ref=e19]:
    - generic [ref=e20]:
      - generic [ref=e21]:
        - generic [ref=e22]: "#137"
        - generic [ref=e23]:
          - generic [ref=e24]: WEB
          - generic [ref=e25]: 2m ago
      - generic [ref=e27]:
        - generic [ref=e28]: 1x
        - text: Café Latte
      - button "READY" [ref=e30] [cursor=pointer]
    - generic [ref=e31]:
      - generic [ref=e32]:
        - generic [ref=e33]: "#139"
        - generic [ref=e34]:
          - generic [ref=e35]: WEB
          - generic [ref=e36]: 2m ago
      - generic [ref=e38]:
        - generic [ref=e39]: 1x
        - text: Espresso
      - button "READY" [ref=e41] [cursor=pointer]
    - generic [ref=e42]:
      - generic [ref=e43]:
        - generic [ref=e44]: "#140"
        - generic [ref=e45]:
          - generic [ref=e46]: WEB
          - generic [ref=e47]: 2m ago
      - generic [ref=e49]:
        - generic [ref=e50]: 1x
        - text: Espresso
      - button "READY" [ref=e52] [cursor=pointer]
    - generic [ref=e53]:
      - generic [ref=e54]:
        - generic [ref=e55]: "#141"
        - generic [ref=e56]:
          - generic [ref=e57]: WEB
          - generic [ref=e58]: 2m ago
      - generic [ref=e60]:
        - generic [ref=e61]: 1x
        - text: Espresso
      - button "READY" [ref=e63] [cursor=pointer]
    - generic [ref=e64]:
      - generic [ref=e65]:
        - generic [ref=e66]: "#142"
        - generic [ref=e67]:
          - generic [ref=e68]: WEB
          - generic [ref=e69]: 1m ago
      - generic [ref=e71]:
        - generic [ref=e72]: 1x
        - text: Café Latte
      - button "READY" [ref=e74] [cursor=pointer]
    - generic [ref=e75]:
      - generic [ref=e76]:
        - generic [ref=e77]: "#144"
        - generic [ref=e78]:
          - generic [ref=e79]: WEB
          - generic [ref=e80]: 1m ago
      - generic [ref=e82]:
        - generic [ref=e83]: 1x
        - text: Espresso
      - button "READY" [ref=e85] [cursor=pointer]
    - generic [ref=e86]:
      - generic [ref=e87]:
        - generic [ref=e88]: "#145"
        - generic [ref=e89]:
          - generic [ref=e90]: WEB
          - generic [ref=e91]: 1m ago
      - generic [ref=e93]:
        - generic [ref=e94]: 1x
        - text: Espresso
      - button "READY" [ref=e96] [cursor=pointer]
    - generic [ref=e97]:
      - generic [ref=e98]:
        - generic [ref=e99]: "#146"
        - generic [ref=e100]:
          - generic [ref=e101]: WEB
          - generic [ref=e102]: 1m ago
      - generic [ref=e104]:
        - generic [ref=e105]: 1x
        - text: Espresso
      - button "READY" [ref=e107] [cursor=pointer]
    - generic [ref=e108]:
      - generic [ref=e109]:
        - generic [ref=e110]: "#147"
        - generic [ref=e111]:
          - generic [ref=e112]: WEB
          - generic [ref=e113]: 0m ago
      - generic [ref=e115]:
        - generic [ref=e116]: 1x
        - text: Café Latte
      - button "READY" [ref=e118] [cursor=pointer]
    - generic [ref=e119]:
      - generic [ref=e120]:
        - generic [ref=e121]: "#149"
        - generic [ref=e122]:
          - generic [ref=e123]: WEB
          - generic [ref=e124]: 0m ago
      - generic [ref=e126]:
        - generic [ref=e127]: 1x
        - text: Espresso
      - button "READY" [ref=e129] [cursor=pointer]
```

# Test source

```ts
  17  |     await page.locator('button:has-text("Add to Cart")').first().click();
  18  |     await page.waitForTimeout(500);
  19  |     
  20  |     const confirmBtn = page.locator('button:has-text("Add to Cart")').last();
  21  |     if (await confirmBtn.isVisible()) {
  22  |       await confirmBtn.click();
  23  |       await page.waitForTimeout(500);
  24  |     }
  25  |     
  26  |     const cartBtn = page.locator('button:has-text("View Cart")');
  27  |     if (await cartBtn.isVisible()) {
  28  |       await cartBtn.click();
  29  |       await page.waitForTimeout(500);
  30  |       
  31  |       const placeOrderBtn = page.getByRole('button', { name: 'Place Order' });
  32  |       if (await placeOrderBtn.isVisible()) {
  33  |         await placeOrderBtn.click();
  34  |         await page.waitForTimeout(1000);
  35  |       }
  36  |     }
  37  |     
  38  |     await page.goto(`${BASE_URL}/kitchen`);
  39  |     await page.waitForLoadState('networkidle');
  40  |     await page.waitForTimeout(3000);
  41  |     
  42  |     const startBtn = page.getByRole('button', { name: 'START' });
  43  |     await expect(startBtn.first()).toBeVisible({ timeout: 10000 });
  44  |     
  45  |     await startBtn.first().click();
  46  |     await page.waitForTimeout(2000);
  47  |     
  48  |     const readyBtn = page.getByRole('button', { name: 'READY' });
  49  |     await expect(readyBtn.first()).toBeVisible({ timeout: 10000 });
  50  |   });
  51  | 
  52  |   test('should update order state after clicking START then READY', async ({ page }) => {
  53  |     await page.goto(`${BASE_URL}/kitchen`);
  54  |     await page.waitForLoadState('networkidle');
  55  |     await page.waitForTimeout(2000);
  56  |     
  57  |     const startBtn = page.getByRole('button', { name: 'START' }).first();
  58  |     const startVisible = await startBtn.isVisible().catch(() => false);
  59  |     
  60  |     if (!startVisible) {
  61  |       test.skip();
  62  |       return;
  63  |     }
  64  |     
  65  |     const orderNumberBeforeClick = await page.locator('text=/#\\d+/').first().textContent();
  66  |     
  67  |     await startBtn.click({ force: true });
  68  |     await page.waitForTimeout(2000);
  69  |     
  70  |     const readyBtn = page.getByRole('button', { name: 'READY' }).first();
  71  |     await expect(readyBtn).toBeVisible({ timeout: 5000 });
  72  |     
  73  |     await readyBtn.click({ force: true });
  74  |     await page.waitForTimeout(2000);
  75  |     
  76  |     const sameOrder = await page.locator(`text=${orderNumberBeforeClick}`).isVisible().catch(() => false);
  77  |     expect(sameOrder).toBe(false);
  78  |   });
  79  | 
  80  |   test('should update START to READY immediately after clicking', async ({ page }) => {
  81  |     await page.goto(`${BASE_URL}`);
  82  |     await page.waitForLoadState('networkidle');
  83  |     await page.waitForTimeout(1000);
  84  |     
  85  |     const menuItems = await page.locator('button:has-text("Add to Cart")').count();
  86  |     if (menuItems === 0) {
  87  |       test.skip();
  88  |       return;
  89  |     }
  90  |     
  91  |     await page.locator('button:has-text("Add to Cart")').first().click();
  92  |     await page.waitForTimeout(500);
  93  |     
  94  |     const confirmBtn = page.locator('button:has-text("Add to Cart")').last();
  95  |     if (await confirmBtn.isVisible()) {
  96  |       await confirmBtn.click();
  97  |       await page.waitForTimeout(500);
  98  |     }
  99  |     
  100 |     const cartBtn = page.locator('button:has-text("View Cart")');
  101 |     if (await cartBtn.isVisible()) {
  102 |       await cartBtn.click();
  103 |       await page.waitForTimeout(500);
  104 |       
  105 |       const placeOrderBtn = page.getByRole('button', { name: 'Place Order' });
  106 |       if (await placeOrderBtn.isVisible()) {
  107 |         await placeOrderBtn.click();
  108 |         await page.waitForTimeout(1000);
  109 |       }
  110 |     }
  111 |     
  112 |     await page.goto(`${BASE_URL}/kitchen`);
  113 |     await page.waitForLoadState('networkidle');
  114 |     await page.waitForTimeout(2000);
  115 |     
  116 |     const startBtn = page.getByRole('button', { name: 'START' });
> 117 |     await expect(startBtn.first()).toBeVisible({ timeout: 10000 });
      |                                    ^ Error: expect(locator).toBeVisible() failed
  118 |     
  119 |     await startBtn.first().click();
  120 |     
  121 |     await page.waitForTimeout(1000);
  122 |     
  123 |     const readyBtn = page.getByRole('button', { name: 'READY' });
  124 |     await expect(readyBtn.first()).toBeVisible({ timeout: 5000 });
  125 |   });
  126 | 
  127 |   test('should display orders after loading when data exists', async ({ page }) => {
  128 |     await page.goto(`${BASE_URL}/kitchen`);
  129 |     await page.waitForLoadState('networkidle');
  130 |     
  131 |     const apiOrders = await page.evaluate(async () => {
  132 |       const res = await fetch('/api/kitchen/orders');
  133 |       return res.json();
  134 |     });
  135 |     
  136 |     if (apiOrders.length === 0) {
  137 |       test.skip();
  138 |       return;
  139 |     }
  140 |     
  141 |     await page.waitForTimeout(3000);
  142 |     
  143 |     const firstOrderCard = page.locator('text=/#\\d+/').first();
  144 |     await expect(firstOrderCard).toBeVisible({ timeout: 5000 });
  145 |     
  146 |     const emptyState = page.getByText(/No active orders/);
  147 |     await expect(emptyState).not.toBeVisible();
  148 |   });
  149 | 
  150 |   test('should not show empty state when orders exist', async ({ page }) => {
  151 |     await page.goto(`${BASE_URL}/kitchen`);
  152 |     await page.waitForLoadState('networkidle');
  153 |     
  154 |     const apiOrders = await page.evaluate(async () => {
  155 |       const res = await fetch('/api/kitchen/orders');
  156 |       return res.json();
  157 |     });
  158 |     
  159 |     await page.waitForTimeout(3000);
  160 |     
  161 |     if (apiOrders.length > 0) {
  162 |       const emptyState = page.getByText(/No active orders/);
  163 |       const isEmptyVisible = await emptyState.isVisible().catch(() => false);
  164 |       expect(isEmptyVisible).toBe(false);
  165 |     }
  166 |   });
  167 | 
  168 |   test('should display orders on fresh load', async ({ page }) => {
  169 |     await page.goto(`${BASE_URL}/kitchen`);
  170 |     
  171 |     const apiOrders = await page.evaluate(async () => {
  172 |       const res = await fetch('/api/kitchen/orders');
  173 |       return res.json();
  174 |     });
  175 |     
  176 |     if (apiOrders.length === 0) {
  177 |       test.skip();
  178 |       return;
  179 |     }
  180 |     
  181 |     await page.waitForTimeout(3000);
  182 |     
  183 |     const emptyState = page.getByText(/No active orders/);
  184 |     const displayedOrders = await page.locator('text=/#\\d+/').count();
  185 |     
  186 |     expect(displayedOrders).toBe(apiOrders.length);
  187 |     await expect(emptyState).not.toBeVisible();
  188 |   });
  189 | 
  190 |   test('should show stats and orders in sync', async ({ page }) => {
  191 |     await page.goto(`${BASE_URL}/kitchen`);
  192 |     await page.waitForLoadState('networkidle');
  193 |     await page.waitForTimeout(2000);
  194 |     
  195 |     const apiOrders = await page.evaluate(async () => {
  196 |       const res = await fetch('/api/kitchen/orders');
  197 |       return res.json();
  198 |     });
  199 |     
  200 |     const apiStats = await page.evaluate(async () => {
  201 |       const res = await fetch('/api/kitchen/stats');
  202 |       return res.json();
  203 |     });
  204 |     
  205 |     await page.waitForSelector('h1', { timeout: 10000 });
  206 |     
  207 |     const displayedOrderCount = await page.locator('text=/#\\d+/').count();
  208 |     
  209 |     expect(displayedOrderCount).toBe(apiOrders.length);
  210 |     expect(displayedOrderCount).toBe(parseInt(apiStats.pending_count) + parseInt(apiStats.preparing_count));
  211 |   });
  212 | 
  213 |   test.beforeEach(async ({ page }) => {
  214 |     await page.goto('/kitchen');
  215 |     await page.waitForLoadState('domcontentloaded');
  216 |     await page.waitForTimeout(2000);
  217 |   });
```