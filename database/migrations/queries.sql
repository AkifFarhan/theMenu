/*
	theMenu - Consolidated SQL queries used by the active web app API
	Source: server/app/Http/Controllers and related model operations
	Notes:
	- Queries are written as SQL Server style templates with named parameters.
	- Eloquent may emit equivalent SQL with different aliases or formatting.
*/

/* ======================================================
	 AUTHENTICATION (AuthController)
	 ====================================================== */

-- Register user
INSERT INTO users (username, email, password_hash, created_at, updated_at)
VALUES (:username, :email, :password_hash, GETDATE(), GETDATE());

-- Find user by email for login
SELECT TOP 1 id, username, email, password_hash, created_at, updated_at
FROM users
WHERE email = :email;

-- Insert Sanctum access token (created by createToken)
INSERT INTO personal_access_tokens
	(tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at)
VALUES
	('App\\Models\\User', :user_id, 'auth_token', :hashed_token, '["*"]', NULL, NULL, GETDATE(), GETDATE());

-- Logout: delete current token
DELETE FROM personal_access_tokens
WHERE id = :current_token_id
	AND tokenable_id = :user_id
	AND tokenable_type = 'App\\Models\\User';

-- Get current authenticated user
SELECT TOP 1 id, username, email, created_at, updated_at
FROM users
WHERE id = :user_id;


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
SELECT TOP 1 id, user_id, ingredient_id, quantity, expiry_date
FROM inventories
WHERE user_id = :user_id
	AND ingredient_id = :ingredient_id;

-- Update existing inventory item quantity (bulk add)
UPDATE inventories
SET quantity = quantity + :quantity_to_add,
		expiry_date = COALESCE(:expiry_date, expiry_date),
		updated_at = GETDATE()
WHERE id = :inventory_id
	AND user_id = :user_id;

-- Insert new inventory item (bulk add)
INSERT INTO inventories (user_id, ingredient_id, quantity, expiry_date, created_at, updated_at)
VALUES (:user_id, :ingredient_id, :quantity, :expiry_date, GETDATE(), GETDATE());

-- Find inventory item for delete
SELECT TOP 1 id, user_id, ingredient_id, quantity, expiry_date
FROM inventories
WHERE user_id = :user_id
	AND id = :inventory_id;

-- Delete inventory item
DELETE FROM inventories
WHERE id = :inventory_id
	AND user_id = :user_id;

-- Find inventory item for update
SELECT TOP 1 id, user_id, ingredient_id, quantity, expiry_date
FROM inventories
WHERE user_id = :user_id
	AND id = :inventory_id;

-- Update inventory item
UPDATE inventories
SET quantity = COALESCE(:quantity, quantity),
		expiry_date = COALESCE(:expiry_date, expiry_date),
		updated_at = GETDATE()
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
	(:recipe_type, :title, :description, :preparation_time, 1, 1, :created_by, GETDATE(), GETDATE());

-- Find ingredient by case-insensitive name
SELECT TOP 1 id, name, base_unit
FROM ingredients
WHERE LOWER(name) = LOWER(:ingredient_name);

-- Insert missing ingredient
INSERT INTO ingredients (name, base_unit, created_at, updated_at)
VALUES (:ingredient_name, :base_unit, GETDATE(), GETDATE());

-- Insert recipe ingredient
INSERT INTO recipe_ingredients
	(recipe_id, ingredient_id, item_name, amount, unit, required_quantity, created_at, updated_at)
VALUES
	(:recipe_id, :ingredient_id, :item_name, :amount, :unit, :required_quantity, GETDATE(), GETDATE());

-- Insert recipe instruction step
INSERT INTO instructions (recipe_id, step_number, instruction_text, created_at, updated_at)
VALUES (:recipe_id, :step_number, :instruction_text, GETDATE(), GETDATE());

-- Refetch saved recipe by id
SELECT r.*
FROM recipes r
LEFT JOIN users recipe_creators ON recipe_creators.id = r.created_by
WHERE r.id = :recipe_id;


/* ======================================================
	 RECIPES: COOK & AUTO-DEDUCT (RecipeController)
	 ====================================================== */

-- Start transaction
BEGIN TRANSACTION;

-- Find target recipe
SELECT r.*
FROM recipes r
LEFT JOIN users recipe_creators ON recipe_creators.id = r.created_by
WHERE r.id = :recipe_id;

-- Load and lock user inventory rows while cooking (UPDLOCK/HOLDLOCK equivalent to lockForUpdate)
SELECT
	i.id,
	i.user_id,
	i.ingredient_id,
	i.quantity,
	i.expiry_date
FROM inventories i WITH (UPDLOCK, HOLDLOCK)
INNER JOIN ingredients ing ON ing.id = i.ingredient_id
WHERE i.user_id = :user_id;

-- Update inventory after deduction
UPDATE inventories
SET quantity = :new_quantity,
		updated_at = GETDATE()
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
	(:user_id, :recipe_id, :people_count, :people_count, 1, GETDATE(), GETDATE(), GETDATE());

-- Commit transaction
COMMIT TRANSACTION;


/* ======================================================
	 RUNTIME SCHEMA SAFETY QUERIES (RecipeController::ensureRecipeSchema)
	 ====================================================== */

ALTER TABLE recipes ADD recipe_type NVARCHAR(20) NULL;
UPDATE recipes SET recipe_type = 'quick' WHERE recipe_type IS NULL;

ALTER TABLE recipes ADD preparation_time NVARCHAR(50) NULL;
UPDATE recipes SET preparation_time = '20 mins' WHERE preparation_time IS NULL;

ALTER TABLE recipes ADD base_servings INT NOT NULL
	CONSTRAINT df_recipes_base_servings_runtime DEFAULT 1;

ALTER TABLE recipe_ingredients ADD item_name NVARCHAR(150) NULL;
UPDATE ri
SET ri.item_name = i.name
FROM recipe_ingredients ri
INNER JOIN ingredients i ON i.id = ri.ingredient_id
WHERE ri.item_name IS NULL;
UPDATE recipe_ingredients SET item_name = 'Unknown item' WHERE item_name IS NULL;

ALTER TABLE recipe_ingredients ADD amount DECIMAL(10,2) NULL;
UPDATE recipe_ingredients
SET amount = COALESCE(required_quantity, 1.00)
WHERE amount IS NULL;

ALTER TABLE recipe_ingredients ADD unit NVARCHAR(30) NULL;
UPDATE recipe_ingredients SET unit = 'piece' WHERE unit IS NULL;

