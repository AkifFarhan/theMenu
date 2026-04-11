import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { getRecipesFromInventory, type GeneratedRecipe } from '../services/recipeSuggestionService';
import ApiClient from '../api';

interface Item {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  ingredient_id: number;
}

interface MissingIngredient {
  item: string;
  required: number;
  unit: string;
  available: number;
  availableUnit: string;
}

interface RecipeCookability {
  canCook: boolean;
  missingIngredients: MissingIngredient[];
}

type RecipeSourceMode = 'generated' | 'database' | 'fallback';

type RecipeTypeKey = keyof typeof cardMeta;

const STAPLES = new Set(['salt', 'water', 'oil']);
const GENERATED_MATCH_THRESHOLD = 100;
const DATABASE_MATCH_THRESHOLD = 70;

function formatAmount(amount: number): string {
  return Number.isInteger(amount) ? amount.toString() : amount.toFixed(2).replace(/\.00$/, '');
}

function toBaseAmount(amount: number, unit: string, baseUnit: string): number | null {
  const normalizedUnit = unit.trim().toLowerCase().replace(/[\s.]/g, '');
  const normalizedBase = baseUnit.trim().toLowerCase();

  if (!normalizedUnit || normalizedUnit === normalizedBase) {
    return amount;
  }

  const gramsMap: Record<string, number> = {
    g: 1,
    gram: 1,
    grams: 1,
    kg: 1000,
    kilogram: 1000,
    kilograms: 1000,
    mg: 0.001,
  };

  const millilitersMap: Record<string, number> = {
    ml: 1,
    milliliter: 1,
    milliliters: 1,
    l: 1000,
    liter: 1000,
    liters: 1000,
    litre: 1000,
    litres: 1000,
    cup: 240,
    cups: 240,
    tbsp: 15,
    tablespoon: 15,
    tablespoons: 15,
    tsp: 5,
    teaspoon: 5,
    teaspoons: 5,
  };

  const pieceMap: Record<string, number> = {
    piece: 1,
    pieces: 1,
    pc: 1,
    pcs: 1,
    unit: 1,
    units: 1,
  };

  if (normalizedBase === 'g') {
    return gramsMap[normalizedUnit] ? amount * gramsMap[normalizedUnit] : null;
  }

  if (normalizedBase === 'ml') {
    return millilitersMap[normalizedUnit] ? amount * millilitersMap[normalizedUnit] : null;
  }

  if (normalizedBase === 'piece') {
    return pieceMap[normalizedUnit] ? amount * pieceMap[normalizedUnit] : null;
  }

  return null;
}

function getRecipeMatchStats(recipe: GeneratedRecipe, inventoryItems: Item[], peopleCount: number): {
  totalIngredients: number;
  matchingIngredients: number;
  matchPercentage: number;
} {
  const inventoryByIngredientId = new Map<number, Item>();
  const inventoryByName = new Map<string, Item>();

  for (const item of inventoryItems) {
    const ingredientId = Number(item?.ingredient_id);
    if (Number.isFinite(ingredientId) && ingredientId > 0) {
      inventoryByIngredientId.set(ingredientId, item);
    }

    const normalizedName = String(item?.name ?? '').trim().toLowerCase();
    if (!inventoryByName.has(normalizedName)) {
      inventoryByName.set(normalizedName, item);
    }
  }

  let totalIngredients = 0;
  let matchingIngredients = 0;

  for (const ingredient of recipe.ingredients ?? []) {
    const normalizedName = String(ingredient?.item ?? '').trim().toLowerCase();
    if (!normalizedName || STAPLES.has(normalizedName)) {
      continue;
    }

    totalIngredients++;

    const requiredAmount = Number(ingredient?.amount ?? 0) * peopleCount;

    const inventoryItem =
      (typeof ingredient.ingredientId === 'number' && ingredient.ingredientId > 0
        ? inventoryByIngredientId.get(ingredient.ingredientId)
        : undefined) || inventoryByName.get(normalizedName);

    if (!inventoryItem) {
      continue;
    }

    const requiredInInventoryUnit = toBaseAmount(requiredAmount, String(ingredient?.unit ?? 'piece'), inventoryItem.unit);
    const availableQuantity = Number(inventoryItem?.quantity ?? 0);

    if (
      Number.isFinite(availableQuantity) &&
      requiredInInventoryUnit !== null &&
      availableQuantity + 0.0001 >= requiredInInventoryUnit
    ) {
      matchingIngredients++;
    }
  }

  if (totalIngredients === 0) {
    return {
      totalIngredients: 0,
      matchingIngredients: 0,
      matchPercentage: 0,
    };
  }

  return {
    totalIngredients,
    matchingIngredients,
    matchPercentage: Math.round((matchingIngredients / totalIngredients) * 100),
  };
}

