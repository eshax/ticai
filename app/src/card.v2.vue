<template>
  <!-- 模板部分保持不变 -->
  <div class="stock-page">
    <el-header class="page-header sticky-header">
      <div class="header-container">
        <div class="header-title">
          <el-title level="3">股票数据分析平台</el-title>
        </div>

        <div class="header-functions">
          <div class="stats-wrapper">
            <span class="stat-item">总股票数: {{ totalCount }}</span>
            <span class="stat-separator">|</span>
            <span class="stat-item">板块数量: {{ sortedGroups.length }}</span>
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
              class="display-mode-toggle cursor-pointer"
              @click="toggleDisplayMode"
            >
              <i class="fa" :class="displayMode === 'detailed' ? 'fa-compress' : 'fa-expand'"></i>
              显示方式: {{ displayMode === 'detailed' ? '详细' : '精简' }}
              <span v-if="displayMode === 'compact'" class="compact-hint">(仅显示板块首行)</span>
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
        </div>
      </div>
    </el-header>

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
              <li v-for="stock in updatedStocks.added" :key="'added_' + stock.symbol + '_' + stock.plateName" class="stock-item">
                {{ stock.stock_chi_name }}({{ formatStockCode(stock.symbol) }})
                <span v-if="stock.plateName && stock.plateName !== '未知板块'"> - {{ stock.plateName }}</span>
              </li>
            </ul>
          </div>
          <div v-if="updatedStocks.removed.length > 0" class="update-section">
            <div class="section-title removed-title">炸板 {{ updatedStocks.removed.length }} 只股票:</div>
            <ul class="stock-list">
              <li v-for="stock in updatedStocks.removed" :key="'removed_' + stock.symbol + '_' + stock.plateName" class="stock-item">
                {{ stock.stock_chi_name }}({{ formatStockCode(stock.symbol) }})
                <span v-if="stock.plateName && stock.plateName !== '未知板块'"> - {{ stock.plateName }}</span>
              </li>
            </ul>
          </div>
          <div v-if="updatedStocks.changed.length > 0" class="update-section">
            <div class="section-title changed-title">数据变动 {{ updatedStocks.changed.length }} 只股票:</div>
            <ul class="stock-list">
              <li v-for="stock in updatedStocks.changed" :key="'changed_' + stock.symbol + '_' + stock.plateName" class="stock-item">
                <div class="stock-name">
                  {{ stock.stock_chi_name }}({{ formatStockCode(stock.symbol) }})
                  <span v-if="stock.plateName && stock.plateName !== '未知板块'"> - {{ stock.plateName }}</span>
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
            <div v-for="i in 3" :key="i" class="skeleton-group">
              <div style="height: 30px; background: #f5f5f5; margin: 10px 0;"></div>
              <div style="height: auto; min-height: 20px; background: #f5f5f5; margin-bottom: 15px;"></div>
              <el-row :gutter="16">
                <el-col 
                  v-for="j in 12" 
                  :key="j" 
                  :xs="2" :sm="2" :md="2" :lg="2" :xl="2" 
                >
                  <div style="height: 170px; background: #f5f5f5; border-radius: 4px;"></div>
                </el-col>
              </el-row>
            </div>
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
        style="margin: 10px 0 20px !important"
      />

      <!-- 无数据提示 -->
      <el-empty 
        v-if="!loading && !error && totalCount === 0" 
        :description="isNonTradingDay ? '今日为非交易日，无数据' : '暂无符合条件的股票数据'"
        style="margin: 40px 0"
      />

      <!-- 数据展示区域 -->
      <div v-else-if="!loading && !error" class="data-content">
        <div class="groups-container">
          <div 
            v-for="group in sortedGroups" 
            :key="group.plateName" 
            class="plate-group"
          >
            <div class="group-header">
              <span class="group-count">{{ group.stocks.length }}</span>
              <div class="reason-container">
                <h3 class="group-title">
                  {{ group.plateName }}
                  <span class="plate-reason"> {{ group.plateReason }}</span>
                </h3>
              </div>
            </div>

            <el-row :gutter="16" class="stock-row">
              <!-- 精简模式下只显示前12只股票（第一行） -->
              <el-col 
                v-for="stock in (displayMode === 'compact' ? group.stocks.slice(0, 12) : group.stocks)" 
                :key="stock.symbol + '_' + group.plateName"
                :xs="2" :sm="2" :md="2" :lg="2" :xl="2"
                class="stock-col"
              >
                <el-card 
                  class="stock-card" 
                  hoverable 
                  :body-style="{ padding: '0px' }"
                  :class="{ 
                    'stock-updated': stock.wasUpdated,
                    'multi-plate': stock.hasMultiplePlates,
                    'compact-view': displayMode === 'compact'
                  }"
                >
                  <template #header>
                    <div class="card-header">
                      <el-tag 
                        v-if="group.plateName === '其他板块' && stock.originalPlateName && stock.originalPlateName !== '未知板块'"
                        size="mini"
                        class="plate-tag"
                        type="info"
                      >
                        {{ stock.originalPlateName }}
                      </el-tag>
                      <div class="stock-title">
                        <div class="name-with-board">
                          <span class="board-indicator">{{ stock.boardIndicator }}</span>
                          <span class="stock-name">{{ stock.stock_chi_name }}</span>
                        </div>
                        <!-- 仅在详细模式下显示股票代码，使用格式化函数处理 -->
                        <span 
                          class="stock-code" 
                          v-if="displayMode === 'detailed'"
                        >
                          {{ formatStockCode(stock.symbol) }}
                        </span>
                      </div>
                    </div>
                  </template>
                  <template #default v-if="displayMode === 'detailed'">
                    <el-descriptions column="1" border :size="'small'">
                      <el-descriptions-item label="价格" :label-style="{ padding: '4px 0' }">
                        <span class="price">{{ stock.price }}元</span>
                      </el-descriptions-item>
                      <el-descriptions-item label="涨幅" :label-style="{ padding: '4px 0' }">
                        <span class="change-percent" :class="{ positive: stock.change_percent > 0, negative: stock.change_percent < 0 }">
                          {{ (stock.change_percent * 100).toFixed(2) }}%
                        </span>
                      </el-descriptions-item>
                      <!-- 开板次数显示 -->
                      <el-descriptions-item label="开板" :label-style="{ padding: '4px 0' }">
                        <span class="break-limit-count">{{ stock.breakLimitUpTimes }}次</span>
                      </el-descriptions-item>
                      <el-descriptions-item label="首涨" :label-style="{ padding: '4px 0' }">
                        <span class="limit-up-time">{{ stock.first_limit_up }}</span>
                      </el-descriptions-item>
                    </el-descriptions>
                  </template>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </div>
      </div>
    </el-main>
  </div>
