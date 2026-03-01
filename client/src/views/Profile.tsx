import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();
  const userName = 'Akif';

  return (
    <div className="d-flex flex-column align-items-center" style={{ paddingTop: 80 }}>
      <Card style={{ maxWidth: 600, width: '100%' }}>
        <Card.Body className="text-center">
          <div style={{ fontSize: 80, marginBottom: 20 }}>👤</div>
          <h2 className="mb-3">Welcome, {userName}!</h2>
          <p className="lead text-muted mb-4">Your profile information</p>
          
          <div className="text-start mb-4" style={{ backgroundColor: '#f8f9fa', padding: 20, borderRadius: 8 }}>
            <p><strong>Name:</strong> {userName}</p>
            <p><strong>Email:</strong> akif@example.com</p>
            <p><strong>Member Since:</strong> January 2024</p>
          </div>

          <div className="d-flex gap-2 justify-content-center">
            <Button variant="primary" onClick={() => navigate('/')}>
              Back to Home
            </Button>
            <Button variant="outline-secondary">
              Edit Profile
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
