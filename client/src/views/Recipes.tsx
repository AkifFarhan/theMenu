import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Row, Spinner } from 'react-bootstrap';
import { getRecipesFromInventory, type GeneratedRecipe } from '../services/geminiService';

interface Item {
  id: number;
  name: string;
  quantity: string;
  category?: string;
}

interface RecipeBuckets {
  quick: GeneratedRecipe;
  healthy: GeneratedRecipe;
  surprise: GeneratedRecipe;
}

function localFallbackRecipes(items: string[]): RecipeBuckets {
  const base = items.slice(0, 4);
  const core = base.length > 0 ? base.join(', ') : 'pantry staples';

  return {
    quick: {
      title: `Fast Skillet with ${base[0] || 'Pantry Mix'}`,
      preparationTime: '15-20 minutes',
      steps: [
        `Chop ${core} into bite-sized pieces.`,
        'Saute everything in a hot pan with oil, salt, and pepper.',
        'Finish with a squeeze of lemon or soy sauce and serve warm.',
      ],
    },
    healthy: {
      title: `${base[1] || 'Veggie'} Power Bowl`,
      preparationTime: '20-25 minutes',
      steps: [
        `Steam or lightly roast ${core}.`,
        'Toss with a light dressing using olive oil, vinegar, and herbs.',
        'Top with protein from your inventory and serve as a bowl.',
      ],
    },
    surprise: {
      title: `Creative ${base[2] || 'Kitchen'} Wrap`,
      preparationTime: '20 minutes',
      steps: [
        `Cook and season ${core} until aromatic.`,
        'Layer into bread, wrap, or lettuce leaves with crunchy toppings.',
        'Roll, slice, and serve with a quick dip from your pantry.',
      ],
    },
  };
}

function loadItems(): Item[] {
  try {
    const stored = localStorage.getItem('inventoryItems');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

const cardMeta = {
  quick: { title: 'Recipe Card 1', tag: 'Quick' },
  healthy: { title: 'Recipe Card 2', tag: 'Healthy' },
  surprise: { title: 'Recipe Card 3', tag: 'Surprise' },
} as const;

export default function Recipes() {
  const [recipes, setRecipes] = useState<RecipeBuckets | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldownSeconds((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const inventoryNames = useMemo(() => loadItems().map((item) => item.name), []);
  const canGenerate = inventoryNames.length > 0 && !isLoading && cooldownSeconds === 0;

  const handleGenerate = async () => {
    setError(null);
    setCooldownSeconds(5);
    setIsLoading(true);

    try {
      const generated = await getRecipesFromInventory(inventoryNames);
      setRecipes(generated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate recipes right now.';
      if (message.includes('429')) {
        setRecipes(localFallbackRecipes(inventoryNames));
        setError('Gemini is rate-limited right now. Showing local fallback recipes.');
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
        <Button className="btn-navy" disabled={!canGenerate} onClick={handleGenerate}>
          Generate Recipes
        </Button>
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

      {recipes && (
        <Row className="mt-3 g-3">
          {(Object.keys(cardMeta) as Array<keyof RecipeBuckets>).map((key) => {
            const recipe = recipes[key];
            const meta = cardMeta[key];

            return (
              <Col key={key} xs={12} md={4}>
                <Card className="recipe-card themed-card h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <Card.Title className="mb-0">{meta.title}</Card.Title>
                      <Badge bg="secondary" className="pill-badge">{meta.tag}</Badge>
                    </div>
                    <Card.Subtitle className="mt-2 recipe-subtitle">{recipe.title}</Card.Subtitle>
                    <div className="mt-3 recipe-meta">
                      <strong>Preparation Time:</strong> {recipe.preparationTime}
                    </div>
                    <ol className="mt-2 mb-0 recipe-steps">
                      {recipe.steps.map((step, index) => (
                        <li key={`${key}-${index}`}>{step}</li>
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