function getRecipeCookability(recipe: GeneratedRecipe, inventoryItems: Item[], peopleCount: number): RecipeCookability {
  const inventoryByIngredientId = new Map<number, Item>();
  const inventoryByName = new Map<string, Item>();

  for (const item of inventoryItems) {
    const ingredientId = Number(item?.ingredient_id);
    if (Number.isFinite(ingredientId) && ingredientId > 0) {
      inventoryByIngredientId.set(ingredientId, item);
    }

    const normalizedName = String(item?.name ?? '').trim().toLowerCase();
    if (!inventoryByName.has(normalizedName)) {
      inventoryByName.set(normalizedName, item);
    }
  }

  const missingIngredients: MissingIngredient[] = [];

  for (const ingredient of recipe.ingredients ?? []) {
    const normalizedName = String(ingredient?.item ?? '').trim().toLowerCase();
    if (!normalizedName || STAPLES.has(normalizedName)) {
      continue;
    }

    const requiredAmount = Number(ingredient?.amount ?? 0) * peopleCount;
    const inventoryItem =
      (typeof ingredient.ingredientId === 'number' && ingredient.ingredientId > 0
        ? inventoryByIngredientId.get(ingredient.ingredientId)
        : undefined) || inventoryByName.get(normalizedName);

    if (!inventoryItem) {
      missingIngredients.push({
        item: String(ingredient?.item ?? 'Unknown item'),
        required: requiredAmount,
        unit: String(ingredient?.unit ?? 'piece'),
        available: 0,
        availableUnit: String(ingredient?.unit ?? 'piece'),
      });
      continue;
    }

    const requiredInInventoryUnit = toBaseAmount(requiredAmount, String(ingredient?.unit ?? 'piece'), inventoryItem.unit);
    const availableQuantity = Number(inventoryItem?.quantity ?? 0);
    if (!Number.isFinite(availableQuantity) || requiredInInventoryUnit === null || availableQuantity + 0.0001 < requiredInInventoryUnit) {
      missingIngredients.push({
        item: String(ingredient?.item ?? 'Unknown item'),
        required: requiredInInventoryUnit ?? requiredAmount,
        unit: requiredInInventoryUnit === null ? String(ingredient?.unit ?? 'piece') : inventoryItem.unit,
        available: Number.isFinite(availableQuantity) ? availableQuantity : 0,
        availableUnit: String(inventoryItem?.unit ?? 'piece'),
      });
    }
  }

  return {
    canCook: missingIngredients.length === 0,
    missingIngredients,
  };
}

