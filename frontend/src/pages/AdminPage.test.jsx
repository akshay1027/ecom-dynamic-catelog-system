import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminPage from './AdminPage';

// Mock the API modules
vi.mock('../api/products', () => ({
  brandsApi: { list: vi.fn() },
  productsApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));

import { brandsApi, productsApi } from '../api/products';

const mockBrands = [
  { id: 'b1', name: 'Nike' },
  { id: 'b2', name: 'Adidas' },
];

const mockProducts = [
  { id: 'p1', name: 'Air Max', brandId: 'b1', brandName: 'Nike', price: 120, currency: 'USD', category: 'apparel', type: 'shoe', stock: 10, description: 'desc', images: [], tags: [], attributes: {} },
];

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    brandsApi.list.mockResolvedValue(mockBrands);
    productsApi.list.mockResolvedValue({ items: mockProducts, total: 1 });
    productsApi.create.mockResolvedValue({ ...mockProducts[0], id: 'p2' });
    productsApi.update.mockResolvedValue(mockProducts[0]);
    productsApi.remove.mockResolvedValue({ deleted: true });
  });

  it('renders brand list in sidebar', async () => {
    render(<AdminPage />);
    // Nike appears in sidebar AND in the product table (as brandName), so use getAllByText
    await waitFor(() => expect(screen.getAllByText('Nike').length).toBeGreaterThan(0));
    expect(screen.getByText('Adidas')).toBeTruthy();
  });

  it('renders "All Brands" option', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText(/all brands/i)).toBeTruthy());
  });

  it('shows Add Product button', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: /add product/i })).toBeTruthy());
  });

  it('opens ProductForm modal when Add Product is clicked', async () => {
    render(<AdminPage />);
    await waitFor(() => screen.getByRole('button', { name: /add product/i }));
    fireEvent.click(screen.getByRole('button', { name: /add product/i }));
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('shows save error inside the dialog when create fails', async () => {
    productsApi.create.mockRejectedValue(new Error('type is required'));
    render(<AdminPage />);
    await waitFor(() => screen.getByRole('button', { name: /add product/i }));
    fireEvent.click(screen.getByRole('button', { name: /add product/i }));
    const dialog = screen.getByRole('dialog');
    const form = dialog.querySelector('form');
    fireEvent.submit(form);
    await waitFor(() => {
      expect(dialog.textContent).toContain('type is required');
    });
  });
});
