'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useGlubbiStore } from '@/modules/glubbi/stores/glubbi-store';
import { ChevronLeft, Receipt, ExternalLink, MapPin, Store, ChevronDown, ChevronUp, ShoppingBag, CreditCard } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { BottomNav } from '@/modules/glubbi/components/BottomNav';

export default function HistorialPedidos() {
  const { customer } = useGlubbiStore();
  const router = useRouter();
  const supabase = createClient();

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!customer) {
      router.replace('/glubbi/login');
      return;
    }

    async function loadOrders() {
      setIsLoading(true);
      
      // Build query to fetch orders by customer_id or phone/email fallback
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          status,
          payment_status,
          payment_method,
          notes,
          created_at,
          restaurant_id,
          restaurants (
            name,
            logo_url,
            slug
          ),
          order_items (
            id,
            product_name,
            quantity,
            unit_price,
            subtotal,
            modifiers_snapshot
          )
        `);

      if (customer.id) {
        query = query.eq('customer_id', customer.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(30);

      if (data && data.length > 0) {
        setOrders(data);
      } else {
        // Fallback: If no orders match customer_id directly, query by phone if available
        if (customer.phone) {
          const { data: phoneOrders } = await supabase
            .from('orders')
            .select(`
              id,
              order_number,
              total_amount,
              status,
              payment_status,
              payment_method,
              notes,
              created_at,
              restaurant_id,
              restaurants (
                name,
                logo_url,
                slug
              ),
              order_items (
                id,
                product_name,
                quantity,
                unit_price,
                subtotal,
                modifiers_snapshot
              )
            `)
            .ilike('notes', `%${customer.phone}%`)
            .order('created_at', { ascending: false })
            .limit(30);

          if (phoneOrders) {
            setOrders(phoneOrders);
          }
        }
      }
      setIsLoading(false);
    }

    loadOrders();
  }, [customer, router]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-800 rounded-lg border border-amber-200">Pendiente</span>;
      case 'preparing': return <span className="text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-800 rounded-lg border border-blue-200">En Preparación</span>;
      case 'ready': return <span className="text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200">Listo</span>;
      case 'delivered': return <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-700 rounded-lg border border-gray-200">Entregado</span>;
      case 'cancelled': return <span className="text-[10px] font-bold px-2 py-1 bg-red-100 text-red-700 rounded-lg border border-red-200">Cancelado</span>;
      default: return null;
    }
  };

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <div className="bg-white px-4 pt-6 pb-4 sticky top-0 z-50 shadow-xs border-b border-gray-100">
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
            <p className="text-slate-400 font-medium text-sm">Cargando tus compras...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Receipt className="w-12 h-12 text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Aún no tienes pedidos</h2>
            <p className="text-slate-500 mb-8 text-sm">Explora los restaurantes y realiza tu primera compra.</p>
            <Link href="/glubbi" className="bg-orange-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all">
              Explorar Restaurantes
            </Link>
          </div>
        ) : (
          orders.map((order) => {
            const rest = Array.isArray(order.restaurants) ? order.restaurants[0] : order.restaurants;
            const items = order.order_items || [];
            const isExpanded = expandedOrderId === order.id;
            
            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden transition-all">
                <div 
                  onClick={() => toggleExpand(order.id)}
                  className="p-4 flex flex-col gap-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
                        {rest?.logo_url ? (
                          <img src={rest.logo_url} alt={rest?.name} className="w-full h-full object-cover" />
                        ) : (
                          <Store className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{rest?.name || 'Restaurante'}</h3>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-orange-500" /> Orden #{order.order_number}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="font-black text-slate-900 text-base">{formatPrice(order.total_amount)}</span>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-200 pt-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">
                      {new Date(order.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    
                    <button type="button" className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      {isExpanded ? (
                        <>Ocultar detalle <ChevronUp className="w-4 h-4 text-orange-500" /></>
                      ) : (
                        <>Ver productos ({items.length}) <ChevronDown className="w-4 h-4 text-orange-500" /></>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Products Breakdown & Actions */}
                {isExpanded && (
                  <div className="bg-slate-50/80 p-4 border-t border-gray-100 space-y-3 animate-fade-in text-xs">
                    <div className="space-y-2">
                      <p className="font-bold text-slate-700 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-orange-500" /> Desglose de Productos
                      </p>

                      <div className="bg-white rounded-xl p-3 border border-gray-200/80 space-y-2.5">
                        {items.length === 0 ? (
                          <p className="text-slate-400 italic">No hay detalle de productos guardado.</p>
                        ) : (
                          items.map((item: any, idx: number) => (
                            <div key={item.id || idx} className="flex justify-between items-start border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                              <div>
                                <p className="font-bold text-slate-900">
                                  {item.quantity}x {item.product_name || 'Producto'}
                                </p>
                                {item.modifiers_snapshot && Array.isArray(item.modifiers_snapshot) && item.modifiers_snapshot.length > 0 && (
                                  <div className="text-[11px] text-slate-500 mt-0.5 space-y-0.5">
                                    {item.modifiers_snapshot.map((g: any, gi: number) => (
                                      <div key={gi} className="italic">
                                        • {g.group}: {Array.isArray(g.items) ? g.items.map((it: any) => it.name).join(', ') : ''}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <span className="font-bold text-slate-900">
                                {formatPrice(item.subtotal || (item.unit_price * item.quantity))}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Reorder Button */}
                    {rest?.slug && (
                      <div className="pt-2 flex justify-end">
                        <Link 
                          href={`/${rest.slug}/mesa/delivery?glubbi=true`}
                          className="w-full sm:w-auto text-center font-bold text-white bg-orange-500 hover:bg-orange-600 px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                        >
                          Volver a Pedir en {rest.name} <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}
