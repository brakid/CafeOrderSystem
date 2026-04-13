import express from 'express';
import { 
  getFullMenu, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
  createOption,
  createOptionChoice,
  updateOption,
  deleteOption,
  setDefaultChoice,
  updateChoice
} from './service.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const menu = await getFullMenu();
    res.json(menu);
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { name, sort_order } = req.body;
    const category = await createCategory(name, sort_order);
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const category = await updateCategory(req.params.id, req.body);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await deleteCategory(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/items', async (req, res) => {
  try {
    const item = await createMenuItem(req.body);
    res.status(201).json(item);
  } catch (error) {
    console.error('Create item error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.put('/items/:id', async (req, res) => {
  try {
    const item = await updateMenuItem(req.params.id, req.body);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Update item error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.delete('/items/:id', async (req, res) => {
  try {
    await deleteMenuItem(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.patch('/items/:id/availability', async (req, res) => {
  try {
    const { is_available } = req.body;
    const item = await toggleAvailability(req.params.id, is_available);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/items/:id/options', async (req, res) => {
  try {
    const { name, is_required, choices } = req.body;
    const option = await createOption(req.params.id, name, is_required);
    
    if (choices && Array.isArray(choices)) {
      for (const choice of choices) {
        await createOptionChoice(option.id, choice.name, choice.price_modifier, choice.is_default);
      }
    }
    
    res.status(201).json(option);
  } catch (error) {
    console.error('Create option error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.patch('/options/:id/default', async (req, res) => {
  try {
    const { choice_id } = req.body;
    await setDefaultChoice(req.params.id, choice_id);
    res.json({ success: true });
  } catch (error) {
    console.error('Set default choice error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.patch('/choices/:id', async (req, res) => {
  try {
    const choice = await updateChoice(req.params.id, req.body);
    if (!choice) {
      return res.status(404).json({ error: 'Choice not found' });
    }
    res.json(choice);
  } catch (error) {
    console.error('Update choice error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.put('/options/:id', async (req, res) => {
  try {
    const { name, is_required } = req.body;
    const option = await updateOption(req.params.id, { name, is_required });
    if (!option) {
      return res.status(404).json({ error: 'Option not found' });
    }
    res.json(option);
  } catch (error) {
    console.error('Update option error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.delete('/options/:id', async (req, res) => {
  try {
    await deleteOption(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete option error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
