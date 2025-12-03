const axios = require('axios');

// 后端转发服务的基础URL
const API_BASE_URL = 'http://localhost:8081/api/proxy';

/**
 * 测试今日数据API
 * 现在API会自动合并PidType 1-5的数据
 */
async function testTodayData() {
  console.log('\n=== 测试今日数据API ===');
  try {
    const response = await axios.get(`${API_BASE_URL}/kpl-today`);
    console.log('今日数据请求成功，状态码:', response.status);
    
    // 验证响应格式
    const hasCorrectFormat = response.data && 
                            Array.isArray(response.data.info) && 
                            response.data.info.length === 2 &&
                            Array.isArray(response.data.info[0]) &&
                            typeof response.data.ttag === 'number' &&
                            typeof response.data.errcode === 'string';
    
    if (hasCorrectFormat) {
      console.log('响应格式验证成功：符合预期的数据结构');
      console.log('数据总数:', response.data.info[0].length);
      console.log('日期:', response.data.info[1]);
      console.log('ttag值:', response.data.ttag);
      console.log('错误码:', response.data.errcode);
      
      if (response.data.info[0].length > 0) {
        const firstItem = response.data.info[0][0];
        console.log('第一条数据示例:', JSON.stringify(firstItem, null, 2));
        
        // 验证格式化字段
        const requiredFields = ['symbol', 'stock_chi_name', 'change_percent', 'limit_up_days', 'primaryTheme', 'boards', 'allThemes'];
        const hasAllFields = requiredFields.every(field => field in firstItem);
        console.log(`格式化字段验证: ${hasAllFields ? '成功' : '失败'}`);
        if (!hasAllFields) {
          const missingFields = requiredFields.filter(field => !(field in firstItem));
          console.log(`缺失的字段: ${missingFields.join(', ')}`);
        }
      }
      
      return response.data;
    } else {
      console.error('响应格式验证失败：不符合预期的数据结构');
      console.log('实际响应结构:', response.data);
      return null;
    }
  } catch (error) {
    console.error('今日数据请求失败:', error.message);
    if (error.response) {
      console.error('响应状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    return null;
  }
}

/**
 * 测试历史数据API
 * 现在API会自动合并PidType 1-5的数据
 */
async function testHistoryData() {
  console.log('\n=== 测试历史数据API ===');
  try {
    // 使用当前日期或有效日期
    const testDate = '2023-12-01'; // 请替换为有效日期
    const response = await axios.get(`${API_BASE_URL}/kpl-history?Day=${testDate}`);
    console.log(`历史数据请求成功，状态码:`, response.status);
    
    // 验证响应格式
    const hasCorrectFormat = response.data && 
                            Array.isArray(response.data.info) && 
                            response.data.info.length === 2 &&
                            Array.isArray(response.data.info[0]) &&
                            typeof response.data.ttag === 'number' &&
                            typeof response.data.errcode === 'string';
    
    if (hasCorrectFormat) {
      console.log('响应格式验证成功：符合预期的数据结构');
      console.log('数据总数:', response.data.info[0].length);
      console.log('日期:', response.data.info[1]);
      console.log('ttag值:', response.data.ttag);
      console.log('错误码:', response.data.errcode);
      
      if (response.data.info[0].length > 0) {
        const firstItem = response.data.info[0][0];
        console.log('示例数据项:', JSON.stringify(firstItem, null, 2));
        
        // 验证格式化字段
        const requiredFields = ['symbol', 'stock_chi_name', 'change_percent', 'limit_up_days', 'primaryTheme', 'boards', 'allThemes'];
        const hasAllFields = requiredFields.every(field => field in firstItem);
        console.log(`格式化字段验证: ${hasAllFields ? '成功' : '失败'}`);
        if (!hasAllFields) {
          const missingFields = requiredFields.filter(field => !(field in firstItem));
          console.log(`缺失的字段: ${missingFields.join(', ')}`);
        }
      }
      
      return response.data;
    } else {
      console.error('响应格式验证失败：不符合预期的数据结构');
      console.log('实际响应结构:', response.data);
      return null;
    }
  } catch (error) {
    console.error('历史数据请求失败:', error.message);
    if (error.response) {
      console.error('响应状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    return null;
  }
}

/**
 * 测试健康检查端点
 */
async function testHealthCheck() {
  try {
    console.log('=== 测试健康检查 ===');
    const response = await axios.get('http://localhost:8081/health');
    console.log('健康检查成功:', response.data);
    return true;
  } catch (error) {
    console.error('健康检查失败:', error.message);
    console.error('错误提示：请确保后端服务正在运行: node backend-server.js');
    return false;
  }
}

/**
 * 测试今日数据API
 */
async function testTodayData() {
  try {
    console.log('\n=== 测试今日数据API ===');
    const response = await axios.get(`${API_BASE_URL}/today`);
    console.log('今日数据请求成功，状态码:', response.status);
    console.log('响应数据类型:', typeof response.data);
    
    if (response.data) {
      console.log('响应数据结构:');
      if (Array.isArray(response.data)) {
        console.log(`- 数组长度: ${response.data.length}`);
        if (response.data.length > 0) {
          console.log('- 第一个元素示例:', JSON.stringify(response.data[0], null, 2));
        }
      } else if (typeof response.data === 'object') {
        console.log('- 对象属性:', Object.keys(response.data));
        // 检查常见的数据字段
        ['list', 'List', 'info', 'Info'].forEach(field => {
          if (response.data[field]) {
            console.log(`- ${field} 字段存在，类型: ${typeof response.data[field]}`);
            if (Array.isArray(response.data[field])) {
              console.log(`  - 长度: ${response.data[field].length}`);
            }
          }
        });
      }
    }
    return true;
  } catch (error) {
    console.error('今日数据请求失败:', error.message);
    if (error.response) {
      console.error('响应状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    return false;
  }
}

/**
 * 测试历史数据API
 * @param {string} date - 测试日期
 */
async function testHistoryData(date) {
  try {
    console.log(`\n=== 测试历史数据API (${date}) ===`);
    const response = await axios.get(`${API_BASE_URL}/history`, {
      params: { Day: date }
    });
    console.log('历史数据请求成功，状态码:', response.status);
    console.log('响应数据类型:', typeof response.data);
    
    if (response.data) {
      console.log('响应数据结构:');
      if (Array.isArray(response.data)) {
        console.log(`- 数组长度: ${response.data.length}`);
      } else if (typeof response.data === 'object') {
        console.log('- 对象属性:', Object.keys(response.data));
        // 检查常见的数据字段
        ['list', 'List', 'info', 'Info'].forEach(field => {
          if (response.data[field]) {
            console.log(`- ${field} 字段存在，类型: ${typeof response.data[field]}`);
            if (Array.isArray(response.data[field])) {
              console.log(`  - 长度: ${response.data[field].length}`);
            }
          }
        });
      }
    }
    return true;
  } catch (error) {
    console.error(`历史数据请求失败 (${date}):`, error.message);
    if (error.response) {
      console.error('响应状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    return false;
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('开始测试后端转发服务...');
  
  const healthCheckSuccess = await testHealthCheck();
  
  if (!healthCheckSuccess) {
    console.log('\n测试终止：后端服务未运行');
    console.log('请先运行: node backend-server.js');
    return;
  }
  
  console.log('\n健康检查通过，继续测试API功能...');
  
  // 测试今日数据API
  const todayData = await testTodayData();
  
  // 测试历史数据API
    const historyData = await testHistoryData();
  
  console.log('\n=== 测试完成 ===');
  console.log(`今日数据测试: ${todayData ? '成功' : '失败'}`);
  console.log(`历史数据测试: ${historyData ? '成功' : '失败'}`);
  console.log('使用说明:');
  console.log('1. 确保后端服务持续运行: node backend-server.js');
  console.log('2. 前端应用将自动通过后端服务获取数据');
  console.log('3. 如有问题，请查看控制台错误信息和BACKEND_PROXY_README.md');
}

// 运行测试
runTests();