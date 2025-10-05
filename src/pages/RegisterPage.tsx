import { ChangeEvent, FormEvent, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import request from '../api/client';

RegisterPage.route = {
  path: '/register',
  index: 98
};

type RegisterState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const initialState: RegisterState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState<RegisterState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormState(previous => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (formState.password !== formState.confirmPassword) {
      setError('Lösenorden matchar inte.');
      return;
    }

    setSubmitting(true);
    try {
      await request('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          first_name: formState.firstName,
          last_name: formState.lastName,
          email: formState.email,
          phone: formState.phone,
          password: formState.password
        })
      });
      setSuccess('Ditt konto skapades. Du kan nu logga in.');
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err) {
      const apiErr = err as { message?: string; details?: { error?: string } } | undefined;
      const message = apiErr?.details?.error ?? apiErr?.message ?? 'Det gick inte att registrera kontot.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return <Row className="justify-content-center py-5">
    <Col md={6} lg={4}>
      <Card>
        <Card.Body className="d-grid gap-3">
          <div>
            <Card.Title>Registrera konto</Card.Title>
            <Card.Text className="text-body-secondary mb-0">
              Skapa en kundprofil för att kunna delta i bokningssystemet.
            </Card.Text>
          </div>
          {error ? <Alert variant="danger">{error}</Alert> : null}
          {success ? <Alert variant="success">{success}</Alert> : null}
          <Form onSubmit={handleSubmit} className="d-grid gap-3">
            <Form.Group controlId="register-firstName">
              <Form.Label>Förnamn</Form.Label>
              <Form.Control
                name="firstName"
                value={formState.firstName}
                onChange={handleChange}
                autoComplete="given-name"
                required
              />
            </Form.Group>
            <Form.Group controlId="register-lastName">
              <Form.Label>Efternamn</Form.Label>
              <Form.Control
                name="lastName"
                value={formState.lastName}
                onChange={handleChange}
                autoComplete="family-name"
                required
              />
            </Form.Group>
            <Form.Group controlId="register-email">
              <Form.Label>E-post</Form.Label>
              <Form.Control
                name="email"
                type="email"
                value={formState.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </Form.Group>
            <Form.Group controlId="register-phone">
              <Form.Label>Telefon</Form.Label>
              <Form.Control
                name="phone"
                value={formState.phone}
                onChange={handleChange}
                placeholder="Frivilligt"
              />
            </Form.Group>
            <Form.Group controlId="register-password">
              <Form.Label>Lösenord</Form.Label>
              <Form.Control
                name="password"
                type="password"
                value={formState.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
            </Form.Group>
            <Form.Group controlId="register-confirmPassword">
              <Form.Label>Bekräfta lösenord</Form.Label>
              <Form.Control
                name="confirmPassword"
                type="password"
                value={formState.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
            </Form.Group>
            <Button type="submit" disabled={submitting}>
              {submitting ? <><Spinner animation="border" size="sm" className="me-2" /> Registrerar</> : 'Skapa konto'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Col>
  </Row>;
}
