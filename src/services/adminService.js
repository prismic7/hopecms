import { supabase } from '../lib/supabase';

export async function getUsers() {
  const { data, error } = await supabase
    .from('user')
    .select('userid, username, email, user_type, record_status, is_superadmin')
    .order('user_type');
  if (error) throw error;
  return data;
}

export async function activateUser(userId) {
  const { data: target, error: fetchError } = await supabase
    .from('user')
    .select('user_type')
    .eq('userid', userId)
    .single();

  if (fetchError) throw fetchError;
  if (target?.user_type === 'SUPERADMIN') {
    throw new Error('SUPERADMIN accounts cannot be modified.');
  }

  const { error } = await supabase
    .from('user')
    .update({ record_status: 'ACTIVE' })
    .eq('userid', userId);
  if (error) throw error;
}

export async function deactivateUser(userId) {
  const { data: target, error: fetchError } = await supabase
    .from('user')
    .select('user_type')
    .eq('userid', userId)
    .single();

  if (fetchError) throw fetchError;
  if (target?.user_type === 'SUPERADMIN') {
    throw new Error('SUPERADMIN accounts cannot be modified.');
  }

  const { error } = await supabase
    .from('user')
    .update({ record_status: 'INACTIVE' })
    .eq('userid', userId);
  if (error) throw error;
}

// Change a user's role — SUPERADMIN only
// Blocked for SUPERADMIN targets at app + RLS + trigger level
// sync_admin_rights() trigger fires automatically on user_type change
export async function changeUserRole(userId, newRole) {
  const VALID_ROLES = ['USER', 'ADMIN', 'SUPERADMIN'];
  if (!VALID_ROLES.includes(newRole)) {
    throw new Error(`Invalid role: ${newRole}`);
  }

  const { data: target, error: fetchError } = await supabase
    .from('user')
    .select('user_type')
    .eq('userid', userId)
    .single();

  if (fetchError) throw fetchError;
  if (target?.user_type === 'SUPERADMIN') {
    throw new Error('SUPERADMIN accounts cannot be modified.');
  }

  const { error } = await supabase
    .from('user')
    .update({ user_type: newRole })
    .eq('userid', userId);
  if (error) throw error;
}