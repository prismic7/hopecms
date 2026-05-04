import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const { currentUser, signInWithEmail, signInWithGoogle, loading, authError, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) navigate('/customers', { replace: true });
  }, [currentUser, navigate]);

  const [urlError, setUrlError] = useState(null);
  useEffect(() => {
    const raw = searchParams.get('error');
    if (!raw) return;
    const decoded = decodeURIComponent(raw);
    setUrlError(decoded === 'auth_failed' ? 'Sign-in failed. Please try again.' : decoded);
    window.history.replaceState({}, '', '/login');
  }, [searchParams]);

  const displayError = urlError || authError;
  const clearAllErrors = () => { setUrlError(null); clearError(); };

  const onEmailLogin = async (email, password) => { clearAllErrors(); await signInWithEmail(email, password); };
  const onGoogleLogin = async () => { clearAllErrors(); await signInWithGoogle(); };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const validate = ({ email, password }) => {
    const e = {};
    if (!email) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address.";
    if (!password) e.password = "Password is required.";
    else if (password.length < 6) e.password = "Password must be at least 6 characters.";
    return e;
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(validate({ email, password }));
  };

  const handleChange = (field, value) => {
    const next = { email, password, [field]: value };
    if (field === "email") setEmail(value); else setPassword(value);
    if (touched[field]) setErrors(validate(next));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const ve = validate({ email, password });
    setErrors(ve);
    if (Object.keys(ve).length > 0) return;
    await onEmailLogin(email, password);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-root {
          min-height: 100vh;
          background: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', system-ui, sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Animated background grid */
        .lp-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: grid-drift 20s linear infinite;
        }

        @keyframes grid-drift {
          0%   { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }

        /* Ambient glow blobs */
        .lp-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          animation: blob-float 8s ease-in-out infinite;
        }
        .lp-blob-1 {
          width: 500px; height: 500px;
          background: rgba(255,255,255,0.04);
          top: -200px; left: -150px;
          animation-delay: 0s;
        }
        .lp-blob-2 {
          width: 400px; height: 400px;
          background: rgba(255,255,255,0.03);
          bottom: -150px; right: -100px;
          animation-delay: -4s;
        }

        @keyframes blob-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(20px, -20px) scale(1.05); }
        }

        /* Main card — glassmorphism */
        .lp-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          padding: 48px 44px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(32px) saturate(200%);
          -webkit-backdrop-filter: blur(32px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.13);
          border-radius: 24px;
          box-shadow:
            0 1px 0 rgba(255,255,255,0.15) inset,
            0 32px 80px rgba(0,0,0,0.6),
            0 8px 32px rgba(0,0,0,0.3);

          opacity: 0;
          transform: translateY(24px) scale(0.98);
          transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1),
                      transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .lp-card.mounted {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        /* Brand mark */
        .lp-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 36px;
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 0.5s 0.15s ease, transform 0.5s 0.15s ease;
        }
        .lp-card.mounted .lp-brand { opacity: 1; transform: translateY(0); }

        .lp-logo-mark {
          width: 36px; height: 36px;
          background: white;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .lp-logo-mark svg { width: 20px; height: 20px; }

        .lp-brand-name {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.3px;
        }
        .lp-brand-sub {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        /* Heading */
        .lp-heading {
          margin-bottom: 8px;
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 0.5s 0.2s ease, transform 0.5s 0.2s ease;
        }
        .lp-card.mounted .lp-heading { opacity: 1; transform: translateY(0); }

        .lp-title {
          font-family: 'Syne', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.5px;
          line-height: 1.2;
        }
        .lp-subtitle {
          font-size: 14px;
          color: rgba(255,255,255,0.4);
          margin-top: 6px;
          font-weight: 300;
        }

        /* Error banner */
        .lp-error {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: rgba(220, 38, 38, 0.12);
          border: 1px solid rgba(220, 38, 38, 0.3);
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 20px;
          margin-top: 20px;
          animation: error-in 0.3s ease;
        }
        @keyframes error-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lp-error-icon {
          width: 18px; height: 18px;
          border-radius: 50%;
          background: rgba(220,38,38,0.25);
          color: #f87171;
          font-size: 11px;
          font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .lp-error-text { font-size: 13px; color: #fca5a5; line-height: 1.5; }

        /* Form */
        .lp-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 28px;
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 0.5s 0.3s ease, transform 0.5s 0.3s ease;
        }
        .lp-card.mounted .lp-form { opacity: 1; transform: translateY(0); }

        .lp-field { display: flex; flex-direction: column; gap: 7px; }

        .lp-label {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .lp-input {
          height: 46px;
          padding: 0 16px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          font-size: 14px;
          color: white;
          outline: none;
          width: 100%;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
        }
        .lp-input::placeholder { color: rgba(255,255,255,0.2); }
        .lp-input:hover {
          border-color: rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.08);
        }
        .lp-input:focus {
          border-color: rgba(255,255,255,0.4);
          background: rgba(255,255,255,0.1);
          box-shadow: 0 0 0 3px rgba(255,255,255,0.06);
        }
        .lp-input.error {
          border-color: rgba(248,113,113,0.5);
          box-shadow: 0 0 0 3px rgba(248,113,113,0.1);
        }

        .lp-field-error { font-size: 12px; color: #f87171; }

        /* Submit button */
        .lp-btn-submit {
          height: 48px;
          background: white;
          color: #0a0a0a;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          letter-spacing: 0.2px;
          margin-top: 4px;
          transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
          position: relative;
          overflow: hidden;
        }
        .lp-btn-submit::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 100%);
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .lp-btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(255,255,255,0.2);
        }
        .lp-btn-submit:hover::before { opacity: 1; }
        .lp-btn-submit:active:not(:disabled) { transform: translateY(0) scale(0.99); }
        .lp-btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Divider */
        .lp-or {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 4px 0;
          opacity: 0;
          transition: opacity 0.5s 0.4s ease;
        }
        .lp-card.mounted .lp-or { opacity: 1; }
        .lp-or-line { flex: 1; height: 1px; background: rgba(255,255,255,0.08); }
        .lp-or-label { font-size: 12px; color: rgba(255,255,255,0.25); }

        /* Google button */
        .lp-btn-google {
          height: 48px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.85);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          font-size: 14px;
          font-weight: 400;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.5s 0.45s ease, background 0.2s ease, border-color 0.2s ease, transform 0.15s ease, box-shadow 0.15s ease;
        }
        .lp-card.mounted .lp-btn-google { opacity: 1; }
        .lp-btn-google:hover:not(:disabled) {
          background: rgba(255,255,255,0.11);
          border-color: rgba(255,255,255,0.22);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        }
        .lp-btn-google:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
        .lp-btn-google:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Footer link */
        .lp-footer {
          text-align: center;
          margin-top: 24px;
          font-size: 13px;
          color: rgba(255,255,255,0.3);
          opacity: 0;
          transition: opacity 0.5s 0.5s ease;
        }
        .lp-card.mounted .lp-footer { opacity: 1; }
        .lp-footer a {
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s ease;
        }
        .lp-footer a:hover { color: white; }

        /* Bottom watermark */
        .lp-watermark {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 11px;
          color: rgba(255,255,255,0.12);
          letter-spacing: 1px;
          white-space: nowrap;
          z-index: 5;
          font-family: 'DM Sans', sans-serif;
        }

        @media (max-width: 500px) {
          .lp-card { padding: 36px 28px; margin: 16px; border-radius: 20px; }
          .lp-title { font-size: 22px; }
        }
      `}</style>

      <div className="lp-root">
        <div className="lp-blob lp-blob-1" />
        <div className="lp-blob lp-blob-2" />

        <div className={`lp-card ${mounted ? 'mounted' : ''}`}>

          {/* Brand */}
          <div className="lp-brand">
            <div className="lp-logo-mark">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 3L21 8.5V15.5L12 21L3 15.5V8.5L12 3Z" fill="#0a0a0a" />
                <circle cx="12" cy="12" r="3" fill="white" />
              </svg>
            </div>
            <div>
              <div className="lp-brand-name">Hope, Inc.</div>
              <div className="lp-brand-sub">Customer Management System</div>
            </div>
          </div>

          {/* Heading */}
          <div className="lp-heading">
            <h1 className="lp-title">Welcome back.</h1>
            <p className="lp-subtitle">Sign in to your account to continue.</p>
          </div>

          {/* Error */}
          {displayError && (
            <div className="lp-error" role="alert">
              <div className="lp-error-icon">!</div>
              <span className="lp-error-text">{displayError}</span>
            </div>
          )}

          {/* Form */}
          <form className="lp-form" onSubmit={handleSubmit} noValidate>
            <div className="lp-field">
              <label className="lp-label">Email</label>
              <input
                className={`lp-input ${errors.email && touched.email ? 'error' : ''}`}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
              />
              {errors.email && touched.email && <p className="lp-field-error">{errors.email}</p>}
            </div>

            <div className="lp-field">
              <label className="lp-label">Password</label>
              <input
                className={`lp-input ${errors.password && touched.password ? 'error' : ''}`}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => handleChange("password", e.target.value)}
                onBlur={() => handleBlur("password")}
              />
              {errors.password && touched.password && <p className="lp-field-error">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="lp-btn-submit"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="lp-or" style={{ marginTop: '20px' }}>
            <div className="lp-or-line" />
            <span className="lp-or-label">or continue with</span>
            <div className="lp-or-line" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={onGoogleLogin}
            disabled={loading}
            className="lp-btn-google"
            style={{ marginTop: '12px' }}
          >
            <GoogleIcon />
            Google
          </button>

          {/* Footer */}
          <p className="lp-footer">
            Don't have an account?{" "}
            <a href="/register">Create one</a>
          </p>
        </div>

        <div className="lp-watermark">NEW ERA UNIVERSITY · AY 2025–2026</div>
      </div>
    </>
  );
}

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