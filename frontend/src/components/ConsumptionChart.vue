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
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    y: { beginAtZero: false },
  },
}
</script>

<template>
  <div class="h-48">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
