'use client';

// ============================================================================
// COMPONENTE: ShiftStartButton — Desbloqueo de audio para notificaciones
// ============================================================================
// Browsers require a user gesture before playing audio. This button creates
// an AudioContext and plays a short silent buffer to unlock autoplay. After
// that, the component exposes `playNewOrderSound` via ref so the parent
// KDSBoard can trigger notification sounds on new orders.
// ============================================================================

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

import { useKdsStore } from '@/modules/kds/stores/kds-store';
import { createClient } from '@/lib/supabase/client';
import type { OrderWithItems } from '@/types/database';
import { getCustomerName } from './OrderCard';

export interface ShiftStartButtonProps {
  restaurantId?: string;
}

export interface ShiftStartButtonHandle {
  playNewOrderSound: (order?: OrderWithItems) => void;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export const ShiftStartButton = forwardRef<ShiftStartButtonHandle, ShiftStartButtonProps>(
  function ShiftStartButton(props, ref) {
    const { restaurantId } = props;
    const { audioContext, isUnlocked, selectedTone, setAudioContext, setTone } = useKdsStore();
    const [isLoading, setIsLoading] = useState(false);
    const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Sync shift status to Supabase DB
    const updateStoreShiftStatus = useCallback(async (active: boolean) => {
      if (!restaurantId) return;
      try {
        const supabase = createClient();
        await supabase
          .from('restaurants')
          .update({ is_shift_active: active } as any)
          .eq('id', restaurantId);
      } catch (e) {
        console.warn('[KDS] Error updating store shift status in Supabase:', e);
      }
    }, [restaurantId]);

    // Keep AudioContext alive in background when tab is minimized
    useEffect(() => {
      if (isUnlocked && audioContext) {
        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: 'Glubbi KDS - Alarma Activa',
            artist: 'Glubbi FoodTech',
            album: 'Monitoreo de Cocina en Tiempo Real',
          });
        }

        // Silent heartbeat pulse to keep Web Audio API active when minimized
        keepAliveIntervalRef.current = setInterval(() => {
          if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().catch(() => {});
          }
        }, 8000);
      } else {
        if (keepAliveIntervalRef.current) {
          clearInterval(keepAliveIntervalRef.current);
          keepAliveIntervalRef.current = null;
        }
      }

