import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ATTENDANCE_TYPES, ATTENDANCE_TYPES_TO_COLOR, ATTENDANCE_TYPES_TO_SPANISH } from 'db/attendance';
import moment from 'moment-timezone';
import { Stack, useMediaQuery, useTheme } from '@mui/material';
import AttendanceGraphLabels from './AttendanceGraphLabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function AttendanceMonthsLineGraph({ attendanceAnalyticsByMonth, onFinishRender, width }) {
  const theme = useTheme();
  const smUp = useMediaQuery((theme) => theme.breakpoints.up('sm'), { noSsr: true });
  const labels = moment.months().map((month) => `${month[0].toLocaleUpperCase()}${month.slice(1)}`);
  const valuesByMonth = Object.entries(attendanceAnalyticsByMonth)
    .map(([month, values]) => ({ month, ...values }))
    .sort((a, b) => a.month - b.month);

  const data = useMemo(() => ({
    labels,
    datasets: ATTENDANCE_TYPES.map((type) => {
      const colorKey = ATTENDANCE_TYPES_TO_COLOR[type];
      const color = colorKey ? theme.palette[colorKey].light : theme.palette.grey[400];
      return ({
        label: ATTENDANCE_TYPES_TO_SPANISH[type],
        data: valuesByMonth.map((valuesOfMonth) => (valuesOfMonth[`${type}Percentage`] * 100).toFixed(2)),
        borderColor: color,
        backgroundColor: color,
      })
    })
  }), [attendanceAnalyticsByMonth]);

  const options = useMemo(() => ({
    aspectRatio: smUp || onFinishRender ? 5 : 1.5,
    responsive: true,
    animation: {
      onComplete: function () {
        if (onFinishRender) {
          onFinishRender();
        }
      },
    },
    plugins: {
      legend: false,
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        grid: {
          display: false,
          drawBorder: false
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
      },
    },
    elements: {
      line: {
        tension: 0
      },
    },
  }), [attendanceAnalyticsByMonth]);

  return (
    <Stack alignItems="center" spacing={1}>
      <AttendanceGraphLabels />
      <Line options={options} data={data} width={width} />
    </Stack>
  )
}