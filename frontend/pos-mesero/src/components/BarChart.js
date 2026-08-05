// BarChart.js
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function BarChart({ labels, data }) {
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Peticiones',
        data,
        backgroundColor: '#30488b',
      },
    ],
  };
  return <Bar data={chartData} options={{
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { color: '#22336b' } }, y: { ticks: { color: '#22336b' } } }
  }} />;
}
