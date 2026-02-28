import React, { useEffect, useMemo } from 'react';
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
  LineController,
  BarController,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import moment from 'moment';
import { useMediaQuery, useTheme } from '@mui/material';
import { capitalize } from 'lodash';
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
  LineController,
  BarController,
  ChartDataLabels,
);

export default function ClassroomMonthlyAdvancementInCore({ coreWithMonthlyAdvancement }) {
  const advancementData = useMemo(() => Object.values(coreWithMonthlyAdvancement.advancementByMonth), [coreWithMonthlyAdvancement])
  const advancementByMonth = useMemo(() => advancementData.map((advancement) => (advancement.advancement * 100).toFixed(0)), [advancementData])
  const evaluationsByMonth = useMemo(() =>
    advancementData.map(
      (advancement) => (advancement.totalEvaluations / advancement.possibleEvaluations * 100).toFixed(0)
    ), [advancementData])
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'));
  const labels = Object.keys(coreWithMonthlyAdvancement.advancementByMonth).map((month) => capitalize(moment(month).format('MMMM')));

  const generateDatasets = () => {
    const datasets = [
      {
        label: 'Desempeño',
        type: 'line',
        data: advancementByMonth,
        backgroundColor: theme.palette.primary.main,
        order: 0,
      },
      {
        label: 'Evaluaciones',
        type: 'bar',
        data: evaluationsByMonth,
        backgroundColor: theme.palette.secondary.main,
        order: 1,
      }
    ];
    return datasets;
  }

  const options = {
    aspectRatio: smUp ? 7 : 2,
    scales: {
      yAxis: {
        grid: {
          display: false,
        },
        min: 0,
        max: 100,
      },
    },
    plugins: {
      datalabels: {
        display: true,
        color: "black",
        formatter: function(value, context) {
          return `${value}%`;
        },
        anchor: "top",
        align: "end",
        offset: 10,
      }
    }
  };

  const data = {
    labels,
    datasets: generateDatasets()
  };

  return (
    <Chart
      className="canvas"
      type="bar"
      data={data}
      options={options}
    />
  )
}