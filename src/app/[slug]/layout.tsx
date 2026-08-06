import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldAlert, Store, ArrowRight, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface SlugLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SlugLayoutProps): Promise<Metadata> {
  const supabase = await createServerSupabaseClient();
  const { slug } = await params;
  
  const { data } = await supabase
    .from('restaurants')
    .select('name, is_active')
    .eq('slug', slug)
    .single();

  const restaurant = data as { name: string; is_active?: boolean } | null;

  if (!restaurant) {
    return { title: 'Restaurante no encontrado' };
  }

  if (!restaurant.is_active) {
    return { title: `${restaurant.name} - No disponible temporalmente` };
  }

  return {
    title: `${restaurant.name} - Pedidos Móviles`,
  };
}

export default async function SlugLayout({ children, params }: SlugLayoutProps) {
  const supabase = await createServerSupabaseClient();
  const { slug } = await params;
 
  const { data } = await supabase
    .from('restaurants')
    .select('id, name, logo_url, brand_color_primary, brand_color_secondary, is_active')
    .eq('slug', slug)
    .single();

  const restaurant = data as any;

  if (!restaurant) {
    notFound();
  }

  // Check if current route is a staff route (/gerente or /cocina)
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isStaffRoute = pathname.includes('/gerente') || pathname.includes('/cocina');

  // If restaurant is suspended (is_active === false) and user is trying to view public menu
  if (!restaurant.is_active && !isStaffRoute) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse" />

        <div className="relative z-10 w-full max-w-lg bg-slate-800/90 border border-slate-700/80 p-8 md:p-10 rounded-3xl backdrop-blur-xl space-y-6 shadow-2xl text-center">
          
          {/* Logo or Icon */}
          <div className="flex justify-center mb-2">
            {restaurant.logo_url ? (
              <img 
                src={restaurant.logo_url} 
                alt={restaurant.name} 
                className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-500/30 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 text-amber-500">
                <Store className="w-10 h-10" />
              </div>
            )}
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert className="w-4 h-4" />
            <span>Establecimiento No Disponible</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {restaurant.name}
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Este restaurante se encuentra <span className="text-amber-400 font-semibold">fuera de servicio temporalmente</span> en la plataforma por motivos de verificación o actualización de servicio.
            </p>
          </div>

          {/* Callout box for management */}
          <div className="bg-slate-900/60 border border-slate-700/80 rounded-2xl p-4 text-left space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-bold">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>¿Eres el propietario o gerente?</span>
            </div>
            <p className="text-slate-400 leading-normal">
              Puedes acceder a tu panel de administración para revisar la información de tu negocio.
            </p>
            <Link
              href={`/${slug}/gerente`}
              className="mt-2 inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-bold transition-colors"
            >
              Ir al Panel de Gerente <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Back button */}
          <div className="pt-2">
            <Link
              href="/glubbi"
              className="inline-block w-full py-3.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md"
            >
              Explorar otros restaurantes en Glubbi
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // Inject CSS variables for white-label styling
  const brandStyle = {
    '--brand-primary': restaurant.brand_color_primary || '#FF6B00',
    '--brand-secondary': restaurant.brand_color_secondary || '#1A1A2E',
  } as React.CSSProperties;

  return (
    <div 
      className="min-h-screen bg-slate-50"
      style={brandStyle}
    >
      {children}
    </div>
  );
}