</template>

<script setup>
// 导入部分保持不变
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
import axios from 'axios';
import { 
  ElHeader, ElMain, ElRow, ElCol, ElTitle, 
  ElTag, ElSkeleton, ElAlert, 
  ElEmpty, ElCard, ElDescriptions, ElDescriptionsItem,
  ElDatePicker
} from 'element-plus';

// 股票代码格式化函数 - 去除所有字母前缀和后缀，只保留数字部分
const formatStockCode = (code) => {
  if (!code) return '';
  const numbers = code.match(/\d+/g);
  return numbers ? numbers.join('') : code;
};

// 日期处理工具
const getToday = () => new Date().toISOString().split('T')[0];
const isWeekend = (dateStr) => {
  const day = new Date(dateStr).getDay();
  return day === 0 || day === 6;
};
const getLastWorkday = () => {
  const date = new Date();
  const day = date.getDay();
  const daysToSubtract = day === 0 ? 2 : day === 6 ? 1 : 1;
  date.setDate(date.getDate() - daysToSubtract);
  return date.toISOString().split('T')[0];
};

// 时间检查函数 - 判断是否在9:00-15:00之间
const isWithinTradingHours = () => {
  const now = new Date();
  const hours = now.getHours();
  return hours >= 9 && hours < 15;
};

// 涨停时间格式化
const formatLimitUpTime = (time) => {
  if (!time || time === '0' || time === 'null') return '未涨停';

  if (typeof time === 'number' || /^\d+$/.test(time)) {
    const timestamp = Number(time);
    const msTimestamp = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
    const date = new Date(msTimestamp);
    if (isNaN(date.getTime())) return '时间无效';
    
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
  }

  return '格式错误';
};

