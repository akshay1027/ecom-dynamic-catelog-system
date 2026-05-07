import { useState } from 'react';
import './ProductDetail.css';

function groupVariantsByKey(variants) {
  return variants.reduce((acc, v) => {
    for (const key of Object.keys(v.options)) {
      if (!acc[key]) acc[key] = [];
      acc[key].push(v);
    }
    return acc;
  }, {});
}

export default function ProductDetail({ product, onClose }) {
  const {
    name, brandName, description, price, currency, category, type,
    images, stock, tags, attributes, variants,
  } = product;

  const [selectedId, setSelectedId] = useState(
    () => variants?.find(v => v.stock > 0)?.id ?? variants?.[0]?.id ?? null
  );

  const selectedVariant = variants?.find(v => v.id === selectedId);
  const displayStock = selectedVariant !== undefined ? selectedVariant.stock : stock;
  const isInStock = displayStock > 0;

  return (
    <div className="product-detail-overlay" onClick={onClose}>
      <div className="product-detail" onClick={e => e.stopPropagation()}>
        <button className="product-detail__close" onClick={onClose} aria-label="Close">×</button>

        <div className="product-detail__image-section">
          {images && images.length > 0
            ? <img className="product-detail__image" src={images[0]} alt={name} />
            : <span className="product-detail__placeholder">No Image</span>
          }
        </div>

        <div className="product-detail__info">
          {brandName && <div className="product-detail__brand">{brandName}</div>}
          <h2 className="product-detail__name">{name}</h2>
          <div className="product-detail__meta">{category} · {type}</div>
          <div className="product-detail__price">{currency} {price.toFixed(2)}</div>

          <div className={isInStock ? 'product-detail__stock--in' : 'product-detail__stock--out'}>
            {isInStock ? `In stock (${displayStock})` : 'Out of stock'}
          </div>

          {description && (
            <div>
              <div className="product-detail__section-title">Description</div>
              <p className="product-detail__description">{description}</p>
            </div>
          )}

          {variants && variants.length > 0 && Object.entries(groupVariantsByKey(variants)).map(([key, group]) => (
            <div key={key}>
              <div className="product-detail__section-title">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </div>
              <div className="product-detail__variants">
                {group.map(v => (
                  <button
                    key={v.id}
                    type="button"
                    className={`variant-pill${v.stock === 0 ? ' variant-pill--oos' : ''}${v.id === selectedId ? ' variant-pill--selected' : ''}`}
                    onClick={() => setSelectedId(v.id)}
                  >
                    {v.options[key]}
                    {v.stock === 0 && <span className="variant-pill__oos-label"> (Out of stock)</span>}
                    {v.stock > 0 && <span className="variant-pill__stock">{v.stock} left</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {attributes && Object.keys(attributes).length > 0 && (
            <div>
              <div className="product-detail__section-title">Specifications</div>
              <div className="product-detail__attributes">
                {Object.entries(attributes).map(([key, val]) => (
                  <div key={key} className="product-detail__attribute-row">
                    <span className="product-detail__attribute-key">{key.replace(/_/g, ' ')}</span>
                    <span className="product-detail__attribute-val">{val === true ? 'Yes' : val === false ? 'No' : String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tags && tags.length > 0 && (
            <div>
              <div className="product-detail__section-title">Tags</div>
              <div className="product-detail__tags">
                {tags.map(tag => (
                  <span key={tag} className="product-detail__tag">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
