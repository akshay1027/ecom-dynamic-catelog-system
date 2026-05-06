import { renderHook, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useProducts } from '../../src/hooks/useProducts';

function mockFetch(data) {
  globalThis.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, data, error: null }),
  });
}

function mockFetchError(message) {
  globalThis.fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ success: false, data: null, error: { code: 'SERVER_ERROR', message } }),
  });
}

describe('useProducts', () => {
  test('calls fetch on mount', async () => {
    mockFetch({ items: [], total: 0, page: 1, limit: 20 });
    const { result } = renderHook(() => useProducts({}));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  test('returns loading=true initially then loading=false after resolve', async () => {
    mockFetch({ items: [], total: 0, page: 1, limit: 20 });
    const { result } = renderHook(() => useProducts({}));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  test('returns items from successful API response', async () => {
    const items = [{ id: '1', name: 'Shirt' }];
    mockFetch({ items, total: 1, page: 1, limit: 20 });
    const { result } = renderHook(() => useProducts({}));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual(items);
    expect(result.current.total).toBe(1);
  });

  test('returns error message when API fails', async () => {
    mockFetchError('Server error');
    const { result } = renderHook(() => useProducts({}));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Server error');
    expect(result.current.items).toEqual([]);
  });

  test('re-fetches when filters change', async () => {
    mockFetch({ items: [], total: 0, page: 1, limit: 20 });
    mockFetch({ items: [], total: 0, page: 1, limit: 20 });
    const { result, rerender } = renderHook(({ filters }) => useProducts(filters), {
      initialProps: { filters: {} },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender({ filters: { category: 'apparel' } });
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(2));
  });

  test('returns error=null and items=[] on initial state', () => {
    mockFetch({ items: [], total: 0, page: 1, limit: 20 });
    const { result } = renderHook(() => useProducts({}));
    expect(result.current.error).toBeNull();
    expect(result.current.items).toEqual([]);
  });
});
