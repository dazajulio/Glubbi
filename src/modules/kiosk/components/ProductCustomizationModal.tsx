'use client';

import { useState, useEffect } from 'react';
import type { ProductWithModifiers, ModifierGroup, Modifier, ModifierSnapshot } from '@/types/database';
import { formatPrice } from '@/lib/utils';
import { X, Check, Plus, Minus } from 'lucide-react';

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
  // For multi-select groups, an array can contain duplicate Modifier objects representing quantity > 1
  const [selections, setSelections] = useState<Record<string, Modifier[]>>({});
  
  // Reset state when product changes
  useEffect(() => {
    if (product) {
      const prefilled: Record<string, Modifier[]> = {};

      (product.modifier_groups || []).forEach(group => {
        const availableMods = (group.modifiers || []).filter(m => m.is_available !== false);

        if (initialSelections && initialSelections.length > 0) {
          // Match snapshots back to actual modifiers
          const snapshotGroup = initialSelections.find(s => s.group === group.name);
          if (snapshotGroup) {
            const selectedMods: Modifier[] = [];
            snapshotGroup.items.forEach(item => {
              const qtyMatch = item.name.match(/^(\d+)x\s+(.+)$/);
              const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
              const cleanName = qtyMatch ? qtyMatch[2] : item.name;

              const targetMod = availableMods.find(m => m.name === cleanName || m.name === item.name);
              if (targetMod) {
                for (let i = 0; i < qty; i++) {
                  selectedMods.push(targetMod);
                }
              }
            });
            if (selectedMods.length > 0) {
              prefilled[group.id] = selectedMods;
            }
          }
        } else if (group.min_selections > 0 && availableMods.length > 0) {
          // Auto-select initial defaults if required group so modal opens valid
          const defaultCount = Math.min(group.min_selections, availableMods.length);
          const defaultMods: Modifier[] = [];
          
          if (group.max_selections === 1) {
            defaultMods.push(availableMods[0]);
          } else {
            // Distribute defaultCount across available modifiers
            for (let i = 0; i < defaultCount; i++) {
              defaultMods.push(availableMods[i % availableMods.length]);
            }
          }
          prefilled[group.id] = defaultMods;
        }
      });
      
      setSelections(prefilled);
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

  const extraPrice = Object.values(selections).flat().reduce((sum, mod) => sum + (mod?.extra_price || 0), 0);
  const totalPrice = basePrice + extraPrice;

  // Increments quantity of a modifier inside a group
  const addModifier = (group: ModifierGroup, modifier: Modifier) => {
    setSelections(prev => {
      const groupSelections = prev[group.id] || [];
      if (group.max_selections === 1) {
        return { ...prev, [group.id]: [modifier] };
      }
      if (groupSelections.length >= group.max_selections) {
        return prev;
      }
      return { ...prev, [group.id]: [...groupSelections, modifier] };
    });
  };

  // Decrements quantity of a modifier inside a group
  const removeModifier = (group: ModifierGroup, modifier: Modifier) => {
    setSelections(prev => {
      const groupSelections = prev[group.id] || [];
      const index = groupSelections.findIndex(m => m.id === modifier.id);
      if (index === -1) return prev;

      const newGroupSelections = [...groupSelections];
      newGroupSelections.splice(index, 1);
      return { ...prev, [group.id]: newGroupSelections };
    });
  };

  const handleAdd = () => {
    if (!isValid) return;
    
    try {
      // Build modifier snapshot
      const snapshots: ModifierSnapshot[] = [];
      
      (product.modifier_groups || []).forEach(group => {
        const selected = selections[group.id] || [];
        if (selected.length > 0) {
          const itemMap = new Map<string, { mod: Modifier; count: number }>();
          selected.forEach(mod => {
            const existing = itemMap.get(mod.id);
            if (existing) {
              existing.count += 1;
            } else {
              itemMap.set(mod.id, { mod, count: 1 });
            }
          });

          const snapshotItems = Array.from(itemMap.values()).map(({ mod, count }) => ({
            name: count > 1 ? `${count}x ${mod.name}` : mod.name,
            price: (mod.extra_price || 0) * count
          }));

          snapshots.push({
            group: group.name,
            items: snapshotItems
          });
        }
      });
      
      onAddToCart(product, snapshots, totalPrice);
    } catch (err) {
      console.error('Error adding product to cart:', err);
    } finally {
      onClose();
    }
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

        {/* Product Title and Description */}
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
              const groupSelections = selections[group.id] || [];
              const selectedCount = groupSelections.length;
              const isGroupValid = selectedCount >= group.min_selections && selectedCount <= group.max_selections;
              const isMultiSelect = group.max_selections > 1;

              return (
                <div key={group.id} className="space-y-4">
                  <div className="flex justify-between items-baseline border-b border-gray-200 pb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                      {isMultiSelect && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Seleccionadas: <strong className="text-gray-900">{selectedCount}</strong> de {group.max_selections}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
                      isGroupValid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {group.min_selections === group.max_selections && group.min_selections > 0
                        ? `Elige exacto ${group.min_selections}`
                        : group.min_selections > 0
                        ? `Obligatorio (${selectedCount}/${group.max_selections})`
                        : `Opcional (máx ${group.max_selections})`}
                    </span>
                  </div>
                  
                  <div className="space-y-2.5">
                    {(group.modifiers || []).filter(m => m.is_available !== false).map(modifier => {
                      const modCount = groupSelections.filter(m => m.id === modifier.id).length;
                      const isSelected = modCount > 0;
                      const isGroupFull = selectedCount >= group.max_selections;

                      return (
                        <div
                          key={modifier.id}
                          className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                            isSelected 
                              ? 'border-orange-500 bg-orange-50/50 shadow-sm' 
                              : 'border-gray-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {!isMultiSelect && (
                              <div className={`w-5 h-5 flex items-center justify-center rounded-full border ${
                                isSelected 
                                  ? 'bg-orange-500 border-orange-500 text-white' 
                                  : 'border-zinc-400 bg-white'
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5" />}
                              </div>
                            )}
                            <div>
                              <span className={`${isSelected ? 'text-slate-900 font-bold' : 'font-medium text-gray-800'}`}>
                                {modifier.name}
                              </span>
                              {modifier.extra_price > 0 && (
                                <span className="text-orange-600 text-xs font-semibold block">
                                  +{formatPrice(modifier.extra_price, currency)}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Single selection vs Multi-Quantity Stepper */}
                          {!isMultiSelect ? (
                            <button
                              type="button"
                              onClick={() => addModifier(group, modifier)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                isSelected
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {isSelected ? 'Seleccionado' : 'Seleccionar'}
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-1 shadow-xs">
                              <button
                                type="button"
                                disabled={modCount === 0}
                                onClick={() => removeModifier(group, modifier)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                  modCount > 0 
                                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                                    : 'text-gray-300 cursor-not-allowed'
                                }`}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              
                              <span className="w-6 text-center text-sm font-black text-slate-900">
                                {modCount}
                              </span>
                              
                              <button
                                type="button"
                                disabled={isGroupFull}
                                onClick={() => addModifier(group, modifier)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                  !isGroupFull 
                                    ? 'bg-orange-500 text-white hover:bg-orange-600' 
                                    : 'bg-slate-100 text-gray-300 cursor-not-allowed'
                                }`}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
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
