import { Alert, Badge, Button, Card, Col, Row, Spinner, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { apiClient } from '../api';
import toast from 'react-hot-toast';

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setEditUsername(user.username);
      setEditEmail(user.email);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!editUsername.trim() || !editEmail.trim()) {
      toast.error('Username and email are required');
      return;
    }

    if ((currentPassword || newPassword || confirmPassword) && !currentPassword) {
      toast.error('Current password is required to change password');
      return;
    }

    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        toast.error('New password must be at least 6 characters');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('New password and confirm password do not match');
        return;
      }
    }

    setIsSaving(true);
    try {
      const response = await apiClient.updateUser({
        username: editUsername.trim(),
        email: editEmail.trim(),
      });

      if (response?.user) {
        setUser(response.user);
      }

      if (newPassword) {
        await apiClient.changePassword({
          current_password: currentPassword,
          new_password: newPassword,
        });
      }

      toast.success('Profile updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsEditing(false);
    } catch (error) {
      // Errors are surfaced via api client handler.
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setEditUsername(user.username);
      setEditEmail(user.email);
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsEditing(false);
  };

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
                <Button variant="outline-secondary" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {isEditing && (
        <Card className="themed-card profile-card mt-3">
          <Card.Body>
            <h3 className="profile-section-title mb-3">Edit Profile</h3>
            <div className="edit-form-container">
              <Form.Group className="mb-3">
                <Form.Label className="profile-edit-label">Username</Form.Label>
                <Form.Control
                  className="profile-edit-input"
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="Enter username"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="profile-edit-label">Email</Form.Label>
                <Form.Control
                  className="profile-edit-input"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Enter email"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="profile-edit-label">Current Password</Form.Label>
                <Form.Control
                  className="profile-edit-input"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Required only if changing password"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="profile-edit-label">New Password</Form.Label>
                <Form.Control
                  className="profile-edit-input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="profile-edit-label">Confirm New Password</Form.Label>
                <Form.Control
                  className="profile-edit-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </Form.Group>

              <div className="d-flex gap-2">
                <Button className="btn-navy" onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline-secondary" onClick={handleCancelEdit} disabled={isSaving}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </section>
  );
}
