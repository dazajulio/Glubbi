'use client';

import React from 'react';
import { Heart, Search } from 'lucide-react';
import Link from 'next/link';

import { useGlubbiStore } from '@/modules/glubbi/stores/glubbi-store';
import { createClient } from '@/lib/supabase/client';
import HorizontalRestaurantScroll from '@/modules/glubbi/components/HorizontalRestaurantScroll';

export default function GlubbiFavoritos() {
  const { favoriteRestaurants } = useGlubbiStore();
  const [restaurants, setRestaurants] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadFavorites() {
      if (!favoriteRestaurants || favoriteRestaurants.length === 0) {
        setIsLoading(false);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .in('id', favoriteRestaurants)
        .eq('is_active', true)
        .eq('is_glubbi_active', true);
        
      setRestaurants(data || []);
      setIsLoading(false);
    }
    loadFavorites();
  }, [favoriteRestaurants]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans pt-6">
      <div className="px-4 mb-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Tus Favoritos</h1>
        <p className="text-sm text-slate-500 mt-1">Los restaurantes que más amas, a un toque de distancia.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white mx-4 rounded-3xl border border-gray-100 shadow-sm px-6">
          <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-6">
            <Heart className="w-10 h-10 text-rose-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Aún no tienes favoritos</h2>
          <p className="text-sm text-slate-500 mb-8 max-w-xs">
            Explora los restaurantes de Glubbi y marca el corazón en los que más te gusten para guardarlos aquí.
          </p>
          
          <Link 
            href="/glubbi"
            className="bg-orange-500 text-white font-bold py-3 px-8 rounded-2xl shadow-md active:scale-95 transition-transform flex items-center gap-2"
          >
            <Search className="w-5 h-5" /> Explorar Restaurantes
          </Link>
        </div>
      ) : (
        <HorizontalRestaurantScroll 
          title="Tus Favoritos" 
          restaurants={restaurants}
        />
      )}
    </div>
  );
}
