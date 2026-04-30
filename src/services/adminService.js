import { supabase } from '../lib/supabase';

export async function getUsers() {
  const { data, error } = await supabase
    .from('"user"')
    .select('userId, username, email, user_type, record_status')
    .order('user_type');
  if (error) throw error;
  return data;
}

export async function activateUser(userId) {
  const { data: target, error: fetchError } = await supabase
    .from('"user"')
    .select('user_type')
    .eq('userId', userId)
    .single();

  if (fetchError) throw fetchError;
  if (target?.user_type === 'SUPERADMIN') {
    throw new Error('SUPERADMIN accounts cannot be modified.');
  }

  const { error } = await supabase
    .from('"user"')
    .update({ record_status: 'ACTIVE' })
    .eq('userId', userId);
  if (error) throw error;
}

export async function deactivateUser(userId) {
  const { data: target, error: fetchError } = await supabase
    .from('"user"')
    .select('user_type')
    .eq('userId', userId)
    .single();

  if (fetchError) throw fetchError;
  if (target?.user_type === 'SUPERADMIN') {
    throw new Error('SUPERADMIN accounts cannot be modified.');
  }

  const { error } = await supabase
    .from('"user"')
    .update({ record_status: 'INACTIVE' })
    .eq('userId', userId);
  if (error) throw error;
}