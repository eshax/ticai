<template>
  <div class="stock-data-container">
    <!-- 顶部栏 - 完整保留原有样式结构 -->
    <el-header class="page-header">
      <div class="header-container">
        <div class="header-title">
          <el-title level="3">股票数据表现平台</el-title>
        </div>

        <div class="header-functions">
          <!-- 仅保留要求的四个核心元素 -->
          <div class="stats-wrapper">
            <span class="stat-item">总股票数: {{ totalStocks }}</span>
            <span class="stat-separator">|</span>
            <span class="stat-item">题材数量: {{ totalThemes }}</span>
            <span class="stat-separator">|</span>
            <span class="stat-item">数据日期: {{ dataDate }}</span>
            <span class="stat-separator">|</span>
            <span 
              class="auto-refresh-status cursor-pointer" 
              :class="{ refreshing: isRefreshing }"
              @click="toggleAutoRefresh"
            >
              <i class="fa fa-refresh" :class="{ 'fa-spin': isRefreshing }"></i>
              自动更新: {{ autoRefresh ? '开启' : '关闭' }}
            </span>
          </div>
        </div>
      </div>
    </el-header>

    <!-- 主内容区 - 完整功能布局 -->
    <el-main class="main-content">
      <!-- 数据加载状态 - 骨架屏 -->
      <el-skeleton active v-if="loading" class="loading-container">
        <template #template>
          <div class="skeleton-content">
            <div class="skeleton-search"></div>
            <div class="skeleton-table-header"></div>
            <div v-for="i in 10" :key="i" class="skeleton-table-row"></div>
          </div>
        </template>
      </el-skeleton>

      <!-- 错误提示 - 详细错误信息 -->
      <el-alert
        v-if="error"
        title="数据加载失败"
        :description="error"
        type="error"
        show-icon
        class="error-alert"
      />

      <!-- 无数据提示 -->
      <el-empty 
        v-if="!loading && !error && totalStocks === 0" 
        description="暂无股票数据"
        class="empty-data"
      />

      <!-- 股票数据展示 - 完整功能 -->
      <div v-else-if="!loading && !error" class="stock-data-content">
        <!-- 搜索框 -->
        <div class="search-container">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索股票代码、名称或题材..."
            prefix="el-icon-search"
            class="search-input"
            @input="handleSearch"
          />
        </div>

        <!-- 股票表格 -->
        <div class="table-container">
          <el-table
            :data="paginatedStocks"
            border
            stripe
            :header-cell-class-name="headerCellClass"
            :row-class-name="rowClass"
            class="stock-table"
          >
            <el-table-column
              label="股票代码"
              prop="code"
              width="120"
              sortable
              @sort-change="handleSort('code')"
            />
            <el-table-column
              label="股票名称"
              prop="name"
              width="120"
              sortable
              @sort-change="handleSort('name')"
            />
            <el-table-column
              label="所属板块"
              prop="sector"
              width="150"
              sortable
              @sort-change="handleSort('sector')"
            />
            <el-table-column
              label="所属题材"
              prop="theme"
              min-width="200"
              sortable
              @sort-change="handleSort('theme')"
            />
            <el-table-column
              label="振幅"
              prop="amplitude"
              width="100"
              sortable
              @sort-change="handleSort('amplitude')"
            >
              <template #default="scope">
                <span :class="scope.row.amplitude >= 0 ? 'text-danger' : 'text-success'">
                  {{ scope.row.amplitude }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column
              label="题材编码"
              prop="themeCode"
              width="150"
            />
          </el-table>

          <!-- 分页控件 -->
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredStocks.length"
            class="pagination-container"
          />
        </div>
      </div>
    </el-main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { 
  ElHeader, ElMain, ElTitle, ElSkeleton, ElAlert, ElEmpty, 
  ElTable, ElTableColumn, ElPagination, ElInput, ElMessage 
} from 'element-plus';

// 完整引入Element Plus样式（确保全局样式生效）
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/el-skeleton.css';
import 'element-plus/theme-chalk/el-alert.css';
import 'element-plus/theme-chalk/el-empty.css';
import 'element-plus/theme-chalk/el-table.css';
import 'element-plus/theme-chalk/el-pagination.css';
import 'element-plus/theme-chalk/el-input.css';
import 'element-plus/theme-chalk/el-message.css';

// 全局配置常量
const API_BASE_URL = 'https://apphwshhq.longhuvip.com/w1/api/index.php';
const PID_TYPES = [1, 2, 3, 4, 5]; // 需要请求的PID类型
const DEFAULT_PAGE_SIZE = 20;       // 默认每页条数
const REQUEST_TIMEOUT = 10000;      // 请求超时时间（10秒）
const REFRESH_INTERVAL = 30000;     // 自动刷新间隔（30秒）

// 状态管理 - 完整状态定义
const allStocks = ref([]);          // 所有股票数据（去重后）
const filteredStocks = ref([]);     // 搜索过滤后的股票数据
const loading = ref(false);         // 加载状态
const error = ref('');              // 错误信息
const totalStocks = ref(0);         // 总股票数
const totalThemes = ref(0);         // 题材数量（去重）
const dataDate = ref('--');         // 数据日期
const autoRefresh = ref(false);     // 自动刷新开关状态
const isRefreshing = ref(false);    // 正在刷新标识
const searchKeyword = ref('');      // 搜索关键词
const currentPage = ref(1);         // 当前页码
const pageSize = ref(DEFAULT_PAGE_SIZE); // 每页条数
const sortField = ref(null);        // 排序字段
const sortDirection = ref('asc');   // 排序方向（asc/desc）

// 计算属性 - 分页数据（根据当前页和每页条数计算）
const paginatedStocks = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  return filteredStocks.value.slice(startIndex, startIndex + pageSize.value);
});

