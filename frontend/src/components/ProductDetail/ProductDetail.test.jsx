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

  test('renders Available Sizes section when product has variants', () => {
    const productWithVariants = {
      ...product,
      attributes: { color: 'blue', material: 'cotton' },
      variants: [{ id: 'v1', options: { size: 'XL' }, stock: 20 }],
    };
    render(<ProductDetail product={productWithVariants} onClose={vi.fn()} />);
    expect(screen.getByText('Available Sizes')).toBeTruthy();
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
    render(<ProductDetail product={productWithVariants} onClose={vi.fn()} />);
    expect(screen.getByText(/out of stock/i)).toBeTruthy();
  });

  test('does not render variants section when variants is empty', () => {
    const productNoVariants = { ...product, variants: [] };
    const { container } = render(<ProductDetail product={productNoVariants} onClose={vi.fn()} />);
    expect(container.querySelector('.product-detail__variants')).toBeNull();
  });
});
