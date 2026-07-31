import { ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';

const PLAN = {
  name: 'Plan Pro Único',
  price: '29',
  tagline: 'Todo el poder operativo de Glubbi en un solo plan ilimitado.',
  features: [
    'Menú Digital + Códigos QR/NFC ilimitados',
    'Kitchen Display System (KDS) en tiempo real',
    'Sistema de llamado de meseros sonoro y visual',
    'Agente de Crecimiento con IA (Upselling y Retención)',
    'Base de datos y CRM de clientes de por vida',
    'Impresión de comandas (Cocina/Caja)',
    'Soporte prioritario por WhatsApp y Email',
  ],
};

export function Pricing() {
  return (
    <section id="precios" className="py-24 bg-slate-50 border-t border-slate-100">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border border-orange-100 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Tarifas Claras
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
            Un único plan profesional.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
              Sin comisiones por venta.
            </span>
          </h2>
          <p className="text-slate-600 text-lg">Todos nuestros beneficios en Pro. Sin costos ocultos.</p>
        </div>

        <div className="relative mx-auto max-w-lg">
          {/* Subtle highlight accent background */}
          <div className="absolute -inset-1 bg-orange-500/10 rounded-3xl blur-lg pointer-events-none" />
          
          <div className="relative bg-white border border-slate-150 rounded-3xl p-8 md:p-12 text-center shadow-xl shadow-slate-200/50">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md shadow-orange-500/20 uppercase tracking-wider">
              Acceso Completo
            </span>
            
            <h3 className="text-2xl font-black text-slate-900 mb-2">{PLAN.name}</h3>
            <p className="text-slate-500 text-sm mb-8">{PLAN.tagline}</p>
            
            <div className="flex items-center justify-center gap-1 mb-8">
              <span className="text-3xl text-slate-400 font-semibold">$</span>
              <span className="text-6xl font-black text-slate-900 tracking-tight">{PLAN.price}</span>
              <span className="text-slate-400 mt-4 font-medium">/mes</span>
            </div>
            
            <ul className="space-y-4 mb-10 text-left">
              {PLAN.features.map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-700 text-sm">
                  <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link href="/register" className="w-full block">
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold h-14 rounded-xl text-lg transition-all shadow-md shadow-orange-500/10 active:scale-[0.98]">
                REGÍSTRATE
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
