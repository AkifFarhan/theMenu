<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SeedRelease100Data extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('users') || !Schema::hasTable('ingredients') || !Schema::hasTable('recipes')) {
            return;
        }

        DB::transaction(function () {
            $this->seedUsers();
            $ingredientIds = $this->seedIngredients();
            $userIds = $this->getUserIdMap();
            $recipeIds = $this->seedRecipes($userIds);
            $this->seedInventories($userIds, $ingredientIds);
            $this->seedRecipeIngredients($recipeIds, $ingredientIds);
            $this->seedInstructions($recipeIds);
        });
    }

    private function seedUsers(): void
    {
        $users = [
            ['username' => 'alice_chef', 'email' => 'alice@example.com'],
            ['username' => 'bob_cook', 'email' => 'bob@example.com'],
            ['username' => 'charlie_foodie', 'email' => 'charlie@example.com'],
            ['username' => 'diana_baker', 'email' => 'diana@example.com'],
        ];

        foreach ($users as $user) {
            DB::table('users')->updateOrInsert(
                ['email' => $user['email']],
                [
                    'username' => $user['username'],
                    'password_hash' => '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }

    /**
     * @return array<string,int>
     */
    private function seedIngredients(): array
    {
        $ingredients = [
            ['name' => 'Chicken Breast', 'base_unit' => 'g'],
            ['name' => 'Ground Beef', 'base_unit' => 'g'],
            ['name' => 'Salmon Fillet', 'base_unit' => 'g'],
            ['name' => 'Eggs', 'base_unit' => 'piece'],
            ['name' => 'Tofu', 'base_unit' => 'g'],
            ['name' => 'Tomato', 'base_unit' => 'g'],
            ['name' => 'Onion', 'base_unit' => 'g'],
            ['name' => 'Garlic', 'base_unit' => 'g'],
            ['name' => 'Carrot', 'base_unit' => 'g'],
            ['name' => 'Bell Pepper', 'base_unit' => 'g'],
            ['name' => 'Spinach', 'base_unit' => 'g'],
            ['name' => 'Broccoli', 'base_unit' => 'g'],
            ['name' => 'Potato', 'base_unit' => 'g'],
            ['name' => 'Rice', 'base_unit' => 'g'],
            ['name' => 'Pasta', 'base_unit' => 'g'],
            ['name' => 'Flour', 'base_unit' => 'g'],
            ['name' => 'Bread', 'base_unit' => 'piece'],
            ['name' => 'Milk', 'base_unit' => 'ml'],
            ['name' => 'Butter', 'base_unit' => 'g'],
            ['name' => 'Cheese', 'base_unit' => 'g'],
            ['name' => 'Yogurt', 'base_unit' => 'ml'],
            ['name' => 'Olive Oil', 'base_unit' => 'ml'],
            ['name' => 'Salt', 'base_unit' => 'g'],
            ['name' => 'Black Pepper', 'base_unit' => 'g'],
            ['name' => 'Sugar', 'base_unit' => 'g'],
            ['name' => 'Soy Sauce', 'base_unit' => 'ml'],
            ['name' => 'Tomato Sauce', 'base_unit' => 'ml'],
            ['name' => 'Honey', 'base_unit' => 'ml'],
            ['name' => 'Basil', 'base_unit' => 'g'],
            ['name' => 'Oregano', 'base_unit' => 'g'],
            ['name' => 'Cumin', 'base_unit' => 'g'],
            ['name' => 'Paprika', 'base_unit' => 'g'],
        ];

        foreach ($ingredients as $ingredient) {
            DB::table('ingredients')->updateOrInsert(
                ['name' => $ingredient['name']],
                [
                    'base_unit' => $ingredient['base_unit'],
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        return DB::table('ingredients')->pluck('id', 'name')->map(function ($id) {
            return (int) $id;
        })->toArray();
    }

    /**
     * @return array<string,int>
     */
    private function getUserIdMap(): array
    {
        return DB::table('users')->pluck('id', 'email')->map(function ($id) {
            return (int) $id;
        })->toArray();
    }

    /**
     * @param array<string,int> $userIds
     * @return array<string,int>
     */
    private function seedRecipes(array $userIds): array
    {
        $recipes = [
            [
                'title' => 'Classic Spaghetti Carbonara',
                'recipe_type' => 'quick',
                'preparation_time' => '25 mins',
                'base_servings' => 1,
                'description' => 'Creamy Italian pasta with eggs and cheese',
                'created_by' => $userIds['alice@example.com'] ?? null,
            ],
            [
                'title' => 'Garlic Butter Chicken',
                'recipe_type' => 'quick',
                'preparation_time' => '30 mins',
                'base_servings' => 1,
                'description' => 'Pan-seared chicken with garlic butter sauce',
                'created_by' => $userIds['alice@example.com'] ?? null,
            ],
            [
                'title' => 'Fried Rice',
                'recipe_type' => 'quick',
                'preparation_time' => '20 mins',
                'base_servings' => 1,
                'description' => 'Asian-style fried rice with vegetables and eggs',
                'created_by' => $userIds['bob@example.com'] ?? null,
            ],
            [
                'title' => 'Tomato Basil Soup',
                'recipe_type' => 'healthy',
                'preparation_time' => '35 mins',
                'base_servings' => 1,
                'description' => 'Simple and comforting tomato soup',
                'created_by' => null,
            ],
            [
                'title' => 'Grilled Salmon with Veggies',
                'recipe_type' => 'healthy',
                'preparation_time' => '35 mins',
                'base_servings' => 1,
                'description' => 'Healthy grilled salmon with roasted vegetables',
                'created_by' => $userIds['charlie@example.com'] ?? null,
            ],
            [
                'title' => 'Beef Tacos',
                'recipe_type' => 'surprise',
                'preparation_time' => '30 mins',
                'base_servings' => 1,
                'description' => 'Mexican-style ground beef tacos',
                'created_by' => null,
            ],
            [
                'title' => 'Veggie Stir Fry',
                'recipe_type' => 'quick',
                'preparation_time' => '20 mins',
                'base_servings' => 1,
                'description' => 'Quick vegetable stir fry with tofu',
                'created_by' => $userIds['diana@example.com'] ?? null,
            ],
        ];

        foreach ($recipes as $recipe) {
            DB::table('recipes')->updateOrInsert(
                ['title' => $recipe['title']],
                array_merge($recipe, [
                    'updated_at' => now(),
                    'created_at' => now(),
                ])
            );
        }

        return DB::table('recipes')->pluck('id', 'title')->map(function ($id) {
            return (int) $id;
        })->toArray();
    }

    /**
     * @param array<string,int> $userIds
     * @param array<string,int> $ingredientIds
     */
    private function seedInventories(array $userIds, array $ingredientIds): void
    {
        $entries = [
            ['email' => 'alice@example.com', 'ingredient' => 'Chicken Breast', 'quantity' => 500, 'expiry_date' => '2026-03-15'],
            ['email' => 'alice@example.com', 'ingredient' => 'Tomato', 'quantity' => 300, 'expiry_date' => '2026-03-10'],
            ['email' => 'alice@example.com', 'ingredient' => 'Onion', 'quantity' => 200, 'expiry_date' => '2026-03-20'],
            ['email' => 'alice@example.com', 'ingredient' => 'Garlic', 'quantity' => 100, 'expiry_date' => '2026-03-25'],
            ['email' => 'alice@example.com', 'ingredient' => 'Rice', 'quantity' => 1000, 'expiry_date' => '2027-01-01'],
            ['email' => 'alice@example.com', 'ingredient' => 'Pasta', 'quantity' => 500, 'expiry_date' => '2027-02-01'],
            ['email' => 'alice@example.com', 'ingredient' => 'Olive Oil', 'quantity' => 500, 'expiry_date' => '2026-05-01'],
            ['email' => 'alice@example.com', 'ingredient' => 'Salt', 'quantity' => 200, 'expiry_date' => null],
            ['email' => 'alice@example.com', 'ingredient' => 'Black Pepper', 'quantity' => 100, 'expiry_date' => null],
            ['email' => 'alice@example.com', 'ingredient' => 'Butter', 'quantity' => 100, 'expiry_date' => '2026-03-05'],
            ['email' => 'alice@example.com', 'ingredient' => 'Cheese', 'quantity' => 200, 'expiry_date' => '2026-03-08'],
            ['email' => 'bob@example.com', 'ingredient' => 'Ground Beef', 'quantity' => 800, 'expiry_date' => '2026-03-12'],
            ['email' => 'bob@example.com', 'ingredient' => 'Eggs', 'quantity' => 12, 'expiry_date' => '2026-03-18'],
            ['email' => 'bob@example.com', 'ingredient' => 'Tomato', 'quantity' => 400, 'expiry_date' => '2026-03-08'],
            ['email' => 'bob@example.com', 'ingredient' => 'Onion', 'quantity' => 150, 'expiry_date' => '2026-03-15'],
            ['email' => 'bob@example.com', 'ingredient' => 'Rice', 'quantity' => 2000, 'expiry_date' => '2027-06-01'],
            ['email' => 'bob@example.com', 'ingredient' => 'Flour', 'quantity' => 1000, 'expiry_date' => '2027-03-01'],
            ['email' => 'bob@example.com', 'ingredient' => 'Milk', 'quantity' => 1000, 'expiry_date' => '2026-03-30'],
            ['email' => 'bob@example.com', 'ingredient' => 'Sugar', 'quantity' => 300, 'expiry_date' => '2027-01-01'],
            ['email' => 'bob@example.com', 'ingredient' => 'Olive Oil', 'quantity' => 300, 'expiry_date' => '2026-04-15'],
            ['email' => 'charlie@example.com', 'ingredient' => 'Salmon Fillet', 'quantity' => 600, 'expiry_date' => '2026-03-10'],
            ['email' => 'charlie@example.com', 'ingredient' => 'Spinach', 'quantity' => 300, 'expiry_date' => '2026-03-05'],
            ['email' => 'charlie@example.com', 'ingredient' => 'Broccoli', 'quantity' => 250, 'expiry_date' => '2026-03-07'],
            ['email' => 'charlie@example.com', 'ingredient' => 'Carrot', 'quantity' => 400, 'expiry_date' => '2026-03-20'],
            ['email' => 'charlie@example.com', 'ingredient' => 'Olive Oil', 'quantity' => 400, 'expiry_date' => '2026-06-01'],
            ['email' => 'charlie@example.com', 'ingredient' => 'Salt', 'quantity' => 150, 'expiry_date' => null],
            ['email' => 'charlie@example.com', 'ingredient' => 'Rice', 'quantity' => 800, 'expiry_date' => '2027-02-01'],
            ['email' => 'charlie@example.com', 'ingredient' => 'Soy Sauce', 'quantity' => 200, 'expiry_date' => '2026-05-01'],
        ];

        foreach ($entries as $entry) {
            $userId = $userIds[$entry['email']] ?? null;
            $ingredientId = $ingredientIds[$entry['ingredient']] ?? null;

            if (!$userId || !$ingredientId) {
                continue;
            }

            DB::table('inventories')->updateOrInsert(
                ['user_id' => $userId, 'ingredient_id' => $ingredientId],
                [
                    'quantity' => $entry['quantity'],
                    'expiry_date' => $entry['expiry_date'],
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }

    /**
     * @param array<string,int> $recipeIds
     * @param array<string,int> $ingredientIds
     */
    private function seedRecipeIngredients(array $recipeIds, array $ingredientIds): void
    {
        $items = [
            ['recipe' => 'Classic Spaghetti Carbonara', 'ingredient' => 'Pasta', 'item_name' => 'Pasta', 'amount' => 400, 'unit' => 'g'],
            ['recipe' => 'Classic Spaghetti Carbonara', 'ingredient' => 'Eggs', 'item_name' => 'Eggs', 'amount' => 4, 'unit' => 'piece'],
            ['recipe' => 'Classic Spaghetti Carbonara', 'ingredient' => 'Cheese', 'item_name' => 'Cheese', 'amount' => 100, 'unit' => 'g'],
            ['recipe' => 'Classic Spaghetti Carbonara', 'ingredient' => 'Garlic', 'item_name' => 'Garlic', 'amount' => 10, 'unit' => 'g'],
            ['recipe' => 'Classic Spaghetti Carbonara', 'ingredient' => 'Black Pepper', 'item_name' => 'Black Pepper', 'amount' => 5, 'unit' => 'g'],
            ['recipe' => 'Classic Spaghetti Carbonara', 'ingredient' => 'Salt', 'item_name' => 'Salt', 'amount' => 5, 'unit' => 'g'],
            ['recipe' => 'Garlic Butter Chicken', 'ingredient' => 'Chicken Breast', 'item_name' => 'Chicken Breast', 'amount' => 500, 'unit' => 'g'],
            ['recipe' => 'Garlic Butter Chicken', 'ingredient' => 'Butter', 'item_name' => 'Butter', 'amount' => 50, 'unit' => 'g'],
            ['recipe' => 'Garlic Butter Chicken', 'ingredient' => 'Garlic', 'item_name' => 'Garlic', 'amount' => 20, 'unit' => 'g'],
            ['recipe' => 'Garlic Butter Chicken', 'ingredient' => 'Salt', 'item_name' => 'Salt', 'amount' => 5, 'unit' => 'g'],
            ['recipe' => 'Garlic Butter Chicken', 'ingredient' => 'Black Pepper', 'item_name' => 'Black Pepper', 'amount' => 3, 'unit' => 'g'],
            ['recipe' => 'Garlic Butter Chicken', 'ingredient' => 'Olive Oil', 'item_name' => 'Olive Oil', 'amount' => 20, 'unit' => 'ml'],
            ['recipe' => 'Fried Rice', 'ingredient' => 'Rice', 'item_name' => 'Rice', 'amount' => 300, 'unit' => 'g'],
            ['recipe' => 'Fried Rice', 'ingredient' => 'Eggs', 'item_name' => 'Eggs', 'amount' => 2, 'unit' => 'piece'],
            ['recipe' => 'Fried Rice', 'ingredient' => 'Onion', 'item_name' => 'Onion', 'amount' => 50, 'unit' => 'g'],
            ['recipe' => 'Fried Rice', 'ingredient' => 'Garlic', 'item_name' => 'Garlic', 'amount' => 10, 'unit' => 'g'],
            ['recipe' => 'Fried Rice', 'ingredient' => 'Carrot', 'item_name' => 'Carrot', 'amount' => 50, 'unit' => 'g'],
            ['recipe' => 'Fried Rice', 'ingredient' => 'Soy Sauce', 'item_name' => 'Soy Sauce', 'amount' => 30, 'unit' => 'ml'],
            ['recipe' => 'Fried Rice', 'ingredient' => 'Olive Oil', 'item_name' => 'Olive Oil', 'amount' => 30, 'unit' => 'ml'],
            ['recipe' => 'Tomato Basil Soup', 'ingredient' => 'Tomato', 'item_name' => 'Tomato', 'amount' => 800, 'unit' => 'g'],
            ['recipe' => 'Tomato Basil Soup', 'ingredient' => 'Onion', 'item_name' => 'Onion', 'amount' => 100, 'unit' => 'g'],
            ['recipe' => 'Tomato Basil Soup', 'ingredient' => 'Garlic', 'item_name' => 'Garlic', 'amount' => 15, 'unit' => 'g'],
            ['recipe' => 'Tomato Basil Soup', 'ingredient' => 'Basil', 'item_name' => 'Basil', 'amount' => 10, 'unit' => 'g'],
            ['recipe' => 'Tomato Basil Soup', 'ingredient' => 'Olive Oil', 'item_name' => 'Olive Oil', 'amount' => 40, 'unit' => 'ml'],
            ['recipe' => 'Tomato Basil Soup', 'ingredient' => 'Salt', 'item_name' => 'Salt', 'amount' => 8, 'unit' => 'g'],
            ['recipe' => 'Tomato Basil Soup', 'ingredient' => 'Black Pepper', 'item_name' => 'Black Pepper', 'amount' => 3, 'unit' => 'g'],
            ['recipe' => 'Grilled Salmon with Veggies', 'ingredient' => 'Salmon Fillet', 'item_name' => 'Salmon Fillet', 'amount' => 400, 'unit' => 'g'],
            ['recipe' => 'Grilled Salmon with Veggies', 'ingredient' => 'Broccoli', 'item_name' => 'Broccoli', 'amount' => 200, 'unit' => 'g'],
            ['recipe' => 'Grilled Salmon with Veggies', 'ingredient' => 'Carrot', 'item_name' => 'Carrot', 'amount' => 150, 'unit' => 'g'],
            ['recipe' => 'Grilled Salmon with Veggies', 'ingredient' => 'Olive Oil', 'item_name' => 'Olive Oil', 'amount' => 30, 'unit' => 'ml'],
            ['recipe' => 'Grilled Salmon with Veggies', 'ingredient' => 'Salt', 'item_name' => 'Salt', 'amount' => 5, 'unit' => 'g'],
            ['recipe' => 'Grilled Salmon with Veggies', 'ingredient' => 'Black Pepper', 'item_name' => 'Black Pepper', 'amount' => 3, 'unit' => 'g'],
            ['recipe' => 'Beef Tacos', 'ingredient' => 'Ground Beef', 'item_name' => 'Ground Beef', 'amount' => 500, 'unit' => 'g'],
            ['recipe' => 'Beef Tacos', 'ingredient' => 'Onion', 'item_name' => 'Onion', 'amount' => 100, 'unit' => 'g'],
            ['recipe' => 'Beef Tacos', 'ingredient' => 'Tomato', 'item_name' => 'Tomato', 'amount' => 200, 'unit' => 'g'],
            ['recipe' => 'Beef Tacos', 'ingredient' => 'Garlic', 'item_name' => 'Garlic', 'amount' => 10, 'unit' => 'g'],
            ['recipe' => 'Beef Tacos', 'ingredient' => 'Cumin', 'item_name' => 'Cumin', 'amount' => 10, 'unit' => 'g'],
            ['recipe' => 'Beef Tacos', 'ingredient' => 'Paprika', 'item_name' => 'Paprika', 'amount' => 8, 'unit' => 'g'],
            ['recipe' => 'Veggie Stir Fry', 'ingredient' => 'Tofu', 'item_name' => 'Tofu', 'amount' => 300, 'unit' => 'g'],
            ['recipe' => 'Veggie Stir Fry', 'ingredient' => 'Bell Pepper', 'item_name' => 'Bell Pepper', 'amount' => 150, 'unit' => 'g'],
            ['recipe' => 'Veggie Stir Fry', 'ingredient' => 'Broccoli', 'item_name' => 'Broccoli', 'amount' => 150, 'unit' => 'g'],
            ['recipe' => 'Veggie Stir Fry', 'ingredient' => 'Carrot', 'item_name' => 'Carrot', 'amount' => 100, 'unit' => 'g'],
            ['recipe' => 'Veggie Stir Fry', 'ingredient' => 'Garlic', 'item_name' => 'Garlic', 'amount' => 15, 'unit' => 'g'],
            ['recipe' => 'Veggie Stir Fry', 'ingredient' => 'Soy Sauce', 'item_name' => 'Soy Sauce', 'amount' => 40, 'unit' => 'ml'],
            ['recipe' => 'Veggie Stir Fry', 'ingredient' => 'Olive Oil', 'item_name' => 'Olive Oil', 'amount' => 30, 'unit' => 'ml'],
        ];

        foreach ($items as $item) {
            $recipeId = $recipeIds[$item['recipe']] ?? null;
            $ingredientId = $ingredientIds[$item['ingredient']] ?? null;

            if (!$recipeId || !$ingredientId) {
                continue;
            }

            DB::table('recipe_ingredients')->updateOrInsert(
                [
                    'recipe_id' => $recipeId,
                    'ingredient_id' => $ingredientId,
                    'item_name' => $item['item_name'],
                ],
                [
                    'amount' => $item['amount'],
                    'unit' => $item['unit'],
                    'required_quantity' => $item['amount'],
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }

    /**
     * @param array<string,int> $recipeIds
     */
    private function seedInstructions(array $recipeIds): void
    {
        if (!Schema::hasTable('instructions')) {
            return;
        }

        $instructionMap = [
            'Classic Spaghetti Carbonara' => [
                'Boil pasta in salted water until al dente.',
                'Saute garlic, then toss with pasta and beaten eggs off heat.',
                'Mix in cheese, season with black pepper, and serve immediately.',
            ],
            'Garlic Butter Chicken' => [
                'Season chicken and sear in olive oil until golden.',
                'Add butter and garlic, then baste until chicken is cooked.',
                'Rest briefly and serve with pan sauce.',
            ],
            'Fried Rice' => [
                'Heat oil and scramble eggs, then set aside.',
                'Saute onion, garlic, and carrot until fragrant.',
                'Add rice, soy sauce, and eggs; stir fry until hot.',
            ],
            'Tomato Basil Soup' => [
                'Saute onion and garlic in olive oil.',
                'Add tomato and simmer until soft.',
                'Blend smooth, add basil, then season with salt and pepper.',
            ],
            'Grilled Salmon with Veggies' => [
                'Season salmon and vegetables with oil, salt, and pepper.',
                'Grill salmon and roast vegetables until tender.',
                'Plate together and serve warm.',
            ],
            'Beef Tacos' => [
                'Brown beef with onion and garlic.',
                'Add tomato, cumin, and paprika; simmer briefly.',
                'Serve in taco shells with desired toppings.',
            ],
            'Veggie Stir Fry' => [
                'Saute garlic in oil, then add tofu and cook lightly.',
                'Add vegetables and stir fry until crisp-tender.',
                'Finish with soy sauce and serve hot.',
            ],
        ];

        foreach ($instructionMap as $title => $steps) {
            $recipeId = $recipeIds[$title] ?? null;
            if (!$recipeId) {
                continue;
            }

            foreach ($steps as $index => $step) {
                DB::table('instructions')->updateOrInsert(
                    [
                        'recipe_id' => $recipeId,
                        'step_number' => $index + 1,
                    ],
                    [
                        'instruction_text' => $step,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            }
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Keep seeded data on rollback.
    }
}
