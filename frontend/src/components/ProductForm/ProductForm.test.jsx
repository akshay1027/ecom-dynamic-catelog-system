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

describe('ProductForm variants section', () => {
  const brandsList = [{ id: 'b1', name: 'TestBrand' }];
  const productWithVariants = {
    id: 'p1',
    name: 'Test Shirt',
    price: 29,
    currency: 'USD',
    category: 'apparel',
    type: 'shirt',
    stock: 0,
    brandId: 'b1',
    attributes: {},
    tags: [],
    variants: [
      { id: 'v1', options: { size: 'M' }, stock: 20 },
      { id: 'v2', options: { size: 'L' }, stock: 15 },
    ],
  };

  it('renders existing variants in Variants section', () => {
    render(<ProductForm product={productWithVariants} brands={brandsList} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByDisplayValue('M')).toBeTruthy();
    expect(screen.getByDisplayValue('L')).toBeTruthy();
    expect(screen.getByDisplayValue('20')).toBeTruthy();
  });

  it('Add Size button appends empty variant row', () => {
    render(<ProductForm product={null} brands={brandsList} onSave={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('+ Add Size'));
    const sizeInputs = screen.getAllByPlaceholderText('Size (e.g. M)');
    expect(sizeInputs).toHaveLength(1);
  });

  it('updating size input reflects in state', () => {
    render(<ProductForm product={null} brands={brandsList} onSave={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('+ Add Size'));
    const sizeInput = screen.getByPlaceholderText('Size (e.g. M)');
    fireEvent.change(sizeInput, { target: { value: 'XL' } });
    expect(sizeInput.value).toBe('XL');
  });

  it('removing a variant row removes it from the form', () => {
    render(<ProductForm product={productWithVariants} brands={brandsList} onSave={vi.fn()} onClose={vi.fn()} />);
    const removeButtons = screen.getAllByRole('button', { name: /remove variant/i });
    fireEvent.click(removeButtons[0]);
    const sizeInputs = screen.getAllByDisplayValue(/[A-Z]/);
    expect(sizeInputs.some(input => input.value === 'M')).toBe(false);
  });

  it('handleSubmit includes variants in onSave payload', async () => {
    const onSave = vi.fn();
    render(<ProductForm product={productWithVariants} brands={brandsList} onSave={onSave} onClose={vi.fn()} />);
    fireEvent.submit(screen.getByRole('form'));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        variants: expect.arrayContaining([
          expect.objectContaining({ options: { size: 'M' }, stock: 20 }),
        ]),
      })
    );
  });

  it('handleSubmit skips variant rows with empty size', async () => {
    const onSave = vi.fn();
    render(<ProductForm product={null} brands={brandsList} onSave={onSave} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('+ Add Size'));
    // Fill required fields so submit fires onSave
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New Product' } });
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'apparel' } });
    fireEvent.change(screen.getByLabelText('Stock'), { target: { value: '0' } });
    fireEvent.submit(screen.getByRole('form'));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ variants: [] })
    );
  });
});
