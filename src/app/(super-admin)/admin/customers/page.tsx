'use client';

import { useEffect, useState } from 'react';
import { Users, Mail, Phone, Search, Building2, ShoppingBag, DollarSign } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils';

export default function GlobalCustomersPage() {
  const supabase = createClient();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadCustomers() {
      // 1. Fetch all customers
      const { data: customersData } = await supabase
        .from('customers')
        .select('*');
        
      // 2. Fetch all orders to calculate GMV per customer
      // Since some orders don't have customer_id, we will do our best to match by email if it were saved,
      // or we just show the customer data we have.
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, customer_id, total_amount, restaurant_id, status, payment_status');
        
      if (customersData) {
        // Group customers by email (to merge users who bought in multiple restaurants)
        const grouped: { [email: string]: any } = {};
        
        customersData.forEach(c => {
          const email = c.email?.toLowerCase().trim() || `no-email-${c.id}`;
          if (!grouped[email]) {
            grouped[email] = {
              name: c.name,
              email: c.email,
              phone: c.phone,
              restaurants: new Set(),
              orderCount: 0,
              totalSpent: 0,
              ids: []
            };
          }
          grouped[email].restaurants.add(c.restaurant_id);
          grouped[email].ids.push(c.id);
        });

        // Add order stats
        if (ordersData) {
          ordersData.forEach(o => {
            if (o.status === 'cancelled') return;
            // Find which group this order belongs to
            const group = Object.values(grouped).find(g => g.ids.includes(o.customer_id));
            if (group) {
              group.orderCount += 1;
              group.totalSpent += Number(o.total_amount || 0);
              group.restaurants.add(o.restaurant_id);
            }
          });
        }

        const formatted = Object.values(grouped).map(g => ({
          ...g,
          restaurantsCount: g.restaurants.size
        }));

        // Sort by total spent descending
        formatted.sort((a, b) => b.totalSpent - a.totalSpent);
        setCustomers(formatted);
      }
      
      setLoading(false);
    }
    
    loadCustomers();
  }, [supabase]);

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="bg-white shadow-md p-6 border border-gray-200 rounded-3xl backdrop-blur-xl flex flex-col md:flex-row gap-4 justify-between md:items-center">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Mega Base de Datos de Usuarios
          </h2>
          <p className="text-xs text-gray-400">
            Directorio global de todos los comensales registrados a través de cualquier restaurante en Glubbi.
          </p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-800 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-3xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center mb-2">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-gray-900">{customers.length}</span>
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Usuarios Únicos</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-3xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 bg-green-500/10 text-green-600 rounded-2xl flex items-center justify-center mb-2">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-gray-900">
            {customers.reduce((sum, c) => sum + c.orderCount, 0)}
          </span>
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Órdenes Totales</span>
        </div>
        <div className="col-span-2 bg-gradient-to-r from-orange-500 to-indigo-600 rounded-3xl p-4 shadow-lg flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-2 backdrop-blur-sm">
            <DollarSign className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-white">
            {formatPrice(customers.reduce((sum, c) => sum + c.totalSpent, 0), 'USD')}
          </span>
          <span className="text-[10px] uppercase font-bold text-orange-100 tracking-wider">Volumen Transaccionado (LTV Global)</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-md border border-gray-200 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-slate-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Usuario</th>
                <th className="px-6 py-4 font-bold tracking-wider">Contacto</th>
                <th className="px-6 py-4 font-bold tracking-wider text-center">Restaurantes</th>
                <th className="px-6 py-4 font-bold tracking-wider text-center">Órdenes</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">LTV (Gastado)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.length > 0 ? filteredCustomers.map((customer, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold uppercase shrink-0 border border-gray-200">
                        {customer.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{customer.name || 'Sin Nombre'}</div>
                        <div className="text-[10px] text-gray-400 font-mono">ID: {customer.ids[0]?.split('-')[0]}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      {customer.email || 'Sin correo'}
                    </div>
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {customer.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                      <Building2 className="w-3.5 h-3.5" />
                      {customer.restaurantsCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="font-black text-gray-900">{customer.orderCount}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                      {formatPrice(customer.totalSpent, 'USD')}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    No se encontraron usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
