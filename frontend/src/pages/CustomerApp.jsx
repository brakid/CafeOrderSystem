import React, { useState, useEffect, useRef } from 'react';
import { useMenu, useOrders } from '../hooks/useApi';

const styles = {
  container: { minHeight: '100vh', background: '#f5f5f5' },
  header: { background: '#2c3e50', color: 'white', padding: '1rem', textAlign: 'center' },
  categories: { display: 'flex', gap: '0.5rem', padding: '1rem', overflowX: 'auto', background: 'white', borderBottom: '1px solid #ddd' },
  categoryBtn: (active) => ({ 
    padding: '0.5rem 1rem', 
    border: 'none', 
    borderRadius: '20px',
    cursor: 'pointer',
    background: active ? '#2c3e50' : '#e0e0e0',
    color: active ? 'white' : '#333',
    whiteSpace: 'nowrap'
  }),
  menuGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', padding: '1rem' },
  menuItem: { background: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  itemName: { fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem' },
  itemDesc: { color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' },
  itemPrice: { fontWeight: '600', color: '#27ae60' },
  addBtn: { width: '100%', padding: '0.75rem', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' },
  outOfStock: { background: '#e0e0e0', color: '#999', cursor: 'not-allowed' },
  cart: { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', padding: '1rem', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)' },
  cartBtn: { width: '100%', padding: '1rem', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalContent: { background: 'white', borderRadius: '12px', padding: '1.5rem', maxWidth: '400px', width: '90%', maxHeight: '80vh', overflowY: 'auto' },
  optionGroup: { marginBottom: '1rem' },
  optionLabel: { fontWeight: '600', marginBottom: '0.5rem', display: 'block' },
  optionChoice: (selected) => ({ 
    display: 'block',
    width: '100%',
    padding: '0.5rem',
    marginBottom: '0.25rem',
    border: `2px solid ${selected ? '#27ae60' : '#ddd'}`,
    borderRadius: '8px',
    background: selected ? '#e8f5e9' : 'white',
    cursor: 'pointer',
    textAlign: 'left'
  }),
  confirmBtn: { width: '100%', padding: '1rem', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' },
  orderSuccess: { textAlign: 'center', padding: '2rem' },
  orderNumber: { fontSize: '3rem', fontWeight: 'bold', color: '#2c3e50', margin: '1rem 0' },
  waitingMsg: { color: '#666', marginTop: '1rem' },
  readyBanner: { background: '#27ae60', color: 'white', padding: '1rem', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem' }
};

export default function CustomerApp() {
  const { menu, loading, refetch } = useMenu();
  const { createOrder } = useOrders();
  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [orderResult, setOrderResult] = useState(null);
  const [myOrderId, setMyOrderId] = useState(null);
  const [orderReady, setOrderReady] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [myOrderStatus, setMyOrderStatus] = useState(null);

  useEffect(() => {
    if (menu.length > 0 && !activeCategory) {
      setActiveCategory(menu[0].id);
    }
  }, [menu, activeCategory]);

  useEffect(() => {
    if (!myOrderId || orderReady) return;
    
    const checkOrderStatus = async () => {
      try {
        const res = await fetch(`/api/orders/${myOrderId}`);
        if (res.ok) {
          const order = await res.json();
          setMyOrderStatus(order.status);
          if (order.status === 'ready') {
            setOrderReady(true);
          }
        }
      } catch (e) {
        console.error('Failed to check order status');
      }
    };
    
    checkOrderStatus();
    const interval = setInterval(checkOrderStatus, 2000);
    return () => clearInterval(interval);
  }, [myOrderId, orderReady]);

  const activeMenuItems = menu.find(c => c.id === activeCategory)?.items || [];

  const handleAddToCart = (item) => {
    if (!item.is_available) return;
    
    const defaultOptions = {};
    if (item.options) {
      item.options.forEach(opt => {
        const defaultChoice = opt.choices?.find(c => c.is_default);
        if (defaultChoice) {
          defaultOptions[opt.id] = defaultChoice.id;
        }
      });
    }
    
    setSelectedItem(item);
    setSelectedOptions(defaultOptions);
  };

  const handleConfirmAdd = () => {
    const cartItem = {
      id: Date.now(),
      menu_item_id: selectedItem.id,
      name: selectedItem.name,
      quantity: 1,
      option_ids: Object.values(selectedOptions).filter(Boolean),
      unit_price: selectedItem.price
    };
    
    if (selectedItem.options) {
      selectedItem.options.forEach(opt => {
        if (opt.is_required && !selectedOptions[opt.id]) {
          alert(`Please select ${opt.name}`);
          return;
        }
      });
    }

    setCart([...cart, cartItem]);
    setSelectedItem(null);
  };

  const handlePlaceOrder = async () => {
    try {
      const orderData = {
        channel: 'web',
        items: cart.map(item => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          option_ids: item.option_ids
        }))
      };
      
      const result = await createOrder(orderData);
      setOrderResult(result);
      setMyOrderId(result.id);
      setOrderReady(false);
      setCart([]);
      setShowCart(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (orderResult) {
    return (
      <div style={styles.container}>
        {orderReady && (
          <div style={styles.readyBanner}>
            Your Order #{orderResult.order_number} is Ready for Pickup!
          </div>
        )}
        <div style={styles.header}>
          <h1>Cafe Ordering</h1>
        </div>
        <div style={styles.orderSuccess}>
          <h2>{orderReady ? 'Order Ready!' : 'Order Placed!'}</h2>
          <div style={styles.orderNumber}>#{orderResult.order_number}</div>
          <p>Total: ${orderResult.total_amount.toFixed(2)}</p>
          {!orderReady && <p style={styles.waitingMsg}>We'll notify you when your order is ready for pickup.</p>}
          <button 
            style={{ ...styles.addBtn, marginTop: '1rem'}}
            onClick={() => { setOrderResult(null); setMyOrderId(null); setOrderReady(false); }}
          >
            Place Another Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Cafe Ordering</h1>
      </div>

      <div style={styles.categories}>
        {menu.map(cat => (
          <button
            key={cat.id}
            style={styles.categoryBtn(activeCategory === cat.id)}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div style={styles.menuGrid}>
        {activeMenuItems.map(item => (
          <div key={item.id} style={styles.menuItem}>
            <div style={styles.itemName}>{item.name}</div>
            <div style={styles.itemDesc}>{item.description}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={styles.itemPrice}>${item.price.toFixed(2)}</span>
              {item.stock_count !== null && (
                <span style={{ fontSize: '0.8rem', color: item.stock_count <= 5 ? '#e74c3c' : '#666' }}>
                  {item.stock_count} left
                </span>
              )}
            </div>
            <button
              style={{ ...styles.addBtn, ...(item.is_available ? {} : styles.outOfStock) }}
              onClick={() => handleAddToCart(item)}
              disabled={!item.is_available}
            >
              {item.is_available ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        ))}
      </div>

      {cartCount > 0 && (
        <div style={styles.cart}>
          <button style={styles.cartBtn} onClick={() => setShowCart(true)}>
            View Cart ({cartCount}) - ${cartTotal.toFixed(2)}
          </button>
        </div>
      )}

      {selectedItem && (
        <div style={styles.modal} onClick={() => setSelectedItem(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1rem' }}>{selectedItem.name}</h2>
            <p style={{ marginBottom: '1rem', color: '#666' }}>{selectedItem.description}</p>
            
            {selectedItem.options?.map(option => (
              <div key={option.id} style={styles.optionGroup}>
                <span style={styles.optionLabel}>
                  {option.name} {option.is_required && '*'}
                </span>
                {option.choices?.map(choice => (
                  <button
                    key={choice.id}
                    style={styles.optionChoice(selectedOptions[option.id] === choice.id)}
                    onClick={() => setSelectedOptions({ ...selectedOptions, [option.id]: choice.id })}
                  >
                    {choice.name} {choice.is_default && '(default)'}{' '}
                    {choice.price_modifier > 0 && `(+$${choice.price_modifier.toFixed(2)})`}
                  </button>
                ))}
              </div>
            ))}

            <button style={styles.confirmBtn} onClick={handleConfirmAdd}>
              Add to Cart - ${selectedItem.price.toFixed(2)}
            </button>
          </div>
        </div>
      )}

      {showCart && (
        <div style={styles.modal} onClick={() => setShowCart(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1rem' }}>Your Cart</h2>
            {cart.map(item => (
              <div key={item.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.name}</span>
                  <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                </div>
                <button 
                  style={{ fontSize: '0.8rem', color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => setCart(cart.filter(c => c.id !== item.id))}
                >
                  Remove
                </button>
              </div>
            ))}
            <div style={{ marginTop: '1rem', fontWeight: 'bold', fontSize: '1.2rem' }}>
              Total: ${cartTotal.toFixed(2)}
            </div>
            <button style={{ ...styles.confirmBtn, marginTop: '1rem' }} onClick={handlePlaceOrder}>
              Place Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
