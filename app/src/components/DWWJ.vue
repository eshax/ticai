<template>
  <div class="stock-page">
    <!-- 顶部栏 - 只保留日期选择功能 -->
    <el-header class="page-header fixed-header">
      <div class="header-container">
        <div class="header-title">
          <el-title level="3">低位挖掘</el-title>
        </div>

        <div class="header-functions">
          <el-date-picker
            v-model="selectedDate"
            type="date"
            placeholder="选日期"
            :min-date="new Date('2020-01-01')"
            :max-date="new Date()"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
            class="date-picker"
          />

          <!-- 日期导航按钮组 -->
          <el-button-group class="date-nav-buttons">
            <el-button size="small" @click="navigateDate(-1)" :disabled="!canNavigateDate(-1)">
              <i class="fa fa-chevron-left"></i>
              上一日
            </el-button>
            <el-button size="small" @click="navigateDate(1)" :disabled="!canNavigateDate(1)">
              <i class="fa fa-chevron-right"></i>
              下一日
            </el-button>
          </el-button-group>
        </div>
      </div>
    </el-header>

    <!-- 主内容区 - 包含4个列表 -->
    <el-main class="main-content">
      <!-- 加载状态 -->
      <el-skeleton active v-if="loading" class="loading-container">
        <template #template>
          <div style="padding: 20px;">
            <div class="skeleton-group-header" style="height: 40px; background: #333; margin-bottom: 10px;"></div>
            <div v-for="i in 5" :key="i" style="height: 36px; background: #333; margin-bottom: 5px;"></div>
          </div>
        </template>
      </el-skeleton>

      <!-- 错误提示 -->
      <el-alert
        v-if="error"
        title="数据加载失败"
        :description="error"
        type="error"
        show-icon
        style="margin: 10px 0 !important"
      />

      <!-- 4个列表容器 - 从左至右平均分布 -->
      <div v-else-if="!loading && !error" class="lists-container">
        <!-- 第1个列表 - 首板数据 -->
        <div class="list-container list-container-1">
          <div class="list-header">
            <div class="list-title">
              <span class="date-title">{{ formatDate(boxDates[0]) }}</span>
              <span class="boards-title">首板（{{ boxData[0].length }}）</span>
            </div>
          </div>
          <div class="table-wrapper">
            <table class="stock-table">
              <thead>
                <tr>
                  <th>股票</th>
                  <th>涨停时间</th>
                  <th>涨幅</th>
                  <th>主题</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="boxData[0].length === 0">
                  <td colspan="4" style="text-align: center; padding: 40px;">
                    暂无股票数据
                  </td>
                </tr>
                <tr v-else v-for="stock in boxData[0]" :key="stock.symbol" 
                    :ref="el => setStockRef(el, stock.symbol, 0)"
                    @mouseenter="handleStockHover(stock.symbol)"
                    @mouseleave="hoveredStock = null"
                    :class="{ 'highlight-row': hoveredStock === stock.symbol }">
                  <td>{{ formatStockCode(stock.symbol) }} - {{ stock.stock_chi_name }}</td>
                  <td>{{ formatLimitTimeRange(stock.first_limit_up, stock.last_limit_up) }}</td>
                  <td :class="stock.change_percent > 0 ? 'positive' : (stock.change_percent < 0 ? 'negative' : 'zero')">
                    {{ (stock.change_percent * 100).toFixed(2) }}%
                  </td>
                  <td>{{ stock.primaryTheme || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 第2个列表 - 二板数据 -->
        <div class="list-container list-container-2">
          <div class="list-header">
            <div class="list-title">
              <span class="date-title">{{ formatDate(boxDates[1]) }}</span>
              <span class="boards-title">二板（{{ boxData[1].length }}）</span>
            </div>
          </div>
          <div class="table-wrapper">
            <table class="stock-table">
              <thead>
                <tr>
                  <th>股票</th>
                  <th>涨停时间</th>
                  <th>涨幅</th>
                  <th>主题</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="boxData[1].length === 0">
                  <td colspan="4" style="text-align: center; padding: 40px;">
                    暂无股票数据
                  </td>
                </tr>
                <tr v-else v-for="stock in boxData[1]" :key="stock.symbol" 
                    :ref="el => setStockRef(el, stock.symbol, 1)"
                    @mouseenter="handleStockHover(stock.symbol)"
                    @mouseleave="hoveredStock = null"
                    :class="{ 'highlight-row': hoveredStock === stock.symbol }">
                  <td>{{ formatStockCode(stock.symbol) }} - {{ stock.stock_chi_name }}</td>
                  <td>{{ formatLimitTimeRange(stock.first_limit_up, stock.last_limit_up) }}</td>
                  <td :class="stock.change_percent > 0 ? 'positive' : (stock.change_percent < 0 ? 'negative' : 'zero')">
                    {{ (stock.change_percent * 100).toFixed(2) }}%
                  </td>
                  <td>{{ stock.primaryTheme || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 第3个列表 - 三板数据 -->
        <div class="list-container list-container-3">
          <div class="list-header">
            <div class="list-title">
              <span class="date-title">{{ formatDate(boxDates[2]) }}</span>
              <span class="boards-title">三板（{{ boxData[2].length }}）</span>
            </div>
          </div>
          <div class="table-wrapper">
            <table class="stock-table">
              <thead>
                <tr>
                  <th>股票</th>
                  <th>涨停时间</th>
                  <th>涨幅</th>
                  <th>主题</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="boxData[2].length === 0">
                  <td colspan="4" style="text-align: center; padding: 40px;">
                    暂无股票数据
                  </td>
                </tr>
                <tr v-else v-for="stock in boxData[2]" :key="stock.symbol" 
                    :ref="el => setStockRef(el, stock.symbol, 2)"
                    @mouseenter="handleStockHover(stock.symbol)"
                    @mouseleave="hoveredStock = null"
                    :class="{ 'highlight-row': hoveredStock === stock.symbol }">
                  <td>{{ formatStockCode(stock.symbol) }} - {{ stock.stock_chi_name }}</td>
                  <td>{{ formatLimitTimeRange(stock.first_limit_up, stock.last_limit_up) }}</td>
                  <td :class="stock.change_percent > 0 ? 'positive' : (stock.change_percent < 0 ? 'negative' : 'zero')">
                    {{ (stock.change_percent * 100).toFixed(2) }}%
                  </td>
                  <td>{{ stock.primaryTheme || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 第4个列表 - 四板数据 -->
        <div class="list-container list-container-4">
          <div class="list-header">
            <div class="list-title">
              <span class="date-title">{{ formatDate(boxDates[3]) }}</span>
              <span class="boards-title">四板（{{ boxData[3].length }}）</span>
            </div>
          </div>
          <div class="table-wrapper">
            <table class="stock-table">
              <thead>
                <tr>
                  <th>股票</th>
                  <th>涨停时间</th>
                  <th>涨幅</th>
                  <th>主题</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="boxData[3].length === 0">
                  <td colspan="4" style="text-align: center; padding: 40px;">
                    暂无股票数据
                  </td>
                </tr>
                <tr v-else v-for="stock in boxData[3]" :key="stock.symbol" 
                    :ref="el => setStockRef(el, stock.symbol, 3)"
                    @mouseenter="handleStockHover(stock.symbol)"
                    @mouseleave="hoveredStock = null"
                    :class="{ 'highlight-row': hoveredStock === stock.symbol }">
                  <td>{{ formatStockCode(stock.symbol) }} - {{ stock.stock_chi_name }}</td>
                  <td>{{ formatLimitTimeRange(stock.first_limit_up, stock.last_limit_up) }}</td>
                  <td :class="stock.change_percent > 0 ? 'positive' : (stock.change_percent < 0 ? 'negative' : 'zero')">
                    {{ (stock.change_percent * 100).toFixed(2) }}%
                  </td>
                  <td>{{ stock.primaryTheme || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </el-main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { 
  ElHeader, ElMain, ElTitle, 
  ElSkeleton, ElAlert, 
  ElButtonGroup, ElButton, ElDatePicker
} from 'element-plus';
import { fetchStockPoolData, isSTStock, formatStockData } from '../api/xgt.js';
import { getAdjustedDate, getToday, isWeekend, getLastWorkday } from '../common/date.js';

const formatStockCode = (code) => {
  if (!code) return '';
  const numbers = code.match(/\d+/g);
  return numbers ? numbers.join('') : code;
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatLimitTimeRange = (firstTime, lastTime) => {
  const formatTime = (time) => {
    if (!time || time === '-') return '-';
    const parts = time.split(':');
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : time;
  };

  const formattedFirst = formatTime(firstTime);
  const formattedLast = formatTime(lastTime);

  if (formattedFirst === '-') {
    return '-';
  }
  if (formattedLast === '-') {
    return formattedFirst;
  }
  if (formattedFirst === formattedLast) {
    return formattedFirst;
  }
  return `${formattedFirst} - ${formattedLast}`;
};

const canNavigateDate = (offset) => {
  const date = new Date(selectedDate.value);
  date.setDate(date.getDate() + offset);
  
  let adjustedDate = new Date(date);
  let day = adjustedDate.getDay();
  if (day === 0) {
    adjustedDate.setDate(adjustedDate.getDate() + (offset > 0 ? 1 : -2));
  } else if (day === 6) {
    adjustedDate.setDate(adjustedDate.getDate() + (offset > 0 ? 2 : -1));
  }
  
  const minDate = new Date('2020-01-01');
  const maxDate = new Date();
  
  return adjustedDate >= minDate && adjustedDate <= maxDate;
};

const navigateDate = (offset) => {
  if (!canNavigateDate(offset)) return;
  
  const newDate = getAdjustedDate(selectedDate.value, offset);
  selectedDate.value = newDate;
  handleDateChange(newDate);
};



const loading = ref(true);
const error = ref('');
const today = getToday();
const selectedDate = ref(isWeekend(today) ? getLastWorkday() : today);

const boxData = ref([[], [], [], []]);
const boxDates = ref(['', '', '', '']);
const hoveredStock = ref(null);
const stockRefs = ref({});

const setStockRef = (el, symbol, listIndex) => {
  if (!el) return;
  if (!stockRefs.value[symbol]) {
    stockRefs.value[symbol] = {};
  }
  stockRefs.value[symbol][listIndex] = el;
};

const handleStockHover = (symbol) => {
  hoveredStock.value = symbol;
  const stockRef = stockRefs.value[symbol];
  if (stockRef) {
    for (let i = 0; i < 4; i++) {
      if (stockRef[i]) {
        const tbody = stockRef[i].closest('tbody');
        if (tbody) {
          const tbodyRect = tbody.getBoundingClientRect();
          const rowRect = stockRef[i].getBoundingClientRect();
          if (rowRect.top < tbodyRect.top || rowRect.bottom > tbodyRect.bottom) {
            const rowTop = stockRef[i].offsetTop;
            const rowHeight = stockRef[i].offsetHeight;
            const tbodyHeight = tbody.clientHeight;
            const scrollTop = rowTop - (tbodyHeight / 2) + (rowHeight / 2);
            tbody.scrollTop = scrollTop;
          }
        }
      }
    }
  }
};

const updateBoxDates = () => {
  const baseDate = new Date(selectedDate.value);
  boxDates.value = [
    formatDate(baseDate),
    formatDate(getNextWorkday(baseDate)),
    formatDate(getNextWorkday(getNextWorkday(baseDate))),
    formatDate(getNextWorkday(getNextWorkday(getNextWorkday(baseDate))))
  ];
};

const getNextWorkday = (date) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);
  
  let day = nextDate.getDay();
  if (day === 0) {
    nextDate.setDate(nextDate.getDate() + 1);
  } else if (day === 6) {
    nextDate.setDate(nextDate.getDate() + 2);
  }
  
  return formatDate(nextDate);
};

const fetchStockData = async () => {
  loading.value = true;
  error.value = '';
  boxData.value = [[], [], [], []];
  
  try {
    const dates = boxDates.value;
    
    for (let i = 0; i < 4; i++) {
      try {
        const stockPoolData = await fetchStockPoolData('limit_up', dates[i]);
        
        // 先格式化数据，然后筛选板数
        const formattedData = stockPoolData
          .filter(stock => !isSTStock(stock.stock_chi_name))
          .map(stock => formatStockData(stock, false));
        
        // 根据板数筛选
        const filteredData = formattedData.filter(stock => {
          const boards = stock.limit_up_days || 0;
          return boards === i + 1;
        });
        
        // 按涨停时间排序，涨停时间早的排在前面
        const sortedData = filteredData.sort((a, b) => {
          // 处理空值情况
          if (!a.first_limit_up) return 1;
          if (!b.first_limit_up) return -1;
          // 比较时间字符串
          return a.first_limit_up.localeCompare(b.first_limit_up);
        });
        
        boxData.value[i] = sortedData;
      } catch (err) {
        console.error(`获取 ${dates[i]} 数据失败:`, err);
        boxData.value[i] = [];
      }
    }
    
    error.value = '';
  } catch (err) {
    error.value = `请求失败: ${err.message || '请检查网络'}`;
  } finally {
    loading.value = false;
  }
};

const handleDateChange = (date) => {
  if (date) {
    loading.value = true;
    updateBoxDates();
    fetchStockData();
  }
};

onMounted(() => {
  updateBoxDates();
  fetchStockData();
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.stock-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: #2d2d2d;
  border-bottom: 1px solid #444;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.page-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  gap: 30px;
}

.header-title {
  display: flex;
  align-items: center;
}

.header-functions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.date-picker {
  width: 140px;
}

.date-nav-buttons {
  display: flex;
  gap: 0;
}

.main-content {
  padding-top: 60px;
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 20px;
  flex: 1;
  overflow: hidden;
}

.loading-container {
  margin-top: 10px;
}

.lists-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 10px;
  height: 100%;
}

.list-container {
  min-height: 200px;
  background: #2d2d2d;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #444;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.list-header {
  background: #3d3d3d;
  padding: 15px;
  border-bottom: 1px solid #444;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-title {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.date-title {
  font-size: 12px;
  font-weight: bold;
  color: #fff;
}

.boards-title {
  font-size: 12px;
  color: #999;
}

.add-button {
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-button:hover {
  background: #45a049;
}

.table-wrapper {
  flex: 1;
  min-height: 100px;
  display: flex;
  flex-direction: column;
}

.stock-table {
  width: 100%;
  border-collapse: collapse;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.stock-table thead {
  flex: 0 0 auto;
  display: block;
}

.stock-table thead tr {
  display: table;
  width: 100%;
  table-layout: fixed;
}

.stock-table tbody {
  flex: 1 1 auto;
  display: block;
  overflow-y: auto;
}

.stock-table tbody tr {
  display: table;
  width: 100%;
  table-layout: fixed;
}

.stock-table th {
  background: #3d3d3d;
  padding: 10px;
  text-align: left;
  font-size: 12px;
  font-weight: bold;
  color: #ccc;
  border-bottom: 1px solid #444;
  display: table-cell;
}

.stock-table td {
  padding: 10px;
  font-size: 12px;
  border-bottom: 1px solid #444;
  display: table-cell;
}

.stock-table th:nth-child(1),
.stock-table td:nth-child(1) {
  width: 120px;
  white-space: nowrap;
}

.stock-table th:nth-child(2),
.stock-table td:nth-child(2) {
  width: 90px;
  text-align: left;
}

.stock-table th:nth-child(3),
.stock-table td:nth-child(3) {
  width: 60px;
  text-align: right;
}

.stock-table tr.highlight-row {
  background: #4a4a4a;
}

.stock-table tr:last-child td {
  border-bottom: none;
}

.positive {
  color: #ff4444;
}

.negative {
  color: #4CAF50;
}

.zero {
  color: #fff;
}



@media (max-width: 1200px) {
  .lists-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .lists-container {
    grid-template-columns: 1fr;
  }
  
  .header-container {
    flex-direction: column;
    gap: 10px;
  }
  
  .header-functions {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
