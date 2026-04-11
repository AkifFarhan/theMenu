import { secrets } from '../secrets';

export type RecipeType = 'quick' | 'healthy' | 'surprise';
export type CuisineType = 'bengali' | 'indian' | 'chinese' | 'italian' | 'mexican';

export const CUISINE_OPTIONS: Array<{ value: CuisineType; label: string }> = [
  { value: 'bengali', label: 'Bengali' },
  { value: 'indian', label: 'Indian' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'italian', label: 'Italian' },
  { value: 'mexican', label: 'Mexican' },
];

export interface RecipeIngredient {
  ingredientId?: number | null;
  item: string;
  amount: number;
  unit: string;
}

export interface GeneratedRecipe {
  id?: number;
  type: RecipeType;
  cuisine?: CuisineType;
  title: string;
  description?: string;
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

interface RecipeResponse {
  recipes: GeneratedRecipe[];
}

const RECIPE_TYPES: RecipeType[] = ['quick', 'healthy', 'surprise'];
const DEFAULT_CUISINE: CuisineType = 'indian';

function normalizeCuisine(cuisine: unknown, fallback?: CuisineType): CuisineType | undefined {
  const normalized = String(cuisine ?? '').trim().toLowerCase();
  if (CUISINE_OPTIONS.some((option) => option.value === normalized)) {
    return normalized as CuisineType;
  }

  return fallback;
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

function parseRecipeResponseWithRecovery(text: string): Partial<RecipeResponse> {
  const extracted = extractJsonBlock(text);

  try {
    const direct = JSON.parse(extracted) as Partial<RecipeResponse>;
    if (direct && typeof direct === 'object') {
      return direct;
    }
  } catch {
    // Continue to recovery mode.
  }

  const sanitized = sanitizeJsonText(extracted);
  try {
    const recovered = JSON.parse(sanitized) as Partial<RecipeResponse>;
    if (recovered && typeof recovered === 'object') {
      return recovered;
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

async function generateViaBackendProxy(prompt: string): Promise<string> {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Authentication required. Please log in again.');
  }

  const response = await fetch(`${secrets.backendEndpoint}/api/recipes/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    let message = `Gemini proxy failed (${response.status})`;
    try {
      const payload = (await response.json()) as {
        message?: string;
        retry_after_seconds?: number;
        error?: { error?: { message?: string } };
      };
      if (payload?.error?.error?.message) {
        message = payload.error.error.message;
      } else if (payload?.message) {
        message = payload.message;
      }

      if (response.status === 429 && Number.isFinite(payload?.retry_after_seconds)) {
        message = `${message} Retry after ${payload.retry_after_seconds}s.`;
      }
    } catch {
      // Ignore JSON parsing issues for proxy errors.
    }

    throw new Error(message);
  }

  const payload = (await response.json()) as { text?: string };
  if (typeof payload.text !== 'string' || payload.text.trim() === '') {
    throw new Error('Gemini returned an empty payload.');
  }

  return payload.text;
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

function preferredUnitMap(hints: Array<{ name: string; unit: string }>): Map<string, 'g' | 'ml' | 'piece'> {
  const map = new Map<string, 'g' | 'ml' | 'piece'>();

  for (const hint of hints) {
    const key = String(hint?.name ?? '').trim().toLowerCase();
    const normalized = normalizeToDatabaseUnit(1, String(hint?.unit ?? ''));
    if (key && normalized) {
      map.set(key, normalized.unit);
    }
  }

  return map;
}

function makeIngredient(item: string, unitPreference: 'g' | 'ml' | 'piece' | undefined, fallbackAmount: number): RecipeIngredient {
  const name = item.trim() || 'Pantry item';
  const unit = unitPreference ?? 'piece';

  if (unit === 'g') {
    return { item: name, amount: Math.max(40, fallbackAmount), unit: 'g' };
  }

  if (unit === 'ml') {
    return { item: name, amount: Math.max(30, fallbackAmount), unit: 'ml' };
  }

  return { item: name, amount: Math.max(1, Math.round(fallbackAmount / 50)), unit: 'piece' };
}

function buildRecipe(
  type: RecipeType,
  inventory: string[],
  preferredUnits: Map<string, 'g' | 'ml' | 'piece'>,
  cuisine: CuisineType
): GeneratedRecipe {
  const picks = inventory.slice(0, 5);

  const first = picks[0] ?? 'Mixed vegetables';
  const second = picks[1] ?? 'Rice';
  const third = picks[2] ?? 'Protein';
  const fourth = picks[3] ?? 'Herbs';

  const ingredientPool = [first, second, third, fourth];
  const ingredients = ingredientPool.map((item, index) =>
    makeIngredient(item, preferredUnits.get(item.toLowerCase()), 80 + index * 20)
  );

  if (type === 'quick') {
    return {
      type,
      cuisine,
      title: `Quick ${first} Stir Fry`,
      description: `Fast pantry recipe centered on ${first}.`,
      preparationTime: '15 mins',
      baseServings: 1,
      ingredients,
      steps: [
        `Prep ${first}, ${second}, and ${third} into small pieces.`,
        'Cook on medium-high heat for 8 to 10 minutes, stirring often.',
        'Season to taste and serve immediately.',
      ],
    };
  }

  if (type === 'healthy') {
    return {
      type,
      cuisine,
      title: `${second} Power Bowl`,
      description: `Balanced one-person bowl with ${second} and ${third}.`,
      preparationTime: '20 mins',
      baseServings: 1,
      ingredients,
      steps: [
        `Lightly steam or roast ${first} and ${second}.`,
        `Combine with ${third} and ${fourth} in a bowl.`,
        'Finish with a light dressing and serve warm.',
      ],
    };
  }

  return {
    type,
    cuisine,
    title: `Surprise ${third} Wrap`,
    description: `Creative wrap using ${third} and pantry staples.`,
    preparationTime: '25 mins',
    baseServings: 1,
    ingredients,
    steps: [
      `Saute ${first}, ${third}, and ${fourth} until fragrant.`,
      `Layer the cooked filling with ${second} in a wrap or bread.`,
      'Roll, slice, and serve with your preferred sauce.',
    ],
  };
}

export async function getRecipesFromInventory(
  inventoryArray: string[],
  inventoryUnitHints: Array<{ name: string; unit: string }> = [],
  cuisine: CuisineType = DEFAULT_CUISINE
): Promise<RecipeResponse> {
  if (!Array.isArray(inventoryArray) || inventoryArray.length === 0) {
    throw new Error('Please add ingredients to your inventory first.');
  }

  const cleanedInventory = inventoryArray
    .map((item) => item.trim())
    .filter(Boolean);

  if (cleanedInventory.length === 0) {
    throw new Error('Please add ingredients to your inventory first.');
  }

  const preferredUnits = preferredUnitMap(inventoryUnitHints);
  const normalizedCuisine = normalizeCuisine(cuisine, DEFAULT_CUISINE) ?? DEFAULT_CUISINE;
  const cuisineLabel = CUISINE_OPTIONS.find((option) => option.value === normalizedCuisine)?.label ?? normalizedCuisine;

  const ingredients = cleanedInventory.join(', ');
  const unitHintText = inventoryUnitHints
    .map((hint) => {
      const name = String(hint?.name ?? '').trim();
      const normalized = normalizeToDatabaseUnit(1, String(hint?.unit ?? ''));
      return name && normalized ? `${name} -> ${normalized.unit}` : '';
    })
    .filter(Boolean)
    .join(', ');

  const prompt = `I have these ingredients: ${ingredients}.
Role: You are a Culinary Data Engineer Agent.

Task: Based on the provided ingredient list, suggest 3 distinct recipes classified as quick, healthy, and surprise with a ${cuisineLabel} cuisine focus.

Core Logic Rules:
- The Single-Person Rule is mandatory: calculate all ingredient measurements for exactly one person.
- Data integrity is mandatory: ingredients must be structured as item, amount, unit with amount as a positive number.
- Ingredient unit policy is mandatory for JSON ingredients: only use database units \`g\`, \`ml\`, or \`piece\`.
- For inventory ingredients, use the exact preferred base unit from this mapping when present: ${unitHintText || 'no mapping provided'}.
- If you would normally write tsp/tbsp/cup/cloves, convert them first and output in the JSON ingredient list as \`ml\` or \`piece\`.
- Pantry matching is mandatory: use only provided inventory ingredients, but common staples (salt, water, oil) are allowed.
- Structure is mandatory: each recipe must have exactly 3 concise steps.
- Instruction text may use user-friendly wording and convenient kitchen measurements for readability.
- Set the cuisine field on every recipe to "${normalizedCuisine}".

Respond with ONLY valid JSON in this exact structure:
{
  "recipes": [
    {
      "type": "quick",
      "cuisine": "${normalizedCuisine}",
      "title": "",
      "description": "",
      "preparationTime": "15 mins",
      "baseServings": 1,
      "ingredients": [
        { "item": "", "amount": 120, "unit": "g" }
      ],
      "steps": ["", "", ""]
    },
    {
      "type": "healthy",
      "cuisine": "${normalizedCuisine}",
      "title": "",
      "description": "",
      "preparationTime": "20 mins",
      "baseServings": 1,
      "ingredients": [
        { "item": "", "amount": 100, "unit": "g" }
      ],
      "steps": ["", "", ""]
    },
    {
      "type": "surprise",
      "cuisine": "${normalizedCuisine}",
      "title": "",
      "description": "",
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
    const rawText = await generateViaBackendProxy(prompt);
    const parsed = parseRecipeResponseWithRecovery(rawText);
    const incomingRecipes = Array.isArray(parsed.recipes) ? parsed.recipes : [];

    const recipeByType = new Map<RecipeType, GeneratedRecipe>();
    for (const type of RECIPE_TYPES) {
      const match = incomingRecipes.find((recipe) => recipe?.type === type);
      if (match) {
        const normalizedIngredients = Array.isArray(match.ingredients)
          ? match.ingredients
              .map((ingredient) => {
                const normalized = normalizeToDatabaseUnit(Number(ingredient?.amount ?? 0), String(ingredient?.unit ?? ''));
                const item = String(ingredient?.item ?? '').trim();
                if (!item || !normalized) {
                  return null;
                }

                const preferred = preferredUnits.get(item.toLowerCase());
                return {
                  item,
                  amount: normalized.amount,
                  unit: preferred ?? normalized.unit,
                } as RecipeIngredient;
              })
              .filter((ingredient): ingredient is RecipeIngredient => ingredient !== null)
          : [];

        recipeByType.set(type, {
          type,
          cuisine: normalizeCuisine(match.cuisine, normalizedCuisine) ?? normalizedCuisine,
          title: String(match.title ?? `${type} recipe`).trim() || `${type} recipe`,
          description: String(match.description ?? '').trim() || `${type} recipe for one person.`,
          preparationTime: String(match.preparationTime ?? '20 mins').trim() || '20 mins',
          baseServings: 1,
          ingredients: normalizedIngredients,
          steps: Array.isArray(match.steps)
            ? match.steps.map((step) => String(step).trim()).filter(Boolean).slice(0, 3)
            : [],
        });
      }
    }

    const recipes = RECIPE_TYPES.map(
      (type) => recipeByType.get(type) ?? buildRecipe(type, cleanedInventory, preferredUnits, normalizedCuisine)
    );
    return { recipes };
  } catch (error: unknown) {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('permission_denied') || message.includes('denied access') || message.includes('403')) {
        throw new Error('Gemini request was rejected by Google (403).');
      }

      if (message.includes('quota') || message.includes('rate') || message.includes('429')) {
        throw new Error('Gemini rate limit reached (429). Wait a bit and try again.');
      }

      if (message.includes('high demand') || message.includes('try again later') || message.includes('unavailable') || message.includes('503')) {
        throw new Error('Gemini is experiencing high demand (503). Please wait 30s and try again.');
      }

      if (message.includes('gemini_format_error') || message.includes('json')) {
        throw new Error('Gemini returned an unexpected format. Showing local fallback recipes for now.');
      }

      throw new Error(`Gemini request failed: ${error.message}`);
    }

    throw new Error('Gemini request failed.');
  }
}
