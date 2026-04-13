import { query } from '../../shared/db/index.js';

export async function getFullMenu() {
  const categoriesResult = await query(
    `SELECT * FROM categories WHERE is_active = true ORDER BY sort_order`
  );

  const categories = await Promise.all(
    categoriesResult.rows.map(async (category) => {
      const itemsResult = await query(
        `SELECT * FROM menu_items WHERE category_id = $1 ORDER BY name`,
        [category.id]
      );

      const items = await Promise.all(
        itemsResult.rows.map(async (item) => {
          const optionsResult = await query(
            `SELECT io.*, 
                    json_agg(json_build_object(
                      'id', ioc.id,
                      'name', ioc.name,
                      'price_modifier', ioc.price_modifier,
                      'is_default', ioc.is_default
                    ) ORDER BY ioc.is_default DESC, ioc.name) as choices
             FROM item_options io
             LEFT JOIN item_option_choices ioc ON io.id = ioc.option_id
             WHERE io.menu_item_id = $1
             GROUP BY io.id`,
            [item.id]
          );

          return {
            ...item,
            options: optionsResult.rows,
            in_stock: item.stock_count === null || item.stock_count > 0,
            is_available: item.is_available && (item.stock_count === null || item.stock_count > 0)
          };
        })
      );

      return {
        ...category,
        items
      };
    })
  );

  return categories;
}

export async function createCategory(name, sortOrder = 0) {
  const result = await query(
    'INSERT INTO categories (name, sort_order) VALUES ($1, $2) RETURNING *',
    [name, sortOrder]
  );
  return result.rows[0];
}

export async function updateCategory(id, updates) {
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramCount++}`);
    values.push(updates.name);
  }
  if (updates.sort_order !== undefined) {
    fields.push(`sort_order = $${paramCount++}`);
    values.push(updates.sort_order);
  }
  if (updates.is_active !== undefined) {
    fields.push(`is_active = $${paramCount++}`);
    values.push(updates.is_active);
  }

  if (fields.length === 0) return null;

  values.push(id);
  const result = await query(
    `UPDATE categories SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function deleteCategory(id) {
  await query('DELETE FROM categories WHERE id = $1', [id]);
}

export async function createMenuItem(itemData) {
  const result = await query(
    `INSERT INTO menu_items (category_id, name, description, price, image_url, stock_count)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      itemData.category_id,
      itemData.name,
      itemData.description,
      itemData.price,
      itemData.image_url,
      itemData.stock_count
    ]
  );
  return result.rows[0];
}

export async function updateMenuItem(id, updates) {
  const fields = [];
  const values = [];
  let paramCount = 1;

  const allowedFields = ['name', 'description', 'price', 'image_url', 'stock_count', 'is_available', 'category_id'];
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      fields.push(`${field} = $${paramCount++}`);
      values.push(updates[field]);
    }
  }

  if (fields.length === 0) return null;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const result = await query(
    `UPDATE menu_items SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function deleteMenuItem(id) {
  await query('DELETE FROM menu_items WHERE id = $1', [id]);
}

export async function toggleAvailability(id, isAvailable) {
  const result = await query(
    `UPDATE menu_items SET is_available = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
    [isAvailable, id]
  );
  return result.rows[0];
}

export async function updateStock(id, stockCount) {
  const result = await query(
    `UPDATE menu_items 
     SET stock_count = $1, 
         is_available = CASE WHEN $1 <= 0 THEN false ELSE is_available END,
         updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 RETURNING *`,
    [stockCount, id]
  );
  return result.rows[0];
}

export async function adjustStock(id, adjustment) {
  const result = await query(
    `UPDATE menu_items 
     SET stock_count = GREATEST(0, COALESCE(stock_count, 0) + $1),
         is_available = CASE 
           WHEN COALESCE(stock_count, 0) + $1 <= 0 THEN false 
           ELSE true 
         END,
         updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 RETURNING *`,
    [adjustment, id]
  );
  return result.rows[0];
}

export async function createOption(menuItemId, name, isRequired = false) {
  const result = await query(
    'INSERT INTO item_options (menu_item_id, name, is_required) VALUES ($1, $2, $3) RETURNING *',
    [menuItemId, name, isRequired]
  );
  return result.rows[0];
}

export async function createOptionChoice(optionId, name, priceModifier = 0, isDefault = false) {
  const result = await query(
    'INSERT INTO item_option_choices (option_id, name, price_modifier, is_default) VALUES ($1, $2, $3, $4) RETURNING *',
    [optionId, name, priceModifier, isDefault]
  );
  return result.rows[0];
}

export async function deleteOptionChoice(id) {
  await query('DELETE FROM item_option_choices WHERE id = $1', [id]);
}

export async function setDefaultChoice(optionId, choiceId) {
  await query('UPDATE item_option_choices SET is_default = false WHERE option_id = $1', [optionId]);
  await query('UPDATE item_option_choices SET is_default = true WHERE id = $1', [choiceId]);
}

export async function updateChoice(id, updates) {
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramCount++}`);
    values.push(updates.name);
  }
  if (updates.price_modifier !== undefined) {
    fields.push(`price_modifier = $${paramCount++}`);
    values.push(updates.price_modifier);
  }

  if (fields.length === 0) return null;

  values.push(id);
  const result = await query(
    `UPDATE item_option_choices SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function updateOption(id, updates) {
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramCount++}`);
    values.push(updates.name);
  }
  if (updates.is_required !== undefined) {
    fields.push(`is_required = $${paramCount++}`);
    values.push(updates.is_required);
  }

  if (fields.length === 0) return null;

  values.push(id);
  const result = await query(
    `UPDATE item_options SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function deleteOption(id) {
  await query('DELETE FROM item_options WHERE id = $1', [id]);
}
