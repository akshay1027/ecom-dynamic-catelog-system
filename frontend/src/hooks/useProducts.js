import { useState, useEffect } from 'react';
import { productsApi } from '../api/products';

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
