import express from 'express';
import { 
  getInventory, 
  getLowStockItems, 
  getInventoryByCategory,
  updateItemStock,
  adjustItemStock,
  bulkUpdateStock
} from './service.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const inventory = await getInventory();
    res.json(inventory);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/low-stock', async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 5;
    const items = await getLowStockItems(threshold);
    res.json(items);
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/by-category', async (req, res) => {
  try {
    const byCategory = await getInventoryByCategory();
    res.json(byCategory);
  } catch (error) {
    console.error('Get inventory by category error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/items/:id', async (req, res) => {
  try {
    const { stock_count } = req.body;
    const item = await updateItemStock(req.params.id, stock_count, req.io);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.patch('/items/:id/adjust', async (req, res) => {
  try {
    const { adjustment } = req.body;
    const item = await adjustItemStock(req.params.id, adjustment, req.io);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/bulk-update', async (req, res) => {
  try {
    const { updates } = req.body;
    const results = await bulkUpdateStock(updates);
    
    if (req.io) {
      for (const item of results) {
        req.io.emit('stock_updated', { item_id: item.id, stock_count: item.stock_count });
      }
    }
    
    res.json(results);
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
