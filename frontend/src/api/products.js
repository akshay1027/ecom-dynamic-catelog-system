const BASE = '/api/v1/products';
const BRANDS_BASE = '/api/v1/brands';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await res.json();
  if (!body.success) {
    const err = new Error(body.error?.message || 'API error');
    err.code = body.error?.code;
    err.status = res.status;
    throw err;
  }
  return body.data;
}

function buildQuery(filters) {
  const params = new URLSearchParams();
  const { attributes, ...rest } = filters;
  Object.entries(rest).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      params.set(key, val);
    }
  });
  if (attributes && typeof attributes === 'object') {
    Object.entries(attributes).forEach(([key, val]) => {
      if (val === undefined || val === null) return;
      if (Array.isArray(val) && val.length > 0) {
        val.forEach(v => params.append(`attributes[${key}][]`, v));
      } else if (typeof val === 'object' && (val.min !== undefined || val.max !== undefined)) {
        if (val.min !== undefined && val.min !== '') params.set(`attributes[${key}][min]`, val.min);
        if (val.max !== undefined && val.max !== '') params.set(`attributes[${key}][max]`, val.max);
      } else if (typeof val === 'boolean') {
        params.set(`attributes[${key}]`, val);
      } else if (typeof val !== 'object' && val !== '') {
        params.set(`attributes[${key}]`, val);
      }
    });
  }
  const qs = params.toString();
  return qs ? `${BASE}?${qs}` : BASE;
}

export const productsApi = {
  list: (filters = {}, signal) => fetchJson(buildQuery(filters), { signal }),
  getById: (id) => fetchJson(`${BASE}/${id}`),
  create: (data) => fetchJson(BASE, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, patch) => fetchJson(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),
  remove: (id) => fetchJson(`${BASE}/${id}`, { method: 'DELETE' }),
  getAttributeSchema: (filters = {}, signal) => {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    const qs = params.toString();
    return fetchJson(qs ? `${BASE}/attributes/schema?${qs}` : `${BASE}/attributes/schema`, { signal });
  },
  addVariant: (productId, variantData) =>
    fetchJson(`${BASE}/${productId}/variants`, { method: 'POST', body: JSON.stringify(variantData) }),
  updateVariant: (productId, variantId, patch) =>
    fetchJson(`${BASE}/${productId}/variants/${variantId}`, { method: 'PUT', body: JSON.stringify(patch) }),
  removeVariant: (productId, variantId) =>
    fetchJson(`${BASE}/${productId}/variants/${variantId}`, { method: 'DELETE' }),
};

export const brandsApi = {
  list: (signal) => fetchJson(BRANDS_BASE, { signal }),
};
