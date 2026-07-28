import { createServerSupabaseClient } from '@/lib/supabase/server';
import dynamic from 'next/dynamic';
const DeliveryZonesMap = dynamic(() => import('@/modules/gerente/components/DeliveryZonesMap'), { ssr: false });
import { redirect } from 'next/navigation';

export default async function DeliveryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!restaurant) {
    redirect('/');
  }

  return (
    <div className="p-6">
      <DeliveryZonesMap restaurantId={restaurant.id} />
    </div>
  );
}
