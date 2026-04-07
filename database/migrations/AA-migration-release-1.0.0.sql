-- ==========================================
-- RELEASE 1.0.0: NORMALIZED AI RECIPE SCHEMA
-- SQL Server compatible, idempotent upgrade script
-- ==========================================

USE [themenu];

-- RECIPES TABLE UPDATES
IF OBJECT_ID('recipes', 'U') IS NOT NULL
BEGIN
	IF COL_LENGTH('recipes', 'recipe_type') IS NULL
	BEGIN
		ALTER TABLE recipes ADD recipe_type NVARCHAR(20) NULL;
		UPDATE recipes SET recipe_type = 'quick' WHERE recipe_type IS NULL;
		ALTER TABLE recipes ALTER COLUMN recipe_type NVARCHAR(20) NOT NULL;
	END

	IF COL_LENGTH('recipes', 'preparation_time') IS NULL
	BEGIN
		ALTER TABLE recipes ADD preparation_time NVARCHAR(50) NULL;
		UPDATE recipes SET preparation_time = '20 mins' WHERE preparation_time IS NULL;
		ALTER TABLE recipes ALTER COLUMN preparation_time NVARCHAR(50) NOT NULL;
	END

	IF COL_LENGTH('recipes', 'base_servings') IS NULL
	BEGIN
		ALTER TABLE recipes ADD base_servings INT NOT NULL CONSTRAINT df_recipes_base_servings DEFAULT 1;
	END

	IF NOT EXISTS (
		SELECT 1
		FROM sys.check_constraints
		WHERE name = 'chk_recipe_type'
	)
	BEGIN
		ALTER TABLE recipes ADD CONSTRAINT chk_recipe_type CHECK (recipe_type IN ('quick', 'healthy', 'surprise'));
	END

	IF NOT EXISTS (
		SELECT 1
		FROM sys.check_constraints
		WHERE name = 'chk_base_servings'
	)
	BEGIN
		ALTER TABLE recipes ADD CONSTRAINT chk_base_servings CHECK (base_servings = 1);
	END
END;

-- RECIPE_INGREDIENTS TABLE UPDATES
IF OBJECT_ID('recipe_ingredients', 'U') IS NOT NULL
BEGIN
	IF COL_LENGTH('recipe_ingredients', 'item_name') IS NULL
	BEGIN
		ALTER TABLE recipe_ingredients ADD item_name NVARCHAR(150) NULL;
		UPDATE ri
		SET ri.item_name = i.name
		FROM recipe_ingredients ri
		INNER JOIN ingredients i ON i.id = ri.ingredient_id
		WHERE ri.item_name IS NULL;

		UPDATE recipe_ingredients
		SET item_name = 'unknown'
		WHERE item_name IS NULL;

		ALTER TABLE recipe_ingredients ALTER COLUMN item_name NVARCHAR(150) NOT NULL;
	END

	IF COL_LENGTH('recipe_ingredients', 'amount') IS NULL
	BEGIN
		ALTER TABLE recipe_ingredients ADD amount DECIMAL(10,2) NULL;
		UPDATE recipe_ingredients
		SET amount = COALESCE(required_quantity, 1.00)
		WHERE amount IS NULL;
		ALTER TABLE recipe_ingredients ALTER COLUMN amount DECIMAL(10,2) NOT NULL;
	END

	IF COL_LENGTH('recipe_ingredients', 'unit') IS NULL
	BEGIN
		ALTER TABLE recipe_ingredients ADD unit NVARCHAR(30) NULL;
		UPDATE recipe_ingredients
		SET unit = 'piece'
		WHERE unit IS NULL;
		ALTER TABLE recipe_ingredients ALTER COLUMN unit NVARCHAR(30) NOT NULL;
	END

	IF COL_LENGTH('recipe_ingredients', 'required_quantity') IS NULL
	BEGIN
		ALTER TABLE recipe_ingredients ADD required_quantity DECIMAL(10,2) NULL;
		UPDATE recipe_ingredients
		SET required_quantity = amount
		WHERE required_quantity IS NULL;
	END

	IF EXISTS (
		SELECT 1
		FROM sys.columns
		WHERE object_id = OBJECT_ID('recipe_ingredients')
			AND name = 'ingredient_id'
			AND is_nullable = 0
	)
	BEGIN
		ALTER TABLE recipe_ingredients ALTER COLUMN ingredient_id BIGINT NULL;
	END

	IF NOT EXISTS (
		SELECT 1
		FROM sys.check_constraints
		WHERE name = 'chk_recipeingredient_amount'
	)
	BEGIN
		ALTER TABLE recipe_ingredients ADD CONSTRAINT chk_recipeingredient_amount CHECK (amount > 0);
	END

	IF NOT EXISTS (
		SELECT 1
		FROM sys.indexes
		WHERE name = 'idx_recipeingredient_item_name'
			AND object_id = OBJECT_ID('recipe_ingredients')
	)
	BEGIN
		CREATE INDEX idx_recipeingredient_item_name ON recipe_ingredients(item_name);
	END
END;

-- COOKING LOGS TABLE UPDATES
IF OBJECT_ID('cooking_logs', 'U') IS NOT NULL
BEGIN
	IF COL_LENGTH('cooking_logs', 'people_count') IS NULL
	BEGIN
		ALTER TABLE cooking_logs ADD people_count INT NOT NULL CONSTRAINT df_cooking_logs_people_count DEFAULT 1;
	END

	IF NOT EXISTS (
		SELECT 1
		FROM sys.check_constraints
		WHERE name = 'chk_people_count'
	)
	BEGIN
		ALTER TABLE cooking_logs ADD CONSTRAINT chk_people_count CHECK (people_count >= 1);
	END
END;
