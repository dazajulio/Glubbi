'use client';

// ============================================================================
// COMPONENTE: OrderCard — Tarjeta de pedido para el KDS
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  Clock,
  User,
  Hash,
  MapPin,
  StickyNote,
  ChefHat,
  CircleCheckBig,
  Truck,
  Trash2,
  Compass,
  CreditCard,
} from 'lucide-react';
import { cn, formatElapsedTime } from '@/lib/utils';
import type { OrderWithItems, OrderStatus, ModifierSnapshot } from '@/types/database';
import { PinAuthModal } from '@/components/shared/PinAuthModal';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface OrderCardProps {
  order: OrderWithItems;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
  onPaymentValidate?: (orderId: string, reference: string) => void;
  onCancel?: (orderId: string, reason: string) => void;
}

// Status transition map for the main action button
const NEXT_STATUS: Record<string, { status: OrderStatus; label: string }> = {
  pending: { status: 'preparing', label: 'Aceptar Pedido' },
  preparing: { status: 'ready', label: '¡Listo!' },
  ready: { status: 'delivered', label: 'Entregado' },
};

// Urgency thresholds in minutes
const URGENCY_WARN_MINUTES = 10;
const URGENCY_CRITICAL_MINUTES = 20;

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function getElapsedMinutes(dateString: string): number {
  return Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 60_000
  );
}

function getActionButtonStyles(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white';
    case 'preparing':
      return 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white';
    case 'ready':
      return 'bg-zinc-600 hover:bg-zinc-500 active:bg-zinc-700 text-white';
    default:
      return 'bg-zinc-700 text-gray-500';
  }
}

function getActionIcon(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return <ChefHat className="h-5 w-5" />;
    case 'preparing':
      return <CircleCheckBig className="h-5 w-5" />;
    case 'ready':
      return <Truck className="h-5 w-5" />;
    default:
      return null;
  }
}

function getCardBorderClass(status: OrderStatus, elapsedMinutes: number): string {
  if (status === 'pending') {
    if (elapsedMinutes >= URGENCY_CRITICAL_MINUTES) {
      return 'border-red-500/80 shadow-red-500/20 shadow-lg';
    }
    if (elapsedMinutes >= URGENCY_WARN_MINUTES) {
      return 'border-amber-500/70 shadow-amber-500/15 shadow-md';
    }
    return 'border-amber-500/30';
  }
  if (status === 'preparing') return 'border-blue-500/30';
  if (status === 'ready') return 'border-emerald-500/30';
  return 'border-gray-200';
}

function getTimeBadgeClass(status: OrderStatus, elapsedMinutes: number): string {
  if (status === 'pending' && elapsedMinutes >= URGENCY_CRITICAL_MINUTES) {
    return 'text-red-400 animate-pulse';
  }
  if (status === 'pending' && elapsedMinutes >= URGENCY_WARN_MINUTES) {
    return 'text-amber-400';
  }
  return 'text-gray-500';
}

// ----------------------------------------------------------------------------
// Helper: Parsing Order Origin (Mesa, Mesero, Delivery)
// ----------------------------------------------------------------------------
export function getOrderOrigin(order: OrderWithItems): { type: 'Mesa' | 'Mesero' | 'Delivery'; details?: string } {
  // Check notes first
  if (order.notes) {
    if (order.notes.includes('[Origen: Delivery]')) {
      return { type: 'Delivery' };
    }
    const waiterMatch = order.notes.match(/\[Origen: Mesero:\s*([^\]]+)\]/);
    if (waiterMatch) {
      return { type: 'Mesero', details: waiterMatch[1] };
    }
  }

  // Check table label
  if (order.table?.label) {
    if (order.table.label.startsWith('Mesero:')) {
      return { type: 'Mesero', details: order.table.label.replace('Mesero:', '').trim() };
    }
    if (order.table.label.startsWith('Delivery:')) {
      return { type: 'Delivery', details: order.table.label.replace('Delivery:', '').trim() };
    }
    return { type: 'Mesa', details: order.table.label };
  }

  if (order.table) {
    return { type: 'Mesa', details: `Mesa ${order.table.table_number}` };
  }

  return { type: 'Delivery', details: 'Web Directo' };
}

