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

const { 
  getFullMenu, 
  createCategory, 
  createMenuItem,
  toggleAvailability,
  updateStock,
  adjustStock 
} = await import('../../modules/menu/service.js');

describe('Menu Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFullMenu', () => {
    it('should return menu with categories and items', async () => {
      mockQuery
        .mockResolvedValueOnce({ 
          rows: [{ id: 'cat-1', name: 'Coffee', sort_order: 1, is_active: true }] 
        })
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 'item-1', 
            name: 'Espresso', 
            price: '3.50', 
            stock_count: 10, 
            is_available: true 
          }] 
        })
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 'opt-1', 
            name: 'Size', 
            is_required: true, 
            choices: [{ id: 'choice-1', name: 'Small', price_modifier: '0' }] 
          }] 
        });

      const menu = await getFullMenu();

      expect(menu).toHaveLength(1);
      expect(menu[0].name).toBe('Coffee');
      expect(menu[0].items).toHaveLength(1);
      expect(menu[0].items[0].name).toBe('Espresso');
      expect(menu[0].items[0].is_available).toBe(true);
      expect(menu[0].items[0].in_stock).toBe(true);
    });

    it('should mark items with zero stock as unavailable', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 'item-1', 
            name: 'Espresso', 
            price: '3.50', 
            stock_count: 0, 
            is_available: true 
          }] 
        })
        .mockResolvedValueOnce({ rows: [] });

      const menu = await getFullMenu();

      expect(menu[0]?.items[0]?.in_stock).toBe(false);
      expect(menu[0]?.items[0]?.is_available).toBe(false);
    });
  });

  describe('createCategory', () => {
    it('should create a new category', async () => {
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ id: 'cat-1', name: 'Tea', sort_order: 2 }] 
      });

      const category = await createCategory('Tea', 2);

      expect(category.name).toBe('Tea');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO categories'),
        ['Tea', 2]
      );
    });
  });

  describe('createMenuItem', () => {
    it('should create a new menu item', async () => {
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ 
          id: 'item-1', 
          name: 'Latte', 
          price: '4.50', 
          category_id: 'cat-1' 
        }] 
      });

      const item = await createMenuItem({
        category_id: 'cat-1',
        name: 'Latte',
        price: 4.50
      });

      expect(item.name).toBe('Latte');
      expect(item.price).toBe('4.50');
    });
  });

  describe('toggleAvailability', () => {
    it('should toggle item availability to false', async () => {
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ id: 'item-1', name: 'Espresso', is_available: false }] 
      });

      const item = await toggleAvailability('item-1', false);

      expect(item.is_available).toBe(false);
    });

    it('should toggle item availability to true', async () => {
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ id: 'item-1', name: 'Espresso', is_available: true }] 
      });

      const item = await toggleAvailability('item-1', true);

      expect(item.is_available).toBe(true);
    });
  });

  describe('updateStock', () => {
    it('should update stock count', async () => {
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ id: 'item-1', name: 'Espresso', stock_count: 5 }] 
      });

      const item = await updateStock('item-1', 5);

      expect(item.stock_count).toBe(5);
    });

    it('should set availability to false when stock is 0', async () => {
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ id: 'item-1', name: 'Espresso', stock_count: 0, is_available: false }] 
      });

      const item = await updateStock('item-1', 0);

      expect(item.stock_count).toBe(0);
      expect(item.is_available).toBe(false);
    });
  });

  describe('adjustStock', () => {
    it('should adjust stock by positive amount', async () => {
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ id: 'item-1', name: 'Espresso', stock_count: 15 }] 
      });

      const item = await adjustStock('item-1', 5);

      expect(item.stock_count).toBe(15);
    });

    it('should adjust stock by negative amount', async () => {
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ id: 'item-1', name: 'Espresso', stock_count: 5 }] 
      });

      const item = await adjustStock('item-1', -5);

      expect(item.stock_count).toBe(5);
    });

    it('should not allow stock to go below 0', async () => {
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ id: 'item-1', name: 'Espresso', stock_count: 0 }] 
      });

      const item = await adjustStock('item-1', -10);

      expect(item.stock_count).toBe(0);
    });
  });
});
