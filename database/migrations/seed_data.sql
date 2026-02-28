-- ==========================================
-- SEED DATA FOR SMART RECIPE SYSTEM
-- ==========================================

USE smart_recipe;

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
INSERT INTO recipes (title, description, is_ai_generated, created_by) VALUES
('Classic Spaghetti Carbonara', 'Creamy Italian pasta with eggs and cheese', FALSE, 1),
('Garlic Butter Chicken', 'Pan-seared chicken with garlic butter sauce', FALSE, 1),
('Fried Rice', 'Asian-style fried rice with vegetables and eggs', FALSE, 2),
('Tomato Basil Soup', 'Simple and comforting tomato soup', TRUE, NULL),
('Grilled Salmon with Veggies', 'Healthy grilled salmon with roasted vegetables', FALSE, 3),
('Beef Tacos', 'Mexican-style ground beef tacos', TRUE, NULL),
('Veggie Stir Fry', 'Quick vegetable stir fry with tofu', FALSE, 4);

-- ==========================================
-- RECIPE INGREDIENTS
-- ==========================================
-- Recipe 1: Spaghetti Carbonara
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, required_quantity) VALUES
(1, 15, 400),   -- Pasta
(1, 4, 4),      -- Eggs
(1, 20, 100),   -- Cheese
(1, 8, 10),     -- Garlic
(1, 24, 5),     -- Black Pepper
(1, 23, 5);     -- Salt

-- Recipe 2: Garlic Butter Chicken
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, required_quantity) VALUES
(2, 1, 500),    -- Chicken Breast
(2, 19, 50),    -- Butter
(2, 8, 20),     -- Garlic
(2, 23, 5),     -- Salt
(2, 24, 3),     -- Black Pepper
(2, 22, 20);    -- Olive Oil

-- Recipe 3: Fried Rice
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, required_quantity) VALUES
(3, 14, 300),   -- Rice
(3, 4, 2),      -- Eggs
(3, 7, 50),     -- Onion
(3, 8, 10),     -- Garlic
(3, 9, 50),     -- Carrot
(3, 26, 30),    -- Soy Sauce
(3, 22, 30);    -- Olive Oil

-- Recipe 4: Tomato Basil Soup
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, required_quantity) VALUES
(4, 6, 800),    -- Tomato
(4, 7, 100),    -- Onion
(4, 8, 15),     -- Garlic
(4, 29, 10),    -- Basil
(4, 22, 40),    -- Olive Oil
(4, 23, 8),     -- Salt
(4, 24, 3);     -- Black Pepper

-- Recipe 5: Grilled Salmon with Veggies
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, required_quantity) VALUES
(5, 3, 400),    -- Salmon
(5, 12, 200),   -- Broccoli
(5, 9, 150),    -- Carrot
(5, 22, 30),    -- Olive Oil
(5, 23, 5),     -- Salt
(5, 24, 3);     -- Black Pepper

-- Recipe 6: Beef Tacos
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, required_quantity) VALUES
(6, 2, 500),    -- Ground Beef
(6, 7, 100),    -- Onion
(6, 6, 200),    -- Tomato
(6, 8, 10),     -- Garlic
(6, 31, 10),    -- Cumin
(6, 32, 8);     -- Paprika

-- Recipe 7: Veggie Stir Fry
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, required_quantity) VALUES
(7, 5, 300),    -- Tofu
(7, 10, 150),   -- Bell Pepper
(7, 12, 150),   -- Broccoli
(7, 9, 100),    -- Carrot
(7, 8, 15),     -- Garlic
(7, 26, 40),    -- Soy Sauce
(7, 22, 30);    -- Olive Oil

-- ==========================================
-- INSTRUCTIONS
-- ==========================================
-- Recipe 1: Spaghetti Carbonara
INSERT INTO instructions (recipe_id, step_number, instruction_text) VALUES
(1, 1, 'Boil pasta in salted water until al dente, about 8-10 minutes.'),
(1, 2, 'In a bowl, whisk together eggs, grated cheese, and black pepper.'),
(1, 3, 'Drain pasta, reserving 1 cup of pasta water.'),
(1, 4, 'Toss hot pasta with egg mixture, adding pasta water to create a creamy sauce.'),
(1, 5, 'Serve immediately with extra cheese and black pepper.');

