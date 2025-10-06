import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner, Table as BootstrapTable } from 'react-bootstrap';
import useBookings from '../hooks/useBookings';
import { fetchTables } from '../api/tables';
import type { default as RestaurantTable } from '../interfaces/Table';
import type Booking from '../interfaces/Booking';
import useAuth from '../hooks/useAuth';

BookingsPage.route = {
  path: '/bookings',
  menuLabel: 'Bokningar',
  index: 2,
  requiresAuth: true,
  roles: ['admin', 'staff', 'user']
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

function toDateTimeLocalValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function addTwoHours(value: string) {
  const start = new Date(value);
  if (Number.isNaN(start.getTime())) { return value; }
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return toDateTimeLocalValue(end);
}

export default function BookingsPage() {
  const { user, hasRole } = useAuth();
  const isManager = hasRole('admin', 'staff');
  const isCustomer = hasRole('user') && !isManager;

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

  useEffect(() => {
    if (!user) { return; }
    setFormState(previous => (editingId ? previous : { ...previous, userId: user.id.toString() }));
  }, [user, editingId]);

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

  const visibleBookings = useMemo(() => {
    if (isManager) { return bookings; }
    if (isCustomer && user) { return bookings.filter(booking => booking.userId === user.id); }
    return [];
  }, [bookings, isManager, isCustomer, user]);

  function resetForm() {
    const base = initialFormState();
    const withUser = user ? { ...base, userId: user.id.toString() } : base;
    setFormState(withUser);
    setEditingId(null);
    setFormError(null);
    setFormSuccess(null);
  }

  function handleStartChange(value: string) {
    setFormState(previous => ({ ...previous, start: value, endTime: addTwoHours(value) }));
  }

  function handleTableChange(value: string) {
    setFormState(previous => ({ ...previous, tableId: value }));
  }

  function handleGuestChange(value: string) {
    setFormState(previous => ({ ...previous, guestCount: value }));
  }

  function handleStatusChange(value: string) {
    setFormState(previous => ({ ...previous, status: value }));
  }

  function handleNoteChange(value: string) {
    setFormState(previous => ({ ...previous, note: value }));
  }

  function startEdit(booking: Booking) {
    setEditingId(booking.id);
    setFormSuccess(null);
    setFormError(null);
    const startValue = booking.start.slice(0, 16);
    setFormState({
      userId: booking.userId.toString(),
      tableId: booking.tableId.toString(),
      guestCount: booking.guestCount.toString(),
      start: startValue,
      endTime: addTwoHours(startValue),
      status: booking.status,
      note: booking.note ?? ''
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const userId = Number(formState.userId || user?.id || 0);
    const tableId = Number(formState.tableId);
    const guestCount = Number(formState.guestCount);
    const start = formState.start;
    const endTime = formState.endTime || addTwoHours(start);
    const status = formState.status.trim() || 'booked';
    const note = formState.note.trim();

    if (!Number.isInteger(userId) || userId <= 0) {
      setFormError('Det gick inte att bestämma bokningens användare.');
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
    if (!start) {
      setFormError('Starttiden måste fyllas i.');
      return;
    }

    const payload = {
      userId,
      tableId,
      guestCount,
      start,
      endTime,
      status,
      note,
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
          <Card.Text className="text-body-secondary">Tider bokas alltid i tvåtimmarsblock.</Card.Text>
          <Form onSubmit={handleSubmit} className="d-grid gap-3">
            <Form.Group controlId="booking-tableId">
              <Form.Label>Bord</Form.Label>
              <Form.Select
                name="tableId"
                value={formState.tableId}
                onChange={event => handleTableChange(event.target.value)}
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
                onChange={event => handleGuestChange(event.target.value)}
                required
              />
            </Form.Group>
            <Form.Group controlId="booking-start">
              <Form.Label>Starttid</Form.Label>
              <Form.Control
                name="start"
                type="datetime-local"
                value={formState.start}
                onChange={event => handleStartChange(event.target.value)}
                required
              />
            </Form.Group>
            <Form.Group controlId="booking-end">
              <Form.Label>Sluttid</Form.Label>
              <Form.Control
                name="endTime"
                type="datetime-local"
                value={formState.endTime}
                disabled
                readOnly
              />
              <Form.Text className="text-body-secondary">Sluttiden sätts automatiskt två timmar efter start.</Form.Text>
            </Form.Group>
            <Form.Group controlId="booking-status">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={formState.status}
                onChange={event => handleStatusChange(event.target.value)}
                disabled={isCustomer}
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
                onChange={event => handleNoteChange(event.target.value)}
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
          <p className="text-body-secondary mb-0">Översikt över {isManager ? 'samtliga' : 'dina'} bokningar.</p>
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
              {isManager ? <th>Användare</th> : null}
              <th>Bord</th>
              <th>Start</th>
              <th>Slut</th>
              <th>Gäster</th>
              <th>Status</th>
              <th>Anteckning</th>
              <th style={{ width: '1%' }} className="text-nowrap">Åtgärder</th>
            </tr>
          </thead>
          <tbody>
            {visibleBookings.length === 0 && !isLoading && (
              <tr>
                <td colSpan={isManager ? 8 : 7} className="text-center text-body-secondary py-4">
                  Inga bokningar hittades.
                </td>
              </tr>
            )}
            {visibleBookings.map(booking => (
              <tr key={booking.id}>
                {isManager ? <td>{booking.userEmail ?? `Användare #${booking.userId}`}</td> : null}
                <td>{booking.tableName ?? `#${booking.tableId}`}</td>
                <td>{new Date(booking.start).toLocaleString()}</td>
                <td>{new Date(booking.endTime).toLocaleString()}</td>
                <td>{booking.guestCount}</td>
                <td>{booking.status}</td>
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
                      disabled={isLoading || deletingId === booking.id || (isCustomer && booking.userId !== user?.id)}
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
