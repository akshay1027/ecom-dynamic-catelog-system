import { Routes, Route, Link } from 'react-router-dom';
import CatalogPage from './pages/CatalogPage';
import AdminPage from './pages/AdminPage';
import './App.css';

export default function App() {
  return (
    <div className="app-root">
      <nav className="app-nav">
        <Link to="/" className="nav-brand">ShopCatalog</Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Catalog</Link>
          <Link to="/admin" className="nav-link">Admin</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </div>
  );
}
