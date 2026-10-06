'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChefHat, UtensilsCrossed, QrCode, ClipboardList, BarChart3, Brain, Download, LogOut, Camera, CreditCard, FileText, MapPin, Sparkles, Plus, Monitor, ExternalLink, Check, Copy } from 'lucide-react';
import { GerentePinGuard } from '@/components/shared/GerentePinGuard';
import { ProcessErrorBoundary } from '@/components/shared/ProcessErrorBoundary';

export default function GerenteLayout({ 
  children,
  params
}: { 
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const pathname = usePathname();
  const [restaurantName, setRestaurantName] = useState('Cargando...');
  const [restaurantLogo, setRestaurantLogo] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string>('');

  useEffect(() => {
    async function fetchRestaurant() {
      const supabase = createClient();
      
      const { data } = await supabase
        .from('restaurants')
        .select('id, name, logo_url, is_first_login')
        .eq('slug', slug)
        .single();
      
      if (data) {
        setRestaurantId(data.id);
        localStorage.setItem('active_restaurant_id', data.id);
        setRestaurantName(data.name);
        setRestaurantLogo(data.logo_url);
      } else {
        setRestaurantName('Dashboard');
      }
    }
    if (slug) {
      fetchRestaurant();
    }
  }, [slug]);

  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<{ isWindows: boolean; isIOS: boolean; isAndroid: boolean; isMac: boolean }>({
    isWindows: false,
    isIOS: false,
    isAndroid: false,
    isMac: false,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent || '';
      const isWin = /windows/i.test(ua);
      const isApple = /ipad|iphone|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isAnd = /android/i.test(ua);
      const isMacOs = /macintosh|mac os x/i.test(ua) && !isApple;
      setDeviceInfo({
        isWindows: isWin,
        isIOS: isApple,
        isAndroid: isAnd,
        isMac: isMacOs,
      });
    }
  }, []);

  const handleDownloadShortcut = () => {
    const kdsUrl = `${window.location.origin}/${slug}/cocina`;
    const iconUrl = `${window.location.origin}/favicon.ico`;
    // Create standard Windows Internet Shortcut (.url) referencing the Glubbi icon
    const content = `[InternetShortcut]\r\nURL=${kdsUrl}\r\nIDList=\r\nHotKey=0\r\nIconFile=${iconUrl}\r\nIconIndex=0\r\n[{000214A0-0000-0000-C000-000000000046}]\r\nProp3=19,11\r\n`;
    const blob = new Blob([content], { type: 'application/x-mswinurl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Glubbi KDS (${slug}).url`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyKdsLink = () => {
    const kdsUrl = `${window.location.origin}/${slug}/cocina`;
    navigator.clipboard.writeText(kdsUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const links = [
    { href: `/${slug}/gerente/menu`, label: 'Menú', icon: UtensilsCrossed },
    { href: `/${slug}/gerente/history`, label: 'Registro', icon: ClipboardList },
    { href: `/${slug}/gerente/settings`, label: 'Administrador', icon: BarChart3 },
    { href: `/${slug}/gerente/promocionar`, label: 'Impulsar Negocio (Ads)', icon: Sparkles },
    { href: `/${slug}/gerente/delivery`, label: 'Zonas de Envío', icon: MapPin },
    { href: `/${slug}/gerente/reportes`, label: 'Reportes', icon: FileText },
    { href: `/${slug}/gerente/horarios`, label: 'Horarios', icon: ClipboardList },
    { href: `/${slug}/gerente/qr`, label: 'Códigos QR', icon: QrCode },
    { href: `/${slug}/gerente/guia-visual`, label: 'Guía Visual', icon: Camera },
    { href: `/${slug}/gerente/ai`, label: 'Agente IA', icon: Brain },
    { href: `/${slug}/gerente/suscripcion`, label: 'Suscripción', icon: CreditCard },
    { href: `/${slug}/gerente/account`, label: 'Configuración de la Cuenta', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F8] flex flex-col md:flex-row text-slate-900 font-sans">
      {/* Sidebar (Desktop Dark Charcoal Graphite) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-[#1E222A] p-6 text-slate-300 shrink-0">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 overflow-hidden shrink-0">
            {restaurantLogo ? (
              <img src={restaurantLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <ChefHat className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-white text-base leading-tight truncate">{restaurantName}</h1>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Panel de Gerente</span>
          </div>
        </div>
        
        <nav className="space-y-1.5 flex-1 overflow-y-auto pr-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive 
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 font-extrabold' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 space-y-2 border-t border-slate-800">
          {/* Autoinicio KDS PC Button — bottom of sidebar */}
          <button
            onClick={() => setShowDownloadModal(true)}
            title="Configurar Autoinicio de Cocina (KDS) en PC"
            className="w-full flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all"
          >
            <Monitor className="w-4 h-4 shrink-0" />
            <span>🖥️ Autoinicio KDS en PC</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={async () => {
              sessionStorage.removeItem(`gerente_auth_${restaurantId}`);
              window.location.href = `/${slug}/welcome`;
            }}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs font-bold"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 bg-[#F4F5F8] min-h-screen overflow-y-auto pb-24 md:pb-0 relative">
        
        {/* Mobile Header with Quick KDS Access */}
        <div className="md:hidden bg-[#1E222A] text-white p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center overflow-hidden shrink-0">
              {restaurantLogo ? (
                <img src={restaurantLogo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <ChefHat className="w-5 h-5 text-white" />
              )}
            </div>
            <span className="font-extrabold text-sm truncate max-w-[160px]">{restaurantName}</span>
          </div>
          <button
            onClick={() => setShowDownloadModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-[11px] shadow-sm active:scale-95 transition-all"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Autoinicio KDS</span>
          </button>
        </div>

        <ProcessErrorBoundary restaurantId={restaurantId} fallbackTitle="Inconveniente temporal al cargar el panel de gerente">
          <GerentePinGuard restaurantId={restaurantId}>
            {children}
          </GerentePinGuard>
        </ProcessErrorBoundary>

        {/* Modal Autoinicio KDS */}
        {showDownloadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1E222A] border border-slate-800 text-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0 shadow-md">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base md:text-lg text-white">Autoinicio KDS en PC</h3>
                    <p className="text-xs text-slate-400">Terminal de Cocina Autónomo (Inicio Automático)</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDownloadModal(false)}
                  className="text-slate-400 hover:text-white text-sm px-2.5 py-1.5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="p-3.5 bg-slate-900/70 rounded-2xl border border-slate-800/80 space-y-1.5">
                  <p className="font-bold text-orange-400 flex items-center gap-1.5 text-xs">
                    ⚡ Inicio Automático al Encender el Computador
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Al configurar el autoinicio, la pantalla de comandas de cocina (KDS) se abrirá <strong>automáticamente en tu navegador cada vez que enciendas la PC</strong> del restaurante o cocina, sin tener que buscar la página ni recordar enlaces.
                  </p>
                </div>

                {/* Botón Principal de Descarga de Acceso Directo */}
                <button
                  onClick={handleDownloadShortcut}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-2xl font-bold shadow-lg shadow-orange-500/25 transition-all group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <Download className="w-5 h-5 text-white animate-bounce" />
                    </div>
                    <div className="text-left">
                      <span className="block text-sm font-black">Descargar Acceso Directo (.url)</span>
                      <span className="block text-[11px] text-orange-100 font-normal">Archivo preparado para inicio automático en Windows</span>
                    </div>
                  </div>
                  <span className="text-xs bg-white/20 px-3 py-1.5 rounded-xl group-hover:bg-white/30 shrink-0 font-extrabold">
                    Descargar
                  </span>
                </button>

                {/* Guía Paso a Paso para Windows Startup */}
                <div className="p-4 bg-slate-900/70 rounded-2xl border border-slate-800 space-y-3">
                  <p className="font-bold text-xs text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                    <span>Pasos para activar el autoinicio en Windows (1 minuto):</span>
                  </p>

                  <div className="space-y-2.5 text-[11px] text-slate-300">
                    <div className="flex items-start gap-2.5 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                      <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                      <div>
                        <strong>Descarga el acceso:</strong> Haz clic en el botón naranja superior para descargar <code>Glubbi KDS ({slug}).url</code>.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                      <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                      <div>
                        <strong>Abre la carpeta de inicio:</strong> En tu teclado presiona las teclas <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-orange-400 font-mono text-[10px]">Win + R</kbd>, escribe <code className="text-amber-300 font-mono font-bold">shell:startup</code> y presiona <strong>Enter</strong> (o Aceptar).
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                      <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                      <div>
                        <strong>Pega o arrastra el archivo:</strong> Mueve el archivo descargado a esa carpeta abierta. ¡Listo! A partir de ahora, cada vez que enciendas la PC, Glubbi KDS se abrirá solo.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acciones Secundarias: Abrir ahora / Tablet */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <a
                    href={`/${slug}/cocina`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl font-bold text-xs transition-all text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span>Abrir KDS en el navegador</span>
                  </a>

                  <button
                    onClick={handleCopyKdsLink}
                    className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl font-bold text-xs transition-all"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-emerald-400">¡Enlace Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Copiar Link para Tablet</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-400 flex items-start gap-2">
                  <span className="text-sm">🔔</span>
                  <div>
                    <strong>Alarma Sonora en Cocina:</strong> Al abrir el KDS, presiona <em>"Iniciar Turno"</em> para que la pantalla se mantenga encendida y suene la alarma ante cada nuevo pedido.
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-800 pt-4">
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Button (FAB +) - Quick Action shortcut */}
        <Link 
          href={`/${slug}/gerente/promocionar`}
          className="hidden md:flex fixed bottom-8 right-8 z-40 w-14 h-14 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full items-center justify-center shadow-xl shadow-orange-500/40 hover:scale-110 active:scale-95 transition-all group"
          title="Impulsar Negocio con Glubbi Ads"
        >
          <Sparkles className="w-6 h-6 animate-pulse" />
        </Link>
      </main>

      {/* Bottom Nav (Mobile Dark Theme) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-[#1E222A] text-slate-300 pb-safe z-50">
        <nav className="flex justify-around p-2 overflow-x-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center p-2 rounded-lg min-w-[64px] ${
                  isActive ? 'text-orange-500 font-bold' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-[10px] truncate max-w-[60px]">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
