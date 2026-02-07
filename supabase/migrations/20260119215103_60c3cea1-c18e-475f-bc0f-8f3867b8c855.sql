-- ==========================================
-- UPDATE COMPANY_INFO with Brief values
-- ==========================================

-- Delete old values and insert fresh from brief
DELETE FROM public.company_info WHERE category IN ('contact', 'hours', 'location', 'policies');

INSERT INTO public.company_info (category, key, value) VALUES
-- Contact
('contact', 'business_name', 'Kore Tires Sales and Services'),
('contact', 'website', 'www.koretires.com'),
('contact', 'phone', '780-455-1251'),
('contact', 'email', 'edmonton@koretires.com'),
('contact', 'whatsapp', '+1 780 455 1251'),

-- Location
('location', 'address', '11314 163 Street NW'),
('location', 'city', 'Edmonton'),
('location', 'province', 'Alberta'),
('location', 'postal_code', 'T5M 1Y6'),
('location', 'latitude', '53.5697'),
('location', 'longitude', '-113.5467'),

-- Hours (Monday to Saturday 9-5)
('hours', 'hours_monday', '9:00 AM - 5:00 PM'),
('hours', 'hours_tuesday', '9:00 AM - 5:00 PM'),
('hours', 'hours_wednesday', '9:00 AM - 5:00 PM'),
('hours', 'hours_thursday', '9:00 AM - 5:00 PM'),
('hours', 'hours_friday', '9:00 AM - 5:00 PM'),
('hours', 'hours_saturday', '9:00 AM - 5:00 PM'),
('hours', 'hours_sunday', 'Closed'),

-- Policies
('policies', 'delivery_policy', 'Free delivery within Edmonton city limits'),
('policies', 'payment_policy', 'Pay in-person on delivery or pickup. Cash or card accepted.'),
('policies', 'warranty_policy', 'All Passenger Car Radial (PCR) tires include manufacturer warranty. Coverage begins from the date of purchase.'),
('policies', 'return_policy', 'Returns accepted within 30 days of purchase for unused tires in original condition. Installed tires not eligible for return.'),
('policies', 'installation_policy', 'Professional installation and tire services available. Book online or call.');

-- ==========================================
-- SEED PAGES
-- ==========================================

INSERT INTO public.pages (slug, title, seo_title, seo_description) VALUES
('home', 'Home', 'Kore Tires - One-Stop Shop For All Your Tire Needs | Edmonton', 'Kore Tires offers premium tire sales, installation, rotation, and repair services in Edmonton. Free delivery within city limits.'),
('services', 'Tire Services', 'Professional Tire Services | Kore Tires Edmonton', 'Expert tire installation, rotation, repair and seasonal changeover services in Edmonton.'),
('tire-care', 'Tire Care Tips', 'Tire Care & Maintenance Tips | Kore Tires', 'Essential tire care tips to extend tire life and ensure safety on Alberta roads.'),
('about', 'About Us', 'About Kore Tires | Edmonton Tire Specialists', 'Learn about Kore Tires, your trusted Edmonton tire specialists offering quality products and professional service.'),
('warranty', 'Warranty & Returns', 'Warranty & Return Policy | Kore Tires', 'Comprehensive warranty coverage and hassle-free return policy at Kore Tires.'),
('contact', 'Contact', 'Contact Kore Tires | Edmonton', 'Get in touch with Kore Tires Edmonton for tire sales, services, and inquiries.')
ON CONFLICT (slug) DO UPDATE SET 
    title = EXCLUDED.title,
    seo_title = EXCLUDED.seo_title,
    seo_description = EXCLUDED.seo_description;

-- ==========================================
-- SEED PAGE SECTIONS - HOME
-- ==========================================

INSERT INTO public.page_sections (page_id, section_key, section_type, sort_order, content_json) VALUES
-- Home Hero
((SELECT id FROM public.pages WHERE slug = 'home'), 'hero', 'hero', 1, '{
    "headline": "One-Stop Shop For",
    "sub_headline": "All Your Tire Needs",
    "body": "Browse our tire inventory and enjoy free delivery within Edmonton city limits. We offer a wide range of tires for all seasons and vehicles.",
    "cta_primary": {"label": "Browse Inventory", "href": "/shop"},
    "cta_secondary": {"label": "Call a Specialist", "href": "tel:780-455-1251"}
}'::jsonb),

