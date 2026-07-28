'use client';

import { useState, useEffect } from 'react';
import type { ProductWithModifiers, ModifierGroup, Modifier, ModifierSnapshot } from '@/types/database';
import { formatPrice } from '@/lib/utils';
import { X, Check } from 'lucide-react';

interface ProductCustomizationModalProps {
  product: ProductWithModifiers | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: ProductWithModifiers, selectedModifiers: ModifierSnapshot[], unitPrice: number) => void;
  currency: string;
  initialSelections?: ModifierSnapshot[];
  isEditing?: boolean;
}

export function ProductCustomizationModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  currency,
  initialSelections,
  isEditing
}: ProductCustomizationModalProps) {
  // Use a map to store selected modifiers by group ID: Record<string, Modifier[]>
  const [selections, setSelections] = useState<Record<string, Modifier[]>>({});
  
  // Reset state when product changes
  useEffect(() => {
    if (product) {
      if (initialSelections && initialSelections.length > 0) {
        const prefilled: Record<string, Modifier[]> = {};
        
        // Match snapshots back to actual modifiers
        (product.modifier_groups || []).forEach(group => {
          const snapshotGroup = initialSelections.find(s => s.group === group.name);
          if (snapshotGroup) {
            const selectedMods = group.modifiers.filter(m => 
              snapshotGroup.items.some(item => item.name === m.name)
            );
            if (selectedMods.length > 0) {
              prefilled[group.id] = selectedMods;
            }
          }
        });
        
        setSelections(prefilled);
      } else {
        setSelections({});
      }
    }
  }, [product, initialSelections]);

  if (!isOpen || !product) return null;

  // Check if current selections satisfy all group rules
  const isValid = (product.modifier_groups || []).every(group => {
    const selectedCount = (selections[group.id] || []).length;
    return selectedCount >= group.min_selections && selectedCount <= group.max_selections;
  });

  // Calculate current dynamic price
  const hasDiscount = (product as any).discount_percentage > 0;
  const basePrice = hasDiscount 
    ? product.base_price - (product.base_price * ((product as any).discount_percentage / 100))
    : product.base_price;

  const extraPrice = Object.values(selections).flat().reduce((sum, mod) => sum + mod.extra_price, 0);
  const totalPrice = basePrice + extraPrice;

  const toggleModifier = (group: ModifierGroup, modifier: Modifier) => {
    setSelections(prev => {
      const groupSelections = prev[group.id] || [];
      const isSelected = groupSelections.some(m => m.id === modifier.id);
      
      let newGroupSelections: Modifier[];
      
      if (isSelected) {
        // Deselect
        newGroupSelections = groupSelections.filter(m => m.id !== modifier.id);
      } else {
        // Select
        if (group.max_selections === 1) {
          // Radio behavior: replace current selection
          newGroupSelections = [modifier];
        } else if (groupSelections.length < group.max_selections) {
          // Checkbox behavior: add to selection
          newGroupSelections = [...groupSelections, modifier];
        } else {
          // Max reached, do nothing
          return prev;
        }
      }
      
      return {
        ...prev,
        [group.id]: newGroupSelections
      };
    });
  };

  const handleAdd = () => {
    if (!isValid) return;
    
    // Build modifier snapshot
    const snapshots: ModifierSnapshot[] = [];
    
    (product.modifier_groups || []).forEach(group => {
      const selected = selections[group.id];
      if (selected && selected.length > 0) {
        snapshots.push({
          group: group.name,
          items: selected.map(mod => ({
            name: mod.name,
            price: mod.extra_price
          }))
        });
      }
    });
    
    onAddToCart(product, snapshots, totalPrice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center bg-white/60 backdrop-blur-sm transition-opacity">
      <div 
        className="w-full sm:max-w-lg bg-white shadow-sm rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up sm:animate-scale-in border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with image */}
        <div className="relative h-48 sm:h-64 bg-slate-100 shrink-0">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Sin imagen
            </div>
          )}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Product Title and Description (Moved below image) */}
        <div className="p-4 sm:p-6 bg-white border-b border-gray-100 shrink-0">
          <h2 className="text-2xl font-black text-slate-900">{product.name}</h2>
          {product.description && (
            <p className="text-gray-500 text-sm mt-2">{product.description}</p>
          )}
        </div>

        {/* Modifiers List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 custom-scrollbar bg-slate-50">
          {(product.modifier_groups || []).length === 0 ? (
            <p className="text-gray-500 text-center py-8">Este producto no tiene opciones adicionales.</p>
          ) : (
            (product.modifier_groups || []).map(group => {
              const selectedCount = (selections[group.id] || []).length;
              const isGroupValid = selectedCount >= group.min_selections && selectedCount <= group.max_selections;
              
              return (
                <div key={group.id} className="space-y-4">
                  <div className="flex justify-between items-baseline border-b border-gray-200 pb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-md ${
                      isGroupValid ? 'bg-slate-100 text-gray-500' : 'bg-red-500/20 text-red-400 font-medium'
                    }`}>
                      {group.min_selections === group.max_selections && group.min_selections > 0
                        ? `Elige ${group.min_selections}`
                        : group.min_selections > 0
                        ? `Obligatorio (mín ${group.min_selections})`
                        : `Opcional (máx ${group.max_selections})`}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {group.modifiers.filter(m => m.is_available !== false).map(modifier => {
                      const isSelected = (selections[group.id] || []).some(m => m.id === modifier.id);
                      // Disable if max reached and this one is not selected
                      const isDisabled = !isSelected && selectedCount >= group.max_selections && group.max_selections > 1;
                      
                      return (
                        <button
                          key={modifier.id}
                          disabled={isDisabled}
                          onClick={() => toggleModifier(group, modifier)}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                            isSelected 
                              ? 'border-green-500 bg-green-50' 
                              : 'border-gray-200 bg-white hover:bg-slate-50'
                          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 flex items-center justify-center border ${
                              group.max_selections === 1 ? 'rounded-full' : 'rounded-md'
                            } ${
                              isSelected 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-zinc-400 bg-white'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                            <span className={`${isSelected ? 'text-green-700 font-bold' : 'font-medium text-gray-800'}`}>
                              {modifier.name}
                            </span>
                          </div>
                          
                          {modifier.extra_price > 0 && (
                            <span className="text-gray-500 text-sm font-medium">
                              +{formatPrice(modifier.extra_price, currency)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-white shadow-sm border-t border-gray-200">
          <button
            disabled={!isValid}
            onClick={handleAdd}
            className={`w-full py-4 rounded-xl font-bold text-lg flex justify-between items-center px-6 transition-all shadow-lg active:scale-[0.98] ${
              isValid 
                ? 'brand-bg text-white hover:brightness-110' 
                : 'bg-slate-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>{isEditing ? 'Actualizar Pedido' : 'Agregar al carrito'}</span>
            <span>{formatPrice(totalPrice, currency)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
