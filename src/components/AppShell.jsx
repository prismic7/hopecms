// src/components/AppShell.jsx
// Redesigned — Dark glass aesthetic matching Login / Register / LoadingScreen

import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRights } from "../context/UserRightsContext";
import { restoreSuperadmin, changeUserRole } from '../services/userService';

const NAV_ITEMS = [
  { label: "Customers",      path: "/customers",               icon: <PeopleIcon />,  section: "main" },
  { label: "Sales",          path: "/sales",                   icon: <SalesIcon />,   section: "main" },
  { label: "Products",       path: "/products",                icon: <ProductIcon />, section: "main" },
  { label: "Deleted",        path: "/deleted-customers",       icon: <TrashIcon />,   section: "main", adminOnly: true },
  { label: "Admin",          path: "/admin",                   icon: <AdminIcon />,   section: "main", rightKey: "ADM_USER" },
  { label: "Sales Summary",  path: "/reports/customer-sales",  icon: <ChartIcon />,   section: "reports" },
  { label: "Top Customers",  path: "/reports/top-customers",   icon: <TrophyIcon />,  section: "reports" },
  { label: "Product Revenue",path: "/reports/product-revenue", icon: <RevenueIcon />, section: "reports" },
];

export default function AppShell({ currentUser, onLogout = () => {}, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState(null);
  const [showDemoteModal, setShowDemoteModal] = useState(false);
  const [demoting, setDemoting] = useState(false);
  const [demoteRole, setDemoteRole] = useState('ADMIN');
  const [demoteError, setDemoteError] = useState(null);

  const navigate = useNavigate();
  const { rights } = useRights();
  const userType = currentUser?.user_type;

  const showRestoreButton = currentUser?.is_superadmin === true && userType !== 'SUPERADMIN';
  const showDemoteButton  = userType === 'SUPERADMIN';

  const visibleNavItems = NAV_ITEMS.filter(({ path, adminOnly, rightKey }) => {
    if (path === '/deleted-customers') return userType === 'ADMIN' || userType === 'SUPERADMIN';
    if (rightKey) return rights[rightKey] === 1;
    return true;
  });

  const handleLogout = async () => { await onLogout(); navigate('/login'); };

  const handleRestore = async () => {
    setRestoring(true); setRestoreError(null);
    try { await restoreSuperadmin(currentUser.userid); window.location.reload(); }
    catch (err) { setRestoreError(err.message || 'Restoration failed.'); setRestoring(false); }
  };

  const handleDemote = async () => {
    setDemoting(true); setDemoteError(null);
    try { await changeUserRole(currentUser.userid, demoteRole, currentUser.userid); window.location.reload(); }
    catch (err) { setDemoteError(err.message || 'Role change failed.'); setDemoting(false); }
  };

  const displayName = currentUser?.username || currentUser?.email || 'User';
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const userTypeBadge = { SUPERADMIN: 'SA', ADMIN: 'AD', USER: 'US' }[userType] || 'US';
  const userTypeColor = { SUPERADMIN: '#f59e0b', ADMIN: '#818cf8', USER: 'rgba(255,255,255,0.3)' }[userType];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        /* ── Root layout ────────────────────────────────────────── */
        .as-root {
          display: flex;
          min-height: 100vh;
          background: #f4f4f5;
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        /* ── Sidebar ────────────────────────────────────────────── */
        .as-sidebar {
          position: fixed;
          top: 0; left: 0;
          width: 232px;
          height: 100vh;
          background: #0a0a0a;
          display: flex;
          flex-direction: column;
          z-index: 50;
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);

          /* Subtle top-edge highlight */
          border-right: 1px solid rgba(255,255,255,0.06);
        }
        .as-sidebar::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
        }
        .as-sidebar.open { transform: translateX(0); }

        @media (min-width: 768px) {
          .as-sidebar { transform: translateX(0) !important; }
          .as-main { margin-left: 232px; }
          .as-hamburger { display: none !important; }
        }

        /* ── Sidebar — Brand ────────────────────────────────────── */
        .as-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 22px 20px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          position: relative;
          z-index: 1;
          flex-shrink: 0;
        }
        .as-logo {
          width: 32px; height: 32px;
          background: white;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .as-logo svg { width: 18px; height: 18px; }
        .as-brand-name {
          font-family: 'Syne', sans-serif;
          font-size: 14px; font-weight: 700;
          color: white; letter-spacing: -0.2px;
        }
        .as-brand-sub {
          font-size: 10px; color: rgba(255,255,255,0.3);
          letter-spacing: 1.5px; text-transform: uppercase;
        }

        /* ── Sidebar — Nav ──────────────────────────────────────── */
        .as-nav {
          flex: 1;
          padding: 16px 12px;
          overflow-y: auto;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .as-nav::-webkit-scrollbar { width: 4px; }
        .as-nav::-webkit-scrollbar-track { background: transparent; }
        .as-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        .as-nav-section {
          font-size: 9.5px;
          font-weight: 600;
          color: rgba(255,255,255,0.2);
          text-transform: uppercase;
          letter-spacing: 1.2px;
          padding: 0 8px;
          margin: 12px 0 6px;
        }
        .as-nav-section:first-child { margin-top: 0; }

        .as-nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 9px;
          font-size: 13.5px;
          font-weight: 400;
          color: rgba(255,255,255,0.45);
          text-decoration: none;
          transition: background 0.15s ease, color 0.15s ease;
          position: relative;
        }
        .as-nav-link:hover {
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.85);
        }
        .as-nav-link.active {
          background: rgba(255,255,255,0.1);
          color: white;
          font-weight: 500;
        }
        .as-nav-link.active::before {
          content: '';
          position: absolute;
          left: 0; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 16px;
          background: white;
          border-radius: 0 3px 3px 0;
          margin-left: -1px;
        }
        .as-nav-icon {
          display: flex; align-items: center;
          flex-shrink: 0;
          opacity: 0.7;
          width: 16px; height: 16px;
        }
        .as-nav-link.active .as-nav-icon { opacity: 1; }

        /* ── Sidebar — Special action buttons ───────────────────── */
        .as-action-area {
          padding: 8px 12px;
          position: relative; z-index: 1;
          display: flex; flex-direction: column; gap: 6px;
          flex-shrink: 0;
        }
        .as-action-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 10px;
          border-radius: 9px;
          border: 1px solid transparent;
          font-size: 12px; font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .as-action-btn.demote {
          background: rgba(129,140,248,0.08);
          border-color: rgba(129,140,248,0.2);
          color: #a5b4fc;
        }
        .as-action-btn.demote:hover { background: rgba(129,140,248,0.14); }
        .as-action-btn.restore {
          background: rgba(245,158,11,0.08);
          border-color: rgba(245,158,11,0.2);
          color: #fbbf24;
        }
        .as-action-btn.restore:hover { background: rgba(245,158,11,0.14); }

        /* ── Sidebar — User card ────────────────────────────────── */
        .as-user-card {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
          position: relative; z-index: 1;
          flex-shrink: 0;
        }
        .as-avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          font-size: 12px; font-weight: 600;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          font-family: 'Syne', sans-serif;
        }
        .as-user-info { overflow: hidden; flex: 1; }
        .as-user-name {
          font-size: 13px; font-weight: 500; color: white;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .as-user-type {
          font-size: 10px; color: rgba(255,255,255,0.3);
          letter-spacing: 0.5px;
        }
        /* Icon-only logout in user card */
        .as-user-logout {
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          background: none;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 7px;
          color: rgba(255,255,255,0.3);
          cursor: pointer; flex-shrink: 0;
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }
        .as-user-logout:hover {
          background: rgba(220,38,38,0.15);
          border-color: rgba(220,38,38,0.3);
          color: #f87171;
        }

        /* ── Overlay (mobile) ───────────────────────────────────── */
        .as-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 40;
          animation: as-overlay-in 0.2s ease;
        }
        @keyframes as-overlay-in {
          from { opacity: 0; } to { opacity: 1; }
        }

        /* ── Main area ──────────────────────────────────────────── */
        .as-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 100vh;
        }

        /* ── Topbar / Navbar ────────────────────────────────────── */
        .as-topbar {
          height: 56px;
          background: white;
          border-bottom: 1px solid #e4e4e7;
          display: flex;
          align-items: center;
          padding: 0 20px;
          gap: 12px;
          position: sticky; top: 0;
          z-index: 30;
          flex-shrink: 0;
        }

        .as-hamburger {
          display: flex;
          align-items: center; justify-content: center;
          width: 34px; height: 34px;
          background: none; border: none;
          border-radius: 8px;
          color: #71717a; cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
          flex-shrink: 0;
        }
        .as-hamburger:hover { background: #f4f4f5; color: #18181b; }

        .as-topbar-center { flex: 1; }

        .as-breadcrumb {
          font-size: 13px;
          color: #a1a1aa;
          font-weight: 400;
        }

        .as-topbar-right {
          display: flex; align-items: center; gap: 10px;
          flex-shrink: 0;
        }

        /* Topbar user chip */
        .as-topbar-user {
          display: flex; align-items: center; gap: 8px;
          padding: 5px 10px 5px 5px;
          border-radius: 100px;
          border: 1px solid #e4e4e7;
          background: #fafafa;
          cursor: default;
        }
        .as-topbar-avatar {
          width: 26px; height: 26px;
          border-radius: 50%;
          background: #18181b;
          color: white;
          font-size: 10px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif;
          flex-shrink: 0;
        }
        .as-topbar-name {
          font-size: 13px; font-weight: 500;
          color: #18181b;
          max-width: 120px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }



        /* ── Page content ───────────────────────────────────────── */
        .as-content {
          flex: 1;
          padding: 28px 24px;
          overflow-y: auto;
        }

        /* ── Modal shared styles ────────────────────────────────── */
        .as-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          z-index: 200;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: as-overlay-in 0.2s ease;
        }
        .as-modal {
          background: rgba(255,255,255,0.07);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 20px;
          padding: 32px;
          width: 100%; max-width: 400px;
          color: white;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.1) inset;
          animation: as-modal-in 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes as-modal-in {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .as-modal-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px; font-weight: 700;
          color: white; margin: 0 0 10px; letter-spacing: -0.2px;
        }
        .as-modal-body {
          font-size: 13.5px; color: rgba(255,255,255,0.5);
          line-height: 1.65; margin: 0 0 24px;
        }
        .as-modal-body strong { color: rgba(255,255,255,0.85); font-weight: 500; }
        .as-modal-error {
          font-size: 12px; color: #f87171;
          margin: -16px 0 16px; text-align: right;
        }
        .as-modal-actions { display: flex; gap: 10px; justify-content: flex-end; }

        .as-modal-cancel {
          padding: 9px 18px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          color: rgba(255,255,255,0.55);
          font-size: 13px; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.15s ease;
        }
        .as-modal-cancel:hover { background: rgba(255,255,255,0.12); }
        .as-modal-cancel:disabled { opacity: 0.4; cursor: not-allowed; }

        .as-modal-confirm {
          padding: 9px 20px;
          border: none; border-radius: 10px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: opacity 0.15s ease, transform 0.1s ease;
        }
        .as-modal-confirm:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .as-modal-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
        .as-modal-confirm.amber { background: white; color: #0a0a0a; }
        .as-modal-confirm.indigo { background: white; color: #0a0a0a; }

        .as-modal-select {
          width: 100%; padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.07);
          color: white;
          font-size: 13px; font-family: 'DM Sans', sans-serif;
          margin-bottom: 20px; outline: none; cursor: pointer;
          transition: border-color 0.15s ease;
        }
        .as-modal-select:focus { border-color: rgba(255,255,255,0.3); }
        .as-modal-select option { background: #1a1a1a; color: white; }
      `}</style>

      <div className="as-root">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="as-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
        )}

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className={`as-sidebar ${sidebarOpen ? 'open' : ''}`}>

          {/* Brand */}
          <div className="as-brand">
            <div className="as-logo">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 3L21 8.5V15.5L12 21L3 15.5V8.5L12 3Z" fill="#0a0a0a" />
                <circle cx="12" cy="12" r="3" fill="white" />
              </svg>
            </div>
            <div>
              <div className="as-brand-name">Hope, Inc.</div>
              <div className="as-brand-sub">CMS</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="as-nav" aria-label="Main navigation">
            <div className="as-nav-section">Main</div>

            {visibleNavItems.filter(i => i.section === 'main').map(({ label, path, icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `as-nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="as-nav-icon">{icon}</span>
                {label}
              </NavLink>
            ))}

            <div className="as-nav-section">Reports</div>

            {visibleNavItems.filter(i => i.section === 'reports').map(({ label, path, icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `as-nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="as-nav-icon">{icon}</span>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Special action buttons */}
          {(showDemoteButton || showRestoreButton) && (
            <div className="as-action-area">
              {showDemoteButton && (
                <button
                  className="as-action-btn demote"
                  onClick={() => { setDemoteError(null); setDemoteRole('ADMIN'); setShowDemoteModal(true); }}
                >
                  <RoleIcon /> Change My Role
                </button>
              )}
              {showRestoreButton && (
                <button
                  className="as-action-btn restore"
                  onClick={() => { setRestoreError(null); setShowRestoreModal(true); }}
                >
                  <RestoreIcon /> Restore SUPERADMIN
                </button>
              )}
            </div>
          )}

          {/* User card */}
          <div className="as-user-card">
            <div className="as-avatar">{initials}</div>
            <div className="as-user-info">
              <div className="as-user-name">{displayName}</div>
              <div className="as-user-type">{userType}</div>
            </div>
            <button
              className="as-user-logout"
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
            >
              <LogoutIcon />
            </button>
          </div>
        </aside>

        {/* ── Main area ───────────────────────────────────────── */}
        <div className="as-main">

          {/* Topbar */}
          <header className="as-topbar">
            <button
              className="as-hamburger"
              onClick={() => setSidebarOpen(v => !v)}
              aria-label="Toggle menu"
            >
              <HamburgerIcon />
            </button>

            <div className="as-topbar-center">
              <span className="as-breadcrumb">Hope, Inc. CMS</span>
            </div>

            <div className="as-topbar-right">
              <div className="as-topbar-user">
                <div className="as-topbar-avatar">{initials}</div>
                <span className="as-topbar-name">{displayName}</span>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="as-content">{children}</main>
        </div>
      </div>

      {/* ── Restore SUPERADMIN Modal ─────────────────────────── */}
      {showRestoreModal && (
        <div className="as-modal-overlay">
          <div className="as-modal">
            <p className="as-modal-title">⚠ Restore SUPERADMIN Access</p>
            <p className="as-modal-body">
              Your account (<strong>{displayName}</strong>) was originally a SUPERADMIN.
              Restoring will immediately grant you full SUPERADMIN rights and reload the application.
              <br /><br />
              Current role: <strong>{userType}</strong> → Restoring to: <strong>SUPERADMIN</strong>
            </p>
            {restoreError && <p className="as-modal-error">{restoreError}</p>}
            <div className="as-modal-actions">
              <button
                className="as-modal-cancel"
                onClick={() => { setShowRestoreModal(false); setRestoreError(null); }}
                disabled={restoring}
              >
                Cancel
              </button>
              <button
                className="as-modal-confirm amber"
                onClick={handleRestore}
                disabled={restoring}
              >
                {restoring ? 'Restoring…' : 'Yes, Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Role Modal ────────────────────────────────── */}
      {showDemoteModal && (
        <div className="as-modal-overlay">
          <div className="as-modal">
            <p className="as-modal-title" style={{ color: '#a5b4fc' }}>⚙ Change My Role</p>
            <p className="as-modal-body">
              You are currently <strong>SUPERADMIN</strong>. Changing your role updates your access rights immediately.
              Your <strong>is_superadmin</strong> flag is permanent — you can restore at any time.
            </p>
            <select
              className="as-modal-select"
              value={demoteRole}
              onChange={e => setDemoteRole(e.target.value)}
              disabled={demoting}
            >
              <option value="ADMIN">ADMIN — Can add/edit customers, manage users</option>
              <option value="USER">USER — Read-only access</option>
            </select>
            {demoteError && <p className="as-modal-error">{demoteError}</p>}
            <div className="as-modal-actions">
              <button
                className="as-modal-cancel"
                onClick={() => { setShowDemoteModal(false); setDemoteError(null); }}
                disabled={demoting}
              >
                Cancel
              </button>
              <button
                className="as-modal-confirm indigo"
                onClick={handleDemote}
                disabled={demoting}
              >
                {demoting ? 'Changing…' : `Switch to ${demoteRole}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Icons ──────────────────────────────────────────────────────── */
function PeopleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function SalesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  );
}
function ProductIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}
function AdminIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}
function TrophyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
    </svg>
  );
}
function RevenueIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  );
}
function HamburgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}
function RoleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function RestoreIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10"/>
      <path d="M16 12l-4-4-4 4"/>
      <path d="M12 8v8"/>
      <path d="M22 22l-4-4"/>
      <path d="M18 22v-4h4"/>
    </svg>
  );
}