// 提取板数（用于排序）
const extractBoards = (text) => {
  const match = text.match(/(\d+)板/);
  return match ? Number(match[1]) : 0;
};

// 分组内股票排序（板数降序→时间升序）
const sortStocks = (a, b) => {
  const boardsA = extractBoards(a.limitUpBoardsText);
  const boardsB = extractBoards(b.limitUpBoardsText);
  
  if (boardsA !== boardsB) {
    return boardsB - boardsA;
  }
  
  const timeA = a.first_limit_up === '未涨停' ? '24:00:00' : a.first_limit_up;
  const timeB = b.first_limit_up === '未涨停' ? '24:00:00' : b.first_limit_up;
  return timeA.localeCompare(timeB);
};

// 涨停板数显示逻辑
const getLimitUpBoardsText = (stock) => {
  const boards = stock.m_days_n_boards_boards || 0;
  const days = stock.m_days_n_boards_days || 0;
  const limitUpDays = stock.limit_up_days || 0;

  if (boards > 0 && days > 0) {
    return boards === days ? `${boards}板` : `${days}天${boards}板`;
  } else {
    return `${limitUpDays}板`;
  }
};

// 获取卡片卡片头部显示的涨停板指标
const getBoardIndicator = (stock) => {
  const boards = stock.m_days_n_boards_boards || 0;
  const days = stock.m_days_n_boards_days || 0;
  const limitUpDays = stock.limit_up_days || 0;

  if (boards > 0 && days > 0) {
    return boards === days ? `${boards}` : `${days}/${boards}`;
  } else {
    return `${limitUpDays}`;
  }
};

// ST股过滤
const isSTStock = (stockName) => stockName.includes('ST') || stockName.includes('*ST');

