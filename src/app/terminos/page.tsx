import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Scale, ShieldCheck } from 'lucide-react';
import { Footer } from '@/components/marketing/Footer';

export const metadata = {
  title: 'Términos y Condiciones - glubbi.app',
  description: 'Términos y Condiciones de uso del software para restaurantes glubbi.app.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#080d1a] text-zinc-300 font-sans flex flex-col justify-between selection:bg-orange-500/20">
      
      {/* Background Liquid Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-20 max-w-5xl mx-auto px-6 w-full py-6 flex items-center justify-between border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full pl-3 pr-4 py-1.5 shadow-sm hover:shadow-md hover:bg-white/10 transition-all select-none">
          <img src="/logo-glubbi.png" alt="Glubbi Logo" className="w-5 h-5 object-contain" />
          <span className="text-sm font-black tracking-tight text-white">
            Glubbi<span className="text-orange-500">.app</span>
          </span>
        </Link>
        <Link href="/" className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-3xl mx-auto px-6 w-full py-16 flex-1 space-y-10">
        
        {/* Title */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <Scale className="w-4 h-4" /> Documentación Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Términos y Condiciones de Uso
          </h1>
          <p className="text-sm text-zinc-500">
            Última actualización: 20 de Julio de 2026
          </p>
        </div>

        {/* Legal Body */}
        <div className="space-y-8 text-zinc-400 text-sm md:text-base leading-relaxed border-t border-white/5 pt-8">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white tracking-tight">1. Aceptación de los Términos</h2>
            <p>
              Al registrarse, acceder o utilizar la plataforma de software para restaurantes Glubbi (en adelante, "el Servicio", "Glubbi" o "glubbi.app"), usted (en adelante, "el Usuario" o "el Restaurante") acepta de manera expresa quedar vinculado por los presentes Términos y Condiciones. Si no está de acuerdo con alguna de las disposiciones aquí establecidas, deberá abstenerse de utilizar el Servicio.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white tracking-tight">2. Descripción del Servicio</h2>
            <p>
              Glubbi es una solución de software de marca blanca bajo el modelo de Software como Servicio (SaaS) dirigida a establecimientos de comida. El Servicio incluye el acceso a un panel administrativo central, un menú digital dinámico interactivo de autopedido en mesa (mediante códigos QR o etiquetas NFC), un Kitchen Display System (KDS), un CRM para gestión de clientes, herramientas de analítica operativa y un agente de crecimiento impulsado por Inteligencia Artificial (IA) para la automatización de campañas de marketing.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white tracking-tight">3. Registro, Suscripción y Tarifas</h2>
            <p>
              Para acceder al Servicio, el Usuario debe completar el formulario de registro y realizar el pago correspondiente a la suscripción activa. Glubbi se ofrece bajo una tarifa única mensual de <strong>$29.00 USD (veintinueve dólares estadounidenses)</strong>. 
            </p>
            <p>
              El cobro se realiza de forma recurrente cada treinta (30) días a partir de la fecha de activación. La contratación es mensual y no existe ningún compromiso de permanencia ni contrato anual forzoso. El Usuario puede solicitar la no renovación o la cancelación de su suscripción en cualquier momento directamente desde su panel administrativo.
            </p>
            <p>
              Todos los cargos son facturados por adelantado y no son reembolsables. No se emitirán reembolsos ni créditos por meses parciales de uso del Servicio, ni por meses en los que el Usuario mantenga la cuenta activa sin utilizarla. Al cancelar la suscripción, el Restaurante mantendrá el acceso al panel administrativo y sus funciones hasta el final del ciclo de facturación mensual pagado en curso.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white tracking-tight">4. Limitación de Responsabilidad y Relación Comercial</h2>
            <p>
              glubbi.app actúa exclusivamente como un proveedor de tecnología y canal de comunicación. Glubbi <strong>no comercializa productos, no cobra comisiones sobre las ventas</strong> realizadas por los establecimientos afiliados, <strong>no procesa directamente los fondos de pago de los comensales</strong> (los cuales son gestionados directamente por las pasarelas de pago configuradas de forma independiente por cada restaurante, como Stripe o terminales físicas) y <strong>no coordina entregas ni envíos a domicilio (delivery)</strong>. La logística de despacho, preparación de alimentos y cobro final es responsabilidad absoluta y exclusiva del Restaurante.
            </p>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mt-4">
              <h3 className="text-orange-400 font-bold mb-2">Responsabilidad ante el Consumidor (Comensal)</h3>
              <p className="text-sm">
                Toda solicitud de <strong>derecho de retracto, devoluciones, reclamos o indemnizaciones</strong> originadas por un pedido, calidad del producto, o servicio de entrega, debe tratarse y resolverse de manera directa con el Restaurante que prestó el servicio. Glubbi no asume responsabilidad legal sobre las transacciones comerciales finales.
              </p>
              <p className="text-sm mt-2">
                No obstante, para proteger a nuestra comunidad, Glubbi realiza un estricto proceso de <strong>Verificación de Identidad y Comercio (KYC - Know Your Customer)</strong> previo a la afiliación de cualquier restaurante, garantizando que todos los establecimientos presentes en la plataforma sean comercios reales, existentes y verificados.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white tracking-tight">5. Propiedad y Uso de los Datos</h2>
            <p>
              El Restaurante conserva en todo momento la propiedad completa de sus menús, imágenes, marcas comerciales y la base de datos de los clientes recopilada a través de sus pedidos. Glubbi almacena y procesa esta información de forma aislada y segura utilizando mecanismos de base de datos multi-tenant respaldados por Row Level Security (RLS) en la nube. Glubbi se compromete a no vender, transferir o alquilar los datos operativos del Restaurante a terceros.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white tracking-tight">6. Modificaciones de los Términos</h2>
            <p>
              Glubbi se reserva el derecho de actualizar, modificar o reemplazar cualquiera de estos Términos y Condiciones en cualquier momento. Notificaremos cualquier cambio sustancial publicando una alerta en el panel administrativo o enviando un correo electrónico al correo de acceso del gerente registrado. El uso continuado del Servicio tras la publicación de las actualizaciones constituirá su aceptación formal de los nuevos términos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white tracking-tight">7. Soporte y Contacto</h2>
            <p>
              Para cualquier consulta legal, asistencia técnica o dudas relacionadas con los presentes Términos y Condiciones de Uso, el Restaurante puede ponerse en contacto con nuestro equipo de atención a través de la dirección de correo electrónico oficial: <a href="mailto:soporte@glubbi.app" className="text-orange-500 font-semibold hover:underline">soporte@glubbi.app</a>. Glubbi App opera en la ciudad de Bogota. Calle 140A - Cedritos y digitalmente con sede de desarrollo y soporte en Mérida, Venezuela.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white tracking-tight">8. Ley Aplicable y Jurisdicción</h2>
            <p>
              Los presentes Términos y Condiciones se regirán e interpretarán de acuerdo con las leyes de la República de Colombia. Cualquier disputa, controversia o reclamo derivado de la utilización del Servicio será sometido a la jurisdicción exclusiva de los tribunales competentes en dicho territorio, renunciando expresamente a cualquier otro fuero que pudiera corresponderles en razón de sus domicilios presentes o futuros.
            </p>
          </section>

        </div>

      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
