-- ==============================================================================
-- FIX COMPANY CONTACT INFO
-- Run this in Supabase SQL Editor
-- ==============================================================================

-- Fix phone number
UPDATE company_info 
SET value = '780-455-1251' 
WHERE category = 'contact' AND key = 'phone';

-- Fix email
UPDATE company_info 
SET value = 'edmonton@koretires.com' 
WHERE category = 'contact' AND key = 'email';

-- Fix hours (Mon-Sat)
UPDATE company_info 
SET value = '9:00 AM - 5:00 PM' 
WHERE category = 'hours' AND key IN ('hours_monday', 'hours_tuesday', 'hours_wednesday', 'hours_thursday', 'hours_friday', 'hours_saturday');

-- Fix Sunday
UPDATE company_info 
SET value = 'Closed' 
WHERE category = 'hours' AND key = 'hours_sunday';

-- Verify
SELECT key, value, category 
FROM company_info 
WHERE category IN ('contact', 'hours')
ORDER BY category, key;
