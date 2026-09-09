import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useOrdenStore } from '../stores';
import { formatMoney } from '../utils/formatters';
import {
  IconInbox, IconNote, IconEdit, IconTrash, IconCheck, IconArrowLeft, IconMinus, IconPlus,
} from './Icons';
import './ResumenOrden.css';

export default function ResumenOrden({
  items,
  total,
  totalItems,
  onConfirmar,
  onCancelar,
  bloquearEnvio = false,
  mensajeBloqueo = '',
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
      <div className="resumen-orden">
        <div className="resumen-orden__header">
          <IconInbox />
          <h2>Resumen de Orden</h2>
        </div>

        <div className="resumen-orden__body">
          {items.length > 0 ? (
            <>
              {items.map((item) => (
                <div key={item.id} className="item-resumen">
                  <div className="item-resumen__top">
                    <div>
                      <h6 className="item-resumen__nombre">{item.producto.nombre}</h6>
                      <span className="item-resumen__cantidad">
                        {item.cantidad} × {formatMoney(item.producto.precio_venta)}
                      </span>
                    </div>
                    <div className="item-resumen__precio">
                      {formatMoney(item.producto.precio_venta * item.cantidad)}
                    </div>
                  </div>

                  {item.modificadores.length > 0 && (
                    <div className="modificadores-resumen">
                      {item.modificadores.map((mod) => (
                        <small key={mod.id}>
                          • {mod.nombre}
                          {mod.precio_adicional > 0 &&
                            ` (+${formatMoney(mod.precio_adicional)})`}
                        </small>
                      ))}
                    </div>
                  )}

                  {item.observacionesEspeciales && (
                    <div className="observaciones">
                      <IconNote /> {item.observacionesEspeciales}
                    </div>
                  )}

                  <div className="item-resumen__acciones">
                    <button
                      type="button"
                      className="item-resumen__accion"
                      onClick={() => handleEditarItem(item)}
                    >
                      <IconEdit /> Editar
                    </button>
                    <button
                      type="button"
                      className="item-resumen__accion item-resumen__accion--danger"
                      onClick={() => eliminarItem(item.id)}
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>
              ))}

              <div className="resumen-orden__totales">
                <div className="resumen-orden__linea">
                  <span>Subtotal ({totalItems} items):</span>
                  <span>{formatMoney(total)}</span>
                </div>
                <div className="resumen-orden__total">
                  <strong>Total:</strong>
                  <span>{formatMoney(total)}</span>
                </div>
              </div>

              <div className="resumen-orden__acciones">
                <button
                  type="button"
                  className="rb-btn rb-btn--primary"
                  onClick={onConfirmar}
                  disabled={bloquearEnvio}
                >
                  <IconCheck /> Enviar Orden
                </button>
                {bloquearEnvio && mensajeBloqueo && (
                  <p className="resumen-orden__bloqueo-hint">{mensajeBloqueo}</p>
                )}
                <button type="button" className="rb-btn rb-btn--ghost" onClick={onCancelar}>
                  <IconArrowLeft /> Cancelar
                </button>
              </div>
            </>
          ) : (
            <div className="resumen-orden__empty">
              <IconInbox />
              <p>Sin productos agregados</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Editar Item */}
      <Modal show={!!showEditarItem} onHide={() => setShowEditarItem(null)} centered className="rb-modal">
        <Modal.Header closeButton>
          <Modal.Title>Editar Producto</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="rb-form-group">
            <label className="rb-form-label">Cantidad</label>
            <div className="rb-stepper">
              <button
                type="button"
                className="rb-stepper__btn"
                onClick={() => setCantidadEdit(Math.max(1, cantidadEdit - 1))}
              >
                <IconMinus />
              </button>
              <span className="rb-stepper__value">{cantidadEdit}</span>
              <button
                type="button"
                className="rb-stepper__btn"
                onClick={() => setCantidadEdit(cantidadEdit + 1)}
              >
                <IconPlus />
              </button>
            </div>
          </div>

          <div className="rb-form-group" style={{ marginBottom: 0 }}>
            <label className="rb-form-label">Observaciones Especiales</label>
            <textarea
              className="rb-textarea"
              rows="3"
              placeholder="Ej: Sin cebolla, Muy picante..."
              value={observacionesEdit}
              onChange={(e) => setObservacionesEdit(e.target.value)}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="rb-btn rb-btn--ghost" onClick={() => setShowEditarItem(null)}>
            Cancelar
          </button>
          <button type="button" className="rb-btn rb-btn--primary" onClick={handleGuardarEdit}>
            Guardar
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
