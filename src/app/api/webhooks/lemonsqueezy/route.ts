import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyWebhookSignature, LemonSqueezyWebhookPayload } from '@/lib/lemonsqueezy';
import { sendWelcomeEmail } from '@/lib/mail';

// IMPORTANTE: Next.js necesita el body raw (sin parsear) para verificar la firma HMAC.
// Si usáramos request.json() primero, perderíamos el body original y la verificación fallaría.
export async function POST(request: Request) {
  // 1. Leer el body como texto crudo para verificación de firma
  const rawBody = await request.text();
  const signature = request.headers.get('X-Signature');

  // 2. Verificar firma HMAC — rechazar cualquier request no autenticado
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error('[LS Webhook] Firma inválida — request rechazado.');
    return NextResponse.json(
      { error: 'Unauthorized: Invalid signature.' },
      { status: 401 }
    );
  }

  // 3. Parsear el payload ya verificado
  let payload: LemonSqueezyWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  const customData = payload.meta?.custom_data;
  const subscriptionData = payload.data;

  console.log(`[LS Webhook] Evento recibido: ${eventName}`, {
    restaurantId: customData?.restaurant_id,
    slug: customData?.slug,
    subscriptionId: subscriptionData?.id,
    status: subscriptionData?.attributes?.status,
  });

  const supabaseAdmin = createAdminClient();

  // 4. Router de eventos
  switch (eventName) {

    // ─────────────────────────────────────────────────────────────────────────
    // subscription_created: Primera compra exitosa
    // ─────────────────────────────────────────────────────────────────────────
    case 'subscription_created': {
      const restaurantId = customData?.restaurant_id;
      const slug = customData?.slug;

      if (!restaurantId) {
        console.error('[LS Webhook] subscription_created sin restaurant_id en custom_data.');
        // Respondemos 200 para que LS no reintente (no es un error de nuestro servidor)
        return NextResponse.json({ received: true, warning: 'No restaurant_id in custom_data.' });
      }

      // Verificar si ya fue procesado (Idempotencia para evitar correos duplicados por reintentos de Lemon Squeezy)
      const { data: existingRest } = await supabaseAdmin
        .from('restaurants')
        .select('subscription_status')
        .eq('id', restaurantId)
        .single() as any;

      if (existingRest?.subscription_status === 'active') {
        console.log(`[LS Webhook] Restaurante ${restaurantId} ya estaba activo. Ignorando evento duplicado para no repetir correos.`);
        return NextResponse.json({ received: true, message: 'Already active.' });
      }

      // Activar el restaurante en Supabase
      const { error: updateError } = await supabaseAdmin
        .from('restaurants')
        .update({
          is_active: true,
          subscription_id: subscriptionData.id,
          subscription_status: 'active',
          subscription_renews_at: subscriptionData.attributes.renews_at,
          license_valid_until: subscriptionData.attributes.renews_at,
        } as any)
        .eq('id', restaurantId);

      if (updateError) {
        console.error('[LS Webhook] Error activando restaurante:', updateError.message);
        // Retornar 500 para que Lemon Squeezy reintente el webhook
        return NextResponse.json({ error: 'DB update failed.' }, { status: 500 });
      }

      console.log(`[LS Webhook] ✅ Restaurante ${restaurantId} activado exitosamente.`);

      // Enviar email de bienvenida (ahora sí, DESPUÉS del pago)
      try {
        const email = subscriptionData.attributes.user_email;
        const contactName = subscriptionData.attributes.user_name || 'Chef';

        // Obtener el nombre del restaurante para el email
        const { data: restaurant } = await supabaseAdmin
          .from('restaurants')
          .select('name')
          .eq('id', restaurantId)
          .single() as any;

        if (email && restaurant?.name && slug) {
          await sendWelcomeEmail({
            toEmail: email,
            restaurantName: restaurant.name,
            contactName,
            slug,
          });
          console.log(`[LS Webhook] 📧 Email de bienvenida enviado a ${email}.`);
        }
      } catch (emailErr) {
        // No falla el webhook si el email falla
        console.error('[LS Webhook] Error enviando email de bienvenida:', emailErr);
      }

      break;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // subscription_updated: Renovación mensual u otros cambios
    // ─────────────────────────────────────────────────────────────────────────
    case 'subscription_updated':
    case 'subscription_payment_success':
    case 'subscription_resumed':
    case 'subscription_unpaused': {
      const subscriptionId = subscriptionData.id;

      const { error } = await supabaseAdmin
        .from('restaurants')
        .update({
          subscription_status: 'active',
          is_active: true,
          subscription_renews_at: subscriptionData.attributes.renews_at,
          license_valid_until: subscriptionData.attributes.renews_at,
        } as any)
        .eq('subscription_id', subscriptionId);

      if (error) {
        console.error(`[LS Webhook] Error en ${eventName}:`, error.message);
        return NextResponse.json({ error: 'DB update failed.' }, { status: 500 });
      }

      console.log(`[LS Webhook] ✅ Suscripción ${subscriptionId} actualizada (${eventName}).`);
      break;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // subscription_cancelled / subscription_expired: Bloquear acceso
    // ─────────────────────────────────────────────────────────────────────────
    case 'subscription_cancelled':
    case 'subscription_expired': {
      const subscriptionId = subscriptionData.id;

      const { error } = await supabaseAdmin
        .from('restaurants')
        .update({
          subscription_status: eventName === 'subscription_cancelled' ? 'cancelled' : 'expired',
          is_active: false,
        } as any)
        .eq('subscription_id', subscriptionId);

      if (error) {
        console.error(`[LS Webhook] Error en ${eventName}:`, error.message);
        return NextResponse.json({ error: 'DB update failed.' }, { status: 500 });
      }

      console.log(`[LS Webhook] 🔴 Restaurante con suscripción ${subscriptionId} desactivado (${eventName}).`);
      break;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // subscription_paused: Pausa temporal (sigue existiendo, acceso restringido)
    // ─────────────────────────────────────────────────────────────────────────
    case 'subscription_paused': {
      const subscriptionId = subscriptionData.id;

      await supabaseAdmin
        .from('restaurants')
        .update({
          subscription_status: 'paused',
          is_active: false,
        } as any)
        .eq('subscription_id', subscriptionId);

      console.log(`[LS Webhook] ⏸️ Suscripción ${subscriptionId} pausada.`);
      break;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // subscription_payment_failed: Pago fallido — marcar sin bloquear acceso aún
    // ─────────────────────────────────────────────────────────────────────────
    case 'subscription_payment_failed': {
      const subscriptionId = subscriptionData.id;

      await supabaseAdmin
        .from('restaurants')
        .update({
          subscription_status: 'past_due',
          // No desactivamos aún — LS reintentará el cobro. Desactivamos en expired.
        } as any)
        .eq('subscription_id', subscriptionId);

      console.log(`[LS Webhook] ⚠️ Pago fallido para suscripción ${subscriptionId}.`);
      break;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // subscription_payment_recovered: Pago recuperado después de fallo
    // ─────────────────────────────────────────────────────────────────────────
    case 'subscription_payment_recovered': {
      const subscriptionId = subscriptionData.id;

      await supabaseAdmin
        .from('restaurants')
        .update({
          subscription_status: 'active',
          is_active: true,
          subscription_renews_at: subscriptionData.attributes.renews_at,
        } as any)
        .eq('subscription_id', subscriptionId);

      console.log(`[LS Webhook] ✅ Pago recuperado para suscripción ${subscriptionId}.`);
      break;
    }

    default:
      console.log(`[LS Webhook] Evento no manejado: ${eventName} — ignorado.`);
  }

  // Siempre responder 200 para que Lemon Squeezy sepa que recibimos el webhook
  return NextResponse.json({ received: true, event: eventName });
}
