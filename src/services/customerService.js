import { supabase } from '../lib/supabase';

// Generates a stamp string for audit trail
function makeStamp(action, userId) {
  const now = new Date().toISOString();
  return `${action} by ${userId} on ${now}`;
}

// Get customers — ACTIVE only for USER, all for ADMIN/SUPERADMIN
export async function getCustomers(userType) {
  let query = supabase
    .from('customer')
    .select('*')
    .order('custno');

  if (userType === 'USER') {
    query = query.eq('record_status', 'ACTIVE');
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Add a new customer
export async function addCustomer(customerData, userId) {
  const { data, error } = await supabase
    .from('customer')
    .insert([
      {
        ...customerData,
        record_status: 'ACTIVE',
        stamp: makeStamp('CREATED', userId),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update an existing customer's details
export async function updateCustomer(custno, updates, userId) {
  const { data, error } = await supabase
    .from('customer')
    .update({
      ...updates,
      stamp: makeStamp('UPDATED', userId),
    })
    .eq('custno', custno)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Soft delete — sets record_status to INACTIVE (NO hard delete ever)
export async function softDeleteCustomer(custno, userId) {
  const { data, error } = await supabase
    .from('customer')
    .update({
      record_status: 'INACTIVE',
      stamp: makeStamp('DEACTIVATED', userId),
    })
    .eq('custno', custno)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Recover a soft-deleted customer — sets record_status back to ACTIVE
export async function recoverCustomer(custno, userId) {
  const { data, error } = await supabase
    .from('customer')
    .update({
      record_status: 'ACTIVE',
      stamp: makeStamp('REACTIVATED', userId),
    })
    .eq('custno', custno)
    .select()
    .single();

  if (error) throw error;
  return data;
}