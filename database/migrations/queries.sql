/*
	theMenu - Consolidated SQL queries used by the active web app API
	Source: server/app/Http/Controllers and related model operations
	Notes:
	- Queries are written as MySQL style templates with named parameters.
	- Eloquent may emit equivalent SQL with different aliases or formatting.
*/

/* ======================================================
	 AUTHENTICATION (AuthController)
	 ====================================================== */

-- Register user
INSERT INTO users (username, email, password_hash, created_at, updated_at)
VALUES (:username, :email, :password_hash, NOW(), NOW());

-- Find user by email for login
SELECT id, username, email, password_hash, created_at, updated_at
FROM users
WHERE email = :email
LIMIT 1;

-- Insert Sanctum access token (created by createToken)
INSERT INTO personal_access_tokens
	(tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at)
VALUES
	('App\\Models\\User', :user_id, 'auth_token', :hashed_token, '["*"]', NULL, NULL, NOW(), NOW());

-- Logout: delete current token
DELETE FROM personal_access_tokens
WHERE id = :current_token_id
	AND tokenable_id = :user_id
	AND tokenable_type = 'App\\Models\\User';

-- Get current authenticated user
SELECT id, username, email, created_at, updated_at
FROM users
WHERE id = :user_id
LIMIT 1;


/* ======================================================
	 INGREDIENTS & DASHBOARD (InventoryController)
	 ====================================================== */

-- List ingredients
SELECT id, name, base_unit
FROM ingredients
ORDER BY name ASC;

-- Dashboard inventory count
SELECT COUNT(*) AS inventory_count
FROM inventories
WHERE user_id = :user_id;


/* ======================================================
	 INVENTORY MANAGEMENT (InventoryController)
	 ====================================================== */

-- Get user inventory with ingredient details
SELECT
	i.id,
	ing.name,
	i.quantity,
	ing.base_unit AS unit,
	i.expiry_date,
	i.ingredient_id
FROM inventories i
INNER JOIN ingredients ing ON ing.id = i.ingredient_id
WHERE i.user_id = :user_id
ORDER BY i.id DESC;

-- Check existing inventory item (used in bulk add loop)
SELECT id, user_id, ingredient_id, quantity, expiry_date
FROM inventories
WHERE user_id = :user_id
	AND ingredient_id = :ingredient_id
LIMIT 1;

-- Update existing inventory item quantity (bulk add)
UPDATE inventories
SET quantity = quantity + :quantity_to_add,
		expiry_date = COALESCE(:expiry_date, expiry_date),
		updated_at = NOW()
WHERE id = :inventory_id
	AND user_id = :user_id;

-- Insert new inventory item (bulk add)
INSERT INTO inventories (user_id, ingredient_id, quantity, expiry_date, created_at, updated_at)
VALUES (:user_id, :ingredient_id, :quantity, :expiry_date, NOW(), NOW());

-- Find inventory item for delete
SELECT id, user_id, ingredient_id, quantity, expiry_date
FROM inventories
WHERE user_id = :user_id
	AND id = :inventory_id
LIMIT 1;

-- Delete inventory item
DELETE FROM inventories
WHERE id = :inventory_id
	AND user_id = :user_id;

-- Find inventory item for update
SELECT id, user_id, ingredient_id, quantity, expiry_date
FROM inventories
WHERE user_id = :user_id
	AND id = :inventory_id
LIMIT 1;

-- Update inventory item
UPDATE inventories
SET quantity = COALESCE(:quantity, quantity),
		expiry_date = COALESCE(:expiry_date, expiry_date),
		updated_at = NOW()
WHERE id = :inventory_id
	AND user_id = :user_id;


/* ======================================================
	 RECIPES: MATCHING (RecipeController)
	 ====================================================== */

-- Inventory snapshot for matching
SELECT
	i.id,
	i.user_id,
	i.ingredient_id,
	i.quantity,
	i.expiry_date
FROM inventories i
INNER JOIN ingredients ing ON ing.id = i.ingredient_id
WHERE i.user_id = :user_id;

-- Fetch AI-generated recipes
SELECT r.*
FROM recipes r
LEFT JOIN users recipe_creators ON recipe_creators.id = r.created_by
WHERE r.is_ai_generated = 1
ORDER BY r.id DESC;

-- Eager load recipe ingredients for returned recipes
SELECT ri.*, ing.id AS ingredient_id_ref, ing.name, ing.base_unit
FROM recipe_ingredients ri
LEFT JOIN ingredients ing ON ing.id = ri.ingredient_id
WHERE ri.recipe_id IN (:recipe_ids);

-- Eager load instructions for returned recipes
SELECT recipe_id, step_number, instruction_text
FROM instructions
WHERE recipe_id IN (:recipe_ids)
ORDER BY recipe_id, step_number ASC;


