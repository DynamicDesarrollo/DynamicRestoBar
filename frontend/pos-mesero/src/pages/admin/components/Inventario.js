import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from '../../../services/api';
import AdminLayout from '../AdminLayout';
import { formatMoney } from '../../../utils/formatters';
import {
  IconBarChart, IconPlus, IconGrid, IconNote, IconAlertTriangle, IconPin,
  IconArrowDownCircle, IconArrowUpCircle, IconWrench, IconClose,
} from '../../../components/Icons';
import '../admin.css';

const Inventario = () => {
    const [sedes, setSedes] = useState([]);
    const [sedeSeleccionada, setSedeSeleccionada] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMovimientoModal, setShowMovimientoModal] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState('entrada');

  const [formMovimiento, setFormMovimiento] = useState({
    insumo_id: '',
    cantidad: '',
    unidad_medida_id: '',
    costo_unitario: '',
    documento_id: '',
    referencia: '',
  });

  const [formAjuste, setFormAjuste] = useState({
    insumo_id: '',
    cantidad: '',
    tipo_ajuste: 'MERMA',
    motivo: '',
  });

  useEffect(() => {
    cargarSedes();
  }, []);

  const cargarSedes = async () => {
    try {
      const res = await axios.get('/admin/sedes');
      if (Array.isArray(res.data)) {
        setSedes(res.data);
      } else if (res.data.success && Array.isArray(res.data.data)) {
        setSedes(res.data.data);
      } else {
        setSedes([]);
      }
      // Selecciona la primera sede por defecto
      if (res.data && (Array.isArray(res.data) ? res.data.length : res.data.data?.length)) {
        setSedeSeleccionada((Array.isArray(res.data) ? res.data[0]?.id : res.data.data[0]?.id) || '');
      }
    } catch (err) {
      setSedes([]);
    }
  };

  useEffect(() => {
    if (sedeSeleccionada) {
      cargarDatos();
    }
  }, [sedeSeleccionada]);

  const cargarDatos = async () => {
    try {
      const [dashboardRes, kardexRes] = await Promise.all([
        axios.get(`/admin/inventario/dashboard?sede_id=${sedeSeleccionada}`),
        axios.get(`/admin/inventario/kardex?sede_id=${sedeSeleccionada}`),
      ]);
      if (dashboardRes.data.success) setDashboard(dashboardRes.data.data);
      if (kardexRes.data.success) setMovimientos(kardexRes.data.data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormMovimiento(prev => ({ ...prev, [name]: value }));
  };

  const handleInputChangeAjuste = (e) => {
    const { name, value } = e.target;
    setFormAjuste(prev => ({ ...prev, [name]: value }));
  };

  const registrarMovimiento = async (e) => {
    e.preventDefault();
    try {
      const data = {
        insumo_id: parseInt(formMovimiento.insumo_id),
        cantidad: parseFloat(formMovimiento.cantidad),
        unidad_medida_id: formMovimiento.unidad_medida_id ? parseInt(formMovimiento.unidad_medida_id) : undefined,
        costo_unitario: formMovimiento.costo_unitario ? parseFloat(formMovimiento.costo_unitario) : undefined,
        documento_id: formMovimiento.documento_id || null,
        referencia: formMovimiento.referencia || null,
      };

      const endpoint = tipoMovimiento === 'entrada' ? '/admin/inventario/entrada' : '/admin/inventario/salida';
      await axios.post(endpoint, data);

      toast.success(`${tipoMovimiento.charAt(0).toUpperCase() + tipoMovimiento.slice(1)} registrada exitosamente`);
      setShowMovimientoModal(false);
      setFormMovimiento({ insumo_id: '', cantidad: '', unidad_medida_id: '', costo_unitario: '', documento_id: '', referencia: '' });
      cargarDatos();
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const registrarAjuste = async (e) => {
    e.preventDefault();
    try {
      const data = {
        insumo_id: parseInt(formAjuste.insumo_id),
        cantidad: parseFloat(formAjuste.cantidad),
        tipo_ajuste: formAjuste.tipo_ajuste,
        motivo: formAjuste.motivo || null,
      };

      await axios.post('/admin/inventario/ajuste', data);
      toast.success('Ajuste registrado exitosamente');
      setShowMovimientoModal(false);
      setFormAjuste({ insumo_id: '', cantidad: '', tipo_ajuste: 'MERMA', motivo: '' });
      cargarDatos();
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Cargando inventario...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-section">
        <div className="section-header">
          <h2><IconBarChart /> Inventario</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <label style={{ fontWeight: 600, color: 'var(--rb-cream-300)', fontSize: '0.86rem' }}>Sede:</label>
            <select
              className="admin-select"
              value={sedeSeleccionada}
              onChange={e => setSedeSeleccionada(e.target.value)}
              style={{ minWidth: '180px' }}
            >
              {sedes.map(sede => (
                <option key={sede.id} value={sede.id}>{sede.nombre}</option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={() => {
              setTipoMovimiento('entrada');
              setShowMovimientoModal(true);
            }}>
              <IconPlus /> Entrada de Insumos
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`admin-tab-btn ${activeTab === 'dashboard' ? 'is-active' : ''}`}
          >
            <IconGrid /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('movimientos')}
            className={`admin-tab-btn ${activeTab === 'movimientos' ? 'is-active' : ''}`}
          >
            <IconNote /> Movimientos
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && dashboard && (
          <div>
            {/* Resumen */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-card__label"><IconGrid /> Total Insumos</div>
                <div className="metric-card__value">
                  {dashboard.totalInsumos}
                </div>
              </div>

              <div className="metric-card metric-card--warning">
                <div className="metric-card__label"><IconBarChart /> Valor del Inventario</div>
                <div className="metric-card__value">
                  {formatMoney(dashboard.valorTotal, true)}
                </div>
              </div>

              <div className="metric-card metric-card--danger">
                <div className="metric-card__label"><IconAlertTriangle /> Bajo Stock</div>
                <div className="metric-card__value">
                  {dashboard.bajoStock}
                </div>
              </div>
            </div>

            {/* Insumos Bajo Stock */}
            {dashboard.bajoStock > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h3 className="admin-heading-danger"><IconAlertTriangle /> Insumos Bajo Stock</h3>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Insumo</th>
                        <th>Stock Actual</th>
                        <th>Mínimo</th>
                        <th>Máximo</th>
                        <th>Diferencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.insumos.filter(i => i.stock_actual <= i.stock_minimo).map(insumo => (
                        <tr key={insumo.id} className="table-row--low-stock">
                          <td><strong>{insumo.nombre}</strong></td>
                          <td style={{ color: '#f0958c', fontWeight: 700 }}>{insumo.stock_actual}</td>
                          <td>{insumo.stock_minimo}</td>
                          <td>{insumo.stock_maximo || '∞'}</td>
                          <td style={{ color: '#f0958c' }}>-{(insumo.stock_minimo - insumo.stock_actual).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Movimientos Recientes */}
            {dashboard.movimientosRecientes && dashboard.movimientosRecientes.length > 0 && (
              <div>
                <h3 className="admin-subtitle"><IconPin /> Movimientos Recientes</h3>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Insumo</th>
                        <th>Tipo</th>
                        <th>Cantidad</th>
                        <th>Costo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.movimientosRecientes.map(mov => (
                        <tr key={mov.id}>
                          <td style={{ fontSize: '0.78rem', color: 'var(--rb-cream-500)' }}>
                            {new Date(mov.created_at).toLocaleDateString()}
                          </td>
                          <td>{mov.insumo_nombre}</td>
                          <td>
                            <span className={`mov-badge mov-badge--${mov.tipo}`}>
                              {mov.tipo.toUpperCase()}
                            </span>
                          </td>
                          <td>{mov.cantidad}</td>
                          <td>{formatMoney(mov.costo_total || 0, true)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Movimientos Tab */}
        {activeTab === 'movimientos' && (
          <div>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" onClick={() => {
                setTipoMovimiento('entrada');
                setShowMovimientoModal(true);
              }}>
                <IconArrowDownCircle /> Entrada
              </button>
              <button className="btn btn-warning" onClick={() => {
                setTipoMovimiento('salida');
                setShowMovimientoModal(true);
              }}>
                <IconArrowUpCircle /> Salida
              </button>
              <button className="btn btn-info" onClick={() => {
                setTipoMovimiento('ajuste');
                setShowMovimientoModal(true);
              }}>
                <IconWrench /> Ajuste
              </button>
            </div>

            {/* Tabla de Movimientos */}
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Insumo</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Costo Unit.</th>
                    <th>Costo Total</th>
                    <th>Referencia</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map(mov => (
                    <tr key={mov.id}>
                      <td style={{ fontSize: '0.78rem', color: 'var(--rb-cream-500)' }}>
                        {new Date(mov.created_at).toLocaleDateString()} {new Date(mov.created_at).toLocaleTimeString()}
                      </td>
                      <td><strong>{mov.insumo_nombre}</strong></td>
                      <td>
                        <span className={`mov-badge mov-badge--${mov.tipo}`}>
                          {mov.tipo.toUpperCase()}
                        </span>
                      </td>
                      <td>{mov.cantidad}</td>
                      <td>{formatMoney(mov.precio_unitario || 0, true)}</td>
                      <td style={{ fontWeight: 700 }}>{formatMoney(mov.costo_total || 0, true)}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--rb-cream-500)' }}>{mov.observaciones || mov.referencia || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {movimientos.length === 0 && (
              <div className="admin-empty-state">
                <IconNote />
                <p>No hay movimientos registrados</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal para Movimientos */}
      {showMovimientoModal && (
        <div className="modal-overlay" onClick={() => setShowMovimientoModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {tipoMovimiento === 'entrada' ? 'Entrada' : tipoMovimiento === 'salida' ? 'Salida' : 'Ajuste'}
              </h3>
              <button className="btn-close" onClick={() => setShowMovimientoModal(false)}><IconClose /></button>
            </div>

            {tipoMovimiento === 'ajuste' ? (
              <form onSubmit={registrarAjuste}>
                <div className="form-group">
                  <label>Insumo *</label>
                  <select
                    name="insumo_id"
                    value={formAjuste.insumo_id}
                    onChange={handleInputChangeAjuste}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {dashboard?.insumos.map(i => (
                      <option key={i.id} value={i.id}>{i.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Cantidad *</label>
                    <input
                      type="number"
                      name="cantidad"
                      value={formAjuste.cantidad}
                      onChange={handleInputChangeAjuste}
                      placeholder="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Tipo Ajuste *</label>
                    <select
                      name="tipo_ajuste"
                      value={formAjuste.tipo_ajuste}
                      onChange={handleInputChangeAjuste}
                    >
                      <option value="MERMA">Merma</option>
                      <option value="ROTURA">Rotura</option>
                      <option value="AJUSTE">Ajuste</option>
                      <option value="TRASLADO">Traslado</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Motivo</label>
                  <input
                    type="text"
                    name="motivo"
                    value={formAjuste.motivo}
                    onChange={handleInputChangeAjuste}
                    placeholder="Descripción del ajuste"
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowMovimientoModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Registrar Ajuste
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={registrarMovimiento}>
                <div className="form-group">
                  <label>Insumo *</label>
                  <select
                    name="insumo_id"
                    value={formMovimiento.insumo_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {dashboard?.insumos.map(i => (
                      <option key={i.id} value={i.id}>{i.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Cantidad *</label>
                    <input
                      type="number"
                      name="cantidad"
                      value={formMovimiento.cantidad}
                      onChange={handleInputChange}
                      placeholder="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Costo Unitario</label>
                    <input
                      type="number"
                      name="costo_unitario"
                      value={formMovimiento.costo_unitario}
                      onChange={handleInputChange}
                      placeholder="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Documento ID</label>
                    <input
                      type="text"
                      name="documento_id"
                      value={formMovimiento.documento_id}
                      onChange={handleInputChange}
                      placeholder="Ej: OC-001"
                    />
                  </div>

                  <div className="form-group">
                    <label>Referencia</label>
                    <input
                      type="text"
                      name="referencia"
                      value={formMovimiento.referencia}
                      onChange={handleInputChange}
                      placeholder="Nota adicional"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowMovimientoModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Registrar {tipoMovimiento.charAt(0).toUpperCase() + tipoMovimiento.slice(1)}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Inventario;