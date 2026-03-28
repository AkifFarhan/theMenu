import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeneratedRecipe {
  title: string;
  preparationTime: string;
  steps: string[];
}

interface GeminiRecipeResponse {
  quick: GeneratedRecipe;
  healthy: GeneratedRecipe;
  surprise: GeneratedRecipe;
}

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
Suggest 3 distinct recipes and classify them as quick, healthy, and surprise.
Respond with ONLY valid JSON in this exact structure:
{
  "quick": { "title": "", "preparationTime": "", "steps": ["", "", ""] },
  "healthy": { "title": "", "preparationTime": "", "steps": ["", "", ""] },
  "surprise": { "title": "", "preparationTime": "", "steps": ["", "", ""] }
}
Rules:
- Keep each recipe concise.
- Each recipe must include exactly 3 simple steps.
- Use only ingredients that are plausible given the pantry list.`;

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
    const parsed = JSON.parse(jsonText) as GeminiRecipeResponse;

    return parsed;
  } catch (error: unknown) {
    console.error('Gemini Error:', error);

    if (error instanceof SyntaxError) {
      throw new Error('Gemini returned an unexpected format. Please try again.');
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

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
