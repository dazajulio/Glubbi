'use client';

import { useCartStore } from '@/modules/kiosk/stores/cart-store';
import { formatPrice } from '@/lib/utils';
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight, Clock, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
  /** Called when the user picks "Enviar Pedido / Pagar al final" (mesa/mesero only) */
  onSendLater?: () => void;
  currency: string;
  onEditItem?: (item: any) => void;
  deliveryFee?: number;
  deliveryEnabled?: boolean;
  discountPercentage?: number;
  isDelivery?: boolean;
  /** True when this is a waiter or physical-table QR order */
  isMesaOrWaiter?: boolean;
}

export function CartDrawer({
  isOpen,
  onClose,
  onCheckout,
  onSendLater,
  currency,
  onEditItem,
  deliveryFee = 0,
  deliveryEnabled = false,
  discountPercentage = 0,
  isDelivery = false,
  isMesaOrWaiter = false,
}: CartDrawerProps) {
  const { items, removeItem, updateQuantity, getTotal, getItemCount } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!mounted) return null;

  const subtotal = getTotal();
  // Show delivery fee if it's a delivery order and fee > 0
  const showDeliveryFee = isDelivery && deliveryFee > 0;
  const discountedDelivery = showDeliveryFee ? deliveryFee * (1 - discountPercentage / 100) : 0;
  const grandTotal = subtotal + discountedDelivery;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 flex flex-col bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out h-[90vh] max-h-[90vh] ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900">Mi carrito</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {getItemCount()} {getItemCount() === 1 ? 'producto' : 'productos'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clear all */}
        {items.length > 0 && (
          <div className="px-6 pt-3 flex justify-end shrink-0">
            <button
              onClick={() => {
                if (window.confirm('¿Vaciar el carrito?')) {
                  useCartStore.getState().clearCart();
                }
              }}
              className="text-sm font-semibold brand-text hover:opacity-70 transition-opacity"
            >
              Vaciar
            </button>
          </div>
        )}

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 brand-text opacity-60" />
              </div>
              <p className="text-gray-500 font-medium">Tu carrito está vacío</p>
              <p className="text-gray-400 text-sm mt-1">Agrega productos del menú</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((item) => (
                <li key={item.id} className="py-4 flex gap-3 items-start">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-gray-100">
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-7 h-7 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm leading-tight">{item.product.name}</p>
                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5 leading-tight">
                        {item.selectedModifiers
                          .flatMap((g: any) => (g.items ?? []).map((i: any) => i.name))
                          .join(', ')}
                      </p>
                    )}
                    <p className="text-base font-black brand-text mt-1">
                      {formatPrice(item.unitPrice, currency)}
                    </p>

                    {/* Qty controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:border-red-400 hover:text-red-500 transition-colors"
                      >
                        {item.quantity === 1
                          ? <Trash2 className="w-3.5 h-3.5" />
                          : <Minus className="w-3.5 h-3.5" />}
                      </button>
                      <span className="w-6 text-center font-bold text-slate-900 text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:border-orange-400 hover:text-orange-500 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      {onEditItem && (
                        <button
                          onClick={() => { onClose(); onEditItem(item); }}
                          className="ml-auto text-xs text-gray-400 hover:text-slate-600 underline transition-colors"
                        >
                          Editar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Line subtotal */}
                  <div className="shrink-0 text-right pt-1">
                    <p className="font-bold text-slate-900 text-sm">
                      {formatPrice(item.subtotal, currency)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 pb-8 pt-4 border-t border-gray-100 bg-white shrink-0">
            {/* Price breakdown */}
            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Productos ({getItemCount()})</span>
                <span>{formatPrice(subtotal, currency)}</span>
              </div>

              {/* Delivery fee — only shown when enabled in gerente settings */}
              {showDeliveryFee && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Costo de envío</span>
                  <div className="text-right">
                    {discountPercentage > 0 ? (
                      <div className="flex flex-col items-end">
                        <span className="line-through text-gray-400 text-xs">
                          {formatPrice(deliveryFee, currency)}
                        </span>
                        <span className="font-semibold text-slate-700">
                          {formatPrice(discountedDelivery, currency)}
                        </span>
                        <span className="text-green-600 text-[10px] font-bold uppercase">
                          {discountPercentage}% de descuento
                        </span>
                      </div>
                    ) : (
                      <span>{formatPrice(deliveryFee, currency)}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <span className="text-lg font-black text-slate-900">Total</span>
                <span className="text-2xl font-black text-slate-900">
                  {formatPrice(grandTotal, currency)}
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            {isMesaOrWaiter && onSendLater ? (
              /* Mesa / Mesero: two options */
              <div className="space-y-3">
                <button
                  onClick={() => { onClose(); onCheckout(); }}
                  className="w-full brand-bg hover:brightness-110 text-white font-black text-base py-4 rounded-2xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Pagar Ahora
                </button>
                <button
                  onClick={() => { onClose(); onSendLater(); }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base py-4 rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Clock className="w-5 h-5" />
                  Enviar Pedido · Pagar al final
                </button>
              </div>
            ) : (
              /* Delivery / default: single CTA */
              <button
                onClick={() => { onClose(); onCheckout(); }}
                className="w-full brand-bg hover:brightness-110 text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Continuar compra
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
