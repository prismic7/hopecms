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

const NAV_ITEMS = [
  { label: "Customers", path: "/customers", icon: <PeopleIcon /> },
  { label: "Sales", path: "/sales", icon: <SalesIcon /> },
  { label: "Products", path: "/products", icon: <ProductIcon /> },
  { label: "Deleted Customers", path: "/deleted-customers", icon: <TrashIcon /> },
  { label: "Admin", path: "/admin", icon: <AdminIcon />, title: "Admin Module — SUPERADMIN only" },
];

export default function AppShell({ currentUser, onLogout = () => { }, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { rights } = useRights();

  const userType = currentUser?.user_type

  // Filter nav items based on user_type and rights
  const visibleNavItems = NAV_ITEMS.filter(({ path }) => {
    if (path === '/deleted-customers') return userType === 'ADMIN' || userType === 'SUPERADMIN'
    if (path === '/admin') return rights.ADM_USER === 1
    return true
  })

  const handleLogout = async () => {
    await onLogout();
    navigate("/login");
  };

  const displayName = currentUser?.username || currentUser?.email || "User";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* ── Responsive styles ─────────────────────────────────────
          Using a <style> tag because React inline styles do not
          support @media queries.                                  */}
      <style>{`
        .cms-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: 240px;
          background: linear-gradient(160deg, #0f1f3d 0%, #162744 100%);
          display: flex;
          flex-direction: column;
          z-index: 50;
          transform: translateX(-100%);
          transition: transform 0.25s ease;
        }
        .cms-sidebar.open {
          transform: translateX(0);
        }
        .cms-main-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          margin-left: 0;
        }
        .cms-hamburger {
          display: flex;
        }
        @media (min-width: 768px) {
          .cms-sidebar {
            transform: translateX(0) !important;
          }
          .cms-main-area {
            margin-left: 240px;
          }
          .cms-hamburger {
            display: none;
          }
        }
      `}</style>

      <div style={styles.root}>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            style={styles.overlay}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ── Sidebar ────────────────────────────────────────────── */}
        <aside className={`cms-sidebar${sidebarOpen ? " open" : ""}`}>

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

          {/* Nav links */}
          <nav style={styles.nav} aria-label="Main navigation">
            <p style={styles.navSection}>Main Menu</p>
            {visibleNavItems.map(({ label, path, icon }) => (
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
          </nav>

          {/* User card at bottom */}
          <div style={styles.userCard}>
            <div style={styles.avatar}>{initials}</div>
            <div style={styles.userInfo}>
              <p style={styles.userName}>{displayName}</p>
              <p style={styles.userType}>{currentUser?.user_type || "USER"}</p>
            </div>
          </div>
        </aside>

        {/* ── Main area ──────────────────────────────────────────── */}
        <div className="cms-main-area">

          {/* Top navbar */}
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

          {/* Page content */}
          <main style={styles.content}>
            {children}
          </main>
        </div>
      </div>
    </>
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