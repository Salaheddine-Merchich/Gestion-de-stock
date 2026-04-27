-- Delete existing categories and add Cosumar categories
DELETE FROM categories;

-- Insert Cosumar categories
INSERT INTO categories (name) VALUES 
('Sucre en morceaux'),
('Sucre semoule'),
('Sucre pain'),
('Sucre cassonade'),
('Autres produits sucriers');