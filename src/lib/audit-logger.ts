import { createClient } from '@/lib/supabase/client';

export type ProcessEventCategory = 
  | 'AUTH_LOGIN'
  | 'SETTINGS_UPDATE'
  | 'ORDER_PROCESS'
  | 'KDS_ACTION'
  | 'ERROR_CRITICAL'
  | 'SYSTEM_EVENT';

export interface AuditLogPayload {
  restaurantId?: string | null;
  action: string;
  category?: ProcessEventCategory;
  details?: string | null;
  adminEmail?: string | null;
  errorStack?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Logs a system process audit event to Supabase system_logs
 */
export async function logProcessEvent(payload: AuditLogPayload): Promise<boolean> {
  const {
    restaurantId,
    action,
    category = 'SYSTEM_EVENT',
    details,
    adminEmail,
    errorStack,
    metadata
  } = payload;

  try {
    const supabase = createClient();
    const formattedDetails = [
      category ? `[Categoría: ${category}]` : null,
      restaurantId ? `[RestaurantId: ${restaurantId}]` : null,
      details ? details : null,
      metadata ? `[Metadata: ${JSON.stringify(metadata)}]` : null,
      errorStack ? `[Stack: ${errorStack.substring(0, 500)}]` : null
    ].filter(Boolean).join(' | ');

    const { error } = await supabase
      .from('system_logs')
      .insert({
        action,
        details: formattedDetails,
        admin_email: adminEmail || null
      } as any);

    if (error) {
      console.warn('AuditLogger: Failed to persist to system_logs table:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('AuditLogger error:', err);
    return false;
  }
}
