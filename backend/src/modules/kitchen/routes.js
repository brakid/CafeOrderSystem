import express from 'express';
import { 
  getKitchenOrders, 
  getOrderStats, 
  getGroupedItemsForKitchen,
  getAveragePrepTime 
} from './service.js';
import { updateOrderStatus } from '../orders/service.js';

const router = express.Router();

router.get('/orders', async (req, res) => {
  try {
    const orders = await getKitchenOrders();
    res.json(orders);
  } catch (error) {
    console.error('Get kitchen orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/orders/grouped', async (req, res) => {
  try {
    const orders = await getKitchenOrders();
    const groupedItems = {};

    for (const order of orders) {
      for (const item of order.items) {
        const key = `${item.name}-${JSON.stringify(item.options)}`;
        if (!groupedItems[key]) {
          groupedItems[key] = {
            item_name: item.name,
            options: item.options,
            total_quantity: 0,
            orders: []
          };
        }
        groupedItems[key].total_quantity += item.quantity;
        groupedItems[key].orders.push({
          order_id: order.id,
          order_number: order.order_number,
          quantity: item.quantity,
          special_instructions: item.special_instructions,
          created_at: order.created_at
        });
      }
    }

    res.json(Object.values(groupedItems));
  } catch (error) {
    console.error('Get grouped items error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = await getOrderStats();
    const avgPrepTime = await getAveragePrepTime();
    res.json({
      ...stats,
      avg_prep_time_minutes: Math.round(avgPrepTime)
    });
  } catch (error) {
    console.error('Get kitchen stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

const isValidUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

router.patch('/orders/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    
    const order = await updateOrderStatus(id, 'preparing');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    req.io.emit('order_updated', {
      order_id: order.id,
      status: order.status,
      updated_at: order.updated_at
    });
    res.json(order);
  } catch (error) {
    console.error('Start order error:', error);
    const message = error.message?.includes('inconsistent types') 
      ? 'Unable to update order. Please try again.'
      : 'Failed to start order';
    res.status(400).json({ error: message });
  }
});

router.patch('/orders/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    
    const order = await updateOrderStatus(id, 'ready');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    req.io.emit('order_updated', {
      order_id: order.id,
      status: order.status,
      updated_at: order.updated_at
    });
    res.json(order);
  } catch (error) {
    console.error('Complete order error:', error);
    const message = error.message?.includes('inconsistent types') 
      ? 'Unable to update order. Please try again.'
      : 'Failed to complete order';
    res.status(400).json({ error: message });
  }
});

export default router;
