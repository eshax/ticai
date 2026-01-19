<template>
  <div class="yqgl-container">
    
    <div class="lists-container">
      <!-- 第一个列表 -->
      <div class="list-container">
        <div class="list-header">
          <div class="list-title">
            <span v-if="list1.length > 0" class="total-diff" :class="totalDiff1 > 0 ? 'positive' : (totalDiff1 < 0 ? 'negative' : 'zero')">
              <strong>{{ totalDiff1.toFixed(2) }}</strong>
            </span>
            <span v-if="top3Stocks1.length > 0" class="top-stocks">
              {{ top3Stocks1.map(stock => stock.name).join(' , ') }}
            </span>
          </div>
          <button @click="showDialog(1)" class="add-button">
            +
          </button>
        </div>
        <div class="table-wrapper">
          <table class="stock-table">
            <thead>
              <tr>
                <th>股票（{{ list1.length }}）</th>
                <th @click="handleSort(1, 'fund')" style="cursor: pointer;">
                  封单
                  <span v-if="sortStates[1].field === 'fund'" class="sort-indicator" :class="sortStates[1].order"></span>
                </th>
                <th>预期</th>
                <th @click="handleSort(1, 'actual')" style="cursor: pointer;">
                  涨幅
                  <span v-if="sortStates[1].field === 'actual'" class="sort-indicator" :class="sortStates[1].order"></span>
                </th>
                <th @click="handleSort(1, 'diff')" style="cursor: pointer;">
                  差值
                  <span v-if="sortStates[1].field === 'diff'" class="sort-indicator" :class="sortStates[1].order"></span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="list1.length === 0">
                <td colspan="5" style="text-align: center; padding: 40px;">
                  暂无股票数据
                </td>
              </tr>
              <tr v-else v-for="stock in list1" :key="stock.code">
                <td>{{ stock.code.replace(/^sh|^sz/, '') }} - {{ stock.name }}</td>
                <td :class="stock.fundType === 'buy' ? 'positive' : (stock.fundType === 'sell' ? 'negative' : '')">
                  {{ formatFund(stock.fund) }}
                </td>
                <td>{{ stock.expected }}</td>
                <td :class="stock.actual > 0 ? 'positive' : (stock.actual < 0 ? 'negative' : 'zero')">
                  {{ stock.actual.toFixed(2) }}%
                </td>
                <td :class="Math.abs(stock.diff) <= 3 ? 'zero' : (stock.diff > 0 ? 'positive' : 'negative')">
                  {{ stock.diff.toFixed(2) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- 第二个列表 -->
      <div class="list-container">
        <div class="list-header">
          <div class="list-title">
            <span v-if="list2.length > 0" class="total-diff" :class="totalDiff2 > 0 ? 'positive' : (totalDiff2 < 0 ? 'negative' : 'zero')">
              <strong>{{ totalDiff2.toFixed(2) }}</strong>
            </span>
            <span v-if="top3Stocks2.length > 0" class="top-stocks">
              {{ top3Stocks2.map(stock => stock.name).join(' , ') }}
            </span>
          </div>
          <button @click="showDialog(2)" class="add-button">
            +
          </button>
        </div>
        <div class="table-wrapper">
          <table class="stock-table">
            <thead>
              <tr>
                <th>股票（{{ list2.length }}）</th>
                <th @click="handleSort(2, 'fund')" style="cursor: pointer;">
                  封单
                  <span v-if="sortStates[2].field === 'fund'" class="sort-indicator" :class="sortStates[2].order"></span>
                </th>
                <th>预期</th>
                <th @click="handleSort(2, 'actual')" style="cursor: pointer;">
                  涨幅
                  <span v-if="sortStates[2].field === 'actual'" class="sort-indicator" :class="sortStates[2].order"></span>
                </th>
                <th @click="handleSort(2, 'diff')" style="cursor: pointer;">
                  差值
                  <span v-if="sortStates[2].field === 'diff'" class="sort-indicator" :class="sortStates[2].order"></span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="list2.length === 0">
                <td colspan="5" style="text-align: center; padding: 40px;">
                  暂无股票数据
                </td>
              </tr>
              <tr v-else v-for="stock in list2" :key="stock.code">

                <td>{{ stock.code.replace(/^sh|^sz/, '') }} - {{ stock.name }}</td>
                <td :class="stock.fundType === 'buy' ? 'positive' : (stock.fundType === 'sell' ? 'negative' : '')">
                  {{ formatFund(stock.fund) }}
                </td>
                <td>{{ stock.expected }}</td>
                <td :class="stock.actual > 0 ? 'positive' : (stock.actual < 0 ? 'negative' : 'zero')">
                  {{ stock.actual.toFixed(2) }}%
                </td>
                <td :class="Math.abs(stock.diff) <= 3 ? 'zero' : (stock.diff > 0 ? 'positive' : 'negative')">
                  {{ stock.diff.toFixed(2) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- 第三个列表 -->
      <div class="list-container">
        <!-- 第三个列表的上列表 -->
        <div class="list-section">
          <div class="list-header">
            <div class="list-title">
              <span v-if="list3A.length > 0" class="total-diff" :class="totalDiff3A > 0 ? 'positive' : (totalDiff3A < 0 ? 'negative' : 'zero')">
                <strong>{{ totalDiff3A.toFixed(2) }}</strong>
              </span>
              <span v-if="top3Stocks3A.length > 0" class="top-stocks">
                {{ top3Stocks3A.map(stock => stock.name).join(' , ') }}
              </span>
            </div>
            <button @click="showDialog('3A')" class="add-button">
              +
            </button>
          </div>
          <div class="table-wrapper">
            <table class="stock-table">
              <thead>
                <tr>
                  <th>股票（{{ list3A.length }}）</th>
                  <th @click="handleSort('3A', 'fund')" style="cursor: pointer;">
                    封单
                    <span v-if="sortStates['3A'].field === 'fund'" class="sort-indicator" :class="sortStates['3A'].order"></span>
                  </th>
                  <th>预期</th>
                  <th @click="handleSort('3A', 'actual')" style="cursor: pointer;">
                    涨幅
                    <span v-if="sortStates['3A'].field === 'actual'" class="sort-indicator" :class="sortStates['3A'].order"></span>
                  </th>
                  <th @click="handleSort('3A', 'diff')" style="cursor: pointer;">
                    差值
                    <span v-if="sortStates['3A'].field === 'diff'" class="sort-indicator" :class="sortStates['3A'].order"></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="list3A.length === 0">
                  <td colspan="5" style="text-align: center; padding: 20px;">
                    暂无股票数据
                  </td>
                </tr>
                <tr v-else v-for="stock in list3A" :key="stock.code">
                  <td>{{ stock.code.replace(/^sh|^sz/, '') }} - {{ stock.name }}</td>
                  <td :class="stock.fundType === 'buy' ? 'positive' : (stock.fundType === 'sell' ? 'negative' : '')">
                    {{ formatFund(stock.fund) }}
                  </td>
                  <td>{{ stock.expected }}</td>
                  <td :class="stock.actual > 0 ? 'positive' : (stock.actual < 0 ? 'negative' : 'zero')">
                  {{ stock.actual.toFixed(2) }}%
                </td>
                  <td :class="stock.diff > 0 ? 'positive' : (stock.diff < 0 ? 'negative' : 'zero')">
                    {{ stock.diff.toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- 分隔线 -->
        <div class="list-divider"></div>
        
        <!-- 第三个列表的下列表 -->
        <div class="list-section">
          <div class="list-header">
            <div class="list-title">
              <span v-if="list3B.length > 0" class="total-diff" :class="totalDiff3B > 0 ? 'positive' : (totalDiff3B < 0 ? 'negative' : 'zero')">
                <strong>{{ totalDiff3B.toFixed(2) }}</strong>
              </span>
              <span v-if="top3Stocks3B.length > 0" class="top-stocks">
                {{ top3Stocks3B.map(stock => stock.name).join(' , ') }}
              </span>
            </div>
            <button @click="showDialog('3B')" class="add-button">
              +
            </button>
          </div>
          <div class="table-wrapper">
            <table class="stock-table">
              <thead>
                <tr>
                  <th>股票（{{ list3B.length }}）</th>
                  <th @click="handleSort('3B', 'fund')" style="cursor: pointer;">
                    封单
                    <span v-if="sortStates['3B'].field === 'fund'" class="sort-indicator" :class="sortStates['3B'].order"></span>
                  </th>
                  <th>预期</th>
                  <th @click="handleSort('3B', 'actual')" style="cursor: pointer;">
                    涨幅
                    <span v-if="sortStates['3B'].field === 'actual'" class="sort-indicator" :class="sortStates['3B'].order"></span>
                  </th>
                  <th @click="handleSort('3B', 'diff')" style="cursor: pointer;">
                    差值
                    <span v-if="sortStates['3B'].field === 'diff'" class="sort-indicator" :class="sortStates['3B'].order"></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="list3B.length === 0">
                  <td colspan="5" style="text-align: center; padding: 20px;">
                    暂无股票数据
                  </td>
                </tr>
                <tr v-else v-for="stock in list3B" :key="stock.code">
                  <td>{{ stock.code.replace(/^sh|^sz/, '') }} - {{ stock.name }}</td>
                  <td :class="stock.fundType === 'buy' ? 'positive' : (stock.fundType === 'sell' ? 'negative' : '')">
                    {{ formatFund(stock.fund) }}
                  </td>
                  <td>{{ stock.expected }}</td>
                  <td :class="stock.actual > 0 ? 'positive' : (stock.actual < 0 ? 'negative' : 'zero')">
                  {{ stock.actual.toFixed(2) }}%
                </td>
                  <td :class="stock.diff > 0 ? 'positive' : (stock.diff < 0 ? 'negative' : 'zero')">
                    {{ stock.diff.toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- 第四个列表 -->
      <div class="list-container">
        <!-- 第四个列表的上列表 -->
        <div class="list-section">
          <div class="list-header">
            <div class="list-title">
              <span v-if="list4A.length > 0" class="total-diff" :class="totalDiff4A > 0 ? 'positive' : (totalDiff4A < 0 ? 'negative' : 'zero')">
                <strong>{{ totalDiff4A.toFixed(2) }}</strong>
              </span>
              <span v-if="top3Stocks4A.length > 0" class="top-stocks">
                {{ top3Stocks4A.map(stock => stock.name).join(' , ') }}
              </span>
            </div>
            <button @click="showDialog('4A')" class="add-button">
              +
            </button>
          </div>
          <div class="table-wrapper">
            <table class="stock-table">
              <thead>
                <tr>
                  <th>股票（{{ list4A.length }}）</th>
                  <th @click="handleSort('4A', 'fund')" style="cursor: pointer;">
                    封单
                    <span v-if="sortStates['4A'].field === 'fund'" class="sort-indicator" :class="sortStates['4A'].order"></span>
                  </th>
                  <th>预期</th>
                  <th @click="handleSort('4A', 'actual')" style="cursor: pointer;">
                    涨幅
                    <span v-if="sortStates['4A'].field === 'actual'" class="sort-indicator" :class="sortStates['4A'].order"></span>
                  </th>
                  <th @click="handleSort('4A', 'diff')" style="cursor: pointer;">
                    差值
                    <span v-if="sortStates['4A'].field === 'diff'" class="sort-indicator" :class="sortStates['4A'].order"></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="list4A.length === 0">
                  <td colspan="5" style="text-align: center; padding: 20px;">
                    暂无股票数据
                  </td>
                </tr>
                <tr v-else v-for="stock in list4A" :key="stock.code">
                  <td>{{ stock.code.replace(/^sh|^sz/, '') }} - {{ stock.name }}</td>
                  <td :class="stock.fundType === 'buy' ? 'positive' : (stock.fundType === 'sell' ? 'negative' : '')">
                    {{ formatFund(stock.fund) }}
                  </td>
                  <td>{{ stock.expected }}</td>
                  <td :class="stock.actual > 0 ? 'positive' : (stock.actual < 0 ? 'negative' : 'zero')">
                  {{ stock.actual.toFixed(2) }}%
                </td>
                  <td :class="stock.diff > 0 ? 'positive' : (stock.diff < 0 ? 'negative' : 'zero')">
                    {{ stock.diff.toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- 分隔线 -->
        <div class="list-divider"></div>
        
        <!-- 第四个列表的中列表 -->
        <div class="list-section">
          <div class="list-header">
            <div class="list-title">
              <span v-if="list4B.length > 0" class="total-diff" :class="totalDiff4B > 0 ? 'positive' : (totalDiff4B < 0 ? 'negative' : 'zero')">
                <strong>{{ totalDiff4B.toFixed(2) }}</strong>
              </span>
              <span v-if="top3Stocks4B.length > 0" class="top-stocks">
                {{ top3Stocks4B.map(stock => stock.name).join(' , ') }}
              </span>
            </div>
            <button @click="showDialog('4B')" class="add-button">
              +
            </button>
          </div>
          <div class="table-wrapper">
            <table class="stock-table">
              <thead>
                <tr>
                  <th>股票（{{ list4B.length }}）</th>
                  <th @click="handleSort('4B', 'fund')" style="cursor: pointer;">
                    封单
                    <span v-if="sortStates['4B'].field === 'fund'" class="sort-indicator" :class="sortStates['4B'].order"></span>
                  </th>
                  <th>预期</th>
                  <th @click="handleSort('4B', 'actual')" style="cursor: pointer;">
                    涨幅
                    <span v-if="sortStates['4B'].field === 'actual'" class="sort-indicator" :class="sortStates['4B'].order"></span>
                  </th>
                  <th @click="handleSort('4B', 'diff')" style="cursor: pointer;">
                    差值
                    <span v-if="sortStates['4B'].field === 'diff'" class="sort-indicator" :class="sortStates['4B'].order"></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="list4B.length === 0">
                  <td colspan="5" style="text-align: center; padding: 20px;">
                    暂无股票数据
                  </td>
                </tr>
                <tr v-else v-for="stock in list4B" :key="stock.code">
                  <td>{{ stock.code.replace(/^sh|^sz/, '') }} - {{ stock.name }}</td>
                  <td :class="stock.fundType === 'buy' ? 'positive' : (stock.fundType === 'sell' ? 'negative' : '')">
                    {{ formatFund(stock.fund) }}
                  </td>
                  <td>{{ stock.expected }}</td>
                  <td :class="stock.actual > 0 ? 'positive' : (stock.actual < 0 ? 'negative' : 'zero')">
                  {{ stock.actual.toFixed(2) }}%
                </td>
                  <td :class="stock.diff > 0 ? 'positive' : (stock.diff < 0 ? 'negative' : 'zero')">
                    {{ stock.diff.toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- 分隔线 -->
        <div class="list-divider"></div>
        
        <!-- 第四个列表的下列表 -->
        <div class="list-section">
          <div class="list-header">
            <div class="list-title">
              <span v-if="list4C.length > 0" class="total-diff" :class="totalDiff4C > 0 ? 'positive' : (totalDiff4C < 0 ? 'negative' : 'zero')">
                <strong>{{ totalDiff4C.toFixed(2) }}</strong>
              </span>
              <span v-if="top3Stocks4C.length > 0" class="top-stocks">
                {{ top3Stocks4C.map(stock => stock.name).join(' , ') }}
              </span>
            </div>
            <button @click="showDialog('4C')" class="add-button">
              +
            </button>
          </div>
          <div class="table-wrapper">
            <table class="stock-table">
              <thead>
                <tr>
                  <th>股票（{{ list4C.length }}）</th>
                  <th @click="handleSort('4C', 'fund')" style="cursor: pointer;">
                    封单
                    <span v-if="sortStates['4C'].field === 'fund'" class="sort-indicator" :class="sortStates['4C'].order"></span>
                  </th>
                  <th>预期</th>
                  <th @click="handleSort('4C', 'actual')" style="cursor: pointer;">
                    涨幅
                    <span v-if="sortStates['4C'].field === 'actual'" class="sort-indicator" :class="sortStates['4C'].order"></span>
                  </th>
                  <th @click="handleSort('4C', 'diff')" style="cursor: pointer;">
                    差值
                    <span v-if="sortStates['4C'].field === 'diff'" class="sort-indicator" :class="sortStates['4C'].order"></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="list4C.length === 0">
                  <td colspan="5" style="text-align: center; padding: 20px;">
                    暂无股票数据
                  </td>
                </tr>
                <tr v-else v-for="stock in list4C" :key="stock.code">
                  <td>{{ stock.code.replace(/^sh|^sz/, '') }} - {{ stock.name }}</td>
                  <td :class="stock.fundType === 'buy' ? 'positive' : (stock.fundType === 'sell' ? 'negative' : '')">
                    {{ formatFund(stock.fund) }}
                  </td>
                  <td>{{ stock.expected }}</td>
                  <td :class="stock.actual > 0 ? 'positive' : (stock.actual < 0 ? 'negative' : 'zero')">
                  {{ stock.actual.toFixed(2) }}%
                </td>
                  <td :class="stock.diff > 0 ? 'positive' : (stock.diff < 0 ? 'negative' : 'zero')">
                    {{ stock.diff.toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 简化的模态对话框 -->
    <div v-if="dialogVisible" class="dialog-overlay">
      <div class="dialog">
        <div class="dialog-header">
          <h3>添加股票</h3>
          <button @click="dialogVisible = false" class="close-button">×</button>
        </div>
        <div class="dialog-body">
          <textarea
            v-model="dialogInputText"
            rows="10"
            placeholder="请输入股票，格式：股票代码 合理预期，例如：

sh600000 5
sz000001 -3
001331-3
600337-7
002931+10
"
            class="input-textarea"
          ></textarea>
        </div>
        <div class="dialog-footer">
          <button @click="dialogVisible = false" class="cancel-button">取消</button>
          <button @click="handleConfirm" class="confirm-button">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import axios from 'axios';

// 数据
const list1 = ref([]);
const list2 = ref([]);
const list3A = ref([]); // 第三个列表的上列表
const list3B = ref([]); // 第三个列表的下列表
const list4A = ref([]); // 第四个列表的上列表
const list4B = ref([]); // 第四个列表的中列表
const list4C = ref([]); // 第四个列表的下列表

// 排序状态管理
const sortStates = ref({
  1: { field: 'diff', order: 'desc' },
  2: { field: 'diff', order: 'desc' },
  '3A': { field: 'diff', order: 'desc' },
  '3B': { field: 'diff', order: 'desc' },
  '4A': { field: 'diff', order: 'desc' },
  '4B': { field: 'diff', order: 'desc' },
  '4C': { field: 'diff', order: 'desc' }
});

const dialogVisible = ref(false);
const currentList = ref(1);
// 每个列表独立的输入缓存
const inputCache = ref({
  1: '',
  2: '',
  '3A': '',
  '3B': '',
  '4A': '',
  '4B': '',
  '4C': ''
});
// 当前对话框使用的输入值
const dialogInputText = ref('');

// 计算属性：计算每个列表的综合预期差（所有预期差的总和）
const totalDiff1 = computed(() => {
  return list1.value.reduce((total, stock) => total + stock.diff, 0);
});

const totalDiff2 = computed(() => {
  return list2.value.reduce((total, stock) => total + stock.diff, 0);
});

const totalDiff3A = computed(() => {
  return list3A.value.reduce((total, stock) => total + stock.diff, 0);
});

const totalDiff3B = computed(() => {
  return list3B.value.reduce((total, stock) => total + stock.diff, 0);
});

const totalDiff4A = computed(() => {
  return list4A.value.reduce((total, stock) => total + stock.diff, 0);
});

const totalDiff4B = computed(() => {
  return list4B.value.reduce((total, stock) => total + stock.diff, 0);
});

const totalDiff4C = computed(() => {
  return list4C.value.reduce((total, stock) => total + stock.diff, 0);
});

// 计算属性：获取预期差最大的前三只股票
const top3Stocks1 = computed(() => {
  if (!list1.value || list1.value.length === 0) return [];
  return [...list1.value]
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 3);
});

const top3Stocks2 = computed(() => {
  if (!list2.value || list2.value.length === 0) return [];
  return [...list2.value]
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 3);
});

const top3Stocks3A = computed(() => {
  if (!list3A.value || list3A.value.length === 0) return [];
  return [...list3A.value]
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 3);
});

const top3Stocks3B = computed(() => {
  if (!list3B.value || list3B.value.length === 0) return [];
  return [...list3B.value]
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 3);
});

const top3Stocks4A = computed(() => {
  if (!list4A.value || list4A.value.length === 0) return [];
  return [...list4A.value]
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 3);
});

const top3Stocks4B = computed(() => {
  if (!list4B.value || list4B.value.length === 0) return [];
  return [...list4B.value]
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 3);
});

const top3Stocks4C = computed(() => {
  if (!list4C.value || list4C.value.length === 0) return [];
  return [...list4C.value]
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 3);
});

// 显示对话框
const showDialog = (listNum) => {
  currentList.value = listNum;
  // 加载对应列表的输入缓存
  dialogInputText.value = inputCache.value[listNum];
  // 不清空列表内容，保留上一次输入的内容
  dialogVisible.value = true;
};

// 排序处理函数
const handleSort = (listNum, field) => {
  const sortState = sortStates.value[listNum];
  const targetList = getList(listNum);
  
  // 如果点击的是当前排序字段，则切换排序顺序
  if (sortState.field === field) {
    // 从正序切换到倒序，或从倒序切换到正序
    sortState.order = sortState.order === 'asc' ? 'desc' : 'asc';
  } else {
    // 如果点击的是新字段，默认使用倒序
    sortState.field = field;
    sortState.order = 'desc';
  }
  
  // 根据排序状态对列表进行排序
  targetList.value.sort((a, b) => {
    return sortState.order === 'asc' ? a[field] - b[field] : b[field] - a[field];
  });
};

// 获取列表的辅助函数
const getList = (listNum) => {
  switch (listNum) {
    case 1: return list1;
    case 2: return list2;
    case '3A': return list3A;
    case '3B': return list3B;
    case '4A': return list4A;
    case '4B': return list4B;
    case '4C': return list4C;
    default: return list1;
  }
};

// 处理确认按钮
const handleConfirm = () => {
  if (!dialogInputText.value.trim()) {
    alert('请输入股票信息');
    return;
  }
  
  const stocks = processInput(dialogInputText.value);
  if (stocks.length === 0) {
    alert('请输入有效的股票信息');
    return;
  }
  
  // 获取目标列表
  let targetList;
  switch (currentList.value) {
    case 1:
      targetList = list1;
      break;
    case 2:
      targetList = list2;
      break;
    case '3A':
      targetList = list3A;
      break;
    case '3B':
      targetList = list3B;
      break;
    case '4A':
      targetList = list4A;
      break;
    case '4B':
      targetList = list4B;
      break;
    case '4C':
      targetList = list4C;
      break;
    default:
      targetList = list1;
  }
  
  // 清空当前列表
  targetList.value = [];
  
  // 添加新的股票内容
  stocks.forEach(stock => {
    targetList.value.push({
      ...stock,
      actual: 0,
      diff: -stock.expected
    });
  });
  
  // 保存输入内容到对应列表的缓存
  inputCache.value[currentList.value] = dialogInputText.value;
  
  // 按照差值倒序排序
  targetList.value.sort((a, b) => b.diff - a.diff);
  
  // 更新排序状态为差值倒序
  const sortState = sortStates.value[currentList.value];
  sortState.field = 'diff';
  sortState.order = 'desc';
  
  // 添加后立即获取实时数据
  updateStockData();
  
  dialogVisible.value = false;
  
  // 可以选择清空对话框输入，或者保留供下次使用
  // dialogInputText.value = '';
};

// 股票代码验证函数
const validateStockCode = (code) => {
  // 验证股票代码格式
  // 支持带市场前缀的格式：sh600000, sz000001, hk00005
  // 也支持不带前缀的格式：600000, 000001, 00005
  const validPattern = /^(?:(sh|sz|hk))?([0-9]{5,6})$/;
  return validPattern.test(code);
};

// 添加市场前缀的辅助函数
const addMarketPrefix = (code) => {
  if (code.startsWith('sh') || code.startsWith('sz') || code.startsWith('hk')) {
    return code; // 已经有前缀，直接返回
  }
  
  // 根据股票代码判断市场
  if (code.length === 6) {
    const firstDigit = code.charAt(0);
    if (['6', '7'].includes(firstDigit)) {
      return `sh${code}`; // 上海A股
    } else {
      return `sz${code}`; // 深圳A股
    }
  } else if (code.length === 5) {
    return `hk${code}`; // 港股
  }
  
  return code; // 无法判断，返回原始代码
};

// 注意：原fetchStockDataFromSina函数已被批量请求函数替代，不再使用



// 注意：fetchStockData函数已被fetchBatchStockData替代，不再使用
// 保持fetchStockDataFromSina函数用于向后兼容

// 格式化封单额显示
const formatFund = (fund) => {
  if (!fund || fund == 0) return '-';

  if (fund < 0) fund = fund * -1.0;
  
  // 一亿等于10000万
  if (fund < 100000000) {
    // 不足一亿，显示为xxx万
    const amount = (fund / 10000).toFixed(2);
    return `${amount}万`;
  } else {
    // 一亿以上，显示为xxx亿
    const amount = (fund / 100000000).toFixed(2);
    return `${amount}亿`;
  }
};

// 获取多个股票的实时数据 - 使用腾讯股票接口（批量请求）
const fetchBatchStockData = async (stocks) => {
  try {
    if (!stocks || stocks.length === 0) {
      return {};
    }
    
    // 准备所有股票代码，确保格式正确
    const codes = stocks.map(stock => {
      let code = stock.code;
      if (!code.startsWith('sh') && !code.startsWith('sz')) {
        code = `sz${code}`;
      }
      return code;
    }).join(',');
    
    // 使用腾讯股票接口批量获取数据
    const url = `https://qt.gtimg.cn/q=${codes}`;
    console.log('批量请求腾讯股票接口:', url);
    
    const response = await axios.get(url);
    const data = response.data;
    
    // 解析所有股票数据
    const result = {};
    const codeList = codes.split(',');
    
    codeList.forEach(code => {
      // 匹配当前股票的数据
      const match = data.match(new RegExp(`v_${code}="([^"]+)"`));
      
      if (match) {
        const values = match[1].split('~');
        if (values.length >= 5) {
          const name = values[1]; // 股票名称 (索引1)
          const prevClose = parseFloat(values[4]); // 昨日收盘价 (索引4)
          const current = parseFloat(values[3]); // 当前价格 (索引3)
          
          // 根据腾讯API文档，通常：
          // 买一价格: values[9]
          // 买一数量: values[10]
          // 卖一价格: values[11]
          // 卖一数量: values[12]
          const buy1Price = parseFloat(values[9]);
          const buy1Volume = parseFloat(values[10]);
          const sell1Price = parseFloat(values[19]);
          const sell1Volume = parseFloat(values[20]);
          
          if (!isNaN(prevClose) && !isNaN(current)) {
            // 计算实际涨幅
            const actual = ((current - prevClose) / prevClose) * 100;
            
            // 计算封单额
            let fund = 0;
            let fundType = ''; // 'buy' 或 'sell'
            // 判断是涨停还是跌停
            if (sell1Price == 0) { // 涨停 - 买入封单
              fund = buy1Price * buy1Volume * 100;
              fundType = 'buy';
            } else if (buy1Price == 0) { // 跌停 - 卖出封单
              fund = sell1Price * sell1Volume * 100 * -1.0;
              fundType = 'sell';
            }
            
            result[code] = { actual, name, fund, fundType };
          }
        }
      }
    });
    
    return result;
  } catch (error) {
    console.error('批量获取股票数据失败:', error);
    throw error;
  }
};

// 更新所有股票的实时数据
const updateStockData = async () => {
  console.log('开始更新股票数据');
  try {
    // 合并四个列表的股票，确保列表存在
    const allStocks = [
      ...(list1.value || []),
      ...(list2.value || []),
      ...(list3A.value || []),
      ...(list3B.value || []),
      ...(list4A.value || []),
      ...(list4B.value || []),
      ...(list4C.value || [])
    ];
    
    if (allStocks.length === 0) {
      console.log('没有股票需要更新');
      return;
    }
  
  // 使用批量请求获取所有股票数据
  const stockDataMap = await fetchBatchStockData(allStocks);
  
  // 更新所有股票数据
  allStocks.forEach(stock => {
    try {
      // 确保股票代码格式正确（添加市场前缀）
      let code = stock.code;
      if (!code.startsWith('sh') && !code.startsWith('sz')) {
        code = `sz${code}`;
      }
      
      // 获取当前股票的数据
      const stockData = stockDataMap[code];
      
      if (stockData) {
        const { actual, name, fund, fundType } = stockData;
        // 确保响应式更新
        const diff = actual - stock.expected;
        // 找到股票在原列表中的索引并更新
        const stockIndex1 = list1.value.findIndex(s => s.code === stock.code);
        const stockIndex2 = list2.value.findIndex(s => s.code === stock.code);
        const stockIndex3A = list3A.value.findIndex(s => s.code === stock.code);
        const stockIndex3B = list3B.value.findIndex(s => s.code === stock.code);
        const stockIndex4A = list4A.value.findIndex(s => s.code === stock.code);
        const stockIndex4B = list4B.value.findIndex(s => s.code === stock.code);
        const stockIndex4C = list4C.value.findIndex(s => s.code === stock.code);
        
        if (stockIndex1 !== -1) {
          list1.value[stockIndex1] = {...list1.value[stockIndex1], name, actual, diff, fund, fundType};
        }
        if (stockIndex2 !== -1) {
          list2.value[stockIndex2] = {...list2.value[stockIndex2], name, actual, diff, fund, fundType};
        }
        if (stockIndex3A !== -1) {
          list3A.value[stockIndex3A] = {...list3A.value[stockIndex3A], name, actual, diff, fund, fundType};
        }
        if (stockIndex3B !== -1) {
          list3B.value[stockIndex3B] = {...list3B.value[stockIndex3B], name, actual, diff, fund, fundType};
        }
        if (stockIndex4A !== -1) {
          list4A.value[stockIndex4A] = {...list4A.value[stockIndex4A], name, actual, diff, fund, fundType};
        }
        if (stockIndex4B !== -1) {
          list4B.value[stockIndex4B] = {...list4B.value[stockIndex4B], name, actual, diff, fund, fundType};
        }
        if (stockIndex4C !== -1) {
          list4C.value[stockIndex4C] = {...list4C.value[stockIndex4C], name, actual, diff, fund, fundType};
        }
        
        console.log(`股票 ${name} 更新成功，实际涨幅：${actual}`);
      } else {
        console.error(`没有找到股票 ${stock.code} 的数据`);
      }
    } catch (error) {
      console.error(`更新股票 ${stock.code} 失败：${error}`);
    }
  });
  
  // 更新完成后，根据用户当前的排序状态重新排序每个列表
  const applySort = (listNum, list) => {
    const sortState = sortStates.value[listNum];
    if (sortState.field && sortState.order) {
      list.value.sort((a, b) => {
        return sortState.order === 'asc' ? a[sortState.field] - b[sortState.field] : b[sortState.field] - a[sortState.field];
      });
    }
  };
  
  // 对每个列表应用排序
  applySort(1, list1);
  applySort(2, list2);
  applySort('3A', list3A);
  applySort('3B', list3B);
  applySort('4A', list4A);
  applySort('4B', list4B);
  applySort('4C', list4C);
  
  console.log('股票数据更新完成，已应用当前排序状态');
  } catch (error) {
    console.error('更新股票数据时发生错误:', error);
  }
};

// 定时更新股票数据
let updateTimer = null;
const startUpdateTimer = () => {
  console.log('尝试启动定时器，当前定时器状态:', updateTimer ? '已存在' : '不存在');
  if (!updateTimer) {
    console.log('创建新的定时器，每3秒执行一次');
    updateTimer = setInterval(async () => {
      console.log('定时器触发，开始执行数据更新');
      await updateStockData();
      console.log('数据更新完成');
    }, 3000); // 每3秒更新一次
    console.log('股票数据定时器已启动，每3秒更新一次');
  }
};

// 清理定时器
const clearUpdateTimer = () => {
  if (updateTimer) {
    console.log('清理股票数据定时器');
    clearInterval(updateTimer);
    updateTimer = null;
  }
};

// 处理输入文本
const processInput = (text) => {
  const stocks = [];
  // 支持逗号和换行分割
  const lines = text.split(/[,\n]/);
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // 解析格式：股票代码 合理预期（支持负数和小数，支持无空格分隔）
    // 支持格式：001331-3, 600337-7, 002931+10, sh600000 5
    const match = trimmedLine.match(/^([a-zA-Z]*\d+)(?:\s*([+-]))?(-?\d+(?:\.\d+)?)$/);
    if (match && match[1] && match[3]) {
      const rawCode = match[1].trim();
      let expected = parseFloat(match[3].trim());
      
      // 处理分隔符：如果是-号，将预期值变为负数
      if (match[2] === '-') {
        expected = -Math.abs(expected);
      } else if (match[2] === '+') {
        // 如果是+号，确保预期值是正数
        expected = Math.abs(expected);
      }
      
      if (!isNaN(expected)) {
        // 验证股票代码格式
        if (validateStockCode(rawCode)) {
          // 为股票代码添加市场前缀
          const code = addMarketPrefix(rawCode);
          stocks.push({ code, name: '', expected }); // 初始名称为空，后续从API获取
        } else {
          console.log(`股票代码格式无效: ${rawCode}`);
        }
      }
    }
  }
  
  return stocks;
};

// 组件挂载时启动定时器
onMounted(() => {
  console.log('组件已挂载，准备启动定时器');
  // 延迟执行初始更新，避免水合错误
  setTimeout(() => {
    updateStockData();
  }, 100);
  // 启动定时器
  startUpdateTimer();
});

// 组件卸载时清理定时器
onBeforeUnmount(() => {
  clearUpdateTimer();
});
</script>

<style scoped>
/* 全局盒模型重置 */
* {
  box-sizing: border-box;
}

.yqgl-container {
  padding: 12px;
  min-height: 100vh;
  background-color: #121212;
  color: #e0e0e0;
  overflow: hidden;
}

h1 {
  font-size: 14px;
  margin-bottom: 12px;
  color: #409eff;
  text-align: center;
}

.lists-container {
  display: flex;
  height: calc(100vh - 24px);
  gap: 12px;
}

.list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  border-radius: 6px;
  padding: 12px;
  min-height: 0;
}

/* 列表分段 */
.list-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 列表分隔线 */
.list-divider {
  height: 1px;
  background-color: #333;
  margin: 8px 0;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.list-header h2 {
  font-size: 10px;
  color: #409eff;
  margin: 0;
}

.add-button {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-button:hover {
  background-color: #66b1ff;
}

/* 顶部股票信息样式 */
.top-stocks {
  margin-left: 12px;
  font-size: 12px;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 500px;
}

.table-wrapper {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* 排序指示器样式 */
.sort-indicator {
  display: inline-block;
  width: 0;
  height: 0;
  margin-left: 4px;
  vertical-align: middle;
}

.sort-indicator.asc {
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 4px solid #409eff;
}

.sort-indicator.desc {
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid #409eff;
}

/* 自定义滚动条样式 */
.table-wrapper::-webkit-scrollbar {
  width: 8px;
}

.table-wrapper::-webkit-scrollbar-track {
  background-color: #2d2d2d;
  border-radius: 4px;
}

.table-wrapper::-webkit-scrollbar-thumb {
  background-color: #555;
  border-radius: 4px;
}

.table-wrapper::-webkit-scrollbar-thumb:hover {
  background-color: #777;
}

.stock-table {
  width: 100%;
  border-collapse: collapse;
}

.stock-table th,
.stock-table td {
  padding: 8px;
  text-align: center;
  border-bottom: 1px solid #333;
  font-size: 12px;
}

/* 股票列左对齐 */
.stock-table th:first-child,
.stock-table td:first-child {
  text-align: left;
}

.stock-table th {
  background-color: #2d2d2d;
  color: #409eff;
  font-weight: bold;
  position: sticky;
  top: 0;
  z-index: 1;
  box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.3);
}

.stock-table tr:last-child td {
  border-bottom: none;
}

.positive {
  color: #f56c6c;
}

.negative {
  color: #67c23a;
}

.zero {
  color: #e0e0e0;
}

/* 简化的模态对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog {
  background-color: #1e1e1e;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #333;
}

.dialog-header h3 {
  color: #409eff;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  color: #e0e0e0;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-body {
  padding: 15px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.input-textarea {
  width: 100%;
  background-color: #2d2d2d;
  color: #e0e0e0;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 10px;
  font-size: 12px;
  resize: vertical;
  box-sizing: border-box;
  flex-grow: 1;
  min-height: 100px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding: 15px;
  border-top: 1px solid #333;
  gap: 10px;
}

.cancel-button {
  background-color: #333;
  color: #e0e0e0;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-button {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-button:hover {
  background-color: #66b1ff;
}
</style>