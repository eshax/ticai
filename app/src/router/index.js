// router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import KPL from '@/components/KPL.vue';
import XGT from '../components/XGT.vue';

const routes = [
  { 
    path: '/kpl', 
    name: 'kpl',
    component: KPL,
    meta: { title: '开盘啦' }
  },
  { 
    path: '/xgt', 
    name: 'xgt',
    component: XGT,
    meta: { title: '选股通' }
  },
  { 
    path: '/', 
    redirect: '/kpl'  // 默认显示列表视图
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 全局前置守卫，用于设置页面标题
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title;
  }
  next();
});

export default router;