-- ==========================================
-- SEED DATA FOR SMART RECIPE SYSTEM (MySQL)
-- ==========================================

USE themenu;

-- ==========================================
-- USERS (passwords are hashed versions of 'password123' for demonstration)
-- ==========================================
INSERT INTO users (username, email, password_hash) VALUES
('alice_chef', 'alice@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('bob_cook', 'bob@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('charlie_foodie', 'charlie@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('diana_baker', 'diana@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- ==========================================
-- INGREDIENTS (Global List)
-- ==========================================
INSERT INTO ingredients (name, base_unit) VALUES
-- Proteins
('Chicken Breast', 'g'),
('Ground Beef', 'g'),
('Salmon Fillet', 'g'),
('Eggs', 'piece'),
('Tofu', 'g'),

-- Vegetables
('Tomato', 'g'),
('Onion', 'g'),
('Garlic', 'g'),
('Carrot', 'g'),
('Bell Pepper', 'g'),
('Spinach', 'g'),
('Broccoli', 'g'),
('Potato', 'g'),

-- Grains & Pasta
('Rice', 'g'),
('Pasta', 'g'),
('Flour', 'g'),
('Bread', 'piece'),

-- Dairy
('Milk', 'ml'),
('Butter', 'g'),
('Cheese', 'g'),
('Yogurt', 'ml'),

-- Pantry Staples
('Olive Oil', 'ml'),
('Salt', 'g'),
('Black Pepper', 'g'),
('Sugar', 'g'),
('Soy Sauce', 'ml'),
('Tomato Sauce', 'ml'),
('Honey', 'ml'),

-- Herbs & Spices
('Basil', 'g'),
('Oregano', 'g'),
('Cumin', 'g'),
('Paprika', 'g');

-- ==========================================
-- USER INVENTORIES
-- ==========================================
-- Alice's Pantry
INSERT INTO inventories (user_id, ingredient_id, quantity, expiry_date) VALUES
(1, 1, 500, '2026-03-15'),    -- Chicken Breast
(1, 6, 300, '2026-03-10'),    -- Tomato
(1, 7, 200, '2026-03-20'),    -- Onion
(1, 8, 100, '2026-03-25'),    -- Garlic
(1, 14, 1000, '2027-01-01'),  -- Rice
(1, 15, 500, '2027-02-01'),   -- Pasta
(1, 22, 500, '2026-05-01'),   -- Olive Oil
(1, 23, 200, NULL),           -- Salt
(1, 24, 100, NULL),           -- Pepper
(1, 19, 100, '2026-03-05'),   -- Butter
(1, 20, 200, '2026-03-08');   -- Cheese

-- Bob's Pantry
INSERT INTO inventories (user_id, ingredient_id, quantity, expiry_date) VALUES
(2, 2, 800, '2026-03-12'),    -- Ground Beef
(2, 4, 12, '2026-03-18'),     -- Eggs
(2, 6, 400, '2026-03-08'),    -- Tomato
(2, 7, 150, '2026-03-15'),    -- Onion
(2, 14, 2000, '2027-06-01'),  -- Rice
(2, 16, 1000, '2027-03-01'),  -- Flour
(2, 18, 1000, '2026-03-30'),  -- Milk
(2, 25, 300, '2027-01-01'),   -- Sugar
(2, 22, 300, '2026-04-15');   -- Olive Oil

-- Charlie's Pantry
INSERT INTO inventories (user_id, ingredient_id, quantity, expiry_date) VALUES
(3, 3, 600, '2026-03-10'),    -- Salmon
(3, 11, 300, '2026-03-05'),   -- Spinach
(3, 12, 250, '2026-03-07'),   -- Broccoli
(3, 9, 400, '2026-03-20'),    -- Carrot
(3, 22, 400, '2026-06-01'),   -- Olive Oil
(3, 23, 150, NULL),           -- Salt
(3, 14, 800, '2027-02-01'),   -- Rice
(3, 26, 200, '2026-05-01');   -- Soy Sauce

-- ==========================================
-- RECIPES
-- ==========================================
INSERT INTO recipes (recipe_type, title, preparation_time, base_servings, description, is_ai_generated, created_by) VALUES
('quick', 'Classic Spaghetti Carbonara', '25 mins', 1, 'Creamy Italian pasta with eggs and cheese', 0, 1),
('quick', 'Garlic Butter Chicken', '30 mins', 1, 'Pan-seared chicken with garlic butter sauce', 0, 1),
('quick', 'Fried Rice', '20 mins', 1, 'Asian-style fried rice with vegetables and eggs', 0, 2),
('healthy', 'Tomato Basil Soup', '35 mins', 1, 'Simple and comforting tomato soup', 1, NULL),
('healthy', 'Grilled Salmon with Veggies', '35 mins', 1, 'Healthy grilled salmon with roasted vegetables', 0, 3),
('surprise', 'Beef Tacos', '30 mins', 1, 'Mexican-style ground beef tacos', 1, NULL),
('quick', 'Veggie Stir Fry', '20 mins', 1, 'Quick vegetable stir fry with tofu', 0, 4);

-- ==========================================
-- RECIPE INGREDIENTS
-- ==========================================
-- Recipe 1: Spaghetti Carbonara
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, item_name, amount, unit, required_quantity) VALUES
(1, 15, 'Pasta', 400, 'g', 400),
(1, 4, 'Eggs', 4, 'piece', 4),
(1, 20, 'Cheese', 100, 'g', 100),
(1, 8, 'Garlic', 10, 'g', 10),
(1, 24, 'Black Pepper', 5, 'g', 5),
(1, 23, 'Salt', 5, 'g', 5);

-- Recipe 2: Garlic Butter Chicken
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, item_name, amount, unit, required_quantity) VALUES
(2, 1, 'Chicken Breast', 500, 'g', 500),
(2, 19, 'Butter', 50, 'g', 50),
(2, 8, 'Garlic', 20, 'g', 20),
(2, 23, 'Salt', 5, 'g', 5),
(2, 24, 'Black Pepper', 3, 'g', 3),
(2, 22, 'Olive Oil', 20, 'ml', 20);

