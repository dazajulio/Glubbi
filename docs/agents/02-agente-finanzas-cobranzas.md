# 🤖 AGENTE 02: FINANZAS, PAGOS MÓVILES & COBRANZAS (Billing & Renewal Agent)

> **Versión:** 1.0.0  
> **Codename:** `AG-FIN-02`  
> **Entorno:** n8n Workflow + Supabase DB (`restaurants`, `subscriptions`, `manual_payments`) + Resend API  
> **Estado:** Listo para Despliegue  

---

## 1. Identidad y Perfil del Agente

| Propiedad | Especificación Técnica |
| :--- | :--- |
| **Nombre del Agente** | Glubbi Billing & Finance Officer |
| **Rol Principal** | Verificación y conciliación de reportes de Pago Móvil manuales, aprobación de suscripciones en 1-clic vía Telegram, recordatorios preventivos de cobro y suspensión/reactivación automática de tenants. |
| **Tono y Personalidad** | Institucional, claro, transparente, educado y riguroso con los números. |
| **Misión** | Garantizar el flujo de caja de Glubbi mediante la automatización del ciclo de cobros B2B, eliminando el trabajo manual de verificar estados de cuenta y enviar avisos de pago. |
| **KPIs de Rendimiento** | • **Tiempo de Aprobación de Suscripción:** < 2 minutos.<br>• **Tasa de Churn por Olvido de Pago:** Reducción del 70%.<br>• **Recuperación de Cuentas Vencidas:** > 40% en los 5 días de gracia. |

---

## 2. Flujo de Negocio: Pago Móvil & Suscripciones en Glubbi

```mermaid
graph TD
    A["1. Gerente de Restaurante reporta Pago Móvil en /gerente/suscripcion"] --> B["2. Supabase Insert: Tabla 'manual_payments' (Status: 'pending')"]
    B --> C["3. Webhook de Supabase dispara n8n (Agente FIN-02)"]
    C --> D["4. Notificación HITL a Telegram con Comprobante & Datos de Banco"]
    D -->|Click '🟢 Aprobar (+30 días)'| E["5. Actualizar Supabase: status='active', extend current_period_end +30d"]
    E --> F["6. Enviar Recibo de Pago por Correo al Restaurante vía Resend"]
    D -->|Click '🔴 Rechazar'| G["7. Notificar motivo al restaurante por email"]
```

---

## 3. Matriz de Notificaciones y Recordatorios Preventivos (Cron Diario)

El Agente 02 corre un cron diario a las 8:00 AM que revisa la columna `current_period_end` en la tabla `restaurants`:

1. **⚠️ T-2 Días (Aviso Preventivo):**
   * *Trigger:* Faltan 2 días para vencer.
   * *Acción:* Envía correo: *"Tu suscripción de Glubbi vence en 2 días. Reporta tu pago móvil aquí para mantener tu servicio sin interrupciones."*
2. **🔔 T-0 Días (Día de Cobro):**
   * *Trigger:* Hoy vence el período.
   * *Acción:* Recordatorio formal de pago del plan mensual ($29/mes).
3. **⛔ T+5 Días (Suspensión Automática):**
   * *Trigger:* Pasan 5 días del vencimiento sin pago reportado.
   * *Acción:* Cambia el estado del restaurante en Supabase a `suspended`. El menú bloquea checkout público e informa amablemente al cliente sobre el pago pendiente.

---

## 4. Arquitectura Técnica del Workflow en n8n (`02-agente-finanzas-cobranzas-n8n.json`)

### Componentes Clave:
* **Trigger 1 (Webhook):** Escucha nuevos registros en `manual_payments`.
* **Trigger 2 (Cron Daily):** Revisa vencimientos en `restaurants`.
* **Nodo Telegram HITL:** Envía mensaje con botones interactivos de aprobación a tu celular.
* **Nodo Dispatcher Resend:** Envía plantillas HTML profesionales de recibos de pago y recordatorios de cobro.

---

## 5. Plantilla de Recibo de Pago (Output Email)

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
  <h2 style="color: #f97316;">¡Pago Recibido y Suscripción Confirmada! 🎉</h2>
  <p>Hola equipo de <strong>{{ restaurant_name }}</strong>,</p>
  <p>Hemos procesado exitosamente tu reporte de pago móvil por el plan mensual de Glubbi.</p>
  <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
    <tr><td style="padding: 8px; font-weight: bold;">Monto Procesado:</td><td style="padding: 8px;">$29.00 USD / Equivalente Bs.</td></tr>
    <tr><td style="padding: 8px; font-weight: bold;">Próximo Vencimiento:</td><td style="padding: 8px; color: #16a34a; font-weight: bold;">{{ new_expiry_date }}</td></tr>
  </table>
  <p style="margin-top: 20px;">Tu menú digital, KDS de cocina y sistema de pedidos continúan 100% activos.</p>
  <div style="margin-top: 24px; font-size: 12px; color: #94a3b8;">Glubbi Billing Team • soporte@glubbi.app</div>
</div>
```
