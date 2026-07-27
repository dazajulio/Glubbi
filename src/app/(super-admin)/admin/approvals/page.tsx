'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Search, CheckCircle, XCircle, FileText, AlertCircle, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ApprovalsPage() {
  const supabase = createClient();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKyc, setSelectedKyc] = useState<any | null>(null);

  useEffect(() => {
    fetchPendingKyc();
  }, [supabase]);

  const fetchPendingKyc = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('restaurants')
      .select('id, name, email, phone, kyc_status, business_type, kyc_documents, created_at')
      .eq('kyc_status', 'pending_review')
      .order('created_at', { ascending: true });
      
    if (data) setRestaurants(data);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    await supabase.from('restaurants').update({ kyc_status: 'verified' }).eq('id', id);
    alert('Restaurante Aprobado. Ya es público.');
    setSelectedKyc(null);
    fetchPendingKyc();
  };

  const handleReject = async (id: string) => {
    // Para simplificar, lo pasamos a unverified (needs_info) para que vuelva a subir los documentos.
    await supabase.from('restaurants').update({ kyc_status: 'unverified' }).eq('id', id);
    alert('Solicitud rechazada. Se le pedirá que suba los documentos de nuevo.');
    setSelectedKyc(null);
    fetchPendingKyc();
  };

  const filtered = restaurants.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="bg-white shadow-md p-6 border border-gray-200 rounded-3xl backdrop-blur-xl flex flex-col md:flex-row gap-4 justify-between md:items-center">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Aprobaciones KYC (Compliance)
          </h2>
          <p className="text-xs text-gray-400">
            Revisa los documentos de identidad para prevenir fraudes en el ecosistema.
          </p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar solicitud..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-800 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* List */}
          <div className="md:col-span-1 space-y-4">
            <h3 className="font-bold text-gray-900 px-2 flex items-center justify-between">
              En Espera <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">{filtered.length}</span>
            </h3>
            <div className="space-y-2">
              {filtered.length > 0 ? filtered.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedKyc(r)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedKyc?.id === r.id ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-500/20' : 'bg-white border-gray-200 hover:border-orange-200 shadow-sm'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-gray-900 truncate">{r.name}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                      {r.business_type === 'formal' ? 'Empresa' : 'Informal'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{r.email}</div>
                  <div className="text-[10px] text-gray-400 mt-2">Hace 2 horas</div>
                </button>
              )) : (
                <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 border-dashed">
                  <ShieldCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-bold">Todo al día</p>
                  <p className="text-[10px] text-gray-400">No hay restaurantes pendientes de validación.</p>
                </div>
              )}
            </div>
          </div>

          {/* Details Panel */}
          <div className="md:col-span-2">
            {selectedKyc ? (
              <div className="bg-white rounded-3xl border border-gray-200 shadow-md p-6 space-y-6">
                <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">{selectedKyc.name}</h2>
                    <p className="text-gray-500 text-sm flex items-center gap-2">
                      {selectedKyc.email} | {selectedKyc.phone || 'Sin teléfono'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${selectedKyc.business_type === 'formal' ? 'bg-indigo-50 text-indigo-700' : 'bg-fuchsia-50 text-fuchsia-700'}`}>
                    {selectedKyc.business_type === 'formal' ? 'Empresa Registrada' : 'Emprendedor'}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Docs view */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-400" /> Documentos Adjuntos
                    </h3>
                    <div className="space-y-3">
                      <div className="p-4 border border-gray-200 rounded-xl bg-slate-50 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-gray-700">{selectedKyc.business_type === 'formal' ? 'Acta Constitutiva' : 'Cédula / Pasaporte'}</p>
                          <p className="text-xs text-gray-500">Documento principal</p>
                        </div>
                        <button className="text-orange-500 hover:bg-orange-50 p-2 rounded-lg transition-colors">
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-xl bg-slate-50 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-gray-700">{selectedKyc.business_type === 'formal' ? 'RIF / RUT' : 'Prueba de Funcionamiento'}</p>
                          <p className="text-xs text-gray-500">Documento secundario</p>
                        </div>
                        <button className="text-orange-500 hover:bg-orange-50 p-2 rounded-lg transition-colors">
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Liveness view */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-gray-400" /> Liveness (Prueba de Vida)
                    </h3>
                    <div className="bg-slate-900 rounded-2xl p-4 flex flex-col items-center justify-center aspect-square relative overflow-hidden">
                      {selectedKyc.kyc_documents?.liveness ? (
                        <div className="w-full h-full flex flex-col items-center justify-center space-y-4 text-center">
                          <CheckCircle className="w-12 h-12 text-green-500" />
                          <p className="text-white font-bold text-sm">Prueba capturada</p>
                          <p className="text-gray-400 text-xs px-4">El sistema detectó un rostro y un entorno real (Liveness OK). Ver foto original adjunta en bucket.</p>
                        </div>
                      ) : (
                        <div className="text-center space-y-2">
                          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                          <p className="text-white font-bold text-sm">Sin Liveness</p>
                          <p className="text-gray-400 text-xs">No se completó el escaneo de rostro.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-6 border-t border-gray-100">
                  <button 
                    onClick={() => handleReject(selectedKyc.id)}
                    className="flex-1 py-3 px-4 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" /> Rechazar / Pedir de nuevo
                  </button>
                  <button 
                    onClick={() => handleApprove(selectedKyc.id)}
                    className="flex-1 py-3 px-4 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 shadow-md shadow-green-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" /> Aprobar y Hacer Público
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-12 text-center h-full flex flex-col items-center justify-center">
                <ShieldCheck className="w-16 h-16 text-gray-200 mb-4" />
                <h3 className="text-xl font-bold text-gray-400">Selecciona una solicitud</h3>
                <p className="text-gray-400 text-sm mt-2 max-w-sm mx-auto">
                  Haz clic en un restaurante de la lista izquierda para revisar sus documentos y aprobar su activación.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
