import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

// ── Placeholder UserRightsContext ─────────────────────────────────────────────
// This is a scaffold created by M1 so App.jsx can wrap the provider without
// crashing while M4 builds the real implementation.
//
// M4 should REPLACE this file entirely with the full UserRightsContext that:
//   - Queries all 9 UserModule_Rights rows on login
//   - Stores them as { CUST_VIEW:1, CUST_ADD:0, ... }
//   - Exposes them via useRights()
// ─────────────────────────────────────────────────────────────────────────────

const UserRightsContext = createContext(null)

export function UserRightsProvider({ children }) {
  const { currentUser } = useAuth()
  const [rights, setRights] = useState({
    CUST_VIEW:  0,
    CUST_ADD:   0,
    CUST_EDIT:  0,
    CUST_DEL:   0,
    SALES_VIEW: 0,
    SD_VIEW:    0,
    PROD_VIEW:  0,
    PRICE_VIEW: 0,
    ADM_USER:   0,
  })
  const [rightsLoading, setRightsLoading] = useState(false)

  // TODO (M4): replace this useEffect with a real Supabase query
  // that loads all 9 UserModule_Rights rows for currentUser
  useEffect(() => {
    if (!currentUser) {
      setRights({
        CUST_VIEW:  0,
        CUST_ADD:   0,
        CUST_EDIT:  0,
        CUST_DEL:   0,
        SALES_VIEW: 0,
        SD_VIEW:    0,
        PROD_VIEW:  0,
        PRICE_VIEW: 0,
        ADM_USER:   0,
      })
    }
  }, [currentUser])

  return (
    <UserRightsContext.Provider value={{ rights, rightsLoading }}>
      {children}
    </UserRightsContext.Provider>
  )
}

export function useRights() {
  const context = useContext(UserRightsContext)
  if (!context) throw new Error('useRights must be used inside UserRightsProvider')
  return context
}