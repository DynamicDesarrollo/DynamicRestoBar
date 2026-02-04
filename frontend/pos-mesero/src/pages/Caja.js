import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Modal,
  Alert,
  Spinner,
  Badge,
  Table,
} from 'react-bootstrap';
import toast from 'react-hot-toast';
import { cajaService, ordenesService } from '../services/api';
import { useAuthStore } from '../stores';
import FacturaTirilla from '../components/FacturaTirilla';
import { formatMoney } from '../utils/formatters';
import './Caja.css';

export default function Caja() {
  const navigate = useNavigate();
  const usuario = useAuthStore((state) => state.usuario);
  const logout = useAuthStore((state) => state.logout);

  // Estado de caja
  const [aperturaActual, setAperturaActual] = useState(null);
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);

  // Órdenes a pagar
  const [ordenes, setOrdenes] = useState([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  // Métodos de pago
  const [metodosPago, setMetodosPago] = useState([]);

  // Modales
  const [showAbrirCaja, setShowAbrirCaja] = useState(false);
  const [showPago, setShowPago] = useState(false);
  const [showDevolucion, setShowDevolucion] = useState(false);
  const [showCerrarCaja, setShowCerrarCaja] = useState(false);
  const [showFactura, setShowFactura] = useState(false);

  // Datos de factura
  const [facturaActual, setFacturaActual] = useState(null);
  const [ordenFactura, setOrdenFactura] = useState(null);
  const [pagosFactura, setPagosFactura] = useState([]);

  // Formularios
  const [saldoInicial, setSaldoInicial] = useState(0);
  const [montoPago, setMontoPago] = useState(0);
  const [metodoPagoId, setMetodoPagoId] = useState('');
  const [referencia, setReferencia] = useState('');
  const [esAbono, setEsAbono] = useState(false);
  const [motivoDevolucion, setMotivoDevolucion] = useState('');
  const [montoDevolucion, setMontoDevolucion] = useState(0);
  const [saldoFinal, setSaldoFinal] = useState(0);
  const [observacionesCierre, setObservacionesCierre] = useState('');

  // Funciones de carga ANTES de useEffect
  const cargarApertura = async () => {
    try {
      const res = await cajaService.getAperturaActual();
      console.log('Respuesta getAperturaActual:', res.data);
      if (res.data.data) {
        console.log('Hay caja abierta:', res.data.data);
        setAperturaActual(res.data.data);
        setCajaAbierta(true);
      } else {
        console.log('No hay caja abierta');
        setCajaAbierta(false);
        setAperturaActual(null);
      }
    } catch (err) {
      console.error('Error al cargar apertura:', err);
      setCajaAbierta(false);
    } finally {
      setLoading(false);
    }
  };

  const cargarMetodosPago = async () => {
    try {
      const res = await cajaService.getMetodosPago();
      if (res.data.data) {
        setMetodosPago(res.data.data);
        if (res.data.data.length > 0) {
          setMetodoPagoId(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error al cargar métodos de pago:', err);
    }
  };

  const cargarOrdenes = async () => {
    try {
      // Obtener órdenes abiertas o en precuenta
      const res = await ordenesService.getOrdenesPendientes();
      if (res.data.data) {
        setOrdenes(res.data.data.filter(o => 
          o.estado === 'abierta' || o.estado === 'lista'
        ));
      }
    } catch (err) {
      console.error('Error al cargar órdenes:', err);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    cargarApertura();
    cargarMetodosPago();
    cargarOrdenes();

    // Recargar cuando vuelve a la página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        cargarApertura();
        cargarOrdenes();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // ==================== CAJA ====================
  const handleAbrirCaja = async () => {
    try {
      setProcesando(true);
      const res = await cajaService.abrirCaja({
        monto_inicial: parseFloat(saldoInicial) || 0,
      });
      
      toast.success('Caja abierta');
      setAperturaActual(res.data.data);
      setCajaAbierta(true);
      setShowAbrirCaja(false);
      setSaldoInicial(0);
    } catch (err) {
      console.error('Error completo:', err);
      toast.error(err.response?.data?.error || 'Error al abrir caja');
    } finally {
      setProcesando(false);
    }
  };

  const handleCerrarCaja = async () => {
    try {
      setProcesando(true);
      const res = await cajaService.cerrarCaja({
        saldo_final: parseFloat(saldoFinal) || 0,
        observaciones: observacionesCierre,
      });

      toast.success('Caja cerrada');
      setShowCerrarCaja(false);
      setSaldoFinal(0);
      setObservacionesCierre('');
      await cargarApertura();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cerrar caja');
    } finally {
      setProcesando(false);
    }
  };

  // ==================== PAGOS ====================
  const handleRegistrarPago = async () => {
    if (!ordenSeleccionada || !montoPago || !metodoPagoId) {
      toast.error('Complete todos los campos');
      return;
    }

    try {
      setProcesando(true);
      const res = await cajaService.registrarPago({
        orden_id: ordenSeleccionada.id,
        monto: parseFloat(montoPago),
        metodo_pago_id: parseInt(metodoPagoId),
        referencia: referencia || null,
        es_abono: esAbono,
      });

      toast.success(res.data.message);
      
      // Si el pago está completo, mostrar factura
      if (res.data.data?.orden?.pagado) {
        // Obtener datos completos para la factura
        const facturaData = res.data.data.factura;
        const ordenData = res.data.data.orden;
        
        setFacturaActual(facturaData);
        setOrdenFactura({
          ...ordenSeleccionada,
          ...ordenData,
          usuario_nombre: usuario?.nombre,
          items: ordenData.items || [],
        });
        
        // Simplemente usar el pago actual registrado
        setPagosFactura([{
          metodo_nombre: metodosPago.find(m => m.id === parseInt(metodoPagoId))?.nombre || 'Sin definir',
          monto: parseFloat(montoPago),
          referencia: referencia || '',
        }]);
        
        setShowFactura(true);
      }
      
      setShowPago(false);
      setMontoPago(0);
      setReferencia('');
      setEsAbono(false);
      setOrdenSeleccionada(null);
      await cargarOrdenes();
      await cargarApertura();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrar pago');
    } finally {
      setProcesando(false);
    }
  };

  // ==================== DEVOLUCIONES ====================
  const handleProcesarDevolucion = async () => {
    if (!ordenSeleccionada || !motivoDevolucion) {
      toast.error('Complete todos los campos');
      return;
    }

    try {
      setProcesando(true);
      const res = await cajaService.procesarDevolucion({
        orden_id: ordenSeleccionada.id,
        motivo: motivoDevolucion,
        monto_devuelto: parseFloat(montoDevolucion) || ordenSeleccionada.total,
      });

      toast.success('Devolución registrada');
      setShowDevolucion(false);
      setMotivoDevolucion('');
      setMontoDevolucion(0);
      setOrdenSeleccionada(null);
      await cargarOrdenes();
      await cargarApertura();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al procesar devolución');
    } finally {
      setProcesando(false);
    }
  };

  const abrirModalPago = (orden) => {
    setOrdenSeleccionada(orden);
    // Calcular el saldo pendiente (total - lo ya pagado)
    const montoPendiente = orden.total - (orden.monto_pagado || 0);
    setMontoPago(montoPendiente);
    setEsAbono(false);
    setShowPago(true);
  };

  const abrirModalDevolucion = (orden) => {
    setOrdenSeleccionada(orden);
    setMontoDevolucion(orden.total);
    setShowDevolucion(true);
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container fluid className="caja-container p-0">
      {/* HEADER */}
      <div className="caja-header text-white py-3 mb-4">
        <Container fluid className="px-4">
          <Row className="align-items-center">
            <Col>
              <h1 className="mb-0">💳 Gestión de Caja</h1>
              <small>Operario: {usuario?.nombre}</small>
            </Col>
            <Col className="text-end d-flex align-items-center justify-content-end gap-2">
              {cajaAbierta ? (
                <Badge bg="success" className="fs-6">
                  ✅ Caja Abierta
                </Badge>
              ) : (
                <Badge bg="danger" className="fs-6">
                  ❌ Caja Cerrada
                </Badge>
              )}
              <Button
                variant="outline-light"
                size="sm"
                onClick={() => {
                  logout();
                  toast.success('Sesión cerrada');
                  navigate('/login');
                }}
              >
                🚪 Cerrar Sesión
              </Button>
            </Col>
          </Row>
        </Container>
      </div>
      
      <Container fluid className="px-4">

      {/* ESTADO DE CAJA */}
      {cajaAbierta && aperturaActual && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h6>Saldo Inicial</h6>
                <h5>{formatMoney(aperturaActual.monto_inicial)}</h5>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center bg-success text-white">
              <Card.Body>
                <h6>Ingresos</h6>
                <h5>{formatMoney(aperturaActual.resumen?.ingresos || 0)}</h5>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center bg-danger text-white">
              <Card.Body>
                <h6>Egresos</h6>
                <h5>{formatMoney(aperturaActual.resumen?.egresos || 0)}</h5>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center bg-primary text-white">
              <Card.Body>
                <h6>Total en Caja</h6>
                <h5>{formatMoney(aperturaActual.resumen?.total || 0)}</h5>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* BOTONES DE CAJA */}
      <Row className="mb-4 gap-2">
        {!cajaAbierta ? (
          <Col>
            <Button
              variant="success"
              size="lg"
              className="w-100"
              onClick={() => setShowAbrirCaja(true)}
            >
              🟢 Abrir Caja
            </Button>
          </Col>
        ) : (
          <>
            <Col md={6}>
              <Button
                variant="warning"
                size="lg"
                className="w-100"
                onClick={() => setShowCerrarCaja(true)}
              >
                🔴 Cerrar Caja
              </Button>
            </Col>
            <Col md={6} className="text-muted">
              Abierta desde{' '}
              {aperturaActual && (
                <>
                  <strong>
                    {new Date(aperturaActual.hora_apertura).toLocaleDateString('es-CO')}
                  </strong>
                  {' - '}
                  <strong>
                    {new Date(aperturaActual.hora_apertura).toLocaleTimeString('es-CO')}
                  </strong>
                </>
              )}
            </Col>
          </>
        )}
      </Row>

      {/* ÓRDENES A PAGAR */}
      {cajaAbierta && (
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <h5>📋 Órdenes Pendientes de Pago</h5>
              </Card.Header>
              <Card.Body>
                {ordenes.length === 0 ? (
                  <Alert variant="info">No hay órdenes pendientes</Alert>
                ) : (
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Orden</th>
                        <th>Mesa</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordenes.map((orden) => (
                        <tr key={orden.id}>
                          <td>#{orden.numero_orden}</td>
                          <td>{orden.mesa_numero || '-'}</td>
                          <td>{formatMoney(orden.total)}</td>
                          <td>
                            <Badge bg="warning">{orden.estado}</Badge>
                          </td>
                          <td>
                            <Button
                              variant="primary"
                              size="sm"
                              className="me-2"
                              onClick={() => abrirModalPago(orden)}
                            >
                              Pagar
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="me-2"
                              onClick={() => abrirModalDevolucion(orden)}
                            >
                              Devolver
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* ==================== MODALES ==================== */}

      {/* MODAL: ABRIR CAJA */}
      <Modal show={showAbrirCaja} onHide={() => setShowAbrirCaja(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Abrir Caja</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Saldo Inicial</Form.Label>
            <Form.Control
              type="number"
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(e.target.value)}
              step="100"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAbrirCaja(false)}>
            Cancelar
          </Button>
          <Button
            variant="success"
            onClick={handleAbrirCaja}
            disabled={procesando}
          >
            {procesando ? <Spinner size="sm" /> : '✅ Abrir'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL: PAGO */}
      <Modal show={showPago} onHide={() => setShowPago(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Registrar Pago - Orden #{ordenSeleccionada?.numero_orden}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Alert variant="info" className="mb-3">
              <div className="d-flex justify-content-between mb-2">
                <span>Total de la Orden:</span>
                <strong>{formatMoney(ordenSeleccionada?.total)}</strong>
              </div>
              {ordenSeleccionada?.monto_pagado > 0 && (
                <>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Ya Pagado:</span>
                    <strong className="text-success">{formatMoney(ordenSeleccionada?.monto_pagado)}</strong>
                  </div>
                  <div className="d-flex justify-content-between border-top pt-2">
                    <span>Saldo Pendiente:</span>
                    <strong className="text-danger">
                      {formatMoney(ordenSeleccionada?.total - ordenSeleccionada?.monto_pagado)}
                    </strong>
                  </div>
                </>
              )}
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label>Método de Pago</Form.Label>
              <Form.Select
                value={metodoPagoId}
                onChange={(e) => setMetodoPagoId(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {metodosPago.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Monto a Pagar</Form.Label>
              <Form.Control
                type="number"
                value={montoPago}
                onChange={(e) => setMontoPago(e.target.value)}
                step="100"
                min="0"
                max={ordenSeleccionada?.total - (ordenSeleccionada?.monto_pagado || 0)}
              />
              <Form.Text className="text-muted">
                {esAbono 
                  ? 'Ingrese el monto del abono (puede ser menor al total)'
                  : 'Para pago completo, deje el monto total'}
              </Form.Text>
            </Form.Group>

            {referencia !== undefined && (
              <Form.Group className="mb-3">
                <Form.Label>Referencia (Tarjeta/Transferencia)</Form.Label>
                <Form.Control
                  type="text"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="Ej: 1234-5678-9012-3456"
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Es abono (pago parcial)"
                checked={esAbono}
                onChange={(e) => {
                  setEsAbono(e.target.checked);
                  if (!e.target.checked) {
                    // Si desmarca abono, volver al monto completo
                    setMontoPago(ordenSeleccionada?.total - (ordenSeleccionada?.monto_pagado || 0));
                  }
                }}
              />
              <Form.Text className="text-muted">
                Marque esta opción si el cliente pagará en múltiples cuotas
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPago(false)}>
            Cancelar
          </Button>
          <Button
            variant="success"
            onClick={handleRegistrarPago}
            disabled={procesando}
          >
            {procesando ? <Spinner size="sm" /> : '💰 Registrar Pago'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL: DEVOLUCIÓN */}
      <Modal show={showDevolucion} onHide={() => setShowDevolucion(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            Procesar Devolución - Orden #{ordenSeleccionada?.numero_orden}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Motivo de la Devolución</Form.Label>
              <Form.Control
                type="text"
                value={motivoDevolucion}
                onChange={(e) => setMotivoDevolucion(e.target.value)}
                placeholder="Ej: Orden cancelada por cliente"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Monto a Devolver (Total: ${ordenSeleccionada?.total})
              </Form.Label>
              <Form.Control
                type="number"
                value={montoDevolucion}
                onChange={(e) => setMontoDevolucion(e.target.value)}
                step="100"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDevolucion(false)}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleProcesarDevolucion}
            disabled={procesando}
            style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
          >
            {procesando ? <Spinner size="sm" /> : '🔄 Procesar Devolución'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL: CERRAR CAJA */}
      <Modal show={showCerrarCaja} onHide={() => setShowCerrarCaja(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Cerrar Caja</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {aperturaActual && (
            <>
              <p>
                <strong>Saldo Inicial:</strong> {formatMoney(aperturaActual.monto_inicial)}
              </p>
              <p>
                <strong>Total Vendido:</strong> {formatMoney(aperturaActual.resumen?.ingresos || 0)}
              </p>
              <p>
                <strong>Devoluciones:</strong> {formatMoney(aperturaActual.resumen?.egresos || 0)}
              </p>
              <p>
                <strong>Total Esperado:</strong> {formatMoney(aperturaActual.resumen?.total || 0)}
              </p>
            </>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Saldo Final (Contar físico)</Form.Label>
            <Form.Control
              type="number"
              value={saldoFinal}
              onChange={(e) => setSaldoFinal(e.target.value)}
              step="100"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Observaciones</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={observacionesCierre}
              onChange={(e) => setObservacionesCierre(e.target.value)}
              placeholder="Ej: Diferencia de $5000 por redondeo"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCerrarCaja(false)}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleCerrarCaja}
            disabled={procesando}
            style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
          >
            {procesando ? <Spinner size="sm" /> : '🔴 Cerrar Caja'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL: FACTURA TIRILLA */}
      <FacturaTirilla
        show={showFactura}
        onHide={() => setShowFactura(false)}
        factura={facturaActual}
        orden={ordenFactura}
        pagos={pagosFactura}
      />
      </Container>
    </Container>
  );
}
