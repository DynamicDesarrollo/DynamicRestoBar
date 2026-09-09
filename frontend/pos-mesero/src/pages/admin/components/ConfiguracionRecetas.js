import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from '../../../services/api';
import AdminLayout from '../AdminLayout';
import { formatMoney } from '../../../utils/formatters';
import { IconChefHat, IconCheck, IconPlus, IconTrash, IconEdit } from '../../../components/Icons';
import '../admin.css';

const ConfiguracionRecetas = () => {
  const [productos, setProductos] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedProducto, setSelectedProducto] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [recetaActual, setRecetaActual] = useState(null);

  const [formData, setFormData] = useState({
    descripcion: '',
    rendimiento: 1,
    sede_id: '',
  });
    const [sedes, setSedes] = useState([]);

  const [insumosReceta, setInsumosReceta] = useState([]);
  const [nuevoInsumo, setNuevoInsumo] = useState({
    insumo_id: '',
    cantidad: '',
    unidad_medida_id: '',
    merma: 0,
  });

  // Tabla de conversiones entre unidades
  const conversionesUnidades = {
    // Pesos
    'Kilogramo': { 'Gramo': 1000, 'Miligramo': 1000000 },
    'Gramo': { 'Kilogramo': 0.001, 'Miligramo': 1000 },
    'Miligramo': { 'Kilogramo': 0.000001, 'Gramo': 0.001 },
    // Volúmenes
    'Litro': { 'Mililitro': 1000, 'Centilitro': 100 },
    'Mililitro': { 'Litro': 0.001, 'Centilitro': 0.1 },
    'Centilitro': { 'Litro': 0.01, 'Mililitro': 10 },
  };

  // Función para convertir cantidades entre unidades
  const convertirUnidad = (cantidadOriginal, unidadOrigen, unidadDestino) => {
    if (unidadOrigen === unidadDestino || !cantidadOriginal) return cantidadOriginal;
    
    if (conversionesUnidades[unidadOrigen] && conversionesUnidades[unidadOrigen][unidadDestino]) {
      return cantidadOriginal * conversionesUnidades[unidadOrigen][unidadDestino];
    }
    return cantidadOriginal;
  };

  useEffect(() => {
    cargarDatos();
    cargarSedes();
  }, []);

  const cargarDatos = async () => {
    try {
      const [productosRes, insumosRes, unidadesRes, recetasRes] = await Promise.all([
        axios.get('/admin/productos'),
        axios.get('/admin/insumos'),
        axios.get('/admin/insumos/unidades'),
        axios.get('/admin/recetas'),
      ]);

      if (productosRes.data.success) setProductos(productosRes.data.data);
      if (insumosRes.data.success) setInsumos(insumosRes.data.data);
      if (unidadesRes.data.success) setUnidades(unidadesRes.data.data);
      if (recetasRes.data.success) setRecetas(recetasRes.data.data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
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
      console.error('Error al cargar sedes:', err);
      setSedes([]);
    }
  };

  const handleSelectProducto = async (productoId) => {
    setSelectedProducto(productoId);
    try {
      const res = await axios.get(`/admin/recetas/producto/${productoId}`);
      if (res.data.data) {
        setRecetaActual(res.data.data);
        setInsumosReceta(res.data.data.insumos || []);
        setFormData({
          descripcion: res.data.data.descripcion || '',
          rendimiento: res.data.data.rendimiento || 1,
        });
      } else {
        setRecetaActual(null);
        setInsumosReceta([]);
        setFormData({
          descripcion: '',
          rendimiento: 1,
        });
      }
    } catch (err) {
      console.error('Error al cargar receta:', err);
    }
  };

  const agregarInsumo = () => {
    if (!nuevoInsumo.insumo_id || !nuevoInsumo.cantidad || !nuevoInsumo.unidad_medida_id) {
      toast.warn('Por favor complete todos los campos');
      return;
    }

    const insumo = insumos.find(i => i.id === parseInt(nuevoInsumo.insumo_id));
    if (!insumo) return;

    const yaExiste = insumosReceta.some(i => i.insumo_id === parseInt(nuevoInsumo.insumo_id));
    if (yaExiste) {
      toast.warn('Este insumo ya está en la receta');
      return;
    }

    // Convertir automáticamente a la unidad del insumo
    const unidadSeleccionada = unidades.find(u => u.id === parseInt(nuevoInsumo.unidad_medida_id));
    const cantidadConvertida = convertirUnidad(
      parseFloat(nuevoInsumo.cantidad),
      unidadSeleccionada?.nombre || insumo.unidad_medida,
      insumo.unidad_medida
    );

    const nuevoItem = {
      insumo_id: parseInt(nuevoInsumo.insumo_id),
      insumo_nombre: insumo.nombre,
      cantidad: cantidadConvertida, // Ya convertida a la unidad del insumo
      unidad_medida_id: parseInt(nuevoInsumo.unidad_medida_id),
      unidad_medida: unidadSeleccionada?.nombre || insumo.unidad_medida,
      costo_unitario: parseFloat(insumo.costo_unitario),
      merma: parseFloat(nuevoInsumo.merma) || 0,
    };

    setInsumosReceta([...insumosReceta, nuevoItem]);
    setNuevoInsumo({
      insumo_id: '',
      cantidad: '',
      unidad_medida_id: '',
      merma: 0,
    });
  };

  const eliminarInsumo = (index) => {
    setInsumosReceta(insumosReceta.filter((_, i) => i !== index));
  };

  const calcularCostoTotal = () => {
    return insumosReceta.reduce((sum, item) => {
      const costo = item.cantidad * item.costo_unitario;
      return sum + costo;
    }, 0);
  };

  const calcularCostoPorUnidad = () => {
    const costoTotal = calcularCostoTotal();
    const rendimiento = parseFloat(formData.rendimiento) || 1;
    return costoTotal / rendimiento;
  };

  const handleGuardarReceta = async (e) => {
    e.preventDefault();

    if (!selectedProducto) {
      toast.warn('Seleccione un producto');
      return;
    }

    if (insumosReceta.length === 0) {
      toast.warn('Agregue al menos un insumo');
      return;
    }

    try {
      const data = {
        producto_id: selectedProducto,
        descripcion: formData.descripcion,
        rendimiento: formData.rendimiento,
        insumos: insumosReceta,
        sede_id: formData.sede_id || (sedes.length === 1 ? sedes[0].id : null),
      };

      if (recetaActual?.id) {
        await axios.put(`/admin/recetas/${recetaActual.id}`, data);
      } else {
        await axios.post('/admin/recetas', data);
      }

      toast.success('Receta guardada exitosamente');
      cargarDatos();
      setSelectedProducto(null);
      setRecetaActual(null);
      setInsumosReceta([]);
      setFormData({ descripcion: '', rendimiento: 1 });
    } catch (err) {
      console.error('Error al guardar receta:', err);
      toast.error('Error al guardar receta: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Cargando recetas...</div>
      </AdminLayout>
    );
  }

  const costoTotal = calcularCostoTotal();
  const costoPorUnidad = calcularCostoPorUnidad();

  return (
    <AdminLayout>
      <div className="admin-section">
        <div className="section-header">
          <h2><IconChefHat /> Gestión de Recetas</h2>
        </div>

        <div className="recetas-layout">
          {/* Panel Izquierdo - Seleccionar Producto */}
          <div className="recetas-sidebar">
            <h4>Productos</h4>
            <div className="recetas-lista">
              {productos.map(producto => (
                <button
                  key={producto.id}
                  onClick={() => handleSelectProducto(producto.id)}
                  className={`receta-producto-btn ${selectedProducto === producto.id ? 'is-active' : ''}`}
                >
                  <div className="receta-producto-btn__nombre">{producto.nombre}</div>
                  <div className="receta-producto-btn__precio">
                    {formatMoney(producto.precio, true)}
                  </div>
                  {recetas.find(r => r.producto_id === producto.id) && (
                    <div className="receta-producto-btn__badge">
                      <IconCheck /> Con receta
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Panel Derecho - Editor de Receta */}
          <div>
            {selectedProducto ? (
              <form onSubmit={handleGuardarReceta} className="receta-panel">
                <h4>
                  Receta para: {productos.find(p => p.id === selectedProducto)?.nombre}
                </h4>

                <div className="form-row">
                  <div className="form-group">
                    <label>Sede *</label>
                    <select
                      name="sede_id"
                      value={formData.sede_id || (sedes.length === 1 ? sedes[0].id : '')}
                      onChange={e => setFormData(prev => ({ ...prev, sede_id: e.target.value }))}
                      required
                      disabled={sedes.length === 1}
                    >
                      <option value="">Seleccione una sede</option>
                      {sedes.map(sede => (
                        <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Descripción</label>
                    <input
                      type="text"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Ej: Hamburguesa clásica con queso"
                    />
                  </div>

                  <div className="form-group">
                    <label>Rendimiento (porciones)</label>
                    <input
                      type="number"
                      value={formData.rendimiento}
                      onChange={(e) => setFormData({ ...formData, rendimiento: e.target.value })}
                      placeholder="1"
                      step="0.1"
                      min="0.1"
                    />
                  </div>
                </div>

                {/* Agregar Insumo */}
                <div className="receta-agregar-box">
                  <h5><IconPlus /> Agregar Insumo</h5>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Insumo *</label>
                      <select
                        value={nuevoInsumo.insumo_id}
                        onChange={(e) => setNuevoInsumo({ ...nuevoInsumo, insumo_id: e.target.value })}
                      >
                        <option value="">Seleccionar...</option>
                        {insumos.map(i => (
                          <option key={i.id} value={i.id}>
                            {i.nombre} - {formatMoney(i.costo_unitario, true)}/{i.unidad_medida}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Cantidad *</label>
                      <input
                        type="number"
                        value={nuevoInsumo.cantidad}
                        onChange={(e) => setNuevoInsumo({ ...nuevoInsumo, cantidad: e.target.value })}
                        placeholder="0"
                        step="0.01"
                      />
                      {/* Mostrar conversión sugerida */}
                      {nuevoInsumo.cantidad && nuevoInsumo.insumo_id && nuevoInsumo.unidad_medida_id && (
                        <div className="receta-conversion-hint">
                          {(() => {
                            const insumo = insumos.find(i => i.id === parseInt(nuevoInsumo.insumo_id));
                            const unidadActual = unidades.find(u => u.id === parseInt(nuevoInsumo.unidad_medida_id));
                            if (insumo && unidadActual && insumo.unidad_medida !== unidadActual.nombre) {
                              const cantidadConvertida = convertirUnidad(
                                parseFloat(nuevoInsumo.cantidad),
                                unidadActual.nombre,
                                insumo.unidad_medida
                              );
                              if (cantidadConvertida !== parseFloat(nuevoInsumo.cantidad)) {
                                return `= ${cantidadConvertida.toFixed(2)} ${insumo.unidad_medida}`;
                              }
                            }
                            return '';
                          })()}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Unidad *</label>
                      <select
                        value={nuevoInsumo.unidad_medida_id}
                        onChange={(e) => setNuevoInsumo({ ...nuevoInsumo, unidad_medida_id: e.target.value })}
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
                      <label>Merma (%)</label>
                      <input
                        type="number"
                        value={nuevoInsumo.merma}
                        onChange={(e) => setNuevoInsumo({ ...nuevoInsumo, merma: e.target.value })}
                        placeholder="0"
                        step="0.1"
                        min="0"
                      />
                    </div>

                    <div style={{ alignSelf: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={agregarInsumo}
                      >
                        <IconPlus /> Agregar Insumo
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tabla de Insumos */}
                {insumosReceta.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h5 className="receta-insumos-titulo">Insumos en Receta:</h5>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Insumo</th>
                            <th>Cantidad</th>
                            <th>Costo Unitario</th>
                            <th>Costo Total</th>
                            <th>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {insumosReceta.map((item, idx) => {
                            const cantidad = parseFloat(item.cantidad) || 0;
                            const costoUnitario = parseFloat(item.costo_unitario) || 0;
                            const costoTotal = cantidad * costoUnitario;

                            return (
                              <tr key={idx}>
                                <td>{item.insumo_nombre}</td>
                                <td>
                                  {cantidad.toFixed(2)} {item.unidad_medida || 'und'}
                                </td>
                                <td>${costoUnitario.toFixed(2)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                  ${costoTotal.toFixed(2)}
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-danger"
                                    onClick={() => eliminarInsumo(idx)}
                                    aria-label="Eliminar insumo"
                                  >
                                    <IconTrash />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Resumen de Costos */}
                    <div className="receta-resumen-costos">
                      <div className="receta-resumen-linea">
                        <span><strong>Costo Total Producción:</strong></span>
                        <span className="receta-resumen-total">
                          ${costoTotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="receta-resumen-linea">
                        <span><strong>Costo por Unidad/Porción:</strong></span>
                        <span className="receta-resumen-unidad">
                          ${costoPorUnidad.toFixed(2)}
                        </span>
                      </div>
                      {recetaActual && (
                        <div className="receta-version-info">
                          <strong>Versión {recetaActual.version}</strong> • Costo anterior: ${recetaActual.costo_total}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Botones de Acción */}
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setSelectedProducto(null);
                      setInsumosReceta([]);
                      setFormData({ descripcion: '', rendimiento: 1 });
                    }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={insumosReceta.length === 0}>
                    {recetaActual ? <><IconEdit /> Actualizar Receta</> : <><IconPlus /> Crear Receta</>}
                  </button>
                </div>
              </form>
            ) : (
              <div className="admin-empty-state" style={{ background: 'var(--rb-charcoal-800)', border: '1px solid var(--rb-charcoal-700)', borderRadius: 14 }}>
                <IconChefHat />
                <p>Seleccione un producto para crear/editar su receta</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ConfiguracionRecetas;