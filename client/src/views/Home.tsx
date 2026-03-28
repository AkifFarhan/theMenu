import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const inventoryCount = JSON.parse(localStorage.getItem('inventoryItems') || '[]').length;
  const recipesReady = 3;
  const userName = user?.username || 'there';

  return (
    <section className="home-hero">
      <div className="home-hero__overlay" />
      <div className="home-hero__content d-flex flex-column align-items-center">
        <button className="home-welcome-btn" type="button">
          Welcome back, {userName}
        </button>

        <div className="d-flex gap-4 flex-wrap" style={{ maxWidth: 1000, width: '100%', justifyContent: 'center' }}>
          <Card className="home-card" style={{ width: 300, cursor: 'pointer' }} onClick={() => navigate('/inventory')}>
            <Card.Body className="text-center">
              <div style={{ fontSize: 48 }}>🧊</div>
              <Card.Title className="mt-2">My Inventory</Card.Title>
              <Card.Text>You have {inventoryCount} items.</Card.Text>
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
              <Card.Text>{recipesReady} recipes ready to cook.</Card.Text>
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
