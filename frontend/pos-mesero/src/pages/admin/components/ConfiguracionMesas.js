import React, { useEffect, useState } from 'react';
import axios from '../../../services/api';
import AdminLayout from '../AdminLayout';
import '../admin.css';

const ConfiguracionMesas = () => {
  const [mesas, setMesas] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    numero: '',
    zona_id: '',
    capacidad: 4,
  });

  useEffect(() => {
    cargarDatos();
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
    try {
      const response = await axios.get('/admin/mesas');
      if (response.data.success) {
        setMesas(response.data.data);
        
        // Limpiar duplicadas DESPUÉS de cargar
        try {
          await axios.post(`/admin/mesas/limpiar-duplicadas?t=${Date.now()}`, {}, {
            headers: { 'Cache-Control': 'no-cache' }
          });
        } catch (err) {
          console.error('Error al limpiar duplicadas:', err);
        }
      }
    } catch (err) {
      console.error('Error al cargar mesas:', err);
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
      alert('Error al guardar mesa');
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
        alert('Error al eliminar mesa');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ numero: '', zona_id: 1, capacidad: 4 });
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
          <h2>🪑 Configuración de Mesas</h2>
          <button
            className="btn btn-primary"
            onClick={abrirModalNuevaMesa}
          >
            + Agregar Mesa
          </button>
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
                  ✏️ Editar
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(mesa.id)}
                >
                  🗑️ Eliminar
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
                <button className="btn-close" onClick={handleCloseModal}>✕</button>
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
      </div>
    </AdminLayout>
  );
};

export default ConfiguracionMesas;
