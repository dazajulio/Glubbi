import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient();

    // 1. Fetch all customers from `customers` and `glubbi_customers`
    const { data: customersData, error: cErr } = await supabaseAdmin
      .from('customers')
      .select('*');

    const { data: glubbiCustomersData, error: gcErr } = await supabaseAdmin
      .from('glubbi_customers')
      .select('*');

    // 2. Fetch all orders
    const { data: ordersData, error: oErr } = await supabaseAdmin
      .from('orders')
      .select('id, customer_id, total_amount, restaurant_id, status, payment_status, notes, created_at');

    if (cErr) console.warn('[Admin Customers] customers query error:', cErr);
    if (gcErr) console.warn('[Admin Customers] glubbi_customers query error:', gcErr);
    if (oErr) console.warn('[Admin Customers] orders query error:', oErr);

    // 3. Map & Group customers by email
    const grouped: { [email: string]: any } = {};

    // Helper to get or create group
    const getOrCreateGroup = (emailStr?: string, fallbackName?: string, fallbackPhone?: string, fallbackId?: string) => {
      const emailKey = emailStr?.toLowerCase().trim() || `no-email-${fallbackId || Math.random()}`;
      if (!grouped[emailKey]) {
        grouped[emailKey] = {
          name: fallbackName || 'Cliente',
          email: emailStr || '',
          phone: fallbackPhone || '',
          restaurants: new Set(),
          orderCount: 0,
          totalSpent: 0,
          ids: new Set()
        };
      }
      if (fallbackId) grouped[emailKey].ids.add(fallbackId);
      if (fallbackName && (!grouped[emailKey].name || grouped[emailKey].name === 'Cliente')) {
        grouped[emailKey].name = fallbackName;
      }
      if (fallbackPhone && !grouped[emailKey].phone) {
        grouped[emailKey].phone = fallbackPhone;
      }
      return grouped[emailKey];
    };

    // Process `customers` table
    (customersData || []).forEach(c => {
      const grp = getOrCreateGroup(c.email, c.name, c.phone, c.id);
      if (c.restaurant_id) grp.restaurants.add(c.restaurant_id);
    });

    // Process `glubbi_customers` table
    (glubbiCustomersData || []).forEach(gc => {
      const fullName = `${gc.first_name || ''} ${gc.last_name || ''}`.trim();
      const grp = getOrCreateGroup(gc.email, fullName, gc.phone, gc.id);
      grp.restaurants.add('APP_GLUBBI');
    });

    // Helper to normalize phones (removes non-digits and takes last 10 digits for country code matching)
    const normalizePhone = (ph?: string) => {
      if (!ph) return '';
      const digits = ph.replace(/\D/g, '');
      if (digits.length >= 10) return digits.slice(-10);
      return digits;
    };

    // Map customer IDs, phones, and names to group for instant lookup
    const idToGroupMap: { [id: string]: any } = {};
    const phoneToGroupMap: { [phone: string]: any } = {};
    const nameToGroupMap: { [name: string]: any } = {};

    Object.values(grouped).forEach(grp => {
      grp.ids.forEach((idVal: string) => {
        idToGroupMap[idVal] = grp;
      });
      if (grp.phone) {
        const normP = normalizePhone(grp.phone);
        if (normP) phoneToGroupMap[normP] = grp;
      }
      if (grp.name) {
        const normN = grp.name.toLowerCase().trim();
        if (normN && normN !== 'cliente') nameToGroupMap[normN] = grp;
      }
    });

    // 4. Associate orders
    (ordersData || []).forEach(o => {
      if (o.status === 'cancelled') return;
      const amount = Number(o.total_amount || 0);

      // 1. Match by customer_id
      let matchedGroup = o.customer_id ? idToGroupMap[o.customer_id] : null;

      // 2. Match by email in notes
      if (!matchedGroup && o.notes) {
        const emailMatch = o.notes.match(/[\w.-]+@[\w.-]+\.\w+/);
        if (emailMatch && emailMatch[0]) {
          const eKey = emailMatch[0].toLowerCase().trim();
          matchedGroup = grouped[eKey];
        }
      }

      // 3. Match by phone in notes (e.g. Teléfono: 584247538143 or 04248486291)
      if (!matchedGroup && o.notes) {
        const phoneMatch = o.notes.match(/Teléfono:\s*(\+?\d+)/i) || o.notes.match(/(\d{10,13})/);
        if (phoneMatch && phoneMatch[1]) {
          const normP = normalizePhone(phoneMatch[1]);
          if (normP && phoneToGroupMap[normP]) {
            matchedGroup = phoneToGroupMap[normP];
          }
        }
      }

      // 4. Match by name in notes (e.g. Cliente: Fabian Camacho or Cliente: Ana Zambrano)
      if (!matchedGroup && o.notes) {
        const nameMatch = o.notes.match(/\[Cliente:\s*([^\]]+)\]/i) || o.notes.match(/Cliente:\s*([^|\n]+)/i);
        if (nameMatch && nameMatch[1]) {
          const normN = nameMatch[1].trim().toLowerCase();
          if (normN && nameToGroupMap[normN]) {
            matchedGroup = nameToGroupMap[normN];
          }
        }
      }

      if (matchedGroup) {
        matchedGroup.orderCount += 1;
        matchedGroup.totalSpent += amount;
        if (o.restaurant_id) matchedGroup.restaurants.add(o.restaurant_id);
      }
    });

    // Convert sets to numbers and arrays for client rendering
    const formatted = Object.values(grouped).map(g => ({
      name: g.name,
      email: g.email,
      phone: g.phone,
      orderCount: g.orderCount,
      totalSpent: g.totalSpent,
      restaurantsCount: g.restaurants.size,
      ids: Array.from(g.ids)
    }));

    // Sort by totalSpent descending
    formatted.sort((a, b) => b.totalSpent - a.totalSpent);

    return NextResponse.json({ success: true, data: formatted });
  } catch (err: any) {
    console.error('[Admin Customers GET Catch]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
