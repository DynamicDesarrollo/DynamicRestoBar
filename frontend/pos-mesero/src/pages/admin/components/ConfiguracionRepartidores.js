import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from '../../../services/api';
import AdminLayout from '../AdminLayout';
import { IconTruck, IconPlus, IconEdit, IconTrash, IconClose, IconCheck } from '../../../components/Icons';
import '../admin.css';

const ESTADOS = ['disponible', 'en_domicilio', 'activo', 'inactivo'];

const initialForm = {
  nombre: '',
  email: '',
  telefono: '',
  documento: '',
  vehiculo: '',
  placa: '',
  estado: 'disponible',
};

const ConfiguracionRepartidores = () => {
  const [repartidores, setRepartidores] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    cargarRepartidores();
  }, []);

  const cargarRepartidores = async () => {
    try {
      const res = await axios.get('/admin/repartidores');
      setRepartidores(res.data.data || []);
    } catch (err) {
      setRepartidores([]);
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
        await axios.put(`/admin/repartidores/${editingId}`, form);
      } else {
        await axios.post('/admin/repartidores', form);
      }
      setShowModal(false);
      setForm(initialForm);
      setEditingId(null);
      cargarRepartidores();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar repartidor');
    }
  };

  const handleEditar = (repartidor) => {
    setForm({
      nombre: repartidor.nombre || '',
      email: repartidor.email || '',
      telefono: repartidor.telefono || '',
      documento: repartidor.documento || '',
      vehiculo: repartidor.vehiculo || '',
      placa: repartidor.placa || '',
      estado: repartidor.estado || 'disponible',
    });
    setEditingId(repartidor.id);
    setShowModal(true);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar repartidor?')) return;
    try {
      await axios.delete(`/admin/repartidores/${id}`);
      cargarRepartidores();
    } catch (err) {
      toast.error('Error al eliminar repartidor');
    }
  };

  return (
    <AdminLayout>
      <div className="admin-section">
        <div className="section-header">
          <h2><IconTruck /> Repartidores</h2>
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setForm(initialForm); setEditingId(null); }}>
            <IconPlus /> Nuevo repartidor
          </button>
        </div>
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Vehículo</th>
                <th>Placa</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {repartidores.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.nombre}</strong></td>
                  <td style={{ color: 'var(--rb-cream-500)' }}>{r.telefono || '-'}</td>
                  <td style={{ color: 'var(--rb-cream-500)' }}>{r.vehiculo || '-'}</td>
                  <td style={{ color: 'var(--rb-cream-500)' }}>{r.placa || '-'}</td>
                  <td>{r.estado}</td>
                  <td>
                    <button className="btn btn-sm btn-warning" style={{ marginRight: 6 }} onClick={() => handleEditar(r)}>
                      <IconEdit /> Editar
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleEliminar(r.id)}>
                      <IconTrash /> Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {repartidores.length === 0 && (
          <div className="admin-empty-state">
            <IconTruck />
            <p>No hay repartidores registrados</p>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingId ? 'Editar Repartidor' : 'Nuevo Repartidor'}</h3>
                <button className="btn-close" onClick={() => setShowModal(false)}><IconClose /></button>
              </div>
              <form onSubmit={handleGuardar}>
                <div className="form-group">
                  <label>Nombre *</label>
                  <input name="nombre" value={form.nombre} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input name="telefono" value={form.telefono} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Documento</label>
                  <input name="documento" value={form.documento} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Vehículo</label>
                  <input name="vehiculo" value={form.vehiculo} onChange={handleInputChange} placeholder="Moto, bicicleta..." />
                </div>
                <div className="form-group">
                  <label>Placa</label>
                  <input name="placa" value={form.placa} onChange={handleInputChange} />
                </div>
                {editingId && (
                  <div className="form-group">
                    <label>Estado</label>
                    <select name="estado" value={form.estado} onChange={handleInputChange}>
                      {ESTADOS.map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                )}
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

export default ConfiguracionRepartidores;
