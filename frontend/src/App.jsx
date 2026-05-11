import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import CatalogPage from './pages/CatalogPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import './App.css';

function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <nav className="app-nav">
      <Link to="/" className="nav-brand">ShopCatalog</Link>
      <div className="nav-links">
        <Link to="/" className="nav-link">Catalog</Link>
        {user?.role === 'admin' && <Link to="/admin" className="nav-link">Admin</Link>}
        {user
          ? <button className="nav-btn" onClick={handleLogout}>Sign out</button>
          : <Link to="/login" className="nav-link">Sign in</Link>
        }
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app-root">
        <NavBar />
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={
            <ProtectedRoute role="admin"><AdminPage /></ProtectedRoute>
          } />
        </Routes>
      </div>
    </AuthProvider>
  );
}
