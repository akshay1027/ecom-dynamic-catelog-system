import { useState } from 'react';
import './BrandForm.css';

function buildInitialState(brand) {
  return {
    name: brand?.name ?? '',
    description: brand?.description ?? '',
    website: brand?.website ?? '',
    logoUrl: brand?.logoUrl ?? '',
  };
}

export default function BrandForm({ brand, onSave, onClose, saveError }) {
  const [fields, setFields] = useState(() => buildInitialState(brand));

  function setField(key, value) {
    setFields(prev => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      name: fields.name,
      description: fields.description,
      website: fields.website,
      logoUrl: fields.logoUrl,
    });
  }

  const isEdit = Boolean(brand?.id);

  return (
    <div role="dialog" aria-modal="true" className="form-overlay">
      <div className="form-modal">
        <div className="form-modal__header">
          <h2 className="form-modal__title">{isEdit ? 'Edit Brand' : 'Add Brand'}</h2>
          <button type="button" className="form-modal__close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <form aria-label="brand form" role="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="bf-name">Name</label>
            <input
              id="bf-name"
              type="text"
              value={fields.name}
              onChange={e => setField('name', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="bf-description">Description</label>
            <textarea
              id="bf-description"
              value={fields.description}
              onChange={e => setField('description', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bf-website">Website</label>
            <input
              id="bf-website"
              type="url"
              value={fields.website}
              onChange={e => setField('website', e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="bf-logo">Logo URL</label>
            <input
              id="bf-logo"
              type="url"
              value={fields.logoUrl}
              onChange={e => setField('logoUrl', e.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </div>

          {saveError && <p className="form-save-error">{saveError}</p>}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save">Save Brand</button>
          </div>
        </form>
      </div>
    </div>
  );
}
