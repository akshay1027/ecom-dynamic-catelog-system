import { useState } from 'react';

const CATEGORIES = ['', 'apparel', 'furniture', 'electronics'];

export default function SearchFilter({ onFiltersChange }) {
  const [filters, setFilters] = useState({});

  function update(patch) {
    const next = { ...filters, ...patch };
    // Remove empty values
    Object.keys(next).forEach(k => {
      if (next[k] === '' || next[k] === undefined) delete next[k];
    });
    setFilters(next);
    onFiltersChange(next);
  }

  function handleReset() {
    setFilters({});
    onFiltersChange({});
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <input
          type="text"
          placeholder="Search products..."
          value={filters.name || ''}
          onChange={e => update({ name: e.target.value })}
          style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
        />
      </div>
      <div>
        <label htmlFor="category-select" style={{ display: 'block', marginBottom: 4 }}>Category</label>
        <select
          id="category-select"
          value={filters.category || ''}
          onChange={e => update({ category: e.target.value })}
          style={{ width: '100%', padding: 8 }}
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c === '' ? 'All categories' : c}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="min-price" style={{ display: 'block', marginBottom: 4 }}>Min Price</label>
        <input
          id="min-price"
          type="number"
          min="0"
          value={filters.minPrice || ''}
          onChange={e => update({ minPrice: e.target.value })}
          style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
        />
      </div>
      <div>
        <label htmlFor="max-price" style={{ display: 'block', marginBottom: 4 }}>Max Price</label>
        <input
          id="max-price"
          type="number"
          min="0"
          value={filters.maxPrice || ''}
          onChange={e => update({ maxPrice: e.target.value })}
          style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
        />
      </div>
      <button onClick={handleReset} style={{ padding: 8, cursor: 'pointer' }}>Reset</button>
    </div>
  );
}
