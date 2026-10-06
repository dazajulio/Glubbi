import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      tenantId, 
      is_active, 
      kyc_status, 
      license_code, 
      license_valid_until,
      is_cgm_member,
      cgm_member_code,
      subscription_type,
      subscription_status,
      subscription_renews_at
    } = body;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId es requerido' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    const updatePayload: Record<string, any> = {};
    if (typeof is_active === 'boolean') {
      updatePayload.is_active = is_active;
    }
    if (typeof kyc_status === 'string') {
      updatePayload.kyc_status = kyc_status;
    }
    if (typeof license_code === 'string') {
      updatePayload.license_code = license_code;
    }
    if (typeof license_valid_until === 'string') {
      updatePayload.license_valid_until = license_valid_until;
    }
    if (typeof is_cgm_member === 'boolean') {
      updatePayload.is_cgm_member = is_cgm_member;
    }
    if (typeof cgm_member_code === 'string' || cgm_member_code === null) {
      updatePayload.cgm_member_code = cgm_member_code;
    }
    if (typeof subscription_type === 'string') {
      updatePayload.subscription_type = subscription_type;
    }
    if (typeof subscription_status === 'string') {
      updatePayload.subscription_status = subscription_status;
    }
    if (typeof subscription_renews_at === 'string' || subscription_renews_at === null) {
      updatePayload.subscription_renews_at = subscription_renews_at;
    }

    const { data, error } = await supabaseAdmin
      .from('restaurants')
      .update(updatePayload as any)
      .eq('id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('[Admin Tenant Update API Error]:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[Admin Tenant Update API Catch]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
