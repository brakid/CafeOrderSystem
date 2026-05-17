import { query, getClient } from '../../shared/db/index.js';

import { randomBytes } from 'crypto';

const ORDER_STATES = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  PICKED_UP: 'picked_up',
  CANCELLED: 'cancelled'
};

function generateEditToken() {
  return randomBytes(24).toString('hex');
}

function buildValidatedItem(item, menuItem, itemPrice) {
  return {
    menu_item_id: item.menu_item_id,
    quantity: item.quantity,
    option_ids: item.option_ids,
    special_instructions: item.special_instructions,
    unit_price: itemPrice,
    has_limited_stock: menuItem.stock_count !== null
  };
}

async function validateAndPriceItem(client, item) {
  if (!item.quantity || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
    throw new Error('Item quantity must be a positive integer');
  }

  const itemResult = await client.query(
    `SELECT id, name, price, stock_count, is_available 
     FROM menu_items WHERE id = $1`,
    [item.menu_item_id]
  );

  if (itemResult.rows.length === 0) {
    throw new Error(`Menu item not found: ${item.menu_item_id}`);
  }

  const menuItem = itemResult.rows[0];

  if (!menuItem.is_available) {
    throw new Error(`${menuItem.name} is currently unavailable`);
  }

  if (menuItem.stock_count !== null && menuItem.stock_count < item.quantity) {
    throw new Error(`Not enough stock for ${menuItem.name}. Available: ${menuItem.stock_count}`);
  }

  let itemPrice = parseFloat(menuItem.price);

  if (item.option_ids && item.option_ids.length > 0) {
    const choiceValidation = await client.query(
      `SELECT COUNT(*) as count FROM item_option_choices ioc
       JOIN item_options io ON ioc.option_id = io.id
       WHERE ioc.id = ANY($1) AND io.menu_item_id = $2`,
      [item.option_ids, item.menu_item_id]
    );

    if (parseInt(choiceValidation.rows[0].count) !== item.option_ids.length) {
      throw new Error('Invalid option choices for this menu item');
    }

    const optionsResult = await client.query(
      `SELECT SUM(price_modifier) as total_modifier 
       FROM item_option_choices WHERE id = ANY($1)`,
      [item.option_ids]
    );
    itemPrice += parseFloat(optionsResult.rows[0].total_modifier || 0);
  }

  return { menuItem, itemPrice };
}

