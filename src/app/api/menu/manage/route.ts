import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { action, payload } = await request.json();
    const supabaseAdmin = createAdminClient();

    if (action === 'toggle_product') {
      const { id, is_available } = payload;
      const { data, error } = await supabaseAdmin
        .from('products')
        .update({ is_available })
        .eq('id', id)
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === 'delete_product') {
      const { id } = payload;
      const { error } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'toggle_modifier') {
      const { id, is_available } = payload;
      const { data, error } = await supabaseAdmin
        .from('modifiers')
        .update({ is_available })
        .eq('id', id)
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === 'create_category') {
      const { restaurantId, name } = payload;
      const { data, error } = await supabaseAdmin
        .from('categories')
        .insert({ restaurant_id: restaurantId, name })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === 'edit_category') {
      const { id, name } = payload;
      const { data, error } = await supabaseAdmin
        .from('categories')
        .update({ name })
        .eq('id', id)
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === 'delete_category') {
      const { id } = payload;
      const { error } = await supabaseAdmin
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });

  } catch (error: any) {
    console.error('API /api/menu/manage error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
