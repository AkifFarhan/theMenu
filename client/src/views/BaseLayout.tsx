import { ReactNode, useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import ApiClient from "../api";

const apiClient = new ApiClient();

interface BaseLayoutProps {
  children: ReactNode;
}

const BaseLayout: React.FC<BaseLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Akif');

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
    window.addEventListener('profileUpdated', loadUserName);
    return () => window.removeEventListener('profileUpdated', loadUserName);
  }, []);

  const handleLogout = () => {
    // placeholder logout
    navigate('/');
  };

  return (
    <div className="layout">
      <header className="navbar navbar-expand-lg navbar-light bg-light fixed-top">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">
            theMenu
          </Link>
          <div className="d-flex align-items-center ms-auto gap-2">
            <Link to="/profile" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <div className="me-2" style={{ cursor: 'pointer', color: '#007bff' }}>{userName}</div>
            </Link>
            <Button variant="outline-secondary" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="main-content">{children}</main>
    </div>
  );
};

export default BaseLayout;
