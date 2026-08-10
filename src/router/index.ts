import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/api-explorer' },
    {
      path: '/api-explorer',
      name: 'api-explorer',
      component: () => import('@/features/api-explorer/ApiExplorerPage.vue'),
      meta: { title: 'API Explorer · PartsCheck' },
    },
    {
      path: '/stress-test',
      name: 'stress-test',
      component: () => import('@/features/parts/PartsManagerPage.vue'),
      meta: { title: 'Parts Manager (Stress Test) · PartsCheck' },
    },
  ],
})

router.afterEach((to) => {
  if (typeof to.meta.title === 'string') {
    document.title = to.meta.title
  }
})

export default router
