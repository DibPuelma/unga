import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { getLevelOfAchievementValueColor } from 'src/helpers/businessLogic';
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

ChartJS.unregister(
  ChartDataLabels,
);

const barThickness = 50;
const backgroundColors = ['rgb(255, 99, 132)', 'rgb(75, 192, 192)', 'rgb(53, 162, 235)', 'rgb(100, 122, 200)'];

export default function LevelOfAchievementDistribution({ levelsOfAchievementDistribution, noLegend }) {
  const distributionEntries = Object.entries(levelsOfAchievementDistribution);
  const maxValue = distributionEntries.reduce((acc, [_, value]) => acc + value.quantity, 0);
  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      title: {
        display: false,
      },
      legend: {
        position: 'top',
        align: 'start',
        display: !noLegend,
      }
    },
    indexAxis: 'y',
    scales: {
      x: {
        offset: false,
        stacked: true,
        grid: {
          display: false,
        },
        display: false,
        max: maxValue,
      },
      y: {
        offset: false,
        stacked: true,
        grid: {
          display: false,
        },
        display: false,
      },
    },
  };

  const totalValues = distributionEntries.length - 1;
  const datasets = distributionEntries.map(([key, value], i) => {
    return {
      label: `${value.quantity} ${key}`,
      data: [value.quantity],
      barThickness,
      backgroundColor: i < totalValues
        ? getLevelOfAchievementValueColor(value.achievementValue, totalValues)
        : '#c4c4c4',
    }
  })
  const data = {
    labels: [''],
    datasets,
  }

  return <Bar options={options} data={data} />;
}