// 表格样式类 - 保持原有样式逻辑
const headerCellClass = () => 'table-header-cell';
const rowClass = () => 'table-row-cell';

// 组件挂载时初始化数据
onMounted(() => {
  fetchAllStockData();  // 加载股票数据
  checkCorsSupport();   // 检测跨域支持（辅助诊断）
});

// 组件卸载时清理资源
onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval); // 清除自动刷新定时器
  }
});

// 检测CORS支持情况（控制台输出，辅助诊断跨域问题）
const checkCorsSupport = () => {
  fetch(API_BASE_URL, { method: 'OPTIONS' })
    .then(response => {
      console.log('=== CORS 支持情况诊断 ===', {
        '允许的来源': response.headers.get('Access-Control-Allow-Origin') || '不允许',
        '允许的方法': response.headers.get('Access-Control-Allow-Methods') || '无',
        '允许的请求头': response.headers.get('Access-Control-Allow-Headers') || '无',
        '是否允许凭证': response.headers.get('Access-Control-Allow-Credentials') || '否'
      });
    })
    .catch(err => {
      console.warn('CORS 预检请求失败（可能是正常情况）:', err.message);
    });
};

// 带超时的fetch请求（避免无限等待）
const fetchWithTimeout = (url, options = {}) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('请求超时（超过10秒）')), REQUEST_TIMEOUT)
    )
  ]);
};

