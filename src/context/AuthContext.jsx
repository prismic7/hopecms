import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser,      setCurrentUser]      = useState(null)
  const [loading,          setLoading]          = useState(true)
  const [authError,        setAuthError]        = useState(null)
  const [registrationSent, setRegistrationSent] = useState(false)

  // ── Deduplication ref ──────────────────────────────────────────────────────
  //
  // React StrictMode (dev only) mounts → unmounts → remounts every component.
  // Each mount calls onAuthStateChange, creating a new subscription (S1, S2).
  // Supabase fires INITIAL_SESSION SYNCHRONOUSLY the moment a subscription is
  // created — before S1's cleanup ever runs. So both S1 and S2 fire, making
  // every event appear twice in the console.
  //
  // The `ignore` closure flag (used previously) can't block this because the
  // synchronous INITIAL_SESSION fires before cleanup sets ignore=true.
  //
  // useRef() SURVIVES the StrictMode unmount/remount cycle. If S1's handler is
  // already running when S2's handler is called for the same event, the ref
  // short-circuits S2's handler immediately — preventing double guard runs,
  // double network calls, and double signOut() calls for INACTIVE accounts.
  const isHandlingRef = useRef(false)

  useEffect(() => {
    // ── Stale-session purge ────────────────────────────────────────────────
    // Wipe any partial OAuth token left from an abandoned Google flow so that
    // Supabase's _initialize doesn't send a stale token and get a 401.
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!session || error) {
        Object.keys(localStorage)
          .filter(k => k.startsWith('sb-'))
          .forEach(k => localStorage.removeItem(k))
      }
    })

    let ignore = false // guards async state updates after unmount

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {

        // ── Deduplication: skip if another handler is already running ─────
        // This is the fix for the double SIGNED_IN / double guard issue.
        // The ref persists across StrictMode remounts; a closure `ignore`
        // flag does not, which is why the previous approach didn't fully work.
        if (isHandlingRef.current) return
        isHandlingRef.current = true

        console.log(`[AuthContext] event: ${event} | userId:`, session?.user?.id ?? 'none')

        try {
          if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
            if (session) {
              // ── Step 1: Non-fatal network check ───────────────────────
              // This is diagnostic only. If M3's RLS isn't set up yet or
              // the table doesn't exist, we log a warning and continue —
              // we don't block the login.
              try {
                await supabase.from('customer').select('custno').limit(1)
                console.log('[AuthContext] 1b. Network OK')
              } catch {
                console.warn('[AuthContext] Network check skipped — customer table may not exist yet')
              }

              if (ignore) return

              // ── Step 2: Load app user row + login guard ────────────────
              console.log('[AuthContext] 2a. Loading user record…')
              const { data: dbUser, error } = await supabase
                .from('user')
                .select('*')
                .eq('userid', session.user.id)
                .single()

              if (ignore) return

              if (error) {
                throw new Error(
                  'Unable to verify your account status. ' +
                  'Please try signing in again.'
                )
              }

              console.log('[AuthContext] 2b. User record loaded:', dbUser)

              if (dbUser.record_status === 'INACTIVE') {
                await supabase.auth.signOut()
                setAuthError(
                  'Your account is pending activation. ' +
                  'Please contact a Sales Manager to have it activated.'
                )
                setCurrentUser(null)
              } else {
                setCurrentUser({ ...session.user, ...dbUser })
                setAuthError(null)
              }

            } else {
              // No session — nobody is logged in
              if (!ignore) {
                setCurrentUser(null)
                setLoading(false)
              }
            }

          } else if (event === 'SIGNED_OUT') {
            setCurrentUser(null)
            setAuthError(null)
            setLoading(false)

          } else if (event === 'TOKEN_REFRESHED') {
            setLoading(false)
          }

        } catch (err) {
          if (!ignore) {
            console.error('[AuthContext] Guard error:', err.message)
            setAuthError(err.message)
            setCurrentUser(null)
          }
        } finally {
          if (!ignore) setLoading(false)
          isHandlingRef.current = false  // release the lock
        }
      }
    )

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, [])

  // ─── Auth actions ──────────────────────────────────────────────────────────

  /**
   * signInWithEmail — email + password LOGIN.
   * Called by LoginPage via useAuth() hook.
   * On success onAuthStateChange(SIGNED_IN) fires → sets currentUser →
   * LoginPage's useEffect watches currentUser and navigates to /customers.
   */
  const signInWithEmail = async (email, password) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setAuthError('Invalid email or password.')
      setLoading(false)
    }
  }

  /**
   * signUpWithEmail — email + password REGISTRATION.
   * Called by RegisterPage via useAuth() hook.
   * Sends a confirmation email; provision_new_user() trigger creates the
   * USER / INACTIVE row when the user clicks the confirmation link.
   */
  const signUpWithEmail = async (email, password, metadata = {}) => {
    setLoading(true)
    setAuthError(null)
    setRegistrationSent(false)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: metadata.firstName ?? '',
          last_name:  metadata.lastName  ?? '',
          username:   metadata.username  ?? '',
        },
      },
    })

    if (error) {
      setAuthError(error.message)
    } else {
      setRegistrationSent(true)
    }
    setLoading(false)
  }

  /**
   * signInWithGoogle — Google OAuth for both Login and Register pages.
   *
   * `prompt: 'select_account'` forces Google to ALWAYS show the account
   * picker, even if the user previously signed in with Google. Without this,
   * after signing out the next click auto-selects the cached Google account
   * and the user cannot choose a different one or confirm the sign-in.
   */
  const signInWithGoogle = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: 'select_account',  // ← forces Google account picker every time
        },
      },
    })
    if (error) {
      setAuthError(error.message)
      setLoading(false)
    }
  }

  /**
   * signOut — clears the Supabase session AND all localStorage tokens.
   *
   * Without the localStorage purge, Supabase can restore the session from
   * stored tokens on the next page load, making the logout appear to not work.
   */
  const signOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('[AuthContext] signOut error:', err)
    } finally {
      // Explicitly clear all Supabase tokens from localStorage so there is
      // no residual session that auto-restores on the next page load.
      Object.keys(localStorage)
        .filter(k => k.startsWith('sb-'))
        .forEach(k => localStorage.removeItem(k))

      setCurrentUser(null)
      setAuthError(null)
      setRegistrationSent(false)
      setLoading(false)
    }
  }

  const clearError = () => {
    setAuthError(null)
    setRegistrationSent(false)
  }

  // NOTE: exported as `authError` not `error`
  // All pages must destructure it as: const { authError } = useAuth()
  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        authError,
        registrationSent,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth() must be called inside <AuthProvider>')
  return ctx
}