import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import SearchFilter from './SearchFilter';

describe('SearchFilter', () => {
  let onFiltersChange;

  beforeEach(() => {
    onFiltersChange = vi.fn();
  });

  test('renders search input', () => {
    render(<SearchFilter onFiltersChange={onFiltersChange} />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  test('renders category select', () => {
    render(<SearchFilter onFiltersChange={onFiltersChange} />);
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
  });

  test('renders min and max price inputs', () => {
    render(<SearchFilter onFiltersChange={onFiltersChange} />);
    expect(screen.getByLabelText(/min price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/max price/i)).toBeInTheDocument();
  });

  test('calls onFiltersChange when category changes', async () => {
    render(<SearchFilter onFiltersChange={onFiltersChange} />);
    const select = screen.getByLabelText(/category/i);
    await userEvent.selectOptions(select, 'apparel');
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ category: 'apparel' }));
  });

  test('calls onFiltersChange when Reset button is clicked', async () => {
    render(<SearchFilter onFiltersChange={onFiltersChange} />);
    const reset = screen.getByRole('button', { name: /reset/i });
    await userEvent.click(reset);
    expect(onFiltersChange).toHaveBeenCalledWith({});
  });

  test('calls onFiltersChange when name input changes', async () => {
    render(<SearchFilter onFiltersChange={onFiltersChange} />);
    const input = screen.getByPlaceholderText(/search/i);
    await userEvent.type(input, 'shirt');
    await waitFor(() => {
      expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ name: expect.stringContaining('shirt') }));
    });
  });

  test('renders brand select when brands prop is provided', () => {
    const brands = [{ id: '1', name: 'Nike' }, { id: '2', name: 'Adidas' }];
    render(<SearchFilter onFiltersChange={() => {}} brands={brands} />);
    expect(screen.getByLabelText(/brand/i)).toBeInTheDocument();
  });
});
