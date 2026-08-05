import React, { useState } from 'react';
import styles from './SuperAdminMetricas.module.css';
import PieChart from '../../components/PieChart';
import BarChart from '../../components/BarChart';


// Datos simulados de clientes
const metricas = {
  total: 18,
  activos: 12,
  suspendidos: 3,
  vencidos: 3,
  cambioMes: '+2%',
};
const estados = ['Activo', 'Suspendido', 'Vencido'];
const estadoData = [metricas.activos, metricas.suspendidos, metricas.vencidos];
const zonas = ['Centro', 'Norte', 'Sur', 'Este', 'Oeste'];
const zonaData = [5, 4, 3, 3, 3];

const SuperAdminMetricas = () => {
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.filtrosRow}>
        <div>
          <label>Fecha Alta Desde</label>
          <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
        </div>
        <div>
          <label>Fecha Alta Hasta</label>
          <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
        </div>
        <button className={styles.filtrarBtn}>Filtrar</button>
      </div>
      <div className={styles.metricasRow}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Total de Clientes</div>
          <div className={styles.metricValue}>{metricas.total}</div>
          <div className={styles.metricChange}>{metricas.cambioMes} este mes</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Activos</div>
          <div className={styles.metricValue}>{metricas.activos}</div>
          <div className={styles.metricChange}>66.7%</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Suspendidos</div>
          <div className={styles.metricValue}>{metricas.suspendidos}</div>
          <div className={styles.metricChange}>16.7%</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Vencidos</div>
          <div className={styles.metricValue}>{metricas.vencidos}</div>
          <div className={styles.metricChange}>16.7%</div>
        </div>
      </div>
      <div className={styles.graficosRow}>
        <div className={styles.graficoCard}>
          <div className={styles.graficoTitle}>Distribución por Estado</div>
          <PieChart data={estadoData} labels={estados} />
        </div>
        <div className={styles.graficoCard}>
          <div className={styles.graficoTitle}>Clientes por Zona</div>
          <BarChart labels={zonas} data={zonaData} />
        </div>
      </div>
    </div>
  );
};

export default SuperAdminMetricas;
