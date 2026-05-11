import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import './AttributeFilters.css';

export default function AttributeFilters({ schema = {}, value = {}, onChange }) {
  const keys = Object.keys(schema).sort();
  if (keys.length === 0) return null;

  // Internal raw state for number inputs: { 'attrKey:min': '16', 'attrKey:max': '' }
  // Avoids hooks-in-loops by debouncing the whole map as one value
  const [rawNumbers, setRawNumbers] = useState({});
  const debouncedNumbers = useDebounce(rawNumbers, 300);

  // Always-current reference to value prop — avoids stale closure in the effect below
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);

  // When debounced number inputs settle, merge them into current value and notify parent
  useEffect(() => {
    if (Object.keys(debouncedNumbers).length === 0) return;
    const merged = { ...valueRef.current };
    Object.entries(debouncedNumbers).forEach(([compositeKey, inputVal]) => {
      const [attrKey, bound] = compositeKey.split(':');
      const current = (merged[attrKey] && typeof merged[attrKey] === 'object') ? merged[attrKey] : {};
      if (inputVal !== '') {
        merged[attrKey] = { ...current, [bound]: inputVal };
      } else {
        const updated = { ...current };
        delete updated[bound];
        if (Object.keys(updated).length === 0) delete merged[attrKey];
        else merged[attrKey] = updated;
      }
    });
    onChange(merged);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedNumbers]);

  // Reset raw number inputs when parent resets value to {} (e.g., Reset button)
  useEffect(() => {
    if (Object.keys(value).length === 0) setRawNumbers({});
  }, [value]);

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
    setRawNumbers(prev => ({ ...prev, [`${key}:${bound}`]: inputVal }));
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
                  value={rawNumbers[`${key}:min`] !== undefined ? rawNumbers[`${key}:min`] : (value[key] && value[key].min) || ''}
                  onChange={e => handleNumberChange(key, 'min', e.target.value)}
                />
                <input
                  type="number"
                  className="attr-range-input"
                  placeholder={`Max (${entry.max})`}
                  value={rawNumbers[`${key}:max`] !== undefined ? rawNumbers[`${key}:max`] : (value[key] && value[key].max) || ''}
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
