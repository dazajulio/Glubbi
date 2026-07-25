'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Tag, Plus, CheckCircle2, Percent, Users } from 'lucide-react';

type Coupon = {
  id: string;
  code: string;
  discount_percentage: number;
  is_active: boolean;
  max_uses: number | null;
  current_uses: number;
  created_at: string;
};

type Redemption = {
  id: string;
  coupon_id: string;
  restaurant_id: string;
  discount_applied: number;
  created_at: string;
  restaurants: { name: string };
  coupons: { code: string };
};

export default function CuponesPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('');

  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    const { data: cData } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (cData) setCoupons(cData);

    const { data: rData } = await supabase
      .from('coupon_redemptions')
      .select('*, restaurants(name), coupons(code)')
      .order('created_at', { ascending: false });
    if (rData) setRedemptions(rData as unknown as Redemption[]);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newDiscount) return;

    const { error } = await supabase.from('coupons').insert([{
      code: newCode.toUpperCase(),
      discount_percentage: parseFloat(newDiscount),
      max_uses: newMaxUses ? parseInt(newMaxUses) : null,
      is_active: true
    }]);

    if (!error) {
      setNewCode('');
      setNewDiscount('');
      setNewMaxUses('');
      setIsCreating(false);
      fetchData();
    } else {
      alert('Error al crear cupón. Es posible que el código ya exista.');
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    await supabase.from('coupons').update({ is_active: !currentStatus }).eq('id', id);
    fetchData();
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-orange-500" /> Cupones y Ofertas B2B
          </h1>
          <p className="text-gray-500">Genera códigos de descuento para el registro de nuevos restaurantes.</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo Cupón
        </button>
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Crear Nuevo Código</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Código</label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="Ej. VERANO50"
                className="w-full px-4 py-2 bg-slate-50 border border-gray-200 rounded-lg outline-none focus:border-orange-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Descuento (%)</label>
              <input
                type="number"
                required
                min="1"
                max="100"
                value={newDiscount}
                onChange={(e) => setNewDiscount(e.target.value)}
                placeholder="Ej. 50"
                className="w-full px-4 py-2 bg-slate-50 border border-gray-200 rounded-lg outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Límite de Usos</label>
              <input
                type="number"
                min="1"
                value={newMaxUses}
                onChange={(e) => setNewMaxUses(e.target.value)}
                placeholder="Opcional"
                className="w-full px-4 py-2 bg-slate-50 border border-gray-200 rounded-lg outline-none focus:border-orange-500"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors">
                Guardar Cupón
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lista de Cupones */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-slate-50">
            <h3 className="font-bold text-gray-800">Cupones Activos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="p-3">Código</th>
                  <th className="p-3">Descuento</th>
                  <th className="p-3">Usos</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={4} className="p-4 text-center text-gray-400">Cargando...</td></tr>
                ) : coupons.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-gray-400">No hay cupones creados.</td></tr>
                ) : (
                  coupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-gray-900">{coupon.code}</td>
                      <td className="p-3 text-green-600 font-semibold">{coupon.discount_percentage}%</td>
                      <td className="p-3 text-gray-600">
                        {coupon.current_uses} {coupon.max_uses ? `/ ${coupon.max_uses}` : '(ilimitado)'}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => toggleStatus(coupon.id, coupon.is_active)}
                          className={`px-3 py-1 rounded-full text-xs font-bold ${coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                        >
                          {coupon.is_active ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Historial de Redenciones */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-slate-50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-4 h-4" /> Expediente de Uso
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Restaurante</th>
                  <th className="p-3">Cupón Usado</th>
                  <th className="p-3 text-right">Descuento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={4} className="p-4 text-center text-gray-400">Cargando...</td></tr>
                ) : redemptions.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-gray-400">No hay redenciones aún.</td></tr>
                ) : (
                  redemptions.map((red) => (
                    <tr key={red.id} className="hover:bg-slate-50">
                      <td className="p-3 text-gray-500">{new Date(red.created_at).toLocaleDateString()}</td>
                      <td className="p-3 font-medium text-gray-900">{red.restaurants?.name}</td>
                      <td className="p-3 font-mono text-gray-600">{red.coupons?.code}</td>
                      <td className="p-3 text-right font-bold text-green-600">
                        -${red.discount_applied.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
