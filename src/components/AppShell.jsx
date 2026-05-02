// src/components/AppShell.jsx
// Branch: feat/ui-app-shell
// Issue:  [S1-M2] feat/ui-app-shell
// Role:   M2 – Frontend Developer
//
// Fix: removed invalid @media rule from inline styles object.
//      Responsive sidebar is now handled via a <style> tag inside the component.
//
// Props:
//   currentUser  → object  — from AuthContext (has .username, .user_type)
//   onLogout()   → void    — calls supabase.auth.signOut() (wired by M4)
//   children     → node    — page content rendered in the main area
//
// NOTE: Sidebar visibility gating (hiding Admin / Deleted Customers
//       for USER accounts) is handled in Sprint 2 by M4.

import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRights } from "../context/UserRightsContext";
import { restoreSuperadmin, changeUserRole } from '../services/userService';

const NAV_ITEMS = [
  { label: "Customers", path: "/customers", icon: <PeopleIcon /> },
  { label: "Sales", path: "/sales", icon: <SalesIcon /> },
  { label: "Products", path: "/products", icon: <ProductIcon /> },
  { label: "Deleted Customers", path: "/deleted-customers", icon: <TrashIcon /> },
  { label: "Customer Sales Summary", path: "/reports/customer-sales", icon: <ReportIcon />, section: "Reports" },
  { label: "Top Customers", path: "/reports/top-customers", icon: <ReportIcon />, section: "Reports" },
  { label: "Product Revenue", path: "/reports/product-revenue", icon: <ReportIcon />, section: "Reports" },
  { label: "Admin", path: "/admin", icon: <AdminIcon />, title: "Admin Module — SUPERADMIN only" },
];

