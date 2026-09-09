import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from '../../../services/api';
import AdminLayout from '../AdminLayout';
import { IconTable, IconPlus, IconEdit, IconTrash, IconClose, IconMapPin } from '../../../components/Icons';
import '../admin.css';

const ConfiguracionMesas = () => {
  const [mesas, setMesas] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    numero: '',
    zona_id: '',
    capacidad: 4,
    sede_id: '',
  });
  const [showZonaModal, setShowZonaModal] = useState(false);
  const [editingZonaId, setEditingZonaId] = useState(null);
  const [zonaForm, setZonaForm] = useState({ nombre: '', descripcion: '' });

  useEffect(() => {
    cargarDatos();
    cargarSedes();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar zonas primero
      const zonasResponse = await axios.get('/admin/zonas');
      if (zonasResponse.data.success) {
        setZonas(zonasResponse.data.data);
      }
      
      // Cargar mesas
      await cargarMesas();
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarMesas = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/admin/mesas');
      if (response.data.success) {
        setMesas(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar mesas:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarMesasPorSede = async (sedeId) => {
    setLoading(true);
    try {
      const response = await axios.get('/admin/mesas', { params: { sedeId } });
      if (response.data.success) {
        setMesas(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar mesas por sede:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'zona_id' ? parseInt(value) : (name === 'capacidad' ? parseInt(value) : value),
    }));
  };

  const obtenerSiguienteNumero = () => {
    if (mesas.length === 0) return 1;
    const numerosExistentes = new Set(
      mesas.map(m => parseInt(m.numero)).filter(n => !isNaN(n))
    );
    let numero = 1;
    while (numerosExistentes.has(numero)) {
      numero++;
    }
    return numero;
  };

  const abrirModalNuevaMesa = () => {
    setFormData({
      numero: '',
      zona_id: zonas.length > 0 ? zonas[0].id : '',
      capacidad: 4,
    });
    setEditingId(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/admin/mesas/${editingId}`, formData);
      } else {
        await axios.post('/admin/mesas', formData);
      }
      setShowModal(false);
      setFormData({ numero: '', zona_id: zonas.length > 0 ? zonas[0].id : '', capacidad: 4 });
      setEditingId(null);
      cargarMesas();
    } catch (err) {
      console.error('Error al guardar mesa:', err);
      toast.error('Error al guardar mesa');
    }
  };

  const handleEdit = (mesa) => {
    setEditingId(mesa.id);
    setFormData({
      numero: mesa.numero,
      zona_id: mesa.zona_id,
      capacidad: mesa.capacidad,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta mesa?')) {
      try {
        await axios.delete(`/admin/mesas/${id}`);
        cargarMesas();
      } catch (err) {
        console.error('Error al eliminar mesa:', err);
        toast.error('Error al eliminar mesa');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ numero: '', zona_id: 1, capacidad: 4 });
  };

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
    } catch (err) {
      console.error('Error al cargar sedes:', err);
      setSedes([]);
    }
  };

  const cargarZonas = async () => {
    try {
      const res = await axios.get('/admin/zonas');
      if (res.data.success) {
        setZonas(res.data.data);
      }
    } catch (err) {
      console.error('Error al cargar zonas:', err);
    }
  };

  const abrirModalNuevaZona = () => {
    setZonaForm({ nombre: '', descripcion: '' });
    setEditingZonaId(null);
    setShowZonaModal(true);
  };

  const handleZonaChange = (e) => {
    const { name, value } = e.target;
    setZonaForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitZona = async (e) => {
    e.preventDefault();
    try {
      if (editingZonaId) {
        await axios.put(`/admin/zonas/${editingZonaId}`, zonaForm);
        toast.success('Zona actualizada');
      } else {
        await axios.post('/admin/zonas', zonaForm);
        toast.success('Zona creada');
      }
      setShowZonaModal(false);
      setZonaForm({ nombre: '', descripcion: '' });
      setEditingZonaId(null);
      cargarZonas();
    } catch (err) {
      console.error('Error al guardar zona:', err);
      toast.error(err.response?.data?.error || 'Error al guardar zona');
    }
  };

  const handleEditZona = (zona) => {
    setEditingZonaId(zona.id);
    setZonaForm({ nombre: zona.nombre, descripcion: zona.descripcion || '' });
    setShowZonaModal(true);
  };

  const handleDeleteZona = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta zona?')) {
      try {
        await axios.delete(`/admin/zonas/${id}`);
        cargarZonas();
      } catch (err) {
        console.error('Error al eliminar zona:', err);
        toast.error(err.response?.data?.error || 'Error al eliminar zona');
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Cargando mesas...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-section">
        <div className="section-header">
          <h2><IconTable /> Configuración de Mesas</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ fontWeight: 600, marginRight: 8, color: 'var(--rb-cream-300)', fontSize: '0.86rem' }}>Sede:</label>
            <select
              className="admin-select"
              value={formData.sede_id || ''}
              onChange={e => {
                const sedeId = e.target.value;
                setFormData(prev => ({ ...prev, sede_id: sedeId }));
                cargarMesasPorSede(sedeId);
              }}
              style={{ minWidth: 120, marginRight: 16 }}
            >
              <option value="">Todas</option>
              {sedes.map(sede => (
                <option key={sede.id} value={sede.id}>{sede.nombre}</option>
              ))}
            </select>
            <button className="btn btn-secondary" onClick={abrirModalNuevaZona}>
              <IconMapPin /> Zona
            </button>
            <button className="btn btn-primary" onClick={abrirModalNuevaMesa}>
              <IconPlus /> Agregar Mesa
            </button>
          </div>
        </div>

        {/* Zonas */}
        <div style={{ marginBottom: '30px' }}>
          <h3 className="admin-subtitle"><IconMapPin /> Zonas ({zonas.length})</h3>
          {zonas.length === 0 ? (
            <div style={{ color: 'var(--rb-cream-700)', fontSize: 13 }}>
              Aún no tienes zonas creadas. Crea una para poder agregar mesas.
            </div>
          ) : (
            <div className="categoria-pills">
              {zonas.map(zona => (
                <div key={zona.id} className="categoria-pill" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {zona.nombre}
                  <button
                    type="button"
                    onClick={() => handleEditZona(zona)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}
                    title="Editar zona"
                  >
                    <IconEdit />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteZona(zona.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}
                    title="Eliminar zona"
                  >
                    <IconClose />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mesas-grid">
          {mesas.map(mesa => (
            <div key={mesa.id} className={`mesa-card mesa-${mesa.estado}`}>
              <div className="mesa-number">#{mesa.numero}</div>
              <div className="mesa-info">
                <p><strong>Capacidad:</strong> {mesa.capacidad} personas</p>
                <p><strong>Estado:</strong> <span className={`badge-${mesa.estado}`}>{mesa.estado}</span></p>
              </div>
              <div className="mesa-actions">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handleEdit(mesa)}
                >
                  <IconEdit /> Editar
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(mesa.id)}
                >
                  <IconTrash /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingId ? 'Editar Mesa' : 'Nueva Mesa'}</h3>
                <button className="btn-close" onClick={handleCloseModal}><IconClose /></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Número de Mesa * <small style={{color: '#999', fontWeight: 'normal'}}>(siguiente sugerido: {obtenerSiguienteNumero()})</small></label>
                  <input
                    type="number"
                    name="numero"
                    value={formData.numero}
                    onChange={handleInputChange}
                    required
                    min="1"
                    placeholder="Ej: 21"
                  />
                </div>

                <div className="form-group">
                  <label>Zona *</label>
                  <select
                    name="zona_id"
                    value={formData.zona_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar zona...</option>
                    {zonas.map(zona => (
                      <option key={zona.id} value={zona.id}>
                        {zona.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Capacidad *</label>
                  <input
                    type="number"
                    name="capacidad"
                    value={formData.capacidad}
                    onChange={handleInputChange}
                    required
                    min="1"
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingId ? 'Actualizar' : 'Crear'} Mesa
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Zona */}
        {showZonaModal && (
          <div className="modal-overlay" onClick={() => setShowZonaModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingZonaId ? 'Editar Zona' : 'Nueva Zona'}</h3>
                <button className="btn-close" onClick={() => setShowZonaModal(false)}><IconClose /></button>
              </div>

              <form onSubmit={handleSubmitZona}>
                <div className="form-group">
                  <label>Nombre * <small style={{color: '#999', fontWeight: 'normal'}}>(Ej: Salón principal, Terraza, Barra)</small></label>
                  <input
                    type="text"
                    name="nombre"
                    value={zonaForm.nombre}
                    onChange={handleZonaChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    name="descripcion"
                    value={zonaForm.descripcion}
                    onChange={handleZonaChange}
                    rows="3"
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowZonaModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <IconPlus /> {editingZonaId ? 'Actualizar' : 'Crear'} Zona
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

export default ConfiguracionMesas;