# Cafe Ordering System - Design Document

## 1. Overview

### 1.1 Purpose
A modular ordering system for small cafes, diners, and bars that enables:
- Customer self-ordering via webapp (phone)
- Staff-assisted counter ordering
- Real-time kitchen display with preparation optimization
- Stock management with automatic availability
- Analytics for business insights

### 1.2 Target Users
- **Customers**: Order via personal phone (webapp)
- **Counter Staff**: Enter orders for walk-in customers (especially elderly)
- **Kitchen Staff**: View and prepare orders
- **Store Owners/Admins**: Manage menu, view analytics

### 1.3 Constraints
- Webapp only accessible from internal network (security)
- Single store deployment (no multi-store SaaS in v1)
- Small to medium scale (10-50 concurrent orders)

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                          │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Customer App   │  Kitchen Display │     Admin Portal            │
│  (Mobile Web)   │  (Kitchen View)   │  (Menu, Analytics)          │
└────────┬────────┴────────┬────────┴──────────────┬──────────────┘
         │                 │                        │
         └─────────────────┼────────────────────────┘
                           │ HTTP + WebSocket
                           ▼
              ┌─────────────────────────┐
              │    Backend (Node.js)    │
              │    Modular Monolith     │
              │  ┌───────────────────┐  │
              │  │ Order Module      │  │
              │  │ Menu Module       │  │
              │  │ Inventory Module   │  │
              │  │ Kitchen Module     │  │
              │  │ Analytics Module   │  │
              │  └───────────────────┘  │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │      PostgreSQL         │
              └─────────────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Real-time | Socket.io (WebSocket) |
| Container | Docker + Docker Compose |
| Testing | Jest + Supertest |

### 2.3 Module Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── orders/           # Order domain
│   │   │   ├── entity.js
│   │   │   ├── service.js
│   │   │   ├── routes.js
│   │   │   └── __tests__/
│   │   ├── menu/             # Menu & categories
│   │   ├── inventory/        # Stock management
│   │   ├── kitchen/          # Kitchen display logic
│   │   └── analytics/        # Reporting
│   ├── shared/
│   │   ├── db.js             # Database connection
│   │   ├── socket.js         # WebSocket setup
│   │   └── middleware/
│   └── index.js
```

---

## 3. Data Model

### 3.1 Core Entities

#### Category
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(100) | Category name (e.g., "Coffee", "Pastries") |
| sort_order | INTEGER | Display order |
| is_active | BOOLEAN | Visibility toggle |
| created_at | TIMESTAMP | Creation time |

#### MenuItem
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| category_id | UUID | Foreign key to Category |
| name | VARCHAR(200) | Item name |
| description | TEXT | Item description |
| price | DECIMAL(10,2) | Base price |
| image_url | VARCHAR(500) | Product image |
| is_available | BOOLEAN | Manual availability override |
| stock_count | INTEGER | Current stock (NULL = unlimited) |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |

#### ItemOption
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| menu_item_id | UUID | Foreign key to MenuItem |
| name | VARCHAR(100) | Option name (e.g., "Milk Type") |
| is_required | BOOLEAN | Must select one |
| created_at | TIMESTAMP | Creation time |

#### ItemOptionChoice
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| option_id | UUID | Foreign key to ItemOption |
| name | VARCHAR(100) | Choice name (e.g., "Oat Milk") |
| price_modifier | DECIMAL(10,2) | Additional cost (can be negative) |

#### Order
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| order_number | INTEGER | Human-readable number (resets daily) |
| channel | ENUM | 'web' or 'counter' |
| status | ENUM | 'pending', 'preparing', 'ready', 'picked_up' |
| customer_name | VARCHAR(100) | Optional customer name |
| total_amount | DECIMAL(10,2) | Calculated total |
| created_at | TIMESTAMP | Order time |
| updated_at | TIMESTAMP | Last status change |
| picked_up_at | TIMESTAMP | Completion time |

#### OrderItem
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| order_id | UUID | Foreign key to Order |
| menu_item_id | UUID | Foreign key to MenuItem |
| quantity | INTEGER | Item count |
| unit_price | DECIMAL(10,2) | Price at time of order |
| special_instructions | TEXT | Customer notes |
| created_at | TIMESTAMP | Creation time |

#### OrderItemOption
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| order_item_id | UUID | Foreign key to OrderItem |
| option_id | UUID | Foreign key to ItemOption |
| choice_id | UUID | Foreign key to ItemOptionChoice |

### 3.2 Entity Relationships

```
Category 1───M MenuItem
MenuItem 1───M ItemOption
ItemOption 1───M ItemOptionChoice

