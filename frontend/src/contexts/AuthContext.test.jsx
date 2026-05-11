import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function TestConsumer() {
  const { user, loading, login, logout } = useAuth();
  if (loading) return <div>loading</div>;
  if (!user) return <button onClick={() => login('a@b.com', 'pass')}>Login</button>;
  return (
    <>
      <div data-testid="user-email">{user.email}</div>
      <div data-testid="user-role">{user.role}</div>
      <button onClick={logout}>Logout</button>
    </>
  );
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {})); // never resolves
    renderWithAuth();
    expect(screen.getByText('loading')).toBeTruthy();
  });

  it('sets user when /auth/me returns authenticated user', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { id: '1', email: 'admin@test.com', role: 'admin' } }),
    });
    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('user-email').textContent).toBe('admin@test.com'));
    expect(screen.getByTestId('user-role').textContent).toBe('admin');
  });

  it('sets user to null when /auth/me returns 401', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: { code: 'UNAUTHORIZED' } }),
    });
    renderWithAuth();
    await waitFor(() => expect(screen.getByRole('button', { name: /login/i })).toBeTruthy());
  });

  it('login() calls POST /auth/login and updates user', async () => {
    // Initial /me → 401
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: { code: 'UNAUTHORIZED' } }),
    });
    renderWithAuth();
    await waitFor(() => screen.getByRole('button', { name: /login/i }));

    // Login call → 200
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { id: '1', email: 'a@b.com', role: 'admin' } }),
    });
    await act(async () => {
      screen.getByRole('button', { name: /login/i }).click();
    });
    await waitFor(() => expect(screen.getByTestId('user-email').textContent).toBe('a@b.com'));
  });

  it('logout() calls POST /auth/logout and clears user', async () => {
    // Initial /me → authenticated
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { id: '1', email: 'admin@test.com', role: 'admin' } }),
    });
    renderWithAuth();
    await waitFor(() => screen.getByRole('button', { name: /logout/i }));

    // Logout call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: null }),
    });
    await act(async () => {
      screen.getByRole('button', { name: /logout/i }).click();
    });
    await waitFor(() => expect(screen.getByRole('button', { name: /login/i })).toBeTruthy());
  });
});
