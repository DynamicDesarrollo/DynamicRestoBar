import React, { useEffect, useState } from 'react';
import axios from '../../../services/api';
import { useAuthStore } from '../../../stores';
import AdminLayout from '../AdminLayout';
import { formatMoney } from '../../../utils/formatters';
import '../admin.css';

const Informes = () => {
    const [sedes, setSedes] = useState([]);
    const [sedeSeleccionada, setSedeSeleccionada] = useState('');
  const usuario = useAuthStore((state) => state.usuario);
  const [ventasData, setVentasData] = useState([]);
  const [productosData, setProductosData] = useState([]);
  const [metodosData, setMetodosData] = useState([]);
  const [utilidadData, setUtilidadData] = useState([]);
  const utilidadTotales = utilidadData.reduce((totales, item) => ({
    ventas: totales.ventas + parseFloat(item.ventas || 0),
    costo: totales.costo + parseFloat(item.costo || 0),
    utilidad: totales.utilidad + parseFloat(item.utilidad || 0),
  }), { ventas: 0, costo: 0, utilidad: 0 });
  const [cajaData, setCajaData] = useState(null);
  const [impactoData, setImpactoData] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ventas');
  const [utilidadPeriodo, setUtilidadPeriodo] = useState('diario');
  const [filtros, setFiltros] = useState({
    fecha_inicio: '',
    fecha_fin: '',
  });

  useEffect(() => {
    cargarSedes();
    cargarCategorias();
  }, []);

  useEffect(() => {
    if (sedeSeleccionada) {
      cargarInformes();
    }
  }, [filtros, sedeSeleccionada, utilidadPeriodo, categoriaFiltro]);

  useEffect(() => {
    if (!loading && activeTab === 'ventas' && cajaData?.movimientos?.length > 0 && ventasData.length === 0) {
      setActiveTab('caja');
    }
  }, [loading, cajaData, ventasData, activeTab]);

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
      const sedesList = Array.isArray(res.data) ? res.data : res.data.data || [];
      // Selecciona por defecto la sede del usuario si está disponible
      const usuarioSedeId = usuario?.sedeId || usuario?.sede_id;
      const sedePorDefecto = usuarioSedeId && sedesList.some((s) => s.id === usuarioSedeId)
        ? usuarioSedeId
        : sedesList[0]?.id;

      if (sedePorDefecto) {
        setSedeSeleccionada(sedePorDefecto);
      }
    } catch (err) {
      setSedes([]);
    }
  };

  const cargarCategorias = async () => {
    try {
      const res = await axios.get('/admin/categorias');
      if (res.data?.success) {
        setCategorias(res.data.data);
      } else if (Array.isArray(res.data)) {
        setCategorias(res.data);
      } else {
        setCategorias([]);
      }
    } catch (err) {
      setCategorias([]);
    }
  };
  const cargarInformes = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filtros.fecha_inicio) params.fecha_inicio = filtros.fecha_inicio;
      if (filtros.fecha_fin) params.fecha_fin = filtros.fecha_fin;
      if (sedeSeleccionada) params.sede_id = sedeSeleccionada;

      params.periodo = utilidadPeriodo;

      const paramsUtilidad = { ...params };
      if (categoriaFiltro) paramsUtilidad.categoria_id = categoriaFiltro;

      const [ventasRes, productosRes, metodosRes, utilidadRes, cajaRes, impactoRes] = await Promise.all([
        axios.get('/admin/informes/ventas', { params }),
        axios.get('/admin/informes/productos', { params }),
        axios.get('/admin/informes/metodos-pago', { params }),
        axios.get('/admin/informes/utilidad', { params: paramsUtilidad }),
        axios.get('/admin/informes/caja', { params }),
        axios.get('/admin/informes/impacto-ventas', { params }),
      ]);

      if (ventasRes.data.success) setVentasData(ventasRes.data.data);
      if (productosRes.data.success) setProductosData(productosRes.data.data);
      if (metodosRes.data.success) setMetodosData(metodosRes.data.data);
      if (utilidadRes.data.success) setUtilidadData(utilidadRes.data.data);
      if (cajaRes.data.success) {
        setCajaData(cajaRes.data.data);
      } else {
        setCajaData(null);
      }
      if (impactoRes.data.success) {
        setImpactoData(impactoRes.data.data);
      }

      if (
        activeTab === 'ventas' &&
        cajaRes.data?.success &&
        cajaRes.data?.data?.movimientos?.length > 0
      ) {
        setActiveTab('caja');
      }
    } catch (err) {
      console.error('Error al cargar informes:', err);
      console.error('Detalle del error:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Cargando informes...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-section">
        <div className="section-header">
          <h2>📈 Informes y Reportes</h2>
        </div>

        {/* Filtros */}
        <div style={{
          background: '#f9f9f9',
          padding: '15px',
          borderRadius: '6px',
          marginBottom: '20px',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-end'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>
              Sede
            </label>
            <select
              value={sedeSeleccionada}
              onChange={e => setSedeSeleccionada(e.target.value)}
              style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minWidth: '180px' }}
            >
              {sedes.map(sede => (
                <option key={sede.id} value={sede.id}>{sede.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>
              Categoría (utilidad)
            </label>
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minWidth: '180px' }}
            >
              <option value="">Todas</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>
              Desde
            </label>
            <input
              type="date"
              name="fecha_inicio"
              value={filtros.fecha_inicio}
              onChange={handleFiltroChange}
              style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>
              Periodo Utilidad
            </label>
            <select
              value={utilidadPeriodo}
              onChange={(e) => setUtilidadPeriodo(e.target.value)}
              style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minWidth: '140px' }}
            >
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>
              Hasta
            </label>
            <input
              type="date"
              name="fecha_fin"
              value={filtros.fecha_fin}
              onChange={handleFiltroChange}
              style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setFiltros({ fecha_inicio: '', fecha_fin: '' })}
          >
            Limpiar
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          borderBottom: '2px solid #f0f0f0',
          marginBottom: '20px'
        }}>
          {[
            { id: 'ventas', label: '💰 Ventas', icon: '📊' },
            { id: 'productos', label: '🍽️ Productos', icon: '📈' },
            { id: 'utilidad', label: '🧾 Utilidad', icon: '📈' },
            { id: 'metodos', label: '💳 Métodos de Pago', icon: '💳' },
            { id: 'impacto', label: '📦 Impacto en Inventario', icon: '📦' },
            { id: 'caja', label: '💵 Caja', icon: '💰' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: activeTab === tab.id ? '#667eea' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#666',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '3px solid #667eea' : 'none',
                fontWeight: activeTab === tab.id ? '600' : '400',
                transition: 'all 0.3s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido Tabs */}

        {/* Ventas */}
        {activeTab === 'ventas' && (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Órdenes</th>
                  <th>Mesas Atendidas</th>
                  <th>Total Ventas</th>
                </tr>
              </thead>
              <tbody>
                {ventasData.map((venta, idx) => (
                  <tr key={idx}>
                    <td>{new Date(venta.fecha).toLocaleDateString()}</td>
                    <td>{venta.cantidad_ordenes}</td>
                    <td>{venta.mesas_atendidas}</td>
                    <td><strong>{formatMoney(parseFloat(venta.total_ventas || 0), true)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ventasData.length === 0 && (
              <p style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                No hay datos de ventas para el período seleccionado
              </p>
            )}
          </div>
        )}

        {/* Productos */}
        {activeTab === 'productos' && (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad Vendida</th>
                  <th>Ingresos</th>
                  <th>Precio Promedio</th>
                </tr>
              </thead>
              <tbody>
                {productosData.map((prod, idx) => (
                  <tr key={idx}>
                    <td><strong>{prod.nombre}</strong></td>
                    <td>{prod.cantidad_vendida}</td>
                    <td>{formatMoney(parseFloat(prod.ingresos || 0), true)}</td>
                    <td>{formatMoney(parseFloat(prod.precio_promedio || 0), true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {productosData.length === 0 && (
              <p style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                No hay datos de productos para el período seleccionado
              </p>
            )}
          </div>
        )}

        {/* Utilidad */}
        {activeTab === 'utilidad' && (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Periodo</th>
                  <th>Ventas</th>
                  <th>Costo</th>
                  <th>Utilidad</th>
                </tr>
              </thead>
              <tbody>
                {utilidadData.map((item, idx) => {
                  const fecha = item.periodo ? new Date(item.periodo) : null;
                  return (
                    <tr key={idx}>
                      <td>{fecha ? fecha.toLocaleDateString() : 'Sin periodo'}</td>
                      <td style={{ textAlign: 'right' }}>{formatMoney(parseFloat(item.ventas || 0), true)}</td>
                      <td style={{ textAlign: 'right' }}>{formatMoney(parseFloat(item.costo || 0), true)}</td>
                      <td style={{ textAlign: 'right' }}>{formatMoney(parseFloat(item.utilidad || 0), true)}</td>
                    </tr>
                  );
                })}
                {utilidadData.length > 0 && (
                  <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ddd' }}>
                    <td>Total</td>
                    <td style={{ textAlign: 'right' }}>{formatMoney(utilidadTotales.ventas, true)}</td>
                    <td style={{ textAlign: 'right' }}>{formatMoney(utilidadTotales.costo, true)}</td>
                    <td style={{ textAlign: 'right' }}>{formatMoney(utilidadTotales.utilidad, true)}</td>
                  </tr>
                )}
              </tbody>
            </table>
            {utilidadData.length === 0 && (
              <p style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                No hay datos de utilidad para el período seleccionado
              </p>
            )}
          </div>
        )}

        {/* Métodos de Pago */}
        {activeTab === 'metodos' && (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Método de Pago</th>
                  <th>Transacciones</th>
                  <th>Total Recaudado</th>
                  <th>Monto Promedio</th>
                </tr>
              </thead>
              <tbody>
                {metodosData.map((metodo, idx) => (
                  <tr key={idx}>
                    <td><strong>{metodo.nombre}</strong></td>
                    <td>{metodo.cantidad_transacciones}</td>
                    <td>{formatMoney(parseFloat(metodo.total_recaudado || 0), true)}</td>
                    <td>{formatMoney(parseFloat(metodo.monto_promedio || 0), true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {metodosData.length === 0 && (
              <p style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                No hay datos de pagos para el período seleccionado
              </p>
            )}
          </div>
        )}
        {/* Tab: Impacto en Inventario */}
        {activeTab === 'impacto' && (
          <div>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>📦 Impacto de Ventas en Inventario</h3>

            {!impactoData ? (
              <p style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                Cargando datos de impacto...
              </p>
            ) : impactoData.resumen && impactoData.resumen.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                No hay datos de impacto para el período seleccionado. Asegúrate de que los productos vendidos tengan recetas configuradas.
              </p>
            ) : (
              <>
                {/* Resumen por Insumo */}
                <div style={{ marginBottom: '30px' }}>
                  <h4 style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>Consumo por Insumo</h4>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Insumo</th>
                        <th>Stock Antes</th>
                        <th>Consumo Total</th>
                        <th>Stock Restante</th>
                        <th>Stock Mínimo</th>
                        <th>Unidad</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {impactoData.resumen.map((item, idx) => {
                        const stockAntes = parseFloat(item.stock_actual).toFixed(2);
                        const consumo = parseFloat(item.consumo_total).toFixed(2);
                        const stockRestante = (parseFloat(item.stock_actual) - parseFloat(item.consumo_total)).toFixed(2);
                        return (
                          <tr key={idx}>
                            <td><strong>{item.insumo}</strong></td>
                            <td><span style={{ color: '#1e88e5', fontWeight: '500' }}>{stockAntes}</span></td>
                            <td><span style={{ color: '#c92a2a', fontWeight: '600' }}>- {consumo}</span></td>
                            <td><span style={{ color: '#2f9e44', fontWeight: '700', fontSize: '15px' }}>{stockRestante}</span></td>
                            <td>{item.stock_minimo}</td>
                            <td><span style={{ color: '#666', fontSize: '13px' }}>{item.unidad_medida}</span></td>
                            <td>
                              {item.alerta ? (
                                <span style={{
                                  background: '#ffebee',
                                  color: '#c92a2a',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}>
                                  ⚠️ Bajo Stock
                                </span>
                              ) : (
                                <span style={{
                                  background: '#e8f5e9',
                                  color: '#2f9e44',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}>
                                  ✓ Normal
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Detalle por Producto */}
                <div>
                  <h4 style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>Detalle por Producto</h4>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Vendido</th>
                        <th>Insumo Usado</th>
                        <th>Por Unidad</th>
                        <th>Consumo Total</th>
                        <th>% Consumo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {impactoData.detalle && impactoData.detalle.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.producto_nombre}</td>
                          <td>{item.producto_vendido}</td>
                          <td>{item.insumo_nombre}</td>
                          <td style={{ color: '#3b82f6', fontWeight: '500' }}>{item.cantidad_por_unidad}</td>
                          <td><strong>{item.consumo_total}</strong></td>
                          <td>
                            <span style={{ color: item.porcentaje_consumo > 50 ? '#c92a2a' : '#2f9e44' }}>
                              {item.porcentaje_consumo}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab: Caja */}
        {activeTab === 'caja' && (
          <div>
            {cajaData ? (
              <>
                <div className="stats-grid" style={{ marginBottom: '30px' }}>
                  <div className="stat-card">
                    <div className="stat-icon">💵</div>
                    <div className="stat-content">
                      <h3>Monto Inicial</h3>
                      <p className="stat-value">{formatMoney(parseFloat(cajaData.resumen?.monto_inicial || 0), true)}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">📈</div>
                    <div className="stat-content">
                      <h3>Ingresos</h3>
                      <p className="stat-value">{formatMoney(parseFloat(cajaData.resumen?.ingresos || 0), true)}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">📉</div>
                    <div className="stat-content">
                      <h3>Egresos</h3>
                      <p className="stat-value">{formatMoney(parseFloat(cajaData.resumen?.egresos || 0), true)}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                      <h3>Total en Caja</h3>
                      <p className="stat-value">{formatMoney(parseFloat(cajaData.resumen?.total_en_caja || 0), true)}</p>
                    </div>
                  </div>
                </div>

                {cajaData.movimientos && cajaData.movimientos.length > 0 ? (
                  <div>
                    <h3 style={{ marginBottom: '15px', color: '#333' }}>Movimientos</h3>
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Fecha/Hora</th>
                            <th>Tipo</th>
                            <th>Concepto</th>
                            <th>Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cajaData.movimientos.map((mov, idx) => {
                            const fecha = mov.fecha || mov.created_at || mov.updated_at;
                            let fechaFormateada = '-';

                            if (fecha) {
                              const parsedFecha = new Date(fecha);
                              if (!Number.isNaN(parsedFecha.getTime())) {
                                fechaFormateada = parsedFecha.toLocaleString('es-CO', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                });
                              }
                            }

                            return (
                              <tr key={idx}>
                                <td>{fechaFormateada}</td>
                                <td>
                                  <span style={{
                                    background: mov.tipo === 'ingreso' ? '#4caf50' : '#f44336',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px'
                                  }}>
                                    {mov.tipo?.toUpperCase()}
                                  </span>
                                </td>
                                <td>{mov.concepto}</td>
                                <td><strong>{formatMoney(parseFloat(mov.monto || 0), true)}</strong></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    No hay movimientos de caja disponibles para la sede seleccionada.
                  </p>
                )}
              </>
            ) : (
              <p style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                No hay datos de caja disponibles para la sede seleccionada.
              </p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Informes;
