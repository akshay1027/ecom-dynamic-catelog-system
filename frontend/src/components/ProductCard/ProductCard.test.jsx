import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import ProductCard from './ProductCard';

const baseProduct = {
  id: '1',
  name: 'Blue Cotton Shirt',
  description: 'A nice shirt',
  price: 29.99,
  currency: 'USD',
  category: 'apparel',
  type: 'shirt',
  brandName: 'TestBrand',
  images: ['https://example.com/shirt.jpg'],
  stock: 10,
  tags: ['summer'],
  attributes: { size: 'M', color: 'blue', material: 'cotton' },
};

describe('ProductCard', () => {
  test('renders product name', () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText('Blue Cotton Shirt')).toBeInTheDocument();
  });

  test('renders formatted price', () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText(/29\.99/)).toBeInTheDocument();
  });

  test('renders category and type', () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText(/apparel/i)).toBeInTheDocument();
    // "shirt" appears in both the product name and the category·type div — use getAllByText
    expect(screen.getAllByText(/shirt/i).length).toBeGreaterThanOrEqual(1);
  });

  test('renders product image when images array is non-empty', () => {
    render(<ProductCard product={baseProduct} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/shirt.jpg');
    expect(img).toHaveAttribute('alt', 'Blue Cotton Shirt');
  });

  test('renders placeholder text when images array is empty', () => {
    render(<ProductCard product={{ ...baseProduct, images: [] }} />);
    expect(screen.getByText(/no image/i)).toBeInTheDocument();
  });

  test('renders up to 3 attribute badges', () => {
    render(<ProductCard product={baseProduct} />);
    // attributes: size, color, material — all 3 should appear
    expect(screen.getByText(/size/i)).toBeInTheDocument();
    expect(screen.getByText(/color/i)).toBeInTheDocument();
    expect(screen.getByText(/material/i)).toBeInTheDocument();
  });

  test('renders brand name', () => {
    render(<ProductCard product={{ ...baseProduct, brandName: 'Nike' }} onClick={() => {}} />);
    expect(screen.getByText('Nike')).toBeInTheDocument();
  });

  test('renders in-stock badge when stock > 0', () => {
    render(<ProductCard product={{ ...baseProduct, stock: 10 }} onClick={() => {}} />);
    expect(screen.getByText(/in stock/i)).toBeInTheDocument();
  });

  test('renders out-of-stock badge when stock is 0', () => {
    render(<ProductCard product={{ ...baseProduct, stock: 0 }} onClick={() => {}} />);
    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
  });

  test('calls onClick when card is clicked', () => {
    const handleClick = vi.fn();
    render(<ProductCard product={baseProduct} onClick={handleClick} />);
    fireEvent.click(screen.getByText('Blue Cotton Shirt'));
    expect(handleClick).toHaveBeenCalledWith(baseProduct);
  });
});
