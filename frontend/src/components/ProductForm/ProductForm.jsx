import { useState } from 'react';
import './ProductForm.css';

function buildVariantTypes(variants = []) {
  const typeMap = new Map();
  for (const v of variants) {
    for (const [key, val] of Object.entries(v.options || {})) {
      if (!typeMap.has(key)) typeMap.set(key, []);
      typeMap.get(key).push({ id: v.id, value: String(val), stock: String(v.stock) });
    }
  }
  return [...typeMap.entries()].map(([key, values]) => ({ key, values }));
}

function buildInitialState(product) {
  return {
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price != null ? String(product.price) : '',
    currency: product?.currency ?? 'USD',
    category: product?.category ?? '',
    type: product?.type ?? '',
    stock: product?.stock != null ? String(product.stock) : '',
    brandId: product?.brandId ?? '',
    tags: Array.isArray(product?.tags) ? product.tags.join(', ') : '',
    attributes: product?.attributes
      ? Object.entries(product.attributes).map(([key, value]) => ({ key, value: String(value) }))
      : [],
    variantTypes: buildVariantTypes(product?.variants),
  };
}

export default function ProductForm({ product, brands = [], onSave, onClose }) {
  const [fields, setFields] = useState(() => buildInitialState(product));

  function setField(key, value) {
    setFields(prev => ({ ...prev, [key]: value }));
  }

  function addAttribute() {
    setFields(prev => ({ ...prev, attributes: [...prev.attributes, { key: '', value: '' }] }));
  }

  function updateAttribute(index, attrKey, attrValue) {
    setFields(prev => {
      const next = [...prev.attributes];
      next[index] = { ...next[index], [attrKey]: attrValue };
      return { ...prev, attributes: next };
    });
  }

  function removeAttribute(index) {
    setFields(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index),
    }));
  }

  function addVariantType() {
    setFields(prev => ({ ...prev, variantTypes: [...prev.variantTypes, { key: '', values: [] }] }));
  }

  function updateVariantTypeKey(typeIdx, key) {
    setFields(prev => {
      const next = [...prev.variantTypes];
      next[typeIdx] = { ...next[typeIdx], key };
      return { ...prev, variantTypes: next };
    });
  }

  function removeVariantType(typeIdx) {
    setFields(prev => ({
      ...prev,
      variantTypes: prev.variantTypes.filter((_, i) => i !== typeIdx),
    }));
  }

  function addVariantValue(typeIdx) {
    setFields(prev => {
      const next = [...prev.variantTypes];
      next[typeIdx] = { ...next[typeIdx], values: [...next[typeIdx].values, { id: null, value: '', stock: '0' }] };
      return { ...prev, variantTypes: next };
    });
  }

  function updateVariantValue(typeIdx, valIdx, field, val) {
    setFields(prev => {
      const types = [...prev.variantTypes];
      const values = [...types[typeIdx].values];
      values[valIdx] = { ...values[valIdx], [field]: val };
      types[typeIdx] = { ...types[typeIdx], values };
      return { ...prev, variantTypes: types };
    });
  }

  function removeVariantValue(typeIdx, valIdx) {
    setFields(prev => {
      const types = [...prev.variantTypes];
      types[typeIdx] = { ...types[typeIdx], values: types[typeIdx].values.filter((_, i) => i !== valIdx) };
      return { ...prev, variantTypes: types };
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const formData = {
      name: fields.name,
      description: fields.description,
      price: parseFloat(fields.price),
      currency: fields.currency,
      category: fields.category,
      type: fields.type,
      stock: parseInt(fields.stock, 10),
      brandId: fields.brandId,
      tags: fields.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
      attributes: Object.fromEntries(
        fields.attributes
          .filter(a => a.key.trim() !== '')
          .map(a => [a.key.trim(), a.value])
      ),
      variants: fields.variantTypes
        .filter(type => type.key.trim())
        .flatMap(type =>
          type.values
            .filter(v => v.value.trim())
            .map(v => ({
              options: { [type.key.trim()]: v.value.trim() },
              stock: parseInt(v.stock, 10) || 0,
            }))
        ),
    };
    onSave(formData);
  }

  const isEdit = Boolean(product?.id);

  return (
    <div role="dialog" aria-modal="true" className="form-overlay">
      <div className="form-modal">
        <div className="form-modal__header">
          <h2 className="form-modal__title">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
          <button type="button" className="form-modal__close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <form aria-label="product form" role="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="pf-name">Name</label>
            <input
              id="pf-name"
              type="text"
              value={fields.name}
              onChange={e => setField('name', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="pf-description">Description</label>
            <textarea
              id="pf-description"
              value={fields.description}
              onChange={e => setField('description', e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pf-price">Price</label>
              <input
                id="pf-price"
                type="number"
                min="0"
                step="0.01"
                value={fields.price}
                onChange={e => setField('price', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="pf-currency">Currency</label>
              <input
                id="pf-currency"
                type="text"
                maxLength={3}
                value={fields.currency}
                onChange={e => setField('currency', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pf-category">Category</label>
              <input
                id="pf-category"
                type="text"
                value={fields.category}
                onChange={e => setField('category', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="pf-type">Type</label>
              <input
                id="pf-type"
                type="text"
                value={fields.type}
                onChange={e => setField('type', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pf-stock">Stock</label>
              <input
                id="pf-stock"
                type="number"
                min="0"
                value={fields.stock}
                onChange={e => setField('stock', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="pf-brand">Brand</label>
              <select
                id="pf-brand"
                value={fields.brandId}
                onChange={e => setField('brandId', e.target.value)}
              >
                <option value="">Select brand</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="pf-tags">Tags (comma-separated)</label>
            <input
              id="pf-tags"
              type="text"
              value={fields.tags}
              onChange={e => setField('tags', e.target.value)}
              placeholder="e.g. sale, summer, new"
            />
          </div>

          <div className="form-section-title">Attributes</div>
          {fields.attributes.map((attr, i) => (
            <div key={i} className="attr-row">
              <input
                type="text"
                placeholder="Key"
                value={attr.key}
                onChange={e => updateAttribute(i, 'key', e.target.value)}
              />
              <input
                type="text"
                placeholder="Value"
                value={attr.value}
                onChange={e => updateAttribute(i, 'value', e.target.value)}
              />
              <button type="button" className="btn-remove-attr" onClick={() => removeAttribute(i)}>
                &times;
              </button>
            </div>
          ))}
          <button type="button" className="btn-add-attr" onClick={addAttribute}>
            + Add Attribute
          </button>

          <div className="form-section-title">Variants</div>
          {fields.variantTypes.map((type, i) => (
            <div key={i} className="variant-type-row">
              <div className="variant-type-header">
                <input
                  type="text"
                  placeholder="Variant type (e.g. colour, size)"
                  aria-label={`variant type ${i} key`}
                  value={type.key}
                  onChange={e => updateVariantTypeKey(i, e.target.value)}
                />
                <button
                  type="button"
                  className="btn-remove-attr"
                  aria-label={`remove variant type ${i}`}
                  onClick={() => removeVariantType(i)}
                >
                  Remove
                </button>
              </div>
              {type.values.map((v, j) => (
                <div key={j} className="attr-row variant-value-row">
                  <input
                    type="text"
                    placeholder="Value (e.g. blue)"
                    aria-label={`variant type ${i} value ${j}`}
                    value={v.value}
                    onChange={e => updateVariantValue(i, j, 'value', e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Stock"
                    aria-label={`variant type ${i} stock ${j}`}
                    value={v.stock}
                    onChange={e => updateVariantValue(i, j, 'stock', e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-remove-attr"
                    aria-label={`remove variant type ${i} value ${j}`}
                    onClick={() => removeVariantValue(i, j)}
                  >
                    &times;
                  </button>
                </div>
              ))}
              <button type="button" className="btn-add-attr" onClick={() => addVariantValue(i)}>
                + Add Value
              </button>
            </div>
          ))}
          {fields.variantTypes.length === 0 && (
            <button type="button" className="btn-add-attr" onClick={addVariantType}>
              + Add Variant Type
            </button>
          )}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save">Save Product</button>
          </div>
        </form>
      </div>
    </div>
  );
}
