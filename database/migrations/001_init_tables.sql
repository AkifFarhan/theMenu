-- ==========================================
-- DATABASE: Smart Inventory Recipe System (MySQL)
-- ==========================================

USE themenu;

-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- SANCTUM TOKENS
-- ==========================================
CREATE TABLE personal_access_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tokenable_type VARCHAR(255) NOT NULL,
    tokenable_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    abilities TEXT NULL,
    last_used_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_pat_tokenable ON personal_access_tokens(tokenable_type, tokenable_id);

-- ==========================================
-- INGREDIENTS (GLOBAL NORMALIZED LIST)
-- ==========================================
CREATE TABLE ingredients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    base_unit VARCHAR(10) NOT NULL,
    CONSTRAINT chk_base_unit CHECK (base_unit IN ('g', 'ml', 'piece')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_ingredient_name ON ingredients(name);

-- ==========================================
-- USER INVENTORY
-- ==========================================
CREATE TABLE inventories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    ingredient_id BIGINT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    expiry_date DATE NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_inventory_ingredient
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_user_ingredient UNIQUE (user_id, ingredient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_inventory_user ON inventories(user_id);
CREATE INDEX idx_inventory_ingredient ON inventories(ingredient_id);

-- ==========================================
-- RECIPES
-- ==========================================
CREATE TABLE recipes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipe_type VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    preparation_time VARCHAR(50) NOT NULL,
    base_servings INT NOT NULL DEFAULT 1,
    description TEXT NULL,
    is_ai_generated TINYINT(1) DEFAULT 1,
    created_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_recipe_type CHECK (recipe_type IN ('quick', 'healthy', 'surprise')),
    CONSTRAINT chk_base_servings CHECK (base_servings = 1),

    CONSTRAINT fk_recipe_user
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_recipe_title ON recipes(title);

-- ==========================================
-- RECIPE INGREDIENTS (PIVOT TABLE)
-- ==========================================
CREATE TABLE recipe_ingredients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipe_id BIGINT NOT NULL,
    ingredient_id BIGINT NULL,
    item_name VARCHAR(150) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    required_quantity DECIMAL(10,2) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_recipeingredient_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_recipeingredient_ingredient
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_recipeingredient_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_recipeingredient_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipeingredient_ingredient ON recipe_ingredients(ingredient_id);
CREATE INDEX idx_recipeingredient_item_name ON recipe_ingredients(item_name);

-- ==========================================
-- INSTRUCTIONS
-- ==========================================
CREATE TABLE instructions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipe_id BIGINT NOT NULL,
    step_number INT NOT NULL,
    instruction_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_instruction_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_instruction_recipe ON instructions(recipe_id);

-- ==========================================
-- OPTIONAL: COOKING HISTORY (For Auto Deduction Tracking)
-- ==========================================
CREATE TABLE cooking_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    recipe_id BIGINT NOT NULL,
    people_count INT NOT NULL DEFAULT 1,
    scaling_factor DECIMAL(5,2) DEFAULT 1.00,
    auto_deducted TINYINT(1) DEFAULT 0,
    cooked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_people_count CHECK (people_count >= 1),

    CONSTRAINT fk_cooking_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_cooking_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;