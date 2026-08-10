'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Phone, ChevronRight, MapPin, Clock, Loader2, Navigation } from 'lucide-react';
import { isValidEmail } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import { useGlubbiStore } from '@/modules/glubbi/stores/glubbi-store';

export interface CustomerData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  pickupTime?: string;
}

interface CustomerFormProps {
  onSubmit: (data: CustomerData) => void;
  isLoading?: boolean;
  isDelivery?: boolean;
  orderType?: 'pickup' | 'delivery';
  deliveryZoneInfo?: {
    isChecking: boolean;
    zone: any | null;
    price: number | null;
    outsideZone: boolean;
  } | null;
}

export function CustomerForm({ onSubmit, isLoading, isDelivery = false, orderType, deliveryZoneInfo }: CustomerFormProps) {
  const isPickup = orderType === 'pickup' || (!isDelivery && orderType !== 'delivery');

  const { customer, location, setLocation } = useGlubbiStore();
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu dispositivo no soporta geolocalización.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Obteniendo posición GPS...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
          if (token) {
            const res = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&types=address,poi,neighborhood,locality,place&limit=1`
            );
            const data = await res.json();
            if (data.features && data.features.length > 0) {
              const placeName = data.features[0].place_name;
              setAddress(placeName);
              setLocation({ lat: latitude, lng: longitude }, placeName);
            } else {
              setLocation({ lat: latitude, lng: longitude }, 'Ubicación GPS');
            }
          } else {
            setLocation({ lat: latitude, lng: longitude }, 'Ubicación GPS');
          }
          setLocationStatus('¡Ubicación GPS detectada!');
          setTimeout(() => setLocationStatus(null), 3000);
        } catch (err) {
          console.error('Error reverse geocoding:', err);
          setLocation({ lat: latitude, lng: longitude }, 'Ubicación GPS');
          setLocationStatus('¡Ubicación GPS detectada!');
          setTimeout(() => setLocationStatus(null), 3000);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setLocationStatus('Permiso de GPS denegado');
        setIsLocating(false);
        setTimeout(() => setLocationStatus(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const [name, setName] = useState(customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : '');
  const [email, setEmail] = useState(customer?.email || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [address, setAddress] = useState('');
  const [pickupTime, setPickupTime] = useState('En 20-30 min');
  
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [knownAddresses, setKnownAddresses] = useState<any[]>([]);

  const [errors, setErrors] = useState<{name?: string; email?: string; phone?: string; address?: string; pickupTime?: string}>({});

  const QUICK_TIME_OPTIONS = ['En 15 min', 'En 30 min', 'En 45 min', 'En 1 hora'];

  const validate = () => {
    const newErrors: {name?: string; email?: string; phone?: string; address?: string; pickupTime?: string} = {};
    if (!name.trim()) newErrors.name = 'Requerido';
    if (!email.trim()) newErrors.email = 'Requerido';
    else if (!isValidEmail(email)) newErrors.email = 'Email inválido';
    
    if (isDelivery) {
      if (!phone.trim()) newErrors.phone = 'Teléfono requerido para delivery';
      if (!address.trim()) newErrors.address = 'Dirección exacta requerida';
    }

    if (isPickup && !pickupTime.trim()) {
      newErrors.pickupTime = 'Indica a qué hora estimas buscar tu pedido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchKnownAddresses = async (targetEmail: string) => {
    if (!targetEmail || !isValidEmail(targetEmail)) return;
    setIsCheckingEmail(true);
    
    try {
      const supabase = createClient();
      
      // Check Glubbi users
      const { data } = await supabase
        .from('glubbi_customers')
        .select('first_name, last_name, phone, addresses')
        .eq('email', targetEmail.trim().toLowerCase())
        .maybeSingle() as any;

      if (data) {
        if (!name) setName(`${data.first_name || ''} ${data.last_name || ''}`.trim());
        if (!phone && data.phone) setPhone(data.phone);
        
        if (data.addresses && Array.isArray(data.addresses) && data.addresses.length > 0) {
          setKnownAddresses(data.addresses);
          const def = data.addresses.find((a: any) => a.is_default) || data.addresses[0];
          if (!address && def?.address) setAddress(def.address);
        }
      } else {
        // Check Kiosk guests
        const { data: kData } = await supabase
          .from('customers')
          .select('name, phone, addresses')
          .eq('email', targetEmail.trim().toLowerCase())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle() as any;

        if (kData) {
          if (!name) setName(kData.name || '');
          if (!phone && kData.phone) setPhone(kData.phone);
          
          if (kData.addresses && Array.isArray(kData.addresses) && kData.addresses.length > 0) {
            setKnownAddresses(kData.addresses);
            const def = kData.addresses.find((a: any) => a.is_default) || kData.addresses[0];
            if (!address && def?.address) setAddress(def.address);
          }
        }
      }
    } catch (e) {
      console.error('[CustomerForm] Error fetching addresses:', e);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Auto-fetch saved addresses on mount if customer/email is present
  useEffect(() => {
    const userEmail = customer?.email || email;
    if (userEmail && isValidEmail(userEmail)) {
      fetchKnownAddresses(userEmail);
    }
  }, [customer?.email]);

  const handleEmailBlur = () => {
    fetchKnownAddresses(email);
  };

  const handleAddressSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (selectedId === 'new') {
      setAddress('');
      return;
    }
    const selected = knownAddresses.find(a => a.id === selectedId);
    if (selected) {
      setAddress(selected.address || '');
      if (selected.phone) setPhone(selected.phone);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ 
        name, 
        email, 
        phone: phone || undefined, 
        address: isDelivery ? address : undefined, 
        pickupTime: isPickup ? pickupTime : undefined
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-5 animate-fade-in">
      <div className="space-y-4">
        {/* Email Field First to trigger auto-fill */}
        <div>
          <div className="flex justify-between items-center mb-1.5 ml-1">
            <label className="block text-sm font-medium text-gray-500">
              {t('email')} <span className="text-red-400">*</span>
            </label>
            {isCheckingEmail && <Loader2 className="w-3.5 h-3.5 text-orange-500 animate-spin" />}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({...errors, email: undefined});
              }}
              onBlur={handleEmailBlur}
              className={`block w-full pl-11 pr-4 py-3.5 bg-white shadow-sm border rounded-xl text-slate-900 placeholder-zinc-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all ${
                errors.email ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="tu@correo.com"
              disabled={isLoading}
            />
          </div>
          {errors.email && <p className="text-xs text-red-400 mt-1 ml-1">{errors.email}</p>}
        </div>

        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1.5 ml-1">
            {t('name')} <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({...errors, name: undefined});
              }}
              className={`block w-full pl-11 pr-4 py-3.5 bg-white shadow-sm border rounded-xl text-slate-900 placeholder-zinc-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all ${
                errors.name ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Ej. Tu Nombre Completo"
              disabled={isLoading}
            />
          </div>
          {errors.name && <p className="text-xs text-red-400 mt-1 ml-1">{errors.name}</p>}
        </div>

        {/* Phone Field */}
        <div className="pt-2">
          <div className="flex justify-between items-end mb-1.5 ml-1 mr-1">
            <label className="block text-sm font-medium text-gray-500">
              {t('phone')} {isDelivery && <span className="text-red-400">*</span>}
            </label>
            {!isDelivery && (
              <span className="text-xs bg-slate-100 text-gray-800 px-2 py-0.5 rounded-full">
                {t('optional')}
              </span>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors({...errors, phone: undefined});
              }}
              className={`block w-full pl-11 pr-4 py-3.5 bg-white shadow-sm border rounded-xl text-slate-900 placeholder-zinc-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all ${
                errors.phone ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Ej. +58 412 123 4567"
              disabled={isLoading}
            />
          </div>
          {errors.phone && <p className="text-xs text-red-400 mt-1 ml-1">{errors.phone}</p>}
        </div>

        {/* Pickup Time field for Yo busco mi pedido */}
        {isPickup && (
          <div className="pt-2 space-y-2">
            <label className="block text-sm font-bold text-slate-800 mb-1 ml-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-orange-500" />
              ¿A qué hora estimas buscar tu pedido? <span className="text-red-400">*</span>
            </label>
            
            {/* Quick Pills */}
            <div className="flex flex-wrap gap-2 mb-2">
              {QUICK_TIME_OPTIONS.map(opt => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => {
                    setPickupTime(opt);
                    if (errors.pickupTime) setErrors({...errors, pickupTime: undefined});
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    pickupTime === opt
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-gray-200 hover:bg-slate-100'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="text"
                value={pickupTime}
                onChange={(e) => {
                  setPickupTime(e.target.value);
                  if (errors.pickupTime) setErrors({...errors, pickupTime: undefined});
                }}
                className={`block w-full px-4 py-3.5 bg-white shadow-sm border rounded-xl text-slate-900 placeholder-zinc-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all text-sm font-medium ${
                  errors.pickupTime ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Ej. En 20-30 min / 2:30 PM"
                disabled={isLoading}
              />
            </div>
            {errors.pickupTime && <p className="text-xs text-red-400 mt-1 ml-1">{errors.pickupTime}</p>}
          </div>
        )}

        {/* Delivery Address field */}
        {isDelivery && (
          <div className="pt-2 space-y-3">
            {knownAddresses.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 ml-1 flex items-center justify-between">
                  <span>📍 Mis Direcciones Guardadas</span>
                  <span className="text-[10px] text-orange-600 font-semibold">{knownAddresses.length} registradas</span>
                </label>

                {/* Quick selector pills */}
                <div className="flex flex-wrap gap-2 mb-1">
                  {knownAddresses.map(a => {
                    const isSelected = address === a.address;
                    return (
                      <button
                        type="button"
                        key={a.id}
                        onClick={() => {
                          setAddress(a.address || '');
                          if (a.phone) setPhone(a.phone);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                            : 'bg-white text-slate-700 border-gray-200 hover:bg-orange-50 hover:border-orange-200'
                        }`}
                      >
                        <span>{a.label || 'Dirección'}</span>
                        {a.is_default && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${isSelected ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700'}`}>
                            Predeterminada
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <select 
                  onChange={handleAddressSelect}
                  value={knownAddresses.find(a => a.address === address)?.id || 'new'}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-gray-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-orange-500/50 outline-none text-xs font-medium"
                >
                  <option value="new">✏️ Escribir otra dirección diferente...</option>
                  {knownAddresses.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.label} — {a.address}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1.5 ml-1">
                <label className="block text-sm font-medium text-gray-500">
                  Dirección Exacta de Entrega <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGetGpsLocation}
                  disabled={isLocating}
                  className="text-xs font-bold brand-text hover:opacity-80 flex items-center gap-1 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200 active:scale-95 transition-all"
                >
                  {isLocating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Navigation className="w-3.5 h-3.5" />
                  )}
                  {isLocating ? 'Detectando...' : 'Usar GPS'}
                </button>
              </div>

              {locationStatus && (
                <div className="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg mb-2 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 animate-pulse text-orange-500" />
                  {locationStatus}
                </div>
              )}

              <div className="relative">
                <div className="absolute top-3.5 left-4 pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) setErrors({...errors, address: undefined});
                  }}
                  className={`block w-full pl-11 pr-4 py-3.5 bg-white shadow-sm border rounded-xl text-slate-900 placeholder-zinc-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all min-h-[90px] ${
                    errors.address ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Ej. Calle 3, Casa #15-A, Sector Las Tapias"
                  disabled={isLoading}
                />
              </div>
              {errors.address && <p className="text-xs text-red-400 mt-1 ml-1">{errors.address}</p>}

              {/* Delivery Zone Match or Warning Badges */}
              {deliveryZoneInfo && deliveryZoneInfo.outsideZone && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-start gap-2">
                  <span className="text-base">⚠️</span>
                  <div>
                    <p className="font-bold">Fuera de Cobertura de Delivery</p>
                    <p className="font-normal text-red-600 mt-0.5">
                      Tu ubicación actual se encuentra fuera de la zona de entregas configurada por el restaurante. 
                      Puedes cambiar tu ubicación GPS o elegir la opción "Yo busco mi pedido".
                    </p>
                  </div>
                </div>
              )}

              {deliveryZoneInfo && deliveryZoneInfo.zone && (
                <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📍</span>
                    <div>
                      <p className="font-bold text-emerald-900">Dentro de Cobertura: {deliveryZoneInfo.zone.name}</p>
                      <p className="font-normal text-emerald-700 text-[11px]">Tarifa de envío verificada por GPS</p>
                    </div>
                  </div>
                  <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-xs font-black">
                    ${Number(deliveryZoneInfo.price).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || isCheckingEmail || (isDelivery && Boolean(deliveryZoneInfo?.outsideZone))}
        className="w-full mt-6 brand-bg hover:brightness-110 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isLoading || isCheckingEmail ? (
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            Continuar al Pago
            <ChevronRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
}
