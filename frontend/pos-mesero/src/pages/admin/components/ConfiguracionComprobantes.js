import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios, { cajaService } from '../../../services/api';
import AdminLayout from '../AdminLayout';
import { useAuthStore } from '../../../stores';
import { formatMoney } from '../../../utils/formatters';
import {
  IconReceipt, IconPlus, IconEdit, IconTrash, IconClose, IconTag,
  IconArrowUpCircle, IconArrowDownCircle, IconCheck, IconPrinter,
} from '../../../components/Icons';
import ComprobanteImpresion from '../../../components/ComprobanteImpresion';
import '../admin.css';

const initialComprobanteForm = {
  concepto_id: '',
  fecha: new Date().toISOString().slice(0, 10),
  monto: '',
  beneficiario: '',
  metodo_pago_id: '',
  referencia: '',
  observaciones: '',
  adjunto: null,
};

const initialConceptoForm = {
  nombre: '',
  tipo: 'egreso',
  sede_id: '',
  descripcion: '',
};

const COMPROBANTES_POR_PAGINA = 10;

const ConfiguracionComprobantes = () => {
  const usuario = useAuthStore((state) => state.usuario);
  const [comprobantes, setComprobantes] = useState([]);
  const [conceptos, setConceptos] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comprobanteImpresion, setComprobanteImpresion] = useState(null);

  const [tipoActivo, setTipoActivo] = useState('egreso');
  const [paginaActual, setPaginaActual] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialComprobanteForm);

  const [showConceptoModal, setShowConceptoModal] = useState(false);
  const [editingConceptoId, setEditingConceptoId] = useState(null);
  const [conceptoForm, setConceptoForm] = useState(initialConceptoForm);

  useEffect(() => {
    cargarDatos();
    cargarSedes();
    cargarMetodosPago();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [comprobantesRes, conceptosRes] = await Promise.all([
        axios.get('/admin/comprobantes'),
        axios.get('/admin/conceptos-movimiento'),
      ]);
      if (comprobantesRes.data.success) setComprobantes(comprobantesRes.data.data);
      if (conceptosRes.data.success) setConceptos(conceptosRes.data.data);
    } catch (err) {
      console.error('Error al cargar comprobantes:', err);
      toast.error('Error al cargar comprobantes');
    } finally {
      setLoading(false);
    }
  };

  const cargarSedes = async () => {
    try {
      const res = await axios.get('/admin/sedes');
      if (Array.isArray(res.data)) setSedes(res.data);
      else if (res.data.success && Array.isArray(res.data.data)) setSedes(res.data.data);
      else setSedes([]);
    } catch (err) {
      console.error('Error al cargar sedes:', err);
      setSedes([]);
    }
  };

  const cargarMetodosPago = async () => {
    try {
      const res = await cajaService.getMetodosPago();
      const data = res.data?.data || res.data || [];
      setMetodosPago(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar métodos de pago:', err);
      setMetodosPago([]);
    }
  };

  const conceptosDelTipo = conceptos.filter((c) => c.tipo === tipoActivo);
  const comprobantesDelTipo = comprobantes.filter((c) => c.tipo === tipoActivo);

  const totalPaginas = Math.max(1, Math.ceil(comprobantesDelTipo.length / COMPROBANTES_POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const comprobantesPagina = comprobantesDelTipo.slice(
    (paginaSegura - 1) * COMPROBANTES_POR_PAGINA,
    paginaSegura * COMPROBANTES_POR_PAGINA
  );

  const cambiarTipoActivo = (tipo) => {
    setTipoActivo(tipo);
    setPaginaActual(1);
  };

  const totalIngresos = comprobantes
    .filter((c) => c.tipo === 'ingreso')
    .reduce((sum, c) => sum + parseFloat(c.monto || 0), 0);
  const totalEgresos = comprobantes
    .filter((c) => c.tipo === 'egreso')
    .reduce((sum, c) => sum + parseFloat(c.monto || 0), 0);

  // ---------- Comprobante ----------

  const resetFormulario = () => {
    setFormData({ ...initialComprobanteForm, fecha: new Date().toISOString().slice(0, 10) });
    setEditingId(null);
  };

  const abrirNuevoComprobante = () => {
    resetFormulario();
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'adjunto') {
      setFormData((prev) => ({ ...prev, adjunto: files[0] || null }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEdit = (comprobante) => {
    setEditingId(comprobante.id);
    setFormData({
      concepto_id: comprobante.concepto_id || '',
      fecha: comprobante.fecha ? comprobante.fecha.slice(0, 10) : '',
      monto: comprobante.monto || '',
      beneficiario: comprobante.beneficiario || '',
      metodo_pago_id: comprobante.metodo_pago_id || '',
      referencia: comprobante.referencia || '',
      observaciones: comprobante.observaciones || '',
      adjunto: null,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.concepto_id) {
      toast.error('Selecciona un concepto');
      return;
    }
    try {
      const campos = {
        tipo: tipoActivo,
        concepto_id: formData.concepto_id,
        fecha: formData.fecha,
        monto: formData.monto,
        beneficiario: formData.beneficiario,
        metodo_pago_id: formData.metodo_pago_id || '',
        referencia: formData.referencia,
        observaciones: formData.observaciones,
      };

      let data = campos;
      if (formData.adjunto) {
        const form = new FormData();
        Object.entries(campos).forEach(([key, value]) => {
          if (value !== null && value !== undefined) form.append(key, value);
        });
        form.append('adjunto', formData.adjunto);
        data = form;
      }

      if (editingId) {
        await axios.put(`/admin/comprobantes/${editingId}`, data);
        toast.success('Comprobante actualizado');
      } else {
        const res = await axios.post('/admin/comprobantes', data);
        toast.success('Comprobante creado');
        const creado = res.data?.data;
        if (creado) {
          const concepto = conceptos.find((c) => c.id === Number(creado.concepto_id));
          const metodo = metodosPago.find((mp) => mp.id === Number(creado.metodo_pago_id));
          setComprobanteImpresion({
            ...creado,
            concepto_nombre: concepto?.nombre || '',
            metodo_pago_nombre: metodo?.nombre || '',
            usuario_nombre: usuario?.nombre || '',
          });
        }
      }
      setShowModal(false);
      resetFormulario();
      cargarDatos();
    } catch (err) {
      console.error('Error al guardar comprobante:', err);
      toast.error(err.response?.data?.error || 'Error al guardar comprobante');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este comprobante?')) return;
    try {
      await axios.delete(`/admin/comprobantes/${id}`);
      toast.success('Comprobante eliminado');
      cargarDatos();
    } catch (err) {
      console.error('Error al eliminar comprobante:', err);
      toast.error(err.response?.data?.error || 'Error al eliminar comprobante');
    }
  };

  // ---------- Concepto ----------

  const abrirNuevoConcepto = () => {
    setConceptoForm({ ...initialConceptoForm, tipo: tipoActivo });
    setEditingConceptoId(null);
    setShowConceptoModal(true);
  };

  const handleConceptoChange = (e) => {
    const { name, value } = e.target;
    setConceptoForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditConcepto = (concepto) => {
    setEditingConceptoId(concepto.id);
    setConceptoForm({
      nombre: concepto.nombre,
      tipo: concepto.tipo,
      sede_id: concepto.sede_id || '',
      descripcion: concepto.descripcion || '',
    });
    setShowConceptoModal(true);
  };

  const handleSubmitConcepto = async (e) => {
    e.preventDefault();
    try {
      const data = { ...conceptoForm };
      if (editingConceptoId) {
        await axios.put(`/admin/conceptos-movimiento/${editingConceptoId}`, data);
        toast.success('Concepto actualizado');
      } else {
        await axios.post('/admin/conceptos-movimiento', data);
        toast.success('Concepto creado');
      }
      setShowConceptoModal(false);
      setConceptoForm(initialConceptoForm);
      setEditingConceptoId(null);
      cargarDatos();
    } catch (err) {
      console.error('Error al guardar concepto:', err);
      toast.error(err.response?.data?.error || 'Error al guardar concepto');
    }
  };

  const handleDeleteConcepto = async (id) => {
    if (!window.confirm('¿Eliminar este concepto?')) return;
    try {
      await axios.delete(`/admin/conceptos-movimiento/${id}`);
      toast.success('Concepto eliminado');
      cargarDatos();
    } catch (err) {
      console.error('Error al eliminar concepto:', err);
      toast.error(err.response?.data?.error || 'Error al eliminar concepto');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Cargando comprobantes...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-section">
        <div className="section-header">
          <h2><IconReceipt /> Ingresos y Egresos</h2>
          <button className="btn btn-primary" onClick={abrirNuevoComprobante}>
            <IconPlus /> Nuevo Comprobante
          </button>
        </div>

        {/* Totales */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-card__label"><IconArrowUpCircle /> Total Ingresos</div>
            <div className="metric-card__value">{formatMoney(totalIngresos)}</div>
          </div>
          <div className="metric-card metric-card--danger">
            <div className="metric-card__label"><IconArrowDownCircle /> Total Egresos</div>
            <div className="metric-card__value">{formatMoney(totalEgresos)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-card__label"><IconReceipt /> Saldo</div>
            <div className="metric-card__value">{formatMoney(totalIngresos - totalEgresos)}</div>
          </div>
        </div>

        {/* Tabs Ingresos / Egresos */}
        <div className="admin-tabs">
          <button
            className={`admin-tab-btn ${tipoActivo === 'ingreso' ? 'is-active' : ''}`}
            onClick={() => cambiarTipoActivo('ingreso')}
          >
            <IconArrowUpCircle /> Ingresos
          </button>
          <button
            className={`admin-tab-btn ${tipoActivo === 'egreso' ? 'is-active' : ''}`}
            onClick={() => cambiarTipoActivo('egreso')}
          >
            <IconArrowDownCircle /> Egresos
          </button>
        </div>

        {/* Conceptos */}
        <div style={{ margin: '20px 0 30px' }}>
          <div className="section-header" style={{ marginBottom: 10 }}>
            <h3 className="admin-subtitle"><IconTag /> Conceptos de {tipoActivo === 'ingreso' ? 'ingreso' : 'egreso'} ({conceptosDelTipo.length})</h3>
            <button className="btn btn-secondary btn-sm" onClick={abrirNuevoConcepto}>
              <IconPlus /> Concepto
            </button>
          </div>
          {conceptosDelTipo.length === 0 ? (
            <div className="admin-empty-state">
              <p>No hay conceptos de {tipoActivo} todavía. Crea uno para poder registrar comprobantes.</p>
            </div>
          ) : (
            <div className="categoria-pills">
              {conceptosDelTipo.map((concepto) => (
                <div key={concepto.id} className="categoria-pill-group">
                  <span className="categoria-pill">{concepto.nombre}</span>
                  <button
                    onClick={() => handleEditConcepto(concepto)}
                    className="categoria-pill-icon-btn categoria-pill-icon-btn--edit"
                    title="Editar concepto"
                  >
                    <IconEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteConcepto(concepto.id)}
                    className="categoria-pill-icon-btn categoria-pill-icon-btn--delete"
                    title="Eliminar concepto"
                  >
                    <IconClose />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comprobantes */}
        <div>
          <h3 className="admin-subtitle">
            <IconReceipt /> Comprobantes de {tipoActivo === 'ingreso' ? 'ingreso' : 'egreso'} ({comprobantesDelTipo.length})
          </h3>
          {comprobantesDelTipo.length === 0 ? (
            <div className="admin-empty-state">
              <p>No hay comprobantes registrados todavía.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Fecha</th>
                    <th>Concepto</th>
                    <th>Beneficiario</th>
                    <th>Monto</th>
                    <th>Método</th>
                    <th>Adjunto</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {comprobantesPagina.map((c) => (
                    <tr key={c.id}>
                      <td>{tipoActivo === 'ingreso' ? 'ING' : 'EGR'}-{String(c.id).padStart(6, '0')}</td>
                      <td>{c.fecha ? c.fecha.slice(0, 10) : '-'}</td>
                      <td>{c.concepto_nombre || '-'}</td>
                      <td>{c.beneficiario || '-'}</td>
                      <td>{formatMoney(c.monto)}</td>
                      <td>{c.metodo_pago_nombre || '-'}</td>
                      <td>
                        {c.adjunto_url ? (
                          <a href={c.adjunto_url} target="_blank" rel="noopener noreferrer">Ver</a>
                        ) : '-'}
                      </td>
                      <td>
                        <div className="mesa-actions">
                          <button className="btn btn-sm btn-secondary" onClick={() => setComprobanteImpresion(c)}>
                            <IconPrinter /> Reimprimir
                          </button>
                          <button className="btn btn-sm btn-warning" onClick={() => handleEdit(c)}>
                            <IconEdit /> Editar
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>
                            <IconTrash /> Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {comprobantesDelTipo.length > COMPROBANTES_POR_PAGINA && (
            <div className="admin-pagination">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                disabled={paginaSegura === 1}
              >
                Anterior
              </button>
              <span className="admin-pagination__info">
                Página {paginaSegura} de {totalPaginas}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaSegura === totalPaginas}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

        {/* Modal Comprobante */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content modal-content--wide" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingId ? 'Editar' : 'Nuevo'} Comprobante de {tipoActivo === 'ingreso' ? 'Ingreso' : 'Egreso'}</h3>
                <button className="btn-close" onClick={() => setShowModal(false)}><IconClose /></button>
              </div>
              <form onSubmit={handleSubmit} encType="multipart/form-data">
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div className="form-group">
                      <label>Concepto *</label>
                      <select name="concepto_id" value={formData.concepto_id} onChange={handleInputChange} required>
                        <option value="">Seleccione un concepto</option>
                        {conceptosDelTipo.map((concepto) => (
                          <option key={concepto.id} value={concepto.id}>{concepto.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Fecha *</label>
                      <input type="date" name="fecha" value={formData.fecha} onChange={handleInputChange} required />
                    </div>

                    <div className="form-group">
                      <label>Monto *</label>
                      <input type="number" name="monto" value={formData.monto} onChange={handleInputChange} min="0.01" step="0.01" required />
                    </div>

                    <div className="form-group">
                      <label>Beneficiario</label>
                      <input
                        type="text"
                        name="beneficiario"
                        value={formData.beneficiario}
                        onChange={handleInputChange}
                        placeholder={tipoActivo === 'ingreso' ? 'Quién entrega el dinero' : 'A quién se le paga'}
                      />
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div className="form-group">
                      <label>Método de pago</label>
                      <select name="metodo_pago_id" value={formData.metodo_pago_id} onChange={handleInputChange}>
                        <option value="">Sin especificar</option>
                        {metodosPago.map((mp) => (
                          <option key={mp.id} value={mp.id}>{mp.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Referencia</label>
                      <input type="text" name="referencia" value={formData.referencia} onChange={handleInputChange} placeholder="N° de transferencia, cheque..." />
                    </div>

                    <div className="form-group">
                      <label>Observaciones</label>
                      <textarea name="observaciones" value={formData.observaciones} onChange={handleInputChange} rows="3" />
                    </div>

                    <div className="form-group">
                      <label>Adjunto (foto o PDF del soporte)</label>
                      <input type="file" name="adjunto" accept="image/*,application/pdf" onChange={handleInputChange} />
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <IconCheck /> {editingId ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Concepto */}
        {showConceptoModal && (
          <div className="modal-overlay" onClick={() => setShowConceptoModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingConceptoId ? 'Editar' : 'Nuevo'} Concepto</h3>
                <button className="btn-close" onClick={() => setShowConceptoModal(false)}><IconClose /></button>
              </div>
              <form onSubmit={handleSubmitConcepto}>
                <div className="form-group">
                  <label>Nombre *</label>
                  <input type="text" name="nombre" value={conceptoForm.nombre} onChange={handleConceptoChange} required />
                </div>

                <div className="form-group">
                  <label>Tipo *</label>
                  <select name="tipo" value={conceptoForm.tipo} onChange={handleConceptoChange} required>
                    <option value="ingreso">Ingreso</option>
                    <option value="egreso">Egreso</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Sede</label>
                  <select name="sede_id" value={conceptoForm.sede_id} onChange={handleConceptoChange}>
                    <option value="">Todas mis sedes</option>
                    {sedes.map((sede) => (
                      <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea name="descripcion" value={conceptoForm.descripcion} onChange={handleConceptoChange} rows="3" />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowConceptoModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <IconCheck /> {editingConceptoId ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ComprobanteImpresion
          show={!!comprobanteImpresion}
          onHide={() => setComprobanteImpresion(null)}
          comprobante={comprobanteImpresion}
          sede={sedes.find((s) => s.id === Number(comprobanteImpresion?.sede_id || usuario?.sedeId))}
        />
      </div>
    </AdminLayout>
  );
};

export default ConfiguracionComprobantes;
