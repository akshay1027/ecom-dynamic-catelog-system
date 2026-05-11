import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Stub global fetch — AuthProvider calls /api/v1/auth/me on mount
const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock('./hooks/useProducts', () => ({
  useProducts: vi.fn(() => ({ items: [], total: 0, loading: false, error: null })),
  useBrands: vi.fn(() => ({ brands: [], loading: false, error: null })),
  useAttributeSchema: vi.fn(() => ({ schema: {}, loading: false })),
}));

vi.mock('./api/products', () => ({
  brandsApi: { list: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  productsApi: {
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('App navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders brand link and Catalog link when unauthenticated', async () => {
    // Auth check → unauthenticated
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: { code: 'UNAUTHORIZED' } }),
    });
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('ShopCatalog')).toBeTruthy());
    expect(screen.getAllByText(/catalog/i).length).toBeGreaterThan(0);
  });

  it('renders Admin link and Sign out for authenticated admin', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { id: '1', email: 'a@test.com', role: 'admin' } }),
    });
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByRole('link', { name: /^admin$/i })).toBeTruthy());
    expect(screen.getByRole('button', { name: /sign out/i })).toBeTruthy();
  });

  it('renders Sign in link when unauthenticated', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: { code: 'UNAUTHORIZED' } }),
    });
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByRole('link', { name: /sign in/i })).toBeTruthy());
  });
});
