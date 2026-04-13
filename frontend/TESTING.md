# Testing Strategy

## Overview

End-to-end (E2E) testing using Playwright to validate the complete ordering workflow across all frontend views.

## Test Coverage

### Admin Portal (12 tests)
- Dashboard statistics display
- Navigation between tabs (Menu, Inventory, Analytics)
- Category CRUD operations
- Menu item CRUD operations  
- Option management (add, set default, delete)
- Stock adjustment with +/- buttons
- Item availability toggle

### Kitchen Display (16 tests)
- Header and statistics display
- Toggle between order view and grouped view
- Empty state handling
- Loading state display
- Order display with details
- START button for pending orders
- READY button for preparing orders
- Item quantity display
- Orders persist on page reload
- Create order and accept in kitchen (e2e flow)
- Display orders after loading
- Stats and orders in sync
- Fresh load display
- State updates after START/READY clicks
- Click-to-refresh functionality

### Pickup Display (4 tests)
- Header display
- Empty state when no orders ready
- Loading state display
- PICKED UP button functionality

### Customer Order Flow (8 tests)
- Menu category display and navigation
- Menu item display with prices
- Item modal interaction
- Option selection
- Default option pre-selection
- Add to cart functionality
- Stock count display
- Order placement and waiting message

## Running Tests

### Prerequisites
```bash
# Ensure backend is running
cd backend && npm start

# Ensure frontend is running  
cd frontend && npm start
```

### Run All Tests
```bash
cd frontend
TEST_BASE_URL=http://localhost:8081 npx playwright test
```

### Run Specific Test File
```bash
TEST_BASE_URL=http://localhost:8081 npx playwright test tests/admin.spec.js
```

### Run with UI
```bash
TEST_BASE_URL=http://localhost:8081 npx playwright test --ui
```

## Test Structure

```
frontend/tests/
├── admin.spec.js      # Admin portal tests
├── customer.spec.js   # Customer ordering tests
├── kitchen.spec.js    # Kitchen and pickup display tests
└── helpers.js         # Shared test utilities
```

## Test Helpers

Located in `frontend/tests/helpers.js`:

### `createTestCategory(page)`
Creates a unique category for test isolation.

### `createTestMenuItem(page)`
Creates a unique menu item for test isolation.

### `cleanupTestData(page)`
Removes test-created data to prevent database bloat.

## Patterns and Best Practices

### Selector Best Practices

1. **Avoid `.first()` for modal buttons** - After opening a modal, both the menu card and modal may have the same button text. Use `.last()` for modal confirm buttons since modals render last in DOM.

2. **Use specific selectors** - Prefer `filter({ hasText: 'Exact Text' })` over generic locators.

3. **Wait for elements** - Use `waitForSelector` or Playwright's auto-waiting instead of arbitrary `waitForTimeout`.

### API URL Configuration

- Frontend uses relative URLs (`/api`) with Vite proxy configuration
- Vite proxy routes `/api/*` to `http://localhost:3000`
- Tests must use port 8081 (or whatever port the frontend runs on)

### Test Isolation

- Each test should clean up its data using `afterEach` hooks
- Use unique names/timestamps for test data to avoid conflicts
- Tests run in parallel by default; ensure no interdependencies

### State Management

- Don't rely on previous test state
- Navigate to the page fresh within each test
- Reset any global state (cart, orders) before tests

### Handling Async Operations

- Use `page.waitForTimeout()` sparingly - prefer visibility/location checks
- Allow generous timeouts for API calls (5000ms default)
- Polling interval: 1 second for kitchen/pickup, 2 seconds for customer order status

## Debugging Failed Tests

### View Error Context
Playwright saves detailed error context in `test-results/` directory:
```bash
cat test-results/*/error-context.md
```

### Debug Mode
Run a single test with debugging:
```bash
npx playwright test tests/admin.spec.js --debug
```

### Browser Console Logging
Enable console logging in tests:
```javascript
page.on('console', msg => console.log('BROWSER:', msg.text()));
```

### Test Replay
View recorded traces:
```bash
npx playwright show-trace trace.zip
```

## Database Considerations

### Reseed Before Full Test Runs
If tests leave orphaned data:
```bash
cd backend
npm run seed
```

### Test Data Accumulation
Tests that create orders may fill the database. The seed script clears all orders before seeding.

## CI Integration

```yaml
# Example CI configuration
test:
  script:
    - cd backend && npm install && npm start &
    - cd frontend && npm install
    - npx playwright install
    - TEST_BASE_URL=http://localhost:8081 npx playwright test --reporter=junit > test-results.xml
```

## Bugs Discovered and Fixed

### 1. Kitchen/Pickup Orders Not Loading on Page Reload
- **Symptom**: Stats show pending orders but UI shows "No active orders"
- **Root Cause**: `useKitchen()` hook didn't call `fetchOrders()` on mount; API_BASE was hardcoded to localhost:3000
- **Fix**: Added `useEffect` in hook, changed API_BASE to relative URL, added Vite proxy config

### 2. PostgreSQL Type Error
- **Symptom**: `inconsistent types deduced for parameter $1` when querying orders
- **Root Cause**: `ANY($1)` clause needed explicit type casting for UUID/text array
- **Fix**: Added `::text[]` type cast in `getKitchenOrders()` query

### 3. Orders with No Items Excluded from Kitchen View
- **Symptom**: Stats show 20+ pending but only 4 orders display
- **Root Cause**: INNER JOIN excluded orders without items
- **Fix**: Changed to LEFT JOIN in `getKitchenOrders()` query

### 4. Customer Notification Not Working
- **Symptom**: Customer not notified when order is ready
- **Root Cause**: CustomerApp only listened for `menu_updated` events
- **Fix**: Added `order_updated` socket listener to track order status

### 5. Modal Button Selector Issue
- **Symptom**: Clicking "Add to Cart" in modal failed test
- **Root Cause**: `.first()` returned menu card button instead of modal button
- **Fix**: Changed to `.last()` since modal renders last in DOM

## Maintenance

### Adding New Tests

1. Follow the existing describe/test structure
2. Add cleanup in `afterEach` if creating persistent data
3. Use helpers from `helpers.js` when available
4. Update this document if adding new test categories

### Known Issues

1. **PostgreSQL DECIMAL handling**: Prices returned as strings; use `convertPrices()` helper in `useApi.js`.

2. **Loading states**: Display pages show loading spinner while fetching data, then empty state if no orders.

3. **Real-time updates**: Uses polling (1s for kitchen/pickup, 2s for customer order status) instead of WebSocket.
