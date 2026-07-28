'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useGlubbiStore } from '@/modules/glubbi/stores/glubbi-store';
import { ChevronLeft, Receipt, ExternalLink, MapPin, Search } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import BottomNav from '@/modules/glubbi/components/BottomNav';

export default function HistorialPedidos() {
  const { customer } = useGlubbiStore();
  const router = useRouter();
  const supabase = createClient();

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!customer) {
      router.replace('/glubbi/login');
      return;
    }

    async function loadOrders() {
      setIsLoading(true);
      // Fetch orders where customer_id matches the Glubbi user ID
      // We also join with restaurants to get the name and logo
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          status,
          created_at,
          restaurant_id,
          restaurants (
            name,
            logo_url,
            slug
          )
        `)
        .eq('customer_id', customer?.id)
        .order('created_at', { ascending: false });

      if (data) {
        setOrders(data);
      }
      setIsLoading(false);
    }

    loadOrders();
  }, [customer, router]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-lg">Pendiente</span>;
      case 'preparing': return <span className="text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-lg">En Preparación</span>;
      case 'ready': return <span className="text-[10px] font-bold px-2 py-1 bg-green-100 text-green-700 rounded-lg">Listo</span>;
      case 'delivered': return <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-700 rounded-lg">Entregado</span>;
      case 'cancelled': return <span className="text-[10px] font-bold px-2 py-1 bg-red-100 text-red-700 rounded-lg">Cancelado</span>;
      default: return null;
    }
  };

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <div className="bg-white px-4 pt-6 pb-4 sticky top-0 z-50 shadow-sm border-b border-gray-100">
        <div className="flex items-center gap-4">
          <Link href="/glubbi/cuenta" className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center border border-gray-100 hover:bg-slate-100 transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </Link>
          <h1 className="text-lg font-black text-slate-800">Historial de Pedidos</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mb-4"></div>
            <p className="text-slate-400 font-medium">Buscando tus pedidos...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Receipt className="w-12 h-12 text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Aún no tienes pedidos</h2>
            <p className="text-slate-500 mb-8">Explora los restaurantes y realiza tu primera compra.</p>
            <Link href="/glubbi" className="bg-orange-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all">
              Explorar Glubbi
            </Link>
          </div>
        ) : (
          orders.map((order) => {
            const rest = Array.isArray(order.restaurants) ? order.restaurants[0] : order.restaurants;
            
            return (
              <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 active:scale-[0.98] transition-transform">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
                      {rest?.logo_url ? (
                        <img src={rest.logo_url} alt={rest?.name} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{rest?.name || 'Restaurante'}</h3>
                      <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Orden #{order.order_number}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="font-black text-slate-800">{formatPrice(order.total_amount)}</span>
                    {getStatusBadge(order.status)}
                  </div>
                </div>
                
                <div className="border-t border-dashed border-gray-200 pt-3 flex items-center justify-between mt-1">
                  <span className="text-xs font-medium text-slate-400">
                    {new Date(order.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                  {rest?.slug && (
                    <Link 
                      href={`/${rest.slug}/mesa/delivery?glubbi=true`}
                      className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-orange-100 transition-colors"
                    >
                      Volver a pedir <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}
