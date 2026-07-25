<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# GLUBBI: SYSTEM CONTEXT & AUDIT REPORT
*(Este documento debe ser leído siempre que inicie una sesión para mantener el contexto completo del proyecto).*

## 1. Arquitectura General y Stack
- **Framework:** Next.js 15+ (App Router, React 19).
- **Estilos:** TailwindCSS v4, Lucide React (íconos), clsx + tailwind-merge (utilidades).
- **Base de Datos & Auth:** Supabase (PostgreSQL) con Row Level Security (RLS) para aislamiento Multi-Tenant (un solo esquema `public`, aislado por `restaurant_id`).
- **Aplicación Móvil (Android):** Capacitor (`@capacitor/core`). La app nativa apunta a la ruta web `/glubbi` (WebView).
- **Hosting / Despliegue:** Vercel.
- **Gestión de Estado:** Zustand.
- **Rate Limiting / Caché:** Upstash Redis.

## 2. Integraciones de Terceros (Third-Party Services)
- **Supabase:** Base de datos principal, autenticación (Auth), Storage, y Realtime (para notificaciones a cocina/gerente).
- **Vercel:** Plataforma de hosting y ejecución de Serverless Functions/Edge Routes, además de Vercel Crons.
- **Resend:** Proveedor de correos electrónicos transaccionales (`src/lib/resend.ts` / `mail.ts`).
- **Lemon Squeezy:** Pasarela de pagos principal para el cobro de la suscripción SaaS a los restaurantes (B2B).
- **Stripe:** Pasarela de pagos para las compras de comida de los clientes finales dentro de cada restaurante (B2C).
- **Capacitor / PWABuilder:** Herramientas utilizadas para empaquetar la experiencia web (`/glubbi`) como aplicación nativa Android.
- **Cloudflare / GitHub:** (Si aplica) GitHub como repositorio fuente conectado a Vercel para CI/CD; Cloudflare posiblemente para gestión de DNS/Dominios (`mtriq.app` / `glubbi.app`).

## 3. Estructura de Rutas (Next.js App Router)
El proyecto está dividido en varios portales o "aplicaciones" dentro del mismo repositorio:

1. **Super Admin (`src/app/(super-admin)`):**
   - **Propósito:** Panel de control maestro para los dueños de Glubbi.
   - **Funciones:** Gestión de tenants (restaurantes), facturación global (billing), configuración de correos, gestión de cupones (futuro), y control de usuarios globales.
2. **Restaurante Público (`src/app/[slug]`):**
   - **Propósito:** La página pública/menú de cada restaurante específico (Ej. `mtriq.app/burger-palace`).
   - **Funciones:** Ver menú, agregar al carrito, proceso de checkout del consumidor final.
3. **Módulo de QR (`src/app/[slug]/mesa/[id]`):**
   - **Propósito:** Menú digital escaneado desde la mesa física.
4. **Panel de Gerente (`src/app/[slug]/gerente`):**
   - **Propósito:** Dashboard administrativo para el dueño/gerente del restaurante.
   - **Funciones:** Configuración de menú, historial de pedidos, configuración de envíos (delivery), reportar pagos manuales.
5. **KDS - Kitchen Display System (`src/app/[slug]/cocina`):**
   - **Propósito:** Pantalla para los cocineros. Recibe pedidos en tiempo real vía Supabase Realtime.
6. **Consumer App (`src/app/glubbi`):**
   - **Propósito:** La "Super App" para los comensales. Esta ruta es la que carga la aplicación móvil Capacitor.
   - **Funciones:** Login de cliente, restaurantes favoritos, ofertas globales, historial de cuenta.
7. **Flujo de Registro (`src/app/register`):**
   - **Propósito:** Landing page/flujo B2B donde un nuevo restaurante se inscribe, (futuro) aplica cupones, y paga su suscripción inicial.

## 4. Reglas de Negocio y Base de Datos (Supabase)
- Todo registro de un tenant está en la tabla `restaurants`.
- Los miembros del restaurante están en `restaurant_members` (vinculados vía `user_id` de `auth.users`).
- Los menús se dividen en `categories`, `products`, `modifier_groups` y `modifiers`.
- Los pedidos se guardan en `orders` y sus detalles en `order_items`.
- Las políticas RLS (Row Level Security) aseguran que las consultas desde `[slug]` o `/gerente` solo devuelvan datos donde `restaurant_id` coincide con el contexto actual.

## 5. Próximos Pasos Activos (Roadmap Inmediato)
1. **Módulo de Suscripción Manual (Pago Móvil):** Reporte desde `/gerente`, aprobación desde `/(super-admin)`, y automatización de suspensión (Cron) más notificaciones de Resend (2 días antes, día de cobro, suspensión a los +5 días).
2. **Sistema de Cupones B2B:** Gestión de códigos de descuento en `/(super-admin)` aplicables durante el `/register`.
3. **Módulo de Delivery:** Configuración de habilitación, costo fijo, y porcentaje de descuento visual desde `/gerente` a reflejarse en el carrito del cliente en `/[slug]`.