export function getDeliveryDetails(notes: string | null): { address?: string; phone?: string; reference?: string } | null {
  if (!notes) return null;
  const safeNotes = notes.substring(0, 1500); // Mitigation against ReDoS
  if (!safeNotes.includes('[Origen: Delivery]')) return null;
  
  const addressMatch = safeNotes.match(/Dirección:\s*([^|]{1,200})/);
  const phoneMatch = safeNotes.match(/Teléfono:\s*([^|]{1,50})/);
  const referenceMatch = safeNotes.match(/Referencia:\s*([^|]{1,200})/);
  
  return {
    address: addressMatch ? addressMatch[1].trim() : undefined,
    phone: phoneMatch ? phoneMatch[1].trim() : undefined,
    reference: referenceMatch ? referenceMatch[1].trim() : undefined
  };
}

export function getValidationDetails(notes: string | null): { ref?: string; monto?: string; fecha?: string; banco?: string; ci?: string; raw?: string } | null {
  if (!notes) return null;
  const safeNotes = notes.substring(0, 1500); // Mitigation against ReDoS
  if (!safeNotes.includes('Validación:')) return null;
  
  const refMatch = safeNotes.match(/Ref:\s*([^|]{1,50})/);
  const montoMatch = safeNotes.match(/Monto:\s*([^|]{1,50})/);
  const fechaMatch = safeNotes.match(/Fecha:\s*([^|]{1,50})/);
  const bancoMatch = safeNotes.match(/Banco:\s*([^|]{1,50})/);
  const ciMatch = safeNotes.match(/CI\/RIF:\s*([^|]{1,50})/);
  const rawMatch = safeNotes.match(/(Validación:.*?)(?:\n|$)/);

  return {
    ref: refMatch ? refMatch[1].trim() : undefined,
    monto: montoMatch ? montoMatch[1].trim() : undefined,
    fecha: fechaMatch ? fechaMatch[1].trim() : undefined,
    banco: bancoMatch ? bancoMatch[1].trim() : undefined,
    ci: ciMatch ? ciMatch[1].trim() : undefined,
    raw: rawMatch ? rawMatch[1].trim() : undefined
  };
}

// ----------------------------------------------------------------------------
// Helper: Get Customer Name (Join or Notes Fallback)
// ----------------------------------------------------------------------------
export function getCustomerName(order: OrderWithItems): string | null {
  if (order.customer?.name && typeof order.customer.name === 'string' && order.customer.name.trim() !== '') {
    return order.customer.name.trim();
  }

  if (order.notes && typeof order.notes === 'string') {
    const notes = order.notes;
    const match = notes.match(/\[?(?:Cliente|Nombre):\s*([^\]|\n]+)\]?/i);
    if (match && match[1]) {
      const cleanName = match[1].split('|')[0].replace(/\]$/, '').trim();
      if (cleanName && cleanName !== 'N/A') return cleanName;
    }
  }

  return null;
}

