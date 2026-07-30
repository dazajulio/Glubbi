'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Sparkles, 
  Plus, 
  Calendar, 
  DollarSign, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Edit3, 
  Trash2, 
  ShieldAlert,
  Crown,
  Zap,
  TrendingUp,
  Loader2,
  X
} from 'lucide-react';

interface AdPackage {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  tier: number;
  badge_text: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface RestaurantFeatured {
  id: string;
  name: string;
  slug: string;
  featured_tier: number;
  featured_until: string | null;
  featured_badge: string;
  is_active: boolean;
}

export default function PosicionamientoAdminPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantFeatured[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Package Modal State
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<AdPackage | null>(null);
  const [pkgName, setPkgName] = useState('');
  const [pkgPrice, setPkgPrice] = useState('15');
  const [pkgDays, setPkgDays] = useState('7');
  const [pkgTier, setPkgTier] = useState('1');
  const [pkgBadge, setPkgBadge] = useState('DESTACADO');
  const [pkgDesc, setPkgDesc] = useState('');
  const [isSavingPkg, setIsSavingPkg] = useState(false);

  // Manual Activation Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRestId, setSelectedRestId] = useState('');
  const [assignDays, setAssignDays] = useState('30');
  const [assignTier, setAssignTier] = useState('2');
  const [assignBadge, setAssignBadge] = useState('PATROCINADO VIP');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // 1. Fetch Ad Packages
      const { data: pkgData } = await supabase
        .from('ad_packages')
        .select('*')
        .order('created_at', { ascending: false });

      // Fallback default packages if table doesn't exist yet in Supabase
      if (pkgData) {
        setPackages(pkgData as AdPackage[]);
      } else {
        setPackages([
          { id: '1', name: 'Impulso Semanal', price: 15, duration_days: 7, tier: 1, badge_text: 'DESTACADO', description: 'Posicionamiento privilegiado en el feed por 7 días.', is_active: true, created_at: new Date().toISOString() },
          { id: '2', name: 'VIP Top Mensual', price: 45, duration_days: 30, tier: 2, badge_text: 'PATROCINADO VIP', description: 'Aparición en los primeros lugares del feed y sección de ofertas.', is_active: true, created_at: new Date().toISOString() }
        ]);
      }

      // 2. Fetch Restaurants with positioning status
      const { data: restData } = await supabase
        .from('restaurants')
        .select('id, name, slug, featured_tier, featured_until, featured_badge, is_active')
        .order('name');

      if (restData) {
        setRestaurants(restData as RestaurantFeatured[]);
      }
    } catch (err) {
      console.error('Error loading positioning data:', err);
    } finally {
      setLoading(false);
    }
  }

  // --- Create / Edit Package ---
  const handleOpenPackageModal = (pkg?: AdPackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setPkgName(pkg.name);
      setPkgPrice(pkg.price.toString());
      setPkgDays(pkg.duration_days.toString());
      setPkgTier(pkg.tier.toString());
      setPkgBadge(pkg.badge_text || 'DESTACADO');
      setPkgDesc(pkg.description || '');
    } else {
      setEditingPackage(null);
      setPkgName('');
      setPkgPrice('15');
      setPkgDays('7');
      setPkgTier('1');
      setPkgBadge('DESTACADO');
      setPkgDesc('');
    }
    setShowPackageModal(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPkg(true);

    const payload = {
      name: pkgName,
      price: parseFloat(pkgPrice) || 0,
      duration_days: parseInt(pkgDays) || 7,
      tier: parseInt(pkgTier) || 1,
      badge_text: pkgBadge,
      description: pkgDesc,
      is_active: true
    };

    if (editingPackage) {
      await supabase.from('ad_packages').update(payload).eq('id', editingPackage.id);
    } else {
      await supabase.from('ad_packages').insert([payload]);
    }

    setIsSavingPkg(false);
    setShowPackageModal(false);
    loadData();
  };

  const handleTogglePackageStatus = async (pkg: AdPackage) => {
    await supabase.from('ad_packages').update({ is_active: !pkg.is_active }).eq('id', pkg.id);
    loadData();
  };

  // --- Assign Manual Positioning to Restaurant ---
  const handleAssignPositioning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestId) return;

    setIsAssigning(true);

    const days = parseInt(assignDays) || 7;
    const untilDate = new Date();
    untilDate.setDate(untilDate.getDate() + days);

    const payload = {
      featured_tier: parseInt(assignTier) || 1,
      featured_until: untilDate.toISOString(),
      featured_badge: assignBadge || 'PATROCINADO'
    };

    await supabase.from('restaurants').update(payload).eq('id', selectedRestId);

    setIsAssigning(false);
    setShowAssignModal(false);
    loadData();
  };

  const handleCancelPositioning = async (restId: string) => {
    if (!confirm('¿Deseas cancelar el posicionamiento activo de este restaurante?')) return;
    await supabase.from('restaurants').update({
      featured_tier: 0,
      featured_until: null,
      featured_badge: 'DESTACADO'
    }).eq('id', restId);
    loadData();
  };

  // Calculations
  const activeFeaturedRest = restaurants.filter(r => 
    (r.featured_tier || 0) > 0 && r.featured_until && new Date(r.featured_until) > new Date()
  );

  const filteredRest = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 space-y-8 animate-fade-in max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Gestión de Posicionamiento (Glubbi Ads)</h1>
              <p className="text-slate-500 text-xs md:text-sm">Configura los paquetes de publicidad B2B y asigna prioridad VIP a los restaurantes.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenPackageModal()}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Crear Paquete B2B
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-orange-500/20"
          >
            <Crown className="w-4 h-4" /> Venta Manual (Activar VIP)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Restaurantes VIP Activos</span>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-slate-900">{activeFeaturedRest.length}</p>
          <p className="text-[11px] text-emerald-600 font-semibold">↑ Posicionados de primero en la App</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Paquetes Disponibles</span>
            <Zap className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-3xl font-black text-slate-900">{packages.filter(p => p.is_active).length}</p>
          <p className="text-[11px] text-slate-500 font-semibold">Visibles en el dashboard de gerentes</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Monetización Estimada</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-slate-900">
            ${activeFeaturedRest.length * 30} USD
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold">Ingresos recurrentes por publicidad</p>
        </div>
      </div>

      {/* SECTION 1: Configuración de Paquetes B2B */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">1. Paquetes Promocionales B2B</h2>
            <p className="text-slate-500 text-xs">Estos paquetes los ven y adquieren los dueños desde su panel `/gerente/promocionar`.</p>
          </div>
          <button
            onClick={() => handleOpenPackageModal()}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl transition-all"
          >
            + Nuevo Paquete
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {packages.map((pkg) => (
            <div 
              key={pkg.id} 
              className={`border-2 rounded-2xl p-5 space-y-4 transition-all relative overflow-hidden ${
                pkg.is_active ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-100 bg-slate-50 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    pkg.tier === 2 
                      ? 'bg-amber-50 text-amber-600 border-amber-200' 
                      : 'bg-blue-50 text-blue-600 border-blue-200'
                  }`}>
                    {pkg.tier === 2 ? 'Gold VIP Top' : 'Silver Destacado'}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-base mt-2">{pkg.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900">${pkg.price}</span>
                  <span className="text-[10px] text-slate-400 font-bold block">USD</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 min-h-[36px]">{pkg.description}</p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-orange-500" /> {pkg.duration_days} Días de duración
                </span>
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono text-[11px]">
                  Tag: {pkg.badge_text}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleTogglePackageStatus(pkg)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                    pkg.is_active ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {pkg.is_active ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => handleOpenPackageModal(pkg)}
                  className="text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Monitoreo & Asignación de Restaurantes */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">2. Restaurantes con Posicionamiento Activo & Venta Manual</h2>
            <p className="text-slate-500 text-xs">Monitea la expiración o activa manualmente el posicionamiento VIP a cualquier cliente.</p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar restaurante..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-black tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Restaurante</th>
                <th className="py-3 px-4">Estado VIP</th>
                <th className="py-3 px-4">Distintivo (Badge)</th>
                <th className="py-3 px-4">Vencimiento</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRest.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">No se encontraron restaurantes.</td>
                </tr>
              ) : (
                filteredRest.map((rest) => {
                  const isFeatured = (rest.featured_tier || 0) > 0 && rest.featured_until && new Date(rest.featured_until) > new Date();
                  const untilDate = rest.featured_until ? new Date(rest.featured_until) : null;
                  const daysLeft = untilDate ? Math.ceil((untilDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;

                  return (
                    <tr key={rest.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        {rest.name}
                        <span className="block text-[10px] font-normal text-slate-400 font-mono">/{rest.slug}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        {isFeatured ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                            rest.featured_tier === 2 
                              ? 'bg-amber-50 text-amber-600 border-amber-200' 
                              : 'bg-blue-50 text-blue-600 border-blue-200'
                          }`}>
                            <Crown className="w-3 h-3" /> {rest.featured_tier === 2 ? 'Gold VIP Top' : 'Silver Destacado'}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-semibold">Orgánico (Normal)</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isFeatured ? (
                          <span className="bg-orange-500/10 text-orange-600 border border-orange-500/20 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold">
                            {rest.featured_badge || 'DESTACADO'}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isFeatured && untilDate ? (
                          <div>
                            <span className="font-bold text-slate-800 block text-xs">
                              {untilDate.toLocaleDateString()}
                            </span>
                            <span className="text-[10px] font-extrabold text-emerald-600">
                              Quedan {daysLeft} días
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Sin paquete</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedRestId(rest.id);
                              setShowAssignModal(true);
                            }}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm"
                          >
                            {isFeatured ? 'Extender' : 'Activar VIP'}
                          </button>

                          {isFeatured && (
                            <button
                              onClick={() => handleCancelPositioning(rest.id)}
                              className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors text-xs font-bold"
                              title="Cancelar Posicionamiento"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Crear/Editar Paquete B2B */}
      {showPackageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 animate-fade-in relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-lg">
                {editingPackage ? 'Editar Paquete Promocional' : 'Crear Nuevo Paquete B2B'}
              </h3>
              <button onClick={() => setShowPackageModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Nombre del Paquete *</label>
                <input
                  type="text"
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                  required
                  placeholder="Ej: Impulso Semanal"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Precio (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(e.target.value)}
                    required
                    placeholder="15.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Duración (Días) *</label>
                  <input
                    type="number"
                    value={pkgDays}
                    onChange={(e) => setPkgDays(e.target.value)}
                    required
                    placeholder="7"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Nivel (Tier) *</label>
                  <select
                    value={pkgTier}
                    onChange={(e) => setPkgTier(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-orange-500 font-semibold"
                  >
                    <option value="1">Silver (Destacado)</option>
                    <option value="2">Gold (VIP Top Feed)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Badge Texto *</label>
                  <input
                    type="text"
                    value={pkgBadge}
                    onChange={(e) => setPkgBadge(e.target.value.toUpperCase())}
                    required
                    placeholder="PATROCINADO"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 uppercase font-mono font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Descripción / Beneficios</label>
                <textarea
                  value={pkgDesc}
                  onChange={(e) => setPkgDesc(e.target.value)}
                  placeholder="Ej: Posicionamiento privilegiado en el feed durante 7 días."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingPkg}
                className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl h-11 text-xs transition-all shadow-md active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSavingPkg ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Paquete Promocional'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Venta Manual (Asignar Posicionamiento a Restaurante) */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 animate-fade-in relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" /> Venta Manual (Activar VIP)
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignPositioning} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Selecciona Restaurante *</label>
                <select
                  value={selectedRestId}
                  onChange={(e) => setSelectedRestId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- Seleccionar Restaurante --</option>
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} (/{r.slug})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Días a Asignar *</label>
                  <input
                    type="number"
                    value={assignDays}
                    onChange={(e) => setAssignDays(e.target.value)}
                    required
                    placeholder="30"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Nivel VIP *</label>
                  <select
                    value={assignTier}
                    onChange={(e) => setAssignTier(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                  >
                    <option value="1">Silver (Destacado)</option>
                    <option value="2">Gold (VIP Top Feed)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Insignia / Badge *</label>
                <input
                  type="text"
                  value={assignBadge}
                  onChange={(e) => setAssignBadge(e.target.value.toUpperCase())}
                  required
                  placeholder="PATROCINADO VIP"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 uppercase font-mono font-bold focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={isAssigning || !selectedRestId}
                className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl h-11 text-xs transition-all shadow-md active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Activar Posicionamiento Ahora'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
