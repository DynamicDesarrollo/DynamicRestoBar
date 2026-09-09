import { toast } from 'react-toastify';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import { productosService, ordenesService, canalesService } from '../services/api';
import { useOrdenStore, useAuthStore } from '../stores';
import ProductoModal from '../components/ProductoModal';
import ResumenOrden from '../components/ResumenOrden';
import { ClassicCatalog, AurumCatalog } from '../components/catalog';
import { formatMoney } from '../utils/formatters';
import { IconArrowLeft, IconCheck, IconTrash } from '../components/Icons';
import './Orden.css';

export default function Orden() {
  const { mesaId } = useParams();
  const navigate = useNavigate();
  const usuario = useAuthStore((state) => state.usuario);

  // Orden
  const items = useOrdenStore((state) => state.items);
  const agregarItem = useOrdenStore((state) => state.agregarItem);
  const limpiarOrden = useOrdenStore((state) => state.limpiarOrden);
  const getTotal = useOrdenStore((state) => state.getTotal);
  const getTotalItems = useOrdenStore((state) => state.getTotalItems);

  // Productos y categorías
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [datoCargado, setDatoCargado] = useState(false);

  // Modales
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelarModal, setShowCancelarModal] = useState(false);
  const setItems = useOrdenStore((state) => state.setItems);
  const setMesaActual = useOrdenStore((state) => state.setMesaActual);
  const [tieneOrdenAbierta, setTieneOrdenAbierta] = useState(false);
  const [firmaBaseOrden, setFirmaBaseOrden] = useState([]);

  const sedeId = usuario?.sede_id || localStorage.getItem('sedeId') || 1;
  const estiloCatalogo = usuario?.estiloCatalogo || 'clasico';
  const [canalId, setCanalId] = useState(null);

  const construirFirmaItems = useCallback((listaItems) => {
    return (listaItems || [])
      .map((item) => {
        const productoId = item.producto?.id || item.producto_id || 'NA';
        const cantidad = Number(item.cantidad || 0);
        const observaciones = (item.observacionesEspeciales || item.notas_especiales || '').trim();
        const mods = (item.modificadores || [])
          .map((mod) => String(mod.id || mod.modificador_opcion_id || mod.nombre || ''))
          .sort()
          .join(',');

        return `${productoId}|${cantidad}|${mods}|${observaciones}`;
      })
      .sort();
  }, []);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [categoriasRes, productosRes, ordenesRes, canalesRes] = await Promise.all([
        productosService.getCategorias(sedeId),
        productosService.getAll(sedeId),
        ordenesService.getByMesa(mesaId),
        canalesService.getAll(),
      ]);

      setCategorias(categoriasRes.data.data || []);
      setProductos(productosRes.data.data || []);
      setCategoriaSeleccionada(categoriasRes.data.data?.[0]?.id);

      const canalMostrador = (canalesRes.data.data || []).find((c) => c.nombre === 'mostrador');
      setCanalId(canalMostrador ? canalMostrador.id : null);

      if (ordenesRes.data.data && ordenesRes.data.data.length > 0 && !datoCargado) {
        const orden = ordenesRes.data.data[0];
        setMesaActual(mesaId);
        setTieneOrdenAbierta(true);

        if (orden.items && orden.items.length > 0) {
          const productosMap = new Map(productosRes.data.data.map((p) => [p.id, p]));
          const ordenItems = orden.items.map((item) => ({
            id: item.id,
            producto: productosMap.get(item.producto_id),
            cantidad: item.cantidad,
            modificadores: item.modificadores || [],
            observacionesEspeciales: item.notas_especiales || '',
          }));
          setItems(ordenItems);
          setFirmaBaseOrden(construirFirmaItems(ordenItems));
        } else {
          setFirmaBaseOrden([]);
        }
        setDatoCargado(true);
      } else if (!datoCargado) {
        setTieneOrdenAbierta(false);
        setFirmaBaseOrden([]);
      }
    } catch (err) {
      const mensaje = err.response?.data?.message || 'Error al cargar productos';
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sedeId, mesaId, datoCargado, construirFirmaItems]);

  useEffect(() => {
    setDatoCargado(false);
    setTieneOrdenAbierta(false);
    setFirmaBaseOrden([]);
    limpiarOrden();
  }, [mesaId, limpiarOrden]);

  useEffect(() => {
    cargarDatos();
  }, [datoCargado, cargarDatos]);

  const productosFiltrados = categoriaSeleccionada
    ? productos.filter((p) => p.categoria_id === categoriaSeleccionada)
    : productos;

  const handleSelectProducto = (producto) => {
    setProductoSeleccionado(producto);
    setShowProductoModal(true);
  };

  const handleAgregarProducto = (producto, cantidad, modificadores) => {
    agregarItem(producto, cantidad, modificadores);
    toast.success(`${producto.nombre} agregado a la orden`);
    setShowProductoModal(false);
  };

  const firmaActualOrden = construirFirmaItems(items);
  const hayCambiosSobreOrdenAbierta =
    JSON.stringify(firmaActualOrden) !== JSON.stringify(firmaBaseOrden);
  const puedeEnviarOrden = tieneOrdenAbierta ? hayCambiosSobreOrdenAbierta : items.length > 0;

  const handleEnviarOrden = async () => {
    if (!puedeEnviarOrden) {
      if (tieneOrdenAbierta) {
        toast.warn('Esta mesa ya tiene una orden abierta. Agrega o edita productos para enviar cambios.');
      } else {
        toast.error('Agrega productos a la orden');
      }
      return;
    }

    setShowConfirmModal(false);

    try {
      const datosOrden = {
        mesa_id: parseInt(mesaId, 10),
        usuario_id: usuario.id,
        sede_id: usuario.sede_id || parseInt(sedeId, 10),
        canal_id: canalId,
        items: items.map((item) => ({
          producto_id: item.producto.id,
          cantidad: item.cantidad,
          precio_unitario: item.producto.precio_venta,
          modificadores: item.modificadores,
          observaciones: item.observacionesEspeciales,
        })),
        total: getTotal(),
      };

      await ordenesService.crear(datosOrden);
      toast.success('Orden enviada a cocina');
      limpiarOrden();
      navigate('/mesas');
    } catch (err) {
      const mensaje = err.response?.data?.message || 'Error al enviar orden';
      toast.error(mensaje);
    }
  };

  const handleCancelar = () => {
    if (items.length > 0) {
      setShowCancelarModal(true);
    } else {
      navigate('/mesas');
    }
  };

  const confirmarCancelar = () => {
    setShowCancelarModal(false);
    limpiarOrden();
    navigate('/mesas');
  };

  if (loading) {
    return (
      <div className="orden-page orden-page--loading">
        <div className="rb-spinner" aria-label="Cargando productos" />
      </div>
    );
  }

  return (
    <div className="orden-page">
      <div className="orden-header">
        <div className="orden-header__inner">
          <div>
            <h1 className="orden-header__title">
              Mesa <span>#{mesaId}</span>
            </h1>
            <p className="orden-header__operario">Operario: {usuario?.nombre}</p>
          </div>
          <button type="button" className="rb-btn rb-btn--ghost" onClick={handleCancelar}>
            <IconArrowLeft /> Volver
          </button>
        </div>
      </div>

      <div className="orden-content">
        {error && (
          <div className="orden-alert-wrap">
            <div className="rb-alert">{error}</div>
          </div>
        )}

        {/* Columna: Productos */}
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

        {/* Columna: Resumen de Orden */}
        <ResumenOrden
          items={items}
          total={getTotal()}
          totalItems={getTotalItems()}
          onConfirmar={() => {
            if (!puedeEnviarOrden) {
              toast.warn('No hay cambios nuevos para enviar.');
              return;
            }
            setShowConfirmModal(true);
          }}
          onCancelar={handleCancelar}
          bloquearEnvio={!puedeEnviarOrden}
          mensajeBloqueo={tieneOrdenAbierta ? 'Agrega o edita productos para enviar cambios de esta orden.' : ''}
        />
      </div>

      {/* Modal: Producto */}
      <ProductoModal
        show={showProductoModal}
        producto={productoSeleccionado}
        onHide={() => setShowProductoModal(false)}
        onAgregar={handleAgregarProducto}
      />

      {/* Modal: Confirmar Orden */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered className="rb-modal">
        <Modal.Header closeButton>
          <Modal.Title>Confirmar orden</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="rb-modal__line" style={{ marginBottom: 8 }}>
            Total productos: <strong>{getTotalItems()}</strong>
          </p>
          <p className="rb-modal__line" style={{ marginBottom: 14 }}>
            Total: <strong>{formatMoney(getTotal())}</strong>
          </p>
          <p style={{ color: 'var(--rb-cream-500)', fontSize: '0.88rem', margin: 0 }}>
            ¿Enviar orden a cocina?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="rb-btn rb-btn--ghost" onClick={() => setShowConfirmModal(false)}>
            Cancelar
          </button>
          <button
            type="button"
            className="rb-btn rb-btn--primary"
            onClick={handleEnviarOrden}
            disabled={!puedeEnviarOrden}
          >
            <IconCheck /> Enviar orden
          </button>
        </Modal.Footer>
      </Modal>

      {/* Modal: Cancelar Orden */}
      <Modal show={showCancelarModal} onHide={() => setShowCancelarModal(false)} centered className="rb-modal">
        <Modal.Header closeButton>
          <Modal.Title>Cancelar orden</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ color: 'var(--rb-cream-500)', fontSize: '0.88rem', margin: 0 }}>
            ¿Cancelar orden? Se perderán todos los productos agregados.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="rb-btn rb-btn--ghost" onClick={() => setShowCancelarModal(false)}>
            Seguir editando
          </button>
          <button type="button" className="rb-btn rb-btn--danger" onClick={confirmarCancelar}>
            <IconTrash /> Sí, cancelar
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}