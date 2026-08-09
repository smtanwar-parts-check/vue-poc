import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/parts' },
    {
      path: '/parts',
      name: 'parts',
      component: () => import('@/features/parts/PartsManagerPage.vue'),
      meta: { title: 'Parts Manager · PartsCheck' },
    },
  ],
})

router.afterEach((to) => {
  if (typeof to.meta.title === 'string') {
    document.title = to.meta.title
  }
})

export default router
