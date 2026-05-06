import './ProductCard.css';

function AttributeBadge({ label, value }) {
  return (
    <span className="attribute-badge">
      {label}: {value}
    </span>
  );
}

export default function ProductCard({ product }) {
  const { name, price, currency, category, type, images, attributes } = product;
  const attributeEntries = Object.entries(attributes || {}).slice(0, 3);

  return (
    <div className="product-card">
      {images && images.length > 0
        ? <img className="product-card__image" src={images[0]} alt={name} />
        : <div className="product-card__placeholder">No Image</div>
      }
      <div className="product-card__body">
        <h3 className="product-card__name">{name}</h3>
        <div className="product-card__meta">{category} · {type}</div>
        <div className="product-card__price">{currency} {price.toFixed(2)}</div>
        {attributeEntries.length > 0 && (
          <div className="product-card__attributes">
            {attributeEntries.map(([key, val]) => (
              <AttributeBadge key={key} label={key} value={val} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
