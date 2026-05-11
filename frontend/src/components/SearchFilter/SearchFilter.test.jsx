import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import SearchFilter from './SearchFilter';

describe('SearchFilter', () => {
  let onFiltersChange;

  beforeEach(() => {
    onFiltersChange = vi.fn();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- Render tests (no behavior change) ---

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

  test('renders brand select when brands prop is provided', () => {
    const brands = [{ id: '1', name: 'Nike' }, { id: '2', name: 'Adidas' }];
    render(<SearchFilter onFiltersChange={() => {}} brands={brands} />);
    expect(screen.getByLabelText(/brand/i)).toBeInTheDocument();
  });

  // --- Discrete controls: fire immediately without advancing timers ---

  test('calls onFiltersChange immediately when category changes (no debounce)', async () => {
    render(<SearchFilter onFiltersChange={onFiltersChange} />);
    const select = screen.getByLabelText(/category/i);
    await userEvent.selectOptions(select, 'apparel');
    // no timer advance — must have fired already
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ category: 'apparel' }));
  });

  // --- Reset fires immediately ---

  test('calls onFiltersChange with {} when Reset button is clicked', async () => {
    render(<SearchFilter onFiltersChange={onFiltersChange} />);
    const reset = screen.getByRole('button', { name: /reset/i });
    await userEvent.click(reset);
    expect(onFiltersChange).toHaveBeenCalledWith({});
  });

  // --- Text inputs: debounced (300ms) ---

  test('does NOT call onFiltersChange with name immediately on first keystroke', async () => {
    render(<SearchFilter onFiltersChange={onFiltersChange} />);
    // clear any mount-time calls
    onFiltersChange.mockClear();
    const input = screen.getByPlaceholderText(/search/i);
    await userEvent.type(input, 's');
    // no timer advance — should not have fired with name set
    const nameCalls = onFiltersChange.mock.calls.filter(([arg]) => arg.name);
    expect(nameCalls.length).toBe(0);
  });

  test('calls onFiltersChange with name after 300ms debounce', async () => {
    render(<SearchFilter onFiltersChange={onFiltersChange} />);
    const input = screen.getByPlaceholderText(/search/i);
    await userEvent.type(input, 'shirt');
    act(() => { vi.advanceTimersByTime(300); });
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'shirt' }));
  });

  test('rapid typing fires onFiltersChange only once — not per keystroke', async () => {
    render(<SearchFilter onFiltersChange={onFiltersChange} />);
    onFiltersChange.mockClear();
    const input = screen.getByPlaceholderText(/search/i);

    // type 5 chars one by one with small gaps (less than debounce delay)
    for (const char of ['s', 'h', 'i', 'r', 't']) {
      await userEvent.type(input, char);
      act(() => { vi.advanceTimersByTime(100); }); // 100ms between chars — under 300ms threshold
    }

    // settle the last timer
    act(() => { vi.advanceTimersByTime(300); });

    const nameCalls = onFiltersChange.mock.calls.filter(([arg]) => arg.name === 'shirt');
    expect(nameCalls.length).toBe(1); // exactly one call with the final value
  });

  test('does NOT call onFiltersChange with minPrice immediately on each keystroke', async () => {
    render(<SearchFilter onFiltersChange={onFiltersChange} />);
    onFiltersChange.mockClear();
    const input = screen.getByLabelText(/min price/i);
    await userEvent.type(input, '1');
    const priceCalls = onFiltersChange.mock.calls.filter(([arg]) => arg.minPrice);
    expect(priceCalls.length).toBe(0);
  });

  test('calls onFiltersChange with minPrice after 300ms debounce', async () => {
    render(<SearchFilter onFiltersChange={onFiltersChange} />);
    const input = screen.getByLabelText(/min price/i);
    await userEvent.type(input, '10');
    act(() => { vi.advanceTimersByTime(300); });
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ minPrice: '10' }));
  });
});
