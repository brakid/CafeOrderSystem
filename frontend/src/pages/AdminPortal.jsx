import React, { useState } from 'react';
import { useMenu, useInventory, useAnalytics } from '../hooks/useApi';

const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';

const styles = {
  container: { minHeight: '100vh', background: '#f5f5f5' },
  nav: { background: '#2c3e50', padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  navBtn: (active) => ({ 
    padding: '0.5rem 1rem', 
    border: 'none', 
    borderRadius: '4px',
    cursor: 'pointer',
    background: active ? '#3498db' : 'transparent',
    color: 'white'
  }),
  content: { padding: '1rem', maxWidth: '1200px', margin: '0 auto' },
  section: { marginBottom: '2rem' },
  sectionTitle: { fontSize: '1.5rem', marginBottom: '1rem', color: '#2c3e50', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  card: { background: 'white', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' },
  statCard: { background: 'white', borderRadius: '8px', padding: '1rem', textAlign: 'center' },
  statValue: { fontSize: '2rem', fontWeight: 'bold', color: '#2c3e50' },
  statLabel: { color: '#666' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.75rem', borderBottom: '2px solid #ddd' },
  td: { padding: '0.75rem', borderBottom: '1px solid #eee', verticalAlign: 'top' },
  stockBadge: (stock) => ({ 
    padding: '0.25rem 0.5rem', 
    borderRadius: '4px',
    background: stock === 0 ? '#e74c3c' : stock <= 5 ? '#f39c12' : '#27ae60',
    color: 'white',
    fontSize: '0.8rem'
  }),
  toggle: (enabled) => ({ 
    width: '50px', 
    height: '26px', 
    borderRadius: '13px', 
    background: enabled ? '#27ae60' : '#e0e0e0',
    position: 'relative',
    cursor: 'pointer',
    border: 'none',
    display: 'inline-block'
  }),
  toggleKnob: (enabled) => ({ 
    width: '22px', 
    height: '22px', 
    borderRadius: '50%', 
    background: 'white',
    position: 'absolute',
    top: '2px',
    left: enabled ? '26px' : '2px',
    transition: 'left 0.2s'
  }),
  input: { padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', width: '100%', boxSizing: 'border-box' },
  inputSmall: { padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', width: '80px' },
  btn: { padding: '0.5rem 1rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  btnSmall: { padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  btnDanger: { padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  btnSuccess: { padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalContent: { background: 'white', borderRadius: '12px', padding: '1.5rem', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' },
  formGroup: { marginBottom: '1rem' },
  label: { display: 'block', marginBottom: '0.25rem', fontWeight: '600' },
  select: { padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', width: '100%', boxSizing: 'border-box' },
  categoryCard: { background: 'white', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  categoryHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #3498db' },
  categoryName: { fontSize: '1.2rem', fontWeight: 'bold', color: '#2c3e50' },
  itemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #eee' },
  actions: { display: 'flex', gap: '0.25rem' },
  emptyState: { textAlign: 'center', padding: '2rem', color: '#666' }
};

async function apiCall(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { menu, refetch: refetchMenu } = useMenu();
  const { inventory, refetch: refetchInventory, updateStock, toggleAvailability } = useInventory();
  const { summary, popularItems, refetch: refetchAnalytics } = useAnalytics();

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItemForOptions, setSelectedItemForOptions] = useState(null);
  const [editingOption, setEditingOption] = useState(null);

  const [categoryForm, setCategoryForm] = useState({ name: '', sort_order: 0 });
  const [itemForm, setItemForm] = useState({ 
    category_id: '', 
    name: '', 
    description: '', 
    price: '', 
    image_url: '', 
    stock_count: '' 
  });
  const [optionForm, setOptionForm] = useState({ name: '', is_required: false, choices: [] });
  const [newChoice, setNewChoice] = useState({ name: '', price_modifier: 0 });

  const handleToggleAvailability = async (itemId, currentStatus) => {
    try {
      await toggleAvailability(itemId, !currentStatus);
      refetchInventory();
      refetchMenu();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStockUpdate = async (itemId, newStock) => {
    try {
      await updateStock(itemId, parseInt(newStock));
      refetchInventory();
      refetchMenu();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        await apiCall(`/menu/categories/${editingCategory.id}`, {
          method: 'PUT',
          body: JSON.stringify(categoryForm)
        });
      } else {
        await apiCall('/menu/categories', {
          method: 'POST',
          body: JSON.stringify(categoryForm)
        });
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', sort_order: 0 });
      refetchMenu();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Delete this category and all its items?')) return;
    try {
      await apiCall(`/menu/categories/${categoryId}`, { method: 'DELETE' });
      refetchMenu();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveItem = async () => {
    try {
      const data = {
        ...itemForm,
        price: parseFloat(itemForm.price),
        stock_count: itemForm.stock_count === '' ? null : parseInt(itemForm.stock_count)
      };

      if (editingItem) {
        await apiCall(`/menu/items/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      } else {
        await apiCall('/menu/items', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      }
      setShowItemModal(false);
      setEditingItem(null);
      setItemForm({ category_id: '', name: '', description: '', price: '', image_url: '', stock_count: '' });
      refetchMenu();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Delete this item?')) return;
    try {
      await apiCall(`/menu/items/${itemId}`, { method: 'DELETE' });
      refetchMenu();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      category_id: item.category_id,
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      image_url: item.image_url || '',
      stock_count: item.stock_count?.toString() || ''
    });
    setShowItemModal(true);
  };

  const openAddOption = (itemId) => {
    setEditingOption(null);
    setSelectedItemForOptions(itemId);
    setOptionForm({ name: '', is_required: false, choices: [] });
    setNewChoice({ name: '', price_modifier: 0 });
    setShowOptionModal(true);
  };

  const openEditOption = (option) => {
    setEditingOption(option);
    setSelectedItemForOptions(null);
    setOptionForm({
      name: option.name,
      is_required: option.is_required,
      choices: option.choices?.filter(c => c.id) || []
    });
    setNewChoice({ name: '', price_modifier: 0 });
    setShowOptionModal(true);
  };

  const handleDeleteOption = async (optionId) => {
    if (!confirm('Delete this option?')) return;
    try {
      await apiCall(`/menu/options/${optionId}`, { method: 'DELETE' });
      refetchMenu();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveOption = async () => {
    try {
      if (editingOption) {
        await apiCall(`/menu/options/${editingOption.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: optionForm.name,
            is_required: optionForm.is_required
          })
        });
      } else {
        await apiCall(`/menu/items/${selectedItemForOptions}/options`, {
          method: 'POST',
          body: JSON.stringify({
            name: optionForm.name,
            is_required: optionForm.is_required,
            choices: optionForm.choices
          })
        });
      }
      setShowOptionModal(false);
      setEditingOption(null);
      setSelectedItemForOptions(null);
      setOptionForm({ name: '', is_required: false, choices: [] });
      refetchMenu();
    } catch (err) {
      alert(err.message);
    }
  };

  const addChoice = () => {
    if (newChoice.name.trim()) {
      setOptionForm({
        ...optionForm,
        choices: [...optionForm.choices, { ...newChoice }]
      });
      setNewChoice({ name: '', price_modifier: 0 });
    }
  };

  const removeChoice = (index) => {
    setOptionForm({
      ...optionForm,
      choices: optionForm.choices.filter((_, i) => i !== index)
    });
  };

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <button style={styles.navBtn(activeTab === 'dashboard')} onClick={() => setActiveTab('dashboard')}>
          Dashboard
        </button>
        <button style={styles.navBtn(activeTab === 'menu')} onClick={() => setActiveTab('menu')}>
          Menu
        </button>
        <button style={styles.navBtn(activeTab === 'inventory')} onClick={() => setActiveTab('inventory')}>
          Inventory
        </button>
        <button style={styles.navBtn(activeTab === 'analytics')} onClick={() => setActiveTab('analytics')}>
          Analytics
        </button>
      </nav>

      <div style={styles.content}>
        {activeTab === 'dashboard' && (
          <div>
            <h2 style={styles.sectionTitle}>Dashboard</h2>
            <div style={styles.grid}>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{summary?.today_orders || 0}</div>
                <div style={styles.statLabel}>Today's Orders</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>${(summary?.today_revenue || 0).toFixed(2)}</div>
                <div style={styles.statLabel}>Today's Revenue</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{summary?.active_orders || 0}</div>
                <div style={styles.statLabel}>Active Orders</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{summary?.ready_orders || 0}</div>
                <div style={styles.statLabel}>Ready for Pickup</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div>
            <h2 style={styles.sectionTitle}>
              Menu Management
              <button style={styles.btn} onClick={() => {
                setEditingCategory(null);
                setCategoryForm({ name: '', sort_order: 0 });
                setShowCategoryModal(true);
              }}>
                + Add Category
              </button>
            </h2>

            {menu.length === 0 ? (
              <div style={styles.emptyState}>
                No categories yet. Create your first category!
              </div>
            ) : (
              menu.map(category => (
                <div key={category.id} style={styles.categoryCard}>
                  <div style={styles.categoryHeader}>
                    <span style={styles.categoryName}>{category.name}</span>
                    <div style={styles.actions}>
                      <button style={styles.btnSmall} onClick={() => {
                        setEditingItem(null);
                        setItemForm({ ...itemForm, category_id: category.id });
                        setShowItemModal(true);
                      }}>
                        + Add Item
                      </button>
                      <button style={styles.btnSmall} onClick={() => {
                        setEditingCategory(category);
                        setCategoryForm({ name: category.name, sort_order: category.sort_order });
                        setShowCategoryModal(true);
                      }}>
                        Edit
                      </button>
                      <button style={styles.btnDanger} onClick={() => handleDeleteCategory(category.id)}>
                        Delete
                      </button>
                    </div>
                  </div>

                  {category.items.length === 0 ? (
                    <p style={{ color: '#999', padding: '0.5rem' }}>No items in this category</p>
                  ) : (
                    category.items.map(item => (
                      <div key={item.id} style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}>
                        <div style={styles.itemRow}>
                          <div>
                            <strong>{item.name}</strong>
                            {item.description && <div style={{ fontSize: '0.85rem', color: '#666' }}>{item.description}</div>}
                            <div style={{ fontSize: '0.9rem', color: '#27ae60' }}>
                              ${item.price.toFixed(2)}
                              {item.stock_count !== null && ` | Stock: ${item.stock_count}`}
                            </div>
                          </div>
                          <div style={styles.actions}>
                            <button style={styles.btnSmall} onClick={() => openAddOption(item.id)}>
                              + Option
                            </button>
                            <button style={styles.btnSmall} onClick={() => openEditItem(item)}>
                              Edit
                            </button>
                            <button 
                              style={styles.toggle(item.is_available)}
                              onClick={() => handleToggleAvailability(item.id, item.is_available)}
                            >
                              <span style={styles.toggleKnob(item.is_available)} />
                            </button>
                            <button style={styles.btnDanger} onClick={() => handleDeleteItem(item.id)}>
                              Delete
                            </button>
                          </div>
                        </div>
                        
                        {item.options?.length > 0 && (
                          <div style={{ marginLeft: '1rem', marginTop: '0.5rem', padding: '0.5rem', background: '#f9f9f9', borderRadius: '4px' }}>
                            <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem', fontWeight: '600' }}>OPTIONS</div>
                            {item.options.map(option => (
                              <div key={option.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0' }}>
                                <div style={{ fontSize: '0.85rem' }}>
                                  <span style={{ fontWeight: '500' }}>{option.name}</span>
                                  {option.is_required && <span style={{ color: '#e74c3c', fontSize: '0.7rem', marginLeft: '0.25rem' }}>(Required)</span>}
                                  {option.choices?.length > 0 && (
                                    <div style={{ fontSize: '0.75rem', color: '#888', marginLeft: '0.5rem' }}>
                                      {option.choices.map(c => c.is_default ? `${c.name} (default)` : c.name).join(', ')}
                                    </div>
                                  )}
                                </div>
                                <div style={styles.actions}>
                                  <button style={{ ...styles.btnSmall, padding: '0.15rem 0.4rem', fontSize: '0.7rem' }} onClick={() => openEditOption(option)}>
                                    Edit
                                  </button>
                                  <button style={{ ...styles.btnDanger, padding: '0.15rem 0.4rem', fontSize: '0.7rem' }} onClick={() => handleDeleteOption(option.id)}>
                                    X
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div>
            <h2 style={styles.sectionTitle}>Inventory Management</h2>
            <div style={styles.card}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Item</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Stock</th>
                    <th style={styles.th}>Quick Adjust</th>
                    <th style={styles.th}>Available</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(item => (
                    <tr key={item.id}>
                      <td style={styles.td}>{item.name}</td>
                      <td style={styles.td}>{item.category_name}</td>
                      <td style={styles.td}>
                        <span style={styles.stockBadge(item.stock_count)}>
                          {item.stock_count !== null ? item.stock_count : 'Unlimited'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button 
                            style={{ ...styles.btnSmall, background: '#f39c12' }}
                            onClick={() => handleStockUpdate(item.id, Math.max(0, (item.stock_count || 0) - 1))}
                          >
                            -1
                          </button>
                          <button 
                            style={{ ...styles.btnSmall, background: '#27ae60' }}
                            onClick={() => handleStockUpdate(item.id, (item.stock_count || 0) + 1)}
                          >
                            +1
                          </button>
                          <input
                            type="number"
                            style={styles.inputSmall}
                            placeholder="Set"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.target.value) {
                                handleStockUpdate(item.id, parseInt(e.target.value));
                                e.target.value = '';
                              }
                            }}
                          />
                        </div>
                      </td>
                      <td style={styles.td}>
                        <button 
                          style={styles.toggle(item.is_available)}
                          onClick={() => handleToggleAvailability(item.id, item.is_available)}
                        >
                          <span style={styles.toggleKnob(item.is_available)} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <h2 style={styles.sectionTitle}>Popular Items</h2>
            {popularItems.length === 0 ? (
              <div style={styles.emptyState}>No sales data yet</div>
            ) : (
              <div style={styles.card}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Item</th>
                      <th style={styles.th}>Category</th>
                      <th style={styles.th}>Sold</th>
                      <th style={styles.th}>Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {popularItems.map((item, idx) => (
                      <tr key={item.id}>
                        <td style={styles.td}>{idx + 1}</td>
                        <td style={styles.td}>{item.name}</td>
                        <td style={styles.td}>{item.category_name}</td>
                        <td style={styles.td}>{item.total_sold}</td>
                        <td style={styles.td}>{item.order_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {showCategoryModal && (
        <div style={styles.modal} onClick={() => setShowCategoryModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1rem' }}>{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>Name</label>
              <input
                type="text"
                style={styles.input}
                value={categoryForm.name}
                onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Category name"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Sort Order</label>
              <input
                type="number"
                style={styles.input}
                value={categoryForm.sort_order}
                onChange={e => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button style={styles.btnSmall} onClick={() => setShowCategoryModal(false)}>Cancel</button>
              <button style={{ ...styles.btnSmall, background: '#27ae60' }} onClick={handleSaveCategory}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showItemModal && (
        <div style={styles.modal} onClick={() => setShowItemModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1rem' }}>{editingItem ? 'Edit Item' : 'Add Item'}</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>Category</label>
              <select
                style={styles.select}
                value={itemForm.category_id}
                onChange={e => setItemForm({ ...itemForm, category_id: e.target.value })}
              >
                <option value="">Select category</option>
                {menu.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Name</label>
              <input
                type="text"
                style={styles.input}
                value={itemForm.name}
                onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="Item name"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <input
                type="text"
                style={styles.input}
                value={itemForm.description}
                onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Price ($)</label>
              <input
                type="number"
                step="0.01"
                style={styles.input}
                value={itemForm.price}
                onChange={e => setItemForm({ ...itemForm, price: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Stock Count (leave empty for unlimited)</label>
              <input
                type="number"
                style={styles.input}
                value={itemForm.stock_count}
                onChange={e => setItemForm({ ...itemForm, stock_count: e.target.value })}
                placeholder="Unlimited"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Image URL</label>
              <input
                type="text"
                style={styles.input}
                value={itemForm.image_url}
                onChange={e => setItemForm({ ...itemForm, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button style={styles.btnSmall} onClick={() => setShowItemModal(false)}>Cancel</button>
              <button 
                style={{ ...styles.btnSmall, background: '#27ae60' }} 
                onClick={handleSaveItem}
                disabled={!itemForm.category_id || !itemForm.name || !itemForm.price}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showOptionModal && (
        <div style={styles.modal} onClick={() => setShowOptionModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1rem' }}>{editingOption ? 'Edit Option' : 'Add Option'}</h2>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Option Name</label>
              <input
                type="text"
                style={styles.input}
                value={optionForm.name}
                onChange={e => setOptionForm({ ...optionForm, name: e.target.value })}
                placeholder="e.g., Milk Type, Size, Sweetness"
              />
              <small style={{ color: '#666', fontSize: '0.85rem' }}>
                The category name shown to customers (e.g., "What kind of milk?")
              </small>
            </div>
            
            <div style={styles.formGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={optionForm.is_required}
                  onChange={e => setOptionForm({ ...optionForm, is_required: e.target.checked })}
                />
                Required
              </label>
              <small style={{ color: '#666', fontSize: '0.85rem', marginLeft: '1.5rem' }}>
                Customer must select an option before ordering
              </small>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Available Choices</label>
              <small style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>
                Add the specific options customers can choose from. Click the star to set the default selection.
              </small>
              
              {optionForm.choices.length === 0 ? (
                <p style={{ color: '#999', fontStyle: 'italic' }}>No choices added yet</p>
              ) : (
                optionForm.choices.map((choice, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem', alignItems: 'center', padding: '0.5rem', background: choice.is_default ? '#e8f5e9' : 'transparent', borderRadius: '4px' }}>
                    <button 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0', width: '24px', color: choice.is_default ? '#f39c12' : '#ccc' }}
                      onClick={() => setOptionForm({
                        ...optionForm,
                        choices: optionForm.choices.map((c, i) => ({
                          ...c,
                          is_default: i === idx
                        }))
                      })}
                      title="Set as default"
                    >
                      {choice.is_default ? '\u2605' : '\u2606'}
                    </button>
                    <span style={{ flex: 1 }}>{choice.name}</span>
                    {choice.is_default && <span style={{ fontSize: '0.7rem', color: '#27ae60', marginRight: '0.5rem' }}>DEFAULT</span>}
                    <span style={{ color: '#888', minWidth: '60px', textAlign: 'right' }}>
                      {choice.price_modifier > 0 ? `+$${choice.price_modifier.toFixed(2)}` : choice.price_modifier < 0 ? `-$${Math.abs(choice.price_modifier).toFixed(2)}` : 'Free'}
                    </span>
                    <button style={styles.btnDanger} onClick={() => removeChoice(idx)}>X</button>
                  </div>
                ))
              )}
              
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f9f9f9', borderRadius: '4px' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...styles.label, fontSize: '0.85rem' }}>Choice Name</label>
                    <input
                      type="text"
                      style={styles.input}
                      value={newChoice.name}
                      onChange={e => setNewChoice({ ...newChoice, name: e.target.value })}
                      placeholder="e.g., Oat Milk"
                    />
                  </div>
                  <div style={{ width: '100px' }}>
                    <label style={{ ...styles.label, fontSize: '0.85rem' }}>Extra Price</label>
                    <input
                      type="number"
                      step="0.01"
                      style={styles.input}
                      value={newChoice.price_modifier}
                      onChange={e => setNewChoice({ ...newChoice, price_modifier: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <button style={styles.btnSmall} onClick={addChoice}>Add</button>
                </div>
                <small style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginTop: '0.5rem' }}>
                  Enter additional cost (e.g., 0.50 for oat milk). Use 0 for no extra charge.
                </small>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button style={styles.btnSmall} onClick={() => setShowOptionModal(false)}>Cancel</button>
              <button 
                style={{ ...styles.btnSmall, background: '#27ae60' }} 
                onClick={handleSaveOption}
                disabled={!optionForm.name || optionForm.choices.length === 0}
              >
                Save Option
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
