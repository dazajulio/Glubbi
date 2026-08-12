import React from 'react';
import Link from 'next/link';

export default function AcuerdoDeUso() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-slate-900 px-8 py-10 border-b-4 border-orange-500 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Acuerdo de Uso y Términos de Servicio</h1>
            <p className="text-slate-400 mt-2">Plataforma Comercial Glubbi SaaS</p>
          </div>
          <div className="hidden sm:block">
            <span className="bg-orange-500/20 text-orange-400 px-4 py-2 rounded-full text-sm font-bold border border-orange-500/30">
              Vigente
            </span>
          </div>
        </div>

        <div className="p-8 md:p-12 space-y-8 text-slate-600 leading-relaxed">
          <p className="text-sm bg-orange-50 p-4 rounded-xl border border-orange-100 text-orange-800">
            Este documento constituye un contrato legalmente vinculante entre <strong>Glubbi</strong> (en adelante "El Proveedor" o "Glubbi") y el titular del comercio o restaurante registrado (en adelante "El Cliente", "Usted" o "El Restaurante").
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
              <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-lg flex items-center justify-center text-sm">1</span> 
              Aceptación de los Términos
            </h2>
            <div className="pl-10 space-y-3">
              <p><strong>1.1. Aceptación Implícita:</strong> La recepción del correo de bienvenida por parte de El Cliente, sumado al primer inicio de sesión (Log In) y uso continuo de la plataforma Glubbi, constituye una firma digital vinculante y la <strong>aceptación total e irrevocable</strong> de todos los términos, condiciones, limitaciones y políticas descritas en este documento.</p>
              <p><strong>1.2. Desconocimiento:</strong> El desconocimiento parcial o total de este documento no exime a El Cliente del cumplimiento estricto de las normas aquí establecidas.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
              <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-lg flex items-center justify-center text-sm">2</span> 
              Descripción del Servicio
            </h2>
            <div className="pl-10 space-y-3">
              <p><strong>2.1. Naturaleza del Servicio:</strong> Glubbi es una plataforma en la nube bajo el modelo <em>Software as a Service (SaaS)</em>. Glubbi <strong>no</strong> es un restaurante, <strong>no</strong> prepara alimentos, y <strong>no</strong> ofrece logística de envíos ni repartidores propios. Glubbi proporciona la infraestructura tecnológica (menú digital, carrito de compras, panel administrativo, KDS) para que El Cliente gestione sus propias operaciones.</p>
              <p><strong>2.2. Autonomía:</strong> El Cliente es el único responsable de configurar su menú, precios, métodos de pago, horarios, y promociones a través de su Panel de Gerente.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
              <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-lg flex items-center justify-center text-sm">3</span> 
              Facturación y Pagos
            </h2>
            <div className="pl-10 space-y-3">
              <p><strong>3.1. Mensualidad y Períodos Promocionales:</strong> El costo base por el uso ordinario de la plataforma es de <strong>$29 USD mensuales</strong>. Para nuevos registros que apliquen promociones oficiales de bienvenida (ej. cupón de 60 días gratis), El Cliente disfrutará de un período bonificado de <strong>sesenta (60) días continuos</strong> a costo $0.00 USD antes de iniciar su ciclo regular de facturación mensual anticipada.</p>
              <p><strong>3.2. Cobro Automatizado:</strong> Si El Cliente afilia una tarjeta internacional (vía Lemon Squeezy), acepta que la plataforma de pagos debite automáticamente la mensualidad en su fecha de corte.</p>
              <p><strong>3.3. Pago Móvil / Manuales:</strong> Si El Cliente opta por pagos manuales, es su estricta obligación reportar dicho pago en el módulo "Suscripción" de su Panel, al menos el mismo día de su vencimiento. El monto en moneda local será calculado a la tasa oficial (BCV) del día.</p>
              <p><strong>3.4. Suspensión por Impago:</strong> Si transcurren <strong>cinco (5) días calendario</strong> posteriores a la fecha de vencimiento sin acreditación del pago, el sistema <strong>suspenderá automáticamente</strong> la cuenta (bloqueando el acceso administrativo y desactivando el menú público).</p>
              <p><strong>3.5. Ausencia de Reembolsos:</strong> Todos los pagos realizados por el uso de la plataforma son estrictamente <strong>no reembolsables</strong>.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
              <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-lg flex items-center justify-center text-sm">4</span> 
              Limitación de Responsabilidad (SaaS)
            </h2>
            <div className="pl-10 space-y-3">
              <p><strong>4.1. Conflictos con Consumidores:</strong> Glubbi actúa exclusivamente como un conducto tecnológico. El Cliente es <strong>100% responsable legal y moralmente</strong> ante sus comensales por la calidad de alimentos, intoxicaciones, demoras de delivery, y disputas de cobros.</p>
              <p><strong>4.2. Exoneración:</strong> El Cliente exime expresamente a Glubbi y sus filiales de cualquier demanda, multa o reclamo iniciado por un consumidor final o entidad gubernamental.</p>
              <p><strong>4.3. Límite Económico:</strong> En caso de responsabilidad legal demostrable por fallas del sistema, la responsabilidad máxima de Glubbi se limitará al monto equivalente a una (1) mensualidad pagada por El Cliente.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
              <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-lg flex items-center justify-center text-sm">5</span> 
              SLA y Privacidad
            </h2>
            <div className="pl-10 space-y-3">
              <p><strong>5.1. Disponibilidad:</strong> Glubbi apunta a un uptime del 99.9%. Sin embargo, al depender de infraestructuras de terceros (AWS, Vercel), pueden ocurrir interrupciones esporádicas no compensables.</p>
              <p><strong>5.2. Propiedad de Datos:</strong> La información de los consumidores recopilada a través del menú pertenece primariamente al Cliente. Glubbi almacena estos datos de forma segura para operar el sistema y generar analíticas B2B, comprometiéndose a no vender bases de datos a terceros.</p>
              <p><strong>5.3. Terminación:</strong> Glubbi se reserva el derecho de rescindir cuentas inmediatamente por actividades ilícitas, contenido inapropiado o abuso de recursos técnicos de la plataforma.</p>
            </div>
          </section>
          
        </div>
        
        <div className="bg-slate-100 p-6 text-center text-xs text-slate-500 border-t border-slate-200">
          <p>© {new Date().getFullYear()} Glubbi App - Todos los derechos reservados.</p>
          <p className="mt-1">Documento con validez legal vinculante tras el registro en plataforma.</p>
        </div>
      </div>
    </div>
  );
}
