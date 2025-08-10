<template>
  <div class="stock-page">
    <!-- 顶部栏 - 始终置顶 -->
    <el-header class="page-header fixed-header">
      <div class="header-container">
        <div class="header-title">
          <el-title level="3">股票数据分析平台</el-title>
        </div>

        <div class="header-functions">
          <!-- 数据源切换按钮组 -->
          <el-button-group class="data-source-button-group">
            <el-button 
              v-for="(pool, key) in pools" 
              :key="key"
              :type="selectedPool === key ? 'primary' : 'default'"
              size="small"
              @click="selectedPool = key"
              class="source-button"
            >
              {{ pool }}
            </el-button>
          </el-button-group>

          <div class="stats-wrapper">
            <span class="stat-item">总股票数: {{ totalCount }}</span>
            <span class="stat-separator">|</span>
            <span class="stat-item">题材数量: {{ groupedStocks.length }}</span>
            <span class="stat-separator">|</span>
            <span class="stat-item">数据日期: {{ selectedDate }}</span>
            <span class="stat-separator">|</span>
            <span 
              class="auto-refresh-status cursor-pointer" 
              :class="{ refreshing: isRefreshing, 'manually-set': isAutoRefreshManuallySet }"
              @click="toggleAutoRefresh"
            >
              <i class="fa fa-refresh" :class="{ 'fa-spin': isRefreshing }"></i>
              自动更新: {{ autoRefresh ? '开启' : '关闭' }}
              <span v-if="isAutoRefreshManuallySet" class="manual-indicator" title="已手动设置状态"></span>
            </span>
            <span class="stat-separator">|</span>
            <span 
              class="update-tip-status cursor-pointer" 
              :class="{ 'manually-set': isUpdateTipManuallySet }"
              @click="toggleUpdateTip"
            >
              <i class="fa fa-bell" :class="{ 'fa-shake': showUpdateTip }"></i>
              更新提示框: {{ showUpdateTip ? '开启' : '关闭' }}
            </span>
          </div>

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

    <!-- 主内容区 - 包含16个表格，分上下两排各8个 -->
    <el-main class="main-content">
      <!-- 数据更新提示 -->
      <div 
        v-if="showUpdateTip" 
        class="update-tip"
        @click="hideUpdateTip"
      >
        <div class="update-tip-header">
          <i class="fa fa-info-circle"></i> 数据已更新
        </div>
        <div class="update-details">
          <div v-if="updatedStocks.added.length > 0" class="update-section">
            <div class="section-title added-title">涨停 {{ updatedStocks.added.length }} 只股票:</div>
            <ul class="stock-list">
              <li v-for="stock in updatedStocks.added" :key="'added_' + stock.symbol" class="stock-item">
                {{ stock.stock_chi_name }}({{ formatStockCode(stock.symbol) }})
              </li>
            </ul>
          </div>
          <div v-if="updatedStocks.removed.length > 0" class="update-section">
            <div class="section-title removed-title">炸板 {{ updatedStocks.removed.length }} 只股票:</div>
            <ul class="stock-list">
              <li v-for="stock in updatedStocks.removed" :key="'removed_' + stock.symbol" class="stock-item">
                {{ stock.stock_chi_name }}({{ formatStockCode(stock.symbol) }})
              </li>
            </ul>
          </div>
          <div v-if="updatedStocks.changed.length > 0" class="update-section">
            <div class="section-title changed-title">变动 {{ updatedStocks.changed.length }} 只股票:</div>
            <ul class="stock-list">
              <li v-for="stock in updatedStocks.changed" :key="'changed_' + stock.symbol" class="stock-item">
                <div class="stock-name">
                  {{ stock.stock_chi_name }}({{ formatStockCode(stock.symbol) }})
                </div>
                <ul class="change-details">
                  <li v-for="(change, idx) in stock.changes" :key="idx" class="change-detail">
                    <span class="change-field">{{ getFieldName(change.field) }}:</span>
                    <span class="old-value" v-if="change.oldValue !== undefined">{{ formatValue(change.field, change.oldValue) }}</span>
                    <span class="change-arrow">→</span>
                    <span class="new-value" :class="{ positive: isPositiveChange(change), negative: isNegativeChange(change) }">
                      {{ formatValue(change.field, change.newValue) }}
                    </span>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
        <div class="update-tip-footer">点击关闭提示</div>
      </div>

      <!-- 加载状态 -->
      <el-skeleton active v-if="loading" class="loading-container">
        <template #template>
          <div style="padding: 20px;">
            <div class="skeleton-group-header" style="height: 40px; background: #f5f5f5; margin-bottom: 10px;"></div>
            <div v-for="i in 5" :key="i" style="height: 36px; background: #f5f5f5; margin-bottom: 5px;"></div>
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

      <!-- 无数据提示 -->
      <el-empty 
        v-if="!loading && !error && totalCount === 0" 
        :description="isNonTradingDay ? '今日为非交易日，无数据' : '暂无符合条件的股票数据'"
        style="margin: 40px 0"
      />

      <!-- 16个表格容器 - 分为上下两排各8个 -->
      <div v-else-if="!loading && !error" class="sixteen-tables-container">
        <!-- 上排8个表格 -->
        <div class="tables-row top-row">
          <div v-for="i in 8" :key="'top_' + i" class="table-wrapper">
            <div class="table-container">
              <!-- 表格内容 -->
              <div class="table-scrollable-content">
                <div class="groups-container">
                  <div 
                    v-if="tablesData[i-1] && tablesData[i-1].theme" 
                    class="theme-group"
                  >
                    <!-- 分组标题 -->
                    <div class="group-header" @click="toggleGroup(tablesData[i-1].theme)">
                      <div class="group-header-content">
                        <i class="fa" :class="isGroupExpanded(tablesData[i-1].theme) ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
                        <span class="group-theme">
                          {{ tablesData[i-1].theme }}
                          <span class="group-count">({{ tablesData[i-1].stocks.length }})</span>
                        </span>
                      </div>
                    </div>
                    
                    <!-- 分组内股票列表 -->
                    <div 
                      class="group-stocks" 
                      v-if="isGroupExpanded(tablesData[i-1].theme)"
                    >
                      <div 
                        v-for="stock in tablesData[i-1].stocks" 
                        :key="'top_' + i + '_' + stock.symbol + '_' + tablesData[i-1].theme"
                        class="stock-list-item"
                        :class="{ 
                          'stock-updated': stock.wasUpdated,
                          'multi-plate': stock.hasMultiplePlates,
                          'limit-down': selectedPool === 'limit_down'
                        }"
                      >
                        <div class="list-item boards-item">
                          <span class="board-indicator" :class="{ 'down-indicator': selectedPool === 'limit_down' }">
                            {{ stock.boardIndicator || '-' }}
                          </span>
                        </div>
                        <div class="list-item name-item">
                          <span class="stock-code">
                            {{ formatStockCode(stock.symbol) }}
                          </span>
                          <el-tooltip placement="top">
                            <template #content> 
                              {{ stock.surge_reason.stock_reason || '无相关信息' }}
                              <div v-if="stock.allThemes.length > 1" class="tooltip-themes">
                                其他题材: {{ stock.allThemes.filter(t => t !== stock.displayTheme).join('、') }}
                              </div>
                            </template>
                            <span class="stock-name truncate-text">{{ stock.stock_chi_name }}</span>
                          </el-tooltip>

                        </div>
                        <div class="list-item change-item">
                          <span class="change-percent" :class="{ positive: stock.change_percent > 0, negative: stock.change_percent < 0 }">
                            {{ (stock.change_percent * 100).toFixed(2) }}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 空表格提示 -->
                  <div v-else-if="i <= groupedStocks.length" class="empty-table-placeholder">
                    加载中...
                  </div>
                  <div v-else class="empty-table-placeholder">
                    无数据
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 下排8个表格 -->
        <div class="tables-row bottom-row">
          <div v-for="i in 8" :key="'bottom_' + i" class="table-wrapper">
            <div class="table-container">
              <!-- 表格内容 -->
              <div class="table-scrollable-content">
                <div class="groups-container">
                  <div 
                    v-if="tablesData[i+7] && tablesData[i+7].theme" 
                    class="theme-group"
                  >
                    <!-- 分组标题 -->
                    <div class="group-header" @click="toggleGroup(tablesData[i+7].theme)">
                      <div class="group-header-content">
                        <i class="fa" :class="isGroupExpanded(tablesData[i+7].theme) ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
                        <span class="group-theme">
                          {{ tablesData[i+7].theme }}
                          <span class="group-count">({{ tablesData[i+7].stocks.length }})</span>
                          <span v-if="i === 8 && groupedStocks.length > 16" class="overflow-indicator">（包含更多题材）</span>
                        </span>
                      </div>
                    </div>
                    
                    <!-- 分组内股票列表 -->
                    <div 
                      class="group-stocks" 
                      v-if="isGroupExpanded(tablesData[i+7].theme)"
                    >
                      <div 
                        v-for="stock in tablesData[i+7].stocks" 
                        :key="'bottom_' + i + '_' + stock.symbol + '_' + tablesData[i+7].theme"
                        class="stock-list-item"
                        :class="{ 
                          'stock-updated': stock.wasUpdated,
                          'multi-plate': stock.hasMultiplePlates,
                          'limit-down': selectedPool === 'limit_down',
                          'with-theme-column': i === 8
                        }"
                      >
                        <div class="list-item boards-item">
                          <span class="board-indicator" :class="{ 'down-indicator': selectedPool === 'limit_down' }">
                            {{ stock.boardIndicator || '-' }}
                          </span>
                        </div>
                        <!-- 只有最后一个表格显示题材列内容 -->
                        <div class="list-item name-item" :class="{ 'with-theme': i === 8 }">
                          <span class="stock-code">
                            {{ formatStockCode(stock.symbol) }}
                          </span>                          
                          <el-tooltip placement="top">
                            <template #content> 
                              {{ stock.surge_reason.stock_reason || '无相关信息' }}
                              <div v-if="stock.allThemes.length > 1" class="tooltip-themes">
                                其他题材: {{ stock.allThemes.filter(t => t !== stock.displayTheme).join('、') }}
                              </div>
                            </template>
                            <span class="stock-name truncate-text">{{ stock.stock_chi_name }}</span>
                          </el-tooltip>


                          <span v-if="i === 8" class="stock-theme truncate-text">{{ stock.displayTheme }}</span>

                        </div>
                        <div class="list-item change-item">
                          <!-- 涨幅部分添加分时图弹窗 -->
                          <el-popover
                            placement="right"
                            width="580"
                            trigger="hover"
                            :teleported="true"
                          >
                            <template #default>
                              <div class="chart-container">
                                <div class="chart-loading" v-if="stockChartLoading[stock.symbol]">
                                  <i class="fa fa-spinner fa-spin"></i> 加载中...
                                </div>
                                <iframe
                                  :src="getSinaStockChartUrl(stock.symbol)"
                                  frameborder="0"
                                  width="100%"
                                  height="300"
                                  @load="stockChartLoading[stock.symbol] = false"
                                  class="stock-chart-iframe"
                                ></iframe>
                              </div>
                            </template>
                            <template #reference>
                              <span class="change-percent" :class="{ positive: stock.change_percent > 0, negative: stock.change_percent < 0 }">
                                {{ (stock.change_percent * 100).toFixed(2) }}%
                              </span>
                            </template>
                          </el-popover>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 空表格提示 -->
                  <div v-else-if="i+7 < groupedStocks.length" class="empty-table-placeholder">
                    加载中...
                  </div>
                  <div v-else class="empty-table-placeholder">
                    无数据
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
import axios from 'axios';
import { 
  ElHeader, ElMain, ElTitle, 
  ElSkeleton, ElAlert, ElEmpty,
  ElTooltip, ElButtonGroup, ElButton, ElDatePicker,
  ElPopover  // 新增引入Popover组件
} from 'element-plus';

