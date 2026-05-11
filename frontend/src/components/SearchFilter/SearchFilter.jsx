import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import AttributeFilters from '../AttributeFilters/AttributeFilters';
import './SearchFilter.css';

const CATEGORIES = ['', 'apparel', 'furniture', 'electronics'];

export default function SearchFilter({ onFiltersChange, brands, onClose, attributeSchema = {} }) {
  // Raw text/number inputs — updated on every keystroke, debounced before propagating
  const [rawName, setRawName] = useState('');
  const [rawMinPrice, setRawMinPrice] = useState('');
  const [rawMaxPrice, setRawMaxPrice] = useState('');

  // Discrete controls — propagate immediately (no debounce needed)
  const [category, setCategory] = useState('');
  const [brandId, setBrandId] = useState('');
  const [attributes, setAttributes] = useState({});

  const debouncedName = useDebounce(rawName, 300);
  const debouncedMinPrice = useDebounce(rawMinPrice, 300);
  const debouncedMaxPrice = useDebounce(rawMaxPrice, 300);

  // Skip the initial mount — only propagate on actual user changes
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const next = {};
    if (debouncedName) next.name = debouncedName;
    if (category) next.category = category;
    if (debouncedMinPrice) next.minPrice = debouncedMinPrice;
    if (debouncedMaxPrice) next.maxPrice = debouncedMaxPrice;
    if (brandId) next.brandId = brandId;
    if (Object.keys(attributes).length > 0) next.attributes = attributes;
    onFiltersChange(next);
  // onFiltersChange is setFilters from parent useState — stable reference
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedName, debouncedMinPrice, debouncedMaxPrice, category, brandId, attributes]);

  function handleCategoryChange(newCategory) {
    setCategory(newCategory);
    setAttributes({}); // reset attribute filters when category changes
  }

  function handleReset() {
    setRawName('');
    setRawMinPrice('');
    setRawMaxPrice('');
    setCategory('');
    setBrandId('');
    setAttributes({});
    onFiltersChange({}); // fire immediately — don't wait for debounce timers to settle
  }

  return (
    <div className="search-filter">
      {onClose && (
        <div className="search-filter__header">
          <span className="search-filter__title">Filters</span>
          <button
            className="search-filter__close"
            onClick={onClose}
            aria-label="Close panel"
          >
            &times;
          </button>
        </div>
      )}
      <div className="search-filter__group">
        <input
          className="search-filter__input"
          type="text"
          placeholder="Search products..."
          value={rawName}
          onChange={e => setRawName(e.target.value)}
        />
      </div>
      <div className="search-filter__group">
        <label className="search-filter__label" htmlFor="category-select">Category</label>
        <select
          className="search-filter__select"
          id="category-select"
          value={category}
          onChange={e => handleCategoryChange(e.target.value)}
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
          value={rawMinPrice}
          onChange={e => setRawMinPrice(e.target.value)}
        />
      </div>
      <div className="search-filter__group">
        <label className="search-filter__label" htmlFor="max-price">Max Price</label>
        <input
          className="search-filter__input"
          id="max-price"
          type="number"
          min="0"
          value={rawMaxPrice}
          onChange={e => setRawMaxPrice(e.target.value)}
        />
      </div>
      {brands && brands.length > 0 && (
        <div className="search-filter__group">
          <label htmlFor="brand-select" className="search-filter__label">Brand</label>
          <select
            id="brand-select"
            className="search-filter__select"
            value={brandId}
            onChange={e => setBrandId(e.target.value)}
          >
            <option value="">All brands</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}
      {Object.keys(attributeSchema).length > 0 && (
        <AttributeFilters
          schema={attributeSchema}
          value={attributes}
          onChange={setAttributes}
        />
      )}
      <button className="search-filter__reset" onClick={handleReset}>Reset</button>
    </div>
  );
}
