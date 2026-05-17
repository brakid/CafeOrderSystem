import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://cafe:cafe_dev_password@localhost:5432/cafe'
});

export async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text: text.substring(0, 50), duration, rows: result.rowCount });
  return result;
}

export async function getClient() {
  return pool.connect();
}

export async function initDatabase() {
  const schema = `
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Categories
    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(100) NOT NULL,
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Menu Items
    CREATE TABLE IF NOT EXISTS menu_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      image_url VARCHAR(500),
      is_available BOOLEAN DEFAULT true,
      stock_count INTEGER DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Item Options (e.g., "Milk Type")
    CREATE TABLE IF NOT EXISTS item_options (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      is_required BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Item Option Choices (e.g., "Oat Milk", "Almond Milk")
    CREATE TABLE IF NOT EXISTS item_option_choices (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      option_id UUID REFERENCES item_options(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      price_modifier DECIMAL(10, 2) DEFAULT 0,
      is_default BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Orders
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      order_number INTEGER NOT NULL,
      channel VARCHAR(20) NOT NULL CHECK (channel IN ('web', 'counter')),
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'picked_up', 'cancelled')),
      customer_name VARCHAR(100),
      total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
      edit_token VARCHAR(64),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      picked_up_at TIMESTAMP
    );

    -- Order Items
    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id UUID REFERENCES menu_items(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price DECIMAL(10, 2) NOT NULL,
      special_instructions TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Order Item Options (selections made by customer)
    CREATE TABLE IF NOT EXISTS order_item_options (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
      option_id UUID REFERENCES item_options(id),
      choice_id UUID REFERENCES item_option_choices(id)
    );

    -- Sequence for daily order numbers
    CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
    CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
  `;

  await query(schema);
}

export default pool;
