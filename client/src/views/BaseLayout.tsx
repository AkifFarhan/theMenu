import { ReactNode, useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import ApiClient from "../api";
import toast from "react-hot-toast";

interface BaseLayoutProps {
  children: ReactNode;
}

const api = new ApiClient();

const BaseLayout: React.FC<BaseLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    if (!api.isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Get user data from localStorage
    const currentUser = api.getCurrentUser();
    setUser(currentUser);
  }, [navigate]);

  const handleLogout = async () => {
    const success = await api.logout();
    if (success) {
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  if (!user) {
    return null; // or a loading spinner
  }

  return (
    <div className="layout">
      <header className="navbar navbar-expand-lg navbar-light bg-light fixed-top">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">
            theMenu
          </Link>
          <div className="d-flex align-items-center ms-auto gap-2">
            <Link to="/profile" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <div className="me-2" style={{ cursor: 'pointer', color: '#007bff' }}>
                {user.username}
              </div>
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
