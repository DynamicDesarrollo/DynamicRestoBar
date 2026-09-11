import { toast } from 'react-toastify';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Form } from 'react-bootstrap';
import { cajaService, ordenesService, productosService } from '../services/api';
import { useAuthStore } from '../stores';
import FacturaTirilla from '../components/FacturaTirilla';
import { formatMoney } from '../utils/formatters';
import {
  IconWallet, IconCash, IconLogout,
  IconCheck, IconClose, IconNote, IconArrowSwap, IconTrash, IconPlus, IconMinus,
} from '../components/Icons';
import './Caja.css';

const MODOS_DEVOLUCION = {
  COMPLETA: 'completa',
  ITEM: 'item',
  CAMBIO: 'cambio',
};

// DIAN permite identificar a quien no quiere dar sus datos como
// "consumidor final" con este documento genérico — así el cajero no
// tiene que negarle la factura a nadie por no traer cédula.
const NIT_CONSUMIDOR_FINAL = '222222222222';

const TIPOS_DOCUMENTO_COMPRADOR = [
  { value: 'consumidor_final', label: 'Consumidor final (sin documento)' },
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'NIT', label: 'NIT' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'PAS', label: 'Pasaporte' },
];

const initialComprador = {
  tipo_documento: 'CC',
  numero_documento: '',
  nombre_razon_social: '',
  email: '',
  telefono: '',
};

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
  const [necesitaFacturaElectronica, setNecesitaFacturaElectronica] = useState(false);
  const [comprador, setComprador] = useState(initialComprador);
  const [motivoDevolucion, setMotivoDevolucion] = useState('');
  const [montoDevolucion, setMontoDevolucion] = useState(0);
  const [modoDevolucion, setModoDevolucion] = useState(MODOS_DEVOLUCION.COMPLETA);
  const [itemsOrdenDevolucion, setItemsOrdenDevolucion] = useState([]);
  const [cargandoItemsDevolucion, setCargandoItemsDevolucion] = useState(false);
  const [itemsARetornar, setItemsARetornar] = useState({}); // { [orden_item_id]: cantidadADevolver }
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [productoReemplazoId, setProductoReemplazoId] = useState('');
  const [cantidadReemplazo, setCantidadReemplazo] = useState(1);
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

    // Refresca la lista de órdenes pendientes periódicamente para que una
    // orden nueva del mesero aparezca sola, sin que el cajero tenga que
    // recargar la página (mismo patrón de polling que ya usa el KDS).
    const interval = setInterval(cargarOrdenes, 15000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        cargarApertura();
        cargarOrdenes();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
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

    if (necesitaFacturaElectronica) {
      if (!comprador.numero_documento || !comprador.nombre_razon_social) {
        toast.error('Para la factura electrónica falta el documento o el nombre del comprador');
        return;
      }
    }

    try {
      setProcesando(true);
      const res = await cajaService.registrarPago({
        orden_id: ordenSeleccionada.id,
        monto: parseFloat(montoPago),
        metodo_pago_id: parseInt(metodoPagoId),
        referencia: referencia || null,
        es_abono: esAbono,
        comprador: necesitaFacturaElectronica ? comprador : undefined,
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
      setNecesitaFacturaElectronica(false);
      setComprador(initialComprador);
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
  const cerrarModalDevolucion = () => {
    setShowDevolucion(false);
    setMotivoDevolucion('');
    setMontoDevolucion(0);
    setModoDevolucion(MODOS_DEVOLUCION.COMPLETA);
    setItemsOrdenDevolucion([]);
    setItemsARetornar({});
    setProductoReemplazoId('');
    setCantidadReemplazo(1);
    setOrdenSeleccionada(null);
  };

  const toggleItemARetornar = (item) => {
    setItemsARetornar((prev) => {
      const next = { ...prev };
      if (next[item.id]) {
        delete next[item.id];
      } else {
        // Por defecto se marca la línea completa; el cajero puede bajar
        // la cantidad si solo se devuelve parte (ej. 2 de 4 cervezas).
        next[item.id] = item.cantidad;
      }
      return next;
    });
  };

  const cambiarCantidadARetornar = (item, cantidad) => {
    const cantidadNum = Math.max(1, Math.min(item.cantidad, parseInt(cantidad, 10) || 1));
    setItemsARetornar((prev) => ({ ...prev, [item.id]: cantidadNum }));
  };

  const handleSeleccionarModoDevolucion = async (modo) => {
    setModoDevolucion(modo);
    setItemsARetornar({});
    if (modo === MODOS_DEVOLUCION.CAMBIO && productosDisponibles.length === 0) {
      try {
        const res = await productosService.getAll(usuario?.sedeId);
        setProductosDisponibles(res.data?.data || []);
      } catch (err) {
        toast.error('No se pudo cargar el catálogo de productos');
      }
    }
  };

  const handleProcesarDevolucion = async () => {
    if (!ordenSeleccionada) return;

    // ---- Cancelar la orden completa: comportamiento de siempre ----
    if (modoDevolucion === MODOS_DEVOLUCION.COMPLETA) {
      if (!motivoDevolucion) {
        toast.error('Indique el motivo de la devolución');
        return;
      }
      try {
        setProcesando(true);
        await cajaService.procesarDevolucion({
          orden_id: ordenSeleccionada.id,
          motivo: motivoDevolucion,
          monto_devuelto: parseFloat(montoDevolucion) || 0,
        });
        toast.success('Orden cancelada');
        cerrarModalDevolucion();
        await cargarOrdenes();
        await cargarApertura();
      } catch (err) {
        toast.error(err.response?.data?.error || 'Error al procesar devolución');
      } finally {
        setProcesando(false);
      }
      return;
    }

    // ---- Devolver un producto / Cambiarlo: se reenvía el carrito
    // ajustado por la misma ruta que usa el mesero para editar una orden
    // abierta (POST /ordenes) — así cocina/bar reciben el ticket correcto
    // de "cancelado" o "agregado" sin duplicar esa lógica acá. ----
    if (!motivoDevolucion) {
      toast.error('Indique el motivo');
      return;
    }

    const hayItemsSeleccionados = Object.values(itemsARetornar).some((c) => Number(c) > 0);
    if (!hayItemsSeleccionados) {
      toast.error('Seleccione al menos un producto a devolver');
      return;
    }

    const itemsPayload = itemsOrdenDevolucion
      .map((item) => {
        const cantidadADevolver = Number(itemsARetornar[item.id] || 0);
        const cantidadFinal = item.cantidad - cantidadADevolver;
        if (cantidadFinal <= 0) return null; // se omite -> queda cancelado
        return {
          producto_id: item.producto_id,
          cantidad: cantidadFinal,
          precio_unitario: Number(item.precio_unitario),
          modificadores: (item.modificadores || []).map((m) => ({
            id: m.modificador_opcion_id,
            nombre: m.nombre,
            precio_adicional: m.precio_adicional,
          })),
        };
      })
      .filter(Boolean);

    if (modoDevolucion === MODOS_DEVOLUCION.CAMBIO) {
      if (!productoReemplazoId) {
        toast.error('Seleccione el producto de reemplazo');
        return;
      }
      const productoReemplazo = productosDisponibles.find((p) => p.id === Number(productoReemplazoId));
      if (!productoReemplazo) {
        toast.error('El producto de reemplazo ya no está disponible');
        return;
      }
      itemsPayload.push({
        producto_id: productoReemplazo.id,
        cantidad: Number(cantidadReemplazo) || 1,
        precio_unitario: Number(productoReemplazo.precio_venta),
        modificadores: [],
      });
    }

    if (itemsPayload.length === 0) {
      toast.error('Está devolviendo todos los productos — use "Cancelar orden completa" en su lugar');
      return;
    }

    try {
      setProcesando(true);
      const nuevoTotal = itemsPayload.reduce((sum, it) => sum + it.cantidad * it.precio_unitario, 0);

      await ordenesService.crear({
        mesa_id: ordenSeleccionada.mesa_id,
        items: itemsPayload,
        total: nuevoTotal,
      });

      const montoPagado = Number(ordenSeleccionada.monto_pagado) || 0;
      const excedente = montoPagado - nuevoTotal;
      if (excedente > 0) {
        await cajaService.devolucionParcial({
          orden_id: ordenSeleccionada.id,
          motivo: motivoDevolucion,
          monto: excedente,
        });
        toast.success(`Listo. Se devuelven ${formatMoney(excedente)} en efectivo`);
      } else {
        toast.success(modoDevolucion === MODOS_DEVOLUCION.CAMBIO ? 'Producto cambiado' : 'Producto devuelto');
      }

      cerrarModalDevolucion();
      await cargarOrdenes();
      await cargarApertura();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al procesar la devolución');
    } finally {
      setProcesando(false);
    }
  };

  const handleCompradorChange = (e) => {
    const { name, value } = e.target;
    if (name === 'tipo_documento') {
      setComprador((prev) => ({
        ...prev,
        tipo_documento: value,
        numero_documento: value === 'consumidor_final' ? NIT_CONSUMIDOR_FINAL : '',
      }));
      return;
    }
    setComprador((prev) => ({ ...prev, [name]: value }));
  };

  const abrirModalPago = (orden) => {
    setOrdenSeleccionada(orden);
    const montoPendiente = orden.total - (orden.monto_pagado || 0);
    setMontoPago(montoPendiente);
    setEsAbono(false);
    setNecesitaFacturaElectronica(false);
    setComprador(initialComprador);
    setShowPago(true);
  };

  const abrirModalDevolucion = async (orden) => {
    setOrdenSeleccionada(orden);
    // El monto por defecto es lo REALMENTE pagado, no el total del menú —
    // la mayoría de estas órdenes tienen $0 pagado todavía.
    setMontoDevolucion(orden.monto_pagado || 0);
    setModoDevolucion(MODOS_DEVOLUCION.COMPLETA);
    setItemsARetornar({});
    setProductoReemplazoId('');
    setCantidadReemplazo(1);
    setShowDevolucion(true);
    setCargandoItemsDevolucion(true);
    try {
      const res = await ordenesService.getById(orden.id);
      setItemsOrdenDevolucion(res.data.data?.items || []);
    } catch (err) {
      toast.error('No se pudieron cargar los productos de la orden');
      setItemsOrdenDevolucion([]);
    } finally {
      setCargandoItemsDevolucion(false);
    }
  };

  // ---- Valores derivados del modal de devolución (para mostrarle al
  // cajero, en vivo, cuánto queda y cuánto se le devuelve antes de
  // confirmar) ----
  const productoReemplazoSel = productosDisponibles.find((p) => p.id === Number(productoReemplazoId));
  const montoItemsARetornar = itemsOrdenDevolucion.reduce((sum, item) => {
    const cantidad = Number(itemsARetornar[item.id] || 0);
    return sum + cantidad * Number(item.precio_unitario || 0);
  }, 0);
  const montoReemplazo = modoDevolucion === MODOS_DEVOLUCION.CAMBIO && productoReemplazoSel
    ? Number(cantidadReemplazo || 0) * Number(productoReemplazoSel.precio_venta || 0)
    : 0;
  const nuevoTotalOrdenPreview = Math.max(
    0,
    Number(ordenSeleccionada?.total || 0) - montoItemsARetornar + montoReemplazo
  );
  const montoPagadoOrdenSel = Number(ordenSeleccionada?.monto_pagado || 0);
  const excedenteAPreview = Math.max(0, montoPagadoOrdenSel - nuevoTotalOrdenPreview);
  const saldoPendientePreview = Math.max(0, nuevoTotalOrdenPreview - montoPagadoOrdenSel);

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

            {usuario?.facturaElectronicaHabilitada && (
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="¿Necesita factura electrónica?"
                  checked={necesitaFacturaElectronica}
                  onChange={(e) => setNecesitaFacturaElectronica(e.target.checked)}
                />

                {necesitaFacturaElectronica && (
                  <div className="caja-comprador-fe">
                    <div className="caja-comprador-fe__fila">
                      <Form.Group className="mb-3">
                        <Form.Label>Tipo de documento</Form.Label>
                        <Form.Select
                          name="tipo_documento"
                          value={comprador.tipo_documento}
                          onChange={handleCompradorChange}
                        >
                          {TIPOS_DOCUMENTO_COMPRADOR.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Número de documento</Form.Label>
                        <Form.Control
                          type="text"
                          name="numero_documento"
                          value={comprador.numero_documento}
                          onChange={handleCompradorChange}
                          readOnly={comprador.tipo_documento === 'consumidor_final'}
                          placeholder="Ej: 1234567890"
                        />
                      </Form.Group>
                    </div>

                    <Form.Group className="mb-3">
                      <Form.Label>Nombre o razón social</Form.Label>
                      <Form.Control
                        type="text"
                        name="nombre_razon_social"
                        value={comprador.nombre_razon_social}
                        onChange={handleCompradorChange}
                        placeholder="Nombre completo o razón social"
                      />
                    </Form.Group>

                    <div className="caja-comprador-fe__fila">
                      <Form.Group className="mb-3">
                        <Form.Label>Email (opcional)</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={comprador.email}
                          onChange={handleCompradorChange}
                          placeholder="Para enviar la factura"
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Teléfono (opcional)</Form.Label>
                        <Form.Control
                          type="text"
                          name="telefono"
                          value={comprador.telefono}
                          onChange={handleCompradorChange}
                        />
                      </Form.Group>
                    </div>
                  </div>
                )}
              </Form.Group>
            )}
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
      <Modal show={showDevolucion} onHide={cerrarModalDevolucion} size="lg" className="rb-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            Devolución - Orden #{ordenSeleccionada?.numero_orden}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="caja-devolucion-modos">
            <button
              type="button"
              className={`caja-devolucion-modo ${modoDevolucion === MODOS_DEVOLUCION.COMPLETA ? 'is-active' : ''}`}
              onClick={() => handleSeleccionarModoDevolucion(MODOS_DEVOLUCION.COMPLETA)}
            >
              <IconClose /> Cancelar orden completa
            </button>
            <button
              type="button"
              className={`caja-devolucion-modo ${modoDevolucion === MODOS_DEVOLUCION.ITEM ? 'is-active' : ''}`}
              onClick={() => handleSeleccionarModoDevolucion(MODOS_DEVOLUCION.ITEM)}
            >
              <IconTrash /> Devolver un producto
            </button>
            <button
              type="button"
              className={`caja-devolucion-modo ${modoDevolucion === MODOS_DEVOLUCION.CAMBIO ? 'is-active' : ''}`}
              onClick={() => handleSeleccionarModoDevolucion(MODOS_DEVOLUCION.CAMBIO)}
            >
              <IconArrowSwap /> Cambiar un producto
            </button>
          </div>

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Motivo</Form.Label>
              <Form.Control
                type="text"
                value={motivoDevolucion}
                onChange={(e) => setMotivoDevolucion(e.target.value)}
                placeholder="Ej: Orden cancelada por cliente"
              />
            </Form.Group>

            {modoDevolucion === MODOS_DEVOLUCION.COMPLETA && (
              <Form.Group className="mb-3">
                <Form.Label>
                  Monto a devolver (pagado hasta ahora: {formatMoney(ordenSeleccionada?.monto_pagado || 0)})
                </Form.Label>
                <Form.Control
                  type="number"
                  value={montoDevolucion}
                  onChange={(e) => setMontoDevolucion(e.target.value)}
                  step="100"
                />
              </Form.Group>
            )}

            {(modoDevolucion === MODOS_DEVOLUCION.ITEM || modoDevolucion === MODOS_DEVOLUCION.CAMBIO) && (
              <>
                <Form.Label>
                  {modoDevolucion === MODOS_DEVOLUCION.CAMBIO
                    ? 'Producto(s) que se retiran'
                    : 'Seleccione qué se devuelve'}
                </Form.Label>
                <div className="caja-devolucion-items">
                  {cargandoItemsDevolucion ? (
                    <p className="text-muted mb-0">Cargando productos de la orden...</p>
                  ) : itemsOrdenDevolucion.length === 0 ? (
                    <p className="text-muted mb-0">Esta orden no tiene productos.</p>
                  ) : (
                    itemsOrdenDevolucion.map((item) => {
                      const seleccionado = !!itemsARetornar[item.id];
                      const cantidadSel = itemsARetornar[item.id] || 1;
                      return (
                        <div key={item.id} className={`caja-devolucion-item ${seleccionado ? 'is-selected' : ''}`}>
                          <label className="caja-devolucion-item__check">
                            <input
                              type="checkbox"
                              checked={seleccionado}
                              onChange={() => toggleItemARetornar(item)}
                            />
                            <span>
                              <strong>{item.producto_nombre || `Producto #${item.producto_id}`}</strong>
                              <small>{formatMoney(item.precio_unitario)} c/u · {item.cantidad} en la orden</small>
                            </span>
                          </label>
                          {seleccionado && (
                            <div className="caja-devolucion-item__cantidad">
                              <button type="button" onClick={() => cambiarCantidadARetornar(item, cantidadSel - 1)}>
                                <IconMinus />
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={item.cantidad}
                                value={cantidadSel}
                                onChange={(e) => cambiarCantidadARetornar(item, e.target.value)}
                              />
                              <button type="button" onClick={() => cambiarCantidadARetornar(item, cantidadSel + 1)}>
                                <IconPlus />
                              </button>
                              <span className="caja-devolucion-item__subtotal">
                                -{formatMoney(cantidadSel * item.precio_unitario)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {modoDevolucion === MODOS_DEVOLUCION.CAMBIO && (
              <div className="caja-devolucion-reemplazo">
                <Form.Label>Producto de reemplazo</Form.Label>
                <div className="caja-comprador-fe__fila">
                  <Form.Select
                    value={productoReemplazoId}
                    onChange={(e) => setProductoReemplazoId(e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    {productosDisponibles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} — {formatMoney(p.precio_venta)}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control
                    type="number"
                    min="1"
                    value={cantidadReemplazo}
                    onChange={(e) => setCantidadReemplazo(e.target.value)}
                  />
                </div>
              </div>
            )}

            {(modoDevolucion === MODOS_DEVOLUCION.ITEM || modoDevolucion === MODOS_DEVOLUCION.CAMBIO) && (
              <div className="caja-devolucion-resumen">
                <div className="caja-modal-linea">
                  <span>Total original:</span>
                  <strong>{formatMoney(ordenSeleccionada?.total)}</strong>
                </div>
                <div className="caja-modal-linea">
                  <span>Nuevo total:</span>
                  <strong>{formatMoney(nuevoTotalOrdenPreview)}</strong>
                </div>
                {excedenteAPreview > 0 ? (
                  <div className="caja-modal-linea caja-modal-linea--total">
                    <span>Se devuelve en efectivo:</span>
                    <strong style={{ color: '#f0958c' }}>{formatMoney(excedenteAPreview)}</strong>
                  </div>
                ) : saldoPendientePreview > 0 ? (
                  <div className="caja-modal-linea caja-modal-linea--total">
                    <span>Queda pendiente por cobrar:</span>
                    <strong style={{ color: 'var(--rb-gold-400)' }}>{formatMoney(saldoPendientePreview)}</strong>
                  </div>
                ) : null}
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <button className="rb-btn rb-btn--ghost" onClick={cerrarModalDevolucion}>
            Cancelar
          </button>
          <button
            className="rb-btn rb-btn--primary"
            onClick={handleProcesarDevolucion}
            disabled={procesando || cargandoItemsDevolucion}
          >
            <IconArrowSwap /> {procesando
              ? 'Procesando...'
              : modoDevolucion === MODOS_DEVOLUCION.COMPLETA
                ? 'Cancelar Orden'
                : modoDevolucion === MODOS_DEVOLUCION.CAMBIO
                  ? 'Confirmar Cambio'
                  : 'Confirmar Devolución'}
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