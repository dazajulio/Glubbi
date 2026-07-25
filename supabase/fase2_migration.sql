-- ============================================================================
-- GLUBBI - MIGRACIÓN FASE 2: Pagos Móviles, Cupones y Delivery
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLA: payment_reports (Reportes de Pago Móvil)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    reference_number TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    payment_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_reports_restaurant ON public.payment_reports(restaurant_id);

ALTER TABLE public.payment_reports ENABLE ROW LEVEL SECURITY;

-- Políticas temporales (Demo / SuperAdmin + Gerentes)
CREATE POLICY "Gerentes ven sus reportes" ON public.payment_reports FOR SELECT USING (restaurant_id = public.get_user_restaurant_id());
CREATE POLICY "Gerentes insertan reportes" ON public.payment_reports FOR INSERT WITH CHECK (restaurant_id = public.get_user_restaurant_id());
-- Super Admin (dazajulio@gmail.com) o Allow ALL según tu esquema Demo:
CREATE POLICY "Demo allow ALL on payment_reports" ON public.payment_reports FOR ALL USING (true);


-- ----------------------------------------------------------------------------
-- 2. TABLA: coupons (Cupones del Super Admin)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    discount_percentage NUMERIC(5,2) NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    max_uses INTEGER,
    current_uses INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Demo allow ALL on coupons" ON public.coupons FOR ALL USING (true);


-- ----------------------------------------------------------------------------
-- 3. TABLA: coupon_redemptions (Expediente de Cupones Usados)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    discount_applied NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Demo allow ALL on coupon_redemptions" ON public.coupon_redemptions FOR ALL USING (true);


-- ----------------------------------------------------------------------------
-- 4. ACTUALIZACIONES A TABLAS EXISTENTES
-- ----------------------------------------------------------------------------

-- Agregar tipo de suscripción a restaurantes
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'lemon_squeezy' CHECK (subscription_type IN ('lemon_squeezy', 'pago_movil'));

-- Agregar configuraciones de delivery a restaurantes
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS delivery_discount_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS delivery_discount_percentage NUMERIC(5,2) DEFAULT 0.00;

-- Agregar rastreo de delivery fee en la orden
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee_applied NUMERIC(10,2) DEFAULT 0.00;


-- ----------------------------------------------------------------------------
-- 5. TRIGGERS PARA AUTO-UPDATE (Opcional)
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS set_payment_reports_updated_at ON public.payment_reports;
CREATE TRIGGER set_payment_reports_updated_at
  BEFORE UPDATE ON public.payment_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
