import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * /auth/callback — the only landing page after a Google OAuth redirect.
 *
 * ┌─ Why this page does NOT call getSession() or exchangeCodeForSession() ─────┐
 * │  supabase.js sets detectSessionInUrl: true, so the Supabase client         │
 * │  auto-exchanges the ?code= PKCE parameter the moment it is imported.       │
 * │  That exchange fires onAuthStateChange(SIGNED_IN) inside AuthContext,       │
 * │  which runs the login guard and sets currentUser.                           │
 * │                                                                             │
 * │  Calling exchangeCodeForSession() here a second time would trigger a        │
 * │  second SIGNED_IN event — double-firing the login guard.                   │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * Responsibilities:
 *   1. Inject @keyframes for the spinner (inline styles can't define @keyframes).
 *   2. Detect OAuth-level errors Google puts in the URL (e.g. user cancelled).
 *   3. Show a spinner while AuthContext runs the login guard.
 *   4. Redirect to /customers on success, or /login?error=… on any failure.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { currentUser, loading, authError } = useAuth()
  const [timedOut, setTimedOut] = useState(false)

  // ── 1. Inject @keyframes so the CSS animation works with inline styles ─────
  //
  // Inline style objects cannot define @keyframes — the browser needs a real
  // <style> rule. We inject one on mount and clean it up on unmount.
  // The name `auth-callback-spin` is unique to avoid colliding with any other
  // @keyframes rules in the app.
  useEffect(() => {
    const styleEl = document.createElement('style')
    styleEl.textContent = `
      @keyframes auth-callback-spin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(styleEl)
    return () => document.head.removeChild(styleEl)
  }, [])

  // ── 2. Detect OAuth-level errors in the URL ────────────────────────────────
  //
  // When the user cancels Google sign-in the redirect arrives as:
  //   /auth/callback?error=access_denied&error_description=User+denied+access
  //
  // Read synchronously so the redirect effect acts on it immediately.
  const params         = new URLSearchParams(window.location.search)
  const oauthError     = params.get('error')
  const oauthErrorDesc = params.get('error_description')

  // ── 3. 10-second timeout safety net ───────────────────────────────────────
  //
  // If AuthContext's login guard is still running after 10 s (network issue,
  // Supabase outage), redirect to login rather than leaving a permanent spinner.
  useEffect(() => {
    if (!loading) return
    const id = setTimeout(() => setTimedOut(true), 10_000)
    return () => clearTimeout(id)
  }, [loading])

  // ── 4. Redirect once AuthContext resolves (or we time out) ─────────────────
  useEffect(() => {
    if (loading && !timedOut) return   // still loading — keep showing spinner

    // Case A: Google returned an error in the URL (cancelled, misconfigured)
    if (oauthError) {
      const msg = oauthErrorDesc
        ? encodeURIComponent(oauthErrorDesc)
        : encodeURIComponent('Google sign-in was cancelled or denied.')
      navigate(`/login?error=${msg}`, { replace: true })
      return
    }

    // Case B: Login guard timed out
    if (timedOut) {
      navigate(
        `/login?error=${encodeURIComponent('Sign-in timed out. Please try again.')}`,
        { replace: true }
      )
      return
    }

    // Case C: Login guard passed — user is ACTIVE
    if (currentUser) {
      navigate('/customers', { replace: true })
      return
    }

    // Case D: Login guard failed — INACTIVE account or DB error
    const msg = authError
      ? encodeURIComponent(authError)
      : encodeURIComponent('Sign-in failed. Please contact your Sales Manager.')
    navigate(`/login?error=${msg}`, { replace: true })

  }, [currentUser, loading, authError, timedOut, oauthError, oauthErrorDesc, navigate])

  // ── Spinner UI ─────────────────────────────────────────────────────────────
  return (
    <div style={styles.root}>
      <div style={styles.card}>
        {timedOut ? (
          <>
            <div style={styles.errorIcon}>!</div>
            <p style={styles.title}>Taking too long…</p>
            <p style={styles.sub}>Redirecting you back to the login page.</p>
          </>
        ) : (
          <>
            {/* animation name matches the @keyframes injected above */}
            <div style={{
              ...styles.spinner,
              animation: 'auth-callback-spin 0.8s linear infinite',
            }} />
            <p style={styles.title}>Completing sign-in</p>
            <p style={styles.sub}>Please wait while we verify your account…</p>
          </>
        )}
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    background: 'white',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '48px 40px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
    minWidth: '280px',
  },
  spinner: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: '4px solid #e2e8f0',
    borderTopColor: '#2563eb',
    // animation is set inline above so the unique @keyframes name is co-located
  },
  errorIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: '#fee2e2',
    color: '#dc2626',
    fontSize: '20px',
    fontWeight: '700',
  },
  title: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#0f172a',
    margin: 0,
  },
  sub: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0,
    textAlign: 'center',
  },
}