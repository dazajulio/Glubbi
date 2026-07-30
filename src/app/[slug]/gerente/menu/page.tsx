'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MenuToggle } from '@/modules/menu/components/MenuToggle';
import { UtensilsCrossed, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import Papa from 'papaparse';

export default function MenuAdminPage() {
  const pathname = usePathname();
  const slugFromUrl = pathname?.split('/')?.[1] || '';
  const supabase = createClient();

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!slugFromUrl) return;
    async function loadTenant() {
      const { data } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', slugFromUrl)
        .single();
        
      if (data?.id) {
        setRestaurantId(data.id);
        localStorage.setItem('active_restaurant_id', data.id);
      }
      setLoading(false);
    }
    loadTenant();
  }, [slugFromUrl]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus(null);
    setIsUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const response = await fetch('/api/menu/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              restaurantId,
              items: results.data
            })
          });

          const data = await response.json();
          if (data.success) {
            setUploadStatus({ type: 'success', msg: data.message });
            // Forzamos un reload visual si hiciera falta, o dejamos que el componente MenuToggle se monte de nuevo
            setTimeout(() => window.location.reload(), 2000);
          } else {
            setUploadStatus({ type: 'error', msg: data.error || 'Error al importar archivo' });
          }
        } catch (error) {
          setUploadStatus({ type: 'error', msg: 'Error de conexión con el servidor.' });
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        setUploadStatus({ type: 'error', msg: 'No se pudo leer el archivo CSV.' });
        setIsUploading(false);
      }
    });
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <UtensilsCrossed className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Menú</h1>
          </div>
          <p className="text-gray-500 text-lg">Activa o desactiva productos, y carga tu menú de forma masiva.</p>
        </div>

        {/* Panel de Importación */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center sm:items-start w-full md:w-auto">
          <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Importación Masiva
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <a 
              href="/plantilla_menu_mtriq.csv" 
              download
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <Download className="w-4 h-4" /> Plantilla CSV
            </a>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !restaurantId}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-200 disabled:opacity-50"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" /> 
              )}
              {isUploading ? 'Procesando...' : 'Subir Menú'}
            </button>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
          </div>

          {uploadStatus && (
            <div className={`mt-3 p-3 w-full rounded-xl flex items-start gap-2 text-sm ${uploadStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {uploadStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
              <p>{uploadStatus.msg}</p>
            </div>
          )}
        </div>
      </div>

      {restaurantId ? (
        <MenuToggle restaurantId={restaurantId} />
      ) : (
        <p className="text-gray-400 text-sm">Registra un restaurante para ver su menú.</p>
      )}
    </div>
  );
}
