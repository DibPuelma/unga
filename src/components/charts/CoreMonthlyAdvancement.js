import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import moment from 'moment';
import { useTheme } from '@mui/material';
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
);

ChartJS.unregister(
  ChartDataLabels,
);

export default function CoreMonthlyAdvancement({
  student,
  monthlyValues,
  bestInClassAdvancement,
  worstInClassAdvancement,
}) {
  const theme = useTheme();
  const labels = moment.monthsShort();
  const hasBest = bestInClassAdvancement.length > 0
  const hasWorst = worstInClassAdvancement.length > 0

  const generateDatasets = () => {
    const datasets = [{
      label: student.firstName,
      type: 'bar',
      data: monthlyValues,
      backgroundColor: theme.palette.primary.main,
      order: 2,
    }];
    if (hasBest) {
      datasets.push({
        label: 'Máximo',
        type: 'line',
        data: bestInClassAdvancement,
        backgroundColor: theme.palette.success.main,
        order: 1,
      });
    }
    if (hasWorst) {
      datasets.push({
        label: 'Mínimo',
        type: 'line',
        data: worstInClassAdvancement,
        backgroundColor: theme.palette.error.main,
        order: 0,
      });
    }

    return datasets;
  }

  const options = {
    responsive: true,
    scales: {
      yAxis: {
        display: false,
        grid: {
          display: false,
        },
        min: 0,
        max: 100,
      },
      xAxis: {
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: hasBest || hasWorst
      },
      title: {
        display: false,
      },
      datalabels: {
        display: false,
      },
    },
    maintainAspectRatio: false
  };

  const data = {
    labels,
    datasets: generateDatasets()
  };

  return (
    <Chart
      data={data}
      options={options}
    />
  )
}