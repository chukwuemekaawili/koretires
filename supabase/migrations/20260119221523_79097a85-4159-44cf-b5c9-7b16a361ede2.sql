-- Insert AI Agent settings
INSERT INTO site_settings (key, value, description)
VALUES ('ai_agent', '{"enabled": true, "lead_capture_enabled": true, "handoff_rules": "Suggest callback when user asks for quote, pricing for 4+ tires, or expresses urgency"}', 'AI Agent configuration')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Insert announcement settings
INSERT INTO site_settings (key, value, description)
VALUES ('announcements', '{"banner_enabled": false, "banner_text": "", "payment_messaging": "Cash and card payments accepted in-person on delivery/pickup. Online payments: Coming Soon."}', 'Announcement and messaging configuration')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;