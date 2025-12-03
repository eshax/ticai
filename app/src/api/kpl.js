import axios from 'axios';
import { isValidHistoricalDate } from '../common/dateUtils.js';

// 后端转发服务的基础URL
const API_BASE_URL = '/api/proxy';

/**
 * 股票池名称映射关系
 */
export const pools = {
  'limit_up': '题材涨停表'
};

// 移除不再使用的mock数据 - API调用失败时将直接抛出错误

/**
 * 从龙虎榜VIP获取当日数据 - 使用后端转发服务
 * @returns {Promise<Array>} 股票数据
 */
async function fetchDataFromLongHuVipForToday() {
  // 使用后端转发服务
  const url = `${API_BASE_URL}/kpl-today`;

  
  try {
    console.log('通过后端转发服务发起今日数据请求:', url);
    // 调用后端转发服务
    const response = await axios.get(url, { 
      // params,
      timeout: 15000 // 增加超时时间
    });
    console.log('后端转发服务响应成功，状态码:', response.status);
    console.log('响应数据结构:', Object.keys(response.data));
    
    return response.data;
  } catch (error) {
    console.error('通过后端转发服务获取当日龙虎榜VIP数据失败:', error.message);
    if (error.response) {
      console.error('后端服务响应状态码:', error.response.status);
      console.error('后端服务响应数据:', error.response.data);
    } else if (error.request) {
      console.error('请求已发送但未收到响应，可能是后端服务未启动或网络问题');
      console.error('请确保后端服务正在运行: node backend-server.js');
    }
    throw error;
  }
}

/**
 * 从龙虎榜VIP获取历史数据 - 使用后端转发服务
 * @param {string} date - 日期 (YYYY-MM-DD格式)
 * @returns {Promise<Array>} 股票数据
 */
async function fetchDataFromLongHuVipForHistory(date) {
  // 使用后端转发服务
  const url = `${API_BASE_URL}/kpl-history`;
  const params = {
    Day: date
  };
  
  try {
    console.log('通过后端转发服务发起历史数据请求，日期:', date);
    // 调用后端转发服务
    const response = await axios.get(url, { 
      params,
      timeout: 15000 // 增加超时时间
    });
    console.log('后端转发服务响应成功，状态码:', response.status);
    console.log('响应数据结构:', Object.keys(response.data));
    
    return response.data;
  } catch (error) {
    console.error('通过后端转发服务获取历史龙虎榜VIP数据失败:', error.message);
    if (error.response) {
      console.error('后端服务响应状态码:', error.response.status);
      console.error('后端服务响应数据:', error.response.data);
    } else if (error.request) {
      console.error('请求已发送但未收到响应，可能是后端服务未启动或网络问题');
      console.error('请确保后端服务正在运行: node backend-server.js');
    }
    throw error;
  }
}

/**
 * 获取股票池数据
 * @param {string} poolName - 股票池名称
 * @param {string} [date] - 可选的日期参数
 * @returns {Promise<Array>} 格式化后的股票数据
 */
