import { FormEvent, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

LoginPage.route = {
  path: '/login',
  menuLabel: undefined,
  index: 99
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading, error, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const from = (location.state as { from?: Location })?.from?.pathname || '/bookings';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch {
      // error hanteras redan via context
    } finally {
      setSubmitting(false);
    }
  }

  return <Row className="justify-content-center py-5">
    <Col md={6} lg={4}>
      <Card>
        <Card.Body className="d-grid gap-3">
          <div>
            <Card.Title>Logga in</Card.Title>
            <Card.Text className="text-body-secondary mb-0">
              Ange e-post och lösenord för att komma åt administrationsvyerna.
            </Card.Text>
          </div>
          {error ? <Alert variant="danger">{error.message || 'Inloggningen misslyckades.'}</Alert> : null}
          <Form onSubmit={handleSubmit} className="d-grid gap-3">
            <Form.Group controlId="login-email">
              <Form.Label>E-post</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </Form.Group>
            <Form.Group controlId="login-password">
              <Form.Label>Lösenord</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </Form.Group>
            <Button type="submit" disabled={isLoading || submitting}>
              {(isLoading || submitting)
                ? <><Spinner animation="border" size="sm" className="me-2" /> Loggar in</>
                : 'Logga in'}
            </Button>
          </Form>
          <div className="text-center">
            <Button
              variant="link"
              className="p-0"
              onClick={() => navigate('/register')}
            >Har du inget konto? Registrera dig.</Button>
          </div>
        </Card.Body>
      </Card>
    </Col>
  </Row>;
}