function localFallbackRecipes(items: string[]): GeneratedRecipe[] {
  const base = items.slice(0, 4);
  const core = base.length > 0 ? base.join(', ') : 'pantry staples';

  return [
    {
      type: 'quick',
      title: `Fast Skillet with ${base[0] || 'Pantry Mix'}`,
      preparationTime: '15 mins',
      baseServings: 1,
      ingredients: [
        { item: base[0] || 'Mixed vegetables', amount: 120, unit: 'grams' },
        { item: base[1] || 'Rice', amount: 0.5, unit: 'cup' },
        { item: 'Oil', amount: 1, unit: 'tbsp' },
      ],
      steps: [
        `Chop ${core} into bite-sized pieces.`,
        'Saute everything in a hot pan with oil, salt, and pepper.',
        'Finish with a squeeze of lemon or soy sauce and serve warm.',
      ],
    },
    {
      type: 'healthy',
      title: `${base[1] || 'Veggie'} Power Bowl`,
      preparationTime: '20 mins',
      baseServings: 1,
      ingredients: [
        { item: base[1] || 'Leafy greens', amount: 80, unit: 'grams' },
        { item: base[2] || 'Protein', amount: 100, unit: 'grams' },
        { item: 'Olive oil', amount: 1, unit: 'tbsp' },
      ],
      steps: [
        `Steam or lightly roast ${core}.`,
        'Toss with a light dressing using olive oil, vinegar, and herbs.',
        'Top with protein from your inventory and serve as a bowl.',
      ],
    },
    {
      type: 'surprise',
      title: `Creative ${base[2] || 'Kitchen'} Wrap`,
      preparationTime: '25 mins',
      baseServings: 1,
      ingredients: [
        { item: base[2] || 'Filling mix', amount: 100, unit: 'grams' },
        { item: 'Wrap', amount: 1, unit: 'piece' },
        { item: base[3] || 'Crunchy topping', amount: 40, unit: 'grams' },
      ],
      steps: [
        `Cook and season ${core} until aromatic.`,
        'Layer into bread, wrap, or lettuce leaves with crunchy toppings.',
        'Roll, slice, and serve with a quick dip from your pantry.',
      ],
    },
  ];
}

const api = new ApiClient();

const cardMeta = {
  quick: { tag: 'Quick' },
  healthy: { tag: 'Healthy' },
  surprise: { tag: 'Surprise' },
} as const;

function normalizeRecipeType(type: unknown): RecipeTypeKey {
  return type === 'quick' || type === 'healthy' || type === 'surprise' ? type : 'quick';
}

