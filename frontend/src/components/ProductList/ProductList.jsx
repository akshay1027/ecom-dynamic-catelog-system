import './ProductList.css';
import ProductCard from '../ProductCard/ProductCard';

export default function ProductList({ products, loading, error, onProductClick }) {
  if (loading) {
    return <div className="product-list__loading">Loading...</div>;
  }
  if (error) {
    return <div className="product-list__error">{error}</div>;
  }
  if (!products || products.length === 0) {
    return <div className="product-list__empty">No products found</div>;
  }
  return (
    <div className="product-list">
      {products.map(product => (
        <ProductCard key={product.id} product={product} onClick={onProductClick} />
      ))}
    </div>
  );
}
