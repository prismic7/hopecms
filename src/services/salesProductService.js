import { supabase } from '../lib/supabase';

// Get all sales transactions for a specific customer
export async function getSalesByCustomer(custNo) {
  const { data, error } = await supabase
    .from('sales')
    .select('transNo, salesDate, empNo')
    .eq('custNo', custNo)
    .order('salesDate', { ascending: false });

  if (error) throw error;
  return data;
}

// Get all line items for a specific transaction
export async function getSalesDetail(transNo) {
  const { data, error } = await supabase
    .from('salesDetail')
    .select(`
      transNo,
      quantity,
      product (
        prodCode,
        description,
        unit
      )
    `)
    .eq('transNo', transNo);

  if (error) throw error;
  return data;
}

// Get all products (read-only)
export async function getProducts() {
  const { data, error } = await supabase
    .from('product')
    .select('*')
    .order('prodCode');

  if (error) throw error;
  return data;
}

// Get full price history for a specific product
export async function getPriceHistory(prodCode) {
  const { data, error } = await supabase
    .from('priceHist')
    .select('effDate, unitPrice')
    .eq('prodCode', prodCode)
    .order('effDate', { ascending: false });

  if (error) throw error;
  return data;
}

// Get the current (latest) price for a specific product
export async function getCurrentPrice(prodCode) {
  const { data, error } = await supabase
    .from('priceHist')
    .select('unitPrice, effDate')
    .eq('prodCode', prodCode)
    .order('effDate', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
}