import { supabase } from '../lib/supabase';

// Get all sales transactions for a specific customer
export async function getSalesByCustomer(custNo) {
  const { data, error } = await supabase
    .from('sales')
    .select('transno, salesdate, empno')
    .eq('custno', custNo)
    .order('salesdate', { ascending: false });

  if (error) throw error;
  return data;
}

// Get all line items for a specific transaction
export async function getSalesDetail(transNo) {
  const { data, error } = await supabase
    .from('salesdetail')
    .select(`
      transno,
      quantity,
      product (
        prodcode,
        description,
        unit
      )
    `)
    .eq('transno', transNo);

  if (error) throw error;
  return data;
}

// Get all products (read-only)
export async function getProducts() {
  const { data, error } = await supabase
    .from('product')
    .select('*')
    .order('prodcode', { ascending: true });

  if (error) throw error;
  return data;
}

// Get full price history for a specific product
export async function getPriceHistory(prodCode) {
  const { data, error } = await supabase
    .from('pricehist')
    .select('effdate, unitprice')
    .eq('prodcode', prodCode)
    .order('effdate', { ascending: false });

  if (error) throw error;
  return data;
}

// Get the current (latest) price for a specific product
export async function getCurrentPrice(prodCode) {
  const { data, error } = await supabase
    .from('pricehist')
    .select('unitprice, effdate')
    .eq('prodcode', prodCode)
    .order('effdate', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
}