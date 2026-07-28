import { createServerSupabaseClient } from '@/lib/supabase/server';
import DeliveryZonesMap from '@/modules/gerente/components/DeliveryZonesMap';
import { redirect } from 'next/navigation';

export default async function DeliveryPage({ params }: { params: { slug: string } }) {
  const supabase = await createServerSupabaseClient();
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', params.slug)
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
