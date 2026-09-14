import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from '../../../services/api';
import AdminLayout from '../AdminLayout';
import { IconChefHat, IconPlus, IconEdit, IconTrash, IconClose, IconCheck } from '../../../components/Icons';
import '../admin.css';

const TIPOS = ['cocina', 'bar', 'pasteleria', 'otro'];

const initialForm = {
  nombre: '',
  tipo: 'cocina',
  descripcion: '',
};

const ConfiguracionEstaciones = () => {
  const [estaciones, setEstaciones] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    cargarEstaciones();
  }, []);

  const cargarEstaciones = async () => {
    try {
      const res = await axios.get('/admin/estaciones');
      setEstaciones(res.data.data || []);
    } catch (err) {
      setEstaciones([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/admin/estaciones/${editingId}`, form);
      } else {
        await axios.post('/admin/estaciones', form);
      }
      setShowModal(false);
      setForm(initialForm);
      setEditingId(null);
      cargarEstaciones();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar estación');
    }
  };

  const handleEditar = (estacion) => {
    setForm({
      nombre: estacion.nombre || '',
      tipo: estacion.tipo || 'cocina',
      descripcion: estacion.descripcion || '',
    });
    setEditingId(estacion.id);
    setShowModal(true);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar estación? Los productos que la usan quedarán sin estación asignada.')) return;
    try {
      await axios.delete(`/admin/estaciones/${id}`);
      cargarEstaciones();
    } catch (err) {
      toast.error('Error al eliminar estación');
    }
  };

  return (
    <AdminLayout>
      <div className="admin-section">
        <div className="section-header">
          <h2><IconChefHat /> Estaciones</h2>
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setForm(initialForm); setEditingId(null); }}>
            <IconPlus /> Nueva estación
          </button>
        </div>
        <p style={{ color: 'var(--rb-cream-500)', marginTop: '-8px', marginBottom: '16px' }}>
          Cada producto se asigna a una estación (Cocina, Bar, Pastelería...) para que su comanda
          llegue a la pantalla de KDS correcta.
        </p>
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {estaciones.map((e) => (
                <tr key={e.id}>
                  <td><strong>{e.nombre}</strong></td>
                  <td style={{ color: 'var(--rb-cream-500)' }}>{e.tipo}</td>
                  <td style={{ color: 'var(--rb-cream-500)' }}>{e.descripcion || '-'}</td>
                  <td>
                    <button className="btn btn-sm btn-warning" style={{ marginRight: 6 }} onClick={() => handleEditar(e)}>
                      <IconEdit /> Editar
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleEliminar(e.id)}>
                      <IconTrash /> Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {estaciones.length === 0 && (
          <div className="admin-empty-state">
            <IconChefHat />
            <p>No hay estaciones registradas</p>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingId ? 'Editar Estación' : 'Nueva Estación'}</h3>
                <button className="btn-close" onClick={() => setShowModal(false)}><IconClose /></button>
              </div>
              <form onSubmit={handleGuardar}>
                <div className="form-group">
                  <label>Nombre *</label>
                  <input name="nombre" value={form.nombre} onChange={handleInputChange} placeholder="Cocina, Bar, Pastelería..." required />
                </div>
                <div className="form-group">
                  <label>Tipo</label>
                  <select name="tipo" value={form.tipo} onChange={handleInputChange}>
                    {TIPOS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <input name="descripcion" value={form.descripcion} onChange={handleInputChange} />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary"><IconCheck /> Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ConfiguracionEstaciones;
