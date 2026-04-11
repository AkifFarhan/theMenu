import { useEffect, useState } from 'react';
import { Alert, Button, Card, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ApiClient from '../api';

const api = new ApiClient();

interface DashboardSummary {
  inventoryCount: number;
  recipesReady: number;
}

export default function Home() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary>({ inventoryCount: 0, recipesReady: 0 });
  const [userName, setUserName] = useState('Chef');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [summaryResponse, meResponse, matchingRecipesResponse] = await Promise.all([
          api.getDashboardSummary(),
          api.getMe(),
          api.getMatchingRecipes(),
        ]);

        const recipesReady = Array.isArray(matchingRecipesResponse?.recipes)
          ? matchingRecipesResponse.recipes.length
          : Number(summaryResponse.recipesReady || 0);

        setSummary({
          inventoryCount: Number(summaryResponse.inventoryCount || 0),
          recipesReady,
        });
        setUserName(meResponse?.user?.username || 'Chef');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load dashboard summary.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <section className="home-hero">
      <div className="home-hero__overlay" />
      <div className="home-hero__content d-flex flex-column align-items-center">
        <button className="home-welcome-btn" type="button">
          Welcome back, {userName}
        </button>

        {isLoading && (
          <Alert variant="info" className="mb-4 d-flex align-items-center gap-2">
            <Spinner animation="border" size="sm" />
            Loading your kitchen dashboard...
          </Alert>
        )}

        {error && (
          <Alert variant="warning" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="d-flex gap-4 flex-wrap" style={{ maxWidth: 1000, width: '100%', justifyContent: 'center' }}>
          <Card className="home-card" style={{ width: 300, cursor: 'pointer' }} onClick={() => navigate('/inventory')}>
            <Card.Body className="text-center">
              <div style={{ fontSize: 48 }}>🧊</div>
              <Card.Title className="mt-2">My Inventory</Card.Title>
              <Card.Text>You have {summary.inventoryCount} items.</Card.Text>
              <Button
                variant="link"
                className="home-btn home-btn--navy"
                onClick={() => navigate('/inventory')}
              >
                Open
              </Button>
            </Card.Body>
          </Card>

          <Card className="home-card" style={{ width: 300, cursor: 'pointer' }} onClick={() => navigate('/add-food')}>
            <Card.Body className="text-center">
              <div style={{ fontSize: 48 }}>＋</div>
              <Card.Title className="mt-2">Add Food</Card.Title>
              <Card.Text>Paste grocery lists or scan.</Card.Text>
              <Button
                variant="link"
                className="home-btn home-btn--green"
                onClick={() => navigate('/add-food')}
              >
                Add
              </Button>
            </Card.Body>
          </Card>

          <Card className="home-card" style={{ width: 300, cursor: 'pointer' }} onClick={() => navigate('/recipes')}>
            <Card.Body className="text-center">
              <div style={{ fontSize: 48 }}>👩‍🍳</div>
              <Card.Title className="mt-2">Discover Recipes</Card.Title>
              <Card.Text>{summary.recipesReady} recipes ready to cook.</Card.Text>
              <Button
                variant="link"
                className="home-btn home-btn--amber"
                onClick={() => navigate('/recipes')}
              >
                Discover
              </Button>
            </Card.Body>
          </Card>
        </div>
      </div>
    </section>
  );
}
