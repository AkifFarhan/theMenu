-- ==========================================
-- SEED DATA - MSSQL VERSION
-- ==========================================

USE themenu;

-- USERS
INSERT INTO users (username, email, password_hash) VALUES
('alice_chef', 'alice@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('bob_cook', 'bob@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('charlie_foodie', 'charlie@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('diana_baker', 'diana@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- INGREDIENTS (same as before, no changes needed)
INSERT INTO ingredients (name, base_unit) VALUES
('Chicken Breast', 'g'), ('Ground Beef', 'g'), ('Salmon Fillet', 'g'),
('Eggs', 'piece'), ('Tofu', 'g'), ('Tomato', 'g'), ('Onion', 'g'),
('Garlic', 'g'), ('Carrot', 'g'), ('Bell Pepper', 'g'), ('Spinach', 'g'),
('Broccoli', 'g'), ('Potato', 'g'), ('Rice', 'g'), ('Pasta', 'g'),
('Flour', 'g'), ('Bread', 'piece'), ('Milk', 'ml'), ('Butter', 'g'),
('Cheese', 'g'), ('Yogurt', 'ml'), ('Olive Oil', 'ml'), ('Salt', 'g'),
('Black Pepper', 'g'), ('Sugar', 'g'), ('Soy Sauce', 'ml'),
('Tomato Sauce', 'ml'), ('Honey', 'ml'), ('Basil', 'g'),
('Oregano', 'g'), ('Cumin', 'g'), ('Paprika', 'g');

-- INVENTORIES (same, no changes needed)
INSERT INTO inventories (user_id, ingredient_id, quantity, expiry_date) VALUES
(1, 1, 500, '2026-03-15'), (1, 6, 300, '2026-03-10'),
(1, 7, 200, '2026-03-20'), (1, 8, 100, '2026-03-25'),
(1, 14, 1000, '2027-01-01'), (1, 15, 500, '2027-02-01'),
(1, 22, 500, '2026-05-01'), (1, 23, 200, NULL),
(1, 24, 100, NULL), (1, 19, 100, '2026-03-05'),
(1, 20, 200, '2026-03-08'),
(2, 2, 800, '2026-03-12'), (2, 4, 12, '2026-03-18'),
(2, 6, 400, '2026-03-08'), (2, 7, 150, '2026-03-15'),
(2, 14, 2000, '2027-06-01'), (2, 16, 1000, '2027-03-01'),
(2, 18, 1000, '2026-03-30'), (2, 25, 300, '2027-01-01'),
(2, 22, 300, '2026-04-15'),
(3, 3, 600, '2026-03-10'), (3, 11, 300, '2026-03-05'),
(3, 12, 250, '2026-03-07'), (3, 9, 400, '2026-03-20'),
(3, 22, 400, '2026-06-01'), (3, 23, 150, NULL),
(3, 14, 800, '2027-02-01'), (3, 26, 200, '2026-05-01');

-- RECIPES — ⚠️ TRUE/FALSE changed to 1/0
INSERT INTO recipes (title, description, is_ai_generated, created_by) VALUES
('Classic Spaghetti Carbonara', 'Creamy Italian pasta with eggs and cheese', 0, 1),
('Garlic Butter Chicken', 'Pan-seared chicken with garlic butter sauce', 0, 1),
('Fried Rice', 'Asian-style fried rice with vegetables and eggs', 0, 2),
('Tomato Basil Soup', 'Simple and comforting tomato soup', 1, NULL),
('Grilled Salmon with Veggies', 'Healthy grilled salmon with roasted vegetables', 0, 3),
('Beef Tacos', 'Mexican-style ground beef tacos', 1, NULL),
('Veggie Stir Fry', 'Quick vegetable stir fry with tofu', 0, 4);

-- RECIPE INGREDIENTS (same, no changes needed)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, required_quantity) VALUES
(1, 15, 400), (1, 4, 4), (1, 20, 100), (1, 8, 10), (1, 24, 5), (1, 23, 5),
(2, 1, 500), (2, 19, 50), (2, 8, 20), (2, 23, 5), (2, 24, 3), (2, 22, 20),
(3, 14, 300), (3, 4, 2), (3, 7, 50), (3, 8, 10), (3, 9, 50), (3, 26, 30), (3, 22, 30),
(4, 6, 800), (4, 7, 100), (4, 8, 15), (4, 29, 10), (4, 22, 40), (4, 23, 8), (4, 24, 3),
(5, 3, 400), (5, 12, 200), (5, 9, 150), (5, 22, 30), (5, 23, 5), (5, 24, 3),
(6, 2, 500), (6, 7, 100), (6, 6, 200), (6, 8, 10), (6, 31, 10), (6, 32, 8),
(7, 5, 300), (7, 10, 150), (7, 12, 150), (7, 9, 100), (7, 8, 15), (7, 26, 40), (7, 22, 30);

-- INSTRUCTIONS (same, no changes needed)
INSERT INTO instructions (recipe_id, step_number, instruction_text) VALUES
(1, 1, 'Boil pasta in salted water until al dente, about 8-10 minutes.'),
(1, 2, 'In a bowl, whisk together eggs, grated cheese, and black pepper.'),
(1, 3, 'Drain pasta, reserving 1 cup of pasta water.'),
(1, 4, 'Toss hot pasta with egg mixture, adding pasta water to create a creamy sauce.'),
(1, 5, 'Serve immediately with extra cheese and black pepper.'),
(2, 1, 'Season chicken breasts with salt and pepper on both sides.'),
(2, 2, 'Heat olive oil in a pan over medium-high heat.'),
(2, 3, 'Cook chicken for 6-7 minutes per side until golden and cooked through.'),
(2, 4, 'Remove chicken and add butter and minced garlic to the pan.'),
(2, 5, 'Cook garlic for 1 minute, then pour sauce over chicken and serve.'),
(3, 1, 'Cook rice and let it cool completely (preferably day-old rice).'),
(3, 2, 'Beat eggs and scramble them in a wok, then set aside.'),
(3, 3, 'Heat oil in wok, add garlic and onion, stir-fry for 1 minute.'),
(3, 4, 'Add carrots and cook for 2 minutes.'),
(3, 5, 'Add rice, breaking up clumps, and stir-fry for 3-4 minutes.'),
(3, 6, 'Add scrambled eggs and soy sauce, toss everything together and serve hot.'),
(4, 1, 'Heat olive oil in a large pot over medium heat.'),
(4, 2, 'Sauté chopped onion and garlic until soft and fragrant, about 5 minutes.'),
(4, 3, 'Add chopped tomatoes and cook for 10 minutes until they break down.'),
(4, 4, 'Add 2 cups of water, salt, and pepper. Simmer for 15 minutes.'),
(4, 5, 'Blend soup until smooth using an immersion blender.'),
(4, 6, 'Stir in fresh basil and serve warm.'),
(5, 1, 'Preheat oven to 200°C (400°F).'),
(5, 2, 'Season salmon fillets with salt, pepper, and drizzle with olive oil.'),
(5, 3, 'Toss broccoli and carrots with olive oil, salt, and pepper.'),
(5, 4, 'Place salmon and vegetables on a baking sheet.'),
(5, 5, 'Bake for 15-18 minutes until salmon is cooked through and veggies are tender.'),
(6, 1, 'Heat a skillet over medium-high heat.'),
(6, 2, 'Cook ground beef, breaking it apart, until browned.'),
(6, 3, 'Add diced onion and garlic, cook for 3 minutes.'),
(6, 4, 'Add cumin, paprika, salt, and diced tomatoes. Simmer for 5 minutes.'),
(6, 5, 'Serve in taco shells with your favorite toppings.'),
(7, 1, 'Press tofu to remove excess water, then cut into cubes.'),
(7, 2, 'Heat oil in a wok over high heat.'),
(7, 3, 'Stir-fry tofu until golden, about 5 minutes. Remove and set aside.'),
(7, 4, 'Add garlic and vegetables to wok, stir-fry for 4-5 minutes.'),
(7, 5, 'Return tofu to wok, add soy sauce, toss everything together.'),
(7, 6, 'Serve hot over rice or noodles.');

-- COOKING LOGS — ⚠️ TRUE/FALSE changed to 1/0
INSERT INTO cooking_logs (user_id, recipe_id, scaling_factor, auto_deducted, cooked_at) VALUES
(1, 1, 1.00, 1, '2026-02-20 18:30:00'),
(1, 2, 1.00, 1, '2026-02-22 19:00:00'),
(2, 3, 1.50, 1, '2026-02-21 12:30:00'),
(3, 5, 1.00, 1, '2026-02-23 13:00:00'),
(1, 4, 2.00, 0, '2026-02-25 17:00:00'), 
(2, 6, 1.00, 1, '2026-02-26 18:45:00');