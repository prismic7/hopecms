import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { UserRightsProvider } from './context/UserRightsContext'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import CustomerDetailPage from './pages/CustomerDetailPage'
import AppShell from './components/AppShell'
import CustomersPage from './pages/CustomersPage'
import SalesPage from './pages/SalesPage'
import ProductsPage from './pages/ProductsPage'
import AdminPage from './pages/AdminPage'
import CustomerSalesSummaryPage from './pages/CustomerSalesSummaryPage'
import TopCustomersPage from './pages/TopCustomersPage'
import ProductRevenuePage from './pages/ProductRevenuePage'
import DeletedCustomersPage from './pages/DeletedCustomersPage'

function ProtectedRoute() {
  const { currentUser, loading, signOut } = useAuth()
  if (loading) return <LoadingScreen />
  if (!currentUser) return <Navigate to="/login" replace />
  return (
    <AppShell currentUser={currentUser} onLogout={signOut}>
      <Outlet />
    </AppShell>
  )
}

function AdminRoute() {
  const { currentUser, loading, signOut } = useAuth()
  if (loading) return <LoadingScreen />
  if (!currentUser) return <Navigate to="/login" replace />
  if (currentUser.user_type === 'USER') return <Navigate to="/customers" replace />
  return (
    <AppShell currentUser={currentUser} onLogout={signOut}>
      <Outlet />
    </AppShell>
  )
}

function LoadingScreen() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@300;400&display=swap');

        .ls-root {
          position: fixed;
          inset: 0;
          background: #0a0a0a;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0;
          font-family: 'DM Sans', system-ui, sans-serif;
          z-index: 9999;
          animation: ls-fade-in 0.3s ease;
        }

        @keyframes ls-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* Animated background grid — same as login */
        .ls-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: ls-grid-drift 20s linear infinite;
          pointer-events: none;
        }
        @keyframes ls-grid-drift {
          0%   { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }

        /* Soft ambient blob */
        .ls-blob {
          position: absolute;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: rgba(255,255,255,0.03);
          filter: blur(80px);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          animation: ls-blob-pulse 6s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes ls-blob-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50%       { transform: translate(-50%, -50%) scale(1.15); }
        }

        /* Logo mark */
        .ls-logo {
          position: relative;
          z-index: 1;
          width: 48px; height: 48px;
          background: white;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 32px;
          animation: ls-logo-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
        }
        @keyframes ls-logo-in {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1); }
        }
        .ls-logo svg { width: 26px; height: 26px; }

        /* Spinner ring */
        .ls-spinner-wrap {
          position: relative;
          z-index: 1;
          width: 48px; height: 48px;
          margin-bottom: 24px;
          animation: ls-spinner-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both;
        }
        @keyframes ls-spinner-in {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1); }
        }

        .ls-spinner-track {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.08);
        }
        .ls-spinner-arc {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: rgba(255,255,255,0.7);
          border-right-color: rgba(255,255,255,0.2);
          animation: ls-spin 0.9s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes ls-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* Text */
        .ls-text {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          animation: ls-text-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both;
        }
        @keyframes ls-text-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .ls-label {
          font-size: 13px;
          font-weight: 400;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.3px;
        }

        /* Animated dots */
        .ls-dots span {
          display: inline-block;
          width: 3px; height: 3px;
          border-radius: 50%;
          background: rgba(255,255,255,0.3);
          margin: 0 2px;
          animation: ls-dot-bounce 1.4s ease-in-out infinite;
        }
        .ls-dots span:nth-child(1) { animation-delay: 0s; }
        .ls-dots span:nth-child(2) { animation-delay: 0.2s; }
        .ls-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes ls-dot-bounce {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30%            { opacity: 1;   transform: translateY(-4px); }
        }

        /* Bottom watermark */
        .ls-watermark {
          position: absolute;
          bottom: 24px;
          font-size: 11px;
          color: rgba(255,255,255,0.1);
          letter-spacing: 1px;
          z-index: 1;
          font-family: 'DM Sans', sans-serif;
        }
      `}</style>

      <div className="ls-root">
        <div className="ls-blob" />

        {/* Logo */}
        <div className="ls-logo">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 3L21 8.5V15.5L12 21L3 15.5V8.5L12 3Z" fill="#0a0a0a" />
            <circle cx="12" cy="12" r="3" fill="white" />
          </svg>
        </div>

        {/* Spinner */}
        <div className="ls-spinner-wrap">
          <div className="ls-spinner-track" />
          <div className="ls-spinner-arc" />
        </div>

        {/* Label */}
        <div className="ls-text">
          <span className="ls-label">Loading</span>
          <div className="ls-dots">
            <span /><span /><span />
          </div>
        </div>

        <div className="ls-watermark">HOPE, INC. CMS</div>
      </div>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <UserRightsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/customers/:custno" element={<CustomerDetailPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/reports/customer-sales" element={<CustomerSalesSummaryPage />} />
              <Route path="/reports/top-customers" element={<TopCustomersPage />} />
              <Route path="/reports/product-revenue" element={<ProductRevenuePage />} />
            </Route>

            <Route element={<AdminRoute />}>
              <Route path="/deleted-customers" element={<DeletedCustomersPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </UserRightsProvider>
    </AuthProvider>
  )
}