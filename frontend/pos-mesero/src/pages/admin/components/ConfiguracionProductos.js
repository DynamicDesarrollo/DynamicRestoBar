import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from '../../../services/api';
import AdminLayout from '../AdminLayout';
import { formatMoney } from '../../../utils/formatters';
import {
  IconPlate, IconPlus, IconEdit, IconTrash, IconClock, IconClose, IconTag,
} from '../../../components/Icons';
import '../admin.css';


const ConfiguracionProductos = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [estaciones, setEstaciones] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria_id: '',
    precio_venta: '',
    estacion_id: '',
    sede_id: '',
    foto: null,
  });
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState(null);
  const [categoriaForm, setCategoriaForm] = useState({
    nombre: '',
    descripcion: '',
    sede_id: '',
  });


  useEffect(() => {
    cargarDatos();
    cargarSedes();
  }, []);

  const cargarDatos = async () => {
    try {
      const [productosRes, categoriasRes, estacionesRes] = await Promise.all([
        axios.get('/admin/productos'),
        axios.get('/admin/categorias'),
        axios.get('/admin/estaciones'),
      ]);

      if (productosRes.data.success) setProductos(productosRes.data.data);
      if (categoriasRes.data.success) setCategorias(categoriasRes.data.data);
      if (estacionesRes.data.success) {
        setEstaciones(estacionesRes.data.data);
        if (estacionesRes.data.data.length > 0 && !formData.estacion_id) {
          setFormData(prev => ({ ...prev, estacion_id: estacionesRes.data.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarSedes = async () => {
    try {
      const res = await axios.get('/admin/sedes');
      // Si la respuesta es un array directo:
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

  const cargarDatosPorSede = async (sedeId) => {
    setLoading(true);
    try {
      const [productosRes, categoriasRes, estacionesRes] = await Promise.all([
        axios.get('/admin/productos', { params: { sedeId } }),
        axios.get('/admin/categorias', { params: { sedeId } }),
        axios.get('/admin/estaciones', { params: { sedeId } }),
      ]);
      if (productosRes.data.success) setProductos(productosRes.data.data);
      if (categoriasRes.data.success) setCategorias(categoriasRes.data.data);
      if (estacionesRes.data.success) setEstaciones(estacionesRes.data.data);
    } catch (err) {
      console.error('Error al cargar datos por sede:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'foto') {
      const file = files[0] || null;
      setFormData(prev => ({ ...prev, foto: file }));
      setFotoPreviewUrl(file ? URL.createObjectURL(file) : null);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCategoriaChange = (e) => {
    const { name, value } = e.target;
    setCategoriaForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitProducto = async (e) => {
    e.preventDefault();
    try {
      const campos = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio_venta: parseFloat(formData.precio_venta),
        estacion_id: parseInt(formData.estacion_id),
        sede_id: formData.sede_id || (sedes.length === 1 ? sedes[0].id : null),
        categoria_id: formData.categoria_id && formData.categoria_id !== '' ? parseInt(formData.categoria_id) : '',
      };

      let data = campos;
      if (formData.foto) {
        const form = new FormData();
        Object.entries(campos).forEach(([key, value]) => {
          if (value !== null && value !== undefined) form.append(key, value);
        });
        form.append('foto', formData.foto);
        data = form;
      }

      if (editingId) {
        await axios.put(`/admin/productos/${editingId}`, data);
      } else {
        await axios.post('/admin/productos', data);
      }

      setShowModal(false);
      resetFormulario();
      cargarDatos();
    } catch (err) {
      console.error('Error al guardar producto:', err);
      toast.error('Error al guardar producto');
    }
  };

  const handleSubmitCategoria = async (e) => {
    e.preventDefault();
    try {
      const data = { ...categoriaForm };
      if (!data.sede_id && sedes.length === 1) {
        data.sede_id = sedes[0].id;
      }
      if (editingId) {
        await axios.put(`/admin/categorias/${editingId}`, data);
      } else {
        await axios.post('/admin/categorias', data);
      }
      setShowCategoriaModal(false);
      setCategoriaForm({ nombre: '', descripcion: '', sede_id: '' });
      setEditingId(null);
      cargarDatos();
    } catch (err) {
      console.error('Error al guardar categoría:', err);
      toast.error('Error al guardar categoría');
    }
  };

  const handleEditCategoria = (categoria) => {
    setEditingId(categoria.id);
    setCategoriaForm({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
      sede_id: categoria.sede_id || (sedes.length === 1 ? sedes[0].id : ''),
    });
    setShowCategoriaModal(true);
  };

  const handleDeleteCategoria = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta categoría?')) {
      try {
        await axios.delete(`/admin/categorias/${id}`);
        cargarDatos();
      } catch (err) {
        console.error('Error al eliminar categoría:', err);
        toast.error(err.response?.data?.error || 'Error al eliminar categoría');
      }
    }
  };

  const resetFormulario = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      categoria_id: '',
      precio_venta: '',
      estacion_id: 1,
      sede_id: sedes.length === 1 ? sedes[0].id : '',
      foto: null,
    });
    setFotoPreviewUrl(null);
    setEditingId(null);
  };

  const handleEdit = (producto) => {
    setEditingId(producto.id);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      categoria_id: producto.categoria_id || '',
      precio_venta: producto.precio || producto.precio_venta || '',
      estacion_id: producto.estacion_id || 1,
      sede_id: producto.sede_id || (sedes.length === 1 ? sedes[0].id : ''),
      foto: null,
    });
    setFotoPreviewUrl(producto.foto_url || null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este producto?')) {
      try {
        await axios.delete(`/admin/productos/${id}`);
        cargarDatos();
      } catch (err) {
        console.error('Error al eliminar producto:', err);
        toast.error('Error al eliminar producto');
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Cargando productos...</div>
      </AdminLayout>
    );
  }

  // Filtrar productos según categoría seleccionada
  const productosFiltrados = categoriaFiltro 
    ? productos.filter(p => p.categoria === categoriaFiltro)
    : productos;

  return (
    <AdminLayout>
      <div className="admin-section">
        <div className="section-header">
          <h2><IconPlate /> Gestión de Productos</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ fontWeight: 600, marginRight: 8, color: 'var(--rb-cream-300)', fontSize: '0.86rem' }}>Sede:</label>
            <select
              className="admin-select"
              value={categoriaFiltro?.sede_id || ''}
              onChange={e => {
                const sedeId = e.target.value;
                setCategoriaFiltro(null);
                setFormData(prev => ({ ...prev, sede_id: sedeId }));
                cargarDatosPorSede(sedeId);
              }}
              style={{ minWidth: 120, marginRight: 16 }}
            >
              <option value="">Todas</option>
              {sedes.map(sede => (
                <option key={sede.id} value={sede.id}>{sede.nombre}</option>
              ))}
            </select>
            <button className="btn btn-secondary" onClick={() => setShowCategoriaModal(true)}>
              <IconTag /> Categoría
            </button>
            <button className="btn btn-primary" onClick={() => { resetFormulario(); setShowModal(true); }}>
              <IconPlus /> Producto
            </button>
          </div>
        </div>

        {/* Categorías */}
        <div style={{ marginBottom: '30px' }}>
          <h3 className="admin-subtitle"><IconTag /> Categorías ({categorias.length})</h3>
          <div className="categoria-pills">
            {/* Botón "Todas" */}
            <button
              onClick={() => setCategoriaFiltro(null)}
              className={`categoria-pill ${categoriaFiltro === null ? 'is-active' : ''}`}
            >
              Ver Todas ({productos.length})
            </button>

            {categorias.map(cat => {
              const countProductos = productos.filter(p => p.categoria === cat.nombre).length;
              return (
                <div key={cat.id} className="categoria-pill-group">
                  <button
                    onClick={() => setCategoriaFiltro(cat.nombre)}
                    className={`categoria-pill ${categoriaFiltro === cat.nombre ? 'is-active' : ''}`}
                  >
                    {cat.nombre} ({countProductos})
                  </button>
                  <button
                    onClick={() => handleEditCategoria(cat)}
                    className="categoria-pill-icon-btn categoria-pill-icon-btn--edit"
                    title="Editar categoría"
                  >
                    <IconEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteCategoria(cat.id)}
                    className="categoria-pill-icon-btn categoria-pill-icon-btn--delete"
                    title="Eliminar categoría"
                  >
                    <IconClose />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Productos */}
        <div>
          <h3 className="admin-subtitle">
            <IconPlate />
            Productos
            {categoriaFiltro ? ` - ${categoriaFiltro} (${productosFiltrados.length})` : ` (${productosFiltrados.length})`}
          </h3>
          <div className="productos-grid">
            {productosFiltrados.map(producto => (
              <div key={producto.id} className="producto-card">
                {producto.foto_url && (
                  <img
                    src={producto.foto_url}
                    alt={producto.nombre}
                    style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }}
                  />
                )}
                <div className="producto-header">
                  <h4 className="producto-nombre">{producto.nombre}</h4>
                  <p className="producto-categoria">{producto.categoria || 'Sin categoría'}</p>
                </div>

                {producto.descripcion && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--rb-cream-500)', margin: '10px 0' }}>
                    {producto.descripcion}
                  </p>
                )}

                <div className="producto-precio">{formatMoney(parseFloat(producto.precio || producto.precio_venta || 0), true)}</div>

                {producto.preparacion_tiempo_estimado && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.76rem', color: 'var(--rb-cream-700)', marginBottom: '15px' }}>
                    <IconClock style={{ width: 13, height: 13 }} /> Prep: {producto.preparacion_tiempo_estimado} min
                  </div>
                )}

                <div className="producto-actions">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleEdit(producto)}
                  >
                    <IconEdit /> Editar
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(producto.id)}
                  >
                    <IconTrash /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Producto */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content modal-content--wide" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                <button className="btn-close" onClick={() => setShowModal(false)}><IconClose /></button>
              </div>

              <form onSubmit={handleSubmitProducto} encType="multipart/form-data">
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div className="form-group">
                      <label>Nombre *</label>
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Descripción</label>
                      <textarea
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleInputChange}
                        rows="3"
                      />
                    </div>
                    <div className="form-group">
                      <label>Foto del plato</label>
                      {fotoPreviewUrl && (
                        <img
                          src={fotoPreviewUrl}
                          alt="Vista previa del plato"
                          style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, marginBottom: 8, display: 'block' }}
                        />
                      )}
                      <input
                        type="file"
                        name="foto"
                        accept="image/*"
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Categoría</label>
                      <select
                        name="categoria_id"
                        value={formData.categoria_id}
                        onChange={handleInputChange}
                      >
                        <option value="">Sin categoría</option>
                        {categorias.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div className="form-group">
                      <label>Precio *</label>
                      <input
                        type="number"
                        name="precio_venta"
                        value={formData.precio_venta}
                        onChange={handleInputChange}
                        required
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Estación</label>
                      <select
                        name="estacion_id"
                        value={formData.estacion_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">-- Selecciona una estación --</option>
                        {estaciones.map(estacion => (
                          <option key={estacion.id} value={estacion.id}>
                            {estacion.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Sede *</label>
                      <select
                        name="sede_id"
                        value={formData.sede_id || (sedes.length === 1 ? sedes[0].id : '')}
                        onChange={handleInputChange}
                        required
                        disabled={sedes.length === 1}
                      >
                        <option value="">Seleccione una sede</option>
                        {sedes.map(sede => (
                          <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingId ? 'Actualizar' : 'Crear'} Producto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Categoría */}
        {showCategoriaModal && (
          <div className="modal-overlay" onClick={() => setShowCategoriaModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Nueva Categoría</h3>
                <button className="btn-close" onClick={() => setShowCategoriaModal(false)}><IconClose /></button>
              </div>

              <form onSubmit={handleSubmitCategoria}>
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={categoriaForm.nombre}
                    onChange={handleCategoriaChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    name="descripcion"
                    value={categoriaForm.descripcion}
                    onChange={handleCategoriaChange}
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Sede *</label>
                  {/* Mostrar sedes disponibles */}
                  {sedes.length > 0 ? (
                    <ul style={{ paddingLeft: 18, marginBottom: 8, color: 'var(--rb-cream-500)', fontSize: 13 }}>
                      {sedes.map(sede => (
                        <li key={sede.id}>{sede.nombre}</li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ color: 'var(--rb-cream-700)', fontSize: 13, marginBottom: 8 }}>No hay sedes registradas</div>
                  )}
                  <select
                    name="sede_id"
                    value={categoriaForm.sede_id || (sedes.length === 1 ? sedes[0].id : '')}
                    onChange={handleCategoriaChange}
                    required
                    disabled={sedes.length === 1}
                  >
                    <option value="">Seleccione una sede</option>
                    {sedes.map(sede => (
                      <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCategoriaModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <IconPlus /> Crear Categoría
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

export default ConfiguracionProductos;