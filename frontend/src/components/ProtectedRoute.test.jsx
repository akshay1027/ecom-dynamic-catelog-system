import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';

describe('ProtectedRoute', () => {
  it('renders children when user has the required role', () => {
    useAuth.mockReturnValue({ user: { role: 'admin' }, loading: false });
    render(
      <MemoryRouter>
        <ProtectedRoute role="admin"><div>Protected Content</div></ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText('Protected Content')).toBeTruthy();
  });

  it('redirects to /login when user is null', () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <ProtectedRoute role="admin"><div>Protected Content</div></ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('redirects when user has wrong role', () => {
    useAuth.mockReturnValue({ user: { role: 'viewer' }, loading: false });
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <ProtectedRoute role="admin"><div>Protected Content</div></ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('shows loading indicator while auth is resolving', () => {
    useAuth.mockReturnValue({ user: null, loading: true });
    render(
      <MemoryRouter>
        <ProtectedRoute role="admin"><div>Protected Content</div></ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.queryByText('Protected Content')).toBeNull();
  });
});
