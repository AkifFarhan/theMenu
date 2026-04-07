import { GoogleGenerativeAI } from '@google/generative-ai';

export type RecipeType = 'quick' | 'healthy' | 'surprise';

export interface RecipeIngredient {
  ingredientId?: number | null;
  item: string;
  amount: number;
  unit: string;
}

export interface GeneratedRecipe {
  id?: number;
  type: RecipeType;
  title: string;
  preparationTime: string;
  baseServings: 1;
  ingredients: RecipeIngredient[];
  steps: string[];
  canCook?: boolean;
  missingIngredients?: Array<{
    item: string;
    required: number;
    unit: string;
    available: number;
    availableUnit: string;
  }>;
}

interface GeminiRecipeResponse {
  recipes: GeneratedRecipe[];
}

const RECIPE_TYPES: RecipeType[] = ['quick', 'healthy', 'surprise'];

const MODEL_CANDIDATES = ['gemini-2.0-flash', 'gemini-flash-latest', 'gemini-2.5-flash'] as const;

function isModelNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes('404') || message.includes('not found') || message.includes('models/');
}

function extractJsonBlock(text: string): string {
  const fencedJsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fencedJsonMatch?.[1]) {
    return fencedJsonMatch[1].trim();
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }

  return text;
}

function sanitizeJsonText(input: string): string {
  return input
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,\s*([}\]])/g, '$1')
    .trim();
}

function parseGeminiResponse(text: string): Partial<GeminiRecipeResponse> {
  const extracted = extractJsonBlock(text);

  const direct = JSON.parse(extracted) as Partial<GeminiRecipeResponse>;
  if (direct && typeof direct === 'object') {
    return direct;
  }

  throw new Error('Invalid Gemini JSON payload');
}

function parseGeminiResponseWithRecovery(text: string): Partial<GeminiRecipeResponse> {
  try {
    return parseGeminiResponse(text);
  } catch {
    const extracted = extractJsonBlock(text);
    const sanitized = sanitizeJsonText(extracted);

    try {
      const parsed = JSON.parse(sanitized) as Partial<GeminiRecipeResponse>;
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch {
      // Continue to array fallback.
    }

    const firstBracket = sanitized.indexOf('[');
    const lastBracket = sanitized.lastIndexOf(']');
    if (firstBracket >= 0 && lastBracket > firstBracket) {
      const maybeArray = sanitized.slice(firstBracket, lastBracket + 1);
      try {
        const parsedArray = JSON.parse(maybeArray) as unknown;
        if (Array.isArray(parsedArray)) {
          return { recipes: parsedArray as GeneratedRecipe[] };
        }
      } catch {
        // Fall through.
      }
    }

    throw new Error('GEMINI_FORMAT_ERROR');
  }
}

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY. Add it to client/.env.');
  }

  return new GoogleGenerativeAI(apiKey);
}

function normalizeToDatabaseUnit(amount: number, unit: string): { amount: number; unit: 'g' | 'ml' | 'piece' } | null {
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const cleanUnit = unit.trim().toLowerCase().replace(/[\s.]/g, '');

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
    clove: 1,
    cloves: 1,
    slice: 1,
    slices: 1,
  };

  if (gramsMap[cleanUnit] !== undefined) {
    return {
      amount: Number((amount * gramsMap[cleanUnit]).toFixed(2)),
      unit: 'g',
    };
  }

  if (millilitersMap[cleanUnit] !== undefined) {
    return {
      amount: Number((amount * millilitersMap[cleanUnit]).toFixed(2)),
      unit: 'ml',
    };
  }

  if (pieceMap[cleanUnit] !== undefined) {
    return {
      amount: Number((amount * pieceMap[cleanUnit]).toFixed(2)),
      unit: 'piece',
    };
  }

  return null;
}

