import React, { useEffect, useState } from 'react';
import { useReadyOrders } from '../hooks/useApi';

const styles = {
  container: { minHeight: '100vh', background: '#1a1a2e', color: 'white', display: 'flex', flexDirection: 'column' },
  header: { background: '#27ae60', padding: '1.5rem', textAlign: 'center' },
  title: { fontSize: '2rem', fontWeight: 'bold' },
  ordersContainer: { flex: 1, display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', gap: '2rem', padding: '2rem' },
  orderCard: { 
    background: 'white', 
    color: '#1a1a2e', 
    borderRadius: '16px', 
    width: '200px', 
    height: '200px', 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center', 
    justifyContent: 'center',
    animation: 'pulse 2s infinite',
    cursor: 'pointer',
    transition: 'transform 0.2s, opacity 0.2s'
  },
  orderNumber: { fontSize: '3rem', fontWeight: 'bold' },
  pickupBtn: {
    marginTop: '0.5rem',
    padding: '0.5rem 1rem',
    background: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  empty: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#666' },
  loading: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' },
  spinner: { width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: '#27ae60', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '1rem' }
};

export default function PickupDisplay() {
  const { orders, loading, refetch } = useReadyOrders();
  const [pickingUp, setPickingUp] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 1000);
    return () => clearInterval(interval);
  }, [refetch]);

  const handlePickup = async (orderId) => {
    setPickingUp(orderId);
    try {
      await fetch(`/api/orders/${orderId}/pickup`, { method: 'PATCH' });
      refetch();
    } catch (err) {
      console.error('Failed to mark as picked up:', err);
    } finally {
      setPickingUp(null);
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      <div style={styles.header}>
        <h1 style={styles.title}>Ready for Pickup</h1>
      </div>

      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          Loading...
        </div>
      ) : orders.length === 0 ? (
        <div style={styles.empty}>No orders ready</div>
      ) : (
        <div style={styles.ordersContainer}>
          {orders.map(order => (
            <div 
              key={order.id} 
              style={styles.orderCard}
              onClick={() => refetch()}
            >
              <span style={styles.orderNumber}>#{order.order_number}</span>
              <button 
                style={styles.pickupBtn}
                onClick={(e) => { e.stopPropagation(); handlePickup(order.id); }}
                disabled={pickingUp === order.id}
              >
                {pickingUp === order.id ? '...' : 'PICKED UP'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
