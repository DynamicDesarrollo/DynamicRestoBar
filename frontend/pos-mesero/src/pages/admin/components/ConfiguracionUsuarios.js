import React, { useEffect, useState } from 'react';
import axios from '../../../services/api';
import AdminLayout from '../AdminLayout';
import '../admin.css';

const initialForm = {
  nombre: '',
  email: '',
  pin: '',
  rol_id: '',
  sede_id: '',
};

const ConfiguracionUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    cargarUsuarios();
    cargarRoles();
    cargarSedes();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const res = await axios.get('/admin/usuarios');
      setUsuarios(res.data.data || []);
    } catch (err) {
      setUsuarios([]);
    }
  };

  const cargarRoles = async () => {
    try {
      const res = await axios.get('/admin/roles');
      setRoles(res.data.data || []);
    } catch (err) {
      setRoles([]);
    }
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
      setSedes([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/admin/usuarios/${editingId}`, form);
      } else {
        await axios.post('/admin/usuarios', form);
      }
      setShowModal(false);
      setForm(initialForm);
      setEditingId(null);
      cargarUsuarios();
    } catch (err) {
      const message = err.response?.data?.error || 'Error al guardar usuario';
      const details = err.response?.data?.details ? `\n${err.response.data.details}` : '';
      console.error('Error al guardar usuario:', err.response?.data || err);
      alert(`${message}${details}`);
    }
  };

  const handleEditar = (usuario) => {
    setForm({
      nombre: usuario.nombre,
      email: usuario.email,
      pin: usuario.pin,
      rol_id: usuario.rol_id,
      sede_id: usuario.sede_id,
    });
    setEditingId(usuario.id);
    setShowModal(true);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar usuario?')) return;
    try {
      await axios.delete(`/admin/usuarios/${id}`);
      cargarUsuarios();
    } catch (err) {
      alert('Error al eliminar usuario');
    }
  };

  return (
    <AdminLayout>
      <div className="admin-section">
        <div className="section-header">
          <h2>👤 Gestión de Usuarios</h2>
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setForm(initialForm); setEditingId(null); }}>+ Crear Usuario</button>
        </div>
        <div style={{ marginTop: '20px' }}>
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>PIN</th>
                <th>Rol</th>
                <th>Sede</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td>{u.nombre}</td>
                  <td>{u.email}</td>
                  <td>{u.pin}</td>
                  <td>{roles.find(r => r.id === u.rol_id)?.nombre || u.rol_id}</td>
                  <td>{sedes.find(s => s.id === u.sede_id)?.nombre || u.sede_id}</td>
                  <td>
                    <button className="btn btn-sm btn-warning" onClick={() => handleEditar(u)}>Editar</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleEliminar(u.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>{editingId ? 'Editar Usuario' : 'Crear Usuario'}</h3>
              <form onSubmit={handleGuardar}>
                <div className="form-group">
                  <label>Nombre *</label>
                  <input name="nombre" value={form.nombre} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input name="email" value={form.email} onChange={handleInputChange} required type="email" />
                </div>
                <div className="form-group">
                  <label>PIN *</label>
                  <input name="pin" value={form.pin} onChange={handleInputChange} required maxLength={4} />
                </div>
                <div className="form-group">
                  <label>Rol *</label>
                  <select name="rol_id" value={form.rol_id} onChange={handleInputChange} required>
                    <option value="">Seleccionar...</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Sede *</label>
                  <select name="sede_id" value={form.sede_id} onChange={handleInputChange} required>
                    <option value="">Seleccionar...</option>
                    {sedes.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ConfiguracionUsuarios;
