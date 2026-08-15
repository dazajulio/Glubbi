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

    if (action === 'save_product') {
      const {
        id,
        restaurant_id,
        category_id,
        name,
        description,
        base_price,
        discount_percentage,
        image_url,
        groups
      } = payload;

      let productId = id;

      if (productId) {
        // Update existing product
        const { error: updateErr } = await supabaseAdmin
          .from('products')
          .update({
            category_id,
            name,
            description,
            base_price,
            discount_percentage: discount_percentage || 0,
            image_url: image_url || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', productId);

        if (updateErr) throw updateErr;

        // Clean old modifier groups (cascade deletes modifiers)
        await supabaseAdmin.from('modifier_groups').delete().eq('product_id', productId);
      } else {
        // Insert new product
        const { data: newProd, error: insertErr } = await supabaseAdmin
          .from('products')
          .insert({
            restaurant_id,
            category_id,
            name,
            description,
            base_price,
            discount_percentage: discount_percentage || 0,
            image_url: image_url || null,
            is_available: true,
            is_featured: false
          })
          .select('id')
          .single();

        if (insertErr) throw insertErr;
        productId = newProd.id;
      }

      // Insert Modifier Groups & Modifiers
      if (groups && Array.isArray(groups) && groups.length > 0) {
        for (const group of groups) {
          if (!group.name || !group.name.trim()) continue;
          const minSel = Math.max(0, parseInt(group.min_selections) || 0);
          const maxSel = Math.max(minSel, Math.max(1, parseInt(group.max_selections) || 1));

          const { data: newGroup, error: groupErr } = await supabaseAdmin
            .from('modifier_groups')
            .insert({
              restaurant_id,
              product_id: productId,
              name: group.name.trim(),
              is_required: minSel > 0 || group.is_required || false,
              min_selections: minSel,
              max_selections: maxSel
            })
            .select('id')
            .single();

          if (groupErr) throw groupErr;

          if (group.modifiers && Array.isArray(group.modifiers) && group.modifiers.length > 0) {
            const modsToInsert = group.modifiers
              .filter((m: any) => m.name && m.name.trim())
              .map((m: any) => ({
                group_id: newGroup.id,
                name: m.name.trim(),
                extra_price: m.extra_price || 0,
                is_available: true
              }));

            if (modsToInsert.length > 0) {
              const { error: modErr } = await supabaseAdmin
                .from('modifiers')
                .insert(modsToInsert);

              if (modErr) throw modErr;
            }
          }
        }
      }

      return NextResponse.json({ success: true, productId });
    }

    if (action === 'reorder_products') {
      const { items } = payload;
      if (!Array.isArray(items)) {
        return NextResponse.json({ success: false, error: 'Lista de productos inválida' }, { status: 400 });
      }

      await Promise.all(
        items.map((item: { id: string; order_index: number }) =>
          supabaseAdmin
            .from('products')
            .update({ order_index: item.order_index, updated_at: new Date().toISOString() })
            .eq('id', item.id)
        )
      );

      return NextResponse.json({ success: true });
    }

    if (action === 'reorder_categories') {
      const { items } = payload;
      if (!Array.isArray(items)) {
        return NextResponse.json({ success: false, error: 'Lista de categorías inválida' }, { status: 400 });
      }

      await Promise.all(
        items.map((item: { id: string; order_index: number }) =>
          supabaseAdmin
            .from('categories')
            .update({ order_index: item.order_index })
            .eq('id', item.id)
        )
      );

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
