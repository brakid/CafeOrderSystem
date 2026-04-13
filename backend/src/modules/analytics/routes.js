import express from 'express';
import { 
  getOrderAnalytics, 
  getPopularItems, 
  getRevenueBreakdown,
  getHourlyDistribution,
  getChannelBreakdown,
  getDashboardSummary
} from './service.js';

const router = express.Router();

router.get('/summary', async (req, res) => {
  try {
    const summary = await getDashboardSummary();
    res.json(summary);
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const endDate = req.query.end_date || new Date().toISOString();
    const startDate = req.query.start_date || 
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const analytics = await getOrderAnalytics(startDate, endDate);
    res.json(analytics);
  } catch (error) {
    console.error('Get order analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/items', async (req, res) => {
  try {
    const endDate = req.query.end_date || new Date().toISOString();
    const startDate = req.query.start_date || 
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const limit = parseInt(req.query.limit) || 10;
    
    const items = await getPopularItems(startDate, endDate, limit);
    res.json(items);
  } catch (error) {
    console.error('Get popular items error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/revenue', async (req, res) => {
  try {
    const endDate = req.query.end_date || new Date().toISOString();
    const startDate = req.query.start_date || 
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const breakdown = await getRevenueBreakdown(startDate, endDate);
    res.json(breakdown);
  } catch (error) {
    console.error('Get revenue breakdown error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/hourly', async (req, res) => {
  try {
    const endDate = req.query.end_date || new Date().toISOString();
    const startDate = req.query.start_date || 
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const distribution = await getHourlyDistribution(startDate, endDate);
    res.json(distribution);
  } catch (error) {
    console.error('Get hourly distribution error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/channels', async (req, res) => {
  try {
    const endDate = req.query.end_date || new Date().toISOString();
    const startDate = req.query.start_date || 
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const breakdown = await getChannelBreakdown(startDate, endDate);
    res.json(breakdown);
  } catch (error) {
    console.error('Get channel breakdown error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
