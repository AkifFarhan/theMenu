import { useEffect, useState } from 'react';
import { Card, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ApiClient from '../api';

const PROFILE_STORAGE_KEY = 'theMenu_user_profile';
const apiClient = new ApiClient();

export default function Profile() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [savedProfile, setSavedProfile] = useState({
    name: '',
    email: '',
    memberSince: '',
  });

  useEffect(() => {
    const savedProfileData = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (savedProfileData) {
      const profile = JSON.parse(savedProfileData);
      setName(profile.name || '');
      setEmail(profile.email || '');
      setMemberSince(profile.memberSince || '');
      setSavedProfile({
        name: profile.name || '',
        email: profile.email || '',
        memberSince: profile.memberSince || '',
      });
    }

    (async () => {
      const profile = await apiClient.getProfile(false);
      if (profile) {
        const loadedProfile = {
          name: profile.name || '',
          email: profile.email || '',
          memberSince: profile.memberSince || '',
        };

        setName(loadedProfile.name);
        setEmail(loadedProfile.email);
        setMemberSince(loadedProfile.memberSince);
        setSavedProfile(loadedProfile);
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(loadedProfile));
      }
    })();
  }, []);

  const handleSave = async () => {
    const profile = { name, email, memberSince };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    setSavedProfile(profile);

    const updatedProfile = await apiClient.updateProfile(profile);
    if (updatedProfile) {
      const savedProfileData = {
        name: updatedProfile.name || profile.name,
        email: updatedProfile.email || profile.email,
        memberSince: updatedProfile.memberSince || profile.memberSince,
      };
      setSavedProfile(savedProfileData);
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(savedProfileData));
    }

    window.dispatchEvent(new Event('profileUpdated'));
  };

  const displayedName = savedProfile.name || name || 'Your Name';
  const displayedEmail = savedProfile.email || email || 'your.email@example.com';
  const displayedMemberSinceValue = savedProfile.memberSince || memberSince;

  const formatMemberSince = (value: string) => {
    if (!value) {
      return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    }

    const [year, month] = value.split('-');
    if (!year || !month) {
      return value;
    }

    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const displayedMemberSince = formatMemberSince(displayedMemberSinceValue);

  return (
    <div className="d-flex flex-column align-items-center" style={{ paddingTop: 80 }}>
      <Card style={{ maxWidth: 600, width: '100%' }}>
        <Card.Body>
          <div className="text-center mb-4">
            <div style={{ fontSize: 80, marginBottom: 20 }}>👤</div>
            <h2 className="mb-3">Welcome, {displayedName}!</h2>
            <p className="lead text-muted">Your profile information</p>
          </div>

          <div className="text-start mb-4" style={{ backgroundColor: '#f8f9fa', padding: 20, borderRadius: 8 }}>
            <p><strong>Name:</strong> {displayedName}</p>
            <p><strong>Email:</strong> {displayedEmail}</p>
            <p><strong>Member Since:</strong> {displayedMemberSince}</p>
          </div>

          <Form className="mb-4">
            <Form.Group className="mb-3" controlId="profileName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="profileEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="profileMemberSince">
              <Form.Label>Member Since</Form.Label>
              <Form.Control
                type="month"
                value={memberSince}
                onChange={(event) => setMemberSince(event.target.value)}
              />
            </Form.Group>
          </Form>

          <div className="d-flex gap-2 justify-content-center">
            <Button variant="primary" onClick={() => navigate('/')}>
              Back to Home
            </Button>
            <Button variant="outline-secondary" onClick={handleSave}>
              Save Profile
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
