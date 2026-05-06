import ProductCard from '../ProductCard/ProductCard';

export default function ProductList({ products, loading, error }) {
  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>;
  }
  if (error) {
    return <div style={{ color: 'red', padding: 20 }}>{error}</div>;
  }
  if (!products || products.length === 0) {
    return <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>No products found</div>;
  }
  return (
    <div className="product-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
