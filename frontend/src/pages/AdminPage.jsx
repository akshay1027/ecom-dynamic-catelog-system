import { useState, useEffect, useCallback } from 'react';
import { productsApi, brandsApi } from '../api/products';
import ProductForm from '../components/ProductForm/ProductForm';
import './AdminPage.css';

export default function AdminPage() {
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [selectedBrandId, setSelectedBrandId] = useState(null); // null = All Brands
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState(null);

  // Load brands on mount
  useEffect(() => {
    let cancelled = false;
    brandsApi.list()
      .then(data => {
        if (!cancelled) setBrands(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        if (!cancelled) setError(err.message);
      });
    return () => { cancelled = true; };
  }, []);

  // Load products whenever selectedBrandId changes; cancellation prevents stale updates
  const loadProducts = useCallback(() => {
    let cancelled = false;
    const filters = {};
    if (selectedBrandId) filters.brandId = selectedBrandId;
    productsApi.list(filters)
      .then(data => {
        if (cancelled) return;
        setProducts(data.items || []);
        setTotal(data.total || 0);
        setError(null);
      })
      .catch(err => {
        if (!cancelled) setError(err.message);
      });
    return () => { cancelled = true; };
  }, [selectedBrandId]);

  useEffect(() => {
    return loadProducts();
  }, [loadProducts]);

  function openAdd() {
    setEditingProduct(null);
    setFormOpen(true);
  }

  function openEdit(product) {
    setEditingProduct(product);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingProduct(null);
  }

  async function handleSave(formData) {
    try {
      if (editingProduct && editingProduct.id) {
        await productsApi.update(editingProduct.id, formData);
      } else {
        await productsApi.create(formData);
      }
      closeForm();
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await productsApi.remove(product.id);
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>Brands</h2>
        <div
          className={`brand-item${selectedBrandId === null ? ' active' : ''}`}
          onClick={() => setSelectedBrandId(null)}
        >
          All Brands
        </div>
        {brands.map(brand => (
          <div
            key={brand.id}
            className={`brand-item${selectedBrandId === brand.id ? ' active' : ''}`}
            onClick={() => setSelectedBrandId(brand.id)}
          >
            {brand.name}
          </div>
        ))}
      </aside>

      <main className="admin-main">
        {error && <div className="admin-error">{error}</div>}

        <div className="admin-header">
          <h1>Products</h1>
          <span className="count">{total} products</span>
          <button className="btn-add" onClick={openAdd}>+ Add Product</button>
        </div>

        {products.length === 0 ? (
          <div className="admin-empty">No products found.</div>
        ) : (
          <table className="product-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.brandName || '—'}</td>
                  <td>{product.category}</td>
                  <td>{product.currency} {Number(product.price).toFixed(2)}</td>
                  <td>{product.stock}</td>
                  <td>
                    <button className="btn-edit" onClick={() => openEdit(product)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(product)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      {formOpen && (
        <ProductForm
          product={editingProduct}
          brands={brands}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}
    </div>
  );
}