-- Recipe 3: Fried Rice
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, item_name, amount, unit, required_quantity) VALUES
(3, 14, 'Rice', 300, 'g', 300),
(3, 4, 'Eggs', 2, 'piece', 2),
(3, 7, 'Onion', 50, 'g', 50),
(3, 8, 'Garlic', 10, 'g', 10),
(3, 9, 'Carrot', 50, 'g', 50),
(3, 26, 'Soy Sauce', 30, 'ml', 30),
(3, 22, 'Olive Oil', 30, 'ml', 30);

-- Recipe 4: Tomato Basil Soup
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, item_name, amount, unit, required_quantity) VALUES
(4, 6, 'Tomato', 800, 'g', 800),
(4, 7, 'Onion', 100, 'g', 100),
(4, 8, 'Garlic', 15, 'g', 15),
(4, 29, 'Basil', 10, 'g', 10),
(4, 22, 'Olive Oil', 40, 'ml', 40),
(4, 23, 'Salt', 8, 'g', 8),
(4, 24, 'Black Pepper', 3, 'g', 3);

-- Recipe 5: Grilled Salmon with Veggies
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, item_name, amount, unit, required_quantity) VALUES
(5, 3, 'Salmon Fillet', 400, 'g', 400),
(5, 12, 'Broccoli', 200, 'g', 200),
(5, 9, 'Carrot', 150, 'g', 150),
(5, 22, 'Olive Oil', 30, 'ml', 30),
(5, 23, 'Salt', 5, 'g', 5),
(5, 24, 'Black Pepper', 3, 'g', 3);

-- Recipe 6: Beef Tacos
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, item_name, amount, unit, required_quantity) VALUES
(6, 2, 'Ground Beef', 500, 'g', 500),
(6, 7, 'Onion', 100, 'g', 100),
(6, 6, 'Tomato', 200, 'g', 200),
(6, 8, 'Garlic', 10, 'g', 10),
(6, 31, 'Cumin', 10, 'g', 10),
(6, 32, 'Paprika', 8, 'g', 8);

-- Recipe 7: Veggie Stir Fry
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, item_name, amount, unit, required_quantity) VALUES
(7, 5, 'Tofu', 300, 'g', 300),
(7, 10, 'Bell Pepper', 150, 'g', 150),
(7, 12, 'Broccoli', 150, 'g', 150),
(7, 9, 'Carrot', 100, 'g', 100),
(7, 8, 'Garlic', 15, 'g', 15),
(7, 26, 'Soy Sauce', 40, 'ml', 40),
(7, 22, 'Olive Oil', 30, 'ml', 30);
