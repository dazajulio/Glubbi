'use client';

import { ShoppingBag, Bike, ChevronRight, Store } from 'lucide-react';

interface OrderTypeSelectorProps {
  onSelectType: (type: 'pickup' | 'delivery') => void;
  deliveryEnabled?: boolean;
}

export function OrderTypeSelector({ onSelectType, deliveryEnabled = true }: OrderTypeSelectorProps) {
  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-fade-in p-2">
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">¿Cómo prefieres recibir tu pedido?</h2>
        <p className="text-gray-500 text-sm">Selecciona la opción de tu preferencia para continuar.</p>
      </div>

      <div className="space-y-4">
        {/* Option 1: Pickup / Retiro en Local */}
        <button
          onClick={() => onSelectType('pickup')}
          className="w-full bg-white shadow-sm hover:shadow-md border-2 border-gray-100 hover:border-orange-500 rounded-3xl p-6 transition-all duration-200 group text-left flex items-center justify-between active:scale-[0.98]"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                Yo busco mi pedido
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Retira directamente en el establecimiento sin costo adicional.
              </p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
        </button>

        {/* Option 2: Delivery */}
        {deliveryEnabled ? (
          <button
            onClick={() => onSelectType('delivery')}
            className="w-full bg-white shadow-sm hover:shadow-md border-2 border-gray-100 hover:border-orange-500 rounded-3xl p-6 transition-all duration-200 group text-left flex items-center justify-between active:scale-[0.98]"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Bike className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                  Envío a domicilio
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Recibe tu comida directamente en tu casa u oficina.
                </p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
          </button>
        ) : (
          <div className="w-full bg-slate-50 border border-gray-200/80 rounded-3xl p-5 text-center text-gray-400 text-xs">
            🛵 El servicio de envío a domicilio no está disponible en este momento.
          </div>
        )}
      </div>
    </div>
  );
}
