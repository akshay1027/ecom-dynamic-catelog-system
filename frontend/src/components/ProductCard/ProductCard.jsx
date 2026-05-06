function AttributeBadge({ label, value }) {
  return (
    <span style={{ display: 'inline-block', background: '#f0f0f0', borderRadius: 4, padding: '2px 8px', marginRight: 4, fontSize: 12 }}>
      {label}: {value}
    </span>
  );
}

export default function ProductCard({ product }) {
  const { name, price, currency, category, type, images, attributes } = product;
  const attributeEntries = Object.entries(attributes || {}).slice(0, 3);

  return (
    <div className="product-card" style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
      <div style={{ height: 180, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {images && images.length > 0
          ? <img src={images[0]} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ color: '#999' }}>No Image</span>
        }
      </div>
      <div style={{ padding: 16 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{name}</h3>
        <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>{category} · {type}</div>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{currency} {price.toFixed(2)}</div>
        {attributeEntries.length > 0 && (
          <div>
            {attributeEntries.map(([key, val]) => (
              <AttributeBadge key={key} label={key} value={val} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