function normalizeRecipesForDisplay(recipes: unknown[]): GeneratedRecipe[] {
  return recipes
    .map((recipe) => {
      const raw = recipe as Partial<GeneratedRecipe> & { ingredients?: unknown; steps?: unknown };
      const ingredients = Array.isArray(raw.ingredients)
        ? raw.ingredients
            .map((entry) => {
              const item = entry as Partial<GeneratedRecipe['ingredients'][number]>;
              const amount = Number(item?.amount ?? 0);
              if (!Number.isFinite(amount) || amount <= 0) {
                return null;
              }

              return {
                ingredientId: typeof item?.ingredientId === 'number' ? item.ingredientId : null,
                item: String(item?.item ?? 'Unknown item'),
                amount,
                unit: String(item?.unit ?? 'piece'),
              };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
        : [];

      const steps = Array.isArray(raw.steps)
        ? raw.steps.map((step) => String(step)).filter((step) => step.trim().length > 0)
        : [];

      return {
        id: typeof raw.id === 'number' ? raw.id : undefined,
        type: normalizeRecipeType(raw.type),
        title: String(raw.title ?? 'Untitled recipe'),
        preparationTime: String(raw.preparationTime ?? '20 mins'),
        baseServings: 1,
        ingredients,
        steps,
      } satisfies GeneratedRecipe;
    })
    .filter((recipe) => recipe.ingredients.length > 0 && recipe.steps.length > 0);
}

export default function Recipes() {
  const [recipes, setRecipes] = useState<GeneratedRecipe[] | null>(null);
  const [recipeSourceMode, setRecipeSourceMode] = useState<RecipeSourceMode>('generated');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [inventoryNames, setInventoryNames] = useState<string[]>([]);
  const [inventoryItems, setInventoryItems] = useState<Item[]>([]);
  const [peopleCount, setPeopleCount] = useState(1);
  const [cookingRecipeKey, setCookingRecipeKey] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recipesPerPage = 3;

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const response = await api.getInventory();
        const items = Array.isArray(response.items) ? (response.items as Item[]) : [];
        setInventoryItems(items);
        const names = Array.isArray(response.items)
          ? response.items
              .map((item: Item) => item.name?.trim())
              .filter((name: string | undefined): name is string => Boolean(name))
          : [];
        setInventoryNames(names);

        if (names.length > 0) {
          try {
            const savedRecipesResponse = await api.getMatchingRecipes();
            const savedRecipes = Array.isArray(savedRecipesResponse?.recipes)
              ? normalizeRecipesForDisplay(savedRecipesResponse.recipes)
              : [];

            if (savedRecipes.length > 0) {
              setRecipes(savedRecipes);
              setRecipeSourceMode('database');
            }
          } catch {
            // Keep page usable if saved recipe lookup fails.
          }
        }
      } catch {
        setInventoryItems([]);
        setInventoryNames([]);
      }
    };

    loadInventory();
  }, []);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldownSeconds((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const canGenerate = inventoryNames.length > 0 && !isLoading && cooldownSeconds === 0;

  const parseRetryAfterSeconds = (message: string): number | null => {
    const match = message.match(/retry after\s+(\d+)s/i);
    if (!match?.[1]) {
      return null;
    }

    const parsed = Number.parseInt(match[1], 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  const handleGenerate = async () => {
    setError(null);
    setSuccessMessage(null);
    setCooldownSeconds(5);
    setIsLoading(true);

    try {
      const generated = await getRecipesFromInventory(
        inventoryNames,
        inventoryItems.map((item) => ({ name: item.name, unit: item.unit }))
      );

      try {
        const savedResponse = await api.saveGeneratedRecipes(generated.recipes);
        const savedRecipes = Array.isArray(savedResponse?.recipes)
          ? normalizeRecipesForDisplay(savedResponse.recipes)
          : normalizeRecipesForDisplay(generated.recipes);
        setRecipes(savedRecipes);
        setRecipeSourceMode('generated');
      } catch (saveErr: unknown) {
        setRecipes(normalizeRecipesForDisplay(generated.recipes));
        setRecipeSourceMode('generated');

        const typedSaveError = saveErr as {
          response?: { data?: { message?: string; error?: string } };
          message?: string;
        };

        const detailedMessage =
          typedSaveError?.response?.data?.error ||
          typedSaveError?.response?.data?.message ||
          typedSaveError?.message ||
          'Recipe generated, but failed to save to database.';

        setError(`Recipe generated, but failed to save to database. ${detailedMessage}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to suggest recipes right now.';
      if (message.includes('429')) {
        const retryAfter = parseRetryAfterSeconds(message);
        if (retryAfter !== null) {
          setCooldownSeconds(Math.max(retryAfter, 5));
        } else {
          setCooldownSeconds(30);
        }
        const fallbackRecipes = localFallbackRecipes(inventoryNames);
        setRecipes(normalizeRecipesForDisplay(fallbackRecipes));
        setRecipeSourceMode('fallback');
        setError(
          retryAfter !== null
            ? `Rate limit reached. Please wait ${retryAfter}s, then try again. Showing local fallback recipes.`
            : 'Rate limit reached. Please wait about 30s, then try again. Showing local fallback recipes.'
        );
      } else if (
        message.toLowerCase().includes('high demand') ||
        message.includes('503') ||
        message.toLowerCase().includes('try again later')
      ) {
        const retryAfter = parseRetryAfterSeconds(message) ?? 30;
        setCooldownSeconds(Math.max(retryAfter, 10));
        const fallbackRecipes = localFallbackRecipes(inventoryNames);
        setRecipes(normalizeRecipesForDisplay(fallbackRecipes));
        setRecipeSourceMode('fallback');
        setError(`Gemini is busy right now. Please wait ${retryAfter}s and try again. Showing local fallback recipes.`);
      } else if (
        message.toLowerCase().includes('unexpected format') ||
        message.toLowerCase().includes('json')
      ) {
        const fallbackRecipes = localFallbackRecipes(inventoryNames);
        setRecipes(normalizeRecipesForDisplay(fallbackRecipes));
        setRecipeSourceMode('fallback');
        setError('Recipe service returned an unexpected format. Showing local fallback recipes for now.');
      } else if (
        message.includes('403') ||
        message.toLowerCase().includes('api key') ||
        message.toLowerCase().includes('permission') ||
        message.toLowerCase().includes('leaked')
      ) {
        const fallbackRecipes = localFallbackRecipes(inventoryNames);
        setRecipes(normalizeRecipesForDisplay(fallbackRecipes));
        setRecipeSourceMode('fallback');
        setError(`${message} Showing local fallback recipes for now.`);
      } else {
        const fallbackRecipes = localFallbackRecipes(inventoryNames);
        setRecipes(normalizeRecipesForDisplay(fallbackRecipes));
        setRecipeSourceMode('fallback');
        setError(`${message} Showing local fallback recipes for now.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCook = async (recipe: GeneratedRecipe, recipeKey: string) => {
    if (!recipe.id) {
      const message = 'This recipe is not saved yet, so it cannot be cooked with auto deduction.';
      setError(message);
      toast.error(message);
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setCookingRecipeKey(recipeKey);

    try {
      await api.cookRecipe(recipe.id, peopleCount);
      const message = `Cooked ${recipe.title}. Inventory has been auto-deducted.`;
      setSuccessMessage(message);
      toast.success(message);

      const inventoryResponse = await api.getInventory();
      const items = Array.isArray(inventoryResponse.items) ? (inventoryResponse.items as Item[]) : [];
      setInventoryItems(items);
      setInventoryNames(items.map((item) => item.name).filter(Boolean));

      const matchingResponse = await api.getMatchingRecipes();
      const matchingRecipes = Array.isArray(matchingResponse?.recipes)
        ? normalizeRecipesForDisplay(matchingResponse.recipes)
        : [];
      setRecipes(matchingRecipes);
      setRecipeSourceMode('database');
      setCurrentPage(1);
    } catch {
      // ApiClient surfaces the backend error as toast.
    } finally {
      setCookingRecipeKey(null);
    }
  };

  // Pagination logic
  const filteredRecipes = recipes
    ? recipes
        .map((recipe, recipeIndex) => {
          const matchStats = getRecipeMatchStats(recipe, inventoryItems, peopleCount);
          return { recipe, recipeIndex, matchStats };
        })
        .filter(({ matchStats }) => {
          const activeThreshold = recipeSourceMode === 'generated'
            ? GENERATED_MATCH_THRESHOLD
            : recipeSourceMode === 'database'
              ? DATABASE_MATCH_THRESHOLD
              : 0;
          return matchStats.totalIngredients >= 3 && matchStats.matchPercentage >= activeThreshold;
        })
    : [];

  const totalPages = Math.ceil(filteredRecipes.length / recipesPerPage);
  const startIndex = (currentPage - 1) * recipesPerPage;
  const endIndex = startIndex + recipesPerPage;
  const paginatedRecipes = filteredRecipes.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="recipes-page page-shell">
      <div className="d-flex align-items-center justify-content-between gap-2 page-heading-row">
        <div className="inventory-chip">Matchmaker Results</div>
        <div className="d-flex align-items-end gap-2">
          <Form.Group controlId="peopleCount" className="mb-0">
            <Form.Label className="mb-1">Cooking For</Form.Label>
            <Form.Control
              type="number"
              min={1}
              max={50}
              value={peopleCount}
              onChange={(event) => {
                const parsed = Number.parseInt(event.target.value, 10);
                setPeopleCount(Number.isFinite(parsed) && parsed > 0 ? parsed : 1);
              }}
            />
          </Form.Group>
          <Button className="btn-navy" disabled={!canGenerate} onClick={handleGenerate}>
            Generate Recipes
          </Button>
        </div>
      </div>

      <div className="mt-3 d-flex flex-wrap gap-2 align-items-center recipes-actions">
        {cooldownSeconds > 0 && <Badge bg="dark" className="pill-badge">Try again in {cooldownSeconds}s</Badge>}
      </div>

      {inventoryNames.length === 0 && (
        <Alert variant="warning" className="mt-3">
          Your inventory is empty. Add ingredients first, then generate recipes.
        </Alert>
      )}

      {isLoading && (
        <Alert variant="info" className="mt-3 d-flex align-items-center gap-2 mb-0">
          <Spinner animation="border" size="sm" />
          Building recipe suggestions from your pantry...
        </Alert>
      )}

      {error && (
        <Alert variant="danger" className="mt-3 mb-0">
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" className="mt-3 mb-0">
          {successMessage}
        </Alert>
      )}

      {recipes && recipes.length > 0 && (
        <>
          {(() => {
            const activeThreshold = recipeSourceMode === 'generated'
              ? GENERATED_MATCH_THRESHOLD
              : recipeSourceMode === 'database'
                ? DATABASE_MATCH_THRESHOLD
                : 0;

            return recipes.every((recipe) => {
              const stats = getRecipeMatchStats(recipe, inventoryItems, peopleCount);
              return stats.totalIngredients < 3 || stats.matchPercentage < activeThreshold;
            });
          })() && (
            <Alert variant="warning" className="mt-3">
              {recipeSourceMode === 'generated'
                ? 'None of the generated recipes are a 100% ingredient match with at least 3 recipe ingredients. Try generating again or add more ingredients to inventory.'
                : recipeSourceMode === 'database'
                  ? 'No saved recipe from database meets the 70% ingredient match threshold with at least 3 recipe ingredients.'
                  : 'Showing fallback recipes while Gemini is temporarily unavailable.'}
            </Alert>
          )}
          <Row className="mt-3 g-3">
            {paginatedRecipes.map(({ recipe, recipeIndex, matchStats }) => {
                const recipeType = normalizeRecipeType(recipe.type);
                const meta = cardMeta[recipeType];
                const recipeKey = `${recipe.type}-${recipe.title}-${recipeIndex}`;
                const cookability = getRecipeCookability(recipe, inventoryItems, peopleCount);
                const isCooking = cookingRecipeKey === recipeKey;
                const canCookNow = cookability.canCook && Boolean(recipe.id) && !isLoading && !isCooking;
                const matchPercentage = matchStats.matchPercentage;

                return (
                  <Col key={recipeKey} xs={12} md={4}>
                    <Card className="recipe-card themed-card h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                          <Card.Title className="mb-0">Recipe Card {recipeIndex + 1}</Card.Title>
                          <Badge bg="secondary" className="pill-badge">{meta.tag}</Badge>
                        </div>
                        <div className="mt-2 d-flex gap-2 align-items-center">
                          <Badge bg={matchPercentage === 100 ? 'success' : matchPercentage >= 80 ? 'info' : 'warning'}>
                            {matchPercentage}% match
                          </Badge>
                        </div>
                        <Card.Subtitle className="mt-2 recipe-subtitle">{recipe.title}</Card.Subtitle>
                        <div className="mt-3 recipe-meta">
                          <strong>Preparation Time:</strong> {recipe.preparationTime}
                        </div>
                        <div className="mt-1 recipe-meta">
                          <strong>Base Servings:</strong> {recipe.baseServings}
                        </div>
                        <div className="mt-1 recipe-meta">
                          <strong>Needed for {peopleCount} {peopleCount === 1 ? 'person' : 'people'}:</strong>
                        </div>
                        <ul className="mt-1 mb-0">
                          {(recipe.ingredients ?? []).map((ingredient, index) => {
                            const scaledAmount = ingredient.amount * peopleCount;
                            const readableAmount = formatAmount(scaledAmount);

                            return (
                              <li key={`${recipeType}-ingredient-${index}`}>
                                {ingredient.item}: {readableAmount} {ingredient.unit}
                              </li>
                            );
                          })}
                        </ul>
                        <ol className="mt-2 mb-0 recipe-steps">
                          {(recipe.steps ?? []).map((step, index) => (
                            <li key={`${recipeType}-${index}`}>{step}</li>
                          ))}
                        </ol>
                        {!canCookNow && cookability.missingIngredients.length > 0 && (
                          <div className="mt-3 small text-danger">
                            Missing: {cookability.missingIngredients[0].item} ({formatAmount(cookability.missingIngredients[0].available)} {cookability.missingIngredients[0].availableUnit} available)
                          </div>
                        )}
                        {!recipe.id && (
                          <div className="mt-3 small text-muted">
                            Save this recipe first before cooking with auto deduction.
                          </div>
                        )}
                        <Button
                          className="btn-navy mt-3"
                          disabled={!canCookNow || cookingRecipeKey !== null}
                          onClick={() => handleCook(recipe, recipeKey)}
                        >
                          {isCooking ? 'Cooking...' : 'Cook & Auto Deduct'}
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
          </Row>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-4 d-flex gap-2 align-items-center justify-content-between">
              <Button
                variant="outline-secondary"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                ← Previous
              </Button>
              <span className="text-muted">
                Page {currentPage} of {totalPages} ({filteredRecipes.length} matching recipes)
              </span>
              <Button
                variant="outline-secondary"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
