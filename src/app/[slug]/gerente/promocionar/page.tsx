'use client';

import React, { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Sparkles, 
  Crown, 
  Zap, 
  Clock, 
  CheckCircle2, 
  CreditCard, 
  Smartphone, 
  ChevronRight, 
  ShieldCheck,
  Eye,
  TrendingUp,
  Loader2,
  Tag
} from 'lucide-react';

interface AdPackage {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  tier: number;
  badge_text: string;
  description: string;
  is_active: boolean;
}

export default function PromocionarGerentePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<AdPackage | null>(null);

  // Payment State
  const [step, setStep] = useState<'packages' | 'payment' | 'pago_movil' | 'success'>('packages');
  const [pmReference, setPmReference] = useState('');
  const [pmBank, setPmBank] = useState('');
  const [pmAmount, setPmAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      setLoading(true);

      // 1. Fetch Restaurant details
      const { data: restData } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single();

      if (restData) {
        setRestaurant(restData);
      }

      // 2. Fetch Active Ad Packages
      const { data: pkgData } = await supabase
        .from('ad_packages')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (pkgData && pkgData.length > 0) {
        setPackages(pkgData as AdPackage[]);
        setSelectedPkg(pkgData[0] as AdPackage);
      } else {
        // Fallback standard packages
        const fallbackPkgs: AdPackage[] = [
          { id: '1', name: 'Impulso 7 Días', price: 15, duration_days: 7, tier: 1, badge_text: 'DESTACADO', description: 'Aparece en lugares destacados del feed principal.', is_active: true },
          { id: '2', name: 'VIP Top 30 Días', price: 45, duration_days: 30, tier: 2, badge_text: 'PATROCINADO VIP', description: 'Lugar #1 garantizado en la app y sección de ofertas.', is_active: true }
        ];
        setPackages(fallbackPkgs);
        setSelectedPkg(fallbackPkgs[0]);
      }

      setLoading(false);
    }

    loadData();
  }, [slug]);

  // Calculate current positioning status
  const isFeaturedActive = restaurant && (restaurant.featured_tier || 0) > 0 && restaurant.featured_until && new Date(restaurant.featured_until) > new Date();
  const untilDate = restaurant?.featured_until ? new Date(restaurant.featured_until) : null;
  const daysLeft = untilDate ? Math.ceil((untilDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;

  const handleSelectPackage = (pkg: AdPackage) => {
    setSelectedPkg(pkg);
  };

  const handleProceedToPayment = () => {
    if (!selectedPkg) return;
    setPmAmount(selectedPkg.price.toString());
    setStep('payment');
  };

  const handleSubmitPagoMovil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkg || !restaurant) return;

    setIsSubmitting(true);

    // Save payment report
    await supabase.from('payment_reports').insert([
      {
        restaurant_id: restaurant.id,
        amount: selectedPkg.price,
        reference_number: pmReference,
        bank_name: pmBank,
        payment_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        notes: `Compra de paquete de publicidad: ${selectedPkg.name} (${selectedPkg.duration_days} días)`
      }
    ]);

    // Automatically apply featured status (or wait for admin approval if preferred)
    const newUntil = new Date();
    if (isFeaturedActive && untilDate) {
      newUntil.setTime(untilDate.getTime() + selectedPkg.duration_days * 24 * 3600 * 1000);
    } else {
      newUntil.setDate(newUntil.getDate() + selectedPkg.duration_days);
    }

    await supabase.from('restaurants').update({
      featured_tier: selectedPkg.tier,
      featured_until: newUntil.toISOString(),
      featured_badge: selectedPkg.badge_text || 'DESTACADO'
    }).eq('id', restaurant.id);

    setIsSubmitting(false);
    setStep('success');
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8 animate-fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-600 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black text-orange-600 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Glubbi Merchant Ads
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-1">Impulsar Mi Negocio</h1>
            <p className="text-slate-500 text-xs md:text-sm">Aumenta tus ventas apareciendo de primero en la aplicación Glubbi.</p>
          </div>
        </div>

        {/* Current Active Status Badge */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          {isFeaturedActive ? (
            <>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 font-bold">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Posicionamiento Activo</span>
                <span className="text-[11px] font-extrabold text-emerald-600 block">
                  Quedan {daysLeft} días de visibilidad VIP
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Sin Impulso Activo</span>
                <span className="text-[11px] text-slate-400 block">Tu negocio está en posición estándar</span>
              </div>
            </>
          )}
        </div>
      </div>

      {step === 'packages' && (
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
          
          {/* LEFT: Package Selection */}
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900">1. Selecciona tu Paquete de Visibilidad</h2>
              <p className="text-slate-500 text-xs">Elige la duración e intensidad del patrocinio para tu local.</p>
            </div>

            <div className="space-y-4">
              {packages.map((pkg) => {
                const isSelected = selectedPkg?.id === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => handleSelectPackage(pkg)}
                    className={`w-full text-left rounded-3xl p-6 transition-all border-2 relative overflow-hidden flex items-center justify-between group ${
                      isSelected
                        ? 'border-orange-500 bg-white shadow-xl shadow-orange-500/10'
                        : 'border-slate-200 bg-white hover:border-orange-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-bold transition-all ${
                        isSelected 
                          ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30' 
                          : 'bg-slate-100 text-slate-500 group-hover:bg-orange-50 group-hover:text-orange-600'
                      }`}>
                        {pkg.tier === 2 ? <Crown className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 text-base">{pkg.name}</h3>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            pkg.tier === 2 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                          }`}>
                            {pkg.tier === 2 ? 'VIP Top Feed' : 'Silver Destacado'}
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs">{pkg.description}</p>
                        <span className="text-[11px] font-bold text-orange-600 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Duración: {pkg.duration_days} Días seguidos
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-4">
                      <span className="text-2xl font-black text-slate-900 block">${pkg.price}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">USD</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={!selectedPkg}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl h-14 text-base transition-all shadow-[0_4px_20px_rgba(249,115,22,0.25)] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              Adquirir Impulso por ${selectedPkg?.price} USD <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* RIGHT: Live Interactive Preview */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> Previsualización en la App Glubbi
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                Vista de Comensal
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Así es como aparecerá tu restaurante en las primeras posiciones del menú principal para miles de clientes:
            </p>

            {/* Simulated Card in App */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/80 relative text-slate-900 group">
              
              {/* Cover Image */}
              <div className="h-36 bg-slate-200 relative overflow-hidden">
                <img 
                  src={restaurant?.cover_image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'} 
                  alt="Portada"
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                
                {/* Simulated Badge */}
                <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3 h-3" /> {selectedPkg?.badge_text || 'PATROCINADO VIP'}
                </div>

                <div className="absolute bottom-3 left-3 text-white">
                  <span className="text-xs font-bold bg-emerald-500 px-2 py-0.5 rounded-md text-[10px]">Abierto Ahora</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    <img 
                      src={restaurant?.logo_url || '/logo.svg'} 
                      alt="Logo" 
                      className="w-full h-full object-contain p-0.5" 
                    />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-base leading-snug">{restaurant?.name || 'Tu Restaurante'}</h4>
                    <p className="text-xs text-slate-500">{restaurant?.glubbi_category || 'Comida / Especialidad'}</p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

            </div>

            <div className="pt-2 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <TrendingUp className="w-4 h-4" /> Incrementa hasta +300% de clics
              </div>
              <p>Los negocios patrocinados se ubican sobre la competencia orgánica y son los primeros que ven los comensales al abrir Glubbi.</p>
            </div>

          </div>

        </div>
      )}

      {/* STEP 2: Payment Selection */}
      {step === 'payment' && (
        <div className="max-w-2xl mx-auto w-full bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-xl space-y-6 animate-fade-in">
          <div className="text-center space-y-2 pb-4 border-b border-slate-100">
            <span className="text-xs font-black text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full uppercase tracking-wider">
              Confirmación de Pago
            </span>
            <h2 className="text-2xl font-black text-slate-900">Elige el método de pago</h2>
            <p className="text-slate-500 text-xs">
              Adquiriendo: <strong>{selectedPkg?.name}</strong> (${selectedPkg?.price} USD / {selectedPkg?.duration_days} días).
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setStep('pago_movil')}
              className="w-full bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-2xl p-5 text-left transition-all group flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all font-bold">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-600">Pago Móvil (Bolívares Bs)</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Venezuela (Tasa BCV del día).</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setStep('packages')}
            className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 pt-2"
          >
            ← Volver a paquetes
          </button>
        </div>
      )}

      {/* STEP 3: Pago Movil Form */}
      {step === 'pago_movil' && (
        <form onSubmit={handleSubmitPagoMovil} className="max-w-2xl mx-auto w-full bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-xl space-y-6 animate-fade-in">
          <div className="space-y-1 pb-3 border-b border-slate-100">
            <h2 className="text-2xl font-black text-slate-900">Reportar Pago Móvil</h2>
            <p className="text-slate-500 text-xs">Ingresa la referencia para activar tu paquete de visibilidad.</p>
          </div>

          <div className="bg-orange-50/70 border border-orange-200 rounded-2xl p-4 space-y-2 text-xs text-slate-800">
            <div className="flex justify-between items-center border-b border-orange-200/50 pb-2">
              <span className="font-bold">Monto a pagar ({selectedPkg?.name}):</span>
              <span className="text-lg font-black text-orange-600">${selectedPkg?.price} USD</span>
            </div>
            <p><strong>Banco Destino:</strong> Banco de Venezuela (0102)</p>
            <p><strong>RIF:</strong> J-12517086 (Glubbi)</p>
            <p><strong>Teléfono:</strong> 0414-8817137</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Número de Referencia (Últimos 6 dígitos) *</label>
              <input
                type="text"
                value={pmReference}
                onChange={(e) => setPmReference(e.target.value)}
                required
                placeholder="Ej: 849201"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-mono font-bold focus:outline-none focus:border-orange-500 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Banco Emisor *</label>
              <input
                type="text"
                value={pmBank}
                onChange={(e) => setPmBank(e.target.value)}
                required
                placeholder="Ej: Banesco"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-orange-500 text-sm"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              type="submit"
              disabled={isSubmitting || !pmReference || !pmBank}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl h-14 text-base transition-all shadow-[0_4px_20px_rgba(249,115,22,0.25)] active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Verificando...</> : 'ACTIVAR IMPULSO AHORA'}
            </button>
            <button
              type="button"
              onClick={() => setStep('payment')}
              disabled={isSubmitting}
              className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              ← Volver atrás
            </button>
          </div>
        </form>
      )}

      {/* STEP 4: Success */}
      {step === 'success' && (
        <div className="max-w-md mx-auto w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">¡Impulso Activado Exitosamente!</h2>
            <p className="text-slate-500 text-xs">
              Tu restaurante <strong>{restaurant?.name}</strong> ya cuenta con posicionamiento VIP activado en Glubbi App.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setStep('packages')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl h-12 text-xs transition-all shadow-md"
          >
            Volver al Panel
          </button>
        </div>
      )}

    </div>
  );
}
