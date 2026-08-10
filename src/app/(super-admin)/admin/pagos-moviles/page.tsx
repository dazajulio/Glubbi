'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2, XCircle, Clock, Search, DollarSign, Filter, Building2 } from 'lucide-react';

type PaymentReport = {
  id: string;
  restaurant_id: string;
  amount: number;
  reference_number: string;
  bank_name: string;
  payment_date: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  restaurants: {
    name: string;
    subscription_renews_at: string;
  };
};

export default function PagosMovilesPage() {
  const [payments, setPayments] = useState<PaymentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = createClient();

  const fetchPayments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payment_reports')
      .select(`
        *,
        restaurants ( name, subscription_renews_at )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPayments(data as unknown as PaymentReport[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleAction = async (id: string, status: 'approved' | 'rejected', restaurantId: string, currentRenewal: string) => {
    setActionLoading(id);
    
    // 1. Actualizar el estado del pago
    const { error: updateError } = await supabase
      .from('payment_reports')
      .update({ status })
      .eq('id', id);

    if (updateError) {
      alert('Error al actualizar el pago: ' + updateError.message);
      setActionLoading(null);
      return;
    }

    // 2. Si es aprobado, renovar la suscripción del restaurante (+30 días)
    if (status === 'approved') {
      const baseDate = currentRenewal && new Date(currentRenewal) > new Date() 
        ? new Date(currentRenewal) 
        : new Date();
      
      const nextRenewal = new Date(baseDate);
      nextRenewal.setDate(nextRenewal.getDate() + 30);

      const { error: restError } = await supabase
        .from('restaurants')
        .update({
          subscription_renews_at: nextRenewal.toISOString(),
          is_active: true,
          subscription_status: 'active'
        })
        .eq('id', restaurantId);

      if (restError) {
        alert('Pago aprobado, pero hubo un error al renovar la suscripción del restaurante.');
      }
    }

    await fetchPayments();
    setActionLoading(null);
  };

  // Filtered payments list
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      const matchesStatus = filterTab === 'all' || item.status === filterTab;
      const matchesSearch = 
        item.restaurants?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reference_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.bank_name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [payments, filterTab, searchQuery]);

  // Statistics
  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const approvedCount = payments.filter((p) => p.status === 'approved').length;
  const rejectedCount = payments.filter((p) => p.status === 'rejected').length;
  const totalApprovedAmount = payments
    .filter((p) => p.status === 'approved')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Verificación de Pagos Móviles B2B</h1>
          <p className="text-gray-500 text-sm">Audita y aprueba las renovaciones de suscripción reportadas por los restaurantes.</p>
        </div>
      </div>

      {/* ── Summary Stats Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Pendientes por Auditar</p>
            <p className="text-2xl font-black text-gray-900">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Pagos Aprobados</p>
            <p className="text-2xl font-black text-gray-900">{approvedCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Rechazados</p>
            <p className="text-2xl font-black text-gray-900">{rejectedCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Total Recaudado</p>
            <p className="text-2xl font-black text-gray-900">${totalApprovedAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* ── Filters & Search Bar ───────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Todos ({payments.length})
          </button>
          <button
            onClick={() => setFilterTab('pending')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterTab === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            onClick={() => setFilterTab('approved')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterTab === 'approved' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Aprobados ({approvedCount})
          </button>
          <button
            onClick={() => setFilterTab('rejected')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterTab === 'rejected' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Rechazados ({rejectedCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar restaurante, ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-orange-500 transition-all"
          />
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 font-bold text-gray-600 uppercase tracking-wider">
                <th className="p-4">Restaurante</th>
                <th className="p-4">Monto</th>
                <th className="p-4">Referencia</th>
                <th className="p-4">Banco Emisor</th>
                <th className="p-4">Fecha Pago</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acción de Auditoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 font-medium">
                    Cargando reportes de pago...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    No se encontraron reportes con los criterios de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-orange-500 shrink-0" />
                        <span className="font-bold text-gray-900 text-sm">
                          {payment.restaurants?.name || 'Restaurante Desconocido'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-black text-gray-900 text-sm">${payment.amount.toFixed(2)}</td>
                    <td className="p-4 font-mono font-bold text-gray-700">{payment.reference_number}</td>
                    <td className="p-4 font-medium text-gray-600">{payment.bank_name}</td>
                    <td className="p-4 text-gray-500 font-medium">{new Date(payment.payment_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="p-4">
                      {payment.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-amber-100 text-amber-800 text-[11px]">
                          <Clock className="w-3.5 h-3.5" /> Pendiente
                        </span>
                      )}
                      {payment.status === 'approved' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aprobado (+30 días)
                        </span>
                      )}
                      {payment.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-red-100 text-red-800 text-[11px]">
                          <XCircle className="w-3.5 h-3.5" /> Rechazado
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {payment.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleAction(payment.id, 'approved', payment.restaurant_id, payment.restaurants?.subscription_renews_at)}
                            disabled={actionLoading === payment.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 text-[11px]"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleAction(payment.id, 'rejected', payment.restaurant_id, payment.restaurants?.subscription_renews_at)}
                            disabled={actionLoading === payment.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 text-[11px]"
                          >
                            <XCircle className="w-4 h-4" />
                            Rechazar
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 font-medium text-[11px]">Auditado</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
