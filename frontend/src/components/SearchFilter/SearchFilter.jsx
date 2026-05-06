import { useState } from 'react';
import './SearchFilter.css';

const CATEGORIES = ['', 'apparel', 'furniture', 'electronics'];

export default function SearchFilter({ onFiltersChange, brands }) {
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
    <div className="search-filter">
      <div className="search-filter__group">
        <input
          className="search-filter__input"
          type="text"
          placeholder="Search products..."
          value={filters.name || ''}
          onChange={e => update({ name: e.target.value })}
        />
      </div>
      <div className="search-filter__group">
        <label className="search-filter__label" htmlFor="category-select">Category</label>
        <select
          className="search-filter__select"
          id="category-select"
          value={filters.category || ''}
          onChange={e => update({ category: e.target.value })}
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c === '' ? 'All categories' : c}</option>
          ))}
        </select>
      </div>
      <div className="search-filter__group">
        <label className="search-filter__label" htmlFor="min-price">Min Price</label>
        <input
          className="search-filter__input"
          id="min-price"
          type="number"
          min="0"
          value={filters.minPrice || ''}
          onChange={e => update({ minPrice: e.target.value })}
        />
      </div>
      <div className="search-filter__group">
        <label className="search-filter__label" htmlFor="max-price">Max Price</label>
        <input
          className="search-filter__input"
          id="max-price"
          type="number"
          min="0"
          value={filters.maxPrice || ''}
          onChange={e => update({ maxPrice: e.target.value })}
        />
      </div>
      {brands && brands.length > 0 && (
        <div className="search-filter__group">
          <label htmlFor="brand-select" className="search-filter__label">Brand</label>
          <select
            id="brand-select"
            className="search-filter__select"
            value={filters.brandId || ''}
            onChange={e => update({ brandId: e.target.value })}
          >
            <option value="">All brands</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}
      <button className="search-filter__reset" onClick={handleReset}>Reset</button>
    </div>
  );
}