// 定义数据源映射关系
const pools = {
  'limit_up': '涨停',
  'yesterday_limit_up': '昨日涨停',
  'limit_up_broken': '炸板',
  'super_stock': '强势',
  'limit_down': '跌停'
};

// 股票代码格式化函数
const formatStockCode = (code) => {
  if (!code) return '';
  const numbers = code.match(/\d+/g);
  return numbers ? numbers.join('') : code;
};

// 获取新浪股票分时图URL
const getSinaStockChartUrl = (symbol) => {
  // 提取纯数字代码
  const code = formatStockCode(symbol);
  if (!code) return '';
  
  // 判断市场类型，生成对应的新浪财经URL
  // 沪市股票代码以6开头，深市以0或3开头
  let marketPrefix = code.startsWith('6') ? 'sh' : 'sz';
  
  // 新浪财经分时图URL
  return `https://image.sinajs.cn/newchart/min/n/${marketPrefix}${code}.gif`;
};

// 日期处理工具
const getToday = () => new Date().toISOString().split('T')[0];
const isWeekend = (dateStr) => {
  const day = new Date(dateStr).getDay();
  return day === 0 || day === 6;
};
const getLastWorkday = () => {
  const date = new Date();
  const day = date.getDate();
  const daysToSubtract = day === 0 ? 2 : day === 6 ? 1 : 1;
  date.setDate(date.getDate() - daysToSubtract);
  return date.toISOString().split('T')[0];
};

