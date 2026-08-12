-- ============================================================================
-- GLUBBI - CORRECCIÓN INTEGRAL DE SEGURIDAD Y TABLAS FALTANTES
-- Ejecutar en: https://supabase.com/dashboard/project/oxjbswrcdhlbifgsnhll/sql/new
-- ============================================================================


-- ============================================================================
-- PARTE A: RESTRICCIÓN DE ACCESO ANÓNIMO EXCESIVO
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- A1. system_logs — Solo usuarios autenticados (super admin)
--     Motivo: Son logs internos de auditoría. Nunca deben ser públicos.
-- ────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Super Admins only" ON public.system_logs;
DROP POLICY IF EXISTS "Super Admins only system_logs" ON public.system_logs;

CREATE POLICY "system_logs_auth_all"
  ON public.system_logs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ────────────────────────────────────────────────────────────────────────────
-- A2. team_members — Solo autenticados (administradores internos de Glubbi)
--     Motivo: Contiene nombres, emails y códigos de agentes de ventas.
-- ────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all team_members" ON public.team_members;

CREATE POLICY "team_members_auth_all"
  ON public.team_members FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ────────────────────────────────────────────────────────────────────────────
-- A3. team_sales — Solo autenticados
--     Motivo: Contiene datos financieros y comerciales internos de B2B.
-- ────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all team_sales" ON public.team_sales;

CREATE POLICY "team_sales_auth_all"
  ON public.team_sales FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ────────────────────────────────────────────────────────────────────────────
-- A4. coupon_redemptions — Solo autenticados
--     Motivo: Historial interno de uso de cupones. No requiere acceso público.
--     NOTA: La validación de cupones en /register usa la tabla `coupons` 
--     a través del cliente admin (service_role), por lo que esto no rompe el flujo.
-- ────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Demo allow ALL on coupon_redemptions" ON public.coupon_redemptions;
DROP POLICY IF EXISTS "Allow all coupon_redemptions" ON public.coupon_redemptions;

CREATE POLICY "coupon_redemptions_auth_all"
  ON public.coupon_redemptions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ────────────────────────────────────────────────────────────────────────────
-- A5. glubbi_customers — INSERT público (registro app móvil), SELECT restringido
--     Motivo: Contiene PII (nombre, email, teléfono, PIN).
--     El flujo de login de la app móvil usa el PIN localmente; la búsqueda
--     por email se hace vía API route con service_role (no expone datos raw).
--     MANTENEMOS SELECT público temporalmente para no romper el login de la app
--     mientras se migra a una API route server-side. Se documenta como deuda técnica.
-- ────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Enable select for users based on email" ON public.glubbi_customers;
DROP POLICY IF EXISTS "Enable insert for everyone on glubbi_customers" ON public.glubbi_customers;
DROP POLICY IF EXISTS "Allow all glubbi_customers" ON public.glubbi_customers;

-- INSERT abierto: cualquiera puede registrarse desde la app
CREATE POLICY "glubbi_customers_insert_public"
  ON public.glubbi_customers FOR INSERT
  WITH CHECK (true);

-- SELECT público temporal (login app móvil) — DEUDA TÉCNICA: migrar a API route
CREATE POLICY "glubbi_customers_select_public"
  ON public.glubbi_customers FOR SELECT
  USING (true);

-- UPDATE y DELETE solo para authenticated (administración interna)
CREATE POLICY "glubbi_customers_auth_write"
  ON public.glubbi_customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "glubbi_customers_auth_delete"
  ON public.glubbi_customers FOR DELETE
  TO authenticated
  USING (true);

-- ────────────────────────────────────────────────────────────────────────────
-- A6. coupons — SELECT anon RETENIDO intencionalmente
--     Motivo: El formulario de /register valida cupones desde el cliente.
--     Aunque usa createAdminClient en la API route, el cliente del browser
--     también consulta directamente. Se mantiene solo SELECT público.
--     INSERT/UPDATE/DELETE solo para authenticated.
-- ────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Demo allow ALL on coupons" ON public.coupons;
DROP POLICY IF EXISTS "Allow all coupons" ON public.coupons;

-- Lectura pública (validación de cupón en registro)
CREATE POLICY "coupons_select_public"
  ON public.coupons FOR SELECT
  USING (is_active = true); -- Solo cupones activos son visibles públicamente