-- Recipe 2: Garlic Butter Chicken
INSERT INTO instructions (recipe_id, step_number, instruction_text) VALUES
(2, 1, 'Season chicken breasts with salt and pepper on both sides.'),
(2, 2, 'Heat olive oil in a pan over medium-high heat.'),
(2, 3, 'Cook chicken for 6-7 minutes per side until golden and cooked through.'),
(2, 4, 'Remove chicken and add butter and minced garlic to the pan.'),
(2, 5, 'Cook garlic for 1 minute, then pour sauce over chicken and serve.');

-- Recipe 3: Fried Rice
INSERT INTO instructions (recipe_id, step_number, instruction_text) VALUES
(3, 1, 'Cook rice and let it cool completely (preferably day-old rice).'),
(3, 2, 'Beat eggs and scramble them in a wok, then set aside.'),
(3, 3, 'Heat oil in wok, add garlic and onion, stir-fry for 1 minute.'),
(3, 4, 'Add carrots and cook for 2 minutes.'),
(3, 5, 'Add rice, breaking up clumps, and stir-fry for 3-4 minutes.'),
(3, 6, 'Add scrambled eggs and soy sauce, toss everything together and serve hot.');

-- Recipe 4: Tomato Basil Soup
INSERT INTO instructions (recipe_id, step_number, instruction_text) VALUES
(4, 1, 'Heat olive oil in a large pot over medium heat.'),
(4, 2, 'Sauté chopped onion and garlic until soft and fragrant, about 5 minutes.'),
(4, 3, 'Add chopped tomatoes and cook for 10 minutes until they break down.'),
(4, 4, 'Add 2 cups of water, salt, and pepper. Simmer for 15 minutes.'),
(4, 5, 'Blend soup until smooth using an immersion blender.'),
(4, 6, 'Stir in fresh basil and serve warm.');

-- Recipe 5: Grilled Salmon with Veggies
INSERT INTO instructions (recipe_id, step_number, instruction_text) VALUES
(5, 1, 'Preheat oven to 200°C (400°F).'),
(5, 2, 'Season salmon fillets with salt, pepper, and drizzle with olive oil.'),
(5, 3, 'Toss broccoli and carrots with olive oil, salt, and pepper.'),
(5, 4, 'Place salmon and vegetables on a baking sheet.'),
(5, 5, 'Bake for 15-18 minutes until salmon is cooked through and veggies are tender.');

-- Recipe 6: Beef Tacos
INSERT INTO instructions (recipe_id, step_number, instruction_text) VALUES
(6, 1, 'Heat a skillet over medium-high heat.'),
(6, 2, 'Cook ground beef, breaking it apart, until browned.'),
(6, 3, 'Add diced onion and garlic, cook for 3 minutes.'),
(6, 4, 'Add cumin, paprika, salt, and diced tomatoes. Simmer for 5 minutes.'),
(6, 5, 'Serve in taco shells with your favorite toppings.');

-- Recipe 7: Veggie Stir Fry
INSERT INTO instructions (recipe_id, step_number, instruction_text) VALUES
(7, 1, 'Press tofu to remove excess water, then cut into cubes.'),
(7, 2, 'Heat oil in a wok over high heat.'),
(7, 3, 'Stir-fry tofu until golden, about 5 minutes. Remove and set aside.'),
(7, 4, 'Add garlic and vegetables to wok, stir-fry for 4-5 minutes.'),
(7, 5, 'Return tofu to wok, add soy sauce, toss everything together.'),
(7, 6, 'Serve hot over rice or noodles.');

-- ==========================================
-- COOKING LOGS (Sample History)
-- ==========================================
INSERT INTO cooking_logs (user_id, recipe_id, scaling_factor, auto_deducted, cooked_at) VALUES
(1, 1, 1.00, TRUE, '2026-02-20 18:30:00'),
(1, 2, 1.00, TRUE, '2026-02-22 19:00:00'),
(2, 3, 1.50, TRUE, '2026-02-21 12:30:00'),
(3, 5, 1.00, TRUE, '2026-02-23 13:00:00'),
(1, 4, 2.00, FALSE, '2026-02-25 17:00:00'),
(2, 6, 1.00, TRUE, '2026-02-26 18:45:00');
