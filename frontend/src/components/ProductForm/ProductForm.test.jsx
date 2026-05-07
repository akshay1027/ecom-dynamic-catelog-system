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
      { id: 'v3', options: { colour: 'black' }, stock: 30 },
    ],
  };

  it('renders existing variant types with their values', () => {
    render(<ProductForm product={productWithVariants} brands={brandsList} onSave={vi.fn()} onClose={vi.fn()} />);
    // type keys shown in type key inputs
    const typeInputs = screen.getAllByPlaceholderText('Variant type (e.g. colour, size)');
    const typeKeys = typeInputs.map(i => i.value);
    expect(typeKeys).toContain('size');
    expect(typeKeys).toContain('colour');
    // values shown in value inputs
    expect(screen.getByDisplayValue('M')).toBeTruthy();
    expect(screen.getByDisplayValue('L')).toBeTruthy();
    expect(screen.getByDisplayValue('black')).toBeTruthy();
  });

  it('Add Variant Type button appends an empty type row', () => {
    render(<ProductForm product={null} brands={brandsList} onSave={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('+ Add Variant Type'));
    expect(screen.getAllByPlaceholderText('Variant type (e.g. colour, size)')).toHaveLength(1);
  });

  it('Add Value button appends an empty value row to a type', () => {
    render(<ProductForm product={null} brands={brandsList} onSave={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('+ Add Variant Type'));
    fireEvent.click(screen.getByText('+ Add Value'));
    expect(screen.getAllByPlaceholderText('Value (e.g. blue)')).toHaveLength(1);
  });

  it('updating a value input reflects in state', () => {
    render(<ProductForm product={null} brands={brandsList} onSave={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('+ Add Variant Type'));
    fireEvent.click(screen.getByText('+ Add Value'));
    const valueInput = screen.getByPlaceholderText('Value (e.g. blue)');
    fireEvent.change(valueInput, { target: { value: 'red' } });
    expect(valueInput.value).toBe('red');
  });

  it('removing a value row removes it from the type', () => {
    render(<ProductForm product={productWithVariants} brands={brandsList} onSave={vi.fn()} onClose={vi.fn()} />);
    const removeValueBtns = screen.getAllByRole('button', { name: /remove variant.*value/i });
    const initialValues = screen.getAllByPlaceholderText('Value (e.g. blue)');
    const countBefore = initialValues.length;
    fireEvent.click(removeValueBtns[0]);
    expect(screen.getAllByPlaceholderText('Value (e.g. blue)')).toHaveLength(countBefore - 1);
  });

  it('removing a variant type removes it entirely', () => {
    render(<ProductForm product={productWithVariants} brands={brandsList} onSave={vi.fn()} onClose={vi.fn()} />);
    const typesBefore = screen.getAllByPlaceholderText('Variant type (e.g. colour, size)').length;
    fireEvent.click(screen.getAllByRole('button', { name: /remove variant type/i })[0]);
    expect(screen.getAllByPlaceholderText('Variant type (e.g. colour, size)')).toHaveLength(typesBefore - 1);
  });

  it('handleSubmit flattens variant types into backend variant array', () => {
    const onSave = vi.fn();
    render(<ProductForm product={productWithVariants} brands={brandsList} onSave={onSave} onClose={vi.fn()} />);
    fireEvent.submit(screen.getByRole('form'));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        variants: expect.arrayContaining([
          expect.objectContaining({ options: { size: 'M' }, stock: 20 }),
          expect.objectContaining({ options: { size: 'L' }, stock: 15 }),
          expect.objectContaining({ options: { colour: 'black' }, stock: 30 }),
        ]),
      })
    );
  });

  it('handleSubmit skips variant types with empty key', () => {
    const onSave = vi.fn();
    render(<ProductForm product={null} brands={brandsList} onSave={onSave} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('+ Add Variant Type'));
    fireEvent.click(screen.getByText('+ Add Value'));
    // leave type key blank, fill required product fields
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New Product' } });
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'apparel' } });
    fireEvent.change(screen.getByLabelText('Stock'), { target: { value: '0' } });
    fireEvent.submit(screen.getByRole('form'));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ variants: [] }));
  });

  it('handleSubmit skips value rows with empty value string', () => {
    const onSave = vi.fn();
    render(<ProductForm product={null} brands={brandsList} onSave={onSave} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('+ Add Variant Type'));
    const typeInput = screen.getByPlaceholderText('Variant type (e.g. colour, size)');
    fireEvent.change(typeInput, { target: { value: 'colour' } });
    fireEvent.click(screen.getByText('+ Add Value'));
    // leave value input blank
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New Product' } });
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'apparel' } });
    fireEvent.change(screen.getByLabelText('Stock'), { target: { value: '0' } });
    fireEvent.submit(screen.getByRole('form'));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ variants: [] }));
  });

  it('handleSubmit handles multiple variant types correctly', () => {
    const onSave = vi.fn();
    render(<ProductForm product={null} brands={brandsList} onSave={onSave} onClose={vi.fn()} />);
    // add size type
    fireEvent.click(screen.getByText('+ Add Variant Type'));
    const typeInputs = screen.getAllByPlaceholderText('Variant type (e.g. colour, size)');
    fireEvent.change(typeInputs[0], { target: { value: 'size' } });
    fireEvent.click(screen.getAllByText('+ Add Value')[0]);
    const valueInputs = screen.getAllByPlaceholderText('Value (e.g. blue)');
    fireEvent.change(valueInputs[0], { target: { value: 'M' } });
    // add colour type
    fireEvent.click(screen.getByText('+ Add Variant Type'));
    const typeInputs2 = screen.getAllByPlaceholderText('Variant type (e.g. colour, size)');
    fireEvent.change(typeInputs2[1], { target: { value: 'colour' } });
    fireEvent.click(screen.getAllByText('+ Add Value')[1]);
    const valueInputs2 = screen.getAllByPlaceholderText('Value (e.g. blue)');
    fireEvent.change(valueInputs2[1], { target: { value: 'blue' } });
    // fill required fields and submit
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New Product' } });
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'apparel' } });
    fireEvent.change(screen.getByLabelText('Stock'), { target: { value: '0' } });
    fireEvent.submit(screen.getByRole('form'));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        variants: expect.arrayContaining([
          expect.objectContaining({ options: { size: 'M' } }),
          expect.objectContaining({ options: { colour: 'blue' } }),
        ]),
      })
    );
  });
});
