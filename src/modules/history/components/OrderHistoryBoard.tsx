'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { OrderWithItems } from '@/types/database';
import { formatPrice, formatElapsedTime } from '@/lib/utils';
import { Search, MapPin, User, Hash, Clock } from 'lucide-react';
import { getCustomerName } from '@/modules/kds/components/OrderCard';

interface OrderHistoryBoardProps {
  restaurantId: string;
}

export function OrderHistoryBoard({ restaurantId }: OrderHistoryBoardProps) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const supabase = createClient();

  useEffect(() => {
    async function loadHistory() {
      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          table:tables (*),
          customer:customers (*)
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (data) setOrders(data as OrderWithItems[]);
      setIsLoading(false);
    }
    loadHistory();
  }, [restaurantId, supabase]);

  const STATUS_LABELS: Record<string, { label: string; classes: string }> = {
    pending:   { label: 'Nuevo (Cocina)', classes: 'bg-yellow-100 text-yellow-800' },
    preparing: { label: 'En cocina',      classes: 'bg-blue-100 text-blue-800' },
    ready:     { label: 'Listo',          classes: 'bg-green-100 text-green-800' },
    delivered: { label: 'Entregado',      classes: 'bg-slate-100 text-slate-600' },
    cancelled: { label: 'Cancelado',      classes: 'bg-red-100 text-red-700' },
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const custName = getCustomerName(o);
    const matchesSearch =
      o.order_number.toString().includes(search) ||
      (custName || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.table?.label || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.notes || '').toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (isLoading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div></div>;
  }

  const getPaymentStatusUI = (order: OrderWithItems) => {
    const isPaid = order.payment_status === 'paid';
    const isPagoMovilValidado = order.notes && order.notes.includes('Validación:');
    
    if (isPagoMovilValidado) {
      return (
        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">
          ✅ Pago Validado (Móvil)
        </span>
      );
    }
    
    if (isPaid) {
      const method = order.payment_method === 'stripe' ? 'Tarjeta' : 
                     (order.payment_method as any) === 'terminal' ? 'Terminal' : 
                     (order.payment_method as any) === 'pago_movil' ? 'Pago Móvil' : 'Efectivo';
      return (
        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">
          ✅ Pagado ({method})
        </span>
      );
    }

    return (
      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
        ⏳ Pendiente (Por Pagar)
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
        <input 
          type="text" 
          placeholder="Buscar por # orden, cliente, mesa o notas..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white shadow-sm border border-gray-200 rounded-2xl py-4 pl-14 pr-6 text-lg text-slate-800 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'preparing', 'ready', 'delivered', 'cancelled'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              statusFilter === s
                ? 'brand-bg text-white border-transparent'
                : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
            }`}
          >
            {s === 'all' ? 'Todos' : (STATUS_LABELS[s]?.label ?? s)}
            {s !== 'all' && (
              <span className="ml-1.5 text-xs opacity-75">
                ({orders.filter(o => o.status === s).length})
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400 self-center">
          {filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Orders List */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No se encontraron pedidos{statusFilter !== 'all' ? ` con estado "${STATUS_LABELS[statusFilter]?.label}"` : ''} en el historial.
          </div>
        ) : (
          <div className="divide-y divide-gray-200/50">
            {filteredOrders.map(order => (
              <div key={order.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-100/20 transition-colors">
                
                {/* Info block */}
                <div className="flex items-start gap-4">
                  <div className="bg-slate-100 rounded-xl p-3 flex flex-col items-center justify-center min-w-[4rem]">
                    <span className="text-xs text-gray-500">#</span>
                    <span className="text-xl font-bold text-slate-800">{order.order_number}</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_LABELS[order.status]?.classes ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[order.status]?.label ?? order.status}
                      </span>
                      <span className="text-gray-400 text-sm flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {new Date(order.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      {order.table && (
                        <span className="flex items-center">
                          <MapPin className="w-3.5 h-3.5 mr-1" />
                          {order.table.label || `Mesa ${order.table.table_number}`}
                        </span>
                      )}
                      {getCustomerName(order) && (
                        <span className="flex items-center font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-xs border border-gray-200">
                          <User className="w-3.5 h-3.5 mr-1 text-orange-500" />
                          {getCustomerName(order)}
                        </span>
                      )}
                    </div>

                    {order.notes && order.notes.includes('[Origen: Delivery]') && (
                      <div className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-lg p-2.5 mt-2 space-y-0.5 max-w-md">
                        {getCustomerName(order) && (
                          <div><strong className="text-blue-600">Cliente:</strong> {getCustomerName(order)}</div>
                        )}
                        <div><strong className="text-blue-600">Dirección:</strong> {order.notes.match(/Dirección:\s*([^|]+)/)?.[1]?.trim() || 'N/A'}</div>
                        <div><strong className="text-blue-600">Teléfono:</strong> {order.notes.match(/Teléfono:\s*([^|]+)/)?.[1]?.trim() || 'N/A'}</div>
                        <div><strong className="text-blue-600">Referencia:</strong> {order.notes.match(/Referencia:\s*([^|]+)/)?.[1]?.trim() || 'N/A'}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Summary & Total */}
                <div className="flex flex-col sm:items-end gap-2 sm:max-w-xs">
                  <span className="text-xl font-bold text-slate-800">{formatPrice(order.total_amount, 'USD')}</span>
                  <p className="text-sm text-gray-500 line-clamp-2 text-left sm:text-right">
                    {order.order_items.map(item => `${item.quantity}x ${item.product_name}`).join(', ')}
                  </p>
                  <div className="mt-1 flex justify-end">
                    {getPaymentStatusUI(order)}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
