-- Make sure the photos bucket is public so images can be displayed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'photos';

-- Create RLS policies for public access to view photos
CREATE POLICY "Public can view photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'photos');