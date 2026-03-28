import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center" style={{ paddingTop: 80 }}>
        <Card style={{ maxWidth: 600, width: '100%' }}>
          <Card.Body className="text-center">
            <div style={{ fontSize: 80, marginBottom: 20 }}>👤</div>
            <h2 className="mb-3">Loading profile...</h2>
          </Card.Body>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="d-flex flex-column align-items-center" style={{ paddingTop: 80 }}>
        <Card style={{ maxWidth: 600, width: '100%' }}>
          <Card.Body className="text-center">
            <div style={{ fontSize: 80, marginBottom: 20 }}>👤</div>
            <h2 className="mb-3">No profile available</h2>
            <p className="text-muted">Please log in to view your profile.</p>
            <Button variant="primary" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column align-items-center" style={{ paddingTop: 80 }}>
      <Card style={{ maxWidth: 600, width: '100%' }}>
        <Card.Body className="text-center">
          <div style={{ fontSize: 80, marginBottom: 20 }}>👤</div>
          <h2 className="mb-3">Welcome, {user.username}!</h2>
          <p className="lead text-muted mb-4">Your profile information</p>

          <div className="text-start mb-4" style={{ backgroundColor: '#f8f9fa', padding: 20, borderRadius: 8 }}>
            <p><strong>Name:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>

          <div className="d-flex gap-2 justify-content-center">
            <Button variant="primary" onClick={() => navigate('/') }>
              Back to Home
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate('/profile/edit')}>
              Edit Profile
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
