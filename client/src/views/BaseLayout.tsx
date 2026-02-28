import { ReactNode } from "react";
import { Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

interface BaseLayoutProps {
  children: ReactNode;
}

const BaseLayout: React.FC<BaseLayoutProps> = ({ children }) => {
  const navigate = useNavigate();

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
          <div className="d-flex align-items-center ms-auto">
            <div className="me-3">Akif</div>
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
