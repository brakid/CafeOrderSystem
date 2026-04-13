import { query } from './index.js';

export async function seedDatabase() {
  console.log('Seeding database...');

  // Clear existing data
  await query('DELETE FROM order_item_options');
  await query('DELETE FROM order_items');
  await query('DELETE FROM orders');
  await query('DELETE FROM item_option_choices');
  await query('DELETE FROM item_options');
  await query('DELETE FROM menu_items');
  await query('DELETE FROM categories');

  // Create categories
  const coffeeResult = await query(
    'INSERT INTO categories (name, sort_order) VALUES ($1, $2) RETURNING id',
    ['Coffee', 1]
  );
  const coffeeCategoryId = coffeeResult.rows[0].id;

  const teaResult = await query(
    'INSERT INTO categories (name, sort_order) VALUES ($1, $2) RETURNING id',
    ['Tea', 2]
  );
  const teaCategoryId = teaResult.rows[0].id;

  const pastryResult = await query(
    'INSERT INTO categories (name, sort_order) VALUES ($1, $2) RETURNING id',
    ['Pastries', 3]
  );
  const pastryCategoryId = pastryResult.rows[0].id;

  // Create menu items
  const espressoResult = await query(
    `INSERT INTO menu_items (category_id, name, description, price, stock_count) 
     VALUES ($1, $2, $3, $4, NULL) RETURNING id`,
    [coffeeCategoryId, 'Espresso', 'Rich, bold coffee shot', 3.50]
  );
  const espressoId = espressoResult.rows[0].id;

  const latteResult = await query(
    `INSERT INTO menu_items (category_id, name, description, price, stock_count) 
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [coffeeCategoryId, 'Café Latte', 'Smooth espresso with steamed milk', 4.50, 25]
  );
  const latteId = latteResult.rows[0].id;

  // Add milk options to Latte
  const milkOptionResult = await query(
    `INSERT INTO item_options (menu_item_id, name, is_required) 
     VALUES ($1, $2, $3) RETURNING id`,
    [latteId, 'Milk Type', false]
  );
  const milkOptionId = milkOptionResult.rows[0].id;

  await query(
    `INSERT INTO item_option_choices (option_id, name, price_modifier) VALUES ($1, 'Whole Milk', 0)`,
    [milkOptionId]
  );
  await query(
    `INSERT INTO item_option_choices (option_id, name, price_modifier) VALUES ($1, 'Oat Milk', 0.50)`,
    [milkOptionId]
  );
  await query(
    `INSERT INTO item_option_choices (option_id, name, price_modifier) VALUES ($1, 'Almond Milk', 0.50)`,
    [milkOptionId]
  );

  const matchaResult = await query(
    `INSERT INTO menu_items (category_id, name, description, price, stock_count) 
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [teaCategoryId, 'Matcha Latte', 'Japanese green tea with milk', 5.00, 15]
  );

  const croissantResult = await query(
    `INSERT INTO menu_items (category_id, name, description, price, stock_count) 
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [pastryCategoryId, 'Butter Croissant', 'Flaky, buttery French pastry', 3.75, 12]
  );

  const muffinResult = await query(
    `INSERT INTO menu_items (category_id, name, description, price, stock_count) 
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [pastryCategoryId, 'Blueberry Muffin', 'Fresh blueberry muffin', 3.50, 8]
  );

  console.log('Database seeded successfully!');
}

if (process.argv[1].includes('seed')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
