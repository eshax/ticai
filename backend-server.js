const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = 8081;

// 启用CORS，允许所有来源的请求
app.use(cors());

// 解析JSON请求体
app.use(express.json());

/**
 * 格式化股票数据为标准JSON格式
 * @param {Array} stockData 原始股票数据数组
 * @returns {Array} 格式化后的股票数据数组
 */
function formatStockData(stockData) {
  if (!Array.isArray(stockData)) {
    return [];
  }
  
  return stockData.map(stock => {
    try {
      return {
        symbol: stock[0] || '', // 股票代码
        stock_chi_name: stock[1] || '', // 股票中文名称
        change_percent: 0, // 涨跌幅固定为0
        limit_up_days: stock[15] || 0, // 连续涨停天数
        primaryTheme: stock[5] || '', // 主要主题
        allThemes: Array.isArray(stock[12]) ? stock[12] : typeof stock[12] === 'string' ? stock[12].split('、') : [], // 所有主题，以、分割的字符串数组
        boards: stock[18] || '' // 所属板块
      };
    } catch (error) {
      console.error('格式化股票数据失败:', error.message);
      return null; // 格式化失败返回null，后续会过滤掉
    }
  }).filter(Boolean); // 过滤掉null值
}

/**
 * 日志记录中间件
 */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

/**
 * 错误处理中间件
 */
app.use((err, req, res, next) => {
  console.error('错误发生:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: err.message
  });
});

/**
 * 转发到历史数据API - 获取所有PidType(1-5)的数据并合并
 * GET /api/proxy/kpl-history?Day=2023-12-01
 */
app.get('/api/proxy/kpl-history', async (req, res, next) => {
  try {
    const { Day, a = 'DailyLimitPerformance', c = 'HisHomeDingPan', st = 1000 } = req.query;
    
    if (!Day) {
      return res.status(400).json({
        error: '缺少必要参数',
        message: 'Day参数是必需的'
      });
    }
    
    console.log(`转发历史数据请求，日期: ${Day} - 合并PidType 1-5`);
    
    // 目标API URL
    const targetUrl = 'https://apphis.longhuvip.com/w1/api/index.php';
    
    // 创建并行请求的Promise数组
    const requests = [];
    
    // 为每个PidType创建请求函数
    for (let pidType = 1; pidType <= 5; pidType++) {
      requests.push(
        (async (pid) => {
          console.log(`异步获取日期${Day}的PidType=${pid}数据`);
          try {
            const response = await axios.get(targetUrl, {
              params: { Day, PidType: pid, a, c, st },
              timeout: 10000 // 10秒超时
            });
            
            console.log(`日期${Day}的PidType=${pid}请求成功，状态码:`, response.status);
            
            // 处理响应数据
            if (response.data && response.data.info && Array.isArray(response.data.info)) {
              if (response.data.info.length >= 2 && Array.isArray(response.data.info[0])) {
                const stockDataArray = response.data.info[0];
                console.log(`日期${Day}的PidType=${pid}获取到嵌套结构数据，包含${stockDataArray.length}条股票记录`);
                return stockDataArray; // 返回股票数据数组
              }
            } else {
              console.log(`日期${Day}的PidType=${pid}未返回有效数据或格式不正确`);
            }
            return []; // 无有效数据时返回空数组
          } catch (pidError) {
            console.error(`获取日期${Day}的PidType=${pid}数据失败:`, pidError.message);
            return []; // 错误时返回空数组
          }
        })(pidType) // 使用IIFE立即执行函数来捕获当前的pidType值
      );
    }
    
    // 并行执行所有请求
    const results = await Promise.all(requests);
    
    // 合并所有结果
    const allData = results.flat(); // 将多个数组扁平化为一个
    
    console.log(`日期${Day}的所有PidType数据合并完成，总计${allData.length}条记录`);
    
    // 格式化数据
    const formattedData = formatStockData(allData);
    console.log(`日期${Day}的数据格式化完成，格式化后共${formattedData.length}条记录`);
    
    // 按照要求格式返回合并后的数据
    res.json({
      data: formattedData,
      date: Day,
      code: '200' // 成功状态码
    });
  } catch (error) {
    console.error('转发历史数据请求失败:', error.message);
    // 使用统一的错误响应格式
    res.status(500).json({
      info: [[], Day || new Date().toISOString().split('T')[0]], // 保持info字段结构
      ttag: Math.random() * 0.01,
      errcode: '1', // 错误状态码
      error: error.message || '获取历史龙虎榜数据失败'
    });
  }
});

/**
 * 转发到今日数据API - 获取所有PidType(1-5)的数据并合并
 * GET /api/proxy/kpl-today
 */
app.get('/api/proxy/kpl-today', async (req, res, next) => {
  try {
    const { a = 'DailyLimitPerformance', c = 'HomeDingPan', st = 1000 } = req.query;
    
    console.log('转发今日数据请求 - 合并PidType 1-5');
    
    // 目标API URL
    const targetUrl = 'https://apphwshhq.longhuvip.com/w1/api/index.php';
    
    // 创建并行请求的Promise数组
    const requests = [];
    
    // 为每个PidType创建请求函数
    for (let pidType = 1; pidType <= 5; pidType++) {
      requests.push(
        (async (pid) => {
          console.log(`异步获取PidType=${pid}的数据`);
          try {
            const response = await axios.get(targetUrl, {
              params: { PidType: pid, a, c, st },
              timeout: 10000 // 10秒超时
            });
            
            console.log(`PidType=${pid}请求成功，状态码:`, response.status);
            
            // 处理响应数据
            if (response.data && response.data.info && Array.isArray(response.data.info)) {
              if (response.data.info.length >= 1 && Array.isArray(response.data.info[0])) {
                const stockDataArray = response.data.info[0];
                console.log(`PidType=${pid}获取到嵌套结构数据，包含${stockDataArray.length}条股票记录`);
                return stockDataArray; // 返回股票数据数组
              }
            } else {
              console.log(`PidType=${pid}未返回有效数据或格式不正确`);
            }
            return []; // 无有效数据时返回空数组
          } catch (pidError) {
            console.error(`获取PidType=${pid}数据失败:`, pidError.message);
            return []; // 错误时返回空数组
          }
        })(pidType) // 使用IIFE立即执行函数来捕获当前的pidType值
      );
    }
    
    // 并行执行所有请求
    const results = await Promise.all(requests);
    
    // 合并所有结果
    const allData = results.flat(); // 将多个数组扁平化为一个
    
    console.log(`所有PidType数据合并完成，总计${allData.length}条记录`);
    
    // 格式化数据
    const formattedData = formatStockData(allData);
    console.log(`今日数据格式化完成，格式化后共${formattedData.length}条记录`);
    
    // 按照要求格式返回合并后的数据
    res.json({
      data: formattedData,
      date: new Date().toISOString().split('T')[0],
      code: '200' // 成功状态码
    });
  } catch (error) {
    console.error('转发今日数据请求失败:', error.message);
    // 使用统一的错误响应格式
    res.status(500).json({
      data: [],
      date: new Date().toISOString().split('T')[0],
      ttag: Math.random() * 0.01,
      code: '400', // 错误状态码
      error: error.message || '获取今日数据失败'
    });
  }
});

/**
 * 健康检查端点
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`后端转发服务已启动，监听端口 ${PORT}`);
  console.log(`历史数据API: http://localhost:${PORT}/api/proxy/history?Day=YYYY-MM-DD`);
  console.log(`今日数据API: http://localhost:${PORT}/api/proxy/today`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
});