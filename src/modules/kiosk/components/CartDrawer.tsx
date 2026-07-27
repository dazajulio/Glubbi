'use client';

import { useCartStore } from '@/modules/kiosk/stores/cart-store';
import { formatPrice } from '@/lib/utils';
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
  currency: string;
  onEditItem?: (item: any) => void;
  deliveryFee?: number;
  discountPercentage?: number;
  isDelivery?: boolean;
}

export function CartDrawer({ isOpen, onClose, onCheckout, currency, onEditItem, deliveryFee = 0, discountPercentage = 0, isDelivery = false }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, getTotal, getItemCount } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted) return null;

  const subtotal = getTotal();
  const effectiveDeliveryFee = isDelivery ? deliveryFee * (1 - discountPercentage / 100) : 0;
  const grandTotal = subtotal + effectiveDeliveryFee;

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
            <p className="text-sm text-gray-400 mt-0.5">{getItemCount()} {getItemCount() === 1 ? 'producto' : 'productos'}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clear cart link */}
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
              <div className="w-16 h-16 brand-bg/10 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 brand-text opacity-60" />
              </div>
              <p className="text-gray-500 font-medium">Tu carrito está vacío</p>
              <p className="text-gray-400 text-sm mt-1">Agrega productos del menú</p>
            </div>
          ) : (
            <ul className="space-y-1 divide-y divide-gray-100">
              {items.map((item) => (
                <li key={item.id} className="py-4 flex gap-3">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-gray-100">
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-7 h-7 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm leading-tight truncate">{item.product.name}</p>
                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5 leading-tight">
                        {item.selectedModifiers.flatMap((g: any) => g.items?.map((i: any) => i.name) ?? []).join(', ')}
                      </p>
                    )}
                    <p className="text-base font-black brand-text mt-1">{formatPrice(item.unitPrice, currency)}</p>

                    {/* Qty controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:border-red-400 hover:text-red-500 transition-colors"
                      >
                        {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
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
                          onClick={() => {
                            onClose();
                            onEditItem(item);
                          }}
                          className="ml-auto text-xs text-gray-400 hover:text-slate-600 underline transition-colors"
                        >
                          Editar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-slate-900 text-sm">{formatPrice(item.subtotal, currency)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer / Checkout */}
        {items.length > 0 && (
          <div className="px-6 pb-8 pt-4 border-t border-gray-100 bg-white shrink-0">
            {/* Price breakdown */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Productos ({getItemCount()})</span>
                <span>{formatPrice(subtotal, currency)}</span>
              </div>
              {isDelivery && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Costo de envío</span>
                  <div className="text-right">
                    {discountPercentage > 0 ? (
                      <>
                        <span className="line-through text-gray-400 mr-1">{formatPrice(deliveryFee, currency)}</span>
                        <span className="font-semibold text-slate-700">{formatPrice(effectiveDeliveryFee, currency)}</span>
                        <p className="text-green-600 text-[10px] font-bold uppercase">{discountPercentage}% dto.</p>
                      </>
                    ) : (
                      <span>{formatPrice(effectiveDeliveryFee, currency)}</span>
                    )}
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <span className="text-lg font-black text-slate-900">Total</span>
                <span className="text-2xl font-black text-slate-900">{formatPrice(grandTotal, currency)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className="w-full brand-bg hover:brightness-110 text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Continuar compra
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
