import React from "react";
import {
  Chart as ChartJS,
  TimeScale,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { MatrixController, MatrixElement } from "chartjs-chart-matrix";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  MatrixController,
  MatrixElement,
  TimeScale,
  CategoryScale,
  LinearScale,
);

ChartJS.unregister(
  ChartDataLabels,
);


import { Chart } from "react-chartjs-2";

export default function Matrix(props) {
  return (
    <Chart type="matrix" {...props} />
  )
}