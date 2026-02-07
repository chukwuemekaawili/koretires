UPDATE page_sections 
SET content_json = '{"headline": "Wholesale & Retail Tires —", "sub_headline": "All in One Place", "body": "Explore our wide selection of tires for every vehicle. Competitive pricing for retailers and drivers alike, plus free delivery within Edmonton city limits.", "cta_primary": {"label": "Browse Inventory", "href": "/shop"}, "cta_secondary": {"label": "Call a Specialist", "href": "tel:780-455-1251"}}'::jsonb,
    updated_at = now()
WHERE id = '5dc2d75f-1750-44e7-8713-6a2138b102e0';