export const fetchStockPoolData = async (poolName, date = null) => {
  console.log(`开始获取${poolName}股票池数据${date ? ` (${date})` : ''}`);
  
  // 将validDate定义移到try/catch外部，确保在整个函数作用域内可见
  let validDate = date;
  if (date && !isValidHistoricalDate(date)) {
    console.warn(`请求的日期${date}无效或为未来日期，改用今日日期`);
    validDate = null; // 使用今日数据
  }
  
  try {
    // 根据是否有有效日期参数决定调用哪个接口
    let data = validDate ? 
      await fetchDataFromLongHuVipForHistory(validDate) : 
      await fetchDataFromLongHuVipForToday();
    
    console.log(data);

    console.log(`成功从API获取${poolName}股票池数据`);
    console.log('API返回数据类型:', Array.isArray(data) ? 'Array' : 'Object');
    if (!Array.isArray(data)) {
      console.log('API返回完整数据:', JSON.stringify(data, null, 2));
    } else {
      console.log('API直接返回数组，长度:', data.length);
    }
    
    let result = [];
    
    // 检查后端服务返回的标准格式
    if (data && Array.isArray(data.info) && data.info.length >= 1) {
      // 正确处理嵌套数组结构: [股票数据数组, 日期]
      if (Array.isArray(data.info[0])) {
        console.log('检测到标准格式：嵌套数组结构 [股票数据数组, 日期]');
        result = data.info[0];
        console.log('使用data.info[0]作为数据源，包含', result.length, '条股票记录');
        console.log('数据日期:', data.info[1] || '未指定');
        console.log('响应状态码:', data.errcode || '未指定');
      } else {
        // 如果info[0]不是数组，可能是特殊情况，直接使用info
        console.log('info[0]不是数组，使用整个info数组作为数据源');
        result = data.info;
      }
    }
    // 兼容处理可能的不同数据格式
    else if (data) {
      // 检查是否有其他常见的数据字段
      if (Array.isArray(data.Info)) {
        // 处理Info字段（首字母大写的情况）
        if (data.Info.length > 0 && Array.isArray(data.Info[0])) {
          console.log('使用data.Info[0]作为数据源（嵌套数组结构）');
          result = data.Info[0];
        } else {
          console.log('使用data.Info作为数据源');
          result = data.Info;
        }
      } else if (Array.isArray(data.list)) {
        result = data.list;
        console.log('使用data.list作为数据源');
      } else if (Array.isArray(data.List)) {
        result = data.List;
        console.log('使用data.List作为数据源');
      } else if (Array.isArray(data.data)) {
        result = data.data;
        console.log('使用data.data作为数据源');
      } else {
        // 如果所有字段都不是数组，检查data本身是否为数组
        if (Array.isArray(data)) {
          result = data;
          console.log('直接使用返回的数组作为数据源');
        } else {
          console.warn('未找到标准数据数组字段，返回空数组');
        }
      }
    }
    
    // 额外检查：确保result是数组
    if (!Array.isArray(result)) {
      console.error('数据处理异常：result不是数组，重置为空数组');
      result = [];
    }
    
    console.log(`最终返回数据数量: ${result.length}`);
    return result;
  } catch (error) {
    let errorMessage = `获取${poolName}股票池数据失败: ${error.message}`;
    
    // 根据不同错误类型提供具体建议
    if (error.response && error.response.status === 404) {
      errorMessage += ' - 可能原因：1)日期不存在 2)API路径错误 3)目标服务器无此资源';
      console.error(errorMessage);
      console.error('建议检查：', {
        requestedDate: validDate,
        apiEndpoint: validDate ? `${API_BASE_URL}/history` : `${API_BASE_URL}/today`,
        backendService: '确保后端转发服务正在运行'
      });
    } else if (error.response && error.response.status === 403) {
      errorMessage += ' - 可能原因：1)请求被目标服务器拒绝 2)缺少必要的请求头';
      console.error(errorMessage);
    } else if (!error.response) {
      errorMessage += ' - 可能原因：1)后端服务未启动 2)网络连接问题 3)端口被占用';
      console.error(errorMessage);
      console.error('请确保：');
      console.error('1. 已运行: node backend-server.js');
      console.error('2. 端口8081未被占用');
      console.error('3. 网络连接正常');
    }
    
    // 不使用mock数据，直接抛出错误以便调试
    throw error;
  }
};


/**
 * 检查是否为ST股票
 * @param {string} stockName - 股票名称
 * @returns {boolean} 是否为ST股票
 */
export const isSTStock = (stockName) => {
  return stockName && (stockName.includes('ST') || stockName.includes('*ST'));
};

/**
 * 涨/跌停时间格式化
 * @param {number|string} time - 时间戳或时间字符串
 * @returns {string} 格式化后的时间字符串 (HH:MM:SS)
 */