-- Home Highlights
((SELECT id FROM public.pages WHERE slug = 'home'), 'highlights', 'features', 2, '{
    "items": [
        {"title": "Tire Sales and Services", "description": "Complete tire solutions for all vehicle types"},
        {"title": "Free Delivery", "description": "Free delivery within Edmonton city limits"},
        {"title": "Tire Care Services", "description": "Professional installation, rotation, and repair"}
    ]
}'::jsonb),

-- Home Warranty Callout
((SELECT id FROM public.pages WHERE slug = 'home'), 'warranty_callout', 'callout', 3, '{
    "title": "Warranty & Returns",
    "body": "All Passenger Car Radial (PCR) tires include manufacturer warranty. Returns accepted within 30 days for unused tires in original condition.",
    "cta": {"label": "Learn More", "href": "/warranty"}
}'::jsonb)

ON CONFLICT (page_id, section_key) DO UPDATE SET 
    content_json = EXCLUDED.content_json,
    sort_order = EXCLUDED.sort_order;

-- ==========================================
-- SEED PAGE SECTIONS - SERVICES
-- ==========================================

INSERT INTO public.page_sections (page_id, section_key, section_type, sort_order, content_json) VALUES
((SELECT id FROM public.pages WHERE slug = 'services'), 'hero', 'hero', 1, '{
    "headline": "Professional Tire Services",
    "body": "Expert tire care from certified technicians. We service all vehicle types."
}'::jsonb),

((SELECT id FROM public.pages WHERE slug = 'services'), 'installation', 'service_block', 2, '{
    "title": "Tire and Wheel Installation / Seasonal Changeover",
    "description": "Our certified technicians ensure proper mounting, balancing, and installation of your tires. We handle seasonal tire swaps efficiently, storing your off-season tires if needed.",
    "features": ["Professional mounting and balancing", "TPMS sensor service", "Seasonal changeover", "Tire storage available"]
}'::jsonb),

((SELECT id FROM public.pages WHERE slug = 'services'), 'rotation', 'service_block', 3, '{
    "title": "Tire Rotation",
    "description": "Regular tire rotation extends tire life by ensuring even wear across all four tires. We recommend rotation every 8,000-10,000 km or with every oil change.",
    "features": ["Extends tire life", "Improves handling", "Saves money long-term"]
}'::jsonb),

((SELECT id FROM public.pages WHERE slug = 'services'), 'repair', 'service_block', 4, '{
    "title": "Tire Repair",
    "description": "Punctures and minor damage can often be repaired safely. Our technicians assess damage and perform industry-standard repairs when possible.",
    "features": ["Puncture repair", "Damage assessment", "Safety inspection", "Quick turnaround"]
}'::jsonb)

ON CONFLICT (page_id, section_key) DO UPDATE SET 
    content_json = EXCLUDED.content_json,
    sort_order = EXCLUDED.sort_order;

-- ==========================================
-- SEED PAGE SECTIONS - TIRE CARE
-- ==========================================

INSERT INTO public.page_sections (page_id, section_key, section_type, sort_order, content_json) VALUES
((SELECT id FROM public.pages WHERE slug = 'tire-care'), 'hero', 'hero', 1, '{
    "headline": "Tire Care Tips",
    "body": "Essential maintenance tips to keep your tires performing safely and extend their lifespan."
}'::jsonb),

((SELECT id FROM public.pages WHERE slug = 'tire-care'), 'tips', 'tips_list', 2, '{
    "items": [
        {
            "title": "Rotate Tires Regularly",
            "body": "Rotate your tires every 8,000-10,000 km to ensure even wear. Front tires wear differently than rear tires due to steering and weight distribution. Regular rotation extends tire life and maintains balanced handling."
        },
        {
            "title": "Check Tire Pressure Regularly",
            "body": "Check tire pressure at least once a month and before long trips. Proper inflation improves fuel efficiency, handling, and tire life. Find the recommended pressure on your vehicles door jamb sticker or owners manual."
        },
        {
            "title": "Inspect for Wear and Damage",
            "body": "Check tread depth regularly using the penny test. Look for uneven wear patterns, cracks, bulges, or embedded objects. Replace tires when tread reaches 4/32 inch for winter or 2/32 inch for summer driving."
        },
        {
            "title": "Seasonal Tire Changes",
            "body": "In Alberta, switch to winter tires when temperatures consistently drop below 7°C. Winter tires provide better traction in cold, snow, and ice. Switch back to all-season or summer tires in spring."
        }
    ]
}'::jsonb)

ON CONFLICT (page_id, section_key) DO UPDATE SET 
    content_json = EXCLUDED.content_json,
    sort_order = EXCLUDED.sort_order;

-- ==========================================
-- SEED PAGE SECTIONS - ABOUT
-- ==========================================

