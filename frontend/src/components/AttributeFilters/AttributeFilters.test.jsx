import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AttributeFilters from './AttributeFilters';

const stringSchema = {
  color: { type: 'string', values: ['black', 'blue', 'red'] }
};
const numberSchema = {
  ram_gb: { type: 'number', min: 8, max: 32 }
};
const boolSchema = {
  wireless: { type: 'boolean' }
};

describe('AttributeFilters', () => {
  it('renders nothing when schema is empty', () => {
    const { container } = render(<AttributeFilters schema={{}} value={{}} onChange={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders checkbox list for string attribute', () => {
    render(<AttributeFilters schema={stringSchema} value={{}} onChange={vi.fn()} />);
    expect(screen.getByText('red')).toBeTruthy();
    expect(screen.getByText('blue')).toBeTruthy();
    expect(screen.getByText('black')).toBeTruthy();
  });

  it('renders min/max inputs for number attribute', () => {
    render(<AttributeFilters schema={numberSchema} value={{}} onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Min (8)')).toBeTruthy();
    expect(screen.getByPlaceholderText('Max (32)')).toBeTruthy();
  });

  it('renders single checkbox for boolean attribute', () => {
    render(<AttributeFilters schema={boolSchema} value={{}} onChange={vi.fn()} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeTruthy();
  });

  // --- String/boolean controls: fire immediately (no debounce) ---

  it('calls onChange with array when string checkbox is checked', () => {
    const onChange = vi.fn();
    render(<AttributeFilters schema={stringSchema} value={{}} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /red/i }));
    expect(onChange).toHaveBeenCalledWith({ color: ['red'] });
  });

  it('removes value from array when string checkbox is unchecked', () => {
    const onChange = vi.fn();
    render(<AttributeFilters schema={stringSchema} value={{ color: ['red', 'blue'] }} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /red/i }));
    expect(onChange).toHaveBeenCalledWith({ color: ['blue'] });
  });

  it('calls onChange with true for boolean when checked', () => {
    const onChange = vi.fn();
    render(<AttributeFilters schema={boolSchema} value={{}} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith({ wireless: true });
  });

  it('removes key when boolean is unchecked', () => {
    const onChange = vi.fn();
    render(<AttributeFilters schema={boolSchema} value={{ wireless: true }} onChange={onChange} />);
    const cb = screen.getByRole('checkbox');
    expect(cb.checked).toBe(true);
    fireEvent.click(cb);
    const call = onChange.mock.calls[0][0];
    expect(call.wireless).toBeUndefined();
  });

  it('shows clear link when any attribute is set', () => {
    render(<AttributeFilters schema={stringSchema} value={{ color: ['red'] }} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /clear/i })).toBeTruthy();
  });

  it('calls onChange with empty object when clear is clicked', () => {
    const onChange = vi.fn();
    render(<AttributeFilters schema={stringSchema} value={{ color: ['red'] }} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(onChange).toHaveBeenCalledWith({});
  });

  // --- Number inputs: debounced (300ms) ---

  describe('number attribute inputs (debounced)', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it('does NOT call onChange immediately when number min input changes', () => {
      const onChange = vi.fn();
      render(<AttributeFilters schema={numberSchema} value={{}} onChange={onChange} />);
      fireEvent.change(screen.getByPlaceholderText('Min (8)'), { target: { value: '16' } });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('calls onChange with range object after 300ms when number min input changes', () => {
      const onChange = vi.fn();
      render(<AttributeFilters schema={numberSchema} value={{}} onChange={onChange} />);
      fireEvent.change(screen.getByPlaceholderText('Min (8)'), { target: { value: '16' } });
      act(() => { vi.advanceTimersByTime(300); });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        ram_gb: expect.objectContaining({ min: '16' })
      }));
    });

    it('does NOT call onChange immediately when number max input changes', () => {
      const onChange = vi.fn();
      render(<AttributeFilters schema={numberSchema} value={{}} onChange={onChange} />);
      fireEvent.change(screen.getByPlaceholderText('Max (32)'), { target: { value: '24' } });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('calls onChange with both min and max after settling', () => {
      const onChange = vi.fn();
      render(<AttributeFilters schema={numberSchema} value={{}} onChange={onChange} />);
      fireEvent.change(screen.getByPlaceholderText('Min (8)'), { target: { value: '8' } });
      fireEvent.change(screen.getByPlaceholderText('Max (32)'), { target: { value: '24' } });
      act(() => { vi.advanceTimersByTime(300); });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        ram_gb: expect.objectContaining({ min: '8', max: '24' })
      }));
    });

    it('clears number range when value prop resets to {}', () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <AttributeFilters schema={numberSchema} value={{}} onChange={onChange} />
      );
      fireEvent.change(screen.getByPlaceholderText('Min (8)'), { target: { value: '16' } });
      // Reset parent value to empty
      rerender(<AttributeFilters schema={numberSchema} value={{}} onChange={onChange} />);
      // Input should show empty
      expect(screen.getByPlaceholderText('Min (8)').value).toBe('');
    });
  });
});
