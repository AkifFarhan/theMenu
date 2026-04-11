<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\Instruction;
use App\Models\Inventory;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class RecipeController extends Controller
{
    private array $staples = ['salt', 'water', 'oil'];

    private array $cuisines = ['bengali', 'indian', 'chinese', 'italian', 'mexican'];

    private const DATABASE_MATCH_THRESHOLD = 70;

    private ?array $columnCache = null;

    public function getMatchingRecipes(Request $request)
    {
        try {
            $user = Auth::user();
            $this->ensureRecipeSchema();
            $selectedCuisine = $this->normalizeCuisine($request->query('cuisine'));

            $inventoryItems = Inventory::query()
                ->join('ingredients', 'ingredients.id', '=', 'inventories.ingredient_id')
                ->where('inventories.user_id', $user->id)
                ->select('inventories.*')
                ->with('ingredient:id,name,base_unit')
                ->get();

            if ($inventoryItems->isEmpty()) {
                return response()->json(['recipes' => []], 200);
            }

            $recipes = Recipe::query()
                ->leftJoin('users as recipe_creators', 'recipe_creators.id', '=', 'recipes.created_by')
                ->select('recipes.*')
                ->with(['recipeIngredients.ingredient', 'instructions'])
                ->orderByDesc('recipes.id')
                ->when($selectedCuisine !== null && $this->hasColumn('recipes', 'cuisine'), function ($query) use ($selectedCuisine) {
                    $query->whereRaw('LOWER(recipes.cuisine) = ?', [$selectedCuisine]);
                })
                ->get();

            $matching = $recipes
                ->map(function (Recipe $recipe) use ($inventoryItems) {
                    $availability = $this->evaluateRecipeAvailability($recipe, $inventoryItems, 1);
                    $matchStats = $this->evaluateRecipeMatchStats($recipe, $inventoryItems, 1);

                    return [
                        'recipe' => $recipe,
                        'availability' => $availability,
                        'matchStats' => $matchStats,
                    ];
                })
                ->filter(function (array $entry) {
                    $stats = $entry['matchStats'];

                    return $stats['totalIngredients'] > 0
                        && $stats['matchPercentage'] >= self::DATABASE_MATCH_THRESHOLD;
                })
                ->values();

            return response()->json([
                'recipes' => $matching
                    ->map(function (array $entry) {
                        return array_merge(
                            $this->formatRecipe($entry['recipe']),
                            [
                                'canCook' => $entry['availability']['canCook'],
                                'missingIngredients' => $entry['availability']['missingIngredients'],
                                'matchPercentage' => $entry['matchStats']['matchPercentage'],
                            ]
                        );
                    })
                    ->all(),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch matching recipes',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function cookRecipe(Request $request, int $id)
    {
        $validator = Validator::make($request->all(), [
            'people_count' => 'required|integer|min:1|max:50',
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
            $peopleCount = (int) $request->input('people_count', 1);

            $result = DB::transaction(function () use ($id, $user, $peopleCount) {
                $recipe = Recipe::query()
                    ->leftJoin('users as recipe_creators', 'recipe_creators.id', '=', 'recipes.created_by')
                    ->select('recipes.*')
                    ->with(['recipeIngredients.ingredient', 'instructions'])
                    ->find($id);

                if (!$recipe) {
                    return [
                        'status' => 404,
                        'payload' => [
                            'message' => 'Recipe not found',
                        ],
                    ];
                }

                $inventoryItems = Inventory::query()
                    ->join('ingredients', 'ingredients.id', '=', 'inventories.ingredient_id')
                    ->where('inventories.user_id', $user->id)
                    ->select('inventories.*')
                    ->with('ingredient:id,name,base_unit')
                    ->lockForUpdate()
                    ->get();

                $availability = $this->evaluateRecipeAvailability($recipe, $inventoryItems, $peopleCount);

                if ($availability['canCook'] !== true) {
                    return [
                        'status' => 422,
                        'payload' => [
                            'message' => 'Insufficient ingredients for this recipe and serving size.',
                            'missingIngredients' => $availability['missingIngredients'],
                        ],
                    ];
                }

                foreach ($availability['deductions'] as $deduction) {
                    /** @var Inventory|null $inventoryItem */
                    $inventoryItem = $inventoryItems->firstWhere('id', $deduction['inventory_id']);

                    if (!$inventoryItem) {
                        continue;
                    }

                    $updatedQuantity = (float) $inventoryItem->quantity - (float) $deduction['amount'];
                    if ($updatedQuantity <= 0.0001) {
                        $inventoryItem->delete();
                        continue;
                    }

                    $inventoryItem->quantity = round($updatedQuantity, 2);
                    $inventoryItem->save();
                }

                $this->insertCookingLogSafely($user->id, $recipe->id, $peopleCount);

                return [
                    'status' => 200,
                    'payload' => [
                        'message' => 'Recipe cooked and inventory auto-deducted successfully.',
                        'recipeId' => $recipe->id,
                        'peopleCount' => $peopleCount,
                    ],
                ];
            });

            return response()->json($result['payload'], $result['status']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to cook recipe: ' . $e->getMessage(),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function insertCookingLogSafely(int $userId, int $recipeId, int $peopleCount): void
    {
        if (!Schema::hasTable('cooking_logs')) {
            return;
        }

        try {
            $payload = [];

            if (Schema::hasColumn('cooking_logs', 'user_id')) {
                $payload['user_id'] = $userId;
            }

            if (Schema::hasColumn('cooking_logs', 'recipe_id')) {
                $payload['recipe_id'] = $recipeId;
            }

            if (Schema::hasColumn('cooking_logs', 'people_count')) {
                $payload['people_count'] = $peopleCount;
            }

            if (Schema::hasColumn('cooking_logs', 'scaling_factor')) {
                $payload['scaling_factor'] = $peopleCount;
            }

            if (Schema::hasColumn('cooking_logs', 'auto_deducted')) {
                $payload['auto_deducted'] = 1;
            }

            if (Schema::hasColumn('cooking_logs', 'cooked_at')) {
                $payload['cooked_at'] = now();
            }

            if (Schema::hasColumn('cooking_logs', 'created_at')) {
                $payload['created_at'] = now();
            }

            if (Schema::hasColumn('cooking_logs', 'updated_at')) {
                $payload['updated_at'] = now();
            }

            if ($payload !== []) {
                DB::table('cooking_logs')->insert($payload);
            }
        } catch (\Exception $exception) {
            Log::warning('Cooking log insert skipped', [
                'message' => $exception->getMessage(),
            ]);
        }
    }

    public function saveGeneratedRecipes(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'recipes' => 'required|array|size:3',
            'recipes.*.type' => 'required|string|in:quick,healthy,surprise',
            'recipes.*.cuisine' => 'nullable|string|in:bengali,indian,chinese,italian,mexican',
            'recipes.*.title' => 'required|string|max:200',
            'recipes.*.description' => 'nullable|string|max:1000',
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
                    $recipeDescription = $this->buildRecipeDescription($payloadRecipe);

                    $recipeData = [
                        'title' => $payloadRecipe['title'],
                        'description' => $recipeDescription,
                        'created_by' => $user->id,
                    ];

                    if ($this->hasColumn('recipes', 'recipe_type')) {
                        $recipeData['recipe_type'] = $payloadRecipe['type'];
                    }

                    if ($this->hasColumn('recipes', 'cuisine')) {
                        $recipeData['cuisine'] = $this->normalizeCuisine($payloadRecipe['cuisine'] ?? null);
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
                        $amount = (float) $ingredientPayload['amount'];
                        $normalizedMeasurement = $this->normalizeToDatabaseMeasurement(
                            $amount,
                            (string) $ingredientPayload['unit']
                        );

                        if ($normalizedMeasurement === null) {
                            continue;
                        }

                        $unit = $normalizedMeasurement['unit'];
                        $normalizedAmount = $normalizedMeasurement['amount'];
                        $key = strtolower($name) . '|' . strtolower($unit);

                        if (!isset($aggregatedIngredients[$key])) {
                            $aggregatedIngredients[$key] = [
                                'item' => $name,
                                'unit' => $unit,
                                'amount' => 0.0,
                            ];
                        }

                        $aggregatedIngredients[$key]['amount'] += $normalizedAmount;
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

                    $recipe = Recipe::query()
                        ->leftJoin('users as recipe_creators', 'recipe_creators.id', '=', 'recipes.created_by')
                        ->select('recipes.*')
                        ->with(['recipeIngredients.ingredient', 'instructions'])
                        ->find($recipe->id);

                    if (!$recipe) {
                        throw new \RuntimeException('Recipe not found after save operation.');
                    }
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
            'id' => $recipe->id,
            'type' => $hasRecipeType ? $recipe->recipe_type : 'quick',
            'cuisine' => $this->hasColumn('recipes', 'cuisine') ? (string) ($recipe->cuisine ?? '') : '',
            'title' => $recipe->title,
            'description' => (string) ($recipe->description ?? ''),
            'preparationTime' => $hasPreparationTime ? $recipe->preparation_time : '20 mins',
            'baseServings' => 1,
            'ingredients' => $recipe->recipeIngredients
                ->map(fn (RecipeIngredient $ingredient) => [
                    'ingredientId' => $ingredient->ingredient_id,
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

    private function buildRecipeDescription(array $payloadRecipe): string
    {
        $provided = trim((string) ($payloadRecipe['description'] ?? ''));
        if ($provided !== '') {
            return $provided;
        }

        $cuisine = $this->normalizeCuisine($payloadRecipe['cuisine'] ?? null);
        $title = trim((string) ($payloadRecipe['title'] ?? 'Delicious recipe'));
        $prepTime = trim((string) ($payloadRecipe['preparationTime'] ?? '20 mins'));

        $ingredientNames = collect($payloadRecipe['ingredients'] ?? [])
            ->map(fn ($ingredient) => trim((string) ($ingredient['item'] ?? '')))
            ->filter(fn ($name) => $name !== '')
            ->unique()
            ->take(3)
            ->values()
            ->all();

        $ingredientText = count($ingredientNames) > 0
            ? implode(', ', $ingredientNames)
            : 'pantry staples';

        $cuisinePrefix = '';
        if ($cuisine !== null) {
            $article = in_array(substr($cuisine, 0, 1), ['a', 'e', 'i', 'o', 'u'], true) ? 'an' : 'a';
            $cuisinePrefix = $article . ' ' . ucfirst($cuisine) . ' style ';
        }

        if ($cuisinePrefix !== '') {
            return "{$title} is {$cuisinePrefix}one-person {$prepTime} meal using {$ingredientText}.";
        }

        return "{$title} is a one-person {$prepTime} meal using {$ingredientText}.";
    }

    private function evaluateRecipeAvailability(Recipe $recipe, Collection $inventoryItems, int $peopleCount): array
    {
        if ($recipe->recipeIngredients->isEmpty()) {
            return [
                'canCook' => false,
                'missingIngredients' => [
                    [
                        'item' => 'Recipe ingredients',
                        'required' => 1,
                        'unit' => 'set',
                        'available' => 0,
                        'availableUnit' => 'set',
                    ],
                ],
                'deductions' => [],
            ];
        }

        [$inventoryByIngredientId, $inventoryByName] = $this->buildInventoryLookups($inventoryItems);
        $missing = [];
        $deductions = [];

        foreach ($recipe->recipeIngredients as $recipeIngredient) {
            $ingredientName = $this->getRecipeIngredientName($recipeIngredient);
            $normalizedName = strtolower(trim($ingredientName));

            if ($normalizedName === '' || in_array($normalizedName, $this->staples, true)) {
                continue;
            }

            $requiredAmount = $this->getRecipeIngredientAmount($recipeIngredient) * $peopleCount;
            $requiredUnit = $this->getRecipeIngredientUnit($recipeIngredient);

            /** @var Inventory|null $inventoryItem */
            $inventoryItem = null;
            if ($recipeIngredient->ingredient_id !== null && isset($inventoryByIngredientId[$recipeIngredient->ingredient_id])) {
                $inventoryItem = $inventoryByIngredientId[$recipeIngredient->ingredient_id];
            } elseif (isset($inventoryByName[$normalizedName])) {
                $inventoryItem = $inventoryByName[$normalizedName];
            }

            if (!$inventoryItem) {
                $missing[] = [
                    'item' => $ingredientName,
                    'required' => round($requiredAmount, 2),
                    'unit' => $requiredUnit,
                    'available' => 0,
                    'availableUnit' => $this->normalizeBaseUnit($requiredUnit),
                ];
                continue;
            }

            $inventoryUnit = (string) ($inventoryItem->ingredient?->base_unit ?? 'piece');
            $requiredInInventoryUnit = $this->convertAmountToBase($requiredAmount, $requiredUnit, $inventoryUnit);

            if ($requiredInInventoryUnit === null) {
                $missing[] = [
                    'item' => $ingredientName,
                    'required' => round($requiredAmount, 2),
                    'unit' => $requiredUnit,
                    'available' => (float) $inventoryItem->quantity,
                    'availableUnit' => $inventoryUnit,
                ];
                continue;
            }

            $availableQuantity = (float) $inventoryItem->quantity;
            if ($availableQuantity + 0.0001 < $requiredInInventoryUnit) {
                $missing[] = [
                    'item' => $ingredientName,
                    'required' => round($requiredInInventoryUnit, 2),
                    'unit' => $inventoryUnit,
                    'available' => round($availableQuantity, 2),
                    'availableUnit' => $inventoryUnit,
                ];
                continue;
            }

            if (!isset($deductions[$inventoryItem->id])) {
                $deductions[$inventoryItem->id] = [
                    'inventory_id' => $inventoryItem->id,
                    'amount' => 0.0,
                ];
            }

            $deductions[$inventoryItem->id]['amount'] += $requiredInInventoryUnit;
        }

        return [
            'canCook' => count($missing) === 0,
            'missingIngredients' => $missing,
            'deductions' => array_values($deductions),
        ];
    }

    private function evaluateRecipeMatchStats(Recipe $recipe, Collection $inventoryItems, int $peopleCount): array
    {
        if ($recipe->recipeIngredients->isEmpty()) {
            return [
                'totalIngredients' => 0,
                'matchingIngredients' => 0,
                'matchPercentage' => 0,
            ];
        }

        [$inventoryByIngredientId, $inventoryByName] = $this->buildInventoryLookups($inventoryItems);

        $totalIngredients = 0;
        $matchingIngredients = 0;

        foreach ($recipe->recipeIngredients as $recipeIngredient) {
            $ingredientName = $this->getRecipeIngredientName($recipeIngredient);
            $normalizedName = strtolower(trim($ingredientName));

            if ($normalizedName === '' || in_array($normalizedName, $this->staples, true)) {
                continue;
            }

            $totalIngredients++;

            $requiredAmount = $this->getRecipeIngredientAmount($recipeIngredient) * $peopleCount;
            $requiredUnit = $this->getRecipeIngredientUnit($recipeIngredient);

            /** @var Inventory|null $inventoryItem */
            $inventoryItem = null;
            if ($recipeIngredient->ingredient_id !== null && isset($inventoryByIngredientId[$recipeIngredient->ingredient_id])) {
                $inventoryItem = $inventoryByIngredientId[$recipeIngredient->ingredient_id];
            } elseif (isset($inventoryByName[$normalizedName])) {
                $inventoryItem = $inventoryByName[$normalizedName];
            }

            if (!$inventoryItem) {
                continue;
            }

            $inventoryUnit = (string) ($inventoryItem->ingredient?->base_unit ?? 'piece');
            $requiredInInventoryUnit = $this->convertAmountToBase($requiredAmount, $requiredUnit, $inventoryUnit);

            if ($requiredInInventoryUnit === null) {
                continue;
            }

            $availableQuantity = (float) $inventoryItem->quantity;
            if ($availableQuantity + 0.0001 >= $requiredInInventoryUnit) {
                $matchingIngredients++;
            }
        }

        $matchPercentage = $totalIngredients > 0
            ? (int) round(($matchingIngredients / $totalIngredients) * 100)
            : 0;

        return [
            'totalIngredients' => $totalIngredients,
            'matchingIngredients' => $matchingIngredients,
            'matchPercentage' => $matchPercentage,
        ];
    }

    private function buildInventoryLookups(Collection $inventoryItems): array
    {
        $byIngredientId = [];
        $byName = [];

        foreach ($inventoryItems as $item) {
            /** @var Inventory $item */
            $ingredientId = $item->ingredient_id;
            if ($ingredientId !== null) {
                $byIngredientId[$ingredientId] = $item;
            }

            $name = strtolower(trim((string) ($item->ingredient?->name ?? '')));
            if ($name !== '' && !isset($byName[$name])) {
                $byName[$name] = $item;
            }
        }

        return [$byIngredientId, $byName];
    }

    private function getRecipeIngredientName(RecipeIngredient $ingredient): string
    {
        if ($this->hasColumn('recipe_ingredients', 'item_name')) {
            return trim((string) $ingredient->item_name);
        }

        return trim((string) ($ingredient->ingredient?->name ?? ''));
    }

    private function getRecipeIngredientAmount(RecipeIngredient $ingredient): float
    {
        if ($this->hasColumn('recipe_ingredients', 'amount')) {
            return max(0, (float) $ingredient->amount);
        }

        return max(0, (float) $ingredient->required_quantity);
    }

    private function getRecipeIngredientUnit(RecipeIngredient $ingredient): string
    {
        if ($this->hasColumn('recipe_ingredients', 'unit')) {
            $value = trim((string) $ingredient->unit);
            return $value !== '' ? $value : 'piece';
        }

        $fallback = trim((string) ($ingredient->ingredient?->base_unit ?? 'piece'));
        return $fallback !== '' ? $fallback : 'piece';
    }

    private function convertAmountToBase(float $amount, string $unit, string $baseUnit): ?float
    {
        $normalizedBase = strtolower(trim($baseUnit));
        $normalizedUnit = strtolower(trim($unit));

        if ($normalizedUnit === '' || $normalizedUnit === $normalizedBase) {
            return $amount;
        }

        $cleanUnit = str_replace([' ', '.'], '', $normalizedUnit);

        $gramsMap = [
            'g' => 1,
            'gram' => 1,
            'grams' => 1,
            'kg' => 1000,
            'kilogram' => 1000,
            'kilograms' => 1000,
            'mg' => 0.001,
        ];

        $millilitersMap = [
            'ml' => 1,
            'milliliter' => 1,
            'milliliters' => 1,
            'l' => 1000,
            'liter' => 1000,
            'liters' => 1000,
            'litre' => 1000,
            'litres' => 1000,
            'cup' => 240,
            'cups' => 240,
            'tbsp' => 15,
            'tablespoon' => 15,
            'tablespoons' => 15,
            'tsp' => 5,
            'teaspoon' => 5,
            'teaspoons' => 5,
        ];

        $pieceMap = [
            'piece' => 1,
            'pieces' => 1,
            'pc' => 1,
            'pcs' => 1,
            'unit' => 1,
            'units' => 1,
        ];

        if ($normalizedBase === 'g') {
            return isset($gramsMap[$cleanUnit]) ? $amount * $gramsMap[$cleanUnit] : null;
        }

        if ($normalizedBase === 'ml') {
            return isset($millilitersMap[$cleanUnit]) ? $amount * $millilitersMap[$cleanUnit] : null;
        }

        if ($normalizedBase === 'piece') {
            return isset($pieceMap[$cleanUnit]) ? $amount * $pieceMap[$cleanUnit] : null;
        }

        return null;
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

        if (!$this->hasColumn('recipes', 'cuisine')) {
            DB::statement("ALTER TABLE recipes ADD cuisine NVARCHAR(20) NULL");
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
        $clean = str_replace([' ', '.'], '', $normalized);

        if (in_array($clean, ['g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms', 'mg'], true)) {
            return 'g';
        }

        if (in_array($clean, ['ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters', 'litre', 'litres', 'cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon', 'teaspoons'], true)) {
            return 'ml';
        }

        return 'piece';
    }

    private function normalizeCuisine($cuisine): ?string
    {
        $normalized = strtolower(trim((string) $cuisine));

        return in_array($normalized, $this->cuisines, true) ? $normalized : null;
    }

    private function normalizeToDatabaseMeasurement(float $amount, string $unit): ?array
    {
        if ($amount <= 0) {
            return null;
        }

        $clean = str_replace([' ', '.'], '', strtolower(trim($unit)));

        $gramsMap = [
            'g' => 1,
            'gram' => 1,
            'grams' => 1,
            'kg' => 1000,
            'kilogram' => 1000,
            'kilograms' => 1000,
            'mg' => 0.001,
        ];

        $millilitersMap = [
            'ml' => 1,
            'milliliter' => 1,
            'milliliters' => 1,
            'l' => 1000,
            'liter' => 1000,
            'liters' => 1000,
            'litre' => 1000,
            'litres' => 1000,
            'cup' => 240,
            'cups' => 240,
            'tbsp' => 15,
            'tablespoon' => 15,
            'tablespoons' => 15,
            'tsp' => 5,
            'teaspoon' => 5,
            'teaspoons' => 5,
        ];

        $pieceMap = [
            'piece' => 1,
            'pieces' => 1,
            'pc' => 1,
            'pcs' => 1,
            'unit' => 1,
            'units' => 1,
            'clove' => 1,
            'cloves' => 1,
            'slice' => 1,
            'slices' => 1,
        ];

        if (isset($gramsMap[$clean])) {
            return [
                'amount' => round($amount * $gramsMap[$clean], 2),
                'unit' => 'g',
            ];
        }

        if (isset($millilitersMap[$clean])) {
            return [
                'amount' => round($amount * $millilitersMap[$clean], 2),
                'unit' => 'ml',
            ];
        }

        if (isset($pieceMap[$clean])) {
            return [
                'amount' => round($amount * $pieceMap[$clean], 2),
                'unit' => 'piece',
            ];
        }

        return null;
    }
}
