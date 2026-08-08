'use client';

// ============================================================================
// COMPONENTE: KDSBoard — Tablero Kanban del Kitchen Display System
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Flame,
  ChefHat,
  CircleCheckBig,
  Loader2,
  UtensilsCrossed,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRealtimeOrders } from '@/modules/kds/hooks/use-realtime-orders';
import { OrderCard } from '@/modules/kds/components/OrderCard';
import {
  ShiftStartButton,
  type ShiftStartButtonHandle,
} from '@/modules/kds/components/ShiftStartButton';
import type { OrderWithItems, OrderStatus } from '@/types/database';
import { useKdsStore } from '@/modules/kds/stores/kds-store';
import { useRouter, useParams } from 'next/navigation';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface KDSBoardProps {
  restaurantId: string;
}

interface ColumnConfig {
  key: 'pending' | 'preparing' | 'ready';
  label: string;
  icon: React.ReactNode;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  emptyMessage: string;
}

// ----------------------------------------------------------------------------
// Column definitions
// ----------------------------------------------------------------------------

const COLUMNS: ColumnConfig[] = [
  {
    key: 'pending',
    label: 'Nuevos',
    icon: <Flame className="h-5 w-5" />,
    accentColor: 'text-amber-500',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-400',
    emptyMessage: 'Sin pedidos nuevos',
  },
  {
    key: 'preparing',
    label: 'En Preparación',
    icon: <ChefHat className="h-5 w-5" />,
    accentColor: 'text-blue-500',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-400',
    emptyMessage: 'Nada en preparación',
  },
  {
    key: 'ready',
    label: 'Listos',
    icon: <CircleCheckBig className="h-5 w-5" />,
    accentColor: 'text-emerald-500',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-400',
    emptyMessage: 'Sin pedidos listos',
  },
];

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function KDSBoard({ restaurantId }: KDSBoardProps) {
  const shiftButtonRef = useRef<ShiftStartButtonHandle>(null);
  const router = useRouter();
  const { slug } = useParams();
  const { isUnlocked } = useKdsStore();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Capture PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA Installation outcome: ${outcome}`);
    setDeferredPrompt(null);
  };

  // Block page close or reload if shift is active
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isUnlocked) {
        e.preventDefault();
        e.returnValue = 'Atención: Tienes un turno activo. Debes desactivar el turno antes de salir.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isUnlocked]);

  const handleLogout = () => {
    if (isUnlocked) {
      alert('Atención: Tienes un turno activo. Debes desactivar el turno antes de salir.');
      return;
    }
    router.push(`/${slug}/welcome`);
  };

  // Refs for auto-scrolling columns
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Callback when a new order arrives via realtime
  const handleNewOrder = useCallback((order: OrderWithItems) => {
    // Play notification sound & Desktop Notification
    shiftButtonRef.current?.playNewOrderSound(order);

    // Flash tab title if browser window is minimized or in background
    if (typeof document !== 'undefined' && document.hidden) {
      let count = 0;
      const originalTitle = document.title;
      const interval = setInterval(() => {
        document.title = count % 2 === 0 
          ? `🚀 ¡NUEVO PEDIDO #${order.order_number}! - KDS` 
          : `⚠️ ALERTA EN COCINA - REVISAR`;
        count++;
        if (count > 25 || !document.hidden) {
          clearInterval(interval);
          document.title = originalTitle;
        }
      }, 800);
    }

    // Auto-scroll the "pending" column to the bottom to show the new order
    const pendingCol = columnRefs.current['pending'];
    if (pendingCol) {
      requestAnimationFrame(() => {
        pendingCol.scrollTo({
          top: pendingCol.scrollHeight,
          behavior: 'smooth',
        });
      });
    }
  }, []);

  const {
    pendingOrders,
    preparingOrders,
    readyOrders,
    updateOrderStatus,
    updateOrderPaymentStatus,
    cancelOrder,
    isLoading,
  } = useRealtimeOrders({
    restaurantId,
    onNewOrder: handleNewOrder,
  });

  // Loop sound alarm every 5s while there are new (pending) orders
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (pendingOrders.length > 0) {
      // Play immediately when pending orders appear or list changes
      shiftButtonRef.current?.playNewOrderSound();

      // Repeat sound every 5 seconds
      intervalId = setInterval(() => {
        shiftButtonRef.current?.playNewOrderSound();
      }, 5000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [pendingOrders.length]);

  // Map column keys to their order arrays
  const ordersByColumn: Record<string, OrderWithItems[]> = {
    pending: pendingOrders,
    preparing: preparingOrders,
    ready: readyOrders,
  };

  // Status change handler
  const handleStatusChange = useCallback(
    (orderId: string, newStatus: OrderStatus) => {
      updateOrderStatus(orderId, newStatus);
    },
    [updateOrderStatus]
  );

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-slate-50/90 backdrop-blur-md px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="h-6 w-6 text-gray-500" />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900">
              Cocina
            </h1>
            <p className="text-xs text-gray-400">
              Kitchen Display System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Order count summary */}
          <div className="flex items-center gap-2">
            {COLUMNS.map((col) => (
              <span
                key={col.key}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium',
                  col.badgeBg,
                  col.badgeText
                )}
              >
                {col.icon}
                <span>{ordersByColumn[col.key].length}</span>
              </span>
            ))}
          </div>

          <ShiftStartButton ref={shiftButtonRef} />
          
          {/* PWA Button removed from here and moved to Gerente Layout */}
          
          <button
            onClick={handleLogout}
            className="rounded-xl px-5 py-3.5 text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/10 active:scale-[0.98] transition-all"
          >
            Salir
          </button>
        </div>
      </header>

      {/* ── Loading state ───────────────────────────────────────── */}
      {isLoading && (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Cargando pedidos…</p>
          </div>
        </div>
      )}

      {/* ── Kanban Columns ──────────────────────────────────────── */}
      {!isLoading && (
        <div className="flex flex-1 flex-row gap-0 overflow-hidden">
          {COLUMNS.map((col) => {
            const columnOrders = ordersByColumn[col.key];

            return (
              <div
                key={col.key}
                className="flex flex-1 flex-col border-r border-gray-200 last:border-r-0 min-h-0"
              >
                {/* Column header */}
                <div className={cn(
                  "flex items-center gap-2 border-b px-4 py-3 transition-colors",
                  col.key === 'pending' ? 'bg-amber-500/[0.08] border-amber-500/20 text-amber-500' :
                  col.key === 'preparing' ? 'bg-blue-500/[0.08] border-blue-500/20 text-blue-500' :
                  'bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-500'
                )}>
                  <span className={cn('shrink-0', col.accentColor)}>
                    {col.icon}
                  </span>
                  <h2 className="text-sm font-bold uppercase tracking-wider">
                    {col.label}
                  </h2>
                  <span
                    className={cn(
                      'ml-auto flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                      col.badgeBg,
                      col.badgeText
                    )}
                  >
                    {columnOrders.length}
                  </span>
                </div>

                {/* Cards container */}
                <div
                  ref={(el) => {
                    columnRefs.current[col.key] = el;
                  }}
                  className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-zinc-700"
                >
                  {columnOrders.length === 0 ? (
                    <div className="flex h-32 items-center justify-center">
                      <p className="text-sm text-gray-600">{col.emptyMessage}</p>
                    </div>
                  ) : (
                    columnOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onStatusChange={handleStatusChange}
                        onPaymentValidate={updateOrderPaymentStatus}
                        onCancel={cancelOrder}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