// 日期导航功能 - 获取指定日期的前/后工作日
const getAdjustedDate = (dateStr, offset) => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + offset);
  
  // 跳过周末
  let day = date.getDay();
  if (day === 0) { // 周日
    date.setDate(date.getDate() + (offset > 0 ? 1 : -2));
  } else if (day === 6) { // 周六
    date.setDate(date.getDate() + (offset > 0 ? 2 : -1));
  }
  
  // 检查是否超出日期范围限制
  const minDate = new Date('2020-01-01');
  const maxDate = new Date();
  
  if (date < minDate) {
    return minDate.toISOString().split('T')[0];
  }
  
  if (date > maxDate) {
    return maxDate.toISOString().split('T')[0];
  }
  
  return date.toISOString().split('T')[0];
};

// 检查是否可以导航到指定偏移的日期
const canNavigateDate = (offset) => {
  const date = new Date(selectedDate.value);
  date.setDate(date.getDate() + offset);
  
  // 跳过周末计算有效日期
  let adjustedDate = new Date(date);
  let day = adjustedDate.getDay();
  if (day === 0) { // 周日
    adjustedDate.setDate(adjustedDate.getDate() + (offset > 0 ? 1 : -2));
  } else if (day === 6) { // 周六
    adjustedDate.setDate(adjustedDate.getDate() + (offset > 0 ? 2 : -1));
  }
  
  // 检查是否在有效范围内
  const minDate = new Date('2020-01-01');
  const maxDate = new Date();
  
  return adjustedDate >= minDate && adjustedDate <= maxDate;
};

// 日期导航处理函数
const navigateDate = (offset) => {
  if (!canNavigateDate(offset)) return;
  
  const newDate = getAdjustedDate(selectedDate.value, offset);
  selectedDate.value = newDate;
  handleDateChange(newDate);
};

// 时间检查函数
const isWithinTradingHours = () => {
  const now = new Date();
  const hours = now.getHours();
  return hours >= 9 && hours < 15;
};

// 涨/跌停时间格式化
const formatLimitTime = (time = false) => {
  if (!time || time === '0' || time === 'null' || !time.toString().trim()) {
    return '-';
  }

  if (typeof time === 'number' || /^\d+$/.test(time)) {
    const timestamp = Number(time);
    const msTimestamp = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
    const date = new Date(msTimestamp);
    if (isNaN(date.getTime())) return '-';
    
    return [
      String(date.getHours()).padStart(2, '0'),
      String(date.getMinutes()).padStart(2, '0'),
      String(date.getSeconds()).padStart(2, '0')
    ].join(':');
  }

  if (typeof time === 'string') {
    if (/^\d{2}:\d{2}:\d{2}$/.test(time)) return time;
    if (time.includes(' ')) {
      const timePart = time.split(' ')[1];
      if (/^\d{2}:\d{2}:\d{2}$/.test(timePart)) return timePart;
    }
    if (time.includes('T')) {
      const date = new Date(time);
      if (!isNaN(date.getTime())) {
        return [
          String(date.getHours()).padStart(2, '0'),
          String(date.getMinutes()).padStart(2, '0'),
          String(date.getSeconds()).padStart(2, '0')
        ].join(':');
      }
    }

  return '-';
  }
};

// 提取板数（用于排序）
const extractBoards = (text) => {
  if (text.includes('/')) {
    const parts = text.split('/');
    return parts.length > 1 ? Number(parts[1]) || 0 : 0;
  }
  if (text === '-') return 0;
  
  const match = text.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
};


// ST股过滤
const isSTStock = (stockName) => stockName.includes('ST') || stockName.includes('*ST');

// 比较新旧股票数据并获取具体变化内容
const getStockChanges = (oldStock, newStock) => {
  if (!oldStock || !newStock) return [];
  
  const changes = [];
  const compareFields = [
    { field: 'change_percent', label: '涨跌幅' },
    { field: 'limitUpBoardsText', label: selectedPool.value === 'limit_down' ? '跌停板数' : '涨停板数' },
    { field: 'breakLimitUpTimes', label: selectedPool.value === 'limit_down' ? '封板次数' : '开板次数' },
    { field: 'first_limit_up', label: selectedPool.value === 'limit_down' ? '首次跌停' : '首次涨停' },
    { field: 'hasMultiplePlates', label: '多板块属性' },
    { field: 'boardIndicator', label: selectedPool.value === 'limit_down' ? '跌停板指标' : '涨停板指标' }
  ];
  
  compareFields.forEach(({ field }) => {
    if (oldStock[field] !== newStock[field]) {
      changes.push({
        field,
        oldValue: oldStock[field],
        newValue: newStock[field]
      });
    }
  });
  
  return changes;
};

