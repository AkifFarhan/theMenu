import { useEffect, useState } from 'react';
import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ApiClient from '../api';

const apiClient = new ApiClient();

export default function Home() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Akif');

  const inventoryCount = 14;
  const recipesReady = 3;

  useEffect(() => {
    const loadUserName = async () => {
      const savedProfileData = localStorage.getItem('theMenu_user_profile');
      if (savedProfileData) {
        const profile = JSON.parse(savedProfileData);
        if (profile.name) {
          setUserName(profile.name);
        }
      }

      const profile = await apiClient.getProfile(false);
      if (profile && profile.name) {
        setUserName(profile.name);
        localStorage.setItem('theMenu_user_profile', JSON.stringify({
          name: profile.name,
          email: profile.email || '',
          memberSince: profile.memberSince || '',
        }));
      }
    };

    loadUserName();
  }, []);

  return (
    <div className="d-flex flex-column align-items-center" style={{ paddingTop: 80 }}>
      <h2 className="mb-4">Welcome back, {userName}!</h2>

      <div className="d-flex gap-4" style={{ maxWidth: 1000, width: '100%', justifyContent: 'center' }}>
        <Card style={{ width: 300, cursor: 'pointer' }} onClick={() => navigate('/inventory')}>
          <Card.Body className="text-center">
            <div style={{ fontSize: 48 }}>🧊</div>
            <Card.Title className="mt-2">My Inventory</Card.Title>
            <Card.Text>You have {inventoryCount} items.</Card.Text>
            <Button variant="primary" onClick={() => navigate('/inventory')}>Open</Button>
          </Card.Body>
        </Card>

        <Card style={{ width: 300, cursor: 'pointer' }} onClick={() => navigate('/add-food')}>
          <Card.Body className="text-center">
            <div style={{ fontSize: 48 }}>＋</div>
            <Card.Title className="mt-2">Add Food</Card.Title>
            <Card.Text>Paste grocery lists or scan.</Card.Text>
            <Button variant="success" onClick={() => navigate('/add-food')}>Add</Button>
          </Card.Body>
        </Card>

        <Card style={{ width: 300, cursor: 'pointer' }} onClick={() => navigate('/recipes')}>
          <Card.Body className="text-center">
            <div style={{ fontSize: 48 }}>👩‍🍳</div>
            <Card.Title className="mt-2">Discover Recipes</Card.Title>
            <Card.Text>{recipesReady} recipes ready to cook.</Card.Text>
            <Button variant="warning" onClick={() => navigate('/recipes')}>Discover</Button>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
