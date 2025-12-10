const STORAGE_KEY = "marvella:orders";

const safeParse = (value) => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Failed to parse orders from storage", err);
    return [];
  }
};

const persist = (orders) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (err) {
    console.warn("Failed to persist orders", err);
  }
};

export const readOrders = () => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? safeParse(raw) : [];
};

export const generateOrderNumber = () => {
  const now = Date.now().toString(36).toUpperCase();
  return `ORD-${now}`;
};

export const addOrder = (order) => {
  const existing = readOrders();
  const nextOrders = [
    {
      ...order,
      id: order.id || order.number || generateOrderNumber(),
      number: order.number || order.id || generateOrderNumber(),
      createdAt: order.createdAt || new Date().toISOString(),
    },
    ...existing,
  ];
  persist(nextOrders);
  return nextOrders;
};

export const updateOrderStatus = (orderId, status) => {
  const existing = readOrders();
  const nextOrders = existing.map((order) =>
    order.id === orderId || order.number === orderId
      ? { ...order, status, updatedAt: new Date().toISOString() }
      : order
  );
  persist(nextOrders);
  return nextOrders;
};

export const clearOrders = () => {
  persist([]);
};
