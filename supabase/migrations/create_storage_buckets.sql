-- Criar buckets para armazenamento de imagens

-- Bucket para imagens de produtos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Bucket para imagens de lojas (logos, banners)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-images',
  'store-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Bucket para avatares de usuários
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso para product-images
CREATE POLICY "Public read access for product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own product images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own product images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated'
);

-- Políticas de acesso para store-images
CREATE POLICY "Public read access for store images" ON storage.objects
FOR SELECT USING (bucket_id = 'store-images');

CREATE POLICY "Authenticated users can upload store images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'store-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own store images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'store-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own store images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'store-images' AND
  auth.role() = 'authenticated'
);

-- Políticas de acesso para user-avatars
CREATE POLICY "Public read access for user avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-avatars' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-avatars' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-avatars' AND
  auth.role() = 'authenticated'
);