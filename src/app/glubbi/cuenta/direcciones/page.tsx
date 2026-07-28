'use client';

import { useState, useEffect } from 'react';
import { useGlubbiStore } from '@/modules/glubbi/stores/glubbi-store';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ChevronLeft, MapPin, Plus, Trash2, Home, Briefcase, Star, Loader2 } from 'lucide-react';

interface Address {
  id: string;
  label: string;
  address: string;
  reference: string;
  phone: string;
  is_default: boolean;
}

export default function MisDirecciones() {
  const { customer } = useGlubbiStore();
  const router = useRouter();
  const supabase = createClient();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [newLabel, setNewLabel] = useState('Casa');
  const [newAddress, setNewAddress] = useState('');
  const [newReference, setNewReference] = useState('');
  const [newPhone, setNewPhone] = useState(customer?.phone || '');

  useEffect(() => {
    if (!customer) {
      router.replace('/glubbi/login');
      return;
    }
    
    fetchAddresses();
  }, [customer]);

  const fetchAddresses = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('glubbi_customers')
      .select('addresses')
      .eq('id', customer!.id)
      .single();
      
    if (!error && data && data.addresses) {
      setAddresses((data.addresses as Address[]) || []);
    }
    setIsLoading(false);
  };

  const saveAddressesToDB = async (updatedAddresses: Address[]) => {
    setIsSaving(true);
    const { error } = await supabase
      .from('glubbi_customers')
      .update({ addresses: updatedAddresses })
      .eq('id', customer!.id);
      
    if (!error) {
      setAddresses(updatedAddresses);
    }
    setIsSaving(false);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.trim() || !newReference.trim() || !newPhone.trim()) return;
    
    const newEntry: Address = {
      id: Math.random().toString(36).substring(7),
      label: newLabel,
      address: newAddress,
      reference: newReference,
      phone: newPhone,
      is_default: addresses.length === 0 // Make default if it's the first one
    };
    
    const updated = [...addresses, newEntry];
    await saveAddressesToDB(updated);
    
    // Reset form
    setNewAddress('');
    setNewReference('');
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    const updated = addresses.filter(a => a.id !== id);
    if (updated.length > 0 && addresses.find(a => a.id === id)?.is_default) {
      updated[0].is_default = true;
    }
    await saveAddressesToDB(updated);
  };

  const handleSetDefault = async (id: string) => {
    const updated = addresses.map(a => ({
      ...a,
      is_default: a.id === id
    }));
    await saveAddressesToDB(updated);
  };

  const getLabelIcon = (label: string) => {
    if (label.toLowerCase().includes('casa')) return <Home className="w-4 h-4" />;
    if (label.toLowerCase().includes('trabajo')) return <Briefcase className="w-4 h-4" />;
    return <Star className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <div className="bg-white px-4 py-4 shadow-sm border-b border-gray-100 flex items-center sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-50 transition-colors">
          <ChevronLeft className="w-6 h-6 text-slate-700" />
        </button>
        <h1 className="text-lg font-bold text-slate-800 ml-2">Mis Direcciones</h1>
      </div>

      <div className="px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.length === 0 && !isAdding ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-rose-300" />
                </div>
                <h3 className="text-slate-800 font-bold text-lg mb-1">Sin direcciones</h3>
                <p className="text-gray-500 text-sm px-8">Aún no has guardado ninguna dirección de entrega.</p>
              </div>
            ) : (
              !isAdding && addresses.map(addr => (
                <div key={addr.id} className={`bg-white p-5 rounded-3xl border ${addr.is_default ? 'border-orange-500 ring-1 ring-orange-500/20 shadow-sm' : 'border-gray-100 shadow-sm'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${addr.is_default ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                        {getLabelIcon(addr.label)}
                      </div>
                      <span className="font-bold text-slate-800">{addr.label}</span>
                      {addr.is_default && (
                        <span className="text-[10px] uppercase tracking-wider font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full ml-1">Predef.</span>
                      )}
                    </div>
                    <button onClick={() => handleDelete(addr.id)} className="p-2 -mr-2 text-red-400 hover:bg-red-50 rounded-full transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-slate-600 text-sm mt-3 font-medium">{addr.address}</p>
                  <p className="text-gray-500 text-xs mt-1">Ref: {addr.reference}</p>
                  <p className="text-gray-500 text-xs mt-1">Tel: {addr.phone}</p>
                  
                  {!addr.is_default && (
                    <button 
                      onClick={() => handleSetDefault(addr.id)}
                      className="mt-4 text-xs font-bold text-orange-600 hover:bg-orange-50 py-1.5 px-3 rounded-lg transition-colors border border-orange-200 w-full"
                    >
                      Establecer como predeterminada
                    </button>
                  )}
                </div>
              ))
            )}

            {!isAdding ? (
              <button 
                onClick={() => setIsAdding(true)}
                className="w-full mt-6 bg-rose-50 text-rose-600 font-bold py-4 rounded-2xl border border-rose-100 hover:bg-rose-100 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Agregar Nueva Dirección
              </button>
            ) : (
              <form onSubmit={handleAddAddress} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 animate-fade-in">
                <h3 className="font-bold text-slate-800 text-lg mb-2">Nueva Dirección</h3>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Etiqueta</label>
                  <div className="flex gap-2 mb-2">
                    {['Casa', 'Trabajo', 'Otra'].map(l => (
                      <button
                        type="button"
                        key={l}
                        onClick={() => setNewLabel(l)}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${newLabel === l ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  {newLabel === 'Otra' && (
                    <input 
                      type="text" 
                      placeholder="Ej. Casa de mi mamá" 
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      onChange={(e) => setNewLabel(e.target.value)}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Dirección Exacta</label>
                  <textarea 
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="Calle, número, urbanización..." 
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 min-h-[80px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Punto de Referencia</label>
                  <input 
                    type="text"
                    value={newReference}
                    onChange={(e) => setNewReference(e.target.value)}
                    placeholder="Cerca de..." 
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Teléfono de Contacto</label>
                  <input 
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0414-0000000" 
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    required
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="flex-1 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Guardar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
