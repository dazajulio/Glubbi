'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Cpu, Users, CreditCard, Settings, LayoutDashboard, Building2, Mail, LogOut, Smartphone, Tag, ShieldCheck } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans flex flex-col md:flex-row">
      {/* ── SIDEBAR ── */}
      <aside className="w-full md:w-64 border-r border-gray-200 bg-white p-6 flex flex-col shrink-0">
        <div className="flex items-center gap-2 mb-12">
          <Cpu className="w-6 h-6 text-orange-500" />
          <span className="text-xl font-bold tracking-tight text-gray-900">Glubbi<span className="text-orange-500">.app</span></span>
          <span className="text-[10px] bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-full ml-auto uppercase tracking-wider font-bold">Admin</span>
        </div>

        <nav className="space-y-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActive 
                    ? 'bg-orange-500/10 text-orange-600 font-bold' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="pt-6 border-t border-gray-200 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold">
              JD
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Julio Daza</p>
              <p className="text-xs text-gray-500">Super Admin</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 transition-all active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        <header className="h-16 border-b border-gray-200 bg-white px-8 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-gray-900">Centro de Comando</h1>
          <div className="flex items-center gap-4">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Sistemas Operativos"></span>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
