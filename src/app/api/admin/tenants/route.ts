import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Admin Tenants GET API Error]:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    console.error('[Admin Tenants GET Catch]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, is_active, kyc_status, license_code, license_valid_until } = body;

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'tenantId es requerido' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const updatePayload: Record<string, any> = {};
    if (typeof is_active === 'boolean') updatePayload.is_active = is_active;
    if (typeof kyc_status === 'string') updatePayload.kyc_status = kyc_status;
    if (typeof license_code === 'string') updatePayload.license_code = license_code;
    if (typeof license_valid_until === 'string') updatePayload.license_valid_until = license_valid_until;

    const { data, error } = await supabaseAdmin
      .from('restaurants')
      .update(updatePayload as any)
      .eq('id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('[Admin Tenants POST API Error]:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[Admin Tenants POST Catch]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
