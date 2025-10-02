import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner, Table as BootstrapTable } from 'react-bootstrap';
import useBookings from '../hooks/useBookings';
import { fetchTables } from '../api/tables';
import type { default as RestaurantTable } from '../interfaces/Table';
import type Booking from '../interfaces/Booking';

BookingsPage.route = {
  path: '/bookings',
  menuLabel: 'Bokningar',
  index: 2
};

type FormState = {
  userId: string;
  tableId: string;
  guestCount: string;
  start: string;
  endTime: string;
  status: string;
  note: string;
};

const statusOptions = ['booked', 'blocked', 'cancelled'];

const initialFormState = (): FormState => ({
  userId: '',
  tableId: '',
  guestCount: '',
  start: '',
  endTime: '',
  status: 'booked',
  note: ''
});

export default function BookingsPage() {
  const { bookings, isLoading, error, reload, remove, create, update } = useBookings();
  const showError = Boolean(error && !isLoading && bookings.length === 0);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [tablesError, setTablesError] = useState<string | null>(null);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const loadTables = useCallback(async () => {
    setIsLoadingTables(true);
    setTablesError(null);
    try {
      const data = await fetchTables();
      setTables(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunde inte läsa bordsdata.';
      setTablesError(message);
    } finally {
      setIsLoadingTables(false);
    }
  }, []);

  useEffect(() => {
    loadTables().catch(() => setTablesError('Kunde inte läsa bordsdata.'));
  }, [loadTables]);

  const tableOptions = useMemo(
    () => tables.map(table => ({
      value: table.id.toString(),
      label: `${table.name} (platser: ${table.capacity})`
    })),
    [tables]
  );

  function resetForm() {
    setFormState(initialFormState());
    setEditingId(null);
    setFormError(null);
    setFormSuccess(null);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setFormState(previous => ({ ...previous, [name]: value }));
  }

  function startEdit(booking: Booking) {
    setEditingId(booking.id);
    setFormSuccess(null);
    setFormError(null);
    setFormState({
      userId: booking.userId.toString(),
      tableId: booking.tableId.toString(),
      guestCount: booking.guestCount.toString(),
      start: booking.start.slice(0, 16),
      endTime: booking.endTime.slice(0, 16),
      status: booking.status,
      note: booking.note ?? ''
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const userId = Number(formState.userId);
    const tableId = Number(formState.tableId);
    const guestCount = Number(formState.guestCount);
    const start = formState.start;
    const endTime = formState.endTime;
    const status = formState.status.trim() || 'booked';
    const note = formState.note.trim();

    if (!Number.isInteger(userId) || userId <= 0) {
      setFormError('Ange ett giltigt användar-ID.');
      return;
    }
    if (!Number.isInteger(tableId) || tableId <= 0) {
      setFormError('Välj ett giltigt bord.');
      return;
    }
    if (!Number.isInteger(guestCount) || guestCount <= 0) {
      setFormError('Ange antal gäster (minst 1).');
      return;
    }
    if (!start || !endTime) {
      setFormError('Start- och sluttid måste fyllas i.');
      return;
    }
    if (new Date(start) >= new Date(endTime)) {
      setFormError('Sluttiden måste vara senare än starttiden.');
      return;
    }

    const payload = {
      userId,
      tableId,
      guestCount,
      start,
      endTime,
      status,
      note
    };

    try {
      if (editingId) {
        await update(editingId, payload);
        setFormSuccess('Bokningen uppdaterades.');
      } else {
        await create(payload);
        setFormSuccess('Ny bokning skapades.');
      }
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Det gick inte att spara bokningen.';
      setFormError(message);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await remove(id);
      if (editingId === id) {
        resetForm();
      }
    } finally {
      setDeletingId(null);
    }
  }

  return <Row className="g-4">
    <Col lg={4}>
      <Card>
        <Card.Body>
          <Card.Title>{editingId ? 'Redigera bokning' : 'Skapa bokning'}</Card.Title>
          <Card.Text className="text-body-secondary">
            Fyll i fälten för att skapa eller ändra en bokning.
          </Card.Text>
          <Form onSubmit={handleSubmit} className="d-grid gap-3">
            <Form.Group controlId="booking-userId">
              <Form.Label>Användar-ID</Form.Label>
              <Form.Control
                name="userId"
                type="number"
                min={1}
                value={formState.userId}
                onChange={handleChange}
                placeholder="Ex. 1"
                required
              />
            </Form.Group>
            <Form.Group controlId="booking-tableId">
              <Form.Label>Bord</Form.Label>
              <Form.Select
                name="tableId"
                value={formState.tableId}
                onChange={handleChange}
                disabled={isLoadingTables}
                required
              >
                <option value="">Välj bord</option>
                {tableOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Form.Select>
              {tablesError ? <small className="text-danger">{tablesError}</small> : null}
            </Form.Group>
            <Form.Group controlId="booking-guestCount">
              <Form.Label>Antal gäster</Form.Label>
              <Form.Control
                name="guestCount"
                type="number"
                min={1}
                value={formState.guestCount}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="booking-start">
              <Form.Label>Starttid</Form.Label>
              <Form.Control
                name="start"
                type="datetime-local"
                value={formState.start}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="booking-end">
              <Form.Label>Sluttid</Form.Label>
              <Form.Control
                name="endTime"
                type="datetime-local"
                value={formState.endTime}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="booking-status">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={formState.status}
                onChange={handleChange}
              >
                {statusOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group controlId="booking-note">
              <Form.Label>Anteckning</Form.Label>
              <Form.Control
                as="textarea"
                name="note"
                rows={2}
                value={formState.note}
                onChange={handleChange}
                placeholder="Frivilligt"
              />
            </Form.Group>
            {formError ? <Alert variant="danger" className="mb-0">{formError}</Alert> : null}
            {formSuccess ? <Alert variant="success" className="mb-0">{formSuccess}</Alert> : null}
            <div className="d-flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <><Spinner animation="border" size="sm" className="me-2" /> Sparar</> : editingId ? 'Uppdatera' : 'Skapa'}
              </Button>
              <Button variant="outline-secondary" type="button" onClick={resetForm} disabled={isLoading}>
                Rensa
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Col>
    <Col lg={8}>
      <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
        <div>
          <h2 className="mb-0">Bokningar</h2>
          <p className="text-body-secondary mb-0">Översikt över samtliga bokningar.</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={reload} disabled={isLoading}>
            {isLoading ? <><Spinner animation="border" size="sm" className="me-2" /> Laddar</> : 'Uppdatera'}
          </Button>
          <Button variant="outline-secondary" onClick={loadTables} disabled={isLoadingTables}>
            {isLoadingTables ? <><Spinner animation="border" size="sm" className="me-2" /> Hämtar</> : 'Hämta bord'}
          </Button>
        </div>
      </div>

      {showError ? <Alert variant="danger">Det gick inte att läsa bokningarna. Försök igen.</Alert> : null}

      <div className="table-responsive">
        <BootstrapTable striped bordered hover>
          <thead>
            <tr>
              <th>Bord</th>
              <th>Start</th>
              <th>Slut</th>
              <th>Gäster</th>
              <th>Status</th>
              <th>Bokad av</th>
              <th>Anteckning</th>
              <th style={{ width: '1%' }} className="text-nowrap">Åtgärder</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && !isLoading && (
              <tr>
                <td colSpan={8} className="text-center text-body-secondary py-4">
                  Inga bokningar hittades.
                </td>
              </tr>
            )}
            {bookings.map(booking => (
              <tr key={booking.id}>
                <td>{booking.tableName ?? `#${booking.tableId}`}</td>
                <td>{new Date(booking.start).toLocaleString()}</td>
                <td>{new Date(booking.endTime).toLocaleString()}</td>
                <td>{booking.guestCount}</td>
                <td>{booking.status}</td>
                <td>{booking.userEmail ?? `Användare #${booking.userId}`}</td>
                <td>{booking.note || '–'}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => startEdit(booking)}
                      disabled={isLoading}
                    >
                      Ändra
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(booking.id)}
                      disabled={isLoading || deletingId === booking.id}
                    >
                      {deletingId === booking.id ? 'Tar bort…' : 'Ta bort'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </BootstrapTable>
      </div>
    </Col>
  </Row>;
}
