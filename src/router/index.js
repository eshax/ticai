// router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import StockCard from '../components/StockCard.vue';  // 对应卡片视图组件
import StockTable from '../components/StockTable.vue'; // 对应表格视图组件

const routes = [
  { 
    path: '/stock-card', 
    name: 'StockCard',
    component: StockCard,
    meta: { title: '卡片视图' }
  },
  { 
    path: '/stock-table', 
    name: 'StockTable',
    component: StockTable,
    meta: { title: '表格视图' }
  },
  { 
    path: '/', 
    redirect: '/stock-card'  // 默认显示卡片视图
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;