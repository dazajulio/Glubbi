'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export async function saveCustomerAddressesAction(customerId: string, addresses: any[]) {
  const supabaseAdmin = createAdminClient();
  
  const { error } = await supabaseAdmin
    .from('glubbi_customers')
    .update({ addresses })
    .eq('id', customerId);

  if (error) {
    console.error('[Customer Action] Error updating addresses:', error.message);
    throw new Error('Failed to update addresses');
  }
  
  return true;
}
