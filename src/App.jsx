import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { UserRightsProvider } from './context/UserRightsContext'

// ── Pages that exist after Sprint 1 ──────────────────────────────────────────
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AuthCallbackPage from './pages/AuthCallbackPage'

// ── M2's App Shell (built in Sprint 1 Issue 7) ───────────────────────────────
import AppShell from './components/AppShell'

// ── M1's placeholder pages (Sprint 1 Issue 3) ────────────────────────────────
// These should exist as placeholder files. If Vite reports a missing import,
// ask M1 to create the file with: export default function XPage() { return <div>X</div> }
import CustomersPage from './pages/CustomersPage'
import SalesPage from './pages/SalesPage'
import ProductsPage from './pages/ProductsPage'
import AdminPage from './pages/AdminPage'
import DeletedCustomersPage from './pages/DeletedCustomersPage'

// ─────────────────────────────────────────────────────────────────────────────
// ProtectedRoute — defined INLINE here, not as a separate file.
//
// Previous App.jsx tried: import ProtectedRoute from './components/ProtectedRoute'
// That file doesn't exist yet (it's M1's Sprint 1 deliverable for Issue 3).
// Defining it here resolves the Vite "Failed to resolve import" crash.
//
// When M1 eventually creates src/components/ProtectedRoute.jsx, this inline
// version can be deleted and the import uncommented.
// ─────────────────────────────────────────────────────────────────────────────
function ProtectedRoute() {
  const { currentUser, loading, signOut } = useAuth()

  // Show a spinner while the login guard is running
  if (loading) return <LoadingScreen />

  // Not authenticated — redirect to login
  if (!currentUser) return <Navigate to="/login" replace />

  // Authenticated — render AppShell wrapping the matched child route
  return (
    <AppShell
      currentUser={currentUser}
      onLogout={signOut}
    >
      <Outlet />
    </AppShell>
  )
}

// AdminRoute — extends ProtectedRoute by also blocking USER accounts.
// Used for routes that require ADMIN or SUPERADMIN access.
// USER accounts are redirected to /customers.
function AdminRoute() {
  const { currentUser, loading, signOut } = useAuth()

  // Show a spinner while the login guard is running
  if (loading) return <LoadingScreen />

  // Not authenticated — redirect to login
  if (!currentUser) return <Navigate to="/login" replace />

  // USER accounts are not allowed — redirect to customers
  if (currentUser.user_type === 'USER') return <Navigate to="/customers" replace />

  // ADMIN or SUPERADMIN — render AppShell wrapping the matched child route
  return (
    <AppShell
      currentUser={currentUser}
      onLogout={signOut}
    >
      <Outlet />
    </AppShell>
  )
}

// Simple full-screen loading spinner shown while AuthContext resolves
function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#f8fafc',
      gap: '16px',
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    }}>
      <style>{`
        @keyframes app-loading-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        border: '4px solid #e2e8f0',
        borderTopColor: '#2563eb',
        animation: 'app-loading-spin 0.8s linear infinite',
      }} />
      <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
        Loading…
      </p>
    </div>
  )
}

export default function App() {
  return (
    // AuthProvider MUST wrap BrowserRouter so useAuth() works inside
    // ProtectedRoute and every other component in the tree
    <AuthProvider>
      <UserRightsProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Public routes ────────────────────────────────────────── */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* ── Protected routes — all authenticated users ──────────── */}
            <Route element={<ProtectedRoute />}>
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Route>

            {/* ── Admin-only routes — ADMIN and SUPERADMIN only ───────── */}
            {/* USER accounts are redirected to /customers               */}
            <Route element={<AdminRoute />}>
              <Route path="/deleted-customers" element={<DeletedCustomersPage />} />
            </Route>

            {/* ── Catch-all: redirect unknown paths to login ───────────── */}
            <Route path="*" element={<Navigate to="/login" replace />} />

          </Routes>
        </BrowserRouter>
      </UserRightsProvider>
    </AuthProvider>
  )
}