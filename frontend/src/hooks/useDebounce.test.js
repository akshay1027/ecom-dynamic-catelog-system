import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  test('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  test('does not update debounced value before delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    );
    rerender({ value: 'ab' });
    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current).toBe('a');
  });

  test('updates debounced value after delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    );
    rerender({ value: 'ab' });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe('ab');
  });

  test('resets timer on each rapid change — only last value applied', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    );
    rerender({ value: 'ab' });
    act(() => { vi.advanceTimersByTime(200); });
    rerender({ value: 'abc' });
    act(() => { vi.advanceTimersByTime(200); });
    // 200ms since last change — not yet settled
    expect(result.current).toBe('a');
    act(() => { vi.advanceTimersByTime(100); });
    // now 300ms since 'abc' — should update
    expect(result.current).toBe('abc');
  });

  test('uses default delay of 300ms when no delay provided', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'x' } }
    );
    rerender({ value: 'y' });
    act(() => { vi.advanceTimersByTime(299); });
    expect(result.current).toBe('x');
    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current).toBe('y');
  });

  test('clears timeout on unmount — no state update after unmount', () => {
    const { result, rerender, unmount } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    );
    rerender({ value: 'ab' });
    unmount();
    // should not throw "state update on unmounted component"
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe('a');
  });

  test('accepts numeric values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 0 } }
    );
    rerender({ value: 42 });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe(42);
  });

  test('accepts object values — uses referential equality', () => {
    const obj1 = { a: 1 };
    const obj2 = { a: 2 };
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: obj1 } }
    );
    rerender({ value: obj2 });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe(obj2);
  });
});
