'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import type { OrderStatus } from '@/types/database';

export async function updateOrderStatusAction(orderId: string, newStatus: OrderStatus) {
  const supabaseAdmin = createAdminClient();
  
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status: newStatus } as any)
    .eq('id', orderId);

  if (error) {
    console.error('[KDS Action] Error updating order status:', error.message);
    throw new Error('Failed to update order status');
  }
}

export async function updateOrderPaymentStatusAction(orderId: string, newNotes: string) {
  const supabaseAdmin = createAdminClient();
  
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ 
      payment_status: 'paid',
      notes: newNotes
    } as any)
    .eq('id', orderId);

  if (error) {
    console.error('[KDS Action] Error updating payment status:', error.message);
    throw new Error('Failed to update payment status');
  }
}
