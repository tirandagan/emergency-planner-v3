-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads to supplier-logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to supplier-logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from supplier-logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to supplier-logos" ON storage.objects;

-- Create policies for supplier-logos bucket

-- Allow authenticated users to upload (INSERT)
CREATE POLICY "Allow authenticated uploads to supplier-logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'supplier-logos');

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated updates to supplier-logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'supplier-logos');

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated deletes from supplier-logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'supplier-logos');

-- Allow public read access (SELECT)
CREATE POLICY "Allow public read access to supplier-logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'supplier-logos');