// 核心功能：获取所有PID类型的股票数据并合并
const fetchAllStockData = async () => {
  loading.value = true;
  isRefreshing.value = true;
  error.value = '';
  let successfulStocks = []; // 存储成功获取的股票数据
  let errorMessages = [];    // 收集各PID的错误信息

  try {
    // 构建请求配置（模拟浏览器请求，减少跨域拦截概率）
    const requestOptions = {
      method: 'GET',
      headers: {
        'Referer': 'https://apphwshhq.longhuvip.com/',
        'Origin': 'https://apphwshhq.longhuvip.com'
      },
      mode: 'cors',        // 明确跨域模式
      credentials: 'omit', // 不发送身份凭证
      cache: 'no-cache'    // 禁用缓存
    };

    // 并行请求所有PID类型的数据（使用allSettled允许部分失败）
    const promises = PID_TYPES.map(pidType => 
      fetchWithTimeout(
        `${API_BASE_URL}?PidType=${pidType}&a=DailyLimitPerformance&c=HomeDingPan`,
        requestOptions
      )
      .then(async response => {
        // 处理HTTP状态码错误
        if (!response.ok) {
          throw new Error(`HTTP错误: 状态码 ${response.status} (PID: ${pidType})`);
        }

        // 处理响应数据（先转文本，避免JSON解析失败崩溃）
        const responseText = await response.text();
        try {
          return JSON.parse(responseText);
        } catch (parseErr) {
          throw new Error(`数据解析失败 (PID: ${pidType}): 响应格式不是合法JSON`);
        }
      })
      .catch(err => {
        // 收集单个PID的错误，不中断整体流程
        errorMessages.push(err.message);
        return null;
      })
    );

    // 等待所有请求完成（无论成功失败）
    const results = await Promise.allSettled(promises);

    // 处理成功的响应数据
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        const data = result.value;
        // 校验数据格式是否正确
        if (data && data.info && Array.isArray(data.info)) {
          // 按照要求解析指定列数据
          const stocks = data.info.map(stockData => ({
            code: stockData[0] || '',        // 第1列：股票代码
            name: stockData[1] || '',        // 第2列：股票名称
            theme: stockData[5] || '',       // 第6列：所属题材
            sector: stockData[12] || '',     // 第13列：所属板块
            amplitude: parseFloat(stockData[17]) || 0,   // 第18列：振幅（转为数字）
            themeCode: stockData[18] || ''   // 第19列：题材编码
          }));
          successfulStocks.push(...stocks);
        } else {
          errorMessages.push(`数据格式错误 (PID: ${PID_TYPES[index]}): 缺少info数组或格式异常`);
        }
      }
    });

    // 处理去重和统计信息
    if (successfulStocks.length > 0) {
      // 根据股票代码去重（避免重复数据）
      const uniqueStocks = [...new Map(successfulStocks.map(item => [item.code, item])).values()];
      allStocks.value = uniqueStocks;
      filteredStocks.value = uniqueStocks;

      // 更新统计数据
      totalStocks.value = uniqueStocks.length;
      
      // 计算题材数量（去重，过滤空值）
      const uniqueThemes = new Set(uniqueStocks.map(stock => stock.themeCode).filter(Boolean));
      totalThemes.value = uniqueThemes.size;

      // 获取最新的数据日期
      const availableDates = results
        .filter(r => r.status === 'fulfilled' && r.value?.day)
        .map(r => r.value.day)
        .filter(Boolean);
      
      if (availableDates.length > 0) {
        // 排序后取最新日期（降序排序取第一个）
        dataDate.value = availableDates.sort((a, b) => new Date(b) - new Date(a))[0];
      }

      // 应用排序（如果有排序字段）
      sortStocks();
    }

    // 处理错误信息展示
    if (errorMessages.length > 0) {
      const errorSummary = `部分数据源加载失败（${errorMessages.length}/${PID_TYPES.length}）`;
      
      // 全部失败时显示错误Alert
      if (errorMessages.length === PID_TYPES.length) {
        error.value = `${errorSummary}：\n${errorMessages.join('\n')}\n\n可能原因：\n1. 浏览器跨域限制（需后端代理）\n2. API接口不可用或访问受限\n3. 网络连接异常`;
      } else {
        // 部分失败时仅显示警告消息
        ElMessage.warning({
          message: `${errorSummary}，已加载可用数据`,
          duration: 5000
        });
        console.warn('数据源加载警告:', errorMessages);
      }
    }

    // 无任何数据且无错误的特殊情况
    if (successfulStocks.length === 0 && errorMessages.length === 0) {
      error.value = '未获取到任何股票数据，API返回为空';
    }

  } catch (globalErr) {
    // 捕获全局异常（非单个请求的错误）
    console.error('全局数据加载错误:', globalErr);
    error.value = `数据加载异常：${globalErr.message}\n\n请检查网络连接或稍后重试`;
  } finally {
    // 无论成功失败，都关闭加载状态
    loading.value = false;
    isRefreshing.value = false;
  }
};

// 排序处理函数
const sortStocks = () => {
  if (!sortField.value) return;

  filteredStocks.value.sort((a, b) => {
    let valueA, valueB;

    // 振幅字段按数字排序，其他字段按字符串排序
    if (sortField.value === 'amplitude') {
      valueA = a[sortField.value] || 0;
      valueB = b[sortField.value] || 0;
    } else {
      valueA = a[sortField.value]?.toLowerCase() || '';
      valueB = b[sortField.value]?.toLowerCase() || '';
    }

    // 根据排序方向返回比较结果
    if (valueA < valueB) return sortDirection.value === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection.value === 'asc' ? 1 : -1;
    return 0;
  });
};

// 处理表格列排序事件
const handleSort = (field) => {
  if (sortField.value === field) {
    // 同一字段切换排序方向
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    // 不同字段默认升序
    sortField.value = field;
    sortDirection.value = 'asc';
  }
  sortStocks();
};

// 搜索处理函数
const handleSearch = () => {
  const keyword = searchKeyword.value.toLowerCase().trim();
  currentPage.value = 1; // 搜索后重置到第一页

  if (!keyword) {
    // 无关键词时显示所有数据
    filteredStocks.value = [...allStocks.value];
  } else {
    // 按关键词过滤（支持多字段搜索）
    filteredStocks.value = allStocks.value.filter(stock => 
      stock.code.toLowerCase().includes(keyword) ||
      stock.name.toLowerCase().includes(keyword) ||
      stock.theme.toLowerCase().includes(keyword) ||
      stock.sector.toLowerCase().includes(keyword) ||
      stock.themeCode.toLowerCase().includes(keyword)
    );
  }

  // 过滤后应用排序
  sortStocks();
};

// 分页 - 每页条数改变事件
const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1; // 改变每页条数后重置到第一页
};

// 分页 - 当前页码改变事件
const handleCurrentChange = (val) => {
  currentPage.value = val;
};

