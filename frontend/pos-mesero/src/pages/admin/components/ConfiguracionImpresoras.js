import React, { useEffect, useState } from 'react';
import axios from '../../../services/api';
import { useAuthStore } from '../../../stores';
import AdminLayout from '../AdminLayout';
import { toast } from 'react-toastify';
import {
  IconPrinter, IconPlus, IconInfo, IconEdit, IconTrash, IconClose,
} from '../../../components/Icons';
import '../admin.css';

const EMPTY_FORM = {
  sede_id: '',
  nombre: '',
  tipo: 'termica',
  modelo: '',
  ip_address: '',
  puerto: 9100,
  estado: 'activa',
};

const ConfiguracionImpresoras = () => {
  const usuario = useAuthStore((state) => state.usuario);
  const [impresoras, setImpresoras] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [testando, setTestando] = useState(null);
  const [seleccionFactura, setSeleccionFactura] = useState({}); // { [sede_id]: impresora_id }
  const [guardandoFactura, setGuardandoFactura] = useState(null);

  useEffect(() => {
    Promise.all([cargarImpresoras(), cargarSedes()]);
  }, []);

  const cargarImpresoras = async () => {
    try {
      const res = await axios.get('/admin/impresoras');
      setImpresoras(res.data.success ? res.data.data : []);
    } catch {
      setImpresoras([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarSedes = async () => {
    try {
      const res = await axios.get('/admin/sedes');
      const lista = Array.isArray(res.data) ? res.data : res.data.data || [];
      setSedes(lista);
      // Pre-seleccionar la sede del usuario
      const sedeDefault = usuario?.sedeId || usuario?.sede_id || (lista[0]?.id ?? '');
      setFormData(prev => ({ ...prev, sede_id: sedeDefault }));
      setSeleccionFactura(
        lista.reduce((acc, s) => ({ ...acc, [s.id]: s.impresora_factura_id || '' }), {})
      );
    } catch {
      setSedes([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNueva = () => {
    const sedeDefault = usuario?.sedeId || usuario?.sede_id || (sedes[0]?.id ?? '');
    setFormData({ ...EMPTY_FORM, sede_id: sedeDefault });
    setEditingId(null);
    setShowModal(true);
  };

  const handleEditar = (imp) => {
    setFormData({
      sede_id: imp.sede_id,
      nombre: imp.nombre,
      tipo: imp.tipo || 'termica',
      modelo: imp.modelo || '',
      ip_address: imp.ip_address || '',
      puerto: imp.puerto || 9100,
      estado: imp.estado || 'activa',
    });
    setEditingId(imp.id);
    setShowModal(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/admin/impresoras/${editingId}`, formData);
        toast.success('Impresora actualizada');
      } else {
        await axios.post('/admin/impresoras', formData);
        toast.success('Impresora creada');
      }
      setShowModal(false);
      cargarImpresoras();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta impresora?')) return;
    try {
      await axios.delete(`/admin/impresoras/${id}`);
      toast.success('Impresora eliminada');
      cargarImpresoras();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleGuardarImpresoraFactura = async (sedeId) => {
    setGuardandoFactura(sedeId);
    try {
      const impresoraId = seleccionFactura[sedeId] || null;
      await axios.put(`/admin/sedes/${sedeId}/impresora-factura`, { impresora_id: impresoraId });
      toast.success('Impresora de factura actualizada');
      cargarSedes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setGuardandoFactura(null);
    }
  };

  const handleTest = async (imp) => {
    setTestando(imp.id);
    try {
      const res = await axios.post(`/admin/impresoras/${imp.id}/test`);
      toast.success(res.data.message || 'Página de prueba enviada ✓');
    } catch (err) {
      toast.error(err.response?.data?.error || `No se pudo conectar a ${imp.ip_address}`);
    } finally {
      setTestando(null);
    }
  };

  if (loading) {
    return <AdminLayout><div className="loading">Cargando impresoras...</div></AdminLayout>;
  }

  const estadoBadge = (estado) => (
    <span className={`rb-badge ${estado === 'activa' ? 'rb-badge--success' : 'rb-badge--neutral'}`}>
      {estado === 'activa' ? 'Activa' : 'Inactiva'}
    </span>
  );

  return (
    <AdminLayout>
      <div className="admin-section">
        <div className="section-header">
          <h2><IconPrinter /> Impresoras de Red</h2>
          <button className="btn btn-primary" onClick={handleNueva}>
            <IconPlus /> Nueva Impresora
          </button>
        </div>

        {/* Tip de configuración */}
        <div style={{
          background: 'rgba(74, 151, 163, 0.1)',
          border: '1px solid rgba(74, 151, 163, 0.35)',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '20px',
          fontSize: '0.84rem',
          color: 'var(--rb-cyan-400)',
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
        }}>
          <IconInfo style={{ width: 17, height: 17, flexShrink: 0, marginTop: 2 }} />
          <span>
            <strong>DigitalPOS DIG-E200I:</strong> Para asignarle IP fija, imprime la config manteniendo presionado el botón de papel al encender.
            Luego en la app <em>DigitalPOS</em> o el panel web de la impresora, configura WiFi y asigna IP estática.
            Puerto predeterminado: <strong>9100</strong>.
          </span>
        </div>

        {impresoras.length === 0 ? (
          <div className="admin-empty-state">
            <IconPrinter />
            <p>No hay impresoras configuradas. Agrega una para enviar comandas automáticamente.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Sede</th>
                  <th>Modelo</th>
                  <th>IP</th>
                  <th>Puerto</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {impresoras.map(imp => (
                  <tr key={imp.id}>
                    <td><strong>{imp.nombre}</strong></td>
                    <td>{imp.sede_nombre}</td>
                    <td>{imp.modelo || <span style={{ color: 'var(--rb-cream-700)' }}>—</span>}</td>
                    <td><code style={{ color: 'var(--rb-cream-300)' }}>{imp.ip_address || <span style={{ color: 'var(--rb-cream-700)' }}>Sin IP</span>}</code></td>
                    <td>{imp.puerto}</td>
                    <td>{estadoBadge(imp.estado)}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-sm btn-info"
                        style={{ marginRight: 6 }}
                        onClick={() => handleTest(imp)}
                        disabled={testando === imp.id || !imp.ip_address}
                        title={!imp.ip_address ? 'Configura la IP primero' : 'Imprimir página de prueba'}
                      >
                        <IconPrinter /> {testando === imp.id ? 'Probando...' : 'Prueba'}
                      </button>
                      <button
                        className="btn btn-sm btn-primary"
                        style={{ marginRight: 6 }}
                        onClick={() => handleEditar(imp)}
                      >
                        <IconEdit /> Editar
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleEliminar(imp.id)}
                        aria-label="Eliminar impresora"
                      >
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Impresora para la factura final, por sede */}
        {sedes.length > 0 && (
          <div className="admin-section" style={{ marginTop: 28, padding: 0, boxShadow: 'none', background: 'none' }}>
            <div className="section-header">
              <h3 className="admin-subtitle"><IconPrinter /> Impresora para la factura final</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--rb-cream-500)', marginTop: -8, marginBottom: 16 }}>
              Elige a cuál impresora de cada sede se manda la factura/recibo al cobrar en Caja —
              la de cocina o la del bar. Si la dejas en automático, se usa la primera impresora
              activa cuyo nombre sugiera "bar" o "caja".
            </p>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Sede</th>
                    <th>Impresora para la factura</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sedes.map((s) => {
                    const impresorasDeLaSede = impresoras.filter(
                      (imp) => imp.sede_id === s.id && imp.estado === 'activa'
                    );
                    return (
                      <tr key={s.id}>
                        <td><strong>{s.nombre}</strong></td>
                        <td>
                          {impresorasDeLaSede.length === 0 ? (
                            <span style={{ color: 'var(--rb-cream-700)' }}>
                              Sin impresoras activas en esta sede
                            </span>
                          ) : (
                            <select
                              value={seleccionFactura[s.id] || ''}
                              onChange={(e) =>
                                setSeleccionFactura((prev) => ({ ...prev, [s.id]: e.target.value }))
                              }
                            >
                              <option value="">Automático (bar/caja por nombre)</option>
                              {impresorasDeLaSede.map((imp) => (
                                <option key={imp.id} value={imp.id}>{imp.nombre}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-sm btn-primary"
                            disabled={impresorasDeLaSede.length === 0 || guardandoFactura === s.id}
                            onClick={() => handleGuardarImpresoraFactura(s.id)}
                          >
                            {guardandoFactura === s.id ? 'Guardando...' : 'Guardar'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div className="modal-header">
                <h3>{editingId ? 'Editar Impresora' : 'Nueva Impresora'}</h3>
                <button className="btn-close" onClick={() => setShowModal(false)}><IconClose /></button>
              </div>

              <form onSubmit={handleGuardar}>
                <div className="form-group">
                  <label>Sede *</label>
                  <select name="sede_id" value={formData.sede_id} onChange={handleChange} required>
                    <option value="">Selecciona sede</option>
                    {sedes.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ej: Impresora Cocina"
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Tipo</label>
                    <select name="tipo" value={formData.tipo} onChange={handleChange}>
                      <option value="termica">Térmica</option>
                      <option value="laser">Láser</option>
                      <option value="inyeccion">Inyección</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Modelo</label>
                    <input
                      type="text"
                      name="modelo"
                      value={formData.modelo}
                      onChange={handleChange}
                      placeholder="Ej: DIG-E200I"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>IP de la impresora *</label>
                    <input
                      type="text"
                      name="ip_address"
                      value={formData.ip_address}
                      onChange={handleChange}
                      placeholder="Ej: 192.168.1.101"
                      pattern="^\d{1,3}(\.\d{1,3}){3}$"
                      title="Ingresa una IP válida (ej: 192.168.1.101)"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Puerto</label>
                    <input
                      type="number"
                      name="puerto"
                      value={formData.puerto}
                      onChange={handleChange}
                      min="1"
                      max="65535"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Estado</label>
                  <select name="estado" value={formData.estado} onChange={handleChange}>
                    <option value="activa">Activa</option>
                    <option value="inactiva">Inactiva</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingId ? 'Guardar cambios' : 'Crear impresora'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ConfiguracionImpresoras;