import { query } from '../../shared/db/index.js';

export async function getOrderAnalytics(startDate, endDate) {
  const result = await query(
    `SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        SUM(total_amount) as revenue,
        AVG(total_amount) as avg_order_value,
        COUNT(DISTINCT channel) as channels_used
     FROM orders
     WHERE created_at >= $1 AND created_at <= $2
       AND status != 'picked_up' OR true
     GROUP BY DATE(created_at)
     ORDER BY date DESC`,
    [startDate, endDate]
  );
  return result.rows;
}

export async function getPopularItems(startDate, endDate, limit = 10) {
  const result = await query(
    `SELECT 
        mi.id,
        mi.name,
        mi.price,
        c.name as category_name,
        SUM(oi.quantity) as total_sold,
        COUNT(DISTINCT o.id) as order_count
     FROM order_items oi
     JOIN menu_items mi ON oi.menu_item_id = mi.id
     JOIN categories c ON mi.category_id = c.id
     JOIN orders o ON oi.order_id = o.id
     WHERE o.created_at >= $1 AND o.created_at <= $2
     GROUP BY mi.id, mi.name, mi.price, c.name
     ORDER BY total_sold DESC
     LIMIT $3`,
    [startDate, endDate, limit]
  );
  return result.rows;
}

export async function getRevenueBreakdown(startDate, endDate) {
  const result = await query(
    `SELECT 
        c.name as category,
        SUM(oi.unit_price * oi.quantity) as revenue,
        COUNT(DISTINCT o.id) as order_count
     FROM order_items oi
     JOIN menu_items mi ON oi.menu_item_id = mi.id
     JOIN categories c ON mi.category_id = c.id
     JOIN orders o ON oi.order_id = o.id
     WHERE o.created_at >= $1 AND o.created_at <= $2
     GROUP BY c.name
     ORDER BY revenue DESC`,
    [startDate, endDate]
  );
  return result.rows;
}

export async function getHourlyDistribution(startDate, endDate) {
  const result = await query(
    `SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as order_count
     FROM orders
     WHERE created_at >= $1 AND created_at <= $2
     GROUP BY EXTRACT(HOUR FROM created_at)
     ORDER BY hour`,
    [startDate, endDate]
  );
  return result.rows;
}

export async function getChannelBreakdown(startDate, endDate) {
  const result = await query(
    `SELECT 
        channel,
        COUNT(*) as order_count,
        SUM(total_amount) as revenue
     FROM orders
     WHERE created_at >= $1 AND created_at <= $2
     GROUP BY channel`,
    [startDate, endDate]
  );
  return result.rows;
}

export async function getDashboardSummary() {
  const result = await query(
    `SELECT 
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE) as today_orders,
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE AND status = 'picked_up') as today_completed,
        (SELECT SUM(total_amount) FROM orders WHERE DATE(created_at) = CURRENT_DATE) as today_revenue,
        (SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'preparing')) as active_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'ready') as ready_orders,
        (SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '7 days') as week_orders,
        (SELECT SUM(total_amount) FROM orders WHERE created_at >= NOW() - INTERVAL '7 days') as week_revenue`
  );
  return result.rows[0];
}
