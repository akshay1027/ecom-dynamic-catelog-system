import { useState, useEffect, useCallback } from 'react';
import { productsApi, brandsApi } from '../api/products';
import ProductForm from '../components/ProductForm/ProductForm';
import BrandForm from '../components/BrandForm/BrandForm';
import './AdminPage.css';

export default function AdminPage() {
  const [tab, setTab] = useState('products'); // 'products' | 'brands'

  // ── Products state ───────────────────────────────────────────────────────────
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productFormError, setProductFormError] = useState(null);

  // ── Brands state ─────────────────────────────────────────────────────────────
  const [brandFormOpen, setBrandFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [brandFormError, setBrandFormError] = useState(null);

  const [error, setError] = useState(null);

  // ── Load brands ───────────────────────────────────────────────────────────────
  const loadBrands = useCallback(() => {
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

  useEffect(() => {
    return loadBrands();
  }, [loadBrands]);

  // ── Load products ─────────────────────────────────────────────────────────────
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

  // ── Product handlers ──────────────────────────────────────────────────────────
  function openAddProduct() {
    setEditingProduct(null);
    setProductFormOpen(true);
  }

  function openEditProduct(product) {
    setEditingProduct(product);
    setProductFormOpen(true);
  }

  function closeProductForm() {
    setProductFormOpen(false);
    setEditingProduct(null);
    setProductFormError(null);
  }

  async function handleSaveProduct(formData) {
    try {
      if (editingProduct?.id) {
        await productsApi.update(editingProduct.id, formData);
      } else {
        await productsApi.create(formData);
      }
      closeProductForm();
      loadProducts();
    } catch (err) {
      setProductFormError(err.message);
    }
  }

  async function handleDeleteProduct(product) {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await productsApi.remove(product.id);
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  // ── Brand handlers ────────────────────────────────────────────────────────────
  function openAddBrand() {
    setEditingBrand(null);
    setBrandFormOpen(true);
  }

  function openEditBrand(brand) {
    setEditingBrand(brand);
    setBrandFormOpen(true);
  }

  function closeBrandForm() {
    setBrandFormOpen(false);
    setEditingBrand(null);
    setBrandFormError(null);
  }

  async function handleSaveBrand(formData) {
    try {
      if (editingBrand?.id) {
        await brandsApi.update(editingBrand.id, formData);
      } else {
        await brandsApi.create(formData);
      }
      closeBrandForm();
      loadBrands();
    } catch (err) {
      setBrandFormError(err.message);
    }
  }

  async function handleDeleteBrand(brand) {
    if (!window.confirm(`Delete brand "${brand.name}"?`)) return;
    try {
      await brandsApi.remove(brand.id);
      loadBrands();
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

        <div className="admin-tabs">
          <button
            className={`tab-btn${tab === 'products' ? ' active' : ''}`}
            onClick={() => setTab('products')}
          >
            Products
          </button>
          <button
            className={`tab-btn${tab === 'brands' ? ' active' : ''}`}
            onClick={() => setTab('brands')}
          >
            Brands
          </button>
        </div>

        {tab === 'products' && (
          <>
            <div className="admin-header">
              <h1>Products</h1>
              <span className="count">{total} products</span>
              <button className="btn-add" onClick={openAddProduct}>+ Add Product</button>
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
                        <button className="btn-edit" onClick={() => openEditProduct(product)}>Edit</button>
                        <button className="btn-delete" onClick={() => handleDeleteProduct(product)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {tab === 'brands' && (
          <>
            <div className="admin-header">
              <h1>Brands</h1>
              <span className="count">{brands.length} brands</span>
              <button className="btn-add" onClick={openAddBrand}>+ Add Brand</button>
            </div>

            {brands.length === 0 ? (
              <div className="admin-empty">No brands found.</div>
            ) : (
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Website</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map(brand => (
                    <tr key={brand.id}>
                      <td>{brand.name}</td>
                      <td>{brand.description || '—'}</td>
                      <td>{brand.website || '—'}</td>
                      <td>
                        <button className="btn-edit" onClick={() => openEditBrand(brand)}>Edit</button>
                        <button className="btn-delete" onClick={() => handleDeleteBrand(brand)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </main>

      {productFormOpen && (
        <ProductForm
          product={editingProduct}
          brands={brands}
          onSave={handleSaveProduct}
          onClose={closeProductForm}
          saveError={productFormError}
        />
      )}

      {brandFormOpen && (
        <BrandForm
          brand={editingBrand}
          onSave={handleSaveBrand}
          onClose={closeBrandForm}
          saveError={brandFormError}
        />
      )}
    </div>
  );
}
