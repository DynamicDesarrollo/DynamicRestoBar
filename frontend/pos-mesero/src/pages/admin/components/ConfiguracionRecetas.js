import React, { useEffect, useState } from 'react';
import axios from '../../../services/api';
import AdminLayout from '../AdminLayout';
import { formatMoney } from '../../../utils/formatters';
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
  });

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
      alert('Por favor complete todos los campos');
      return;
    }

    const insumo = insumos.find(i => i.id === parseInt(nuevoInsumo.insumo_id));
    if (!insumo) return;

    const yaExiste = insumosReceta.some(i => i.insumo_id === parseInt(nuevoInsumo.insumo_id));
    if (yaExiste) {
      alert('Este insumo ya está en la receta');
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
      alert('Seleccione un producto');
      return;
    }

    if (insumosReceta.length === 0) {
      alert('Agregue al menos un insumo');
      return;
    }

    try {
      const data = {
        producto_id: selectedProducto,
        descripcion: formData.descripcion,
        rendimiento: parseFloat(formData.rendimiento) || 1,
        insumos: insumosReceta,
      };

      if (recetaActual?.id) {
        await axios.put(`/admin/recetas/${recetaActual.id}`, data);
      } else {
        await axios.post('/admin/recetas', data);
      }

      alert('Receta guardada exitosamente');
      cargarDatos();
      setSelectedProducto(null);
      setRecetaActual(null);
      setInsumosReceta([]);
      setFormData({ descripcion: '', rendimiento: 1 });
    } catch (err) {
      console.error('Error al guardar receta:', err);
      alert('Error al guardar receta: ' + (err.response?.data?.error || err.message));
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
          <h2>🍳 Gestión de Recetas</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px' }}>
          {/* Panel Izquierdo - Seleccionar Producto */}
          <div style={{ 
            background: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '8px',
            borderLeft: '4px solid #7c5cdb'
          }}>
            <h4 style={{ marginBottom: '15px' }}>Productos</h4>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {productos.map(producto => (
                <button
                  key={producto.id}
                  onClick={() => handleSelectProducto(producto.id)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginBottom: '8px',
                    border: selectedProducto === producto.id ? '2px solid #7c5cdb' : '1px solid #ddd',
                    background: selectedProducto === producto.id ? '#e8e0ff' : 'white',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{producto.nombre}</div>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    {formatMoney(producto.precio, true)}
                  </div>
                  {recetas.find(r => r.producto_id === producto.id) && (
                    <div style={{ fontSize: '11px', color: '#2f9e44', marginTop: '4px' }}>
                      ✅ Con receta
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Panel Derecho - Editor de Receta */}
          <div>
            {selectedProducto ? (
              <form onSubmit={handleGuardarReceta} style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '20px' }}>
                  Receta para: {productos.find(p => p.id === selectedProducto)?.nombre}
                </h4>

                <div className="form-row">
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
                <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
                  <h5 style={{ marginBottom: '15px' }}>➕ Agregar Insumo</h5>

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
                        <div style={{ fontSize: '11px', color: '#7c5cdb', marginTop: '5px', fontStyle: 'italic' }}>
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
                        Agregar Insumo
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tabla de Insumos */}
                {insumosReceta.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h5 style={{ marginBottom: '10px' }}>Insumos en Receta:</h5>
                    <table className="table table-sm" style={{ fontSize: '12px' }}>
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
                              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                ${costoTotal.toFixed(2)}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  onClick={() => eliminarInsumo(idx)}
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Resumen de Costos */}
                    <div style={{
                      background: '#e8f5e9',
                      padding: '15px',
                      borderRadius: '4px',
                      marginTop: '15px',
                      borderLeft: '4px solid #4caf50'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span><strong>Costo Total Producción:</strong></span>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#c92a2a' }}>
                          ${costoTotal.toFixed(2)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span><strong>Costo por Unidad/Porción:</strong></span>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#2f9e44' }}>
                          ${costoPorUnidad.toFixed(2)}
                        </span>
                      </div>
                      {recetaActual && (
                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#666', borderTop: '1px solid #ddd', paddingTop: '8px' }}>
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
                    {recetaActual ? '✏️ Actualizar Receta' : '➕ Crear Receta'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{
                background: '#f8f9fa',
                padding: '40px',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#999'
              }}>
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
