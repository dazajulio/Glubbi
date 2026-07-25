import { createAdminClient } from '@/lib/supabase/admin';

interface NoticeProps {
  toEmail: string;
  restaurantName: string;
  slug: string;
  dueDate: string;
}

export async function sendSubscriptionNotice({ toEmail, restaurantName, slug, dueDate, type }: NoticeProps & { type: 'reminder_2_days' | 'due_today' | 'suspended' }): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('RESEND_API_KEY no está configurada en las variables de entorno. Omitiendo correo de suscripción.');
    return false;
  }

  const managerUrl = `https://glubbi.app/${slug}/gerente`;
  
  let subject = '';
  let title = '';
  let message = '';
  let actionText = 'Reportar Pago Ahora';

  if (type === 'reminder_2_days') {
    subject = `Recordatorio: Vencimiento próximo para ${restaurantName}`;
    title = 'Tu suscripción vence en 2 días';
    message = `Te recordamos que tu suscripción de Glubbi para <strong>${restaurantName}</strong> vence el <strong>${dueDate}</strong>. Por favor, recuerda realizar tu pago móvil y reportarlo en tu panel de gerente para evitar interrupciones en el servicio.`;
  } else if (type === 'due_today') {
    subject = `Aviso: Día de pago para ${restaurantName}`;
    title = 'Hoy vence tu suscripción';
    message = `Tu suscripción de Glubbi para <strong>${restaurantName}</strong> vence el día de hoy (<strong>${dueDate}</strong>). Ingresa a tu panel de gerente para reportar tu pago móvil lo antes posible.`;
  } else if (type === 'suspended') {
    subject = `Suspensión de Servicio: ${restaurantName}`;
    title = 'Servicio suspendido por falta de pago';
    message = `Lamentamos informarte que el acceso a <strong>${restaurantName}</strong> en Glubbi ha sido suspendido debido a que no se ha registrado el pago correspondiente al ciclo finalizado el <strong>${dueDate}</strong>.<br><br>Para reactivar tu servicio de inmediato, por favor realiza el pago y repórtalo en tu panel.`;
    actionText = 'Pagar y Reactivar Servicio';
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${subject}</title>
      <style>
        body { font-family: sans-serif; background-color: #0b0c10; color: #d1d5db; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #16171d; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; }
        .header { background-color: #090a0f; padding: 20px; text-align: center; border-bottom: 1px solid #27272a; }
        .header h2 { margin: 0; color: #ffffff; }
        .content { padding: 30px; }
        .content h1 { color: #ff6b00; font-size: 20px; margin-top: 0; }
        .content p { line-height: 1.6; color: #a1a1aa; font-size: 15px; margin-bottom: 24px; }
        .button { display: inline-block; background-color: #ff6b00; color: #ffffff !important; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 8px; text-align: center; }
        .footer { background-color: #090a0f; padding: 20px; text-align: center; font-size: 12px; color: #52525b; border-top: 1px solid #27272a; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Glubbi<span style="color:#ff6b00;">.app</span></h2>
        </div>
        <div class="content">
          <h1>${title}</h1>
          <p>${message}</p>
          <div style="text-align: center;">
            <a href="${managerUrl}" class="button">${actionText}</a>
          </div>
        </div>
        <div class="footer">
          Soporte: soporte@glubbi.app
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Glubbi Pagos <pagos@glubbi.app>',
        to: [toEmail],
        subject: subject,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      console.error('Error de API de Resend:', await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('Excepción al enviar correo de suscripción:', error);
    return false;
  }
}
