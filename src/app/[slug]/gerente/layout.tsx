'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChefHat, UtensilsCrossed, QrCode, ClipboardList, BarChart3, Brain, Download, LogOut, Camera, CreditCard, FileText } from 'lucide-react';
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
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const links = [
    { href: `/${slug}/cocina`, label: 'Cocina', icon: ChefHat },
    { href: `/${slug}/gerente/menu`, label: 'Menú', icon: UtensilsCrossed },
    { href: `/${slug}/gerente/history`, label: 'Registro', icon: ClipboardList },
    { href: `/${slug}/gerente/settings`, label: 'Administrador', icon: BarChart3 },
    { href: `/${slug}/gerente/reportes`, label: 'Reportes', icon: FileText },
    { href: `/${slug}/gerente/horarios`, label: 'Horarios', icon: ClipboardList },
    { href: `/${slug}/gerente/qr`, label: 'Códigos QR', icon: QrCode },
    { href: `/${slug}/gerente/guia-visual`, label: 'Guía Visual', icon: Camera },
    { href: `/${slug}/gerente/ai`, label: 'Agente IA', icon: Brain },
    { href: `/${slug}/gerente/suscripcion`, label: 'Suscripción', icon: CreditCard },
    { href: `/${slug}/gerente/account`, label: 'Configuración de la Cuenta', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row gerente-light-theme">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 bg-slate-50 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 overflow-hidden shrink-0">
            {restaurantLogo ? (
              <img src={restaurantLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <ChefHat className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-gray-900 text-lg leading-tight truncate">{restaurantName}</h1>
            <span className="text-xs text-gray-400 truncate block">Dashboard</span>
          </div>
        </div>
        
        <nav className="space-y-2 flex-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-orange-500/10 text-orange-500 font-medium' 
                    : 'text-gray-500 hover:text-white hover:bg-white shadow-sm'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-orange-500' : 'text-gray-400'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 space-y-2">
          {/* PWA Install Button — bottom of sidebar */}
          {deferredPrompt && (
            <button
              onClick={handleInstallPWA}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all text-sm font-semibold shadow-sm"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Descargar KDS</span>
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={async () => {
              sessionStorage.removeItem(`gerente_auth_${restaurantId}`);
              window.location.href = `/${slug}/welcome`;
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-transparent transition-all text-sm font-semibold"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-white shadow-sm min-h-screen overflow-y-auto pb-20 md:pb-0 relative">
        <GerentePinGuard restaurantId={restaurantId}>
          {children}
        </GerentePinGuard>
      </main>

      {/* Bottom Nav (Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-slate-50 pb-safe z-50">
        <nav className="flex justify-around p-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center p-2 rounded-lg min-w-[72px] ${
                  isActive ? 'text-orange-500' : 'text-gray-500'
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