export async function getRecipesFromInventory(
  inventoryArray: string[],
  inventoryUnitHints: Array<{ name: string; unit: string }> = []
): Promise<GeminiRecipeResponse> {
  if (!Array.isArray(inventoryArray) || inventoryArray.length === 0) {
    throw new Error('Please add ingredients to your inventory first.');
  }

  const ingredients = inventoryArray
    .map((item) => item.trim())
    .filter(Boolean)
    .join(', ');

  const unitHintMap = new Map<string, 'g' | 'ml' | 'piece'>();
  for (const hint of inventoryUnitHints) {
    const name = String(hint?.name ?? '').trim().toLowerCase();
    const normalized = normalizeToDatabaseUnit(1, String(hint?.unit ?? ''));
    if (name && normalized) {
      unitHintMap.set(name, normalized.unit);
    }
  }

  const unitHintText = inventoryUnitHints
    .map((hint) => {
      const name = String(hint?.name ?? '').trim();
      const normalized = normalizeToDatabaseUnit(1, String(hint?.unit ?? ''));
      return name && normalized ? `${name} -> ${normalized.unit}` : '';
    })
    .filter(Boolean)
    .join(', ');

  const genAI = getGeminiClient();

  const prompt = `I have these ingredients: ${ingredients}.
Role: You are a Culinary Data Engineer Agent.

Task: Based on the provided ingredient list, suggest 3 distinct recipes classified as quick, healthy, and surprise.

Core Logic Rules:
- The Single-Person Rule is mandatory: calculate all ingredient measurements for exactly one person.
- Data integrity is mandatory: ingredients must be structured as item, amount, unit with amount as a positive number.
- Ingredient unit policy is mandatory for JSON ingredients: only use database units \`g\`, \`ml\`, or \`piece\`.
- For inventory ingredients, use the exact preferred base unit from this mapping when present: ${unitHintText || 'no mapping provided'}.
- If you would normally write tsp/tbsp/cup/cloves, convert them first and output in the JSON ingredient list as \`ml\` or \`piece\`.
- Pantry matching is mandatory: use only provided inventory ingredients, but common staples (salt, water, oil) are allowed.
- Structure is mandatory: each recipe must have exactly 3 concise steps.
- Instruction text may use user-friendly wording and convenient kitchen measurements for readability.

Respond with ONLY valid JSON in this exact structure:
{
  "recipes": [
    {
      "type": "quick",
      "title": "",
      "preparationTime": "15 mins",
      "baseServings": 1,
      "ingredients": [
        { "item": "", "amount": 120, "unit": "g" }
      ],
      "steps": ["", "", ""]
    },
    {
      "type": "healthy",
      "title": "",
      "preparationTime": "20 mins",
      "baseServings": 1,
      "ingredients": [
        { "item": "", "amount": 100, "unit": "g" }
      ],
      "steps": ["", "", ""]
    },
    {
      "type": "surprise",
      "title": "",
      "preparationTime": "25 mins",
      "baseServings": 1,
      "ingredients": [
        { "item": "", "amount": 1, "unit": "piece" }
      ],
      "steps": ["", "", ""]
    }
  ]
}`;

  try {
    let result: Awaited<ReturnType<ReturnType<GoogleGenerativeAI['getGenerativeModel']>['generateContent']>> | null = null;

    for (const modelName of MODEL_CANDIDATES) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });
        break;
      } catch (modelError: unknown) {
        if (isModelNotFoundError(modelError)) {
          continue;
        }
        throw modelError;
      }
    }

    if (!result) {
      throw new Error('No available Gemini model was found for this API key.');
    }

    const response = await result.response;
    const text = response.text();
    const parsed = parseGeminiResponseWithRecovery(text);

    const recipeByType = new Map<RecipeType, GeneratedRecipe>();
    const incomingRecipes = Array.isArray(parsed.recipes) ? parsed.recipes : [];

    for (const fallbackType of RECIPE_TYPES) {
      const match = incomingRecipes.find((recipe) => recipe?.type === fallbackType);
      recipeByType.set(fallbackType, normalizeRecipe(match, fallbackType, unitHintMap));
    }

    return {
      recipes: RECIPE_TYPES.map((type) => recipeByType.get(type) as GeneratedRecipe),
    };
  } catch (error: unknown) {
    console.error('Gemini Error:', error);

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes('gemini_format_error') || message.includes('invalid gemini json payload')) {
        throw new Error('Gemini returned an unexpected format. Showing local fallback recipes for now.');
      }

      if (message.includes('reported as leaked') || message.includes('api key was reported as leaked')) {
        throw new Error('Gemini API key is blocked because it was reported as leaked. Generate a new key and update VITE_GEMINI_API_KEY.');
      }

      if (message.includes('api key') || message.includes('permission_denied') || message.includes('403')) {
        throw new Error('Gemini key/config issue (403). Check if your API key is valid and Generative Language API is enabled.');
      }

      if (message.includes('429') || message.includes('quota') || message.includes('rate')) {
        throw new Error('Gemini rate limit reached (429). Wait a bit and try again.');
      }

      if (message.includes('404') || message.includes('not found')) {
        throw new Error('Gemini model is unavailable for this key (404). Use a supported model or key/project.');
      }

      throw new Error(`Gemini request failed: ${error.message}`);
    }

    throw new Error("Sorry, I couldn't cook up a recipe right now.");
  }
}

