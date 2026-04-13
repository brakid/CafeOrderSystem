import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

const mockCreateOrder = jest.fn();
const mockGetOrderById = jest.fn();
const mockGetActiveOrders = jest.fn();
const mockUpdateOrderStatus = jest.fn();

jest.unstable_mockModule('../../modules/orders/service.js', () => ({
  createOrder: mockCreateOrder,
  getOrderById: mockGetOrderById,
  getOrderWithItems: jest.fn(),
  getActiveOrders: mockGetActiveOrders,
  getReadyOrders: jest.fn(),
  updateOrderStatus: mockUpdateOrderStatus,
  markOrderPickedUp: jest.fn()
}));

const ordersRouter = (await import('../../modules/orders/routes.js')).default;

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.io = { emit: jest.fn() };
  next();
});
app.use('/api/orders', ordersRouter);

describe('Orders API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/orders', () => {
    it('should create an order successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        order_number: 1,
        channel: 'web',
        status: 'pending',
        total_amount: 3.50,
        created_at: new Date()
      };

      mockCreateOrder.mockResolvedValue(mockOrder);

      const response = await request(app)
        .post('/api/orders')
        .send({
          channel: 'web',
          items: [{ menu_item_id: 'item-1', quantity: 1, option_ids: [] }]
        });

      expect(response.status).toBe(201);
      expect(response.body.order_number).toBe(1);
    });

    it('should return 400 for invalid order', async () => {
      mockCreateOrder.mockRejectedValue(new Error('Menu item not found'));

      const response = await request(app)
        .post('/api/orders')
        .send({
          channel: 'web',
          items: [{ menu_item_id: 'invalid', quantity: 1 }]
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Menu item not found');
    });

    it('should emit order_new event via socket', async () => {
      const mockOrder = {
        id: 'order-1',
        order_number: 1,
        channel: 'web',
        status: 'pending',
        total_amount: 3.50,
        created_at: new Date()
      };

      mockCreateOrder.mockResolvedValue(mockOrder);

      await request(app)
        .post('/api/orders')
        .send({
          channel: 'web',
          items: [{ menu_item_id: 'item-1', quantity: 1 }]
        });

      expect(mockCreateOrder).toHaveBeenCalled();
    });
  });

  describe('GET /api/orders/active', () => {
    it('should return active orders', async () => {
      const mockOrders = [
        { id: 'order-1', order_number: 1, status: 'pending' },
        { id: 'order-2', order_number: 2, status: 'preparing' }
      ];

      mockGetActiveOrders.mockResolvedValue(mockOrders);

      const response = await request(app)
        .get('/api/orders/active');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    it('should update order status', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'preparing',
        updated_at: new Date()
      };

      mockUpdateOrderStatus.mockResolvedValue(mockOrder);

      const response = await request(app)
        .patch('/api/orders/order-1/status')
        .send({ status: 'preparing' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('preparing');
    });

    it('should return 400 for invalid status', async () => {
      mockUpdateOrderStatus.mockRejectedValue(new Error('Invalid status'));

      const response = await request(app)
        .patch('/api/orders/order-1/status')
        .send({ status: 'invalid' });

      expect(response.status).toBe(400);
    });
  });
});
