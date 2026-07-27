'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Table } from '@/types/database';
import { Download, QrCode, Plus, Trash2, Edit2 } from 'lucide-react';

interface QRGeneratorProps {
  restaurantId: string;
  restaurantSlug: string;
  brandColor: string;
}

export function QRGenerator({ restaurantId, restaurantSlug, brandColor }: QRGeneratorProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();
  
  // Get the base URL safely
  const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
    if (typeof window !== 'undefined') return window.location.origin;
    return 'https://www.glubbi.app';
  };
  const domain = getBaseUrl();

  const loadTables = async () => {
    const { data } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('table_number');
    if (data) setTables(data);
    setIsLoading(false);
  };

  useEffect(() => {
    setMounted(true);
    loadTables();
  }, [restaurantId, supabase]);

  const handleCreateTable = async (type: 'mesa' | 'waiter' | 'delivery') => {
    let label = '';
    if (type === 'mesa') {
      label = window.prompt("Ingresa el nombre o número de la nueva mesa (Ej. Mesa 7):") || '';
    } else if (type === 'waiter') {
      const name = window.prompt("Ingresa el nombre del mesero que tomará pedidos (Ej. Juan):");
      if (name) label = `Mesero: ${name.trim()}`;
    } else if (type === 'delivery') {
      const channel = window.prompt("Ingresa el nombre de la red social o canal de entrega (Ej. Instagram, WhatsApp):");
      if (channel) label = `Delivery: ${channel.trim()}`;
    }
    
    if (!label) return;
    
    setIsLoading(true);
    const validNumbers = tables.map(t => Number(t.table_number)).filter(n => !isNaN(n));
    const maxNumber = validNumbers.length > 0 ? Math.max(...validNumbers) : 0;
    
    const { error } = await supabase
      .from('tables')
      .insert({
        restaurant_id: restaurantId,
        table_number: maxNumber + 1,
        label: label,
        is_active: true
      } as any);
      
    if (error) {
      alert("Error al crear elemento.");
      console.error(error);
      setIsLoading(false);
    } else {
      loadTables();
    }
  };

  const handleEditTable = async (tableId: string, currentLabel: string) => {
    const isWaiter = currentLabel.startsWith('Mesero:');
    const isDelivery = currentLabel.startsWith('Delivery:');
    
    let cleanLabel = currentLabel;
    if (isWaiter) cleanLabel = currentLabel.replace('Mesero:', '').trim();
    else if (isDelivery) cleanLabel = currentLabel.replace('Delivery:', '').trim();

    const promptMsg = isWaiter ? "Ingresa el nuevo nombre del mesero:" :
                      isDelivery ? "Ingresa el nuevo nombre del canal de Delivery:" :
                      "Ingresa el nuevo nombre de la mesa:";

    const userInput = window.prompt(promptMsg, cleanLabel || '');
    if (!userInput || userInput === cleanLabel) return;
    
    let newLabel = userInput;
    if (isWaiter) newLabel = `Mesero: ${userInput}`;
    else if (isDelivery) newLabel = `Delivery: ${userInput}`;

    setIsLoading(true);
    const { error } = await supabase
      .from('tables')
      .update({ label: newLabel } as any)
      .eq('id', tableId);
      
    if (error) {
      alert("Error al editar el elemento.");
      console.error(error);
      setIsLoading(false);
    } else {
      loadTables();
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    const confirmed = window.confirm("¿Estás seguro de que deseas eliminar este elemento? Los pedidos vinculados podrían verse afectados.");
    if (!confirmed) return;
    
    setIsLoading(true);
    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', tableId);
      
    if (error) {
      alert("Error al eliminar el elemento.");
      console.error(error);
      setIsLoading(false);
    } else {
      loadTables();
    }
  };

  const downloadAll = () => {
    alert('Función de "Descargar Todos" requeriría una librería como jszip o jsPDF.');
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-end gap-3 flex-wrap">
        <button 
          onClick={() => handleCreateTable('mesa')}
          className="brand-bg hover:brightness-110 text-white font-medium py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-md"
        >
          <Plus className="w-5 h-5" />
          Crear Mesa
        </button>
        <button 
          onClick={() => handleCreateTable('waiter')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-indigo-600/10"
        >
          <Plus className="w-5 h-5" />
          Crear Mesero
        </button>
        <button 
          onClick={() => handleCreateTable('delivery')}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-600/10"
        >
          <Plus className="w-5 h-5" />
          Crear Link Delivery
        </button>
        <button 
          onClick={downloadAll}
          className="bg-slate-100 hover:bg-zinc-700 text-white font-medium py-3 px-6 rounded-xl flex items-center gap-2 transition-colors"
        >
          <Download className="w-5 h-5" />
          Descargar Todos
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map(table => {
          const isWaiter = table.label?.startsWith('Mesero:');
          const isDelivery = table.label?.startsWith('Delivery:');
          
          let url = '';
          let cardTitle = '';
          let cardColor = brandColor;
          let badgeText = '';

          if (isWaiter) {
            const name = table.label?.replace('Mesero:', '').trim() || '';
            url = `${domain}/${restaurantSlug}/mesa/takeaway?role=waiter&waiterName=${encodeURIComponent(name)}`;
            cardTitle = `🧑‍💼 Mesero: ${name}`;
            cardColor = '#4F46E5'; // Indigo
            badgeText = 'Acceso Mesero';
          } else if (isDelivery) {
            const channel = table.label?.replace('Delivery:', '').trim() || '';
            url = `${domain}/${restaurantSlug}/mesa/takeaway?type=delivery`;
            cardTitle = `🛵 Delivery: ${channel}`;
            cardColor = '#2563EB'; // Blue
            badgeText = 'Enlace Delivery';
          } else {
            url = `${domain}/${restaurantSlug}/mesa/${table.id}`;
            cardTitle = table.label || `Mesa ${table.table_number}`;
            cardColor = brandColor;
            badgeText = 'Mesa Física';
          }

          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&color=000000&bgcolor=ffffff`;

          return (
            <div key={table.id} className="bg-white rounded-2xl overflow-hidden border border-zinc-200 flex flex-col relative group shadow-sm hover:shadow-md transition-shadow">
              {/* Table Actions Overlay */}
              <div className="absolute top-2 right-2 flex gap-1 z-10">
                <button 
                  onClick={() => handleEditTable(table.id, table.label || '')}
                  className="p-2 bg-white/20 hover:bg-white/40 rounded-lg text-white backdrop-blur-sm transition-colors shadow-sm"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteTable(table.id)}
                  className="p-2 bg-red-500/80 hover:bg-red-600 rounded-lg text-white backdrop-blur-sm transition-colors shadow-sm"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div 
                className="py-4 text-center text-white font-bold text-xl relative"
                style={{ backgroundColor: cardColor }}
              >
                {cardTitle}
                <span className="absolute bottom-1 right-2 text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-normal uppercase">
                  {badgeText}
                </span>
              </div>
              
              <div className="p-8 flex-1 flex flex-col items-center justify-center bg-white">
                <img src={qrUrl} alt={`QR ${cardTitle}`} className="w-48 h-48 mb-6" />
                <p className="text-gray-400 text-xs text-center mb-6 break-all max-w-[220px]">
                  {url.replace(/^https?:\/\//, '')}
                </p>
                <a 
                  href={qrUrl}
                  download={`${cardTitle.replace(/\s+/g, '_')}.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors border border-zinc-300"
                >
                  <Download className="w-5 h-5" />
                  Descargar PNG
                </a>
              </div>
            </div>
          );
        })}
        
        {tables.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 bg-slate-500 rounded-2xl border border-gray-200 border-dashed">
            <QrCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay elementos configurados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
