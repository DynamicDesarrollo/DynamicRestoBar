import { toast } from 'react-toastify';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Form } from 'react-bootstrap';
import { mesasService } from '../services/api';
import { useMesasStore, useAuthStore } from '../stores';
import {
  IconGear, IconCash, IconRefresh, IconLogout,
  IconUsers, IconUser, IconMapPin, IconPlate, IconArrowSwap,
} from '../components/Icons';
import './Mesas.css';

const ESTADO_CONFIG = {
  disponible: { label: 'Disponible', className: 'disponible' },
  ocupada: { label: 'Ocupada', className: 'ocupada' },
  en_precuenta: { label: 'Precuenta', className: 'en_precuenta' },
};

export default function Mesas() {
  const navigate = useNavigate();
  const usuario = useAuthStore((state) => state.usuario);
  const logout = useAuthStore((state) => state.logout);
  const mesas = useMesasStore((state) => state.mesas);
  const setMesas = useMesasStore((state) => state.setMesas);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTrasladoModal, setShowTrasladoModal] = useState(false);
  const [mesaOrigen, setMesaOrigen] = useState(null);
  const [mesaDestinoId, setMesaDestinoId] = useState('');
  const [trasladando, setTrasladando] = useState(false);
  const [reasignarMesero, setReasignarMesero] = useState(true);

  const cargarMesas = useCallback(async () => {
    try {
      setLoading(true);
      const sedeId = localStorage.getItem('sedeId') || usuario?.sede_id || 1;
      const response = await mesasService.getAll(sedeId);
      setMesas(response.data.data || []);
    } catch (err) {
      const mensaje = err.response?.data?.message || 'Error al cargar mesas';
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setMesas, usuario]);

  useEffect(() => {
    cargarMesas();
  }, [cargarMesas]);

  const handleSelectMesa = (mesa) => {
    localStorage.setItem('mesaActual', JSON.stringify(mesa));
    navigate(`/orden/${mesa.id}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const abrirModalTraslado = (mesa, event) => {
    event.stopPropagation();
    const disponibles = mesas.filter((m) => m.estado === 'disponible' && m.id !== mesa.id);
    if (disponibles.length === 0) {
      toast.warn('No hay mesas disponibles para traslado');
      return;
    }

    setMesaOrigen(mesa);
    setMesaDestinoId(String(disponibles[0].id));
    setReasignarMesero(true);
    setShowTrasladoModal(true);
  };

  const confirmarTraslado = async () => {
    if (!mesaOrigen?.orden_activa_id || !mesaDestinoId) {
      toast.error('Datos incompletos para traslado');
      return;
    }

    try {
      setTrasladando(true);
      await mesasService.trasladarOrden({
        orden_id: mesaOrigen.orden_activa_id,
        mesa_origen_id: mesaOrigen.id,
        mesa_destino_id: parseInt(mesaDestinoId, 10),
        reasignar_mesero: reasignarMesero,
      });

      toast.success(`Orden trasladada de mesa ${mesaOrigen.numero}`);
      setShowTrasladoModal(false);
      setMesaOrigen(null);
      setMesaDestinoId('');
      setReasignarMesero(true);
      await cargarMesas();
    } catch (err) {
      const mensaje = err.response?.data?.error || 'No se pudo trasladar la mesa';
      toast.error(mensaje);
    } finally {
      setTrasladando(false);
    }
  };

  if (loading) {
    return (
      <div className="mesas-page mesas-page--loading">
        <div className="mesas-spinner" aria-label="Cargando mesas" />
      </div>
    );
  }

  const mesasOrdenadas = [...mesas].sort((a, b) => parseInt(a.numero) - parseInt(b.numero));
  const mesasDisponibles = mesasOrdenadas.filter((m) => m.estado === 'disponible');
  const mesasOcupadas = mesasOrdenadas.filter((m) => m.estado === 'ocupada');
  const mesasPrecuenta = mesasOrdenadas.filter((m) => m.estado === 'en_precuenta');
  const mesasDisponiblesTraslado = mesasDisponibles.filter((m) => m.id !== mesaOrigen?.id);

  return (
    <div className="mesas-page">
      {/* Header */}
      <div className="mesas-header">
        <div className="mesas-header__inner">
          <div className="mesas-header__identity">
            <div className="mesas-header__avatar">
              <IconPlate />
            </div>
            <div>
              <h1 className="mesas-header__name">{usuario?.nombre || 'Mesero'}</h1>
              <p className="mesas-header__sede">
                <IconMapPin /> {usuario?.sede?.nombre || 'Sede Principal'}
              </p>
            </div>
          </div>

          <div className="mesas-header__actions">
            {['Administrador', 'Gerente'].includes(usuario?.rol?.nombre) && (
              <button type="button" className="hdr-btn" onClick={() => navigate('/admin')}>
                <IconGear /> <span>Admin</span>
              </button>
            )}
            {usuario?.rol?.nombre === 'Caja' && (
              <button type="button" className="hdr-btn hdr-btn--accent" onClick={() => navigate('/caja')}>
                <IconCash /> <span>Caja</span>
              </button>
            )}
            <button type="button" className="hdr-btn" onClick={cargarMesas}>
              <IconRefresh /> <span>Refrescar</span>
            </button>
            <button type="button" className="hdr-btn hdr-btn--ghost" onClick={handleLogout}>
              <IconLogout /> <span>Salir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="mesas-content">
        {error && <div className="mesas-alert">{error}</div>}

        {/* Estadísticas */}
        <div className="mesas-stats">
          <div className="mesas-stat mesas-stat--green">
            <span className="mesas-stat__value">{mesasDisponibles.length}</span>
            <span className="mesas-stat__label">Disponibles</span>
          </div>
          <div className="mesas-stat mesas-stat--copper">
            <span className="mesas-stat__value">{mesasOcupadas.length}</span>
            <span className="mesas-stat__label">Ocupadas</span>
          </div>
          <div className="mesas-stat mesas-stat--cyan">
            <span className="mesas-stat__value">{mesasPrecuenta.length}</span>
            <span className="mesas-stat__label">En Precuenta</span>
          </div>
          <div className="mesas-stat mesas-stat--neutral">
            <span className="mesas-stat__value">{mesas.length}</span>
            <span className="mesas-stat__label">Total</span>
          </div>
        </div>

        {/* Mesas por Zona */}
        <h2 className="mesas-section-title">
          <IconMapPin /> Mesas por zona
        </h2>

        <div className="mesas-grid">
          {mesas.length > 0 ? (
            mesasOrdenadas.map((mesa) => {
              const cfg = ESTADO_CONFIG[mesa.estado] || ESTADO_CONFIG.disponible;
              return (
                <div
                  key={mesa.id}
                  className={`mesas-tile ${cfg.className}`}
                  onClick={() => handleSelectMesa(mesa)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="mesas-tile__top">
                    <span className="mesas-tile__numero">{mesa.numero}</span>
                    <span className={`mesas-tile__badge ${cfg.className}`}>{cfg.label}</span>
                  </div>

                  <p className="mesas-tile__zona">{mesa.zona?.nombre || 'Zona'}</p>

                  <p className="mesas-tile__capacidad">
                    <IconUsers /> {mesa.capacidad} personas
                  </p>

                  {mesa.mesero_nombre && (
                    <p className={`mesero-chip ${mesa.estado === 'ocupada' ? 'mesero-chip--ocupada' : ''}`}>
                      <IconUser /> {mesa.mesero_nombre}
                    </p>
                  )}

                  {mesa.orden_activa_id && mesa.estado !== 'disponible' && (
                    <button
                      type="button"
                      className="mesas-tile__traslado-btn"
                      onClick={(event) => abrirModalTraslado(mesa, event)}
                    >
                      <IconArrowSwap /> Trasladar
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="mesas-alert mesas-alert--warning">No hay mesas disponibles</div>
          )}
        </div>
      </div>

      <Modal
        show={showTrasladoModal}
        onHide={() => setShowTrasladoModal(false)}
        centered
        className="rb-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Trasladar mesa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="rb-modal__line">
            Mesa origen: <strong>{mesaOrigen?.numero || '-'}</strong>
          </p>
          <p className="rb-modal__line rb-modal__line--spaced">
            Orden: <strong>{mesaOrigen?.orden_activa_numero || `#${mesaOrigen?.orden_activa_id || '-'}`}</strong>
          </p>

          <Form.Group>
            <Form.Label className="rb-modal__label">Mesa destino disponible</Form.Label>
            <Form.Select
              value={mesaDestinoId}
              onChange={(e) => setMesaDestinoId(e.target.value)}
              className="rb-modal__select"
            >
              {mesasDisponiblesTraslado.map((mesa) => (
                <option key={mesa.id} value={mesa.id}>
                  Mesa {mesa.numero}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mt-3">
            <Form.Check
              type="switch"
              id="switch-reasignar-mesero"
              checked={reasignarMesero}
              onChange={(e) => setReasignarMesero(e.target.checked)}
              label="Reasignar orden al mesero actual"
              className="rb-modal__switch"
            />
            <small className="rb-modal__hint">
              Si se desactiva, la orden conserva el mesero original.
            </small>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="rb-btn rb-btn--ghost"
            onClick={() => {
              setShowTrasladoModal(false);
              setReasignarMesero(true);
            }}
            disabled={trasladando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rb-btn rb-btn--primary"
            onClick={confirmarTraslado}
            disabled={trasladando || !mesaDestinoId}
          >
            {trasladando ? 'Trasladando...' : 'Confirmar traslado'}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}