Order 1───M OrderItem
OrderItem M───M ItemOptionChoice (through OrderItemOption)
```

---

## 4. Functionality Specification

### 4.1 Customer Web App

**Features:**
- Browse menu by category
- Add items to cart with options
- View real-time availability (stock counts)
- Place order with cart review
- Receive order number
- View pickup notification

**User Flow:**
1. Customer opens webapp (internal network only)
2. Browses categories and items
3. Selects item → chooses required/optional options
4. Adds to cart
5. Reviews cart → adjusts quantities
6. Submits order (payment assumed complete at POS if needed)
7. Receives order number
8. Sees "waiting" status
9. Receives notification when ready
10. Picks up order

**Availability Logic:**
- Items with stock_count = 0 → not orderable
- Items with stock_count > 0 → shows remaining count
- Items with stock_count = NULL → unlimited stock
- Kitchen can override with is_available = false

### 4.2 Counter Ordering (Staff)

**Features:**
- Same interface as customer app
- Order placed "on behalf" of customer
- Can handle walk-ins, elderly customers
- Order appears same in kitchen queue

**Difference from Customer App:**
- Channel marked as 'counter' instead of 'web'
- Optional customer name field

### 4.3 Kitchen Display

**Features:**
- Real-time order queue (WebSocket)
- FIFO order by default
- Two view modes:
  - **Order View**: Complete orders shown one at a time
  - **Item Grouped View**: All same items grouped (e.g., 3x Matcha Latte together)
- Mark order as "preparing"
- Mark order as "ready"
- Audio chime on new orders

**Order Card Display:**
```
┌─────────────────────────────┐
│ #023  │  WEB  │  2:34 ago  │
├─────────────────────────────┤
│ 1x Matcha Latte             │
│    - Oat Milk               │
│ 2x Croissant                │
│ 1x Espresso                 │
└─────────────────────────────┘
```

**Kitchen Actions:**
- **Start Preparing**: Moves from "pending" to "preparing"
- **Mark Ready**: Moves to "ready", triggers customer notification
- **View Toggle**: Switch between order/item grouped view

### 4.4 Pickup Display (Customer-Facing Screen)

**Features:**
- Shows all "ready" orders
- Large, readable order numbers
- Clears when order picked up
- Optional: Audio announcement

**Display:**
```
┌─────────────────────────────────────┐
│         READY FOR PICKUP            │
├─────────────────────────────────────┤
│                                     │
│              #021                   │
│              #018                   │
│              #015                   │
│                                     │
└─────────────────────────────────────┘
```

### 4.5 Admin Portal

**Menu Management:**
- Create/edit/delete categories
- Create/edit/delete menu items
- Set item options and choices
- Upload item images
- Toggle item availability
- Set stock counts manually

**Inventory Management:**
- View current stock levels
- Quick stock adjustments (+/-)
- Bulk stock update
- Low stock alerts

**Analytics Dashboard:**
- Orders per day/hour
- Popular items (by quantity sold)
- Revenue trends
- Average order value
- Peak hours identification

---

## 5. API Specification

### 5.1 REST Endpoints

#### Menu
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/menu | Get full menu with categories, items, options |
| POST | /api/menu/categories | Create category |
| PUT | /api/menu/categories/:id | Update category |
| DELETE | /api/menu/categories/:id | Delete category |
| POST | /api/menu/items | Create menu item |
| PUT | /api/menu/items/:id | Update menu item |
| DELETE | /api/menu/items/:id | Delete menu item |
| PATCH | /api/menu/items/:id/availability | Toggle availability |
| PATCH | /api/menu/items/:id/stock | Update stock count |

#### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/orders | Create new order |
| GET | /api/orders/:id | Get order details |
| GET | /api/orders/active | Get active orders (kitchen) |
| GET | /api/orders/ready | Get ready orders (pickup) |
| PATCH | /api/orders/:id/status | Update order status |
| PATCH | /api/orders/:id/pickup | Mark order picked up |

#### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/analytics/orders | Order statistics |
| GET | /api/analytics/items | Popular items |
| GET | /api/analytics/revenue | Revenue data |

### 5.2 WebSocket Events

#### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| join_kitchen | { station_id } | Join kitchen room |
| join_pickup | - | Join pickup display room |

#### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| order_new | Order object | New order placed |
| order_updated | { order_id, status } | Order status changed |
| menu_updated | - | Menu changed (re-fetch) |
| stock_updated | { item_id, count } | Stock level changed |

---

## 6. Order Lifecycle

```
┌──────────┐     ┌────────────┐     ┌────────┐     ┌──────────┐
│ PENDING  │────▶│ PREPARING  │────▶│ READY  │────▶│PICKED_UP │
└──────────┘     └────────────┘     └────────┘     └──────────┘
     │                  │               │
     │                  │               │
     ▼                  ▼               ▼
  Kitchen sees    Kitchen working   Customer notified
  new order       on order          for pickup