export default function AppShell({ currentUser, onLogout = () => { }, children }) {
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

  const showRestoreButton =
    currentUser?.is_superadmin === true &&
    currentUser?.user_type !== 'SUPERADMIN';

  const showDemoteButton = currentUser?.user_type === 'SUPERADMIN';

  const visibleNavItems = NAV_ITEMS.filter(({ path }) => {
    if (path === '/deleted-customers') return userType === 'ADMIN' || userType === 'SUPERADMIN';
    if (path === '/admin') return rights.ADM_USER === 1;
    return true;
  });

  const handleDemote = async () => {
    setDemoting(true);
    setDemoteError(null);
    try {
      await changeUserRole(currentUser.userid, demoteRole, currentUser.userid);
      window.location.reload();
    } catch (err) {
      setDemoteError(err.message || 'Role change failed. Please try again.');
      setDemoting(false);
    }
  };

  const handleLogout = async () => {
    await onLogout();
    navigate('/login');
  };

  const handleRestore = async () => {
    setRestoring(true);
    setRestoreError(null);
    try {
      await restoreSuperadmin(currentUser.userid);
      // Force a full page reload so AuthContext re-fetches the updated
      // user row and rights. This is the simplest way to ensure the
      // entire app reflects the restored SUPERADMIN state immediately.
      window.location.reload();
    } catch (err) {
      setRestoreError(err.message || 'Restoration failed. Please try again.');
      setRestoring(false);
    }
  };


  const displayName = currentUser?.username || currentUser?.email || 'User';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <style>{`
                .cms-sidebar {
                    position: fixed; top: 0; left: 0; height: 100vh; width: 240px;
                    background: linear-gradient(160deg, #0f1f3d 0%, #162744 100%);
                    display: flex; flex-direction: column; z-index: 50;
                    transform: translateX(-100%); transition: transform 0.25s ease;
                }
                .cms-sidebar.open { transform: translateX(0); }
                .cms-main-area {
                    flex: 1; display: flex; flex-direction: column;
                    min-width: 0; margin-left: 0;
                }
                .cms-hamburger { display: flex; }
                @media (min-width: 768px) {
                    .cms-sidebar { transform: translateX(0) !important; }
                    .cms-main-area { margin-left: 240px; }
                    .cms-hamburger { display: none; }
                }
                .restore-btn {
                    display: flex; align-items: center; gap: 8px;
                    margin: 0 12px 8px; padding: 9px 12px;
                    background: rgba(234, 179, 8, 0.15);
                    border: 1px solid rgba(234, 179, 8, 0.4);
                    border-radius: 8px; cursor: pointer;
                    color: #fbbf24; font-size: 12px; font-weight: 600;
                    font-family: inherit; transition: background 0.15s;
                    text-align: left; width: calc(100% - 24px);
                }
                .restore-btn:hover { background: rgba(234, 179, 8, 0.25); }
                .modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
                    z-index: 100; display: flex; align-items: center;
                    justify-content: center; padding: 20px;
                }
                .modal-box {
                    background: #1e2d4a; border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px; padding: 28px; width: 100%;
                    max-width: 400px; color: white;
                }
                .modal-title {
                    font-size: 16px; font-weight: 700; margin: 0 0 8px;
                    color: #fbbf24;
                }
                .modal-body {
                    font-size: 13.5px; color: rgba(255,255,255,0.7);
                    line-height: 1.6; margin: 0 0 20px;
                }
                .modal-actions {
                    display: flex; gap: 10px; justify-content: flex-end;
                }
                .modal-cancel {
                    padding: 8px 16px; background: none;
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 7px; color: rgba(255,255,255,0.6);
                    font-size: 13px; cursor: pointer; font-family: inherit;
                }
                .modal-cancel:hover { border-color: rgba(255,255,255,0.4); }
                .modal-confirm {
                    padding: 8px 16px; background: #ca8a04;
                    border: none; border-radius: 7px; color: white;
                    font-size: 13px; font-weight: 600; cursor: pointer;
                    font-family: inherit; transition: background 0.15s;
                }
                .modal-confirm:hover:not(:disabled) { background: #a16207; }
                .modal-confirm:disabled {
                    opacity: 0.6; cursor: not-allowed;
                }
                .modal-error {
                    font-size: 12px; color: #f87171;
                    margin: -12px 0 16px; text-align: right;
                }
                .demote-btn {
                    display: flex; align-items: center; gap: 8px;
                    margin: 0 12px 8px; padding: 9px 12px;
                    background: rgba(99, 102, 241, 0.15);
                    border: 1px solid rgba(99, 102, 241, 0.4);
                    border-radius: 8px; cursor: pointer;
                    color: #a5b4fc; font-size: 12px; font-weight: 600;
                    font-family: inherit; transition: background 0.15s;
                    text-align: left; width: calc(100% - 24px);
                }
                .demote-btn:hover { background: rgba(99, 102, 241, 0.25); }
                .demote-select {
                    width: 100%; padding: 8px 10px; border-radius: 7px;
                    border: 1px solid rgba(255,255,255,0.15);
                    background: rgba(255,255,255,0.08); color: white;
                    font-size: 13px; font-family: inherit; margin-bottom: 16px;
                    outline: none; cursor: pointer;
                }
                .demote-select option { background: #1e2d4a; color: white; }
                .demote-select:focus { border-color: rgba(99,102,241,0.6); }
            `}</style>

      <div style={styles.root}>
        {sidebarOpen && (
          <div
            style={styles.overlay}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className={`cms-sidebar${sidebarOpen ? ' open' : ''}`}>

          {/* Brand */}
          <div style={styles.brand}>
            <div style={styles.logoMark}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="6" fill="rgba(255,255,255,0.15)" />
                <path d="M6 12 L12 6 L18 12 L12 18 Z" fill="white" />
                <circle cx="12" cy="12" r="3" fill="rgba(255,255,255,0.5)" />
              </svg>
            </div>
            <div>
              <p style={styles.brandName}>Hope, Inc.</p>
              <p style={styles.brandSub}>CMS</p>
            </div>
          </div>

          {/* Nav */}
          <nav style={styles.nav} aria-label="Main navigation">
            <p style={styles.navSection}>Main Menu</p>
            {visibleNavItems.filter(i => !i.section).map(({ label, path, icon, title }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                title={title}
                style={({ isActive }) => ({
                  ...styles.navLink,
                  ...(isActive ? styles.navLinkActive : {}),
                })}
              >
                <span style={styles.navIcon}>{icon}</span>
                {label}
              </NavLink>
            ))}
            <p style={{ ...styles.navSection, marginTop: '16px' }}>Reports</p>
            {visibleNavItems.filter(i => i.section === 'Reports').map(({ label, path, icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                style={({ isActive }) => ({
                  ...styles.navLink,
                  ...(isActive ? styles.navLinkActive : {}),
                })}
              >
                <span style={styles.navIcon}>{icon}</span>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* ── Change Role button — SUPERADMIN self-demotion ── */}
          {showDemoteButton && (
            <button
              className="demote-btn"
              onClick={() => {
                setDemoteError(null);
                setDemoteRole('ADMIN');
                setShowDemoteModal(true);
              }}
              title="Change your current role"
            >
              <RoleIcon />
              Change My Role
            </button>
          )}

          {/* ── Restore SUPERADMIN button ────────────────────── */}
          {/* Visible only when is_superadmin = TRUE and currently demoted */}
          {showRestoreButton && (
            <button
              className="restore-btn"
              onClick={() => {
                setRestoreError(null);
                setShowRestoreModal(true);
              }}
              title="Restore your SUPERADMIN access"
            >
              <RestoreIcon />
              Restore SUPERADMIN
            </button>
          )}

          {/* User card */}
          <div style={styles.userCard}>
            <div style={styles.avatar}>{initials}</div>
            <div style={styles.userInfo}>
              <p style={styles.userName}>{displayName}</p>
              <p style={styles.userType}>{currentUser?.user_type || 'USER'}</p>
            </div>
          </div>
        </aside>

        {/* ── Main area ────────────────────────────────────────── */}
        <div className="cms-main-area">
          <header style={styles.navbar}>
            <button
              className="cms-hamburger"
              style={styles.hamburger}
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <HamburgerIcon />
            </button>
            <div style={styles.navLeft}>
              <span style={styles.navBreadcrumb}>Hope, Inc. CMS</span>
            </div>
            <div style={styles.navRight}>
              <div style={styles.navUser}>
                <div style={styles.navAvatar}>{initials}</div>
                <span style={styles.navUserName}>{displayName}</span>
              </div>
              <button
                onClick={handleLogout}
                style={styles.logoutBtn}
                aria-label="Log out"
              >
                <LogoutIcon />
                <span>Logout</span>
              </button>
            </div>
          </header>
          <main style={styles.content}>{children}</main>
        </div>
      </div>

      {/* ── Restore SUPERADMIN Modal ─────────────────────────────── */}
      {showRestoreModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p className="modal-title">⚠ Restore SUPERADMIN Access</p>
            <p className="modal-body">
              Your account (<strong>{displayName}</strong>) was originally
              a SUPERADMIN. Restoring will immediately grant you full
              SUPERADMIN rights and reload the application.
              <br /><br />
              Current role: <strong>{currentUser?.user_type}</strong>
              <br />
              Restoring to: <strong>SUPERADMIN</strong>
            </p>
            {restoreError && (
              <p className="modal-error">{restoreError}</p>
            )}
            <div className="modal-actions">
              <button
                className="modal-cancel"
                onClick={() => {
                  setShowRestoreModal(false);
                  setRestoreError(null);
                }}
                disabled={restoring}
              >
                Cancel
              </button>
              <button
                className="modal-confirm"
                onClick={handleRestore}
                disabled={restoring}
              >
                {restoring ? 'Restoring...' : 'Yes, Restore SUPERADMIN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Role Modal — SUPERADMIN self-demotion ──────────── */}
      {showDemoteModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p className="modal-title" style={{ color: '#a5b4fc' }}>
              ⚙ Change My Role
            </p>
            <p className="modal-body">
              You are currently <strong>SUPERADMIN</strong>. Changing your
              role will update your access rights immediately and reload
              the application.
              <br /><br />
              Your <strong>is_superadmin</strong> flag stays permanently —
              you can restore SUPERADMIN access at any time via the
              Restore button.
            </p>
            <select
              className="demote-select"
              value={demoteRole}
              onChange={(e) => setDemoteRole(e.target.value)}
              disabled={demoting}
            >
              <option value="ADMIN">ADMIN — Can add/edit customers, manage users</option>
              <option value="USER">USER — Read-only access</option>
            </select>
            {demoteError && (
              <p className="modal-error">{demoteError}</p>
            )}
            <div className="modal-actions">
              <button
                className="modal-cancel"
                onClick={() => {
                  setShowDemoteModal(false);
                  setDemoteError(null);
                }}
                disabled={demoting}
              >
                Cancel
              </button>
              <button
                className="modal-confirm"
                style={{ background: '#4f46e5' }}
                onClick={handleDemote}
                disabled={demoting}
              >
                {demoting ? 'Changing...' : `Switch to ${demoteRole}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Role icon ─────────────────────────────────────────────────────
function RoleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

// ── Restore icon ───────────────────────────────────────────────────
function RestoreIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10" />
      <path d="M16 12l-4-4-4 4" />
      <path d="M12 8v8" />
      <path d="M22 22l-4-4" />
      <path d="M18 22v-4h4" />
    </svg>
  );
}

// ── Icons ─────────────────────────────────────────────────────────
function PeopleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function SalesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
function ProductIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
function AdminIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

// ── Inline styles (no @media rules here) ─────────────────────────
const BLUE = "#2563eb";

const styles = {
  root: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    background: "#f8fafc",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    zIndex: 40,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "20px 20px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  logoMark: { flexShrink: 0 },
  brandName: {
    fontSize: "15px",
    fontWeight: "700",
    color: "white",
    margin: 0,
  },
  brandSub: {
    fontSize: "10px",
    color: "rgba(255,255,255,0.4)",
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  nav: {
    flex: 1,
    padding: "16px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    overflowY: "auto",
  },
  navSection: {
    fontSize: "10px",
    fontWeight: "600",
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    margin: "0 0 8px 8px",
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "9px 12px",
    borderRadius: "8px",
    fontSize: "13.5px",
    color: "rgba(255,255,255,0.65)",
    textDecoration: "none",
    transition: "background 0.15s, color 0.15s",
  },
  navLinkActive: {
    background: "rgba(255,255,255,0.12)",
    color: "white",
  },
  navIcon: {
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    opacity: 0.8,
  },
  userCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 16px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: BLUE,
    color: "white",
    fontSize: "12px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  userInfo: { overflow: "hidden" },
  userName: {
    fontSize: "13px",
    fontWeight: "600",
    color: "white",
    margin: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  userType: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.4)",
    margin: 0,
  },
  navbar: {
    height: "56px",
    background: "white",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    gap: "12px",
    position: "sticky",
    top: 0,
    zIndex: 30,
  },
  hamburger: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "6px",
    color: "#374151",
    alignItems: "center",
    borderRadius: "6px",
  },
  navLeft: { flex: 1 },
  navBreadcrumb: {
    fontSize: "13px",
    color: "#9ca3af",
    fontWeight: "500",
  },
  navRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  navUser: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  navAvatar: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: BLUE,
    color: "white",
    fontSize: "11px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  navUserName: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#374151",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 12px",
    background: "none",
    border: "1px solid #e2e8f0",
    borderRadius: "7px",
    fontSize: "13px",
    color: "#6b7280",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  content: {
    flex: 1,
    padding: "24px 20px",
    overflowY: "auto",
  },
};