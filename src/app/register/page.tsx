'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  CheckCircle2, 
  Loader2, 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  Lock, 
  Mail, 
  Globe, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  Brain,
  ChefHat,
  Bell,
  Layers,
  Printer,
  ShieldCheck,
  ExternalLink,
  Store,
  Tag,
  CreditCard,
  Smartphone
} from 'lucide-react';

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const REFERRAL_OPTIONS = [
  { id: 'Google', label: 'Google', icon: '🔍' },
  { id: 'YouTube', label: 'YouTube', icon: '📺' },
  { id: 'LinkedIn', label: 'LinkedIn', icon: '💼' },
  { id: 'Instagram', label: 'Instagram', icon: '📸' },
  { id: 'Me comentó otro restaurante', label: 'Me comentó otro restaurante', icon: '🤝' },
  { id: 'Miembro del equipo Glubbi', label: 'Miembro del equipo Glubbi', icon: '👥' },
  { id: 'Otros', label: 'Otros', icon: '🌐' },
];

export default function RegisterPage() {
  const router = useRouter();
  
  // Registration Flow Step
  const [step, setStep] = useState<'details' | 'payment_selection' | 'pago_movil' | 'redirecting' | 'success'>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [bcvRate, setBcvRate] = useState<number>(0);

  // Referral Source & Team Code State
  const [referralSource, setReferralSource] = useState<string>('Google');
  const [teamMemberCode, setTeamMemberCode] = useState<string>('');

  // Pago Movil Form State
  const [pmReference, setPmReference] = useState('');
  const [pmAmount, setPmAmount] = useState('');
  const [pmDate, setPmDate] = useState('');
  const [pmBank, setPmBank] = useState('');
  const [pmCedula, setPmCedula] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    restaurantName: '',
    contactName: '',
    phone: '',
    address: '',
    email: '',
    password: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    glubbi_type: 'Restaurantes',
    glubbi_category: 'Otras',
  });

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; discount_percentage: number; code: string } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Auto-apply welcome coupon INICIOGLUBBI on mount
  React.useEffect(() => {
    async function autoApplyWelcomeCoupon() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('coupons')
          .select('*')
          .eq('code', 'INICIOGLUBBI')
          .eq('is_active', true)
          .maybeSingle();

        if (data) {
          setCouponCode('INICIOGLUBBI');
          setAppliedCoupon(data);
        }
      } catch (e) {
        console.error('Error auto loading welcome coupon:', e);
      }
    }
    autoApplyWelcomeCoupon();
  }, []);

  const handleApplyCoupon = async () => {
    setCouponError('');
    setCouponLoading(true);
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !data) {
      setCouponError('Cupón inválido o inactivo');
      setAppliedCoupon(null);
    } else {
      if (data.max_uses && data.current_uses >= data.max_uses) {
        setCouponError('El cupón alcanzó su límite de usos');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(data);
      }
    }
    setCouponLoading(false);
  };

  const handleSelectFreeRegistration = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setStep('redirecting');

    try {
      const paymentReference = `Cupón Bienvenida 100% OFF (${appliedCoupon?.code || 'INICIOGLUBBI'})`;
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          manualPayment: true, 
          paymentReference, 
          couponId: appliedCoupon?.id,
          referral_source: referralSource,
          team_code: referralSource === 'Miembro del equipo Glubbi' ? teamMemberCode : ''
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Error al registrar.');

      setRegisteredSlug(result.slug);
      setStep('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error inesperado.');
      setStep('payment_selection');
      setIsLoading(false);
    }
  };



  // Unique generated slug to show at the end
  const [registeredSlug, setRegisteredSlug] = useState('');

  // Form handlers
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    // Quick validation
    if (
      !formData.restaurantName || 
      !formData.contactName || 
      !formData.phone || 
      !formData.address || 
      !formData.email || 
      !formData.password
    ) {
      setErrorMsg('Por favor completa todos los campos requeridos.');
      return;
    }

    if (referralSource === 'Miembro del equipo Glubbi' && !teamMemberCode.trim()) {
      setErrorMsg('Por favor ingresa el código del miembro o agente del equipo Glubbi.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    setIsLoading(false);
    setStep('payment_selection');
  };

  const handleSelectLemonSqueezy = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setStep('redirecting');
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          manualPayment: false, 
          couponId: appliedCoupon?.id,
          referral_source: referralSource,
          team_code: referralSource === 'Miembro del equipo Glubbi' ? teamMemberCode : ''
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Error al registrar.');

      setRegisteredSlug(result.slug);
      localStorage.setItem('Glubbi_pending_slug', result.slug);
      window.location.href = result.checkoutUrl;
    } catch (err: any) {
      setErrorMsg(err.message || 'Error inesperado.');
      setStep('payment_selection');
      setIsLoading(false);
    }
  };

  const handleSelectPagoMovil = async () => {
    setStep('pago_movil');
    setIsLoading(true);
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
      const data = await res.json();
      if (data.promedio) {
        setBcvRate(data.promedio);
      }
    } catch (err) {
      console.error('Error fetching BCV rate', err);
    }
    setIsLoading(false);
  };

  const handleSubmitPagoMovil = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!pmReference || !pmAmount || !pmDate || !pmBank || !pmCedula) {
      setErrorMsg('Debes completar todos los campos del pago para continuar.');
      return;
    }

    setIsLoading(true);
    setStep('redirecting');

    try {
      const paymentReference = `PagoMovil | Ref: ${pmReference} | Monto: Bs.${pmAmount} | Fecha: ${pmDate} | Banco: ${pmBank} | CI: ${pmCedula}`;
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          manualPayment: true, 
          paymentReference, 
          couponId: appliedCoupon?.id,
          referral_source: referralSource,
          team_code: referralSource === 'Miembro del equipo Glubbi' ? teamMemberCode : ''
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Error al registrar.');

      setRegisteredSlug(result.slug);
      setStep('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error inesperado.');
      setStep('pago_movil');
    }
    setIsLoading(false);
  };

  const benefits = [
    {
      icon: Layers,
      title: 'Panel Administrativo Central',
      description: 'Control de ventas, comandas de mesa y administración del menú en tiempo real.',
      color: 'text-orange-500 bg-orange-500/10 border-orange-500/20'
    },
    {
      icon: Brain,
      title: 'Agente de Crecimiento IA',
      description: 'Crea campañas inteligentes autónomas para incrementar tus ventas recurrentes un 23%.',
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20'
    },
    {
      icon: Globe,
      title: 'Sistema de Delivery Integrado',
      description: 'Tu propia web de domicilios activa las 24/7 sin pagar comisiones de apps externas.',
      color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20'
    },
    {
      icon: TrendingUp,
      title: 'Presencia en Glubbi App',
      description: 'Aparece en el catálogo B2C exclusivo de clientes para atraer tráfico orgánico.',
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      icon: ChefHat,
      title: 'Kitchen Display System (KDS)',
      description: 'Pantalla digital de cocina reactiva que organiza pedidos por tiempos y prioridades.',
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#080d1a] via-[#0f1627] to-[#030610] text-slate-300 font-sans flex flex-col justify-between relative overflow-hidden selection:bg-orange-500/20">
      
      {/* Background Liquid Glows (Hero Style) */}
      <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-orange-500/15 rounded-full blur-[140px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[10%] right-[5%] w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
      
      {/* Header / Logo */}
      <header className="relative z-20 max-w-7xl mx-auto px-6 w-full py-3.5 flex items-center justify-between border-b border-white/10">
        <Link href="/" className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full pl-3 pr-4 py-1.5 shadow-sm hover:bg-white/20 transition-all select-none">
          <img src="/logo-glubbi.png" alt="Glubbi Logo" className="w-5 h-5 object-contain" />
          <span className="text-sm font-black tracking-tight text-white">
            Glubbi<span className="text-orange-500">.app</span>
          </span>
        </Link>
        <span className="text-xs text-orange-400 bg-orange-500/20 border border-orange-500/30 font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Afiliación B2B Oficial
        </span>
      </header>

      {/* Main Grid */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 w-full py-8 flex-1 flex flex-col justify-center">
        
        {step === 'details' ? (
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch w-full">
            {/* LEFT COLUMN: Registration Form */}
            <div className="bg-white border border-slate-200/80 p-6 md:p-8 rounded-3xl flex flex-col justify-start gap-y-6 shadow-xl shadow-slate-200/40 relative overflow-hidden">
              
              {/* Referral Source Selector ("¿Cómo te enteraste de Glubbi?") */}
              <div className="bg-gradient-to-r from-orange-50/60 via-white to-purple-50/60 p-4.5 rounded-2xl border border-orange-200/80 space-y-3 shadow-sm select-none">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" /> ¿Cómo te enteraste de Glubbi? *
                  </label>
                  <span className="text-[10px] font-extrabold text-orange-600 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">Requerido</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {REFERRAL_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setReferralSource(opt.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                        referralSource === opt.id
                          ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:bg-orange-50/30'
                      }`}
                    >
                      <span className="text-sm">{opt.icon}</span>
                      <span className="truncate">{opt.label}</span>
                    </button>
                  ))}
                </div>

                {/* Fluid Code Input when "Miembro del equipo Glubbi" is selected */}
                {referralSource === 'Miembro del equipo Glubbi' && (
                  <div className="pt-2 animate-fade-in space-y-1.5">
                    <label className="text-xs font-bold text-orange-600 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-orange-500" /> Código del Agente / Miembro de Glubbi *
                    </label>
                    <input
                      type="text"
                      value={teamMemberCode}
                      onChange={(e) => setTeamMemberCode(e.target.value.toUpperCase())}
                      placeholder="Ej: CARLOS10 (Ingresa el código)"
                      required={referralSource === 'Miembro del equipo Glubbi'}
                      className="w-full bg-white border-2 border-orange-500 rounded-xl px-4 py-3 text-slate-900 font-mono font-black text-sm uppercase placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-orange-500/20 transition-all shadow-sm"
                    />
                  </div>
                )}
              </div>

              {/* STEP 1: Details Form */}
              <form onSubmit={handleSubmitDetails} className="space-y-5">
                <div className="space-y-2">
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Crea tu cuenta de Restaurante</h1>
                  <p className="text-slate-400 text-sm">Completa el formulario. Te redirigimos al pago seguro en segundos.</p>
                </div>

                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-orange-500" /> Nombre del local *
                    </label>
                    <input 
                      name="restaurantName" 
                      value={formData.restaurantName}
                      onChange={handleFormChange}
                      required 
                      placeholder="Ej: Tu Restaurante" 
                      className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-orange-500" /> Nombre de contacto *
                    </label>
                    <input 
                      name="contactName" 
                      value={formData.contactName}
                      onChange={handleFormChange}
                      required 
                      placeholder="Ej: Tu Nombre Completo" 
                      className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors text-sm"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-orange-500" /> Teléfono *
                    </label>
                    <input 
                      name="phone" 
                      value={formData.phone}
                      onChange={handleFormChange}
                      required 
                      placeholder="Ej: +1 555-0199" 
                      className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-orange-500" /> Dirección del local *
                    </label>
                    <input 
                      name="address" 
                      value={formData.address}
                      onChange={handleFormChange}
                      required 
                      placeholder="Ej: Av. Principal N° 124" 
                      className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors text-sm"
                    />
                  </div>
                </div>

                {/* Auth Details */}
                <div className="pt-2 border-t border-slate-100 grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-orange-500" /> Email de acceso *
                    </label>
                    <input 
                      type="email"
                      name="email" 
                      value={formData.email}
                      onChange={handleFormChange}
                      required 
                      placeholder="ejemplo@correo.com" 
                      className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-orange-500" /> Contraseña *
                    </label>
                    <input 
                      type="password"
                      name="password" 
                      value={formData.password}
                      onChange={handleFormChange}
                      required 
                      placeholder="Mínimo 6 caracteres" 
                      className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors text-sm"
                    />
                  </div>
                </div>

                {/* Social Media */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">Redes Sociales (Opcional)</label>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="relative">
                      <InstagramIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input 
                        name="instagram" 
                        value={formData.instagram}
                        onChange={handleFormChange}
                        placeholder="Instagram" 
                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 transition-colors text-xs"
                      />
                    </div>
                    <div className="relative">
                      <FacebookIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input 
                        name="facebook" 
                        value={formData.facebook}
                        onChange={handleFormChange}
                        placeholder="Facebook" 
                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 transition-colors text-xs"
                      />
                    </div>
                    <div className="relative">
                      <span className="text-[10px] font-black text-slate-400 absolute left-3.5 top-3.5">🎵</span>
                      <input 
                        name="tiktok" 
                        value={formData.tiktok}
                        onChange={handleFormChange}
                        placeholder="TikTok" 
                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 transition-colors text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                      <Store className="w-4 h-4" /> Categorización en Glubbi
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Tipo de Negocio</label>
                        <select
                          name="glubbi_type"
                          value={formData.glubbi_type}
                          onChange={handleFormChange}
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-slate-800"
                        >
                          <option value="Restaurantes">Restaurante / Comida</option>
                          <option value="Mercado">Mercado / Tienda</option>
                          <option value="Farmacia">Farmacia</option>
                        </select>
                      </div>

                      {formData.glubbi_type === 'Restaurantes' && (
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Especialidad</label>
                          <select
                            name="glubbi_category"
                            value={formData.glubbi_category}
                            onChange={handleFormChange}
                            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-slate-800"
                          >
                            <option value="Sushi">Sushi</option>
                            <option value="Hamburguesas">Hamburguesas</option>
                            <option value="Pizzas">Pizzas</option>
                            <option value="Pollo">Pollo</option>
                            <option value="Chino">Chino</option>
                            <option value="Asiático">Asiático</option>
                            <option value="Saludable">Saludable</option>
                            <option value="Empanadas">Empanadas</option>
                            <option value="Panadería">Panadería / Postres</option>
                            <option value="Árabe">Árabe</option>
                            <option value="Desayunos">Desayunos</option>
                            <option value="Mexicana">Mexicana</option>
                            <option value="Peruana">Peruana</option>
                            <option value="Otras">Otras</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl h-14 text-base transition-all shadow-[0_4px_20px_rgba(249,115,22,0.2)] active:scale-[0.99] disabled:opacity-60"
                >
                  {isLoading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Creando cuenta...</>
                  ) : (
                    <>Continuar al pago seguro <ChevronRight className="w-5 h-5" /></>
                  )}
                </button>
              </form>
            </div>

            {/* RIGHT COLUMN: Ecosystem Checklist & Benefits */}
            <div className="bg-white border border-slate-200/80 p-6 md:p-8 rounded-3xl flex flex-col justify-between shadow-xl shadow-slate-200/40 relative overflow-hidden">
              
              <div className="space-y-6">
                <div>
                  <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-600 border border-orange-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                    <Sparkles className="w-3.5 h-3.5" /> Todo incluido
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                    Accede al Ecosistema Completo de Crecimiento
                  </h2>
                  <p className="text-sm text-slate-500 mt-2">
                    Con tu suscripción mensual, tu negocio se impulsa con herramientas avanzadas sin comisiones ocultas.
                  </p>
                </div>

                <div className="space-y-4">
                  {benefits.map((benefit, index) => {
                    const Icon = benefit.icon;
                    return (
                      <div key={index} className="flex gap-4 p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow hover:border-slate-300 transition-all duration-150 group">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${benefit.color} group-hover:scale-105 transition-transform`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <h3 className="text-sm font-bold text-slate-900">{benefit.title}</h3>
                          <p className="text-xs text-slate-500 leading-relaxed">{benefit.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 p-5 bg-gradient-to-br from-white via-orange-50/40 to-purple-50/20 rounded-2xl border border-orange-200/80 shadow-md flex items-start gap-4 select-none">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-orange-600 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-lg shadow-orange-500/20">
                  $29
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900">Suscripción $29/mes</span>
                    <span className="text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full">Sin Contrato</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Máxima transparencia y libertad. Sin contratos de permanencia ni comisiones ocultas por tus ventas. Cancela o suspende cuando quieras.
                  </p>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* SINGLE CENTERED COLUMN LAYOUT FOR PAYMENT & SUCCESS STEPS */
          <div className="max-w-2xl mx-auto w-full animate-fade-in py-4">
            
            {/* STEP 1.5: Payment Selection */}
            {step === 'payment_selection' && (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-10 shadow-2xl space-y-6 animate-fade-in relative overflow-hidden">
                
                {/* Header */}
                <div className="text-center space-y-2 pb-2 border-b border-slate-100">
                  <span className="text-xs font-black text-orange-600 bg-orange-500/10 border border-orange-500/20 px-3.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Paso Final de Afiliación
                  </span>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Elige cómo activar tu cuenta</h1>
                  <p className="text-slate-500 text-sm">Selecciona tu método de pago preferido. Acceso inmediato a Glubbi.</p>
                </div>

                {/* Subscription Summary Badge */}
                <div className="bg-gradient-to-r from-orange-50/70 via-white to-purple-50/60 p-5 rounded-2xl border border-orange-200/80 flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Plan Suscripción Restaurante</span>
                    <span className="text-lg font-black text-slate-900 block">Glubbi SaaS Profesional</span>
                    <span className="text-[11px] text-emerald-600 font-bold block mt-0.5">✓ Cancela en cualquier momento sin contrato</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-orange-600 block">
                      {appliedCoupon ? `$${(29 * (1 - appliedCoupon.discount_percentage / 100)).toFixed(2)}` : '$29 USD'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold block">/ mes</span>
                  </div>
                </div>

                {/* Coupon Section */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-orange-500" /> ¿Tienes un código de descuento o cupón B2B?
                  </label>
                  <div className="flex gap-2">
                    <input 
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Ingresa tu cupón"
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold uppercase focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    />
                    <button 
                      onClick={handleApplyCoupon}
                      type="button"
                      disabled={couponLoading || !couponCode}
                      className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
                    >
                      {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Aplicar'}
                    </button>
                  </div>
                  {couponError && <p className="text-red-500 text-xs font-semibold mt-1">{couponError}</p>}
                  {appliedCoupon && (
                    <p className="text-emerald-600 text-xs font-bold mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Cupón {appliedCoupon.code} aplicado: {appliedCoupon.discount_percentage}% de descuento otorgado.
                    </p>
                  )}
                </div>

                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                {/* Payment Methods Options OR 100% Free Activation */}
                {appliedCoupon && appliedCoupon.discount_percentage === 100 ? (
                  <div className="space-y-4 pt-1">
                    <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 text-2xl font-bold shadow-inner">
                          🎁
                        </div>
                        <div className="space-y-1">
                          <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 text-white px-3 py-0.5 rounded-full inline-block">
                            Oferta Exclusiva de Bienvenida
                          </span>
                          <h3 className="text-xl font-black text-white">30 Días 100% GRATIS Otorgados</h3>
                          <p className="text-xs text-white/90 leading-relaxed">
                            Cupón de bienvenida <span className="font-extrabold underline">{appliedCoupon.code}</span> activo. Accede al sistema completo sin costo por tu primer mes.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleSelectFreeRegistration}
                        disabled={isLoading}
                        className="w-full mt-6 bg-white hover:bg-emerald-50 text-emerald-900 font-black text-base py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                      >
                        {isLoading ? (
                          <><Loader2 className="w-5 h-5 animate-spin" /> Activando tu cuenta...</>
                        ) : (
                          <>
                            ✨ Activar Mis 30 Días Gratis Ahora
                            <ChevronRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Métodos de pago disponibles</label>

                  {/* Lemon Squeezy Option */}
                  <button
                    onClick={handleSelectLemonSqueezy}
                    disabled={isLoading}
                    className="w-full bg-white border-2 border-slate-200 hover:border-orange-500 rounded-2xl p-5 text-left transition-all active:scale-[0.99] group shadow-sm hover:shadow-md flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-600 flex items-center justify-center shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-all">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 text-base group-hover:text-orange-600 transition-colors">
                            Con Cualquier Tarjeta Débito / Crédito
                          </h3>
                          <span className="text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">
                            Lemon Squeezy
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs mt-1">Visa, Mastercard, AMEX, Apple Pay. Cobro seguro automático en USD.</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                  </button>

                  {/* Pago Movil Option */}
                  <button
                    onClick={handleSelectPagoMovil}
                    disabled={isLoading}
                    className="w-full bg-white border-2 border-slate-200 hover:border-orange-500 rounded-2xl p-5 text-left transition-all active:scale-[0.99] group shadow-sm hover:shadow-md flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-600 transition-colors">
                            Pago Móvil (Bolívares Bs)
                          </h3>
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Venezuela (Tasa BCV)
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs mt-1">Reporta tu transferencia en bolívares al tipo de cambio oficial del día.</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
                )}

                {/* Trust & Guarantee Badge */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 select-none">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Encriptación SSL 256-bit
                  </span>
                  <button 
                    onClick={() => setStep('details')}
                    disabled={isLoading}
                    className="text-xs font-bold text-slate-400 hover:text-orange-500 transition-colors"
                  >
                    ← Modificar datos del registro
                  </button>
                </div>

              </div>
            )}

            {/* STEP 1.7: Pago Movil Form */}
            {step === 'pago_movil' && (
              <form onSubmit={handleSubmitPagoMovil} className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-10 shadow-2xl space-y-6 animate-fade-in relative overflow-hidden">
                <div className="space-y-2 mb-2 border-b border-slate-100 pb-3">
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" /> Pago Móvil Venezuela
                  </span>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Reporta tu Pago Móvil</h1>
                  <p className="text-slate-500 text-sm">Realiza el pago a los datos indicados y registra la referencia para activar tu cuenta.</p>
                </div>

                <div className="bg-gradient-to-r from-orange-50/70 via-white to-amber-50/70 border border-orange-200 rounded-2xl p-5 space-y-3 shadow-sm">
                  <div className="flex justify-between items-center border-b border-orange-200/60 pb-3">
                    <span className="text-slate-700 text-sm font-bold">Monto exacto a pagar ({appliedCoupon ? `Con ${appliedCoupon.discount_percentage}% desc.` : '$29 USD'}):</span>
                    <span className="text-2xl font-black text-orange-600">
                      Bs. {bcvRate ? (bcvRate * (appliedCoupon ? 29 * (1 - appliedCoupon.discount_percentage / 100) : 29)).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'Calculando...'}
                    </span>
                  </div>
                  <div className="text-sm text-slate-800 space-y-1 pt-1 font-medium">
                    <p><strong>Banco Destino:</strong> Banco de Venezuela (0102)</p>
                    <p><strong>Identificación / RIF:</strong> J-12517086 (Glubbi)</p>
                    <p><strong>Teléfono Destino:</strong> 0414-8817137</p>
                  </div>
                  <div className="text-xs text-orange-600 font-bold pt-2 text-center border-t border-orange-200/40">
                    Tasa oficial BCV referencial: Bs. {bcvRate ? bcvRate.toLocaleString('es-VE', { minimumFractionDigits: 4 }) : '...'} / USD
                  </div>
                </div>

                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Número de Referencia (Últimos 6 dígitos) *</label>
                    <input 
                      value={pmReference}
                      onChange={e => setPmReference(e.target.value)}
                      required 
                      placeholder="Ej: 849201" 
                      className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-colors text-sm font-mono font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Monto Exacto (Bs) *</label>
                      <input 
                        value={pmAmount}
                        onChange={e => setPmAmount(e.target.value)}
                        required 
                        placeholder="Ej: 1058.50" 
                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-colors text-sm font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Fecha del Pago *</label>
                      <input 
                        type="date"
                        value={pmDate}
                        onChange={e => setPmDate(e.target.value)}
                        required 
                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-colors text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Banco Emisor *</label>
                      <input 
                        value={pmBank}
                        onChange={e => setPmBank(e.target.value)}
                        required 
                        placeholder="Ej: Banesco" 
                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-colors text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Cédula / RIF Origen *</label>
                      <input 
                        value={pmCedula}
                        onChange={e => setPmCedula(e.target.value)}
                        required 
                        placeholder="Ej: V-12345678" 
                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-colors text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <button 
                    type="submit"
                    disabled={isLoading || !pmReference || !pmAmount || !pmDate || !pmBank || !pmCedula}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl h-14 text-base transition-all shadow-[0_4px_20px_rgba(249,115,22,0.25)] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Verificando...</> : 'YA REALICÉ EL PAGO'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setStep('payment_selection')}
                    disabled={isLoading}
                    className="w-full text-center text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    ← Cambiar método de pago
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Redirecting to Lemon Squeezy */}
            {step === 'redirecting' && (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-8 md:p-12 shadow-2xl text-center space-y-8 animate-fade-in relative overflow-hidden">
                <div className="w-20 h-20 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Redirigiendo al pago seguro...</h1>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto">
                    Tu cuenta ha sido creada. Te llevamos a Lemon Squeezy para completar tu suscripción de $29/mes.
                  </p>
                </div>

                <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-4 text-left space-y-2 text-xs text-slate-600 max-w-sm mx-auto">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-orange-500" /> Pago 100% seguro
                  </div>
                  <p>Procesado por <strong>Lemon Squeezy</strong>. Glubbi nunca almacena datos de tu tarjeta.</p>
                </div>

                {checkoutUrl && (
                  <a
                    href={checkoutUrl}
                    className="inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-semibold underline underline-offset-2"
                  >
                    <ExternalLink className="w-4 h-4" /> Haz clic aquí si no fuiste redirigido
                  </a>
                )}
              </div>
            )}

            {/* STEP 3: Manual Success (Pago Movil) */}
            {step === 'success' && (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-8 md:p-12 shadow-2xl text-center space-y-6 animate-fade-in relative overflow-hidden">
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">¡Pago confirmado!</h1>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto">
                    Tu cuenta ha sido activada exitosamente con el Pago Móvil registrado.
                  </p>
                </div>
                <Link
                  href={`/${registeredSlug}/gerente`}
                  className="inline-flex w-full mt-4 items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl h-14 text-base transition-all shadow-lg active:scale-[0.99]"
                >
                  Ir al Panel de Control <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="relative z-20 py-6 border-t border-white/10 text-center text-xs text-slate-400 w-full select-none">
        &copy; {new Date().getFullYear()} glubbi.app. Todos los derechos reservados.
      </footer>
    </div>
  );
}
