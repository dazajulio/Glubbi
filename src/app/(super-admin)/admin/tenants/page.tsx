'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Building2, 
  Search, 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Calendar, 
  Phone, 
  MapPin, 
  Globe, 
  Play, 
  CheckCircle2, 
  TrendingUp, 
  BarChart2, 
  Layers 
} from 'lucide-react';

export default function TenantsPage() {
  const supabase = createClient();
  
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // --- Load Data ---
  async function loadData() {
    setIsLoading(true);
    const [restRes, ordersRes] = await Promise.all([
      supabase.from('restaurants').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('restaurant_id, total_amount, payment_status, status, created_at')
    ]);

    if (!restRes.error && restRes.data) {
      setRestaurants(restRes.data);
    }
    if (!ordersRes.error && ordersRes.data) {
      setOrders(ordersRes.data);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // Update selectedTenant ref if restaurants list updates
  useEffect(() => {
    if (selectedTenant) {
      const updated = restaurants.find(r => r.id === selectedTenant.id);
      if (updated) {
        setSelectedTenant(updated);
      }
    }
  }, [restaurants]);

  // --- Calculations per tenant ---
  const getTenantStats = (tenantId: string) => {
    const tenantOrders = orders.filter(o => o.restaurant_id === tenantId);
    const paidOrders = tenantOrders.filter(o => o.payment_status === 'paid' && o.status !== 'cancelled');
    const totalGmv = paidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const ordersToday = tenantOrders.filter(o => new Date(o.created_at) >= startOfToday).length;

    return {
      totalGmv,
      ordersCount: tenantOrders.length,
      ordersToday
    };
  };

  // --- Action handlers ---
  const toggleTenantStatus = async (tenant: any) => {
    setIsUpdating(true);
    setActionMessage('Actualizando estatus...');
    
    try {
      const res = await fetch('/api/admin/tenants/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          is_active: !tenant.is_active,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al cambiar el estatus del restaurante.');
      }
      await loadData();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Error al cambiar el estatus del restaurante.');
    } finally {
      setIsUpdating(false);
      setActionMessage('');
    }
  };

  const updateKycStatus = async (tenant: any, newStatus: string) => {
    setIsUpdating(true);
    setActionMessage('Actualizando estado KYC...');
    
    try {
      const res = await fetch('/api/admin/tenants/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          kyc_status: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al actualizar el estado KYC.');
      }
      await loadData();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Error al actualizar el estado KYC.');
    } finally {
      setIsUpdating(false);
      setActionMessage('');
    }
  };

  const generateLicense = async (tenantId: string) => {
    setIsUpdating(true);
    setActionMessage('Generando licencia...');

    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    const licenseCode = `GLB-${randomChars}`;
    const validityDate = new Date();
    validityDate.setFullYear(validityDate.getFullYear() + 1); // 1 year validity

    try {
      const res = await fetch('/api/admin/tenants/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          license_code: licenseCode,
          license_valid_until: validityDate.toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al generar la licencia.');
      }
      await loadData();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Error al generar la licencia.');
    } finally {
      setIsUpdating(false);
      setActionMessage('');
    }
  };

  // --- Filtered Tenants ---
  const filteredTenants = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.license_code && r.license_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 font-sans relative">
      
      {/* Search and Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white shadow-md p-6 border border-gray-200 rounded-3xl backdrop-blur-xl">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-900">Tenants Registrados (Locales)</h2>
          <p className="text-xs text-gray-400">Administra la afiliación, licencias y parámetros de los restaurantes</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, slug o licencia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50/60 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-slate-800 placeholder:text-gray-500 focus:outline-none focus:border-orange-500 text-sm"
          />
        </div>
      </div>

      {/* Main Grid: List vs Sidebar detail drawer */}
      <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-stretch">
        
        {/* Table List of Restaurants */}
        <div className="bg-white shadow-md border border-gray-200 rounded-3xl overflow-hidden shadow-lg backdrop-blur-xl">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-3 border-gray-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Cargando restaurantes...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-gray-400 uppercase text-[9px] tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-4">Restaurante</th>
                    <th className="px-6 py-4">Código Licencia</th>
                    <th className="px-6 py-4 text-right">Órdenes</th>
                    <th className="px-6 py-4 text-right">GMV Total</th>
                    <th className="px-6 py-4 text-center">Estatus</th>
                    <th className="px-6 py-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-800">
                  {filteredTenants.map((tenant) => {
                    const stats = getTenantStats(tenant.id);
                    const isSelected = selectedTenant?.id === tenant.id;
                    
                    return (
                      <tr 
                        key={tenant.id} 
                        onClick={() => setSelectedTenant(tenant)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                          isSelected ? 'bg-orange-500/5' : ''
                        }`}
                      >
                        <td className="px-6 py-4 font-semibold text-gray-900 flex items-center gap-3">
                          {tenant.logo_url ? (
                            <img src={tenant.logo_url} alt={tenant.name} className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-gray-500">
                              {tenant.name.substring(0,2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="block">{tenant.name}</span>
                            <span className="text-[10px] text-gray-400 font-mono">/{tenant.slug}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-gray-500">
                          {tenant.license_code ? (
                            <span className="bg-slate-100 border border-gray-200 px-2.5 py-1 rounded text-xs text-slate-800">
                              {tenant.license_code}
                            </span>
                          ) : (
                            <span className="text-gray-600 text-xs italic">Sin licencia</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-semibold">{stats.ordersCount}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-orange-400">${stats.totalGmv.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            disabled={isUpdating}
                            onClick={() => toggleTenantStatus(tenant)}
                            title={tenant.is_active ? "Clic para suspender este restaurante" : "Clic para activar este restaurante"}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold transition-all border shadow-sm active:scale-95 ${
                              tenant.is_active 
                                ? 'bg-green-500/10 text-green-700 border-green-500/30 hover:bg-green-500/20' 
                                : 'bg-red-500/10 text-red-700 border-red-500/30 hover:bg-red-500/20'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${tenant.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            {tenant.is_active ? 'Activo' : 'Suspendido'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            className="text-xs bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTenant(tenant);
                            }}
                          >
                            Administrar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTenants.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        No se encontraron restaurantes con los criterios de búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SIDEBAR DETAILED DRAWER (Only shows when tenant is selected) */}
        {selectedTenant && (
          <div className="w-full lg:w-96 bg-white border border-gray-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden shrink-0 animate-fade-in-right">
            
            {/* Header of Drawer */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20 text-orange-500">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg tracking-tight">{selectedTenant.name}</h3>
                  <span className="text-[10px] text-gray-500 font-mono">ID: {selectedTenant.id.substring(0, 8)}...</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTenant(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-gray-400 hover:text-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Switcher & Actions */}
            <div className="border-t border-b border-gray-200 py-4 space-y-4">
              
              {/* Active status switcher */}
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-gray-200">
                <div>
                  <span className="block text-xs font-bold text-gray-900 uppercase tracking-wider">Estatus Afiliación</span>
                  <span className="text-[10px] text-gray-400">Activa o suspende el restaurante</span>
                </div>
                <button
                  disabled={isUpdating}
                  onClick={() => toggleTenantStatus(selectedTenant)}
                  className={`w-12 h-6 rounded-full p-1 transition-all ${
                    selectedTenant.is_active ? 'bg-green-500' : 'bg-slate-100'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transition-all ${
                    selectedTenant.is_active ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* KYC status switcher */}
              <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-2xl border border-gray-200">
                <div>
                  <span className="block text-xs font-bold text-gray-900 uppercase tracking-wider">Estado KYC</span>
                  <span className="text-[10px] text-gray-400">Verificación de Identidad del Comercio</span>
                </div>
                <select 
                  disabled={isUpdating}
                  value={selectedTenant.kyc_status || 'unverified'}
                  onChange={(e) => updateKycStatus(selectedTenant, e.target.value)}
                  className={`mt-2 block w-full rounded-xl text-sm font-semibold border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500 ${
                    selectedTenant.kyc_status === 'verified' ? 'bg-green-50 text-green-700' :
                    selectedTenant.kyc_status === 'rejected' ? 'bg-red-50 text-red-700' :
                    'bg-yellow-50 text-yellow-700'
                  }`}
                >
                  <option value="pending_review">⏳ En Proceso</option>
                  <option value="verified">✅ Aprobado</option>
                  <option value="rejected">❌ Rechazado</option>
                  <option value="unverified">⚠️ No Verificado</option>
                </select>
              </div>

              {/* License management */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                <div>
                  <span className="block text-xs font-bold text-gray-900 uppercase tracking-wider">Licencia de Ecosistema</span>
                  <span className="text-[10px] text-gray-400">Código único de control</span>
                </div>
                
                {selectedTenant.license_code ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm font-bold text-gray-900 bg-white shadow-sm border border-gray-200 px-2.5 py-1 rounded">
                        {selectedTenant.license_code}
                      </span>
                      <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Válida
                      </span>
                    </div>
                    {selectedTenant.license_valid_until && (
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        Vence: {new Date(selectedTenant.license_valid_until).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    disabled={isUpdating}
                    onClick={() => generateLicense(selectedTenant.id)}
                    className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-indigo-600 hover:brightness-110 text-white font-bold text-xs rounded-xl uppercase tracking-wider transition-all disabled:opacity-50"
                  >
                    Generar Licencia
                  </button>
                )}
              </div>

            </div>

            {/* Performance Stats */}
            <div className="space-y-3">
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block">Rendimiento Operativo</span>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-gray-200 p-3 rounded-2xl">
                  <span className="text-gray-400 text-[9px] font-bold uppercase block">Ventas (GMV)</span>
                  <span className="text-sm font-black text-orange-500 font-mono">
                    ${getTenantStats(selectedTenant.id).totalGmv.toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-50 border border-gray-200 p-3 rounded-2xl">
                  <span className="text-gray-400 text-[9px] font-bold uppercase block">Órdenes Hoy</span>
                  <span className="text-sm font-black text-gray-900 font-mono">
                    {getTenantStats(selectedTenant.id).ordersToday}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4">
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block">Contacto y Parámetros</span>
              
              <div className="space-y-3 text-xs">
                
                {selectedTenant.phone && (
                  <div className="flex items-center gap-3 text-gray-500">
                    <Phone className="w-4 h-4 text-orange-500 shrink-0" />
                    <span className="font-mono">{selectedTenant.phone}</span>
                  </div>
                )}

                {selectedTenant.address && (
                  <div className="flex items-start gap-3 text-gray-500">
                    <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{selectedTenant.address}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 text-gray-500">
                  <Globe className="w-4 h-4 text-orange-500 shrink-0" />
                  <span className="font-mono">glubbi.app/{selectedTenant.slug}</span>
                </div>

                {/* Social media if available */}
                {(selectedTenant.instagram || selectedTenant.facebook) && (
                  <div className="flex items-center gap-3 border-t border-gray-200 pt-3">
                    {selectedTenant.instagram && (
                      <a href={selectedTenant.instagram} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors flex items-center justify-center">
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                        </svg>
                      </a>
                    )}
                    {selectedTenant.facebook && (
                      <a href={selectedTenant.facebook} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors flex items-center justify-center">
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* Overlay Loader during actions */}
            {isUpdating && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20">
                <div className="w-8 h-8 border-3 border-gray-200 border-t-purple-500 rounded-full animate-spin" />
                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">{actionMessage}</span>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
