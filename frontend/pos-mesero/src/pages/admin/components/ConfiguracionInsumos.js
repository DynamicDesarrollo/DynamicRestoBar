import React, { useEffect, useState } from 'react';
import axios from '../../../services/api';
import AdminLayout from '../AdminLayout';
import { formatMoney } from '../../../utils/formatters';
import '../admin.css';

const ConfiguracionInsumos = () => {
  const [insumos, setInsumos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showModalProveedor, setShowModalProveedor] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filtroStock, setFiltroStock] = useState('todos');

  const [formData, setFormData] = useState({
    nombre: '',
    codigo_sku: '',
    unidad_medida_id: '',
    stock_actual: '',
    stock_minimo: '',
    stock_maximo: '',
    costo_unitario: '',
    proveedor_principal_id: '',
  });

  const [formProveedor, setFormProveedor] = useState({
    nombre: '',
    contacto: '',
    email: '',
    telefono: '',
    direccion: '',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [insumosRes, unidadesRes, proveedoresRes] = await Promise.all([
        axios.get('/admin/insumos'),
        axios.get('/admin/insumos/unidades'),
        axios.get('/admin/insumos/proveedores'),
      ]);

      if (insumosRes.data.success) setInsumos(insumosRes.data.data);
      if (unidadesRes.data.success) {
        console.log('✅ Unidades:', unidadesRes.data.data);
        setUnidades(unidadesRes.data.data);
      }
      if (proveedoresRes.data.success) setProveedores(proveedoresRes.data.data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.nombre.trim()) {
        alert('El nombre del insumo es requerido');
        return;
      }
      if (!formData.unidad_medida_id) {
        alert('Debes seleccionar una unidad de medida');
        return;
      }
      if (!formData.costo_unitario) {
        alert('El costo unitario es requerido');
        return;
      }

      const data = {
        nombre: formData.nombre,
        codigo_sku: formData.codigo_sku || null,
        unidad_medida_id: parseInt(formData.unidad_medida_id),
        stock_actual: parseFloat(formData.stock_actual) || 0,
        stock_minimo: parseFloat(formData.stock_minimo) || 0,
        stock_maximo: parseFloat(formData.stock_maximo) || null,
        costo_unitario: parseFloat(formData.costo_unitario),
        proveedor_principal_id: formData.proveedor_principal_id ? parseInt(formData.proveedor_principal_id) : null,
      };

      if (editingId) {
        await axios.put(`/admin/insumos/${editingId}`, data);
      } else {
        await axios.post('/admin/insumos', data);
      }

      setShowModal(false);
      resetFormulario();
      cargarDatos();
    } catch (err) {
      console.error('Error al guardar insumo:', err);
      alert('Error al guardar insumo: ' + (err.response?.data?.error || err.message));
    }
  };

  const resetFormulario = () => {
    setFormData({
      nombre: '',
      codigo_sku: '',
      unidad_medida_id: '',
      stock_actual: '',
      stock_minimo: '',
      stock_maximo: '',
      costo_unitario: '',
      proveedor_principal_id: '',
    });
    setEditingId(null);
  };

  const handleEdit = (insumo) => {
    setEditingId(insumo.id);
    setFormData({
      nombre: insumo.nombre,
      codigo_sku: insumo.codigo_sku || '',
      unidad_medida_id: insumo.unidad_medida_id || '',
      stock_actual: insumo.stock_actual || '',
      stock_minimo: insumo.stock_minimo || '',
      stock_maximo: insumo.stock_maximo || '',
      costo_unitario: insumo.costo_unitario || '',
      proveedor_principal_id: insumo.proveedor_principal_id || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este insumo?')) {
      try {
        await axios.delete(`/admin/insumos/${id}`);
        cargarDatos();
      } catch (err) {
        console.error('Error al eliminar insumo:', err);
        alert('Error al eliminar insumo');
      }
    }
  };

  const handleGuardarProveedor = async (e) => {
    e.preventDefault();
    try {
      if (!formProveedor.nombre.trim()) {
        alert('El nombre del proveedor es requerido');
        return;
      }
      
      const res = await axios.post('/admin/insumos/proveedores', formProveedor);
      if (res.data.success) {
        setProveedores([...proveedores, res.data.data]);
        setFormProveedor({ nombre: '', contacto: '', email: '', telefono: '', direccion: '' });
        setShowModalProveedor(false);
        alert('✅ Proveedor creado exitosamente');
      }
    } catch (err) {
      console.error('Error al guardar proveedor:', err);
      alert('Error al guardar proveedor');
    }
  };

  const handleInputChangeProveedor = (e) => {
    const { name, value } = e.target;
    setFormProveedor(prev => ({ ...prev, [name]: value }));
  };

  const getUnidadNombre = (id) => {
    const u = unidades.find(u => u.id === id);
    return u?.nombre || 'N/A';
  };

  const getProveedorNombre = (id) => {
    const p = proveedores.find(p => p.id === id);
    return p?.nombre || 'Sin proveedor';
  };

  // Filtrar insumos
  const insumosFiltrados = insumos.filter(insumo => {
    if (filtroStock === 'bajo') {
      return insumo.stock_actual <= insumo.stock_minimo;
    }
    if (filtroStock === 'normal') {
      return insumo.stock_actual > insumo.stock_minimo;
    }
    return true;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Cargando insumos...</div>
      </AdminLayout>
    );
  }

  const bajosStock = insumos.filter(i => i.stock_actual <= i.stock_minimo).length;

  return (
    <AdminLayout>
      <div className="admin-section">
        <div className="section-header">
          <h2>📦 Gestión de Insumos</h2>
          <button className="btn btn-primary" onClick={() => {
            resetFormulario();
            setShowModal(true);
          }}>
            + Insumo
          </button>
        </div>

        {/* Filtros */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setFiltroStock('todos')}
            className={`btn btn-sm ${filtroStock === 'todos' ? 'btn-primary' : 'btn-outline-secondary'}`}
          >
            Todos ({insumos.length})
          </button>
          <button
            onClick={() => setFiltroStock('normal')}
            className={`btn btn-sm ${filtroStock === 'normal' ? 'btn-primary' : 'btn-outline-secondary'}`}
          >
            ✅ En Stock ({insumos.length - bajosStock})
          </button>
          <button
            onClick={() => setFiltroStock('bajo')}
            className={`btn btn-sm ${filtroStock === 'bajo' ? 'btn-danger' : 'btn-outline-danger'}`}
          >
            🔴 Bajo Stock ({bajosStock})
          </button>
        </div>

        {/* Grid de Insumos */}
        <div style={{ overflowX: 'auto' }}>
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>SKU</th>
                <th>Unidad</th>
                <th>Stock Actual</th>
                <th>Mínimo / Máximo</th>
                <th>Costo Unitario</th>
                <th>Proveedor</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {insumosFiltrados.map(insumo => {
                const esBajoStock = insumo.stock_actual <= insumo.stock_minimo;
                return (
                  <tr
                    key={insumo.id}
                    style={{
                      background: esBajoStock ? '#fff3cd' : 'transparent',
                      borderLeft: esBajoStock ? '4px solid #ff6b6b' : 'none',
                    }}
                  >
                    <td style={{ fontWeight: 'bold' }}>
                      {esBajoStock && '🔴 '}
                      {insumo.nombre}
                    </td>
                    <td style={{ fontSize: '12px', color: '#666' }}>
                      {insumo.codigo_sku || '-'}
                    </td>
                    <td>{insumo.unidad_medida || 'N/A'}</td>
                    <td style={{ color: esBajoStock ? '#c92a2a' : '#2f9e44' }}>
                      <strong>{insumo.stock_actual}</strong>
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {insumo.stock_minimo} / {insumo.stock_maximo || '∞'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {formatMoney(insumo.costo_unitario, true)}
                    </td>
                    <td style={{ fontSize: '12px', color: '#666' }}>
                      {insumo.proveedor || 'Sin proveedor'}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleEdit(insumo)}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className="btn btn-sm btn-danger ms-2"
                        onClick={() => handleDelete(insumo.id)}
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {insumosFiltrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            No hay insumos para mostrar
          </div>
        )}
      </div>

      {/* Modal CRUD */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Editar Insumo' : 'Nuevo Insumo'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Nombre del insumo"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Código SKU</label>
                  <input
                    type="text"
                    name="codigo_sku"
                    value={formData.codigo_sku}
                    onChange={handleInputChange}
                    placeholder="SKU (opcional)"
                  />
                </div>

                <div className="form-group">
                  <label>Unidad Medida *</label>
                  <select
                    name="unidad_medida_id"
                    value={formData.unidad_medida_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {unidades.map(u => (
                      <option key={u.id} value={u.id}>{u.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Stock Actual</label>
                  <input
                    type="number"
                    name="stock_actual"
                    value={formData.stock_actual || ''}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Stock Mínimo</label>
                  <input
                    type="number"
                    name="stock_minimo"
                    value={formData.stock_minimo}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Stock Máximo</label>
                  <input
                    type="number"
                    name="stock_maximo"
                    value={formData.stock_maximo}
                    onChange={handleInputChange}
                    placeholder="Sin límite"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Costo Unitario *</label>
                  <input
                    type="number"
                    name="costo_unitario"
                    value={formData.costo_unitario}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Proveedor Principal</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                    <select
                      name="proveedor_principal_id"
                      value={formData.proveedor_principal_id}
                      onChange={handleInputChange}
                      style={{ flex: 1 }}
                    >
                      <option value="">Sin proveedor</option>
                      {proveedores.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setShowModalProveedor(true)}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      + Nuevo
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Actualizar Insumo' : 'Crear Insumo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Proveedor */}
      {showModalProveedor && (
        <div className="modal-overlay" onClick={() => setShowModalProveedor(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nuevo Proveedor</h3>
              <button className="btn-close" onClick={() => setShowModalProveedor(false)}>✕</button>
            </div>

            <form onSubmit={handleGuardarProveedor}>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formProveedor.nombre}
                  onChange={handleInputChangeProveedor}
                  placeholder="Nombre del proveedor"
                  required
                />
              </div>

              <div className="form-group">
                <label>Contacto</label>
                <input
                  type="text"
                  name="contacto"
                  value={formProveedor.contacto}
                  onChange={handleInputChangeProveedor}
                  placeholder="Persona de contacto"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formProveedor.email}
                  onChange={handleInputChangeProveedor}
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="text"
                  name="telefono"
                  value={formProveedor.telefono}
                  onChange={handleInputChangeProveedor}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="form-group">
                <label>Dirección</label>
                <textarea
                  name="direccion"
                  value={formProveedor.direccion}
                  onChange={handleInputChangeProveedor}
                  placeholder="Dirección del proveedor"
                  rows="2"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModalProveedor(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ConfiguracionInsumos;