// 比较新旧股票数据并获取具体变化内容
const getStockChanges = (oldStock, newStock) => {
  if (!oldStock || !newStock) return [];
  
  const changes = [];
  const compareFields = [
    { field: 'price', label: '当前价格' },
    { field: 'change_percent', label: '涨跌幅' },
    { field: 'limitUpBoardsText', label: '涨停板数' },
    { field: 'breakLimitUpTimes', label: '开板次数' },
    { field: 'first_limit_up', label: '首次涨停' },
    { field: 'hasMultiplePlates', label: '多板块属性' },
    { field: 'boardIndicator', label: '涨停板指标' }
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
  if (change.field === 'change_percent') {
    return change.newValue > (change.oldValue || 0);
  }
  if (change.field === 'price') {
    return change.newValue > (change.oldValue || 0);
  }
  if (change.field === 'limitUpBoardsText' || change.field === 'boardIndicator') {
    const oldBoards = extractBoards(change.oldValue || '0板');
    const newBoards = extractBoards(change.newValue || '0板');
    return newBoards > oldBoards;
  }
  return false;
};

// 判断变化是否为负向
const isNegativeChange = (change) => {
  if (change.field === 'change_percent') {
    return change.newValue < (change.oldValue || 0);
  }
  if (change.field === 'price') {
    return change.newValue < (change.oldValue || 0);
  }
  if (change.field === 'limitUpBoardsText' || change.field === 'boardIndicator') {
    const oldBoards = extractBoards(change.oldValue || '0板');
    const newBoards = extractBoards(change.newValue || '0板');
    return newBoards < oldBoards;
  }
  // 开板次数增加视为负面变化
  if (change.field === 'breakLimitUpTimes') {
    return change.newValue > (change.oldValue || 0);
  }
  return false;
};

// 获取字段显示名称
const getFieldName = (field) => {
  const fieldNames = {
    'price': '当前价格',
    'change_percent': '涨跌幅',
    'limitUpBoardsText': '涨停板数',
    'breakLimitUpTimes': '开板次数',
    'first_limit_up': '首次涨停',
    'hasMultiplePlates': '多板块属性',
    'boardIndicator': '涨停板指标'
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
      return `${value}次`;
    case 'hasMultiplePlates':
      return value ? '是' : '否';
    default:
      return value;
  }
};

// 获取股票所属的主要板块
const getStockMainPlate = (stock, groups) => {
  for (const group of groups) {
    if (group.stocks.some(s => s.symbol === stock.symbol)) {
      return group.plateName;
    }
  }
  return stock.originalPlateName || '未知板块';
};

// 核心修改：检查股票是否已存在于相同板块中
const isStockInSamePlate = (stock, plateName, groups) => {
  // 检查所有板块中是否存在相同股票代码且板块名称相同的股票
  for (const group of groups) {
    if (group.plateName === plateName) {
      const exists = group.stocks.some(s => s.symbol === stock.symbol);
      if (exists) return true;
    }
  }
  return false;
};

// 找出新增、移除和变动的股票（核心修改）
const findStockChanges = (oldData, newData, oldGroups) => {
  const oldSymbols = new Set(oldData.map(s => s.symbol));
  const newSymbols = new Set(newData.map(s => s.symbol));
  
  // 新增股票（涨停）- 核心修改：检查是否已存在于相同板块
  const added = newData
    .filter(stock => !oldSymbols.has(stock.symbol))
    .map(stock => {
      const plateName = getStockMainPlate(stock, oldGroups);
      return { ...stock, plateName };
    })
    // 过滤掉已存在于相同板块的股票
    .filter(stock => !isStockInSamePlate(stock, stock.plateName, oldGroups));
  
  // 移除股票（炸板）
  const removed = oldData
    .filter(stock => !newSymbols.has(stock.symbol))
    .map(stock => ({
      ...stock,
      plateName: getStockMainPlate(stock, oldGroups)
    }));
  
  // 变动股票 - 包含具体变动内容
  const changed = newData
    .filter(stock => oldSymbols.has(stock.symbol))
    .map(stock => {
      const oldStock = oldData.find(s => s.symbol === stock.symbol);
      const changes = getStockChanges(oldStock, stock);
      return {
        ...stock,
        plateName: getStockMainPlate(stock, oldGroups),
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
const autoRefresh = ref(false);
const isAutoRefreshManuallySet = ref(false);
const refreshInterval = ref(null);
const timeCheckInterval = ref(null);
const isRefreshing = ref(false);
const showUpdateTip = ref(false);
const updatedStocks = ref({ added: [], removed: [], changed: [] });
const displayMode = ref('detailed'); // 'detailed' 或 'compact'

// 计算属性
const isToday = computed(() => selectedDate.value === today);
const isNonTradingDay = computed(() => isWeekend(selectedDate.value));
const totalCount = computed(() => rawData.value.length);

// 股票分组逻辑（核心修改：确保同一板块不重复添加相同股票）
const baseGroups = computed(() => {
  const groups = {};
  const addedStocks = new Set(); // 键格式: 板块名称_股票代码

  rawData.value.forEach(stock => {
    const relatedPlates = stock.surge_reason?.related_plates || [];
    const formattedStock = { ...stock };

    if (relatedPlates.length === 0) {
      const originalPlate = '无板块信息';
      const key = `${originalPlate}_${stock.symbol}`; // 板块名称_股票代码作为唯一键
      if (!addedStocks.has(key)) {
        groups[originalPlate] = groups[originalPlate] || { stocks: [], plateReason: '无相关板块信息' };
        groups[originalPlate].stocks.push({ ...formattedStock, originalPlateName: originalPlate });
        addedStocks.add(key);
      }
    } else {
      relatedPlates.forEach(plate => {
        const originalPlate = plate.plate_name?.trim() || '未知板块';
        const key = `${originalPlate}_${stock.symbol}`; // 板块名称_股票代码作为唯一键
        if (!addedStocks.has(key)) {
          groups[originalPlate] = groups[originalPlate] || { stocks: [], plateReason: plate.plate_reason?.trim() || '' };
          groups[originalPlate].stocks.push({ ...formattedStock, originalPlateName: originalPlate });
          addedStocks.add(key);
        }
      });
    }
  });
  return groups;
});

// 合并小板块并应用排序
const mergedGroups = computed(() => {
  const merged = {};
  const singleStocks = [];
  const singleReasons = new Map();

  Object.entries(baseGroups.value).forEach(([name, group]) => {
    if (group.stocks.length > 1) {
      merged[name] = { 
        stocks: [...group.stocks].sort(sortStocks), 
        plateReason: group.plateReason 
      };
    } else {
      singleStocks.push(...group.stocks);
      singleReasons.set(name, group.plateReason);
    }
  });

  if (singleStocks.length) {
    merged['其他板块'] = {
      stocks: [...singleStocks].sort(sortStocks),
      plateReason: `包含${singleReasons.size}个小板块（每个板块仅1只股票）`
    };
  }

  return merged;
});

// 分组间排序
const sortedGroups = computed(() => 
  Object.entries(mergedGroups.value)
    .map(([name, data]) => ({ plateName: name, ...data }))
    .sort((a, b) => b.stocks.length - a.stocks.length)
);

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
    const oldData = [...rawData.value];
    const oldGroups = [...sortedGroups.value];
    
    const url = selectedDate.value === today
      ? 'https://flash-api.xuangubao.com.cn/api/pool/detail?pool_name=limit_up'
      : `https://flash-api.xuangubao.com.cn/api/pool/detail?pool_name=limit_up&date=${selectedDate.value}`;
      
    const res = await axios.get(url);
    const newData = res.data.code === 20000 
      ? (res.data.data || []).filter(stock => !isSTStock(stock.stock_chi_name))
      : [];
      
    const formattedNewData = newData.map(stock => formatStockData(stock));
    const changes = findStockChanges(oldData, formattedNewData, oldGroups);
    const hasChanges = changes.added.length > 0 || changes.removed.length > 0 || changes.changed.length > 0;
    
    if (hasChanges) {
      formattedNewData.forEach(stock => {
        const isChanged = changes.changed.some(s => s.symbol === stock.symbol);
        stock.wasUpdated = isChanged || changes.added.some(s => s.symbol === stock.symbol);
      });
      
      rawData.value = formattedNewData;
      updatedStocks.value = changes;
      
      if (isAutoRefresh) {
        showUpdateTip.value = true;
        setTimeout(() => {
          hideUpdateTip();
        }, 15000);
      }
    }
    
    error.value = '';
  } catch (err) {
    error.value = `请求失败: ${err.message || '请检查网络'}`;
  } finally {
    loading.value = false;
    isRefreshing.value = false;
  }
};

// 股票数据格式化
const formatStockData = (stock) => {
  const plateCount = stock.surge_reason?.related_plates?.length || 0;
  const hasMultiplePlates = plateCount > 1;
  
  return {
    symbol: stock.symbol,
    stock_chi_name: stock.stock_chi_name,
    price: stock.price,
    change_percent: stock.change_percent,
    limit_up_days: stock.limit_up_days,
    m_days_n_boards_boards: stock.m_days_n_boards_boards,
    m_days_n_boards_days: stock.m_days_n_boards_days,
    first_limit_up: formatLimitUpTime(stock.first_limit_up),
    limitUpBoardsText: getLimitUpBoardsText(stock),
    boardIndicator: getBoardIndicator(stock),
    originalPlateName: '',
    surge_reason: stock.surge_reason,
    wasUpdated: false,
    hasMultiplePlates: hasMultiplePlates,
    plateCount: plateCount,
    breakLimitUpTimes: stock.break_limit_up_times || 0,
  };
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

// 切换显示方式（详细/精简）
const toggleDisplayMode = () => {
  displayMode.value = displayMode.value === 'detailed' ? 'compact' : 'detailed';
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
/* 样式部分保持不变 */
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0 !important;
  padding: 0 !important;
  background-color: #f9f9f9 !important;
  color: #333 !important;
}

.stock-page {
  min-height: 100vh;
  background-color: #f9f9f9;
  padding-top: 50px;
}

.cursor-pointer {
  cursor: pointer;
}

/* 新增：精简模式提示样式 */
.compact-hint {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
  font-weight: normal;
}

.truncated-hint {
  font-size: 12px;
  color: #faad14;
  margin-left: 5px;
  font-weight: normal;
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
  font-size: 13px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 900;
  width: 420px;
  max-height: 450px;
  overflow-y: auto;
  transition: all 0.3s ease;
}

.update-tip-header {
  padding: 10px 15px;
  border-bottom: 1px solid #eee;
  font-weight: 500;
  color: #722ed1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.update-details {
  padding: 10px 15px;
}

.update-section {
  margin-bottom: 15px;
}

.update-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 12px;
  margin-bottom: 8px;
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
  margin-bottom: 10px;
  line-height: 1.4;
  padding: 6px;
  border-radius: 3px;
  background-color: #f9f9f9;
}

.stock-item:last-child {
  margin-bottom: 0;
}

.stock-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.change-details {
  padding-left: 15px;
  margin-top: 5px;
}

.change-detail {
  margin-bottom: 3px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.change-field {
  color: #666;
  min-width: 80px;
}

.old-value {
  text-decoration: line-through;
  color: #999;
  margin: 0 5px;
}

.change-arrow {
  color: #ccc;
  margin: 0 3px;
}

.new-value {
  font-weight: 500;
  margin: 0 5px;
}

.new-value.positive, .change-detail:has(.new-value.positive) .change-arrow {
  color: #ff4d4f;
}

.new-value.negative, .change-detail:has(.new-value.negative) .change-arrow {
  color: #52c41a;
}

.update-tip-footer {
  padding: 8px 15px;
  border-top: 1px solid #eee;
  font-size: 12px;
  color: #666;
  text-align: right;
  cursor: pointer;
}

.update-tip-footer:hover {
  background-color: #f5f5f5;
}

.update-tip:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

/* 顶部区域样式 */
.page-header {
  height: 60px !important;
  padding: 0 20px !important;
  margin: 0 !important;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: none;
  width: 100%;
  z-index: 1000;
}

.sticky-header {
  position: fixed;
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
  padding-right: 15px;
  white-space: nowrap;
}

.header-title .el-title {
  margin: 0 !important;
  font-size: 16px !important;
  line-height: 60px;
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
  gap: 10px;
  padding: 0;
  margin: 0;
}

.header-functions::-webkit-scrollbar {
  display: none;
}

.stats-wrapper {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  white-space: nowrap;
  color: #666;
}

.stat-item {
  padding: 0 5px;
}

.stat-separator {
  color: #ddd;
  padding: 0 2px;
}

.auto-refresh-status {
  padding: 0 5px;
  color: #1890ff;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s ease;
  position: relative;
  padding-right: 18px;
}

.display-mode-toggle {
  padding: 0 5px;
  color: #1890ff;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s ease;
}

.auto-refresh-status:hover, .display-mode-toggle:hover {
  color: #722ed1;
}

.auto-refresh-status .manual-indicator {
  position: absolute;
  right: 3px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #faad14;
}

.auto-refresh-status.refreshing {
  color: #722ed1;
}

.auto-refresh-status.manually-set {
  font-weight: 500;
}

.date-picker {
  width: 145px !important;
  font-size: 12px !important;
  margin: 0 !important;
}

/* 主内容区样式 */
.main-content {
  padding: 20px !important;
  margin: 0 !important;
  background-color: #f9f9f9 !important;
}

/* 板块与股票卡片样式 */
.groups-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.plate-group {
  background: #fff;
  padding: 10px 0px 0px 15px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #eee;
}

.plate-group:first-child {
  border-left: 4px solid #722ed1;
}

.group-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f5f5f5;
}

.group-count {
  font-size: 16px;
  font-weight: 600;
  color: #722ed1;
  margin-right: 10px;
  min-width: 24px;
  text-align: center;
  padding-top: 3px;
}

.group-title {
  margin: 0 0 5px 0;
  font-size: 17px;
  color: #333;
  font-weight: 500;
}

.count-text {
  font-size: 13px;
  color: #666;
  font-weight: normal;
  margin-left: 8px;
}

.plate-reason {
  margin: 0;
  font-size: 12px;
  color: #dd6868;
  line-height: 1.5;
  transition: all 0.3s ease;
}

.stock-row {
  width: 100%;
  margin-bottom: 0 !important;
}

.stock-col {
  margin-bottom: 12px !important;
}

/* 调整卡片样式以适应一行12个的布局 */
.stock-card {
  height: 100%;
  min-height: 120px;
  transition: all 0.3s ease;
  border-radius: 6px;
  background-color: #fff !important;
  border: 1px solid #eee !important;
  width: 100%; /* 确保卡片宽度充满列 */
}

/* 设置卡片header内边距为10px */
:deep(.el-card__header) {
  padding: 8px !important;
}

/* 精简模式下的卡片样式 */
.stock-card.compact-view {
  min-height: 30px;
  width: 100%;
  max-width: none;
  margin: 0 auto;
  display: inline-flex;
  flex-direction: column;
}

.stock-card.multi-plate {
  background-color: #fff8e6 !important;
  border-color: #fae198 !important;
}

.stock-card.stock-updated {
  border: 1px solid #adcdfd !important;
  animation: pulse 2s ease-in-out;
}

.stock-card.multi-plate.stock-updated {
  border: 1px solid #ffcc00 !important;
  box-shadow: 0 0 0 2px rgba(255, 204, 0, 0.2) !important;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.3); }
  70% { box-shadow: 0 0 0 8px rgba(82, 196, 26, 0); }
  100% { box-shadow: 0 0 0 0 rgba(82, 196, 26, 0); }
}

.stock-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  border-color: #ddd !important;
}

