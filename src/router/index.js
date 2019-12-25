import Vue from 'vue';
import VueRouter from 'vue-router';
import Identities from '@/views/Identities.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/identities',
    name: 'identities',
    component: Identities,
  },
  {
    path: '/contracts',
    name: 'contracts',
    component: () => import(/* webpackChunkName: "contracts" */ '../views/Contracts.vue'),
  },
  {
    path: '/documents',
    name: 'documents',
    component: () => import(/* webpackChunkName: "documents" */ '../views/Documents.vue'),
  },
  {
    path: '/names',
    name: 'names',
    component: () => import(/* webpackChunkName: "names" */ '../views/Names.vue'),
  },
  {
    path: '*',
    redirect: 'identities',
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

export default router;
