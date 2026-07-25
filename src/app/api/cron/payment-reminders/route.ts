import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendSubscriptionNotice } from '@/lib/subscription-mail';

// This route should be secured with a secret key if called from Vercel Crons
// e.g. checking req.headers.get('Authorization') === `Bearer ${process.env.CRON_SECRET}`

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // 1. Get all restaurants that use pago_movil
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('id, name, slug, subscription_renews_at, is_active, contact_name, subscription_status')
      .eq('subscription_type', 'pago_movil')
      .not('subscription_renews_at', 'is', null);

    if (error) throw error;

    const results = {
      remindersSent: 0,
      dueTodaySent: 0,
      suspended: 0,
      errors: 0,
    };

    const now = new Date();
    // Normalize today to midnight UTC for easy date comparison if needed, 
    // but a simple difference in days works too.
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const restaurant of restaurants) {
      if (!restaurant.subscription_renews_at) continue;

      const renewsAt = new Date(restaurant.subscription_renews_at);
      const renewsDate = new Date(renewsAt.getFullYear(), renewsAt.getMonth(), renewsAt.getDate());
      
      const diffTime = renewsDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const formattedDate = renewsDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

      // Get owner email to send notice
      const { data: members, error: membersError } = await supabase
        .from('restaurant_members')
        .select('user_id')
        .eq('restaurant_id', restaurant.id)
        .eq('role', 'owner')
        .limit(1);
        
      if (membersError || !members || members.length === 0) continue;
      
      const ownerId = members[0].user_id;
      
      // Need auth.users to get email, since we are admin we can do this via rpc 
      // or we can use the get_super_admin_members() function if we are logged as admin, 
      // but here we are using service role. Supabase service role can query auth.users.
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(ownerId);
      
      if (userError || !userData.user?.email) continue;
      const ownerEmail = userData.user.email;

      try {
        if (diffDays === 2 && restaurant.is_active) {
          // 2 days before due date
          await sendSubscriptionNotice({
            toEmail: ownerEmail,
            restaurantName: restaurant.name,
            slug: restaurant.slug,
            dueDate: formattedDate,
            type: 'reminder_2_days'
          });
          results.remindersSent++;
        } 
        else if (diffDays === 0 && restaurant.is_active) {
          // Due today
          await sendSubscriptionNotice({
            toEmail: ownerEmail,
            restaurantName: restaurant.name,
            slug: restaurant.slug,
            dueDate: formattedDate,
            type: 'due_today'
          });
          results.dueTodaySent++;
        }
        else if (diffDays <= -5 && restaurant.is_active) {
          // 5 days past due -> Suspend
          await supabase
            .from('restaurants')
            .update({ 
              is_active: false,
              subscription_status: 'past_due'
            })
            .eq('id', restaurant.id);
            
          await sendSubscriptionNotice({
            toEmail: ownerEmail,
            restaurantName: restaurant.name,
            slug: restaurant.slug,
            dueDate: formattedDate,
            type: 'suspended'
          });
          results.suspended++;
        }
      } catch (e) {
        console.error(`Error processing restaurant ${restaurant.id}:`, e);
        results.errors++;
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
