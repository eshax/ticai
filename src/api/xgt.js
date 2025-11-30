import axios from 'axios';

/**
 * 股票池名称映射关系
 */
export const pools = {
  'limit_up': '涨停',
  'yesterday_limit_up': '昨日涨停',
  'limit_up_broken': '炸板',
  'super_stock': '强势',
  'limit_down': '跌停'
};

/**
 * 获取股票池数据
 * @param {string} poolName - 股票池名称
 * @param {string} [date] - 可选的日期参数
 * @returns {Promise<Array>} 格式化后的股票数据
 */
export const fetchStockPoolData = async (poolName, date = null) => {
  let url = `https://flash-api.xuangubao.com.cn/api/pool/detail?pool_name=${poolName}`;
  if (date) {
    url += `&date=${date}`;
  }
  
  try {
    const res = await axios.get(url);
    return res.data.code === 20000 ? (res.data.data || []) : [];
  } catch (error) {
    console.error('获取股票池数据失败:', error);
    return [];
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