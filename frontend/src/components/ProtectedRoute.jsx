import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || (role && user.role !== role)) return <Navigate to="/login" replace />;
  return children;
}
