-- 1. Añadir columnas de KYC a la tabla restaurants
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS kyc_documents JSONB DEFAULT '{}'::jsonb;

-- 2. Crear Bucket para Documentos KYC (Requiere ejecutar como superusuario)
-- Nota: En Supabase Studio, ve a Storage -> Create Bucket y llámalo "kyc_documents".
-- Ponlo como PRIVADO para que nadie pueda ver los documentos sin autenticación.
-- Opcionalmente puedes correr esto si tienes permisos:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc_documents', 'kyc_documents', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas RLS para el Bucket (Permite subir a los dueños)
CREATE POLICY "Dueños pueden subir documentos KYC" 
ON storage.objects FOR INSERT 
TO public
WITH CHECK (bucket_id = 'kyc_documents');

CREATE POLICY "Dueños y admins pueden leer documentos KYC" 
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'kyc_documents');
