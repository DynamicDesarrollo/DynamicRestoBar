import React, { useEffect, useState } from 'react';
import axios from 'axios';

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
      const response = await axios.get('/api/v1/pagos-clientes');
      setPagos(response.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar pagos');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Gestión de Pagos de Clientes</h2>
      <p>Aquí puedes gestionar y ver el historial de pagos de los clientes.</p>
      {loading ? (
        <div>Cargando pagos...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>ID</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Cliente</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Monto</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Fecha</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Método</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pagos.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '16px' }}>No hay pagos registrados.</td>
              </tr>
            ) : (
              pagos.map((pago) => (
                <tr key={pago.id}>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{pago.id}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{pago.cliente_nombre || pago.cliente_id}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{pago.monto}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{pago.fecha_pago}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{pago.metodo_pago}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                    {/* Acciones futuras: editar/eliminar */}
                  </td>
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
