import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

const UserRightsContext = createContext(null)

export function UserRightsProvider({ children }) {
    const { currentUser } = useAuth()

    const [rights, setRights] = useState({
        CUST_VIEW: 0,
        CUST_ADD: 0,
        CUST_EDIT: 0,
        CUST_DEL: 0,
        SALES_VIEW: 0,
        SD_VIEW: 0,
        PROD_VIEW: 0,
        PRICE_VIEW: 0,
        ADM_USER: 0,
    })
    const [rightsLoading, setRightsLoading] = useState(false)

    useEffect(() => {
        // Clear rights when no user is logged in
        if (!currentUser) {
            setRights({
                CUST_VIEW: 0,
                CUST_ADD: 0,
                CUST_EDIT: 0,
                CUST_DEL: 0,
                SALES_VIEW: 0,
                SD_VIEW: 0,
                PROD_VIEW: 0,
                PRICE_VIEW: 0,
                ADM_USER: 0,
            })
            return
        }

        // Load all 9 rights for the current user from UserModule_Rights
        async function loadRights() {
            setRightsLoading(true)
            try {
                const { data, error } = await supabase
                    .from('UserModule_Rights')
                    .select('rightcode, right_value')
                    .eq('userid', currentUser.id)

                if (error) throw error

                // Build rights map from the returned rows
                const map = {
                    CUST_VIEW: 0,
                    CUST_ADD: 0,
                    CUST_EDIT: 0,
                    CUST_DEL: 0,
                    SALES_VIEW: 0,
                    SD_VIEW: 0,
                    PROD_VIEW: 0,
                    PRICE_VIEW: 0,
                    ADM_USER: 0,
                }

                data.forEach((row) => {
                    if (row.rightcode in map) {
                        map[row.rightcode] = row.right_value
                    }
                })

                setRights(map)
            } catch (err) {
                console.error('Failed to load user rights:', err)
            } finally {
                setRightsLoading(false)
            }
        }

        loadRights()
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