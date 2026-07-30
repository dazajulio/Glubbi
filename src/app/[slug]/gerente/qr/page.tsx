'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { QRGenerator } from '@/modules/qr/components/QRGenerator';
import { QrCode } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function QRAdminPage() {
  const pathname = usePathname();
  const slugFromUrl = pathname?.split('/')?.[1] || '';
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [slug, setSlug] = useState('');
  const [brandColor, setBrandColor] = useState('#FF6B00');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slugFromUrl) return;
    async function loadData() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('restaurants')
          .select('id, slug, brand_color_primary')
          .eq('slug', slugFromUrl)
          .single();
          
        if (data) {
          setRestaurantId(data.id);
          localStorage.setItem('active_restaurant_id', data.id);
          setSlug(data.slug);
          setBrandColor(data.brand_color_primary || '#FF6B00');
        }
      } catch (err) {
        console.error('Error fetching restaurant details for QR:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [slugFromUrl]);

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <QrCode className="w-8 h-8 text-orange-500" />
          <h1 className="text-3xl font-bold text-gray-900">Códigos QR de Mesas</h1>
        </div>
        <p className="text-gray-500 text-lg">Genera e imprime los códigos QR para pedidos desde mesa.</p>
      </div>

      {restaurantId ? (
        <QRGenerator 
          restaurantId={restaurantId} 
          restaurantSlug={slug} 
          brandColor={brandColor} 
        />
      ) : (
        <p className="text-gray-400 text-sm">Registra un restaurante para generar códigos QR.</p>
      )}
    </div>
  );
}
