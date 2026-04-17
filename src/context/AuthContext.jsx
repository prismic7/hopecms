import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const [registrationSent, setRegistrationSent] = useState(false)

  const isHandlingRef = useRef(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!session || error) {
        Object.keys(localStorage)
          .filter(k => k.startsWith('sb-'))
          .forEach(k => localStorage.removeItem(k))
      }
    })

    let ignore = false 

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isHandlingRef.current) return
        isHandlingRef.current = true

        try {
          if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
            if (session) {
              try {
                await supabase.from('customer').select('custno').limit(1)
              } catch {
                // Silently bypass if the table doesn't exist yet
              }

              if (ignore) return

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
            setAuthError(err.message)
            setCurrentUser(null)
          }
        } finally {
          if (!ignore) setLoading(false)
          isHandlingRef.current = false 
        }
      }
    )

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, [])

  const signInWithEmail = async (email, password) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setAuthError('Invalid email or password.')
      setLoading(false)
    }
  }

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

  const signInWithGoogle = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: 'select_account', 
        },
      },
    })
    if (error) {
      setAuthError(error.message)
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
    } catch (err) {
      // Handled silently
    } finally {
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