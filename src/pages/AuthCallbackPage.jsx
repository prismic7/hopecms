// src/pages/AuthCallbackPage.jsx
// Branch: feat/ui-auth-callback
// Issue:  [S1-M2] feat/ui-auth-callback
// Role:   M2 – Frontend Developer
//
// This page is shown while Google OAuth is processing the redirect.
// M4 wires the actual session handling logic in AuthContext.
// This component only handles the visual states:
//   - loading  → spinner + "Verifying your account…"
//   - error    → error message + link back to login
//   - success  → auto-redirected by M4's AuthContext (user won't see this long)
//
// Usage in App.jsx (already wired by M1):
//   <Route path="/auth/callback" element={<AuthCallbackPage />} />
 
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
 
export default function AuthCallbackPage() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const [status, setStatus] = useState("loading"); // "loading" | "error"
  const [errorMsg, setErrorMsg] = useState("");
 
  useEffect(() => {
    // Check if the URL contains an error param from Supabase or login guard
    const urlError = searchParams.get("error");
    if (urlError) {
      setErrorMsg(decodeURIComponent(urlError));
      setStatus("error");
      return;
    }
 
    // M4's AuthContext handles the actual session exchange.
    // If no error param is present, we stay on "loading" while
    // onAuthStateChange fires and redirects to /customers.
    // Safety fallback: if nothing happens in 10 seconds, show error.
    const timeout = setTimeout(() => {
      setErrorMsg("Authentication timed out. Please try again.");
      setStatus("error");
    }, 10000);
 
    return () => clearTimeout(timeout);
  }, [searchParams]);
 
  return (
    <div style={styles.root}>
      <div style={styles.card}>
 
        {/* Logo mark */}
        <div style={styles.logoMark}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="#0f1f3d" />
            <path d="M10 20 L20 10 L30 20 L20 30 Z" fill="white" />
            <circle cx="20" cy="20" r="5" fill="rgba(255,255,255,0.5)" />
          </svg>
        </div>
 
        {/* Loading state */}
        {status === "loading" && (
          <>
            <div style={styles.spinnerWrap} aria-label="Loading" role="status">
              <div style={styles.spinnerRing} />
            </div>
            <h2 style={styles.title}>Verifying your account…</h2>
            <p style={styles.subtitle}>
              Please wait while we complete your sign-in.
            </p>
          </>
        )}
 
        {/* Error state */}
        {status === "error" && (
          <>
            <div style={styles.errorCircle} aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="2" />
                <path
                  d="M12 8v4M12 16h.01"
                  stroke="#dc2626"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2 style={{ ...styles.title, color: "#0f172a" }}>
              Sign-in failed
            </h2>
            <p style={styles.errorMsg}>{errorMsg}</p>
            <button
              onClick={() => navigate("/login")}
              style={styles.backBtn}
            >
              Back to login
            </button>
          </>
        )}
 
      </div>
 
      {/* Spinner keyframe animation */}
      <style>{`
        @keyframes cms-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
 
// ── Styles ────────────────────────────────────────────────────────
const styles = {
  root: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
    fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    padding: "24px",
  },
  card: {
    width: "100%",
    maxWidth: "380px",
    background: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    padding: "48px 36px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)",
  },
  logoMark: {
    marginBottom: "28px",
  },
 
  // Spinner
  spinnerWrap: {
    marginBottom: "24px",
  },
  spinnerRing: {
    width: "44px",
    height: "44px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#2563eb",
    borderRadius: "50%",
    animation: "cms-spin 0.75s linear infinite",
  },
 
  // Text
  title: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 8px",
    letterSpacing: "-0.2px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
    lineHeight: "1.6",
  },
 
  // Error state
  errorCircle: {
    marginBottom: "20px",
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    background: "#fff1f2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  errorMsg: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0 0 24px",
    lineHeight: "1.6",
  },
  backBtn: {
    height: "42px",
    padding: "0 24px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};