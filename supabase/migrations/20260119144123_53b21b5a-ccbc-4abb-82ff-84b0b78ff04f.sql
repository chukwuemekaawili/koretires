-- Seed sample tire products
INSERT INTO public.products (size, description, vendor, type, price, wholesale_price, availability, features) VALUES
-- All Season Tires
('205/55/16', 'All Season Performance', 'SPORTRAK', 'all_season', 70.00, 55.00, 'In Stock', ARRAY['Long tread life', 'Quiet ride', 'All-weather traction']),
('215/60/16', 'All Season Touring', 'SPORTRAK', 'all_season', 75.00, 60.00, 'In Stock', ARRAY['Comfortable ride', 'Fuel efficient', 'Year-round performance']),
('225/45/17', 'All Season Sport', 'SPORTRAK', 'all_season', 80.00, 65.00, 'In Stock', ARRAY['Responsive handling', 'Low profile', 'High performance']),
('225/55/17', 'All Season Comfort', 'SPORTRAK', 'all_season', 85.00, 68.00, 'Available within 24h', ARRAY['Premium comfort', 'Quiet operation', 'Extended mileage']),
('235/55/18', 'All Season SUV', 'SPORTRAK', 'all_season', 100.00, 82.00, 'In Stock', ARRAY['SUV optimized', 'All-terrain capability', 'Heavy load rated']),
('245/45/18', 'All Season Performance Plus', 'SPORTRAK', 'all_season', 95.00, 78.00, 'In Stock', ARRAY['Sport tuned', 'Wet grip', 'Corner stability']),
('255/50/19', 'All Season Luxury', 'SPORTRAK', 'all_season', 110.00, 90.00, 'Available within 24h', ARRAY['Luxury ride quality', 'Low noise', 'Premium compound']),
('265/70/17', 'All Season Truck', 'SPORTRAK', 'all_season', 120.00, 98.00, 'In Stock', ARRAY['Truck rated', 'Durable construction', 'Towing capability']),

-- Winter Tires
('205/55/16', 'Winter Ice Grip', 'SPORTRAK', 'winter', 85.00, 68.00, 'In Stock', ARRAY['Studless ice', 'Snow traction', 'Cold weather compound']),
('215/60/16', 'Winter Snow Master', 'SPORTRAK', 'winter', 90.00, 72.00, 'In Stock', ARRAY['Deep snow', 'Ice braking', 'Siping technology']),
('225/45/17', 'Winter Sport Ice', 'SPORTRAK', 'winter', 95.00, 76.00, 'In Stock', ARRAY['Performance winter', 'Low temp flexibility', 'Sport handling']),
('225/60/17', 'Winter Touring', 'SPORTRAK', 'winter', 100.00, 80.00, 'In Stock', ARRAY['Comfortable winter', 'Quiet ride', 'Long lasting']),
('235/55/18', 'Winter SUV Ice', 'SPORTRAK', 'winter', 115.00, 92.00, 'Available within 24h', ARRAY['SUV winter', 'Heavy duty', 'All-wheel drive optimized']),
('245/45/18', 'Winter Performance', 'SPORTRAK', 'winter', 110.00, 88.00, 'In Stock', ARRAY['High speed rated', 'Ice performance', 'Precision control']),
('265/70/17', 'Winter Truck Ice', 'SPORTRAK', 'winter', 130.00, 105.00, 'In Stock', ARRAY['Truck winter', 'Load rated', 'Extreme conditions']),
('LT275/55/20', 'Winter HD Truck', 'SPORTRAK', 'winter', 160.00, 130.00, 'In Stock', ARRAY['Heavy duty', 'Commercial grade', 'Severe snow rated']),

-- All Weather Tires
('205/55/16', 'All Weather Grip', 'SPORTRAK', 'all_weather', 78.00, 62.00, 'In Stock', ARRAY['3-peak mountain snowflake', 'Year-round', 'Versatile']),
('215/65/17', 'All Weather Crossover', 'SPORTRAK', 'all_weather', 95.00, 76.00, 'In Stock', ARRAY['Crossover optimized', 'All conditions', 'Extended tread']),
('225/55/17', 'All Weather Performance', 'SPORTRAK', 'all_weather', 90.00, 72.00, 'Available within 24h', ARRAY['Sport all weather', 'Wet performance', 'Snow capable']),
('235/65/18', 'All Weather SUV', 'SPORTRAK', 'all_weather', 110.00, 88.00, 'In Stock', ARRAY['SUV all weather', 'Four season', 'Heavy load']),
('265/70/17', 'All Weather Terrain', 'SPORTRAK', 'all_weather', 125.00, 100.00, 'In Stock', ARRAY['Terrain capability', 'All conditions', 'Rugged construction']),
('LT275/55/20', 'All Weather Truck Pro', 'SPORTRAK', 'all_weather', 155.00, 125.00, 'In Stock', ARRAY['Professional grade', 'Commercial use', 'All season winter rated']),

-- Summer Tires
('205/55/16', 'Summer Performance', 'SPORTRAK', 'summer', 75.00, 60.00, 'In Stock', ARRAY['Dry grip', 'Responsive', 'Track capable']),
('225/45/17', 'Summer Sport', 'SPORTRAK', 'summer', 88.00, 70.00, 'In Stock', ARRAY['High performance', 'Corner grip', 'Fast response']),
('245/40/18', 'Summer Ultra High Performance', 'SPORTRAK', 'summer', 105.00, 85.00, 'Available within 24h', ARRAY['Ultra performance', 'Max grip', 'Track tested']),
('255/35/19', 'Summer Track Day', 'SPORTRAK', 'summer', 120.00, 96.00, 'In Stock', ARRAY['Track optimized', 'Extreme grip', 'Heat resistant']),
('275/40/20', 'Summer Supercar', 'SPORTRAK', 'summer', 145.00, 118.00, 'In Stock', ARRAY['Supercar rated', 'Maximum performance', 'Precision steering']);