/**
 * 日期工具函数集
 * 用于处理和验证股票历史数据的日期
 */

/**
 * 检查日期是否为有效日期（非未来日期且格式正确）
 * @param {string} dateStr - 日期字符串 (YYYY-MM-DD格式)
 * @returns {boolean} 是否为有效日期
 */
export function isValidHistoricalDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return false;
  }
  
  // 检查日期格式
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return false;
  }
  
  // 检查是否为未来日期
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const requestedDate = new Date(dateStr);
  
  return requestedDate <= today;
}

/**
 * 获取N个工作日的历史日期列表
 * @param {number} count - 需要的日期数量
 * @returns {string[]} 格式化的日期字符串数组 (YYYY-MM-DD)
 */
export function getRecentWorkdays(count = 5) {
  const dates = [];
  const today = new Date();
  let currentDate = new Date(today);
  
  while (dates.length < count) {
    // 减去一天
    currentDate.setDate(currentDate.getDate() - 1);
    
    // 检查是否为工作日（周一到周五）
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      dates.push(formatDate(currentDate));
    }
  }
  
  return dates;
}

/**
 * 格式化日期为YYYY-MM-DD格式
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * 获取前一个工作日的日期
 * @returns {string} 格式化的日期字符串 (YYYY-MM-DD)
 */
export function getPreviousWorkday() {
  const today = new Date();
  let prevDate = new Date(today);
  
  // 先减一天
  prevDate.setDate(prevDate.getDate() - 1);
  
  // 如果是周末，则继续往前找
  let dayOfWeek = prevDate.getDay();
  while (dayOfWeek === 0 || dayOfWeek === 6) { // 0是周日，6是周六
    prevDate.setDate(prevDate.getDate() - 1);
    dayOfWeek = prevDate.getDay();
  }
  
  return formatDate(prevDate);
}