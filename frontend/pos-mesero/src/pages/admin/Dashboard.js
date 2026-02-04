import VentasPorDiaChart from '../../components/charts/VentasPorDiaChart';
import React, { useEffect, useState } from 'react';
import axios from '../../services/api';
import AdminLayout from './AdminLayout';
import { formatMoney } from '../../utils/formatters';
import './Dashboard.css';

const Dashboard = () => {

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rango, setRango] = useState('hoy'); // 'hoy' o '30'

  useEffect(() => {
    cargarEstadisticas(rango);
    // eslint-disable-next-line
  }, [rango]);

  const cargarEstadisticas = async (rangoSel = 'hoy') => {
    setLoading(true);
    try {
      const response = await axios.get(`/admin/informes/estadisticas?rango=${rangoSel === '30' ? '30' : ''}`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Cargando estadísticas...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="dashboard">
        <h2>Dashboard</h2>

        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <button
            className={rango === 'hoy' ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ fontWeight: 'bold', borderRadius: 8, padding: '8px 18px', fontSize: 16 }}
            onClick={() => setRango('hoy')}
          >
            Hoy
          </button>
          <button
            className={rango === '30' ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ fontWeight: 'bold', borderRadius: 8, padding: '8px 18px', fontSize: 16 }}
            onClick={() => setRango('30')}
          >
            Últimos 30 días
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>Ventas {rango === '30' ? '(30 días)' : '(Hoy)'}</h3>
              <p className="stat-value">{formatMoney(stats?.ventas_hoy, true)}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h3>Órdenes {rango === '30' ? '(30 días)' : '(Hoy)'}</h3>
              <p className="stat-value">{stats?.ordenes_hoy}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🪑</div>
            <div className="stat-content">
              <h3>Mesas Activas</h3>
              <p className="stat-value">{stats?.mesas_activas}</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <h3>Insumos Bajo Stock</h3>
              <p className="stat-value">{stats?.insumos_bajo_stock}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>Ticket Promedio</h3>
              <p className="stat-value">{formatMoney(stats?.ticket_promedio, true)}</p>
            </div>
          </div>
        </div>

        {/* Gráfico de barras de ventas por día */}
        <VentasPorDiaChart rango={rango} />

        {/* Acciones rápidas eliminadas por solicitud */}
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
