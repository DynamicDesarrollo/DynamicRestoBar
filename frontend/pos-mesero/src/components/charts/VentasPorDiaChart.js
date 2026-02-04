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


const VentasPorDiaChart = ({ rango = 'hoy' }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`/admin/informes/ventas-por-dia?rango=${rango === '30' ? '30' : ''}`)
      .then(res => {
        if (res.data.success) {
          const labels = res.data.data.map(row => row.fecha);
          const valores = res.data.data.map(row => parseFloat(row.total));
          setData({ labels, valores });
        }
        setLoading(false);
      });
  }, [rango]);

  if (loading) return <div>Cargando gráfico...</div>;
  if (!data) return <div>No hay datos de ventas.</div>;

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 32 }}>
      <h3 style={{ marginBottom: 16 }}>Ventas por Día (últimos 30 días)</h3>
      <Bar
        data={{
          labels: data.labels,
          datasets: [
            {
              label: 'Ventas ($)',
              data: data.valores,
              backgroundColor: '#2563eb',
              borderRadius: 6,
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: {
            legend: { display: false },
            title: { display: false },
          },
          scales: {
            y: { beginAtZero: true },
          },
        }}
        height={80}
      />
    </div>
  );
};

export default VentasPorDiaChart;
