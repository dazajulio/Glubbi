'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CreditCard, Upload, CheckCircle2 } from 'lucide-react';

export default function SuscripcionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [restaurantId, setRestaurantId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [bank, setBank] = useState('');
  const [date, setDate] = useState('');

  const supabase = createClient();

  useEffect(() => {
    async function loadRestaurant() {
      const { data } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', slug)
        .single();
      if (data) setRestaurantId(data.id);
    }
    loadRestaurant();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId || !amount || !reference || !bank || !date) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('payment_reports')
      .insert([
        {
          restaurant_id: restaurantId,
          amount: parseFloat(amount),
          reference_number: reference,
          bank_name: bank,
          payment_date: date,
          status: 'pending'
        }
      ]);

    if (!error) {
      setSuccess(true);
      setAmount('');
      setReference('');
      setBank('');
      setDate('');
    } else {
      alert('Error al reportar pago: ' + error.message);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-6 pt-20">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">¡Pago Reportado con Éxito!</h1>
        <p className="text-gray-500">
          Hemos recibido tu reporte de pago móvil. Nuestro equipo administrativo lo verificará a la brevedad posible y tu suscripción será renovada por 30 días más.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-6 px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
        >
          Reportar otro pago
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8 pb-32">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-orange-500" /> Mi Suscripción
        </h1>
        <p className="text-gray-500 mt-2">
          Reporta tu pago móvil para renovar tu suscripción mensual de Glubbi.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Monto Pagado ($)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
              placeholder="Ej. 29.99"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Número de Referencia</label>
            <input
              type="text"
              required
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
              placeholder="Últimos 6 dígitos o referencia completa"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Banco Emisor</label>
            <input
              type="text"
              required
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
              placeholder="Ej. Banesco, Mercantil, Provincial"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha del Pago</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 px-6 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] disabled:opacity-70"
        >
          {loading ? 'Enviando...' : (
            <>
              <Upload className="w-5 h-5" />
              Enviar Reporte de Pago
            </>
          )}
        </button>
      </form>
    </div>
  );
}
