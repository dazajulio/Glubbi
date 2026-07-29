// ============================================================================
// LEMON SQUEEZY — Utilidades del servidor
// ============================================================================

import crypto from 'crypto';

const CHECKOUT_BASE_URL = process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL ?? '';
const WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? '';
// Forzar el dominio real en producción para evitar redirecciones a deployments antiguos de Vercel (DEPLOYMENT_NOT_FOUND 404)
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('vercel.app')) 
  ? process.env.NEXT_PUBLIC_APP_URL 
  : 'https://www.glubbi.app';

// ----------------------------------------------------------------------------
// buildCheckoutUrl
// Construye la URL de checkout de Lemon Squeezy con el email y datos del
// restaurante pre-cargados para una mejor experiencia de usuario.
// ----------------------------------------------------------------------------
export function buildCheckoutUrl({
  email,
  restaurantId,
  slug,
}: {
  email: string;
  restaurantId: string;
  slug: string;
}): string {
  const url = new URL(CHECKOUT_BASE_URL);

  // Pre-rellenar el email en el checkout
  url.searchParams.set('checkout[email]', email);

  // Pasar datos del restaurante como metadata — el webhook los leerá en meta.custom_data
  url.searchParams.set('checkout[custom][restaurant_id]', restaurantId);
  url.searchParams.set('checkout[custom][slug]', slug);

  // Redirigir al usuario a la página de éxito después del pago,
  // incluyendo el slug para poder llevarlo directamente a su dashboard
  url.searchParams.set(
    'checkout[redirect_url]',
    `${APP_URL}/success?slug=${encodeURIComponent(slug)}`
  );

  return url.toString();
}

// ----------------------------------------------------------------------------
// verifyWebhookSignature
// Verifica que el webhook viene realmente de Lemon Squeezy usando HMAC-SHA256.
// Lemon Squeezy envía la firma en el header 'X-Signature'.
// IMPORTANTE: Siempre usar crypto.timingSafeEqual para evitar timing attacks.
// ----------------------------------------------------------------------------
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader || !WEBHOOK_SECRET) return false;

  try {
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    hmac.update(rawBody, 'utf8');
    const digest = hmac.digest('hex');

    const sigBuffer = Buffer.from(signatureHeader, 'hex');
    const digestBuffer = Buffer.from(digest, 'hex');

    if (sigBuffer.length !== digestBuffer.length) return false;

    return crypto.timingSafeEqual(sigBuffer, digestBuffer);
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------------------
// Tipos del Webhook de Lemon Squeezy
// ----------------------------------------------------------------------------
export interface LemonSqueezyWebhookPayload {
  meta: {
    event_name: string;
    custom_data?: {
      restaurant_id?: string;
      slug?: string;
    };
  };
  data: {
    id: string; // subscription_id en LS
    attributes: {
      status: string;           // 'active' | 'cancelled' | 'expired' | 'past_due' | 'paused'
      renews_at: string | null; // ISO timestamp del próximo cobro
      ends_at: string | null;   // ISO timestamp de cuándo vence (si cancela)
      user_email: string;
      user_name: string;
      order_id: number;
      product_id: number;
      variant_id: number;
    };
  };
}
