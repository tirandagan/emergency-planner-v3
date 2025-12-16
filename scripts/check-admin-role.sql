-- Check and update admin role for your user

-- 1. Check current role
SELECT id, email, role, full_name
FROM profiles
WHERE email = 'tiran@tirandagan.com';

-- 2. Update to ADMIN role (uncomment and run if role is not ADMIN)
-- UPDATE profiles
-- SET role = 'ADMIN'
-- WHERE email = 'tiran@tirandagan.com';

-- 3. Verify the update
-- SELECT id, email, role, full_name
-- FROM profiles
-- WHERE email = 'tiran@tirandagan.com';
