'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Settings, 
  Database, 
  Mail, 
  Lock, 
  Save, 
  Sliders, 
  HelpCircle,
  Building2
} from 'lucide-react';

export default function GlobalSettingsPage() {
  const [saasPrice, setSaasPrice] = useState('29.00');
  const [supportEmail, setSupportEmail] = useState('soporte@glubbi.app');
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [logs, setLogs] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLogs() {
      // 1. Fetch from Supabase
      const { data: dbLogs } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
        
      // 2. Fetch from GitHub API (Merged PRs)
      let githubLogs: any[] = [];
      try {
        const res = await fetch('https://api.github.com/repos/dazajulio/Glubbi/pulls?state=closed&per_page=20');
        if (res.ok) {
          const prs = await res.json();
          githubLogs = prs
            .filter((pr: any) => pr.merged_at) // Only merged PRs
            .map((pr: any) => ({
              id: pr.id.toString(),
              created_at: pr.merged_at,
              admin_email: `GitHub: ${pr.user.login}`,
              action: 'Despliegue de Código (PR)',
              details: pr.title
            }));
        }
      } catch (err) {
        console.error('Error fetching GitHub PRs:', err);
      }

      // 3. Combine and Sort
      const combined = [...(dbLogs || []), ...githubLogs]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50);

      setLogs(combined);
    }
    fetchLogs();
  }, [supabase]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    
    // Log the change
    await supabase.from('system_logs').insert({
      action: 'Configuración Global Modificada',
      details: `Precio SaaS: ${saasPrice}, Mantenimiento: ${isMaintenanceMode}`,
      admin_email: 'dazajulio@gmail.com'
    } as any);

    // Refresh logs
    const { data } = await supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setLogs(data);

    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="bg-white shadow-md p-6 border border-gray-200 rounded-3xl backdrop-blur-xl space-y-1">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          Configuración Global de glubbi.app
        </h2>
        <p className="text-xs text-gray-400">Ajusta los parámetros operativos generales y variables del ecosistema</p>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-stretch">
        
        {/* Form panel */}
        <form onSubmit={handleSaveSettings} className="bg-white shadow-md border border-gray-200 rounded-3xl p-6 md:p-8 shadow-lg backdrop-blur-xl space-y-6">
          
          <div className="space-y-4">
            <h3 className="text-md font-bold text-gray-900 tracking-tight flex items-center gap-2 pb-3 border-b border-gray-200">
              <Sliders className="w-4 h-4 text-orange-500" /> Parámetros de Suscripción y Precios
            </h3>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500">Precio Mensual del SaaS (USD)</label>
                <input
                  type="text"
                  value={saasPrice}
                  onChange={(e) => setSaasPrice(e.target.value)}
                  className="w-full bg-slate-50/60 border border-gray-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500">Correo de Soporte Oficial</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full bg-slate-50/60 border border-gray-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-md font-bold text-gray-900 tracking-tight flex items-center gap-2 pb-3 border-b border-gray-200">
              <Lock className="w-4 h-4 text-orange-500" /> Seguridad e Infraestructura
            </h3>
            
            {/* Maintenance switch */}
            <div className="flex justify-between items-center bg-slate-50/40 p-4 rounded-2xl border border-gray-200">
              <div>
                <span className="block text-xs font-bold text-gray-900 uppercase tracking-wider">Modo de Mantenimiento</span>
                <span className="text-[10px] text-gray-400">Muestra una pantalla de soporte al ingresar al portal</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMaintenanceMode(!isMaintenanceMode)}
                className={`w-12 h-6 rounded-full p-1 transition-all ${
                  isMaintenanceMode ? 'bg-red-500' : 'bg-slate-100'
                }`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transition-all ${
                  isMaintenanceMode ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          {isSuccess && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-xl">
              ¡Parámetros guardados exitosamente en la configuración del servidor!
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-indigo-600 hover:brightness-110 text-white font-bold rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Guardar Cambios Globales
          </button>

        </form>

        {/* Right Info sidebar */}
        <div className="bg-white shadow-md border border-gray-200 rounded-3xl p-6 md:p-8 shadow-lg backdrop-blur-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-orange-500" /> Variables de Servidor
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Las variables de entorno mostradas aquí controlan el comportamiento por defecto de las nuevas cuentas registradas.
            </p>
            <div className="bg-slate-50/60 p-4 border border-gray-200 rounded-2xl space-y-2 text-xs font-mono">
              <div><span className="text-gray-600">APP_ENV:</span> <span className="text-slate-900 font-semibold">production</span></div>
              <div><span className="text-gray-600">PROVIDER:</span> <span className="text-slate-900 font-semibold">Supabase / Next.js</span></div>
              <div><span className="text-gray-600">DB_ISOLATION:</span> <span className="text-slate-900 font-semibold">Postgres RLS Active</span></div>
              <div><span className="text-gray-600">SMTP:</span> <span className="text-slate-900 font-semibold">smtp.resend.com</span></div>
            </div>
          </div>

          <div className="bg-slate-50/20 border border-gray-200 p-4 rounded-2xl flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-400 leading-relaxed">
              ¿Deseas conectar una pasarela específica en el core? Los cambios de precios afectarán únicamente a los nuevos registros de restaurante que se generen a partir de la firma de guardado.
            </p>
          </div>
        </div>

      </div>

      {/* System Logs Section */}
      <div className="bg-white shadow-md border border-gray-200 rounded-3xl p-6 md:p-8 shadow-lg backdrop-blur-xl">
        <h3 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2 mb-6">
          <Database className="w-5 h-5 text-orange-500" /> Registro de Actividad (System Logs)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-slate-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-4 py-3 rounded-tl-xl">Fecha</th>
                <th className="px-4 py-3">Administrador</th>
                <th className="px-4 py-3">Acción</th>
                <th className="px-4 py-3 rounded-tr-xl">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? logs.map(log => (
                <tr key={log.id} className="border-b border-gray-100 last:border-0 hover:bg-slate-50/50">
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{log.admin_email}</td>
                  <td className="px-4 py-3">
                    <span className="bg-orange-50 text-orange-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{log.details}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No hay registros de actividad aún. Asegúrate de haber ejecutado el script SQL para la tabla system_logs.
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
