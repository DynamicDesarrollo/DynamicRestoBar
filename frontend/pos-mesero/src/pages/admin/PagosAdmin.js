import React, { useEffect, useState } from 'react';
import axios from '../../services/api';
import styles from './PagosAdmin.module.css';
import { IconWallet } from '../../components/Icons';

const PagosAdmin = () => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPagos();
  }, []);

  const fetchPagos = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/pagos-clientes');
      setPagos(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (err) {
      setError('Error al cargar pagos');
    }
    setLoading(false);
  };

  return (
    <div className={styles.pagosCard}>
      <h2 className={styles.pagosHeader}><IconWallet /> Gestión de Pagos de Clientes</h2>
      <p className={styles.pagosSubtitle}>Aquí puedes gestionar y ver el historial de pagos de los clientes.</p>

      {loading ? (
        <div className={styles.pagosLoading}>
          <div className="rb-spinner" style={{ width: 22, height: 22 }} />
          Cargando pagos...
        </div>
      ) : error ? (
        <div className={styles.pagosError}>{error}</div>
      ) : (
        <table className={styles.pagosTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Monto</th>
              <th>Fecha</th>
              <th>Método</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pagos.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.pagosEmpty}>No hay pagos registrados.</td>
              </tr>
            ) : (
              pagos.map((pago) => (
                <tr key={pago.id}>
                  <td>{pago.id}</td>
                  <td>{pago.cliente_nombre || pago.cliente_id}</td>
                  <td>{pago.monto}</td>
                  <td>{pago.fecha_pago}</td>
                  <td>{pago.metodo_pago}</td>
                  <td>{/* Acciones futuras: editar/eliminar */}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PagosAdmin;