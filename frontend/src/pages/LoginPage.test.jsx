import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../contexts/AuthContext';
import LoginPage from './LoginPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password fields', () => {
    useAuth.mockReturnValue({ login: vi.fn(), user: null });
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByLabelText(/password/i)).toBeTruthy();
  });

  it('renders a submit button', () => {
    useAuth.mockReturnValue({ login: vi.fn(), user: null });
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeTruthy();
  });

  it('calls login with email and password on submit', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    useAuth.mockReturnValue({ login: mockLogin, user: null });
    render(<MemoryRouter><LoginPage /></MemoryRouter>);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password1!' } });
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'Password1!'));
  });

  it('navigates to /admin after successful login', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    useAuth.mockReturnValue({ login: mockLogin, user: null });
    render(<MemoryRouter><LoginPage /></MemoryRouter>);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass' } });
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin'));
  });

  it('shows error message when login fails', async () => {
    const mockLogin = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    useAuth.mockReturnValue({ login: mockLogin, user: null });
    render(<MemoryRouter><LoginPage /></MemoryRouter>);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'x@y.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => expect(screen.getByText(/invalid credentials/i)).toBeTruthy());
  });
});