// 判断变化是否为正向
const isPositiveChange = (change) => {
  if (selectedPool.value === 'limit_down') {
    if (change.field === 'change_percent') {
      return change.newValue > (change.oldValue || 0);
    }
    return false;
  }
  
  if (change.field === 'change_percent') {
    return change.newValue > (change.oldValue || 0);
  }
  if (change.field === 'price') {
    return change.newValue > (change.oldValue || 0);
  }
  if (change.field === 'limitUpBoardsText' || change.field === 'boardIndicator') {
    const oldBoards = extractBoards(change.oldValue || '0');
    const newBoards = extractBoards(change.newValue || '0');
    return newBoards > oldBoards;
  }
  return false;
};

// 判断变化是否为负向
const isNegativeChange = (change) => {
  if (selectedPool.value === 'limit_down') {
    if (change.field === 'change_percent') {
      return change.newValue < (change.oldValue || 0);
    }
    return false;
  }
  
  if (change.field === 'change_percent') {
    return change.newValue < (change.oldValue || 0);
  }
  if (change.field === 'price') {
    return change.newValue < (change.oldValue || 0);
  }
  if (change.field === 'limitUpBoardsText' || change.field === 'boardIndicator') {
    const oldBoards = extractBoards(change.oldValue || '0');
    const newBoards = extractBoards(change.newValue || '0');
    return newBoards < oldBoards;
  }
  if (change.field === 'breakLimitUpTimes') {
    return change.newValue > (change.oldValue || 0);
  }
  return false;
};

// 获取字段显示名称
const getFieldName = (field) => {
  const isDown = selectedPool.value === 'limit_down';
  const fieldNames = {
    'price': '当前价格',
    'change_percent': '涨跌幅',
    'limitUpBoardsText': isDown ? '跌停板数' : '涨停板数',
    'breakLimitUpTimes': isDown ? '封板次数' : '开板次数',
    'first_limit_up': isDown ? '首次跌停' : '首次涨停',
    'hasMultiplePlates': '多板块属性',
    'boardIndicator': isDown ? '跌停板指标' : '涨停板指标'
  };
  return fieldNames[field] || field;
};

// 格式化字段值用于显示
const formatValue = (field, value) => {
  switch (field) {
    case 'price':
      return `${value}元`;
    case 'change_percent':
      return `${(value * 100).toFixed(2)}%`;
    case 'breakLimitUpTimes':
      return value === 0 ? '-' : `${value}次`;
    case 'hasMultiplePlates':
      return value ? '是' : '否';
    default:
      return value;
  }
};

// 找出新增、移除和变动的股票
const findStockChanges = (oldData, newData) => {
  // 去重处理原始数据
  const uniqueOldData = Array.from(new Map(oldData.map(item => [item.symbol, item])).values());
  const uniqueNewData = Array.from(new Map(newData.map(item => [item.symbol, item])).values());
  
  const oldSymbols = new Set(uniqueOldData.map(s => s.symbol));
  const newSymbols = new Set(uniqueNewData.map(s => s.symbol));
  
  const added = uniqueNewData
    .filter(stock => !oldSymbols.has(stock.symbol));
  
  const removed = uniqueOldData
    .filter(stock => !newSymbols.has(stock.symbol));
  
  const changed = uniqueNewData
    .filter(stock => oldSymbols.has(stock.symbol))
    .map(stock => {
      const oldStock = uniqueOldData.find(s => s.symbol === stock.symbol);
      const changes = getStockChanges(oldStock, stock);
      return {
        ...stock,
        changes: changes
      };
    })
    .filter(stock => stock.changes.length > 0);
  
  return { added, removed, changed };
};

// 状态管理
const rawData = ref([]);
const loading = ref(true);
const error = ref('');
const today = getToday();
const selectedDate = ref(isWeekend(today) ? getLastWorkday() : today);
const selectedPool = ref('limit_up');
const autoRefresh = ref(false);
const isAutoRefreshManuallySet = ref(false);
const refreshInterval = ref(null);
const timeCheckInterval = ref(null);
const isRefreshing = ref(false);
const showUpdateTip = ref(false);
const isUpdateTipManuallySet = ref(false);
const updatedStocks = ref({ added: [], removed: [], changed: [] });
const groupExpandedState = ref({}); // 用于保存分组展开状态
const stockChartLoading = ref({}); // 用于跟踪股票图表加载状态

// 计算属性
const isToday = computed(() => selectedDate.value === today);
const isNonTradingDay = computed(() => isWeekend(selectedDate.value));
// 计算唯一股票总数
const totalCount = computed(() => {
  const uniqueSymbols = new Set();
  rawData.value.forEach(stock => {
    uniqueSymbols.add(stock.symbol);
  });
  return uniqueSymbols.size;
});

// 按题材分组并排序 - 同一股票会出现在所有相关题材中
const groupedStocks = computed(() => {
  // 1. 按题材分组，同一股票会添加到所有相关题材中
  const groups = {};
  
  rawData.value.forEach(stock => {
    // 获取该股票的所有题材
    const allThemes = stock.allThemes || [stock.primaryTheme];
    
    allThemes.forEach(theme => {
      if (!groups[theme]) {
        groups[theme] = {
          theme,
          stocks: [],
          expanded: groupExpandedState.value[theme] !== undefined ? groupExpandedState.value[theme] : true
        };
      }
      
      // 创建一个带有当前显示题材的股票副本
      const stockWithTheme = {
        ...stock,
        displayTheme: theme
      };
      
      groups[theme].stocks.push(stockWithTheme);
    });
  });
  
  // 2. 对每个分组内的股票进行排序，同时去重
  Object.values(groups).forEach(group => {
    // 去重处理 - 确保同一股票在一个题材分组中只出现一次
    const uniqueStocks = Array.from(new Map(
      group.stocks.map(item => [item.symbol, item])
    ).values());
    
    // 排序
    uniqueStocks.sort(stockSortWithinGroup);
    group.stocks = uniqueStocks;
  });
  
  // 3. 对分组本身进行排序（按股票数量降序）
  return Object.values(groups).sort(groupSort);
});

