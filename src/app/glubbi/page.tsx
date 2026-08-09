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
  const { customer, location, locationName: storedLocationName, setLocation } = useGlubbiStore();
  
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [locationName, setLocationName] = useState(storedLocationName || (location ? 'Ubicación Obtenida' : 'Mi Ubicación Actual'));

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setLocationName('Ubicando...');
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
            if (!mapboxToken) throw new Error('No Mapbox token');
            
            const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${position.coords.longitude},${position.coords.latitude}.json?access_token=${mapboxToken}&types=address,poi,neighborhood,locality,place&limit=1`);
            const data = await res.json();
            
            if (data.features && data.features.length > 0) {
              // Format place_name from "La Hechicera, Mérida, Venezuela" to "La Hechicera, Mérida"
              let nameToSet = data.features[0].place_name;
              if (nameToSet) {
                 const parts = nameToSet.split(',');
                 if(parts.length > 2) {
                    nameToSet = parts.slice(0, 2).join(',').trim();
                 }
              }
              const finalName = nameToSet || 'Ubicación Obtenida';
              setLocationName(finalName);
              setLocation({ lat: position.coords.latitude, lng: position.coords.longitude }, finalName);
            } else {
              setLocationName('Ubicación Obtenida');
              setLocation({ lat: position.coords.latitude, lng: position.coords.longitude }, 'Ubicación Obtenida');
            }
          } catch (error) {
            console.error('Error fetching location name:', error);
            setLocationName('Ubicación Obtenida');
            setLocation({ lat: position.coords.latitude, lng: position.coords.longitude }, 'Ubicación Obtenida');
          }
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
  }, []);

  const filteredRestaurants = restaurants
    .filter(r => {
      const search = searchQuery.toLowerCase();
      const matchesSearch = r.name.toLowerCase().includes(search) || (r.glubbi_category?.toLowerCase() || '').includes(search);
      const matchesCategory = activeCategory === 'Todos' || r.glubbi_category === activeCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a: any, b: any) => {
      // Priorizar patrocinados VIP activos (featured_tier > 0 y featured_until vigente)
      const now = new Date();
      const aFeatured = (a.featured_tier || 0) > 0 && a.featured_until && new Date(a.featured_until) > now;
      const bFeatured = (b.featured_tier || 0) > 0 && b.featured_until && new Date(b.featured_until) > now;

      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;
      if (aFeatured && bFeatured) {
        if (a.featured_tier !== b.featured_tier) {
          return (b.featured_tier || 0) - (a.featured_tier || 0);
        }
      }

      // Priorizar los que están abiertos
      if (a.isOpen && !b.isOpen) return -1;
      if (!a.isOpen && b.isOpen) return 1;

      // Priorizar los que tienen Envío Gratis activado
      if (a.has_free_delivery && !b.has_free_delivery) return -1;
      if (!a.has_free_delivery && b.has_free_delivery) return 1;

      // Priorizar los que tienen imagen de portada
      if (a.cover_image_url && !b.cover_image_url) return -1;
      if (!a.cover_image_url && b.cover_image_url) return 1;
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Sticky Header - High Impact Compact Mobile Design */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="px-4 pt-3 pb-2.5 flex flex-col gap-2">
          
          {/* Row 1: Glubbi Logo directly on canvas (Left) + Active Location Pill (Right) */}
          <div className="flex items-center justify-between gap-2">
            {/* Glubbi Logo - Enlarge ~4x without increasing header row height */}
            <div className="relative h-9 flex items-center shrink-0 overflow-visible">
              <img 
                src="/logo-glubbi.png" 
                alt="Glubbi" 
                className="h-16 sm:h-20 w-auto object-contain object-left drop-shadow-sm origin-left transition-transform" 
              />
            </div>

            {/* Active Location Pill Button */}
            <button 
              onClick={handleGetLocation}
              className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200/80 active:scale-95 px-3 py-1.5 rounded-full transition-all border border-gray-200/80 max-w-[220px]"
              title="Actualizar ubicación"
            >
              <MapPin className="w-4 h-4 shrink-0 text-[#5D6B22]" />
              <div className="flex flex-col items-start min-w-0 text-left">
                <span className="text-[13px] font-semibold text-[#333333] truncate w-full leading-tight">
                  {locationName}
                </span>
                <span className="text-[10px] font-medium text-orange-600 leading-none">
                  Toca para actualizar
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-gray-500" />
            </button>
          </div>

          {/* Row 2: Search Bar ("¿Qué se te antoja hoy?") */}
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4.5 w-4.5 text-orange-500" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-8 py-2.5 rounded-full text-xs sm:text-sm bg-gray-100 hover:bg-gray-100/80 placeholder-gray-400 text-gray-800 border border-transparent focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all shadow-inner"
              placeholder="¿Qué se te antoja hoy?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Grid Categorías Estilo Rappi con Colores Más Intensos */}
      <div className="px-4 mt-3 mb-1">
        {/* Fila Principal: 2 columnas grandes */}
        <div className="grid grid-cols-2 gap-3 mb-2.5">
          {/* Restaurantes */}
          <button 
            onClick={() => {
              setActiveCategory('Todos');
              document.getElementById('feed-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-[#ffe8dc] rounded-[24px] pt-5 pb-3.5 px-4 flex flex-col items-center justify-center relative active:scale-95 transition-transform border border-[#ffd1ba] shadow-sm"
          >
            <div className="w-full flex justify-center mb-1">
              <span className="text-[68px] drop-shadow-xl leading-none">🍔</span>
            </div>
            <span className="text-[#9c3e23] font-bold text-[15px] mt-1 tracking-tight">Restaurantes</span>
          </button>

          {/* Tiendas */}
          <button 
            onClick={() => {
              setActiveCategory('Tiendas');
              document.getElementById('feed-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-[#def2e1] rounded-[24px] pt-5 pb-3.5 px-4 flex flex-col items-center justify-center relative active:scale-95 transition-transform border border-[#bce4c3] shadow-sm"
          >
            <div className="w-full flex justify-center mb-1 relative">
              <span className="text-[68px] drop-shadow-xl leading-none">🛍️</span>
            </div>
            <span className="text-[#296838] font-bold text-[15px] mt-1 tracking-tight">Tiendas</span>
          </button>
        </div>

        {/* Fila Secundaria: scroll horizontal centrado */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2.5 pb-0 -mx-4 px-4 justify-center">
          <button 
            onClick={() => {
              setActiveCategory('Mercado');
              document.getElementById('feed-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-[#e6edf7] border border-[#cad7eb] rounded-[20px] py-3 px-3.5 min-w-[95px] flex flex-col items-center justify-center active:scale-95 transition-transform shrink-0 shadow-sm"
          >
            <span className="text-[38px] drop-shadow-md mb-1 leading-none">🛒</span>
            <span className="text-[#2b4263] font-bold text-[12px] tracking-tight">Mercado</span>
          </button>

          <button 
            onClick={() => {
              setActiveCategory('Farmacia');
              document.getElementById('feed-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-[#e2edff] border border-[#b8d2fe] rounded-[20px] py-3 px-3.5 min-w-[95px] flex flex-col items-center justify-center active:scale-95 transition-transform shrink-0 shadow-sm"
          >
            <span className="text-[38px] drop-shadow-md mb-1 leading-none">💊</span>
            <span className="text-[#1a478a] font-bold text-[12px] tracking-tight">Farmacia</span>
          </button>

          <button 
            onClick={() => {
              setActiveCategory('Postres');
              document.getElementById('feed-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-[#ffdbe8] border border-[#fcaecb] rounded-[20px] py-3 px-3.5 min-w-[95px] flex flex-col items-center justify-center active:scale-95 transition-transform shrink-0 shadow-sm"
          >
            <span className="text-[38px] drop-shadow-md mb-1 leading-none">🍩</span>
            <span className="text-[#872347] font-bold text-[12px] tracking-tight">Postres</span>
          </button>
        </div>
      </div>
      
      <div id="feed-section" className="pt-0 mt-1">

      {/* Envío Gratis */}
      <HorizontalRestaurantScroll 
        title="Envío Gratis" 
        subtitle="Ahorra en tu domicilio"
        icon={<Bike className="w-5 h-5 text-emerald-500" />}
        restaurants={filteredRestaurants.filter((r: any) => Boolean(r.has_free_delivery)).slice(0, 4)}
        tagText="ENVÍO $0"
        tagColor="bg-emerald-500 text-white"
      />

      {/* Mejores Ofertas */}
      <HorizontalRestaurantScroll 
        title="Mejores Ofertas" 
        subtitle="Descuentos que no puedes dejar pasar"
        icon={<Sparkles className="w-5 h-5 text-purple-500" />}
        restaurants={filteredRestaurants.filter((r: any) => r.discount_percentage > 0).slice(0, 4)}
        tagText="TENDENCIA"
        tagColor="bg-blue-500 text-white"
      />
      </div>

      {/* Los más pedidos */}
      <HorizontalRestaurantScroll 
        title="Los más pedidos" 
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
      <div className="px-4 mt-10">
        <h2 className="text-xl font-black text-slate-800 mb-6 tracking-tight flex items-center gap-2">
          {activeCategory === 'Todos' ? 'Todos los establecimientos' : activeCategory}
          {searchQuery && <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Buscando: {searchQuery}</span>}
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
            {filteredRestaurants.map(restaurant => {
              const isFeatured = (restaurant.featured_tier || 0) > 0 && restaurant.featured_until && new Date(restaurant.featured_until) > new Date();

              return (
                <Link 
                  href={`/${restaurant.slug}/mesa/delivery?glubbi=true`}
                  key={restaurant.id}
                >
                  <div className={`bg-white rounded-3xl shadow-sm border overflow-hidden cursor-pointer active:scale-[0.98] transition-transform ${
                    isFeatured ? 'border-2 border-amber-400 shadow-md shadow-amber-500/10' : 'border-gray-100'
                  }`}>
                    <div className="relative h-48 w-full bg-slate-100">
                      {restaurant.cover_image_url ? (
                        <img src={restaurant.cover_image_url} alt={restaurant.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center">
                          <span className="text-slate-400 font-medium text-lg">{restaurant.name}</span>
                        </div>
                      )}
                      
                      {/* Top Left Badges (Glubbi Tags) */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {isFeatured && (
                          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 w-fit">
                            <Sparkles className="w-3 h-3 text-white" />
                            <span className="text-[10px] font-black uppercase tracking-wider">
                              DESTACADO
                            </span>
                          </div>
                        )}
                        {restaurant.glubbi_category && (
                          <div className="bg-blue-600/95 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1 w-fit">
                            <span className="text-[10px] font-black text-white uppercase tracking-wider">{restaurant.glubbi_category}</span>
                          </div>
                        )}
                        {restaurant.has_free_delivery && (
                          <div className="bg-emerald-600/95 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1 w-fit">
                            <span className="text-[10px] font-black text-white uppercase tracking-wider">Envío $0</span>
                          </div>
                        )}
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
                        <span>
                          🏍️ {restaurant.has_free_delivery ? 'Envío Gratis' : (restaurant.delivery_fee && restaurant.delivery_fee > 0 ? `Envío $${(restaurant.delivery_fee).toLocaleString('es-CO')}` : 'Envío disponible')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}
