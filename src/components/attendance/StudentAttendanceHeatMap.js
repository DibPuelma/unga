import { Box, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { ATTENDANCE_TYPES, ATTENDANCE_TYPES_TO_COLOR, ATTENDANCE_TYPES_TO_SPANISH } from 'db/attendance';
import moment from 'moment-timezone';
import dynamic from 'next/dynamic';
import 'chartjs-adapter-moment';
import { useEffect, useMemo, useState } from 'react';
import UngaCircularProgress from '../utils/UngaCircularProgress';
import AttendanceGraphLabels from './AttendanceGraphLabels';

const Matrix = dynamic(
  () => import('../charts/Matrix'),
  { ssr: false }
);

export default function StudentAttendanceHeatMap({ attendanceAnalyticsByDate, onFinishRender, width }) {
  const [yAxisLabels, setYAxisLabels] = useState(null);
  const [xAxisLabels] = useState([
    '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
    '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
    '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
    '31',
  ]);
  const [data, setData] = useState(null);
  const theme = useTheme();
  const smUp = useMediaQuery((theme) => theme.breakpoints.up('sm'))
  const monthFormat = smUp ? 'MMMM YYYY' : 'MMM YY';

  useEffect(() => {
    setData(generateData());
  }, [attendanceAnalyticsByDate])

  const generateData = () => {
    const data = [];
    const months = new Set();
    Object.entries(attendanceAnalyticsByDate).forEach(([date, values], i) => {
      const momentDate = moment(date);
      months.add(momentDate.format(monthFormat));
      if (values) {
        const attendaceType = ATTENDANCE_TYPES.find((type) => values[`${type}Percentage`] === 1);
        data.push({
          x: momentDate.format('DD'),
          y: momentDate.format(monthFormat),
          date: momentDate.format('dddd DD [de] MMMM'),
          type: attendaceType,
        });
      } else {
        data.push({
          x: momentDate.format('DD'),
          y: momentDate.format(monthFormat),
          date: momentDate.format('dddd DD [de] MMMM'),
          type: 'notRegistered',
        });
      }
    })
    setYAxisLabels([...months].reverse());
    return data;
  }

  const graphData = {
    datasets: [{
      label: 'My Matrix',
      data,
      backgroundColor(c) {
        const type = c.dataset.data[c.dataIndex].type;
        const color = ATTENDANCE_TYPES_TO_COLOR[type];
        const hexColor = color ? theme.palette[color].light : theme.palette.grey[400];
        return hexColor
      },
      borderColor(c) {
        const type = c.dataset.data[c.dataIndex].type;
        const color = ATTENDANCE_TYPES_TO_COLOR[type];
        const hexColor = color ? theme.palette[color].main : theme.palette.grey[600];
        return hexColor
      },
      borderWidth: 1,
      hoverBackgroundColor(c) {
        const type = c.dataset.data[c.dataIndex].type;
        const color = ATTENDANCE_TYPES_TO_COLOR[type];
        const hexColor = color ? theme.palette[color].dark : theme.palette.grey[600];
        return hexColor
      },
      width(c) {
        const a = c.chart.chartArea || {};
        return (a.right - a.left) / 31 - 1;
      },
      height(c) {
        const a = c.chart.chartArea || {};
        return (a.bottom - a.top) / 12 - 1;
      }
    }]
  };

  if (!yAxisLabels || !xAxisLabels) return <UngaCircularProgress />;

  const scales = {
    y: {
      type: 'category',
      labels: yAxisLabels,
      offset: true,
      position: 'left',
      ticks: {
        maxRotation: 0,
        padding: 10,
        font: {
          size: 9
        }
      },
      grid: {
        display: false,
        drawBorder: false,
        tickLength: 0
      }
    },
    x: {
      type: 'category',
      labels: xAxisLabels,
      position: 'top',
      offset: true,
      ticks: {
        padding: 10,
        maxRotation: 0,
        font: {
          size: 9
        }
      },
      grid: {
        display: false,
        drawBorder: false,
        tickLength: 0,
      }
    }
  };

  const options = {
    aspectRatio: smUp || onFinishRender ? 3 : 1,
    animation: {
      duration: 0,
      onComplete: function () {
        if (onFinishRender) {
          onFinishRender();
        }
      },
    },
    plugins: {
      legend: false,
      tooltip: {
        displayColors: false,
        callbacks: {
          title() {
            return '';
          },
          label(context) {
            const v = context.dataset.data[context.dataIndex];
            return [v.date, ATTENDANCE_TYPES_TO_SPANISH[v.type]];
          }
        }
      },
    },
    scales,
    layout: {
      padding: {
        top: 10
      }
    },
    parsing: {
      xAxisKey: 'x',
      yAxisKey: 'y'
    }
  };

  return (
    <Stack overflow="scroll" alignItems="center">
      <AttendanceGraphLabels />
      <Matrix
        id='attendance-matrix-canvas'
        data={graphData}
        options={options}
        width={width}
      />
    </Stack>
  )
}