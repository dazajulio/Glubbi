'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChefHat, UtensilsCrossed, QrCode, ClipboardList, BarChart3, Brain, Download, LogOut, Camera, CreditCard, FileText, MapPin, Sparkles, Plus } from 'lucide-react';
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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

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

    // Register Service Worker for PWA
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('Service Worker registrado con éxito:', reg.scope))
        .catch((err) => console.error('Error al registrar Service Worker:', err));
    }

    // Capture PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Inject dynamic manifest for KDS
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    const originalManifest = manifestLink?.href;
    
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = `/api/manifest/kds?slug=${slug}`;

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if (manifestLink && originalManifest) {
        manifestLink.href = originalManifest;
      }
    };
  }, [slug]);

  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const handleDownloadShortcut = () => {
    const kdsUrl = `${window.location.origin}/${slug}/cocina`;
    // Create Windows Standalone App Launcher (.cmd) opening Edge/Chrome in --app mode with Glubbi KDS title
    const content = `@echo off\r\ntitle Glubbi KDS\r\necho Cargando Glubbi KDS en ventana nativa...\r\nstart msedge --app="${kdsUrl}" || start chrome --app="${kdsUrl}"\r\n`;
    const blob = new Blob([content], { type: 'application/x-msdos-program' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Glubbi KDS.cmd`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else {
      handleDownloadShortcut();
    }
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
          {/* Descargar KDS Button — bottom of sidebar */}
          <button
            onClick={() => setShowDownloadModal(true)}
            title="Descargar Acceso Directo de Cocina (KDS)"
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-all text-xs font-bold shadow-sm"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Descargar KDS</span>
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
      <main className="flex-1 bg-[#F4F5F8] min-h-screen overflow-y-auto pb-20 md:pb-0 relative">
        <ProcessErrorBoundary restaurantId={restaurantId} fallbackTitle="Inconveniente temporal al cargar el panel de gerente">
          <GerentePinGuard restaurantId={restaurantId}>
            {children}
          </GerentePinGuard>
        </ProcessErrorBoundary>

        {/* Modal Descargar KDS */}
        {showDownloadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1E222A] border border-slate-800 text-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-orange-500/40 flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-md">
                    <img src="/logo-glubbi.png" alt="Glubbi Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">Descargar Glubbi KDS</h3>
                    <p className="text-xs text-slate-400">Acceso exclusivo en ventana nativa para caja y cocina</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDownloadModal(false)}
                  className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-white/10"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                  <p className="font-bold text-orange-400 flex items-center gap-1.5">
                    🛡️ Acceso Aislado de Seguridad
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Este ejecutable abre <strong>únicamente la pantalla de cocina (Glubbi KDS)</strong>. Los empleados no tendrán acceso al área de gerencia ni a datos administrativos.
                  </p>
                </div>

                <div className="space-y-3">
                  {deferredPrompt && (
                    <button
                      onClick={() => {
                        handleInstallPWA();
                        setShowDownloadModal(false);
                      }}
                      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/logo-glubbi.png" alt="Glubbi" className="w-6 h-6 object-contain" />
                        <div className="text-left">
                          <span className="block text-sm">Instalar PWA Nativa (Glubbi KDS)</span>
                          <span className="block text-[10px] text-orange-100 font-normal">Registra la aplicación oficial con el ícono "G" en Windows</span>
                        </div>
                      </div>
                      <span className="text-xs bg-white/20 px-2.5 py-1 rounded-lg group-hover:bg-white/30">Instalar</span>
                    </button>
                  )}

                  <button
                    onClick={handleDownloadShortcut}
                    className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl font-bold transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Download className="w-5 h-5 text-orange-400" />
                      <div className="text-left">
                        <span className="block text-sm">Descargar Lanzador Ejecutable (Glubbi KDS.cmd)</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Abre Glubbi KDS en ventana independiente (sin pestañas ni barra URL)</span>
                      </div>
                    </div>
                    <span className="text-xs bg-orange-500/20 text-orange-400 px-2.5 py-1 rounded-lg group-hover:bg-orange-500/30">Descargar</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 space-y-2">
                  <p className="font-bold text-xs text-white">⚡ Instrucciones para Auto-Inicio con Windows:</p>
                  <ol className="list-decimal list-inside text-[11px] text-slate-400 space-y-1">
                    <li>Descarga el ejecutable <strong>Glubbi KDS.cmd</strong> o instala la PWA.</li>
                    <li>Presiona <code>Win + R</code>, escribe <code>shell:startup</code> y presiona Enter.</li>
                    <li>Copia el archivo descargado a esa carpeta para que <strong>Glubbi KDS</strong> cargue automáticamente al encender la PC.</li>
                  </ol>
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-800 pt-4">
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl"
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