INSERT INTO public.page_sections (page_id, section_key, section_type, sort_order, content_json) VALUES
((SELECT id FROM public.pages WHERE slug = 'about'), 'hero', 'hero', 1, '{
    "headline": "About Kore Tires",
    "body": "Your trusted Edmonton tire specialists, providing quality products and professional service."
}'::jsonb),

((SELECT id FROM public.pages WHERE slug = 'about'), 'story', 'content', 2, '{
    "title": "Our Story",
    "body": "Kore Tires Sales and Services is dedicated to providing Edmonton and area with quality tires and professional tire services. We believe in honest pricing, expert advice, and customer satisfaction."
}'::jsonb),

((SELECT id FROM public.pages WHERE slug = 'about'), 'why_choose', 'features', 3, '{
    "title": "Choose Kore Tires for",
    "items": [
        {"title": "Quality Selection", "description": "Wide range of trusted tire brands for all vehicles and seasons"},
        {"title": "Expert Service", "description": "Certified technicians for installation, rotation, and repair"},
        {"title": "Honest Pricing", "description": "Competitive prices with no hidden fees"},
        {"title": "Free Local Delivery", "description": "Free delivery within Edmonton city limits"},
        {"title": "Warranty Coverage", "description": "Manufacturer warranty on all PCR tires"}
    ]
}'::jsonb)

ON CONFLICT (page_id, section_key) DO UPDATE SET 
    content_json = EXCLUDED.content_json,
    sort_order = EXCLUDED.sort_order;

-- ==========================================
-- SEED PAGE SECTIONS - WARRANTY
-- ==========================================

INSERT INTO public.page_sections (page_id, section_key, section_type, sort_order, content_json) VALUES
((SELECT id FROM public.pages WHERE slug = 'warranty'), 'hero', 'hero', 1, '{
    "headline": "Warranty & Returns",
    "body": "We stand behind the products we sell with comprehensive warranty coverage."
}'::jsonb),

((SELECT id FROM public.pages WHERE slug = 'warranty'), 'pcr_warranty', 'content', 2, '{
    "title": "PCR Tire Warranty",
    "body": "All Passenger Car Radial (PCR) tires purchased from Kore Tires include manufacturer warranty coverage. The warranty begins from the date of purchase and covers defects in workmanship and materials. Keep your receipt as proof of purchase for warranty claims."
}'::jsonb),

((SELECT id FROM public.pages WHERE slug = 'warranty'), 'return_policy', 'content', 3, '{
    "title": "Return Policy",
    "body": "Returns are accepted within 30 days of purchase for unused tires in original condition. Tires that have been installed or used are not eligible for return. Please contact us to initiate a return and receive return authorization."
}'::jsonb),

((SELECT id FROM public.pages WHERE slug = 'warranty'), 'exclusions', 'list', 4, '{
    "title": "Warranty Exclusions",
    "items": [
        "Damage from road hazards, punctures, or impacts",
        "Wear from improper inflation or alignment",
        "Damage from improper installation",
        "Normal wear and tear",
        "Cosmetic imperfections"
    ]
}'::jsonb)

ON CONFLICT (page_id, section_key) DO UPDATE SET 
    content_json = EXCLUDED.content_json,
    sort_order = EXCLUDED.sort_order;

-- ==========================================
-- SEED PAGE SECTIONS - CONTACT
-- ==========================================

INSERT INTO public.page_sections (page_id, section_key, section_type, sort_order, content_json) VALUES
((SELECT id FROM public.pages WHERE slug = 'contact'), 'hero', 'hero', 1, '{
    "headline": "Contact Us",
    "body": "Have questions? Need a quote? Were here to help with all your tire needs."
}'::jsonb),

((SELECT id FROM public.pages WHERE slug = 'contact'), 'methods', 'contact_methods', 2, '{
    "items": [
        {"type": "phone", "label": "Call Us", "value": "780-455-1251", "description": "Mon-Sat 9AM-5PM"},
        {"type": "email", "label": "Email", "value": "edmonton@koretires.com", "description": "We respond within 24 hours"},
        {"type": "whatsapp", "label": "WhatsApp", "value": "+1 780 455 1251", "description": "Quick responses"},
        {"type": "location", "label": "Visit Us", "value": "11314 163 Street NW, Edmonton, AB T5M 1Y6", "description": "Mon-Sat 9AM-5PM"}
    ]
}'::jsonb)

ON CONFLICT (page_id, section_key) DO UPDATE SET 
    content_json = EXCLUDED.content_json,
    sort_order = EXCLUDED.sort_order;