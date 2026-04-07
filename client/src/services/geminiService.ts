import { GoogleGenerativeAI } from '@google/generative-ai';

export type RecipeType = 'quick' | 'healthy' | 'surprise';

export interface RecipeIngredient {
  item: string;
  amount: number;
  unit: string;
}

export interface GeneratedRecipe {
  type: RecipeType;
  title: string;
  preparationTime: string;
  baseServings: 1;
  ingredients: RecipeIngredient[];
  steps: string[];
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

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY. Add it to client/.env.');
  }

  return new GoogleGenerativeAI(apiKey);
}

function normalizeIngredient(entry: Partial<RecipeIngredient> | undefined): RecipeIngredient | null {
  const item = String(entry?.item ?? '').trim();
  const unit = String(entry?.unit ?? '').trim();
  const amount = Number(entry?.amount);

  if (!item || !unit || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return {
    item,
    amount,
    unit,
  };
}

function normalizeRecipe(recipe: Partial<GeneratedRecipe> | undefined, fallbackType: RecipeType): GeneratedRecipe {
  const normalizedType = RECIPE_TYPES.includes(recipe?.type as RecipeType)
    ? (recipe?.type as RecipeType)
    : fallbackType;

  const ingredients = Array.isArray(recipe?.ingredients)
    ? recipe.ingredients
        .map((entry) => normalizeIngredient(entry))
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

export async function getRecipesFromInventory(inventoryArray: string[]): Promise<GeminiRecipeResponse> {
  if (!Array.isArray(inventoryArray) || inventoryArray.length === 0) {
    throw new Error('Please add ingredients to your inventory first.');
  }

  const ingredients = inventoryArray
    .map((item) => item.trim())
    .filter(Boolean)
    .join(', ');

  const genAI = getGeminiClient();

  const prompt = `I have these ingredients: ${ingredients}.
Role: You are a Culinary Data Engineer Agent.

Task: Based on the provided ingredient list, suggest 3 distinct recipes classified as quick, healthy, and surprise.
Healthy Output Requirement: Exactly 2 recipes must be healthy-focused. The "healthy" recipe and the "surprise" recipe must both be healthy choices.

Core Logic Rules:
- The Single-Person Rule is mandatory: calculate all ingredient measurements for exactly one person.
- Data integrity is mandatory: ingredients must be structured as item, amount, unit with amount as a positive number.
- Pantry matching is mandatory: use only provided inventory ingredients, but common staples (salt, water, oil) are allowed.
- Healthy recipe rules are mandatory for "healthy" and "surprise": keep them nutrient-dense, use minimal oil, and avoid deep-fried or heavily processed ingredients.
- Structure is mandatory: each recipe must have exactly 3 concise steps.

Respond with ONLY valid JSON in this exact structure:
{
  "recipes": [
    {
      "type": "quick",
      "title": "",
      "preparationTime": "15 mins",
      "baseServings": 1,
      "ingredients": [
        { "item": "", "amount": 0.5, "unit": "cup" }
      ],
      "steps": ["", "", ""]
    },
    {
      "type": "healthy",
      "title": "",
      "preparationTime": "20 mins",
      "baseServings": 1,
      "ingredients": [
        { "item": "", "amount": 100, "unit": "grams" }
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
    const jsonText = extractJsonBlock(text);
    const parsed = JSON.parse(jsonText) as Partial<GeminiRecipeResponse>;

    const recipeByType = new Map<RecipeType, GeneratedRecipe>();
    const incomingRecipes = Array.isArray(parsed.recipes) ? parsed.recipes : [];

    for (const fallbackType of RECIPE_TYPES) {
      const match = incomingRecipes.find((recipe) => recipe?.type === fallbackType);
      recipeByType.set(fallbackType, normalizeRecipe(match, fallbackType));
    }

    return {
      recipes: RECIPE_TYPES.map((type) => recipeByType.get(type) as GeneratedRecipe),
    };
  } catch (error: unknown) {
    console.error('Gemini Error:', error);

    if (error instanceof SyntaxError) {
      throw new Error('Gemini returned an unexpected format. Please try again.');
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

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
