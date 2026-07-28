'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Restaurant } from '@/types/database';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/modules/glubbi/components/BottomNav';
import HorizontalRestaurantScroll from '@/modules/glubbi/components/HorizontalRestaurantScroll';
import { useGlubbiStore } from '@/modules/glubbi/stores/glubbi-store';
import { isRestaurantOpen } from '@/lib/utils';
import { 
  Search, 
  MapPin, 
  ChevronRight, 
  Bell, 
  Star,
  Clock,
  Heart,
  TrendingUp,
  Sparkles,
  Bike,
  Award
} from 'lucide-react';

export default function GlubbiMarketplace() {
  const router = useRouter();
  const { customer, location, setLocation } = useGlubbiStore();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [locationName, setLocationName] = useState(location ? 'Ubicación Obtenida' : 'Mi Ubicación Actual');

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setLocationName('Ubicando...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationName('Ubicación Obtenida');
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationName('Permiso Denegado');
          setTimeout(() => setLocationName(location ? 'Ubicación Obtenida' : 'Mi Ubicación Actual'), 3000);
        }
      );
    } else {
      alert('Tu navegador no soporta geolocalización.');
    }
  };

  const categories = [
    { name: 'Restaurantes', emoji: '🍔', bg: 'bg-red-50' },
    { name: 'Turbo', emoji: '⚡', bg: 'bg-green-50' },
    { name: 'Mercado', emoji: '🛒', bg: 'bg-orange-50' },
    { name: 'Farmacia', emoji: '💊', bg: 'bg-blue-50' },
    { name: 'Sushi', emoji: '🍣', bg: 'bg-rose-50' },
    { name: 'Postres', emoji: '🍩', bg: 'bg-purple-50' }
  ];

  useEffect(() => {
    if (!customer) {
      router.replace('/glubbi/login');
      return;
    }
    async function loadRestaurants() {
      const supabase = createClient();
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .eq('is_glubbi_active', true)
        .order('name');
        
      if (data) {
        // Evaluar si están abiertos
        const enriched = data.map(r => ({
          ...r,
          isOpen: isRestaurantOpen((r as any).schedule, r.timezone)
        }));
        setRestaurants(enriched as Restaurant[]);
      }
      setIsLoading(false);
    }
    loadRestaurants();
  }, [customer, router]);

  const filteredRestaurants = restaurants
    .filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'Todos' || r.glubbi_category === activeCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a: any, b: any) => {
      // Priorizar los que están abiertos
      if (a.isOpen && !b.isOpen) return -1;
      if (!a.isOpen && b.isOpen) return 1;
      // Priorizar los que tienen imagen de portada
      if (a.cover_image_url && !b.cover_image_url) return -1;
      if (!a.cover_image_url && b.cover_image_url) return 1;
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* App Header */}
      <div className="bg-white px-4 pt-6 pb-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={handleGetLocation}
            className="flex flex-col items-start text-left bg-transparent border-none p-0 outline-none active:scale-95 transition-transform"
          >
            <div className="flex items-center text-sm font-bold text-slate-800">
              <MapPin className="w-4 h-4 mr-1 text-orange-500" />
              <span>{locationName}</span>
              <ChevronRight className="w-4 h-4 ml-0.5 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 ml-5">Toca para actualizar</p>
          </button>
          <div className="w-12 h-12 mr-2 rounded-full flex items-center justify-center relative bg-white shadow-sm border border-gray-100 overflow-hidden shrink-0">
            <img src="/logo-glubbi.png" alt="Glubbi" className="w-full h-full object-cover scale-110" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border-none rounded-2xl leading-5 bg-slate-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-colors sm:text-sm shadow-inner"
            placeholder="¿Qué se te antoja hoy?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Grid (Rappi Style) - Hidden for now to give impact to feed */}
      {/* 
      <div className="px-4 py-6">
        ...
      </div> 
      */}

      {/* Promotional Banner -> Category Quick Links */}
      <div className="px-4 mb-6">
        <div className="w-full bg-gradient-to-r from-orange-500 to-rose-500 rounded-2xl p-5 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <h2 className="font-black text-lg mb-4 relative z-10 text-center">¿Qué vas a pedir hoy?</h2>
          
          <div className="grid grid-cols-3 gap-3 relative z-10">
            {/* Restaurantes */}
            <button 
              onClick={() => {
                setActiveCategory('Todos');
                document.getElementById('feed-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white rounded-xl p-3 flex flex-col items-center justify-center gap-2 shadow-sm hover:scale-105 active:scale-95 transition-transform border-b-4 border-gray-100"
            >
              <div className="text-3xl drop-shadow-sm">🌟</div>
              <span className="text-slate-800 font-bold text-[10px] uppercase tracking-wider">Todos</span>
            </button>

            {/* Pizza */}
            <button 
              onClick={() => {
                setActiveCategory('Pizza');
                document.getElementById('feed-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white rounded-xl p-3 flex flex-col items-center justify-center gap-2 shadow-sm hover:scale-105 active:scale-95 transition-transform border-b-4 border-gray-100"
            >
              <div className="text-3xl drop-shadow-sm">🍕</div>
              <span className="text-slate-800 font-bold text-[10px] uppercase tracking-wider">Pizza</span>
            </button>

            {/* Hamburguesas */}
            <button 
              onClick={() => {
                setActiveCategory('Hamburguesas');
                document.getElementById('feed-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white rounded-xl p-3 flex flex-col items-center justify-center gap-2 shadow-sm hover:scale-105 active:scale-95 transition-transform border-b-4 border-gray-100"
            >
              <div className="text-3xl drop-shadow-sm">🍔</div>
              <span className="text-slate-800 font-bold text-[10px] uppercase tracking-wider">Burgers</span>
            </button>
          </div>
        </div>
      </div>
      
      <div id="feed-section" className="pt-2">

      {/* Envío Gratis */}
      <HorizontalRestaurantScroll 
        title="Envío Gratis" 
        subtitle="Ahorra en tu domicilio"
        icon={<Bike className="w-5 h-5 text-emerald-500" />}
        restaurants={filteredRestaurants.slice(0, 4)}
        tagText="ENVÍO $0"
        tagColor="bg-emerald-500 text-white"
      />

      {/* Mejores Ofertas */}
      <HorizontalRestaurantScroll 
        title="Mejores Ofertas" 
        subtitle="Descuentos que no puedes dejar pasar"
        icon={<Sparkles className="w-5 h-5 text-purple-500" />}
        restaurants={filteredRestaurants.slice().reverse().slice(0, 4)}
        tagText="TENDENCIA"
        tagColor="bg-blue-500 text-white"
      />
      </div>

      {/* Los más amados */}
      <HorizontalRestaurantScroll 
        title="Los más amados" 
        subtitle="Favoritos de la comunidad"
        icon={<Heart className="w-5 h-5 text-rose-500 fill-rose-500" />}
        restaurants={filteredRestaurants.filter(r => (r.rating || 0) >= 4.8).slice(0, 4)}
        tagText="TOP RATED"
        tagColor="bg-rose-500 text-white"
      />

      {/* Populares */}
      <HorizontalRestaurantScroll 
        title="Populares cerca de ti" 
        icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
        restaurants={filteredRestaurants.slice(1, 5)}
      />

      {/* Restaurants List (Vertical Feed) */}
      <div className="px-4 mt-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-orange-500" />
          {activeCategory === 'Todos' ? 'Todos los Restaurantes' : `Restaurantes de ${activeCategory}`}
        </h2>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-full h-64 bg-slate-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-4xl mb-4">🛵</div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">No hay resultados</h3>
            <p className="text-gray-500 text-sm">No encontramos restaurantes que coincidan con tu búsqueda en este momento.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredRestaurants.map(restaurant => (
              <Link 
                href={`/${restaurant.slug}/mesa/delivery?glubbi=true`}
                key={restaurant.id}
              >
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform">
                  <div className="relative h-48 w-full bg-slate-100">
                    {restaurant.cover_image_url ? (
                      <img src={restaurant.cover_image_url} alt={restaurant.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center">
                        <span className="text-slate-400 font-medium text-lg">{restaurant.name}</span>
                      </div>
                    )}
                    
                    {/* Top Left Badges (Rappi Style) */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      <div className="bg-green-600/95 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1 w-fit">
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">⚡ Turbo</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 pt-3 relative">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-lg text-slate-900 truncate pr-4">{restaurant.name}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="w-3.5 h-3.5 text-slate-800 fill-slate-800" />
                        <span className="text-sm font-bold text-slate-800">{restaurant.rating || '4.9'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-500 font-medium gap-3">
                      <div className="flex items-center gap-1 text-green-700">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{restaurant.estimated_time || '15 min'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">•</span>
                        <span>🏍️ Envío $3.500</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
