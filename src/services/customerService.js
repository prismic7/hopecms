import { supabase } from '../lib/supabase';

// Generates a stamp string trimmed to fit VARCHAR(60)
function makeStamp(action, userId) {
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD only
    const shortId = userId?.slice(-8) ?? 'unknown';    // last 8 chars of userId
    const stamp = `${action} by ${shortId} on ${date}`;
    return stamp.slice(0, 60);                          // hard cap at 60
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