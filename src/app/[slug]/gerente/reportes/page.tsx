'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils';
import { FileText, Download, Calendar, TrendingUp, ShoppingBag, Users } from 'lucide-react';

interface OrderItem {
  product_name: string;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  total_amount: number;
  created_at: string;
  customer?: {
    id: string;
    name: string;
    email?: string;
  };
  order_items: OrderItem[];
}

export default function ReportesPage() {
  const pathname = usePathname();
  const slugFromUrl = pathname?.split('/')?.[1] || '';
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'this_week' | 'this_month' | 'last_month' | 'last_3_months'>('this_month');

  const supabase = createClient();

  useEffect(() => {
    if (!slugFromUrl) return;
    supabase
      .from('restaurants')
      .select('id')
      .eq('slug', slugFromUrl)
      .single()
      .then(({ data }) => {
        if (data?.id) setRestaurantId(data.id);
      });
  }, [slugFromUrl, supabase]);

  useEffect(() => {
    if (!restaurantId) return;

    async function fetchReportData() {
      setLoading(true);
      
      const now = new Date();
      let startDate = new Date();
      
      if (dateFilter === 'this_week') {
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); 
        startDate = new Date(startDate.setDate(diff));
        startDate.setHours(0,0,0,0);
      } else if (dateFilter === 'this_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (dateFilter === 'last_month') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        now.setMonth(now.getMonth());
        now.setDate(0); 
        now.setHours(23,59,59,999);
      } else if (dateFilter === 'last_3_months') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      }

      const { data } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          created_at,
          customer:customers (
            id,
            name,
            email
          ),
          order_items (
            product_name,
            quantity,
            subtotal
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('status', 'delivered')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString());

      if (data) {
        setOrders(data as unknown as Order[]);
      }
      setLoading(false);
    }

    fetchReportData();
  }, [restaurantId, dateFilter, supabase]);

  // Derived calculations
  const totalVentas = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalPedidos = orders.length;

  const productStats = orders.reduce((acc, order) => {
    order.order_items.forEach(item => {
      if (!acc[item.product_name]) {
        acc[item.product_name] = { quantity: 0, revenue: 0 };
      }
      acc[item.product_name].quantity += item.quantity;
      acc[item.product_name].revenue += item.subtotal;
    });
    return acc;
  }, {} as Record<string, { quantity: number; revenue: number }>);

  const topProducts = Object.entries(productStats)
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 10);

  const customerStats = orders.reduce((acc, order) => {
    let cid = order.customer?.id || order.customer_id || '';
    let cName = order.customer?.name || '';

    if (!cName && order.notes) {
      const match = order.notes.match(/\[Cliente:\s*([^\]]+)\]/i) || order.notes.match(/Cliente:\s*([^|\n]+)/i);
      if (match && match[1]) {
        cName = match[1].trim();
        cid = `name:${cName.toLowerCase().replace(/\s+/g, '')}`;
      }
    }

    if (!cName && order.table_id) {
      cName = `Mesa (ID: ${order.table_id.substring(0, 4)})`;
      cid = `table:${order.table_id}`;
    }

    if (!cName) {
      cName = 'Cliente General / Presencial';
      cid = 'general';
    }

    if (!acc[cid]) {
      acc[cid] = { name: cName, amount: 0, count: 0 };
    }
    acc[cid].amount += Number(order.total_amount) || 0;
    acc[cid].count += 1;

    return acc;
  }, {} as Record<string, { name: string; amount: number; count: number }>);

  const topCustomers = Object.entries(customerStats)
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 10);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 md:p-12 min-h-screen bg-slate-50 print:bg-white print:p-0">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 print:mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-orange-500 print:hidden" />
            <h1 className="text-3xl font-bold text-gray-900">Reportes de Negocio</h1>
          </div>
          <p className="text-gray-500 text-lg print:text-sm">Analíticas y rendimiento de ventas</p>
        </div>
        
        <div className="flex items-center gap-3 print:hidden">
          <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 flex items-center shadow-sm">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-transparent border-none outline-none text-sm font-semibold text-gray-700 cursor-pointer"
            >
              <option value="this_week">Esta Semana</option>
              <option value="this_month">Este Mes</option>
              <option value="last_month">Mes Anterior</option>
              <option value="last_3_months">Últimos 3 Meses</option>
            </select>
          </div>
          
          <button 
            onClick={handlePrint}
            className="brand-bg text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}} />

      <div className="print-area space-y-6">
        
        {/* Print Header Visible ONLY on Print */}
        <div className="hidden print:block mb-6 border-b-2 border-orange-500 pb-4">
          <h2 className="text-2xl font-black text-gray-900">Reporte de Desempeño Glubbi</h2>
          <p className="text-sm text-gray-600">Generado el {new Date().toLocaleDateString('es-ES')} a las {new Date().toLocaleTimeString('es-ES')}</p>
          <p className="text-sm font-bold text-orange-600 mt-1">Periodo: {
            dateFilter === 'this_week' ? 'Esta Semana' : 
            dateFilter === 'this_month' ? 'Este Mes' : 
            dateFilter === 'last_month' ? 'Mes Anterior' : 'Últimos 3 Meses'
          }</p>
        </div>

        {loading ? (
          <div className="flex justify-center p-12 print:hidden">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Resumen General */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 print:border-gray-300">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center shrink-0 print:border">
                  <TrendingUp className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Ventas Totales</p>
                  <h3 className="text-3xl font-black text-slate-800">{formatPrice(totalVentas, 'USD')}</h3>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 print:border-gray-300">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center shrink-0 print:border">
                  <ShoppingBag className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Pedidos Completados</p>
                  <h3 className="text-3xl font-black text-slate-800">{totalPedidos}</h3>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Top Productos */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm print:border-gray-300">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-orange-500" />
                  Productos Más Vendidos
                </h3>
                {topProducts.length === 0 ? (
                  <p className="text-gray-400 text-sm italic">No hay ventas registradas en este periodo.</p>
                ) : (
                  <div className="space-y-3">
                    {topProducts.map(([name, stats], index) => (
                      <div key={name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl print:border">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-black text-gray-300 w-6 text-center">{index + 1}</span>
                          <span className="font-semibold text-gray-800">{name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{stats.quantity} unid.</p>
                          <p className="text-xs text-gray-500">{formatPrice(stats.revenue, 'USD')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Clientes */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm print:border-gray-300">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-500" />
                  Mejores Clientes
                </h3>
                {topCustomers.length === 0 ? (
                  <p className="text-gray-400 text-sm italic">No hay información de clientes en este periodo.</p>
                ) : (
                  <div className="space-y-3">
                    {topCustomers.map(([id, stats], index) => (
                      <div key={id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl print:border">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-black text-gray-300 w-6 text-center">{index + 1}</span>
                          <span className="font-semibold text-gray-800">{stats.name || 'Cliente Glubbi'}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatPrice(stats.amount, 'USD')}</p>
                          <p className="text-xs text-gray-500">{stats.count} pedidos</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
