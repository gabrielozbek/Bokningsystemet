import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner, Table as BootstrapTable } from 'react-bootstrap';
import useTablesAdmin from '../hooks/useTablesAdmin';
import type Table from '../interfaces/Table';
import type { TablePayload } from '../api/tables';

TableManagementPage.route = {
  path: '/tables',
  menuLabel: 'Bord',
  index: 4,
  requiresAuth: true,
  roles: ['admin', 'staff']
};

interface FormState {
  name: string;
  capacity: string;
  location: string;
  description: string;
  isActive: boolean;
}

const initialFormState: FormState = {
  name: '',
  capacity: '',
  location: '',
  description: '',
  isActive: true,
};

export default function TableManagementPage() {
  const { tables, isLoading, error, create, update, remove, reload } = useTablesAdmin();
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    setFormError(null);
    setFormSuccess(null);
  }, [editingId]);

  const sortedTables = useMemo(() => tables.slice().sort((a, b) => a.name.localeCompare(b.name)), [tables]);

  function handleEdit(table: Table) {
    setEditingId(table.id);
    setFormState({
      name: table.name,
      capacity: table.capacity.toString(),
      location: table.location,
      description: table.description,
      isActive: table.is_active === 1,
    });
  }

  function handleReset() {
    setEditingId(null);
    setFormState(initialFormState);
    setFormError(null);
    setFormSuccess(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const capacity = Number(formState.capacity);
    if (!formState.name.trim()) {
      setFormError('Namn måste fyllas i.');
      return;
    }
    if (!Number.isInteger(capacity) || capacity <= 0) {
      setFormError('Ange kapacitet (minst 1).');
      return;
    }

    const payload: TablePayload = {
      name: formState.name.trim(),
      capacity,
      location: formState.location.trim(),
      description: formState.description.trim(),
      is_active: formState.isActive,
    };

    try {
      if (editingId) {
        await update(editingId, payload);
        setFormSuccess('Bordet uppdaterades.');
      } else {
        await create(payload);
        setFormSuccess('Nytt bord skapades.');
      }
      handleReset();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Det gick inte att spara bordet.';
      setFormError(message);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Är du säker på att du vill ta bort bordet?')) { return; }
    setDeletingId(id);
    try {
      await remove(id);
      if (editingId === id) {
        handleReset();
      }
    } finally {
      setDeletingId(null);
    }
  }


  return <Row className="g-4 py-4">
    <Col lg={4}>
      <Card>
        <Card.Body className="d-grid gap-3">
          <div>
            <Card.Title>{editingId ? 'Redigera bord' : 'Skapa nytt bord'}</Card.Title>
            <Card.Text className="text-body-secondary mb-0">
              Hantera bordens grundinformation och markera om de är aktiva.
            </Card.Text>
          </div>
          <Form onSubmit={handleSubmit} className="d-grid gap-3">
            <Form.Group controlId="table-name">
              <Form.Label>Namn</Form.Label>
              <Form.Control
                value={formState.name}
                onChange={event => setFormState(prev => ({ ...prev, name: event.target.value }))}
                required
              />
            </Form.Group>
            <Form.Group controlId="table-capacity">
              <Form.Label>Kapacitet</Form.Label>
              <Form.Control
                type="number"
                min={1}
                value={formState.capacity}
                onChange={event => setFormState(prev => ({ ...prev, capacity: event.target.value }))}
                required
              />
            </Form.Group>
            <Form.Group controlId="table-location">
              <Form.Label>Plats</Form.Label>
              <Form.Control
                value={formState.location}
                onChange={event => setFormState(prev => ({ ...prev, location: event.target.value }))}
              />
            </Form.Group>
            <Form.Group controlId="table-description">
              <Form.Label>Beskrivning</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formState.description}
                onChange={event => setFormState(prev => ({ ...prev, description: event.target.value }))}
              />
            </Form.Group>
            <Form.Check
              id="table-active"
              type="switch"
              label="Aktivt bord"
              checked={formState.isActive}
              onChange={event => setFormState(prev => ({ ...prev, isActive: event.target.checked }))}
            />
            {formError ? <Alert variant="danger" className="mb-0">{formError}</Alert> : null}
            {formSuccess ? <Alert variant="success" className="mb-0">{formSuccess}</Alert> : null}
            <div className="d-flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <><Spinner animation="border" size="sm" className="me-2" /> Sparar</> : editingId ? 'Uppdatera' : 'Skapa'}
              </Button>
              <Button variant="outline-secondary" type="button" onClick={handleReset} disabled={isLoading}>
                Rensa
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Col>
    <Col lg={8}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="mb-0">Bord</h2>
          <p className="text-body-secondary mb-0">Administrera bordsinformation och tillgänglighet.</p>
        </div>
        <Button variant="outline-primary" onClick={reload} disabled={isLoading}>Uppdatera lista</Button>
      </div>
      {error ? <Alert variant="danger">Det gick inte att hämta borden.</Alert> : null}
      <div className="table-responsive">
        <BootstrapTable striped bordered hover>
          <thead>
            <tr>
              <th>Namn</th>
              <th>Kapacitet</th>
              <th>Plats</th>
              <th>Status</th>
              <th style={{ width: '1%' }} className="text-nowrap">Åtgärder</th>
            </tr>
          </thead>
          <tbody>
            {sortedTables.map(table => (
              <tr key={table.id}>
                <td>{table.name}</td>
                <td>{table.capacity}</td>
                <td>{table.location}</td>
                <td>
                  {table.is_active ? <Badge bg="success">Aktiv</Badge> : <Badge bg="secondary">Inaktiv</Badge>}
                </td>
                <td className="text-nowrap">
                  <div className="d-flex gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={() => handleEdit(table)} disabled={isLoading}>Ändra</Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(table.id)}
                      disabled={isLoading || deletingId === table.id}
                    >
                      {deletingId === table.id ? 'Tar bort…' : 'Ta bort'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {sortedTables.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-body-secondary py-4">Inga bord registrerade.</td>
              </tr>
            ) : null}
          </tbody>
        </BootstrapTable>
      </div>
    </Col>
  </Row>;
}
