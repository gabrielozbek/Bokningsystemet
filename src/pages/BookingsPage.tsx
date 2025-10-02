import { useState } from 'react';
import { Alert, Button, Col, Row, Spinner, Table } from 'react-bootstrap';
import useBookings from '../hooks/useBookings';

BookingsPage.route = {
  path: '/bookings',
  menuLabel: 'Bokningar',
  index: 2
};

export default function BookingsPage() {
  const { bookings, isLoading, error, reload, remove } = useBookings();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await remove(id);
    } finally {
      setDeletingId(null);
    }
  }

  return <Row>
    <Col>
      <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
        <div>
          <h2 className="mb-0">Bokningar</h2>
          <p className="text-body-secondary mb-0">Överblicka och hantera alla bokningar.</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={reload} disabled={isLoading}>
            {isLoading ? <><Spinner animation="border" size="sm" className="me-2" /> Laddar</> : 'Uppdatera'}
          </Button>
        </div>
      </div>

      {error ? <Alert variant="danger">Det gick inte att läsa bokningarna. Försök igen.</Alert> : null}

      <div className="table-responsive">
        <Table striped bordered hover>
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
                <td>{booking.note || '—'}</td>
                <td className="text-nowrap">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(booking.id)}
                    disabled={isLoading || deletingId === booking.id}
                  >
                    {deletingId === booking.id ? 'Tar bort…' : 'Ta bort'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Col>
  </Row>;
}
