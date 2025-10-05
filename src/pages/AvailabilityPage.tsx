import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner, Table as BootstrapTable } from 'react-bootstrap';
import { fetchAvailability, type AvailabilityTable } from '../api/availability';

AvailabilityPage.route = {
  path: '/availability',
  menuLabel: 'Tillgänglighet',
  index: 3
};

const formatOptions: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit'
};

export default function AvailabilityPage() {
  const today = useMemo(() => new Date(), []);
  const [date, setDate] = useState(() => today.toISOString().slice(0, 10));
  const [availability, setAvailability] = useState<AvailabilityTable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (selectedDate: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAvailability(selectedDate);
      setAvailability(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Det gick inte att läsa tillgängligheten.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(date).catch(() => setError('Det gick inte att läsa tillgängligheten.'));
  }, [date, load]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    load(date).catch(() => setError('Det gick inte att läsa tillgängligheten.'));
  }

  function formatDateTime(value: string) {
    const asDate = new Date(value);
    return asDate.toLocaleTimeString('sv-SE', formatOptions);
  }

  return <Row className="g-4 py-4">
    <Col lg={3}>
      <Card>
        <Card.Body className="d-grid gap-3">
          <div>
            <Card.Title>Välj datum</Card.Title>
            <Card.Text className="text-body-secondary mb-0">
              Se lediga och bokade tider för varje bord.
            </Card.Text>
          </div>
          <Form onSubmit={handleSubmit} className="d-grid gap-3">
            <Form.Group controlId="availability-date">
              <Form.Label>Datum</Form.Label>
              <Form.Control
                type="date"
                value={date}
                min={today.toISOString().slice(0, 10)}
                onChange={event => setDate(event.target.value)}
              />
            </Form.Group>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <><Spinner animation="border" size="sm" className="me-2" /> Hämtar</> : 'Visa tider'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Col>
    <Col lg={9}>
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {availability.length === 0 && !isLoading ? (
        <Alert variant="info">Inga bord hittades för valt datum.</Alert>
      ) : null}
      {availability.map(table => (
        <Card className="mb-4" key={table.tableId}>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <div>
              <strong>{table.tableName}</strong> <span className="text-body-secondary">({table.capacity} platser)</span>
            </div>
            <span className="text-body-secondary">{table.date}</span>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <BootstrapTable striped bordered hover>
                <thead>
                  <tr>
                    <th>Start</th>
                    <th>Slut</th>
                    <th>Status</th>
                    <th>Bokad av</th>
                  </tr>
                </thead>
                <tbody>
                  {table.slots.map((slot, index) => (
                    <tr key={index} className={slot.type === 'booked' ? 'table-danger' : 'table-success'}>
                      <td>{formatDateTime(slot.start)}</td>
                      <td>{formatDateTime(slot.end)}</td>
                      <td>{slot.type === 'booked' ? slot.status ?? 'Bokad' : 'Ledig'}</td>
                      <td>{slot.type === 'booked' ? slot.userEmail ?? 'Kund' : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </BootstrapTable>
            </div>
          </Card.Body>
        </Card>
      ))}
    </Col>
  </Row>;
}
