'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  UserCheck, 
  UserPlus, 
  Search, 
  Building2, 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  Copy, 
  Check, 
  Loader2, 
  Award,
  TrendingUp
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email?: string;
  code: string;
  is_active: boolean;
  created_at: string;
  salesCount?: number;
}

interface TeamSale {
  id: string;
  team_member_name: string;
  code_used: string;
  restaurant_name: string;
  restaurant_slug?: string;
  contact_name?: string;
  email?: string;
  payment_method: string;
  amount: number;
  referral_source: string;
  status: string;
  created_at: string;
}

export default function VentasEquipoPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [sales, setSales] = useState<TeamSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal / Form state for creating member
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [createError, setCreateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch team members
      const { data: membersData } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });

      // 2. Fetch team sales
      const { data: salesData } = await supabase
        .from('team_sales')
        .select('*')
        .order('created_at', { ascending: false });

      const fetchedMembers = (membersData as any[]) || [];
      const fetchedSales = (salesData as any[]) || [];

      // Calculate sales count per member
      const memberSalesMap: Record<string, number> = {};
      fetchedSales.forEach(s => {
        if (s.code_used) {
          const codeUpper = s.code_used.toUpperCase();
          memberSalesMap[codeUpper] = (memberSalesMap[codeUpper] || 0) + 1;
        }
      });

      const updatedMembers = fetchedMembers.map(m => ({
        ...m,
        salesCount: memberSalesMap[m.code.toUpperCase()] || 0
      }));

      setMembers(updatedMembers);
      setSales(fetchedSales);
    } catch (err) {
      console.error('Error loading team sales data:', err);
    }
    setIsLoading(false);
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!name.trim() || !code.trim()) {
      setCreateError('El nombre y el código son requeridos.');
      return;
    }

    setIsSubmitting(true);
    const formattedCode = code.trim().toUpperCase().replace(/\s+/g, '');

    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          name: name.trim(),
          email: email.trim() || null,
          code: formattedCode,
          is_active: true
        } as any)
        .select()
        .single();

      if (error) {
        if (error.code === '23505' || error.message?.includes('unique')) {
          setCreateError('Este código ya existe. Ingresa uno diferente.');
        } else {
          setCreateError(error.message || 'Error al guardar el miembro.');
        }
        setIsSubmitting(false);
        return;
      }

      // Success
      setName('');
      setEmail('');
      setCode('');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setCreateError(err.message || 'Error inesperado.');
    }
    setIsSubmitting(false);
  };

  const handleCopyCode = (codeToCopy: string) => {
    navigator.clipboard.writeText(codeToCopy);
    setCopiedCode(codeToCopy);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredSales = sales.filter(s => 
    s.team_member_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code_used?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.referral_source?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSalesAmount = sales.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-7 h-7 text-orange-500" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ventas Equipo Glubbi</h1>
          </div>
          <p className="text-sm text-slate-500">
            Asignación de códigos de agentes y registro de afiliaciones B2B por recomendación.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-orange-500/20 transition-all text-sm self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" /> Crear Miembro del Equipo
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Equipo Activo</span>
            <span className="text-3xl font-black text-slate-900">{members.length}</span>
            <span className="text-xs text-slate-500 block mt-1">Agentes con código asignado</span>
          </div>
          <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center text-orange-600">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Afiliaciones</span>
            <span className="text-3xl font-black text-slate-900">{sales.length}</span>
            <span className="text-xs text-slate-500 block mt-1">Empresas ingresadas por código</span>
          </div>
          <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-purple-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Recaudado por Equipo</span>
            <span className="text-3xl font-black text-slate-900">${totalSalesAmount.toFixed(2)}</span>
            <span className="text-xs text-emerald-600 font-semibold block mt-1">Volumen transaccionado</span>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SECTION 1: Miembros del Equipo y Códigos */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-500" /> Miembros del Equipo & Códigos Asignados
          </h2>
          <span className="text-xs font-semibold text-slate-400">{members.length} Miembros</span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
            Cargando miembros del equipo...
          </div>
        ) : members.length === 0 ? (
          <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
            No hay miembros del equipo registrados aún. Haz clic en <strong>"Crear Miembro del Equipo"</strong> para añadir uno.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map(member => (
              <div key={member.id} className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-orange-300 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{member.name}</h3>
                    {member.email && <p className="text-xs text-slate-400">{member.email}</p>}
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    Activo
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block leading-none">Código</span>
                    <span className="font-mono font-black text-orange-600 text-base tracking-wider">{member.code}</span>
                  </div>
                  <button
                    onClick={() => handleCopyCode(member.code)}
                    className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-slate-50 rounded-lg transition-all"
                    title="Copiar Código"
                  >
                    {copiedCode === member.code ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-200/50 pt-2">
                  <span>Afiliaciones: <strong>{member.salesCount || 0}</strong></span>
                  <span className="text-[11px] text-slate-400">Creado: {new Date(member.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Histórico de Afiliaciones por Código */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" /> Histórico de Empresas Afiliadas por Código
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Ventas registradas asociadas a miembros del equipo de Glubbi.</p>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input 
              type="text"
              placeholder="Buscar por cliente, código o miembro..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {filteredSales.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            {sales.length === 0 ? 'No hay registro de ventas por código aún.' : 'No se encontraron resultados para tu búsqueda.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Miembro del Equipo</th>
                  <th className="py-3 px-4">Empresa Afiliada</th>
                  <th className="py-3 px-4">Fecha Afiliación</th>
                  <th className="py-3 px-4">Forma de Pago</th>
                  <th className="py-3 px-4 text-right">Monto</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Miembro del equipo / Código */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{sale.team_member_name || 'Agente Glubbi'}</div>
                      <span className="font-mono text-[11px] bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded font-bold inline-block mt-0.5">
                        {sale.code_used || 'S/N'}
                      </span>
                    </td>

                    {/* Empresa Afiliada */}
                    <td className="py-4 px-4">
                      <div className="font-extrabold text-slate-900 text-sm">{sale.restaurant_name}</div>
                      {sale.contact_name && <div className="text-[11px] text-slate-400">Contacto: {sale.contact_name}</div>}
                    </td>

                    {/* Fecha */}
                    <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                      {new Date(sale.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    {/* Forma de Pago */}
                    <td className="py-4 px-4">
                      {sale.payment_method === 'LEMON' || sale.payment_method === 'stripe' ? (
                        <span className="inline-flex items-center gap-1 font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                          <CreditCard className="w-3.5 h-3.5" /> LEMON
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          <Smartphone className="w-3.5 h-3.5" /> PAGO MÓVIL
                        </span>
                      )}
                    </td>

                    {/* Monto */}
                    <td className="py-4 px-4 text-right font-black text-slate-900 text-sm">
                      ${Number(sale.amount || 29).toFixed(2)}
                    </td>

                    {/* Estado */}
                    <td className="py-4 px-4 text-center">
                      <span className="bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full text-[10px] uppercase">
                        ✅ Completado
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE MEMBER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 animate-fade-in relative">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-orange-500" /> Crear Miembro del Equipo
            </h2>
            <p className="text-xs text-slate-500">
              Asigna un código personalizado único para rastrear las ventas de este agente de ventas.
            </p>

            {createError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-xs font-semibold">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo del Agente *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Carlos Mendoza"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email del Agente (Opcional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ejemplo@glubbi.app"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Código Personalizado Único *</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="Ej: CARLOS10"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-orange-600 uppercase focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl py-3 text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl py-3 text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Agente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
