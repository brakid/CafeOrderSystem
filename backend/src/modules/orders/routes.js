import express from 'express';
import { 
  createOrder, 
  getOrderById, 
  getOrderWithItems,
  getActiveOrders,
  getReadyOrders,
  updateOrderStatus,
  markOrderPickedUp,
  cancelOrder,
  modifyOrderItems
} from './service.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { items, channel, customer_name } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }
    
    // Only pass whitelisted fields — never trust client-supplied pricing
    const sanitizedItems = items.map(item => ({
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      option_ids: item.option_ids,
      special_instructions: item.special_instructions
    }));
    
    const order = await createOrder({
      items: sanitizedItems,
      channel,
      customer_name
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

router.patch('/:id/cancel', async (req, res) => {
  try {
    const editToken = req.headers['x-edit-token'];
    if (!editToken) {
      return res.status(401).json({ error: 'Edit token required' });
    }

    const order = await cancelOrder(req.params.id, editToken);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id/items', async (req, res) => {
  try {
    const editToken = req.headers['x-edit-token'];
    if (!editToken) {
      return res.status(401).json({ error: 'Edit token required' });
    }

    const { items } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    const sanitizedItems = items.map(item => ({
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      option_ids: item.option_ids,
      special_instructions: item.special_instructions
    }));

    const order = await modifyOrderItems(req.params.id, editToken, sanitizedItems);
    res.json(order);
  } catch (error) {
    console.error('Modify order error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await updateOrderStatus(req.params.id, status);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

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

    res.json(order);
  } catch (error) {
    console.error('Mark pickup error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
