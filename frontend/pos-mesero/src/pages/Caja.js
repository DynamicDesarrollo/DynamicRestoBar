import { toast } from 'react-toastify';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Form } from 'react-bootstrap';
import { cajaService, ordenesService } from '../services/api';
import { useAuthStore } from '../stores';
import FacturaTirilla from '../components/FacturaTirilla';
import { formatMoney } from '../utils/formatters';
import {
  IconWallet, IconCash, IconLogout,
  IconCheck, IconClose, IconNote, IconArrowSwap,
} from '../components/Icons';
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

  const cargarApertura = async () => {
    try {
      const res = await cajaService.getAperturaActual();
      if (res.data.data) {
        setAperturaActual(res.data.data);
        setCajaAbierta(true);
      } else {
        setCajaAbierta(false);
        setAperturaActual(null);
      }
    } catch (err) {
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

  useEffect(() => {
    cargarApertura();
    cargarMetodosPago();
    cargarOrdenes();

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
      toast.error(err.response?.data?.error || 'Error al abrir caja');
    } finally {
      setProcesando(false);
    }
  };

  const handleCerrarCaja = async () => {
    try {
      setProcesando(true);
      await cajaService.cerrarCaja({
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

  // ==================== CIERRE: cifras derivadas ====================
  // Misma fórmula que usa el backend en cerrarCaja. El monto inicial ya está
  // contado dentro de `ingresos` (abrirCaja lo registra como movimiento), así
  // que no se vuelve a sumar; y todo valor numérico llega como string desde
  // la API, por eso el Number() explícito.
  const montoInicialCierre = Number(aperturaActual?.resumen?.monto_inicial) || 0;
  const ingresosCierre = Number(aperturaActual?.resumen?.ingresos) || 0;
  const egresosCierre = Number(aperturaActual?.resumen?.egresos) || 0;
  const totalVendidoCierre = ingresosCierre - montoInicialCierre;
  const totalEsperadoCierre = ingresosCierre - egresosCierre;
  const diferenciaCierre = (Number(saldoFinal) || 0) - totalEsperadoCierre;
  const colorDiferencia = diferenciaCierre === 0
    ? 'var(--rb-green-400, #74b98d)'
    : diferenciaCierre > 0
      ? 'var(--rb-gold-400)'
      : 'var(--rb-red-400, #e8776b)';

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

      if (res.data.data?.orden?.pagado) {
        toast.success('Factura enviada a impresora de red de Caja/Bar');
        const facturaData = res.data.data.factura;
        const ordenData = res.data.data.orden;

        setFacturaActual(facturaData);
        setOrdenFactura({
          ...ordenSeleccionada,
          ...ordenData,
          mesa_numero: ordenData?.mesa_numero || ordenSeleccionada?.mesa_numero || null,
          usuario_nombre: ordenData?.usuario_nombre || ordenSeleccionada?.usuario_nombre || usuario?.nombre || null,
          items: ordenData.items || [],
        });

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
      await cajaService.procesarDevolucion({
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
      <div className="caja-page caja-page--loading">
        <div className="rb-spinner" aria-label="Cargando caja" />
      </div>
    );
  }

  return (
    <div className="caja-page">
      {/* HEADER */}
      <div className="caja-header">
        <div className="caja-header__inner">
          <div>
            <h1 className="caja-header__title"><IconWallet /> Gestión de Caja</h1>
            <p className="caja-header__operario">Operario: {usuario?.nombre}</p>
          </div>
          <div className="caja-header__actions">
            <span className={`rb-badge ${cajaAbierta ? 'rb-badge--success' : 'rb-badge--danger'}`}>
              {cajaAbierta ? <><IconCheck style={{ width: 11, height: 11 }} /> Caja Abierta</> : <><IconClose style={{ width: 11, height: 11 }} /> Caja Cerrada</>}
            </span>
            <button
              className="rb-btn rb-btn--ghost"
              onClick={() => {
                logout();
                toast.success('Sesión cerrada');
                navigate('/login');
              }}
            >
              <IconLogout /> Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <div className="caja-content">
        {/* ESTADO DE CAJA */}
        {cajaAbierta && aperturaActual && (
          <div className="caja-stats">
            <div className="caja-stat">
              <div className="caja-stat__label">Saldo Inicial</div>
              <div className="caja-stat__value">{formatMoney(aperturaActual.monto_inicial)}</div>
            </div>
            <div className="caja-stat caja-stat--green">
              <div className="caja-stat__label">Ingresos</div>
              <div className="caja-stat__value">{formatMoney(aperturaActual.resumen?.ingresos || 0)}</div>
            </div>
            <div className="caja-stat caja-stat--danger">
              <div className="caja-stat__label">Egresos</div>
              <div className="caja-stat__value">{formatMoney(aperturaActual.resumen?.egresos || 0)}</div>
            </div>
            <div className="caja-stat caja-stat--gold">
              <div className="caja-stat__label">Total en Caja</div>
              <div className="caja-stat__value">{formatMoney(aperturaActual.resumen?.total || 0)}</div>
            </div>
          </div>
        )}

        {/* BOTONES DE CAJA */}
        <div className="caja-actions-row">
          {!cajaAbierta ? (
            <button className="rb-btn rb-btn--primary" onClick={() => setShowAbrirCaja(true)}>
              <IconCheck /> Abrir Caja
            </button>
          ) : (
            <>
              <button className="rb-btn rb-btn--primary" onClick={() => setShowCerrarCaja(true)}>
                <IconClose /> Cerrar Caja
              </button>
              {aperturaActual && (
                <span className="caja-abierta-desde">
                  Abierta desde{' '}
                  <strong>{new Date(aperturaActual.hora_apertura).toLocaleDateString('es-CO')}</strong>
                  {' - '}
                  <strong>{new Date(aperturaActual.hora_apertura).toLocaleTimeString('es-CO')}</strong>
                </span>
              )}
            </>
          )}
        </div>

        {/* ÓRDENES A PAGAR */}
        {cajaAbierta && (
          <div className="caja-panel">
            <div className="caja-panel__header">
              <IconNote />
              <h2>Órdenes Pendientes de Pago</h2>
            </div>
            <div className="caja-panel__body">
              {ordenes.length === 0 ? (
                <div className="rb-alert rb-alert--warning">No hay órdenes pendientes</div>
              ) : (
                <div className="table-responsive">
                  <table className="caja-ordenes-table">
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
                          <td><span className="rb-badge rb-badge--neutral">{orden.estado}</span></td>
                          <td>
                            <button className="rb-btn rb-btn--primary" onClick={() => abrirModalPago(orden)}>
                              <IconCash /> Pagar
                            </button>
                            <button className="rb-btn rb-btn--ghost" onClick={() => abrirModalDevolucion(orden)}>
                              <IconArrowSwap /> Devolver
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ==================== MODALES ==================== */}

      {/* MODAL: ABRIR CAJA */}
      <Modal show={showAbrirCaja} onHide={() => setShowAbrirCaja(false)} className="rb-modal">
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
          <button className="rb-btn rb-btn--ghost" onClick={() => setShowAbrirCaja(false)}>
            Cancelar
          </button>
          <button className="rb-btn rb-btn--primary" onClick={handleAbrirCaja} disabled={procesando}>
            <IconCheck /> {procesando ? 'Abriendo...' : 'Abrir'}
          </button>
        </Modal.Footer>
      </Modal>

      {/* MODAL: PAGO */}
      <Modal show={showPago} onHide={() => setShowPago(false)} size="lg" className="rb-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            Registrar Pago - Orden #{ordenSeleccionada?.numero_orden}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="rb-alert" style={{ background: 'rgba(74, 151, 163, 0.1)', border: '1px solid rgba(74, 151, 163, 0.35)', color: 'var(--rb-cyan-400)', marginBottom: 18 }}>
              <div className="caja-modal-linea">
                <span>Total de la Orden:</span>
                <strong>{formatMoney(ordenSeleccionada?.total)}</strong>
              </div>
              {ordenSeleccionada?.monto_pagado > 0 && (
                <>
                  <div className="caja-modal-linea">
                    <span>Ya Pagado:</span>
                    <strong style={{ color: 'var(--rb-green-400)' }}>{formatMoney(ordenSeleccionada?.monto_pagado)}</strong>
                  </div>
                  <div className="caja-modal-linea caja-modal-linea--total">
                    <span>Saldo Pendiente:</span>
                    <strong style={{ color: '#f0958c' }}>
                      {formatMoney(ordenSeleccionada?.total - ordenSeleccionada?.monto_pagado)}
                    </strong>
                  </div>
                </>
              )}
            </div>

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
          <button className="rb-btn rb-btn--ghost" onClick={() => setShowPago(false)}>
            Cancelar
          </button>
          <button className="rb-btn rb-btn--primary" onClick={handleRegistrarPago} disabled={procesando}>
            <IconCash /> {procesando ? 'Registrando...' : 'Registrar Pago'}
          </button>
        </Modal.Footer>
      </Modal>

      {/* MODAL: DEVOLUCIÓN */}
      <Modal show={showDevolucion} onHide={() => setShowDevolucion(false)} className="rb-modal">
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
                Monto a Devolver (Total: {formatMoney(ordenSeleccionada?.total)})
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
          <button className="rb-btn rb-btn--ghost" onClick={() => setShowDevolucion(false)}>
            Cancelar
          </button>
          <button className="rb-btn rb-btn--primary" onClick={handleProcesarDevolucion} disabled={procesando}>
            <IconArrowSwap /> {procesando ? 'Procesando...' : 'Procesar Devolución'}
          </button>
        </Modal.Footer>
      </Modal>

      {/* MODAL: CERRAR CAJA */}
      <Modal show={showCerrarCaja} onHide={() => setShowCerrarCaja(false)} className="rb-modal">
        <Modal.Header closeButton>
          <Modal.Title>Cerrar Caja</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {aperturaActual && (
            <div style={{ marginBottom: 16, fontSize: '0.9rem', color: 'var(--rb-cream-300)' }}>
              <div className="caja-modal-linea">
                <span>Saldo Inicial:</span>
                <strong>{formatMoney(montoInicialCierre)}</strong>
              </div>
              <div className="caja-modal-linea">
                <span>Total Vendido:</span>
                <strong>{formatMoney(totalVendidoCierre)}</strong>
              </div>
              <div className="caja-modal-linea">
                <span>Devoluciones:</span>
                <strong>{formatMoney(egresosCierre)}</strong>
              </div>
              <div className="caja-modal-linea caja-modal-linea--total">
                <span>Total Esperado:</span>
                <strong style={{ color: 'var(--rb-gold-400)' }}>{formatMoney(totalEsperadoCierre)}</strong>
              </div>
            </div>
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

          {aperturaActual && (
            <div
              className="caja-modal-linea caja-modal-linea--total"
              style={{ marginBottom: 16 }}
            >
              <span>Diferencia:</span>
              <strong style={{ color: colorDiferencia }}>
                {diferenciaCierre > 0 ? '+' : ''}{formatMoney(diferenciaCierre)}
                <span style={{ fontWeight: 400, fontSize: '0.82rem', marginLeft: 8, color: 'var(--rb-cream-500)' }}>
                  {diferenciaCierre === 0 ? 'cuadra' : diferenciaCierre > 0 ? 'sobrante' : 'faltante'}
                </span>
              </strong>
            </div>
          )}

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
          <button className="rb-btn rb-btn--ghost" onClick={() => setShowCerrarCaja(false)}>
            Cancelar
          </button>
          <button className="rb-btn rb-btn--primary" onClick={handleCerrarCaja} disabled={procesando}>
            <IconClose /> {procesando ? 'Cerrando...' : 'Cerrar Caja'}
          </button>
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
    </div>
  );
}