```

### State Transitions
1. **PENDING → PREPARING**: Kitchen staff starts working
2. **PREPARING → READY**: All items prepared, customer notified
3. **READY → PICKED_UP**: Customer collects order

### Stock Management
- Order creation: Atomic decrement of stock_count
- If stock = 0 after decrement: Item becomes unavailable
- Order cancel (future): Restore stock (if implemented)

---

## 7. Security

### 7.1 Network Restrictions
- Webapp accessible only on internal network
- Configured via environment variable: `ALLOWED_IP_RANGE`
- Default: `192.168.0.0/16` (configurable)

### 7.2 Authentication
- **Customer app**: No auth (internal network is security)
- **Kitchen/Admin**: PIN-based station login
- Stations: kitchen_1, kitchen_2, admin, counter

### 7.3 Input Validation
- All inputs sanitized
- Stock counts validated (non-negative integers)
- Prices validated (non-negative decimals)

---

## 8. Configuration

### 8.1 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/cafe

# Network Security
ALLOWED_IP_RANGE=192.168.0.0/16

# Server
PORT=3000
NODE_ENV=development

# WebSocket
WS_PING_INTERVAL=30000
```

### 8.2 Docker Configuration

Single `docker-compose.yml` for easy deployment:
- `backend` service (Node.js)
- `frontend` service (React + Nginx)
- `postgres` service
- `redis` service (optional, for caching)

---

## 9. Testing Strategy

### 9.1 Test Levels

| Level | Scope | Tools |
|-------|-------|-------|
| Unit | Individual functions/services | Jest |
| Integration | Module interactions | Jest + Supertest |
| E2E | Complete user journeys | Playwright |

### 9.2 Key Test Scenarios

**Order Creation Journey:**
1. Create order with valid items → Success
2. Create order with out-of-stock item → Error
3. Create order with unavailable item → Error
4. Stock correctly decremented after order

**Kitchen Workflow:**
1. New order appears in kitchen queue
2. Status transition: pending → preparing
3. Status transition: preparing → ready
4. Ready orders appear on pickup display

**Menu Management:**
1. CRUD operations on categories/items
2. Availability toggle affects ordering
3. Stock depletion blocks ordering

### 9.3 Test Coverage Goals
- Core business logic: 80%+
- API endpoints: 100%
- Critical user flows: 100%

---

## 10. Deployment

### 10.1 Docker Compose Setup

```yaml
services:
  postgres:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: cafe
      POSTGRES_USER: cafe
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://cafe:${DB_PASSWORD}@postgres:5432/cafe

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 10.2 Quick Start Commands
```bash
# Development
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## 11. Future Considerations

### Short-term (v1.1)
- Receipt printing
- Order modifications (before preparation)
- Multiple payment method support

### Medium-term (v2.0)
- Multi-store support
- Staff management (individual logins)
- Loyalty/rewards system

### Long-term (v3.0)
- Extractable microservices
- Mobile apps (iOS/Android)
- Delivery integration

---

## 12. Glossary

| Term | Definition |
|------|------------|
| Channel | How order was placed: 'web' or 'counter' |
| FIFO | First In, First Out (queue order) |
| Modular Monolith | Single deployment with well-separated modules |
| Station | Shared login point (e.g., kitchen station) |
| Stock Count | Remaining quantity of an item (NULL = unlimited) |
