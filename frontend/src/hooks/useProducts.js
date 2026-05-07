import { useState, useEffect } from 'react';
import { productsApi, brandsApi } from '../api/products';

export function useProducts(filters = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    productsApi.list(filters)
      .then((data) => {
        if (!cancelled) {
          setItems(data.items || []);
          setTotal(data.total || 0);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setItems([]);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  return { items, total, loading, error };
}

export function useAttributeSchema({ category } = {}) {
  const [schema, setSchema] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!category) { setSchema({}); return; }
    let cancelled = false;
    setLoading(true);
    productsApi.getAttributeSchema({ category })
      .then(schema => { if (!cancelled) setSchema(schema || {}); })
      .catch(() => { if (!cancelled) setSchema({}); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [category]);

  return { schema, loading };
}

export function useBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    brandsApi.list()
      .then(data => { setBrands(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setBrands([]); setLoading(false); });
  }, []);

  return { brands, loading };
}
