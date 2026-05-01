import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

async function fetchDbUser(userId) {
  const { data, error } = await supabase
    .from('user')
    .select('*')
    .eq('userid', userId)
    .single()
  if (error) throw error
  return data
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const [registrationSent, setRegistrationSent] = useState(false)

  useEffect(() => {
    // On mount, check if there's an existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        try {
          const dbUser = await fetchDbUser(session.user.id)
          if (dbUser.record_status === 'INACTIVE') {
            await supabase.auth.signOut()
            setAuthError('Your account is pending activation.')
            setCurrentUser(null)
          } else {
            setCurrentUser({ ...session.user, ...dbUser })
          }
        } catch {
          setCurrentUser(null)
        }
      } else {
        setCurrentUser(null)
      }
      setLoading(false)
    })

    // Only listen for SIGNED_OUT and TOKEN_REFRESHED
    // SIGNED_IN is handled explicitly in signInWithEmail and signInWithGoogle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[onAuthStateChange] event:', event)
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null)
          setAuthError(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithEmail = async (email, password) => {
    setLoading(true)
    setAuthError(null)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const dbUser = await fetchDbUser(data.user.id)
      if (dbUser.record_status === 'INACTIVE') {
        await supabase.auth.signOut()
        setAuthError('Your account is pending activation. Please contact a Sales Manager.')
        setCurrentUser(null)
      } else {
        setCurrentUser({ ...data.user, ...dbUser })
      }
    } catch (err) {
      setAuthError(err.message || 'Invalid email or password.')
      setCurrentUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signUpWithEmail = async (email, password, metadata = {}) => {
    setLoading(true)
    setAuthError(null)
    setRegistrationSent(false)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: metadata.firstName ?? '',
            last_name: metadata.lastName ?? '',
            username: metadata.username ?? '',
          },
        },
      })
      if (error) throw error
      setRegistrationSent(true)
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
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
    <AuthContext.Provider value={{
      currentUser,
      loading,
      authError,
      registrationSent,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth() must be called inside <AuthProvider>')
  return ctx
}