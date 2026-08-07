import { sendWelcomeEmail } from '../src/lib/mail';

async function run() {
  console.log('--- ENVIANDO EMAIL DE PRUEBA ---');
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.error('ERROR: No se encontró la variable RESEND_API_KEY en el entorno.');
    console.log('Por favor, agrega tu API Key en tu archivo .env.local de la siguiente forma:');
    console.log('RESEND_API_KEY=re_tu_clave_de_resend');
    process.exit(1);
  }

  console.log('Intentando enviar correo de bienvenida de prueba a: soporte@glubbi.app...');
  
  const success = await sendWelcomeEmail({
    toEmail: 'soporte@glubbi.app',
    restaurantName: 'La Rustica Pizzería',
    contactName: 'Julio Daza',
    slug: 'la-rustica-pizzeria',
  });

  if (success) {
    console.log('¡ÉXITO! El correo de prueba fue enviado correctamente a soporte@glubbi.app.');
    console.log('Revisa tu bandeja de entrada en Gmail.');
  } else {
    console.error('ERROR: El envío falló. Verifica si tu API Key es válida y que el dominio esté verificado en Resend.');
  }
}

run();
