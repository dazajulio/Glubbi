# Identidad de Marca y Sistema de Diseño (Glubbi)

Este documento centraliza los lineamientos visuales (UI/UX) y paleta de colores para la plataforma SaaS y aplicaciones móviles de Glubbi, basándose en la configuración actual del código (`globals.css` y Tailwind V4) y adaptándose al modelo estructural de marca institucional.

---

## 🎨 1. Paleta de Colores Oficial

La paleta se divide en colores de marca absolutos y colores funcionales para la interfaz de usuario (UI), apoyados fuertemente por la escala `slate` de Tailwind.

### 🟠 Primary (Naranja Glubbi)
Representa la marca, los llamados a la acción (CTAs) principales, botones primarios y estados activos.
- **HEX Exacto Institucional:** `#FF6B00` (Variable: `--brand-primary`)
- **UI Equivalente (Light Theme):** `#ea580c` (Tailwind `orange-600`)
- **UI Equivalente (Dark Theme):** `#f97316` (Tailwind `orange-500`)

### 🌑 Secondary (Azul Noche Oscuro)
Utilizado para el fondo general del ecosistema en modo oscuro, barras laterales (sidebars) de los gerentes y textos primarios de alto contraste.
- **HEX Exacto Institucional:** `#1A1A2E` (Variable: `--brand-secondary`)
- **UI Equivalente (Tailwind):** `#0F172A` (Tailwind `slate-900`)

### 🌫️ Tertiary (Gris Pizarra / Azulado Mudo)
Utilizado para textos secundarios, subtítulos, descripciones e iconos inactivos.
- **HEX Exacto Institucional:** `#64748B`
- **UI Equivalente (Tailwind):** Tailwind `slate-500`

### ⚪ Neutral (Fondos y Superficies Claras)
Utilizado para el fondo principal del modo claro, tarjetas (cards), modales y separadores visuales.
- **HEX Exacto Institucional:** `#F8FAFC`
- **UI Equivalente (Tailwind):** Tailwind `slate-50`
- **Blanco Puro (Tarjetas):** `#FFFFFF`

---

## 🔤 2. Tipografía (Typography)

La fuente oficial del ecosistema está configurada para garantizar legibilidad óptima en interfaces de alta densidad (KDS, Paneles de Administración).

- **Fuente Principal (Global):** **Inter** (`--font-inter`)
- **Fallback:** `system-ui, -apple-system, sans-serif`
- **Uso Estructural:**
  - **Headline (Titulares):** Bold (700) o Black (900), colores `slate-900` u `orange-500`.
  - **Body (Cuerpo):** Regular (400) o Medium (500), color `slate-600`.
  - **Label (Etiquetas/Botones):** Font-bold (700), mayúsculas para insignias (tracking-wider).

---

## 🔘 3. Elementos de Interfaz (UI Components)

### Botones (Buttons)
- **Primary:** Fondo gradiente de Naranja a Índigo o Naranja sólido (`bg-orange-500`), texto blanco (`text-white`), con sombra suave y redondeado `rounded-xl`.
- **Secondary (Inverted/Outlined):** Fondo oscuro (`bg-gray-900`) o borde naranja (`border-orange-500 text-orange-500`), con estado hover variando opacidad (`hover:bg-orange-50`).

### Estados de Color (Alertas y Badges)
- **Éxito (Listo/Pagado):** Verde Esmeralda (`bg-emerald-50 text-emerald-700 border-emerald-200`)
- **Pendiente / Warning:** Ámbar (`bg-amber-50 text-amber-700 border-amber-200`)
- **Acción / Delivery:** Azul (`bg-blue-50 text-blue-600 border-blue-200`)
- **Validación Manual:** Morado (`bg-purple-100 text-purple-800 border-purple-200`)
- **Peligro (Cancelado):** Rojo (`bg-red-50 text-red-600 border-red-200`)

### Inputs y Formularios
- **Fondo:** `bg-slate-50` (o transparente `bg-white`)
- **Bordes:** `border-gray-200`
- **Focus:** Anillo naranja vibrante (`focus:ring-2 focus:ring-orange-500` / `border-orange-600`).
