import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { mesasService } from '../services/api';
import { useMesasStore, useAuthStore } from '../stores';
import './Mesas.css';

export default function Mesas() {
  const navigate = useNavigate();
  const usuario = useAuthStore((state) => state.usuario);
  const logout = useAuthStore((state) => state.logout);
  const mesas = useMesasStore((state) => state.mesas);
  const setMesas = useMesasStore((state) => state.setMesas);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarMesas = useCallback(async () => {
    try {
      setLoading(true);
      const sedeId = localStorage.getItem('sedeId') || usuario?.sede_id || 1;
      const response = await mesasService.getAll(sedeId);
      setMesas(response.data.data || []);
    } catch (err) {
      const mensaje = err.response?.data?.message || 'Error al cargar mesas';
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setMesas, usuario]);

  useEffect(() => {
    cargarMesas();
  }, [cargarMesas]);

  const handleSelectMesa = (mesa) => {
    console.log('Seleccionando mesa:', mesa);
    localStorage.setItem('mesaActual', JSON.stringify(mesa));
    navigate(`/orden/${mesa.id}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  const mesasOrdenadas = [...mesas].sort((a, b) => parseInt(a.numero) - parseInt(b.numero));
  const mesasDisponibles = mesasOrdenadas.filter((m) => m.estado === 'disponible');
  const mesasOcupadas = mesasOrdenadas.filter((m) => m.estado === 'ocupada');
  const mesasPrecuenta = mesasOrdenadas.filter((m) => m.estado === 'en_precuenta');

  return (
    <div className="mesas-page">
      {/* Header */}
      <div className="mesas-header text-white py-3">
        <Container>
          <Row className="align-items-center">
            <Col>
              <h1 className="mb-0">
                🍽️ {usuario?.nombre || 'Mesero'}
              </h1>
              <small className="text-muted">
                Sede: {usuario?.sede?.nombre || 'Sede Principal'}
              </small>
            </Col>
            <Col className="text-end">
              <Button variant="info" size="sm" onClick={() => navigate('/admin')}>
                ⚙️ Admin
              </Button>
              <Button variant="warning" size="sm" className="ms-2" onClick={() => navigate('/caja')}>
                💰 Caja
              </Button>
              <Button variant="outline-light" size="sm" className="ms-2" onClick={cargarMesas}>
                🔄 Refrescar
              </Button>
              <Button variant="outline-light" size="sm" className="ms-2" onClick={handleLogout}>
                Salir
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Contenido */}
      <Container className="py-4">
        {error && <Alert variant="danger">{error}</Alert>}

        {/* Estadísticas */}
        <Row className="mb-4">
          <Col md={3} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-success">{mesasDisponibles.length}</h3>
                <p className="text-muted mb-0">Disponibles</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-warning">{mesasOcupadas.length}</h3>
                <p className="text-muted mb-0">Ocupadas</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-info">{mesasPrecuenta.length}</h3>
                <p className="text-muted mb-0">En Precuenta</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-secondary">{mesas.length}</h3>
                <p className="text-muted mb-0">Total</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Mesas por Zona */}
        <h4 className="mb-3">📍 Mesas por Zona</h4>

        <div className="mesas-grid">
          {mesas.length > 0 ? (
            mesasOrdenadas.map((mesa) => (
              <div key={mesa.id} className="mesa-card-wrapper">
                <Card
                  className={`mesa-card cursor-pointer ${mesa.estado}`}
                  onClick={() => handleSelectMesa(mesa)}
                  style={{ cursor: 'pointer' }}
                >
                  <Card.Body className="text-center p-3">
                    <div className="mesa-numero mb-2">
                      {mesa.numero}
                    </div>

                    <div className="mesa-info mb-2">
                      <small className="text-muted">
                        <strong>{mesa.zona?.nombre || 'Zona'}</strong>
                      </small>
                      <br />
                      <small className="text-muted">
                        👥 {mesa.capacidad} personas
                      </small>
                    </div>

                    <Badge
                      bg={
                        mesa.estado === 'disponible'
                          ? 'success'
                          : mesa.estado === 'ocupada'
                          ? 'warning'
                          : 'info'
                      }
                      className="w-100"
                    >
                      {mesa.estado === 'disponible'
                        ? 'Disponible'
                        : mesa.estado === 'ocupada'
                        ? 'Ocupada'
                        : 'Precuenta'}
                    </Badge>
                  </Card.Body>
                </Card>
              </div>
            ))
          ) : (
            <Alert variant="warning">
              No hay mesas disponibles
            </Alert>
          )}
        </div>
      </Container>
    </div>
  );
}