export const formatLimitTime = (time = false) => {
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

/**
 * 涨跌停板数显示逻辑
 * @param {Object} stock - 股票数据对象
 * @param {boolean} isDown - 是否为跌停池
 * @returns {string} 格式化后的板数显示文本
 */
export const getLimitDisplayText = (stock, isDown = false) => {
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

/**
 * 股票数据格式化 - 新增保存所有题材的字段
 * @param {Object} stock - 原始股票数据
 * @param {boolean} isDown - 是否为跌停池
 * @returns {Object} 格式化后的股票数据
 */
export const formatStockData = (stock, isDown = false) => {
  // 优先使用后端返回的主题字段
  let allThemes = [];
  let primaryTheme = '无题材';
  
  // 首先检查后端是否提供了allThemes字段
  if (stock.allThemes && Array.isArray(stock.allThemes) && stock.allThemes.length > 0) {
    allThemes = stock.allThemes;
  }
  // 然后检查后端是否提供了primaryTheme字段
  if (stock.primaryTheme && stock.primaryTheme.trim()) {
    primaryTheme = stock.primaryTheme;
    // 如果allThemes为空但有primaryTheme，将其添加到allThemes
    if (allThemes.length === 0) {
      allThemes = [primaryTheme];
    }
  } else if (allThemes.length > 0) {
    // 如果有allThemes但没有明确的primaryTheme，使用第一个作为主要题材
    primaryTheme = allThemes[0];
  } else {
    // 回退到原有逻辑
    const relatedPlates = stock.surge_reason?.related_plates || [];
    allThemes = relatedPlates.map(plate => plate.plate_name?.trim() || '未知题材').filter(Boolean);
    primaryTheme = allThemes[0] || '无题材';
  }
  
  const plateCount = allThemes.length;
  const hasMultiplePlates = plateCount > 1;
  
  // 确保板数数据始终有值
  const boardIndicator = getLimitDisplayText(stock, isDown) || '-';
  
  // 从boards字段解析"7天5板"格式的数据
  let m_days_n_boards_boards = stock.m_days_n_boards_boards || 0;
  let m_days_n_boards_days = stock.m_days_n_boards_days || 0;
  
  if (stock.boards && typeof stock.boards === 'string') {
    const boardsStr = stock.boards;
    // 匹配"7天5板"格式的正则表达式
    const match = boardsStr.match(/(\d+)天(\d+)板/);
    if (match) {
      m_days_n_boards_days = parseInt(match[1], 10) || 0;
      m_days_n_boards_boards = parseInt(match[2], 10) || 0;
    }
  }
  
  return {
    symbol: stock.symbol,
    stock_chi_name: stock.stock_chi_name,
    price: stock.price,
    oneline: stock.oneline,
    otherTheme: stock.otherTheme,
    change_percent: stock.change_percent,
    limit_up_days: stock.limit_up_days || 0,
    limit_down_days: stock.limit_down_days || 0,
    new_stock_break_limit_up: stock.new_stock_break_limit_up || 0,
    m_days_n_boards_boards: m_days_n_boards_boards,
    m_days_n_boards_days: m_days_n_boards_days,
    first_limit_up: formatLimitTime(stock.first_limit_up || stock.first_limit_down, isDown),
    limitUpBoardsText: getLimitDisplayText(stock, isDown) || '-',
    boardIndicator: boardIndicator,
    primaryTheme: primaryTheme,
    allThemes: allThemes.length > 0 ? allThemes : ['无题材'],
    surge_reason: stock.surge_reason || {},
    wasUpdated: false,
    hasMultiplePlates: hasMultiplePlates,
    plateCount: plateCount,
    breakLimitUpTimes: stock.break_limit_up_times || stock.break_limit_down_times || 0,
    updateTime: new Date().toISOString()
  };
};