function normalizeRecipe(
  recipe: Partial<GeneratedRecipe> | undefined,
  fallbackType: RecipeType,
  preferredUnitByIngredient: Map<string, 'g' | 'ml' | 'piece'>
): GeneratedRecipe {
  const normalizedType = RECIPE_TYPES.includes(recipe?.type as RecipeType)
    ? (recipe?.type as RecipeType)
    : fallbackType;

  const ingredients = Array.isArray(recipe?.ingredients)
    ? recipe.ingredients
        .map((entry) => normalizeIngredientWithPreference(entry, preferredUnitByIngredient))
        .filter((entry): entry is RecipeIngredient => entry !== null)
    : [];

  const normalizedSteps = Array.isArray(recipe?.steps)
    ? recipe.steps.map((step) => String(step).trim()).filter(Boolean).slice(0, 3)
    : [];

  const fallbackSteps = ['Prepare your ingredients.', 'Cook with medium heat until done.', 'Serve immediately.'];
  const steps = normalizedSteps.length === 3 ? normalizedSteps : fallbackSteps;

  return {
    type: normalizedType,
    title: String(recipe?.title ?? `${fallbackType} recipe`).trim() || `${fallbackType} recipe`,
    preparationTime: String(recipe?.preparationTime ?? '20 mins').trim() || '20 mins',
    baseServings: 1,
    ingredients,
    steps,
  };
}

function normalizeIngredientWithPreference(
  entry: Partial<RecipeIngredient> | undefined,
  preferredUnitByIngredient: Map<string, 'g' | 'ml' | 'piece'>
): RecipeIngredient | null {
  const item = String(entry?.item ?? '').trim();
  const unit = String(entry?.unit ?? '').trim();
  const amount = Number(entry?.amount);

  const normalized = normalizeToDatabaseUnit(amount, unit);
  if (!item || !normalized) {
    return null;
  }

  const preferredUnit = preferredUnitByIngredient.get(item.toLowerCase());
  const aligned = alignToPreferredUnit(normalized.amount, normalized.unit, preferredUnit, item);

  return {
    item,
    amount: aligned.amount,
    unit: aligned.unit,
  };
}

function alignToPreferredUnit(
  amount: number,
  unit: 'g' | 'ml' | 'piece',
  preferredUnit: 'g' | 'ml' | 'piece' | undefined,
  ingredientName: string
): { amount: number; unit: 'g' | 'ml' | 'piece' } {
  if (!preferredUnit || preferredUnit === unit) {
    return { amount, unit };
  }

  const direct = convertBetweenBaseUnits(amount, unit, preferredUnit);
  if (direct !== null) {
    return { amount: Number(direct.toFixed(2)), unit: preferredUnit };
  }

  if (unit === 'piece' && preferredUnit === 'g') {
    const approx = approximatePieceToGrams(ingredientName);
    if (approx !== null) {
      return { amount: Number((amount * approx).toFixed(2)), unit: 'g' };
    }
  }

  return { amount, unit };
}

function convertBetweenBaseUnits(amount: number, fromUnit: 'g' | 'ml' | 'piece', toUnit: 'g' | 'ml' | 'piece'): number | null {
  if (fromUnit === toUnit) {
    return amount;
  }

  // Keep only safe conversions in same physical domain.
  if ((fromUnit === 'g' && toUnit === 'g') || (fromUnit === 'ml' && toUnit === 'ml') || (fromUnit === 'piece' && toUnit === 'piece')) {
    return amount;
  }

  return null;
}

function approximatePieceToGrams(ingredientName: string): number | null {
  const name = ingredientName.toLowerCase();
  if (name.includes('onion')) return 110;
  if (name.includes('tomato')) return 120;
  if (name.includes('potato')) return 150;
  if (name.includes('carrot')) return 60;
  if (name.includes('garlic')) return 3;
  return null;
}
