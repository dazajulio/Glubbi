# 🤖 GLUBBI AI AGENTS ECOSYSTEM

Bienvenido a la documentación oficial del ecosistema de **Agentes Autónomos e Inteligencia Multi-Agente de Glubbi**.

Este directorio contiene las especificaciones técnicas, prompts, esquemas de datos y flujos operativos para la orquestación en **n8n**.

---

## 🗺️ Mapa del Ecosistema de Agentes

| ID | Nombre del Agente | Rol Operativo | Estado | Documentación & Workflows |
| :--- | :--- | :--- | :--- | :--- |
| `AG-SDR-01` | **Agente 01: SDR & Prospección de Ventas** | Búsqueda activa, ICP Scoring, Cold Email y captación de registros (`/register`). | 🟢 **Listo** | [`01-agente-sdr-ventas.md`](./01-agente-sdr-ventas.md) \| [Blueprint JSON](./workflows/01-agente-sdr-ventas-n8n.json) |
| `AG-FIN-02` | **Agente 02: Finanzas, Pagos & Cobranzas** | Conciliación de pago móvil, aprobación en 1-clic y alertas de vencimiento de suscripción. | 🟢 **Listo** | [`02-agente-finanzas-cobranzas.md`](./02-agente-finanzas-cobranzas.md) \| [Blueprint JSON](./workflows/02-agente-finanzas-cobranzas-n8n.json) |
| `AG-AUD-03` | **Agente 03: Auditor de Procesos y Confiabilidad** | Monitoreo de flujos web, detección de errores en tiempo real y alertas instantáneas (Telegram + Email). | 🟢 **Listo** | [`03-agente-auditor-procesos.md`](./03-agente-auditor-procesos.md) \| [Blueprint JSON](./workflows/03-agente-auditor-procesos-n8n.json) |
| `AG-CEO-00` | **Agente 00: CEO IA & Orquestador Central** | Clasificación de intención, división de tareas y enrutamiento inteligente entre agentes. | ⏳ Pendiente | `00-agente-ceo-orquestador.md` |
| `AG-CS-03` | **Agente 03: Customer Success & QA** | Soporte técnico, verificación de salud de menús y tickets. | ⏳ Pendiente | `03-agente-customer-success.md` |
| `AG-MKT-04` | **Agente 04: Marketing & SEO** | Creación de contenido, posicionamiento de keywords y copys para redes. | ⏳ Pendiente | `04-agente-marketing-seo.md` |
| `AG-INT-05` | **Agente 05: Inteligencia Competitiva** | Monitoreo de precios y funciones en plataformas rivales. | ⏳ Pendiente | `05-agente-inteligencia-competitiva.md` |
| `AG-SEC-06` | **Agente 06: Ciberseguridad & Logs** | Auditoría de RLS en Supabase, Rate Limiting y alertas de seguridad. | ⏳ Pendiente | `06-agente-ciberseguridad.md` |

---

## ⚙️ Principios de Diseño
1. **Patrón Cerebro + Brazos:** La IA evalúa y decide; **n8n** ejecuta las acciones deterministas.
2. **Human-In-The-Loop (HITL):** Ninguna acción externa sensible (emails masivos, cobros, suspensión de cuentas) se envía sin la aprobación previa en Telegram/Slack.
3. **Persistencia en Supabase:** Toda acción de los agentes queda registrada en la base de datos de Glubbi para auditoría y métricas.
