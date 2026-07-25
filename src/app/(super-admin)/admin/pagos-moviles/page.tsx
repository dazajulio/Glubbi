'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

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
  const supabase = createClient();

  const fetchPayments = async () => {
    setLoading(true);
    // Para simplificar, buscamos todos los pagos. En producción se puede añadir paginación
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
      alert('Error al actualizar el pago');
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
        alert('Pago aprobado, pero hubo un error al renovar la suscripción');
      }
    }

    await fetchPayments();
    setActionLoading(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verificación de Pagos Móviles</h1>
          <p className="text-gray-500">Revisa y aprueba los reportes de pago móvil de los restaurantes.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
                <th className="p-4">Restaurante</th>
                <th className="p-4">Monto</th>
                <th className="p-4">Referencia</th>
                <th className="p-4">Banco</th>
                <th className="p-4">Fecha Pago</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Cargando pagos...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No hay reportes de pago.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">
                      {payment.restaurants?.name || 'Desconocido'}
                    </td>
                    <td className="p-4">${payment.amount.toFixed(2)}</td>
                    <td className="p-4 font-mono text-gray-600">{payment.reference_number}</td>
                    <td className="p-4">{payment.bank_name}</td>
                    <td className="p-4">{new Date(payment.payment_date).toLocaleDateString()}</td>
                    <td className="p-4">
                      {payment.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3" /> Pendiente
                        </span>
                      )}
                      {payment.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3" /> Aprobado
                        </span>
                      )}
                      {payment.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3" /> Rechazado
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {payment.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleAction(payment.id, 'approved', payment.restaurant_id, payment.restaurants?.subscription_renews_at)}
                            disabled={actionLoading === payment.id}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Aprobar Pago"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleAction(payment.id, 'rejected', payment.restaurant_id, payment.restaurants?.subscription_renews_at)}
                            disabled={actionLoading === payment.id}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Rechazar Pago"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
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
