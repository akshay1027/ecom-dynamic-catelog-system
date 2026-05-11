import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminPage from './AdminPage';

vi.mock('../api/products', () => ({
  brandsApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  productsApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));

import { brandsApi, productsApi } from '../api/products';

const mockBrands = [
  { id: 'b1', name: 'Nike', description: 'Just Do It', website: 'https://nike.com', logoUrl: '' },
  { id: 'b2', name: 'Adidas', description: '', website: '', logoUrl: '' },
];

const mockProducts = [
  { id: 'p1', name: 'Air Max', brandId: 'b1', brandName: 'Nike', price: 120, currency: 'USD', category: 'apparel', type: 'shoe', stock: 10, description: 'desc', images: [], tags: [], attributes: {} },
];

describe('AdminPage — Products tab (existing behaviour)', () => {
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
    await waitFor(() => expect(screen.getAllByText('Nike').length).toBeGreaterThan(0));
    expect(screen.getByText('Adidas')).toBeTruthy();
  });

  it('renders "All Brands" option', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText(/all brands/i)).toBeTruthy());
  });

  it('shows Add Product button on Products tab', async () => {
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

describe('AdminPage — Brands tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    brandsApi.list.mockResolvedValue(mockBrands);
    brandsApi.create.mockResolvedValue({ id: 'b3', name: 'Puma', description: '', website: '', logoUrl: '' });
    brandsApi.update.mockResolvedValue({ ...mockBrands[0], name: 'Nike Updated' });
    brandsApi.remove.mockResolvedValue({ deleted: true });
    productsApi.list.mockResolvedValue({ items: mockProducts, total: 1 });
  });

  it('renders a Brands tab button', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: /^brands$/i })).toBeTruthy());
  });

  it('renders a Products tab button', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: /^products$/i })).toBeTruthy());
  });

  it('switching to Brands tab shows brand management table with brands', async () => {
    render(<AdminPage />);
    await waitFor(() => screen.getByRole('button', { name: /^brands$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^brands$/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /add brand/i })).toBeTruthy());
    // Nike appears in both sidebar and brands table; Adidas too
    expect(screen.getAllByText('Nike').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Adidas').length).toBeGreaterThan(0);
  });

  it('opens BrandForm when Add Brand is clicked', async () => {
    render(<AdminPage />);
    await waitFor(() => screen.getByRole('button', { name: /^brands$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^brands$/i }));
    await waitFor(() => screen.getByRole('button', { name: /add brand/i }));
    fireEvent.click(screen.getByRole('button', { name: /add brand/i }));
    expect(screen.getByText('Add Brand')).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('calls brandsApi.create and refreshes on brand save', async () => {
    render(<AdminPage />);
    await waitFor(() => screen.getByRole('button', { name: /^brands$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^brands$/i }));
    await waitFor(() => screen.getByRole('button', { name: /add brand/i }));
    fireEvent.click(screen.getByRole('button', { name: /add brand/i }));

    const dialog = screen.getByRole('dialog');
    fireEvent.change(dialog.querySelector('#bf-name'), { target: { value: 'Puma' } });
    fireEvent.submit(dialog.querySelector('form'));

    await waitFor(() => {
      expect(brandsApi.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Puma' }));
    });
    expect(brandsApi.list).toHaveBeenCalledTimes(2); // initial load + refresh
  });

  it('calls brandsApi.update when editing a brand', async () => {
    render(<AdminPage />);
    await waitFor(() => screen.getByRole('button', { name: /^brands$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^brands$/i }));
    await waitFor(() => screen.getAllByRole('button', { name: /^edit$/i }));

    const editButtons = screen.getAllByRole('button', { name: /^edit$/i });
    fireEvent.click(editButtons[0]); // edit Nike

    expect(screen.getByText('Edit Brand')).toBeTruthy();
    const dialog = screen.getByRole('dialog');
    fireEvent.submit(dialog.querySelector('form'));

    await waitFor(() => {
      expect(brandsApi.update).toHaveBeenCalledWith('b1', expect.objectContaining({ name: 'Nike' }));
    });
  });

  it('calls brandsApi.remove on delete confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<AdminPage />);
    await waitFor(() => screen.getByRole('button', { name: /^brands$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^brands$/i }));
    await waitFor(() => screen.getAllByRole('button', { name: /^delete$/i }));

    const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(brandsApi.remove).toHaveBeenCalledWith('b1');
    });
  });

  it('does not call brandsApi.remove if delete is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<AdminPage />);
    await waitFor(() => screen.getByRole('button', { name: /^brands$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^brands$/i }));
    await waitFor(() => screen.getAllByRole('button', { name: /^delete$/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /^delete$/i })[0]);
    expect(brandsApi.remove).not.toHaveBeenCalled();
  });

  it('shows save error inside BrandForm dialog when create fails', async () => {
    brandsApi.create.mockRejectedValue(new Error('brand name already exists'));
    render(<AdminPage />);
    await waitFor(() => screen.getByRole('button', { name: /^brands$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^brands$/i }));
    await waitFor(() => screen.getByRole('button', { name: /add brand/i }));
    fireEvent.click(screen.getByRole('button', { name: /add brand/i }));

    const dialog = screen.getByRole('dialog');
    fireEvent.change(dialog.querySelector('#bf-name'), { target: { value: 'Nike' } });
    fireEvent.submit(dialog.querySelector('form'));

    await waitFor(() => {
      expect(dialog.textContent).toContain('brand name already exists');
    });
  });

  it('closes brand form without API call when Cancel is clicked', async () => {
    render(<AdminPage />);
    await waitFor(() => screen.getByRole('button', { name: /^brands$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^brands$/i }));
    await waitFor(() => screen.getByRole('button', { name: /add brand/i }));
    fireEvent.click(screen.getByRole('button', { name: /add brand/i }));
    expect(screen.getByRole('dialog')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(brandsApi.create).not.toHaveBeenCalled();
  });
});
