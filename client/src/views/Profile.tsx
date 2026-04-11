import { Alert, Badge, Button, Card, Col, Row, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const initials = user?.username
    ? user.username
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('')
    : 'U';

  if (loading) {
    return (
      <section className="profile-page page-shell">
        <div className="d-flex align-items-center justify-content-between gap-2 page-heading-row">
          <div className="inventory-chip">My Profile</div>
        </div>

        <Card className="themed-card profile-card mt-3">
          <Card.Body className="d-flex align-items-center justify-content-center gap-3 py-5">
            <Spinner animation="border" size="sm" />
            <span className="profile-loading-text">Loading your profile...</span>
          </Card.Body>
        </Card>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="profile-page page-shell">
        <div className="d-flex align-items-center justify-content-between gap-2 page-heading-row">
          <div className="inventory-chip">My Profile</div>
        </div>

        <Alert variant="warning" className="mt-3 mb-0">
          No profile available. Please log in to continue.
        </Alert>

        <Card className="themed-card profile-card mt-3">
          <Card.Body className="text-center py-4">
            <div className="profile-avatar profile-avatar--guest">?</div>
            <h2 className="profile-title mt-3">Guest Mode</h2>
            <p className="profile-subtitle mb-4">Sign in to view your account details and kitchen activity.</p>
            <Button className="btn-navy" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </Card.Body>
        </Card>
      </section>
    );
  }

  return (
    <section className="profile-page page-shell">
      <div className="d-flex align-items-center justify-content-between gap-2 page-heading-row">
        <div className="inventory-chip">My Profile</div>
        <Badge bg="dark" className="pill-badge profile-badge">
          Kitchen Member
        </Badge>
      </div>

      <Row className="mt-3 g-3">
        <Col xs={12} lg={5}>
          <Card className="themed-card profile-card h-100">
            <Card.Body className="text-center d-flex flex-column justify-content-center">
              <div className="profile-avatar">{initials}</div>
              <h2 className="profile-title mt-3">{user.username}</h2>
              <div className="d-flex align-items-center justify-content-center gap-2 mt-2 mb-3">
                <span className="profile-status-dot"></span>
                <span className="profile-status-text">Active</span>
              </div>
              <div className="profile-email-pill">{user.email}</div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={7}>
          <Card className="themed-card profile-card h-100">
            <Card.Body>
              <h3 className="profile-section-title">Account Snapshot</h3>
              <div className="profile-info-grid mt-3">
                <div className="profile-info-item">
                  <span className="profile-info-label">Username</span>
                  <strong className="profile-info-value">{user.username}</strong>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">User ID</span>
                  <strong className="profile-info-value">#{String(user.id).padStart(3, '0')}</strong>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-4">
                <Button className="btn-navy" onClick={() => navigate('/')}>
                  Back to Home
                </Button>
                <Button variant="outline-secondary" onClick={() => navigate('/inventory')}>
                  Open Inventory
                </Button>
                <Button variant="outline-secondary" onClick={() => navigate('/recipes')}>
                  Open Recipes
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </section>
  );
}
