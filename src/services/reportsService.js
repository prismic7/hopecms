import { supabase } from '../lib/supabase';

export async function getCustomerSalesSummary() {
  const { data, error } = await supabase
    .from('customer_sales_summary')
    .select('custno, custname, payterm, record_status, totalTransactions, totalSpend, lastSaleDate')
    .order('totalSpend', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getTopCustomers() {
  const { data, error } = await supabase
    .from('customer_sales_summary')
    .select('custno, custname, totalTransactions, totalSpend, lastSaleDate')
    .order('totalSpend', { ascending: false })
    .limit(10);
  if (error) throw error;
  return data;
}

export async function getProductRevenue() {
  const { data, error } = await supabase
    .from('product_revenue')
    .select('prodCode, description, unit, totalQtySold, totalRevenue')
    .order('totalRevenue', { ascending: false });
  if (error) throw error;
  return data;
}