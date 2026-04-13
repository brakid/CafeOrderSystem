import React, { useState, useEffect } from 'react';
import { useKitchen } from '../hooks/useApi';

  const styles = {
    container: { minHeight: '100vh', background: '#1a1a2e', color: 'white', padding: '1rem' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '1rem', background: '#16213e', borderRadius: '8px' },
    title: { fontSize: '1.5rem', fontWeight: 'bold' },
    stats: { display: 'flex', gap: '1rem' },
    stat: { background: '#0f3460', padding: '0.5rem 1rem', borderRadius: '8px', textAlign: 'center' },
    statValue: { fontSize: '1.5rem', fontWeight: 'bold', color: '#e94560' },
    statLabel: { fontSize: '0.75rem', color: '#888' },
    viewToggle: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
    toggleBtn: (active) => ({ 
      padding: '0.75rem 1.5rem', 
      border: 'none', 
      borderRadius: '8px',
      cursor: 'pointer',
      background: active ? '#e94560' : '#16213e',
      color: 'white',
      fontWeight: active ? 'bold' : 'normal'
    }),
    orderGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' },
    orderCard: (status) => ({ 
      background: status === 'pending' ? '#e94560' : '#16213e',
      borderRadius: '12px',
      overflow: 'hidden',
      animation: 'fadeIn 0.3s ease'
    }),
    orderHeader: { padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' },
    orderNumber: { fontSize: '2rem', fontWeight: 'bold' },
    orderMeta: { textAlign: 'right', fontSize: '0.85rem', color: '#aaa' },
    channel: { display: 'inline-block', padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', marginBottom: '0.25rem' },
    orderItems: { padding: '1rem' },
    orderItem: { padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' },
    itemQty: { fontWeight: 'bold', color: '#e94560' },
    itemOptions: { fontSize: '0.85rem', color: '#aaa', marginLeft: '1rem' },
    orderActions: { padding: '1rem', display: 'flex', gap: '0.5rem' },
    actionBtn: (variant) => ({ 
      flex: 1, 
      padding: '0.75rem', 
      border: 'none', 
      borderRadius: '8px', 
      cursor: 'pointer',
      fontWeight: 'bold',
      background: variant === 'primary' ? '#27ae60' : '#e94560',
      color: 'white'
    }),
    groupedView: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' },
    groupedCard: { background: '#16213e', borderRadius: '12px', padding: '1rem' },
    groupedItem: { fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' },
    groupedQty: { color: '#e94560', fontSize: '1.5rem', fontWeight: 'bold' },
    groupedOrders: { fontSize: '0.85rem', color: '#888', marginTop: '0.5rem' },
    empty: { textAlign: 'center', padding: '3rem', color: '#666', fontSize: '1.2rem' },
    loading: { textAlign: 'center', padding: '3rem', fontSize: '1.5rem' },
    spinner: { display: 'inline-block', width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: '#e94560', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '1rem' }
  };

export default function KitchenDisplay() {
  const { orders, stats, loading, refetch, fetchStats, startOrder, completeOrder } = useKitchen();
  const [viewMode, setViewMode] = useState('orders');
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
      fetchStats();
    }, 1000);
    return () => clearInterval(interval);
  }, [refetch, fetchStats]);

  const handleStart = async (orderId) => {
    setError(null);
    setActionLoading(orderId);
    try {
      await startOrder(orderId);
      refetch();
      fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (orderId) => {
    setError(null);
    setActionLoading(orderId);
    try {
      await completeOrder(orderId);
      refetch();
      fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const groupedItems = React.useMemo(() => {
    const groups = {};
    orders.forEach(order => {
      order.items?.forEach(item => {
        const key = item.name;
        if (!groups[key]) {
          groups[key] = { name: item.name, total: 0, orders: [] };
        }
        groups[key].total += item.quantity;
        groups[key].orders.push({
          orderNumber: order.order_number,
          quantity: item.quantity
        });
      });
    });
    return Object.values(groups);
  }, [orders]);

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      
      <div style={styles.header}>
        <h1 style={styles.title}>Kitchen Display</h1>
        <div style={styles.stats}>
          <div style={styles.stat}>
            <div style={styles.statValue}>{stats?.pending_count || 0}</div>
            <div style={styles.statLabel}>PENDING</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statValue}>{stats?.preparing_count || 0}</div>
            <div style={styles.statLabel}>PREPARING</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statValue}>{stats?.avg_prep_time_minutes || 0}</div>
            <div style={styles.statLabel}>AVG MINS</div>
          </div>
        </div>
      </div>

      <div style={styles.viewToggle}>
        <button style={styles.toggleBtn(viewMode === 'orders')} onClick={() => setViewMode('orders')}>
          By Order
        </button>
        <button style={styles.toggleBtn(viewMode === 'grouped')} onClick={() => setViewMode('grouped')}>
          By Item
        </button>
      </div>

      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div style={styles.empty}>No active orders. Waiting for new orders...</div>
      ) : viewMode === 'orders' ? (
        <div style={styles.orderGrid}>
          {orders.map(order => (
            <div 
              key={order.id} 
              style={styles.orderCard(order.status)}
              onClick={() => { refetch(); fetchStats(); }}
            >
              <div style={styles.orderHeader}>
                <span style={styles.orderNumber}>#{order.order_number}</span>
                <div style={styles.orderMeta}>
                  <span style={styles.channel}>{order.channel.toUpperCase()}</span>
                  <div>{Math.round((Date.now() - new Date(order.created_at)) / 60000)}m ago</div>
                </div>
              </div>
              <div style={styles.orderItems}>
                {order.items?.map((item, idx) => (
                  <div key={idx} style={styles.orderItem}>
                    <span style={styles.itemQty}>{item.quantity}x</span> {item.name}
                    {item.options && item.options.length > 0 && (
                      <div style={styles.itemOptions}>
                        {item.options.filter(o => o.choice_name).map((opt, i) => (
                          <span key={i}>• {opt.choice_name} </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={styles.orderActions}>
                {order.status === 'pending' && (
                  <button 
                    style={{ ...styles.actionBtn('primary'), opacity: actionLoading === order.id ? 0.7 : 1 }}
                    onClick={() => handleStart(order.id)}
                    disabled={actionLoading === order.id}
                  >
                    {actionLoading === order.id ? '...' : 'START'}
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button 
                    style={{ ...styles.actionBtn('secondary'), opacity: actionLoading === order.id ? 0.7 : 1 }}
                    onClick={() => handleComplete(order.id)}
                    disabled={actionLoading === order.id}
                  >
                    {actionLoading === order.id ? '...' : 'READY'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.groupedView}>
          {groupedItems.map((group, idx) => (
            <div key={idx} style={styles.groupedCard}>
              <div style={styles.groupedItem}>{group.name}</div>
              <div style={styles.groupedQty}>{group.total}x</div>
              <div style={styles.groupedOrders}>
                {group.orders.map((o, i) => (
                  <div key={i}>#{o.orderNumber}: {o.quantity}x</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
