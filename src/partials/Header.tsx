import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Container, Nav, Navbar } from 'react-bootstrap';
import routes from '../routes';
import useAuth from '../hooks/useAuth';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout, isLoading, hasRole } = useAuth();

  const [expanded, setExpanded] = useState(false);

  const pathName = useLocation().pathname;
  const currentRoute = routes
    .slice().sort((a, b) => a.path.length > b.path.length ? -1 : 1)
    .find(x => pathName.indexOf(x.path.split(':')[0]) === 0);

  const isActive = (path: string) =>
    path === currentRoute?.path || path === currentRoute?.parent;

  const menuItems = routes.filter(route => {
    if (!route.menuLabel) { return false; }
    if (route.requiresAuth && route.roles && route.roles.length > 0) {
      return hasRole(...route.roles);
    }
    if (route.requiresAuth) {
      return Boolean(user);
    }
    return true;
  });

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return <header>
    <Navbar
      expanded={expanded}
      expand="md"
      className="bg-primary"
      data-bs-theme="dark"
      fixed="top"
    >
      <Container fluid>
        <Navbar.Brand className="me-5" as={Link} to="/">
          My webapp
        </Navbar.Brand>
        <Navbar.Toggle onClick={() => setExpanded(!expanded)} />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-between">
          <Nav className="me-auto">
            {menuItems.map(({ menuLabel, path }, i) => (
              <Nav.Link
                as={Link}
                key={i}
                to={path}
                className={isActive(path) ? 'active' : ''}
                onClick={() => setTimeout(() => setExpanded(false), 200)}
              >{menuLabel}</Nav.Link>
            ))}
          </Nav>
          <div className="d-flex align-items-center gap-2">
            {user ? <Navbar.Text className="text-light">{user.email}</Navbar.Text> : null}
            {user ? (
              <Button variant="outline-light" size="sm" onClick={handleLogout} disabled={isLoading}>Logga ut</Button>
            ) : (
              <div className="d-flex gap-2">
                <Button variant="outline-light" size="sm" onClick={() => { setExpanded(false); navigate('/login'); }}>Logga in</Button>
                <Button variant="light" size="sm" onClick={() => { setExpanded(false); navigate('/register'); }}>Registrera</Button>
              </div>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  </header>;
}
