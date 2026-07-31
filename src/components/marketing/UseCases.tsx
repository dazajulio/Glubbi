import { Zap, Utensils, ShoppingBag, Pill, Store, Building2, Sparkles } from 'lucide-react';

export function UseCases() {
  return (
    <section id="casos" className="py-24 bg-slate-50 border-y border-slate-100 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border border-orange-100 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Adaptabilidad Multirubro
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Diseñado para cualquier modelo
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
              de venta online y presencial
            </span>
          </h2>
          <p className="text-slate-600 text-lg mt-4">
            Glubbi se adapta al ritmo real de tu operación comercial — modernizando menús, acelerando el delivery y multiplicando tus ventas.
          </p>
        </div>

        {/* USE CASES GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          
          {/* Card 1: Gastronomía */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 border border-orange-100 flex items-center justify-center mb-6">
              <Utensils className="w-6 h-6" />
            </div>
            <h3 className="text-slate-900 font-bold text-xl mb-3">Restaurantes &amp; Gastronomía</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Fast Food, Casual Dining, Dark Kitchens y Alta Cocina. Menú QR interactivo, KDS en directo y pedidos de delivery sin comisiones.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">KDS Tiempo Real</span>
              <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Comanda Cocina/Caja</span>
            </div>
          </div>

          {/* Card 2: Bodegones & Mercados */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 border border-blue-100 flex items-center justify-center mb-6">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-slate-900 font-bold text-xl mb-3">Bodegones &amp; Minimarkets</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Exposición digital de productos importados e inventario general con opción de Pick-Up en tienda o envío express a domicilio.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Catálogo Digital</span>
              <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Despacho Express</span>
            </div>
          </div>

          {/* Card 3: Farmacias */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-6">
              <Pill className="w-6 h-6" />
            </div>
            <h3 className="text-slate-900 font-bold text-xl mb-3">Farmacias &amp; Salud</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Recepción rápida de solicitudes de medicamentos y cuidado personal directamente en tu canal digital sin colas telefónicas.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Atención Ágil</span>
              <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Pago Móvil Directo</span>
            </div>
          </div>

          {/* Card 4: Emprendedores */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center mb-6">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="text-slate-900 font-bold text-xl mb-3">Emprendedores &amp; Retail</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Convierte tus seguidores de Instagram o WhatsApp en clientes recurrentes con un link de tienda propio profesional y automatizado.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Link en Bio</span>
              <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">CRM Clientes</span>
            </div>
          </div>

          {/* Card 5: Cadenas & Franquicias */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-200 md:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 border border-orange-100 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-slate-900 font-bold text-xl">Cadenas de Locales &amp; Centros Comerciales</h3>
                <p className="text-slate-500 text-xs">Administración multi-tenant aislada por sucursal</p>
              </div>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Control centralizado de múltiples sucursales con bases de datos PostgreSQL independientes mediante Row Level Security (RLS). Reportes de ventas globales por punto y administración de roles.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] font-semibold bg-orange-50 text-orange-600 border border-orange-100 px-2.5 py-1 rounded-lg">Multi-Tenant Seguro</span>
              <span className="text-[11px] font-semibold bg-orange-50 text-orange-600 border border-orange-100 px-2.5 py-1 rounded-lg">Consola Gerencial</span>
              <span className="text-[11px] font-semibold bg-orange-50 text-orange-600 border border-orange-100 px-2.5 py-1 rounded-lg">Tarifa Plana B2B</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
