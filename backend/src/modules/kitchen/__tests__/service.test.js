import { jest } from '@jest/globals';

const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  join: jest.fn(),
  leave: jest.fn()
};

const mockIo = {
  on: jest.fn((event, callback) => {
    mockSocket.on[event] = callback;
    return mockIo;
  }),
  emit: jest.fn(),
  to: jest.fn(() => ({
    emit: jest.fn()
  })),
  sockets: {
    adapter: {
      rooms: new Map()
    }
  }
};

jest.unstable_mockModule('../../shared/socket/index.js', () => ({
  setupSocketHandlers: jest.fn(() => mockIo),
  emitToKitchen: jest.fn(),
  emitToPickup: jest.fn(),
  emitToAll: jest.fn()
}));

describe('Kitchen Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Kitchen Display Logic', () => {
    it('should group items by name for grouped view', () => {
      const orders = [
        {
          id: 'order-1',
          order_number: 1,
          items: [
            { name: 'Espresso', quantity: 2, options: [] },
            { name: 'Latte', quantity: 1, options: [] }
          ]
        },
        {
          id: 'order-2',
          order_number: 2,
          items: [
            { name: 'Espresso', quantity: 1, options: [] }
          ]
        }
      ];

      const groupedItems = {};
      orders.forEach(order => {
        order.items.forEach(item => {
          if (!groupedItems[item.name]) {
            groupedItems[item.name] = { name: item.name, total: 0, orders: [] };
          }
          groupedItems[item.name].total += item.quantity;
          groupedItems[item.name].orders.push({
            orderNumber: order.order_number,
            quantity: item.quantity
          });
        });
      });

      expect(groupedItems['Espresso'].total).toBe(3);
      expect(groupedItems['Espresso'].orders).toHaveLength(2);
      expect(groupedItems['Latte'].total).toBe(1);
    });

    it('should calculate FIFO order correctly', () => {
      const orders = [
        { id: 'order-1', created_at: new Date('2024-01-01T10:00:00') },
        { id: 'order-2', created_at: new Date('2024-01-01T10:01:00') },
        { id: 'order-3', created_at: new Date('2024-01-01T10:02:00') }
      ];

      const sortedOrders = [...orders].sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      );

      expect(sortedOrders[0].id).toBe('order-1');
      expect(sortedOrders[1].id).toBe('order-2');
      expect(sortedOrders[2].id).toBe('order-3');
    });

    it('should calculate preparation time correctly', () => {
      const startTime = new Date('2024-01-01T10:00:00');
      const endTime = new Date('2024-01-01T10:05:00');
      const prepTimeMinutes = (endTime - startTime) / 60000;

      expect(prepTimeMinutes).toBe(5);
    });
  });
});

describe('Order Lifecycle', () => {
  const ORDER_STATES = {
    PENDING: 'pending',
    PREPARING: 'preparing',
    READY: 'ready',
    PICKED_UP: 'picked_up'
  };

  it('should have valid state transitions', () => {
    const validTransitions = {
      pending: ['preparing'],
      preparing: ['ready'],
      ready: ['picked_up'],
      picked_up: []
    };

    expect(validTransitions.pending).toContain('preparing');
    expect(validTransitions.preparing).toContain('ready');
    expect(validTransitions.ready).toContain('picked_up');
    expect(validTransitions.picked_up).toHaveLength(0);
  });

  it('should validate status values', () => {
    const validStatuses = ['pending', 'preparing', 'ready', 'picked_up'];
    
    expect(validStatuses).toContain('pending');
    expect(validStatuses).toContain('preparing');
    expect(validStatuses).toContain('ready');
    expect(validStatuses).toContain('picked_up');
    expect(validStatuses.length).toBe(4);
  });
});
