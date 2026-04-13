import express from 'express';
import { 
  createOrder, 
  getOrderById, 
  getOrderWithItems,
  getActiveOrders,
  getReadyOrders,
  updateOrderStatus,
  markOrderPickedUp
} from './service.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { items, channel } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }
    
    const order = await createOrder(req.body);
    
    req.io.emit('order_new', {
      order_id: order.id,
      order_number: order.order_number,
      channel: order.channel,
      status: order.status,
      total_amount: order.total_amount,
      created_at: order.created_at
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/active', async (req, res) => {
  try {
    const orders = await getActiveOrders();
    
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => getOrderWithItems(order.id))
    );

    res.json(ordersWithItems);
  } catch (error) {
    console.error('Get active orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/ready', async (req, res) => {
  try {
    const orders = await getReadyOrders();
    res.json(orders);
  } catch (error) {
    console.error('Get ready orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await getOrderWithItems(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await updateOrderStatus(req.params.id, status);
    
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
    console.error('Update order status error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id/pickup', async (req, res) => {
  try {
    const order = await markOrderPickedUp(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    req.io.emit('order_updated', {
      order_id: order.id,
      status: order.status,
      picked_up_at: order.picked_up_at
    });

    res.json(order);
  } catch (error) {
    console.error('Mark pickup error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
