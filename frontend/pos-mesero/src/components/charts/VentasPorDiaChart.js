import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import axios from '../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CREAM_MUTED = '#b7a78e';
const CHARCOAL_GRID = 'rgba(51, 39, 27, 0.6)';
const GOLD = '#c99a46';
const GOLD_LIGHT = '#e3b565';

const VentasPorDiaChart = ({ rango = 'hoy' }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`/admin/informes/ventas-por-dia?rango=${rango === '30' ? '30' : ''}`)
      .then((res) => {
        if (res.data.success) {
          const labels = res.data.data.map((row) => row.fecha);
          const valores = res.data.data.map((row) => parseFloat(row.total));
          setData({ labels, valores });
        }
        setLoading(false);
      });
  }, [rango]);

  return (
    <div className="chart-card">
      <h3>Ventas por día (últimos 30 días)</h3>

      {loading ? (
        <div className="chart-card__loading">Cargando gráfico...</div>
      ) : !data ? (
        <div className="chart-card__empty">No hay datos de ventas.</div>
      ) : (
        <Bar
          data={{
            labels: data.labels,
            datasets: [
              {
                label: 'Ventas ($)',
                data: data.valores,
                backgroundColor: GOLD,
                hoverBackgroundColor: GOLD_LIGHT,
                borderRadius: 6,
                maxBarThickness: 40,
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false },
              title: { display: false },
              tooltip: {
                backgroundColor: '#1a130e',
                titleColor: '#f7f1e6',
                bodyColor: '#e3b565',
                borderColor: '#33271b',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
              },
            },
            scales: {
              x: {
                grid: { color: CHARCOAL_GRID, drawTicks: false },
                ticks: { color: CREAM_MUTED, font: { family: 'Inter' } },
              },
              y: {
                beginAtZero: true,
                grid: { color: CHARCOAL_GRID, drawTicks: false },
                ticks: { color: CREAM_MUTED, font: { family: 'Inter' } },
              },
            },
          }}
          height={80}
        />
      )}
    </div>
  );
};

export default VentasPorDiaChart;