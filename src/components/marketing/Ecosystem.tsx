import { Zap, Brain, CreditCard, ChefHat, MapPin, Clock, BarChart3, ShieldCheck, Sparkles } from 'lucide-react';

export function Ecosystem() {
  return (
    <section id="ecosistema" className="py-24 bg-white border-b border-slate-100 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border border-orange-100 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Infraestructura Tecnológica Integrada
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            El Ecosistema en Acción:
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
              Tu Marca, Tus Reglas
            </span>
          </h2>
          <p className="text-lg text-slate-600 mt-6 leading-relaxed">
            Una solución End-to-End diseñada para conectar tu menú digital, cocina, cobros y retención de clientes en un solo flujo sin fricción.
          </p>
        </div>

        {/* PROCESO DE PEDIDOS EN LÍNEA (4 PASOS) */}
        <div className="mb-20">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest text-center mb-10">
            Proceso de pedidos en línea en 4 pasos
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Paso 1 */}
            <div className="bg-slate-50 border border-slate-150 rounded-3xl p-6 relative group hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-white font-black text-sm flex items-center justify-center mb-6 shadow-md shadow-orange-500/20">
                1
              </div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-lg mb-2">
                <Zap className="w-5 h-5 text-orange-500 shrink-0" />
                <span>Sincronización Inmediata</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                Transmisión directa de pedidos vía WebSocket. Cero latencia y cero errores de transcripción manual.
              </p>
            </div>

            {/* Paso 2 */}
            <div className="bg-slate-50 border border-slate-150 rounded-3xl p-6 relative group hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-white font-black text-sm flex items-center justify-center mb-6 shadow-md shadow-orange-500/20">
                2
              </div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-lg mb-2">
                <Brain className="w-5 h-5 text-orange-500 shrink-0" />
                <span>IA Upselling Automatizado</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                Sugerencias algorítmicas de productos complementarios en el carrito, elevando el ticket promedio hasta +23%.
              </p>
            </div>

            {/* Paso 3 */}
            <div className="bg-slate-50 border border-slate-150 rounded-3xl p-6 relative group hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-white font-black text-sm flex items-center justify-center mb-6 shadow-md shadow-orange-500/20">
                3
              </div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-lg mb-2">
                <CreditCard className="w-5 h-5 text-orange-500 shrink-0" />
                <span>Pagos Integrados</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                Procesamiento fluido mediante Lemon Squeezy, Pago Móvil o Efectivo que elimina demoras en verificación.
              </p>
            </div>

            {/* Paso 4 */}
            <div className="bg-slate-50 border border-slate-150 rounded-3xl p-6 relative group hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-white font-black text-sm flex items-center justify-center mb-6 shadow-md shadow-orange-500/20">
                4
              </div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-lg mb-2">
                <ChefHat className="w-5 h-5 text-orange-500 shrink-0" />
                <span>KDS en Cocina</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                Organización automática de comandas por tiempo y prioridad directamente en pantalla reactiva.
              </p>
            </div>
          </div>
        </div>

        {/* MODULOS OPERATIVOS DESTACADOS */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          
          <div className="bg-slate-50/70 border border-slate-200/60 rounded-3xl p-8 hover:bg-white hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 border border-orange-100 flex items-center justify-center mb-6">
              <MapPin className="w-6 h-6" />
            </div>
            <h4 className="text-slate-900 font-bold text-xl mb-3">Configuración de Zonas de Envío</h4>
            <p className="text-slate-600 text-sm leading-relaxed">
              Dibuja polígonos interactivos en el mapa para delimitar tus áreas de entrega y definir tarifas exactas de delivery por sector.
            </p>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/60 rounded-3xl p-8 hover:bg-white hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 border border-orange-100 flex items-center justify-center mb-6">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h4 className="text-slate-900 font-bold text-xl mb-3">Analítica y Registro Detallado</h4>
            <p className="text-slate-600 text-sm leading-relaxed">
              Reportes de ventas totales, productos más vendidos, mejores clientes e historial detallado con opción de exportación a PDF.
            </p>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/60 rounded-3xl p-8 hover:bg-white hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 border border-orange-100 flex items-center justify-center mb-6">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-slate-900 font-bold text-xl mb-3">Horarios de Operatividad</h4>
            <p className="text-slate-600 text-sm leading-relaxed">
              Gestión automática de días y horas de apertura. Fuera de horario, tu local se muestra cerrado para evitar pedidos sin atender.
            </p>
          </div>

        </div>

        {/* BADGE DE IDENTIDAD LOCAL & TECNOLOGIA */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 text-xs font-extrabold px-3 py-1 rounded-full border border-orange-500/30 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Desarrollado en Venezuela
            </div>
            <h4 className="text-2xl font-black tracking-tight">Tecnología propia de estándar internacional</h4>
            <p className="text-slate-300 text-sm max-w-xl">
              Despliegue inmediato en cualquier dispositivo actual (PWA) sin hardware propietario costoso. Arquitectura Multi-Tenant aislada y segura en PostgreSQL cloud.
            </p>
          </div>
          
          <div className="shrink-0 bg-white/10 border border-white/10 backdrop-blur-md px-6 py-4 rounded-2xl text-center">
            <span className="text-xs text-slate-300 uppercase tracking-wider font-semibold block mb-1">Cero Comisiones por Venta</span>
            <span className="text-3xl font-black text-orange-400">$29 USD<span className="text-sm font-normal text-slate-300">/mes</span></span>
          </div>
        </div>

      </div>
    </section>
  );
}
