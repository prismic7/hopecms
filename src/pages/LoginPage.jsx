// src/pages/LoginPage.jsx
// Branch: feat/ui-login-page
// Issue:  [S1-M2] feat/ui-login-page
// Role:   M2 – Frontend Developer
//
// Props (M4 will wire these up in Sprint 1):
//   onEmailLogin(email, password) → async   — calls supabase.auth.signIn()
//   onGoogleLogin()               → void    — calls supabase.auth.signInWithOAuth()
//   authError                     → string  — error message from AuthContext
//   loading                       → boolean — auth loading state

import { useState } from "react";

export default function LoginPage({
  onEmailLogin = async () => {},
  onGoogleLogin = () => {},
  authError = "",
  loading = false,
}) {
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});

  // ── Validation ──────────────────────────────────────────────────
  const validate = ({ email, password }) => {
    const e = {};
    if (!email) {
      e.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = "Enter a valid email address.";
    }
    if (!password) {
      e.password = "Password is required.";
    } else if (password.length < 6) {
      e.password = "Password must be at least 6 characters.";
    }
    return e;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate({ email, password }));
  };

  const handleChange = (field, value) => {
    const next = { email, password, [field]: value };
    if (field === "email") setEmail(value);
    else setPassword(value);
    if (touched[field]) setErrors(validate(next));
  };

  // ── Submit ───────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const validationErrors = validate({ email, password });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    await onEmailLogin(email, password);
  };

  return (
    <div style={styles.root}>

      {/* ── Left brand panel ─────────────────────────────────────── */}
      <aside style={styles.brand}>
        <div style={styles.brandContent}>
          <div style={styles.logoMark}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="rgba(255,255,255,0.15)" />
              <path d="M8 16 L16 8 L24 16 L16 24 Z" fill="white" />
              <circle cx="16" cy="16" r="4" fill="rgba(255,255,255,0.5)" />
            </svg>
          </div>
          <h1 style={styles.brandName}>Hope, Inc.</h1>
          <p style={styles.brandSub}>Customer Management System</p>
          <div style={styles.divider} />
          <ul style={styles.featureList}>
            {[
              "Manage customer records",
              "Track full sales history",
              "Role-based access control",
              "Secure OAuth 2.0 login",
            ].map((item) => (
              <li key={item} style={styles.featureItem}>
                <span style={styles.bullet} />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p style={styles.brandFooter}>New Era University · AY 2025–2026</p>
      </aside>

      {/* ── Right form panel ─────────────────────────────────────── */}
      <main style={styles.formPanel}>
        <div style={styles.card}>

          <header style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Welcome back</h2>
            <p style={styles.cardSubtitle}>Sign in to your CMS account</p>
          </header>

          {/* Auth-level error (from M4's AuthContext) */}
          {authError && (
            <div style={styles.errorBanner} role="alert">
              <span style={styles.errorIcon}>!</span>
              <span style={styles.errorText}>{authError}</span>
            </div>
          )}

          {/* ── Email / password form ──────────────────────────── */}
          <form onSubmit={handleSubmit} noValidate style={styles.form}>

            <div style={styles.fieldGroup}>
              <label htmlFor="email" style={styles.label}>Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                style={{
                  ...styles.input,
                  ...(errors.email && touched.email ? styles.inputError : {}),
                }}
                aria-invalid={!!(errors.email && touched.email)}
                aria-describedby={errors.email && touched.email ? "email-err" : undefined}
              />
              {errors.email && touched.email && (
                <p id="email-err" style={styles.fieldError}>{errors.email}</p>
              )}
            </div>

            <div style={styles.fieldGroup}>
              <label htmlFor="password" style={styles.label}>Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => handleChange("password", e.target.value)}
                onBlur={() => handleBlur("password")}
                style={{
                  ...styles.input,
                  ...(errors.password && touched.password ? styles.inputError : {}),
                }}
                aria-invalid={!!(errors.password && touched.password)}
                aria-describedby={errors.password && touched.password ? "pw-err" : undefined}
              />
              {errors.password && touched.password && (
                <p id="pw-err" style={styles.fieldError}>{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ ...styles.btnPrimary, ...(loading ? styles.btnDisabled : {}) }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* ── OR divider ──────────────────────────────────────── */}
          <div style={styles.orRow}>
            <div style={styles.orLine} />
            <span style={styles.orLabel}>or</span>
            <div style={styles.orLine} />
          </div>

          {/* ── Google OAuth button ─────────────────────────────── */}
          <button
            type="button"
            onClick={onGoogleLogin}
            disabled={loading}
            style={{ ...styles.btnGoogle, ...(loading ? styles.btnDisabled : {}) }}
            aria-label="Sign in with Google"
          >
            <GoogleIcon />
            Sign in with Google
          </button>

          {/* ── Register link ───────────────────────────────────── */}
          <p style={styles.registerNote}>
            Don't have an account?{" "}
            <a href="/register" style={styles.link}>Create one</a>
          </p>

        </div>
      </main>
    </div>
  );
}

// ── Google icon ───────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.254 17.64 11.947 17.64 9.2Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.909-2.258c-.805.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const NAVY = "#0f1f3d";
const BLUE = "#2563eb";

const styles = {
  root: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
  },
  brand: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: "320px",
    minWidth: "260px",
    background: `linear-gradient(160deg, ${NAVY} 0%, #162744 100%)`,
    padding: "48px 36px",
    color: "white",
    flexShrink: 0,
  },
  brandContent: { flex: 1 },
  logoMark: { marginBottom: "20px" },
  brandName: {
    fontSize: "22px",
    fontWeight: "700",
    margin: "0 0 6px",
    color: "white",
    letterSpacing: "-0.3px",
  },
  brandSub: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.5)",
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  divider: {
    width: "36px",
    height: "2px",
    background: "rgba(255,255,255,0.2)",
    margin: "28px 0",
    borderRadius: "2px",
  },
  featureList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
    color: "rgba(255,255,255,0.7)",
  },
  bullet: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: BLUE,
    flexShrink: 0,
  },
  brandFooter: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.3)",
    margin: 0,
  },
  formPanel: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 24px",
    background: "#f8fafc",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    padding: "40px 36px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)",
  },
  cardHeader: { marginBottom: "24px" },
  cardTitle: {
    fontSize: "22px",
    fontWeight: "700",
    margin: "0 0 6px",
    color: "#0f172a",
    letterSpacing: "-0.3px",
  },
  cardSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
  errorBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    borderRadius: "8px",
    padding: "12px 14px",
    marginBottom: "20px",
  },
  errorIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "#fca5a5",
    color: "#7f1d1d",
    fontSize: "11px",
    fontWeight: "700",
    flexShrink: 0,
  },
  errorText: {
    fontSize: "13px",
    color: "#9f1239",
    lineHeight: "1.5",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    height: "42px",
    padding: "0 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#111827",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    background: "white",
  },
  inputError: {
    borderColor: "#f87171",
    boxShadow: "0 0 0 3px rgba(239,68,68,0.1)",
  },
  fieldError: {
    fontSize: "12px",
    color: "#dc2626",
    margin: 0,
  },
  btnPrimary: {
    width: "100%",
    height: "44px",
    background: BLUE,
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "4px",
  },
  btnGoogle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    height: "44px",
    background: "white",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  orRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "20px 0",
  },
  orLine: {
    flex: 1,
    height: "1px",
    background: "#e5e7eb",
  },
  orLabel: {
    fontSize: "12px",
    color: "#9ca3af",
    fontWeight: "500",
  },
  registerNote: {
    fontSize: "13px",
    color: "#6b7280",
    textAlign: "center",
    marginTop: "20px",
    marginBottom: 0,
  },
  link: {
    color: BLUE,
    textDecoration: "none",
    fontWeight: "500",
  },
};
