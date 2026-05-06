import { useState } from 'react';
import { useProducts, useBrands } from './hooks/useProducts';
import ProductList from './components/ProductList/ProductList';
import SearchFilter from './components/SearchFilter/SearchFilter';
import ProductDetail from './components/ProductDetail/ProductDetail';
import './App.css';

export default function App() {
  const [filters, setFilters] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { items, total, loading, error } = useProducts(filters);
  const { brands } = useBrands();

  return (
    <div className="app-layout">
      <div
        className={`drawer-overlay ${drawerOpen ? 'visible' : ''}`}
        onClick={() => setDrawerOpen(false)}
      />

      <aside className={`app-sidebar ${drawerOpen ? 'open' : ''}`}>
        <h2 style={{ margin: '0 0 24px', color: 'var(--color-text)' }}>Filters</h2>
        <SearchFilter
          onFiltersChange={setFilters}
          brands={brands}
          onClose={() => setDrawerOpen(false)}
        />
      </aside>

      <main className="app-main">
        <div className="app-header">
          <h1>Product Catalog</h1>
          <span className="count">{total} products</span>
          <button className="filter-toggle" onClick={() => setDrawerOpen(true)}>
            &#8801; Filters
          </button>
        </div>
        <ProductList
          products={items}
          loading={loading}
          error={error}
          onProductClick={setSelectedProduct}
        />
      </main>

      {selectedProduct && (
        <ProductDetail product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}
