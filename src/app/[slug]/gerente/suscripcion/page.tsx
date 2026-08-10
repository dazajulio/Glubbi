'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CreditCard, Upload, CheckCircle2, Clock, XCircle, Calendar, ShieldCheck, Copy, Check } from 'lucide-react';

type RestaurantSubscription = {
  id: string;
  name: string;
  is_active: boolean;
  subscription_status: string;
  subscription_renews_at: string | null;
  subscription_type: string;
};

type PaymentReport = {
  id: string;
  amount: number;
  reference_number: string;
  bank_name: string;
  payment_date: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

export default function SuscripcionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [restaurant, setRestaurant] = useState<RestaurantSubscription | null>(null);
  const [history, setHistory] = useState<PaymentReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const [amount, setAmount] = useState('29.99');
  const [reference, setReference] = useState('');
  const [bank, setBank] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const supabase = createClient();

  const loadData = useCallback(async () => {
    const { data: restData } = await supabase
      .from('restaurants')
      .select('id, name, is_active, subscription_status, subscription_renews_at, subscription_type')
      .eq('slug', slug)
      .single();

    if (restData) {
      setRestaurant(restData);
      
      const { data: payData } = await supabase
        .from('payment_reports')
        .select('*')
        .eq('restaurant_id', restData.id)
        .order('created_at', { ascending: false });

      if (payData) {
        setHistory(payData as PaymentReport[]);
      }
    }
  }, [slug, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant?.id || !amount || !reference || !bank || !date) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('payment_reports')
      .insert([
        {
          restaurant_id: restaurant.id,
          amount: parseFloat(amount),
          reference_number: reference,
          bank_name: bank,
          payment_date: date,
          status: 'pending'
        }
      ]);

    if (!error) {
      setSuccess(true);
      setReference('');
      setBank('');
      setDate(new Date().toISOString().split('T')[0]);
      await loadData();
    } else {
      alert('Error al reportar pago: ' + error.message);
    }
    setLoading(false);
  };

  // Days remaining calculation
  let daysRemaining: number | null = null;
  let statusBadge = { label: 'Activo', bg: 'bg-emerald-100 text-emerald-700 border-emerald-300' };

  if (restaurant?.subscription_renews_at) {
    const renewsDate = new Date(restaurant.subscription_renews_at);
    const today = new Date();
    const diffTime = renewsDate.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0 || !restaurant.is_active) {
      statusBadge = { label: 'Suspendido / Vencido', bg: 'bg-red-100 text-red-700 border-red-300' };
    } else if (daysRemaining <= 3) {
      statusBadge = { label: 'Vence Pronto', bg: 'bg-amber-100 text-amber-700 border-amber-300' };
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-32">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <CreditCard className="w-7 h-7 text-orange-500" /> Estado de Suscripción & Pagos
        </h1>
        <p className="text-gray-500 mt-1">
          Gestiona tu membresía de Glubbi y reporta tus pagos móviles mensuales.
        </p>
      </div>

      {/* ── Status Card ────────────────────────────────────────────── */}
      {restaurant && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 text-white rounded-2xl p-6 shadow-xl border border-slate-700/60 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700/80 pb-5">
            <div>
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block mb-1">Plan Mensual Restaurante</span>
              <h2 className="text-xl font-extrabold">{restaurant.name}</h2>
            </div>
            <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold border ${statusBadge.bg}`}>
              {statusBadge.label}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-5">
            <div>
              <p className="text-xs text-slate-400 font-medium">Monto Mensual</p>
              <p className="text-2xl font-black text-white mt-0.5">$29.99 <span className="text-xs text-slate-400 font-normal">/ mes</span></p>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-400" /> Próximo Vencimiento
              </p>
              <p className="text-base font-bold text-slate-200 mt-0.5">
                {restaurant.subscription_renews_at 
                  ? new Date(restaurant.subscription_renews_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Sin fecha registrada'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-medium">Días Restantes</p>
              <p className="text-2xl font-black text-orange-400 mt-0.5">
                {daysRemaining !== null ? (daysRemaining > 0 ? `${daysRemaining} días` : '0 días') : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Official Bank Info Box ──────────────────────────────────── */}
      <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
          <ShieldCheck className="w-5 h-5" />
          <span>Datos Oficiales para Pago Móvil Glubbi</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-gray-400 font-medium text-[10px]">BANCO</p>
              <p className="font-bold text-gray-900">Banesco (0134)</p>
            </div>
            <button onClick={() => copyToClipboard('0134', 'banco')} className="text-gray-400 hover:text-orange-500">
              {copiedField === 'banco' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-gray-400 font-medium text-[10px]">TELÉFONO</p>
              <p className="font-bold text-gray-900">0414-1234567</p>
            </div>
            <button onClick={() => copyToClipboard('04141234567', 'telefono')} className="text-gray-400 hover:text-orange-500">
              {copiedField === 'telefono' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-gray-400 font-medium text-[10px]">RIF</p>
              <p className="font-bold text-gray-900">J-504938210</p>
            </div>
            <button onClick={() => copyToClipboard('J504938210', 'rif')} className="text-gray-400 hover:text-orange-500">
              {copiedField === 'rif' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-gray-400 font-medium text-[10px]">TITULAR</p>
              <p className="font-bold text-gray-900 truncate">Glubbi Tech C.A.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form Section ────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Upload className="w-5 h-5 text-orange-500" /> Reportar Nuevo Pago
        </h2>

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">¡Pago registrado exitosamente!</p>
              <p className="text-xs text-emerald-700">Nuestro equipo administrativo lo verificará y tu suscripción se renovará automáticamente.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Monto Pagado ($)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm font-semibold"
              placeholder="29.99"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Número de Referencia</label>
            <input
              type="text"
              required
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm font-semibold"
              placeholder="Ej. 123456"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Banco Emisor</label>
            <input
              type="text"
              required
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
              placeholder="Ej. Banesco, Mercantil, Provincial"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Fecha de Transferencia</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
            />
          </div>

          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] disabled:opacity-70 text-sm"
            >
              {loading ? 'Enviando Reporte...' : 'Enviar Reporte de Pago Móvil'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Payment History Table ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden space-y-4">
        <div className="p-5 border-b border-gray-100 bg-slate-50/60">
          <h3 className="font-bold text-gray-900 text-base">Historial de Reportes de Pago</h3>
          <p className="text-xs text-gray-500">Registro de todos los pagos móviles enviados por tu restaurante.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-slate-50 text-gray-600 font-semibold">
                <th className="p-3.5">Fecha Reporte</th>
                <th className="p-3.5">Monto</th>
                <th className="p-3.5">Referencia</th>
                <th className="p-3.5">Banco</th>
                <th className="p-3.5">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-400">
                    No has realizado reportes de pago aún.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-3.5 text-gray-600 font-medium">
                      {new Date(item.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-3.5 font-extrabold text-gray-900">${item.amount.toFixed(2)}</td>
                    <td className="p-3.5 font-mono text-gray-700 font-bold">{item.reference_number}</td>
                    <td className="p-3.5 text-gray-600">{item.bank_name}</td>
                    <td className="p-3.5">
                      {item.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-800 text-[10px]">
                          <Clock className="w-3 h-3" /> En Verificación
                        </span>
                      )}
                      {item.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Aprobado
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold bg-red-100 text-red-800 text-[10px]">
                          <XCircle className="w-3 h-3" /> Rechazado
                        </span>
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
