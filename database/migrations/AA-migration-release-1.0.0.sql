-- ==========================================
-- RELEASE 1.0.0: NORMALIZED AI RECIPE SCHEMA
-- MySQL compatible upgrade script
-- ==========================================

USE themenu;

-- RECIPES TABLE UPDATES
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS recipe_type VARCHAR(20) NULL;
UPDATE recipes SET recipe_type = 'quick' WHERE recipe_type IS NULL;
ALTER TABLE recipes MODIFY COLUMN recipe_type VARCHAR(20) NOT NULL;

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS preparation_time VARCHAR(50) NULL;
UPDATE recipes SET preparation_time = '20 mins' WHERE preparation_time IS NULL;
ALTER TABLE recipes MODIFY COLUMN preparation_time VARCHAR(50) NOT NULL;

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS base_servings INT NOT NULL DEFAULT 1;

-- RECIPE_INGREDIENTS TABLE UPDATES
ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS item_name VARCHAR(150) NULL;
UPDATE recipe_ingredients ri
INNER JOIN ingredients i ON i.id = ri.ingredient_id
SET ri.item_name = i.name
WHERE ri.item_name IS NULL;
UPDATE recipe_ingredients SET item_name = 'unknown' WHERE item_name IS NULL;
ALTER TABLE recipe_ingredients MODIFY COLUMN item_name VARCHAR(150) NOT NULL;

ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2) NULL;
UPDATE recipe_ingredients
SET amount = COALESCE(required_quantity, 1.00)
WHERE amount IS NULL;
ALTER TABLE recipe_ingredients MODIFY COLUMN amount DECIMAL(10,2) NOT NULL;

ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS unit VARCHAR(30) NULL;
UPDATE recipe_ingredients
SET unit = 'piece'
WHERE unit IS NULL;
ALTER TABLE recipe_ingredients MODIFY COLUMN unit VARCHAR(30) NOT NULL;

ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS required_quantity DECIMAL(10,2) NULL;
UPDATE recipe_ingredients
SET required_quantity = amount
WHERE required_quantity IS NULL;

ALTER TABLE recipe_ingredients MODIFY COLUMN ingredient_id BIGINT NULL;

-- COOKING LOGS TABLE UPDATES
ALTER TABLE cooking_logs ADD COLUMN IF NOT EXISTS people_count INT NOT NULL DEFAULT 1;
