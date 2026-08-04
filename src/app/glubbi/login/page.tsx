'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useGlubbiStore } from '@/modules/glubbi/stores/glubbi-store';

type AuthMode = 'login' | 'register';

function GlubbiLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/glubbi';

  const { customer, setCustomer } = useGlubbiStore();
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    pin: '',
  });

  useEffect(() => {
    // Si ya tiene sesión, redirigir al destino o home
    if (customer) {
      router.replace(redirectTarget);
    }
  }, [customer, router, redirectTarget]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const supabase = createClient();
    
    // Verificar si el usuario existe y si el PIN coincide
    const { data: user, error } = await supabase
      .from('glubbi_customers')
      .select('*')
      .eq('email', formData.email)
      .eq('pin', formData.pin)
      .single();

    if (error || !user) {
      setErrorMsg('Correo o PIN incorrectos.');
      setIsLoading(false);
      return;
    }

    setCustomer(user as any);
    router.replace(redirectTarget);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (formData.pin.length < 4) {
      setErrorMsg('El PIN debe tener al menos 4 dígitos.');
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    
    // Revisamos si el email ya existe
    const { data: existing } = await supabase
      .from('glubbi_customers')
      .select('id')
      .eq('email', formData.email)
      .single();

    if (existing) {
      setErrorMsg('Este correo ya está registrado. Por favor, inicia sesión.');
      setIsLoading(false);
      return;
    }

    // Insertamos el nuevo usuario
    const { data: newUser, error } = await supabase
      .from('glubbi_customers')
      .insert([{
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        pin: formData.pin
      }])
      .select()
      .single();

    if (error) {
      console.error(error);
      setErrorMsg('Error al registrar. Intenta nuevamente.');
      setIsLoading(false);
      return;
    }

    setCustomer(newUser as any);
    router.replace(redirectTarget);
  };

  if (customer) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[60%] bg-gradient-to-br from-orange-500 to-rose-500 rounded-b-[100%] opacity-10 z-0"></div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-white shadow-lg border-4 border-white flex items-center justify-center">
            <img src="/logo-glubbi.png" alt="Glubbi" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Bienvenido a <br/>GLUBBI</h1>
          <p className="text-gray-500 mt-2 text-sm">Los mejores restaurantes cerca de ti.</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
          <button 
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${mode === 'login' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
            onClick={() => { setMode('login'); setErrorMsg(''); }}
          >
            Iniciar Sesión
          </button>
          <button 
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${mode === 'register' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
            onClick={() => { setMode('register'); setErrorMsg(''); }}
          >
            Registrarse
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
          
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Nombre</label>
                <input 
                  required 
                  type="text" 
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-slate-800"
                  value={formData.first_name}
                  onChange={e => setFormData({...formData, first_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Apellido</label>
                <input 
                  required 
                  type="text" 
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-slate-800"
                  value={formData.last_name}
                  onChange={e => setFormData({...formData, last_name: e.target.value})}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Correo Electrónico</label>
            <input 
              required 
              type="email" 
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-slate-800"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Celular</label>
              <input 
                required 
                type="tel" 
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-slate-800"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
              PIN de Seguridad (4-6 dígitos)
            </label>
            <input 
              required 
              type="password"
              inputMode="numeric"
              maxLength={6}
              minLength={4}
              pattern="\d*"
              placeholder="••••••"
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-slate-800 tracking-widest text-lg"
              value={formData.pin}
              onChange={e => setFormData({...formData, pin: e.target.value.replace(/\D/g, '')})}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full mt-6 bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/30 hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : mode === 'login' ? (
              'Ingresar'
            ) : (
              'Crear Cuenta'
            )}
          </button>
        </form>
        
        <p className="text-center text-xs text-gray-400 mt-6">
          Al ingresar aceptas nuestros Términos y Políticas de Privacidad.
        </p>
      </div>
    </div>
  );
}

export default function GlubbiLogin() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <GlubbiLoginForm />
    </Suspense>
  );
}
