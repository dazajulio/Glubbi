-- SQL Seed: Inserta o actualiza el cupón de bienvenida INICIOGLUBBI (100% de descuento)
INSERT INTO coupons (code, discount_percentage, is_active, max_uses, current_uses)
VALUES ('INICIOGLUBBI', 100, true, NULL, 0)
ON CONFLICT (code) 
DO UPDATE SET 
  discount_percentage = 100,
  is_active = true;