// 将分组数据分配到16个表格中 - 前15个表格各放1个题材，第16个表格放剩余所有题材
const tablesData = computed(() => {
  // 初始化16个表格容器
  const tables = Array(16).fill().map(() => ({ theme: '', stocks: [] }));
  
  // 如果没有题材数据，直接返回空表格
  if (groupedStocks.value.length === 0) {
    return tables;
  }
  
  // 前15个表格各放1个题材
  const first15Themes = groupedStocks.value.slice(0, 15);
  first15Themes.forEach((group, index) => {
    tables[index] = { ...group };
  });
  
  // 第16个表格放剩余所有题材（如果有的话）
  const remainingThemes = groupedStocks.value.slice(15);
  if (remainingThemes.length > 0) {
    // 合并所有剩余题材的股票
    const allStocks = remainingThemes.flatMap(group => group.stocks);
    // 对合并后的股票重新排序
    allStocks.sort(stockSortWithinGroup);
    
    tables[15] = {
      theme: `其他题材`,
      stocks: allStocks
    };
  }
  
  return tables;
});

// 检查分组是否展开
const isGroupExpanded = (theme) => {
  // 如果从未设置过，默认展开
  if (groupExpandedState.value[theme] === undefined) {
    return true;
  }
  return groupExpandedState.value[theme];
};

// 分组排序函数（按股票数量降序）
const groupSort = (a, b) => {
  // 先按股票数量排序
  if (a.stocks.length !== b.stocks.length) {
    return b.stocks.length - a.stocks.length;
  }
  
  // 数量相同则按题材名称排序
  return a.theme.localeCompare(b.theme);
};

// 分组内股票排序函数
const stockSortWithinGroup = (a, b) => {
  const isDown = selectedPool.value === 'limit_down';
  
  // 1. 按板数排序（降序）
  const boardsA = extractBoards(a.limitUpBoardsText || '0');
  const boardsB = extractBoards(b.limitUpBoardsText || '0');
  if (boardsA !== boardsB) {
    return boardsB - boardsA;
  }
  
  // 2. 按时间排序（升序）
  const timeA = a.first_limit_up === '-' ? '24:00:00' : a.first_limit_up;
  const timeB = b.first_limit_up === '-' ? '24:00:00' : b.first_limit_up;
  if (timeA !== timeB) {
    return timeA.localeCompare(timeB);
  }
  
  // 3. 按涨幅排序
  return isDown ? a.change_percent - b.change_percent : b.change_percent - a.change_percent;
};

// 切换分组展开/折叠状态
const toggleGroup = (theme) => {
  groupExpandedState.value[theme] = !isGroupExpanded(theme);
};

// 时间检查函数
const checkTimeAndUpdateStatus = () => {
  if (!isToday.value) return; 
  if (isAutoRefreshManuallySet.value) return;
  
  const shouldBeActive = isWithinTradingHours();
  
  if (autoRefresh.value !== shouldBeActive) {
    autoRefresh.value = shouldBeActive;
    if (autoRefresh.value) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  }
};

// 数据请求与过滤
const fetchStockData = async (isAutoRefresh = false) => {
  if (isAutoRefresh && !autoRefresh.value) return;
  if (isRefreshing.value) return;
  
  isRefreshing.value = true;
  try {
    // 保存原始数据用于比较变化（去重）
    const uniqueOldData = Array.from(new Map(rawData.value.map(item => [item.symbol, item])).values());
    const isDown = selectedPool.value === 'limit_down';
    
    let url = `https://flash-api.xuangubao.com.cn/api/pool/detail?pool_name=${selectedPool.value}`;
    if (selectedDate.value !== today) {
      url += `&date=${selectedDate.value}`;
    }
    
    const res = await axios.get(url);
    const newData = res.data.code === 20000 
      ? (res.data.data || []).filter(stock => !isSTStock(stock.stock_chi_name))
      : [];
      
    const formattedNewData = newData.map(stock => formatStockData(stock, isDown));
    const changes = findStockChanges(uniqueOldData, formattedNewData);
    const hasSignificantChanges = changes.added.length > 0 || changes.removed.length > 0 || changes.changed.length > 0;
    
    if (hasSignificantChanges) {
      formattedNewData.forEach(stock => {
        const isChanged = changes.changed.some(s => s.symbol === stock.symbol);
        stock.wasUpdated = isChanged || changes.added.some(s => s.symbol === stock.symbol);
        stock.updateTime = new Date().toISOString();
        
        // 初始化图表加载状态
        if (!stockChartLoading.value[stock.symbol]) {
          stockChartLoading.value[stock.symbol] = true;
        }
      });
      
      rawData.value = formattedNewData;
      updatedStocks.value = changes;
      
      if (isAutoRefresh && showUpdateTip.value) {
        showUpdateTip.value = true;
        setTimeout(() => {
          if (showUpdateTip.value) {
            hideUpdateTip();
          }
        }, 15000);
      }
    } else {
      formattedNewData.forEach(stock => {
        const oldStock = uniqueOldData.find(s => s.symbol === stock.symbol);
        if (oldStock) {
          stock.wasUpdated = oldStock.wasUpdated;
        }
        
        // 初始化图表加载状态
        if (!stockChartLoading.value[stock.symbol]) {
          stockChartLoading.value[stock.symbol] = true;
        }
      });
      rawData.value = formattedNewData;
    }
    
    error.value = '';
  } catch (err) {
    error.value = `请求失败: ${err.message || '请检查网络'}`;
  } finally {
    loading.value = false;
    isRefreshing.value = false;
  }
};

