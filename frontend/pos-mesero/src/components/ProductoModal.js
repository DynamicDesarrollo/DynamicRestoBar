import { toast } from 'react-toastify';
import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import { productosService } from '../services/api';
import { IconMinus, IconPlus, IconCheck } from './Icons';

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
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, producto]);

  const handleSelectModificador = (modificador, opcion) => {
    setModificadores((prev) => {
      const modificadorId = modificador.id;
      const actual = prev[modificadorId] || [];

      if (actual.find((o) => o.id === opcion.id)) {
        return { ...prev, [modificadorId]: actual.filter((o) => o.id !== opcion.id) };
      }

      if (modificador.maxima_seleccion && actual.length >= modificador.maxima_seleccion) {
        toast.error(`Máximo ${modificador.maxima_seleccion} ${modificador.nombre}`);
        return prev;
      }

      return { ...prev, [modificadorId]: [...actual, opcion] };
    });
  };

  const handleAgregar = () => {
    for (const mod of modificadoresDisponibles) {
      if (mod.requerido && (!modificadores[mod.id] || modificadores[mod.id].length === 0)) {
        toast.error(`${mod.nombre} es requerido`);
        return;
      }
    }

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
    <Modal show={show} onHide={onHide} size="lg" centered className="rb-modal">
      <Modal.Header closeButton>
        <Modal.Title>{producto?.nombre}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <div className="rb-alert" style={{ marginBottom: 16 }}>{error}</div>}

        {producto?.descripcion && (
          <p style={{ color: 'var(--rb-cream-500)', fontSize: '0.9rem', marginBottom: 14 }}>
            {producto.descripcion}
          </p>
        )}

        <div style={{ marginBottom: 20, fontSize: '0.92rem' }}>
          <strong style={{ color: 'var(--rb-cream-300)' }}>Precio base: </strong>
          <span style={{ color: 'var(--rb-gold-400)', fontWeight: 700 }}>
            ${precioBase.toLocaleString()}
          </span>
        </div>

        {/* Cantidad */}
        <div className="rb-form-group">
          <label className="rb-form-label">Cantidad</label>
          <div className="rb-stepper">
            <button type="button" className="rb-stepper__btn" onClick={() => setCantidad(Math.max(1, cantidad - 1))}>
              <IconMinus />
            </button>
            <span className="rb-stepper__value">{cantidad}</span>
            <button type="button" className="rb-stepper__btn" onClick={() => setCantidad(cantidad + 1)}>
              <IconPlus />
            </button>
          </div>
        </div>

        {/* Modificadores */}
        {loading ? (
          <div className="rb-spinner" style={{ width: 28, height: 28 }} />
        ) : modificadoresDisponibles.length > 0 ? (
          <div>
            <h4 style={{
              fontFamily: 'var(--rb-font-display)', fontWeight: 600, fontSize: '1rem',
              color: 'var(--rb-cream-100)', margin: '0 0 12px',
            }}>
              Opciones adicionales
            </h4>
            {modificadoresDisponibles.map((modificador) => (
              <div key={modificador.id} style={{ marginBottom: 18 }}>
                <p style={{ margin: '0 0 8px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--rb-cream-300)' }}>
                  {modificador.nombre}
                  {modificador.requerido && (
                    <span style={{ color: 'var(--rb-error-500)', marginLeft: 8, fontWeight: 600, fontSize: '0.78rem' }}>
                      * Requerido
                    </span>
                  )}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(modificador.opciones || []).map((opcion) => {
                    const seleccionado = modificadores[modificador.id]?.some((o) => o.id === opcion.id) || false;
                    return (
                      <button
                        key={opcion.id}
                        type="button"
                        onClick={() => handleSelectModificador(modificador, opcion)}
                        style={{
                          border: `1px solid ${seleccionado ? 'var(--rb-gold-500)' : 'var(--rb-charcoal-700)'}`,
                          background: seleccionado ? 'rgba(201, 154, 70, 0.14)' : 'var(--rb-charcoal-900)',
                          color: seleccionado ? 'var(--rb-gold-300)' : 'var(--rb-cream-300)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          padding: '8px 14px',
                          borderRadius: 999,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {opcion.nombre}
                        {opcion.precio_adicional > 0 && ` (+$${opcion.precio_adicional.toLocaleString()})`}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Resumen de precio */}
        <div style={{
          background: 'var(--rb-charcoal-900)',
          border: '1px solid var(--rb-charcoal-700)',
          borderRadius: 12,
          padding: 16,
          marginTop: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.86rem', color: 'var(--rb-cream-500)' }}>
            <span>Precio base × {cantidad}</span>
            <span>${(precioBase * cantidad).toLocaleString()}</span>
          </div>
          {precioAdicional > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.86rem', color: 'var(--rb-cream-500)' }}>
              <span>Adicionales</span>
              <span>+${(precioAdicional * cantidad).toLocaleString()}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px dashed var(--rb-charcoal-700)' }}>
            <strong style={{ color: 'var(--rb-cream-300)', fontSize: '0.9rem' }}>Total</strong>
            <strong style={{ color: 'var(--rb-gold-400)', fontSize: '1.15rem', fontFamily: 'var(--rb-font-display)' }}>
              ${precioTotal.toLocaleString()}
            </strong>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <button type="button" className="rb-btn rb-btn--ghost" onClick={onHide}>
          Cancelar
        </button>
        <button type="button" className="rb-btn rb-btn--primary" onClick={handleAgregar}>
          <IconCheck /> Agregar a orden
        </button>
      </Modal.Footer>
    </Modal>
  );
}