import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = '/api';

const toNumber = (val) => {
  if (val === null || val === undefined) return val;
  const num = parseFloat(val);
  return isNaN(num) ? val : num;
};

const convertPrices = (data) => {
  if (Array.isArray(data)) {
    return data.map(convertPrices);
  }
  if (data && typeof data === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === 'price' || key === 'total_amount' || key === 'unit_price' || 
          key === 'price_modifier' || key === 'revenue' || key === 'avg_order_value' ||
          key === 'today_revenue' || key === 'week_revenue') {
        result[key] = toNumber(value);
      } else if (Array.isArray(value)) {
        result[key] = value.map(convertPrices);
      } else if (value && typeof value === 'object') {
        result[key] = convertPrices(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
  return data;
};

async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  
  const data = await response.json();
  return convertPrices(data);
}

export function useMenu() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/menu');
      setMenu(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  return { menu, loading, error, refetch: fetchMenu };
}

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchRef = useRef(false);

  const fetchOrders = useCallback(async () => {
    if (fetchRef.current) return;
    fetchRef.current = true;
    
    try {
      const data = await fetchAPI('/orders/active');
      setOrders(data);
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const createOrder = async (orderData) => {
    return fetchAPI('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  };

  return { orders, loading, refetch: fetchOrders, createOrder };
}

export function useReadyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchRef = useRef(false);

  const fetchOrders = useCallback(async () => {
    if (fetchRef.current) return;
    fetchRef.current = true;
    
    try {
      const data = await fetchAPI('/orders/ready');
      setOrders(data);
    } catch (err) {
      console.error('Fetch ready orders error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    try {
      const data = await fetchAPI('/orders/ready');
      setOrders(data);
    } catch (err) {
      console.error('Refetch ready orders error:', err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, refetch };
}

export function useKitchen() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const fetchRef = useRef(false);

  const fetchOrders = useCallback(async () => {
    if (fetchRef.current) return;
    fetchRef.current = true;
    
    try {
      const data = await fetchAPI('/kitchen/orders');
      setOrders(data);
      setInitialLoadComplete(true);
    } catch (err) {
      console.error('Fetch kitchen orders error:', err);
      setInitialLoadComplete(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    try {
      const data = await fetchAPI('/kitchen/orders');
      setOrders(data);
    } catch (err) {
      console.error('Refetch orders error:', err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await fetchAPI('/kitchen/stats');
      setStats(data);
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [fetchOrders, fetchStats]);

  const startOrder = async (orderId) => {
    return fetchAPI(`/kitchen/orders/${orderId}/start`, { method: 'PATCH' });
  };

  const completeOrder = async (orderId) => {
    return fetchAPI(`/kitchen/orders/${orderId}/complete`, { method: 'PATCH' });
  };

  return { orders, stats, loading, initialLoadComplete, refetch, fetchStats, startOrder, completeOrder };
}

export function useInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/inventory');
      setInventory(data);
    } catch (err) {
      console.error('Fetch inventory error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const updateStock = async (itemId, stockCount) => {
    return fetchAPI(`/inventory/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ stock_count: stockCount })
    });
  };

  const adjustStock = async (itemId, adjustment) => {
    return fetchAPI(`/inventory/items/${itemId}/adjust`, {
      method: 'PATCH',
      body: JSON.stringify({ adjustment })
    });
  };

  const toggleAvailability = async (itemId, isAvailable) => {
    return fetchAPI(`/menu/items/${itemId}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ is_available: isAvailable })
    });
  };

  return { inventory, loading, refetch: fetchInventory, updateStock, adjustStock, toggleAvailability };
}

export function useAnalytics() {
  const [summary, setSummary] = useState(null);
  const [popularItems, setPopularItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryData, itemsData] = await Promise.all([
        fetchAPI('/analytics/summary'),
        fetchAPI('/analytics/items')
      ]);
      setSummary(summaryData);
      setPopularItems(itemsData);
    } catch (err) {
      console.error('Fetch analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { summary, popularItems, loading, refetch: fetchAnalytics };
}
