import { useEffect, useState } from "react";

const API_BASE = (import.meta.env.VITE_APP_BACKEND_URL || "").trim().replace(/\/+$/, "");

const cache = {
  data: null,
  error: null,
  promise: null,
};

const normalizeItems = (payload) => {
  const items = Array.isArray(payload) ? payload : payload?.data;
  return Array.isArray(items) ? items : [];
};

export function useProductsCatalog() {
  const [products, setProducts] = useState(() => cache.data || []);
  const [loading, setLoading] = useState(Boolean(API_BASE && !cache.data));
  const [error, setError] = useState(cache.error || "");

  useEffect(() => {
    if (!API_BASE) {
      setLoading(false);
      setError("Backend URL not configured");
      return;
    }
    if (cache.data) return;
    if (cache.promise) {
      cache.promise.then(setProducts).catch((err) => setError(err?.message || "Failed to load products"));
      return;
    }

    const fetcher = fetch(`${API_BASE}/products`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load products");
        const payload = await res.json();
        const items = normalizeItems(payload);
        cache.data = items;
        return items;
      })
      .catch((err) => {
        cache.error = err?.message || "Failed to load products";
        throw err;
      });

    cache.promise = fetcher;

    fetcher
      .then((items) => setProducts(items))
      .catch((err) => setError(err?.message || "Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  return { products, loading, error };
}

export default useProductsCatalog;
