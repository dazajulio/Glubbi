import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resend } from '@/lib/resend';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { restaurantName, contactName, email, phone, inquiryType, message } = body;

    if (!restaurantName || !contactName || !email) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert({
        restaurant_name: restaurantName,
        contact_name: contactName,
        email,
        phone: phone || null,
        business_type: inquiryType || 'Registros/Onboarding',
      } as any)
      .select('id')
      .single() as any;

    if (error) {
      console.warn('Database lead insert warning:', error);
    }

    // Send notification email to soporte@glubbi.app via Resend
    try {
      await resend.emails.send({
        from: 'Glubbi Contacto <hola@glubbi.app>',
        to: 'soporte@glubbi.app',
        subject: `[Lead Contactado] ${restaurantName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #f97316; margin-top: 0;">Nueva solicitud de contacto</h2>
            <p>Se ha recibido una nueva consulta desde la página web de Glubbi con la siguiente información:</p>

            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; width: 40%;">Restaurante / Negocio:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${restaurantName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">Nombre del Contacto:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${contactName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><a href="mailto:${email}">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">Teléfono:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${phone || 'No especificado'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">Tipo de Consulta:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #f97316; font-weight: bold;">${inquiryType || 'General'}</td>
              </tr>
              ${
                message
                  ? `<tr>
                      <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Mensaje:</td>
                      <td style="padding: 8px 0;">${message}</td>
                    </tr>`
                  : ''
              }
            </table>

            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
              Este correo se generó automáticamente desde el formulario de contacto en glubbi.app
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Error sending lead notification email:', emailErr);
    }

    return NextResponse.json({ success: true, leadId: data?.id || null });
  } catch (error: any) {
    console.error('Lead capture error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
