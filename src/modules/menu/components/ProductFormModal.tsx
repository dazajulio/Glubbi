'use client';

import { useState, useEffect } from 'react';
import type { Category } from '@/types/database';
import { X, Plus, Trash2, Copy } from 'lucide-react';
import { createClient, GLUBBI_ID } from '@/lib/supabase/client';
import { compressImage } from '@/lib/image-compression';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  restaurantId: string;
  categories: Category[];
  productToEdit?: any;
}

interface ModifierInput {
  name: string;
  extra_price: number;
}

interface GroupInput {
  name: string;
  is_required: boolean;
  min_selections: number;
  max_selections: number;
  modifiers: ModifierInput[];
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSaved,
  restaurantId,
  categories,
  productToEdit
}: ProductFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [hasOffer, setHasOffer] = useState(false);
  const [groups, setGroups] = useState<GroupInput[]>([]);

  // States for "Copiar de otro plato" feature
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [existingProductsWithGroups, setExistingProductsWithGroups] = useState<any[]>([]);
  const [selectedProductToCopy, setSelectedProductToCopy] = useState<string>('');
  const [isLoadingCopyProducts, setIsLoadingCopyProducts] = useState(false);

  const handleOpenCopyModal = async () => {
    setIsCopyModalOpen(true);
    setIsLoadingCopyProducts(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('products')
        .select('id, name, modifier_groups(*, modifiers(*))')
        .eq('restaurant_id', restaurantId);

      if (data) {
        // Filter out current product if editing and keep products with modifier groups
        const filtered = data.filter(
          (p: any) => p.id !== (productToEdit?.id || '') && p.modifier_groups && p.modifier_groups.length > 0
        );
        setExistingProductsWithGroups(filtered);
        if (filtered.length > 0) {
          setSelectedProductToCopy(filtered[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching products for copy:', err);
    } finally {
      setIsLoadingCopyProducts(false);
    }
  };

  const handleCopyGroups = () => {
    const prod = existingProductsWithGroups.find(p => p.id === selectedProductToCopy);
    if (!prod || !prod.modifier_groups) return;

    const copiedGroups: GroupInput[] = prod.modifier_groups.map((g: any) => ({
      name: g.name,
      is_required: g.is_required || false,
      min_selections: g.min_selections || 0,
      max_selections: g.max_selections || 1,
      modifiers: (g.modifiers || []).map((m: any) => ({
        name: m.name,
        extra_price: m.extra_price || 0
      }))
    }));

    setGroups(prev => [...prev, ...copiedGroups]);
    setIsCopyModalOpen(false);
  };

  // Use useEffect to reset state when modal opens or productToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setName(productToEdit.name || '');
        setDescription(productToEdit.description || '');
        setPrice(productToEdit.base_price || 0);
        setCategoryId(productToEdit.category_id || (categories[0]?.id || ''));
        setImageUrl(productToEdit.image_url || '');
        setHasOffer((productToEdit.discount_percentage || 0) > 0);
        setDiscountPercentage(productToEdit.discount_percentage || 0);
        
        // Map groups
        if (productToEdit.modifier_groups) {
          const mappedGroups = productToEdit.modifier_groups.map((g: any) => ({
            name: g.name,
            is_required: g.is_required,
            min_selections: g.min_selections,
            max_selections: g.max_selections,
            modifiers: (g.modifiers || []).map((m: any) => ({
              name: m.name,
              extra_price: m.extra_price
            }))
          }));
          setGroups(mappedGroups);
        } else {
          setGroups([]);
        }
      } else {
        setName('');
        setDescription('');
        setPrice(0);
        setCategoryId(categories[0]?.id || '');
        setImageUrl('');
        setHasOffer(false);
        setDiscountPercentage(0);
        setGroups([]);
      }
    }
  }, [isOpen, productToEdit, categories]);

  if (!isOpen) return null;

  const addGroup = () => {
    setGroups([...groups, { name: '', is_required: false, min_selections: 0, max_selections: 1, modifiers: [] }]);
  };

  const removeGroup = (idx: number) => {
    setGroups(groups.filter((_, i) => i !== idx));
  };

  const addModifier = (groupIdx: number) => {
    const newGroups = [...groups];
    newGroups[groupIdx].modifiers.push({ name: '', extra_price: 0 });
    setGroups(newGroups);
  };

  const removeModifier = (groupIdx: number, modIdx: number) => {
    const newGroups = [...groups];
    newGroups[groupIdx].modifiers = newGroups[groupIdx].modifiers.filter((_, i) => i !== modIdx);
    setGroups(newGroups);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/menu/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_product',
          payload: {
            id: productToEdit?.id || null,
            restaurant_id: restaurantId,
            category_id: categoryId,
            name,
            description,
            base_price: price,
            discount_percentage: hasOffer ? discountPercentage : 0,
            image_url: imageUrl || null,
            groups
          }
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'No se pudo guardar el plato.');
      }

      onSaved();
      onClose();
    } catch (error: any) {
      console.error('Error saving product:', error);
      alert('Error al guardar el producto: ' + (error.message || ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-center bg-white/80 backdrop-blur-sm p-4">
      <div className="bg-white shadow-sm w-full max-w-2xl rounded-2xl border border-gray-200 max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-slate-900">{productToEdit ? 'Editar Plato' : 'Añadir Nuevo Plato'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Nombre del plato *</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-brand-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Categoría *</label>
                <select required value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-brand-primary outline-none">
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Descripción</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-brand-primary outline-none" rows={2} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Precio Base ($) *</label>
                <input required type="number" step="0.01" min="0" value={price} onChange={e => setPrice(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-brand-primary outline-none" />
              </div>
              <div className="flex flex-col">
                <label className="block text-sm text-gray-500 mb-1">Imagen del Plato (Opcional)</label>
                <div className="flex gap-2 mb-2">
                  <button 
                    type="button" 
                    onClick={() => setUploadMode('url')} 
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${uploadMode === 'url' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : 'bg-white shadow-sm border border-gray-200 text-gray-500 hover:bg-slate-100'}`}
                  >
                    Enlace (URL)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setUploadMode('file')} 
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${uploadMode === 'file' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : 'bg-white shadow-sm border border-gray-200 text-gray-500 hover:bg-slate-100'}`}
                  >
                    Subir Archivo
                  </button>
                </div>
                
                {uploadMode === 'url' ? (
                  <input type="url" placeholder="https://..." value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-slate-800 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
                ) : (
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/webp" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      try {
                        // Compress image automatically before saving
                        const compressedDataUrl = await compressImage(file, 800, 800, 0.75);
                        setImageUrl(compressedDataUrl);
                      } catch (err) {
                        console.error('Error al comprimir la imagen:', err);
                        alert('Error al procesar la imagen. Intenta con otra.');
                      }
                    }} 
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2 text-slate-800 focus:ring-2 focus:ring-orange-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-gray-800 hover:file:bg-slate-200 cursor-pointer transition-all" 
                  />
                )}

                {imageUrl && (
                  <div className="mt-3 relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 bg-slate-50">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setImageUrl('')} 
                      className="absolute top-2 right-2 bg-white/50 hover:bg-red-500/80 p-1.5 rounded-full text-white backdrop-blur-sm transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Offer Section */}
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-orange-900">Activar Oferta en este Plato</h4>
                  <p className="text-xs text-orange-700">El producto aparecerá con una insignia y precio rebajado en la app y el kiosko.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={hasOffer} onChange={(e) => setHasOffer(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              {hasOffer && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-orange-200/50">
                  <div>
                    <label className="block text-xs font-bold text-orange-800 mb-1">% de Descuento</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        min="1" 
                        max="100" 
                        value={discountPercentage} 
                        onChange={e => setDiscountPercentage(parseFloat(e.target.value) || 0)} 
                        className="w-full bg-white border border-orange-200 rounded-lg pl-3 pr-8 py-2 text-slate-800 focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                      />
                      <span className="absolute right-3 top-2 text-gray-500 font-bold">%</span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <span className="text-xs text-orange-700 mb-1">Precio Final:</span>
                    <span className="text-xl font-black text-orange-600">${(price - (price * (discountPercentage / 100))).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-100 my-8" />

          {/* Modifiers */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900">Grupos de Modificadores</h3>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button 
                  type="button" 
                  onClick={handleOpenCopyModal} 
                  className="flex items-center justify-center text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-2 rounded-xl border border-orange-200/80 transition-colors shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copiar de otro plato
                </button>
                <button type="button" onClick={addGroup} className="flex items-center justify-center text-xs font-bold text-brand-primary bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl border border-gray-200 transition-colors">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Añadir Grupo
                </button>
              </div>
            </div>

            {groups.length === 0 && (
              <p className="text-gray-400 text-sm">No hay grupos de modificadores. (Ej. "Elige tu término", "Extras").</p>
            )}

            {groups.map((group, groupIdx) => (
              <div key={groupIdx} className="bg-slate-50/50 border border-gray-200 rounded-xl p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="grid grid-cols-2 gap-3 flex-1 mr-4">
                    <input required placeholder="Nombre del grupo (Ej. Salsas)" value={group.name} onChange={e => {
                      const newGroups = [...groups]; newGroups[groupIdx].name = e.target.value; setGroups(newGroups);
                    }} className="col-span-2 bg-white shadow-sm border border-gray-200 rounded-lg px-3 py-2 text-slate-800 placeholder-gray-400" />
                    
                    <div className="flex items-center space-x-2">
                      <label className="text-xs text-gray-500">Min. Selecciones</label>
                      <input type="number" min="0" value={group.min_selections} onChange={e => {
                        const newGroups = [...groups]; newGroups[groupIdx].min_selections = parseInt(e.target.value) || 0; 
                        newGroups[groupIdx].is_required = (parseInt(e.target.value) || 0) > 0;
                        setGroups(newGroups);
                      }} className="w-16 bg-white shadow-sm border border-gray-200 rounded-lg px-2 py-1 text-slate-800 text-center" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-xs text-gray-500">Max. Selecciones</label>
                      <input type="number" min="1" value={group.max_selections} onChange={e => {
                        const newGroups = [...groups]; newGroups[groupIdx].max_selections = parseInt(e.target.value) || 1; setGroups(newGroups);
                      }} className="w-16 bg-white shadow-sm border border-gray-200 rounded-lg px-2 py-1 text-slate-800 text-center" />
                    </div>
                  </div>
                  <button type="button" onClick={() => removeGroup(groupIdx)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="pl-4 border-l-2 border-gray-200 space-y-2">
                  {group.modifiers.map((mod, modIdx) => (
                    <div key={modIdx} className="flex items-center space-x-2">
                      <input required placeholder="Opcion (Ej. Queso Cheddar)" value={mod.name} onChange={e => {
                        const newGroups = [...groups]; newGroups[groupIdx].modifiers[modIdx].name = e.target.value; setGroups(newGroups);
                      }} className="flex-1 bg-white shadow-sm border border-gray-200 rounded-lg px-3 py-2 text-slate-800 placeholder-gray-400 text-sm" />
                      
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-2 text-sm">+$</span>
                        <input type="number" step="0.01" min="0" value={mod.extra_price} onChange={e => {
                          const newGroups = [...groups]; newGroups[groupIdx].modifiers[modIdx].extra_price = parseFloat(e.target.value) || 0; setGroups(newGroups);
                        }} className="w-20 bg-white shadow-sm border border-gray-200 rounded-lg px-2 py-2 text-slate-800 text-sm text-center" />
                      </div>
                      
                      <button type="button" onClick={() => removeModifier(groupIdx, modIdx)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addModifier(groupIdx)} className="text-xs text-gray-500 hover:text-slate-800 flex items-center mt-2">
                    <Plus className="w-3 h-3 mr-1" /> Añadir Opción
                  </button>
                </div>
              </div>
            ))}
          </div>
        </form>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-white shadow-sm">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="px-6 py-3 rounded-xl font-medium text-gray-800 hover:bg-slate-100 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="brand-bg px-6 py-3 rounded-xl font-bold text-white hover:brightness-110 transition-colors flex items-center disabled:opacity-50">
            {isSubmitting ? 'Guardando...' : productToEdit ? 'Guardar Cambios' : 'Crear Plato'}
          </button>
        </div>
      </div>

      {/* Modal de Copiar Modificadores de Otro Plato */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Copy className="w-5 h-5 text-orange-500" />
                Copiar Modificadores
              </h3>
              <button type="button" onClick={() => setIsCopyModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Selecciona un plato existente para importar todos sus grupos de adicionales y modificadores a este plato.
            </p>

            {isLoadingCopyProducts ? (
              <div className="py-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : existingProductsWithGroups.length === 0 ? (
              <div className="p-4 bg-amber-50 text-amber-800 rounded-xl text-center text-sm border border-amber-200">
                No hay otros platos con modificadores creados en tu menú aún.
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                    Seleccionar Plato Origen
                  </label>
                  <select
                    value={selectedProductToCopy}
                    onChange={(e) => setSelectedProductToCopy(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    {existingProductsWithGroups.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.modifier_groups.length} grupo{p.modifier_groups.length > 1 ? 's' : ''})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vista previa de los grupos que se van a copiar */}
                {selectedProductToCopy && (() => {
                  const selected = existingProductsWithGroups.find(p => p.id === selectedProductToCopy);
                  if (!selected) return null;
                  return (
                    <div className="bg-slate-50 border border-gray-200 rounded-xl p-3 max-h-44 overflow-y-auto space-y-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Grupos a importar:</p>
                      {selected.modifier_groups.map((g: any, i: number) => (
                        <div key={i} className="text-xs text-gray-700 bg-white p-2.5 rounded-lg border border-gray-200/80 shadow-xs">
                          <span className="font-bold text-slate-900">{g.name}</span>
                          <span className="text-gray-400 block text-[11px] mt-0.5">
                            {g.modifiers?.map((m: any) => `${m.name} (+$${m.extra_price})`).join(', ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsCopyModalOpen(false)}
                    className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyGroups}
                    className="brand-bg px-5 py-2.5 text-sm font-bold text-white rounded-xl hover:brightness-110 shadow-lg shadow-orange-500/20 transition-all"
                  >
                    Copiar Modificadores
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
