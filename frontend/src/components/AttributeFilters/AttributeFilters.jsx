import './AttributeFilters.css';

export default function AttributeFilters({ schema = {}, value = {}, onChange }) {
  const keys = Object.keys(schema).sort();
  if (keys.length === 0) return null;

  const hasAnyFilter = Object.keys(value).some(k => {
    const v = value[k];
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object' && v !== null) return v.min !== undefined || v.max !== undefined;
    return v !== undefined && v !== null;
  });

  function handleStringChange(key, val, checked) {
    const current = Array.isArray(value[key]) ? value[key] : [];
    const next = checked ? [...current, val] : current.filter(v => v !== val);
    onChange({ ...value, [key]: next });
  }

  function handleNumberChange(key, bound, inputVal) {
    const current = (value[key] && typeof value[key] === 'object') ? value[key] : {};
    onChange({ ...value, [key]: { ...current, [bound]: inputVal } });
  }

  function handleBoolChange(key, checked) {
    if (checked) {
      onChange({ ...value, [key]: true });
    } else {
      const { [key]: _, ...rest } = value;
      onChange(rest);
    }
  }

  function toTitleCase(str) {
    return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  return (
    <div className="attr-filters">
      <div className="attr-filters-header">
        <span className="attr-filters-title">Attributes</span>
        {hasAnyFilter && (
          <button className="attr-clear-btn" onClick={() => onChange({})}>Clear</button>
        )}
      </div>
      {keys.map(key => {
        const entry = schema[key];
        return (
          <div key={key} className="attr-group">
            <div className="attr-group-label">{toTitleCase(key)}</div>
            {entry.type === 'string' && (
              <div className="attr-checkbox-list">
                {entry.values.map(val => {
                  const checked = Array.isArray(value[key]) && value[key].includes(val);
                  return (
                    <label key={val} className="attr-checkbox-item">
                      <input
                        type="checkbox"
                        checked={checked}
                        aria-label={val}
                        onChange={e => handleStringChange(key, val, e.target.checked)}
                      />
                      {val}
                    </label>
                  );
                })}
              </div>
            )}
            {entry.type === 'number' && (
              <div className="attr-range">
                <input
                  type="number"
                  className="attr-range-input"
                  placeholder={`Min (${entry.min})`}
                  value={(value[key] && value[key].min) || ''}
                  onChange={e => handleNumberChange(key, 'min', e.target.value)}
                />
                <input
                  type="number"
                  className="attr-range-input"
                  placeholder={`Max (${entry.max})`}
                  value={(value[key] && value[key].max) || ''}
                  onChange={e => handleNumberChange(key, 'max', e.target.value)}
                />
              </div>
            )}
            {entry.type === 'boolean' && (
              <label className="attr-checkbox-item">
                <input
                  type="checkbox"
                  checked={value[key] === true}
                  onChange={e => handleBoolChange(key, e.target.checked)}
                />
                {toTitleCase(key)}
              </label>
            )}
          </div>
        );
      })}
    </div>
  );
}