// 股票数据格式化 - 新增保存所有题材的字段
const formatStockData = (stock, isDown = false) => {
  const relatedPlates = stock.surge_reason?.related_plates || [];
  const allThemes = relatedPlates.map(plate => plate.plate_name?.trim() || '未知题材').filter(Boolean);
  const plateCount = allThemes.length;
  const hasMultiplePlates = plateCount > 1;
  
  // 确保板数数据始终有值
  const boardIndicator = getLimitDisplayText(stock, isDown) || '-';
  
  return {
    symbol: stock.symbol,
    stock_chi_name: stock.stock_chi_name,
    price: stock.price,
    change_percent: stock.change_percent,
    limit_up_days: stock.limit_up_days || 0,
    limit_down_days: stock.limit_down_days || 0,
    new_stock_break_limit_up: stock.new_stock_break_limit_up || 0,
    m_days_n_boards_boards: stock.m_days_n_boards_boards || 0,
    m_days_n_boards_days: stock.m_days_n_boards_days || 0,
    first_limit_up: formatLimitTime(stock.first_limit_up || stock.first_limit_down, isDown),
    limitUpBoardsText: getLimitDisplayText(stock, isDown) || '-',
    boardIndicator: boardIndicator,
    primaryTheme: allThemes[0] || '无题材',
    allThemes: allThemes.length > 0 ? allThemes : ['无题材'],
    surge_reason: stock.surge_reason || {},
    wasUpdated: false,
    hasMultiplePlates: hasMultiplePlates,
    plateCount: plateCount,
    breakLimitUpTimes: stock.break_limit_up_times || stock.break_limit_down_times || 0,
    updateTime: new Date().toISOString()
  };
};

// 涨跌停板数显示逻辑，优化：当X/Y中X等于Y时直接显示数字
const getLimitDisplayText = (stock, isDown = false) => {
  try {
    if (isDown) {
      // 跌停池逻辑：显示连跌数
      const limitDownDays = Number(stock.limit_down_days) || Number(stock.limit_up_days) || 0;
      return limitDownDays > 0 ? `${limitDownDays}` : '-';
    }
    
    // 涨停相关逻辑 - 按规则比较连板数和X天Y板数据
    const days = Number(stock.m_days_n_boards_days) || 0; // X值(天数)
    const boards = Number(stock.m_days_n_boards_boards) || 0; // Y值(板数)
    const limitUpDays = Number(stock.limit_up_days) || 0; // 连板数
    
    // 根据规则：如果连板数量大于Y板，显示连板数量；否则显示X/Y
    if (limitUpDays > boards) {
      return `${limitUpDays}`;
    } else if (days > 0 && boards > 0) {
      // 优化：当X/Y中X等于Y时直接显示数字
      if (days === boards) {
        return `${days}`;
      }
      return `${days}/${boards}`;
    }
    // 其次显示连板数
    else if (limitUpDays > 0) {
      return `${limitUpDays}`;
    }
    // 无数据时显示横线
    else {
      return '-';
    }
  } catch (error) {
    console.error('Error calculating limit display text:', error);
    return '-'; // 出错时返回默认值
  }
};

// 自动刷新相关函数
const startAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
  
  refreshInterval.value = setInterval(() => {
    fetchStockData(true);
  }, 3000);
  
  fetchStockData(true);
};

const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
    refreshInterval.value = null;
  }
};

// 切换自动更新状态
const toggleAutoRefresh = () => {
  if (!isToday.value) return;
  
  isAutoRefreshManuallySet.value = true;
  autoRefresh.value = !autoRefresh.value;
  
  if (autoRefresh.value) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
};

// 切换更新提示状态
const toggleUpdateTip = () => {
  isUpdateTipManuallySet.value = true;
  showUpdateTip.value = !showUpdateTip.value;
};

// 事件处理
const handleDateChange = (date) => {
  if (date) {
    isAutoRefreshManuallySet.value = false;
    loading.value = true;
    fetchStockData();
    
    if (date === today) {
      checkTimeAndUpdateStatus();
    } else {
      autoRefresh.value = false;
      stopAutoRefresh();
    }
  }
};

// 切换数据源处理函数
const handlePoolChange = () => {
  isAutoRefreshManuallySet.value = false;
  loading.value = true;
  showUpdateTip.value = false;
  fetchStockData();
  
  if (selectedDate.value === today) {
    checkTimeAndUpdateStatus();
  } else {
    autoRefresh.value = false;
    stopAutoRefresh();
  }
};

const hideUpdateTip = () => {
  showUpdateTip.value = false;
  rawData.value.forEach(stock => {
    stock.wasUpdated = false;
  });
};

// 初始化和清理
onMounted(() => {
  fetchStockData();
  timeCheckInterval.value = setInterval(checkTimeAndUpdateStatus, 60000);
  checkTimeAndUpdateStatus();
  
  watch(selectedPool, handlePoolChange);
});

onUnmounted(() => {
  stopAutoRefresh();
  if (timeCheckInterval.value) {
    clearInterval(timeCheckInterval.value);
    timeCheckInterval.value = null;
  }
});

// 监听日期变化
watch(selectedDate, (newVal) => {
  if (newVal === today) {
    checkTimeAndUpdateStatus();
  } else {
    autoRefresh.value = false;
    stopAutoRefresh();
    isAutoRefreshManuallySet.value = false;
  }
});
</script>

<style scoped>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-size: 12px;
}

html, body {
  overflow: hidden !important;
  height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  background-color: #f9f9f9 !important;
  color: #333 !important;
}

.stock-page {
  height: 98vh;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.cursor-pointer {
  cursor: pointer;
}

/* 解决内容溢出问题 - 长文本截断 */
.truncate-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
}

