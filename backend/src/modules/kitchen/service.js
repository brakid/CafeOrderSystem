import { query } from '../../shared/db/index.js';

export async function getKitchenOrders(statuses = ['pending', 'preparing']) {
  const result = await query(
    `SELECT o.*, 
            COALESCE(json_agg(
              CASE WHEN oi.id IS NOT NULL THEN json_build_object(
                'id', oi.id,
                'name', COALESCE(mi.name, 'Unknown Item'),
                'quantity', oi.quantity,
                'unit_price', oi.unit_price,
                'special_instructions', oi.special_instructions,
                'options', (
                  SELECT COALESCE(json_agg(json_build_object(
                    'option_name', io.name,
                    'choice_name', ioc.name
                  )), '[]'::json)
                  FROM order_item_options oio
                  LEFT JOIN item_options io ON oio.option_id = io.id
                  LEFT JOIN item_option_choices ioc ON oio.choice_id = ioc.id
                  WHERE oio.order_item_id = oi.id
                )
              ) END
            ) FILTER (WHERE oi.id IS NOT NULL), '[]') as items
     FROM orders o
     LEFT JOIN order_items oi ON o.id = oi.order_id
     LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
     WHERE o.status = ANY($1::text[])
     GROUP BY o.id
     ORDER BY o.created_at ASC`,
    [statuses]
  );
  return result.rows;
}

export async function getOrderStats() {
  const result = await query(
    `SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'preparing') as preparing_count,
        COUNT(*) FILTER (WHERE status = 'ready') as ready_count,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_orders,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE AND status = 'picked_up') as today_completed
     FROM orders`
  );
  return result.rows[0];
}

export async function getGroupedItemsForKitchen() {
  const result = await query(
    `SELECT mi.name as item_name, SUM(oi.quantity) as total_quantity, o.created_at
     FROM orders o
     JOIN order_items oi ON o.id = oi.order_id
     JOIN menu_items mi ON oi.menu_item_id = mi.id
     WHERE o.status IN ('pending', 'preparing')
     GROUP BY mi.name, o.created_at
     ORDER BY o.created_at ASC`
  );
  return result.rows;
}

export async function getAveragePrepTime() {
  const result = await query(
    `SELECT 
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) / 60 as avg_prep_time_minutes
     FROM orders
     WHERE status = 'ready' 
       AND updated_at >= NOW() - INTERVAL '7 days'`
  );
  return result.rows[0]?.avg_prep_time_minutes || 0;
}
