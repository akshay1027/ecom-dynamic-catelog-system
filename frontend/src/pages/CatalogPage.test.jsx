import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CatalogPage from './CatalogPage';

vi.mock('../hooks/useProducts', () => ({
  useProducts: vi.fn(() => ({ items: [], total: 0, loading: false, error: null })),
  useBrands: vi.fn(() => ({ brands: [], loading: false, error: null })),
}));

describe('CatalogPage drawer behavior', () => {
  it('shows filter toggle button on mobile', () => {
    render(<CatalogPage />);
    expect(screen.getByRole('button', { name: /filters/i })).toBeTruthy();
  });

  it('opens drawer when filter toggle is clicked', () => {
    render(<CatalogPage />);
    const sidebar = document.querySelector('.app-sidebar');
    expect(sidebar.classList.contains('open')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    expect(sidebar.classList.contains('open')).toBe(true);
  });

  it('closes drawer when overlay is clicked', () => {
    render(<CatalogPage />);
    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    const overlay = document.querySelector('.drawer-overlay');
    fireEvent.click(overlay);
    expect(document.querySelector('.app-sidebar').classList.contains('open')).toBe(false);
  });
});