async function insertOrderItems(client, orderId, validatedItems) {
  for (const item of validatedItems) {
    const orderItemResult = await client.query(
      `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, special_instructions) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [orderId, item.menu_item_id, item.quantity, item.unit_price, item.special_instructions]
    );
    const orderItem = orderItemResult.rows[0];

    if (item.option_ids && item.option_ids.length > 0) {
      for (const choiceId of item.option_ids) {
        const optionResult = await client.query(
          'SELECT option_id FROM item_option_choices WHERE id = $1',
          [choiceId]
        );
        if (optionResult.rows.length > 0) {
          await client.query(
            `INSERT INTO order_item_options (order_item_id, option_id, choice_id) 
             VALUES ($1, $2, $3)`,
            [orderItem.id, optionResult.rows[0].option_id, choiceId]
          );
        }
      }
    }

    if (item.has_limited_stock) {
      await client.query(
        `UPDATE menu_items 
         SET stock_count = stock_count - $1, 
             is_available = CASE WHEN stock_count - $1 <= 0 THEN false ELSE is_available END
         WHERE id = $2`,
        [item.quantity, item.menu_item_id]
      );
    }
  }
}

export async function createOrder(orderData) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    const orderNumResult = await client.query('SELECT nextval(\'order_number_seq\') as order_number');
    const orderNumber = orderNumResult.rows[0].order_number;

    let totalAmount = 0;
    const validatedItems = [];

    for (const item of orderData.items) {
      const { menuItem, itemPrice } = await validateAndPriceItem(client, item);
      totalAmount += itemPrice * item.quantity;
      validatedItems.push(buildValidatedItem(item, menuItem, itemPrice));
    }

    const editToken = generateEditToken();

    const orderResult = await client.query(
      `INSERT INTO orders (order_number, channel, customer_name, total_amount, edit_token) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [orderNumber, orderData.channel || 'web', orderData.customer_name, totalAmount, editToken]
    );
    const order = orderResult.rows[0];

    await insertOrderItems(client, order.id, validatedItems);

    await client.query('COMMIT');

    return {
      ...order,
      items: validatedItems
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function cancelOrder(orderId, editToken) {
  const order = await getOrderById(orderId);
  if (!order) throw new Error('Order not found');
  if (order.edit_token !== editToken) throw new Error('Invalid edit token');
  if (order.status !== ORDER_STATES.PENDING) throw new Error('Only pending orders can be cancelled');

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const items = await client.query(
      'SELECT menu_item_id, quantity, stock_count FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id WHERE order_id = $1',
      [orderId]
    );

    for (const item of items.rows) {
      if (item.stock_count !== null) {
        await client.query(
          `UPDATE menu_items 
           SET stock_count = stock_count + $1, 
               is_available = true,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [item.quantity, item.menu_item_id]
        );
      }
    }

    const result = await client.query(
      `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [ORDER_STATES.CANCELLED, orderId]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function modifyOrderItems(orderId, editToken, newItems) {
  const order = await getOrderById(orderId);
  if (!order) throw new Error('Order not found');
  if (order.edit_token !== editToken) throw new Error('Invalid edit token');
  if (order.status !== ORDER_STATES.PENDING) throw new Error('Only pending orders can be modified');

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Restore stock for existing items
    const existingItems = await client.query(
      'SELECT menu_item_id, quantity, stock_count FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id WHERE order_id = $1',
      [orderId]
    );

    for (const item of existingItems.rows) {
      if (item.stock_count !== null) {
        await client.query(
          `UPDATE menu_items SET stock_count = stock_count + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [item.quantity, item.menu_item_id]
        );
      }
    }

    // Delete old items (cascades to order_item_options)
    await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);

    // Validate and insert new items
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of newItems) {
      const { menuItem, itemPrice } = await validateAndPriceItem(client, item);
      totalAmount += itemPrice * item.quantity;
      validatedItems.push(buildValidatedItem(item, menuItem, itemPrice));
    }

    await insertOrderItems(client, orderId, validatedItems);

    // Update order total
    await client.query(
      'UPDATE orders SET total_amount = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [totalAmount, orderId]
    );

    await client.query('COMMIT');

    return { ...order, total_amount: totalAmount, items: validatedItems };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getOrderById(orderId) {
  const result = await query(
    'SELECT * FROM orders WHERE id = $1',
    [orderId]
  );
  return result.rows[0];
}

export async function getOrderWithItems(orderId) {
  const orderResult = await query(
    'SELECT * FROM orders WHERE id = $1',
    [orderId]
  );

  if (orderResult.rows.length === 0) return null;

  const order = orderResult.rows[0];

  const itemsResult = await query(
    `SELECT oi.*, mi.name as item_name, mi.stock_count,
            json_agg(json_build_object(
              'option_id', oio.option_id,
              'choice_id', oio.choice_id,
              'choice_name', ioc.name,
              'option_name', io.name
            )) as options
     FROM order_items oi
     JOIN menu_items mi ON oi.menu_item_id = mi.id
     LEFT JOIN order_item_options oio ON oi.id = oio.order_item_id
     LEFT JOIN item_option_choices ioc ON oio.choice_id = ioc.id
     LEFT JOIN item_options io ON oio.option_id = io.id
     WHERE oi.order_id = $1
     GROUP BY oi.id, mi.name, mi.stock_count`,
    [orderId]
  );

  return {
    ...order,
    items: itemsResult.rows
  };
}

export async function getActiveOrders() {
  const result = await query(
    `SELECT * FROM orders 
     WHERE status IN ('pending', 'preparing') 
     ORDER BY created_at ASC`
  );
  return result.rows;
}

export async function getReadyOrders() {
  const result = await query(
    `SELECT * FROM orders 
     WHERE status = 'ready' 
     ORDER BY updated_at ASC`
  );
  return result.rows;
}

export async function updateOrderStatus(orderId, newStatus) {
  const validStatuses = Object.values(ORDER_STATES);
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  const pickedUpAt = newStatus === ORDER_STATES.PICKED_UP ? 'CURRENT_TIMESTAMP' : 'picked_up_at';
  
  const result = await query(
    `UPDATE orders 
     SET status = $1, updated_at = CURRENT_TIMESTAMP, picked_up_at = ${pickedUpAt}
     WHERE id = $2::uuid 
     RETURNING *`,
    [newStatus, orderId]
  );

  return result.rows[0];
}

export async function markOrderPickedUp(orderId) {
  return updateOrderStatus(orderId, ORDER_STATES.PICKED_UP);
}

export { ORDER_STATES };
