'use client';

import { useGlubbiStore } from '@/modules/glubbi/stores/glubbi-store';
import { useRouter } from 'next/navigation';
import { 
  Receipt, 
  Ticket, 
  Store, 
  ShieldCheck, 
  FileText, 
  Handshake, 
  LogOut,
  ChevronRight,
  UserCircle,
  MapPin
} from 'lucide-react';
import Link from 'next/link';

export default function GlubbiAccount() {
  const { customer, clearCustomer } = useGlubbiStore();
  const router = useRouter();

  if (!customer) {
    if (typeof window !== 'undefined') router.replace('/glubbi/login');
    return null;
  }

  const menuItems = [
    { title: 'Historial de Pedidos', icon: Receipt, href: '#', color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Mis Cupones', icon: Ticket, href: '#', color: 'text-orange-500', bg: 'bg-orange-50' },
    { title: 'Mis Direcciones', icon: MapPin, href: '/glubbi/cuenta/direcciones', color: 'text-rose-500', bg: 'bg-rose-50' },
    { title: 'Quiero afiliar mi restaurante', icon: Store, href: '/', color: 'text-green-500', bg: 'bg-green-50' },
    { title: 'Alianzas', icon: Handshake, href: '#', color: 'text-purple-500', bg: 'bg-purple-50' },
    { title: 'Términos y Condiciones', icon: FileText, href: '#', color: 'text-gray-500', bg: 'bg-gray-100' },
    { title: 'Políticas de Privacidad', icon: ShieldCheck, href: '#', color: 'text-gray-500', bg: 'bg-gray-100' },
    { title: 'Tratamiento de Datos', icon: ShieldCheck, href: '#', color: 'text-gray-500', bg: 'bg-gray-100' },
  ];

  const handleLogout = () => {
    clearCustomer();
    router.replace('/glubbi/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm border-b border-gray-100 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border-2 border-orange-500/20">
            <UserCircle className="w-10 h-10 text-slate-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{customer.first_name} {customer.last_name}</h1>
            <p className="text-sm text-gray-500">{customer.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">{customer.phone}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Mi Cuenta</h2>
        
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.title} 
                href={item.href}
                className={`flex items-center justify-between p-4 active:bg-slate-50 transition-colors ${
                  index !== menuItems.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.bg}`}>
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <span className="font-semibold text-slate-700">{item.title}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </Link>
            );
          })}
        </div>

        <button 
          onClick={handleLogout}
          className="w-full mt-6 bg-white border border-red-100 text-red-500 font-bold py-4 rounded-2xl shadow-sm hover:bg-red-50 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