/* 卡片头部样式 */
.card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0 2px;
  line-height: 1.2;
}

.plate-tag {
  align-self: flex-start;
  margin: 0 !important;
  padding: 0 6px;
  font-size: 11px;
  height: 18px;
  line-height: 18px;
}

.stock-title {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin: 0;
  align-items: center;
}

.name-with-board {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  overflow: visible;
  height: auto;
  align-self: center;
}

/* 精简模式下的股票名称样式 - 确保完整显示 */
.stock-card.compact-view .stock-name {
  font-size: 13px;
  white-space: nowrap;
  overflow: visible;
  text-overflow: clip;
  max-width: none;
}

.stock-name {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #333;
  line-height: 1;
  display: inline-block;
  vertical-align: middle;
}

/* 涨停板数指标样式 */
.board-indicator {
  font-size: 10px;
  font-weight: 600;
  color: #722ed1;
  background-color: rgba(114, 46, 209, 0.1);
  padding: 0 2px;
  border-radius: 3px;
  min-width: 20px;
  text-align: center;
  line-height: 12px;
  height: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  margin-top: -4px;
}

/* 多板块股票的样式调整 */
.stock-card.multi-plate .stock-name {
  color: #856404;
}

.stock-card.multi-plate .board-indicator {
  color: #856404;
  background-color: rgba(133, 100, 4, 0.1);
}

