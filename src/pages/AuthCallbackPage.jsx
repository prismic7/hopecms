import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { currentUser, loading, authError } = useAuth()
  const [timedOut, setTimedOut] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const styleEl = document.createElement('style')
    styleEl.textContent = `@keyframes auth-callback-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`
    document.head.appendChild(styleEl)
    return () => document.head.removeChild(styleEl)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  const params = new URLSearchParams(window.location.search)
  const oauthError = params.get('error')
  const oauthErrorDesc = params.get('error_description')

  useEffect(() => {
    if (!loading) return
    const id = setTimeout(() => setTimedOut(true), 10_000)
    return () => clearTimeout(id)
  }, [loading])

  useEffect(() => {
    if (loading && !timedOut) return

    if (oauthError) {
      const msg = oauthErrorDesc
        ? encodeURIComponent(oauthErrorDesc)
        : encodeURIComponent('Google sign-in was cancelled or denied.')
      navigate(`/login?error=${msg}`, { replace: true })
      return
    }

    if (timedOut) {
      navigate(`/login?error=${encodeURIComponent('Sign-in timed out. Please try again.')}`, { replace: true })
      return
    }

    if (currentUser) {
      navigate('/customers', { replace: true })
      return
    }

    const msg = authError
      ? encodeURIComponent(authError)
      : encodeURIComponent('Sign-in failed. Please contact your Sales Manager.')
    navigate(`/login?error=${msg}`, { replace: true })
  }, [currentUser, loading, authError, timedOut, oauthError, oauthErrorDesc, navigate])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@300;400&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .acb-root {
          position: fixed;
          inset: 0;
          background: #0a0a0a;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', system-ui, sans-serif;
          overflow: hidden;
          animation: acb-fade-in 0.25s ease;
        }
        @keyframes acb-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* Animated background grid */
        .acb-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: acb-grid-drift 20s linear infinite;
          pointer-events: none;
        }
        @keyframes acb-grid-drift {
          0%   { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }

        /* Ambient blob */
        .acb-blob {
          position: absolute;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: rgba(255,255,255,0.03);
          filter: blur(80px);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          animation: acb-blob-pulse 6s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes acb-blob-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50%       { transform: translate(-50%, -50%) scale(1.12); }
        }

        /* Content wrapper */
        .acb-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;

          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1),
                      transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .acb-content.mounted {
          opacity: 1;
          transform: translateY(0);
        }

        /* Logo */
        .acb-logo {
          width: 48px; height: 48px;
          background: white;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 32px;
          flex-shrink: 0;
        }
        .acb-logo svg { width: 26px; height: 26px; }

        /* Spinner */
        .acb-spinner {
          position: relative;
          width: 44px; height: 44px;
          margin-bottom: 24px;
        }
        .acb-track {
          position: absolute; inset: 0;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.08);
        }
        .acb-arc {
          position: absolute; inset: 0;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: rgba(255,255,255,0.75);
          border-right-color: rgba(255,255,255,0.2);
          animation: auth-callback-spin 0.9s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        /* Error icon */
        .acb-error-icon {
          width: 44px; height: 44px;
          border-radius: 50%;
          background: rgba(220,38,38,0.15);
          border: 1px solid rgba(220,38,38,0.25);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 24px;
          font-size: 20px; font-weight: 700;
          color: #f87171;
        }

        /* Text */
        .acb-title {
          font-family: 'Syne', sans-serif;
          font-size: 17px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.3px;
          margin-bottom: 8px;
          text-align: center;
        }
        .acb-sub {
          font-size: 13px;
          font-weight: 300;
          color: rgba(255,255,255,0.35);
          text-align: center;
          line-height: 1.6;
        }

        /* Animated dots */
        .acb-dots {
          display: flex;
          gap: 5px;
          margin-top: 20px;
        }
        .acb-dots span {
          width: 4px; height: 4px;
          border-radius: 50%;
          background: rgba(255,255,255,0.25);
          animation: acb-dot-bounce 1.4s ease-in-out infinite;
        }
        .acb-dots span:nth-child(1) { animation-delay: 0s; }
        .acb-dots span:nth-child(2) { animation-delay: 0.2s; }
        .acb-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes acb-dot-bounce {
          0%, 60%, 100% { opacity: 0.25; transform: translateY(0); }
          30%            { opacity: 0.8;  transform: translateY(-5px); }
        }

        /* Watermark */
        .acb-watermark {
          position: absolute;
          bottom: 24px;
          font-size: 11px;
          color: rgba(255,255,255,0.1);
          letter-spacing: 1px;
          z-index: 1;
          font-family: 'DM Sans', sans-serif;
        }
      `}</style>

      <div className="acb-root">
        <div className="acb-blob" />

        <div className={`acb-content ${mounted ? 'mounted' : ''}`}>
          <div className="acb-logo">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 3L21 8.5V15.5L12 21L3 15.5V8.5L12 3Z" fill="#0a0a0a" />
              <circle cx="12" cy="12" r="3" fill="white" />
            </svg>
          </div>

          {timedOut ? (
            <>
              <div className="acb-error-icon">!</div>
              <p className="acb-title">Taking too long</p>
              <p className="acb-sub">Redirecting you back to the login page.</p>
            </>
          ) : (
            <>
              <div className="acb-spinner">
                <div className="acb-track" />
                <div className="acb-arc" />
              </div>
              <p className="acb-title">Completing sign-in</p>
              <p className="acb-sub">Verifying your account…</p>
              <div className="acb-dots">
                <span /><span /><span />
              </div>
            </>
          )}
        </div>

        <div className="acb-watermark">HOPE, INC. CMS</div>
      </div>
    </>
  )
}