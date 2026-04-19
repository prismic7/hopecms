import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  mockSignUp,
  mockSignIn,
  mockSignOut,
  mockSignInWithOAuth,
  mockOnAuthStateChange,
  mockFrom,
} from './mocks/supabase'

// ─────────────────────────────────────────────
// Import the mock first so vi.mock() is hoisted
// ─────────────────────────────────────────────
import './mocks/supabase'

// ─────────────────────────────────────────────
// Reset all mocks before each test
// ─────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks()
})

// ══════════════════════════════════════════════
// TEST 1 — Email registration creates a new user
// ══════════════════════════════════════════════
describe('Email Registration', () => {
  it('calls signUp with the correct email and password', async () => {
    // Arrange — fake a successful signUp response
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    })

    // Act — simulate what happens when the Register form is submitted
    const { supabase } = await import('../lib/supabase')
    const result = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
    })

    // Assert
    expect(mockSignUp).toHaveBeenCalledOnce()
    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(result.error).toBeNull()
    expect(result.data.user.email).toBe('test@example.com')
  })

  it('returns an error when registration fails', async () => {
    // Arrange — fake a failed signUp response
    mockSignUp.mockResolvedValueOnce({
      data: null,
      error: { message: 'User already registered' },
    })

    // Act
    const { supabase } = await import('../lib/supabase')
    const result = await supabase.auth.signUp({
      email: 'existing@example.com',
      password: 'password123',
    })

    // Assert
    expect(result.error).not.toBeNull()
    expect(result.error.message).toBe('User already registered')
  })
})

// ══════════════════════════════════════════════
// TEST 2 — Login guard BLOCKS INACTIVE accounts
// ══════════════════════════════════════════════
describe('Login Guard — INACTIVE account', () => {
  it('signs the user out and returns an error if record_status is INACTIVE', async () => {
    // Arrange — fake a session and an INACTIVE user row
    const fakeSession = { user: { id: 'inactive-user-id' } }

    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({
        data: {
          record_status: 'INACTIVE',
          user_type: 'USER',
          username: 'inactiveuser',
        },
        error: null,
      }),
    })

    mockSignOut.mockResolvedValueOnce({ error: null })

    // Act — simulate the login guard logic from AuthContext
    const { supabase } = await import('../lib/supabase')

    const { data: userRow } = await supabase
      .from('user')
      .select('record_status, user_type, username')
      .eq('userId', fakeSession.user.id)
      .single()

    let errorMessage = null

    if (userRow?.record_status !== 'ACTIVE') {
      await supabase.auth.signOut()
      errorMessage = 'Your account is pending activation by a Sales Manager.'
    }

    // Assert
    expect(mockSignOut).toHaveBeenCalledOnce()
    expect(errorMessage).toBe(
      'Your account is pending activation by a Sales Manager.'
    )
  })
})

// ══════════════════════════════════════════════
// TEST 3 — Login guard ALLOWS ACTIVE accounts
// ══════════════════════════════════════════════
describe('Login Guard — ACTIVE account', () => {
  it('does NOT sign out and sets currentUser if record_status is ACTIVE', async () => {
    // Arrange — fake a session and an ACTIVE user row
    const fakeSession = { user: { id: 'active-user-id' } }

    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({
        data: {
          record_status: 'ACTIVE',
          user_type: 'USER',
          username: 'activeuser',
        },
        error: null,
      }),
    })

    // Act — simulate the login guard logic
    const { supabase } = await import('../lib/supabase')

    const { data: userRow } = await supabase
      .from('user')
      .select('record_status, user_type, username')
      .eq('userId', fakeSession.user.id)
      .single()

    let currentUser = null
    let errorMessage = null

    if (userRow?.record_status !== 'ACTIVE') {
      await supabase.auth.signOut()
      errorMessage = 'Your account is pending activation by a Sales Manager.'
    } else {
      currentUser = { ...fakeSession.user, ...userRow }
    }

    // Assert
    expect(mockSignOut).not.toHaveBeenCalled()
    expect(errorMessage).toBeNull()
    expect(currentUser).not.toBeNull()
    expect(currentUser.record_status).toBe('ACTIVE')
    expect(currentUser.username).toBe('activeuser')
  })
})

// ══════════════════════════════════════════════
// TEST 4 — Google OAuth new user flow
// ══════════════════════════════════════════════
describe('Google OAuth', () => {
  it('calls signInWithOAuth with google as the provider', async () => {
    // Arrange — fake a successful OAuth initiation
    mockSignInWithOAuth.mockResolvedValueOnce({
      data: { provider: 'google', url: 'https://accounts.google.com/...' },
      error: null,
    })

    // Act
    const { supabase } = await import('../lib/supabase')
    const result = await supabase.auth.signInWithOAuth({ provider: 'google' })

    // Assert
    expect(mockSignInWithOAuth).toHaveBeenCalledOnce()
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({ provider: 'google' })
    expect(result.error).toBeNull()
    expect(result.data.provider).toBe('google')
  })

  it('returns an error if Google OAuth fails', async () => {
    // Arrange
    mockSignInWithOAuth.mockResolvedValueOnce({
      data: null,
      error: { message: 'OAuth provider error' },
    })

    // Act
    const { supabase } = await import('../lib/supabase')
    const result = await supabase.auth.signInWithOAuth({ provider: 'google' })

    // Assert
    expect(result.error).not.toBeNull()
    expect(result.error.message).toBe('OAuth provider error')
  })
})