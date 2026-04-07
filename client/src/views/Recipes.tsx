import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { getRecipesFromInventory, type GeneratedRecipe } from '../services/geminiService';
import ApiClient from '../api';

interface Item {
  id: number;
  name: string;
  quantity: string;
  category?: string;
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

export default function Recipes() {
  const [recipes, setRecipes] = useState<GeneratedRecipe[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [inventoryNames, setInventoryNames] = useState<string[]>([]);
  const [peopleCount, setPeopleCount] = useState(1);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const response = await api.getInventory();
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
              ? (savedRecipesResponse.recipes as GeneratedRecipe[])
              : [];

            if (savedRecipes.length > 0) {
              setRecipes(savedRecipes);
            }
          } catch {
            // Keep page usable if saved recipe lookup fails.
          }
        }
      } catch {
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

  const handleGenerate = async () => {
    setError(null);
    setCooldownSeconds(5);
    setIsLoading(true);

    try {
      const generated = await getRecipesFromInventory(inventoryNames);

      try {
        const savedResponse = await api.saveGeneratedRecipes(generated.recipes);
        const savedRecipes = Array.isArray(savedResponse?.recipes)
          ? (savedResponse.recipes as GeneratedRecipe[])
          : generated.recipes;
        setRecipes(savedRecipes);
      } catch (saveErr: unknown) {
        setRecipes(generated.recipes);

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
      const message = err instanceof Error ? err.message : 'Failed to generate recipes right now.';
      if (message.includes('429')) {
        const fallbackRecipes = localFallbackRecipes(inventoryNames);
        setRecipes(fallbackRecipes);
        setError('Gemini is rate-limited right now. Showing local fallback recipes.');
      } else if (
        message.includes('403') ||
        message.toLowerCase().includes('api key') ||
        message.toLowerCase().includes('permission') ||
        message.toLowerCase().includes('leaked') ||
        message.toLowerCase().includes('missing vite_gemini_api_key')
      ) {
        const fallbackRecipes = localFallbackRecipes(inventoryNames);
        setRecipes(fallbackRecipes);
        setError(`${message} Showing local fallback recipes for now.`);
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
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
          Chef Gemini is checking the pantry...
        </Alert>
      )}

      {error && (
        <Alert variant="danger" className="mt-3 mb-0">
          {error}
        </Alert>
      )}

      {recipes && recipes.length > 0 && (
        <Row className="mt-3 g-3">
          {recipes.map((recipe, recipeIndex) => {
            const meta = cardMeta[recipe.type];
            const recipeKey = `${recipe.type}-${recipe.title}-${recipeIndex}`;

            return (
              <Col key={recipeKey} xs={12} md={4}>
                <Card className="recipe-card themed-card h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <Card.Title className="mb-0">Recipe Card {recipeIndex + 1}</Card.Title>
                      <Badge bg="secondary" className="pill-badge">{meta.tag}</Badge>
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
                      {recipe.ingredients.map((ingredient, index) => {
                        const scaledAmount = ingredient.amount * peopleCount;
                        const readableAmount = Number.isInteger(scaledAmount)
                          ? scaledAmount.toString()
                          : scaledAmount.toFixed(2).replace(/\.00$/, '');

                        return (
                          <li key={`${recipe.type}-ingredient-${index}`}>
                            {ingredient.item}: {readableAmount} {ingredient.unit}
                          </li>
                        );
                      })}
                    </ul>
                    <ol className="mt-2 mb-0 recipe-steps">
                      {recipe.steps.map((step, index) => (
                        <li key={`${recipe.type}-${index}`}>{step}</li>
                      ))}
                    </ol>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}
