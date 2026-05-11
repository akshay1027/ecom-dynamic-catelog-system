import { renderHook, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useProducts, useAttributeSchema, useBrands, invalidateProductCache } from '../../src/hooks/useProducts';

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
  beforeEach(() => {
    invalidateProductCache?.();
  });

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

  // --- Cache tests ---

  test('returns cached data on second mount with same filters — no second fetch', async () => {
    const items = [{ id: '1', name: 'Shirt' }];
    mockFetch({ items, total: 1, page: 1, limit: 20 });

    const { unmount } = renderHook(() => useProducts({}));
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1));
    unmount();

    const { result } = renderHook(() => useProducts({}));
    expect(result.current.loading).toBe(false);
    expect(result.current.items).toEqual(items);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  test('re-fetches after invalidateProductCache()', async () => {
    mockFetch({ items: [], total: 0, page: 1, limit: 20 });
    mockFetch({ items: [{ id: '1', name: 'Shirt' }], total: 1, page: 1, limit: 20 });

    const { unmount } = renderHook(() => useProducts({}));
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1));
    unmount();

    invalidateProductCache();

    const { result } = renderHook(() => useProducts({}));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  test('different filters produce separate cache entries', async () => {
    mockFetch({ items: [], total: 0, page: 1, limit: 20 });
    mockFetch({ items: [{ id: '1' }], total: 1, page: 1, limit: 20 });

    const { result: r1 } = renderHook(() => useProducts({}));
    await waitFor(() => expect(r1.current.loading).toBe(false));

    const { result: r2 } = renderHook(() => useProducts({ category: 'apparel' }));
    await waitFor(() => expect(r2.current.loading).toBe(false));

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  test('errors are not cached — re-fetches after failed request', async () => {
    mockFetchError('Server error');
    mockFetch({ items: [{ id: '1', name: 'Shirt' }], total: 1, page: 1, limit: 20 });

    const { unmount } = renderHook(() => useProducts({}));
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1));
    unmount();

    const { result } = renderHook(() => useProducts({}));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(result.current.items).toEqual([{ id: '1', name: 'Shirt' }]);
  });

  // --- AbortController tests ---

  test('passes an AbortSignal to fetch — abort fires when component unmounts', () => {
    let abortCalled = false;
    globalThis.fetch.mockImplementationOnce((_url, options) => {
      options?.signal?.addEventListener('abort', () => { abortCalled = true; });
      return new Promise(() => {}); // never resolves
    });

    const { unmount } = renderHook(() => useProducts({}));
    unmount(); // triggers cleanup → controller.abort()
    expect(abortCalled).toBe(true);
  });

  test('does not set error state when request is aborted (AbortError silently ignored)', async () => {
    globalThis.fetch.mockImplementationOnce((_url, options) => {
      return new Promise((_resolve, reject) => {
        options?.signal?.addEventListener('abort', () => {
          reject(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }));
        });
      });
    });

    const { result, unmount } = renderHook(() => useProducts({}));
    unmount();

    await new Promise(r => setTimeout(r, 10));
    expect(result.current.error).toBeNull();
  });
});

describe('useBrands', () => {
  test('passes an AbortSignal to fetch — abort fires when component unmounts', () => {
    let abortCalled = false;
    globalThis.fetch.mockImplementationOnce((_url, options) => {
      options?.signal?.addEventListener('abort', () => { abortCalled = true; });
      return new Promise(() => {});
    });

    const { unmount } = renderHook(() => useBrands());
    unmount();
    expect(abortCalled).toBe(true);
  });
});

describe('useAttributeSchema', () => {
  test('does not call API when category is empty', () => {
    const { result } = renderHook(() => useAttributeSchema({ category: '' }));
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(result.current.schema).toEqual({});
  });
});
