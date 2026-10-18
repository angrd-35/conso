<script setup lang="ts">
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import type { ConsumptionPoint } from '../api/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

const props = defineProps<{ history: ConsumptionPoint[] }>()

const hasEthanol = computed(() => props.history.some((p) => p.ethanolRate !== null))

const chartData = computed(() => ({
  labels: props.history.map((p) => new Date(p.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })),
  datasets: [
    {
      label: 'L/100km',
      data: props.history.map((p) => p.consumptionL100),
      borderColor: '#4f46e5',
      backgroundColor: '#4f46e5',
      tension: 0.3,
      pointRadius: 3,
      yAxisID: 'y',
    },
    ...(hasEthanol.value
      ? [
          {
            label: 'Éthanol (%)',
            data: props.history.map((p) => p.ethanolRate),
            borderColor: '#16a34a',
            backgroundColor: '#16a34a',
            borderDash: [5, 4],
            tension: 0.3,
            pointRadius: 3,
            spanGaps: true,
            yAxisID: 'y1',
          },
        ]
      : []),
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: hasEthanol.value },
  },
  scales: {
    y: { beginAtZero: false, title: { display: true, text: 'L/100km' } },
    ...(hasEthanol.value
      ? {
          y1: {
            position: 'right' as const,
            min: 0,
            max: 100,
            grid: { drawOnChartArea: false },
            title: { display: true, text: '% éthanol' },
          },
        }
      : {}),
  },
}))
</script>

<template>
  <div class="h-48">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
