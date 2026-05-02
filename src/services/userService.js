// src/services/userService.js
// Handles all user management operations for the Admin Module.
// Used by: UserManagementPage (M2), AppShell restore button (M2)

import { supabase } from '../lib/supabase';

// Generates a stamp string trimmed to fit VARCHAR(60)
// Matches the same makeStamp convention used in customerService.js
function makeStamp(action, userId) {
    const date = new Date().toISOString().slice(0, 10);
    const shortId = userId?.slice(-8) ?? 'unknown';
    const stamp = `${action} by ${shortId} on ${date}`;
    return stamp.slice(0, 60);
}

// Get all users — for UserManagementPage (ADMIN / SUPERADMIN only)
export async function getUsers() {
    const { data, error } = await supabase
        .from('user')
        .select('userid, username, email, user_type, record_status, is_superadmin, stamp')
        .order('user_type')
        .order('username');

    if (error) throw error;
    return data;
}

// Activate a user account — sets record_status = ACTIVE
// Blocked at RLS level if target is SUPERADMIN
export async function activateUser(userId, callerId) {
    const { data, error } = await supabase
        .from('user')
        .update({
            record_status: 'ACTIVE',
            stamp: makeStamp('ACTIVATED', callerId),
        })
        .eq('userid', userId)
        .neq('user_type', 'SUPERADMIN') // app-level guard before RLS
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Deactivate a user account — sets record_status = INACTIVE
// Blocked at RLS level if target is SUPERADMIN
export async function deactivateUser(userId, callerId) {
    const { data, error } = await supabase
        .from('user')
        .update({
            record_status: 'INACTIVE',
            stamp: makeStamp('DEACTIVATED', callerId),
        })
        .eq('userid', userId)
        .neq('user_type', 'SUPERADMIN') // app-level guard before RLS
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Change a user's role — triggers sync_admin_rights() automatically
// Valid transitions: USER ↔ ADMIN, SUPERADMIN → ADMIN/USER, any → SUPERADMIN (SUPERADMIN only)
// Blocked at RLS + trigger level for invalid transitions
export async function changeUserRole(userId, newRole, callerId) {
    const VALID_ROLES = ['USER', 'ADMIN', 'SUPERADMIN'];
    if (!VALID_ROLES.includes(newRole)) {
        throw new Error(`Invalid role: ${newRole}`);
    }

    const { data, error } = await supabase
        .from('user')
        .update({
            user_type: newRole,
            stamp: makeStamp(`ROLE_CHANGED_TO_${newRole}`, callerId),
        })
        .eq('userid', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Restore SUPERADMIN — called exclusively from the AppShell self-recovery modal.
// Only works when:
//   1. The caller's is_superadmin = TRUE (permanent flag, set at DB level)
//   2. The caller is currently demoted (user_type != 'SUPERADMIN')
// sync_admin_rights() trigger fires automatically and restores all 9 rights to 1.
export async function restoreSuperadmin(userId) {
    const { data, error } = await supabase
        .from('user')
        .update({
            user_type: 'SUPERADMIN',
            stamp: makeStamp('SELF_RESTORED_SUPERADMIN', userId),
        })
        .eq('userid', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
}