'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChefHat, UtensilsCrossed, QrCode, ClipboardList, BarChart3, Brain, Download, LogOut, Camera, CreditCard, FileText, MapPin, Sparkles, Plus } from 'lucide-react';
import { GerentePinGuard } from '@/components/shared/GerentePinGuard';

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

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else {
      // Fallback: Si ya está instalada o el navegador no soporta el prompt nativo, abre KDS directamente en nueva pestaña
      window.open(`/${slug}/cocina`, '_blank');
    }
  };

  const links = [
    { href: `/${slug}/cocina`, label: 'Cocina', icon: ChefHat },
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
          {/* PWA Install / KDS Open Button — bottom of sidebar */}
          <button
            onClick={handleInstallPWA}
            title={deferredPrompt ? "Instalar App de Cocina (KDS)" : "Abrir Pantalla de Cocina (KDS)"}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-all text-xs font-bold shadow-sm"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>{deferredPrompt ? 'Descargar KDS' : 'Abrir KDS (Cocina)'}</span>
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
        <GerentePinGuard restaurantId={restaurantId}>
          {children}
        </GerentePinGuard>

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
