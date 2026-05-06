import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Mock hooks used by CatalogPage (loaded via route)
vi.mock('./hooks/useProducts', () => ({
  useProducts: vi.fn(() => ({ items: [], total: 0, loading: false, error: null })),
  useBrands: vi.fn(() => ({ brands: [], loading: false, error: null })),
}));

// Mock API used by AdminPage (loaded via route)
vi.mock('./api/products', () => ({
  brandsApi: { list: vi.fn().mockResolvedValue([]) },
  productsApi: {
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('App navigation', () => {
  it('renders the nav bar with Catalog and Admin links', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    // Use getAllByText since "Catalog" appears in nav link and page heading
    expect(screen.getAllByText(/catalog/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /^admin$/i })).toBeTruthy();
  });

  it('renders nav brand link', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('ShopCatalog')).toBeTruthy();
  });
});
