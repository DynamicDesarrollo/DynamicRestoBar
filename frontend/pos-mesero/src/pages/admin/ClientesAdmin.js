import React, { useEffect, useState } from 'react';
import { clientesService } from '../../services/api';
import styles from '../superadmin/ClientesAdmin.module.css';
import { IconPlus, IconClose, IconCheck } from '../../components/Icons';

const ClientesAdmin = () => {
    const [accionMsg, setAccionMsg] = useState(null);
    const [metricas, setMetricas] = useState({});
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
      nombre: '',
      plan: 'Diamante',
      estado: 'activo',
      fecha_corte: '',
      email: '',
      telefono: '',
      departamento: '',
      ciudad: '',
      foto: null,
      valor_plan: '',
      estilo_catalogo: 'clasico',
      factura_electronica_habilitada: false
    });

    const [departamentos, setDepartamentos] = useState([]);
    const [ciudades, setCiudades] = useState([]);
        // Cargar departamentos y ciudades
        useEffect(() => {
          fetch('https://raw.githubusercontent.com/marcovega/colombia-json/master/colombia.min.json')
            .then(res => res.json())
            .then(data => {
              setDepartamentos(data);
            });
        }, []);

        useEffect(() => {
          if (formData.departamento) {
            const dep = departamentos.find(d => d.departamento === formData.departamento);
            setCiudades(dep ? dep.ciudades : []);
          } else {
            setCiudades([]);
          }
        }, [formData.departamento, departamentos]);
    const [editId, setEditId] = useState(null);
    const handleInputChange = (e) => {
      const { name, value, files, type, checked } = e.target;
      if (name === 'foto') {
        setFormData((prev) => ({ ...prev, foto: files[0] }));
      } else if (type === 'checkbox') {
        setFormData((prev) => ({ ...prev, [name]: checked }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    };

    const abrirCrear = () => {
      setFormData({
        nombre: '',
        plan: 'Diamante',
        estado: 'activo',
        fecha_corte: '',
        email: '',
        telefono: '',
        departamento: '',
        ciudad: '',
        foto: null,
        valor_plan: '',
        estilo_catalogo: 'clasico',
        factura_electronica_habilitada: false
      });
      setEditId(null);
      setShowForm(true);
    };

    const abrirEditar = (cliente) => {
      setFormData({
        nombre: cliente.nombre || '',
        plan: cliente.plan || 'Diamante',
        estado: cliente.estado || 'activo',
        fecha_corte: cliente.fecha_corte || '',
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        departamento: cliente.departamento || '',
        ciudad: cliente.ciudad || '',
        foto: null,
        valor_plan: cliente.valor_plan || '',
        estilo_catalogo: cliente.estilo_catalogo || 'clasico',
        factura_electronica_habilitada: !!cliente.factura_electronica_habilitada
      });
      setEditId(cliente.id);
      setShowForm(true);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        let dataToSend = { ...formData };
        if (formData.foto) {
          const form = new FormData();
          Object.entries(formData).forEach(([key, value]) => {
            if (key === 'foto' && value) {
              form.append('foto', value);
            } else {
              form.append(key, value);
            }
          });
          dataToSend = form;
        }
        let response;
        if (editId) {
          response = await clientesService.actualizar(editId, dataToSend);
          setAccionMsg('Cliente actualizado correctamente');
        } else {
          response = await clientesService.crear(dataToSend);
          setAccionMsg('Cliente creado correctamente');
        }
        // Cierra el modal si la respuesta es exitosa (status 201 o 200)
        if (response && (response.status === 201 || response.status === 200)) {
          setShowForm(false);
        }
        cargarClientes();
      } catch (err) {
        // Si el error es por parsing pero el status es 201, cierra el modal
        if (err.response && (err.response.status === 201 || err.response.status === 200)) {
          setShowForm(false);
        }
        setAccionMsg('Error al guardar cliente');
      }
      setTimeout(() => setAccionMsg(null), 2000);
    };

    const eliminarCliente = async (id) => {
      if (!window.confirm('¿Seguro que deseas eliminar este cliente?')) return;
      try {
        await clientesService.eliminar(id);
        setAccionMsg('Cliente eliminado');
        cargarClientes();
      } catch (err) {
        setAccionMsg('Error al eliminar cliente');
      }
      setTimeout(() => setAccionMsg(null), 2000);
    };
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [tokenActivacion, setTokenActivacion] = useState({});
  const [tokenLoading, setTokenLoading] = useState({});
  const [tokenError, setTokenError] = useState({});

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const res = await clientesService.listar();
      setClientes(res.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar clientes');
    }
    setLoading(false);
  };

  const cambiarEstado = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === 'activo' ? 'suspendido' : 'activo';
    try {
      await clientesService.cambiarEstado(id, nuevoEstado);
      setAccionMsg(`Cliente ${nuevoEstado === 'activo' ? 'activado' : 'suspendido'} correctamente`);
      cargarClientes();
    } catch (err) {
      setAccionMsg('Error al cambiar estado');
    }
    setTimeout(() => setAccionMsg(null), 2000);
  };

  const verMetricas = async (id) => {
    try {
      const res = await clientesService.metricas(id);
      setMetricas((prev) => ({ ...prev, [id]: res.data }));
    } catch (err) {
      setMetricas((prev) => ({ ...prev, [id]: { error: 'Error al obtener métricas' } }));
    }
  };

  const obtenerTokenActivacion = async (usuarioId) => {
    setTokenLoading((prev) => ({ ...prev, [usuarioId]: true }));
    setTokenError((prev) => ({ ...prev, [usuarioId]: null }));
    try {
      const res = await clientesService.tokenActivacion(usuarioId);
      setTokenActivacion((prev) => ({ ...prev, [usuarioId]: res.data.token }));
    } catch (err) {
      setTokenError((prev) => ({ ...prev, [usuarioId]: 'Error al obtener token' }));
    }
    setTokenLoading((prev) => ({ ...prev, [usuarioId]: false }));
  };

  return (
    <div className={styles.clientesCard}>
      <div className={styles.clientesHeader}>
        <span className={styles.clientesTitle}>Clientes (Empresas)</span>
        <button className={styles.crearBtn} onClick={abrirCrear}><IconPlus /> Crear Cliente</button>
      </div>
      {showForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalForm}>
            <form onSubmit={handleSubmit} encType="multipart/form-data">
              <h2 className={styles.modalTitle}>{editId ? 'Editar Cliente' : 'Crear Cliente'}</h2>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Nombre</label>
                  <input name="nombre" value={formData.nombre} onChange={handleInputChange} required className={styles.input}/>
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input name="email" type="email" value={formData.email} onChange={handleInputChange} className={styles.input}/>
                </div>
                <div className={styles.formGroup}>
                  <label>Teléfono</label>
                  <input name="telefono" value={formData.telefono} onChange={handleInputChange} className={styles.input}/>
                </div>
                <div className={styles.formGroup}>
                  <label>Departamento</label>
                  <select name="departamento" value={formData.departamento} onChange={handleInputChange} className={styles.input}>
                    <option value="">Seleccione...</option>
                    {departamentos.map(dep => (
                      <option key={dep.departamento} value={dep.departamento}>{dep.departamento}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Ciudad</label>
                  <select name="ciudad" value={formData.ciudad} onChange={handleInputChange} className={styles.input}>
                    <option value="">Seleccione...</option>
                    {ciudades.map(ciudad => (
                      <option key={ciudad} value={ciudad}>{ciudad}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Plan</label>
                  <select name="plan" value={formData.plan} onChange={handleInputChange} className={styles.input}>
                    <option value="Diamante">Diamante</option>
                    <option value="Oro">Oro</option>
                    <option value="Zafiro">Zafiro</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Valor del Plan</label>
                  <input name="valor_plan" type="number" value={formData.valor_plan || ''} onChange={handleInputChange} className={styles.input} min="0" step="0.01" />
                </div>
                <div className={styles.formGroup}>
                  <label>Estilo de catálogo</label>
                  <select name="estilo_catalogo" value={formData.estilo_catalogo} onChange={handleInputChange} className={styles.input}>
                    <option value="clasico">Clásico</option>
                    <option value="aurum">Aurum</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Facturación electrónica</label>
                  <div className={styles.checkboxField}>
                    <input
                      id="factura_electronica_habilitada"
                      name="factura_electronica_habilitada"
                      type="checkbox"
                      checked={formData.factura_electronica_habilitada}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="factura_electronica_habilitada">Este cliente tiene el servicio habilitado</label>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Estado</label>
                  <select name="estado" value={formData.estado} onChange={handleInputChange} className={styles.input}>
                    <option value="activo">activo</option>
                    <option value="suspendido">suspendido</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Fecha Corte</label>
                  <input name="fecha_corte" type="date" value={formData.fecha_corte} onChange={handleInputChange} className={styles.input}/>
                </div>
                <div className={styles.formGroup}>
                  <label>Foto Empresa</label>
                  <input name="foto" type="file" accept="image/*" onChange={handleInputChange} className={styles.input}/>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.crearBtn} type="submit"><IconCheck />{editId ? 'Actualizar' : 'Crear'}</button>
                <button className={styles.accionesBtn} type="button" onClick={() => setShowForm(false)}><IconClose /> Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {loading && <p style={{ color: 'var(--rb-cream-500)' }}>Cargando...</p>}
      {error && <p className={styles.errorMsg}>{error}</p>}
      {accionMsg && <p style={{ color: 'var(--rb-green-400)', fontWeight: 600 }}>{accionMsg}</p>}
      <table className={styles.clientesTable}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Foto</th>
            <th>Nombre</th>
            <th>Plan</th>
            <th>Catálogo</th>
            <th>Fact. Electrónica</th>
            <th>Valor del Plan</th>
            <th>Estado</th>
            <th>Fecha Corte</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c) => {
            // Fallback simple para errores de imagen
            const handleImgError = (e) => {
              e.target.onerror = null;
              e.target.src = 'https://ui-avatars.com/api/?name=Empresa&background=241b14&color=e3b565&size=48';
            };
            return (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>
                  {c.foto_url ? (
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start'}}>
                      <img
                        src={c.foto_url}
                        alt={"Foto Empresa"}
                        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }}
                        onError={handleImgError}
                      />
                    </div>
                  ) : (
                    <img
                      src={'https://ui-avatars.com/api/?name=Empresa&background=241b14&color=e3b565&size=48'}
                      alt="Sin foto"
                      style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }}
                    />
                  )}
                </td>
                <td>{c.nombre}</td>
                <td>
                  <span className={`${styles.badge} ${c.plan === 'Diamante' ? styles['badge-premium'] : styles['badge-basico']}`}>
                    {c.plan}
                  </span>
                </td>
                <td>
                  <span className={`${styles.badge} ${c.estilo_catalogo === 'aurum' ? styles['badge-premium'] : styles['badge-basico']}`}>
                    {c.estilo_catalogo === 'aurum' ? 'Aurum' : 'Clásico'}
                  </span>
                </td>
                <td>
                  <span className={`${styles.badge} ${c.factura_electronica_habilitada ? styles['badge-activo'] : styles['badge-inactivo']}`}>
                    {c.factura_electronica_habilitada ? 'Habilitada' : 'No habilitada'}
                  </span>
                </td>
                <td>{c.valor_plan ? `$${Number(c.valor_plan).toLocaleString()}` : '-'}</td>
                <td>
                  <span className={`${styles.badge} ${c.estado === 'activo' ? styles['badge-activo'] : styles['badge-inactivo']}`}>
                    {c.estado}
                  </span>
                </td>
                <td>{c.fecha_corte ? c.fecha_corte.slice(0, 10) : '-'}</td>
                <td>
                  <div className={styles.accionesGroup}>
                    <button className={styles.accionesBtn} title="Editar" onClick={() => abrirEditar(c)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e3b565" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                    </button>
                    <button className={styles.eliminarBtn} title="Eliminar" onClick={() => eliminarCliente(c.id)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e2564b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="#e2564b" strokeWidth="2"/>
                        <line x1="8" y1="8" x2="16" y2="16" stroke="#e2564b" strokeWidth="2"/>
                        <line x1="16" y1="8" x2="8" y2="16" stroke="#e2564b" strokeWidth="2"/>
                      </svg>
                    </button>
                    <button className={styles.accionesBtn} title="Suspender" onClick={() => cambiarEstado(c.id, c.estado)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cf7245" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/></svg>
                    </button>
                    <button className={styles.metricasBtn} title="Métricas" onClick={() => verMetricas(c.id)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="14" width="4" height="6" rx="1" fill="#4d9d6f"/>
                        <rect x="9" y="10" width="4" height="10" rx="1" fill="#c99a46"/>
                        <rect x="15" y="6" width="4" height="14" rx="1" fill="#4a97a3"/>
                      </svg>
                    </button>
                    <button className={styles.accionesBtn} title="Token Activación Admin" onClick={() => obtenerTokenActivacion(c.admin_usuario_id)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a97a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12" y2="16"/></svg>
                    </button>
                    {tokenLoading[c.admin_usuario_id] && <span style={{color:'var(--rb-cyan-400)'}}>Cargando...</span>}
                    {tokenError[c.admin_usuario_id] && <span style={{color:'#f0958c'}}>{tokenError[c.admin_usuario_id]}</span>}
                    {tokenActivacion[c.admin_usuario_id] && (
                      <span style={{background:'rgba(74, 151, 163, 0.14)',color:'var(--rb-cyan-400)',padding:'3px 10px',borderRadius:'999px',marginLeft:'4px',fontSize:'13px',border:'1px solid rgba(74, 151, 163, 0.35)'}}>
                        Token: {tokenActivacion[c.admin_usuario_id]}
                        <button style={{marginLeft:'6px',fontSize:'12px',background:'none',border:'none',color:'var(--rb-cyan-400)',textDecoration:'underline',cursor:'pointer'}} onClick={() => navigator.clipboard.writeText(tokenActivacion[c.admin_usuario_id])}>Copiar</button>
                      </span>
                    )}
                  </div>
                  {metricas[c.id] && (
                    <div style={{ fontSize: '0.85em', marginTop: 6, color: 'var(--rb-cream-500)' }}>
                      {metricas[c.id].error ? (
                        <span style={{ color: '#f0958c' }}>{metricas[c.id].error}</span>
                      ) : (
                        <span>Sedes: {metricas[c.id].sedes}</span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ClientesAdmin;