/* 数据源按钮组样式 */
.data-source-button-group {
  margin-right: 15px;
  display: inline-flex;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.source-button {
  padding: 0 8px !important;
  font-size: 12px !important;
  border-radius: 0 !important;
}

:deep(.el-button-group > .el-button:not(:last-child)) {
  border-right: none !important;
}

:deep(.el-button-group > .el-button:first-child) {
  border-top-left-radius: 4px !important;
  border-bottom-left-radius: 4px !important;
}

:deep(.el-button-group > .el-button:last-child) {
  border-top-right-radius: 4px !important;
  border-bottom-right-radius: 4px !important;
}

/* 日期导航按钮样式 */
.date-nav-buttons {
  margin-right: 10px;
  display: inline-flex;
}

.date-nav-buttons .el-button {
  padding: 0 8px !important;
  font-size: 11px !important;
}

/* 跌停池特殊样式 */
.limit-down .stock-name {
  color: #1890ff;
}

.down-indicator {
  color: #1890ff;
  background-color: rgba(24, 144, 255, 0.1);
}

/* 提示框中的其他题材信息 */
.tooltip-themes {
  margin-top: 5px;
  font-size: 12px;
  color: #ff0000;
  padding-top: 3px;
  border-top: 1px dashed #eee;
}

/* 数据更新提示 */
.update-tip {
  position: fixed;
  top: 70px;
  right: 20px;
  background-color: #fff;
  color: #333;
  border: 1px solid #722ed1;
  border-radius: 4px;
  font-size: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 900;
  width: 420px;
  max-height: 450px;
  overflow-y: auto;
  transition: all 0.3s ease;
}

.update-tip-header {
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
  font-weight: 500;
  color: #722ed1;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.update-details {
  padding: 8px 12px;
}

.update-section {
  margin-bottom: 12px;
}

.update-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 12px;
  margin-bottom: 6px;
  font-weight: 500;
  padding-left: 5px;
}

.added-title {
  color: #ff4d4f;
}

.removed-title {
  color: #52c41a;
}

.changed-title {
  color: #faad14;
}

.stock-list {
  padding-left: 20px;
  font-size: 12px;
}

.stock-item {
  margin-bottom: 8px;
  line-height: 1.4;
  padding: 4px;
  border-radius: 3px;
  background-color: #ffffff;
}

.stock-item:last-child {
  margin-bottom: 0;
}

.stock-name {
  font-weight: 500;
  margin-bottom: 3px;
  font-size: 12px;
}

.change-details {
  padding-left: 15px;
  margin-top: 4px;
}

