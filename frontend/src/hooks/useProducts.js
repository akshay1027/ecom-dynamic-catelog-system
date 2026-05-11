import { useState, useEffect } from 'react';
import { productsApi, brandsApi } from '../api/products';

// Module-level cache — persists across component mounts for the app's lifetime
const productCache = new Map();

export function invalidateProductCache() {
  productCache.clear();
}

export function useProducts(filters = {}) {
  const cacheKey = JSON.stringify(filters);

  // Lazy initializers — synchronously read cache so no loading flash on cache hit
  const [items, setItems] = useState(() => productCache.get(cacheKey)?.items || []);
  const [total, setTotal] = useState(() => productCache.get(cacheKey)?.total || 0);
  const [loading, setLoading] = useState(() => !productCache.has(cacheKey));
  const [error, setError] = useState(null);

  useEffect(() => {
    const cached = productCache.get(cacheKey);
    if (cached) {
      setItems(cached.items);
      setTotal(cached.total);
      setLoading(false);
      setError(null);
      return; // no async operation — no cleanup needed
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    productsApi.list(filters, controller.signal)
      .then((data) => {
        const result = { items: data.items || [], total: data.total || 0 };
        productCache.set(cacheKey, result); // only cache successes
        setItems(result.items);
        setTotal(result.total);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return; // request cancelled — ignore silently
        setError(err.message);
        setItems([]);
        setLoading(false);
      });

    return () => { controller.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  return { items, total, loading, error };
}

export function useAttributeSchema({ category } = {}) {
  const [schema, setSchema] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!category) { setSchema({}); return; }
    const controller = new AbortController();
    setLoading(true);
    productsApi.getAttributeSchema({ category }, controller.signal)
      .then(s => { setSchema(s || {}); setLoading(false); })
      .catch(err => {
        if (err.name === 'AbortError') return;
        setSchema({});
        setLoading(false);
      });
    return () => { controller.abort(); };
  }, [category]);

  return { schema, loading };
}

export function useBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    brandsApi.list(controller.signal)
      .then(data => { setBrands(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(err => {
        if (err.name === 'AbortError') return;
        setBrands([]);
        setLoading(false);
      });
    return () => { controller.abort(); };
  }, []);

  return { brands, loading };
}
