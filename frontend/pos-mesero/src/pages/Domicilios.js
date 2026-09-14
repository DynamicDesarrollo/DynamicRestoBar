import { toast } from 'react-toastify';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Form } from 'react-bootstrap';
import {
  domiciliosService, repartidoresService, productosService, cajaService, sedesService,
} from '../services/api';
import { useOrdenStore, useAuthStore } from '../stores';
import ProductoModal from '../components/ProductoModal';
import { ClassicCatalog, AurumCatalog } from '../components/catalog';
import { formatMoney } from '../utils/formatters';
import { IconArrowLeft, IconPlus, IconRefresh, IconCheck } from '../components/Icons';
import './Orden.css';
import './Domicilios.css';

const ESTADO_LABEL = {
  pendiente: 'Pendiente',
  confirmada: 'Asignado',
  en_camino: 'En camino',
  entregada: 'Entregada',
  fallida: 'Fallida',
  anulada: 'Anulada',
};

export default function Domicilios() {
  const navigate = useNavigate();
  const usuario = useAuthStore((state) => state.usuario);
  const items = useOrdenStore((state) => state.items);
  const agregarItem = useOrdenStore((state) => state.agregarItem);
  const limpiarOrden = useOrdenStore((state) => state.limpiarOrden);
  const getTotal = useOrdenStore((state) => state.getTotal);

  const [entregas, setEntregas] = useState([]);
  const [repartidores, setRepartidores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesandoId, setProcesandoId] = useState(null);

  const [showNuevo, setShowNuevo] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [formEntrega, setFormEntrega] = useState({
    direccion_entrega: '', referencia: '', nombre_destinatario: '',
    telefono_destinatario: '', costo_entrega: '',
  });
  const [guardando, setGuardando] = useState(false);

  const [cobrarId, setCobrarId] = useState(null);
  const [metodosPago, setMetodosPago] = useState([]);
  const [metodoPagoId, setMetodoPagoId] = useState('');

  const [sedeInfo, setSedeInfo] = useState(null);
  const [guardandoConfig, setGuardandoConfig] = useState(false);

  const sedeId = usuario?.sedeId || usuario?.sede_id;
  const estiloCatalogo = usuario?.estiloCatalogo || 'clasico';
  const esRepartidor = usuario?.rol?.nombre === 'Repartidor';
  const puedeConfigurar = ['Administrador', 'Gerente'].includes(usuario?.rol?.nombre);

  const cargarEntregas = useCallback(async () => {
    try {
      const res = await domiciliosService.listar();
      setEntregas(res.data.data || []);
    } catch (err) {
      toast.error('No se pudieron cargar los domicilios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarEntregas();
    const interval = setInterval(cargarEntregas, 15000);
    return () => clearInterval(interval);
  }, [cargarEntregas]);

  useEffect(() => {
    if (esRepartidor) return;
    repartidoresService.listar({ estado: 'disponible' })
      .then((res) => setRepartidores(res.data.data || []))
      .catch(() => setRepartidores([]));
  }, [esRepartidor]);

  useEffect(() => {
    if (!puedeConfigurar || !sedeId) return;
    sedesService.obtener(sedeId).then((res) => setSedeInfo(res.data)).catch(() => setSedeInfo(null));
  }, [puedeConfigurar, sedeId]);

  const handleToggleRequiereCaja = async () => {
    if (!sedeInfo) return;
    const nuevoValor = !sedeInfo.domicilios_requiere_caja;
    try {
      setGuardandoConfig(true);
      await sedesService.actualizar(sedeId, {
        nombre: sedeInfo.nombre,
        direccion: sedeInfo.direccion,
        domicilios_requiere_caja: nuevoValor,
      });
      setSedeInfo((prev) => ({ ...prev, domicilios_requiere_caja: nuevoValor }));
      toast.success(nuevoValor ? 'Ahora domicilios exige caja abierta' : 'Ahora domicilios se puede cobrar sin caja abierta');
    } catch {
      toast.error('No se pudo guardar el cambio');
    } finally {
      setGuardandoConfig(false);
    }
  };

  const abrirNuevo = async () => {
    limpiarOrden();
    setFormEntrega({ direccion_entrega: '', referencia: '', nombre_destinatario: '', telefono_destinatario: '', costo_entrega: '' });
    setShowNuevo(true);
    try {
      const [categoriasRes, productosRes] = await Promise.all([
        productosService.getCategorias(sedeId),
        productosService.getAll(sedeId),
      ]);
      setCategorias(categoriasRes.data.data || []);
      setProductos(productosRes.data.data || []);
      setCategoriaSeleccionada(categoriasRes.data.data?.[0]?.id);
    } catch {
      toast.error('No se pudo cargar el catálogo');
    }
  };

  const productosFiltrados = categoriaSeleccionada
    ? productos.filter((p) => p.categoria_id === categoriaSeleccionada)
    : productos;

  const handleSelectProducto = (producto) => {
    setProductoSeleccionado(producto);
    setShowProductoModal(true);
  };

  const handleAgregarProducto = (producto, cantidad, modificadores) => {
    agregarItem(producto, cantidad, modificadores);
    toast.success(`${producto.nombre} agregado`);
    setShowProductoModal(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormEntrega((prev) => ({ ...prev, [name]: value }));
  };

  const handleCrearDomicilio = async () => {
    if (items.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }
    if (!formEntrega.direccion_entrega.trim()) {
      toast.error('La dirección de entrega es requerida');
      return;
    }
    try {
      setGuardando(true);
      await domiciliosService.crear({
        items: items.map((item) => ({
          producto_id: item.producto.id,
          cantidad: item.cantidad,
          precio_unitario: item.producto.precio_venta,
          modificadores: item.modificadores,
          observaciones: item.observacionesEspeciales,
        })),
        direccion_entrega: formEntrega.direccion_entrega,
        referencia: formEntrega.referencia || undefined,
        nombre_destinatario: formEntrega.nombre_destinatario || undefined,
        telefono_destinatario: formEntrega.telefono_destinatario || undefined,
        costo_entrega: formEntrega.costo_entrega ? Number(formEntrega.costo_entrega) : 0,
      });
      toast.success('Domicilio creado y enviado a cocina');
      limpiarOrden();
      setShowNuevo(false);
      cargarEntregas();
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo crear el domicilio');
    } finally {
      setGuardando(false);
    }
  };

  const handleAsignar = async (entregaId, repartidorId) => {
    if (!repartidorId) return;
    try {
      setProcesandoId(entregaId);
      await domiciliosService.asignarRepartidor(entregaId, Number(repartidorId));
      toast.success('Repartidor asignado');
      cargarEntregas();
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo asignar');
    } finally {
      setProcesandoId(null);
    }
  };

  const handleCambiarEstado = async (entregaId, estado) => {
    try {
      setProcesandoId(entregaId);
      await domiciliosService.actualizarEstado(entregaId, estado);
      toast.success(`Domicilio actualizado a "${ESTADO_LABEL[estado] || estado}"`);
      cargarEntregas();
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo actualizar');
    } finally {
      setProcesandoId(null);
    }
  };

  const abrirCobrar = async (entregaId) => {
    setCobrarId(entregaId);
    setMetodoPagoId('');
    try {
      const res = await cajaService.getMetodosPago();
      setMetodosPago(res.data.data || []);
    } catch {
      setMetodosPago([]);
    }
  };

  const handleCobrar = async () => {
    if (!metodoPagoId) {
      toast.error('Elige un método de pago');
      return;
    }
    try {
      setProcesandoId(cobrarId);
      await domiciliosService.registrarPago(cobrarId, { metodo_pago_id: Number(metodoPagoId) });
      toast.success('Pago registrado');
      setCobrarId(null);
      cargarEntregas();
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo registrar el pago');
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div className="domicilios-page">
      <div className="domicilios-header">
        <div className="domicilios-header__inner">
          <div>
            <h1 className="domicilios-header__title">Domicilios</h1>
            <p className="domicilios-header__sub">{usuario?.nombre}</p>
          </div>
          <div className="domicilios-header__actions">
            {!esRepartidor && (
              <button type="button" className="rb-btn rb-btn--primary" onClick={abrirNuevo}>
                <IconPlus /> Nuevo domicilio
              </button>
            )}
            <button type="button" className="rb-btn rb-btn--ghost" onClick={cargarEntregas}>
              <IconRefresh /> Refrescar
            </button>
            <button type="button" className="rb-btn rb-btn--ghost" onClick={() => navigate('/mesas')}>
              <IconArrowLeft /> Volver
            </button>
          </div>
        </div>
      </div>

      {puedeConfigurar && sedeInfo && (
        <div className="domicilios-config">
          <label className="domicilios-config__switch">
            <input
              type="checkbox"
              checked={!!sedeInfo.domicilios_requiere_caja}
              disabled={guardandoConfig}
              onChange={handleToggleRequiereCaja}
            />
            <span>
              {sedeInfo.domicilios_requiere_caja
                ? 'Cobrar domicilios exige caja abierta (entra al corte de caja)'
                : 'Cobrar domicilios NO exige caja abierta (no entra al corte de caja)'}
            </span>
          </label>
        </div>
      )}

      <div className="domicilios-content">
        {loading ? (
          <p className="domicilios-empty">Cargando...</p>
        ) : entregas.length === 0 ? (
          <p className="domicilios-empty">No hay domicilios activos.</p>
        ) : (
          <div className="domicilios-list">
            {entregas.map((e) => (
              <div key={e.id} className="domicilios-card">
                <div className="domicilios-card__top">
                  <span className={`domicilios-badge domicilios-badge--${e.estado}`}>
                    {ESTADO_LABEL[e.estado] || e.estado}
                  </span>
                  <span className="domicilios-card__total">{formatMoney(e.total)}</span>
                </div>
                <p className="domicilios-card__linea"><strong>{e.nombre_destinatario || 'Sin nombre'}</strong> · {e.telefono_destinatario || 'Sin teléfono'}</p>
                <p className="domicilios-card__linea">{e.direccion_entrega}</p>
                {e.referencia && <p className="domicilios-card__ref">{e.referencia}</p>}
                <p className="domicilios-card__linea domicilios-card__repartidor">
                  {e.repartidor_nombre ? `Repartidor: ${e.repartidor_nombre}` : 'Sin repartidor asignado'}
                </p>

                <div className="domicilios-card__acciones">
                  {!esRepartidor && e.estado === 'pendiente' && (
                    <select
                      className="domicilios-select"
                      disabled={procesandoId === e.id}
                      value=""
                      onChange={(ev) => handleAsignar(e.id, ev.target.value)}
                    >
                      <option value="">Asignar repartidor...</option>
                      {repartidores.map((r) => (
                        <option key={r.id} value={r.id}>{r.nombre}</option>
                      ))}
                    </select>
                  )}
                  {e.estado === 'confirmada' && (
                    <button
                      type="button"
                      className="rb-btn rb-btn--primary rb-btn--sm"
                      disabled={procesandoId === e.id}
                      onClick={() => handleCambiarEstado(e.id, 'en_camino')}
                    >
                      Marcar en camino
                    </button>
                  )}
                  {e.estado === 'en_camino' && (
                    <button
                      type="button"
                      className="rb-btn rb-btn--primary rb-btn--sm"
                      disabled={procesandoId === e.id}
                      onClick={() => handleCambiarEstado(e.id, 'entregada')}
                    >
                      Marcar entregada
                    </button>
                  )}
                  {!esRepartidor && !e.pagado && !['fallida', 'anulada'].includes(e.estado) && (
                    <button
                      type="button"
                      className="rb-btn rb-btn--ghost rb-btn--sm"
                      disabled={procesandoId === e.id}
                      onClick={() => abrirCobrar(e.id)}
                    >
                      Cobrar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Nuevo domicilio */}
      <Modal show={showNuevo} onHide={() => setShowNuevo(false)} size="xl" centered className="rb-modal" dialogClassName="domicilios-modal-dialog">
        <Modal.Header closeButton>
          <Modal.Title>Nuevo domicilio</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="domicilios-nuevo">
            <div className="domicilios-nuevo__catalogo">
              {estiloCatalogo === 'aurum' ? (
                <AurumCatalog
                  categorias={categorias}
                  productos={productosFiltrados}
                  categoriaSeleccionada={categoriaSeleccionada}
                  onSelectCategoria={setCategoriaSeleccionada}
                  onSelectProducto={handleSelectProducto}
                />
              ) : (
                <ClassicCatalog
                  categorias={categorias}
                  productos={productosFiltrados}
                  categoriaSeleccionada={categoriaSeleccionada}
                  onSelectCategoria={setCategoriaSeleccionada}
                  onSelectProducto={handleSelectProducto}
                />
              )}
            </div>

            <div className="domicilios-nuevo__panel">
              <p className="domicilios-nuevo__subtitulo">Pedido ({items.length})</p>
              <div className="domicilios-nuevo__items">
                {items.length === 0 ? (
                  <p className="domicilios-empty">Toca un producto para agregarlo.</p>
                ) : (
                  items.map((item, i) => (
                    <div key={i} className="domicilios-nuevo__item">
                      <span>{item.cantidad}x {item.producto.nombre}</span>
                      <span>{formatMoney(item.cantidad * item.producto.precio_venta)}</span>
                    </div>
                  ))
                )}
              </div>

              <Form.Group className="mb-2">
                <Form.Label className="rb-modal__label">Dirección de entrega *</Form.Label>
                <Form.Control name="direccion_entrega" value={formEntrega.direccion_entrega} onChange={handleFormChange} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="rb-modal__label">Referencia</Form.Label>
                <Form.Control name="referencia" value={formEntrega.referencia} onChange={handleFormChange} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="rb-modal__label">Nombre destinatario</Form.Label>
                <Form.Control name="nombre_destinatario" value={formEntrega.nombre_destinatario} onChange={handleFormChange} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="rb-modal__label">Teléfono destinatario</Form.Label>
                <Form.Control name="telefono_destinatario" value={formEntrega.telefono_destinatario} onChange={handleFormChange} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="rb-modal__label">Costo de envío</Form.Label>
                <Form.Control type="number" min="0" name="costo_entrega" value={formEntrega.costo_entrega} onChange={handleFormChange} />
              </Form.Group>

              <p className="domicilios-nuevo__total">Total: {formatMoney(getTotal() + (Number(formEntrega.costo_entrega) || 0))}</p>
              <button type="button" className="rb-btn rb-btn--primary" style={{ width: '100%' }} disabled={guardando} onClick={handleCrearDomicilio}>
                <IconCheck /> {guardando ? 'Enviando...' : 'Enviar a cocina'}
              </button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      <ProductoModal
        show={showProductoModal}
        producto={productoSeleccionado}
        onHide={() => setShowProductoModal(false)}
        onAgregar={handleAgregarProducto}
      />

      {/* Modal: Cobrar */}
      <Modal show={cobrarId !== null} onHide={() => setCobrarId(null)} centered className="rb-modal">
        <Modal.Header closeButton>
          <Modal.Title>Cobrar domicilio</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label className="rb-modal__label">Método de pago</Form.Label>
            <Form.Select value={metodoPagoId} onChange={(e) => setMetodoPagoId(e.target.value)} className="rb-modal__select">
              <option value="">Selecciona...</option>
              {metodosPago.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="rb-btn rb-btn--ghost" onClick={() => setCobrarId(null)}>Cancelar</button>
          <button type="button" className="rb-btn rb-btn--primary" disabled={procesandoId === cobrarId} onClick={handleCobrar}>
            Confirmar cobro
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
