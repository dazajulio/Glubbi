'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tag, Truck, Info, Store } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils';

interface OfferProduct {
  id: string;
  name: string;
  base_price: number;
  discount_percentage: number;
  image_url: string;
  restaurants: {
    id: string;
    name: string;
    slug: string;
    logo_url: string;
  };
}

interface FreeDeliveryRest {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  cover_url: string;
}

export default function GlubbiOfertas() {
  const [products, setProducts] = useState<OfferProduct[]>([]);
  const [restaurants, setRestaurants] = useState<FreeDeliveryRest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOffers() {
      const supabase = createClient();
      
      try {
        // Fetch products with discounts
        const { data: productsData } = await supabase
          .from('products')
          .select(`
            id, name, base_price, discount_percentage, image_url,
            restaurants!products_restaurant_id_fkey(id, name, slug, logo_url, is_active)
          `)
          .gt('discount_percentage', 0)
          .eq('is_available', true);

        // Filter out inactive restaurants (supabase inner join is tricky in free tier, so filter in memory)
        const validProducts = (productsData || []).filter((p: any) => p.restaurants?.is_active) as any[];
        
        // Fetch restaurants with free delivery
        const { data: restsData } = await supabase
          .from('restaurants')
          .select('id, name, slug, logo_url, cover_url')
          .eq('has_free_delivery', true)
          .eq('is_active', true);

        setProducts(validProducts);
        setRestaurants(restsData || []);
      } catch (error) {
        console.error('Error fetching offers:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOffers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans px-4 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ofertas Top 🔥</h1>
        <p className="text-sm text-slate-500 mt-1">Aprovecha estos descuentos increíbles hoy mismo.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Products with Discounts */}
          {products.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Tag className="w-5 h-5 text-orange-500" />
                Descuentos Especiales
              </h2>
              
              <div className="grid grid-cols-1 gap-4">
                {products.map(product => {
                  const discountedPrice = product.base_price - (product.base_price * (product.discount_percentage / 100));
                  
                  return (
                    <Link href={`/glubbi/restaurante/${product.restaurants.slug}`} key={product.id}>
                      <div className="bg-white rounded-2xl p-4 flex gap-4 shadow-sm border border-gray-100 items-center hover:shadow-md transition-shadow active:scale-[0.98]">
                        <div className="w-20 h-20 rounded-xl bg-slate-100 flex-shrink-0 relative overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400"><Store className="w-6 h-6" /></div>
                          )}
                          <div className="absolute top-0 left-0 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-br-lg shadow-sm">
                            -{product.discount_percentage}%
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            {product.restaurants.logo_url && (
                              <img src={product.restaurants.logo_url} className="w-4 h-4 rounded-full" alt="" />
                            )}
                            <p className="text-xs font-bold text-slate-500 truncate">{product.restaurants.name}</p>
                          </div>
                          
                          <h4 className="font-bold text-slate-800 text-sm mb-1 truncate">{product.name}</h4>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 line-through">{formatPrice(product.base_price, 'USD')}</span>
                            <span className="text-sm font-black text-rose-600">{formatPrice(discountedPrice, 'USD')}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Restaurants with Free Delivery */}
          {restaurants.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-500" />
                Delivery Gratis
              </h2>
              
              <div className="grid grid-cols-1 gap-4">
                {restaurants.map(rest => (
                  <Link href={`/glubbi/restaurante/${rest.slug}`} key={rest.id}>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow active:scale-[0.98]">
                      <div className="h-28 w-full bg-slate-100 relative">
                        {rest.cover_url ? (
                          <img src={rest.cover_url} className="w-full h-full object-cover" alt={rest.name} />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-orange-400 to-rose-400"></div>
                        )}
                        <div className="absolute inset-0 bg-black/20"></div>
                        <div className="absolute bottom-3 right-3 bg-emerald-500 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5" /> Delivery Gratis
                        </div>
                      </div>
                      <div className="p-4 flex items-center gap-3 relative">
                        <div className="w-12 h-12 rounded-full border-2 border-white bg-white shadow-sm overflow-hidden shrink-0 -mt-8 relative z-10">
                          {rest.logo_url ? (
                            <img src={rest.logo_url} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <Store className="w-6 h-6 m-auto mt-2 text-gray-400" />
                          )}
                        </div>
                        <div className="-mt-3">
                          <h4 className="font-black text-slate-800">{rest.name}</h4>
                          <p className="text-xs text-slate-500">Haz tu pedido ahora</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {products.length === 0 && restaurants.length === 0 && (
            <div className="py-20 text-center px-6">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">Sin ofertas por ahora</h3>
              <p className="text-gray-500 text-sm">Vuelve más tarde para descubrir los mejores descuentos de los restaurantes locales.</p>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          Los descuentos se aplican automáticamente en la pantalla de menú del restaurante.
        </p>
      </div>
    </div>
  );
}
