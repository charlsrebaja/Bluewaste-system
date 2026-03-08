"use client";

import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { CategoryData, WASTE_CATEGORY_LABELS } from "@/types";

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryPieChartProps {
  data: CategoryData[];
}

const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#8b5cf6",
  "#f97316",
  "#6b7280",
];

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  const chartData = {
    labels: data.map((d) => WASTE_CATEGORY_LABELS[d.category]),
    datasets: [
      {
        data: data.map((d) => d.count),
        backgroundColor: COLORS.slice(0, data.length),
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { font: { size: 11 }, padding: 15 },
      },
    },
    maintainAspectRatio: true,
    aspectRatio: 1.5,
  };

  return <Doughnut data={chartData} options={options} />;
}
