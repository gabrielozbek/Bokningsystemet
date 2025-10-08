import { Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

Start.route = {
  path: '/',
  menuLabel: 'Start',
  index: 1
}

export default function Start() {
  return <>
    {/* Hero */}
    <Row className="py-4">
      <Col>
        <div className="p-5 text-center text-white rounded-4 start-hero">
          <h1 className="display-5 fw-bold mb-2">Välkommen till Bokningssystemet</h1>
          <p className="lead opacity-75 mb-4">
            Boka bord, se tillgänglighet och hantera reservationer – snabbt och enkelt.
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Button as={Link} to="/availability" variant="light" size="lg">Boka bord</Button>
            <Button as={Link} to="/bookings" variant="outline-light" size="lg">Mina bokningar</Button>
          </div>
        </div>
      </Col>
    </Row>

    {/* Features */}
    <Row className="g-4 py-3">
      <Col md={4}>
        <Card className="h-100 shadow-sm feature-card">
          <Card.Body>
            <div className="fs-2 mb-2">⚡</div>
            <Card.Title>Snabb bokning</Card.Title>
            <Card.Text>
              Välj datum och tid och boka på under en minut.
            </Card.Text>
          </Card.Body>
        </Card>
      </Col>
      <Col md={4}>
        <Card className="h-100 shadow-sm feature-card">
          <Card.Body>
            <div className="fs-2 mb-2">📅</div>
            <Card.Title>Live tillgänglighet</Card.Title>
            <Card.Text>
              Se lediga bord i realtid och hitta den perfekta tiden.
            </Card.Text>
          </Card.Body>
        </Card>
      </Col>
      <Col md={4}>
        <Card className="h-100 shadow-sm feature-card">
          <Card.Body>
            <div className="fs-2 mb-2">🛠️</div>
            <Card.Title>Administrera enkelt</Card.Title>
            <Card.Text>
              Hantera bokningar och bord från ett och samma ställe.
            </Card.Text>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </>
}
