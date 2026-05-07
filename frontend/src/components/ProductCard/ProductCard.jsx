import './ProductCard.css';

function AttributeBadge({ label, value }) {
  return (
    <span className="attribute-badge">
      {label}: {value === true ? 'Yes' : value === false ? 'No' : value}
    </span>
  );
}

export default function ProductCard({ product, onClick }) {
  const { name, brandName, description, price, currency, category, type, images, stock, attributes, variants } = product;
  const attributeEntries = Object.entries(attributes || {}).slice(0, 3);

  return (
    <div
      className="product-card"
      onClick={() => onClick && onClick(product)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {images && images.length > 0
        ? <img className="product-card__image" src={images[0]} alt={name} />
        : <div className="product-card__placeholder">No Image</div>
      }
      <div className="product-card__body">
        {brandName && <div className="product-card__brand">{brandName}</div>}
        <h3 className="product-card__name">{name}</h3>
        <div className="product-card__meta">{category} · {type}</div>
        <div className="product-card__price">{currency} {price.toFixed(2)}</div>
        <div className={stock > 0 ? 'product-card__stock--in' : 'product-card__stock--out'}>
          {stock > 0 ? `In stock (${stock})` : 'Out of stock'}
        </div>
        {description && <p className="product-card__description">{description}</p>}
        {attributeEntries.length > 0 && (
          <div className="product-card__attributes">
            {attributeEntries.map(([key, val]) => (
              <AttributeBadge key={key} label={key.replace(/_/g, ' ')} value={val} />
            ))}
          </div>
        )}
        {variants && variants.length > 0 && (
          <div className="product-card__variants">
            {variants.map(v => (
              <span
                key={v.id}
                className={`size-chip${v.stock === 0 ? ' size-chip--oos' : ''}`}
                title={v.stock === 0 ? 'Out of stock' : `${v.stock} in stock`}
              >
                {v.options.size}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
