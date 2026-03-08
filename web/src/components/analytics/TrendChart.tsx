"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { TrendData } from "@/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface TrendChartProps {
  data: TrendData[];
}

export default function TrendChart({ data }: TrendChartProps) {
  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: "Reports",
        data: data.map((d) => d.count),
        borderColor: "hsl(210, 100%, 40%)",
        backgroundColor: "hsla(210, 100%, 40%, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index" as const, intersect: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxTicksLimit: 7, font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, font: { size: 11 } },
      },
    },
    maintainAspectRatio: true,
    aspectRatio: 2,
  };

  return <Line data={chartData} options={options} />;
}
