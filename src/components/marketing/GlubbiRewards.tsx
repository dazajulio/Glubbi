import { Gift, Bell, Award, Sparkles, Star } from 'lucide-react';

export function GlubbiRewards() {
  return (
    <section className="pt-12 pb-24 bg-slate-50 border-b border-slate-100 relative overflow-hidden">
      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.15] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center relative z-10">
        
        {/* COLUMNA IZQUIERDA: CONTENIDO */}
        <div className="flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-xs font-bold w-fit mb-6 border border-orange-100 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Glubbi Rewards & Lealtad
          </div>
          
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-6 leading-tight">
            Únete a la red:
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
              Tus clientes, tu app, tu lealtad.
            </span>
          </h2>
          
          <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-xl">
            No eres un restaurante aislado; eres parte de un ecosistema. Al integrar Glubbi, tus clientes acceden a nuestra App nativa donde pueden:
          </p>

          <div className="space-y-6 max-w-xl">
            {/* Feature 1 */}
            <div className="flex gap-4 p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100 text-orange-500">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-slate-900 font-bold text-lg">Rewards & Cupones</h3>
                <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                  Gamifica la experiencia de tus comensales. Cliente que vuelve, cliente que acumula puntos y desbloquea recompensas automáticas.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-4 p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 text-blue-500">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-slate-900 font-bold text-lg">Notificaciones Push</h3>
                <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                  Olvídate del spam por redes sociales o correos ignorados. Envía alertas directamente a las pantallas de sus teléfonos cuando lances una promoción o producto.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-4 p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100 text-emerald-500">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-slate-900 font-bold text-lg">Marketplace de Favoritos</h3>
                <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                  Tu menú siempre a la mano del cliente en su lista de preferidos, accesible con un solo clic sin tener que buscar links o chats antiguos.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: MOCKUP 3D SMARTPHONE */}
        <div className="flex justify-center relative">
          {/* Decorative gradients behind mockup */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-orange-500/10 blur-3xl -z-10" />

          {/* Smartphone Mockup */}
          <div className="w-[280px] h-[550px] rounded-[2.5rem] border-[8px] border-slate-950 bg-slate-900 shadow-2xl p-1 overflow-hidden relative select-none">
            
            {/* Notch */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-950 rounded-full z-20" />

            {/* Screen Content */}
            <div className="h-full bg-slate-950 rounded-[2.1rem] overflow-y-auto px-4 py-8 flex flex-col gap-5 scrollbar-none">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mt-2">
                <div>
                  <p className="text-[10px] text-zinc-400">Club de Lealtad</p>
                  <h4 className="text-sm font-black text-white">Glubbi Rewards</h4>
                </div>
                <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 text-xs font-bold">
                  JS
                </div>
              </div>

              {/* Tarjeta de Puntos (3D look) */}
              <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-4 shadow-lg flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-xl" />
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-[11px] text-orange-100 font-semibold tracking-wider uppercase">Tus Puntos Acumulados</h5>
                    <p className="text-2xl font-black text-white mt-1">450 <span className="text-[12px] font-normal">pts</span></p>
                  </div>
                  <span className="text-white text-lg">✨</span>
                </div>

                {/* Stamps grid (8 stamps) */}
                <div>
                  <p className="text-[9.5px] text-orange-100 mb-2">Faltan 3 visitas para tu premio gratis</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="aspect-square rounded-lg bg-white/25 border border-white/20 flex items-center justify-center shadow-inner">
                        <Star className="w-4 h-4 text-white fill-white animate-pulse" />
                      </div>
                    ))}
                    {[6, 7, 8].map((i) => (
                      <div key={i} className="aspect-square rounded-lg bg-black/20 border border-white/10 flex items-center justify-center text-zinc-600 text-xs font-bold">
                        {i}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Coupons List */}
              <div className="flex flex-col gap-3">
                <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Tus Cupones Activos</h5>

                {/* Coupon 1 */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex justify-between items-center relative overflow-hidden">
                  <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-950 rounded-full" />
                  <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-950 rounded-full" />
                  <div className="pl-2">
                    <p className="text-xs font-bold text-white">15% OFF en Combos</p>
                    <p className="text-[9px] text-zinc-500">Vence en 3 días • Burger Grill</p>
                  </div>
                  <button className="bg-orange-500 text-white font-extrabold text-[8.5px] px-3 py-1.5 rounded-lg active:scale-95 transition-transform shrink-0">
                    CANJEAR
                  </button>
                </div>

                {/* Coupon 2 */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex justify-between items-center relative overflow-hidden">
                  <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-950 rounded-full" />
                  <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-950 rounded-full" />
                  <div className="pl-2">
                    <p className="text-xs font-bold text-white">Papas Gratis con tu compra</p>
                    <p className="text-[9px] text-zinc-500">Cupón Especial Recurrente</p>
                  </div>
                  <button className="bg-orange-500 text-white font-extrabold text-[8.5px] px-3 py-1.5 rounded-lg active:scale-95 transition-transform shrink-0">
                    CANJEAR
                  </button>
                </div>
              </div>

              {/* Notification Banner */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex gap-2.5 items-start">
                <Bell className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-white leading-tight">Alerta de Promo: Burger Grill</p>
                  <p className="text-[8.5px] text-zinc-400 leading-snug mt-0.5">¡Solo por hoy! 2x1 en hamburguesas clásicas pidiendo desde mesa.</p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
