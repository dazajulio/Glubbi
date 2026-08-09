import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildCheckoutUrl } from '@/lib/lemonsqueezy';
import { resend } from '@/lib/resend';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Only initialize if env vars are present (fails open to prevent operational disruption)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 m'), // 3 requests per minute per IP
    })
  : null;

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // remove accents
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/[^\w\-]+/g, '') // remove all non-word chars
    .replace(/\-\-+/g, '-') // replace multiple hyphens with single hyphen
    .replace(/^-+/, '') // trim leading hyphen
    .replace(/-+$/, ''); // trim trailing hyphen
}

export async function POST(request: Request) {
  try {
    // 0. Rate Limiting (Mitigation A)
    if (ratelimit) {
      const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Demasiados intentos de registro. Por favor, intenta de nuevo en un minuto.' },
          { status: 429 }
        );
      }
    }

    const body = await request.json();
    const {
      restaurantName,
      contactName,
      email,
      password,
      phone,
      address,
      instagram,
      facebook,
      tiktok,
      glubbi_type,
      glubbi_category,
      manualPayment,
      paymentReference,
      couponId,
      referral_source,
      team_code,
    } = body;

    // Validation
    if (!restaurantName || !contactName || !email || !password || !phone || !address) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // 1. Pre-validate: Check if email exists by querying auth via listUsers (compatible with all Supabase versions)
    try {
      const { data: usersPage } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (usersPage?.users) {
        const emailTaken = usersPage.users.some(
          (u: any) => u.email?.toLowerCase() === email.toLowerCase()
        );
        if (emailTaken) {
          return NextResponse.json(
            { success: false, error: 'Este correo electrónico ya está registrado. Si eres el propietario, intenta iniciar sesión o contacta a soporte@glubbi.app.' },
            { status: 400 }
          );
        }
      }
    } catch (_) {
      // If listUsers fails for any reason, continue — the createUser call below will catch duplicates
    }

    // 2. Generate unique slug
    let baseSlug = slugify(restaurantName);
    if (!baseSlug || baseSlug.length < 3) {
      baseSlug = 'restaurant';
    }

    // Ensure it matches the slug format: ^[a-z0-9][a-z0-9-]*[a-z0-9]$
    baseSlug = baseSlug.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');

    let slug = baseSlug;
    let isUnique = false;
    let counter = 0;

    while (!isUnique) {
      const checkSlug = counter === 0 ? slug : `${slug}-${counter}`;
      const { data } = await supabaseAdmin
        .from('restaurants')
        .select('id')
        .eq('slug', checkSlug)
        .maybeSingle() as any;

      if (!data) {
        slug = checkSlug;
        isUnique = true;
      } else {
        counter++;
      }
    }

    // 3. Create user in Supabase Auth using Admin Client (bypassing confirmation)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Auth User creation error:', authError);
      // Normalize error message to always show friendly Spanish
      const isDuplicate = authError.message?.toLowerCase().includes('already registered') ||
                          authError.message?.toLowerCase().includes('already been registered') ||
                          authError.message?.toLowerCase().includes('email address is already');
      const friendlyError = isDuplicate
        ? 'Este correo electrónico ya está registrado. Intenta iniciar sesión o usa otro correo.'
        : `Error de Supabase Auth: ${authError.message}`; // Temporal para debug
      return NextResponse.json(
        { success: false, error: friendlyError },
        { status: 400 }
      );
    }

    const userId = authUser.user.id;

    // 3. Insert Restaurant
    // Try to insert with custom columns first
    let newRestaurantId = '';
    let insertedRest: any = null;

    try {
      const { data, error } = await supabaseAdmin
        .from('restaurants')
        .insert({
          name: restaurantName,
          slug,
          phone,
          address,
          contact_name: contactName,
          instagram: instagram || null,
          facebook: facebook || null,
          tiktok: tiktok || null,
          brand_color_primary: '#FF6B00',
          brand_color_secondary: '#1A1A2E',
          is_active: manualPayment ? true : false,
          glubbi_type: glubbi_type || 'Restaurantes',
          glubbi_category: glubbi_category || 'Comida',
          payment_methods: manualPayment && paymentReference ? [{
            id: 'manual-pm-registro',
            type: 'pago_movil',
            reference: paymentReference
          }] : null
        } as any)
        .select()
        .single() as any;

      if (error) {
        // If error suggests column missing, throw to enter catch block and use fallback
        if (error.message && (error.message.includes('column') || error.message.includes('contact_name'))) {
          throw new Error('FALLBACK_INSERT');
        }
        throw error;
      }
      
      insertedRest = data;
      newRestaurantId = data.id;
    } catch (err: any) {
      // Fallback: If custom columns do not exist in Supabase yet, store them in notes/tax_id
      console.warn('Custom columns not found. Using fallback insertion...', err.message);
      
      const backupDetails = {
        contact_name: contactName,
        instagram: instagram || null,
        facebook: facebook || null,
        tiktok: tiktok || null,
      };

      const { data, error } = await supabaseAdmin
        .from('restaurants')
        .insert({
          name: restaurantName,
          slug,
          phone,
          address,
          tax_id: null, // Avoid injecting fallback contact details object here
          brand_color_primary: '#FF6B00',
          brand_color_secondary: '#1A1A2E',
          is_active: manualPayment ? true : false,
          payment_methods: manualPayment && paymentReference ? [{
            id: 'manual-pm-registro',
            type: 'pago_movil',
            reference: paymentReference
          }] : null
        } as any)
        .select()
        .single() as any;

      if (error) {
        // Clean up created auth user if restaurant creation fails
        await supabaseAdmin.auth.admin.deleteUser(userId);
        throw error;
      }

      insertedRest = data;
      newRestaurantId = data.id;
    }

    // 4. Create Restaurant Member linkage
    const { error: memberError } = await supabaseAdmin
      .from('restaurant_members')
      .insert({
        restaurant_id: newRestaurantId,
        user_id: userId,
        role: 'owner',
        display_name: contactName,
        is_active: true,
      } as any);

    if (memberError) {
      console.error('Restaurant Member creation error:', memberError);
      // Clean up restaurant and auth user if linkage fails
      await supabaseAdmin.from('restaurants').delete().eq('id', newRestaurantId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      
      return NextResponse.json(
        { success: false, error: `Error al asociar el usuario al restaurante: ${memberError.message}` },
        { status: 500 }
      );
    }

    // 4.5 Register Coupon Redemption if exists
    if (couponId) {
      try {
        const { data: couponData } = await supabaseAdmin.from('coupons').select('id, discount_percentage, current_uses, max_uses').eq('id', couponId).single();
        if (couponData && (!couponData.max_uses || couponData.current_uses < couponData.max_uses)) {
          const discountApplied = 29 * (couponData.discount_percentage / 100);
          await supabaseAdmin.from('coupon_redemptions').insert({
            coupon_id: couponId,
            restaurant_id: newRestaurantId,
            discount_applied: discountApplied
          });
          // Increment uses count
          await supabaseAdmin.from('coupons').update({
            current_uses: (couponData.current_uses || 0) + 1
          }).eq('id', couponId);
        }
      } catch (err) {
        console.error('Error redeeming coupon:', err);
      }
    }

    // 4.6 Record Team Sale / Referral Tracking
    try {
      let teamMemberName = null;
      let teamMemberId = null;

      const codeUpper = (team_code || '').trim().toUpperCase();
      if (codeUpper) {
        const { data: member } = await supabaseAdmin
          .from('team_members')
          .select('id, name')
          .eq('code', codeUpper)
          .maybeSingle();

        if (member) {
          teamMemberId = member.id;
          teamMemberName = member.name;
        }
      }

      await supabaseAdmin.from('team_sales').insert({
        team_member_id: teamMemberId,
        team_member_name: teamMemberName || (codeUpper ? `Agente (${codeUpper})` : null),
        code_used: codeUpper || null,
        restaurant_name: restaurantName,
        restaurant_slug: slug,
        contact_name: contactName,
        email,
        payment_method: manualPayment ? 'PAGO MOVIL' : 'LEMON',
        amount: 29.00,
        referral_source: referral_source || 'Desconocido',
        status: 'completed'
      } as any);
    } catch (teamSaleErr) {
      console.error('Error inserting team sale:', teamSaleErr);
    }

    // 5. Construir URL de checkout de Lemon Squeezy con datos del restaurante
    if (!manualPayment) {
      let checkoutUrl = '';

      if (process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL) {
        checkoutUrl = buildCheckoutUrl({
          email,
          restaurantId: newRestaurantId,
          slug,
        });
      } else {
        // If env var is missing, return error before sending email
        // We don't delete the user here, but we should inform them to use Pago Movil or contact support
        return NextResponse.json({
          success: false,
          error: 'El pago con tarjeta no está disponible en este momento por falta de configuración. Por favor, selecciona Pago Móvil o contacta a soporte.'
        }, { status: 400 });
      }

      // 6. Send Internal Admin Email (Lemon Squeezy)
      try {
        await resend.emails.send({
          from: 'Glubbi <onboarding@glubbi.app>',
          to: 'soporte@glubbi.app',
          subject: `🚀 Nuevo Registro SaaS (Lemon) - ${restaurantName}`,
          html: `<p><strong>Local:</strong> ${restaurantName}</p><p><strong>Cliente:</strong> ${contactName}</p><p><strong>Email:</strong> ${email}</p><p><strong>Teléfono:</strong> ${phone}</p><p><strong>Método de Pago:</strong> Tarjeta (Lemon Squeezy)</p>`
        });

        // Send Welcome Email to Customer
        await resend.emails.send({
          from: 'Glubbi Soporte <soporte@glubbi.app>',
          to: email,
          subject: `Bienvenido a Glubbi, ${restaurantName}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
              <h2 style="color: #FF6B00;">¡Hola ${contactName}!</h2>
              <p>Bienvenido al ecosistema Glubbi. Tu restaurante <strong>${restaurantName}</strong> ha sido registrado exitosamente en nuestra plataforma.</p>
              <p>Puedes acceder a tu panel administrativo oficial de forma segura desde el siguiente botón:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="https://www.glubbi.app/${slug}/gerente" style="background-color: #FF6B00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Acceder al Panel de Glubbi</a>
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; font-size: 13px; color: #555;">
                <h3 style="margin-top: 0; color: #333; font-size: 14px;">📄 Acuerdo de Uso y Términos del Servicio</h3>
                <p>Por motivos de transparencia y seguridad jurídica, hemos adjuntado nuestro Acuerdo de Uso Oficial aplicable a todos los comercios afiliados.</p>
                <p><strong>Cláusula Legal:</strong> <i>La recepción de este correo electrónico, sumado a tu primer inicio de sesión (Log In) y el uso continuo de la plataforma, constituye una firma digital vinculante y la aceptación total e irrevocable de todos los términos, condiciones y políticas descritas en nuestro Acuerdo de Uso.</i></p>
                <p style="text-align: center; margin-top: 15px;">
                  <a href="https://www.glubbi.app/legal/acuerdo-de-uso" target="_blank" style="color: #FF6B00; font-weight: bold; text-decoration: underline;">Leer el Acuerdo de Uso Legal</a>
                </p>
              </div>
              <p style="margin-top: 30px; font-size: 14px;">¡Muchos éxitos en tus ventas!<br><strong>El equipo de Glubbi</strong></p>
            </div>
          `
        });
      } catch (emailErr) {
        console.error('Error sending emails:', emailErr);
      }

      return NextResponse.json({
        success: true,
        slug,
        checkoutUrl,
        restaurantId: newRestaurantId
      });
    }

    // 6. Send Internal Admin Email (Pago Movil)
    try {
      await resend.emails.send({
        from: 'Glubbi <onboarding@glubbi.app>',
        to: 'soporte@glubbi.app',
        subject: `💰 Nuevo Registro SaaS (Pago Móvil) - ${restaurantName}`,
        html: `<p><strong>Local:</strong> ${restaurantName}</p><p><strong>Cliente:</strong> ${contactName}</p><p><strong>Email:</strong> ${email}</p><p><strong>Teléfono:</strong> ${phone}</p><p><strong>Método de Pago:</strong> Pago Móvil (Validar manual)</p><p><strong>Detalles Pago:</strong> ${paymentReference}</p>`
      });

      // Send Welcome Email to Customer
      await resend.emails.send({
        from: 'Glubbi Soporte <soporte@glubbi.app>',
        to: email,
        subject: `Bienvenido a Glubbi, ${restaurantName}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <h2 style="color: #FF6B00;">¡Hola ${contactName}!</h2>
            <p>Bienvenido al ecosistema Glubbi. Tu restaurante <strong>${restaurantName}</strong> ha sido registrado exitosamente en nuestra plataforma.</p>
            <p>Puedes acceder a tu panel administrativo oficial de forma segura desde el siguiente botón:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="https://www.glubbi.app/${slug}/gerente" style="background-color: #FF6B00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Acceder al Panel de Glubbi</a>
            </p>
            <p style="font-size: 13px; color: #666; background-color: #fff3e0; padding: 10px; border-left: 3px solid #FF6B00;">
              <strong>Nota sobre tu Pago Móvil:</strong> Es posible que algunas funciones tarden en habilitarse mientras verificamos tu pago de forma manual.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; font-size: 13px; color: #555;">
              <h3 style="margin-top: 0; color: #333; font-size: 14px;">📄 Acuerdo de Uso y Términos del Servicio</h3>
              <p>Por motivos de transparencia y seguridad jurídica, hemos adjuntado nuestro Acuerdo de Uso Oficial aplicable a todos los comercios afiliados.</p>
              <p><strong>Cláusula Legal:</strong> <i>La recepción de este correo electrónico, sumado a tu primer inicio de sesión (Log In) y el uso continuo de la plataforma, constituye una firma digital vinculante y la aceptación total e irrevocable de todos los términos, condiciones y políticas descritas en nuestro Acuerdo de Uso.</i></p>
              <p style="text-align: center; margin-top: 15px;">
                <a href="https://www.glubbi.app/legal/acuerdo-de-uso" target="_blank" style="color: #FF6B00; font-weight: bold; text-decoration: underline;">Leer el Acuerdo de Uso Legal</a>
              </p>
            </div>
            <p style="margin-top: 30px; font-size: 14px;">¡Muchos éxitos en tus ventas!<br><strong>El equipo de Glubbi</strong></p>
          </div>
        `
      });
    } catch (emailErr) {
      console.error('Error sending emails:', emailErr);
    }

    // Manual payment => return success immediately without checkout URL
    return NextResponse.json({
      success: true,
      slug,
      restaurantId: newRestaurantId
    });

  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
