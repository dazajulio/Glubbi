'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Cpu, Users, CreditCard, Settings, LayoutDashboard, Building2, Mail, LogOut, Smartphone, Tag, ShieldCheck, UserCheck, Sparkles, Search, Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/tenants', label: 'Clientes', icon: Building2 },
    { href: '/admin/posicionamiento', label: 'Posicionamiento (Ads)', icon: Sparkles },
    { href: '/admin/ventas-equipo', label: 'Ventas Equipo', icon: UserCheck },
    { href: '/admin/users', label: 'Usuarios', icon: Users },
    { href: '/admin/emails', label: 'Correos', icon: Mail },
    { href: '/admin/billing', label: 'Facturación', icon: CreditCard },
    { href: '/admin/pagos-moviles', label: 'Pagos Móviles', icon: Smartphone },
    { href: '/admin/cupones', label: 'Cupones', icon: Tag },
    { href: '/admin/customers', label: 'Base de Usuarios', icon: Users },
    { href: '/admin/approvals', label: 'Aprobaciones KYC', icon: ShieldCheck },
    { href: '/admin/settings', label: 'Configuración Global', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-slate-900 font-sans flex flex-col md:flex-row">
      {/* ── DARK CHARCOAL GRAPHITE SIDEBAR ── */}
      <aside className="w-full md:w-64 border-r border-slate-800 bg-[#1E222A] p-6 flex flex-col shrink-0 text-slate-300">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-orange-500/30">
            G
          </div>
          <span className="text-xl font-black tracking-tight text-white">Glubbi<span className="text-orange-500">.app</span></span>
          <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full ml-auto uppercase tracking-wider font-bold">Admin</span>
        </div>

        <nav className="space-y-1.5 flex-1 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive 
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 font-extrabold' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="pt-5 border-t border-slate-800 space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-xs shadow-md">
              JD
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">Julio Daza</p>
              <p className="text-[10px] text-slate-400 truncate">Super Admin</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-white hover:bg-red-500/20 border border-red-500/20 transition-all active:scale-[0.98]"
          >
            <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT CANVAS ── */}
      <main className="flex-1 min-h-screen overflow-y-auto bg-[#F4F5F8]">
        <header className="h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-black text-slate-900">Centro de Comando</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sistemas Operativos 100%
            </div>
          </div>
        </header>
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
