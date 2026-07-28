// ============================================================================
// UTILIDADES GENERALES
// ============================================================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases de Tailwind de forma inteligente (requerido por shadcn/ui).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un precio según la moneda del restaurante.
 */
export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('es-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea tiempo transcurrido desde una fecha (para el KDS).
 * Ejemplo: "2m", "15m", "1h 5m"
 */
export function formatElapsedTime(dateString: string): string {
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return '<1m';
  if (diffMins < 60) return `${diffMins}m`;

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}h ${mins}m`;
}

/**
 * Genera un ID único para items del carrito.
 */
export function generateCartItemId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Valida formato de email.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Limpia y formatea número de teléfono (solo dígitos).
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Trunca texto con ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Obtiene las iniciales de un nombre (para avatars).
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Genera un color de status para el KDS.
 */
export function getStatusColor(status: string): {
  bg: string;
  text: string;
  border: string;
} {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    pending: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30' },
    preparing: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30' },
    ready: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30' },
    delivered: { bg: 'bg-gray-500/10', text: 'text-gray-500', border: 'border-gray-500/30' },
    cancelled: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30' },
  };
  return colors[status.toLowerCase()] || colors.pending;
}

/**
 * Evalúa si el restaurante está abierto según su horario y hora local
 */
export function isRestaurantOpen(schedule: any, timezone: string = 'America/Caracas'): boolean {
  if (!schedule) return true; // Si no hay horario configurado, asumimos abierto

  const now = new Date();
  
  // Obtener el día de la semana actual (0 = Sunday, 1 = Monday, etc.)
  const options = { timeZone: timezone, weekday: 'long' as const };
  let dayName = new Intl.DateTimeFormat('en-US', options).format(now).toLowerCase();
  
  const dayMap: Record<string, string> = {
    'monday': 'monday',
    'tuesday': 'tuesday',
    'wednesday': 'wednesday',
    'thursday': 'thursday',
    'friday': 'friday',
    'saturday': 'saturday',
    'sunday': 'sunday',
  };

  const currentDayKey = dayMap[dayName];
  if (!currentDayKey) return true;

  const daySchedule = schedule[currentDayKey];
  
  // Si el día está marcado como cerrado
  if (!daySchedule || !daySchedule.isOpen) {
    return false;
  }

  // Obtener hora actual en HH:MM
  const timeOptions = { timeZone: timezone, hour: '2-digit' as const, minute: '2-digit' as const, hour12: false };
  const currentTime = new Intl.DateTimeFormat('en-US', timeOptions).format(now);
  
  const openTime = daySchedule.open;
  const closeTime = daySchedule.close;

  // Manejo de horarios que cruzan la medianoche (ej. 20:00 a 02:00)
  if (closeTime < openTime) {
    return currentTime >= openTime || currentTime <= closeTime;
  }

  // Horario normal (ej. 09:00 a 22:00)
  return currentTime >= openTime && currentTime <= closeTime;
}
