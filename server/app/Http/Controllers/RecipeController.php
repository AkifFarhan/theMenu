<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\Instruction;
use App\Models\Inventory;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class RecipeController extends Controller
{
    private array $staples = ['salt', 'water', 'oil'];

    private ?array $columnCache = null;

    public function getMatchingRecipes()
    {
        try {
            $user = Auth::user();
            $this->ensureRecipeSchema();

            $inventoryNames = Inventory::where('user_id', $user->id)
                ->with('ingredient:id,name')
                ->get()
                ->map(fn ($item) => strtolower(trim((string) $item->ingredient?->name)))
                ->filter(fn ($name) => $name !== '')
                ->unique()
                ->values()
                ->all();

            if (count($inventoryNames) === 0) {
                return response()->json(['recipes' => []], 200);
            }

            $inventoryLookup = array_fill_keys($inventoryNames, true);

            $recipes = Recipe::where('is_ai_generated', 1)
                ->with(['recipeIngredients.ingredient', 'instructions'])
                ->orderByDesc('id')
                ->get();

            $matching = $recipes->filter(function (Recipe $recipe) use ($inventoryLookup) {
                $ingredients = $recipe->recipeIngredients;

                if ($ingredients->isEmpty()) {
                    return false;
                }

                $requiredNonStaples = $ingredients
                    ->map(function (RecipeIngredient $ingredient) {
                        $name = $this->hasColumn('recipe_ingredients', 'item_name')
                            ? (string) $ingredient->item_name
                            : (string) ($ingredient->ingredient?->name ?? '');

                        return strtolower(trim($name));
                    })
                    ->filter(fn ($name) => $name !== '' && !in_array($name, $this->staples, true))
                    ->unique()
                    ->values();

                if ($requiredNonStaples->isEmpty()) {
                    return true;
                }

                foreach ($requiredNonStaples as $name) {
                    if (!isset($inventoryLookup[$name])) {
                        return false;
                    }
                }

                return true;
            })->values();

            return response()->json([
                'recipes' => $matching->map(fn (Recipe $recipe) => $this->formatRecipe($recipe))->all(),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch matching recipes',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function saveGeneratedRecipes(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'recipes' => 'required|array|size:3',
            'recipes.*.type' => 'required|string|in:quick,healthy,surprise',
            'recipes.*.title' => 'required|string|max:200',
            'recipes.*.preparationTime' => 'required|string|max:50',
            'recipes.*.baseServings' => 'required|integer|in:1',
            'recipes.*.ingredients' => 'required|array|min:1',
            'recipes.*.ingredients.*.item' => 'required|string|max:150',
            'recipes.*.ingredients.*.amount' => 'required|numeric|min:0.01',
            'recipes.*.ingredients.*.unit' => 'required|string|max:30',
            'recipes.*.steps' => 'required|array|size:3',
            'recipes.*.steps.*' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = Auth::user();
            $this->ensureRecipeSchema();
            $payloadRecipes = $request->input('recipes', []);
            $saved = [];

            DB::transaction(function () use ($payloadRecipes, $user, &$saved) {
                foreach ($payloadRecipes as $payloadRecipe) {
                    $recipeData = [
                        'title' => $payloadRecipe['title'],
                        'description' => null,
                        'is_ai_generated' => 1,
                        'created_by' => $user->id,
                    ];

                    if ($this->hasColumn('recipes', 'recipe_type')) {
                        $recipeData['recipe_type'] = $payloadRecipe['type'];
                    }

                    if ($this->hasColumn('recipes', 'preparation_time')) {
                        $recipeData['preparation_time'] = $payloadRecipe['preparationTime'];
                    }

                    if ($this->hasColumn('recipes', 'base_servings')) {
                        $recipeData['base_servings'] = 1;
                    }

                    $recipe = Recipe::create($recipeData);

                    $aggregatedIngredients = [];
                    foreach ($payloadRecipe['ingredients'] as $ingredientPayload) {
                        $name = trim((string) $ingredientPayload['item']);
                        $unit = trim((string) $ingredientPayload['unit']);
                        $amount = (float) $ingredientPayload['amount'];
                        $key = strtolower($name) . '|' . strtolower($unit);

                        if (!isset($aggregatedIngredients[$key])) {
                            $aggregatedIngredients[$key] = [
                                'item' => $name,
                                'unit' => $unit,
                                'amount' => 0.0,
                            ];
                        }

                        $aggregatedIngredients[$key]['amount'] += $amount;
                    }

                    foreach (array_values($aggregatedIngredients) as $ingredientPayload) {
                        $itemName = trim((string) $ingredientPayload['item']);
                        $normalizedBaseUnit = $this->normalizeBaseUnit((string) $ingredientPayload['unit']);
                        $ingredient = Ingredient::whereRaw('LOWER(name) = ?', [strtolower($itemName)])->first();

                        if (!$ingredient) {
                            $ingredient = Ingredient::create([
                                'name' => $itemName,
                                'base_unit' => $normalizedBaseUnit,
                            ]);
                        }

                        $ingredientData = [
                            'recipe_id' => $recipe->id,
                            'ingredient_id' => $ingredient->id,
                            'required_quantity' => $ingredientPayload['amount'],
                        ];

                        if ($this->hasColumn('recipe_ingredients', 'item_name')) {
                            $ingredientData['item_name'] = $ingredient->name;
                        }

                        if ($this->hasColumn('recipe_ingredients', 'amount')) {
                            $ingredientData['amount'] = $ingredientPayload['amount'];
                        }

                        if ($this->hasColumn('recipe_ingredients', 'unit')) {
                            $ingredientData['unit'] = $ingredientPayload['unit'];
                        }

                        RecipeIngredient::create($ingredientData);
                    }

                    foreach ($payloadRecipe['steps'] as $index => $stepText) {
                        Instruction::create([
                            'recipe_id' => $recipe->id,
                            'step_number' => $index + 1,
                            'instruction_text' => $stepText,
                        ]);
                    }

                    $recipe->load(['recipeIngredients.ingredient', 'instructions']);
                    $saved[] = $this->formatRecipe($recipe);
                }
            });

            return response()->json([
                'message' => 'Recipes saved successfully',
                'recipes' => $saved,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to save generated recipes',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function formatRecipe(Recipe $recipe): array
    {
        $hasRecipeType = $this->hasColumn('recipes', 'recipe_type');
        $hasPreparationTime = $this->hasColumn('recipes', 'preparation_time');
        $hasAmount = $this->hasColumn('recipe_ingredients', 'amount');
        $hasUnit = $this->hasColumn('recipe_ingredients', 'unit');
        $hasItemName = $this->hasColumn('recipe_ingredients', 'item_name');

        return [
            'type' => $hasRecipeType ? $recipe->recipe_type : 'quick',
            'title' => $recipe->title,
            'preparationTime' => $hasPreparationTime ? $recipe->preparation_time : '20 mins',
            'baseServings' => 1,
            'ingredients' => $recipe->recipeIngredients
                ->map(fn (RecipeIngredient $ingredient) => [
                    'item' => $hasItemName
                        ? $ingredient->item_name
                        : (string) ($ingredient->ingredient?->name ?? 'Unknown item'),
                    'amount' => $hasAmount
                        ? (float) $ingredient->amount
                        : (float) $ingredient->required_quantity,
                    'unit' => $hasUnit
                        ? $ingredient->unit
                        : (string) ($ingredient->ingredient?->base_unit ?? 'piece'),
                ])
                ->values()
                ->all(),
            'steps' => $recipe->instructions
                ->sortBy('step_number')
                ->map(fn (Instruction $instruction) => $instruction->instruction_text)
                ->values()
                ->all(),
        ];
    }

    private function hasColumn(string $table, string $column): bool
    {
        if ($this->columnCache === null) {
            $this->columnCache = [];
        }

        $key = $table . ':' . $column;

        if (array_key_exists($key, $this->columnCache)) {
            return $this->columnCache[$key];
        }

        $exists = Schema::hasColumn($table, $column);
        $this->columnCache[$key] = $exists;

        return $exists;
    }

    private function ensureRecipeSchema(): void
    {
        $schemaChanged = false;

        if (!$this->hasColumn('recipes', 'recipe_type')) {
            DB::statement("ALTER TABLE recipes ADD recipe_type NVARCHAR(20) NULL");
            DB::statement("UPDATE recipes SET recipe_type = 'quick' WHERE recipe_type IS NULL");
            $schemaChanged = true;
        }

        if (!$this->hasColumn('recipes', 'preparation_time')) {
            DB::statement("ALTER TABLE recipes ADD preparation_time NVARCHAR(50) NULL");
            DB::statement("UPDATE recipes SET preparation_time = '20 mins' WHERE preparation_time IS NULL");
            $schemaChanged = true;
        }

        if (!$this->hasColumn('recipes', 'base_servings')) {
            DB::statement("ALTER TABLE recipes ADD base_servings INT NOT NULL CONSTRAINT df_recipes_base_servings_runtime DEFAULT 1");
            $schemaChanged = true;
        }

        if (!$this->hasColumn('recipe_ingredients', 'item_name')) {
            DB::statement("ALTER TABLE recipe_ingredients ADD item_name NVARCHAR(150) NULL");
            DB::statement("UPDATE ri SET ri.item_name = i.name FROM recipe_ingredients ri INNER JOIN ingredients i ON i.id = ri.ingredient_id WHERE ri.item_name IS NULL");
            DB::statement("UPDATE recipe_ingredients SET item_name = 'Unknown item' WHERE item_name IS NULL");
            $schemaChanged = true;
        }

        if (!$this->hasColumn('recipe_ingredients', 'amount')) {
            DB::statement("ALTER TABLE recipe_ingredients ADD amount DECIMAL(10,2) NULL");
            DB::statement("UPDATE recipe_ingredients SET amount = COALESCE(required_quantity, 1.00) WHERE amount IS NULL");
            $schemaChanged = true;
        }

        if (!$this->hasColumn('recipe_ingredients', 'unit')) {
            DB::statement("ALTER TABLE recipe_ingredients ADD unit NVARCHAR(30) NULL");
            DB::statement("UPDATE recipe_ingredients SET unit = 'piece' WHERE unit IS NULL");
            $schemaChanged = true;
        }

        if ($schemaChanged) {
            $this->columnCache = null;
        }
    }

    private function normalizeBaseUnit(string $unit): string
    {
        $normalized = strtolower(trim($unit));

        if (str_contains($normalized, 'g') || str_contains($normalized, 'gram') || str_contains($normalized, 'kg')) {
            return 'g';
        }

        if (
            str_contains($normalized, 'ml') ||
            str_contains($normalized, 'liter') ||
            str_contains($normalized, 'cup') ||
            str_contains($normalized, 'tbsp') ||
            str_contains($normalized, 'tsp')
        ) {
            return 'ml';
        }

        return 'piece';
    }
}
