import { ChefHat, Printer, CreditCard, Layers, Sparkles } from 'lucide-react';

export function FeaturesKDS() {
  return (
    <section className="py-24 bg-slate-50 border-b border-slate-100 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border border-orange-100 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Infraestructura Operativa
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Control operativo de extremo a extremo:
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
              KDS, Impresiones y Pagos
            </span>
          </h2>
          <p className="text-lg text-slate-600 mt-6 leading-relaxed">
            Elimina las fallas humanas en tu restaurante. Glubbi conecta todos los puntos clave de tu local en tiempo real con una interfaz fluida e intuitiva.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Card 1: KDS */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100 mb-6">
              <ChefHat className="w-6 h-6" />
            </div>
            <h3 className="text-slate-900 font-bold text-xl mb-3">Kitchen Display System</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Pantalla de cocina reactiva que organiza los pedidos por urgencia y tiempo transcurrido. Menos gritos en la cocina, más platos preparados a tiempo.
            </p>
          </div>

          {/* Card 2: Print */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100 mb-6">
              <Printer className="w-6 h-6" />
            </div>
            <h3 className="text-slate-900 font-bold text-xl mb-3">Impresión de comandas</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Imprime en un clic la comanda de tus pedidos entrantes con todos los detalles para cocina y caja.
            </p>
          </div>

          {/* Card 3: Payments */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100 mb-6">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-slate-900 font-bold text-xl mb-3">Pasarela de Pagos</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Recibe pagos de manera digital e integrada mediante Lemon Squeezy, Pago Móvil o registra transacciones en efectivo en caja desde el panel central.
            </p>
          </div>

          {/* Card 4: Multi-tenant */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 mb-6">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-slate-900 font-bold text-xl mb-3">Arquitectura Multitenant</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Diseñado para operar cadenas o locales individuales aislados de forma segura mediante Row Level Security (RLS) en la base de datos cloud de PostgreSQL.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
