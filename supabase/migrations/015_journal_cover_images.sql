-- Add cover image support to journal entries
ALTER TABLE journal_entries
ADD COLUMN cover_image_url TEXT,
ADD COLUMN cover_image_path TEXT,
ADD COLUMN cover_image_public BOOLEAN DEFAULT false;

-- Create a table for public cover images that can be shared across users
CREATE TABLE public_cover_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL,
  category TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a table for user's private cover images
CREATE TABLE user_cover_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_journal_entries_cover_image ON journal_entries(cover_image_url);
CREATE INDEX idx_public_cover_images_active ON public_cover_images(is_active);
CREATE INDEX idx_user_cover_images_user_id ON user_cover_images(user_id);
CREATE INDEX idx_user_cover_images_public ON user_cover_images(is_public);

-- Enable RLS
ALTER TABLE public_cover_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cover_images ENABLE ROW LEVEL SECURITY;

-- Policies for public_cover_images
CREATE POLICY "Public cover images are viewable by everyone"
  ON public_cover_images FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage public cover images"
  ON public_cover_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Policies for user_cover_images
CREATE POLICY "Users can view their own cover images"
  ON user_cover_images FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view public cover images from other users"
  ON user_cover_images FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert their own cover images"
  ON user_cover_images FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own cover images"
  ON user_cover_images FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own cover images"
  ON user_cover_images FOR DELETE
  USING (user_id = auth.uid());

-- Create storage buckets for cover images
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('journal-covers', 'journal-covers', true),
  ('user-covers', 'user-covers', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for journal-covers bucket (public covers)
CREATE POLICY "Anyone can view public journal covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'journal-covers');

CREATE POLICY "Admins can upload public journal covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'journal-covers' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update public journal covers"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'journal-covers' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete public journal covers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'journal-covers' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Storage policies for user-covers bucket (private covers)
CREATE POLICY "Users can view their own covers"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'user-covers' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload their own covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-covers' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own covers"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'user-covers' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own covers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-covers' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Add some default public cover images
INSERT INTO public_cover_images (title, image_url, image_path, category) VALUES
  ('Classic Leather Journal', '/journal-covers/classic-leather.jpg', 'classic-leather.jpg', 'classic'),
  ('Floral Pattern', '/journal-covers/floral-pattern.jpg', 'floral-pattern.jpg', 'pattern'),
  ('Galaxy Theme', '/journal-covers/galaxy-theme.jpg', 'galaxy-theme.jpg', 'space'),
  ('Minimalist Blue', '/journal-covers/minimalist-blue.jpg', 'minimalist-blue.jpg', 'minimal'),
  ('Vintage Paper', '/journal-covers/vintage-paper.jpg', 'vintage-paper.jpg', 'vintage'),
  ('Nature Forest', '/journal-covers/nature-forest.jpg', 'nature-forest.jpg', 'nature'),
  ('Abstract Art', '/journal-covers/abstract-art.jpg', 'abstract-art.jpg', 'art'),
  ('Ocean Waves', '/journal-covers/ocean-waves.jpg', 'ocean-waves.jpg', 'nature');