.stock-code {
  font-size: 10px;
  color: #666;
  white-space: nowrap;
  align-self: center;
}

/* 描述列表样式 */
:deep(.el-descriptions__border) {
  border-color: #eee !important;
}

.stock-card.multi-plate :deep(.el-descriptions__border) {
  border-color: #ffe082 !important;
}

:deep(.el-descriptions__cell) {
  border-color: #eee !important;
}

.stock-card.multi-plate :deep(.el-descriptions__cell) {
  border-color: #ffe082 !important;
}

.el-descriptions__item {
  padding: 4px 0 !important;
}

.el-descriptions__label {
  font-size: 12px !important;
  padding-right: 8px !important;
  color: #666 !important;
}

.el-descriptions__content {
  font-size: 12px !important;
  color: #333 !important;
}

/* 数据项样式 */
.price {
  color: #5f5f5f;
  font-weight: 500;
}

.change-percent {
  font-weight: 500;
}

.positive {
  color: #ff4d4f;
}

.negative {
  color: #52c41a;
}

.limit-up-boards {
  color: #722ed1;
  font-weight: 500;
}

/* 开板次数样式 */
.break-limit-count {
  color: #faad14;
  font-weight: 500;
}

.limit-up-time {
  color: #1890ff;
  font-weight: 500;
}

/* 提示组件样式 */
:deep(.el-alert) {
  margin: 10px 0 20px !important;
}

:deep(.el-empty) {
  margin: 40px 0 !important;
}

/* 骨架屏样式 */
:deep(.el-skeleton__bg) {
  background-color: #f5f5f5 !important;
}
</style>