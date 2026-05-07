import { useState } from 'react';
import { useProducts, useBrands, useAttributeSchema } from '../hooks/useProducts';
import ProductList from '../components/ProductList/ProductList';
import SearchFilter from '../components/SearchFilter/SearchFilter';
import ProductDetail from '../components/ProductDetail/ProductDetail';
import './CatalogPage.css';

export default function CatalogPage() {
  const [filters, setFilters] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { items, total, loading, error } = useProducts(filters);
  const { brands } = useBrands();
  const { schema: attributeSchema } = useAttributeSchema({ category: filters.category });

  return (
    <div className="catalog-layout">
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
          attributeSchema={attributeSchema}
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
