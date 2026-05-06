import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import ProductList from './ProductList';

const products = [
  { id: '1', name: 'Shirt', price: 20, currency: 'USD', category: 'apparel', type: 'shirt', images: [], stock: 5, tags: [], attributes: {} },
  { id: '2', name: 'Desk', price: 300, currency: 'USD', category: 'furniture', type: 'desk', images: [], stock: 2, tags: [], attributes: {} },
];

describe('ProductList', () => {
  test('renders a card for each product', () => {
    render(<ProductList products={products} loading={false} error={null} />);
    expect(screen.getByText('Shirt')).toBeInTheDocument();
    expect(screen.getByText('Desk')).toBeInTheDocument();
  });

  test('shows loading state when loading is true', () => {
    render(<ProductList products={[]} loading={true} error={null} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('shows error message when error is provided', () => {
    render(<ProductList products={[]} loading={false} error="Failed to fetch" />);
    expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
  });

  test('shows empty state when products array is empty and not loading', () => {
    render(<ProductList products={[]} loading={false} error={null} />);
    expect(screen.getByText(/no products found/i)).toBeInTheDocument();
  });

  test('renders the correct number of product cards', () => {
    render(<ProductList products={products} loading={false} error={null} />);
    // Both products should be in the document
    const names = screen.getAllByRole('heading');
    expect(names.length).toBeGreaterThanOrEqual(2);
  });
});
