import axios from 'axios';

/**
 * 股票池名称映射关系
 */
export const pools = {
  'limit_up': '涨停',
  'yesterday_limit_up': '昨日涨停',
  'limit_up_broken': '炸板',
  'limit_down': '跌停'
};

// 移除不再使用的mock数据 - API调用失败时将直接抛出错误

/**
 * 从龙虎榜VIP获取当日数据
 * @returns {Promise<Array>} 股票数据
 */
async function fetchDataFromLongHuVipForToday() {
  // 使用代理路径，而不是直接URL调用，以避免CORS错误
  const url = '/api/longhuvip/w1/api/index.php';
  const params = {
    a: 'DailyLimitPerformance',
    c: 'HomeDingPan',
    st: 1000
  };
  
  try {
    // 移除headers配置，通过开发服务器转发请求
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error('获取当日龙虎榜VIP数据失败:', error);
    throw error;
  }
}

/**
 * 从龙虎榜VIP获取历史数据
 * @param {string} date - 日期 (YYYY-MM-DD格式)
 * @returns {Promise<Array>} 股票数据
 */
async function fetchDataFromLongHuVipForHistory(date) {
  // 使用代理路径，而不是直接URL调用，以避免CORS错误
  const url = '/api/longhuvip-history/w1/api/index.php';
  const params = {
    Day: date,
    PidType: 5,
    a: 'DailyLimitPerformance',
    c: 'HisHomeDingPan',
    st: 1000
  };
  
  try {
    // 移除headers配置，通过开发服务器转发请求
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error(`获取历史日期${date}的龙虎榜VIP数据失败:`, error);
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
  try {
    // 根据是否有日期参数决定调用哪个接口
    const data = date ? 
      await fetchDataFromLongHuVipForHistory(date) : 
      await fetchDataFromLongHuVipForToday();
    
    console.log(`成功从API获取${poolName}股票池数据`);
    // 确保返回的是可被filter方法处理的数组
    return data && data.list ? data.list : [];
  } catch (error) {
    console.error(`获取${poolName}股票池数据失败:`, error);
    // 移除mock数据回退，直接抛出错误，显示真实的API调用状态
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