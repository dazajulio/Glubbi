'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils';
import { Loader2, Save, Trash2, PlusCircle, AlertCircle } from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  price: number;
  geom: any; // GeoJSON Polygon
}

interface DeliveryZonesMapProps {
  restaurantId: string;
}

export default function DeliveryZonesMap({ restaurantId }: DeliveryZonesMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeZone, setActiveZone] = useState<{ id: string | null, geometry: any, name: string, price: number } | null>(null);

  const supabase = createClient();
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || !token) return;

    mapboxgl.accessToken = token;
    
    // Create map
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-62.71, 8.28], // Default to Ciudad Guayana approximately, will update to restaurant location later if needed
      zoom: 12
    });

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      },
      defaultMode: 'simple_select'
    });

    map.addControl(draw, 'top-left');
    mapRef.current = map;
    drawRef.current = draw;

    map.on('load', () => {
      loadZones();
    });

    // Drawing Events
    map.on('draw.create', (e) => {
      const feature = e.features[0];
      setActiveZone({
        id: null,
        geometry: feature.geometry,
        name: 'Nueva Zona',
        price: 1.00
      });
    });

    map.on('draw.update', (e) => {
      const feature = e.features[0];
      if (activeZone && activeZone.id === feature.id) {
        setActiveZone({
          ...activeZone,
          geometry: feature.geometry
        });
      }
    });

    return () => {
      map.remove();
    };
  }, [token, restaurantId]);

  const loadZones = async () => {
    setLoading(true);
    // Para recuperar la data como geojson podemos usar ST_AsGeoJSON en SQL,
    // pero como usamos supabase JS sin función, lo llamamos de esta forma:
    // Al no tener RPC para GET, podemos usar postgis desde JS usando un truco o simplemente traer los datos.
    // Supabase devuelve los campos geometry como string EWKB por defecto a menos que se use ST_AsGeoJSON.
    
    const { data, error } = await supabase
      .rpc('get_delivery_zones', { p_restaurant_id: restaurantId });
      
    if (error) {
      console.error('Error loading zones, ensuring RPC exists:', error);
      // Fallback si no existe la funcion
    } else if (data) {
      setZones(data);
      // Renderizar polígonos
      if (drawRef.current) {
        drawRef.current.deleteAll();
        data.forEach((zone: any) => {
          drawRef.current?.add({
            id: zone.id,
            type: 'Feature',
            geometry: JSON.parse(zone.geojson),
            properties: { name: zone.name, price: zone.price }
          });
        });
      }
    }
    setLoading(false);
  };

  const handleSaveActiveZone = async () => {
    if (!activeZone) return;
    setSaving(true);
    
    // We use a custom RPC to insert the polygon
    const { data, error } = await supabase.rpc('upsert_delivery_zone', {
      p_id: activeZone.id,
      p_restaurant_id: restaurantId,
      p_name: activeZone.name,
      p_price: activeZone.price,
      p_geojson: activeZone.geometry
    });

    if (!error) {
      alert('Zona guardada con éxito');
      setActiveZone(null);
      loadZones();
    } else {
      console.error(error);
      alert('Error guardando zona');
    }
    setSaving(false);
  };

  if (!token) {
    return <div className="p-8 text-red-500">Error: Token de Mapbox no configurado.</div>;
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] bg-slate-50 border rounded-2xl overflow-hidden shadow-sm">
      {/* Sidebar para configuración */}
      <div className="w-full md:w-80 bg-white border-r flex flex-col z-10 shrink-0 shadow-lg">
        <div className="p-5 border-b bg-slate-50">
          <h2 className="text-xl font-bold text-gray-900">Zonas de Entrega</h2>
          <p className="text-xs text-gray-500 mt-1">Dibuja polígonos en el mapa para definir tus tarifas.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
          ) : activeZone ? (
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
              <h3 className="font-bold text-orange-800 mb-3 text-sm flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Editando Zona
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase">Nombre de la Zona</label>
                  <input 
                    type="text" 
                    value={activeZone.name}
                    onChange={(e) => setActiveZone({...activeZone, name: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                    placeholder="Ej. Zona Norte"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase">Costo de Envío ($)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={activeZone.price}
                    onChange={(e) => setActiveZone({...activeZone, price: parseFloat(e.target.value)})}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                    placeholder="2.00"
                  />
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => {
                      if(drawRef.current) drawRef.current.trash();
                      setActiveZone(null);
                    }}
                    className="flex-1 py-2 bg-white text-gray-600 border rounded-lg font-medium text-sm hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveActiveZone}
                    disabled={saving}
                    className="flex-1 py-2 brand-bg text-white rounded-lg font-bold text-sm shadow flex items-center justify-center"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {zones.length === 0 ? (
                <div className="text-center p-6 border-2 border-dashed rounded-xl bg-slate-50 text-gray-400">
                  <MapboxDraw className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No tienes zonas configuradas.</p>
                  <p className="text-xs mt-1">Usa la herramienta del mapa para empezar a dibujar.</p>
                </div>
              ) : (
                zones.map(zone => (
                  <div key={zone.id} className="p-3 border rounded-xl hover:border-orange-500 transition-colors bg-white flex justify-between items-center group cursor-pointer">
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{zone.name}</p>
                      <p className="text-xs font-bold text-orange-500">{formatPrice(zone.price, 'USD')}</p>
                    </div>
                    <button 
                      onClick={async () => {
                        if(confirm('¿Eliminar esta zona?')) {
                          await supabase.from('delivery_zones').delete().eq('id', zone.id);
                          loadZones();
                        }
                      }}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contenedor del Mapa */}
      <div className="flex-1 relative">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
        
        {/* Banner Explicativo flotante */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border text-xs font-semibold text-gray-700 flex items-center gap-2 z-10 pointer-events-none">
          <AlertCircle className="w-4 h-4 text-orange-500" />
          Usa el botón de polígono a la izquierda para dibujar un área.
        </div>
      </div>
    </div>
  );
}
