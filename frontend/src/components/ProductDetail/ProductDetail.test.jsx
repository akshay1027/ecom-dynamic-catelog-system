import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import ProductDetail from './ProductDetail';

const product = {
  id: '1',
  name: 'Blue Cotton Shirt',
  description: 'A wonderful shirt made of cotton.',
  price: 29.99,
  currency: 'USD',
  category: 'apparel',
  type: 'shirt',
  brandName: 'Nike',
  images: ['https://example.com/shirt.jpg'],
  stock: 10,
  tags: ['summer', 'casual'],
  attributes: { size: 'M', color: 'blue', material: 'cotton' },
};

describe('ProductDetail', () => {
  test('renders product name', () => {
    render(<ProductDetail product={product} onClose={() => {}} />);
    expect(screen.getByText('Blue Cotton Shirt')).toBeInTheDocument();
  });

  test('renders brand name', () => {
    render(<ProductDetail product={product} onClose={() => {}} />);
    expect(screen.getByText('Nike')).toBeInTheDocument();
  });

  test('renders full description', () => {
    render(<ProductDetail product={product} onClose={() => {}} />);
    expect(screen.getByText('A wonderful shirt made of cotton.')).toBeInTheDocument();
  });

  test('renders all attributes', () => {
    render(<ProductDetail product={product} onClose={() => {}} />);
    expect(screen.getByText(/size/i)).toBeInTheDocument();
    expect(screen.getByText(/color/i)).toBeInTheDocument();
    expect(screen.getByText(/material/i)).toBeInTheDocument();
  });

  test('renders stock level', () => {
    render(<ProductDetail product={product} onClose={() => {}} />);
    expect(screen.getByText(/10/)).toBeInTheDocument();
  });

  test('renders tags', () => {
    render(<ProductDetail product={product} onClose={() => {}} />);
    expect(screen.getByText('summer')).toBeInTheDocument();
    expect(screen.getByText('casual')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<ProductDetail product={product} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  test('renders placeholder when no images', () => {
    render(<ProductDetail product={{ ...product, images: [] }} onClose={() => {}} />);
    expect(screen.getByText(/no image/i)).toBeInTheDocument();
  });

  test('renders variant type title and value when product has variants', () => {
    const productWithVariants = {
      ...product,
      attributes: { color: 'blue', material: 'cotton' },
      variants: [{ id: 'v1', options: { size: 'XL' }, stock: 20 }],
    };
    render(<ProductDetail product={productWithVariants} onClose={vi.fn()} />);
    expect(screen.getByText('Size')).toBeTruthy();
    expect(screen.getByText('XL')).toBeTruthy();
  });

  test('renders each variant size option', () => {
    const productWithVariants = {
      ...product,
      attributes: { color: 'blue', material: 'cotton' },
      variants: [
        { id: 'v1', options: { size: 'S' }, stock: 10 },
        { id: 'v2', options: { size: 'XL' }, stock: 20 },
      ],
    };
    render(<ProductDetail product={productWithVariants} onClose={vi.fn()} />);
    expect(screen.getByText('S')).toBeTruthy();
    expect(screen.getByText('XL')).toBeTruthy();
  });

  test('shows out-of-stock label for zero-stock variants', () => {
    const productWithVariants = {
      ...product,
      variants: [{ id: 'v1', options: { size: 'M' }, stock: 0 }],
    };
    const { container } = render(<ProductDetail product={productWithVariants} onClose={vi.fn()} />);
    expect(container.querySelector('.product-detail__stock--out')).not.toBeNull();
  });

  test('renders boolean true attribute as "Yes"', () => {
    render(<ProductDetail product={{ ...product, attributes: { waterproof: true } }} onClose={() => {}} />);
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  test('does not render variants section when variants is empty', () => {
    const productNoVariants = { ...product, variants: [] };
    const { container } = render(<ProductDetail product={productNoVariants} onClose={vi.fn()} />);
    expect(container.querySelector('.product-detail__variants')).toBeNull();
  });

  test('renders separate section per variant type', () => {
    const productWithMultiTypes = {
      ...product,
      variants: [
        { id: 'v1', options: { size: 'M' }, stock: 20 },
        { id: 'v2', options: { colour: 'black' }, stock: 30 },
      ],
    };
    render(<ProductDetail product={productWithMultiTypes} onClose={vi.fn()} />);
    expect(screen.getByText('Size')).toBeTruthy();
    expect(screen.getByText('Colour')).toBeTruthy();
  });

  test('renders variant values under correct type section', () => {
    const productWithMultiTypes = {
      ...product,
      attributes: {},
      variants: [
        { id: 'v1', options: { size: 'XL' }, stock: 20 },
        { id: 'v2', options: { colour: 'black' }, stock: 30 },
        { id: 'v3', options: { colour: 'white' }, stock: 15 },
      ],
    };
    render(<ProductDetail product={productWithMultiTypes} onClose={vi.fn()} />);
    expect(screen.getByText('XL')).toBeTruthy();
    expect(screen.getByText('black')).toBeTruthy();
    expect(screen.getByText('white')).toBeTruthy();
  });
});

describe('ProductDetail — variant selection', () => {
  const base = {
    id: '1', name: 'Shirt', description: '', price: 29.99, currency: 'USD',
    category: 'apparel', type: 'shirt', brandName: 'Nike',
    images: [], stock: 55, tags: [], attributes: {},
  };

  const withVariants = (variants) => ({ ...base, variants });

  test('variant pills render as buttons', () => {
    const p = withVariants([
      { id: 'v1', options: { size: 'S' }, stock: 10 },
      { id: 'v2', options: { size: 'M' }, stock: 20 },
    ]);
    render(<ProductDetail product={p} onClose={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    const sizeButtons = buttons.filter(b => b.textContent.includes('S') || b.textContent.includes('M'));
    expect(sizeButtons.length).toBeGreaterThanOrEqual(2);
  });

  test('first in-stock variant is auto-selected on mount', () => {
    const p = withVariants([
      { id: 'v1', options: { size: 'S' }, stock: 0 },
      { id: 'v2', options: { size: 'M' }, stock: 20 },
      { id: 'v3', options: { size: 'L' }, stock: 30 },
    ]);
    const { container } = render(<ProductDetail product={p} onClose={vi.fn()} />);
    const selected = container.querySelector('.variant-pill--selected');
    expect(selected).not.toBeNull();
    expect(selected.textContent).toContain('M');
  });

  test('clicking a pill transfers the selected state', () => {
    const p = withVariants([
      { id: 'v1', options: { size: 'S' }, stock: 10 },
      { id: 'v2', options: { size: 'L' }, stock: 30 },
    ]);
    const { container } = render(<ProductDetail product={p} onClose={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    const lBtn = buttons.find(b => b.textContent.includes('L'));
    fireEvent.click(lBtn);
    const selected = container.querySelector('.variant-pill--selected');
    expect(selected.textContent).toContain('L');
  });

  test('stock display shows selected variant stock, not total product stock', () => {
    const p = withVariants([
      { id: 'v1', options: { size: 'S' }, stock: 7 },
      { id: 'v2', options: { size: 'M' }, stock: 13 },
    ]);
    render(<ProductDetail product={p} onClose={vi.fn()} />);
    // v1 (S) auto-selected (first in-stock) — shows its stock 7, not total 55
    expect(screen.getByText(/in stock \(7\)/i)).toBeTruthy();
  });

  test('clicking OOS variant shows out of stock', () => {
    const p = withVariants([
      { id: 'v1', options: { size: 'S' }, stock: 5 },
      { id: 'v2', options: { size: 'M' }, stock: 0 },
    ]);
    const { container } = render(<ProductDetail product={p} onClose={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    const mBtn = buttons.find(b => b.textContent.includes('M'));
    fireEvent.click(mBtn);
    expect(container.querySelector('.product-detail__stock--out')).not.toBeNull();
  });
});
