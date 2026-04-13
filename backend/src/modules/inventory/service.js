import { query } from '../../shared/db/index.js';
import { updateStock, adjustStock } from '../menu/service.js';

export async function getInventory() {
  const result = await query(
    `SELECT mi.*, c.name as category_name
     FROM menu_items mi
     JOIN categories c ON mi.category_id = c.id
     ORDER BY c.sort_order, mi.name`
  );
  return result.rows;
}

export async function getLowStockItems(threshold = 5) {
  const result = await query(
    `SELECT mi.*, c.name as category_name
     FROM menu_items mi
     JOIN categories c ON mi.category_id = c.id
     WHERE mi.stock_count IS NOT NULL 
       AND mi.stock_count <= $1
     ORDER BY mi.stock_count ASC`,
    [threshold]
  );
  return result.rows;
}

export async function getInventoryByCategory() {
  const result = await query(
    `SELECT c.id as category_id, c.name as category_name,
            COUNT(mi.id) as item_count,
            SUM(CASE WHEN mi.stock_count IS NOT NULL THEN mi.stock_count ELSE 0 END) as total_stock,
            SUM(CASE WHEN mi.stock_count IS NOT NULL AND mi.stock_count <= 5 THEN 1 ELSE 0 END) as low_stock_count
     FROM categories c
     LEFT JOIN menu_items mi ON c.id = mi.category_id
     GROUP BY c.id, c.name
     ORDER BY c.sort_order`
  );
  return result.rows;
}

export async function updateItemStock(itemId, stockCount) {
  const item = await updateStock(itemId, stockCount);
  return item;
}

export async function adjustItemStock(itemId, adjustment) {
  const item = await adjustStock(itemId, adjustment);
  return item;
}

export async function bulkUpdateStock(updates) {
  const client = await (await import('../../shared/db/index.js')).default.connect();
  
  try {
    await client.query('BEGIN');
    const results = [];

    for (const { item_id, stock_count } of updates) {
      const result = await client.query(
        `UPDATE menu_items 
         SET stock_count = $1, 
             is_available = CASE WHEN $1 <= 0 THEN false ELSE is_available END,
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 RETURNING *`,
        [stock_count, item_id]
      );
      if (result.rows[0]) {
        results.push(result.rows[0]);
      }
    }

    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
