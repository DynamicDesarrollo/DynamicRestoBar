import { toast } from 'react-toastify';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Spinner,
  Alert,
  Tabs,
  Tab,
} from 'react-bootstrap';
// import toast from 'react-hot-toast';
import { kdsService } from '../services/api';
import { useAuthStore } from '../stores';
import './Kds.css';

export default function Kds() {
  const navigate = useNavigate();
  const usuario = useAuthStore((state) => state.usuario);
  const logout = useAuthStore((state) => state.logout);
  const sedeId = localStorage.getItem('sedeId');
  
  const [estaciones, setEstaciones] = useState([]);
  const [estacionId, setEstacionId] = useState(null);
  const [comandas, setComandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actualizando, setActualizando] = useState(false);
  const [tabActiva, setTabActiva] = useState('pendientes');

  // Verificar autenticación
  useEffect(() => {
    if (!usuario) {
      navigate('/login');
      return;
    }
    if (!sedeId) {
      setError('No se encontró la sede. Por favor, inicia sesión de nuevo.');
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [usuario, sedeId, navigate]);

  // Cargar estaciones de la sede
  useEffect(() => {
    const cargarEstaciones = async () => {
      try {
        if (!sedeId) {
          setError('No se encontró la sede');
          setLoading(false);
          return;
        }
        
        console.log(`🏢 Cargando estaciones para sede: ${sedeId}`);
        const res = await kdsService.getEstacionesPorSede(parseInt(sedeId));
        console.log(`✅ Estaciones cargadas:`, res.data.data);
        setEstaciones(res.data.data || []);
        
        // Seleccionar la primera estación por defecto (preferir Cocina)
        if (res.data.data && res.data.data.length > 0) {
          const cocina = res.data.data.find(e => e.tipo === 'cocina') || res.data.data[0];
          console.log(`🏪 Estación seleccionada: ${cocina.nombre} (ID: ${cocina.id})`);
          setEstacionId(cocina.id);
        } else {
          setError('No hay estaciones disponibles');
        }
        setLoading(false);
      } catch (err) {
        console.error('❌ Error cargando estaciones:', err);
        setError(`Error al cargar estaciones: ${err.message}`);
        setLoading(false);
      }
    };
    
    if (sedeId && usuario) {
      cargarEstaciones();
    }
  }, [sedeId, usuario]);

  const cargarComandas = useCallback(async () => {
    // No cargar si estacionId no está definido
    if (!estacionId) return;
    
    try {
      setLoading(true);
      const res = await kdsService.getComandaByEstacion(estacionId);
      const comandasData = res.data.data || [];
      console.log(`📊 Comandas recibidas (Estación ${estacionId}):`, comandasData);
      console.log(`   Total: ${comandasData.length}`);
      console.log(`   Pendientes: ${comandasData.filter(c => c.estado === 'pendiente').length}`);
      console.log(`   En preparación: ${comandasData.filter(c => c.estado === 'en_preparacion').length}`);
      console.log(`   Listas: ${comandasData.filter(c => c.estado === 'lista').length}`);
      console.log(`   Entregadas: ${comandasData.filter(c => c.estado === 'entregada').length}`);
      setComandas(comandasData);
      setError('');
    } catch (err) {
      const mensaje = err.response?.data?.message || 'Error al cargar comandas';
      console.error('❌ Error cargando comandas:', err);
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setLoading(false);
    }
  }, [estacionId]);

  useEffect(() => {
    cargarComandas();
    // Recargar cada 15 segundos
    const interval = setInterval(cargarComandas, 15000);
    return () => clearInterval(interval);
  }, [cargarComandas]);

  const handleEstadoComanda = async (comandaId, nuevoEstado) => {
    try {
      setActualizando(true);
      await kdsService.updateEstadoComanda(comandaId, nuevoEstado);
      toast.success(`Comanda actualizada a ${nuevoEstado}`);
      await cargarComandas();
    } catch (err) {
      toast.error('Error al actualizar comanda');
    } finally {
      setActualizando(false);
    }
  };

  const handleEstadoItem = async (itemId, nuevoEstado) => {
    try {
      setActualizando(true);
      await kdsService.updateEstadoItem(itemId, nuevoEstado);
      toast.success(`Item actualizado a ${nuevoEstado}`);
      // Pequeño delay para asegurar que la BD procese la actualización
      await new Promise(resolve => setTimeout(resolve, 300));
      await cargarComandas();
    } catch (err) {
      toast.error('Error al actualizar item');
    } finally {
      setActualizando(false);
    }
  };

  const getBadgeEstado = (estado) => {
    const estados = {
      pendiente: 'danger',
      en_preparacion: 'warning',
      lista: 'success',
      entregada: 'secondary',
    };
    return estados[estado] || 'secondary';
  };

  const getBotonEstado = (estado) => {
    const transiciones = {
      pendiente: { siguiente: 'en_preparacion', label: 'Empezar a preparar' },
      en_preparacion: { siguiente: 'lista', label: 'Marcar como listo' },
      lista: { siguiente: 'entregada', label: 'Entregado' },
      entregada: null,
    };
    return transiciones[estado];
  };

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    navigate('/login');
  };

  // Filtrar órdenes por estado
  const ordenesPendientes = comandas.filter(c => 
    ['pendiente', 'en_preparacion'].includes(c.estado)
  );
  
  const ordenesListas = comandas.filter(c => 
    c.estado === 'lista'
  );
  
  const ordenesEntregadas = comandas.filter(c => 
    c.estado === 'entregada'
  );

  // Formatear fecha y hora
  const formatearFechaHora = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      const date = new Date(fecha);
      const dia = date.toLocaleDateString('es-ES');
      const hora = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      return `${dia} ${hora}`;
    } catch (e) {
      return fecha;
    }
  };

  if (loading) {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="text-center">
          <Spinner animation="border" variant="danger" className="mb-3" />
          <p className="text-muted">Cargando estaciones...</p>
          <small className="text-muted d-block">Sede ID: {sedeId}</small>
          <small className="text-muted d-block">Usuario: {usuario?.nombre}</small>
        </div>
      </Container>
    );
  }

  return (
    <div className="kds-page">
      {/* Header */}
      <div className="kds-header text-white py-3">
        <Container>
          <Row className="align-items-center">
            <Col>
              <h2 className="mb-0">🍳 Kitchen Display System</h2>
              <small className="text-muted">Operario: {usuario?.nombre}</small>
            </Col>
            <Col className="text-end">
              <Button
                variant="outline-light"
                size="sm"
                onClick={cargarComandas}
                disabled={loading}
                className="me-2"
              >
                🔄 Actualizar
              </Button>
              <Button
                variant="outline-light"
                size="sm"
                onClick={handleLogout}
              >
                🚪 Cerrar Sesión
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      {error && (
        <Container className="mt-3">
          <Alert variant="danger">{error}</Alert>
        </Container>
      )}

      <Container fluid className="py-4">
        {/* Selector de Estaciones */}
        <Row className="mb-4">
          <Col md={4}>
            <div className="d-flex gap-2 flex-wrap">
              {estaciones.length > 0 ? (
                estaciones.map((estacion) => (
                  <Button
                    key={estacion.id}
                    variant={estacionId === estacion.id ? "danger" : "outline-danger"}
                    onClick={() => setEstacionId(estacion.id)}
                    className="mb-2"
                  >
                    🏪 {estacion.nombre}
                  </Button>
                ))
              ) : (
                <p className="text-muted">Cargando estaciones...</p>
              )}
            </div>
          </Col>
        </Row>

        <Tabs activeKey={tabActiva} onSelect={(k) => setTabActiva(k)} className="mb-4">
          {/* TAB: Órdenes Pendientes */}
          <Tab eventKey="pendientes" title={`📋 Pendientes (${ordenesPendientes.length})`}>
            {ordenesPendientes.length === 0 ? (
              <Alert variant="success" className="text-center mt-4">
                ✅ No hay órdenes pendientes
              </Alert>
            ) : (
              <Row className="g-3">
                {ordenesPendientes.map((comanda) => (
                  <Col lg={6} xl={4} key={comanda.id}>
                    <Card className={`comanda-card h-100 border-${getBadgeEstado(comanda.estado)}`}>
                      {/* Header de comanda */}
                      <Card.Header className={`bg-${getBadgeEstado(comanda.estado)} text-white`}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h5 className="mb-0">#{comanda.numero_comanda}</h5>
                            <small>Mesa {comanda.mesa_numero || 'N/A'}</small>
                          </div>
                          <Badge bg={getBadgeEstado(comanda.estado)}>
                            {comanda.estado.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </Card.Header>

                      {/* Items */}
                      <Card.Body>
                        {comanda.items && comanda.items.length > 0 ? (
                          <div className="items-list">
                            {comanda.items.map((item) => (
                              <div key={item.id} className="item-card mb-2 p-2 bg-light rounded">
                                <div className="d-flex justify-content-between align-items-start">
                                  <div>
                                    <h6 className="mb-1">{item.nombre}</h6>
                                    <small className="text-muted">
                                      Cantidad: {item.cantidad}
                                    </small>
                                    {item.notas_especiales && (
                                      <div className="mt-1">
                                        <small className="text-warning">
                                          📝 {item.notas_especiales}
                                        </small>
                                      </div>
                                    )}
                                  </div>
                                  <Badge bg={getBadgeEstado(item.estado)}>
                                    {item.estado.replace('_', ' ')}
                                  </Badge>
                                </div>

                                {/* Botones de estado del item */}
                                {getBotonEstado(item.estado) && (
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="mt-2 w-100"
                                    onClick={() =>
                                      handleEstadoItem(
                                        item.id,
                                        getBotonEstado(item.estado).siguiente
                                      )
                                    }
                                    disabled={actualizando}
                                  >
                                    {getBotonEstado(item.estado).label}
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted">Sin items</p>
                        )}
                      </Card.Body>

                      {/* Footer - Botones de comanda */}
                      <Card.Footer className="bg-light">
                        {getBotonEstado(comanda.estado) && (
                          <Button
                            variant="success"
                            size="sm"
                            className="w-100"
                            onClick={() =>
                              handleEstadoComanda(
                                comanda.id,
                                getBotonEstado(comanda.estado).siguiente
                              )
                            }
                            disabled={actualizando}
                          >
                            {getBotonEstado(comanda.estado).label}
                          </Button>
                        )}
                      </Card.Footer>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Tab>

          {/* TAB: Órdenes Listas para Entregar */}
          <Tab eventKey="listas" title={`⏳ Listas (${ordenesListas.length})`}>
            {ordenesListas.length === 0 ? (
              <Alert variant="info" className="text-center mt-4">
                ℹ️ No hay órdenes listas
              </Alert>
            ) : (
              <Row className="g-3">
                {ordenesListas.map((comanda) => (
                  <Col lg={6} xl={4} key={comanda.id}>
                    <Card className={`comanda-card h-100 border-${getBadgeEstado(comanda.estado)}`}>
                      {/* Header de comanda */}
                      <Card.Header className={`bg-${getBadgeEstado(comanda.estado)} text-white`}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h5 className="mb-0">#{comanda.numero_comanda}</h5>
                            <small>Mesa {comanda.mesa_numero || 'N/A'}</small>
                          </div>
                          <Badge bg={getBadgeEstado(comanda.estado)}>
                            {comanda.estado.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </Card.Header>

                      {/* Items */}
                      <Card.Body>
                        {comanda.items && comanda.items.length > 0 ? (
                          <div className="items-list">
                            {comanda.items.map((item) => (
                              <div key={item.id} className="item-card mb-2 p-2 bg-light rounded">
                                <div className="d-flex justify-content-between align-items-start">
                                  <div>
                                    <h6 className="mb-1">{item.nombre}</h6>
                                    <small className="text-muted">
                                      Cantidad: {item.cantidad}
                                    </small>
                                    {item.notas_especiales && (
                                      <div className="mt-1">
                                        <small className="text-warning">
                                          📝 {item.notas_especiales}
                                        </small>
                                      </div>
                                    )}
                                  </div>
                                  <Badge bg={getBadgeEstado(item.estado)}>
                                    {item.estado.replace('_', ' ')}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted text-center">Sin items</p>
                        )}
                      </Card.Body>

                      {/* Footer - Botones de comanda */}
                      <Card.Footer className="bg-light">
                        {getBotonEstado(comanda.estado) && (
                          <Button
                            variant="success"
                            size="sm"
                            className="w-100"
                            onClick={() =>
                              handleEstadoComanda(
                                comanda.id,
                                getBotonEstado(comanda.estado).siguiente
                              )
                            }
                            disabled={actualizando}
                          >
                            {getBotonEstado(comanda.estado).label}
                          </Button>
                        )}
                      </Card.Footer>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Tab>

          {/* TAB: Órdenes Entregadas */}
          <Tab eventKey="entregadas" title={`✅ Entregadas (${ordenesEntregadas.length})`}>
            {ordenesEntregadas.length === 0 ? (
              <Alert variant="info" className="text-center mt-4">
                📭 Sin órdenes entregadas hoy
              </Alert>
            ) : (
              <div className="mt-3">
                {ordenesEntregadas.map((comanda) => (
                  <Card key={comanda.id} className="mb-3 border-success">
                    <Card.Header className="bg-success text-white">
                      <Row className="align-items-center">
                        <Col>
                          <h6 className="mb-0">Orden #{comanda.numero_comanda}</h6>
                          <small>Mesa {comanda.mesa_numero || 'N/A'}</small>
                        </Col>
                        <Col className="text-end">
                          <Badge bg="success">ENTREGADA</Badge>
                        </Col>
                      </Row>
                    </Card.Header>
                    <Card.Body>
                      <Row className="mb-3">
                        <Col md={6}>
                          <h6>📝 Detalles</h6>
                          {comanda.items && comanda.items.length > 0 ? (
                            <ul className="list-unstyled small">
                              {comanda.items.map((item) => (
                                <li key={item.id}>
                                  • {item.nombre} x{item.cantidad}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-muted small">Sin items</p>
                          )}
                        </Col>
                        <Col md={6}>
                          <h6>🕐 Fecha y Hora de Entrega</h6>
                          <p className="mb-0">
                            <strong>{formatearFechaHora(comanda.updated_at)}</strong>
                          </p>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </Tab>
        </Tabs>
      </Container>
    </div>
  );
}
