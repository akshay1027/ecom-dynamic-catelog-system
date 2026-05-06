import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProductForm from './ProductForm';

const mockBrands = [
  { id: 'b1', name: 'Nike' },
];

describe('ProductForm', () => {
  it('renders all required fields', () => {
    render(<ProductForm brands={mockBrands} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByLabelText(/name/i)).toBeTruthy();
    expect(screen.getByLabelText(/price/i)).toBeTruthy();
    expect(screen.getByLabelText(/category/i)).toBeTruthy();
    expect(screen.getByLabelText(/stock/i)).toBeTruthy();
  });

  it('calls onClose when cancel is clicked', () => {
    const onClose = vi.fn();
    render(<ProductForm brands={mockBrands} onSave={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSave with form data when submitted', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ProductForm brands={mockBrands} onSave={onSave} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test Product' } });
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '99.99' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'electronics' } });
    fireEvent.change(screen.getByLabelText(/stock/i), { target: { value: '5' } });
    fireEvent.submit(screen.getByRole('form'));
    expect(onSave).toHaveBeenCalled();
  });

  it('pre-fills fields when product prop is provided (edit mode)', () => {
    const product = { name: 'Existing', price: 50, currency: 'USD', category: 'apparel', type: 'shirt', stock: 3, description: '', brandId: 'b1', tags: [], attributes: {} };
    render(<ProductForm brands={mockBrands} product={product} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByLabelText(/name/i).value).toBe('Existing');
    expect(screen.getByLabelText(/price/i).value).toBe('50');
  });
});
