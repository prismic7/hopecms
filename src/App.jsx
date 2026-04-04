import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CustomersPage from './pages/CustomersPage';
import SalesPage from './pages/SalesPage';
import ProductsPage from './pages/ProductsPage';
import AdminPage from './pages/AdminPage';
import DeletedCustomersPage from './pages/DeletedCustomersPage';
import AuthCallbackPage from './pages/AuthCallbackPage';

function ProtectedRoute({ children }) {
  // Auth logic will be wired in Sprint 2 by M4
  // For now just renders the page
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/customers" />} />
        <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/deleted-customers" element={<ProtectedRoute><DeletedCustomersPage /></ProtectedRoute>} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
      </Routes>
    </BrowserRouter>
  );
}