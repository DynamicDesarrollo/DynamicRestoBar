import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Button, Spinner, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { productosService } from '../services/api';

export default function ProductoModal({ show, producto, onHide, onAgregar }) {
  const [cantidad, setCantidad] = useState(1);
  const [modificadores, setModificadores] = useState({});
  const [modificadoresDisponibles, setModificadoresDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cargarModificadores = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productosService.getModificadores(producto.id);
      setModificadoresDisponibles(response.data.data || []);
    } catch (err) {
      const mensaje = err.response?.data?.message || 'Error al cargar modificadores';
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  }, [producto]);

  useEffect(() => {
    if (show && producto) {
      cargarModificadores();
      setCantidad(1);
      setModificadores({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, producto]);

  const handleSelectModificador = (modificador, opcion) => {
    setModificadores((prev) => {
      const modificadorId = modificador.id;
      const actual = prev[modificadorId] || [];

      // Si ya está seleccionado, quitarlo
      if (actual.find((o) => o.id === opcion.id)) {
        return {
          ...prev,
          [modificadorId]: actual.filter((o) => o.id !== opcion.id),
        };
      }

      // Si hay límite de selección
      if (
        modificador.maxima_seleccion &&
        actual.length >= modificador.maxima_seleccion
      ) {
        toast.error(
          `Máximo ${modificador.maxima_seleccion} ${modificador.nombre}`
        );
        return prev;
      }

      return {
        ...prev,
        [modificadorId]: [...actual, opcion],
      };
    });
  };

  const handleAgregar = () => {
    // Validar modificadores requeridos
    for (const mod of modificadoresDisponibles) {
      if (
        mod.requerido &&
        (!modificadores[mod.id] || modificadores[mod.id].length === 0)
      ) {
        toast.error(`${mod.nombre} es requerido`);
        return;
      }
    }

    // Aplanar los modificadores seleccionados
    const modificadoresFlat = Object.values(modificadores).flat();

    onAgregar(producto, cantidad, modificadoresFlat);
    onHide();
  };

  if (!producto) return null;

  const precioBase = producto.precio_venta;
  const precioAdicional = Object.values(modificadores)
    .flat()
    .reduce((sum, mod) => sum + (mod.precio_adicional || 0), 0);
  const precioTotal = (precioBase + precioAdicional) * cantidad;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{producto?.nombre}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        {/* Descripción y precio base */}
        <p className="text-muted">{producto?.descripcion}</p>
        <div className="mb-3">
          <strong>Precio Base:</strong> ${precioBase.toLocaleString()}
        </div>

        {/* Cantidad */}
        <Form.Group className="mb-4">
          <Form.Label>
            <strong>Cantidad</strong>
          </Form.Label>
          <div className="d-flex gap-2 align-items-center">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setCantidad(Math.max(1, cantidad - 1))}
            >
              −
            </Button>
            <Form.Control
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              style={{ maxWidth: '100px', textAlign: 'center' }}
            />
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => setCantidad(cantidad + 1)}
            >
              +
            </Button>
          </div>
        </Form.Group>

        {/* Modificadores */}
        {loading ? (
          <Spinner animation="border" variant="danger" />
        ) : modificadoresDisponibles.length > 0 ? (
          <div className="modificadores-section">
            <h6 className="mb-3">Opciones Adicionales</h6>
            {modificadoresDisponibles.map((modificador) => (
              <div key={modificador.id} className="mb-4">
                <h6>
                  {modificador.nombre}
                  {modificador.requerido && (
                    <span className="text-danger ms-2">*Requerido</span>
                  )}
                </h6>
                <div className="d-flex flex-wrap gap-2">
                  {(modificador.opciones || []).map((opcion) => (
                    <Form.Check
                      key={opcion.id}
                      type={
                        modificador.maxima_seleccion === 1
                          ? 'radio'
                          : 'checkbox'
                      }
                      name={`modificador-${modificador.id}`}
                      label={`${opcion.nombre}${
                        opcion.precio_adicional
                          ? ` (+$${opcion.precio_adicional.toLocaleString()})`
                          : ''
                      }`}
                      checked={
                        modificadores[modificador.id]?.some(
                          (o) => o.id === opcion.id
                        ) || false
                      }
                      onChange={() =>
                        handleSelectModificador(modificador, opcion)
                      }
                      className="mb-2"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Resumen de precio */}
        <div className="p-3 bg-light rounded mt-4">
          <div className="d-flex justify-content-between mb-2">
            <span>Precio Base × {cantidad}:</span>
            <span>${(precioBase * cantidad).toLocaleString()}</span>
          </div>
          {precioAdicional > 0 && (
            <div className="d-flex justify-content-between mb-2 text-muted">
              <span>Adicionales:</span>
              <span>+${(precioAdicional * cantidad).toLocaleString()}</span>
            </div>
          )}
          <div className="border-top pt-2">
            <div className="d-flex justify-content-between">
              <strong>Total:</strong>
              <strong className="text-primary" style={{ fontSize: '18px' }}>
                ${precioTotal.toLocaleString()}
              </strong>
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleAgregar} style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}>
          ➕ Agregar a Orden
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
