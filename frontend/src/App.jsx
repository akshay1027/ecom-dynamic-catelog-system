import { useState } from 'react';
import { useProducts } from './hooks/useProducts';
import ProductList from './components/ProductList/ProductList';
import SearchFilter from './components/SearchFilter/SearchFilter';

export default function App() {
  const [filters, setFilters] = useState({});
  const { items, total, loading, error } = useProducts(filters);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <aside style={{ width: 280, flexShrink: 0, padding: 24, borderRight: '1px solid #eee', background: '#fafafa' }}>
        <h2 style={{ margin: '0 0 24px' }}>Filters</h2>
        <SearchFilter onFiltersChange={setFilters} />
      </aside>
      <main style={{ flex: 1, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ margin: 0 }}>Product Catalog</h1>
          <span style={{ color: '#666' }}>{total} products</span>
        </div>
        <ProductList products={items} loading={loading} error={error} />
      </main>
    </div>
  );
}
