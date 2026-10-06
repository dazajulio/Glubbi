-- ============================================================================
-- glubbi.app — MIGRACIÓN: CONVENIO CÁMARA GASTRONÓMICA DE MÉRIDA (CGM)
-- ============================================================================
-- Ejecuta este script en el SQL Editor de Supabase Dashboard.
-- ============================================================================

-- 1. Agregar columnas para la afiliación por convenio con la Cámara Gastronómica
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS is_cgm_member BOOLEAN DEFAULT false;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS cgm_member_code TEXT;

-- 2. Índice para consultas rápidas por código de afiliado a la Cámara
CREATE INDEX IF NOT EXISTS idx_restaurants_cgm_member_code
  ON public.restaurants (cgm_member_code)
  WHERE cgm_member_code IS NOT NULL;
