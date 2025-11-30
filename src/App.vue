<template>
  <div class="app-container">
    <!-- 组合按钮 - 固定在页面最上层 -->
    <el-dropdown class="combination-button" trigger="click">
      <el-button type="primary" size="small" class="main-button">
        <i class="fa fa-th-large mr-1"></i>{{ currentDataSource }}
        <i class="fa fa-caret-down ml-1"></i>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="navigateTo('/kpl')">
            <i class="fa fa-th-large mr-1"></i>开盘啦
          </el-dropdown-item>
          <el-dropdown-item @click="navigateTo('/xgt')">
            <i class="fa fa-table mr-1"></i>选股通
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    
    <!-- 路由视图容器 -->
    <router-view />
  </div>
</template>

<script setup>
import { ElButton, ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus';
import { useRouter, useRoute } from 'vue-router';
import { ref, watch } from 'vue';

// 初始化路由
const router = useRouter();
const route = useRoute();

// 当前数据源名称
const currentDataSource = ref('数据源');

// 根据路由路径设置数据源名称
const setDataSourceName = () => {
  const path = route.path;
  if (path === '/kpl') {
    currentDataSource.value = '数据源：开盘啦';
  } else if (path === '/xgt') {
    currentDataSource.value = '数据源：选股通';
  } else {
    currentDataSource.value = '数据源';
  }
};

// 初始化时设置数据源名称
setDataSourceName();

// 监听路由变化
watch(
  () => route.path,
  () => {
    setDataSourceName();
  }
);

// 导航方法
const navigateTo = (path) => {
  router.push(path);
};
</script>

<style scoped>
.app-container {
  min-height: 98vh;
  background-color: #f0f2f5;
  position: relative;
  padding: 0;
  margin: 0;
}

/* 组合按钮样式 - 固定在右上角并保持在最上层 */
.combination-button {
  position: fixed;
  top: 14px;
  right: 20px;
  z-index: 9999; /* 最高层级，确保在所有内容之上 */
}

.main-button {
  padding: 5px 10px;
  height: 32px;
  font-size: 13px;
  transition: all 0.2s ease;
}

.main-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 下拉菜单样式优化 */
:deep(.el-dropdown-menu) {
  min-width: 120px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

:deep(.el-dropdown-item) {
  padding: 6px 15px;
  font-size: 13px;
  transition: background-color 0.2s ease;
}

:deep(.el-dropdown-item:hover) {
  background-color: #f5f7fa;
}

/* 路由视图内容样式，避免被按钮遮挡 */
:deep(.router-view) {
  min-height: 100vh;
  padding-top: 20px; /* 为顶部按钮留出空间 */
  padding-left: 20px;
  padding-right: 20px;
}

/* 确保页面没有默认边距 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
