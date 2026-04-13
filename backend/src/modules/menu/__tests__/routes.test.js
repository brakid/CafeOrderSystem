import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

const mockGetFullMenu = jest.fn();
const mockCreateCategory = jest.fn();
const mockUpdateCategory = jest.fn();
const mockDeleteCategory = jest.fn();
const mockCreateMenuItem = jest.fn();
const mockUpdateMenuItem = jest.fn();
const mockDeleteMenuItem = jest.fn();
const mockToggleAvailability = jest.fn();
const mockCreateOption = jest.fn();
const mockCreateOptionChoice = jest.fn();

jest.unstable_mockModule('../../modules/menu/service.js', () => ({
  getFullMenu: mockGetFullMenu,
  createCategory: mockCreateCategory,
  updateCategory: mockUpdateCategory,
  deleteCategory: mockDeleteCategory,
  createMenuItem: mockCreateMenuItem,
  updateMenuItem: mockUpdateMenuItem,
  deleteMenuItem: mockDeleteMenuItem,
  toggleAvailability: mockToggleAvailability,
  createOption: mockCreateOption,
  createOptionChoice: mockCreateOptionChoice
}));

const menuRouter = (await import('../../modules/menu/routes.js')).default;

const app = express();
app.use(express.json());
app.use('/api/menu', menuRouter);

describe('Menu API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/menu', () => {
    it('should return full menu', async () => {
      const mockMenu = [
        {
          id: 'cat-1',
          name: 'Coffee',
          items: [
            { id: 'item-1', name: 'Espresso', price: 3.50 }
          ]
        }
      ];

      mockGetFullMenu.mockResolvedValue(mockMenu);

      const response = await request(app).get('/api/menu');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].items).toHaveLength(1);
    });
  });

  describe('POST /api/menu/categories', () => {
    it('should create a category', async () => {
      const mockCategory = { id: 'cat-1', name: 'Tea', sort_order: 2 };
      mockCreateCategory.mockResolvedValue(mockCategory);

      const response = await request(app)
        .post('/api/menu/categories')
        .send({ name: 'Tea', sort_order: 2 });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Tea');
    });
  });

  describe('PATCH /api/menu/items/:id/availability', () => {
    it('should toggle item availability', async () => {
      const mockItem = { id: 'item-1', name: 'Espresso', is_available: false };
      mockToggleAvailability.mockResolvedValue(mockItem);

      const response = await request(app)
        .patch('/api/menu/items/item-1/availability')
        .send({ is_available: false });

      expect(response.status).toBe(200);
      expect(response.body.is_available).toBe(false);
    });
  });

  describe('POST /api/menu/items/:id/options', () => {
    it('should create item option with choices', async () => {
      const mockOption = { id: 'opt-1', name: 'Size', is_required: true };
      mockCreateOption.mockResolvedValue(mockOption);
      mockCreateOptionChoice.mockResolvedValue({ id: 'choice-1', name: 'Small', price_modifier: 0 });

      const response = await request(app)
        .post('/api/menu/items/item-1/options')
        .send({
          name: 'Size',
          is_required: true,
          choices: [{ name: 'Small', price_modifier: 0 }]
        });

      expect(response.status).toBe(201);
      expect(mockCreateOption).toHaveBeenCalledWith('item-1', 'Size', true);
    });
  });
});
