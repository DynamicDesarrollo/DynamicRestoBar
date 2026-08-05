// import { toast } from 'react-toastify';
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../stores';
import { sedesService } from '../../../services/api';
import AdminLayout from '../AdminLayout';
import './SedeForm.css';

// ...existing code...

const initialForm = {
  nombre: '',
  direccion: '',
  ciudad: '',
  telefono: '',
  email: '',
  descripcion: '',
  activa: false
};

const ConfiguracionSedes = () => {
  const usuario = useAuthStore((state) => state.usuario);
  const [sedes, setSedes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  // Definir cargarSedes antes de useEffect
  const cargarSedes = async () => {
    try {
      const response = await sedesService.listar();
      const data = response.data || response;
      console.log('Respuesta de sedesService.listar:', data);
      setSedes(data);
    } catch (error) {
      console.error('Error cargando sedes:', error);
    }
  };

  useEffect(() => {
    cargarSedes();
  }, []);

  const handleNew = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowModal(true);
  };

  const handleEdit = (sede) => {
    // Normaliza los campos para evitar undefined
    setForm({
      nombre: sede.nombre || '',
      direccion: sede.direccion || '',
      ciudad: sede.ciudad || '',
      telefono: sede.telefono || '',
      email: sede.email || '',
      descripcion: sede.descripcion || '',
      activa: typeof sede.activa === 'boolean' ? sede.activa : !!sede.activa
    });
    setEditingId(sede.id); // Asegura que editingId sea un número
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Agregar cliente_id al payload
      const data = { ...form, cliente_id: usuario?.cliente_id };
      if (editingId) {
        await sedesService.actualizar(Number(editingId), data); // Forzar número
      } else {
        await sedesService.crear(data);
      }
      setShowModal(false);
      cargarSedes();
    } catch (error) {
      console.error('Error en handleSubmit:', error);
    }
  };
  const handleDelete = async (sede) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta sede?')) return;
    try {
      await sedesService.eliminar(Number(sede.id));
      cargarSedes();
    } catch (error) {
      console.error('Error eliminando sede:', error);
      const mensaje = error?.response?.data?.error || 'No se pudo eliminar la sede';
      alert(mensaje);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-section">
        <h2>Gestión de Sedes</h2>
        <button className="btn btn-primary" onClick={handleNew}>+ Nueva Sede</button>
        <table className="table mt-3">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Ciudad</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Activa</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sedes.map((sede) => (
              <tr key={sede.id}>
                <td>{sede.nombre}</td>
                <td>{sede.direccion}</td>
                <td>{sede.ciudad}</td>
                <td>{sede.telefono}</td>
                <td>{sede.email}</td>
                <td>{sede.activa ? 'Sí' : 'No'}</td>
                <td>
                  <button className="btn btn-sm btn-info" onClick={() => handleEdit(sede)}>Editar</button>
                  <button className="btn btn-sm btn-danger" title="Eliminar" style={{marginLeft: 6}} onClick={() => handleDelete(sede)}>
                    <span role="img" aria-label="delete">🗑️</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {showModal && (
          <div className="sede-modal-nuevo">
            <div className="sede-modal-header-nuevo">
              <h3>{editingId ? 'Editar Sede' : 'Nueva Sede'}</h3>
              <button type="button" className="close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="sede-form-nuevo">
              <div className="sede-form-grid-nuevo">
                <div className="sede-form-group-nuevo">
                  <label>Nombre</label>
                  <input name="nombre" value={form.nombre} onChange={handleChange} required />
                </div>
                <div className="sede-form-group-nuevo">
                  <label>Dirección</label>
                  <input name="direccion" value={form.direccion} onChange={handleChange} />
                </div>
                <div className="sede-form-group-nuevo">
                  <label>Ciudad</label>
                  <input name="ciudad" value={form.ciudad} onChange={handleChange} />
                </div>
                <div className="sede-form-group-nuevo">
                  <label>Teléfono</label>
                  <input name="telefono" value={form.telefono} onChange={handleChange} />
                </div>
                <div className="sede-form-group-nuevo">
                  <label>Email</label>
                  <input name="email" value={form.email} onChange={handleChange} />
                </div>
                <div className="sede-form-group-nuevo sede-form-group--full-nuevo">
                  <label>Descripción</label>
                  <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={2} />
                </div>
                <div className="sede-form-group-nuevo sede-form-group--full-nuevo sede-form-check-nuevo">
                  <input type="checkbox" name="activa" checked={form.activa} onChange={handleChange} id="activaCheck" />
                  <label htmlFor="activaCheck">Activa</label>
                </div>
              </div>
              <div className="sede-modal-footer-nuevo">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ConfiguracionSedes;
