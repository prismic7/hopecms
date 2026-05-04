import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const {
    signUpWithEmail,
    signInWithGoogle,
    loading,
    authError,
    registrationSent,
    clearError,
  } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1); // 1 = form, 2 = success

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const onEmailRegister = async (firstName, lastName, username, email, password) => {
    clearError();
    await signUpWithEmail(email, password, { firstName, lastName, username });
  };

  const onGoogleRegister = async () => {
    clearError();
    await signInWithGoogle();
  };

  const [form, setForm] = useState({ firstName: "", lastName: "", username: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [sentEmail, setSentEmail] = useState("");

  const validate = (f) => {
    const e = {};
    if (!f.firstName.trim()) e.firstName = "Required.";
    if (!f.lastName.trim()) e.lastName = "Required.";
    if (!f.username.trim()) e.username = "Required.";
    else if (f.username.trim().length < 3) e.username = "Min 3 characters.";
    else if (/\s/.test(f.username)) e.username = "No spaces allowed.";
    if (!f.email) e.email = "Required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Enter a valid email.";
    if (!f.password) e.password = "Required.";
    else if (f.password.length < 6) e.password = "Min 6 characters.";
    return e;
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(validate(form));
  };

  const handleChange = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (touched[field]) setErrors(validate(next));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = { firstName: true, lastName: true, username: true, email: true, password: true };
    setTouched(allTouched);
    const ve = validate(form);
    setErrors(ve);
    if (Object.keys(ve).length > 0) return;
    setSentEmail(form.email);
    await onEmailRegister(form.firstName, form.lastName, form.username, form.email, form.password);
  };

  // Switch to success view after registrationSent
  useEffect(() => {
    if (registrationSent) setStep(2);
  }, [registrationSent]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .rp-root {
          min-height: 100vh;
          background: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', system-ui, sans-serif;
          position: relative;
          overflow: hidden;
          padding: 24px 16px;
        }

        .rp-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: rp-grid-drift 20s linear infinite;
        }
        @keyframes rp-grid-drift {
          0%   { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }

        .rp-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .rp-blob-1 {
          width: 600px; height: 600px;
          background: rgba(255,255,255,0.03);
          top: -250px; right: -200px;
          animation: rp-blob 10s ease-in-out infinite;
        }
        .rp-blob-2 {
          width: 400px; height: 400px;
          background: rgba(255,255,255,0.03);
          bottom: -150px; left: -100px;
          animation: rp-blob 10s ease-in-out infinite;
          animation-delay: -5s;
        }
        @keyframes rp-blob {
          0%, 100% { transform: scale(1) translate(0, 0); }
          50%       { transform: scale(1.08) translate(-15px, 15px); }
        }

        .rp-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 480px;
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
        .rp-card.mounted { opacity: 1; transform: translateY(0) scale(1); }

        /* Brand */
        .rp-brand {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 32px;
          opacity: 0; transform: translateY(8px);
          transition: opacity 0.5s 0.15s ease, transform 0.5s 0.15s ease;
        }
        .rp-card.mounted .rp-brand { opacity: 1; transform: translateY(0); }

        .rp-logo-mark {
          width: 36px; height: 36px;
          background: white; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .rp-logo-mark svg { width: 20px; height: 20px; }
        .rp-brand-name {
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 700; color: white; letter-spacing: -0.3px;
        }
        .rp-brand-sub {
          font-size: 11px; color: rgba(255,255,255,0.35);
          letter-spacing: 1.5px; text-transform: uppercase;
        }

        /* Heading */
        .rp-heading {
          margin-bottom: 28px;
          opacity: 0; transform: translateY(8px);
          transition: opacity 0.5s 0.2s ease, transform 0.5s 0.2s ease;
        }
        .rp-card.mounted .rp-heading { opacity: 1; transform: translateY(0); }
        .rp-title {
          font-family: 'Syne', sans-serif;
          font-size: 24px; font-weight: 700; color: white;
          letter-spacing: -0.5px; line-height: 1.2;
        }
        .rp-subtitle { font-size: 13px; color: rgba(255,255,255,0.35); margin-top: 6px; font-weight: 300; }

        /* Notice pill */
        .rp-notice {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 100px;
          padding: 6px 14px;
          font-size: 12px; color: rgba(255,255,255,0.45);
          margin-bottom: 24px;
          opacity: 0; transition: opacity 0.5s 0.25s ease;
        }
        .rp-card.mounted .rp-notice { opacity: 1; }
        .rp-notice-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(255,255,255,0.3); flex-shrink: 0;
        }

        /* Error banner */
        .rp-error {
          display: flex; align-items: flex-start; gap: 10px;
          background: rgba(220,38,38,0.12);
          border: 1px solid rgba(220,38,38,0.3);
          border-radius: 12px; padding: 12px 14px; margin-bottom: 16px;
          animation: rp-error-in 0.3s ease;
        }
        @keyframes rp-error-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rp-error-icon {
          width: 18px; height: 18px; border-radius: 50%;
          background: rgba(220,38,38,0.25); color: #f87171;
          font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 1px;
        }
        .rp-error-text { font-size: 13px; color: #fca5a5; line-height: 1.5; }

        /* Form */
        .rp-form {
          display: flex; flex-direction: column; gap: 14px;
          opacity: 0; transform: translateY(8px);
          transition: opacity 0.5s 0.3s ease, transform 0.5s 0.3s ease;
        }
        .rp-card.mounted .rp-form { opacity: 1; transform: translateY(0); }

        .rp-row { display: flex; gap: 12px; }
        .rp-field { display: flex; flex-direction: column; gap: 6px; flex: 1; }

        .rp-label {
          font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.4);
          letter-spacing: 0.7px; text-transform: uppercase;
        }

        .rp-input {
          height: 44px; padding: 0 14px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          font-size: 14px; color: white; outline: none; width: 100%;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
        }
        .rp-input::placeholder { color: rgba(255,255,255,0.18); }
        .rp-input:hover { border-color: rgba(255,255,255,0.18); background: rgba(255,255,255,0.08); }
        .rp-input:focus {
          border-color: rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.1);
          box-shadow: 0 0 0 3px rgba(255,255,255,0.05);
        }
        .rp-input.error { border-color: rgba(248,113,113,0.5); box-shadow: 0 0 0 3px rgba(248,113,113,0.08); }
        .rp-field-error { font-size: 11px; color: #f87171; }

        /* Submit */
        .rp-btn-submit {
          height: 48px;
          background: white; color: #0a0a0a;
          border: none; border-radius: 12px;
          font-size: 14px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; letter-spacing: 0.2px;
          margin-top: 6px;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          position: relative; overflow: hidden;
        }
        .rp-btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(255,255,255,0.2);
        }
        .rp-btn-submit:active:not(:disabled) { transform: scale(0.99); }
        .rp-btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Divider + Google */
        .rp-or {
          display: flex; align-items: center; gap: 12px;
          margin: 4px 0;
          opacity: 0; transition: opacity 0.5s 0.4s ease;
        }
        .rp-card.mounted .rp-or { opacity: 1; }
        .rp-or-line { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
        .rp-or-label { font-size: 12px; color: rgba(255,255,255,0.22); white-space: nowrap; }

        .rp-btn-google {
          height: 46px;
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.75);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          font-size: 14px; font-weight: 400;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.5s 0.45s ease, background 0.2s ease, border-color 0.2s ease, transform 0.15s ease, box-shadow 0.15s ease;
        }
        .rp-card.mounted .rp-btn-google { opacity: 1; }
        .rp-btn-google:hover:not(:disabled) {
          background: rgba(255,255,255,0.11);
          border-color: rgba(255,255,255,0.22);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        }
        .rp-btn-google:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
        .rp-btn-google:disabled { opacity: 0.35; cursor: not-allowed; }

        .rp-footer {
          text-align: center; margin-top: 22px;
          font-size: 13px; color: rgba(255,255,255,0.28);
          opacity: 0; transition: opacity 0.5s 0.5s ease;
        }
        .rp-card.mounted .rp-footer { opacity: 1; }
        .rp-footer a { color: rgba(255,255,255,0.65); text-decoration: none; font-weight: 500; transition: color 0.15s ease; }
        .rp-footer a:hover { color: white; }

        /* Success state */
        .rp-success {
          display: flex; flex-direction: column; align-items: center;
          text-align: center; padding: 12px 0;
          animation: rp-success-in 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes rp-success-in {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        .rp-success-icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 24px;
          animation: rp-icon-pulse 2s ease-in-out infinite;
        }
        @keyframes rp-icon-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.1); }
          50%       { box-shadow: 0 0 0 12px rgba(255,255,255,0); }
        }
        .rp-success-title {
          font-family: 'Syne', sans-serif;
          font-size: 22px; font-weight: 700; color: white;
          letter-spacing: -0.3px; margin-bottom: 10px;
        }
        .rp-success-sub { font-size: 14px; color: rgba(255,255,255,0.45); line-height: 1.6; margin-bottom: 24px; }
        .rp-success-email { color: rgba(255,255,255,0.8); font-weight: 500; }
        .rp-success-note {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 14px 18px;
          font-size: 13px; color: rgba(255,255,255,0.4);
          line-height: 1.6; margin-bottom: 28px; text-align: left;
        }
        .rp-success-link {
          font-size: 13px; color: rgba(255,255,255,0.4);
        }
        .rp-success-link a { color: rgba(255,255,255,0.65); text-decoration: none; font-weight: 500; }
        .rp-success-link a:hover { color: white; }

        .rp-watermark {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
          font-size: 11px; color: rgba(255,255,255,0.1); letter-spacing: 1px;
          white-space: nowrap; z-index: 1;
          font-family: 'DM Sans', sans-serif;
        }

        @media (max-width: 520px) {
          .rp-card { padding: 36px 24px; border-radius: 20px; }
          .rp-row { flex-direction: column; gap: 14px; }
          .rp-title { font-size: 20px; }
        }
      `}</style>

      <div className="rp-root">
        <div className="rp-blob rp-blob-1" />
        <div className="rp-blob rp-blob-2" />

        <div className={`rp-card ${mounted ? 'mounted' : ''}`}>

          {/* Brand */}
          <div className="rp-brand">
            <div className="rp-logo-mark">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 3L21 8.5V15.5L12 21L3 15.5V8.5L12 3Z" fill="#0a0a0a" />
                <circle cx="12" cy="12" r="3" fill="white" />
              </svg>
            </div>
            <div>
              <div className="rp-brand-name">Hope, Inc.</div>
              <div className="rp-brand-sub">Customer Management System</div>
            </div>
          </div>

          {step === 2 ? (
            /* ── Success view ── */
            <div className="rp-success">
              <div className="rp-success-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h2 className="rp-success-title">Check your inbox</h2>
              <p className="rp-success-sub">
                A confirmation link has been sent to{" "}
                <span className="rp-success-email">{sentEmail || form.email}</span>.
                <br />Click the link to verify your address.
              </p>
              <div className="rp-success-note">
                After confirming your email, a Sales Manager must activate your account before you can sign in.
              </div>
              <p className="rp-success-link">
                Already confirmed?{" "}
                <a href="/login">Sign in →</a>
              </p>
            </div>
          ) : (
            /* ── Registration form ── */
            <>
              <div className="rp-heading">
                <h1 className="rp-title">Create an account.</h1>
                <p className="rp-subtitle">Fill in your details below to get started.</p>
              </div>

              <div className="rp-notice">
                <span className="rp-notice-dot" />
                New accounts require activation by a Sales Manager
              </div>

              {authError && (
                <div className="rp-error" role="alert">
                  <div className="rp-error-icon">!</div>
                  <span className="rp-error-text">{authError}</span>
                </div>
              )}

              <form className="rp-form" onSubmit={handleSubmit} noValidate>
                {/* Name row */}
                <div className="rp-row">
                  {["firstName", "lastName"].map(id => (
                    <div className="rp-field" key={id}>
                      <label className="rp-label">{id === "firstName" ? "First name" : "Last name"}</label>
                      <input
                        className={`rp-input ${errors[id] && touched[id] ? 'error' : ''}`}
                        type="text"
                        placeholder={id === "firstName" ? "Juan" : "Cruz"}
                        value={form[id]}
                        onChange={e => handleChange(id, e.target.value)}
                        onBlur={() => handleBlur(id)}
                      />
                      {errors[id] && touched[id] && <p className="rp-field-error">{errors[id]}</p>}
                    </div>
                  ))}
                </div>

                {/* Username, Email, Password */}
                {[
                  { id: "username", label: "Username",       type: "text",     ph: "juandelacruz"    },
                  { id: "email",    label: "Email address",  type: "email",    ph: "you@example.com" },
                  { id: "password", label: "Password",       type: "password", ph: "Min. 6 characters" },
                ].map(({ id, label, type, ph }) => (
                  <div className="rp-field" key={id}>
                    <label className="rp-label">{label}</label>
                    <input
                      className={`rp-input ${errors[id] && touched[id] ? 'error' : ''}`}
                      type={type}
                      placeholder={ph}
                      value={form[id]}
                      onChange={e => handleChange(id, e.target.value)}
                      onBlur={() => handleBlur(id)}
                    />
                    {errors[id] && touched[id] && <p className="rp-field-error">{errors[id]}</p>}
                  </div>
                ))}

                <button type="submit" disabled={loading} className="rp-btn-submit">
                  {loading ? "Creating account…" : "Create account"}
                </button>
              </form>

              <div className="rp-or" style={{ marginTop: '18px' }}>
                <div className="rp-or-line" />
                <span className="rp-or-label">or continue with</span>
                <div className="rp-or-line" />
              </div>

              <button
                type="button"
                onClick={onGoogleRegister}
                disabled={loading}
                className="rp-btn-google"
                style={{ marginTop: '12px' }}
              >
                <GoogleIcon />
                Google
              </button>

              <p className="rp-footer">
                Already have an account?{" "}
                <a href="/login">Sign in</a>
              </p>
            </>
          )}
        </div>

        <div className="rp-watermark">NEW ERA UNIVERSITY · AY 2025–2026</div>
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