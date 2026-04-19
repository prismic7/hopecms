// This file fakes the Supabase client so tests don't hit the real database

export const mockSignUp = vi.fn()
export const mockSignIn = vi.fn()
export const mockSignOut = vi.fn()
export const mockSignInWithOAuth = vi.fn()
export const mockOnAuthStateChange = vi.fn()
export const mockFrom = vi.fn()

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignIn,
      signOut: mockSignOut,
      signInWithOAuth: mockSignInWithOAuth,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  },
}))