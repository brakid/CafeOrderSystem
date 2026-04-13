import { jest } from '@jest/globals';

const mockQuery = jest.fn();
const mockClient = {
  query: jest.fn(),
  release: jest.fn()
};
const mockGetClient = jest.fn(() => Promise.resolve(mockClient));

jest.unstable_mockModule('../../shared/db/index.js', () => ({
  query: mockQuery,
  getClient: mockGetClient,
  default: { connect: jest.fn(() => Promise.resolve(mockClient)) }
}));

const { createOrder, getOrderById, getOrderWithItems, getActiveOrders, updateOrderStatus, ORDER_STATES } = 
  await import('../../modules/orders/service.js');

describe('Order Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.query.mockReset();
    mockClient.release.mockReset();
  });

  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ order_number: 1 }] })
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 'item-1', 
            name: 'Espresso', 
            price: '3.50', 
            stock_count: 10, 
            is_available: true 
          }] 
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 'order-1', order_number: 1, channel: 'web', status: 'pending', total_amount: 3.50 }] })
        .mockResolvedValueOnce({ rows: [{ id: 'order-item-1' }] });

      const orderData = {
        channel: 'web',
        items: [{ menu_item_id: 'item-1', quantity: 1, option_ids: [] }]
      };

      const order = await createOrder(orderData);

      expect(order).toBeDefined();
      expect(order.order_number).toBe(1);
      expect(order.channel).toBe('web');
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should throw error for out-of-stock items', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ order_number: 1 }] })
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 'item-1', 
            name: 'Espresso', 
            price: '3.50', 
            stock_count: 0, 
            is_available: true 
          }] 
        });

      const orderData = {
        channel: 'web',
        items: [{ menu_item_id: 'item-1', quantity: 1, option_ids: [] }]
      };

      await expect(createOrder(orderData)).rejects.toThrow('Not enough stock');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should throw error for unavailable items', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ order_number: 1 }] })
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 'item-1', 
            name: 'Espresso', 
            price: '3.50', 
            stock_count: 10, 
            is_available: false 
          }] 
        });

      const orderData = {
        channel: 'web',
        items: [{ menu_item_id: 'item-1', quantity: 1, option_ids: [] }]
      };

      await expect(createOrder(orderData)).rejects.toThrow('unavailable');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('getOrderById', () => {
    it('should return order by id', async () => {
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ id: 'order-1', order_number: 1 }] 
      });

      const order = await getOrderById('order-1');

      expect(order).toBeDefined();
      expect(order.id).toBe('order-1');
    });

    it('should return undefined for non-existent order', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const order = await getOrderById('non-existent');

      expect(order).toBeUndefined();
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status to preparing', async () => {
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ id: 'order-1', status: 'preparing' }] 
      });

      const order = await updateOrderStatus('order-1', 'preparing');

      expect(order.status).toBe('preparing');
    });

    it('should update order status to ready', async () => {
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ id: 'order-1', status: 'ready' }] 
      });

      const order = await updateOrderStatus('order-1', 'ready');

      expect(order.status).toBe('ready');
    });

    it('should throw error for invalid status', async () => {
      await expect(updateOrderStatus('order-1', 'invalid')).rejects.toThrow('Invalid status');
    });
  });

  describe('ORDER_STATES', () => {
    it('should have all required states', () => {
      expect(ORDER_STATES.PENDING).toBe('pending');
      expect(ORDER_STATES.PREPARING).toBe('preparing');
      expect(ORDER_STATES.READY).toBe('ready');
      expect(ORDER_STATES.PICKED_UP).toBe('picked_up');
    });
  });
});
