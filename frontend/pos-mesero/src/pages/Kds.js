import { toast } from 'react-toastify';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { kdsService } from '../services/api';
import { useAuthStore } from '../stores';
import {
  IconChefHat, IconRefresh, IconLogout, IconNote, IconClock,
  IconBuilding, IconPlus, IconMinus, IconClose, IconCheck, IconInbox,
} from '../components/Icons';
import './Kds.css';

export default function Kds() {
  const navigate = useNavigate();
  const usuario = useAuthStore((state) => state.usuario);
  const logout = useAuthStore((state) => state.logout);
  const sedeId = localStorage.getItem('sedeId');

  const [estaciones, setEstaciones] = useState([]);
  const [estacionId, setEstacionId] = useState(null);
  const [comandas, setComandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actualizando, setActualizando] = useState(false);
  const [tabActiva, setTabActiva] = useState('pendientes');

  useEffect(() => {
    if (!usuario) {
      navigate('/login');
      return;
    }
    if (!sedeId) {
      setError('No se encontró la sede. Por favor, inicia sesión de nuevo.');
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [usuario, sedeId, navigate]);

  useEffect(() => {
    const cargarEstaciones = async () => {
      try {
        if (!sedeId) {
          setError('No se encontró la sede');
          setLoading(false);
          return;
        }

        const res = await kdsService.getEstacionesPorSede(parseInt(sedeId));
        setEstaciones(res.data.data || []);

        if (res.data.data && res.data.data.length > 0) {
          const cocina = res.data.data.find(e => e.tipo === 'cocina') || res.data.data[0];
          setEstacionId(cocina.id);
        } else {
          setError('No hay estaciones disponibles');
        }
        setLoading(false);
      } catch (err) {
        setError(`Error al cargar estaciones: ${err.message}`);
        setLoading(false);
      }
    };

    if (sedeId && usuario) {
      cargarEstaciones();
    }
  }, [sedeId, usuario]);

  const cargarComandas = useCallback(async () => {
    if (!estacionId) return;

    try {
      setLoading(true);
      const res = await kdsService.getComandaByEstacion(estacionId);
      const comandasData = res.data.data || [];
      setComandas(comandasData);
      setError('');
    } catch (err) {
      const mensaje = err.response?.data?.message || 'Error al cargar comandas';
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setLoading(false);
    }
  }, [estacionId]);

  useEffect(() => {
    cargarComandas();
    const interval = setInterval(cargarComandas, 15000);
    return () => clearInterval(interval);
  }, [cargarComandas]);

  const handleEstadoComanda = async (comandaId, nuevoEstado) => {
    try {
      setActualizando(true);
      await kdsService.updateEstadoComanda(comandaId, nuevoEstado);
      toast.success(`Comanda actualizada a ${nuevoEstado}`);
      await cargarComandas();
    } catch (err) {
      toast.error('Error al actualizar comanda');
    } finally {
      setActualizando(false);
    }
  };

  const handleEstadoItem = async (itemId, nuevoEstado) => {
    try {
      setActualizando(true);
      await kdsService.updateEstadoItem(itemId, nuevoEstado);
      toast.success(`Item actualizado a ${nuevoEstado}`);
      await new Promise(resolve => setTimeout(resolve, 300));
      await cargarComandas();
    } catch (err) {
      toast.error('Error al actualizar item');
    } finally {
      setActualizando(false);
    }
  };

  // El enum de estado de comanda_items es masculino (pendiente, en_preparacion,
  // listo, entregado) y el de comandas es femenino (..., lista, entregada) —
  // son dos columnas/tablas distintas en el backend, no intercambiables.
  const getBotonEstadoItem = (estado) => {
    const transiciones = {
      pendiente: { siguiente: 'en_preparacion', label: 'Empezar a preparar' },
      en_preparacion: { siguiente: 'listo', label: 'Marcar como listo' },
      listo: { siguiente: 'entregado', label: 'Entregado' },
      entregado: null,
    };
    return transiciones[estado];
  };

  const getBotonEstadoComanda = (estado) => {
    const transiciones = {
      pendiente: { siguiente: 'en_preparacion', label: 'Empezar a preparar' },
      en_preparacion: { siguiente: 'lista', label: 'Marcar como lista' },
      lista: { siguiente: 'entregada', label: 'Entregada' },
      entregada: null,
    };
    return transiciones[estado];
  };

  const getAccionBadge = (accion) => {
    const valor = String(accion || 'agregado').toLowerCase();
    if (valor === 'cancelado') {
      return { label: 'CANCELADO', Icon: IconClose, className: 'kds-badge--pendiente' };
    }
    if (valor === 'reducido') {
      return { label: 'REDUCIDO', Icon: IconMinus, className: 'kds-badge--en_preparacion' };
    }
    return { label: 'AGREGADO', Icon: IconPlus, className: 'kds-badge--lista' };
  };

  const limpiarNotaAccion = (nota) => String(nota || '')
    .replace(/^\[ACCION:[A-Z_]+\]\s*/i, '')
    .trim();

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    navigate('/login');
  };

  const ordenesPendientes = comandas.filter(c =>
    ['pendiente', 'en_preparacion'].includes(c.estado)
  );

  const ordenesListas = comandas.filter(c => c.estado === 'lista');
  const ordenesEntregadas = comandas.filter(c => c.estado === 'entregada');

  const formatearFechaHora = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      const date = new Date(fecha);
      const dia = date.toLocaleDateString('es-ES');
      const hora = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      return `${dia} ${hora}`;
    } catch (e) {
      return fecha;
    }
  };

  if (loading) {
    return (
      <div className="kds-page kds-page--loading">
        <div className="rb-spinner" aria-label="Cargando estaciones" />
        <p style={{ color: 'var(--rb-cream-500)', margin: 0 }}>Cargando estaciones...</p>
        <small>Sede ID: {sedeId}</small>
        <small>Usuario: {usuario?.nombre}</small>
      </div>
    );
  }

  const renderItem = (item) => {
    const accion = getAccionBadge(item.accion);
    const boton = getBotonEstadoItem(item.estado);
    return (
      <div key={item.id} className="kds-item">
        <div className="kds-item__top">
          <div>
            <h6 className="kds-item__nombre">{item.nombre}</h6>
            <span className="kds-item__cantidad">Cantidad: {item.cantidad}</span>
            <div className="kds-item__accion">
              <span className={`kds-badge ${accion.className}`}>
                <accion.Icon /> {accion.label}
              </span>
            </div>
            {limpiarNotaAccion(item.notas_especiales) && (
              <div className="kds-item__nota">
                <IconNote /> {limpiarNotaAccion(item.notas_especiales)}
              </div>
            )}
          </div>
          <span className={`kds-badge kds-badge--${item.estado}`}>
            {item.estado.replace('_', ' ')}
          </span>
        </div>

        {boton && (
          <button
            className="kds-item__btn"
            onClick={() => handleEstadoItem(item.id, boton.siguiente)}
            disabled={actualizando}
          >
            {boton.label}
          </button>
        )}
      </div>
    );
  };

  const renderComanda = (comanda) => {
    const boton = getBotonEstadoComanda(comanda.estado);
    return (
      <div key={comanda.id} className={`comanda-card comanda-card--${comanda.estado}`}>
        <div className="comanda-card__header">
          <div>
            <h5 className="comanda-card__numero">#{comanda.numero_comanda}</h5>
            <span className="comanda-card__mesa">Mesa {comanda.mesa_numero || 'N/A'}</span>
          </div>
          <span className={`kds-badge kds-badge--${comanda.estado}`}>
            {comanda.estado.replace('_', ' ')}
          </span>
        </div>

        <div className="comanda-card__body">
          {comanda.items && comanda.items.length > 0 ? (
            comanda.items.map(renderItem)
          ) : (
            <p className="kds-empty-text">Sin items</p>
          )}
        </div>

        {boton && (
          <div className="comanda-card__footer">
            <button
              className="rb-btn rb-btn--primary"
              onClick={() => handleEstadoComanda(comanda.id, boton.siguiente)}
              disabled={actualizando}
            >
              {boton.label}
            </button>
          </div>
        )}
      </div>
    );
  };

  const TABS = [
    { id: 'pendientes', label: `Pendientes (${ordenesPendientes.length})` },
    { id: 'listas', label: `Listas (${ordenesListas.length})` },
    { id: 'entregadas', label: `Entregadas (${ordenesEntregadas.length})` },
  ];

  return (
    <div className="kds-page">
      <div className="kds-header">
        <div className="kds-header__inner">
          <div>
            <h2 className="kds-header__title"><IconChefHat /> Kitchen Display System</h2>
            <p className="kds-header__operario">Operario: {usuario?.nombre}</p>
          </div>
          <div className="kds-header__actions">
            <button className="rb-btn rb-btn--ghost" onClick={cargarComandas} disabled={loading}>
              <IconRefresh /> Actualizar
            </button>
            <button className="rb-btn rb-btn--ghost" onClick={handleLogout}>
              <IconLogout /> Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="kds-content" style={{ paddingBottom: 0 }}>
          <div className="rb-alert">{error}</div>
        </div>
      )}

      <div className="kds-content">
        {/* Selector de Estaciones */}
        <div className="kds-estaciones">
          {estaciones.length > 0 ? (
            estaciones.map((estacion) => (
              <button
                key={estacion.id}
                className={`kds-estacion-btn ${estacionId === estacion.id ? 'is-active' : ''}`}
                onClick={() => setEstacionId(estacion.id)}
              >
                <IconBuilding /> {estacion.nombre}
              </button>
            ))
          ) : (
            <p style={{ color: 'var(--rb-cream-500)' }}>Cargando estaciones...</p>
          )}
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id)}
              className={`admin-tab-btn ${tabActiva === tab.id ? 'is-active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: Pendientes */}
        {tabActiva === 'pendientes' && (
          ordenesPendientes.length === 0 ? (
            <div className="rb-alert" style={{ textAlign: 'center' }}>
              <IconCheck style={{ width: 14, height: 14, marginRight: 6 }} />
              No hay órdenes pendientes
            </div>
          ) : (
            <div className="kds-grid">{ordenesPendientes.map(renderComanda)}</div>
          )
        )}

        {/* TAB: Listas */}
        {tabActiva === 'listas' && (
          ordenesListas.length === 0 ? (
            <div className="rb-alert rb-alert--warning" style={{ textAlign: 'center' }}>
              No hay órdenes listas
            </div>
          ) : (
            <div className="kds-grid">{ordenesListas.map(renderComanda)}</div>
          )
        )}

        {/* TAB: Entregadas */}
        {tabActiva === 'entregadas' && (
          ordenesEntregadas.length === 0 ? (
            <div className="admin-empty-state">
              <IconInbox />
              <p>Sin órdenes entregadas hoy</p>
            </div>
          ) : (
            <div>
              {ordenesEntregadas.map((comanda) => (
                <div key={comanda.id} className="kds-entregada-card">
                  <div className="kds-entregada-card__header">
                    <div>
                      <h5 className="comanda-card__numero" style={{ fontSize: '1rem' }}>Orden #{comanda.numero_comanda}</h5>
                      <span className="comanda-card__mesa">Mesa {comanda.mesa_numero || 'N/A'}</span>
                    </div>
                    <span className="kds-badge kds-badge--lista">ENTREGADA</span>
                  </div>
                  <div className="kds-entregada-card__body">
                    <div>
                      <h6><IconNote /> Detalles</h6>
                      {comanda.items && comanda.items.length > 0 ? (
                        <ul>
                          {comanda.items.map((item) => (
                            <li key={item.id}>
                              • {item.nombre} x{item.cantidad} ({getAccionBadge(item.accion).label})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="kds-empty-text" style={{ textAlign: 'left' }}>Sin items</p>
                      )}
                    </div>
                    <div>
                      <h6><IconClock /> Fecha y Hora de Entrega</h6>
                      <p style={{ margin: 0, color: 'var(--rb-cream-100)', fontWeight: 700 }}>
                        {formatearFechaHora(comanda.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}