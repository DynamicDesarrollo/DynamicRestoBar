import React, { useEffect, useState } from 'react';
import axios from '../../../services/api';
import { useAuthStore } from '../../../stores';
import AdminLayout from '../AdminLayout';
import { toast } from 'react-toastify';
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
    <span style={{
      background: estado === 'activa' ? '#4caf50' : '#9e9e9e',
      color: 'white',
      padding: '3px 10px',
      borderRadius: '12px',
      fontSize: '12px',
    }}>
      {estado === 'activa' ? '● Activa' : '○ Inactiva'}
    </span>
  );

  return (
    <AdminLayout>
      <div className="admin-section">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>🖨️ Impresoras de Red</h2>
          <button className="btn btn-primary" onClick={handleNueva}>
            + Nueva Impresora
          </button>
        </div>

        {/* Tip de configuración */}
        <div style={{
          background: '#e3f2fd',
          border: '1px solid #90caf9',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          fontSize: '13px',
          color: '#1565c0',
        }}>
          <strong>💡 DigitalPOS DIG-E200I:</strong> Para asignarle IP fija, imprime la config manteniendo presionado el botón de papel al encender.
          Luego en la app <em>DigitalPOS</em> o el panel web de la impresora, configura WiFi y asigna IP estática.
          Puerto predeterminado: <strong>9100</strong>.
        </div>

        {impresoras.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            No hay impresoras configuradas. Agrega una para enviar comandas automáticamente.
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
                    <td>{imp.modelo || <span style={{ color: '#bbb' }}>—</span>}</td>
                    <td><code>{imp.ip_address || <span style={{ color: '#bbb' }}>Sin IP</span>}</code></td>
                    <td>{imp.puerto}</td>
                    <td>{estadoBadge(imp.estado)}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-sm"
                        style={{ background: '#2196f3', color: 'white', marginRight: 6 }}
                        onClick={() => handleTest(imp)}
                        disabled={testando === imp.id || !imp.ip_address}
                        title={!imp.ip_address ? 'Configura la IP primero' : 'Imprimir página de prueba'}
                      >
                        {testando === imp.id ? '⏳' : '🖨️'} Prueba
                      </button>
                      <button
                        className="btn btn-sm btn-primary"
                        style={{ marginRight: 6 }}
                        onClick={() => handleEditar(imp)}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleEliminar(imp.id)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div className="modal-header">
                <h3>{editingId ? 'Editar Impresora' : 'Nueva Impresora'}</h3>
                <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
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
