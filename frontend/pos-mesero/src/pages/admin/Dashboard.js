import VentasPorDiaChart from '../../components/charts/VentasPorDiaChart';
import React, { useEffect, useState } from 'react';
import axios from '../../services/api';
import AdminLayout from './AdminLayout';
import { formatMoney } from '../../utils/formatters';
import {
  IconWallet, IconReceipt, IconTable, IconAlertTriangle, IconTrendingUp,
} from '../../components/Icons';
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
        <div className="dashboard__loading">
          <div className="rb-spinner" aria-label="Cargando estadísticas" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="dashboard">
        <div className="dashboard__header">
          <h2 className="dashboard__title">Dashboard</h2>

          <div className="dashboard__range-switch" role="tablist" aria-label="Rango de fechas">
            <button
              type="button"
              role="tab"
              aria-selected={rango === 'hoy'}
              className={`dashboard__range-btn ${rango === 'hoy' ? 'is-active' : ''}`}
              onClick={() => setRango('hoy')}
            >
              Hoy
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={rango === '30'}
              className={`dashboard__range-btn ${rango === '30' ? 'is-active' : ''}`}
              onClick={() => setRango('30')}
            >
              Últimos 30 días
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon"><IconWallet /></div>
            <div className="stat-content">
              <h3>Ventas {rango === '30' ? '(30 días)' : '(Hoy)'}</h3>
              <p className="stat-value">{formatMoney(stats?.ventas_hoy, true)}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"><IconReceipt /></div>
            <div className="stat-content">
              <h3>Órdenes {rango === '30' ? '(30 días)' : '(Hoy)'}</h3>
              <p className="stat-value">{stats?.ordenes_hoy}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"><IconTable /></div>
            <div className="stat-content">
              <h3>Mesas Activas</h3>
              <p className="stat-value">{stats?.mesas_activas}</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon"><IconAlertTriangle /></div>
            <div className="stat-content">
              <h3>Insumos Bajo Stock</h3>
              <p className="stat-value">{stats?.insumos_bajo_stock}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"><IconTrendingUp /></div>
            <div className="stat-content">
              <h3>Ticket Promedio</h3>
              <p className="stat-value">{formatMoney(stats?.ticket_promedio, true)}</p>
            </div>
          </div>
        </div>

        {/* Gráfico de barras de ventas por día */}
        <VentasPorDiaChart rango={rango} />
      </div>
    </AdminLayout>
  );
};

export default Dashboard;