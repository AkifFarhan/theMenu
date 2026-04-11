import { ReactNode, useEffect } from "react";
import { Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import ApiClient from "../api";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

interface BaseLayoutProps {
  children: ReactNode;
}

const api = new ApiClient();

const BaseLayout: React.FC<BaseLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  const handleLogout = async () => {
    const success = await api.logout();
    if (success) {
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  if (loading || !user) {
    return null; // or a loading spinner
  }

  return (
    <div className="layout">
      <header className="navbar navbar-expand-lg navbar-light bg-light fixed-top">
        <div className="container-fluid">
          <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
            <img src="/logo.png" alt="theMenu logo" height="28" />
            <span>theMenu</span>
          </Link>
          <div className="d-flex align-items-center ms-auto gap-2">
            <Link to="/profile" className="user-link" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <div className="me-2" style={{ cursor: 'pointer' }}>
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

      <footer className="site-footer">
        <Link className="site-footer__link" to="/contact">Contact us.</Link>
        <span className="site-footer__copy">© Copyright theMenu</span>
      </footer>
    </div>
  );
};

export default BaseLayout;