      return () => {
        if (keepAliveIntervalRef.current) {
          clearInterval(keepAliveIntervalRef.current);
        }
      };
    }, [isUnlocked, audioContext]);

    // Auto-restore AudioContext and sync with Supabase DB shift status on mount
    useEffect(() => {
      const savedTone = localStorage.getItem('kds_selected_tone');
      if (savedTone) setTone(savedTone);

      let isMounted = true;

      const checkAndRestoreShift = async () => {
        let activeInDb = false;

        // 1. Consult Supabase DB for store shift status
        if (restaurantId) {
          try {
            const supabase = createClient();
            const { data } = await supabase
              .from('restaurants')
              .select('is_shift_active')
              .eq('id', restaurantId)
              .single();
            if (data?.is_shift_active) {
              activeInDb = true;
            }
          } catch (e) {
            console.warn('[KDS] Error checking DB shift status:', e);
          }
        }

        const isShiftActiveLocal = localStorage.getItem('kds_shift_active') === 'true';
        const shouldBeActive = activeInDb || isShiftActiveLocal;

        if (shouldBeActive && isMounted && !isUnlocked && !audioContext) {
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioCtx();
            setAudioContext(ctx);
            localStorage.setItem('kds_shift_active', 'true');
            if (!activeInDb && restaurantId) {
              updateStoreShiftStatus(true);
            }

            const resumeAudio = () => {
              if (ctx.state === 'suspended') ctx.resume().catch(() => {});
              document.removeEventListener('click', resumeAudio);
            };
            document.addEventListener('click', resumeAudio);
          } catch (e) {
            console.warn('Could not auto-restore audio context', e);
          }
        }
      };

      checkAndRestoreShift();

      return () => {
        isMounted = false;
      };
    }, [restaurantId, setTone, isUnlocked, audioContext, setAudioContext, updateStoreShiftStatus]);

    // Handle Tone Selector Change
    const handleToneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newTone = e.target.value;
      setTone(newTone);
      localStorage.setItem('kds_selected_tone', newTone);
    };

    // ------------------------------------------------------------------
    // Unlock audio autoplay & Request Desktop Notifications
    // ------------------------------------------------------------------
    const unlockAudio = useCallback(async () => {
      if (isUnlocked) {
        if (window.confirm('¿Seguro que deseas desactivar el turno y dejar de recibir alertas sonoras? Al desactivarlo, la tienda aparecerá cerrada para los clientes.')) {
          if (audioContext) {
            audioContext.close();
            setAudioContext(null);
          }
          localStorage.removeItem('kds_shift_active');
          await updateStoreShiftStatus(false);
        }
        return;
      }
      setIsLoading(true);

      try {
        // Request Desktop Notifications permission in background (non-blocking)
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          Notification.requestPermission().catch((e) => console.warn('[KDS] Notification error:', e));
        }

        // Create AudioContext
        const AudioCtx =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx = new AudioCtx();
        
        // Play a short silent buffer to satisfy the autoplay policy
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);

        // Resume context if suspended
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        setAudioContext(ctx);
        localStorage.setItem('kds_shift_active', 'true');
        await updateStoreShiftStatus(true);
      } catch (err) {
        console.error('[KDS] Error unlocking audio:', err);
      } finally {
        setIsLoading(false);
      }
    }, [isUnlocked, audioContext, setAudioContext, updateStoreShiftStatus]);

    // ------------------------------------------------------------------
    // Play the notification sound via Web Audio API Oscillator & System Notifications
    // ------------------------------------------------------------------
    const playNewOrderSound = useCallback((order?: OrderWithItems) => {
      // 1. Play Web Audio API Oscillator sound if audioContext is present
      if (audioContext) {
        if (audioContext.state === 'suspended') {
           audioContext.resume().catch(() => console.log('Audio suspended'));
        }

        try {
          const playRing = (startTimeOffset: number) => {
            const startTime = audioContext.currentTime + startTimeOffset;
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = 
              selectedTone === 'digital-chime' ? 'square' : 
              selectedTone === 'urgent-buzz' ? 'sawtooth' : 
              selectedTone === 'siren-alert' ? 'sine' :
              selectedTone === 'rapid-beep' ? 'square' :
              selectedTone === 'soft-alert' ? 'sine' : 'triangle';
              
            oscillator.frequency.setValueAtTime(
              selectedTone === 'digital-chime' ? 880 : 
              selectedTone === 'urgent-buzz' ? 120 :
              selectedTone === 'rapid-beep' ? 1200 :
              523.25, startTime);

            if (selectedTone === 'new-order') {
              oscillator.frequency.setValueAtTime(523.25, startTime); // C5
              oscillator.frequency.setValueAtTime(659.25, startTime + 0.15); // E5
            } else if (selectedTone === 'siren-alert') {
              oscillator.frequency.setValueAtTime(400, startTime);
              oscillator.frequency.linearRampToValueAtTime(1200, startTime + 0.5);
              oscillator.frequency.linearRampToValueAtTime(400, startTime + 1.0);
            } else if (selectedTone === 'urgent-buzz') {
              oscillator.frequency.setValueAtTime(100, startTime);
              oscillator.frequency.linearRampToValueAtTime(200, startTime + 0.1);
            } else if (selectedTone === 'rapid-beep') {
              oscillator.frequency.setValueAtTime(1000, startTime);
            }

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.8, startTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.5);
          };

          if (selectedTone === 'siren-alert') {
            playRing(0);
            playRing(1.0);
            playRing(2.0);
          } else if (selectedTone === 'rapid-beep') {
            playRing(0);
            playRing(0.2);
            playRing(0.4);
            playRing(0.6);
            playRing(0.8);
            playRing(1.0);
          } else if (selectedTone === 'urgent-buzz') {
            playRing(0);
            playRing(0.3);
            playRing(0.6);
            playRing(0.9);
          } else {
            playRing(0);
            setTimeout(() => playRing(0), 800);
            setTimeout(() => playRing(0), 1600);
          }
        } catch (err) {
          console.warn('[KDS] Could not play notification sound:', err);
        }
      }

      // 2. HTML5 Audio Synthesizer Fallback (Works when tab is minimized/in background)
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const bgCtx = new AudioContextClass();
          const osc = bgCtx.createOscillator();
          const gain = bgCtx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(800, bgCtx.currentTime);
          gain.gain.setValueAtTime(0.5, bgCtx.currentTime);
          osc.connect(gain);
          gain.connect(bgCtx.destination);
          osc.start();
          osc.stop(bgCtx.currentTime + 0.4);
        }
      } catch (e) {
        // Ignore fallback errors
      }

      // 3. System-Level Desktop Toast Notification (Windows / macOS)
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const orderNum = order ? `#${order.order_number}` : 'NUEVO';
          const custName = order ? (getCustomerName(order) || 'Cliente') : '';
          const totalStr = order ? `$${order.total_amount}` : '';

          const notification = new Notification(`🚀 ¡NUEVO PEDIDO DE COMIDA ${orderNum}!`, {
            body: `Cliente: ${custName} ${totalStr ? `| Total: ${totalStr}` : ''}\n¡Haz clic aquí para abrir el KDS!`,
            icon: '/favicon.ico',
            tag: order ? `kds-order-${order.id}` : `kds-alert-${Date.now()}`,
            requireInteraction: true
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        } catch (e) {
          console.warn('[KDS] Desktop notification error:', e);
        }
      }
    }, [selectedTone, audioContext]);

    // Expose to parent via ref
    useImperativeHandle(ref, () => ({ playNewOrderSound }), [playNewOrderSound]);

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------
    return (
      <div className="flex items-center gap-3">
        {/* Tone Selector */}
        <div className="relative group/tone hidden sm:flex">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Music className="h-4 w-4 text-gray-400" />
          </div>
          <select
            value={selectedTone}
            onChange={handleToneChange}
            className="appearance-none bg-white shadow-sm border border-gray-200 text-gray-800 text-sm rounded-xl pl-9 pr-8 py-2.5 outline-none hover:bg-slate-100 focus:ring-2 focus:ring-orange-500/50 transition-colors cursor-pointer"
          >
            <option value="new-order">Tono Predeterminado</option>
            <option value="digital-chime">Timbre Digital</option>
            <option value="soft-alert">Alerta Suave</option>
            <option value="siren-alert">Sirena</option>
            <option value="urgent-buzz">Chicharra</option>
            <option value="rapid-beep">Pitido Rápido</option>
          </select>
        </div>

        <button
          type="button"
          onClick={unlockAudio}
          disabled={isLoading}
          className={cn(
            'group relative flex items-center gap-3 rounded-xl px-6 py-3.5 text-sm font-extrabold transition-all duration-300',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
            isUnlocked
              ? 'cursor-default bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 border border-emerald-400/20'
              : 'cursor-pointer bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-amber-700 active:scale-[0.98] border border-orange-400/20',
            isLoading && 'opacity-70 cursor-wait'
          )}
        >
          {/* Pulsing indicator when active */}
          {isUnlocked && (
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
          )}

          {/* Icon */}
          {isUnlocked ? (
            <Volume2 className="h-5 w-5 text-emerald-400" />
          ) : (
            <VolumeX className="h-5 w-5 text-gray-500 group-hover:text-gray-900 transition-colors" />
          )}

          {/* Label */}
          <span>
            {isLoading
              ? 'Activando…'
              : isUnlocked
                ? 'Turno Activo ✓'
                : 'Iniciar Turno'}
          </span>
        </button>
      </div>
    );
  }
);
