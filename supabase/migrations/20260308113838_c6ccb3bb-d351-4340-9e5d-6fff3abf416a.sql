-- Create storage bucket for homepage images
INSERT INTO storage.buckets (id, name, public) VALUES ('homepage-assets', 'homepage-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for homepage assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'homepage-assets');

-- Allow authenticated users (admins) to upload
CREATE POLICY "Authenticated users can upload homepage assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'homepage-assets');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update homepage assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'homepage-assets');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete homepage assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'homepage-assets');
