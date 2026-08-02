'use client';

import { t } from '@/lib/i18n';
import { formatPrice } from '@/lib/utils';
import { CreditCard, Banknote, Loader2, Copy, Check } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PaymentMethodItem {
  id: string;
  title: string;
  currency?: 'VES' | 'USD';
  details: string;
  logoUrl: string;
}

interface CheckoutFormProps {
  total: number;
  currency: string;
  onSelectPayment: (method: PaymentMethodItem | { id: string; title: string; currency?: 'VES' | 'USD'; details: string; logoUrl: string }, verificationNotes?: string) => void;
  isProcessing: boolean;
  paymentMethod: any | null; // Selected method object
  paymentMethods: PaymentMethodItem[];
  isWaiter?: boolean;
  tables?: any[];
  selectedTableId?: string;
  onTableChange?: (tableId: string) => void;
  isPhysicalTable?: boolean;
}

export function CheckoutForm({
  total,
  currency,
  onSelectPayment,
  isProcessing,
  paymentMethod,
  paymentMethods = [],
  isWaiter = false,
  tables = [],
  selectedTableId = '',
  onTableChange,
  isPhysicalTable = false
}: CheckoutFormProps) {
  const [verificationMethod, setVerificationMethod] = useState<any | null>(null);
  const [bcvRate, setBcvRate] = useState<number>(0);
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [pmReference, setPmReference] = useState('');
  const [pmAmount, setPmAmount] = useState('');
  const [pmDate, setPmDate] = useState('');
  const [pmBank, setPmBank] = useState('');
  const [pmCedula, setPmCedula] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  useEffect(() => {
    if (paymentMethod) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [paymentMethod]);

  const handleCopyText = (key: string, textToCopy: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy.trim());
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleMethodClick = async (method: any) => {
    if (method.id === 'default') {
      onSelectPayment(method);
      return;
    }
    setVerificationMethod(method);
    
    // Only fetch BCV rate if method is in VES/Bolívares
    const isUSD = method.currency === 'USD' || (method.title && /zelle|paypal|binance|wise|dolar|usd/i.test(method.title));
    if (!isUSD) {
      setIsFetchingRate(true);
      try {
        const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        const data = await res.json();
        if (data.promedio) {
          setBcvRate(data.promedio);
        }
      } catch (err) {
        console.error('Error fetching BCV rate', err);
      }
      setIsFetchingRate(false);
    }
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pmReference || !pmAmount || !pmDate || !pmBank || !pmCedula) return;
    
    const currTag = verificationMethod?.currency === 'USD' ? '$ USD' : 'Bs.';
    const verificationNotes = `Validación: Ref: ${pmReference} | Monto: ${currTag} ${pmAmount} | Fecha: ${pmDate} | Banco: ${pmBank} | CI/RIF/Titular: ${pmCedula}`;
    onSelectPayment(verificationMethod, verificationNotes);
  };

  if (paymentMethod) {
    return (
      <div className="w-full max-w-md mx-auto text-center space-y-6 animate-fade-in p-8 bg-white shadow-sm rounded-3xl border border-gray-200">
        <div className="w-20 h-20 brand-bg rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/20 overflow-hidden bg-white border border-gray-100 p-2">
          {paymentMethod.logoUrl ? (
             <img src={paymentMethod.logoUrl} alt={paymentMethod.title} className="w-full h-full object-contain" />
          ) : (
            <CreditCard className="w-10 h-10 text-orange-500" />
          )}
        </div>
        <h3 className="text-2xl font-bold text-gray-900">¡Pedido Confirmado!</h3>
        <p className="text-gray-500 text-lg">
          Tu orden ha sido enviada a la cocina.
        </p>
        <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 inline-block w-full text-left space-y-2 mt-4">
          <p className="text-gray-800 text-center">Total a pagar:</p>
          <p className="text-3xl font-bold brand-text mt-1 text-center">{formatPrice(total, currency)}</p>
          <hr className="border-gray-200 my-4" />
          <p className="font-bold text-slate-800">Método: {paymentMethod.title}</p>
          {paymentMethod.details && (
            <div className="text-sm text-slate-600 whitespace-pre-wrap bg-white p-3 rounded-lg border border-gray-200 mt-2">
              {paymentMethod.details}
            </div>
          )}
          <p className="text-xs text-amber-600 mt-4 text-center">
            * El pedido no se entregará hasta confirmar el pago en caja.
          </p>
        </div>
      </div>
    );
  }

  if (verificationMethod) {
    const isUSD = verificationMethod.currency === 'USD' || (verificationMethod.title && /zelle|paypal|binance|wise|dolar|usd/i.test(verificationMethod.title));
    const bsCalculated = bcvRate ? (bcvRate * total).toFixed(2) : '';
    const formattedBs = bcvRate ? (bcvRate * total).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';

    const detailLines = (verificationMethod.details || '')
      .split('\n')
      .filter((l: string) => l.trim() !== '');

    return (
      <form onSubmit={handleVerificationSubmit} className="w-full max-w-md mx-auto space-y-6 animate-fade-in text-left">
        <div className="space-y-2 mb-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Validar Pago</h1>
          <p className="text-slate-500 text-sm">Realiza tu pago en <strong>{verificationMethod.title}</strong> y registra los datos abajo para procesar tu orden.</p>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
          {/* Amount Box */}
          <div className="flex justify-between items-center border-b border-emerald-200/60 pb-3">
            <div>
              <span className="text-slate-600 text-xs font-bold block">Monto Total a Pagar:</span>
              <span className="text-xs text-slate-400">Orden ({formatPrice(total, currency)})</span>
            </div>
            
            <div className="flex items-center gap-2">
              {isUSD ? (
                <>
                  <span className="text-base sm:text-lg font-extrabold text-emerald-600 font-mono">${total.toFixed(2)} USD</span>
                  <button
                    type="button"
                    onClick={() => handleCopyText('amount', total.toFixed(2))}
                    title="Copiar monto en USD"
                    className="flex items-center gap-1 bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold px-2.5 py-1 rounded-lg text-xs transition-all active:scale-95 shadow-xs"
                  >
                    {copiedKey === 'amount' ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold"><Check className="w-3.5 h-3.5" /> Copiado</span>
                    ) : (
                      <span className="flex items-center gap-1"><Copy className="w-3.5 h-3.5" /> Copiar</span>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="text-right">
                    <span className="text-base sm:text-lg font-extrabold text-emerald-600 font-mono block">
                      {isFetchingRate ? <Loader2 className="w-4 h-4 animate-spin inline text-emerald-600" /> : `Bs. ${formattedBs}`}
                    </span>
                  </div>
                  {bsCalculated && (
                    <button
                      type="button"
                      onClick={() => handleCopyText('amount', bsCalculated)}
                      title="Copiar monto en Bolívares"
                      className="flex items-center gap-1 bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold px-2.5 py-1 rounded-lg text-xs transition-all active:scale-95 shadow-xs"
                    >
                      {copiedKey === 'amount' ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-bold"><Check className="w-3.5 h-3.5" /> Copiado</span>
                      ) : (
                        <span className="flex items-center gap-1"><Copy className="w-3.5 h-3.5" /> Copiar</span>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Details Lines list with individual copy buttons */}
          <div className="space-y-2 pt-1">
            <p className="font-bold text-xs text-slate-700 uppercase tracking-wider">Datos para realizar el pago:</p>
            {detailLines.length === 0 ? (
              <div className="bg-white/70 p-3 rounded-xl border border-emerald-200/50 text-xs text-slate-500">
                No hay detalles específicos registrados.
              </div>
            ) : (
              detailLines.map((line: string, idx: number) => {
                // Extract value after colon if exists (e.g. "Teléfono: 04121234567" -> "04121234567")
                const parts = line.split(':');
                const copyableValue = parts.length > 1 ? parts.slice(1).join(':').trim() : line.trim();
                const key = `line-${idx}`;

                return (
                  <div key={key} className="bg-white p-3 rounded-xl border border-emerald-200/60 flex items-center justify-between gap-3 shadow-xs">
                    <span className="text-xs font-semibold text-slate-800 break-all">{line}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(key, copyableValue)}
                      title={`Copiar ${copyableValue}`}
                      className="shrink-0 flex items-center gap-1 bg-slate-50 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95"
                    >
                      {copiedKey === key ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Copiado</span>
                      ) : (
                        <span className="flex items-center gap-1"><Copy className="w-3.5 h-3.5" /> Copiar</span>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
          
          {!isUSD && (
            <div className="text-[11px] text-emerald-700 font-semibold pt-1 text-center border-t border-emerald-200/40">
              Tasa oficial BCV referencial: Bs. {bcvRate ? bcvRate.toLocaleString('es-VE', { minimumFractionDigits: 4 }) : '...'} / USD
            </div>
          )}
        </div>

        <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Número de Referencia / Comprobante *</label>
            <input 
              value={pmReference}
              onChange={e => setPmReference(e.target.value)}
              required 
              placeholder="Ej: 849201" 
              className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                {isUSD ? 'Monto Exacto (USD $) *' : 'Monto Exacto (Bs) *'}
              </label>
              <input 
                value={pmAmount}
                onChange={e => setPmAmount(e.target.value)}
                required 
                placeholder={isUSD ? `Ej: ${total.toFixed(2)}` : `Ej: ${bsCalculated || '1058.50'}`}
                className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Fecha del Pago *</label>
              <input 
                type="date"
                value={pmDate}
                onChange={e => setPmDate(e.target.value)}
                required 
                className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Banco / Plataforma *</label>
              <input 
                value={pmBank}
                onChange={e => setPmBank(e.target.value)}
                required 
                placeholder={isUSD ? 'Ej: Zelle / BofA' : 'Ej: Banesco'} 
                className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">CI / RIF / Titular *</label>
              <input 
                value={pmCedula}
                onChange={e => setPmCedula(e.target.value)}
                required 
                placeholder="Ej: V-12345678" 
                className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <button 
            type="submit"
            disabled={isProcessing || !pmReference || !pmAmount || !pmDate || !pmBank || !pmCedula}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-14 text-base transition-all shadow-[0_4px_20px_rgba(16,185,129,0.25)] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
          >
            {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</> : 'YA REALICÉ EL PAGO'}
          </button>
          <button 
            type="button"
            onClick={() => setVerificationMethod(null)}
            disabled={isProcessing}
            className="w-full text-center text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Elegir otro método
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-fade-in">
      
      {/* Table Selector for Waiter */}
      {isWaiter && tables.length > 0 && (
        <div className="p-6 bg-white shadow-sm rounded-3xl border border-gray-200 space-y-3">
          <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider">
            Mesa Destino del Pedido
          </label>
          <select 
            value={selectedTableId}
            onChange={(e) => onTableChange?.(e.target.value)}
            className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 px-4 text-slate-900 font-bold text-base focus:ring-2 focus:ring-orange-500/50 outline-none"
          >
            {tables.map((t: any) => {
              const cleanLabel = t.label?.startsWith('Mesero:') || t.label?.startsWith('Delivery:') ? null : t.label;
              return (
                <option key={t.id} value={t.id}>
                  {cleanLabel || `Mesa ${t.table_number}`}
                </option>
              );
            })}
          </select>
        </div>
      )}

      <div className="p-6 bg-slate-50 rounded-2xl border border-gray-200/50 flex justify-between items-center">
        <span className="text-gray-600 text-lg">Total del Pedido</span>
        <span className="text-2xl font-bold text-gray-900">{formatPrice(total, currency)}</span>
      </div>

      <div className="space-y-4 pt-4">
        {paymentMethods.length === 0 ? (
          isPhysicalTable ? (
            <button
              onClick={() => onSelectPayment({ id: 'default', title: 'Efectivo / Caja', details: 'Pagar directamente en la caja.', logoUrl: '' })}
              disabled={isProcessing}
              className="w-full bg-white shadow-sm hover:bg-slate-100 text-gray-900 font-bold text-lg py-5 px-6 rounded-2xl border border-gray-200 active:scale-[0.98] transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Banknote className="w-6 h-6 text-gray-500" />
                <span>Pago en Caja (Efectivo/Tarjeta)</span>
              </div>
              {isProcessing && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
            </button>
          ) : (
            <div className="p-5 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold rounded-2xl text-center">
              No hay métodos de pago digital activos configurados. Por favor contacta al restaurante para coordinar tu pago.
            </div>
          )
        ) : (
          <>
            {paymentMethods.map(pm => (
              <button
                key={pm.id}
                onClick={() => handleMethodClick(pm)}
                disabled={isProcessing}
                className="w-full bg-white shadow-sm hover:bg-slate-100 text-gray-900 font-bold text-lg py-5 px-6 rounded-2xl border border-gray-200 active:scale-[0.98] transition-all flex items-center justify-between group text-left"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                    {pm.logoUrl ? (
                      <img src={pm.logoUrl} alt={pm.title} className="w-full h-full object-contain" />
                    ) : (
                      <CreditCard className="w-6 h-6 text-orange-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="block font-bold text-slate-900">{pm.title}</span>
                  </div>
                </div>
                <div className="shrink-0">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : <span className="text-gray-300 group-hover:text-orange-500">&rarr;</span>}
                </div>
              </button>
            ))}

            {/* ONLY Allow "Pagar al Final en Mesa" for Physical Tables (QR Mesa) */}
            {isPhysicalTable && (
              <div className="pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => onSelectPayment({ id: 'default', title: 'Pagar al Final en Mesa / Caja', details: 'Pagar al finalizar la estadía en la mesa.', logoUrl: '' })}
                  disabled={isProcessing}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm py-3.5 px-4 rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <Banknote className="w-4 h-4 text-slate-500" />
                  <span>📌 Pagar al finalizar en Mesa (Caja / Mesero)</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
