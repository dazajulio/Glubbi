'use client';

import type { OrderWithItems } from '@/types/database';
import { formatPrice } from '@/lib/utils';
import { getCustomerName, getValidationDetails } from '@/modules/kds/components/OrderCard';
import { X, CreditCard, CheckCircle2, Clock, Building2, Hash, DollarSign, Calendar, User, FileText } from 'lucide-react';

interface PaymentDetailsModalProps {
  order: OrderWithItems | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment?: (orderId: string, reference: string) => void;
}

export function PaymentDetailsModal({ order, isOpen, onClose, onConfirmPayment }: PaymentDetailsModalProps) {
  if (!isOpen || !order) return null;

  const isPaid = order.payment_status === 'paid';
  const validationDetails = getValidationDetails(order.notes);
  const customerName = getCustomerName(order);

  // Determine readable payment method
  const getMethodName = () => {
    if (order.payment_method === 'stripe') return 'Tarjeta de Crédito / Débito (Stripe)';
    if (order.payment_method === 'pago_movil' || validationDetails) return 'Pago Móvil';
    if ((order.payment_method as any) === 'terminal') return 'Punto de Venta / Terminal';
    if (order.payment_method === 'cash') return 'Efectivo';
    return order.payment_method || 'Registrado por el Restaurante';
  };

  const handleConfirm = () => {
    const ref = validationDetails?.ref || window.prompt('Ingrese referencia de pago (Ej. 1234 o Tarjeta):', validationDetails?.ref || '');
    if (ref && onConfirmPayment) {
      onConfirmPayment(order.id, ref);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div 
        className="bg-white shadow-2xl w-full max-w-lg rounded-3xl border border-gray-100 max-h-[90vh] flex flex-col overflow-hidden animate-scale-in text-left"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Detalles del Pago</h2>
              <p className="text-xs text-gray-500 font-mono">Orden #{order.order_number}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200/60 rounded-full text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* Main Status & Amount Card */}
          <div className="bg-slate-50 border border-gray-200/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Estado de Transacción</span>
              {isPaid ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Pagado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <Clock className="w-3.5 h-3.5" /> Pendiente de Pago
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-between pt-2 border-t border-gray-200/60">
              <div>
                <p className="text-xs text-gray-500">Monto Total de la Orden</p>
                <p className="text-3xl font-black text-slate-900">{formatPrice(order.total_amount, 'USD')}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Método Registrado</p>
                <p className="text-sm font-bold text-orange-600">{getMethodName()}</p>
              </div>
            </div>
          </div>

          {/* Reference Payment Details Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-orange-500" /> Valores Referenciales del Pago
            </h3>

            {validationDetails ? (
              <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-4 space-y-3 text-sm">
                {validationDetails.destino && (
                  <div className="flex items-center justify-between border-b border-orange-200/50 pb-2">
                    <span className="text-gray-600 flex items-center gap-1.5"><Building2 className="w-4 h-4 text-orange-500"/> Cuenta Destino del Local:</span>
                    <span className="font-bold text-orange-600 bg-white px-2 py-0.5 rounded border border-orange-200">{validationDetails.destino}</span>
                  </div>
                )}
                {validationDetails.ref && (
                  <div className="flex items-center justify-between border-b border-orange-200/50 pb-2">
                    <span className="text-gray-600 flex items-center gap-1.5"><Hash className="w-4 h-4 text-orange-500"/> N° Referencia:</span>
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-orange-200">{validationDetails.ref}</span>
                  </div>
                )}
                {validationDetails.banco && (
                  <div className="flex items-center justify-between border-b border-orange-200/50 pb-2">
                    <span className="text-gray-600 flex items-center gap-1.5"><Building2 className="w-4 h-4 text-orange-500"/> Banco Emisor:</span>
                    <span className="font-bold text-slate-900">{validationDetails.banco}</span>
                  </div>
                )}
                {validationDetails.monto && (
                  <div className="flex items-center justify-between border-b border-orange-200/50 pb-2">
                    <span className="text-gray-600 flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-orange-500"/> Monto Reportado:</span>
                    <span className="font-extrabold text-orange-600">{validationDetails.monto}</span>
                  </div>
                )}
                {validationDetails.fecha && (
                  <div className="flex items-center justify-between border-b border-orange-200/50 pb-2">
                    <span className="text-gray-600 flex items-center gap-1.5"><Calendar className="w-4 h-4 text-orange-500"/> Fecha de Pago:</span>
                    <span className="font-medium text-slate-900">{validationDetails.fecha}</span>
                  </div>
                )}
                {validationDetails.ci && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-1.5"><User className="w-4 h-4 text-orange-500"/> CI / RIF Pagador:</span>
                    <span className="font-mono font-bold text-slate-900">{validationDetails.ci}</span>
                  </div>
                )}
              </div>
            ) : order.stripe_payment_intent_id ? (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-blue-800 font-bold">Stripe Payment Intent:</span>
                  <span className="font-mono text-xs text-blue-900 bg-white px-2 py-1 rounded border border-blue-200">{order.stripe_payment_intent_id}</span>
                </div>
                <p className="text-xs text-blue-700">Procesado de forma segura mediante la pasarela de pagos Stripe.</p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-600 space-y-2">
                <p className="font-medium">Transacción registrada en el terminal del restaurante.</p>
                <p className="text-xs text-gray-400">Método seleccionado: <strong className="text-slate-700">{getMethodName()}</strong></p>
              </div>
            )}
          </div>

          {/* Customer & Order Context */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center text-gray-500">
              <span>Fecha de Registro de Orden:</span>
              <span className="font-bold text-slate-800">{new Date(order.created_at).toLocaleString()}</span>
            </div>
            {customerName && (
              <div className="flex justify-between items-center text-gray-500">
                <span>Cliente Registrado:</span>
                <span className="font-bold text-slate-800">{customerName}</span>
              </div>
            )}
            {order.table?.label && (
              <div className="flex justify-between items-center text-gray-500">
                <span>Ubicación / Mesa:</span>
                <span className="font-bold text-slate-800">{order.table.label}</span>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors text-sm"
          >
            Cerrar
          </button>
          {!isPaid && onConfirmPayment && (
            <button
              onClick={handleConfirm}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors text-sm shadow-md flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Confirmar y Marcar Pago
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
