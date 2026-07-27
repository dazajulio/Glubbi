'use client';

import { useState, useEffect } from 'react';
import type { ProductWithModifiers } from '@/types/database';
import { formatPrice } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { Plus, Minus } from 'lucide-react';
import { useCartStore } from '@/modules/kiosk/stores/cart-store';

interface UpsellModalProps {
  products: ProductWithModifiers[];
  onAdd: (product: ProductWithModifiers) => void;
  onSkip: () => void;
  isOpen: boolean;
  currency: string;
}

export function UpsellModal({ products, onAdd, onSkip, isOpen, currency }: UpsellModalProps) {
  const [mounted, setMounted] = useState(false);
  const [hasAdded, setHasAdded] = useState(false);
  const { items, updateQuantity } = useCartStore();

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setHasAdded(false);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted || !isOpen || products.length === 0) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-white/60 backdrop-blur-sm transition-opacity animate-fade-in"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white shadow-sm rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl pointer-events-auto animate-scale-in">
          
          {/* Header */}
          <div className="p-6 text-center border-b border-gray-100">
            <h3 className="text-xl font-bold text-slate-900 mb-2">{t('upsellTitle')}</h3>
            <p className="text-gray-500 text-sm">Complementa tu pedido con estas opciones</p>
          </div>

          {/* Product List */}
          <div className="max-h-[50vh] overflow-y-auto p-2">
            {products.slice(0, 3).map((product) => (
              <div key={product.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">Sin img</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 truncate">{product.name}</h4>
                  <p className="brand-text font-medium text-sm mt-1">
                    +{formatPrice(product.base_price, currency)}
                  </p>
                </div>
                
                {(() => {
                  const cartItem = items.find(item => item.product.id === product.id && item.selectedModifiers.length === 0);
                  const quantity = cartItem ? cartItem.quantity : 0;
                  
                  if (quantity > 0) {
                    return (
                      <div className="flex items-center gap-3 bg-slate-100 rounded-full p-1 border border-gray-200">
                        <button 
                          onClick={() => updateQuantity(cartItem!.id, quantity - 1)} 
                          className="w-8 h-8 rounded-full bg-zinc-700 text-white flex items-center justify-center hover:bg-zinc-600 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-slate-900 w-4 text-center">{quantity}</span>
                        <button 
                          onClick={() => updateQuantity(cartItem!.id, quantity + 1)} 
                          className="w-8 h-8 rounded-full brand-bg text-white flex items-center justify-center hover:brightness-110 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  }
                  
                  return (
                    <button
                      onClick={() => {
                        onAdd(product);
                        setHasAdded(true);
                      }}
                      className="brand-bg hover:brightness-110 text-white rounded-full p-2.5 transition-all shadow-sm active:scale-95 flex-shrink-0"
                      aria-label={t('upsellAdd')}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  );
                })()}
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          {(() => {
            const addedCount = products.reduce((acc, p) => {
              const cartItem = items.find(item => item.product.id === p.id && item.selectedModifiers.length === 0);
              return acc + (cartItem ? cartItem.quantity : 0);
            }, 0);
            const hasAddedAny = addedCount > 0;

            return (
              <div className="p-4 bg-slate-50">
                <button
                  onClick={onSkip}
                  className={`w-full py-4 font-bold rounded-xl transition-all active:scale-[0.98] ${
                    hasAddedAny 
                      ? 'brand-bg text-white shadow-lg shadow-orange-500/20 hover:brightness-110' 
                      : 'bg-slate-100 text-gray-800 hover:text-white hover:bg-zinc-700'
                  }`}
                >
                  {hasAddedAny ? '✓ Confirmar y Continuar al Pago' : t('upsellSkip')}
                </button>
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
}
