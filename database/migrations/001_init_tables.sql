-- ==========================================
-- DATABASE: Smart Inventory Recipe System
-- MSSQL VERSION
-- ==========================================

USE themenu;

-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE users (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME2 NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NULL DEFAULT GETDATE()
);

-- ==========================================
-- INGREDIENTS
-- ==========================================
CREATE TABLE ingredients (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    base_unit VARCHAR(10) NOT NULL CHECK (base_unit IN ('g', 'ml', 'piece')),
    created_at DATETIME2 NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NULL DEFAULT GETDATE()
);

CREATE INDEX idx_ingredient_name ON ingredients(name);

-- ==========================================
-- USER INVENTORY
-- ==========================================
CREATE TABLE inventories (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    ingredient_id BIGINT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    expiry_date DATE NULL,
    created_at DATETIME2 NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NULL DEFAULT GETDATE(),

    CONSTRAINT fk_inventory_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_inventory_ingredient
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_user_ingredient UNIQUE (user_id, ingredient_id)
);

CREATE INDEX idx_inventory_user ON inventories(user_id);
CREATE INDEX idx_inventory_ingredient ON inventories(ingredient_id);

-- ==========================================
-- RECIPES
-- ==========================================
CREATE TABLE recipes (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    is_ai_generated BIT DEFAULT 1,
    created_by BIGINT NULL,
    created_at DATETIME2 NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NULL DEFAULT GETDATE(),

    CONSTRAINT fk_recipe_user
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_recipe_title ON recipes(title);

-- ==========================================
-- RECIPE INGREDIENTS
-- ==========================================
CREATE TABLE recipe_ingredients (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    recipe_id BIGINT NOT NULL,
    ingredient_id BIGINT NOT NULL,
    required_quantity DECIMAL(10,2) NOT NULL,
    created_at DATETIME2 NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NULL DEFAULT GETDATE(),

    CONSTRAINT fk_recipeingredient_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_recipeingredient_ingredient
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id),

    CONSTRAINT unique_recipe_ingredient UNIQUE (recipe_id, ingredient_id)
);

CREATE INDEX idx_recipeingredient_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipeingredient_ingredient ON recipe_ingredients(ingredient_id);

-- ==========================================
-- INSTRUCTIONS
-- ==========================================
CREATE TABLE instructions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    recipe_id BIGINT NOT NULL,
    step_number INT NOT NULL,
    instruction_text TEXT NOT NULL,
    created_at DATETIME2 NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NULL DEFAULT GETDATE(),

    CONSTRAINT fk_instruction_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_instruction_recipe ON instructions(recipe_id);

-- ==========================================
-- COOKING LOGS
-- ==========================================
CREATE TABLE cooking_logs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    recipe_id BIGINT NOT NULL,
    scaling_factor DECIMAL(5,2) DEFAULT 1.00,
    auto_deducted BIT DEFAULT 0,
    cooked_at DATETIME2 DEFAULT GETDATE(),

    CONSTRAINT fk_cooking_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_cooking_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);