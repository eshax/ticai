/**
 * 日期工具函数类
 */

/**
 * 获取指定日期的前/后工作日
 * @param {string} dateStr - 日期字符串，格式为YYYY-MM-DD
 * @param {number} offset - 偏移天数，正数表示往后，负数表示往前
 * @returns {string} 调整后的日期字符串，格式为YYYY-MM-DD
 */
export const getAdjustedDate = (dateStr, offset) => {
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