.change-detail {
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.change-field {
  color: #666;
  min-width: 70px;
  font-size: 12px;
}

.old-value {
  text-decoration: line-through;
  color: #999;
  margin: 0 4px;
  font-size: 12px;
}

.change-arrow {
  color: #ccc;
  margin: 0 2px;
  font-size: 12px;
}

.new-value {
  font-weight: 500;
  margin: 0 4px;
  font-size: 12px;
}

.new-value.positive, .change-detail:has(.new-value.positive) .change-arrow {
  color: #ff4d4f;
}

.new-value.negative, .change-detail:has(.new-value.negative) .change-arrow {
  color: #52c41a;
}

.update-tip-footer {
  padding: 6px 12px;
  border-top: 1px solid #eee;
  font-size: 10px;
  color: #666;
  text-align: right;
  cursor: pointer;
}

.update-tip-footer:hover {
  background-color: #f5f5f5;
}

/* 顶部栏样式 - 固定置顶 */
.page-header {
  height: 60px !important;
  padding: 0 20px !important;
  margin: 0 !important;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: none;
  width: 100%;
  z-index: 1000;
  flex-shrink: 0;
  position: fixed !important;
  top: 0;
  left: 0;
  right: 0;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
}

.header-title {
  flex: 0 0 auto;
  padding-right: 12px;
  white-space: nowrap;
}

.header-title .el-title {
  margin: 0 !important;
  font-size: 14px !important;
  line-height: 50px;
  color: #333 !important;
}

.header-functions {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  height: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  gap: 8px;
  padding: 0;
  margin: 0;
}

.header-functions::-webkit-scrollbar {
  display: none;
}

.stats-wrapper {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  white-space: nowrap;
  color: #666;
}

.stat-item {
  padding: 0 4px;
}

.stat-separator {
  color: #ddd;
  padding: 0 2px;
}

.auto-refresh-status {
  padding: 0 4px;
  color: #1890ff;
  display: flex;
  align-items: center;
  gap: 3px;
  transition: color 0.2s ease;
  position: relative;
  padding-right: 15px;
  font-size: 12px;
}

.update-tip-status {
  padding: 0 4px;
  color: #faad14;
  display: flex;
  align-items: center;
  gap: 3px;
  transition: color 0.2s ease;
  position: relative;
  padding-right: 15px;
  font-size: 12px;
}

.auto-refresh-status:hover, .update-tip-status:hover {
  color: #722ed1;
}

.auto-refresh-status .manual-indicator, .update-tip-status .manual-indicator {
  position: absolute;
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: #faad14;
}

.auto-refresh-status.refreshing {
  color: #722ed1;
}

.auto-refresh-status.manually-set, .update-tip-status.manually-set {
  font-weight: 500;
}

.date-picker {
  width: 130px !important;
  font-size: 10px !important;
  margin: 0 !important;
}

/* 主内容区样式 - 占据剩余空间，在顶部栏下方 */
.main-content {
  padding: 10px !important;
  margin: 0 !important;
  margin-top: 60px !important;
  background-color: #f9f9f9 !important;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 16个表格容器 - 分为上下两排 */
.sixteen-tables-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 10px;
  overflow: hidden;
}

/* 表格行容器 */
.tables-row {
  display: flex;
  width: 100%;
  flex: 1;
  gap: 10px;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 5px;
}

.tables-row::-webkit-scrollbar {
  height: 6px;
}

.tables-row::-webkit-scrollbar-thumb {
  background-color: #ddd;
  border-radius: 3px;
}

.tables-row::-webkit-scrollbar-track {
  background-color: #f5f5f5;
}

/* 单个表格容器 */
.table-wrapper {
  flex: 1;
  min-width: 220px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 最后一个表格宽度调整以容纳题材列 */
.tables-row.bottom-row .table-wrapper:nth-child(8) {
  min-width: 220px;
}

/* 表格内容容器 */
.table-container {
  width: 100%;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* 表格滚动内容区 */
.table-scrollable-content {
  overflow-y: auto;
  flex-grow: 1;
  min-height: 0;
}

.table-scrollable-content::-webkit-scrollbar {
  width: 5px;
}

.table-scrollable-content::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 3px;
}

.table-scrollable-content::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}

.table-scrollable-content::-webkit-scrollbar-thumb:hover {
  background: #ccc;
}

/* 分组容器 */
.groups-container {
  width: 100%;
}

/* 空表格占位符 */
.empty-table-placeholder {
  text-align: center;
  padding: 15px 0;
  color: #999;
  font-size: 12px;
}

/* 题材分组 */
.theme-group {
  border-bottom: 1px solid #f0f0f0;
}

.theme-group:last-child {
  border-bottom: none;
}

/* 分组标题 */
.group-header {
  background-color: #f7f7fa;
  cursor: pointer;
  transition: background-color 0.2s;
}

.group-header:hover {
  background-color: #f0f0f5;
}

.group-header-content {
  display: flex;
  align-items: center;
  padding: 8px 10px;
}

.group-header-content .fa {
  margin-right: 5px;
  color: #999;
  transition: transform 0.2s;
  width: 12px;
  text-align: center;
  font-size: 12px;
}

.group-theme {
  font-size: 12px;
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
  gap: 5px;
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-count {
  font-size: 9px;
  color: #722ed1;
  background-color: rgba(114, 46, 209, 0.1);
  padding: 0 3px;
  border-radius: 6px;
  font-weight: normal;
}

/* 溢出题材指示器 */
.overflow-indicator {
  font-size: 9px;
  color: #faad14;
  margin-left: 5px;
}

/* 分组内股票列表 */
.group-stocks {
  transition: max-height 0.3s ease-out;
  overflow: hidden;
}

/* 列表项 */
.stock-list-item {
  display: flex;
  align-items: center;
  padding: 0;
  transition: background-color 0.2s;
  height: 32px;
}

/* 带题材列的列表项 */
.stock-list-item.with-theme-column {
  min-width: 300px;
}

.stock-list-item:last-child {
  border-bottom: none;
}

.stock-list-item:hover {
  background-color: #f9f9f9;
}

.stock-list-item.stock-updated {
  background-color: #ffffff;
  animation: pulse 2s ease-in-out;
}

.stock-list-item.multi-plate {
  background-color: #f0f7ff;
}

.stock-list-item.limit-down {
  background-color: #f6ffed;
}

@keyframes pulse {
  0% { background-color: #ffffff; }
  50% { background-color: #ffffff; }
  100% { background-color: #ffffff; }
}

/* 列表项内容 */
.list-item {
  padding: 0 6px;
  display: flex;
  align-items: center;
  height: 100%;
  overflow: hidden;
}

.list-item:last-child {
  border-right: none;
}

.boards-item {
  width: 40px;
  justify-content: center;
}

/* 题材列内容样式 */
.theme-item {
  width: 100px;
  white-space: nowrap;
}

.stock-theme {
  font-size: 11px;
  color: #722ed1;
  font-weight: 500;
}

.name-item {
  flex-grow: 1;
  min-width: 100px;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 有题材列时调整名称列 */
.name-item.with-theme {
  min-width: 80px;
}

.change-item {
  width: 70px;
  justify-content: center;
}

/* 板数指标样式 */
.board-indicator {
  font-size: 9px;
  font-weight: 600;
  color: #722ed1;
  background-color: rgba(114, 46, 209, 0.1);
  padding: 1px 3px;
  border-radius: 2px;
  min-width: 16px;
  display: inline-block;
  text-align: center;
}

/* 股票名称样式 */
.stock-name {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

/* 股票代码样式 */
.stock-code {
  font-size: 9px;
  color: #666;
  margin-left: 3px;
}

/* 涨跌幅样式 */
.change-percent {
  font-size: 10px;
  font-weight: 500;
  cursor: pointer; /* 提示用户这里可以交互 */
}

.positive {
  color: #ff4d4f;
}

.negative {
  color: #52c41a;
}

/* 分时图弹窗样式 */
:deep(.el-popover) {
  padding: 0 !important;
  border-radius: 6px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.chart-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.chart-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

.stock-chart-iframe {
  border-radius: 6px;
}

/* 提示组件样式 */
:deep(.el-alert) {
  margin: 8px 0 !important;
  font-size: 11px !important;
}

:deep(.el-empty) {
  margin: 30px 0 !important;
}

:deep(.el-empty__description) {
  font-size: 11px !important;
}

/* 骨架屏样式 */
:deep(.el-skeleton__bg) {
  background-color: #f5f5f5 !important;
}

/* 提示框样式 */
:deep(.el-tooltip__popper) {
  max-width: 200px;
  font-size: 9px;
}

/* 响应式调整 */
@media (max-width: 1600px) {
  .table-wrapper {
    min-width: 200px;
  }
  
  .truncate-text {
    max-width: 80px;
  }
}

@media (max-width: 1200px) {
  .table-wrapper {
    min-width: 180px;
  }
  
  .boards-header, .boards-item {
    width: 40px;
  }
  
  .change-header, .change-item {
    width: 60px;
  }
  
  .truncate-text {
    max-width: 70px;
  }
}

@media (max-width: 768px) {
  .header-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    height: auto;
    padding: 8px 0;
  }
  
  .header-title {
    padding-right: 0;
    width: 100%;
  }
  
  .header-functions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .update-tip {
    width: calc(100% - 30px);
    top: 100px;
  }
  
  .main-content {
    margin-top: 90px !important;
  }
  
  .table-wrapper {
    min-width: 160px;
  }
  
  .truncate-text {
    max-width: 60px;
  }
  
  /* 移动端调整分时图大小 */
  :deep(.el-popover) {
    width: 90vw !important;
  }
  
  .stock-chart-iframe {
    height: 250px !important;
  }
}
</style>
