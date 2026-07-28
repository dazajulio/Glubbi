import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';

export async function POST(req: Request) {
  try {
    const { email, firstName } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'Glubbi <hola@glubbi.app>',
      to: email,
      subject: '¡Tus datos están seguros! - Bienvenido a Glubbi',
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #1a1a2e; padding: 20px;">
          <h1 style="color: #FF6B00; font-size: 24px; text-align: center;">¡Hola ${firstName || ''}! 👋</h1>
          
          <p style="font-size: 16px; line-height: 1.5; color: #4a5568;">
            Hemos recibido tu pedido recientemente y guardamos tu dirección de forma segura para que tu próxima compra sea súper rápida.
          </p>
          
          <div style="background-color: #f7fafc; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0;">
            <h2 style="font-size: 18px; margin-top: 0; color: #2d3748;">¿Sabías que puedes descargar nuestra App?</h2>
            <p style="font-size: 14px; color: #718096; margin-bottom: 20px;">
              En Glubbi App puedes rastrear el estatus de tus órdenes, acceder a cupones exclusivos y manejar tus direcciones fácilmente. Tu cuenta ya está casi lista, solo necesitas establecer tu contraseña.
            </p>
            <a href="https://play.google.com/store" style="background-color: #FF6B00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Descargar Glubbi App
            </a>
          </div>
          
          <p style="font-size: 14px; color: #a0aec0; text-align: center;">
            Si no deseas recibir estos correos o no has hecho ningún pedido, puedes ignorar este mensaje.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending invite email:', error);
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
