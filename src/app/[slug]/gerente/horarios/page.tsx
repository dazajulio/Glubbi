'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Clock, Save, Info } from 'lucide-react';

type DaySchedule = {
  isOpen: boolean;
  open: string;
  close: string;
};

type Schedule = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

const defaultSchedule: Schedule = {
  monday: { isOpen: true, open: '09:00', close: '22:00' },
  tuesday: { isOpen: true, open: '09:00', close: '22:00' },
  wednesday: { isOpen: true, open: '09:00', close: '22:00' },
  thursday: { isOpen: true, open: '09:00', close: '22:00' },
  friday: { isOpen: true, open: '09:00', close: '23:00' },
  saturday: { isOpen: true, open: '09:00', close: '23:00' },
  sunday: { isOpen: true, open: '09:00', close: '21:00' },
};

const dayNames = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

export default function HorariosPage() {
  const router = useRouter();
  const pathname = usePathname();
  const slugFromUrl = pathname?.split('/')?.[1] || '';
  const supabase = createClient();

  const [restaurantId, setRestaurantId] = useState('');
  const [schedule, setSchedule] = useState<Schedule>(defaultSchedule);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!slugFromUrl) return;
      setIsLoading(true);
      
      const { data } = await supabase
        .from('restaurants')
        .select('id, schedule')
        .eq('slug', slugFromUrl)
        .single();
        
      if (data) {
        setRestaurantId(data.id);
        if (data.schedule) {
          // Merge with default in case of missing days
          setSchedule({ ...defaultSchedule, ...(data.schedule as any) });
        }
      }
      setIsLoading(false);
    }
    loadData();
  }, [slugFromUrl]);

  const handleSave = async () => {
    if (!restaurantId) return;
    setIsSaving(true);
    
    const { error } = await supabase
      .from('restaurants')
      .update({ schedule: schedule as any })
      .eq('id', restaurantId);
      
    setIsSaving(false);
    if (error) {
      alert('Error al guardar los horarios');
    } else {
      alert('Horarios actualizados exitosamente.');
    }
  };

  const updateDay = (day: keyof Schedule, field: keyof DaySchedule, value: any) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Clock className="text-orange-500" />
          Horarios de Operatividad
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Configura los días y horas en los que tu restaurante está abierto. Durante el horario establecido, recibirás pedidos automáticamente. Fuera de este horario, el restaurante aparecerá como "Cerrado" y no se aceptarán nuevas órdenes.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {(Object.keys(dayNames) as Array<keyof Schedule>).map((day) => {
            const dayData = schedule[day];
            
            return (
              <div key={day} className={`p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${dayData.isOpen ? 'bg-white' : 'bg-slate-50/50'}`}>
                
                {/* Toggle Day */}
                <div className="flex items-center gap-4 min-w-[140px]">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={dayData.isOpen}
                      onChange={(e) => updateDay(day, 'isOpen', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                  <span className={`font-bold ${dayData.isOpen ? 'text-slate-800' : 'text-slate-400'}`}>
                    {dayNames[day]}
                  </span>
                </div>

                {/* Time Inputs */}
                {dayData.isOpen ? (
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase ml-1">Apertura</span>
                      <input 
                        type="time" 
                        value={dayData.open}
                        onChange={(e) => updateDay(day, 'open', e.target.value)}
                        className="bg-slate-100 border border-transparent focus:border-orange-500 focus:bg-white outline-none px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 transition-all"
                      />
                    </div>
                    <span className="text-gray-300 mt-4">-</span>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase ml-1">Cierre</span>
                      <input 
                        type="time" 
                        value={dayData.close}
                        onChange={(e) => updateDay(day, 'close', e.target.value)}
                        className="bg-slate-100 border border-transparent focus:border-orange-500 focus:bg-white outline-none px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-end">
                    <span className="text-sm font-bold text-gray-400 bg-gray-100 px-4 py-2 rounded-xl">Cerrado</span>
                  </div>
                )}
                
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-6 flex items-start gap-3 bg-blue-50 border border-blue-100 text-blue-700 p-4 rounded-2xl text-sm">
        <Info className="w-5 h-5 shrink-0 mt-0.5" />
        <p>Asegúrate de que los horarios configurados coincidan con el horario local de la ubicación del restaurante.</p>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <Save className="w-5 h-5" />
          )}
          Guardar Horarios
        </button>
      </div>
    </div>
  );
}