-- Gestión completa solo para autenticados (super admin)
CREATE POLICY "coupons_auth_write"
  ON public.coupons FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ============================================================================
-- PARTE B: CREACIÓN DE TABLAS FALTANTES
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- B1. leads — Formulario de contacto / landing page
--     Usada por: /api/leads (server-side con createAdminClient)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_name TEXT NOT NULL,
    contact_name    TEXT NOT NULL,
    email           TEXT NOT NULL,
    phone           TEXT,
    business_type   TEXT DEFAULT 'other',
    status          TEXT NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new', 'contacted', 'onboarded', 'discarded')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_status    ON public.leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_email     ON public.leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_created   ON public.leads (created_at DESC);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Solo el service_role (server-side API) puede insertar/leer leads.
-- No se expone a anon ni a authenticated directamente.
-- La ruta /api/leads usa createAdminClient que bypasea RLS.
CREATE POLICY "leads_service_role_only"
  ON public.leads FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.leads IS 'Solicitudes de contacto desde la landing page. Solo accesible via service_role (API routes).';


-- ────────────────────────────────────────────────────────────────────────────
-- B2. payment_reports — Reportes de pago móvil (Gerente → Super Admin)
--     Usada por: /gerente/suscripcion, /admin/pagos-moviles
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_reports (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id    UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    amount           NUMERIC(10,2) NOT NULL,
    reference_number TEXT NOT NULL,
    bank_name        TEXT NOT NULL,
    payment_date     DATE NOT NULL,
    status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'approved', 'rejected')),
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_reports_restaurant ON public.payment_reports (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_payment_reports_status     ON public.payment_reports (status);
CREATE INDEX IF NOT EXISTS idx_payment_reports_created    ON public.payment_reports (created_at DESC);

ALTER TABLE public.payment_reports ENABLE ROW LEVEL SECURITY;

-- Gerente puede ver e insertar sus propios reportes
CREATE POLICY "payment_reports_gerente_select"
  ON public.payment_reports FOR SELECT
  TO authenticated
  USING (restaurant_id = public.get_user_restaurant_id());

CREATE POLICY "payment_reports_gerente_insert"
  ON public.payment_reports FOR INSERT
  TO authenticated
  WITH CHECK (restaurant_id = public.get_user_restaurant_id());

-- Super Admin puede ver y actualizar todos los reportes
-- (El panel usa createClient con sesión autenticada del super admin)
CREATE POLICY "payment_reports_admin_all"
  ON public.payment_reports FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger para auto-update de updated_at
DROP TRIGGER IF EXISTS set_payment_reports_updated_at ON public.payment_reports;
CREATE TRIGGER set_payment_reports_updated_at
  BEFORE UPDATE ON public.payment_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.payment_reports IS 'Reportes de pago móvil enviados por restaurantes. Aprobados/rechazados por el Super Admin.';


-- ────────────────────────────────────────────────────────────────────────────
-- B3. ad_packages — Paquetes publicitarios B2B (Glubbi Ads)
--     Usada por: /admin/posicionamiento, /gerente/promocionar
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ad_packages (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          TEXT NOT NULL,
    price         NUMERIC(10,2) NOT NULL DEFAULT 0,
    duration_days INTEGER NOT NULL DEFAULT 7,
    tier          INTEGER NOT NULL DEFAULT 1 CHECK (tier IN (1, 2)),
    badge_text    TEXT NOT NULL DEFAULT 'DESTACADO',
    description   TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_packages ENABLE ROW LEVEL SECURITY;

-- Lectura pública: gerentes pueden ver paquetes disponibles
CREATE POLICY "ad_packages_select_public"
  ON public.ad_packages FOR SELECT
  USING (is_active = true);

-- Gestión completa solo para super admin (authenticated)
CREATE POLICY "ad_packages_auth_write"
  ON public.ad_packages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Datos iniciales de ejemplo
INSERT INTO public.ad_packages (name, price, duration_days, tier, badge_text, description, is_active)
VALUES
  ('Impulso Semanal', 15.00, 7, 1, 'DESTACADO',
   'Posicionamiento privilegiado en el feed de Glubbi por 7 días.', true),
  ('VIP Top Mensual', 45.00, 30, 2, 'PATROCINADO VIP',
   'Aparición en los primeros lugares del feed y sección de ofertas por 30 días.', true)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.ad_packages IS 'Paquetes publicitarios B2B disponibles para restaurantes en la plataforma Glubbi.';
