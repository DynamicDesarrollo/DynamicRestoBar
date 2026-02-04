import React, { useState } from 'react';
import { Card, Button, ListGroup, Modal, Form } from 'react-bootstrap';
import { useOrdenStore } from '../stores';
import './ResumenOrden.css';

export default function ResumenOrden({
  items,
  total,
  totalItems,
  onConfirmar,
  onCancelar,
}) {
  const eliminarItem = useOrdenStore((state) => state.eliminarItem);
  const actualizarCantidad = useOrdenStore((state) => state.actualizarCantidad);
  const actualizarObservacionesItem = useOrdenStore(
    (state) => state.actualizarObservacionesItem
  );

  const [showEditarItem, setShowEditarItem] = useState(null);
  const [cantidadEdit, setCantidadEdit] = useState(1);
  const [observacionesEdit, setObservacionesEdit] = useState('');

  const handleEditarItem = (item) => {
    setShowEditarItem(item.id);
    setCantidadEdit(item.cantidad);
    setObservacionesEdit(item.observacionesEspeciales);
  };

  const handleGuardarEdit = () => {
    actualizarCantidad(showEditarItem, cantidadEdit);
    actualizarObservacionesItem(showEditarItem, observacionesEdit);
    setShowEditarItem(null);
  };

  return (
    <>
      <Card className="resumen-orden sticky-top">
        <Card.Header className="bg-primary text-white" style={{ backgroundColor: '#2563eb !important' }}>
          <h5 className="mb-0">📋 Resumen de Orden</h5>
        </Card.Header>

        <Card.Body className="p-0">
          {/* Items */}
          {items.length > 0 ? (
            <>
              <ListGroup className="list-group-flush">
                {items.map((item) => (
                  <ListGroup.Item key={item.id} className="item-resumen">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="flex-grow-1">
                        <h6 className="mb-1">{item.producto.nombre}</h6>
                        <small className="text-muted">
                          {item.cantidad} × ${item.producto.precio_venta.toLocaleString()}
                        </small>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold text-danger">
                          $
                          {(
                            item.producto.precio_venta * item.cantidad
                          ).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Modificadores */}
                    {item.modificadores.length > 0 && (
                      <div className="modificadores-resumen mb-2">
                        {item.modificadores.map((mod) => (
                          <small key={mod.id} className="d-block text-muted">
                            • {mod.nombre}
                            {mod.precio_adicional > 0 &&
                              ` (+$${mod.precio_adicional.toLocaleString()})`}
                          </small>
                        ))}
                      </div>
                    )}

                    {/* Observaciones */}
                    {item.observacionesEspeciales && (
                      <div className="observaciones mb-2">
                        <small className="text-warning bg-light p-1 rounded d-block">
                          📝 {item.observacionesEspeciales}
                        </small>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEditarItem(item)}
                        className="flex-grow-1"
                      >
                        ✏️ Editar
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => eliminarItem(item.id)}
                      >
                        🗑️
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>

              {/* Totales */}
              <div className="p-3 bg-light">
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal ({totalItems} items):</span>
                  <span>${total.toLocaleString()}</span>
                </div>
                <div className="border-top pt-2 d-flex justify-content-between">
                  <strong>Total:</strong>
                  <h5 className="mb-0 text-primary">
                    ${total.toLocaleString()}
                  </h5>
                </div>
              </div>

              {/* Botones */}
              <div className="p-3 d-grid gap-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={onConfirmar}
                  className="fw-bold"
                  style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
                >
                  ✅ Enviar Orden
                </Button>
                <Button variant="outline-secondary" onClick={onCancelar}>
                  ← Cancelar
                </Button>
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-muted">
              <p className="mb-0">📭</p>
              <p className="mb-0">Sin productos agregados</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal: Editar Item */}
      <Modal show={showEditarItem} onHide={() => setShowEditarItem(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Producto</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>
              <strong>Cantidad</strong>
            </Form.Label>
            <div className="d-flex gap-2 align-items-center">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setCantidadEdit(Math.max(1, cantidadEdit - 1))}
              >
                −
              </Button>
              <Form.Control
                type="number"
                value={cantidadEdit}
                onChange={(e) =>
                  setCantidadEdit(Math.max(1, parseInt(e.target.value) || 1))
                }
                min="1"
                style={{ maxWidth: '100px', textAlign: 'center' }}
              />
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setCantidadEdit(cantidadEdit + 1)}
              >
                +
              </Button>
            </div>
          </Form.Group>

          <Form.Group>
            <Form.Label>
              <strong>Observaciones Especiales</strong>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows="3"
              placeholder="Ej: Sin cebolla, Muy picante..."
              value={observacionesEdit}
              onChange={(e) => setObservacionesEdit(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowEditarItem(null)}
          >
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleGuardarEdit} style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