/* ======================================================
	 RECIPES: SAVE GENERATED (RecipeController)
	 ====================================================== */

-- Insert generated recipe
INSERT INTO recipes
	(recipe_type, title, description, preparation_time, base_servings, is_ai_generated, created_by, created_at, updated_at)
VALUES
	(:recipe_type, :title, :description, :preparation_time, 1, 1, :created_by, NOW(), NOW());

-- Find ingredient by case-insensitive name
SELECT id, name, base_unit
FROM ingredients
WHERE LOWER(name) = LOWER(:ingredient_name)
LIMIT 1;

-- Insert missing ingredient
INSERT INTO ingredients (name, base_unit, created_at, updated_at)
VALUES (:ingredient_name, :base_unit, NOW(), NOW());

-- Insert recipe ingredient
INSERT INTO recipe_ingredients
	(recipe_id, ingredient_id, item_name, amount, unit, required_quantity, created_at, updated_at)
VALUES
	(:recipe_id, :ingredient_id, :item_name, :amount, :unit, :required_quantity, NOW(), NOW());

-- Insert recipe instruction step
INSERT INTO instructions (recipe_id, step_number, instruction_text, created_at, updated_at)
VALUES (:recipe_id, :step_number, :instruction_text, NOW(), NOW());

-- Refetch saved recipe by id
SELECT r.*
FROM recipes r
LEFT JOIN users recipe_creators ON recipe_creators.id = r.created_by
WHERE r.id = :recipe_id;


/* ======================================================
	 RECIPES: COOK & AUTO-DEDUCT (RecipeController)
	 ====================================================== */

-- Start transaction
START TRANSACTION;

-- Find target recipe
SELECT r.*
FROM recipes r
LEFT JOIN users recipe_creators ON recipe_creators.id = r.created_by
WHERE r.id = :recipe_id;

-- Load and lock user inventory rows while cooking (MySQL lockForUpdate equivalent)
SELECT
	i.id,
	i.user_id,
	i.ingredient_id,
	i.quantity,
	i.expiry_date
FROM inventories i
INNER JOIN ingredients ing ON ing.id = i.ingredient_id
WHERE i.user_id = :user_id
FOR UPDATE;

-- Update inventory after deduction
UPDATE inventories
SET quantity = :new_quantity,
		updated_at = NOW()
WHERE id = :inventory_id
	AND user_id = :user_id;

-- Delete inventory row when quantity reaches zero
DELETE FROM inventories
WHERE id = :inventory_id
	AND user_id = :user_id;

-- Insert cooking log (only when table/columns exist)
INSERT INTO cooking_logs
	(user_id, recipe_id, people_count, scaling_factor, auto_deducted, cooked_at, created_at, updated_at)
VALUES
	(:user_id, :recipe_id, :people_count, :people_count, 1, NOW(), NOW(), NOW());

-- Commit transaction
COMMIT;


/* ======================================================
	 RUNTIME SCHEMA SAFETY QUERIES (RecipeController::ensureRecipeSchema)
	 ====================================================== */

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS recipe_type VARCHAR(20) NULL;
UPDATE recipes SET recipe_type = 'quick' WHERE recipe_type IS NULL;
ALTER TABLE recipes MODIFY COLUMN recipe_type VARCHAR(20) NOT NULL;

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS preparation_time VARCHAR(50) NULL;
UPDATE recipes SET preparation_time = '20 mins' WHERE preparation_time IS NULL;
ALTER TABLE recipes MODIFY COLUMN preparation_time VARCHAR(50) NOT NULL;

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS base_servings INT NOT NULL DEFAULT 1;

ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS item_name VARCHAR(150) NULL;
UPDATE recipe_ingredients ri
INNER JOIN ingredients i ON i.id = ri.ingredient_id
SET ri.item_name = i.name
WHERE ri.item_name IS NULL;
UPDATE recipe_ingredients SET item_name = 'Unknown item' WHERE item_name IS NULL;
ALTER TABLE recipe_ingredients MODIFY COLUMN item_name VARCHAR(150) NOT NULL;

ALTER TABLE recipe_ingredients ADD amount DECIMAL(10,2) NULL;
UPDATE recipe_ingredients
SET amount = COALESCE(required_quantity, 1.00)
WHERE amount IS NULL;
ALTER TABLE recipe_ingredients MODIFY COLUMN amount DECIMAL(10,2) NOT NULL;

ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS unit VARCHAR(30) NULL;
UPDATE recipe_ingredients SET unit = 'piece' WHERE unit IS NULL;
ALTER TABLE recipe_ingredients MODIFY COLUMN unit VARCHAR(30) NOT NULL;

