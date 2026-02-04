import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Button,
  Card,
  Modal,
  Spinner,
  Alert,
} from 'react-bootstrap';
import toast from 'react-hot-toast';
import { productosService, ordenesService } from '../services/api';
import { useOrdenStore, useAuthStore } from '../stores';
import ProductoModal from '../components/ProductoModal';
import ResumenOrden from '../components/ResumenOrden';
import { formatMoney } from '../utils/formatters';
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
  const setItems = useOrdenStore((state) => state.setItems);
  const setMesaActual = useOrdenStore((state) => state.setMesaActual);

  const sedeId = usuario?.sede_id || localStorage.getItem('sedeId') || 1;

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [categoriasRes, productosRes, ordenesRes] = await Promise.all([
        productosService.getCategorias(sedeId),
        productosService.getAll(sedeId),
        ordenesService.getByMesa(mesaId),
      ]);

      setCategorias(categoriasRes.data.data || []);
      setProductos(productosRes.data.data || []);
      setCategoriaSeleccionada(categoriasRes.data.data?.[0]?.id);

      // Si hay orden existente y AÚN NO se han cargado los datos, cargar sus items
      if (ordenesRes.data.data && ordenesRes.data.data.length > 0 && !datoCargado) {
        const orden = ordenesRes.data.data[0];
        setMesaActual(mesaId);
        
        // Restaurar items del carrito desde la orden
        if (orden.items && orden.items.length > 0) {
          const productosMap = new Map(productosRes.data.data.map(p => [p.id, p]));
          const ordenItems = orden.items.map((item) => ({
            id: item.id,
            producto: productosMap.get(item.producto_id),
            cantidad: item.cantidad,
            modificadores: item.modificadores || [],
            observacionesEspeciales: item.notas_especiales || '',
          }));
          setItems(ordenItems);
        }
        setDatoCargado(true);
      }
    } catch (err) {
      const mensaje = err.response?.data?.message || 'Error al cargar productos';
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sedeId, mesaId, datoCargado]);

  useEffect(() => {
    // Resetear cuando cambias de mesa
    setDatoCargado(false);
    limpiarOrden(); // LIMPIAR el carrito también
  }, [mesaId, limpiarOrden]);

  useEffect(() => {
    // Cargar datos cuando datoCargado cambia
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

  const handleEnviarOrden = async () => {
    if (items.length === 0) {
      toast.error('Agrega productos a la orden');
      return;
    }

    setShowConfirmModal(false);

    try {
      const datosOrden = {
        mesa_id: parseInt(mesaId),
        usuario_id: usuario.id,
        sede_id: usuario.sede_id || parseInt(sedeId),
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
      toast.success('✅ Orden enviada a cocina');
      limpiarOrden();
      navigate('/mesas');
    } catch (err) {
      const mensaje = err.response?.data?.message || 'Error al enviar orden';
      toast.error(mensaje);
    }
  };

  const handleCancelar = () => {
    if (items.length > 0) {
      if (
        window.confirm('¿Cancelar orden? Se perderán todos los productos agregados.')
      ) {
        limpiarOrden();
        navigate('/mesas');
      }
    } else {
      navigate('/mesas');
    }
  };

  if (loading) {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <div className="orden-page">
      {/* Header */}
      <div className="orden-header text-white py-3">
        <Container>
          <Row className="align-items-center">
            <Col>
              <h2 className="mb-0">Mesa #{mesaId}</h2>
              <small className="text-muted">Operario: {usuario?.nombre}</small>
            </Col>
            <Col className="text-end">
              <Button
                variant="outline-light"
                size="sm"
                onClick={handleCancelar}
              >
                ← Volver
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

      <Container className="py-4">
        <Row className="g-3">
          {/* Columna: Productos */}
          <Col lg={8}>
            {/* Filtro de categorías */}
            <div className="categoria-filter mb-4">
              <div className="categoria-buttons">
                {categorias.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={
                      categoriaSeleccionada === cat.id ? 'primary' : 'outline-primary'
                    }
                    size="sm"
                    onClick={() => setCategoriaSeleccionada(cat.id)}
                    className="me-2 mb-2"
                  >
                    {cat.nombre}
                  </Button>
                ))}
              </div>
            </div>

            {/* Grid de productos */}
            <div className="productos-grid">
              {productosFiltrados.length > 0 ? (
                productosFiltrados.map((producto) => (
                  <Card
                    key={producto.id}
                    className="producto-card cursor-pointer"
                    onClick={() => handleSelectProducto(producto)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Card.Body className="p-3">
                      <h6 className="mb-2">{producto.nombre}</h6>
                      <p className="text-muted small mb-2">
                        {producto.descripcion}
                      </p>
                      <div className="d-flex justify-content-between align-items-center">
                        <strong className="text-primary">
                          {formatMoney(producto.precio_venta)}
                        </strong>
                        {producto.tiempo_preparacion && (
                          <small className="text-muted">
                            ⏱️ {producto.tiempo_preparacion}min
                          </small>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                ))
              ) : (
                <Alert variant="warning">No hay productos en esta categoría</Alert>
              )}
            </div>
          </Col>

          {/* Columna: Resumen de Orden */}
          <Col lg={4}>
            <ResumenOrden
              items={items}
              total={getTotal()}
              totalItems={getTotalItems()}
              onConfirmar={() => setShowConfirmModal(true)}
              onCancelar={handleCancelar}
            />
          </Col>
        </Row>
      </Container>

      {/* Modal: Producto */}
      <ProductoModal
        show={showProductoModal}
        producto={productoSeleccionado}
        onHide={() => setShowProductoModal(false)}
        onAgregar={handleAgregarProducto}
      />

      {/* Modal: Confirmar Orden */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Orden</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <strong>Total Productos:</strong> {getTotalItems()}
          </p>
          <p>
            <strong>Total:</strong> {formatMoney(getTotal())}
          </p>
          <p className="text-muted">
            ¿Enviar orden a cocina?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowConfirmModal(false)}
          >
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleEnviarOrden}>
            ✅ Enviar Orden
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
