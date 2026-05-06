const BASE = '/api/v1/products';

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
      params.set(`attributes[${key}]`, val);
    });
  }
  const qs = params.toString();
  return qs ? `${BASE}?${qs}` : BASE;
}

export const productsApi = {
  list: (filters = {}) => fetchJson(buildQuery(filters)),
  getById: (id) => fetchJson(`${BASE}/${id}`),
  create: (data) => fetchJson(BASE, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, patch) => fetchJson(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),
  remove: (id) => fetchJson(`${BASE}/${id}`, { method: 'DELETE' }),
};
