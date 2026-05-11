import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BrandForm from './BrandForm';

describe('BrandForm', () => {
  const onSave = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has a dialog role', () => {
    render(<BrandForm onSave={onSave} onClose={onClose} />);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('renders "Add Brand" title for a new brand', () => {
    render(<BrandForm onSave={onSave} onClose={onClose} />);
    expect(screen.getByText('Add Brand')).toBeTruthy();
  });

  it('renders "Edit Brand" title when a brand is provided', () => {
    render(<BrandForm brand={{ id: 'b1', name: 'Nike' }} onSave={onSave} onClose={onClose} />);
    expect(screen.getByText('Edit Brand')).toBeTruthy();
  });

  it('pre-fills all fields when editing', () => {
    render(
      <BrandForm
        brand={{ id: 'b1', name: 'Nike', description: 'Just Do It', website: 'https://nike.com', logoUrl: 'https://nike.com/logo.png' }}
        onSave={onSave}
        onClose={onClose}
      />
    );
    expect(screen.getByDisplayValue('Nike')).toBeTruthy();
    expect(screen.getByDisplayValue('Just Do It')).toBeTruthy();
    expect(screen.getByDisplayValue('https://nike.com')).toBeTruthy();
    expect(screen.getByDisplayValue('https://nike.com/logo.png')).toBeTruthy();
  });

  it('calls onSave with form data on submit', () => {
    render(<BrandForm onSave={onSave} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Puma' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Forever Faster' } });
    fireEvent.submit(screen.getByRole('form'));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Puma', description: 'Forever Faster' })
    );
  });

  it('calls onClose when the close button is clicked', () => {
    render(<BrandForm onSave={onSave} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Cancel is clicked', () => {
    render(<BrandForm onSave={onSave} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows saveError when provided', () => {
    render(<BrandForm onSave={onSave} onClose={onClose} saveError="Brand name already taken" />);
    expect(screen.getByText('Brand name already taken')).toBeTruthy();
  });
});
