import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/vehicles' },
    {
      path: '/vehicles',
      name: 'vehicles',
      component: () => import('../views/VehiclesListView.vue'),
    },
    {
      path: '/vehicles/:id',
      name: 'vehicle-detail',
      component: () => import('../views/VehicleDetailView.vue'),
      props: true,
    },
    {
      path: '/vehicles/:id/fillups/new',
      name: 'fillup-new',
      component: () => import('../views/FillUpFormView.vue'),
      props: true,
    },
    {
      path: '/vehicles/:id/fillups/:fillUpId/edit',
      name: 'fillup-edit',
      component: () => import('../views/FillUpFormView.vue'),
      props: true,
    },
    {
      path: '/vehicles/:id/import',
      name: 'fillups-import',
      component: () => import('../views/ImportCsvView.vue'),
      props: true,
    },
    {
      path: '/fuel-types',
      name: 'fuel-types',
      component: () => import('../views/FuelTypesView.vue'),
    },
  ],
})

export default router
