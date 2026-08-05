// PieChart.js
import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
Chart.register(ArcElement, Tooltip, Legend);

export default function PieChart({ data, labels }) {
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: ['#22c55e', '#f59e42', '#e53935'],
        borderWidth: 1,
      },
    ],
  };
  return <Pie data={chartData} />;
}