// ----------------------------------------------------------------------------
// Helper: Print Ticket (Comanda duplicada)
// ----------------------------------------------------------------------------
export function printOrder(order: OrderWithItems) {
  const printDiv = document.createElement('div');
  printDiv.id = 'print-container';

  const tableLabel = order.table?.label ?? (order.table ? `Mesa ${order.table.table_number}` : 'N/A');
  const customerName = getCustomerName(order);
  const customerLabel = customerName ? `Cliente: ${customerName}` : '';
  const orderDate = new Date(order.created_at).toLocaleString();
  const rawNotes = order.notes || '';
  
  const validation = getValidationDetails(order.notes);
  
  // Clean notes from delivery metadata and validation
  const cleanNotes = rawNotes
    .replace(/\[Origen:\s*[^\]]+\]/g, '')
    .replace(/\[Cliente:\s*[^\]]+\]/g, '')
    .replace(/Cliente:\s*[^|]+/gi, '')
    .replace(/\|\s*Dirección:\s*[^|]+/g, '')
    .replace(/\|\s*Teléfono:\s*[^|]+/g, '')
    .replace(/\|\s*Referencia:\s*[^|]+/g, '')
    .replace(validation?.raw || '', '')
    .replace(/^[\s|]+|[\s|]+$/g, '')
    .trim();

  const notesHtml = cleanNotes ? `<div style="margin-top: 8px; border-top: 1px dashed #000; padding-top: 5px; font-size: 10px;"><strong>Observaciones:</strong> ${cleanNotes}</div>` : '';
  const origin = getOrderOrigin(order);
  const originLabel = `${origin.type}${origin.details ? ` (${origin.details})` : ''}`;

  // Parse Delivery Details
  const delivery = getDeliveryDetails(order.notes);
  const deliveryHtml = delivery ? `
    <div style="margin-top: 6px; border-top: 1px dashed #000; padding-top: 6px; font-size: 10px; text-align: left; color: #000 !important; background: #fff !important;">
      <div style="font-weight: bold; font-size: 11px; margin-bottom: 2px;">DATOS DE DELIVERY:</div>
      <div><strong>TELÉFONO:</strong> ${delivery.phone || 'N/A'}</div>
      <div><strong>DIRECCIÓN:</strong> ${delivery.address || 'N/A'}</div>
      <div><strong>REFERENCIA:</strong> ${delivery.reference || 'N/A'}</div>
    </div>
  ` : '';

  const validationHtml = validation ? `
    <div style="margin-top: 6px; border-top: 1px dashed #000; padding-top: 6px; font-size: 10px; text-align: left; color: #000 !important; background: #fff !important;">
      <div style="font-weight: bold; font-size: 11px; margin-bottom: 2px;">PAGO A VALIDAR:</div>
      <div><strong>REF:</strong> ${validation.ref || 'N/A'}</div>
      <div><strong>MONTO:</strong> ${validation.monto || 'N/A'}</div>
      <div><strong>BANCO:</strong> ${validation.banco || 'N/A'}</div>
    </div>
  ` : '';

  // Only Caja copy is printed as requested.

  // Copy 2: Caja (Informal Invoice)
  const cajaCopy = `
    <div class="print-page" style="font-family: monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; border: 1px solid #000; color: #000 !important; background: #fff !important;">
      <div style="text-align: center; font-weight: bold; font-size: 15px; margin-bottom: 3px;">TICKET - CAJA</div>
      <div style="text-align: center; font-weight: bold; font-size: 13px; margin-bottom: 8px;">Orden #${order.order_number}</div>
      <div><strong>Origen:</strong> ${originLabel}</div>
      <div><strong>Mesa/Pedido:</strong> ${tableLabel}</div>
      ${customerName ? `<div><strong>Cliente:</strong> ${customerName}</div>` : ''}
      <div><strong>Fecha:</strong> ${orderDate}</div>
      <div><strong>Método Pago:</strong> ${order.payment_method?.toUpperCase() || 'N/A'}</div>
      <div><strong>Estado Pago:</strong> ${order.payment_status?.toUpperCase() || 'PENDIENTE'}</div>
      ${deliveryHtml}
      <div style="border-top: 1px dashed #000; margin-top: 8px; padding-top: 4px;"></div>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 1px solid #000;">
            <th style="text-align: left; font-size: 10px; padding-bottom: 2px;">Cant</th>
            <th style="text-align: left; font-size: 10px; padding-bottom: 2px;">Producto</th>
            <th style="text-align: right; font-size: 10px; padding-bottom: 2px; width: 50px;">Precio</th>
            <th style="text-align: right; font-size: 10px; padding-bottom: 2px; width: 50px;">Subt</th>
          </tr>
        </thead>
        <tbody>
          ${order.order_items.map(item => {
            return `
              <tr style="border-bottom: 1px dashed #ddd; vertical-align: top;">
                <td style="padding: 4px 0;">${item.quantity}x</td>
                <td style="padding: 4px 0;">${item.product_name}</td>
                <td style="padding: 4px 0; text-align: right;">$${Number(item.unit_price).toFixed(2)}</td>
                <td style="padding: 4px 0; text-align: right;">$${Number(item.subtotal).toFixed(2)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      <div style="border-top: 1px dashed #000; margin-top: 8px; padding-top: 4px;"></div>
      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin-top: 4px;">
        <span>TOTAL COMPRA:</span>
        <span>$${Number(order.total_amount).toFixed(2)}</span>
      </div>
      ${notesHtml}
      <div style="text-align: center; margin-top: 15px; font-size: 9px; font-weight: bold; border-top: 1px solid #000; padding-top: 4px;">*** COPIA CAJA (COMPROBANTE) ***</div>
    </div>
  `;

  printDiv.innerHTML = cajaCopy;
  document.body.appendChild(printDiv);

  const style = document.createElement('style');
  style.innerHTML = `
    @media print {
      body > * {
        display: none !important;
      }
      #print-container {
        display: block !important;
        background: white !important;
        color: black !important;
      }
      .print-page {
        page-break-after: always;
      }
      .print-page:last-child {
        page-break-after: avoid;
      }
    }
  `;
  document.head.appendChild(style);

  window.print();

  document.body.removeChild(printDiv);
  document.head.removeChild(style);
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function OrderCard({ order, onStatusChange, onPaymentValidate, onCancel }: OrderCardProps) {
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Refresh elapsed time every 30 seconds
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const elapsedMinutes = getElapsedMinutes(order.created_at);
  const elapsed = formatElapsedTime(order.created_at);
  const action = NEXT_STATUS[order.status];
  const tableLabel =
    order.table?.label ?? (order.table ? `Mesa ${order.table.table_number}` : null);
  const customerName = getCustomerName(order);

  const origin = getOrderOrigin(order);
  const delivery = getDeliveryDetails(order.notes);
  const validation = getValidationDetails(order.notes);
  
  const rawNotes = order.notes || '';
  const cleanNotes = rawNotes
    .replace(/\[Origen:\s*[^\]]+\]/g, '')
    .replace(/\[Cliente:\s*[^\]]+\]/g, '')
    .replace(/Cliente:\s*[^|]+/gi, '')
    .replace(/\|\s*Dirección:\s*[^|]+/g, '')
    .replace(/\|\s*Teléfono:\s*[^|]+/g, '')
    .replace(/\|\s*Referencia:\s*[^|]+/g, '')
    .replace(validation?.raw || '', '')
    .replace(/^[\s|]+|[\s|]+$/g, '')
    .trim() || null;

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border bg-white/80 backdrop-blur-sm transition-all duration-300',
        getCardBorderClass(order.status, elapsedMinutes)
      )}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        {/* Order number */}
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-gray-400" />
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            {order.order_number}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Elapsed time */}
          <div
            className={cn(
              'flex items-center gap-1.5 text-sm font-medium',
              getTimeBadgeClass(order.status, elapsedMinutes)
            )}
          >
            <Clock className="h-4 w-4" />
            <span>{elapsed}</span>
          </div>

          {/* Delete Button (Only if pending & not paid) */}
          {order.status === 'pending' && order.payment_status !== 'paid' && onCancel && (
            <button
              onClick={() => setIsPinModalOpen(true)}
              className="p-1.5 text-red-500 hover:text-white hover:bg-red-500/80 rounded-lg transition-colors"
              title="Cancelar Pedido"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Meta row (origin + location + customer) ──────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 px-4 py-2 text-sm">
        {/* Origin Badge */}
        <span className={cn(
          "text-xs font-bold px-2.5 py-0.5 rounded-md uppercase shrink-0",
          origin.type === 'Delivery' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' :
          origin.type === 'Mesero' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20' :
          'bg-amber-500/20 text-amber-400 border border-amber-500/20'
        )}>
          {origin.type === 'Mesero' ? `🧑‍💼 Mesero: ${origin.details || ''}` :
           origin.type === 'Delivery' ? `🛵 Delivery: ${origin.details || ''}` :
           `🍽️ Mesa: ${origin.details || ''}`}
        </span>

        {customerName && (
          <span className="flex items-center gap-1.5 text-gray-800 ml-auto truncate max-w-[170px] font-bold bg-gray-100 px-2.5 py-1 rounded-md text-xs border border-gray-200">
            <User className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            <span className="truncate">{customerName}</span>
          </span>
        )}
      </div>

      {/* ── Items list ──────────────────────────────────────────── */}
      <div className="flex-1 space-y-1.5 px-4 py-3">
        {order.order_items.map((item) => (
          <div key={item.id} className="py-1">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-200 text-sm font-extrabold text-slate-800">
                {item.quantity}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-gray-900 leading-snug">
                  {item.product_name}
                </p>
                {/* Modifier snapshots */}
                {item.modifiers_snapshot.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {item.modifiers_snapshot.map(
                      (mod: ModifierSnapshot, idx: number) => (
                        <p
                          key={`${item.id}-mod-${idx}`}
                          className="text-sm text-gray-500 leading-tight"
                        >
                          <span className="text-gray-400">{mod.group}:</span>{' '}
                          {mod.items.map((m) => m.name).join(', ')}
                        </p>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Delivery Details ───────────────────────────────────────── */}
      {delivery && (
        <div className="mx-4 mb-3 border border-blue-500/20 bg-blue-500/[0.03] rounded-xl p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <Truck className="h-4 w-4" /> Datos de Delivery
          </div>
          
          <div className="space-y-1.5 pt-1 text-xs">
            {delivery.phone && (
              <div className="flex items-center gap-2 text-gray-800">
                <span className="text-gray-400 font-medium">Teléfono:</span>
                <span className="font-semibold text-gray-900">{delivery.phone}</span>
              </div>
            )}
            
            {delivery.address && (
              <div className="flex items-start gap-2 text-gray-800">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400 mt-0.5" />
                <div>
                  <span className="text-gray-400 font-medium mr-1">Dirección:</span>
                  <span className="text-gray-900">{delivery.address}</span>
                </div>
              </div>
            )}

            {delivery.reference && (
              <div className="flex items-start gap-2 text-gray-800">
                <Compass className="h-3.5 w-3.5 shrink-0 text-gray-400 mt-0.5" />
                <div>
                  <span className="text-gray-400 font-medium mr-1">Referencia:</span>
                  <span className="text-gray-900 italic">"{delivery.reference}"</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Validation Details ───────────────────────────────────────── */}
      {validation && (
        <div className="mx-4 mb-3 border border-purple-500/20 bg-purple-500/[0.03] rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider">
              <CreditCard className="h-4 w-4" /> Pago por Validar
            </div>
            <span className="text-xs font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
              {validation.monto}
            </span>
          </div>
          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex items-center gap-2 text-gray-800">
              <span className="text-gray-400 font-medium">Ref:</span>
              <span className="font-semibold text-gray-900">{validation.ref}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-800">
              <span className="text-gray-400 font-medium">Banco:</span>
              <span className="font-semibold text-gray-900">{validation.banco}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-800">
              <span className="text-gray-400 font-medium">CI/RIF:</span>
              <span className="font-semibold text-gray-900">{validation.ci}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Notes ───────────────────────────────────────────────── */}
      {cleanNotes && (
        <div className="mx-4 mb-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2">
          <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
          <p className="text-xs text-amber-800 leading-snug">{cleanNotes}</p>
        </div>
      )}

      {/* ── Action button ───────────────────────────────────────── */}
      <div className="flex flex-col gap-2 p-3 pt-0">
        
        {/* Payment status badge / validation button */}
        {order.payment_status === 'paid' ? (
          <div className="w-full bg-emerald-500/10 text-emerald-400 font-bold text-center py-2.5 rounded-lg text-sm border border-emerald-500/20 flex items-center justify-center gap-2">
            <CircleCheckBig className="w-4 h-4" />
            PEDIDO PAGADO
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              const ref = window.prompt('Ingrese referencia de pago (Ej. Tarjeta 1234 o Efectivo):');
              if (ref && onPaymentValidate) {
                onPaymentValidate(order.id, ref);
              }
            }}
            className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold text-center py-2.5 rounded-lg text-sm border border-amber-500/20 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            title="Confirmar Pago"
          >
            ⚠️ ESPERA DE CONFIRMACIÓN DE PAGO
          </button>
        )}

        {/* Botón Imprimir Comanda (Cocina + Caja) - Solo en preparación */}
        {order.status === 'preparing' && (
          <button
            type="button"
            onClick={() => printOrder(order)}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors active:scale-[0.98] transform"
          >
            🖨️ IMPRIMIR COMANDA
          </button>
        )}

        {action && (
          <button
            type="button"
            onClick={() => {
              if (action.status === 'delivered' && order.payment_status === 'pending') {
                const ref = window.prompt('El pedido está en espera de confirmación de pago. Ingrese la referencia (Ej. Zelle 1234 o Efectivo) para poder entregarlo:');
                if (ref) {
                  if (onPaymentValidate) onPaymentValidate(order.id, ref);
                  onStatusChange(order.id, action.status);
                } else {
                  alert('Debes confirmar el pago ingresando una referencia para poder cerrar este pedido.');
                }
              } else {
                onStatusChange(order.id, action.status);
              }
            }}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-4 text-base font-semibold transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
              'active:scale-[0.98] transform',
              getActionButtonStyles(order.status)
            )}
          >
            {getActionIcon(order.status)}
            {action.label}
          </button>
        )}
      </div>

      {/* Pin Modal for Cancellation */}
      {isPinModalOpen && (
        <PinAuthModal
          isOpen={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          onSuccess={() => {
            setIsPinModalOpen(false);
            const reason = window.prompt('Especifique el motivo de cancelación:');
            if (reason && onCancel) {
              onCancel(order.id, reason);
            }
          }}
          title="Autorizar Cancelación"
        />
      )}
    </div>
  );
}
