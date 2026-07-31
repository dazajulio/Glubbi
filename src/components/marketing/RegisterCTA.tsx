'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function RegisterCTA() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const form = new FormData(e.currentTarget);
    const payload = {
      restaurantName: form.get('restaurantName'),
      contactName: form.get('contactName'),
      email: form.get('email'),
      phone: form.get('phone'),
      inquiryType: form.get('inquiryType'),
      message: form.get('message'),
    };

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Algo salió mal.');
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'No pudimos enviar tu solicitud. Intenta de nuevo.');
    }
  }

  return (
    <section id="registro" className="py-24 relative overflow-hidden bg-white">
      <div
        className="absolute inset-0 bg-gradient-to-b from-orange-500/[0.02] via-transparent to-transparent pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative max-w-2xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-6">
            ¿Quieres contactar a nuestro equipo?
          </h2>
          <p className="text-slate-600 text-lg">
            Nuestro equipo configura tu menú inicial y te contacta para el onboarding.
          </p>
        </div>

        {status === 'success' ? (
          <div className="flex flex-col items-center text-center gap-4 bg-emerald-50/50 border border-emerald-100 rounded-3xl p-10 shadow-sm shadow-emerald-50/20">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            <h3 className="text-xl font-bold text-slate-900">¡Consulta recibida!</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Hemos enviado los detalles de tu consulta a nuestro equipo. Te contactaremos muy pronto.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-slate-50 border border-slate-100 rounded-3xl p-6 md:p-10 space-y-5 shadow-sm shadow-slate-100/50"
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="restaurantName" className="block text-sm font-medium text-slate-600 mb-2">
                  Nombre del restaurante o negocio
                </label>
                <input
                  id="restaurantName"
                  name="restaurantName"
                  required
                  placeholder="Ej: Tu Restaurante"
                  className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors text-sm"
                />
              </div>
              <div>
                <label htmlFor="contactName" className="block text-sm font-medium text-slate-600 mb-2">
                  Tu nombre
                </label>
                <input
                  id="contactName"
                  name="contactName"
                  required
                  placeholder="Ej: Tu Nombre Completo"
                  className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors text-sm"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="tu@restaurante.com"
                  className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors text-sm"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-600 mb-2">
                  Teléfono <span className="text-slate-400">(opcional)</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  placeholder="+1 555 123 4567"
                  className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="inquiryType" className="block text-sm font-medium text-slate-600 mb-2">
                ¿De qué se trata tu consulta?
              </label>
              <select
                id="inquiryType"
                name="inquiryType"
                defaultValue="Registros/Onboarding"
                className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors text-sm"
              >
                <option value="Registros/Onboarding">Registros / Onboarding</option>
                <option value="Alianzas">Alianzas</option>
                <option value="Partners">Partners</option>
                <option value="Desarrolladores">Desarrolladores</option>
                <option value="Cadenas de restaurantes">Cadenas de restaurantes</option>
                <option value="Centros comerciales">Centros comerciales</option>
                <option value="Otros">Otros</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-slate-600 mb-2">
                Mensaje <span className="text-slate-400">(opcional)</span>
              </label>
              <textarea
                id="message"
                name="message"
                rows={3}
                placeholder="Cuéntanos un poco más sobre lo que necesitas..."
                className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors text-sm resize-none"
              />
            </div>

            {status === 'error' && (
              <p className="text-red-500 text-xs font-semibold">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-xl h-14 text-lg transition-all shadow-md shadow-orange-500/20 active:scale-[0.98]"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar consulta'
              )}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