// 自动刷新控制函数
let refreshInterval = null;
const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value;

  if (autoRefresh.value) {
    // 开启自动刷新
    refreshInterval = setInterval(() => {
      fetchAllStockData();
    }, REFRESH_INTERVAL);
    
    // 立即刷新一次
    fetchAllStockData();
    ElMessage.success('自动更新已开启（每30秒刷新一次）');
  } else {
    // 关闭自动刷新
    clearInterval(refreshInterval);
    ElMessage.info('自动更新已关闭');
  }
};
</script>

<style scoped>
/* 基础容器样式 - 完整保留原有布局 */
.stock-data-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  padding-bottom: 20px;
}

/* 顶部栏样式 - 完整保留原有设计 */
.page-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 0 20px;
  height: 64px !important;
  line-height: 64px !important;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.header-title {
  display: flex;
  align-items: center;
  height: 100%;
}

.header-title ::v-deep .el-title {
  margin: 0 !important;
  font-size: 18px !important;
  font-weight: 500 !important;
}

.header-functions {
  display: flex;
  align-items: center;
  height: 100%;
}

/* 统计信息样式 - 完整保留 */
.stats-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: #666;
  margin: 0;
  padding: 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
}

.stat-separator {
  color: #e0e0e0;
  font-size: 16px;
}

.auto-refresh-status {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.auto-refresh-status:hover {
  background-color: #f5f5f5;
}

.auto-refresh-status .fa-refresh {
  font-size: 14px;
}

/* 主内容区样式 - 完整保留 */
.main-content {
  margin-top: 16px;
  padding: 0 20px;
  flex: 1;
}

/* 错误提示样式 */
.error-alert {
  margin: 16px 0 !important;
}

/* 无数据提示样式 */
.empty-data {
  margin: 60px 0 !important;
  display: flex;
  justify-content: center;
}

/* 搜索框样式 */
.search-container {
  margin: 16px 0;
}

.search-input {
  width: 100%;
  max-width: 600px;
}

/* 表格容器样式 */
.table-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* 表格样式 - 完整保留原有设计 */
.stock-table {
  width: 100%;
  border: none !important;
}

::v-deep .el-table__header-wrapper {
  background-color: #f8f9fa;
}

::v-deep .el-table__header th {
  background-color: #f8f9fa !important;
  color: #666 !important;
  font-weight: 500 !important;
  border-bottom: 1px solid #e0e0e0 !important;
  height: 48px !important;
  line-height: 48px !important;
}

::v-deep .el-table__body tr {
  height: 44px !important;
}

::v-deep .el-table__body td {
  border-bottom: 1px solid #f5f5f5 !important;
  color: #333 !important;
}

::v-deep .el-table__row:hover td {
  background-color: #fafafa !important;
}

::v-deep .el-table--striped .el-table__body tr.el-table__row--striped td {
  background-color: #fafafa !important;
}

::v-deep .el-table-column {
  text-align: left;
}

/* 分页样式 */
.pagination-container {
  margin: 16px 0 !important;
  padding: 16px;
  text-align: right;
  border-top: 1px solid #f5f5f5;
}

::v-deep .el-pagination {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
}

/* 颜色样式 - 完整保留 */
.text-danger {
  color: #f5222d !important;
}

.text-success {
  color: #52c41a !important;
}

/* 骨架屏样式 - 完整保留 */
.loading-container {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  margin: 16px 0;
}

.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-search {
  height: 40px;
  background: #f5f5f5;
  border-radius: 4px;
}

.skeleton-table-header {
  height: 48px;
  background: #f5f5f5;
  border-radius: 4px;
}

.skeleton-table-row {
  height: 44px;
  background: #f5f5f5;
  border-radius: 4px;
}

/* 响应式样式 - 完整保留原有适配 */
@media (max-width: 1200px) {
  .stats-wrapper {
    gap: 12px;
  }
}

@media (max-width: 992px) {
  .header-container {
    flex-direction: row;
    flex-wrap: wrap;
    height: auto;
    padding: 12px 0;
  }
  
  .header-title {
    width: 100%;
    margin-bottom: 8px;
  }
  
  .stats-wrapper {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .stat-item {
    margin-bottom: 8px;
  }
  
  .main-content {
    margin-top: 12px;
  }
}

@media (max-width: 768px) {
  .stats-wrapper {
    gap: 8px;
  }
  
  .stat-item {
    font-size: 13px;
  }
  
  ::v-deep .el-table {
    font-size: 13px;
  }
  
  ::v-deep .el-table__header th {
    font-size: 13px !important;
  }
  
  .pagination-container {
    padding: 12px;
  }
  
  ::v-deep .el-pagination {
    font-size: 12px;
  }
}

@media (max-width: 576px) {
  .page-header {
    padding: 0 12px;
  }
  
  .main-content {
    padding: 0 12px;
  }
  
  .stats-wrapper {
    gap: 6px;
  }
  
  .stat-separator {
    display: none;
  }
  
  .auto-refresh-status {
    margin-top: 8px;
  }
}
</style>