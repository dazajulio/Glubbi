'use client';

import { useState } from 'react';
import type { ProductWithModifiers } from '@/types/database';
import { formatPrice, truncate } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  product: ProductWithModifiers;
  onAdd: (product: ProductWithModifiers) => void;
  currency: string;
}

export function ProductCard({ product, onAdd, currency }: ProductCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);

  const hasDiscount = (product as any).discount_percentage > 0;
  const discountedPrice = hasDiscount 
    ? product.base_price - (product.base_price * ((product as any).discount_percentage / 100))
    : product.base_price;

  return (
    <div className="group flex flex-col bg-white shadow-sm/40 border border-gray-200/50 rounded-2xl overflow-hidden card-hover">
      {/* Product Image Area */}
      <div 
        className="relative aspect-[4/3] w-full bg-white shadow-sm overflow-hidden cursor-pointer"
        onClick={() => onAdd(product)}
      >
        {product.is_featured && !hasDiscount && (
          <div className="absolute top-3 left-3 z-10 brand-bg text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
            Popular
          </div>
        )}
        
        {hasDiscount && (
          <div className="absolute top-3 left-3 z-10 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
            <span>OFERTA</span>
            <span className="bg-white/20 px-1 rounded">{(product as any).discount_percentage}%</span>
          </div>
        )}
        
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
              imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 text-gray-500">
            <span className="text-sm">Sin imagen</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-lg text-slate-900 mb-1">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">
            {product.description}
          </p>
        )}
        
        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through mb-0.5">
                {formatPrice(product.base_price, currency)}
              </span>
            )}
            <span className={`font-semibold ${hasDiscount ? 'text-rose-600' : 'text-slate-900'}`}>
              {formatPrice(discountedPrice, currency)}
            </span>
          </div>
          <button
            onClick={() => onAdd(product)}
            className="brand-bg hover:brightness-110 text-white rounded-full p-2 transition-all flex items-center justify-center shadow-sm active:scale-95"
            aria-label={t('addToCart')}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
